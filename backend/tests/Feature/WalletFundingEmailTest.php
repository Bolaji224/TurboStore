<?php

namespace Tests\Feature;

use App\Jobs\ReconcilePaystackPaymentJob;
use App\Mail\WalletFundedMail;
use App\Models\PaystackPayment;
use App\Models\User;
use App\Models\WalletTransaction;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Str;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/**
 * Wallet funding confirmation emails.
 *
 * Paystack's HTTP API is stubbed with Http::fake() — the real controller,
 * locking, wallet crediting and mail dispatch code all run unmodified.
 */
class WalletFundingEmailTest extends TestCase
{
    use RefreshDatabase;

    private const SECRET = 'sk_test_unit_secret';

    protected function setUp(): void
    {
        parent::setUp();
        config([
            'services.paystack.secret_key' => self::SECRET,
            'app.frontend_url'             => 'https://app.turbostore.test',
        ]);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function makeUser(array $attrs = []): User
    {
        return User::create(array_merge([
            'name'           => 'Ada Lovelace',
            'email'          => Str::random(8) . '@example.com',
            'password'       => bcrypt('password'),
            'referral_code'  => strtoupper(Str::random(8)),
            'wallet_balance' => 0,
        ], $attrs));
    }

    /** Uses the real initiate endpoint to create the pending payment. */
    private function initiate(User $user, int $naira = 5000): string
    {
        return $this->actingAs($user, 'api')
            ->postJson('/api/wallet/fund/initiate', ['amount' => $naira])
            ->assertOk()
            ->json('reference');
    }

    private function fakePaystackVerify(string $status, ?int $amountKobo = null, string $currency = 'NGN'): void
    {
        Http::fake([
            'api.paystack.co/transaction/verify/*' => function ($request) use ($status, $amountKobo, $currency) {
                $reference = basename(parse_url($request->url(), PHP_URL_PATH));
                $payment   = PaystackPayment::where('reference', $reference)->first();

                return Http::response([
                    'status' => true,
                    'data'   => [
                        'status'    => $status,
                        'reference' => $reference,
                        'amount'    => $amountKobo ?? $payment?->amount,
                        'currency'  => $currency,
                    ],
                ]);
            },
        ]);
    }

    private function postWebhook(string $reference, string $event = 'charge.success', ?string $signature = null)
    {
        $payload = json_encode(['event' => $event, 'data' => ['reference' => $reference]]);

        return $this->call('POST', '/api/wallet/fund/webhook', [], [], [], [
            'CONTENT_TYPE'              => 'application/json',
            'HTTP_X_PAYSTACK_SIGNATURE' => $signature ?? hash_hmac('sha512', $payload, self::SECRET),
        ], $payload);
    }

    // ── Happy path ────────────────────────────────────────────────────────────

    public function test_verified_payment_sends_exactly_one_email_with_correct_details(): void
    {
        Mail::fake();
        $this->fakePaystackVerify('success');

        $user = $this->makeUser(['wallet_balance' => 150000]); // ₦1,500 existing
        $ref  = $this->initiate($user, 5000);

        $this->actingAs($user, 'api')
            ->postJson('/api/wallet/fund/verify-inline', ['reference' => $ref])
            ->assertOk()
            ->assertJson(['status' => 'success', 'amount_naira' => 5000]);

        $this->assertSame(650000, (int) $user->fresh()->wallet_balance);

        Mail::assertQueuedCount(1);
        Mail::assertQueued(WalletFundedMail::class, function (WalletFundedMail $mail) use ($user, $ref) {
            return $mail->hasTo($user->email)
                && $mail->customerName === 'Ada Lovelace'
                && $mail->amountKobo === 500000
                && $mail->paymentReference === $ref
                && $mail->balanceAfterKobo === 650000
                && $mail->userId === $user->id;
        });
    }

    public function test_webhook_credits_and_emails_payment_owner(): void
    {
        Mail::fake();
        $this->fakePaystackVerify('success');

        $owner = $this->makeUser();
        $ref   = $this->initiate($owner, 2000);

        $this->postWebhook($ref)->assertOk();

        $this->assertSame(200000, (int) $owner->fresh()->wallet_balance);
        Mail::assertQueued(WalletFundedMail::class, fn ($m) => $m->hasTo($owner->email) && $m->paymentReference === $ref);
        Mail::assertQueuedCount(1);
    }

    // ── Idempotency ───────────────────────────────────────────────────────────

    public function test_repeated_verify_and_webhook_calls_credit_and_email_only_once(): void
    {
        Mail::fake();
        $this->fakePaystackVerify('success');

        $user = $this->makeUser();
        $ref  = $this->initiate($user, 1000);

        $this->actingAs($user, 'api')->postJson('/api/wallet/fund/verify-inline', ['reference' => $ref])->assertOk();
        $this->actingAs($user, 'api')->postJson('/api/wallet/fund/verify-inline', ['reference' => $ref])->assertOk();
        $this->postWebhook($ref)->assertOk();
        $this->postWebhook($ref)->assertOk();

        $this->assertSame(100000, (int) $user->fresh()->wallet_balance);
        $this->assertSame(1, WalletTransaction::where('user_id', $user->id)->where('type', 'deposit')->count());
        Mail::assertQueuedCount(1);
    }

    // ── No email for unsuccessful / unverified payments ──────────────────────

    public function test_pending_payment_sends_no_email(): void
    {
        Mail::fake();
        $user = $this->makeUser();
        $this->initiate($user);

        $this->assertSame(0, (int) $user->fresh()->wallet_balance);
        Mail::assertNothingQueued();
        Mail::assertNothingSent();
    }

    #[DataProvider('terminalFailureStatuses')]
    public function test_failed_paystack_status_sends_no_email(string $status): void
    {
        Mail::fake();
        $this->fakePaystackVerify($status);

        $user = $this->makeUser();
        $ref  = $this->initiate($user);

        $this->actingAs($user, 'api')
            ->postJson('/api/wallet/fund/verify-inline', ['reference' => $ref])
            ->assertStatus(422);

        $this->assertSame(0, (int) $user->fresh()->wallet_balance);
        $this->assertSame('failed', PaystackPayment::where('reference', $ref)->value('status'));
        Mail::assertNothingQueued();
    }

    public static function terminalFailureStatuses(): array
    {
        return [['failed'], ['reversed']];
    }

    #[DataProvider('inProgressStatuses')]
    public function test_in_progress_paystack_status_stays_pending_without_credit_or_email(string $status): void
    {
        Mail::fake();
        Queue::fake([ReconcilePaystackPaymentJob::class]);
        $this->fakePaystackVerify($status);

        $user = $this->makeUser();
        $ref  = $this->initiate($user);

        $this->actingAs($user, 'api')
            ->postJson('/api/wallet/fund/verify-inline', ['reference' => $ref])
            ->assertStatus(202)
            ->assertJsonPath('status', 'pending');

        $this->assertSame(0, (int) $user->fresh()->wallet_balance);
        $this->assertSame('pending', PaystackPayment::where('reference', $ref)->value('status'));
        Queue::assertPushed(ReconcilePaystackPaymentJob::class, fn ($job) => $job->reference === $ref);
        Mail::assertNothingQueued();
    }

    public static function inProgressStatuses(): array
    {
        return [['abandoned'], ['ongoing'], ['pending'], ['processing'], ['queued']];
    }

    public function test_webhook_for_non_success_event_or_bad_signature_sends_no_email(): void
    {
        Mail::fake();
        $this->fakePaystackVerify('success');

        $user = $this->makeUser();
        $ref  = $this->initiate($user);

        $this->postWebhook($ref, 'charge.failed')->assertOk();
        $this->postWebhook($ref, 'charge.success', 'forged-signature')->assertStatus(400);

        $this->assertSame(0, (int) $user->fresh()->wallet_balance);
        Mail::assertNothingQueued();
    }

    public function test_no_credit_or_email_when_paystack_verification_unavailable(): void
    {
        Mail::fake();
        Queue::fake([ReconcilePaystackPaymentJob::class]);
        Http::fake(fn () => throw new ConnectionException('timeout'));

        $user = $this->makeUser();
        $ref  = $this->initiate($user);

        $this->actingAs($user, 'api')->postJson('/api/wallet/fund/verify-inline', ['reference' => $ref])
            ->assertStatus(202)->assertJsonPath('status', 'pending');

        $this->assertSame(0, (int) $user->fresh()->wallet_balance);
        Mail::assertNothingQueued();
    }

    public function test_no_credit_or_email_when_verified_amount_does_not_match_recorded_amount(): void
    {
        Mail::fake();
        $this->fakePaystackVerify('success', amountKobo: 50000); // paid ₦500, recorded ₦5,000

        $user = $this->makeUser();
        $ref  = $this->initiate($user, 5000);

        $this->actingAs($user, 'api')->postJson('/api/wallet/fund/verify-inline', ['reference' => $ref])
            ->assertStatus(422)->assertJsonPath('status', 'review');

        $this->assertSame(0, (int) $user->fresh()->wallet_balance);
        Mail::assertNothingQueued();
    }

    public function test_user_cannot_trigger_email_for_another_users_payment(): void
    {
        Mail::fake();
        $this->fakePaystackVerify('success');

        $owner    = $this->makeUser();
        $attacker = $this->makeUser();
        $ref      = $this->initiate($owner);

        $this->actingAs($attacker, 'api')
            ->postJson('/api/wallet/fund/verify-inline', ['reference' => $ref])
            ->assertNotFound();

        $this->assertSame(0, (int) $attacker->fresh()->wallet_balance);
        Mail::assertNothingQueued();
    }

    // ── Failure isolation ─────────────────────────────────────────────────────

    public function test_email_delivery_failure_does_not_affect_wallet_credit(): void
    {
        // Real mailer, deliberately broken transport (invalid scheme), sync queue.
        config([
            'mail.default'               => 'smtp',
            'mail.mailers.smtp.scheme'   => 'tls',
            'mail.mailers.smtp.host'     => 'invalid.localhost',
        ]);
        Log::spy();
        $this->fakePaystackVerify('success');

        $user = $this->makeUser();
        $ref  = $this->initiate($user, 3000);

        $this->actingAs($user, 'api')
            ->postJson('/api/wallet/fund/verify-inline', ['reference' => $ref])
            ->assertOk()
            ->assertJson(['status' => 'success']);

        $this->assertSame(300000, (int) $user->fresh()->wallet_balance);
        $this->assertSame('success', PaystackPayment::where('reference', $ref)->value('status'));
        Log::shouldHaveReceived('error')->withArgs(fn ($msg) => $msg === 'Wallet funding email could not be dispatched')->atLeast()->once();
    }

    // ── Rendered content ──────────────────────────────────────────────────────

    public function test_email_renders_amount_reference_balance_and_cta(): void
    {
        $mail = new WalletFundedMail(
            customerName:     'Ada Lovelace',
            amountKobo:       500000,
            paymentReference: 'PAY-ABC123XYZ789',
            balanceAfterKobo: 1234550,
            paidAt:           '9 Nov 2026, 3:00 PM',
            userId:           1,
        );

        $mail->assertHasSubject('Payment Received Successfully – Your TurboStore Wallet Has Been Funded!');
        $mail->assertSeeInHtml('Hello Ada Lovelace', false);
        $mail->assertSeeInHtml('₦5,000', false);
        $mail->assertSeeInHtml('PAY-ABC123XYZ789', false);
        $mail->assertSeeInHtml('₦12,345.50', false);
        $mail->assertSeeInHtml('Explore Available Numbers', false);
        $mail->assertSeeInHtml('https://app.turbostore.test/dashboard/buy-number', false);
        $mail->assertSeeInHtml('https://app.turbostore.test/logo.png', false);
    }
}
