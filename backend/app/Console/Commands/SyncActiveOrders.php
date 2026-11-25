<?php

namespace App\Console\Commands;

use App\Models\Order;
use App\Services\OrderService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class SyncActiveOrders extends Command
{
    protected $signature   = 'orders:sync-active';
    protected $description = 'Poll providers for the latest status on all non-terminal orders';

    public function handle(OrderService $orderService): int
    {
        $orders = Order::whereNotIn('status', ['completed', 'expired', 'cancelled', 'failed', 'refunded'])
            ->whereNotNull('provider_order_id')
            ->get();

        if ($orders->isEmpty()) {
            $this->info('No active orders to sync.');
            return 0;
        }

        $this->info("Syncing {$orders->count()} active order(s)...");

        foreach ($orders as $order) {
            if ($order->expires_at && $order->expires_at->isPast()) {
                $orderService->cancel($order);
                $order->fresh()->update([
                    'status'         => 'expired',
                    'failure_reason' => 'No OTP was received within the time limit',
                ]);
                $this->line("  [{$order->reference}] → expired");
                Log::info('[SyncActiveOrders] expired', ['reference' => $order->reference]);
                continue;
            }

            $updated = $orderService->syncStatus($order);
            $this->line("  [{$order->reference}] → {$updated->status}" . ($updated->otp ? "  OTP: {$updated->otp}" : ''));
        }

        return 0;
    }
}
