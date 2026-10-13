<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\Order;
use App\Models\User;
use App\Models\WalletTransaction;
use Illuminate\Support\Facades\DB;

class AdminDashboardService
{
    public function overview(): array
    {
        $now   = now();
        $today = $now->copy()->startOfDay();
        $week  = $now->copy()->subDays(7)->startOfDay();
        $month = $now->copy()->startOfMonth();

        $totalUsers    = User::count();
        $newUsersToday = User::where('created_at', '>=', $today)->count();
        $newUsersWeek  = User::where('created_at', '>=', $week)->count();

        $totalOrders    = Order::count();
        $ordersToday    = Order::where('created_at', '>=', $today)->count();
        $activeOrders   = Order::whereIn('status', ['processing', 'waiting_for_otp'])->count();

        $revenueMonth = (int) WalletTransaction::where('type', 'deposit')
            ->where('created_at', '>=', $month)
            ->sum('amount');

        $revenueTotal = (int) WalletTransaction::where('type', 'deposit')->sum('amount');

        $totalWalletBalance = (int) User::sum('wallet_balance');

        $ordersByStatus = Order::selectRaw('status, count(*) as cnt')
            ->groupBy('status')
            ->pluck('cnt', 'status');

        $revenueByDay = WalletTransaction::where('type', 'deposit')
            ->where('created_at', '>=', $week)
            ->selectRaw("DATE(created_at) as day, SUM(amount) as total")
            ->groupBy('day')
            ->orderBy('day')
            ->get()
            ->map(fn($r) => ['day' => $r->day, 'total' => (int) $r->total]);

        return [
            'users' => [
                'total'     => $totalUsers,
                'new_today' => $newUsersToday,
                'new_week'  => $newUsersWeek,
            ],
            'orders' => [
                'total'   => $totalOrders,
                'today'   => $ordersToday,
                'active'  => $activeOrders,
                'by_status' => $ordersByStatus,
            ],
            'revenue' => [
                'total'        => $revenueTotal,
                'this_month'   => $revenueMonth,
                'by_day_7d'    => $revenueByDay,
            ],
            'wallet' => [
                'total_balance' => $totalWalletBalance,
            ],
        ];
    }

    public function recentActivity(int $limit = 20): array
    {
        $recentOrders = Order::with('user:id,name,email')
            ->latest()
            ->limit($limit)
            ->get()
            ->map(fn($o) => [
                'type'       => 'order',
                'id'         => $o->id,
                'reference'  => $o->reference,
                'user'       => ['name' => $o->user?->name, 'email' => $o->user?->email],
                'status'     => $o->status,
                'amount'     => $o->customer_price,
                'created_at' => $o->created_at,
            ]);

        $recentUsers = User::latest()
            ->limit(10)
            ->get(['id', 'name', 'email', 'created_at'])
            ->map(fn($u) => [
                'type'       => 'registration',
                'id'         => $u->id,
                'user'       => ['name' => $u->name, 'email' => $u->email],
                'created_at' => $u->created_at,
            ]);

        return $recentOrders->concat($recentUsers)
            ->sortByDesc('created_at')
            ->values()
            ->take($limit)
            ->toArray();
    }
}
