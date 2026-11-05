<?php

namespace Database\Seeders;

use App\Models\MarketplaceCategory;
use Illuminate\Database\Seeder;

class MarketplaceCategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            [
                'name'        => 'Facebook Marketing',
                'slug'        => 'facebook-marketing',
                'platform'    => 'facebook',
                'icon'        => '📘',
                'description' => 'Page likes, post engagement, reach boosting, and Facebook ad management services.',
            ],
            [
                'name'        => 'Instagram Marketing',
                'slug'        => 'instagram-marketing',
                'platform'    => 'instagram',
                'icon'        => '📸',
                'description' => 'Followers, engagement, story views, reel promotion, and Instagram growth services.',
            ],
            [
                'name'        => 'Twitter / X Marketing',
                'slug'        => 'twitter-marketing',
                'platform'    => 'twitter',
                'icon'        => '🐦',
                'description' => 'Followers, retweets, impressions, and X (Twitter) engagement services.',
            ],
            [
                'name'        => 'TikTok Marketing',
                'slug'        => 'tiktok-marketing',
                'platform'    => 'tiktok',
                'icon'        => '🎵',
                'description' => 'TikTok followers, video views, likes, and viral growth services.',
            ],
            [
                'name'        => 'YouTube Marketing',
                'slug'        => 'youtube-marketing',
                'platform'    => 'youtube',
                'icon'        => '▶️',
                'description' => 'YouTube subscribers, views, watch time, and channel growth services.',
            ],
            [
                'name'        => 'Content Creation',
                'slug'        => 'content-creation',
                'platform'    => 'general',
                'icon'        => '✍️',
                'description' => 'Social media post design, copywriting, video editing, and creative content services.',
            ],
            [
                'name'        => 'Account Management',
                'slug'        => 'account-management',
                'platform'    => 'general',
                'icon'        => '⚙️',
                'description' => 'Ongoing social media account management, scheduling, and community management.',
            ],
            [
                'name'        => 'Ad Campaign Management',
                'slug'        => 'ad-campaigns',
                'platform'    => 'general',
                'icon'        => '📊',
                'description' => 'Setup and management of paid advertising campaigns across social platforms.',
            ],
        ];

        foreach ($categories as $index => $data) {
            MarketplaceCategory::updateOrCreate(
                ['slug' => $data['slug']],
                array_merge($data, ['sort_order' => $index, 'is_active' => true])
            );
        }
    }
}
