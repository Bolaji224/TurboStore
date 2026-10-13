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

class GrizzlyProvider implements SmsProviderInterface
{
    private string $baseUrl;
    private int    $timeout;

    // Grizzly uses action=setStatus with numeric codes
    private const STATUS_FINISH = 6;
    private const STATUS_CANCEL = 8;

    public function __construct(
        private string $apiKey,
        private PricingService $pricing,
    ) {
        $cfg           = config('sms.providers.grizzly');
        $this->baseUrl = rtrim($cfg['base_url'] ?? 'https://api.grizzlysms.com/stubs/handler_api.php', '/');
        $this->timeout = $cfg['timeout'] ?? 30;
    }

    public function getName(): string
    {
        return 'grizzly';
    }

    // ── Balance ─────────────────────────────────────────────────────────────

    public function getBalance(): float
    {
        $body = $this->query(['action' => 'getBalance']);

        // Response: "ACCESS_BALANCE:123.45"
        if (str_starts_with($body, 'ACCESS_BALANCE:')) {
            return (float) substr($body, strlen('ACCESS_BALANCE:'));
        }

        $this->assertNotError($body, 'getBalance');
        return 0;
    }

    // ── Countries ───────────────────────────────────────────────────────────

    public function getCountries(): array
    {
        $json = $this->queryJson(['action' => 'getCountries']);

        return collect($json)
            ->map(fn($data, $id) => new CountryData(
                code:   (string) $id,
                name:   $data['eng'] ?? $data['name'] ?? ucfirst((string) $id),
                iso:    $data['iso'] ?? null,
                prefix: null,
            ))
            ->sortBy('name')
            ->values()
            ->all();
    }

    // ── Services ────────────────────────────────────────────────────────────

    public function getServices(string $country): array
    {
        $json = $this->queryJson(['action' => 'getPrices', 'country' => $country]);

        // Response: { service_code: { cost: float, count: int } }
        return collect($json)
            ->map(fn($data, $service) => new ServiceData(
                code:          (string) $service,
                name:          $this->formatServiceName((string) $service),
                qty:           (int) ($data['count'] ?? 0),
                providerPrice: (float) ($data['cost'] ?? 0),
                customerPrice: $this->pricing->calculateCustomerPrice((float) ($data['cost'] ?? 0)),
            ))
            ->sortBy('name')
            ->values()
            ->all();
    }

    // ── Availability ────────────────────────────────────────────────────────

    public function getAvailability(string $country, string $service): AvailabilityData
    {
        try {
            $json = $this->queryJson([
                'action'  => 'getPrices',
                'country' => $country,
                'service' => $service,
            ]);

            if (empty($json) || !isset($json[$service])) {
                return new AvailabilityData($country, $service, 0, 0, 0, false);
            }

            $data  = $json[$service];
            $qty   = (int) ($data['count'] ?? 0);
            $price = (float) ($data['cost'] ?? 0);

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
                ->get($this->baseUrl, [
                    'api_key' => $this->apiKey,
                    'action'  => 'getNumberV2',
                    'service' => $service,
                    'country' => $country,
                ]);
        } catch (ConnectionException $e) {
            throw new ProviderTimeoutException('Grizzly connection timed out', 'grizzly', 0, $e);
        }

        $duration = round((microtime(true) - $start) * 1000);
        $body     = $response->body();

        Log::channel('stack')->info('[Grizzly] buy_number', [
            'provider'    => 'grizzly',
            'operation'   => 'buy_number',
            'country'     => $country,
            'service'     => $service,
            'http_status' => $response->status(),
            'duration_ms' => $duration,
            'success'     => $response->successful(),
        ]);

        $this->assertNotError($body, 'getNumberV2');

        // Try JSON first (getNumberV2 returns JSON)
        $data = $response->json();
        if (is_array($data) && isset($data['activationId'])) {
            return new PurchasedNumberData(
                providerOrderId: (string) $data['activationId'],
                phoneNumber:     $data['phoneNumber'],
                country:         $country,
                service:         $service,
                providerCost:    (float) ($data['activationCost'] ?? 0),
                rawStatus:       'STATUS_WAIT_CODE',
            );
        }

        // Fallback: text "ACCESS_NUMBER:ID:PHONE"
        if (str_starts_with($body, 'ACCESS_NUMBER:')) {
            [, $id, $phone] = explode(':', $body, 3);
            return new PurchasedNumberData(
                providerOrderId: $id,
                phoneNumber:     $phone,
                country:         $country,
                service:         $service,
                providerCost:    0,
                rawStatus:       'STATUS_WAIT_CODE',
            );
        }

        throw new ProviderPurchaseException("Grizzly unexpected response: {$body}", 'grizzly');
    }

