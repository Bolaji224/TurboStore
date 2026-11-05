<?php

namespace App\Services;

use App\Exceptions\Provider\ProviderException;
use App\Exceptions\Provider\ProviderOutOfStockException;
use App\Jobs\CheckOrderStatusJob;
use App\Models\Order;
use App\Models\ReferralReward;
use App\Services\NotificationService;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class OrderService
{
    public function __construct(
        private ProviderManager      $providerManager,
        private WalletService        $walletService,
        private PricingService       $pricingService,
        private ReferralService      $referralService,
        private NotificationService  $notificationService,
    ) {}

    /**
     * Place a new order:
     * 1. Check idempotency — return existing order if same key
     * 2. Verify wallet balance
     * 3. DB transaction: deduct wallet + create order record
     * 4. Call provider API (outside transaction to avoid long lock)
     * 5. On success: update order with phone + status
     * 6. On failure: reverse wallet deduction + mark order failed
     */
    public function placeOrder(
        User   $user,
        string $country,
        string $service,
        string $serviceName,
        string $idempotencyKey,
    ): Order {
        // Idempotency check
        $existing = Order::where('idempotency_key', $idempotencyKey)->first();
        if ($existing) {
            return $existing;
        }

        // Priority-ordered list of providers that currently have stock for this service.
        // First entry is tried first; on ProviderException we fall through to the next.
        $candidates  = $this->providerManager->priorityList($country, $service);
        $primary     = $candidates[0];
        $availability = $primary['availability'];

        $customerPrice = $availability->customerPrice;

        // Pre-check balance (fast fail before acquiring any locks)
        if ($this->walletService->getBalance($user) < $customerPrice) {
            throw new \RuntimeException('Insufficient wallet balance. Please top up your wallet.');
        }

        // DB transaction: atomically deduct wallet and create the order record.
        // Provider is set to the primary candidate; updated below if we fall back.
        $order = DB::transaction(function () use (
            $user, $primary, $country, $service, $serviceName,
            $customerPrice, $availability, $idempotencyKey
        ) {
            $this->walletService->deduct(
                $user,
                $customerPrice,
                "Number Purchase — {$serviceName} ({$country})",
            );

            return Order::create([
                'reference'       => Order::generateReference(),
                'user_id'         => $user->id,
                'provider'        => $primary['name'],
                'country'         => $country,
                'service'         => $service,
                'service_name'    => $serviceName,
                'customer_price'  => $customerPrice,
                'provider_cost'   => $availability->providerPrice,
                'status'          => 'processing',
                'idempotency_key' => $idempotencyKey,
                'expires_at'      => now()->addMinutes(config('sms.order.ttl_minutes', 20)),
            ]);
        });

        // Try each provider in priority order. On ProviderException, fall through to the next.
        // Call outside the DB transaction to avoid holding row locks during slow API calls.
        $lastException = null;

        foreach ($candidates as $candidate) {
            try {
                $purchased = $candidate['driver']->buyNumber($country, $service);

                $order->update([
                    'provider'          => $candidate['name'],
                    'provider_order_id' => $purchased->providerOrderId,
                    'phone_number'      => $purchased->phoneNumber,
                    'provider_cost'     => $purchased->providerCost ?: $order->provider_cost,
                    'status'            => 'waiting_for_otp',
                ]);

                $delay = config('sms.order.poll_interval', 30);
                CheckOrderStatusJob::dispatch($order->id)->delay(now()->addSeconds($delay));

                Log::info('[OrderService] Order placed', [
                    'reference'         => $order->reference,
                    'provider'          => $candidate['name'],
                    'provider_order_id' => $purchased->providerOrderId,
                    'phone'             => $purchased->phoneNumber,
                    'fallback'          => $candidate['name'] !== $primary['name'],
                ]);

                return $order->fresh();

            } catch (ProviderException $e) {
                $lastException = $e;
                Log::warning('[OrderService] Provider failed, trying next', [
                    'reference' => $order->reference,
                    'provider'  => $candidate['name'],
                    'error'     => $e->getMessage(),
                ]);
            }
        }

        // All providers failed — reverse the wallet deduction
        $order->update(['status' => 'failed']);
        $this->walletService->refundOrder($user, $order);

        Log::error('[OrderService] All providers failed — wallet reversed', [
            'reference' => $order->reference,
            'error'     => $lastException?->getMessage(),
        ]);

        throw $lastException ?? new ProviderOutOfStockException('All providers failed', 'auto');
    }

    /** Poll the provider for the latest order status and update the DB. */
    public function syncStatus(Order $order): Order
    {
        if ($order->isTerminal()) {
            return $order;
        }

        try {
            $statusData = $this->providerManager
                ->provider($order->provider)
                ->getOrderStatus($order->provider_order_id);

            Log::info('[OrderService] syncStatus poll', [
                'reference'  => $order->reference,
                'provider'   => $order->provider,
                'raw_status' => $statusData->rawStatus,
                'normalized' => $statusData->status,
                'otp'        => $statusData->otp,
            ]);

            // Only promote to otp_received when we actually have the code.
            // Some providers (5SIM) flip status to RECEIVED before populating sms[],
            // so keep showing waiting_for_otp until the code is extracted.
            $resolvedStatus = $statusData->status;
            if ($statusData->status === 'otp_received' && !$statusData->otp) {
                $resolvedStatus = $order->status; // stay on current status until code arrives
            }

            $updates = ['status' => $resolvedStatus];

            if ($statusData->otp && !$order->otp) {
                $updates['otp']    = $statusData->otp;
                $updates['status'] = 'otp_received'; // code confirmed — now promote
            }

            $order->update($updates);
            $order->refresh();

            // Auto-refund when provider reports the order expired/cancelled
            if (in_array($order->status, ['expired', 'cancelled']) && !$order->refunded_at) {
                try {
                    $this->walletService->refundOrder($order->user, $order);
                    $order->update(['refunded_at' => now()]);
                    $order->refresh();
                } catch (\Throwable $e) {
                    Log::warning('[OrderService] Auto-refund failed', [
                        'reference' => $order->reference,
                        'error'     => $e->getMessage(),
                    ]);
                }
            }

            // Record eligible purchase and notify when OTP is confirmed
            if ($order->status === 'otp_received') {
                try {
                    $this->referralService->recordEligiblePurchase($order);
                } catch (\Throwable $e) {
                    Log::warning('[OrderService] recordEligiblePurchase failed', [
                        'reference' => $order->reference,
                        'error'     => $e->getMessage(),
                    ]);
                }

                try {
                    $this->notificationService->otpReceived($order);
                } catch (\Throwable) {}
            }
        } catch (\Throwable $e) {
            Log::warning('[OrderService] syncStatus failed', [
                'reference' => $order->reference,
                'error'     => $e->getMessage(),
            ]);
        }

        return $order->fresh();
    }

    /**
     * Place an order using a referral reward (free — ₦0 to the customer).
     * Provider cost is recorded as a business expense; no wallet deduction.
     */
    public function placeRewardOrder(
        User   $user,
        int    $rewardId,
        string $country,
        string $service,
        string $serviceName,
        string $idempotencyKey,
    ): Order {
        // Idempotency check
        $existing = Order::where('idempotency_key', $idempotencyKey)->first();
        if ($existing) {
            return $existing;
        }

        // Reserve the reward (validates ownership + availability, throws on failure)
        $reward = $this->referralService->reserveReward($rewardId, $user);

        [
            'driver' => $providerDriver,
            'name'   => $providerName,
        ] = $this->providerManager->autoSelect($country, $service);

        try {
            $purchased = $providerDriver->buyNumber($country, $service);
        } catch (ProviderException $e) {
            $this->referralService->releaseReward($reward);

            Log::error('[OrderService] Reward order — provider failed, reward released', [
                'reward_id' => $reward->id,
                'error'     => $e->getMessage(),
            ]);

            throw $e;
        }

        // Create the order at ₦0 and mark the reward redeemed
        $order = Order::create([
            'reference'         => Order::generateReference(),
            'user_id'           => $user->id,
            'provider'          => $providerName,
            'country'           => $country,
            'service'           => $service,
            'service_name'      => $serviceName,
            'phone_number'      => $purchased->phoneNumber,
            'customer_price'    => 0,
            'provider_cost'     => $purchased->providerCost,
            'provider_order_id' => $purchased->providerOrderId,
            'status'            => 'waiting_for_otp',
            'idempotency_key'   => $idempotencyKey,
            'reward_id'         => $reward->id,
            'expires_at'        => now()->addMinutes(config('sms.order.ttl_minutes', 20)),
        ]);

        $this->referralService->markRewardRedeemed($reward, $order);

        $delay = config('sms.order.poll_interval', 30);
        CheckOrderStatusJob::dispatch($order->id)->delay(now()->addSeconds($delay));

        Log::info('[OrderService] Reward order placed', [
            'reference'  => $order->reference,
            'reward_id'  => $reward->id,
            'phone'      => $purchased->phoneNumber,
        ]);

        return $order->fresh();
    }

    /** Cancel an active order and refund the customer. */
    public function cancel(Order $order): Order
    {
        if ($order->isTerminal()) {
            return $order;
        }

        // Try to cancel with provider (best-effort)
        if ($order->provider_order_id) {
            try {
                $this->providerManager->provider($order->provider)->cancelOrder($order->provider_order_id);
            } catch (\Throwable) {
                // Provider cancel is best-effort; we still refund the customer
            }
        }

        $order->update([
            'status'       => 'cancelled',
            'cancelled_at' => now(),
        ]);

        // Refund
        $this->walletService->refundOrder($order->user, $order);

        $order->update(['refunded_at' => now(), 'status' => 'refunded']);

        try {
            $this->notificationService->orderCancelled($order->fresh());
        } catch (\Throwable) {}

        return $order->fresh();
    }
}
