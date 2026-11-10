<?php

namespace App\Console\Commands;

use App\DTOs\PaystackVerification;
use App\Models\PaystackPayment;
use App\Services\PaystackService;
use Illuminate\Console\Command;

/**
 * READ-ONLY audit of wallet credits that were never verified with Paystack
 * (created by the old "trust the popup" fallback). Never changes balances —
 * any clawback is a business decision for a human.
 */
class AuditPaystackCredits extends Command
{
    protected $signature = 'payments:audit
        {--recheck : Ask Paystack now about each suspicious payment (read-only API calls)}
        {--csv= : Also write the findings to this CSV path}';

    protected $description = 'List Paystack payments that credited a wallet without a matching Paystack verification (read-only)';

    public function handle(PaystackService $paystack): int
    {
        $rows = [];

        PaystackPayment::with('user:id,email')
            ->where('status', 'success')
            ->orderBy('id')
            ->each(function (PaystackPayment $p) use (&$rows, $paystack) {
                $reason = $this->suspicion($p);
                if ($reason === null) {
                    return;
                }

                $paystackNow = '';
                if ($this->option('recheck')) {
                    $v = $paystack->verifyTransaction($p->reference);
                    $paystackNow = $v->outcome . ($v->isSuccess() ? ' ' . ($v->mismatchAgainst($p->reference, (int) $p->amount) ?? 'matches') : '');
                }

                $rows[] = [
                    $p->id,
                    $p->reference,
                    $p->user_id,
                    $p->user?->email,
                    number_format($p->amount / 100, 2),
                    $p->updated_at?->toDateTimeString(),
                    $reason,
                    $paystackNow,
                ];
            });

        $headers = ['id', 'reference', 'user_id', 'email', 'naira', 'credited_at', 'reason', 'paystack_now'];

        if (!$rows) {
            $this->info('No unverified credits found.');
            return self::SUCCESS;
        }

        $this->table($headers, $rows);
        $total = array_sum(array_map(fn ($r) => (float) str_replace(',', '', $r[4]), $rows));
        $this->warn(sprintf('%d suspicious credit(s), ₦%s total. No balances were changed.', count($rows), number_format($total, 2)));

        if ($path = $this->option('csv')) {
            $fh = fopen($path, 'w');
            fputcsv($fh, $headers);
            foreach ($rows as $r) fputcsv($fh, $r);
            fclose($fh);
            $this->info("Written to {$path}");
        }

        return self::SUCCESS;
    }

    /** Why a credited payment is suspicious, or null if it was properly verified. */
    private function suspicion(PaystackPayment $p): ?string
    {
        $data = $p->paystack_data ?? [];

        if (!$data) {
            return 'no_paystack_data';            // credited while Paystack was "unreachable"
        }
        if (strtolower((string) ($data['status'] ?? '')) !== 'success') {
            return 'paystack_status_' . ($data['status'] ?? 'missing');
        }

        $v = PaystackVerification::success($data);
        return $v->mismatchAgainst($p->reference, (int) $p->amount);
    }
}
