<?php

namespace App\Http\Controllers;

use App\Exceptions\Provider\ProviderOutOfStockException;
use App\Exceptions\Provider\ProviderPurchaseException;
use App\Exceptions\Provider\ProviderTimeoutException;
use App\Exceptions\Provider\ProviderUnavailableException;
use App\Models\Order;
use App\Services\OrderService;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    public function __construct(private OrderService $orderService) {}

    /** GET /api/orders */
    public function index(Request $request)
    {
        $user   = auth()->user();
        $status = $request->input('status');

        $query = Order::where('user_id', $user->id)
                      ->orderByDesc('created_at');

        if ($status && $status !== 'all') {
            $query->where('status', $status);
        }

        $orders = $query->paginate(20);

        return response()->json([
            'orders' => $orders->map(fn($o) => $this->formatOrder($o)),
            'meta'   => [
                'current_page' => $orders->currentPage(),
                'last_page'    => $orders->lastPage(),
                'total'        => $orders->total(),
            ],
        ]);
    }

    /** POST /api/orders */
    public function store(Request $request)
    {
        $request->validate([
            'provider'         => 'required|string',
            'country'          => 'required|string',
            'service'          => 'required|string',
            'service_name'     => 'required|string|max:100',
            'idempotency_key'  => 'required|string|max:64',
            'reward_id'        => 'sometimes|integer',
        ]);

        $user = auth()->user();

        try {
            if ($request->filled('reward_id')) {
                $order = $this->orderService->placeRewardOrder(
                    user:           $user,
                    rewardId:       (int) $request->input('reward_id'),
                    provider:       $request->input('provider'),
                    country:        $request->input('country'),
                    service:        $request->input('service'),
                    serviceName:    $request->input('service_name'),
                    idempotencyKey: $request->input('idempotency_key'),
                );
            } else {
                $order = $this->orderService->placeOrder(
                    user:           $user,
                    provider:       $request->input('provider'),
                    country:        $request->input('country'),
                    service:        $request->input('service'),
                    serviceName:    $request->input('service_name'),
                    idempotencyKey: $request->input('idempotency_key'),
                );
            }

            return response()->json([
                'message' => 'Order placed successfully.',
                'order'   => $this->formatOrder($order),
            ], 201);
        } catch (\RuntimeException $e) {
            // Insufficient balance
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (ProviderOutOfStockException) {
            return response()->json([
                'message' => 'No numbers are currently available for this service and country. Please try another option.',
            ], 422);
        } catch (ProviderTimeoutException) {
            return response()->json([
                'message' => 'The provider took too long to respond. Your wallet has not been charged. Please try again.',
            ], 503);
        } catch (ProviderUnavailableException) {
            return response()->json([
                'message' => 'This provider is temporarily unavailable. Please try again later.',
            ], 503);
        } catch (ProviderPurchaseException $e) {
            return response()->json([
                'message' => 'Purchase failed. Please try again.',
            ], 422);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    /** GET /api/orders/{reference} */
    public function show(string $reference)
    {
        $order = Order::where('reference', $reference)
                      ->where('user_id', auth()->id())
                      ->firstOrFail();

        return response()->json(['order' => $this->formatOrder($order)]);
    }

    /** POST /api/orders/{reference}/cancel */
    public function cancel(string $reference)
    {
        $order = Order::where('reference', $reference)
                      ->where('user_id', auth()->id())
                      ->firstOrFail();

        if ($order->isTerminal()) {
            return response()->json(['message' => 'This order has already been completed or cancelled.'], 422);
        }

        $order = $this->orderService->cancel($order);

        return response()->json([
            'message' => 'Order cancelled. Your wallet has been refunded.',
            'order'   => $this->formatOrder($order),
        ]);
    }

    /** GET /api/orders/{reference}/otp — poll for OTP */
    public function otp(string $reference)
    {
        $order = Order::where('reference', $reference)
                      ->where('user_id', auth()->id())
                      ->firstOrFail();

        if (!$order->isTerminal() && !$order->otp) {
            $order = $this->orderService->syncStatus($order);
        }

        return response()->json([
            'status' => $order->status,
            'otp'    => $order->otp,
        ]);
    }

    private function formatOrder(Order $order): array
    {
        return [
            'id'               => $order->reference,
            'provider'         => $order->provider,
            'country'          => $order->country,
            'service'          => $order->service,
            'service_name'     => $order->service_name,
            'phone_number'     => $order->phone_number,
            'status'           => $order->status,
            'otp'              => $order->otp,
            'customer_price'   => $order->customer_price,
            'formatted_price'  => $order->formattedPrice(),
            'expires_at'       => $order->expires_at?->toIso8601String(),
            'created_at'       => $order->created_at->toIso8601String(),
        ];
    }
}
