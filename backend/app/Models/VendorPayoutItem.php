<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VendorPayoutItem extends Model
{
    protected $fillable = [
        'vendor_payout_request_id',
        'vendor_earning_id',
        'amount_kobo',
    ];

    protected function casts(): array
    {
        return [
            'amount_kobo' => 'integer',
        ];
    }

    public function payoutRequest(): BelongsTo
    {
        return $this->belongsTo(VendorPayoutRequest::class, 'vendor_payout_request_id');
    }

    public function earning(): BelongsTo
    {
        return $this->belongsTo(VendorEarning::class, 'vendor_earning_id');
    }
}
