<?php

namespace App\Providers;

use App\Services\PricingService;
use App\Services\Providers\FiveSimProvider;
use App\Services\Providers\GrizzlyProvider;
use App\Services\Providers\SmsPoolProvider;
use App\Services\ProviderManager;
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
        //
    }
}
