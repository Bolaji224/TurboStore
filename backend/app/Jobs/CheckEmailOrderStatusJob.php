<?php

namespace App\Jobs;

use App\Models\Order;
use App\Services\EmailOrderService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class CheckEmailOrderStatusJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries   = 1;
    public int $timeout = 20;

    public function __construct(public int $orderId) {}

    public function handle(EmailOrderService $service): void
    {
        $order = Order::find($this->orderId);

        if (!$order || $order->isTerminal()) {
            return;
        }

        // Auto-expire after TTL
        if ($order->expires_at && $order->expires_at->isPast()) {
            Log::info('[CheckEmailOrderStatusJob] Email order expired', ['reference' => $order->reference]);
            $service->cancel($order);
            $order->fresh()->update(['status' => 'expired']);
            return;
        }

        $order = $service->syncStatus($order);

        if ($order->isTerminal()) {
            return;
        }

        // Poll every 5 seconds until OTP arrives or order expires
        self::dispatch($this->orderId)->delay(now()->addSeconds(5));
    }
}
