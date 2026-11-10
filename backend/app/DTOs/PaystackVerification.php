<?php

namespace App\DTOs;

/**
 * Classified result of Paystack's GET /transaction/verify/{reference}.
 *
 * Only SUCCESS can ever lead to a wallet credit, and only after the payload
 * has been matched against our own payment record.
 */
final class PaystackVerification
{
    /** Paystack confirms the charge succeeded. */
    public const SUCCESS     = 'success';
    /** Paystack reports a terminal failure (failed / reversed). */
    public const FAILED      = 'failed';
    /** Charge exists but is not finished (abandoned, ongoing, pending, processing, queued…). */
    public const IN_PROGRESS = 'in_progress';
    /** Paystack has no transaction with this reference (never paid, or wrong key mode). */
    public const NOT_FOUND   = 'not_found';
    /** We could not get a trustworthy answer (network, 5xx, 429, auth/config error). */
    public const UNAVAILABLE = 'unavailable';

    /** Paystack transaction statuses that will never become successful. */
    public const TERMINAL_FAILURE_STATUSES = ['failed', 'reversed'];

    private function __construct(
        public readonly string  $outcome,
        public readonly array   $data = [],
        public readonly ?string $detail = null,
    ) {}

    public static function success(array $data): self                { return new self(self::SUCCESS, $data); }
    public static function failed(array $data): self                 { return new self(self::FAILED, $data, $data['gateway_response'] ?? $data['status'] ?? null); }
    public static function inProgress(array $data): self             { return new self(self::IN_PROGRESS, $data, $data['status'] ?? null); }
    public static function notFound(?string $detail = null): self    { return new self(self::NOT_FOUND, [], $detail); }
    public static function unavailable(string $detail): self         { return new self(self::UNAVAILABLE, [], $detail); }

    public function isSuccess(): bool { return $this->outcome === self::SUCCESS; }

    /**
     * Does Paystack's confirmed charge correspond exactly to our record?
     * Returns null when it matches, or a short mismatch reason.
     */
    public function mismatchAgainst(string $reference, int $amountKobo, string $currency = 'NGN'): ?string
    {
        if ((string) ($this->data['reference'] ?? '') !== $reference) {
            return 'reference_mismatch';
        }
        if (!isset($this->data['amount']) || (int) $this->data['amount'] !== $amountKobo) {
            return 'amount_mismatch';
        }
        if (strtoupper((string) ($this->data['currency'] ?? '')) !== strtoupper($currency)) {
            return 'currency_mismatch';
        }
        return null;
    }
}
