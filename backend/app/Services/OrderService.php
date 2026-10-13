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
        string $provider,
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

        $providerDriver = $this->providerManager->provider($provider);

        // Get price — also confirms availability
        $availability = $providerDriver->getAvailability($country, $service);

        if (!$availability->available) {
            throw new ProviderOutOfStockException(
                'No numbers are currently available for this service and country. Please try another option.',
                $provider,
            );
        }

        $customerPrice = $availability->customerPrice;

        // Pre-check balance (fast fail before acquiring any locks)
        if ($this->walletService->getBalance($user) < $customerPrice) {
            throw new \RuntimeException('Insufficient wallet balance. Please top up your wallet.');
        }

        // DB transaction: atomically deduct wallet and create the order record
        $order = DB::transaction(function () use (
            $user, $provider, $country, $service, $serviceName,
            $customerPrice, $availability, $idempotencyKey
        ) {
            // Deduct wallet (re-checks balance with lock inside)
            $this->walletService->deduct(
                $user,
                $customerPrice,
                "Number Purchase — {$serviceName} ({$country})",
            );

            return Order::create([
                'reference'       => Order::generateReference(),
                'user_id'         => $user->id,
                'provider'        => $provider,
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

        // Call provider OUTSIDE the DB transaction to avoid holding locks
        try {
            $purchased = $providerDriver->buyNumber($country, $service);

            $order->update([
                'provider_order_id' => $purchased->providerOrderId,
                'phone_number'      => $purchased->phoneNumber,
                'provider_cost'     => $purchased->providerCost ?: $order->provider_cost,
                'status'            => 'waiting_for_otp',
            ]);

            // Schedule OTP polling
            $delay = config('sms.order.poll_interval', 30);
            CheckOrderStatusJob::dispatch($order->id)->delay(now()->addSeconds($delay));

            Log::info('[OrderService] Order placed', [
                'reference'          => $order->reference,
                'provider'           => $provider,
                'provider_order_id'  => $purchased->providerOrderId,
                'phone'              => $purchased->phoneNumber,
            ]);
        } catch (ProviderException $e) {
            // Reverse: refund + mark failed
            $order->update(['status' => 'failed']);
            $this->walletService->refundOrder($user, $order);

            Log::error('[OrderService] Provider purchase failed — wallet reversed', [
                'reference' => $order->reference,
                'provider'  => $provider,
                'error'     => $e->getMessage(),
            ]);

            throw $e; // Re-throw so controller can return a clean response
        }

        return $order->fresh();
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

            $updates = ['status' => $statusData->status];

            if ($statusData->otp && !$order->otp) {
                $updates['otp'] = $statusData->otp;
            }

            if ($statusData->status === 'otp_received' && !$order->otp) {
                $updates['status'] = 'otp_received';
            }

            $order->update($updates);
            $order->refresh();

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
        string $provider,
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

        $providerDriver = $this->providerManager->provider($provider);

        try {
            $purchased = $providerDriver->buyNumber($country, $service);
        } catch (ProviderException $e) {
            // Release the reward so the user can try again
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
            'provider'          => $provider,
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
