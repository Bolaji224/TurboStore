<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Notifications\Messages\MailMessage;

class VerifyEmailNotification extends VerifyEmail
{
    public function toMail($notifiable)
    {
        $url = $this->verificationUrl($notifiable);

        return (new MailMessage)
            ->subject('Confirm Your Email Address — TurboStore')
            ->view('emails.verify-email', [
                'url'  => $url,
                'user' => $notifiable,
            ]);
    }
}
