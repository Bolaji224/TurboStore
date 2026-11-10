<?php

namespace App\Jobs;

use App\Mail\LaunchAnnouncementMail;
use App\Models\WaitlistSubscriber as WS;
use App\Services\LaunchCampaignService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

/**
 * Sends one launch email.
 *
 * Duplicate-safety: the row is claimed (queued → sending) under a row lock
 * and only rows in `queued` belonging to this job's batch are processed, so
 * re-dispatched or concurrent jobs for the same subscriber are no-ops.
 */
class SendLaunchEmailJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int   $tries   = 3;
    public array $backoff = [120, 600];
    public int   $timeout = 60;

    public function __construct(public int $subscriberId, public string $batchId) {}

    public function handle(LaunchCampaignService $campaign): void
    {
        // ── 1. Claim the row + onboard the account (one transaction) ──────────
        $prepared = DB::transaction(function () use ($campaign) {
            $sub = WS::lockForUpdate()->find($this->subscriberId);

            if (!$sub
                || $sub->launch_email_status !== WS::QUEUED
                || $sub->launch_batch_id !== $this->batchId) {
                return null; // already sent, skipped, re-batched or claimed elsewhere
            }

            $cta = $campaign->prepareRecipient($sub);

            if ($cta === null) {      // e.g. suspended account → marked skipped
                $sub->save();
                return null;
            }

            $sub->launch_email_status = WS::SENDING;
            $sub->launch_email_attempts++;
            $sub->save();

            return [$sub, $cta];
        });

        if (!$prepared) {
            return;
        }

        [$sub, $cta] = $prepared;

        // ── 2. Deliver (outside the transaction — SMTP can be slow) ───────────
        try {
            Mail::to($sub->email)->send(new LaunchAnnouncementMail(
                name:      $sub->first_name ?: $sub->user?->name,
                email:     $sub->email,
                mode:      $cta['mode'],
                ctaUrl:    $cta['cta_url'],
                expiresAt: $cta['expires_at']?->format('j M Y'),
            ));
        } catch (\Throwable $e) {
            // Hand the row back so the queue's automatic retry can re-claim it.
            $sub->update([
                'launch_email_status'     => WS::QUEUED,
                'launch_email_last_error' => Str::limit($e->getMessage(), 1000),
            ]);
            Log::warning('Launch email attempt failed', [
                'subscriber_id' => $sub->id,
                'attempt'       => $this->attempts(),
                'error'         => $e->getMessage(),
            ]);
            throw $e;
        }

        $sub->update([
            'launch_email_status'     => WS::SENT,
            'launch_email_sent_at'    => now(),
            'launch_email_last_error' => null,
        ]);
    }

    /** All retries exhausted — park as failed for the admin "Retry failed" action. */
    public function failed(\Throwable $e): void
    {
        WS::whereKey($this->subscriberId)
            ->where('launch_batch_id', $this->batchId)
            ->whereIn('launch_email_status', [WS::QUEUED, WS::SENDING])
            ->update([
                'launch_email_status'     => WS::FAILED,
                'launch_email_last_error' => Str::limit($e->getMessage(), 1000),
                'updated_at'              => now(),
            ]);

        Log::error('Launch email failed permanently', [
            'subscriber_id' => $this->subscriberId,
            'error'         => $e->getMessage(),
        ]);
    }
}
