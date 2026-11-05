<?php

namespace App\Http\Controllers\Vendor;

use App\Http\Controllers\Controller;
use App\Models\VendorEarning;
use App\Models\VendorPayoutRequest;
use App\Services\PayoutService;
use Illuminate\Http\Request;

class VendorEarningsController extends Controller
{
    /**
     * GET /api/vendor/earnings
     * Earnings summary plus paginated history.
     */
    public function index(Request $request)
    {
        $vendor = $request->user()->vendor;

        $availableTotal = VendorEarning::where('vendor_id', $vendor->id)
            ->where('status', 'available')
            ->sum('amount_kobo');

        $pendingTotal = VendorEarning::where('vendor_id', $vendor->id)
            ->where('status', 'pending')
            ->sum('amount_kobo');

        $reservedTotal = VendorEarning::where('vendor_id', $vendor->id)
            ->where('status', 'reserved')
            ->sum('amount_kobo');

        $paidTotal = VendorEarning::where('vendor_id', $vendor->id)
            ->where('status', 'paid')
            ->sum('amount_kobo');

        $earnings = VendorEarning::where('vendor_id', $vendor->id)
            ->with('marketplaceOrder:id,reference,status')
            ->orderByDesc('created_at')
            ->paginate(20);

        return response()->json([
            'data' => [
                'summary' => [
                    'available_kobo'     => (int) $availableTotal,
                    'available_naira'    => round($availableTotal / 100, 2),
                    'pending_kobo'       => (int) $pendingTotal,
                    'pending_naira'      => round($pendingTotal / 100, 2),
                    'reserved_kobo'      => (int) $reservedTotal,
                    'reserved_naira'     => round($reservedTotal / 100, 2),
                    'paid_kobo'          => (int) $paidTotal,
                    'paid_naira'         => round($paidTotal / 100, 2),
                    'total_earned_kobo'  => (int) $vendor->total_earnings_kobo,
                    'total_earned_naira' => round($vendor->total_earnings_kobo / 100, 2),
                ],
                'earnings' => $earnings->items(),
            ],
            'meta' => [
                'current_page' => $earnings->currentPage(),
                'last_page'    => $earnings->lastPage(),
                'total'        => $earnings->total(),
            ],
        ]);
    }

    /**
     * POST /api/vendor/payouts
     * Request a payout. Earnings are reserved immediately (FIFO) to prevent
     * double-spend in concurrent requests.
     */
    public function requestPayout(Request $request, PayoutService $payoutService)
    {
        $validated = $request->validate([
            'amount_kobo'                  => 'required|integer|min:100000',
            'bank_details'                 => 'required|array',
            'bank_details.bank_name'       => 'required|string|max:100',
            'bank_details.account_number'  => 'required|digits_between:10,20',
            'bank_details.account_name'    => 'required|string|max:100',
        ]);

        $vendor = $request->user()->vendor;

        // Check that there are no open pending/approved/processing payouts
        // (one active payout at a time prevents confusion).
        $activePayout = VendorPayoutRequest::where('vendor_id', $vendor->id)
            ->whereIn('status', ['pending', 'approved', 'processing'])
            ->exists();

        if ($activePayout) {
            return response()->json([
                'message' => 'You already have an active payout request. Please wait for it to be processed before submitting another.',
            ], 422);
        }

        try {
            $payout = $payoutService->requestPayout(
                $vendor,
                (int) $validated['amount_kobo'],
                $validated['bank_details']
            );
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json([
            'message' => 'Payout request submitted. ₦' . number_format($payout->amount_kobo / 100, 2) . ' has been reserved.',
            'data'    => $payout,
        ], 201);
    }

    /**
     * GET /api/vendor/payouts
     * List this vendor's payout requests.
     */
    public function payouts(Request $request)
    {
        $vendor = $request->user()->vendor;

        $payouts = VendorPayoutRequest::where('vendor_id', $vendor->id)
            ->orderByDesc('created_at')
            ->paginate(20);

        return response()->json([
            'data' => $payouts->items(),
            'meta' => [
                'current_page' => $payouts->currentPage(),
                'last_page'    => $payouts->lastPage(),
                'total'        => $payouts->total(),
            ],
        ]);
    }
}
