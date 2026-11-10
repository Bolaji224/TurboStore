<?php

namespace App\Http\Controllers;

use App\Jobs\ReconcilePaystackPaymentJob;
use App\Models\PaystackPayment;
use App\Services\PaystackPaymentProcessor as Processor;
use App\Services\PaystackService;
use App\DTOs\PaystackVerification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Paystack wallet funding.
 *
 * Trust model: the browser is never trusted. The popup's onSuccess only tells
 * us *when* to check; every credit is decided by PaystackPaymentProcessor from
 * Paystack's server-side verify API.
 */
class WalletFundingController extends Controller
{
    public function __construct(
        private PaystackService $paystack,
        private Processor       $processor,
    ) {}

    /**
     * Creates a pending payment record and returns the reference for the inline popup.
     * The popup talks to Paystack directly from the browser — no server API call needed here.
     */
    public function initiate(Request $request)
    {
        $data = $request->validate([
            'amount' => 'required|integer|min:500|max:1000000',
        ]);

        $user       = $request->user();
        $amountKobo = $data['amount'] * 100;
        $reference  = 'PAY-' . strtoupper(Str::random(12));

        PaystackPayment::create([
            'user_id'   => $user->id,
            'reference' => $reference,
            'amount'    => $amountKobo,
            'status'    => 'pending',
        ]);

        return response()->json([
            'reference'   => $reference,
            'amount_kobo' => $amountKobo,
            'email'       => $user->email,
        ]);
    }

    /**
     * Called by the frontend after the Paystack popup reports success, and
     * polled while the result is still pending.
     *
     * 200 success | 202 pending (being confirmed, auto-reconciled) | 422 failed / review
     */
    public function verifyInline(Request $request)
    {
        $data = $request->validate([
            'reference' => 'required|string|max:64',
        ]);

        // Scope to the caller: a user can only ever check their own payments.
        $payment = PaystackPayment::where('reference', $data['reference'])
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $result  = $this->processor->process($payment->reference);
        $payment = $result['payment'] ?? $payment;

        return match ($result['outcome']) {
            Processor::CREDITED, Processor::COMPLETED => response()->json([
                'status'       => 'success',
                'amount_naira' => $payment->amount / 100,
            ]),

            Processor::FAILED => response()->json([
                'status'  => 'failed',
                'message' => 'Payment was not successful.',
            ], 422),

            Processor::FLAGGED => response()->json([
                'status'    => 'review',
                'message'   => "We couldn't automatically confirm this payment. Our team will review it — please contact support with reference {$payment->reference}.",
                'reference' => $payment->reference,
            ], 422),

            default => $this->pendingResponse($payment, $result['verification']),
        };
    }

    /**
     * Paystack calls this server-to-server. Signature-checked, then re-verified
     * against the API (the payload itself is never trusted for amounts/status).
     *
     * Returns non-2xx only when we want Paystack to retry delivery.
     */
    public function webhook(Request $request)
    {
        $payload   = $request->getContent();
        $signature = (string) $request->header('X-Paystack-Signature', '');

        if (!$this->paystack->validateSignature($payload, $signature)) {
            Log::warning('Paystack webhook rejected: invalid signature', ['ip' => $request->ip()]);
            return response()->json(['message' => 'Invalid signature'], 400);
        }

        if ($request->input('event') !== 'charge.success') {
            return response()->json(['ok' => true]);
        }

        $reference = (string) $request->input('data.reference', '');
        if ($reference === '') {
            return response()->json(['ok' => true]);
        }

        $result = $this->processor->process($reference);

        if ($result['outcome'] === Processor::PENDING) {
            if ($result['verification'] === PaystackVerification::UNAVAILABLE) {
                // We couldn't confirm with Paystack right now — ask Paystack to redeliver.
                return response()->json(['message' => 'Verification temporarily unavailable'], 503);
            }
            ReconcilePaystackPaymentJob::schedule($reference);
        }

        return response()->json(['ok' => true]);
    }

    private function pendingResponse(PaystackPayment $payment, ?string $verification)
    {
        // Keep checking in the background so a real payment is credited even if
        // the user closes the page.
        ReconcilePaystackPaymentJob::schedule($payment->reference);

        return response()->json([
            'status'       => 'pending',
            'message'      => 'Your payment is being confirmed with Paystack. Your wallet will be credited automatically as soon as it is confirmed.',
            'amount_naira' => $payment->amount / 100,
            'reference'    => $payment->reference,
        ], 202);
    }
}
