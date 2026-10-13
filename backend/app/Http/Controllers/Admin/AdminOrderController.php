<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\AuditLogService;
use App\Services\OrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminOrderController extends Controller
{
    public function __construct(
        private OrderService    $orderService,
        private AuditLogService $auditLog,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $q = Order::with('user:id,name,email')->latest();

        if ($s = $request->get('search')) {
            $q->where(fn($q) => $q
                ->where('reference', 'like', "%{$s}%")
                ->orWhere('phone_number', 'like', "%{$s}%")
                ->orWhereHas('user', fn($q) => $q->where('email', 'like', "%{$s}%")->orWhere('name', 'like', "%{$s}%"))
            );
        }

        if ($status = $request->get('status')) {
            $q->where('status', $status);
        }

        if ($provider = $request->get('provider')) {
            $q->where('provider', $provider);
        }

        $orders = $q->paginate((int) $request->get('per_page', 20));

        return response()->json([
            'orders' => $orders->map(fn($o) => $this->format($o)),
            'meta'   => [
                'total'        => $orders->total(),
                'per_page'     => $orders->perPage(),
                'current_page' => $orders->currentPage(),
                'last_page'    => $orders->lastPage(),
            ],
        ]);
    }

    public function show(Order $order): JsonResponse
    {
        $order->load('user:id,name,email');
        return response()->json(['order' => $this->format($order)]);
    }

    public function cancel(Request $request, Order $order): JsonResponse
    {
        if (!in_array($order->status, ['processing', 'waiting_for_otp'])) {
            return response()->json(['message' => 'Order cannot be cancelled in its current state.'], 422);
        }

        $user = $order->user()->first();
        $this->orderService->cancel($user, $order->reference);
        $this->auditLog->logFromRequest($request, 'order.cancel', $order);

        return response()->json(['message' => 'Order cancelled.', 'order' => $this->format($order->fresh(['user']))]);
    }

    private function format(Order $o): array
    {
        return [
            'id'             => $o->id,
            'reference'      => $o->reference,
            'user'           => $o->user ? ['id' => $o->user->id, 'name' => $o->user->name, 'email' => $o->user->email] : null,
            'provider'       => $o->provider,
            'country'        => $o->country,
            'service'        => $o->service,
            'service_name'   => $o->service_name,
            'phone_number'   => $o->phone_number,
            'customer_price' => $o->customer_price,
            'provider_cost'  => $o->provider_cost,
            'status'         => $o->status,
            'otp'            => $o->otp,
            'reward_id'      => $o->reward_id,
            'expires_at'     => $o->expires_at,
            'cancelled_at'   => $o->cancelled_at,
            'created_at'     => $o->created_at,
        ];
    }
}
