<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReferralReward extends Model
{
    protected $fillable = [
        'referrer_id',
        'referral_id',
        'milestone',
        'status',
        'redeemed_order_id',
        'redeemed_at',
    ];

    protected $casts = [
        'milestone'    => 'integer',
        'redeemed_at'  => 'datetime',
    ];

    public function referrer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'referrer_id');
    }

    public function referral(): BelongsTo
    {
        return $this->belongsTo(ReferralRelationship::class, 'referral_id');
    }

    public function redeemedOrder(): BelongsTo
    {
        return $this->belongsTo(Order::class, 'redeemed_order_id');
    }

    public function isAvailable(): bool
    {
        return $this->status === 'available';
    }

    public function isPendingUse(): bool
    {
        return $this->status === 'pending_use';
    }

    public function isRedeemed(): bool
    {
        return $this->status === 'redeemed';
    }
}
