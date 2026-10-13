<?php

namespace App\Services\Providers;

use App\Contracts\SmsProviderInterface;
use App\DTOs\AvailabilityData;
use App\DTOs\CountryData;
use App\DTOs\OrderStatusData;
use App\DTOs\PurchasedNumberData;
use App\DTOs\ServiceData;
use App\Exceptions\Provider\ProviderAuthenticationException;
use App\Exceptions\Provider\ProviderOutOfStockException;
use App\Exceptions\Provider\ProviderPurchaseException;
use App\Exceptions\Provider\ProviderTimeoutException;
use App\Exceptions\Provider\ProviderUnavailableException;
use App\Services\PricingService;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FiveSimProvider implements SmsProviderInterface
{
    private string $baseUrl;
    private int    $timeout;

    public function __construct(
        private string $apiKey,
        private PricingService $pricing,
    ) {
        $cfg           = config('sms.providers.fivesim');
        $this->baseUrl = rtrim($cfg['base_url'] ?? 'https://5sim.net/v1', '/');
        $this->timeout = $cfg['timeout'] ?? 30;
    }

    public function getName(): string
    {
        return 'fivesim';
    }

    // ── Balance ─────────────────────────────────────────────────────────────

    public function getBalance(): float
    {
        $res = $this->get('/user/profile');
        return (float) ($res['balance'] ?? 0);
    }

    // ── Countries ───────────────────────────────────────────────────────────

    public function getCountries(): array
    {
        $res = $this->get('/guest/countries');

        return collect($res)
            ->filter(fn($data) => is_array($data))
            ->map(fn($data, $code) => new CountryData(
                code:   (string) $code,
                name:   is_array($data['text'] ?? null) ? ucfirst((string) $code) : ($data['text'] ?? ucfirst((string) $code)),
                iso:    is_array($data['iso'] ?? null) ? ($data['iso'][0] ?? null) : ($data['iso'] ?? null),
                prefix: isset($data['prefix']) ? '+' . (is_array($data['prefix']) ? implode('/', $data['prefix']) : $data['prefix']) : null,
            ))
            ->sortBy('name')
            ->values()
            ->all();
    }

    // ── Services ────────────────────────────────────────────────────────────

    public function getServices(string $country): array
    {
        $res = $this->get("/guest/products/{$country}/any");

        return collect($res)
            ->map(fn($data, $service) => new ServiceData(
                code:          (string) $service,
                name:          $this->formatServiceName((string) $service),
                qty:           (int) ($data['Qty'] ?? 0),
                providerPrice: (float) ($data['Price'] ?? 0),
                customerPrice: $this->pricing->calculateCustomerPrice((float) ($data['Price'] ?? 0)),
            ))
            ->sortBy('name')
            ->values()
            ->all();
    }

    // ── Availability ────────────────────────────────────────────────────────

    public function getAvailability(string $country, string $service): AvailabilityData
    {
        // Use the prices endpoint for a targeted lookup
        try {
            $res = $this->get('/guest/prices', [
                'country' => $country,
                'product' => $service,
            ]);

            // Response shape: { country: { operator: { service: { Qty, Price } } } }
            $entry = null;
            foreach ($res as $c => $operators) {
                foreach ($operators as $op => $services) {
                    if (isset($services[$service])) {
                        $entry = $services[$service];
                        break 2;
                    }
                }
            }

            if (!$entry) {
                return new AvailabilityData($country, $service, 0, 0, 0, false);
            }

            $qty   = (int) ($entry['Qty'] ?? 0);
            $price = (float) ($entry['Price'] ?? 0);

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
            $response = $this->http()->get("{$this->baseUrl}/user/buy/activation/{$country}/any/{$service}");
        } catch (ConnectionException $e) {
            throw new ProviderTimeoutException('5SIM connection timed out', 'fivesim', 0, $e);
        }

        $duration = round((microtime(true) - $start) * 1000);

        Log::channel('stack')->info('[5SIM] buy_number', [
            'provider'    => 'fivesim',
            'operation'   => 'buy_number',
            'country'     => $country,
            'service'     => $service,
            'http_status' => $response->status(),
            'duration_ms' => $duration,
            'success'     => $response->successful(),
        ]);

        if ($response->status() === 401) {
            throw new ProviderAuthenticationException('5SIM authentication failed — check FIVESIM_API_KEY', 'fivesim');
        }

        if ($response->status() === 400) {
            $body = $response->body();
            if (str_contains($body, 'no free phones')) {
                throw new ProviderOutOfStockException('No numbers available from 5SIM for this service/country', 'fivesim');
            }
            throw new ProviderPurchaseException("5SIM purchase failed: {$body}", 'fivesim');
        }

        if (!$response->successful()) {
            throw new ProviderUnavailableException("5SIM returned HTTP {$response->status()}", 'fivesim');
        }

        $data = $response->json();

        return new PurchasedNumberData(
            providerOrderId: (string) $data['id'],
            phoneNumber:     $data['phone'],
            country:         $country,
            service:         $service,
            providerCost:    (float) ($data['price'] ?? 0),
            rawStatus:       $data['status'] ?? 'PENDING',
        );
    }

    // ── Order Status ────────────────────────────────────────────────────────

    public function getOrderStatus(string $providerOrderId): OrderStatusData
    {
        $res = $this->get("/user/check/{$providerOrderId}");

        $otp = null;
        if (!empty($res['sms'])) {
            $last = end($res['sms']);
            $otp  = $last['code'] ?? null;
        }

        return new OrderStatusData(
            providerOrderId: $providerOrderId,
            status:          $this->normalizeStatus($res['status'] ?? 'PENDING'),
            otp:             $otp,
            rawStatus:       $res['status'] ?? 'PENDING',
        );
    }

    // ── Cancel ──────────────────────────────────────────────────────────────

    public function cancelOrder(string $providerOrderId): bool
    {
        try {
            $res = $this->http()->get("{$this->baseUrl}/user/cancel/{$providerOrderId}");
            return $res->successful();
        } catch (\Throwable) {
            return false;
        }
    }

    // ── Finish ──────────────────────────────────────────────────────────────

    public function finishOrder(string $providerOrderId): bool
    {
        try {
            $res = $this->http()->get("{$this->baseUrl}/user/finish/{$providerOrderId}");
            return $res->successful();
        } catch (\Throwable) {
            return false;
        }
    }

    // ── Helpers ─────────────────────────────────────────────────────────────

    private function http()
    {
        return Http::withToken($this->apiKey)
                   ->acceptJson()
                   ->timeout($this->timeout);
    }

    private function get(string $path, array $query = []): array
    {
        try {
            $response = $this->http()->get("{$this->baseUrl}{$path}", $query);
        } catch (ConnectionException $e) {
            throw new ProviderTimeoutException("5SIM connection timed out on {$path}", 'fivesim', 0, $e);
        }

        if ($response->status() === 401) {
            throw new ProviderAuthenticationException('5SIM authentication failed — check FIVESIM_API_KEY', 'fivesim');
        }

        if ($response->serverError()) {
            throw new ProviderUnavailableException("5SIM server error {$response->status()}", 'fivesim');
        }

        return $response->json() ?? [];
    }

    private function normalizeStatus(string $raw): string
    {
        return match (strtoupper($raw)) {
            'PENDING'  => 'waiting_for_otp',
            'RECEIVED' => 'otp_received',
            'CANCELED' => 'cancelled',
            'TIMEOUT'  => 'expired',
            'FINISHED' => 'completed',
            'BANNED'   => 'failed',
            default    => 'waiting_for_otp',
        };
    }

    private function formatServiceName(string $code): string
    {
        $map = [
            'whatsapp'    => 'WhatsApp',
            'telegram'    => 'Telegram',
            'google'      => 'Google',
            'facebook'    => 'Facebook',
            'instagram'   => 'Instagram',
            'twitter'     => 'Twitter / X',
            'tiktok'      => 'TikTok',
            'discord'     => 'Discord',
            'snapchat'    => 'Snapchat',
            'linkedin'    => 'LinkedIn',
            'amazon'      => 'Amazon',
            'uber'        => 'Uber',
            'paypal'      => 'PayPal',
            'airbnb'      => 'Airbnb',
            'netflix'     => 'Netflix',
            'spotify'     => 'Spotify',
            'microsoft'   => 'Microsoft',
            'apple'       => 'Apple',
            'binance'     => 'Binance',
            'chatgpt'     => 'ChatGPT',
            'openai'      => 'OpenAI',
        ];

        return $map[$code] ?? ucfirst(str_replace(['_', '-'], ' ', $code));
    }
}
