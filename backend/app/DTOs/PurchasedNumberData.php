<?php

namespace App\DTOs;

readonly class PurchasedNumberData
{
    public function __construct(
        public string $providerOrderId, // Provider's own order/activation ID
        public string $phoneNumber,     // Assigned virtual phone number
        public string $country,         // Country code used
        public string $service,         // Service code used
        public float  $providerCost,    // Actual cost charged by provider (USD)
        public string $rawStatus,       // Provider's raw status string
    ) {}
}
