<?php

namespace Database\Factories;

use App\Models\MarketplaceCategory;
use App\Models\MarketplaceService;
use App\Models\Vendor;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class MarketplaceServiceFactory extends Factory
{
    protected $model = MarketplaceService::class;

    public function definition(): array
    {
        $title = $this->faker->words(4, true);

        return [
            'vendor_id'           => Vendor::factory(),
            'category_id'         => MarketplaceCategory::factory(),
            'title'               => ucwords($title),
            'slug'                => Str::slug($title) . '-' . $this->faker->unique()->numerify('###'),
            'description'         => $this->faker->paragraphs(2, true),
            'platform'            => $this->faker->randomElement(['facebook', 'instagram', 'tiktok', 'youtube', 'general']),
            'what_you_get'        => $this->faker->sentences(3, true),
            'requirements'        => 'Provide your profile link and requirements.',
            'starting_price_kobo' => $this->faker->randomElement([500000, 1000000, 2000000, 5000000]),
            'delivery_days'       => $this->faker->randomElement([1, 3, 5, 7]),
            'refund_policy'       => 'Full refund if delivery conditions are not met.',
            'status'              => 'approved',
            'approved_at'         => now(),
        ];
    }

    public function draft(): static
    {
        return $this->state(['status' => 'draft', 'approved_at' => null]);
    }

    public function pendingReview(): static
    {
        return $this->state(['status' => 'pending_review', 'approved_at' => null]);
    }
}
