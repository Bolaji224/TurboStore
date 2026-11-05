<?php

namespace App\Services;

use App\Contracts\SmsProviderInterface;
use App\DTOs\AvailabilityData;
use App\Exceptions\Provider\ProviderOutOfStockException;
use App\Services\Providers\FiveSimProvider;
use App\Services\Providers\GrizzlyProvider;
use App\Services\Providers\SmsPoolProvider;

class ProviderManager
{
    /** @var array<string, SmsProviderInterface> */
    private array $providers;

    public function __construct(
        private FiveSimProvider $fiveSim,
        private SmsPoolProvider $smsPool,
        private GrizzlyProvider $grizzly,
    ) {
        $this->providers = [
            'fivesim' => $fiveSim,
            'smspool' => $smsPool,
            'grizzly' => $grizzly,
        ];
    }

    /**
     * Get a specific provider by slug.
     * @throws \InvalidArgumentException
     */
    public function provider(string $name): SmsProviderInterface
    {
        $name = strtolower(trim($name));

        if (!isset($this->providers[$name])) {
            throw new \InvalidArgumentException(
                "Unknown provider '{$name}'. Available: " . implode(', ', $this->available())
            );
        }

        return $this->providers[$name];
    }

    /** Get the configured default provider. */
    public function default(): SmsProviderInterface
    {
        return $this->provider(config('sms.default', 'fivesim'));
    }

    /** List of registered provider slugs. */
    public function available(): array
    {
        return array_keys($this->providers);
    }

    /**
     * Return providers in configured priority order, filtered to those with stock.
     * First entry is tried first when placing an order; subsequent entries are fallbacks.
     *
     * @return array<int, array{driver: SmsProviderInterface, name: string, availability: AvailabilityData}>
     * @throws ProviderOutOfStockException when no provider has stock
     */
    public function priorityList(string $country, string $service): array
    {
        $order = config('sms.provider_priority', array_keys($this->providers));
        $list  = [];

        foreach ($order as $name) {
            if (!isset($this->providers[$name])) {
                continue;
            }
            try {
                $avail = $this->providers[$name]->getAvailability($country, $service);
                if ($avail->available) {
                    $list[] = [
                        'driver'       => $this->providers[$name],
                        'name'         => $name,
                        'availability' => $avail,
                    ];
                }
            } catch (\Throwable) {
                // Provider offline — skip
            }
        }

        if (empty($list)) {
            throw new ProviderOutOfStockException(
                "No numbers available for {$service} in {$country} from any provider.",
                'auto',
            );
        }

        return $list;
    }

    /**
     * Pick the best provider for a given country+service.
     * Checks all funded providers and returns the one with the lowest
     * customer price that currently has stock.
     *
     * @return array{driver: SmsProviderInterface, name: string, availability: AvailabilityData}
     * @throws ProviderOutOfStockException when no provider has stock
     */
    public function autoSelect(string $country, string $service): array
    {
        $best      = null;
        $bestPrice = PHP_INT_MAX;

        foreach ($this->providers as $name => $driver) {
            try {
                $avail = $driver->getAvailability($country, $service);
                if ($avail->available && $avail->customerPrice < $bestPrice) {
                    $best      = ['driver' => $driver, 'name' => $name, 'availability' => $avail];
                    $bestPrice = $avail->customerPrice;
                }
            } catch (\Throwable) {
                // Provider offline or erroring — skip
            }
        }

        if (!$best) {
            throw new ProviderOutOfStockException(
                "No numbers available for {$service} in {$country} from any provider.",
                'auto',
            );
        }

        return $best;
    }

    /**
     * Return the best availability data across all funded providers.
     * Used by the catalogue to show the lowest live price.
     */
    public function bestAvailability(string $country, string $service): AvailabilityData
    {
        $best = null;

        foreach ($this->providers as $driver) {
            try {
                $avail = $driver->getAvailability($country, $service);
                if ($avail->available && (!$best || $avail->customerPrice < $best->customerPrice)) {
                    $best = $avail;
                }
            } catch (\Throwable) {}
        }

        return $best ?? new AvailabilityData($country, $service, 0, 0, 0, false);
    }
}
