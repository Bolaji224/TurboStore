<?php

return [

    /*
    | Klaviyo — the waitlist site (waitlist/api/waitlist.ts) subscribes sign-ups
    | to this list. TurboStore only READS it (scopes: lists:read, profiles:read).
    */
    'klaviyo' => [
        'private_key' => env('KLAVIYO_PRIVATE_API_KEY'),
        'list_id'     => env('KLAVIYO_WAITLIST_LIST_ID'),
        'base_url'    => 'https://a.klaviyo.com/api',
        'revision'    => env('KLAVIYO_API_REVISION', '2024-10-15'),
    ],

    /*
    | Launch campaign delivery pacing. Each batch is released `batch_delay`
    | seconds after the previous one so the SMTP provider is not flooded.
    */
    'launch' => [
        'batch_size'          => (int) env('LAUNCH_EMAIL_BATCH_SIZE', 50),
        'batch_delay_seconds' => (int) env('LAUNCH_EMAIL_BATCH_DELAY', 60),
        'activation_ttl_days' => (int) env('LAUNCH_ACTIVATION_TTL_DAYS', 7),
        // A queued/sending row untouched for this long is considered stuck
        // (e.g. worker crashed) and can be re-queued with "Retry".
        'stale_after_minutes' => (int) env('LAUNCH_EMAIL_STALE_MINUTES', 60),
    ],
];
