<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    protected $fillable = [
        'reference',
        'user_id',
        'provider',
        'provider_order_id',
        'country',
        'service',
        'service_name',
        'phone_number',
        'customer_price',
        'provider_cost',
        'status',
        'otp',
        'idempotency_key',
        'reward_id',
        'expires_at',
        'cancelled_at',
        'refunded_at',
    ];

    protected $casts = [
        'customer_price' => 'integer',
        'provider_cost'  => 'float',
        'expires_at'     => 'datetime',
        'cancelled_at'   => 'datetime',
        'refunded_at'    => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function walletTransactions(): HasMany
    {
        return $this->hasMany(WalletTransaction::class);
    }

    public static function generateReference(): string
    {
        $last = static::max('id') ?? 0;
        return 'TS-' . str_pad($last + 1, 6, '0', STR_PAD_LEFT);
    }

    /** Human-readable price formatted as ₦X,XXX */
    public function formattedPrice(): string
    {
        return '₦' . number_format($this->customer_price / 100, 0);
    }

    public function isActive(): bool
    {
        return in_array($this->status, ['processing', 'waiting_for_otp', 'otp_received']);
    }

    public function isTerminal(): bool
    {
        return in_array($this->status, ['completed', 'cancelled', 'expired', 'failed', 'refunded']);
    }
}
