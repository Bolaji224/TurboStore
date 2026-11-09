<?php

namespace App\Console\Commands;

use App\Models\MarketplaceOrder;
use App\Models\MarketplaceOrderEvent;
use App\Models\Vendor;
use App\Models\VendorEarning;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class AutoCompleteMarketplaceOrders extends Command
{
    protected $signature   = 'marketplace:auto-complete';
    protected $description = 'Auto-complete delivered marketplace orders once auto_complete_at has passed';

    public function handle(): void
    {
        $orders = MarketplaceOrder::where('status', 'delivered')
            ->where('auto_complete_at', '<=', now())
            ->get();

        $this->info("Found {$orders->count()} order(s) to auto-complete.");

        foreach ($orders as $order) {
            try {
                DB::transaction(function () use ($order) {
                    $order->update(['status' => 'completed', 'completed_at' => now()]);

                    $earning = VendorEarning::where('marketplace_order_id', $order->id)->first();
                    if ($earning && $earning->status === 'pending') {
                        $earning->update(['status' => 'available']);
                    }

                    $vendor = Vendor::lockForUpdate()->find($order->vendor_id);
                    if ($vendor) {
                        $vendor->increment('total_earnings_kobo', $order->vendor_earning_kobo);
                        $vendor->increment('total_orders');
                    }

                    MarketplaceOrderEvent::create([
                        'marketplace_order_id' => $order->id,
                        'actor_id'             => $order->user_id,
                        'event'                => 'completed',
                        'note'                 => 'Auto-completed after 72 hours — no buyer action required',
                    ]);
                });

                $this->info("Auto-completed order {$order->reference}");
            } catch (\Throwable $e) {
                $this->error("Failed {$order->reference}: {$e->getMessage()}");
            }
        }
    }
}
