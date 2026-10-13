<?php

namespace App\DTOs;

readonly class OrderStatusData
{
    public function __construct(
        public string  $providerOrderId, // Provider's order ID
        public string  $status,          // Normalized TurboStore status
        public ?string $otp,             // OTP code if received, null otherwise
        public string  $rawStatus,       // Raw status string from provider
    ) {}
}
