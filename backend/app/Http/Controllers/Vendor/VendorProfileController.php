<?php

namespace App\Http\Controllers\Vendor;

use App\Http\Controllers\Controller;
use App\Services\VendorService;
use Illuminate\Http\Request;

class VendorProfileController extends Controller
{
    /**
     * POST /api/vendor/apply
     * Apply to become a vendor.
     */
    public function apply(Request $request, VendorService $vendorService)
    {
        $validated = $request->validate([
            'business_name' => 'required|string|max:100',
            'bio'           => 'nullable|string|max:500',
        ]);

        if ($request->user()->vendor()->exists()) {
            return response()->json(['message' => 'You already have a vendor profile.'], 422);
        }

        try {
            $vendor = $vendorService->apply(
                $request->user(),
                $validated['business_name'],
                $validated['bio'] ?? null,
            );

            return response()->json([
                'message' => 'Vendor profile created. You can start listing services now.',
                'data'    => $vendor,
            ], 201);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    /**
     * GET /api/vendor/profile
     * Return the authenticated user's vendor profile.
     */
    public function show(Request $request)
    {
        $vendor = $request->user()->vendor;
        $vendor->load('user:id,name,email');

        return response()->json(['data' => $vendor]);
    }

    /**
     * PUT /api/vendor/profile
     * Update vendor bio/business_name (not allowed if suspended).
     */
    public function update(Request $request)
    {
        $vendor = $request->user()->vendor;

        if ($vendor->status === 'suspended') {
            return response()->json(['message' => 'Your vendor account is suspended.'], 403);
        }

        $validated = $request->validate([
            'business_name' => 'sometimes|string|max:100',
            'bio'           => 'nullable|string|max:500',
        ]);

        $vendor->update($validated);

        return response()->json([
            'message' => 'Vendor profile updated.',
            'data'    => $vendor->fresh(),
        ]);
    }
}
