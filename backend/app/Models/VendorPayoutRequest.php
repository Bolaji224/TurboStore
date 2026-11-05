<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class VendorPayoutRequest extends Model
{
    protected $fillable = [
        'vendor_id',
        'amount_kobo',
        'status',
        'bank_details',
        'admin_note',
        'payment_reference',
        'payout_note',
        'reviewed_by',
        'reviewed_at',
        'processed_by',
        'processed_at',
    ];

    // Status flow:
    //   pending → approved → processing → paid
    //   pending → cancelled  (admin cancels before approval)
    //   pending → rejected   (admin rejects from pending — legacy, same effect as cancelled)
    //   processing → failed  (bank transfer failed — earnings released)

    protected function casts(): array
    {
        return [
            'amount_kobo'  => 'integer',
            'bank_details' => 'array',
            'reviewed_at'  => 'datetime',
            'processed_at' => 'datetime',
        ];
    }

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class);
    }

    public function reviewedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function processedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'processed_by');
    }

    public function payoutItems(): HasMany
    {
        return $this->hasMany(VendorPayoutItem::class);
    }
}
