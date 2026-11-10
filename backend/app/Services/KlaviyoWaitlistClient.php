<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

/**
 * Read-only access to the Klaviyo list that the waitlist site subscribes
 * sign-ups to. Never writes to Klaviyo.
 */
class KlaviyoWaitlistClient
{
    public function isConfigured(): bool
    {
        return filled(config('waitlist.klaviyo.private_key')) && filled(config('waitlist.klaviyo.list_id'));
    }

    /**
     * Yields every profile on the waitlist list, following cursor pagination.
     *
     * @return \Generator<array{external_id:string,email:?string,first_name:?string,consent:?string,created:?string}>
     */
    public function profiles(): \Generator
    {
        if (!$this->isConfigured()) {
            throw new \RuntimeException('Klaviyo is not configured (KLAVIYO_PRIVATE_API_KEY / KLAVIYO_WAITLIST_LIST_ID).');
        }

        $base   = rtrim(config('waitlist.klaviyo.base_url'), '/');
        $listId = config('waitlist.klaviyo.list_id');
        $url    = "{$base}/lists/{$listId}/profiles/";
        $query  = [
            'additional-fields[profile]' => 'subscriptions',
            'page[size]'                 => 100,
        ];

        $pages = 0;
        while ($url && $pages++ < 1000) { // hard stop: 100k profiles
            $res = Http::withHeaders([
                    'Authorization' => 'Klaviyo-API-Key ' . config('waitlist.klaviyo.private_key'),
                    'Accept'        => 'application/json',
                    'revision'      => config('waitlist.klaviyo.revision'),
                ])
                ->timeout(30)
                ->retry(3, 2000, throw: false)
                ->get($url, $query);

            if (!$res->successful()) {
                $detail = $res->json('errors.0.detail') ?? $res->reason();
                throw new \RuntimeException("Klaviyo request failed ({$res->status()}): {$detail}");
            }

            foreach ($res->json('data') ?? [] as $profile) {
                $attr = $profile['attributes'] ?? [];
                yield [
                    'external_id' => (string) ($profile['id'] ?? ''),
                    'email'       => $attr['email'] ?? null,
                    'first_name'  => $attr['first_name'] ?? null,
                    'consent'     => $attr['subscriptions']['email']['marketing']['consent'] ?? null,
                    'created'     => $attr['created'] ?? null,
                ];
            }

            // `links.next` already contains the cursor and original query.
            $url   = $res->json('links.next');
            $query = [];
        }
    }
}
