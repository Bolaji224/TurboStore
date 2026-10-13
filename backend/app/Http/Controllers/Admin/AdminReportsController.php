<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\User;
use App\Models\WalletTransaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminReportsController extends Controller
{
    public function revenue(Request $request): JsonResponse
    {
        $days = min((int) $request->get('days', 30), 90);
        $from = now()->subDays($days)->startOfDay();

        $byDay = WalletTransaction::where('type', 'deposit')
            ->where('created_at', '>=', $from)
            ->selectRaw("DATE(created_at) as day, SUM(amount) as total, COUNT(*) as count")
            ->groupBy('day')
            ->orderBy('day')
            ->get()
            ->map(fn($r) => ['day' => $r->day, 'total' => (int) $r->total, 'count' => (int) $r->count]);

        $total30d = (int) WalletTransaction::where('type', 'deposit')
            ->where('created_at', '>=', now()->subDays(30))
            ->sum('amount');

        $total7d = (int) WalletTransaction::where('type', 'deposit')
            ->where('created_at', '>=', now()->subDays(7))
            ->sum('amount');

        return response()->json([
            'by_day'    => $byDay,
            'total_30d' => $total30d,
            'total_7d'  => $total7d,
            'total_all' => (int) WalletTransaction::where('type', 'deposit')->sum('amount'),
        ]);
    }

    public function orders(Request $request): JsonResponse
    {
        $days = min((int) $request->get('days', 30), 90);
        $from = now()->subDays($days)->startOfDay();

        $byDay = Order::where('created_at', '>=', $from)
            ->selectRaw("DATE(created_at) as day, COUNT(*) as total, SUM(customer_price) as revenue")
            ->groupBy('day')
            ->orderBy('day')
            ->get()
            ->map(fn($r) => ['day' => $r->day, 'total' => (int) $r->total, 'revenue' => (int) $r->revenue]);

        $byProvider = Order::selectRaw('provider, COUNT(*) as cnt, SUM(customer_price) as revenue')
            ->groupBy('provider')
            ->get()
            ->map(fn($r) => ['provider' => $r->provider, 'count' => (int) $r->cnt, 'revenue' => (int) $r->revenue]);

        $byService = Order::selectRaw('service_name, COUNT(*) as cnt')
            ->groupBy('service_name')
            ->orderByDesc('cnt')
            ->limit(10)
            ->get()
            ->map(fn($r) => ['service' => $r->service_name, 'count' => (int) $r->cnt]);

        return response()->json([
            'by_day'      => $byDay,
            'by_provider' => $byProvider,
            'by_service'  => $byService,
        ]);
    }

    public function users(Request $request): JsonResponse
    {
        $days = min((int) $request->get('days', 30), 90);
        $from = now()->subDays($days)->startOfDay();

        $byDay = User::where('created_at', '>=', $from)
            ->selectRaw("DATE(created_at) as day, COUNT(*) as count")
            ->groupBy('day')
            ->orderBy('day')
            ->get()
            ->map(fn($r) => ['day' => $r->day, 'count' => (int) $r->count]);

        return response()->json([
            'by_day'    => $byDay,
            'total_30d' => User::where('created_at', '>=', now()->subDays(30))->count(),
            'total_7d'  => User::where('created_at', '>=', now()->subDays(7))->count(),
            'total_all' => User::count(),
        ]);
    }
}
