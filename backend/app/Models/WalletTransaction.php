<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WalletTransaction extends Model
{
    protected $fillable = [
        'user_id',
        'order_id',
        'type',
        'amount',
        'balance_before',
        'balance_after',
        'reference',
        'description',
    ];

    protected $casts = [
        'amount'         => 'integer',
        'balance_before' => 'integer',
        'balance_after'  => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function isCredit(): bool
    {
        return $this->amount > 0;
    }

    public function formattedAmount(): string
    {
        $prefix = $this->isCredit() ? '+' : '';
        return $prefix . '₦' . number_format(abs($this->amount) / 100, 0);
    }

    public function formattedBalance(): string
    {
        return '₦' . number_format($this->balance_after / 100, 0);
    }
}
