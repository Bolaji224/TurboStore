<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WaitlistSubscriber extends Model
{
    // Launch email statuses
    public const PENDING = 'pending';
    public const QUEUED  = 'queued';
    public const SENDING = 'sending';
    public const SENT    = 'sent';
    public const FAILED  = 'failed';
    public const SKIPPED = 'skipped';

    // Account statuses
    public const ACCOUNT_EXISTING_VERIFIED   = 'existing_verified';
    public const ACCOUNT_EXISTING_UNVERIFIED = 'existing_unverified';
    public const ACCOUNT_CREATED             = 'created';

    protected $fillable = [
        'email',
        'first_name',
        'source',
        'external_id',
        'marketing_consent',
        'subscribed_at',
        'user_id',
        'account_status',
        'account_created_at',
        'activation_token_hash',
        'activation_expires_at',
        'activated_at',
        'launch_email_status',
        'launch_batch_id',
        'launch_email_queued_at',
        'launch_email_sent_at',
        'launch_email_attempts',
        'launch_email_last_error',
        'skip_reason',
    ];

    protected $hidden = ['activation_token_hash'];

    protected $casts = [
        'subscribed_at'          => 'datetime',
        'account_created_at'     => 'datetime',
        'activation_expires_at'  => 'datetime',
        'activated_at'           => 'datetime',
        'launch_email_queued_at' => 'datetime',
        'launch_email_sent_at'   => 'datetime',
        'launch_email_attempts'  => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public static function normalizeEmail(string $email): string
    {
        return strtolower(trim($email));
    }

    /** True while an account we created is still waiting for its owner to set a password. */
    public function awaitingActivation(): bool
    {
        return $this->account_status === self::ACCOUNT_CREATED && $this->activated_at === null;
    }
}
