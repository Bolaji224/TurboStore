<?php

namespace App\Contracts;

use App\DTOs\AvailabilityData;
use App\DTOs\CountryData;
use App\DTOs\OrderStatusData;
use App\DTOs\PurchasedNumberData;
use App\DTOs\ServiceData;

interface SmsProviderInterface
{
    /** Canonical slug used in orders and config ('fivesim', 'smspool', 'grizzly'). */
    public function getName(): string;

    /** Account balance in USD. */
    public function getBalance(): float;

    /** @return CountryData[] */
    public function getCountries(): array;

    /**
     * Available services for a given provider-native country code.
     * @return ServiceData[]
     */
    public function getServices(string $country): array;

    /** Qty and price for a specific country+service combination. */
    public function getAvailability(string $country, string $service): AvailabilityData;

    /**
     * Purchase a virtual number from the provider.
     * Throws ProviderOutOfStockException, ProviderPurchaseException, etc.
     */
    public function buyNumber(string $country, string $service): PurchasedNumberData;

    /** Retrieve current order state and any received OTP. */
    public function getOrderStatus(string $providerOrderId): OrderStatusData;

    /** Cancel / request refund from the provider. */
    public function cancelOrder(string $providerOrderId): bool;

    /** Mark the order as finished on the provider side. */
    public function finishOrder(string $providerOrderId): bool;
}
