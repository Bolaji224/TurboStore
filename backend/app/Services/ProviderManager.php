<?php

namespace App\Services;

use App\Contracts\SmsProviderInterface;
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
     * Placeholder for future automatic provider selection based on
     * availability, price, success rate, and health.
     *
     * @throws \RuntimeException when no provider has stock
     */
    public function autoSelect(string $country, string $service): SmsProviderInterface
    {
        // Phase 2: implement scoring + fallback across providers.
        // For now, return the configured default.
        return $this->default();
    }
}
