<?php

namespace Tests\Feature;

use App\Jobs\SendLaunchEmailJob;
use App\Mail\LaunchAnnouncementMail;
use App\Models\User;
use App\Models\WaitlistSubscriber as WS;
use App\Services\LaunchCampaignService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * Waitlist → launch campaign. Mail is faked (nothing leaves the machine) and
 * Klaviyo is stubbed with Http::fake(). The queue runs `sync` in tests, so the
 * dispatcher and send jobs execute for real inside the request.
 */
class LaunchCampaignTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config([
            'app.frontend_url'                 => 'https://app.turbostore.test',
            'waitlist.klaviyo.private_key'     => 'pk_test_dummy',
            'waitlist.klaviyo.list_id'         => 'LIST123',
            'waitlist.launch.batch_delay_seconds' => 0,
        ]);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function makeUser(array $attrs = []): User
    {
        $user = User::create(array_merge([
            'name'          => 'Existing User',
            'email'         => Str::lower(Str::random(8)) . '@example.com',
            'password'      => 'secret-password',
            'referral_code' => strtoupper(Str::random(8)),
        ], array_diff_key($attrs, ['email_verified_at' => 1, 'admin_role' => 1])));

        // Not mass-assignable on purpose in the app; set directly for fixtures.
        $user->forceFill(array_intersect_key($attrs, ['email_verified_at' => 1, 'admin_role' => 1]))->save();

        return $user;
    }

    private function superAdmin(): User
    {
        return $this->makeUser(['name' => 'Root Admin', 'admin_role' => 'super_admin', 'email_verified_at' => now()]);
    }

    private function subscriber(string $email, ?string $firstName = 'Ada', array $attrs = []): WS
    {
        return WS::create(array_merge(['email' => WS::normalizeEmail($email), 'first_name' => $firstName], $attrs));
    }

    private function send(User $admin, ?int $count = null)
    {
        $count ??= WS::where('launch_email_status', WS::PENDING)->count();
        return $this->actingAs($admin, 'api')->postJson('/api/admin/launch-campaign/send', ['confirm_count' => $count]);
    }

    private function sentMailFor(string $email): LaunchAnnouncementMail
    {
        $mails = Mail::sent(LaunchAnnouncementMail::class, fn ($m) => $m->hasTo($email));
        $this->assertCount(1, $mails, "Expected exactly one launch email to {$email}");
        return $mails->first();
    }

    private function tokenFrom(LaunchAnnouncementMail $mail): string
    {
        parse_str((string) parse_url($mail->ctaUrl, PHP_URL_QUERY), $q);
        return $q['token'];
    }

    // ── Klaviyo sync ──────────────────────────────────────────────────────────

    public function test_sync_imports_klaviyo_list_without_duplicates_and_respects_unsubscribes(): void
    {
        Mail::fake();
        Http::fake([
            'a.klaviyo.com/api/lists/LIST123/profiles/*' => Http::sequence()
                ->push(['data' => [
                    ['id' => 'P1', 'attributes' => ['email' => 'Ada@Example.com', 'first_name' => 'Ada', 'created' => '2026-10-01T10:00:00Z',
                        'subscriptions' => ['email' => ['marketing' => ['consent' => 'SUBSCRIBED']]]]],
                    ['id' => 'P2', 'attributes' => ['email' => 'gone@example.com', 'first_name' => null,
                        'subscriptions' => ['email' => ['marketing' => ['consent' => 'UNSUBSCRIBED']]]]],
                ], 'links' => ['next' => 'https://a.klaviyo.com/api/lists/LIST123/profiles/?page%5Bcursor%5D=abc']])
                ->push(['data' => [
                    ['id' => 'P3', 'attributes' => ['email' => 'not-an-email', 'first_name' => 'Bad']],
                    ['id' => 'P4', 'attributes' => ['email' => 'grace@example.com', 'first_name' => 'Grace',
                        'subscriptions' => ['email' => ['marketing' => ['consent' => 'SUBSCRIBED']]]]],
                ], 'links' => ['next' => null]])
                ->push(['data' => [], 'links' => ['next' => null]]), // second sync, page 1 (no-op)
        ]);

        $admin = $this->superAdmin();
        $this->actingAs($admin, 'api')->postJson('/api/admin/launch-campaign/sync')
            ->assertOk()
            ->assertJsonPath('result.fetched', 4)
            ->assertJsonPath('result.created', 3)
            ->assertJsonPath('result.invalid', 1)
            ->assertJsonPath('stats.eligible', 2);

        $this->assertDatabaseHas('waitlist_subscribers', ['email' => 'ada@example.com', 'external_id' => 'P1', 'launch_email_status' => 'pending']);
        $this->assertDatabaseHas('waitlist_subscribers', ['email' => 'gone@example.com', 'launch_email_status' => 'skipped', 'skip_reason' => 'unsubscribed']);

        // Re-sync never duplicates.
        $this->actingAs($admin, 'api')->postJson('/api/admin/launch-campaign/sync')->assertOk();
        $this->assertSame(3, WS::count());
        Mail::assertNothingSent(); // syncing never emails anyone
    }

    // ── Scenario B: no account → created + activation ─────────────────────────

    public function test_new_waitlist_user_gets_account_and_single_use_activation_link(): void
    {
        Mail::fake();
        $this->subscriber('new@example.com', 'Ada');

        $this->send($this->superAdmin())->assertOk()->assertJsonPath('result.queued', 1);

        $user = User::where('email', 'new@example.com')->sole();
        $this->assertSame('Ada', $user->name);
        $this->assertNull($user->email_verified_at);

        $sub = WS::where('email', 'new@example.com')->sole();
        $this->assertSame('sent', $sub->launch_email_status);
        $this->assertSame('created', $sub->account_status);
        $this->assertSame($user->id, $sub->user_id);

        $mail = $this->sentMailFor('new@example.com');
        $this->assertSame('activate', $mail->mode);
        $this->assertSame('Ada', $mail->name);
        $this->assertStringStartsWith('https://app.turbostore.test/activate-account?', $mail->ctaUrl);

        // Only the hash is stored, never the token.
        $token = $this->tokenFrom($mail);
        $this->assertSame(hash('sha256', $token), $sub->activation_token_hash);
        $this->assertStringNotContainsString($token, json_encode($sub->getAttributes()));

        // The random placeholder password cannot be guessed / used.
        $this->postJson('/api/auth/login', ['email' => 'new@example.com', 'password' => ''])->assertStatus(422);

        // Activate.
        $this->postJson('/api/auth/activate-account', [
            'email' => 'new@example.com', 'token' => $token,
            'password' => 'MyN3wPassword!', 'password_confirmation' => 'MyN3wPassword!',
        ])->assertOk()->assertJsonStructure(['token']);

        $this->assertNotNull($user->fresh()->email_verified_at);
        $this->postJson('/api/auth/login', ['email' => 'new@example.com', 'password' => 'MyN3wPassword!'])->assertOk();

        // Single use.
        $this->postJson('/api/auth/activate-account', [
            'email' => 'new@example.com', 'token' => $token,
            'password' => 'Another1234', 'password_confirmation' => 'Another1234',
        ])->assertStatus(422);
        $this->postJson('/api/auth/login', ['email' => 'new@example.com', 'password' => 'MyN3wPassword!'])->assertOk();
    }

    public function test_expired_activation_link_is_rejected(): void
    {
        Mail::fake();
        $this->subscriber('late@example.com');
        $this->send($this->superAdmin())->assertOk();
        $token = $this->tokenFrom($this->sentMailFor('late@example.com'));

        $this->travel(8)->days();

        $this->postJson('/api/auth/activate-account', [
            'email' => 'late@example.com', 'token' => $token,
            'password' => 'MyN3wPassword!', 'password_confirmation' => 'MyN3wPassword!',
        ])->assertStatus(422)->assertJsonPath('expired', true);
    }

    public function test_activation_token_cannot_be_used_for_another_account(): void
    {
        Mail::fake();
        $this->subscriber('alice@example.com', 'Alice');
        $this->subscriber('bob@example.com', 'Bob');
        $this->send($this->superAdmin())->assertOk();

        $aliceToken = $this->tokenFrom($this->sentMailFor('alice@example.com'));

        $this->postJson('/api/auth/activate-account', [
            'email' => 'bob@example.com', 'token' => $aliceToken,
            'password' => 'Hijack12345', 'password_confirmation' => 'Hijack12345',
        ])->assertStatus(422);

        $this->postJson('/api/auth/login', ['email' => 'bob@example.com', 'password' => 'Hijack12345'])->assertStatus(401);
    }

    // ── Scenario A / C: existing accounts ─────────────────────────────────────

    public function test_existing_verified_user_is_linked_not_duplicated_and_can_log_in(): void
    {
        Mail::fake();
        $user = $this->makeUser(['email' => 'Member@Example.com', 'email_verified_at' => now()]);
        $this->subscriber('member@example.com', null);

        $this->send($this->superAdmin())->assertOk();

        $this->assertSame(1, User::whereRaw('LOWER(email) = ?', ['member@example.com'])->count());
        $sub = WS::where('email', 'member@example.com')->sole();
        $this->assertSame($user->id, $sub->user_id);
        $this->assertSame('existing_verified', $sub->account_status);
        $this->assertNull($sub->activation_token_hash);

        $mail = $this->sentMailFor('member@example.com');
        $this->assertSame('login', $mail->mode);
        $this->assertSame('https://app.turbostore.test/login', $mail->ctaUrl);
        $this->assertSame('Existing User', $mail->name); // falls back to account name

        // Password untouched — normal login still works.
        $this->postJson('/api/auth/login', ['email' => 'Member@Example.com', 'password' => 'secret-password'])->assertOk();
    }

    public function test_existing_unverified_user_gets_existing_signed_verification_link(): void
    {
        Mail::fake();
        $user = $this->makeUser(['email' => 'pending@example.com']);
        $this->subscriber('pending@example.com');

        $this->send($this->superAdmin())->assertOk();

        $this->assertSame('existing_unverified', WS::where('email', 'pending@example.com')->value('account_status'));
        $mail = $this->sentMailFor('pending@example.com');
        $this->assertSame('verify', $mail->mode);
        $this->assertStringContainsString('/email/verify/' . $user->id . '/', $mail->ctaUrl);

        // The existing verification endpoint accepts it…
        // (verifyEmail reads env('FRONTEND_URL') directly, so match the path only.)
        $this->get($mail->ctaUrl)->assertRedirectContains('/dashboard?verified=1');
        $this->assertNotNull($user->fresh()->email_verified_at);

        // …and a tampered signature is still rejected by the existing checks.
        $this->get(preg_replace('/signature=[^&]+/', 'signature=forged', $mail->ctaUrl))
            ->assertRedirectContains('/verify-email?error=expired');
    }

    public function test_suspended_accounts_are_skipped(): void
    {
        Mail::fake();
        $this->makeUser(['email' => 'banned@example.com', 'is_suspended' => true]);
        $this->subscriber('banned@example.com');

        $this->send($this->superAdmin())->assertOk();

        $this->assertDatabaseHas('waitlist_subscribers', ['email' => 'banned@example.com', 'launch_email_status' => 'skipped', 'skip_reason' => 'account_suspended']);
        Mail::assertNothingSent();
    }

    // ── Bulk + idempotency ────────────────────────────────────────────────────

    public function test_bulk_send_processes_everyone_once_and_repeat_clicks_do_nothing(): void
    {
        Mail::fake();
        config(['waitlist.launch.batch_size' => 7]);
        foreach (range(1, 25) as $i) {
            $this->subscriber("user{$i}@example.com", "User {$i}");
        }
        $admin = $this->superAdmin();

        $this->send($admin, 25)->assertOk()->assertJsonPath('result.queued', 25);

        Mail::assertSentCount(25);
        $this->assertSame(25, WS::where('launch_email_status', 'sent')->count());
        $this->assertSame(25, User::whereNull('admin_role')->count());

        // Second click / refresh: nothing eligible, nothing sent, nothing created.
        $this->send($admin, 25)->assertStatus(409);
        $this->send($admin, 1)->assertStatus(409);
        $this->actingAs($admin, 'api')->postJson('/api/admin/launch-campaign/retry')->assertOk()->assertJsonPath('result.queued', 0);

        Mail::assertSentCount(25);
        $this->assertSame(25, User::whereNull('admin_role')->count());
    }

    public function test_send_requires_confirmed_count_to_match(): void
    {
        Mail::fake();
        $this->subscriber('a@example.com');
        $this->subscriber('b@example.com');

        $this->send($this->superAdmin(), 1)->assertStatus(409)->assertJsonPath('eligible', 2);

        Mail::assertNothingSent();
        $this->assertSame(2, WS::where('launch_email_status', 'pending')->count());
    }

    public function test_send_job_is_a_noop_for_already_sent_or_rebatched_rows(): void
    {
        Mail::fake();
        $sub = $this->subscriber('once@example.com', 'Once', [
            'launch_email_status' => WS::SENT, 'launch_batch_id' => 'batch-1',
        ]);

        (new SendLaunchEmailJob($sub->id, 'batch-1'))->handle(app(LaunchCampaignService::class));
        $sub->update(['launch_email_status' => WS::QUEUED, 'launch_batch_id' => 'batch-2']);
        (new SendLaunchEmailJob($sub->id, 'batch-1'))->handle(app(LaunchCampaignService::class)); // stale job

        Mail::assertNothingSent();
        $this->assertSame(0, User::count());
    }

    // ── Failure + retry ───────────────────────────────────────────────────────

    public function test_failed_delivery_is_recorded_and_can_be_retried_safely(): void
    {
        $sub = $this->subscriber('flaky@example.com', 'Flaky', [
            'launch_email_status' => WS::QUEUED, 'launch_batch_id' => 'batch-x',
        ]);

        // Real mailer with a broken transport → delivery throws.
        config(['mail.default' => 'smtp', 'mail.mailers.smtp.scheme' => 'tls', 'mail.mailers.smtp.host' => 'invalid.localhost']);

        $job = new SendLaunchEmailJob($sub->id, 'batch-x');
        try {
            $job->handle(app(LaunchCampaignService::class));
            $this->fail('Expected delivery to throw');
        } catch (\Throwable $e) {
            $job->failed($e); // what the worker does after the last attempt
        }

        $sub->refresh();
        $this->assertSame('failed', $sub->launch_email_status);
        $this->assertSame(1, $sub->launch_email_attempts);
        $this->assertNotNull($sub->launch_email_last_error);
        $this->assertSame('created', $sub->account_status); // account was created before delivery
        $userId = $sub->user_id;

        // Mail fixed → admin retries.
        Mail::fake();
        $this->actingAs($this->superAdmin(), 'api')->postJson('/api/admin/launch-campaign/retry')
            ->assertOk()->assertJsonPath('result.queued', 1);

        $sub->refresh();
        $this->assertSame('sent', $sub->launch_email_status);
        $this->assertSame(2, $sub->launch_email_attempts);
        $this->assertSame($userId, $sub->user_id);                           // same account
        $this->assertSame(1, User::where('email', 'flaky@example.com')->count()); // not duplicated
        $this->assertSame('activate', $this->sentMailFor('flaky@example.com')->mode);
    }

    // ── Authorization ─────────────────────────────────────────────────────────

    public function test_non_admins_and_regular_admins_cannot_run_the_campaign(): void
    {
        Mail::fake();
        $this->subscriber('x@example.com');
        $customer = $this->makeUser(['email_verified_at' => now()]);
        $admin    = $this->makeUser(['admin_role' => 'admin']);

        $this->getJson('/api/admin/launch-campaign')->assertUnauthorized();
        $this->actingAs($customer, 'api')->getJson('/api/admin/launch-campaign')->assertForbidden();
        $this->actingAs($customer, 'api')->postJson('/api/admin/launch-campaign/send', ['confirm_count' => 1])->assertForbidden();

        // Regular admins may view stats but not sync/send/retry.
        $this->actingAs($admin, 'api')->getJson('/api/admin/launch-campaign')->assertOk()->assertJsonPath('stats.eligible', 1);
        $this->actingAs($admin, 'api')->postJson('/api/admin/launch-campaign/send', ['confirm_count' => 1])->assertForbidden();
        $this->actingAs($admin, 'api')->postJson('/api/admin/launch-campaign/sync')->assertForbidden();
        $this->actingAs($admin, 'api')->postJson('/api/admin/launch-campaign/retry')->assertForbidden();

        Mail::assertNothingSent();
        $this->assertSame('pending', WS::where('email', 'x@example.com')->value('launch_email_status'));
    }

    // ── Test email + stats + rendering ────────────────────────────────────────

    public function test_test_email_goes_only_to_admins_and_touches_no_records(): void
    {
        Mail::fake();
        $this->subscriber('real@example.com');
        $admin = $this->superAdmin();

        $this->actingAs($admin, 'api')->postJson('/api/admin/launch-campaign/test', ['email' => 'stranger@example.com'])->assertStatus(422);
        $this->actingAs($admin, 'api')->postJson('/api/admin/launch-campaign/test', ['mode' => 'verify'])->assertOk();

        Mail::assertSent(LaunchAnnouncementMail::class, fn ($m) => $m->hasTo($admin->email) && $m->isTest && $m->mode === 'verify');
        Mail::assertSentCount(1);
        $this->assertSame('pending', WS::where('email', 'real@example.com')->value('launch_email_status'));
        $this->assertSame(1, User::count());
    }

    public function test_stats_report_campaign_progress(): void
    {
        Mail::fake();
        $this->makeUser(['email' => 'has-account@example.com', 'email_verified_at' => now()]);
        $this->subscriber('has-account@example.com');
        $this->subscriber('new1@example.com');
        $this->subscriber('gone@example.com', null, ['launch_email_status' => WS::SKIPPED, 'skip_reason' => 'unsubscribed']);
        $admin = $this->superAdmin();

        $this->actingAs($admin, 'api')->getJson('/api/admin/launch-campaign')->assertOk()
            ->assertJsonPath('stats.total_waitlist', 3)
            ->assertJsonPath('stats.eligible', 2)
            ->assertJsonPath('stats.existing_accounts', 1)
            ->assertJsonPath('stats.sent', 0);

        $this->send($admin, 2)->assertOk()
            ->assertJsonPath('stats.eligible', 0)
            ->assertJsonPath('stats.sent', 2)
            ->assertJsonPath('stats.accounts_created', 1)
            ->assertJsonPath('stats.existing_accounts', 1)
            ->assertJsonPath('stats.pending_delivery', 0)
            ->assertJsonPath('stats.failed', 0)
            ->assertJsonPath('stats.skipped', 1);
    }

    public function test_email_renders_personalised_content_for_each_mode(): void
    {
        foreach (['activate' => 'choose your password', 'verify' => 'confirm your email', 'login' => 'Simply sign in'] as $mode => $phrase) {
            $mail = new LaunchAnnouncementMail('Ada', 'ada@example.com', $mode, 'https://app.turbostore.test/cta-' . $mode, '17 Nov 2026');

            $mail->assertHasSubject('TurboStore Is Officially Live! Your Access Starts Here 🚀');
            $mail->assertSeeInHtml('Hello Ada', false);
            $mail->assertSeeInHtml('ada@example.com', false);
            $mail->assertSeeInHtml($phrase, false);
            $mail->assertSeeInHtml('https://app.turbostore.test/cta-' . $mode, false);
            $mail->assertSeeInHtml('Access TurboStore', false);
            $mail->assertSeeInHtml('https://app.turbostore.test/logo.png', false);
            $mail->assertDontSeeInHtml('password:', false);
        }
    }
}
