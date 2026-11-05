<?php

namespace App\Services;

use App\Models\MarketplaceDispute;
use App\Models\MarketplaceOrder;
use App\Models\MarketplaceOrderEvent;
use App\Models\MarketplaceService;
use App\Models\SupplierLedgerEntry;
use App\Models\User;
use App\Models\Vendor;
use App\Models\VendorEarning;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class MarketplaceOrderService
{
    public function __construct(
        private WalletService    $walletService,
        private CommissionService $commissionService,
    ) {}

    /**
     * Create a new marketplace order, deducting funds from the buyer's wallet.
     * Commission and supplier earning amounts are computed server-side and snapshotted
     * on the order row — they are immutable after creation.
     */
    public function createOrder(
        User $user,
        MarketplaceService $service,
        string $requirements,
        ?string $idempotencyKey
    ): MarketplaceOrder {
        // Idempotency check — return existing order without side effects.
        if ($idempotencyKey) {
            $existing = MarketplaceOrder::where('idempotency_key', $idempotencyKey)
                ->where('user_id', $user->id)
                ->first();
            if ($existing) {
                return $existing;
            }
        }

        $vendor = $service->vendor;

        if ($vendor->user_id === $user->id) {
            throw new \InvalidArgumentException('You cannot order your own service.');
        }

        if ($service->status !== 'approved') {
            throw new \InvalidArgumentException('This service is not available.');
        }

        if ($vendor->status !== 'approved') {
            throw new \InvalidArgumentException('The vendor is not available.');
        }

        return DB::transaction(function () use ($user, $service, $vendor, $requirements, $idempotencyKey) {
            $lockedUser = User::lockForUpdate()->find($user->id);

            $price = (int) $service->starting_price_kobo;

            if ((int) $lockedUser->wallet_balance < $price) {
                throw new \RuntimeException('Insufficient wallet balance.');
            }

            // Server-side commission calculation — never trust client-submitted amounts.
            $calc = $this->commissionService->calculate($price, (int) $vendor->commission_rate);

            $reference = MarketplaceOrder::generateReference();

            $order = MarketplaceOrder::create([
                'reference'             => $reference,
                'user_id'               => $lockedUser->id,
                'vendor_id'             => $vendor->id,
                'service_id'            => $service->id,
                'price_kobo'            => $calc['price_kobo'],
                'commission_rate'       => $calc['commission_rate'],
                'commission_kobo'       => $calc['commission_kobo'],
                'vendor_earning_kobo'   => $calc['vendor_earning_kobo'],
                'status'                => 'paid',
                'requirements_provided' => $requirements,
                'idempotency_key'       => $idempotencyKey,
                'paid_at'               => now(),
                'auto_complete_at'      => now()->addHours(72),
            ]);

            $this->walletService->deduct(
                $lockedUser,
                $price,
                'Marketplace order: ' . $service->title,
                null
            );

            MarketplaceOrderEvent::create([
                'marketplace_order_id' => $order->id,
                'actor_id'             => $lockedUser->id,
                'event'                => 'created',
                'note'                 => 'Order placed and payment deducted',
            ]);

            MarketplaceOrderEvent::create([
                'marketplace_order_id' => $order->id,
                'actor_id'             => $lockedUser->id,
                'event'                => 'paid',
                'note'                 => 'Wallet debited',
            ]);

            // Pending vendor earning — not withdrawable until buyer confirms (or 72 h passes).
            $earning = VendorEarning::create([
                'vendor_id'            => $vendor->id,
                'marketplace_order_id' => $order->id,
                'amount_kobo'          => $calc['vendor_earning_kobo'],
                'type'                 => 'order',
                'status'               => 'pending',
                'available_at'         => now()->addHours(72),
            ]);

            // Ledger — earning credited (pending).
            SupplierLedgerEntry::create([
                'vendor_id'          => $vendor->id,
                'idempotency_key'    => 'earning_order_' . $order->id,
                'entry_type'         => 'earning_credited',
                'amount_kobo'        => $calc['vendor_earning_kobo'],
                'description'        => "Earning from order {$reference} (pending confirmation)",
                'related_model_type' => MarketplaceOrder::class,
                'related_model_id'   => $order->id,
                'metadata'           => [
                    'commission_rate'   => $calc['commission_rate'],
                    'commission_kobo'   => $calc['commission_kobo'],
                    'gross_price_kobo'  => $calc['price_kobo'],
                ],
            ]);

            return $order;
        });
    }

    /**
     * Vendor marks order as in progress.
     */
    public function markInProgress(MarketplaceOrder $order, User $vendorUser, string $note = ''): void
    {
        if ($order->status !== 'paid') {
            throw new \InvalidArgumentException('Order cannot be marked as in progress (current status: ' . $order->status . ').');
        }

        $vendor = $vendorUser->vendor;
        if (!$vendor || $vendor->id !== $order->vendor_id) {
            throw new \InvalidArgumentException('You do not own this order.');
        }

        DB::transaction(function () use ($order, $vendorUser, $note) {
            $order->update(['status' => 'in_progress']);

            MarketplaceOrderEvent::create([
                'marketplace_order_id' => $order->id,
                'actor_id'             => $vendorUser->id,
                'event'                => 'in_progress',
                'note'                 => $note ?: 'Vendor started working on the order',
            ]);
        });
    }

    /**
     * Vendor delivers the order.
     */
    public function markDelivered(
        MarketplaceOrder $order,
        User $vendorUser,
        string $deliveryNotes,
        ?string $deliveryProof
    ): void {
        if ($order->status !== 'in_progress') {
            throw new \InvalidArgumentException('Order cannot be delivered (current status: ' . $order->status . ').');
        }

        $vendor = $vendorUser->vendor;
        if (!$vendor || $vendor->id !== $order->vendor_id) {
            throw new \InvalidArgumentException('You do not own this order.');
        }

        DB::transaction(function () use ($order, $vendorUser, $deliveryNotes, $deliveryProof) {
            $order->update([
                'status'       => 'delivered',
                'delivered_at' => now(),
            ]);

            MarketplaceOrderEvent::create([
                'marketplace_order_id' => $order->id,
                'actor_id'             => $vendorUser->id,
                'event'                => 'delivered',
                'note'                 => $deliveryNotes,
                'metadata'             => $deliveryProof ? ['delivery_proof' => $deliveryProof] : null,
            ]);
        });
    }

    /**
     * Buyer confirms order completion, releasing vendor earning to available.
     */
    public function confirmCompletion(MarketplaceOrder $order, User $buyer): void
    {
        if ($order->user_id !== $buyer->id) {
            throw new \InvalidArgumentException('You do not own this order.');
        }

        if ($order->status !== 'delivered') {
            throw new \InvalidArgumentException('Order cannot be confirmed (current status: ' . $order->status . ').');
        }

        DB::transaction(function () use ($order, $buyer) {
            $order->update([
                'status'       => 'completed',
                'completed_at' => now(),
            ]);

            $earning = VendorEarning::where('marketplace_order_id', $order->id)->first();
            if ($earning) {
                $earning->update(['status' => 'available']);
            }

            $vendor = Vendor::lockForUpdate()->find($order->vendor_id);
            $vendor->increment('total_earnings_kobo', $order->vendor_earning_kobo);
            $vendor->increment('total_orders');

            MarketplaceOrderEvent::create([
                'marketplace_order_id' => $order->id,
                'actor_id'             => $buyer->id,
                'event'                => 'completed',
                'note'                 => 'Buyer confirmed order completion',
            ]);
        });
    }

    /**
     * Cancel an order, refunding the buyer and reversing the vendor earning.
     */
    public function cancelOrder(MarketplaceOrder $order, User $actor, string $reason): void
    {
        $cancellableStatuses = ['pending', 'paid', 'in_progress'];

        if (!in_array($order->status, $cancellableStatuses, true)) {
            throw new \InvalidArgumentException('Order cannot be cancelled (current status: ' . $order->status . ').');
        }

        DB::transaction(function () use ($order, $actor, $reason) {
            $wasCharged = in_array($order->status, ['paid', 'in_progress'], true);

            $order->update([
                'status'       => 'cancelled',
                'cancelled_at' => now(),
            ]);

            if ($wasCharged) {
                $buyer = User::find($order->user_id);
                $this->walletService->credit(
                    $buyer,
                    $order->price_kobo,
                    'refund',
                    'Marketplace order cancelled: refund',
                    null
                );
            }

            $earning = VendorEarning::where('marketplace_order_id', $order->id)->first();
            if ($earning && $earning->status === 'pending') {
                $earning->update(['status' => 'reversed']);

                // Ledger reversal entry.
                SupplierLedgerEntry::firstOrCreate(
                    ['idempotency_key' => 'earning_reversed_order_' . $order->id],
                    [
                        'vendor_id'          => $order->vendor_id,
                        'entry_type'         => 'earning_reversed',
                        'amount_kobo'        => -$earning->amount_kobo,
                        'description'        => "Earning reversed — order {$order->reference} cancelled",
                        'related_model_type' => MarketplaceOrder::class,
                        'related_model_id'   => $order->id,
                    ]
                );
            }

            MarketplaceOrderEvent::create([
                'marketplace_order_id' => $order->id,
                'actor_id'             => $actor->id,
                'event'                => 'cancelled',
                'note'                 => $reason,
            ]);
        });
    }

    /**
     * Buyer opens a dispute on a delivered or in-progress order.
     */
    public function openDispute(
        MarketplaceOrder $order,
        User $buyer,
        string $reason,
        string $description
    ): MarketplaceDispute {
        if ($order->user_id !== $buyer->id) {
            throw new \InvalidArgumentException('You do not own this order.');
        }

        if (!in_array($order->status, ['delivered', 'in_progress'], true)) {
            throw new \InvalidArgumentException('A dispute can only be opened on in-progress or delivered orders.');
        }

        $existingDispute = MarketplaceDispute::where('marketplace_order_id', $order->id)->first();
        if ($existingDispute) {
            throw new \InvalidArgumentException('A dispute already exists for this order.');
        }

        return DB::transaction(function () use ($order, $buyer, $reason, $description) {
            $order->update([
                'status'      => 'disputed',
                'disputed_at' => now(),
            ]);

            $dispute = MarketplaceDispute::create([
                'marketplace_order_id' => $order->id,
                'user_id'              => $buyer->id,
                'vendor_id'            => $order->vendor_id,
                'reason'               => $reason,
                'description'          => $description,
                'status'               => 'open',
            ]);

            MarketplaceOrderEvent::create([
                'marketplace_order_id' => $order->id,
                'actor_id'             => $buyer->id,
                'event'                => 'disputed',
                'note'                 => $reason,
            ]);

            return $dispute;
        });
    }

    /**
     * Admin resolves a dispute with either a refund or a no-refund ruling.
     */
    public function resolveDispute(
        MarketplaceDispute $dispute,
        User $admin,
        string $resolution,
        string $note
    ): void {
        $order = $dispute->marketplaceOrder;

        DB::transaction(function () use ($dispute, $admin, $resolution, $note, $order) {
            if ($resolution === 'refund') {
                $buyer = User::find($order->user_id);
                $this->walletService->credit(
                    $buyer,
                    $order->price_kobo,
                    'refund',
                    'Marketplace dispute resolved: refund issued',
                    null
                );

                $earning = VendorEarning::where('marketplace_order_id', $order->id)->first();
                if ($earning && in_array($earning->status, ['pending', 'available'], true)) {
                    $earning->update(['status' => 'reversed']);

                    SupplierLedgerEntry::firstOrCreate(
                        ['idempotency_key' => 'earning_reversed_dispute_' . $order->id],
                        [
                            'vendor_id'          => $order->vendor_id,
                            'entry_type'         => 'earning_reversed',
                            'amount_kobo'        => -$earning->amount_kobo,
                            'description'        => "Earning reversed — dispute {$dispute->id} refund ruling",
                            'related_model_type' => MarketplaceOrder::class,
                            'related_model_id'   => $order->id,
                        ]
                    );
                }

                $order->update(['status' => 'refunded']);
            } else {
                // no_refund: complete the order and release the earning.
                $earning = VendorEarning::where('marketplace_order_id', $order->id)->first();
                if ($earning) {
                    $earning->update(['status' => 'available']);
                }

                $vendor = Vendor::lockForUpdate()->find($order->vendor_id);
                $vendor->increment('total_earnings_kobo', $order->vendor_earning_kobo);
                $vendor->increment('total_orders');

                $order->update([
                    'status'       => 'completed',
                    'completed_at' => now(),
                ]);
            }

            $dispute->update([
                'status'          => 'resolved',
                'resolution_note' => $note,
                'resolved_by'     => $admin->id,
                'resolved_at'     => now(),
            ]);

            MarketplaceOrderEvent::create([
                'marketplace_order_id' => $order->id,
                'actor_id'             => $admin->id,
                'event'                => 'dispute_resolved',
                'note'                 => "Resolution: {$resolution}. {$note}",
            ]);
        });
    }
}
