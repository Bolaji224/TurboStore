<?php

namespace App\DTOs;

readonly class CountryData
{
    public function __construct(
        public string  $code,    // Provider-native country code
        public string  $name,    // Human-readable display name
        public ?string $iso,     // ISO 3166-1 alpha-2 (if known)
        public ?string $prefix,  // E.164 dialling prefix e.g. "+1"
    ) {}

    public function toArray(): array
    {
        return [
            'code'   => $this->code,
            'name'   => $this->name,
            'iso'    => $this->iso,
            'prefix' => $this->prefix,
        ];
    }
}
