<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\MarketplaceDispute;
use App\Models\MarketplaceOrder;
use App\Models\MarketplaceService;
use App\Models\SupplierLedgerEntry;
use App\Models\Vendor;
use App\Models\VendorEarning;
use App\Models\VendorPayoutRequest;
use App\Services\MarketplaceOrderService;
use App\Services\PayoutService;
use App\Services\VendorService;
use Illuminate\Http\Request;

class AdminMarketplaceController extends Controller
{
    // =========================================================================
    // Vendors
    // =========================================================================

    public function vendors(Request $request)
    {
        $query = Vendor::with('user:id,name,email')
            ->orderByDesc('created_at');

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        $vendors = $query->paginate(20);

        return response()->json([
            'data' => $vendors->items(),
            'meta' => [
                'current_page' => $vendors->currentPage(),
                'last_page'    => $vendors->lastPage(),
                'total'        => $vendors->total(),
            ],
        ]);
    }

    public function approveVendor(int $id, VendorService $vendorService)
    {
        $vendor = Vendor::findOrFail($id);
        $vendorService->approveVendor($vendor, auth()->user());

        return response()->json(['message' => 'Vendor approved.', 'data' => $vendor->fresh()]);
    }

    public function suspendVendor(int $id, Request $request, VendorService $vendorService)
    {
        $request->validate(['reason' => 'required|string|max:500']);

        $vendor = Vendor::findOrFail($id);
        $vendorService->suspendVendor($vendor, auth()->user(), $request->input('reason'));

        return response()->json(['message' => 'Vendor suspended.', 'data' => $vendor->fresh()]);
    }

    public function rejectVendor(int $id, Request $request, VendorService $vendorService)
    {
        $request->validate(['reason' => 'required|string|max:500']);

        $vendor = Vendor::findOrFail($id);
        $vendorService->rejectVendor($vendor, auth()->user(), $request->input('reason'));

        return response()->json(['message' => 'Vendor rejected.', 'data' => $vendor->fresh()]);
    }

    // =========================================================================
    // Services
    // =========================================================================

    public function services(Request $request)
    {
        $query = MarketplaceService::with(['vendor.user:id,name', 'category'])
            ->orderByDesc('created_at');

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        $services = $query->paginate(20);

        return response()->json([
            'data' => $services->items(),
            'meta' => [
                'current_page' => $services->currentPage(),
                'last_page'    => $services->lastPage(),
                'total'        => $services->total(),
            ],
        ]);
    }

    public function approveService(int $id)
    {
        $service = MarketplaceService::findOrFail($id);
        $service->update([
            'status'      => 'approved',
            'approved_at' => now(),
            'approved_by' => auth()->id(),
        ]);

        return response()->json(['message' => 'Service approved.', 'data' => $service->fresh()]);
    }

    public function rejectService(int $id, Request $request)
    {
        $request->validate(['reason' => 'required|string|max:500']);

        $service = MarketplaceService::findOrFail($id);
        $service->update([
            'status'           => 'rejected',
            'rejection_reason' => $request->input('reason'),
        ]);

        return response()->json(['message' => 'Service rejected.', 'data' => $service->fresh()]);
    }

    public function suspendService(int $id, Request $request)
    {
        $request->validate(['reason' => 'required|string|max:500']);

        $service = MarketplaceService::findOrFail($id);
        $service->update([
            'status'           => 'suspended',
            'rejection_reason' => $request->input('reason'),
        ]);

        return response()->json(['message' => 'Service suspended.', 'data' => $service->fresh()]);
    }

    // =========================================================================
    // Orders
    // =========================================================================

    public function orders(Request $request)
    {
        $query = MarketplaceOrder::with(['user:id,name,email', 'vendor.user:id,name', 'service:id,title,slug'])
            ->orderByDesc('created_at');

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        if ($vendorId = $request->input('vendor_id')) {
            $query->where('vendor_id', (int) $vendorId);
        }

        $orders = $query->paginate(20);

        return response()->json([
            'data' => $orders->items(),
            'meta' => [
                'current_page' => $orders->currentPage(),
                'last_page'    => $orders->lastPage(),
                'total'        => $orders->total(),
            ],
        ]);
    }

    public function deleteOrder(int $id): \Illuminate\Http\JsonResponse
    {
        $order = MarketplaceOrder::findOrFail($id);

        if (!in_array($order->status, ['completed', 'cancelled', 'refunded'], true)) {
            return response()->json(['message' => 'Only completed, cancelled, or refunded orders can be deleted.'], 422);
        }

        $order->delete();

        return response()->json(['message' => 'Order deleted.']);
    }

    public function deleteService(int $id): \Illuminate\Http\JsonResponse
    {
        $service = MarketplaceService::findOrFail($id);
        $service->delete();

        return response()->json(['message' => 'Service deleted.']);
    }

    // =========================================================================
    // Disputes
    // =========================================================================

