<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * Payment acknowledgement sent after a Paystack deposit has been verified
 * server-side and the wallet credited.
 *
 * Carries plain scalar values (not models) so the email always shows the
 * figures captured at the moment of crediting — the balance shown is the
 * balance immediately after this deposit, even if the job runs later.
 */
class WalletFundedMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    /** Queue retry policy — SMTP hiccups are retried, then logged via failed(). */
    public int $tries = 3;
    public array $backoff = [60, 300];

    public function __construct(
        public string  $customerName,
        public int     $amountKobo,
        public string  $paymentReference,
        public int     $balanceAfterKobo,
        public string  $paidAt,
        public int     $userId,
    ) {
        // Never dispatch until any surrounding DB transaction has committed.
        $this->afterCommit();
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Payment Received Successfully – Your TurboStore Wallet Has Been Funded!',
        );
    }

    public function content(): Content
    {
        $frontend = rtrim((string) config('app.frontend_url'), '/');

        return new Content(
            view: 'emails.wallet-funded',
            with: [
                'name'           => $this->customerName,
                'amount'         => self::naira($this->amountKobo),
                'reference'      => $this->paymentReference,
                'balance'        => self::naira($this->balanceAfterKobo),
                'paidAt'         => $this->paidAt,
                'websiteUrl'     => $frontend,
                'logoUrl'        => $frontend . '/logo.png',
                'buyNumberUrl'   => $frontend . '/dashboard/buy-number',
                'marketplaceUrl' => $frontend . '/dashboard/marketplace',
                'walletUrl'      => $frontend . '/dashboard/wallet',
            ],
        );
    }

    /** Called by the queue worker once all retries are exhausted. Payment is unaffected. */
    public function failed(\Throwable $e): void
    {
        Log::error('Wallet funding confirmation email failed permanently', [
            'user_id'   => $this->userId,
            'reference' => $this->paymentReference,
            'error'     => $e->getMessage(),
        ]);
    }

    private static function naira(int $kobo): string
    {
        $naira    = $kobo / 100;
        $decimals = ($kobo % 100 === 0) ? 0 : 2;

        return '₦' . number_format($naira, $decimals);
    }
}