    // ── Order Status ────────────────────────────────────────────────────────

    public function getOrderStatus(string $providerOrderId): OrderStatusData
    {
        $body = $this->query([
            'action' => 'getStatus',
            'id'     => $providerOrderId,
        ]);

        // Formats: "STATUS_WAIT_CODE" | "STATUS_OK:CODE" | "STATUS_CANCEL"
        $otp       = null;
        $rawStatus = $body;

        if (str_starts_with($body, 'STATUS_OK:')) {
            $otp = substr($body, strlen('STATUS_OK:'));
        }

        return new OrderStatusData(
            providerOrderId: $providerOrderId,
            status:          $this->normalizeStatus($rawStatus),
            otp:             $otp,
            rawStatus:       $rawStatus,
        );
    }

    // ── Cancel ──────────────────────────────────────────────────────────────

    public function cancelOrder(string $providerOrderId): bool
    {
        try {
            $body = $this->query([
                'action' => 'setStatus',
                'id'     => $providerOrderId,
                'status' => self::STATUS_CANCEL,
            ]);
            return str_contains($body, 'ACCESS_CANCEL') || str_contains($body, '1');
        } catch (\Throwable) {
            return false;
        }
    }

    // ── Finish ──────────────────────────────────────────────────────────────

    public function finishOrder(string $providerOrderId): bool
    {
        try {
            $body = $this->query([
                'action' => 'setStatus',
                'id'     => $providerOrderId,
                'status' => self::STATUS_FINISH,
            ]);
            return str_contains($body, 'ACCESS_ACTIVATION') || str_contains($body, '1');
        } catch (\Throwable) {
            return false;
        }
    }

    // ── Helpers ─────────────────────────────────────────────────────────────

    private function query(array $params): string
    {
        try {
            $response = Http::timeout($this->timeout)
                ->get($this->baseUrl, array_merge(['api_key' => $this->apiKey], $params));
        } catch (ConnectionException $e) {
            throw new ProviderTimeoutException('Grizzly connection timed out', 'grizzly', 0, $e);
        }

        if ($response->serverError()) {
            throw new ProviderUnavailableException("Grizzly server error {$response->status()}", 'grizzly');
        }

        return trim($response->body());
    }

    private function queryJson(array $params): array
    {
        $body = $this->query($params);

        $decoded = json_decode($body, true);
        if (is_array($decoded)) {
            return $decoded;
        }

        $this->assertNotError($body, $params['action'] ?? '');
        return [];
    }

    private function assertNotError(string $body, string $operation): void
    {
        match (true) {
            str_contains($body, 'BAD_KEY')                     => throw new ProviderAuthenticationException('Grizzly: invalid API key', 'grizzly'),
            str_contains($body, 'NO_NUMBERS')                  => throw new ProviderOutOfStockException('Grizzly: no numbers available', 'grizzly'),
            str_contains($body, 'SERVICE_UNAVAILABLE_REGION')  => throw new ProviderOutOfStockException('Grizzly: service unavailable in region', 'grizzly'),
            default                                            => null,
        };
    }

    private function normalizeStatus(string $raw): string
    {
        if (str_starts_with($raw, 'STATUS_OK')) return 'otp_received';

        return match (strtoupper($raw)) {
            'STATUS_WAIT_CODE',
            'STATUS_WAIT_RESEND',
            'STATUS_WAIT_RETRY'  => 'waiting_for_otp',
            'STATUS_CANCEL'      => 'cancelled',
            default              => 'waiting_for_otp',
        };
    }

    private function formatServiceName(string $code): string
    {
        $map = [
            'wa'    => 'WhatsApp',
            'tg'    => 'Telegram',
            'go'    => 'Google',
            'fb'    => 'Facebook',
            'ig'    => 'Instagram',
            'tw'    => 'Twitter / X',
            'tt'    => 'TikTok',
            'dc'    => 'Discord',
            'sc'    => 'Snapchat',
            'li'    => 'LinkedIn',
            'am'    => 'Amazon',
            'ub'    => 'Uber',
            'pp'    => 'PayPal',
            'ab'    => 'Airbnb',
            'nf'    => 'Netflix',
            'sp'    => 'Spotify',
            'ms'    => 'Microsoft',
            'ap'    => 'Apple',
            'bn'    => 'Binance',
            'oa'    => 'OpenAI',
        ];

        return $map[$code] ?? ucfirst(str_replace(['_', '-'], ' ', $code));
    }
}
