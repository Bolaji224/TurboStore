<?php

namespace App\Http\Controllers\Vendor;

use App\Http\Controllers\Controller;
use App\Models\MarketplaceOrder;
use App\Models\MarketplaceService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class VendorServiceController extends Controller
{
    /**
     * GET /api/vendor/services
     * List all of the vendor's own services (all statuses).
     */
    public function index(Request $request)
    {
        $vendor = $request->user()->vendor;

        $services = MarketplaceService::where('vendor_id', $vendor->id)
            ->with('category')
            ->orderByDesc('created_at')
            ->paginate(20);

        return response()->json([
            'data' => $services->items(),
            'meta' => [
                'current_page' => $services->currentPage(),
                'last_page'    => $services->lastPage(),
                'total'        => $services->total(),
            ],
        ]);
    }

    /**
     * POST /api/vendor/services
     * Create a new service (starts as 'draft').
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'category_id'         => 'required|integer|exists:marketplace_categories,id',
            'title'               => 'required|string|max:120',
            'description'         => 'required|string|max:3000',
            'platform'            => 'required|string|max:60',
            'what_you_get'        => 'required|string|max:2000',
            'requirements'        => 'nullable|string',
            'starting_price_kobo' => 'required|integer|min:100',
            'delivery_days'       => 'required|integer|min:1|max:90',
            'refund_policy'       => 'nullable|string',
            'image'               => 'nullable|image|max:2048',
        ]);

        $vendor = $request->user()->vendor;
        $slug   = $this->generateSlug($validated['title']);

        $imageUrl = null;
        if ($request->hasFile('image')) {
            $path     = $request->file('image')->store('services', 'public');
            $imageUrl = url(Storage::url($path));
        }

        $service = MarketplaceService::create(array_merge($validated, [
            'vendor_id' => $vendor->id,
            'slug'      => $slug,
            'status'    => 'draft',
            'image_url' => $imageUrl,
        ]));

        return response()->json([
            'message' => 'Service created as draft.',
            'data'    => $service->load('category'),
        ], 201);
    }

    /**
     * PUT /api/vendor/services/{id}
     * Update a service. If it was approved, reset to draft.
     */
    public function update(Request $request, int $id)
    {
        $vendor  = $request->user()->vendor;
        $service = MarketplaceService::where('id', $id)
            ->where('vendor_id', $vendor->id)
            ->firstOrFail();

        $validated = $request->validate([
            'category_id'         => 'sometimes|integer|exists:marketplace_categories,id',
            'title'               => 'sometimes|string|max:120',
            'description'         => 'sometimes|string|max:3000',
            'platform'            => 'sometimes|string|max:60',
            'what_you_get'        => 'sometimes|string|max:2000',
            'requirements'        => 'nullable|string',
            'starting_price_kobo' => 'sometimes|integer|min:100',
            'delivery_days'       => 'sometimes|integer|min:1|max:90',
            'refund_policy'       => 'nullable|string',
            'image'               => 'nullable|image|max:2048',
        ]);

        if ($service->status === 'approved') {
            $validated['status'] = 'draft';
        }

        if (isset($validated['title'])) {
            $validated['slug'] = $this->generateSlug($validated['title']);
        }

        if ($request->hasFile('image')) {
            // Delete old image if it exists
            if ($service->image_url) {
                $old = str_replace('/storage/', '', $service->image_url);
                Storage::disk('public')->delete($old);
            }
            $path = $request->file('image')->store('services', 'public');
            $validated['image_url'] = url(Storage::url($path));
        }

        $service->update($validated);

        return response()->json([
            'message' => 'Service updated.' . ($service->status === 'draft' ? ' It has been reset to draft for re-review.' : ''),
            'data'    => $service->fresh()->load('category'),
        ]);
    }

    /**
     * POST /api/vendor/services/{id}/submit
     * Submit for review (draft or rejected → pending_review).
     */
    public function submit(int $id)
    {
        $vendor  = request()->user()->vendor;
        $service = MarketplaceService::where('id', $id)
            ->where('vendor_id', $vendor->id)
            ->firstOrFail();

        if (!in_array($service->status, ['draft', 'rejected'], true)) {
            return response()->json([
                'message' => 'Only draft or rejected services can be submitted for review (current status: ' . $service->status . ').',
            ], 422);
        }

        $service->update(['status' => 'pending_review']);

        return response()->json([
            'message' => 'Service submitted for review.',
            'data'    => $service->fresh(),
        ]);
    }

    /**
     * DELETE /api/vendor/services/{id}
     * Delete a service (only if no paid orders exist).
     */
    public function destroy(int $id)
    {
        $vendor  = request()->user()->vendor;
        $service = MarketplaceService::where('id', $id)
            ->where('vendor_id', $vendor->id)
            ->firstOrFail();

        $paidOrdersExist = MarketplaceOrder::where('service_id', $service->id)
            ->whereNotIn('status', ['cancelled', 'refunded'])
            ->exists();

        if ($paidOrdersExist) {
            return response()->json([
                'message' => 'Cannot delete a service with existing orders.',
            ], 422);
        }

        $service->delete();

        return response()->json(['message' => 'Service deleted.']);
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private function generateSlug(string $title): string
    {
        $base = Str::slug($title);
        $slug = $base;
        $i    = 1;

        while (MarketplaceService::where('slug', $slug)->exists()) {
            $slug = $base . '-' . $i++;
        }

        return $slug;
    }
}
