<?php

namespace App\Services;

use App\Jobs\DispatchLaunchCampaignJob;
use App\Models\Setting;
use App\Models\User;
use App\Models\WaitlistSubscriber as WS;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;

/**
 * Waitlist → launch campaign orchestration.
 *
 * Delivery state machine per subscriber:
 *   pending ─(admin sends)→ queued ─(job claims)→ sending ─→ sent
 *                                                     └──→ queued (retry) ─→ failed
 *   pending ─(unsubscribed / suspended)→ skipped
 */
class LaunchCampaignService
{
    public function __construct(private KlaviyoWaitlistClient $klaviyo) {}

    // ── Sync ──────────────────────────────────────────────────────────────────

    /**
     * Pull the waitlist from Klaviyo into waitlist_subscribers. Idempotent:
     * matches on Klaviyo id, then email. Never resets delivery state of anyone
     * already queued/sent.
     */
    public function syncFromKlaviyo(): array
    {
        $stats = ['fetched' => 0, 'created' => 0, 'updated' => 0, 'invalid' => 0, 'unsubscribed' => 0];

        foreach ($this->klaviyo->profiles() as $p) {
            $stats['fetched']++;

            $email = WS::normalizeEmail((string) $p['email']);
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                $stats['invalid']++;
                continue;
            }

            $row = ($p['external_id'] !== '' ? WS::where('external_id', $p['external_id'])->first() : null)
                ?? WS::where('email', $email)->first()
                ?? new WS(['email' => $email, 'source' => 'klaviyo', 'launch_email_status' => WS::PENDING]);

            $isNew = !$row->exists;

            $row->external_id       = $p['external_id'] ?: $row->external_id;
            $row->marketing_consent = $p['consent'];
            $row->first_name      ??= $this->cleanName($p['first_name']);
            $row->subscribed_at   ??= $p['created'] ? Carbon::parse($p['created']) : null;
            if ($isNew) {
                $row->email = $email;
            }

            $unsubscribed = strtoupper((string) $p['consent']) === 'UNSUBSCRIBED';
            if ($unsubscribed) {
                $stats['unsubscribed']++;
            }

            // Respect opt-outs, but only for people we haven't emailed yet.
            if ($unsubscribed && $row->launch_email_status === WS::PENDING) {
                $row->launch_email_status = WS::SKIPPED;
                $row->skip_reason         = 'unsubscribed';
            } elseif (!$unsubscribed && $row->launch_email_status === WS::SKIPPED && $row->skip_reason === 'unsubscribed') {
                $row->launch_email_status = WS::PENDING;
                $row->skip_reason         = null;
            }

            if ($isNew || $row->isDirty()) {
                $row->save();
                $isNew ? $stats['created']++ : $stats['updated']++;
            }
        }

        Setting::set('waitlist_last_sync', json_encode($stats + ['at' => now()->toIso8601String()]), 'json', 'Last Klaviyo waitlist sync');

