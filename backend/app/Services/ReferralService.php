<?php

namespace App\Services;

use App\Models\Order;
use App\Models\ReferralRelationship;
use App\Models\ReferralReward;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ReferralService
{
    const PURCHASES_PER_REWARD = 10;

    public function __construct(private NotificationService $notificationService) {}

    /**
     * Link a new user to their referrer if the code is valid.
     * Silently does nothing if the code is invalid or belongs to the same user.
     */
    public function handleRegistration(User $newUser, string $referralCode): void
    {
        $referrer = User::where('referral_code', strtoupper($referralCode))->first();

        if (!$referrer || $referrer->id === $newUser->id) {
            return;
        }

        // unique(referred_id) in DB handles race conditions, but guard here too
        if (ReferralRelationship::where('referred_id', $newUser->id)->exists()) {
            return;
        }

        ReferralRelationship::create([
            'referrer_id'        => $referrer->id,
            'referred_id'        => $newUser->id,
            'referral_code_used' => strtoupper($referralCode),
            'eligible_purchases' => 0,
        ]);

        Log::info('[ReferralService] Relationship created', [
            'referrer_id' => $referrer->id,
            'referred_id' => $newUser->id,
        ]);
    }

    /**
     * Record an eligible purchase and issue a milestone reward when applicable.
     *
     * Eligible = status otp_received, customer_price > 0, not a reward redemption.
     * Idempotent: unique(order_id) on purchase logs prevents double-counting.
     */
    public function recordEligiblePurchase(Order $order): void
    {
        if ($order->status !== 'otp_received') return;
        if ($order->customer_price <= 0) return;
        if ($order->reward_id !== null) return;

        $referral = ReferralRelationship::where('referred_id', $order->user_id)->first();
        if (!$referral) return;

        DB::transaction(function () use ($referral, $order) {
            // Lock the row to serialise concurrent milestone checks
            $referral = ReferralRelationship::lockForUpdate()->find($referral->id);

            $inserted = DB::table('referral_purchase_logs')->insertOrIgnore([
                'referral_id' => $referral->id,
                'order_id'    => $order->id,
                'created_at'  => now(),
                'updated_at'  => now(),
            ]);

            if ($inserted === 0) {
                return; // Already counted — idempotent exit
            }

            $referral->increment('eligible_purchases');
            $referral->refresh();

            if ($referral->eligible_purchases % self::PURCHASES_PER_REWARD === 0) {
                $milestone = $referral->eligible_purchases;

                DB::table('referral_rewards')->insertOrIgnore([
                    'referrer_id' => $referral->referrer_id,
                    'referral_id' => $referral->id,
                    'milestone'   => $milestone,
                    'status'      => 'available',
                    'created_at'  => now(),
                    'updated_at'  => now(),
                ]);

                Log::info('[ReferralService] Milestone reward issued', [
                    'referrer_id' => $referral->referrer_id,
                    'milestone'   => $milestone,
                ]);

                // Notify the referrer they earned a free number
                try {
                    $referrer = \App\Models\User::find($referral->referrer_id);
                    if ($referrer) {
                        $this->notificationService->referralReward($referrer, $milestone, $referral);
                    }
                } catch (\Throwable) {}
            }
        });
    }

    /**
     * Lock a reward for redemption. Throws if not found, not owned, or already used.
     *
     * @throws \InvalidArgumentException
     */
    public function reserveReward(int $rewardId, User $user): ReferralReward
    {
        return DB::transaction(function () use ($rewardId, $user) {
            $reward = ReferralReward::lockForUpdate()
                ->where('id', $rewardId)
                ->where('referrer_id', $user->id)
                ->first();

            if (!$reward) {
                throw new \InvalidArgumentException('Reward not found.');
            }

            if (!$reward->isAvailable()) {
                throw new \InvalidArgumentException('This reward has already been used or is currently being redeemed.');
            }

            $reward->update(['status' => 'pending_use']);
            return $reward->fresh();
        });
    }

    /** Restore a pending_use reward to available (e.g. on provider failure). */
    public function releaseReward(ReferralReward $reward): void
    {
        $reward->update(['status' => 'available']);
    }

    /** Finalise a reward after the order is confirmed with the provider. */
    public function markRewardRedeemed(ReferralReward $reward, Order $order): void
    {
        $reward->update([
            'status'            => 'redeemed',
            'redeemed_order_id' => $order->id,
            'redeemed_at'       => now(),
        ]);
    }

    /** Aggregate stats for the referrals dashboard. */
    public function getStats(User $user): array
    {
        $referrals = ReferralRelationship::where('referrer_id', $user->id)->get();

        $rewardCounts = ReferralReward::where('referrer_id', $user->id)
            ->selectRaw('status, count(*) as cnt')
            ->groupBy('status')
            ->pluck('cnt', 'status');

        $available = (int) ($rewardCounts['available'] ?? 0);
        $pending   = (int) ($rewardCounts['pending_use'] ?? 0);
        $redeemed  = (int) ($rewardCounts['redeemed'] ?? 0);

        return [
            'referral_code'            => $user->referral_code,
            'total_referrals'          => $referrals->count(),
            'total_eligible_purchases' => $referrals->sum('eligible_purchases'),
            'available_rewards'        => $available,
            'pending_rewards'          => $pending,
            'redeemed_rewards'         => $redeemed,
            'total_rewards_earned'     => $available + $pending + $redeemed,
        ];
    }

    /** Paginated referral list with progress data. */
    public function getReferrals(User $user, int $perPage = 15)
    {
        return ReferralRelationship::with('referred')
            ->where('referrer_id', $user->id)
            ->orderByDesc('eligible_purchases')
            ->orderByDesc('created_at')
            ->paginate($perPage);
    }

    /** Paginated reward list. */
    public function getRewards(User $user, int $perPage = 15)
    {
        return ReferralReward::where('referrer_id', $user->id)
            ->orderByDesc('created_at')
            ->paginate($perPage);
    }
}
