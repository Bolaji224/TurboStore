<?php

namespace App\Services;

use App\Models\MarketplaceOrder;
use App\Models\Notification;
use App\Models\Order;
use App\Models\ReferralRelationship;
use App\Models\User;

class NotificationService
{
    public function otpReceived(Order $order): void
    {
        Notification::create([
            'user_id' => $order->user_id,
            'type'    => 'otp_received',
            'title'   => 'OTP Received',
            'body'    => "Your verification code for {$order->service_name} is ready.",
            'data'    => ['reference' => $order->reference, 'otp' => $order->otp],
        ]);
    }

    public function walletFunded(User $user, int $amountKobo): void
    {
        $naira = number_format($amountKobo / 100, 0);

        Notification::create([
            'user_id' => $user->id,
            'type'    => 'wallet_funded',
            'title'   => 'Wallet Funded',
            'body'    => "₦{$naira} was successfully added to your wallet.",
            'data'    => ['amount_kobo' => $amountKobo],
        ]);
    }

    public function referralReward(User $referrer, int $milestone, ReferralRelationship $referral): void
    {
        $maskedEmail = $referral->referredMaskedEmail();

        Notification::create([
            'user_id' => $referrer->id,
            'type'    => 'referral_reward',
            'title'   => 'Referral Reward Earned! 🎁',
            'body'    => "{$maskedEmail} just completed {$milestone} purchases. You've earned a free virtual number!",
            'data'    => ['milestone' => $milestone, 'referral_id' => $referral->id],
        ]);
    }

    public function orderCancelled(Order $order): void
    {
        Notification::create([
            'user_id' => $order->user_id,
            'type'    => 'order_cancelled',
            'title'   => 'Order Cancelled',
            'body'    => "Your {$order->service_name} order has been cancelled and your wallet refunded.",
            'data'    => ['reference' => $order->reference],
        ]);
    }

    public function marketplaceOrderPlaced(MarketplaceOrder $order): void
    {
        $price       = '₦' . number_format($order->price_kobo / 100, 0);
        $serviceName = $order->service->title ?? 'Unknown';
        $buyerName   = $order->user->name ?? 'A buyer';

        $adminIds = User::whereNotNull('admin_role')->pluck('id');

        foreach ($adminIds as $adminId) {
            Notification::create([
                'user_id' => $adminId,
                'type'    => 'marketplace_order',
                'title'   => 'New Marketplace Order',
                'body'    => "{$buyerName} ordered \"{$serviceName}\" for {$price}.",
                'data'    => [
                    'reference'    => $order->reference,
                    'service_name' => $serviceName,
                    'price_kobo'   => $order->price_kobo,
                ],
            ]);
        }
    }

    /** Unread count for the navbar badge. */
    public function unreadCount(User $user): int
    {
        return Notification::where('user_id', $user->id)
            ->whereNull('read_at')
            ->count();
    }
}
