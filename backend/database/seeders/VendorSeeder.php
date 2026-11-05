<?php

namespace Database\Seeders;

use App\Models\MarketplaceCategory;
use App\Models\MarketplaceService;
use App\Models\User;
use App\Models\Vendor;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * Seeds three example [TEST] suppliers with approved services.
 * All data is clearly labelled as test data in business_name and email.
 */
class VendorSeeder extends Seeder
{
    public function run(): void
    {
        // Ensure categories exist first.
        $categories = MarketplaceCategory::pluck('id', 'platform');
        $fbCat      = $categories['facebook']  ?? MarketplaceCategory::first()?->id ?? 1;
        $igCat      = $categories['instagram'] ?? $fbCat;
        $ttCat      = $categories['tiktok']    ?? $fbCat;
        $ytCat      = $categories['youtube']   ?? $fbCat;
        $genCat     = $categories['general']   ?? $fbCat;

        $suppliers = [
            [
                'user' => [
                    'name'     => '[TEST] SocialBoost Pro',
                    'email'    => 'vendor1.test@turbostore.dev',
                    'password' => Hash::make('TestVendor@123'),
                ],
                'vendor' => [
                    'business_name'   => '[TEST] SocialBoost Pro',
                    'bio'             => 'TEST DATA — Specialist in Facebook and Instagram growth. Do not use in production.',
                    'commission_rate' => 10,
                ],
                'services' => [
                    [
                        'category_id'         => $fbCat,
                        'title'               => '[TEST] Facebook Page — 1,000 Likes',
                        'slug'                => 'test-facebook-page-1000-likes',
                        'description'         => 'TEST DATA: Get 1,000 real-looking Facebook page likes delivered within 3 days.',
                        'platform'            => 'facebook',
                        'what_you_get'        => '1,000 Facebook page likes from real-looking accounts.',
                        'requirements'        => 'Share your Facebook page URL.',
                        'starting_price_kobo' => 500000,  // ₦5,000
                        'delivery_days'       => 3,
                        'refund_policy'       => 'Full refund if likes are not delivered within 7 days.',
                    ],
                    [
                        'category_id'         => $igCat,
                        'title'               => '[TEST] Instagram — 500 Followers',
                        'slug'                => 'test-instagram-500-followers',
                        'description'         => 'TEST DATA: Gain 500 Instagram followers within 48 hours.',
                        'platform'            => 'instagram',
                        'what_you_get'        => '500 Instagram followers.',
                        'requirements'        => 'Provide your Instagram username. Account must be public.',
                        'starting_price_kobo' => 300000,  // ₦3,000
                        'delivery_days'       => 2,
                        'refund_policy'       => 'Refund if 90% of followers not delivered.',
                    ],
                ],
            ],
            [
                'user' => [
                    'name'     => '[TEST] TikTok Masters',
                    'email'    => 'vendor2.test@turbostore.dev',
                    'password' => Hash::make('TestVendor@123'),
                ],
                'vendor' => [
                    'business_name'   => '[TEST] TikTok Masters',
                    'bio'             => 'TEST DATA — TikTok growth specialist. Do not use in production.',
                    'commission_rate' => 10,
                ],
                'services' => [
                    [
                        'category_id'         => $ttCat,
                        'title'               => '[TEST] TikTok — 1,000 Video Views',
                        'slug'                => 'test-tiktok-1000-video-views',
                        'description'         => 'TEST DATA: Get 1,000 views on your TikTok video within 24 hours.',
                        'platform'            => 'tiktok',
                        'what_you_get'        => '1,000 TikTok video views.',
                        'requirements'        => 'Provide your TikTok video link.',
                        'starting_price_kobo' => 200000,  // ₦2,000
                        'delivery_days'       => 1,
                        'refund_policy'       => 'Full refund if views not delivered.',
                    ],
                    [
                        'category_id'         => $ytCat,
                        'title'               => '[TEST] YouTube — 200 Subscribers',
                        'slug'                => 'test-youtube-200-subscribers',
                        'description'         => 'TEST DATA: Gain 200 YouTube subscribers within 5 days.',
                        'platform'            => 'youtube',
                        'what_you_get'        => '200 YouTube channel subscribers.',
                        'requirements'        => 'Share your YouTube channel link. Channel must be public.',
                        'starting_price_kobo' => 800000,  // ₦8,000
                        'delivery_days'       => 5,
                        'refund_policy'       => 'Refund if fewer than 180 subscribers delivered.',
                    ],
                ],
            ],
            [
                'user' => [
                    'name'     => '[TEST] ContentKing Studio',
                    'email'    => 'vendor3.test@turbostore.dev',
                    'password' => Hash::make('TestVendor@123'),
                ],
                'vendor' => [
                    'business_name'   => '[TEST] ContentKing Studio',
                    'bio'             => 'TEST DATA — Professional content creation and account management. Do not use in production.',
                    'commission_rate' => 10,
                ],
                'services' => [
                    [
                        'category_id'         => $genCat,
                        'title'               => '[TEST] Social Media Content Pack — 10 Posts',
                        'slug'                => 'test-social-media-content-pack-10-posts',
                        'description'         => 'TEST DATA: Professionally designed 10 social media posts.',
                        'platform'            => 'general',
                        'what_you_get'        => '10 custom social media post designs (JPG + editable).',
                        'requirements'        => 'Provide your brand colors, logo, and content brief.',
                        'starting_price_kobo' => 2000000,  // ₦20,000
                        'delivery_days'       => 7,
                        'refund_policy'       => 'Revisions included. Refund if no delivery after 14 days.',
                    ],
                    [
                        'category_id'         => $genCat,
                        'title'               => '[TEST] 30-Day Social Media Management',
                        'slug'                => 'test-30-day-social-media-management',
                        'description'         => 'TEST DATA: Full account management for 30 days across 2 platforms.',
                        'platform'            => 'general',
                        'what_you_get'        => 'Daily posting, community management, and monthly report.',
                        'requirements'        => 'Share account access credentials securely.',
                        'starting_price_kobo' => 5000000,  // ₦50,000
                        'delivery_days'       => 30,
                        'refund_policy'       => 'Pro-rated refund based on days managed.',
                    ],
                ],
            ],
        ];

        foreach ($suppliers as $def) {
            $user = User::firstOrCreate(
                ['email' => $def['user']['email']],
                array_merge($def['user'], [
                    'email_verified_at' => now(),
                    'referral_code'     => Str::upper(Str::random(8)),
                ])
            );

            $vendor = Vendor::firstOrCreate(
                ['user_id' => $user->id],
                array_merge($def['vendor'], [
                    'status'      => 'approved',
                    'approved_at' => now(),
                ])
            );

            foreach ($def['services'] as $serviceData) {
                MarketplaceService::firstOrCreate(
                    ['slug' => $serviceData['slug']],
                    array_merge($serviceData, [
                        'vendor_id'   => $vendor->id,
                        'status'      => 'approved',
                        'approved_at' => now(),
                    ])
                );
            }
        }

        $this->command->info('[TEST] VendorSeeder: 3 test suppliers and 6 test services seeded.');
        $this->command->info('Test vendor credentials: vendor1.test@turbostore.dev / TestVendor@123');
        $this->command->info('(and vendor2, vendor3 with same password)');
    }
}
