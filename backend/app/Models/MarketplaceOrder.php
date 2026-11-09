<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Str;

class MarketplaceOrder extends Model
{
    protected $fillable = [
        'reference',
        'user_id',
        'vendor_id',
        'service_id',
        'price_kobo',
        'commission_rate',
        'commission_kobo',
        'vendor_earning_kobo',
        'status',
        'requirements_provided',
        'account_credentials',
        'idempotency_key',
        'paid_at',
        'delivered_at',
        'completed_at',
        'cancelled_at',
        'disputed_at',
        'auto_complete_at',
    ];

    protected function casts(): array
    {
        return [
            'price_kobo'          => 'integer',
            'commission_kobo'     => 'integer',
            'vendor_earning_kobo' => 'integer',
            'account_credentials' => 'encrypted:array',
            'paid_at'             => 'datetime',
            'delivered_at'        => 'datetime',
            'completed_at'        => 'datetime',
            'cancelled_at'        => 'datetime',
            'disputed_at'         => 'datetime',
            'auto_complete_at'    => 'datetime',
        ];
    }

    // -------------------------------------------------------------------------
    // Static helpers
    // -------------------------------------------------------------------------

    public static function generateReference(): string
    {
        do {
            $reference = 'MO-' . strtoupper(Str::random(8));
        } while (static::where('reference', $reference)->exists());

        return $reference;
    }

    // -------------------------------------------------------------------------
    // Relationships
    // -------------------------------------------------------------------------

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class);
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(MarketplaceService::class, 'service_id');
    }

    public function events(): HasMany
    {
        return $this->hasMany(MarketplaceOrderEvent::class);
    }

    public function earning(): HasOne
    {
        return $this->hasOne(VendorEarning::class);
    }

    public function review(): HasOne
    {
        return $this->hasOne(MarketplaceReview::class);
    }

    public function dispute(): HasOne
    {
        return $this->hasOne(MarketplaceDispute::class);
    }

    // -------------------------------------------------------------------------
    // Accessors
    // -------------------------------------------------------------------------

    public function isOwnedBy(User $user): bool
    {
        return $this->user_id === $user->id;
    }
}
