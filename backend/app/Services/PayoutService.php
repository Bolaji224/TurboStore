<?php

namespace App\Services;

use App\Models\SupplierLedgerEntry;
use App\Models\Vendor;
use App\Models\VendorEarning;
use App\Models\VendorPayoutItem;
use App\Models\VendorPayoutRequest;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class PayoutService
{
    /**
     * Create a payout request and immediately reserve the specific earnings
     * that will fund it (FIFO order, whole earnings only — no splitting).
     *
     * The actual payout amount equals the sum of reserved earnings, which will
     * be >= the vendor's requested minimum. Any excess is also reserved and paid
     * together (transparent to the vendor — they get everything they're owed).
     *
     * @throws \RuntimeException  When available balance is below the requested amount.
     */
    public function requestPayout(Vendor $vendor, int $requestedKobo, array $bankDetails): VendorPayoutRequest
    {
        return DB::transaction(function () use ($vendor, $requestedKobo, $bankDetails) {
            // Pessimistic lock — prevents concurrent payout requests from
            // double-spending the same earnings.
            $earnings = VendorEarning::where('vendor_id', $vendor->id)
                ->where('status', 'available')
                ->lockForUpdate()
                ->orderBy('created_at')
                ->get();

            $totalAvailable = $earnings->sum('amount_kobo');

            if ($totalAvailable < $requestedKobo) {
                throw new \RuntimeException(
                    'Insufficient available balance. Available: ₦' . number_format($totalAvailable / 100, 2)
                );
            }

            // Select whole earnings FIFO until we cover the requested amount.
            $selected = collect();
            $running  = 0;
            foreach ($earnings as $earning) {
                $selected->push($earning);
                $running += $earning->amount_kobo;
                if ($running >= $requestedKobo) {
                    break;
                }
            }

            $actualAmount = (int) $selected->sum('amount_kobo');

            $payout = VendorPayoutRequest::create([
                'vendor_id'    => $vendor->id,
                'amount_kobo'  => $actualAmount,
                'status'       => 'pending',
                'bank_details' => $bankDetails,
            ]);

            // Reserve each earning and create the linking payout item.
            foreach ($selected as $earning) {
                $earning->update(['status' => 'reserved']);

                VendorPayoutItem::create([
                    'vendor_payout_request_id' => $payout->id,
                    'vendor_earning_id'        => $earning->id,
                    'amount_kobo'              => $earning->amount_kobo,
                ]);
            }

            // Audit ledger — negative amount = reduction in freely available balance.
            SupplierLedgerEntry::create([
                'vendor_id'          => $vendor->id,
                'idempotency_key'    => 'payout_reserve_' . $payout->id,
                'entry_type'         => 'payout_reserved',
                'amount_kobo'        => -$actualAmount,
                'description'        => "Payout request #{$payout->id} — earnings reserved for settlement",
                'related_model_type' => VendorPayoutRequest::class,
                'related_model_id'   => $payout->id,
            ]);

            return $payout;
        });
    }

    /**
     * Admin approves a pending payout. Earnings remain reserved.
     */
    public function approvePayout(VendorPayoutRequest $payout, User $admin): void
    {
        if ($payout->status !== 'pending') {
            throw new \InvalidArgumentException("Cannot approve payout in status: {$payout->status}");
        }

        $payout->update([
            'status'      => 'approved',
            'reviewed_by' => $admin->id,
            'reviewed_at' => now(),
        ]);
    }

    /**
     * Admin marks an approved payout as processing (bank transfer initiated).
     */
    public function markProcessing(VendorPayoutRequest $payout, User $admin): void
    {
        if ($payout->status !== 'approved') {
            throw new \InvalidArgumentException("Cannot mark processing: status is {$payout->status}");
        }

        $payout->update([
            'status'       => 'processing',
            'processed_by' => $admin->id,
            'processed_at' => now(),
        ]);
    }

    /**
     * Admin confirms a payout has been successfully transferred to the supplier.
     * Earnings are marked paid; the ledger records the settlement.
     */
    public function markPaid(VendorPayoutRequest $payout, User $admin, string $paymentRef, ?string $note): void
    {
        if (!in_array($payout->status, ['approved', 'processing'], true)) {
            throw new \InvalidArgumentException("Cannot mark paid: status is {$payout->status}");
        }

        DB::transaction(function () use ($payout, $admin, $paymentRef, $note) {
            $earningIds = $payout->payoutItems()->pluck('vendor_earning_id');
            VendorEarning::whereIn('id', $earningIds)->update(['status' => 'paid']);

            $payout->update([
                'status'            => 'paid',
                'payment_reference' => $paymentRef,
                'payout_note'       => $note,
                'processed_by'      => $admin->id,
                'processed_at'      => now(),
            ]);

            SupplierLedgerEntry::create([
                'vendor_id'          => $payout->vendor_id,
                'idempotency_key'    => 'payout_settled_' . $payout->id,
                'entry_type'         => 'payout_settled',
                'amount_kobo'        => 0,
                'description'        => "Payout #{$payout->id} settled — ref: {$paymentRef}",
                'related_model_type' => VendorPayoutRequest::class,
                'related_model_id'   => $payout->id,
                'metadata'           => ['payment_reference' => $paymentRef],
            ]);
        });
    }

    /**
     * Admin cancels a pending or approved payout.
     * Reserved earnings are released back to available.
     */
    public function cancelPayout(VendorPayoutRequest $payout, User $admin, string $note): void
    {
        if (!in_array($payout->status, ['pending', 'approved', 'rejected'], true)) {
            throw new \InvalidArgumentException("Cannot cancel payout in status: {$payout->status}");
        }

        DB::transaction(function () use ($payout, $admin, $note) {
            $earningIds = $payout->payoutItems()->pluck('vendor_earning_id');
            VendorEarning::whereIn('id', $earningIds)->update(['status' => 'available']);

            $payout->update([
                'status'      => 'cancelled',
                'admin_note'  => $note,
                'reviewed_by' => $admin->id,
                'reviewed_at' => now(),
            ]);

            SupplierLedgerEntry::firstOrCreate(
                ['idempotency_key' => 'payout_released_' . $payout->id],
                [
                    'vendor_id'          => $payout->vendor_id,
                    'entry_type'         => 'payout_released',
                    'amount_kobo'        => $payout->amount_kobo,
                    'description'        => "Payout #{$payout->id} cancelled — earnings released",
                    'related_model_type' => VendorPayoutRequest::class,
                    'related_model_id'   => $payout->id,
                ]
            );
        });
    }

    /**
     * Admin marks a processing payout as failed.
     * Reserved earnings are released back to available for re-withdrawal.
     */
    public function markFailed(VendorPayoutRequest $payout, User $admin, string $note): void
    {
        if ($payout->status !== 'processing') {
            throw new \InvalidArgumentException("Cannot mark failed: status is {$payout->status}");
        }

        DB::transaction(function () use ($payout, $admin, $note) {
            $earningIds = $payout->payoutItems()->pluck('vendor_earning_id');
            VendorEarning::whereIn('id', $earningIds)->update(['status' => 'available']);

            $payout->update([
                'status'       => 'failed',
                'admin_note'   => $note,
                'processed_by' => $admin->id,
                'processed_at' => now(),
            ]);

            SupplierLedgerEntry::firstOrCreate(
                ['idempotency_key' => 'payout_failed_' . $payout->id],
                [
                    'vendor_id'          => $payout->vendor_id,
                    'entry_type'         => 'payout_released',
                    'amount_kobo'        => $payout->amount_kobo,
                    'description'        => "Payout #{$payout->id} failed — earnings released",
                    'related_model_type' => VendorPayoutRequest::class,
                    'related_model_id'   => $payout->id,
                ]
            );
        });
    }
}
