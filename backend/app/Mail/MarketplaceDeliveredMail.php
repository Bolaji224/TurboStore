<?php

namespace App\Mail;

use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

class MarketplaceDeliveredMail extends Mailable
{
    public function __construct(
        public string  $buyerName,
        public string  $serviceName,
        public string  $vendorName,
        public string  $reference,
        public string  $login,
        public string  $password,
        public ?string $recoveryEmail = null,
        public ?string $notes         = null,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Your {$this->serviceName} Account Has Been Delivered – TurboStore",
        );
    }

    public function content(): Content
    {
        $frontend = rtrim((string) config('app.frontend_url'), '/');

        return new Content(
            view: 'emails.marketplace-delivered',
            with: [
                'buyerName'     => $this->buyerName,
                'serviceName'   => $this->serviceName,
                'vendorName'    => $this->vendorName,
                'reference'     => $this->reference,
                'login'         => $this->login,
                'password'      => $this->password,
                'recoveryEmail' => $this->recoveryEmail,
                'notes'         => $this->notes,
                'websiteUrl'    => $frontend,
                'logoUrl'       => $frontend . '/logo.png',
                'orderUrl'      => $frontend . '/dashboard/marketplace/orders/' . $this->reference,
            ],
        );
    }
}
