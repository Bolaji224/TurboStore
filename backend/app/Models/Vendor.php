<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Vendor extends Model
{
    protected $fillable = [
        'user_id',
        'business_name',
        'bio',
        'status',
        'commission_rate',
        'approved_at',
        'approved_by',
        'rejection_reason',
        'total_earnings_kobo',
        'total_orders',
    ];

    protected function casts(): array
    {
        return [
            'total_earnings_kobo' => 'integer',
            'total_orders'        => 'integer',
            'approved_at'         => 'datetime',
            'commission_rate'     => 'integer',
        ];
    }

    // -------------------------------------------------------------------------
    // Relationships
    // -------------------------------------------------------------------------

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function services(): HasMany
    {
        return $this->hasMany(MarketplaceService::class);
    }

    public function marketplaceOrders(): HasMany
    {
        return $this->hasMany(MarketplaceOrder::class);
    }

    public function earnings(): HasMany
    {
        return $this->hasMany(VendorEarning::class);
    }

    public function payoutRequests(): HasMany
    {
        return $this->hasMany(VendorPayoutRequest::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(MarketplaceReview::class);
    }

    public function disputes(): HasMany
    {
        return $this->hasMany(MarketplaceDispute::class);
    }

    // -------------------------------------------------------------------------
    // Scopes
    // -------------------------------------------------------------------------

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeSuspended($query)
    {
        return $query->where('status', 'suspended');
    }

    // -------------------------------------------------------------------------
    // Accessors
    // -------------------------------------------------------------------------

    public function isApproved(): bool
    {
        return $this->status === 'approved';
    }

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function isSuspended(): bool
    {
        return $this->status === 'suspended';
    }
}
