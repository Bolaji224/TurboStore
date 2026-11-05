<?php

namespace App\Http\Controllers\Marketplace;

use App\Http\Controllers\Controller;
use App\Models\MarketplaceCategory;
use App\Models\MarketplaceService;
use Illuminate\Http\Request;

class MarketplaceCatalogueController extends Controller
{
    /**
     * GET /api/marketplace/categories
     * Return all active categories ordered by sort_order.
     */
    public function categories()
    {
        $categories = MarketplaceCategory::active()
            ->orderBy('sort_order')
            ->get();

        return response()->json(['data' => $categories]);
    }

    /**
     * GET /api/marketplace/services
     * Public, paginated listing of approved services from approved vendors.
     *
     * Query params:
     *   search, platform, category_id,
     *   min_price (naira), max_price (naira),
     *   sort: price_asc | price_desc | newest | rating
     */
    public function services(Request $request)
    {
        $query = MarketplaceService::approved()
            ->whereHas('vendor', fn($q) => $q->where('status', 'approved'))
            ->with([
                'vendor' => fn($q) => $q->with(['user' => fn($u) => $u->select('id', 'name')]),
                'category',
            ]);

        if ($search = $request->input('search')) {
            $query->search($search);
        }

        if ($platform = $request->input('platform')) {
            $query->forPlatform($platform);
        }

        if ($categoryId = $request->input('category_id')) {
            $query->where('category_id', (int) $categoryId);
        }

        // min/max_price are received in naira, convert to kobo for DB
        if ($minPrice = $request->input('min_price')) {
            $query->where('starting_price_kobo', '>=', (int) ($minPrice * 100));
        }

        if ($maxPrice = $request->input('max_price')) {
            $query->where('starting_price_kobo', '<=', (int) ($maxPrice * 100));
        }

        $sort = $request->input('sort', 'newest');
        match ($sort) {
            'price_asc'  => $query->orderBy('starting_price_kobo', 'asc'),
            'price_desc' => $query->orderBy('starting_price_kobo', 'desc'),
            'rating'     => $query->orderByDesc('avg_rating'),
            default      => $query->orderByDesc('created_at'),
        };

        $services = $query->paginate(20);

        return response()->json([
            'data' => $services->items(),
            'meta' => [
                'current_page' => $services->currentPage(),
                'last_page'    => $services->lastPage(),
                'total'        => $services->total(),
                'per_page'     => $services->perPage(),
            ],
        ]);
    }

    /**
     * GET /api/marketplace/services/{slug}
     * Show a single approved service with vendor, category and recent reviews.
     */
    public function show(string $slug)
    {
        $service = MarketplaceService::approved()
            ->where('slug', $slug)
            ->with([
                'vendor.user:id,name',
                'category',
                'reviews' => fn($q) => $q->where('is_approved', true)
                    ->latest()
                    ->limit(5),
            ])
            ->firstOrFail();

        return response()->json(['data' => $service]);
    }
}
