<?php

namespace App\Services\Providers;

use App\Contracts\SmsProviderInterface;
use App\DTOs\AvailabilityData;
use App\DTOs\CountryData;
use App\DTOs\OrderStatusData;
use App\DTOs\PurchasedNumberData;
use App\DTOs\ServiceData;
use App\Exceptions\Provider\ProviderAuthenticationException;
use App\Exceptions\Provider\ProviderInsufficientBalanceException;
use App\Exceptions\Provider\ProviderOutOfStockException;
use App\Exceptions\Provider\ProviderPurchaseException;
use App\Exceptions\Provider\ProviderTimeoutException;
use App\Exceptions\Provider\ProviderUnavailableException;
use App\Services\PricingService;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SmsPoolProvider implements SmsProviderInterface
{
    private string $baseUrl;
    private int    $timeout;

    public function __construct(
        private string $apiKey,
        private PricingService $pricing,
    ) {
        $cfg           = config('sms.providers.smspool');
        $this->baseUrl = rtrim($cfg['base_url'] ?? 'https://api.smspool.net', '/');
        $this->timeout = $cfg['timeout'] ?? 30;
    }

    public function getName(): string
    {
        return 'smspool';
    }

    // ── Balance ─────────────────────────────────────────────────────────────

    public function getBalance(): float
    {
        $res = $this->post('/request/balance', []);
        return (float) ($res['balance'] ?? 0);
    }

    // ── Countries ───────────────────────────────────────────────────────────

    public function getCountries(): array
    {
        $res = $this->get('/country/retrieve_all');

        if (!is_array($res)) {
            return [];
        }

        return collect($res)
            ->map(fn($c) => new CountryData(
                code:   (string) ($c['short_name'] ?? $c['ID'] ?? ''),
                name:   $c['name'] ?? '',
                iso:    $c['short_name'] ?? null,
                prefix: null,
            ))
            ->filter(fn($c) => $c->code !== '')
            ->sortBy('name')
            ->values()
            ->all();
    }

    // ── Services ────────────────────────────────────────────────────────────

    public function getServices(string $country): array
    {
        $res = $this->get('/service/retrieve_all');

        if (!is_array($res)) {
            return [];
        }

        // SMSPool returns a flat service list; prices require a pool lookup
        return collect($res)
            ->map(fn($s) => new ServiceData(
                code:          (string) ($s['sms_name'] ?? $s['ID'] ?? ''),
                name:          $s['name'] ?? '',
                qty:           0, // Availability varies per pool; populated on demand
                providerPrice: (float) ($s['price'] ?? 0),
                customerPrice: $this->pricing->calculateCustomerPrice((float) ($s['price'] ?? 0)),
            ))
            ->filter(fn($s) => $s->code !== '')
            ->sortBy('name')
            ->values()
            ->all();
    }

    // ── Availability ────────────────────────────────────────────────────────

    public function getAvailability(string $country, string $service): AvailabilityData
    {
        try {
            $res = $this->post('/pool/retrieve_all', [
                'country' => $country,
                'service' => $service,
            ]);

            if (empty($res) || !is_array($res)) {
                return new AvailabilityData($country, $service, 0, 0, 0, false);
            }

            // Cheapest pool
            $pool  = collect($res)->sortBy('price')->first();
            $qty   = (int) ($pool['totalstock'] ?? $pool['stock'] ?? 0);
            $price = (float) ($pool['price'] ?? 0);

            return new AvailabilityData(
                country:       $country,
                service:       $service,
                qty:           $qty,
                providerPrice: $price,
                customerPrice: $this->pricing->calculateCustomerPrice($price),
                available:     $qty > 0,
            );
        } catch (\Throwable) {
            return new AvailabilityData($country, $service, 0, 0, 0, false);
        }
    }

    // ── Buy Number ──────────────────────────────────────────────────────────

    public function buyNumber(string $country, string $service): PurchasedNumberData
    {
        $start = microtime(true);

        try {
            $response = Http::timeout($this->timeout)
                ->asForm()
                ->post("{$this->baseUrl}/purchase/sms", [
                    'key'     => $this->apiKey,
                    'country' => $country,
                    'service' => $service,
                ]);
        } catch (ConnectionException $e) {
            throw new ProviderTimeoutException('SMSPool connection timed out', 'smspool', 0, $e);
        }

        $duration = round((microtime(true) - $start) * 1000);
        $data     = $response->json() ?? [];

        Log::channel('stack')->info('[SMSPool] buy_number', [
            'provider'    => 'smspool',
            'operation'   => 'buy_number',
            'country'     => $country,
            'service'     => $service,
            'http_status' => $response->status(),
            'duration_ms' => $duration,
            'success'     => ($data['success'] ?? 0) === 1,
        ]);

        if (!$response->successful()) {
            throw new ProviderUnavailableException("SMSPool returned HTTP {$response->status()}", 'smspool');
        }

        if (($data['success'] ?? 0) !== 1) {
            $msg = $data['message'] ?? 'unknown error';

            if (str_contains((string) $msg, 'OUT_OF_STOCK') || str_contains((string) $msg, 'stock')) {
                throw new ProviderOutOfStockException("SMSPool: out of stock for {$service}/{$country}", 'smspool');
            }

            if (str_contains((string) $msg, 'BALANCE')) {
                throw new ProviderInsufficientBalanceException('SMSPool: provider account balance insufficient', 'smspool');
            }

            if ($response->status() === 401 || str_contains((string) $msg, 'auth')) {
                throw new ProviderAuthenticationException('SMSPool: invalid API key', 'smspool');
            }

            throw new ProviderPurchaseException("SMSPool purchase failed: {$msg}", 'smspool');
        }

        return new PurchasedNumberData(
            providerOrderId: (string) $data['order_id'],
            phoneNumber:     $this->formatPhone((string) ($data['phonenumber'] ?? ''), (string) ($data['cc'] ?? '')),
            country:         $country,
            service:         $service,
            providerCost:    0, // SMSPool charges from balance; cost returned separately
            rawStatus:       'pending',
        );
    }

    // ── Order Status ────────────────────────────────────────────────────────

    public function getOrderStatus(string $providerOrderId): OrderStatusData
    {
        $res = $this->post('/sms/check', ['orderid' => $providerOrderId]);

        $rawStatus = (string) ($res['status'] ?? '1');
        $otp       = $res['sms'] ?? null;

        return new OrderStatusData(
            providerOrderId: $providerOrderId,
            status:          $this->normalizeStatus($rawStatus),
            otp:             $otp ? (string) $otp : null,
            rawStatus:       $rawStatus,
        );
    }

    // ── Cancel ──────────────────────────────────────────────────────────────

    public function cancelOrder(string $providerOrderId): bool
    {
        try {
            $res = $this->post('/cancel/sms', ['orderid' => $providerOrderId]);
            return isset($res['success']) && $res['success'] === 1;
        } catch (\Throwable) {
            return false;
        }
    }

    // ── Finish ──────────────────────────────────────────────────────────────

    public function finishOrder(string $providerOrderId): bool
    {
        // SMSPool does not have a separate "finish" endpoint; order auto-closes
        return true;
    }

    // ── Helpers ─────────────────────────────────────────────────────────────

    private function get(string $path): array
    {
        try {
            $response = Http::timeout($this->timeout)
                ->get("{$this->baseUrl}{$path}", ['key' => $this->apiKey]);
        } catch (ConnectionException $e) {
            throw new ProviderTimeoutException("SMSPool connection timed out on {$path}", 'smspool', 0, $e);
        }

        if ($response->serverError()) {
            throw new ProviderUnavailableException("SMSPool server error {$response->status()}", 'smspool');
        }

        return $response->json() ?? [];
    }

    private function post(string $path, array $body): array
    {
        try {
            $response = Http::timeout($this->timeout)
                ->asForm()
                ->post("{$this->baseUrl}{$path}", array_merge(['key' => $this->apiKey], $body));
        } catch (ConnectionException $e) {
            throw new ProviderTimeoutException("SMSPool connection timed out on {$path}", 'smspool', 0, $e);
        }

        if ($response->serverError()) {
            throw new ProviderUnavailableException("SMSPool server error {$response->status()}", 'smspool');
        }

        return $response->json() ?? [];
    }

    private function normalizeStatus(string $raw): string
    {
        return match ($raw) {
            '7', '8' => 'processing',
            '1', '4' => 'waiting_for_otp',
            '3'      => 'otp_received',
            '2'      => 'expired',
            '6'      => 'refunded',
            default  => 'waiting_for_otp',
        };
    }

    private function formatPhone(string $number, string $cc): string
    {
        if (!$cc || str_starts_with($number, '+')) {
            return $number;
        }
        return '+' . ltrim($cc, '+') . $number;
    }
}
