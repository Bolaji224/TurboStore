<?php

namespace App\Http\Controllers\Vendor;

use App\Http\Controllers\Controller;
use App\Models\MarketplaceOrder;
use App\Services\MarketplaceOrderService;
use Illuminate\Http\Request;

class VendorOrderController extends Controller
{
    /**
     * GET /api/vendor/orders
     * List orders received by this vendor, paginated with optional status filter.
     */
    public function index(Request $request)
    {
        $vendor = $request->user()->vendor;

        $query = MarketplaceOrder::where('vendor_id', $vendor->id)
            ->with(['user:id,name,email', 'service:id,title,slug'])
            ->orderByDesc('created_at');

        if ($status = $request->input('status')) {
            $query->where('status', $status);
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

    /**
     * GET /api/vendor/orders/{reference}
     * Show a single order that belongs to this vendor.
     */
    public function show(string $reference, Request $request)
    {
        $vendor = $request->user()->vendor;

        $order = MarketplaceOrder::where('reference', $reference)
            ->where('vendor_id', $vendor->id)
            ->with(['user:id,name,email', 'service', 'events', 'dispute'])
            ->firstOrFail();

        return response()->json(['data' => $order]);
    }

    /**
     * POST /api/vendor/orders/{reference}/progress
     * Vendor marks an order as in progress.
     */
    public function markInProgress(string $reference, Request $request, MarketplaceOrderService $service)
    {
        $validated = $request->validate([
            'note' => 'nullable|string|max:500',
        ]);

        $vendor = $request->user()->vendor;

        $order = MarketplaceOrder::where('reference', $reference)
            ->where('vendor_id', $vendor->id)
            ->firstOrFail();

        try {
            $service->markInProgress($order, $request->user(), $validated['note'] ?? '');

            return response()->json(['message' => 'Order marked as in progress.']);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    /**
     * POST /api/vendor/orders/{reference}/deliver
     * Vendor marks an order as delivered.
     */
    public function deliver(string $reference, Request $request, MarketplaceOrderService $service)
    {
        $validated = $request->validate([
            'delivery_notes' => 'required|string|max:2000',
            'delivery_proof' => 'nullable|string|max:2000',
        ]);

        $vendor = $request->user()->vendor;

        $order = MarketplaceOrder::where('reference', $reference)
            ->where('vendor_id', $vendor->id)
            ->firstOrFail();

        try {
            $service->markDelivered(
                $order,
                $request->user(),
                $validated['delivery_notes'],
                $validated['delivery_proof'] ?? null,
            );

            return response()->json(['message' => 'Order marked as delivered.']);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }
}
