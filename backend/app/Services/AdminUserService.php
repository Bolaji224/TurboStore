<?php

namespace App\Services;

use App\Models\Order;
use App\Models\User;
use App\Models\WalletTransaction;
use Illuminate\Pagination\LengthAwarePaginator;

class AdminUserService
{
    public function __construct(
        private WalletService   $walletService,
        private AuditLogService $auditLog,
    ) {}

    public function list(array $filters = [], int $perPage = 20): LengthAwarePaginator
    {
        $q = User::query();

        if (!empty($filters['search'])) {
            $s = $filters['search'];
            $q->where(fn($q) => $q->where('name', 'like', "%{$s}%")->orWhere('email', 'like', "%{$s}%"));
        }

        if (isset($filters['is_suspended'])) {
            $q->where('is_suspended', (bool) $filters['is_suspended']);
        }

        if (!empty($filters['sort'])) {
            $dir = ($filters['dir'] ?? 'desc') === 'asc' ? 'asc' : 'desc';
            $allowed = ['created_at', 'wallet_balance', 'name', 'email'];
            if (in_array($filters['sort'], $allowed)) {
                $q->orderBy($filters['sort'], $dir);
            }
        } else {
            $q->latest();
        }

        return $q->paginate($perPage);
    }

    public function detail(User $user): array
    {
        $orders = Order::where('user_id', $user->id)->latest()->limit(10)->get();
        $txns   = WalletTransaction::where('user_id', $user->id)->latest()->limit(10)->get();

        return [
            'user'         => $this->formatUser($user),
            'orders'       => $orders,
            'transactions' => $txns,
            'stats' => [
                'total_orders'    => Order::where('user_id', $user->id)->count(),
                'total_deposited' => (int) WalletTransaction::where('user_id', $user->id)->where('type', 'deposit')->sum('amount'),
                'total_spent'     => abs((int) WalletTransaction::where('user_id', $user->id)->where('type', 'purchase')->sum('amount')),
            ],
        ];
    }

    public function suspend(User $target, string $reason, User $admin): void
    {
        $target->update([
            'is_suspended'      => true,
            'suspended_at'      => now(),
            'suspension_reason' => $reason,
        ]);
        $this->auditLog->log($admin, 'user.suspend', $target, ['reason' => $reason]);
    }

    public function restore(User $target, User $admin): void
    {
        $target->update([
            'is_suspended'      => false,
            'suspended_at'      => null,
            'suspension_reason' => null,
        ]);
        $this->auditLog->log($admin, 'user.restore', $target);
    }

    public function adjustWallet(User $target, int $amountKobo, string $description, User $admin): void
    {
        \Illuminate\Support\Facades\DB::transaction(function () use ($target, $amountKobo, $description, $admin) {
            if ($amountKobo > 0) {
                $this->walletService->credit($target, $amountKobo, 'admin_credit', $description);
            } elseif ($amountKobo < 0) {
                $this->walletService->deduct($target, abs($amountKobo), $description);
            }
            $this->auditLog->log($admin, 'wallet.adjust', $target, ['amount_kobo' => $amountKobo, 'description' => $description]);
        });
    }

    public function formatUser(User $user): array
    {
        return [
            'id'               => $user->id,
            'name'             => $user->name,
            'email'            => $user->email,
            'wallet_balance'   => (int) $user->wallet_balance,
            'wallet_naira'     => round($user->wallet_balance / 100, 2),
            'admin_role'       => $user->admin_role,
            'is_suspended'     => (bool) $user->is_suspended,
            'suspended_at'     => $user->suspended_at,
            'suspension_reason'=> $user->suspension_reason,
            'referral_code'    => $user->referral_code,
            'email_verified_at'=> $user->email_verified_at,
            'created_at'       => $user->created_at,
        ];
    }
}
