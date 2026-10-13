<?php

namespace App\Http\Controllers;

use App\Models\WalletTransaction;
use App\Services\WalletService;

class WalletController extends Controller
{
    public function __construct(private WalletService $walletService) {}

    /** GET /api/wallet */
    public function show()
    {
        $user    = auth()->user();
        $summary = $this->walletService->summary($user);

        return response()->json([
            'balance'         => $summary['balance'],
            'balance_naira'   => $summary['balance'] / 100,
            'total_deposited' => $summary['total_deposited'],
            'total_spent'     => $summary['total_spent'],
            'total_refunded'  => $summary['total_refunded'],
        ]);
    }

    /** GET /api/wallet/transactions */
    public function transactions()
    {
        $user = auth()->user();

        $txns = WalletTransaction::where('user_id', $user->id)
                                  ->orderByDesc('created_at')
                                  ->paginate(30);

        return response()->json([
            'transactions' => $txns->map(fn($t) => [
                'id'             => $t->id,
                'type'           => $t->type,
                'amount'         => $t->amount,
                'formatted'      => $t->formattedAmount(),
                'balance_after'  => $t->balance_after,
                'balance_fmt'    => $t->formattedBalance(),
                'reference'      => $t->reference,
                'description'    => $t->description,
                'order_id'       => $t->order_id,
                'created_at'     => $t->created_at->toIso8601String(),
            ]),
            'meta' => [
                'current_page' => $txns->currentPage(),
                'last_page'    => $txns->lastPage(),
                'total'        => $txns->total(),
            ],
        ]);
    }
}
