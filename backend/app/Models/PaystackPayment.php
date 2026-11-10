<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PaystackPayment extends Model
{
    protected $fillable = [
        'user_id',
        'reference',
        'amount',
        'status',
        'paystack_data',
        'verified_at',
        'flag_reason',
        'verification_attempts',
        'last_verification_at',
    ];

    protected $casts = [
        'paystack_data'         => 'array',
        'verified_at'           => 'datetime',
        'last_verification_at'  => 'datetime',
        'verification_attempts' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
