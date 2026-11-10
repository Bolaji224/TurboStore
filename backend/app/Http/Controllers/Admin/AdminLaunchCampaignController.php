<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Mail\LaunchAnnouncementMail;
use App\Models\User;
use App\Models\WaitlistSubscriber;
use App\Services\AuditLogService;
use App\Services\LaunchCampaignService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class AdminLaunchCampaignController extends Controller
{
    public function __construct(
        private LaunchCampaignService $campaign,
        private AuditLogService       $auditLog,
    ) {}

    /** GET /api/admin/launch-campaign */
    public function index(): JsonResponse
    {
        $recentFailures = WaitlistSubscriber::where('launch_email_status', WaitlistSubscriber::FAILED)
            ->latest('updated_at')->take(20)
            ->get(['id', 'email', 'launch_email_attempts', 'launch_email_last_error', 'updated_at']);

        return response()->json([
            'stats'           => $this->campaign->stats(),
            'recent_failures' => $recentFailures,
        ]);
    }

    /** POST /api/admin/launch-campaign/sync — super_admin. Read-only pull from Klaviyo. */
    public function sync(Request $request): JsonResponse
    {
        $lock = Cache::lock('launch-campaign:sync', 300);
        if (!$lock->get()) {
            return response()->json(['message' => 'A sync is already running.'], 409);
        }

        try {
            $result = $this->campaign->syncFromKlaviyo();
        } catch (\Throwable $e) {
            Log::error('Waitlist sync failed', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Sync failed: ' . $e->getMessage()], 502);
        } finally {
            $lock->release();
        }

        $this->auditLog->logFromRequest($request, 'launch_campaign.sync', null, $result);

        return response()->json(['message' => 'Waitlist synced.', 'result' => $result, 'stats' => $this->campaign->stats()]);
    }

    /** POST /api/admin/launch-campaign/test — sends a preview to an admin only. No records touched. */
    public function test(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => 'nullable|email',
            'mode'  => 'nullable|in:activate,verify,login',
        ]);

        $admin = $request->user();
        $to    = $data['email'] ?? $admin->email;
        $mode  = $data['mode'] ?? 'activate';

        // Previews may only go to administrator inboxes.
        $isAdminInbox = User::whereRaw('LOWER(email) = ?', [strtolower($to)])->whereNotNull('admin_role')->exists();
        if (!$isAdminInbox) {
            return response()->json(['message' => 'Test emails can only be sent to an administrator account email.'], 422);
        }

        try {
            Mail::to($to)->send(new LaunchAnnouncementMail(
                name:      $admin->name,
                email:     $to,
                mode:      $mode,
                ctaUrl:    rtrim((string) config('app.frontend_url'), '/') . '/login',
                expiresAt: now()->addDays((int) config('waitlist.launch.activation_ttl_days'))->format('j M Y'),
                isTest:    true,
            ));
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Test email failed: ' . $e->getMessage()], 502);
        }

        $this->auditLog->logFromRequest($request, 'launch_campaign.test', null, ['to' => $to, 'mode' => $mode]);

        return response()->json(['message' => "Test email sent to {$to}."]);
    }

    /**
     * POST /api/admin/launch-campaign/send — super_admin.
     * Requires `confirm_count` to equal the current eligible count, so a stale
     * or accidental request cannot launch an unexpected send.
     */
    public function send(Request $request): JsonResponse
    {
        $data = $request->validate(['confirm_count' => 'required|integer|min:1']);

        $lock = Cache::lock('launch-campaign:send', 60);
        if (!$lock->get()) {
            return response()->json(['message' => 'A send request is already being processed.'], 409);
        }

        try {
            $eligible = $this->campaign->stats()['eligible'];

            if ($eligible === 0) {
                return response()->json(['message' => 'There are no eligible recipients — everyone has already been queued or emailed.'], 409);
            }

            if ($eligible !== (int) $data['confirm_count']) {
                return response()->json([
                    'message'  => "The number of eligible recipients changed to {$eligible}. Please review and confirm again.",
                    'eligible' => $eligible,
                ], 409);
            }

            $result = $this->campaign->queueEligible();
        } finally {
            $lock->release();
        }

        $this->auditLog->logFromRequest($request, 'launch_campaign.send', null, $result);

        return response()->json([
            'message' => "{$result['queued']} launch emails queued for delivery.",
            'result'  => $result,
            'stats'   => $this->campaign->stats(),
        ]);
    }

    /** POST /api/admin/launch-campaign/retry — super_admin. */
    public function retry(Request $request): JsonResponse
    {
        $lock = Cache::lock('launch-campaign:send', 60);
        if (!$lock->get()) {
            return response()->json(['message' => 'A send request is already being processed.'], 409);
        }

        try {
            $result = $this->campaign->retryFailed();
        } finally {
            $lock->release();
        }

        $this->auditLog->logFromRequest($request, 'launch_campaign.retry', null, $result);

        return response()->json([
            'message' => $result['queued'] ? "{$result['queued']} emails re-queued." : 'Nothing to retry.',
            'result'  => $result,
            'stats'   => $this->campaign->stats(),
        ]);
    }
}
