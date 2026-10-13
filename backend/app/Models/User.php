<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\HasMany;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Tymon\JWTAuth\Contracts\JWTSubject;

class User extends Authenticatable implements JWTSubject
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'google_id',
        'wallet_balance',
        'referral_code',
        'referred_by',
        'admin_role',
        'is_suspended',
        'suspended_at',
        'suspension_reason',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password'          => 'hashed',
            'is_suspended'      => 'boolean',
            'suspended_at'      => 'datetime',
        ];
    }

    public function isAdmin(): bool
    {
        return !is_null($this->admin_role);
    }

    public function isSuperAdmin(): bool
    {
        return $this->admin_role === 'super_admin';
    }

    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    public function getJWTCustomClaims(): array
    {
        return [];
    }

    public function passkeys(): HasMany
    {
        return $this->hasMany(\App\Models\Passkey::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(\App\Models\Order::class);
    }

    public function walletTransactions(): HasMany
    {
        return $this->hasMany(\App\Models\WalletTransaction::class);
    }

    public function referrals(): HasMany
    {
        return $this->hasMany(\App\Models\ReferralRelationship::class, 'referrer_id');
    }

    /** Wallet balance in NGN (float). */
    public function walletBalanceNaira(): float
    {
        return $this->wallet_balance / 100;
    }

}
