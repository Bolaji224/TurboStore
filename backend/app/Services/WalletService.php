<?php

namespace App\Services;

use App\Models\Order;
use App\Models\User;
use App\Models\WalletTransaction;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class WalletService
{
    public function __construct(private NotificationService $notificationService) {}
    public function getBalance(User $user): int
    {
        return (int) $user->wallet_balance;
    }

    /**
     * Credit the wallet (e.g. after deposit or refund).
     * Runs inside its own DB transaction; safe to call from within an outer transaction too.
     */
    public function credit(User $user, int $amount, string $type, string $description, ?int $orderId = null): WalletTransaction
    {
        $tx = DB::transaction(function () use ($user, $amount, $type, $description, $orderId) {
            $user          = User::lockForUpdate()->find($user->id);
            $balanceBefore = (int) $user->wallet_balance;
            $balanceAfter  = $balanceBefore + $amount;

            $user->update(['wallet_balance' => $balanceAfter]);

            return WalletTransaction::create([
                'user_id'        => $user->id,
                'order_id'       => $orderId,
                'type'           => $type,
                'amount'         => $amount,
                'balance_before' => $balanceBefore,
                'balance_after'  => $balanceAfter,
                'reference'      => $this->generateRef(),
                'description'    => $description,
            ]);
        });

        if ($type === 'deposit') {
            try {
                $this->notificationService->walletFunded($user, $amount);
            } catch (\Throwable) {}
        }

        return $tx;
    }

    /**
     * Deduct funds from the wallet.
     * Throws \RuntimeException if balance is insufficient.
     * Must be called INSIDE an outer DB::transaction() for purchase flows.
     */
    public function deduct(User $user, int $amount, string $description, ?int $orderId = null): WalletTransaction
    {
        $user = User::lockForUpdate()->find($user->id);

        if ((int) $user->wallet_balance < $amount) {
            throw new \RuntimeException('Insufficient wallet balance');
        }

        $balanceBefore = (int) $user->wallet_balance;
        $balanceAfter  = $balanceBefore - $amount;

        $user->update(['wallet_balance' => $balanceAfter]);

        return WalletTransaction::create([
            'user_id'        => $user->id,
            'order_id'       => $orderId,
            'type'           => 'purchase',
            'amount'         => -$amount,
            'balance_before' => $balanceBefore,
            'balance_after'  => $balanceAfter,
            'reference'      => $this->generateRef(),
            'description'    => $description,
        ]);
    }

    /** Refund the full customer_price of an order back to the wallet. */
    public function refundOrder(User $user, Order $order): WalletTransaction
    {
        return $this->credit(
            $user,
            $order->customer_price,
            'refund',
            "Refund — {$order->service_name} ({$order->country})",
            $order->id,
        );
    }

    /** Summary stats for the wallet page. */
    public function summary(User $user): array
    {
        $txns = WalletTransaction::where('user_id', $user->id)->get();

        $deposited = $txns->where('type', 'deposit')->sum('amount');
        $spent     = $txns->whereIn('type', ['purchase'])->sum(fn($t) => abs($t->amount));
        $refunded  = $txns->where('type', 'refund')->sum('amount');

        return [
            'balance'          => (int) $user->wallet_balance,
            'total_deposited'  => (int) $deposited,
            'total_spent'      => (int) $spent,
            'total_refunded'   => (int) $refunded,
        ];
    }

    private function generateRef(): string
    {
        return 'WLT-' . strtoupper(Str::random(12));
    }
}
