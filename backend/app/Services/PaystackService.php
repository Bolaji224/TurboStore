<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class PaystackService
{
    private string $secretKey;
    private const BASE = 'https://api.paystack.co';

    public function __construct()
    {
        $this->secretKey = config('services.paystack.secret_key');
    }

    public function initialize(string $email, int $amountKobo, string $reference, string $callbackUrl): string
    {
        $res = Http::withToken($this->secretKey)
            ->post(self::BASE . '/transaction/initialize', [
                'email'        => $email,
                'amount'       => $amountKobo,
                'reference'    => $reference,
                'callback_url' => $callbackUrl,
            ]);

        if (!$res->successful()) {
            throw new \RuntimeException('Paystack init failed: ' . $res->body());
        }

        return $res->json('data.authorization_url');
    }

    public function verify(string $reference): array
    {
        $res = Http::withToken($this->secretKey)
            ->get(self::BASE . "/transaction/verify/{$reference}");

        if (!$res->successful()) {
            throw new \RuntimeException('Paystack verify failed: ' . $res->body());
        }

        return $res->json('data') ?? [];
    }

    public function validateSignature(string $payload, string $signature): bool
    {
        return hash_equals(
            hash_hmac('sha512', $payload, $this->secretKey),
            $signature
        );
    }
}
