<?php

namespace App\Http\Controllers\Marketplace;

use App\Http\Controllers\Controller;
use App\Models\MarketplaceOrder;
use App\Models\MarketplaceService;
use App\Services\MarketplaceOrderService;
use Illuminate\Http\Request;

class MarketplaceOrderController extends Controller
{
    /**
     * POST /api/marketplace/orders
     * Place a new marketplace order.
     */
    public function store(Request $request, MarketplaceOrderService $service)
    {
        $validated = $request->validate([
            'service_id'      => 'required|integer|exists:marketplace_services,id',
            'requirements'    => 'nullable|string|max:2000',
            'idempotency_key' => 'nullable|string|max:100',
        ]);

        // Price always loaded from DB, never from client
        $marketplaceService = MarketplaceService::findOrFail($validated['service_id']);

        try {
            $order = $service->createOrder(
                $request->user(),
                $marketplaceService,
                $validated['requirements'] ?? '',
                $validated['idempotency_key'] ?? null,
            );

            $order->load(['service', 'vendor.user:id,name', 'events']);

            return response()->json([
                'message' => 'Order placed successfully.',
                'data'    => $order,
            ], 201);
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    /**
     * GET /api/marketplace/orders
     * Current user's marketplace order history, paginated, with optional status filter.
     */
    public function index(Request $request)
    {
        $userId = $request->user()->id;

        $query = MarketplaceOrder::where('user_id', $userId)
            ->with(['service:id,title,slug', 'vendor:id,business_name'])
            ->orderByDesc('created_at');

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        $orders = $query->paginate(20);

        // Per-status counts for the stats chips (always across all orders, ignoring the filter)
        $rawStats = MarketplaceOrder::where('user_id', $userId)
            ->selectRaw('status, count(*) as cnt')
            ->groupBy('status')
            ->pluck('cnt', 'status')
            ->toArray();

        $stats = array_merge(
            ['paid' => 0, 'in_progress' => 0, 'delivered' => 0, 'completed' => 0, 'disputed' => 0, 'cancelled' => 0, 'refunded' => 0],
            $rawStats,
            ['total' => array_sum($rawStats)]
        );

        return response()->json([
            'data'  => $orders->items(),
            'meta'  => [
                'current_page' => $orders->currentPage(),
                'last_page'    => $orders->lastPage(),
                'total'        => $orders->total(),
            ],
            'stats' => $stats,
        ]);
    }

    /**
     * GET /api/marketplace/orders/{reference}
     * Show a single order — buyer only.
     */
    public function show(string $reference)
    {
        $order = MarketplaceOrder::where('reference', $reference)->firstOrFail();

        if ($order->user_id !== auth()->id()) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $order->load(['service', 'vendor.user:id,name', 'events', 'dispute']);

        return response()->json(['data' => $order]);
    }

    /**
     * POST /api/marketplace/orders/{reference}/confirm
     * Buyer confirms delivery.
     */
    public function confirm(string $reference, MarketplaceOrderService $service)
    {
        $order = MarketplaceOrder::where('reference', $reference)->firstOrFail();

        try {
            $service->confirmCompletion($order, auth()->user());

            return response()->json(['message' => 'Order confirmed. Thank you!']);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    /**
     * POST /api/marketplace/orders/{reference}/dispute
     * Buyer opens a dispute.
     */
    public function dispute(string $reference, Request $request, MarketplaceOrderService $service)
    {
        $validated = $request->validate([
            'reason'      => 'required|string|max:255',
            'description' => 'required|string|max:2000',
        ]);

        $order = MarketplaceOrder::where('reference', $reference)->firstOrFail();

        try {
            $dispute = $service->openDispute(
                $order,
                $request->user(),
                $validated['reason'],
                $validated['description'],
            );

            return response()->json([
                'message' => 'Dispute opened successfully.',
                'data'    => $dispute,
            ], 201);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    /**
     * POST /api/marketplace/orders/{reference}/cancel
     * Cancel an order.
     */
    public function cancel(string $reference, MarketplaceOrderService $service)
    {
        $order = MarketplaceOrder::where('reference', $reference)->firstOrFail();

        // Only buyer or vendor can cancel
        $user = auth()->user();
        $vendor = $user->vendor;
        $isBuyer  = $order->user_id === $user->id;
        $isVendor = $vendor && $vendor->id === $order->vendor_id;

        if (!$isBuyer && !$isVendor) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        try {
            $service->cancelOrder($order, $user, 'Cancelled by ' . ($isBuyer ? 'buyer' : 'vendor'));

            return response()->json(['message' => 'Order cancelled.']);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }
}
