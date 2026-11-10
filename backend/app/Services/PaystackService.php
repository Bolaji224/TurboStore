<?php

namespace App\Services;

use App\DTOs\PaystackVerification;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PaystackService
{
    private string $secretKey;
    private const BASE = 'https://api.paystack.co';

    public function __construct()
    {
        // Cast so a missing key degrades to "not configured" instead of a TypeError
        // that takes down every endpoint resolving this service.
        $this->secretKey = (string) config('services.paystack.secret_key');
    }

    public function isConfigured(): bool
    {
        return $this->secretKey !== '';
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

    /**
     * Raw verify call. Prefer verifyTransaction(), which classifies the result.
     *
     * @deprecated Throws on any non-2xx, which callers have historically
     *             mistaken for "Paystack unreachable". Use verifyTransaction().
     */
    public function verify(string $reference): array
    {
        $res = Http::withToken($this->secretKey)
            ->get(self::BASE . '/transaction/verify/' . rawurlencode($reference));

        if (!$res->successful()) {
            throw new \RuntimeException('Paystack verify failed: ' . $res->body());
        }

        return $res->json('data') ?? [];
    }

    /**
     * Ask Paystack for the authoritative state of a transaction and classify it.
     * Never throws for gateway/network problems — those are UNAVAILABLE, which
     * callers must treat as "unknown, do not credit, try again later".
     */
    public function verifyTransaction(string $reference): PaystackVerification
    {
        if (!$this->isConfigured()) {
            Log::critical('Paystack verification impossible: PAYSTACK_SECRET_KEY is not configured');
            return PaystackVerification::unavailable('not_configured');
        }

        try {
            $res = Http::withToken($this->secretKey)
                ->acceptJson()
                ->connectTimeout(10)
                ->timeout(20)
                ->get(self::BASE . '/transaction/verify/' . rawurlencode($reference));
        } catch (ConnectionException $e) {
            Log::warning('Paystack verify: connection failed', ['reference' => $reference, 'error' => $e->getMessage()]);
            return PaystackVerification::unavailable('connection_error');
        }

        $status = $res->status();

        if (in_array($status, [401, 403], true)) {
            // Wrong/revoked key or test↔live mismatch on our side. Never a reason to credit.
            Log::critical('Paystack verify: authentication rejected — check PAYSTACK_SECRET_KEY', [
                'reference' => $reference, 'http_status' => $status,
            ]);
            return PaystackVerification::unavailable('auth_error');
        }

        if ($status === 429 || $res->serverError()) {
            Log::warning('Paystack verify: gateway unavailable', ['reference' => $reference, 'http_status' => $status]);
            return PaystackVerification::unavailable('gateway_' . $status);
        }

        if (in_array($status, [400, 404], true)) {
            // Paystack answers 400 "Transaction reference not found" for unknown references.
            return PaystackVerification::notFound((string) $res->json('message'));
        }

        if (!$res->successful() || $res->json('status') !== true || !is_array($res->json('data'))) {
            Log::error('Paystack verify: unexpected response', [
                'reference' => $reference, 'http_status' => $status, 'message' => $res->json('message'),
            ]);
            return PaystackVerification::unavailable('unexpected_response');
        }

        $data      = $res->json('data');
        $txnStatus = strtolower((string) ($data['status'] ?? ''));

        if ($txnStatus === 'success') {
            return PaystackVerification::success($data);
        }

        if (in_array($txnStatus, PaystackVerification::TERMINAL_FAILURE_STATUSES, true)) {
            return PaystackVerification::failed($data);
        }

        // abandoned / ongoing / pending / processing / queued / unknown future values
        return PaystackVerification::inProgress($data);
    }

    public function validateSignature(string $payload, string $signature): bool
    {
        // With an empty secret, anyone could compute a "valid" HMAC.
        if (!$this->isConfigured() || $signature === '') {
            return false;
        }

        return hash_equals(
            hash_hmac('sha512', $payload, $this->secretKey),
            $signature
        );
    }
}
