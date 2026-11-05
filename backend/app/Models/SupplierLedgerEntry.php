<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SupplierLedgerEntry extends Model
{
    protected $fillable = [
        'vendor_id',
        'idempotency_key',
        'entry_type',
        'amount_kobo',
        'description',
        'related_model_type',
        'related_model_id',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'amount_kobo' => 'integer',
            'metadata'    => 'array',
        ];
    }

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class);
    }
}
