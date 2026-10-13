<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\WalletTransaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminTransactionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $q = WalletTransaction::with('user:id,name,email')->latest();

        if ($s = $request->get('search')) {
            $q->where(fn($q) => $q
                ->where('reference', 'like', "%{$s}%")
                ->orWhere('description', 'like', "%{$s}%")
                ->orWhereHas('user', fn($q) => $q->where('email', 'like', "%{$s}%")->orWhere('name', 'like', "%{$s}%"))
            );
        }

        if ($type = $request->get('type')) {
            $q->where('type', $type);
        }

        $txns = $q->paginate((int) $request->get('per_page', 25));

        return response()->json([
            'transactions' => $txns->map(fn($t) => [
                'id'             => $t->id,
                'reference'      => $t->reference,
                'user'           => $t->user ? ['id' => $t->user->id, 'name' => $t->user->name, 'email' => $t->user->email] : null,
                'type'           => $t->type,
                'amount'         => $t->amount,
                'balance_before' => $t->balance_before,
                'balance_after'  => $t->balance_after,
                'description'    => $t->description,
                'created_at'     => $t->created_at,
            ]),
            'meta' => [
                'total'        => $txns->total(),
                'per_page'     => $txns->perPage(),
                'current_page' => $txns->currentPage(),
                'last_page'    => $txns->lastPage(),
            ],
        ]);
    }
}