    public function disputes(Request $request)
    {
        $query = MarketplaceDispute::with([
                'marketplaceOrder:id,reference,status',
                'user:id,name,email',
                'vendor.user:id,name',
            ])
            ->orderByDesc('created_at');

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        $disputes = $query->paginate(20);

        return response()->json([
            'data' => $disputes->items(),
            'meta' => [
                'current_page' => $disputes->currentPage(),
                'last_page'    => $disputes->lastPage(),
                'total'        => $disputes->total(),
            ],
        ]);
    }

    public function resolveDispute(int $id, Request $request, MarketplaceOrderService $orderService)
    {
        $validated = $request->validate([
            'resolution' => 'required|in:refund,no_refund',
            'note'       => 'required|string|max:1000',
        ]);

        $dispute = MarketplaceDispute::findOrFail($id);

        if ($dispute->status !== 'open') {
            return response()->json(['message' => 'This dispute has already been resolved.'], 422);
        }

        try {
            $orderService->resolveDispute(
                $dispute,
                auth()->user(),
                $validated['resolution'],
                $validated['note'],
            );

            return response()->json(['message' => 'Dispute resolved.']);
        } catch (\Throwable $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    // =========================================================================
    // Payouts
    // =========================================================================

    /**
     * GET /api/admin/marketplace/payouts
     */
    public function payouts(Request $request)
    {
        $query = VendorPayoutRequest::with('vendor.user:id,name,email')
            ->orderByDesc('created_at');

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        $payouts = $query->paginate(20);

        return response()->json([
            'data' => $payouts->items(),
            'meta' => [
                'current_page' => $payouts->currentPage(),
                'last_page'    => $payouts->lastPage(),
                'total'        => $payouts->total(),
            ],
        ]);
    }

    /**
     * POST /api/admin/marketplace/payouts/{id}/approve
     */
    public function approvePayout(int $id, PayoutService $payoutService)
    {
        $payout = VendorPayoutRequest::findOrFail($id);

        try {
            $payoutService->approvePayout($payout, auth()->user());
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json(['message' => 'Payout approved.', 'data' => $payout->fresh()]);
    }

    /**
     * POST /api/admin/marketplace/payouts/{id}/mark-processing
     */
    public function markPayoutProcessing(int $id, PayoutService $payoutService)
    {
        $payout = VendorPayoutRequest::findOrFail($id);

        try {
            $payoutService->markProcessing($payout, auth()->user());
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json(['message' => 'Payout marked as processing.', 'data' => $payout->fresh()]);
    }

    /**
     * POST /api/admin/marketplace/payouts/{id}/mark-paid
     */
    public function markPayoutPaid(int $id, Request $request, PayoutService $payoutService)
    {
        $validated = $request->validate([
            'payment_reference' => 'required|string|max:200',
            'note'              => 'nullable|string|max:1000',
        ]);

        $payout = VendorPayoutRequest::findOrFail($id);

        try {
            $payoutService->markPaid(
                $payout,
                auth()->user(),
                $validated['payment_reference'],
                $validated['note'] ?? null,
            );
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json(['message' => 'Payout marked as paid.', 'data' => $payout->fresh()]);
    }

    /**
     * POST /api/admin/marketplace/payouts/{id}/reject
     * Rejects a pending payout and releases reserved earnings.
     */
    public function rejectPayout(int $id, Request $request, PayoutService $payoutService)
    {
        $request->validate(['admin_note' => 'required|string|max:500']);

        $payout = VendorPayoutRequest::findOrFail($id);

        try {
            $payoutService->cancelPayout($payout, auth()->user(), $request->input('admin_note'));
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json(['message' => 'Payout rejected and earnings released.', 'data' => $payout->fresh()]);
    }

    /**
     * POST /api/admin/marketplace/payouts/{id}/mark-failed
     */
    public function markPayoutFailed(int $id, Request $request, PayoutService $payoutService)
    {
        $request->validate(['admin_note' => 'required|string|max:500']);

        $payout = VendorPayoutRequest::findOrFail($id);

        try {
            $payoutService->markFailed($payout, auth()->user(), $request->input('admin_note'));
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json(['message' => 'Payout marked as failed and earnings released.', 'data' => $payout->fresh()]);
    }

    // =========================================================================
    // Supplier Reports
    // =========================================================================

    /**
     * GET /api/admin/marketplace/supplier-reports
     * Per-supplier financial breakdown with optional date and vendor filters.
     */
    public function supplierReports(Request $request)
    {
        $validated = $request->validate([
            'vendor_id'  => 'nullable|integer|exists:vendors,id',
            'date_from'  => 'nullable|date',
            'date_to'    => 'nullable|date|after_or_equal:date_from',
        ]);

        $vendorQuery = Vendor::with('user:id,name,email')
            ->withCount('marketplaceOrders');

        if (!empty($validated['vendor_id'])) {
            $vendorQuery->where('id', $validated['vendor_id']);
        }

        $vendors = $vendorQuery->paginate(20);

        $reports = $vendors->getCollection()->map(function (Vendor $vendor) use ($validated) {
            $orderQuery = MarketplaceOrder::where('vendor_id', $vendor->id);

            if (!empty($validated['date_from'])) {
                $orderQuery->whereDate('created_at', '>=', $validated['date_from']);
            }
            if (!empty($validated['date_to'])) {
                $orderQuery->whereDate('created_at', '<=', $validated['date_to']);
            }

            $completedOrders = (clone $orderQuery)->whereIn('status', ['completed', 'delivered', 'refunded']);

            $grossSalesKobo     = (int) (clone $completedOrders)->sum('price_kobo');
            $commissionKobo     = (int) (clone $completedOrders)->sum('commission_kobo');
            $netEarningsKobo    = (int) (clone $completedOrders)->sum('vendor_earning_kobo');

            $pendingKobo    = (int) VendorEarning::where('vendor_id', $vendor->id)->where('status', 'pending')->sum('amount_kobo');
            $availableKobo  = (int) VendorEarning::where('vendor_id', $vendor->id)->where('status', 'available')->sum('amount_kobo');
            $reservedKobo   = (int) VendorEarning::where('vendor_id', $vendor->id)->where('status', 'reserved')->sum('amount_kobo');
            $paidOutKobo    = (int) VendorPayoutRequest::where('vendor_id', $vendor->id)->where('status', 'paid')->sum('amount_kobo');

            return [
                'vendor_id'           => $vendor->id,
                'business_name'       => $vendor->business_name,
                'user'                => $vendor->user,
                'commission_rate'     => $vendor->commission_rate,
                'status'              => $vendor->status,
                'total_orders'        => $vendor->total_orders,
                'gross_sales_kobo'    => $grossSalesKobo,
                'gross_sales_naira'   => round($grossSalesKobo / 100, 2),
                'commission_kobo'     => $commissionKobo,
                'commission_naira'    => round($commissionKobo / 100, 2),
                'net_earnings_kobo'   => $netEarningsKobo,
                'net_earnings_naira'  => round($netEarningsKobo / 100, 2),
                'pending_kobo'        => $pendingKobo,
                'pending_naira'       => round($pendingKobo / 100, 2),
                'available_kobo'      => $availableKobo,
                'available_naira'     => round($availableKobo / 100, 2),
                'reserved_kobo'       => $reservedKobo,
                'reserved_naira'      => round($reservedKobo / 100, 2),
                'paid_out_kobo'       => $paidOutKobo,
                'paid_out_naira'      => round($paidOutKobo / 100, 2),
            ];
        });

        return response()->json([
            'data' => $reports,
            'meta' => [
                'current_page' => $vendors->currentPage(),
                'last_page'    => $vendors->lastPage(),
                'total'        => $vendors->total(),
            ],
        ]);
    }

    /**
     * GET /api/admin/marketplace/ledger
     * Supplier financial audit ledger.
     */
    public function ledger(Request $request)
    {
        $query = SupplierLedgerEntry::with('vendor.user:id,name')
            ->orderByDesc('created_at');

        if ($vendorId = $request->input('vendor_id')) {
            $query->where('vendor_id', (int) $vendorId);
        }

        if ($type = $request->input('entry_type')) {
            $query->where('entry_type', $type);
        }

        if ($from = $request->input('date_from')) {
            $query->whereDate('created_at', '>=', $from);
        }

        if ($to = $request->input('date_to')) {
            $query->whereDate('created_at', '<=', $to);
        }

        $entries = $query->paginate(50);

        return response()->json([
            'data' => $entries->items(),
            'meta' => [
                'current_page' => $entries->currentPage(),
                'last_page'    => $entries->lastPage(),
                'total'        => $entries->total(),
            ],
        ]);
    }

    // =========================================================================
    // Stats
    // =========================================================================

    public function stats()
    {
        $pendingPayoutsKobo = (int) VendorPayoutRequest::whereIn('status', ['pending', 'approved', 'processing'])->sum('amount_kobo');

        return response()->json([
            'data' => [
                'total_vendors'          => Vendor::count(),
                'pending_vendors'        => Vendor::where('status', 'pending')->count(),
                'total_services'         => MarketplaceService::count(),
                'pending_services'       => MarketplaceService::where('status', 'pending_review')->count(),
                'total_orders'           => MarketplaceOrder::count(),
                'total_revenue_kobo'     => (int) MarketplaceOrder::whereIn('status', ['completed', 'delivered'])->sum('commission_kobo'),
                'pending_disputes'       => MarketplaceDispute::where('status', 'open')->count(),
                'pending_payouts'        => VendorPayoutRequest::where('status', 'pending')->count(),
                'pending_payouts_kobo'   => $pendingPayoutsKobo,
                'pending_payouts_naira'  => round($pendingPayoutsKobo / 100, 2),
            ],
        ]);
    }
}
