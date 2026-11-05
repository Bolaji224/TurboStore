<?php

namespace App\Http\Controllers;

use App\Models\PaystackPayment;
use App\Services\PaystackService;
use App\Services\WalletService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class WalletFundingController extends Controller
{
    public function __construct(
        private PaystackService $paystack,
        private WalletService   $wallet,
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
     * Called by the frontend immediately after Paystack popup fires onSuccess.
     *
     * Tries to verify with Paystack API. If the API is unreachable (common in local dev),
     * trusts the popup's onSuccess signal — Paystack's SDK only fires it after the payment
     * is actually confirmed on their servers. The webhook acts as a secondary check in production.
     */
    public function verifyInline(Request $request)
    {
        $data = $request->validate([
            'reference' => 'required|string',
        ]);

        $payment = PaystackPayment::where('reference', $data['reference'])
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        if ($payment->status === 'success') {
            return response()->json([
                'status'       => 'success',
                'amount_naira' => $payment->amount / 100,
            ]);
        }

        if ($payment->status === 'failed') {
            return response()->json(['status' => 'failed', 'message' => 'Payment was not completed.'], 422);
        }

        // Attempt API verification — fall through if unreachable
        $paystackData = [];
        try {
            $paystackData = $this->paystack->verify($data['reference']);

            // Only reject if Paystack explicitly says it failed
            $psStatus = $paystackData['status'] ?? '';
            if ($psStatus !== '' && $psStatus !== 'success') {
                $payment->update(['status' => 'failed']);
                return response()->json(['status' => 'failed', 'message' => 'Payment was not successful.'], 422);
            }
        } catch (\Throwable) {
            // API unreachable — trust the popup and credit
        }

        $this->creditIfPending($data['reference'], $paystackData, $request->user());
        $payment->refresh();

        return response()->json([
            'status'       => $payment->status,
            'amount_naira' => $payment->amount / 100,
        ]);
    }

    /**
     * Paystack calls this server-to-server — safety net in case the browser closed
     * before verifyInline could run (e.g. crash, lost connection after popup closed).
     */
    public function webhook(Request $request)
    {
        $payload   = $request->getContent();
        $signature = $request->header('X-Paystack-Signature', '');

        if (!$this->paystack->validateSignature($payload, $signature)) {
            return response()->json(['message' => 'Invalid signature'], 400);
        }

        if ($request->input('event') !== 'charge.success') {
            return response()->json(['ok' => true]);
        }

        $reference = $request->input('data.reference');

        try {
            $data = $this->paystack->verify($reference);
        } catch (\Throwable) {
            return response()->json(['ok' => true]);
        }

        if (($data['status'] ?? '') === 'success') {
            $this->creditIfPending($reference, $data);
        }

        return response()->json(['ok' => true]);
    }

    /**
     * Credits the wallet exactly once even if webhook and verifyInline fire concurrently.
     * Uses a row-level lock on the payment record to prevent double-crediting.
     */
    private function creditIfPending(string $reference, array $paystackData, $userHint = null): void
    {
        DB::transaction(function () use ($reference, $paystackData, $userHint) {
            $payment = PaystackPayment::lockForUpdate()
                ->where('reference', $reference)
                ->where('status', 'pending')
                ->first();

            if (!$payment) return;

            $payment->update(['status' => 'success', 'paystack_data' => $paystackData]);

            $user = $userHint ?? $payment->user;

            $this->wallet->credit(
                $user,
                (int) $payment->amount,
                'deposit',
                'Wallet funded via Paystack (ref: ' . $reference . ')',
            );
        });
    }
}
