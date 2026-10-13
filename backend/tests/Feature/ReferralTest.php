<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\ReferralRelationship;
use App\Models\ReferralReward;
use App\Models\User;
use App\Services\ReferralService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class ReferralTest extends TestCase
{
    use RefreshDatabase;

    private ReferralService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = app(ReferralService::class);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function makeUser(array $attrs = []): User
    {
        return User::create(array_merge([
            'name'          => 'Test User',
            'email'         => Str::random(8) . '@example.com',
            'password'      => bcrypt('password'),
            'referral_code' => strtoupper(Str::random(8)),
            'wallet_balance' => 0,
        ], $attrs));
    }

    private function makeOrder(User $user, array $attrs = []): Order
    {
        return Order::create(array_merge([
            'reference'      => 'TS-' . Str::random(6),
            'user_id'        => $user->id,
            'provider'       => 'fivesim',
            'country'        => 'russia',
            'service'        => 'vk',
            'service_name'   => 'VK',
            'customer_price' => 50000, // ₦500 in kobo
            'provider_cost'  => 0.50,
            'status'         => 'otp_received',
            'idempotency_key' => Str::uuid(),
        ], $attrs));
    }

    private function link(User $referrer, User $referred): ReferralRelationship
    {
        return ReferralRelationship::create([
            'referrer_id'        => $referrer->id,
            'referred_id'        => $referred->id,
            'referral_code_used' => $referrer->referral_code,
            'eligible_purchases' => 0,
        ]);
    }

    // ── handleRegistration ────────────────────────────────────────────────────

    public function test_valid_referral_code_creates_relationship(): void
    {
        $referrer = $this->makeUser();
        $referred = $this->makeUser();

        $this->service->handleRegistration($referred, $referrer->referral_code);

        $this->assertDatabaseHas('referral_relationships', [
            'referrer_id' => $referrer->id,
            'referred_id' => $referred->id,
        ]);
    }

    public function test_invalid_referral_code_does_nothing(): void
    {
        $referred = $this->makeUser();

        $this->service->handleRegistration($referred, 'DOESNOTEXIST');

        $this->assertDatabaseCount('referral_relationships', 0);
    }

    public function test_self_referral_is_ignored(): void
    {
        $user = $this->makeUser();

        $this->service->handleRegistration($user, $user->referral_code);

        $this->assertDatabaseCount('referral_relationships', 0);
    }

    public function test_duplicate_referral_registration_is_ignored(): void
    {
        $referrerA = $this->makeUser();
        $referrerB = $this->makeUser();
        $referred  = $this->makeUser();

        $this->service->handleRegistration($referred, $referrerA->referral_code);
        $this->service->handleRegistration($referred, $referrerB->referral_code); // second attempt

        $this->assertDatabaseCount('referral_relationships', 1);
        $this->assertDatabaseHas('referral_relationships', ['referrer_id' => $referrerA->id]);
    }

    // ── recordEligiblePurchase — eligibility guards ───────────────────────────

    public function test_purchase_with_reward_id_is_not_counted(): void
    {
        $referrer = $this->makeUser();
        $referred = $this->makeUser();
        $this->link($referrer, $referred);

        // First create a reward to reference
        $reward = ReferralReward::create([
            'referrer_id' => $referrer->id,
            'referral_id' => ReferralRelationship::where('referred_id', $referred->id)->first()->id,
            'milestone'   => 10,
            'status'      => 'pending_use',
        ]);

        $order = $this->makeOrder($referred, ['reward_id' => $reward->id]);

        $this->service->recordEligiblePurchase($order);

        $this->assertDatabaseMissing('referral_purchase_logs', ['order_id' => $order->id]);
    }

    public function test_free_order_is_not_counted(): void
    {
        $referrer = $this->makeUser();
        $referred = $this->makeUser();
        $this->link($referrer, $referred);

        $order = $this->makeOrder($referred, ['customer_price' => 0]);

        $this->service->recordEligiblePurchase($order);

        $this->assertDatabaseMissing('referral_purchase_logs', ['order_id' => $order->id]);
    }

    public function test_non_otp_received_status_is_not_counted(): void
    {
        $referrer = $this->makeUser();
        $referred = $this->makeUser();
        $this->link($referrer, $referred);

        $order = $this->makeOrder($referred, ['status' => 'completed']);

        $this->service->recordEligiblePurchase($order);

        $this->assertDatabaseMissing('referral_purchase_logs', ['order_id' => $order->id]);
    }

    public function test_purchase_without_referral_relationship_is_ignored(): void
    {
        $user  = $this->makeUser(); // no referrer
        $order = $this->makeOrder($user);

        $this->service->recordEligiblePurchase($order);

        $this->assertDatabaseMissing('referral_purchase_logs', ['order_id' => $order->id]);
    }

    // ── recordEligiblePurchase — counting ─────────────────────────────────────

    public function test_eligible_purchase_increments_counter(): void
    {
        $referrer = $this->makeUser();
        $referred = $this->makeUser();
        $referral = $this->link($referrer, $referred);
        $order    = $this->makeOrder($referred);

        $this->service->recordEligiblePurchase($order);

        $this->assertEquals(1, $referral->fresh()->eligible_purchases);
        $this->assertDatabaseHas('referral_purchase_logs', ['order_id' => $order->id]);
    }

    public function test_same_order_counted_only_once(): void
    {
        $referrer = $this->makeUser();
        $referred = $this->makeUser();
        $referral = $this->link($referrer, $referred);
        $order    = $this->makeOrder($referred);

        $this->service->recordEligiblePurchase($order);
        $this->service->recordEligiblePurchase($order); // duplicate call

        $this->assertEquals(1, $referral->fresh()->eligible_purchases);
        $this->assertDatabaseCount('referral_purchase_logs', 1);
    }

    // ── Milestone rewards ─────────────────────────────────────────────────────

    public function test_milestone_reward_issued_at_10_purchases(): void
    {
        $referrer = $this->makeUser();
        $referred = $this->makeUser();
        $referral = $this->link($referrer, $referred);

        // Pre-fill 9 purchases via the log table directly
        $referral->update(['eligible_purchases' => 9]);
        for ($i = 1; $i <= 9; $i++) {
            \DB::table('referral_purchase_logs')->insert([
                'referral_id' => $referral->id,
                'order_id'    => $this->makeOrder($referred)->id,
                'created_at'  => now(),
                'updated_at'  => now(),
            ]);
        }

        // 10th purchase triggers milestone
        $order = $this->makeOrder($referred);
        $this->service->recordEligiblePurchase($order);

        $this->assertEquals(10, $referral->fresh()->eligible_purchases);
        $this->assertDatabaseHas('referral_rewards', [
            'referrer_id' => $referrer->id,
            'referral_id' => $referral->id,
            'milestone'   => 10,
            'status'      => 'available',
        ]);
    }

    public function test_milestone_reward_issued_at_20_purchases(): void
    {
        $referrer = $this->makeUser();
        $referred = $this->makeUser();
        $referral = $this->link($referrer, $referred);

        $referral->update(['eligible_purchases' => 19]);
        for ($i = 1; $i <= 19; $i++) {
            \DB::table('referral_purchase_logs')->insert([
                'referral_id' => $referral->id,
                'order_id'    => $this->makeOrder($referred)->id,
                'created_at'  => now(),
                'updated_at'  => now(),
            ]);
        }

        $order = $this->makeOrder($referred);
        $this->service->recordEligiblePurchase($order);

        $this->assertDatabaseHas('referral_rewards', [
            'referrer_id' => $referrer->id,
            'milestone'   => 20,
            'status'      => 'available',
        ]);
    }

    public function test_milestone_reward_not_duplicated_on_concurrent_calls(): void
    {
        $referrer = $this->makeUser();
        $referred = $this->makeUser();
        $referral = $this->link($referrer, $referred);

        $referral->update(['eligible_purchases' => 9]);
        for ($i = 1; $i <= 9; $i++) {
            \DB::table('referral_purchase_logs')->insert([
                'referral_id' => $referral->id,
                'order_id'    => $this->makeOrder($referred)->id,
                'created_at'  => now(),
                'updated_at'  => now(),
            ]);
        }

        $order = $this->makeOrder($referred);
        $this->service->recordEligiblePurchase($order);

        // Simulate a second call with an already-counted order — no extra reward
        $this->service->recordEligiblePurchase($order);

        $this->assertDatabaseCount('referral_rewards', 1);
    }

    public function test_no_milestone_reward_before_10_purchases(): void
    {
        $referrer = $this->makeUser();
        $referred = $this->makeUser();
        $this->link($referrer, $referred);

        for ($i = 0; $i < 9; $i++) {
            $this->service->recordEligiblePurchase($this->makeOrder($referred));
        }

        $this->assertDatabaseCount('referral_rewards', 0);
    }

    // ── reserveReward / releaseReward / markRewardRedeemed ────────────────────

    public function test_reserve_reward_sets_pending_use(): void
    {
        $referrer = $this->makeUser();
        $referred = $this->makeUser();
        $referral = $this->link($referrer, $referred);

        $reward = ReferralReward::create([
            'referrer_id' => $referrer->id,
            'referral_id' => $referral->id,
            'milestone'   => 10,
            'status'      => 'available',
        ]);

        $reserved = $this->service->reserveReward($reward->id, $referrer);

        $this->assertEquals('pending_use', $reserved->status);
    }

    public function test_reserve_reward_throws_for_wrong_user(): void
    {
        $referrer  = $this->makeUser();
        $referred  = $this->makeUser();
        $referral  = $this->link($referrer, $referred);
        $otherUser = $this->makeUser();

        $reward = ReferralReward::create([
            'referrer_id' => $referrer->id,
            'referral_id' => $referral->id,
            'milestone'   => 10,
            'status'      => 'available',
        ]);

        $this->expectException(\InvalidArgumentException::class);
        $this->service->reserveReward($reward->id, $otherUser);
    }

    public function test_reserve_reward_throws_if_already_pending(): void
    {
        $referrer = $this->makeUser();
        $referred = $this->makeUser();
        $referral = $this->link($referrer, $referred);

        $reward = ReferralReward::create([
            'referrer_id' => $referrer->id,
            'referral_id' => $referral->id,
            'milestone'   => 10,
            'status'      => 'pending_use',
        ]);

        $this->expectException(\InvalidArgumentException::class);
        $this->service->reserveReward($reward->id, $referrer);
    }

    public function test_release_reward_restores_to_available(): void
    {
        $referrer = $this->makeUser();
        $referred = $this->makeUser();
        $referral = $this->link($referrer, $referred);

        $reward = ReferralReward::create([
            'referrer_id' => $referrer->id,
            'referral_id' => $referral->id,
            'milestone'   => 10,
            'status'      => 'pending_use',
        ]);

        $this->service->releaseReward($reward);

        $this->assertEquals('available', $reward->fresh()->status);
    }

    public function test_mark_reward_redeemed(): void
    {
        $referrer = $this->makeUser();
        $referred = $this->makeUser();
        $referral = $this->link($referrer, $referred);

        $reward = ReferralReward::create([
            'referrer_id' => $referrer->id,
            'referral_id' => $referral->id,
            'milestone'   => 10,
            'status'      => 'pending_use',
        ]);

        $order = $this->makeOrder($referrer, ['status' => 'waiting_for_otp', 'reward_id' => $reward->id]);

        $this->service->markRewardRedeemed($reward, $order);

        $r = $reward->fresh();
        $this->assertEquals('redeemed', $r->status);
        $this->assertEquals($order->id, $r->redeemed_order_id);
        $this->assertNotNull($r->redeemed_at);
    }

    // ── getStats ──────────────────────────────────────────────────────────────

    public function test_get_stats_returns_correct_aggregates(): void
    {
        $referrer  = $this->makeUser();
        $referred1 = $this->makeUser();
        $referred2 = $this->makeUser();

        $r1 = $this->link($referrer, $referred1);
        $r2 = $this->link($referrer, $referred2);

        $r1->update(['eligible_purchases' => 7]);
        $r2->update(['eligible_purchases' => 3]);

        ReferralReward::create(['referrer_id' => $referrer->id, 'referral_id' => $r1->id, 'milestone' => 10, 'status' => 'available']);
        ReferralReward::create(['referrer_id' => $referrer->id, 'referral_id' => $r1->id, 'milestone' => 20, 'status' => 'redeemed']);

        $stats = $this->service->getStats($referrer);

        $this->assertEquals(2, $stats['total_referrals']);
        $this->assertEquals(10, $stats['total_eligible_purchases']);
        $this->assertEquals(1, $stats['available_rewards']);
        $this->assertEquals(1, $stats['redeemed_rewards']);
        $this->assertEquals(2, $stats['total_rewards_earned']);
        $this->assertEquals($referrer->referral_code, $stats['referral_code']);
    }
}
