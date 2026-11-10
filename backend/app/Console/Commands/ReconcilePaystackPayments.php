<?php

namespace App\Console\Commands;

use App\Models\PaystackPayment;
use App\Services\PaystackPaymentProcessor;
use Illuminate\Console\Command;

/**
 * Re-verifies pending Paystack payments against the Paystack API and credits
 * the ones Paystack confirms. Safe to run any time (idempotent).
 */
class ReconcilePaystackPayments extends Command
{
    protected $signature = 'payments:reconcile
        {--reference= : Reconcile a single payment reference}
        {--older-than=5 : Only payments created at least this many minutes ago}
        {--max-age=72 : Ignore payments older than this many hours}
        {--include-failed : Also re-check payments marked failed}';

    protected $description = 'Re-verify pending Paystack payments with Paystack and credit confirmed ones';

    public function handle(PaystackPaymentProcessor $processor): int
    {
        $query = PaystackPayment::query()->whereNull('flag_reason');

        if ($ref = $this->option('reference')) {
            $query->where('reference', $ref);
        } else {
            $query->whereIn('status', $this->option('include-failed') ? ['pending', 'failed'] : ['pending'])
                  ->where('created_at', '<=', now()->subMinutes((int) $this->option('older-than')))
                  ->where('created_at', '>=', now()->subHours((int) $this->option('max-age')));
        }

        $tally = [];
        $query->orderBy('id')->each(function (PaystackPayment $p) use ($processor, &$tally) {
            $r = $processor->process($p->reference);
            $tally[$r['outcome']] = ($tally[$r['outcome']] ?? 0) + 1;
            $this->line(sprintf('%-20s %-10s %s', $p->reference, $r['outcome'], $r['detail'] ?? $r['verification'] ?? ''));
        });

        if (!$tally) {
            $this->info('No payments to reconcile.');
            return self::SUCCESS;
        }

        $this->newLine();
        $this->table(array_keys($tally), [array_values($tally)]);

        return self::SUCCESS;
    }
}
