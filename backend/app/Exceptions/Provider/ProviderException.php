<?php

namespace App\Exceptions\Provider;

use RuntimeException;

class ProviderException extends RuntimeException
{
    public function __construct(
        string $message,
        public readonly string $provider,
        int $code = 0,
        ?\Throwable $previous = null,
    ) {
        parent::__construct($message, $code, $previous);
    }
}