        return $stats;
    }

    // ── Stats ─────────────────────────────────────────────────────────────────

    public function stats(): array
    {
        $byStatus = WS::select('launch_email_status', DB::raw('count(*) as c'))
            ->groupBy('launch_email_status')->pluck('c', 'launch_email_status');

        $s = fn (string $k) => (int) ($byStatus[$k] ?? 0);

        // Accounts that already exist for *pending* subscribers (preview before sending)
        $pendingWithAccount = WS::where('launch_email_status', WS::PENDING)
            ->whereExists(fn ($q) => $q->select(DB::raw(1))->from('users')
                ->whereRaw('LOWER(users.email) = waitlist_subscribers.email'))
            ->count();

        $lastSync = Setting::get('waitlist_last_sync');

        return [
            'total_waitlist'          => WS::count(),
            'eligible'                => $s(WS::PENDING),
            'existing_accounts'       => WS::whereIn('account_status', [WS::ACCOUNT_EXISTING_VERIFIED, WS::ACCOUNT_EXISTING_UNVERIFIED])->count()
                                         + $pendingWithAccount,
            'accounts_created'        => WS::where('account_status', WS::ACCOUNT_CREATED)->count(),
            'accounts_activated'      => WS::whereNotNull('activated_at')->count(),
            'sent'                    => $s(WS::SENT),
            'pending_delivery'        => $s(WS::QUEUED) + $s(WS::SENDING),
            'failed'                  => $s(WS::FAILED),
            'skipped'                 => $s(WS::SKIPPED),
            'retryable'               => $this->retryableQuery()->count(),
            'last_sync'               => is_string($lastSync) ? json_decode($lastSync, true) : $lastSync,
            'klaviyo_configured'      => $this->klaviyo->isConfigured(),
            'batch_size'              => (int) config('waitlist.launch.batch_size'),
            'batch_delay_seconds'     => (int) config('waitlist.launch.batch_delay_seconds'),
        ];
    }

    // ── Queueing ──────────────────────────────────────────────────────────────

    /**
     * Atomically moves every pending subscriber to `queued` under a new batch
     * id and hands the batch to a background dispatcher. A second call finds
     * nothing pending and queues nothing.
     */
    public function queueEligible(): array
    {
        return $this->queue(WS::where('launch_email_status', WS::PENDING));
    }

    /** Re-queues failed rows and rows stuck in queued/sending (worker crash). */
    public function retryFailed(): array
    {
        return $this->queue($this->retryableQuery());
    }

    private function retryableQuery()
    {
        $staleBefore = now()->subMinutes((int) config('waitlist.launch.stale_after_minutes'));

        return WS::where(function ($q) use ($staleBefore) {
            $q->where('launch_email_status', WS::FAILED)
              ->orWhere(fn ($q) => $q->whereIn('launch_email_status', [WS::QUEUED, WS::SENDING])
                                     ->where('updated_at', '<', $staleBefore));
        });
    }

    private function queue($query): array
    {
        $batchId = (string) Str::uuid();

        $count = $query->update([
            'launch_email_status'    => WS::QUEUED,
            'launch_batch_id'        => $batchId,
            'launch_email_queued_at' => now(),
            'updated_at'             => now(),
        ]);

        if ($count > 0) {
            DispatchLaunchCampaignJob::dispatch($batchId);
        }

        return ['batch_id' => $count > 0 ? $batchId : null, 'queued' => $count];
    }

    // ── Per-recipient onboarding (called by SendLaunchEmailJob) ────────────────

    /**
     * Resolves or creates the platform account for a claimed subscriber and
     * returns how the email should direct them. Must be called inside the
     * job's transaction with the subscriber row locked.
     *
     * @return array{mode:string, cta_url:string, expires_at:?Carbon}|null  null → skip
     */
    public function prepareRecipient(WS $sub): ?array
    {
        $user = $sub->user_id ? User::find($sub->user_id) : null;
        $user ??= User::whereRaw('LOWER(email) = ?', [$sub->email])->first();

        if (!$user) {
            [$user, $created] = $this->createAccount($sub);
            if ($created) {
                $sub->account_status     = WS::ACCOUNT_CREATED;
                $sub->account_created_at = now();
            }
        }

        if ($sub->account_status !== WS::ACCOUNT_CREATED) {
            $sub->account_status = $user->hasVerifiedEmail()
                ? WS::ACCOUNT_EXISTING_VERIFIED
                : WS::ACCOUNT_EXISTING_UNVERIFIED;
        }

        $sub->user_id = $user->id;

        if ($user->is_suspended) {
            $sub->launch_email_status = WS::SKIPPED;
            $sub->skip_reason         = 'account_suspended';
            return null;
        }

        $frontend = rtrim((string) config('app.frontend_url'), '/');
        $ttlDays  = max(1, (int) config('waitlist.launch.activation_ttl_days'));

        // Scenario B — account created for them, password not yet chosen.
        if ($sub->awaitingActivation()) {
            $token = Str::random(64);
            $sub->activation_token_hash = hash('sha256', $token);
            $sub->activation_expires_at = now()->addDays($ttlDays);

            return [
                'mode'       => 'activate',
                'cta_url'    => $frontend . '/activate-account?' . http_build_query(['token' => $token, 'email' => $sub->email]),
                'expires_at' => $sub->activation_expires_at,
            ];
        }

        // Scenario C — existing account, email not verified: reuse the existing
        // signed verification endpoint, with a lifetime suited to a launch email.
        if (!$user->hasVerifiedEmail()) {
            $expires = now()->addDays($ttlDays);
            return [
                'mode'       => 'verify',
                'cta_url'    => URL::temporarySignedRoute('verification.verify', $expires, [
                    'id'   => $user->getKey(),
                    'hash' => sha1($user->getEmailForVerification()),
                ]),
                'expires_at' => $expires,
            ];
        }

        // Scenario A — existing active account: just sign in.
        return ['mode' => 'login', 'cta_url' => $frontend . '/login', 'expires_at' => null];
    }

    /** @return array{0: User, 1: bool} [user, wasCreatedNow] */
    private function createAccount(WS $sub): array
    {
        try {
            // Nested transaction = savepoint, so a unique violation does not
            // poison the caller's transaction on PostgreSQL.
            return [DB::transaction(fn () => User::create([
                'name'          => $sub->first_name ?: $this->nameFromEmail($sub->email),
                'email'         => $sub->email,
                'user_type'     => 'consumer',
                // Unknown, never-shared random password: the account cannot be
                // signed into until the owner sets a password via activation
                // (or the standard forgot-password flow).
                'password'      => Str::random(64),
                'referral_code' => strtoupper(Str::random(8)),
            ])), true];
        } catch (UniqueConstraintViolationException $e) {
            // They registered between our lookup and insert — use that account.
            $existing = User::whereRaw('LOWER(email) = ?', [$sub->email])->first();
            if (!$existing) throw $e;
            return [$existing, false];
        }
    }

    private function cleanName(?string $name): ?string
    {
        $name = trim(strip_tags((string) $name));
        return $name === '' ? null : Str::limit($name, 100, '');
    }

    private function nameFromEmail(string $email): string
    {
        $local = Str::before($email, '@');
        $words = trim(preg_replace('/[^a-z]+/i', ' ', $local));
        return $words !== '' ? Str::title(Str::limit($words, 60, '')) : 'TurboStore User';
    }
}
