<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ReferralRelationship extends Model
{
    protected $fillable = [
        'referrer_id',
        'referred_id',
        'referral_code_used',
        'eligible_purchases',
    ];

    protected $casts = [
        'eligible_purchases' => 'integer',
    ];

    public function referrer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'referrer_id');
    }

    public function referred(): BelongsTo
    {
        return $this->belongsTo(User::class, 'referred_id');
    }

    public function purchaseLogs(): HasMany
    {
        return $this->hasMany(ReferralPurchaseLog::class, 'referral_id');
    }

    public function rewards(): HasMany
    {
        return $this->hasMany(ReferralReward::class, 'referral_id');
    }

    /** Number of purchases until the next milestone. */
    public function purchasesToNextReward(): int
    {
        $progress = $this->eligible_purchases % ReferralService::PURCHASES_PER_REWARD;
        return ReferralService::PURCHASES_PER_REWARD - $progress;
    }

    /** Progress within the current milestone window (0–9). */
    public function currentWindowProgress(): int
    {
        return $this->eligible_purchases % ReferralService::PURCHASES_PER_REWARD;
    }

    /** Masked email for safe display (e.g. jo***@example.com). */
    public function referredMaskedEmail(): string
    {
        $email = $this->referred?->email ?? '';
        if (!$email) return 'Unknown';

        [$local, $domain] = explode('@', $email, 2);
        $masked = substr($local, 0, min(2, strlen($local))) . '***';
        return $masked . '@' . $domain;
    }
}
