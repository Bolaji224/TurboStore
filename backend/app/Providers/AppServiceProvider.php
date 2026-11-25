<?php

namespace App\Providers;

use App\Models\Setting;
use App\Services\PricingService;
use App\Services\Providers\FiveSimProvider;
use App\Services\Providers\GrizzlyProvider;
use App\Services\Providers\SmsPoolProvider;
use App\Services\ProviderManager;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // Bind providers as singletons so config is read once per request
        $this->app->singleton(FiveSimProvider::class, function ($app) {
            return new FiveSimProvider(
                apiKey:  config('sms.providers.fivesim.key', ''),
                pricing: $app->make(PricingService::class),
            );
        });

        $this->app->singleton(SmsPoolProvider::class, function ($app) {
            return new SmsPoolProvider(
                apiKey:  config('sms.providers.smspool.key', ''),
                pricing: $app->make(PricingService::class),
            );
        });

        $this->app->singleton(GrizzlyProvider::class, function ($app) {
            return new GrizzlyProvider(
                apiKey:  config('sms.providers.grizzly.key', ''),
                pricing: $app->make(PricingService::class),
            );
        });

        $this->app->singleton(ProviderManager::class);
    }

    public function boot(): void
    {
        Schema::defaultStringLength(191);

        // Override mail and Paystack config from DB settings so admin can change
        // them without touching .env or redeploying.
        try {
            $mailHost = Setting::get('mail_host');
            if ($mailHost) {
                config([
                    'mail.default'                    => 'smtp',
                    'mail.mailers.smtp.host'          => $mailHost,
                    'mail.mailers.smtp.port'          => (int) Setting::get('mail_port', 587),
                    'mail.mailers.smtp.username'      => Setting::get('mail_username', ''),
                    'mail.mailers.smtp.password'      => Setting::get('mail_password', ''),
                    'mail.mailers.smtp.encryption'    => Setting::get('mail_encryption', 'tls'),
                    'mail.from.address'               => Setting::get('mail_from_address', ''),
                    'mail.from.name'                  => Setting::get('mail_from_name', config('app.name')),
                ]);
            }

            $paystackSecret = Setting::get('paystack_secret_key');
            if ($paystackSecret) {
                config([
                    'services.paystack.secret_key' => $paystackSecret,
                    'services.paystack.public_key' => Setting::get('paystack_public_key', ''),
                ]);
            }
        } catch (\Exception $e) {
            // DB not ready (e.g., during migrations) — fall back to .env silently
        }
    }
}
