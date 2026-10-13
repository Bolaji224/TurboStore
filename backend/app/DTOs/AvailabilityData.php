<?php

namespace App\DTOs;

readonly class AvailabilityData
{
    public function __construct(
        public string $country,        // Provider-native country code
        public string $service,        // Provider-native service code
        public int    $qty,            // Available quantity
        public float  $providerPrice,  // Provider cost in USD
        public int    $customerPrice,  // TurboStore price in kobo
        public bool   $available,      // Shorthand: qty > 0
    ) {}

    public function toArray(): array
    {
        return [
            'country'        => $this->country,
            'service'        => $this->service,
            'qty'            => $this->qty,
            'available'      => $this->available,
            'customer_price' => $this->customerPrice,
        ];
    }
}
