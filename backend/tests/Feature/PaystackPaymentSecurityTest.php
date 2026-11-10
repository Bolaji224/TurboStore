<?php

namespace Tests\Feature;

use App\Jobs\ReconcilePaystackPaymentJob;
use App\Models\PaystackPayment;
use App\Models\User;
use App\Models\WalletTransaction;
use App\Services\PaystackPaymentProcessor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * Wallet crediting must be driven solely by Paystack's server-side verify API.
 * Paystack's HTTP API is stubbed (Http::fake) to simulate each gateway answer;
 * controller, processor, locking and wallet code run unmodified.
 */
class PaystackPaymentSecurityTest extends TestCase
{
    use RefreshDatabase;

    private const SECRET = 'sk_test_security_suite';

    protected function setUp(): void
    {
        parent::setUp();
        config(['services.paystack.secret_key' => self::SECRET]);
        Mail::fake();
        Queue::fake([ReconcilePaystackPaymentJob::class]);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function makeUser(): User
    {
        return User::create([
            'name' => 'Payer', 'email' => Str::random(8) . '@example.com',
            'password' => 'password', 'referral_code' => strtoupper(Str::random(8)),
        ]);
    }

    private function initiate(User $user, int $naira = 5000): string
    {
        return $this->actingAs($user, 'api')->postJson('/api/wallet/fund/initiate', ['amount' => $naira])
            ->assertOk()->json('reference');
    }

    private function verifyInline(User $user, string $ref)
    {
        return $this->actingAs($user, 'api')->postJson('/api/wallet/fund/verify-inline', ['reference' => $ref]);
    }

    /** Paystack answers "success" for the given amount/currency (defaults: our recorded amount, NGN). */
    private function paystackSuccess(?int $amountKobo = null, string $currency = 'NGN'): void
    {
        Http::fake(['api.paystack.co/transaction/verify/*' => function ($request) use ($amountKobo, $currency) {
            $ref = rawurldecode(basename(parse_url($request->url(), PHP_URL_PATH)));
            return Http::response(['status' => true, 'message' => 'Verification successful', 'data' => [
                'status' => 'success', 'reference' => $ref, 'currency' => $currency,
                'amount' => $amountKobo ?? PaystackPayment::where('reference', $ref)->value('amount'),
            ]]);
        }]);
    }

    private function paystackStatus(int $http, array $body = []): void
    {
        Http::fake(['api.paystack.co/*' => Http::response($body, $http)]);
    }

    private function balance(User $u): int { return (int) $u->fresh()->wallet_balance; }

    private function signedWebhook(string $ref, string $secret = self::SECRET)
    {
        $payload = json_encode(['event' => 'charge.success', 'data' => ['reference' => $ref, 'amount' => 999999999]]);
        return $this->call('POST', '/api/wallet/fund/webhook', [], [], [], [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_X_PAYSTACK_SIGNATURE' => hash_hmac('sha512', $payload, $secret),
        ], $payload);
    }

    // ── The original exploit ──────────────────────────────────────────────────

    public function test_unpaid_reference_is_never_credited(): void
    {
        // initiate ₦1,000,000, never pay, call verify-inline → Paystack: "not found"
        $this->paystackStatus(400, ['status' => false, 'message' => 'Transaction reference not found.']);
        $user = $this->makeUser();
        $ref  = $this->initiate($user, 1000000);

        $this->verifyInline($user, $ref)->assertStatus(202)->assertJsonPath('status', 'pending');
        $this->verifyInline($user, $ref)->assertStatus(202);

        $this->assertSame(0, $this->balance($user));
        $this->assertSame(0, WalletTransaction::count());
        $this->assertSame('pending', PaystackPayment::where('reference', $ref)->value('status'));
    }

    public function test_gateway_outage_does_not_credit_and_schedules_reconciliation(): void
    {
        Http::fake(fn () => throw new ConnectionException('Connection timed out'));
        $user = $this->makeUser();
        $ref  = $this->initiate($user);

        $this->verifyInline($user, $ref)->assertStatus(202);

        $this->assertSame(0, $this->balance($user));
        Queue::assertPushed(ReconcilePaystackPaymentJob::class, fn ($j) => $j->reference === $ref);
    }

    public function test_gateway_5xx_and_rate_limit_do_not_credit(): void
    {
        $user = $this->makeUser();
        foreach ([500, 502, 503, 429] as $code) {
            $this->paystackStatus($code, ['status' => false]);
            $ref = $this->initiate($user);
            $this->verifyInline($user, $ref)->assertStatus(202);
        }
        $this->assertSame(0, $this->balance($user));
    }

    public function test_bad_or_mismatched_secret_key_does_not_credit(): void
    {
        $this->paystackStatus(401, ['status' => false, 'message' => 'Invalid key']);
        $user = $this->makeUser();
        $ref  = $this->initiate($user);

        $this->verifyInline($user, $ref)->assertStatus(202);
        $this->assertSame(0, $this->balance($user));
    }

    public function test_missing_secret_key_does_not_crash_or_credit(): void
    {
        config(['services.paystack.secret_key' => null]);
        Http::fake(); // must not even be called
        $user = $this->makeUser();
        $ref  = $this->initiate($user);

        $this->verifyInline($user, $ref)->assertStatus(202);
        $this->assertSame(0, $this->balance($user));
        Http::assertNothingSent();
    }

    // ── Amount / currency tampering ───────────────────────────────────────────

    public function test_underpaid_charge_is_flagged_not_credited(): void
    {
        $this->paystackSuccess(amountKobo: 50000); // paid ₦500
        $user = $this->makeUser();
        $ref  = $this->initiate($user, 1000000);   // recorded ₦1,000,000

        $this->verifyInline($user, $ref)->assertStatus(422)->assertJsonPath('status', 'review');
        $this->verifyInline($user, $ref)->assertStatus(422); // stays flagged

        $p = PaystackPayment::where('reference', $ref)->sole();
        $this->assertSame('amount_mismatch', $p->flag_reason);
        $this->assertSame('pending', $p->status);
        $this->assertSame(0, $this->balance($user));
    }

    public function test_wrong_currency_is_flagged_not_credited(): void
    {
        $this->paystackSuccess(currency: 'USD');
        $user = $this->makeUser();
        $ref  = $this->initiate($user);

        $this->verifyInline($user, $ref)->assertStatus(422);
        $this->assertSame('currency_mismatch', PaystackPayment::where('reference', $ref)->value('flag_reason'));
        $this->assertSame(0, $this->balance($user));
    }

    // ── Legitimate payments still work ────────────────────────────────────────

    public function test_verified_payment_is_credited_once_with_audit_fields(): void
    {
        $this->paystackSuccess();
        $user = $this->makeUser();
        $ref  = $this->initiate($user, 2500);

        $this->verifyInline($user, $ref)->assertOk()->assertJson(['status' => 'success', 'amount_naira' => 2500]);
        $this->verifyInline($user, $ref)->assertOk();
        $this->signedWebhook($ref)->assertOk();

        $this->assertSame(250000, $this->balance($user));
        $this->assertSame(1, WalletTransaction::where('type', 'deposit')->count());
        $p = PaystackPayment::where('reference', $ref)->sole();
        $this->assertNotNull($p->verified_at);
        $this->assertNull($p->flag_reason);
    }

    /** One stub whose answer can change mid-test ('down' | 'failed' | 'success'). */
    private function switchableGateway(string &$mode): void
    {
        Http::fake(['api.paystack.co/transaction/verify/*' => function ($request) use (&$mode) {
            $ref = rawurldecode(basename(parse_url($request->url(), PHP_URL_PATH)));
            return match ($mode) {
                'down'    => throw new ConnectionException('down'),
                'failed'  => Http::response(['status' => true, 'data' => ['status' => 'failed', 'reference' => $ref]]),
                'success' => Http::response(['status' => true, 'data' => [
                    'status' => 'success', 'reference' => $ref, 'currency' => 'NGN',
                    'amount' => PaystackPayment::where('reference', $ref)->value('amount'),
                ]]),
            };
        }]);
    }

    public function test_payment_confirmed_after_outage_is_credited_by_reconciliation(): void
    {
        $mode = 'down';
        $this->switchableGateway($mode);
        $user = $this->makeUser();
        $ref  = $this->initiate($user, 3000);
        $this->verifyInline($user, $ref)->assertStatus(202);
        $this->assertSame(0, $this->balance($user));

        // Paystack recovers; the background job runs.
        $mode = 'success';
        app()->call([new ReconcilePaystackPaymentJob($ref), 'handle']);

        $this->assertSame(300000, $this->balance($user));
        $this->assertSame('success', PaystackPayment::where('reference', $ref)->value('status'));
    }

    public function test_payment_marked_failed_is_credited_if_paystack_later_confirms_success(): void
    {
        $mode = 'failed';
        $this->switchableGateway($mode);
        $user = $this->makeUser();
        $ref  = $this->initiate($user, 1000);
        $this->verifyInline($user, $ref)->assertStatus(422);
        $this->assertSame('failed', PaystackPayment::where('reference', $ref)->value('status'));

        // Customer retried and the same reference succeeded; Paystack webhook arrives.
        $mode = 'success';
        $this->signedWebhook($ref)->assertOk();

        $this->assertSame(100000, $this->balance($user));
        $this->assertSame(1, WalletTransaction::where('type', 'deposit')->count());
    }

    public function test_reconcile_command_credits_confirmed_pending_payments(): void
    {
        $user = $this->makeUser();
        $paid   = $this->initiate($user, 1000);
        $unpaid = $this->initiate($user, 9000);
        $this->travel(10)->minutes();

        Http::fake(['api.paystack.co/transaction/verify/*' => function ($request) use ($paid) {
            $ref = basename(parse_url($request->url(), PHP_URL_PATH));
            return $ref === $paid
                ? Http::response(['status' => true, 'data' => ['status' => 'success', 'reference' => $paid, 'amount' => 100000, 'currency' => 'NGN']])
                : Http::response(['status' => false, 'message' => 'Transaction reference not found.'], 400);
        }]);

        $this->artisan('payments:reconcile')->assertSuccessful();

        $this->assertSame(100000, $this->balance($user));
        $this->assertSame('pending', PaystackPayment::where('reference', $unpaid)->value('status'));
    }

    // ── Webhook hardening ─────────────────────────────────────────────────────

    public function test_webhook_payload_amount_is_ignored_in_favour_of_verify_api(): void
    {
        $this->paystackSuccess(); // verify API: our recorded amount
        $user = $this->makeUser();
        $ref  = $this->initiate($user, 1000);

        $this->signedWebhook($ref)->assertOk(); // payload claims a huge amount

        $this->assertSame(100000, $this->balance($user));
    }

    public function test_webhook_signed_with_empty_secret_is_rejected_when_key_missing(): void
    {
        config(['services.paystack.secret_key' => '']);
        $user = $this->makeUser();
        $ref  = $this->initiate($user);

        $this->signedWebhook($ref, secret: '')->assertStatus(400);
        $this->assertSame(0, $this->balance($user));
    }

    public function test_webhook_asks_paystack_to_retry_when_verification_unavailable(): void
    {
        Http::fake(fn () => throw new ConnectionException('down'));
        $user = $this->makeUser();
        $ref  = $this->initiate($user);

        $this->signedWebhook($ref)->assertStatus(503);
        $this->assertSame(0, $this->balance($user));
    }

    public function test_webhook_for_unknown_reference_is_acknowledged_without_side_effects(): void
    {
        $this->paystackSuccess();
        $this->signedWebhook('PAY-NOT-OURS')->assertOk();
        $this->assertSame(0, WalletTransaction::count());
    }

    // ── Ownership ─────────────────────────────────────────────────────────────

    public function test_user_cannot_verify_another_users_reference(): void
    {
        $this->paystackSuccess();
        $owner = $this->makeUser();
        $other = $this->makeUser();
        $ref   = $this->initiate($owner);

        $this->verifyInline($other, $ref)->assertNotFound();
        $this->assertSame(0, $this->balance($other));
        $this->assertSame(0, $this->balance($owner));
    }

    // ── Audit of historic exposure ────────────────────────────────────────────

    public function test_audit_command_reports_legacy_unverified_credits_without_changing_balances(): void
    {
        $user = $this->makeUser();
        $user->update(['wallet_balance' => 100000]);
        PaystackPayment::create(['user_id' => $user->id, 'reference' => 'PAY-LEGACY1', 'amount' => 100000, 'status' => 'success', 'paystack_data' => []]);
        PaystackPayment::create(['user_id' => $user->id, 'reference' => 'PAY-GOODONE', 'amount' => 50000, 'status' => 'success',
            'paystack_data' => ['status' => 'success', 'reference' => 'PAY-GOODONE', 'amount' => 50000, 'currency' => 'NGN']]);

        $this->artisan('payments:audit')
            ->expectsOutputToContain('PAY-LEGACY1')
            ->doesntExpectOutputToContain('PAY-GOODONE')
            ->assertSuccessful();

        $this->assertSame(100000, $this->balance($user));
    }

    public function test_processor_is_idempotent_under_repeated_calls(): void
    {
        $this->paystackSuccess();
        $user = $this->makeUser();
        $ref  = $this->initiate($user, 1000);
        $processor = app(PaystackPaymentProcessor::class);

        $outcomes = array_map(fn () => $processor->process($ref)['outcome'], range(1, 5));

        $this->assertSame([PaystackPaymentProcessor::CREDITED] + array_fill(1, 4, PaystackPaymentProcessor::COMPLETED), $outcomes);
        $this->assertSame(100000, $this->balance($user));
    }
}
