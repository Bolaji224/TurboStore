<?php

namespace App\Services;

use App\Jobs\CheckEmailOrderStatusJob;
use App\Models\Order;
use App\Models\Setting;
use App\Models\User;
use App\Services\Providers\OneSecMailProvider;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class EmailOrderService
{
    public function __construct(
        private OneSecMailProvider $mailProvider,
        private WalletService      $walletService,
        private NotificationService $notificationService,
    ) {}

    /**
     * Place an email OTP order:
     * 1. Idempotency check
     * 2. Verify wallet balance
     * 3. Generate a disposable email via 1secmail
     * 4. Deduct wallet + create order in a DB transaction
     * 5. Dispatch polling job
     */
    public function placeOrder(
        User   $user,
        string $service,
        string $serviceName,
        string $idempotencyKey,
    ): Order {
        $existing = Order::where('idempotency_key', $idempotencyKey)->first();
        if ($existing) {
            return $existing;
        }

        $priceKobo = $this->getPrice();

        if ($this->walletService->getBalance($user) < $priceKobo) {
            throw new \RuntimeException('Insufficient wallet balance. Please top up your wallet.');
        }

        // Generate the email address before the DB transaction
        $emailData = $this->mailProvider->generateEmail();

        $order = DB::transaction(function () use (
            $user, $service, $serviceName, $idempotencyKey, $priceKobo, $emailData
        ) {
            $this->walletService->deduct(
                $user,
                $priceKobo,
                "Email OTP — {$serviceName}",
            );

            return Order::create([
                'order_type'      => 'email',
                'reference'       => Order::generateReference(),
                'user_id'         => $user->id,
                'provider'        => '1secmail',
                'country'         => 'any',
                'service'         => $service,
                'service_name'    => $serviceName,
                'email_address'   => $emailData['email'],
                'customer_price'  => $priceKobo,
                'provider_cost'   => 0,
                'status'          => 'waiting_for_otp',
                'idempotency_key' => $idempotencyKey,
                'expires_at'      => now()->addMinutes(15),
            ]);
        });

        CheckEmailOrderStatusJob::dispatch($order->id)->delay(now()->addSeconds(5));

        Log::info('[EmailOrderService] Order placed', [
            'reference' => $order->reference,
            'email'     => $emailData['email'],
            'service'   => $service,
        ]);

        return $order->fresh();
    }

    /**
     * Poll 1secmail inbox and update the order if an OTP is found.
     */
    public function syncStatus(Order $order): Order
    {
        if ($order->isTerminal() || $order->otp) {
            return $order;
        }

        try {
            [$login, $domain] = explode('@', $order->email_address, 2);

            $otp = $this->mailProvider->extractOtp($login, $domain);

            if ($otp) {
                $order->update([
                    'otp'    => $otp,
                    'status' => 'otp_received',
                ]);

                try {
                    $this->notificationService->otpReceived($order->fresh());
                } catch (\Throwable) {}

                Log::info('[EmailOrderService] OTP received', [
                    'reference' => $order->reference,
                    'otp'       => $otp,
                ]);
            }
        } catch (\Throwable $e) {
            Log::warning('[EmailOrderService] syncStatus error', [
                'reference' => $order->reference,
                'error'     => $e->getMessage(),
            ]);
        }

        return $order->fresh();
    }

    /** Cancel an active email order and refund the customer. */
    public function cancel(Order $order): Order
    {
        if ($order->isTerminal()) {
            return $order;
        }

        $order->update([
            'status'       => 'cancelled',
            'cancelled_at' => now(),
        ]);

        $this->walletService->refundOrder($order->user, $order);
        $order->update(['refunded_at' => now(), 'status' => 'refunded']);

        return $order->fresh();
    }

    /** Price in kobo — admin-configurable via settings, defaults to ₦200. */
    public function getPrice(): int
    {
        $setting = Setting::get('email_otp_price_naira');
        if ($setting !== null && (int) $setting > 0) {
            return (int) $setting * 100;
        }

        return (int) config('sms.email_otp_price_kobo', 20000); // ₦200 default
    }
}
