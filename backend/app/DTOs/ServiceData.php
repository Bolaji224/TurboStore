<?php

namespace App\DTOs;

readonly class ServiceData
{
    public function __construct(
        public string  $code,          // Provider-native service code
        public string  $name,          // Human-readable display name
        public int     $qty,           // Available quantity (0 = out of stock)
        public float   $providerPrice, // Provider cost in USD
        public int     $customerPrice, // TurboStore price in kobo (NGN × 100)
    ) {}

    public function toArray(): array
    {
        return [
            'code'           => $this->code,
            'name'           => $this->name,
            'qty'            => $this->qty,
            'available'      => $this->qty > 0,
            'customer_price' => $this->customerPrice,
        ];
    }
}
