<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Official launch announcement for waitlist subscribers.
 *
 * Sent synchronously from SendLaunchEmailJob (already on the queue), so this
 * mailable is intentionally NOT ShouldQueue.
 *
 * mode:
 *   activate – account created for them; CTA sets their password (single-use link)
 *   verify   – existing account, email unverified; CTA is the signed verification link
 *   login    – existing active account; CTA goes to sign-in
 */
class LaunchAnnouncementMail extends Mailable
{
    use Queueable, SerializesModels;

    public const SUBJECT = 'TurboStore Is Officially Live! Your Access Starts Here 🚀';

    public function __construct(
        public ?string $name,
        public string  $email,
        public string  $mode,
        public string  $ctaUrl,
        public ?string $expiresAt = null,
        public bool    $isTest = false,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: ($this->isTest ? '[TEST] ' : '') . self::SUBJECT);
    }

    public function content(): Content
    {
        $frontend = rtrim((string) config('app.frontend_url'), '/');
        $name     = trim((string) $this->name);

        return new Content(
            view: 'emails.launch-announcement',
            with: [
                'name'       => $name !== '' ? $name : 'there',
                'email'      => $this->email,
                'mode'       => $this->mode,
                'ctaUrl'     => $this->ctaUrl,
                'expiresAt'  => $this->expiresAt,
                'isTest'     => $this->isTest,
                'websiteUrl' => $frontend,
                'logoUrl'    => $frontend . '/logo.png',
                'loginUrl'   => $frontend . '/login',
                'forgotUrl'  => $frontend . '/forgot-password',
            ],
        );
    }
}
