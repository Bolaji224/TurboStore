<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReferralPurchaseLog extends Model
{
    protected $fillable = [
        'referral_id',
        'order_id',
    ];

    public function referral(): BelongsTo
    {
        return $this->belongsTo(ReferralRelationship::class, 'referral_id');
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }
}
