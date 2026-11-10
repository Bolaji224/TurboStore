<?php

namespace App\Jobs;

use App\Services\PaystackPaymentProcessor;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * Re-verifies a pending Paystack payment until Paystack gives a final answer,
 * so a real payment is still credited when the inline verify couldn't confirm
 * it (gateway blip, user closed the tab) — without ever trusting the browser.
 *
 * Schedule (from first dispatch): 1m, 2m, 5m, 10m, 30m, 1h, 3h, 6h, 12h, 24h.
 */
class ReconcilePaystackPaymentJob implements ShouldQueue, ShouldBeUnique
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public const SCHEDULE = [60, 120, 300, 600, 1800, 3600, 10800, 21600, 43200, 86400];

    /** Each check is a separate attempt; exceptions are not expected but are bounded. */
    public int $tries = 11;
    public int $maxExceptions = 3;
    public int $uniqueFor = 600;

    public function __construct(public string $reference) {}

    public function uniqueId(): string
    {
        return $this->reference;
    }

    public static function schedule(string $reference): void
    {
        static::dispatch($reference)->delay(now()->addSeconds(self::SCHEDULE[0]));
    }

    public function handle(PaystackPaymentProcessor $processor): void
    {
        $result = $processor->process($this->reference);

        if ($result['outcome'] !== PaystackPaymentProcessor::PENDING) {
            return; // credited, already completed, failed, flagged or unknown — done
        }

        $next = self::SCHEDULE[$this->attempts()] ?? null;

        if ($next === null) {
            Log::warning('Paystack reconciliation gave up: payment still unconfirmed', [
                'reference'    => $this->reference,
                'verification' => $result['verification'],
                'detail'       => $result['detail'],
            ]);
            return; // stays pending; `php artisan payments:reconcile` can pick it up later
        }

        $this->release($next);
    }
}
