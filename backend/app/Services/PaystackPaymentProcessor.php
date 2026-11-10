<?php

namespace App\Services;

use App\DTOs\PaystackVerification as V;
use App\Models\PaystackPayment;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * The ONLY code path allowed to credit a wallet for a Paystack deposit.
 *
 * Invariants:
 *  1. A wallet is credited only when Paystack's verify API reports `success`
 *     AND the reference, amount (kobo) and currency match our record.
 *  2. Each payment is credited at most once (row lock + status transition).
 *  3. "Unknown" (gateway down, not found, still processing) never credits and
 *     never fails a payment — it stays pending and is reconciled later.
 *  4. A confirmed-but-mismatched charge is flagged for manual review and is
 *     never auto-credited.
 *
 * Callers: verify-inline endpoint, webhook, ReconcilePaystackPaymentJob,
 * `payments:reconcile` command.
 */
class PaystackPaymentProcessor
{
    // Result outcomes
    public const CREDITED  = 'credited';   // credited by this call
    public const COMPLETED = 'completed';  // was already credited earlier
    public const PENDING   = 'pending';    // unknown / not final — retry later
    public const FAILED    = 'failed';     // Paystack says the charge failed
    public const FLAGGED   = 'flagged';    // confirmed charge doesn't match our record
    public const UNKNOWN   = 'unknown';    // no such reference in our DB

    public function __construct(
        private PaystackService       $paystack,
        private WalletService         $wallet,
        private FundingReceiptService $receipts,
    ) {}

    /**
     * @return array{outcome:string, payment:?PaystackPayment, verification:?string, detail:?string}
     */
    public function process(string $reference): array
    {
        $payment = PaystackPayment::where('reference', $reference)->first();

        if (!$payment) {
            return $this->result(self::UNKNOWN, null);
        }
        if ($payment->status === 'success') {
            return $this->result(self::COMPLETED, $payment);
        }
        if ($payment->flag_reason) {
            return $this->result(self::FLAGGED, $payment, null, $payment->flag_reason);
        }

        $verification = $this->paystack->verifyTransaction($reference);

        PaystackPayment::whereKey($payment->id)->update([
            'verification_attempts' => DB::raw('verification_attempts + 1'),
            'last_verification_at'  => now(),
        ]);

        return match ($verification->outcome) {
            V::SUCCESS => $this->handleSuccess($payment, $verification),
            V::FAILED  => $this->handleFailure($payment, $verification),
            default    => $this->result(self::PENDING, $payment->refresh(), $verification->outcome, $verification->detail),
        };
    }

    private function handleSuccess(PaystackPayment $payment, V $verification): array
    {
        $mismatch = $verification->mismatchAgainst($payment->reference, (int) $payment->amount);

        if ($mismatch !== null) {
            PaystackPayment::whereKey($payment->id)->whereNull('flag_reason')->where('status', '!=', 'success')
                ->update(['flag_reason' => $mismatch, 'paystack_data' => json_encode($verification->data), 'updated_at' => now()]);

            Log::critical('Paystack payment flagged: confirmed charge does not match our record', [
                'payment_id'      => $payment->id,
                'reference'       => $payment->reference,
                'user_id'         => $payment->user_id,
                'reason'          => $mismatch,
                'expected_kobo'   => (int) $payment->amount,
                'paystack_amount' => $verification->data['amount'] ?? null,
                'paystack_currency' => $verification->data['currency'] ?? null,
            ]);

            return $this->result(self::FLAGGED, $payment->refresh(), V::SUCCESS, $mismatch);
        }

        $credited = DB::transaction(function () use ($payment, $verification) {
            $locked = PaystackPayment::lockForUpdate()->find($payment->id);

            // Re-check under the lock: another request may have credited or flagged it.
            // 'failed' → 'success' is allowed: Paystack is the source of truth, and a
            // customer can retry a failed charge on the same reference.
            if (!$locked || $locked->status === 'success' || $locked->flag_reason) {
                return null;
            }

            $locked->update([
                'status'        => 'success',
                'paystack_data' => $verification->data,
                'verified_at'   => now(),
            ]);

            $transaction = $this->wallet->credit(
                $locked->user,
                (int) $locked->amount,
                'deposit',
                'Wallet funded via Paystack (ref: ' . $locked->reference . ')',
            );

            return [$locked, $transaction];
        });

        if (!$credited) {
            $payment->refresh();
            return $this->result($payment->status === 'success' ? self::COMPLETED : self::FLAGGED, $payment, V::SUCCESS);
        }

        [$locked, $transaction] = $credited;

        Log::info('Paystack deposit credited', [
            'payment_id' => $locked->id,
            'reference'  => $locked->reference,
            'user_id'    => $locked->user_id,
            'amount'     => (int) $locked->amount,
        ]);

        // After commit; never throws.
        $this->receipts->send($locked, $transaction, $verification->data);

        return $this->result(self::CREDITED, $locked, V::SUCCESS);
    }

    private function handleFailure(PaystackPayment $payment, V $verification): array
    {
        PaystackPayment::whereKey($payment->id)->where('status', 'pending')
            ->update(['status' => 'failed', 'paystack_data' => json_encode($verification->data), 'updated_at' => now()]);

        return $this->result(self::FAILED, $payment->refresh(), V::FAILED, $verification->detail);
    }

    private function result(string $outcome, ?PaystackPayment $payment, ?string $verification = null, ?string $detail = null): array
    {
        return compact('outcome', 'payment', 'verification', 'detail');
    }
}
