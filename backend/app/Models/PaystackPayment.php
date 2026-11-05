<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PaystackPayment extends Model
{
    protected $fillable = ['user_id', 'reference', 'amount', 'status', 'paystack_data'];

    protected $casts = [
        'paystack_data' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
