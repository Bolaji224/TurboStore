<?php

namespace App\Services;

class PricingService
{
    /**
     * Convert a provider USD cost to the TurboStore customer price in kobo (NGN × 100).
     * Applies exchange rate + markup, then rounds to the nearest clean naira amount.
     */
    public function calculateCustomerPrice(float $providerCostUsd): int
    {
        if ($providerCostUsd <= 0) {
            return 0;
        }

        $rate      = (float) config('sms.pricing.usd_ngn_rate', 1600);
        $markup    = (float) config('sms.pricing.markup_pct', 30) / 100;
        $minProfit = (int)   config('sms.pricing.min_profit_naira', 500);
        $roundTo   = (int)   config('sms.pricing.round_to', 100);

        $naira      = $providerCostUsd * $rate;
        $pctProfit  = $naira * $markup;
        $profit     = max($pctProfit, $minProfit); // always earn at least ₦500
        $withMarkup = $naira + $profit;

        // Round UP to nearest $roundTo naira for clean display (e.g. ₦600, ₦700)
        if ($roundTo > 0) {
            $withMarkup = ceil($withMarkup / $roundTo) * $roundTo;
        }

        return (int) ($withMarkup * 100); // convert naira → kobo
    }

    public function koboToNaira(int $kobo): float
    {
        return $kobo / 100;
    }

    public function nairaToKobo(float $naira): int
    {
        return (int) round($naira * 100);
    }

    public function formatKobo(int $kobo): string
    {
        return '₦' . number_format($kobo / 100, 0);
    }
}
