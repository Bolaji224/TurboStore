<?php

return [

    'default' => env('SMS_DEFAULT_PROVIDER', 'fivesim'),

    'pricing' => [
        // Exchange rate used to convert provider USD costs → NGN
        'usd_ngn_rate' => (float) env('USD_NGN_RATE', 1600),
        // Percentage markup over provider cost (50 = 50%)
        'markup_pct'   => (float) env('PRICE_MARKUP_PCT', 50),
        // Round customer price up to nearest N naira for clean display
        'round_to'     => (int) env('PRICE_ROUND_NAIRA', 50),
    ],

    'providers' => [

        'fivesim' => [
            'key'      => env('FIVESIM_API_KEY'),
            'base_url' => env('FIVESIM_BASE_URL', 'https://5sim.net/v1'),
            'timeout'  => 30,
            'retry'    => 2,
        ],

        'smspool' => [
            'key'      => env('SMSPOOL_API_KEY'),
            'base_url' => env('SMSPOOL_BASE_URL', 'https://api.smspool.net'),
            'timeout'  => 30,
            'retry'    => 2,
        ],

        'grizzly' => [
            'key'      => env('GRIZZLY_API_KEY'),
            'base_url' => env('GRIZZLY_BASE_URL', 'https://api.grizzlysms.com/stubs/handler_api.php'),
            'timeout'  => 30,
            'retry'    => 2,
        ],
    ],

    'order' => [
        // How long a waiting_for_otp order stays alive before auto-expiry
        'ttl_minutes'    => (int) env('ORDER_TTL_MINUTES', 20),
        // How often to poll provider for OTP (seconds)
        'poll_interval'  => (int) env('ORDER_POLL_SECONDS', 30),
    ],

];
