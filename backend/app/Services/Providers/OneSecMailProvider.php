<?php

namespace App\Services\Providers;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OneSecMailProvider
{
    private const BASE    = 'http://www.1secmail.com/api/v1/';
    private const TIMEOUT = 15;

    /**
     * Generate a fresh random disposable email.
     * Returns ['email' => 'xyz@1secmail.com', 'login' => 'xyz', 'domain' => '1secmail.com']
     */
    public function generateEmail(): array
    {
        $response = Http::withoutVerifying()->timeout(self::TIMEOUT)
            ->get(self::BASE, ['action' => 'genRandomMailbox', 'count' => 1]);

        Log::info('[1secmail] generateEmail', [
            'status' => $response->status(),
            'body'   => substr($response->body(), 0, 500),
        ]);

        $res  = $response->json();
        $full = $res[0] ?? null;

        if (!$full || !str_contains($full, '@')) {
            throw new \RuntimeException('1secmail failed to generate an email address.');
        }

        [$login, $domain] = explode('@', $full, 2);

        return ['email' => $full, 'login' => $login, 'domain' => $domain];
    }

    /**
     * Check inbox and attempt to extract an OTP from any new message.
     * Returns the OTP string or null if no code found yet.
     */
    public function extractOtp(string $login, string $domain): ?string
    {
        try {
            $messages = Http::withoutVerifying()->timeout(self::TIMEOUT)
                ->get(self::BASE, [
                    'action' => 'getMessages',
                    'login'  => $login,
                    'domain' => $domain,
                ])
                ->json();

            if (empty($messages) || !is_array($messages)) {
                return null;
            }

            // Check the most recent 5 messages, newest first
            foreach (array_slice(array_reverse($messages), 0, 5) as $msg) {
                $otp = $this->readAndExtract($login, $domain, (int) $msg['id']);
                if ($otp) {
                    return $otp;
                }
            }
        } catch (\Throwable $e) {
            Log::warning('[1secmail] extractOtp error', ['error' => $e->getMessage()]);
        }

        return null;
    }

    private function readAndExtract(string $login, string $domain, int $id): ?string
    {
        try {
            $msg = Http::withoutVerifying()->timeout(self::TIMEOUT)
                ->get(self::BASE, [
                    'action' => 'readMessage',
                    'login'  => $login,
                    'domain' => $domain,
                    'id'     => $id,
                ])
                ->json();

            // Try subject first (some services put OTP there)
            $subject = $msg['subject'] ?? '';
            if (preg_match('/\b(\d{4,8})\b/', $subject, $m)) {
                return $m[1];
            }

            // Try plain text body
            $text = $msg['textBody'] ?? '';
            if ($text && preg_match('/\b(\d{4,8})\b/', $text, $m)) {
                return $m[1];
            }

            // Strip HTML and try body
            $html = strip_tags($msg['htmlBody'] ?? '');
            if ($html && preg_match('/\b(\d{4,8})\b/', $html, $m)) {
                return $m[1];
            }
        } catch (\Throwable) {}

        return null;
    }
}
