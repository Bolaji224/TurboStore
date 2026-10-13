<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ReferralRelationship;
use App\Models\ReferralReward;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminReferralController extends Controller
{
    public function stats(): JsonResponse
    {
        $totalRelationships = ReferralRelationship::count();
        $totalEligible      = (int) ReferralRelationship::sum('eligible_purchases');

        $rewardCounts = ReferralReward::selectRaw('status, count(*) as cnt')
            ->groupBy('status')
            ->pluck('cnt', 'status');

        $topReferrers = ReferralRelationship::selectRaw('referrer_id, COUNT(*) as total_referrals, SUM(eligible_purchases) as total_eligible')
            ->groupBy('referrer_id')
            ->orderByDesc('total_eligible')
            ->limit(10)
            ->with('referrer:id,name,email')
            ->get()
            ->map(fn($r) => [
                'id'              => $r->referrer_id,
                'name'            => $r->referrer?->name ?? '—',
                'email'           => $r->referrer?->email ?? '—',
                'total_referrals' => (int) $r->total_referrals,
                'total_eligible'  => (int) $r->total_eligible,
            ]);

        return response()->json([
            'stats' => [
                'total_relationships'   => $totalRelationships,
                'total_eligible_purchases' => $totalEligible,
                'rewards_available'     => (int) ($rewardCounts['available'] ?? 0),
                'rewards_pending'       => (int) ($rewardCounts['pending_use'] ?? 0),
                'rewards_redeemed'      => (int) ($rewardCounts['redeemed'] ?? 0),
            ],
            'top_referrers' => $topReferrers,
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $q = ReferralRelationship::with(['referrer:id,name,email', 'referred:id,name,email'])
            ->orderByDesc('eligible_purchases');

        if ($s = $request->get('search')) {
            $q->whereHas('referrer', fn($q) => $q->where('email', 'like', "%{$s}%")->orWhere('name', 'like', "%{$s}%"))
              ->orWhereHas('referred', fn($q) => $q->where('email', 'like', "%{$s}%")->orWhere('name', 'like', "%{$s}%"));
        }

        $items = $q->paginate((int) $request->get('per_page', 20));

        return response()->json([
            'referrals' => $items->map(fn($r) => [
                'id'                 => $r->id,
                'referrer'           => $r->referrer ? ['id' => $r->referrer->id, 'name' => $r->referrer->name, 'email' => $r->referrer->email] : null,
                'referred'           => $r->referred ? ['id' => $r->referred->id, 'name' => $r->referred->name, 'email' => $r->referred->email] : null,
                'eligible_purchases' => $r->eligible_purchases,
                'referral_code_used' => $r->referral_code_used,
                'created_at'         => $r->created_at,
            ]),
            'meta' => [
                'total'        => $items->total(),
                'per_page'     => $items->perPage(),
                'current_page' => $items->currentPage(),
                'last_page'    => $items->lastPage(),
            ],
        ]);
    }
}
