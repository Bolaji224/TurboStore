<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class VendorEarning extends Model
{
    protected $fillable = [
        'vendor_id',
        'marketplace_order_id',
        'amount_kobo',
        'type',
        'status',
        'available_at',
    ];

    // Statuses:
    //   pending   — waiting for buyer confirmation or 72 h auto-release
    //   available — cleared and withdrawable
    //   reserved  — locked against an open payout request
    //   paid      — disbursed in a confirmed payout
    //   reversed  — cancelled or refunded; no longer withdrawable

    protected function casts(): array
    {
        return [
            'amount_kobo'  => 'integer',
            'available_at' => 'datetime',
        ];
    }

    // -------------------------------------------------------------------------
    // Relationships
    // -------------------------------------------------------------------------

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class);
    }

    public function marketplaceOrder(): BelongsTo
    {
        return $this->belongsTo(MarketplaceOrder::class);
    }

    public function payoutItem(): HasOne
    {
        return $this->hasOne(VendorPayoutItem::class);
    }

    // -------------------------------------------------------------------------
    // Scopes
    // -------------------------------------------------------------------------

    public function scopeAvailable($query)
    {
        return $query->where('status', 'available');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeReserved($query)
    {
        return $query->where('status', 'reserved');
    }

    public function scopePaid($query)
    {
        return $query->where('status', 'paid');
    }
}
