<?php

namespace App\Jobs;

use App\Models\Order;
use App\Services\OrderService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class CheckOrderStatusJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries   = 1;  // Each dispatch is independent
    public int $timeout = 30;

    public function __construct(public int $orderId) {}

    public function handle(OrderService $orderService): void
    {
        $order = Order::find($this->orderId);

        if (!$order || $order->isTerminal()) {
            return;
        }

        // Auto-expire overdue orders
        if ($order->expires_at && $order->expires_at->isPast()) {
            Log::info('[CheckOrderStatusJob] Order expired', ['reference' => $order->reference]);
            $order->update(['status' => 'expired']);
            $orderService->cancel($order->fresh());
            return;
        }

        $order = $orderService->syncStatus($order);

        if ($order->isTerminal()) {
            Log::info('[CheckOrderStatusJob] Order reached terminal status', [
                'reference' => $order->reference,
                'status'    => $order->status,
            ]);
            return;
        }

        // Schedule next poll
        $interval = config('sms.order.poll_interval', 30);
        self::dispatch($this->orderId)->delay(now()->addSeconds($interval));
    }
}
