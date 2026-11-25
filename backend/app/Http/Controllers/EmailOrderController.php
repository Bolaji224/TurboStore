<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Services\EmailOrderService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class EmailOrderController extends Controller
{
    public function __construct(private EmailOrderService $service) {}

    /** GET /api/email-orders */
    public function index()
    {
        $orders = Order::where('user_id', auth()->id())
            ->where('order_type', 'email')
            ->orderByDesc('created_at')
            ->paginate(20);

        return response()->json([
            'orders' => $orders->map(fn($o) => $this->format($o)),
            'meta'   => [
                'current_page' => $orders->currentPage(),
                'last_page'    => $orders->lastPage(),
                'total'        => $orders->total(),
            ],
        ]);
    }

    /** POST /api/email-orders */
    public function store(Request $request)
    {
        $request->validate([
            'service'         => 'required|string|max:60',
            'service_name'    => 'required|string|max:100',
            'idempotency_key' => 'required|string|max:64',
        ]);

        try {
            $order = $this->service->placeOrder(
                user:           auth()->user(),
                service:        $request->input('service'),
                serviceName:    $request->input('service_name'),
                idempotencyKey: $request->input('idempotency_key'),
            );

            return response()->json([
                'message' => 'Email order placed.',
                'order'   => $this->format($order),
            ], 201);
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\Throwable $e) {
            Log::error('[EmailOrder] store failed', [
                'error' => $e->getMessage(),
                'file'  => $e->getFile() . ':' . $e->getLine(),
            ]);
            return response()->json(['message' => 'Failed to generate email. Please try again.'], 500);
        }
    }

    /** GET /api/email-orders/{reference} */
    public function show(string $reference)
    {
        $order = Order::where('reference', $reference)
            ->where('user_id', auth()->id())
            ->where('order_type', 'email')
            ->firstOrFail();

        return response()->json(['order' => $this->format($order)]);
    }

    /** GET /api/email-orders/{reference}/otp — poll for OTP */
    public function otp(string $reference)
    {
        $order = Order::where('reference', $reference)
            ->where('user_id', auth()->id())
            ->where('order_type', 'email')
            ->firstOrFail();

        if (!$order->isTerminal() && !$order->otp) {
            $order = $this->service->syncStatus($order);
        }

        return response()->json([
            'status' => $order->status,
            'otp'    => $order->otp,
        ]);
    }

    /** POST /api/email-orders/{reference}/cancel */
    public function cancel(string $reference)
    {
        $order = Order::where('reference', $reference)
            ->where('user_id', auth()->id())
            ->where('order_type', 'email')
            ->firstOrFail();

        if ($order->isTerminal()) {
            return response()->json(['message' => 'This order has already ended.'], 422);
        }

        $order = $this->service->cancel($order);

        return response()->json([
            'message' => 'Order cancelled and wallet refunded.',
            'order'   => $this->format($order),
        ]);
    }

    /** GET /api/email-orders/price — return current price */
    public function price()
    {
        $kobo = $this->service->getPrice();
        return response()->json([
            'price_kobo'  => $kobo,
            'price_naira' => $kobo / 100,
        ]);
    }

    private function format(Order $order): array
    {
        return [
            'id'              => $order->reference,
            'service'         => $order->service,
            'service_name'    => $order->service_name,
            'email_address'   => $order->email_address,
            'status'          => $order->status,
            'otp'             => $order->otp,
            'customer_price'  => $order->customer_price,
            'formatted_price' => $order->formattedPrice(),
            'expires_at'      => $order->expires_at?->toIso8601String(),
            'created_at'      => $order->created_at->toIso8601String(),
        ];
    }
}
