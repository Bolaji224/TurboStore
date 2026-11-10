<?php

namespace App\Services;

use App\Mail\WalletFundedMail;
use App\Models\PaystackPayment;
use App\Models\WalletTransaction;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * Sends the "payment received" acknowledgement email for a Paystack deposit.
 *
 * Contract with the caller (PaystackPaymentProcessor::handleSuccess):
 *  - Only called on the single code path that transitions a payment from
 *    'pending' to 'success' under a row lock, AFTER the transaction commits.
 *    That guarantees at most one email per payment reference, regardless of
 *    how many times the webhook or verify-inline endpoint is hit.
 *  - Never throws. Email problems must never affect a credited wallet.
 */
class FundingReceiptService
{
    /**
     * @param array $verifiedData The `data` object returned by Paystack's
     *                            /transaction/verify endpoint for this reference.
     */
    public function send(PaystackPayment $payment, WalletTransaction $credit, array $verifiedData): void
    {
        try {
            if (!$this->isVerifiedSuccess($payment, $verifiedData)) {
                Log::warning('Wallet funding email skipped: payment not confirmed by Paystack verification', [
                    'payment_id' => $payment->id,
                    'reference'  => $payment->reference,
                ]);
                return;
            }

            $user = $payment->user;

            // Defensive: the wallet credit must belong to the payment owner.
            if (!$user || (int) $credit->user_id !== (int) $user->id) {
                Log::error('Wallet funding email skipped: user/transaction mismatch', [
                    'payment_id' => $payment->id,
                    'reference'  => $payment->reference,
                ]);
                return;
            }

            if (!filter_var($user->email, FILTER_VALIDATE_EMAIL)) {
                Log::warning('Wallet funding email skipped: user has no valid email address', [
                    'user_id'   => $user->id,
                    'reference' => $payment->reference,
                ]);
                return;
            }

            $name = trim((string) $user->name);

            Mail::to($user)->queue(new WalletFundedMail(
                customerName:     $name !== '' ? $name : 'there',
                amountKobo:       (int) $credit->amount,
                paymentReference: $payment->reference,
                balanceAfterKobo: (int) $credit->balance_after,
                paidAt:           $credit->created_at?->timezone(config('app.timezone'))->format('j M Y, g:i A') ?? now()->format('j M Y, g:i A'),
                userId:           (int) $user->id,
            ));
        } catch (\Throwable $e) {
            // Mail misconfiguration, queue outage, etc. The deposit is already
            // committed — log and move on rather than surfacing an error.
            Log::error('Wallet funding email could not be dispatched', [
                'payment_id' => $payment->id,
                'reference'  => $payment->reference,
                'error'      => $e->getMessage(),
            ]);
        }
    }

    /**
     * True only when Paystack's own verify response confirms this exact payment
     * succeeded for the amount we recorded. An empty array (verify API was
     * unreachable) is NOT treated as verified.
     */
    private function isVerifiedSuccess(PaystackPayment $payment, array $data): bool
    {
        if (($data['status'] ?? null) !== 'success') {
            return false;
        }

        if (isset($data['reference']) && (string) $data['reference'] !== $payment->reference) {
            return false;
        }

        if (!isset($data['amount']) || (int) $data['amount'] !== (int) $payment->amount) {
            return false;
        }

        if (isset($data['currency']) && strtoupper((string) $data['currency']) !== 'NGN') {
            return false;
        }

        return true;
    }
}
