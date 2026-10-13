<?php

namespace App\Http\Controllers;

use App\Exceptions\Provider\ProviderAuthenticationException;
use App\Exceptions\Provider\ProviderUnavailableException;
use App\Services\ProviderManager;
use Illuminate\Http\Request;

class NumberController extends Controller
{
    public function __construct(private ProviderManager $providerManager) {}

    /** GET /api/providers */
    public function providers()
    {
        return response()->json([
            'providers' => $this->providerManager->available(),
            'default'   => config('sms.default', 'fivesim'),
        ]);
    }

    /** GET /api/numbers/countries?provider=fivesim */
    public function countries(Request $request)
    {
        $providerName = $request->input('provider', config('sms.default', 'fivesim'));

        try {
            $driver    = $this->providerManager->provider($providerName);
            $countries = $driver->getCountries();

            return response()->json([
                'provider'  => $providerName,
                'countries' => array_map(fn($c) => $c->toArray(), $countries),
            ]);
        } catch (ProviderAuthenticationException $e) {
            return response()->json(['message' => 'Provider configuration error. Contact support.'], 503);
        } catch (ProviderUnavailableException $e) {
            return response()->json(['message' => 'Provider temporarily unavailable. Please try again.'], 503);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    /** GET /api/numbers/services?provider=fivesim&country=russia */
    public function services(Request $request)
    {
        $request->validate([
            'country'  => 'required|string',
            'provider' => 'sometimes|string',
        ]);

        $providerName = $request->input('provider', config('sms.default', 'fivesim'));
        $country      = $request->input('country');

        try {
            $driver   = $this->providerManager->provider($providerName);
            $services = $driver->getServices($country);

            return response()->json([
                'provider' => $providerName,
                'country'  => $country,
                'services' => array_map(fn($s) => $s->toArray(), $services),
            ]);
        } catch (ProviderAuthenticationException $e) {
            return response()->json(['message' => 'Provider configuration error. Contact support.'], 503);
        } catch (ProviderUnavailableException $e) {
            return response()->json(['message' => 'Provider temporarily unavailable. Please try again.'], 503);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    /** GET /api/numbers/availability?provider=fivesim&country=russia&service=whatsapp */
    public function availability(Request $request)
    {
        $request->validate([
            'country'  => 'required|string',
            'service'  => 'required|string',
            'provider' => 'sometimes|string',
        ]);

        $providerName = $request->input('provider', config('sms.default', 'fivesim'));
        $country      = $request->input('country');
        $service      = $request->input('service');

        try {
            $driver = $this->providerManager->provider($providerName);
            $data   = $driver->getAvailability($country, $service);

            return response()->json([
                'provider' => $providerName,
                ...$data->toArray(),
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\Throwable) {
            return response()->json(['available' => false, 'qty' => 0, 'customer_price' => 0]);
        }
    }
}
