<?php

namespace App\Http\Controllers;

use App\Models\ReferralRelationship;
use App\Models\ReferralReward;
use App\Services\ReferralService;
use Illuminate\Http\Request;

class ReferralController extends Controller
{
    public function __construct(private ReferralService $referralService) {}

    /** GET /api/referrals/stats */
    public function stats()
    {
        return response()->json([
            'stats' => $this->referralService->getStats(auth()->user()),
        ]);
    }

    /** GET /api/referrals — paginated list of referred users */
    public function index()
    {
        $paginator = $this->referralService->getReferrals(auth()->user());

        return response()->json([
            'referrals' => $paginator->map(fn(ReferralRelationship $r) => $this->formatReferral($r)),
            'meta'      => [
                'current_page' => $paginator->currentPage(),
                'last_page'    => $paginator->lastPage(),
                'total'        => $paginator->total(),
            ],
        ]);
    }

    /** GET /api/referrals/rewards — paginated list of rewards */
    public function rewards()
    {
        $paginator = $this->referralService->getRewards(auth()->user());

        return response()->json([
            'rewards' => $paginator->map(fn(ReferralReward $r) => $this->formatReward($r)),
            'meta'    => [
                'current_page' => $paginator->currentPage(),
                'last_page'    => $paginator->lastPage(),
                'total'        => $paginator->total(),
            ],
        ]);
    }

    private function formatReferral(ReferralRelationship $r): array
    {
        return [
            'id'                  => $r->id,
            'masked_email'        => $r->referredMaskedEmail(),
            'eligible_purchases'  => $r->eligible_purchases,
            'progress'            => $r->currentWindowProgress(),
            'purchases_to_reward' => $r->purchasesToNextReward(),
            'joined_at'           => $r->created_at->toIso8601String(),
        ];
    }

    private function formatReward(ReferralReward $r): array
    {
        return [
            'id'          => $r->id,
            'milestone'   => $r->milestone,
            'status'      => $r->status,
            'redeemed_at' => $r->redeemed_at?->toIso8601String(),
            'created_at'  => $r->created_at->toIso8601String(),
        ];
    }
}
