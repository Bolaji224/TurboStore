<?php

namespace App\Services;

class CommissionService
{
    public const DEFAULT_RATE = 10;

    /**
     * Calculate commission and supplier earning amounts from a gross price.
     *
     * Uses floor division to ensure commission + earning = price exactly
     * (any fractional kobo is left with the supplier).
     *
     * @param  int  $priceKobo   Gross order price in kobo (smallest NGN unit)
     * @param  int  $rate        Commission rate as an integer percentage (0-100)
     * @return array{
     *   price_kobo: int,
     *   commission_rate: int,
     *   commission_kobo: int,
     *   vendor_earning_kobo: int
     * }
     */
    public function calculate(int $priceKobo, int $rate): array
    {
        $commissionKobo    = (int) floor($priceKobo * $rate / 100);
        $vendorEarningKobo = $priceKobo - $commissionKobo;

        return [
            'price_kobo'          => $priceKobo,
            'commission_rate'     => $rate,
            'commission_kobo'     => $commissionKobo,
            'vendor_earning_kobo' => $vendorEarningKobo,
        ];
    }

    /**
     * Assert that stored amounts are internally consistent.
     * Throws if the invariant price = commission + earning is violated.
     */
    public function assertConsistent(int $priceKobo, int $commissionKobo, int $vendorEarningKobo): void
    {
        if ($priceKobo !== $commissionKobo + $vendorEarningKobo) {
            throw new \LogicException(
                "Commission invariant violated: {$priceKobo} ≠ {$commissionKobo} + {$vendorEarningKobo}"
            );
        }
    }
}
