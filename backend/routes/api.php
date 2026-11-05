<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\Marketplace\MarketplaceCatalogueController;
use App\Http\Controllers\Marketplace\MarketplaceOrderController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\NumberController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\PasskeyController;
use App\Http\Controllers\PasswordResetController;
use App\Http\Controllers\ReferralController;
use App\Http\Controllers\Vendor\VendorEarningsController;
use App\Http\Controllers\Vendor\VendorOrderController;
use App\Http\Controllers\Vendor\VendorProfileController;
use App\Http\Controllers\Vendor\VendorServiceController;
use App\Http\Controllers\WalletController;
use App\Http\Controllers\WalletFundingController;
use Illuminate\Support\Facades\Route;

// ── Password reset (public, no auth) ─────────────────────────────────────────
Route::middleware('throttle:5,1')->group(function () {
    Route::post('forgot-password', [PasswordResetController::class, 'forgotPassword']);
    Route::post('reset-password',  [PasswordResetController::class, 'resetPassword']);
});

Route::prefix('auth')->group(function () {
    Route::post('register',        [AuthController::class, 'register'])->middleware('throttle:10,1');
    Route::post('vendor-register', [AuthController::class, 'vendorRegister'])->middleware('throttle:10,1');
    Route::post('login',           [AuthController::class, 'login'])->middleware('throttle:10,1');

    // Passkey authentication (no token needed — this IS the login)
    Route::post('passkey/authenticate/options', [PasskeyController::class, 'authenticateOptions']);
    Route::post('passkey/authenticate/verify',  [PasskeyController::class, 'authenticateVerify']);

    Route::middleware('auth:api')->group(function () {
        Route::get('me',                   [AuthController::class, 'me']);
        Route::post('logout',              [AuthController::class, 'logout']);
        Route::post('refresh',             [AuthController::class, 'refresh']);
        Route::post('email/resend',        [AuthController::class, 'resendVerification']);

        // Passkey management (requires existing session)
        Route::get('passkey',                        [PasskeyController::class, 'index']);
        Route::get('passkey/register/options',       [PasskeyController::class, 'registerOptions']);
        Route::post('passkey/register/verify',       [PasskeyController::class, 'registerVerify']);
        Route::delete('passkey/{id}',                [PasskeyController::class, 'destroy']);
    });
});

// ── Numbers (countries/services/availability) ─────────────────────────────
// Public endpoints — no auth required to browse, auth required to buy
Route::get('providers',                [NumberController::class, 'providers']);
Route::get('numbers/countries',        [NumberController::class, 'countries']);
Route::middleware('auth:api')->group(function () {
    Route::get('numbers/services',     [NumberController::class, 'services']);
    Route::get('numbers/availability', [NumberController::class, 'availability']);
});

// ── Orders ────────────────────────────────────────────────────────────────
Route::middleware(['auth:api', 'throttle:30,1'])->group(function () {
    Route::get('orders',                        [OrderController::class, 'index']);
    Route::get('orders/{reference}',            [OrderController::class, 'show']);
    Route::get('orders/{reference}/otp',        [OrderController::class, 'otp']);
    Route::post('orders/{reference}/cancel',    [OrderController::class, 'cancel']);
});

// Purchase has tighter rate limiting (5 per minute) to prevent abuse
Route::middleware(['auth:api', 'throttle:5,1'])->group(function () {
    Route::post('orders', [OrderController::class, 'store']);
});

// ── Wallet ────────────────────────────────────────────────────────────────
// Webhook is public — Paystack calls it server-to-server (no user auth)
Route::post('wallet/fund/webhook', [WalletFundingController::class, 'webhook']);

Route::middleware('auth:api')->group(function () {
    Route::get('wallet',               [WalletController::class, 'show']);
    Route::get('wallet/transactions',  [WalletController::class, 'transactions']);
    Route::post('wallet/fund/initiate',        [WalletFundingController::class, 'initiate'])->middleware('throttle:10,1');
    Route::post('wallet/fund/verify-inline',   [WalletFundingController::class, 'verifyInline']);
});

// ── Referrals ─────────────────────────────────────────────────────────────
Route::middleware('auth:api')->group(function () {
    Route::get('referrals/stats',   [ReferralController::class, 'stats']);
    Route::get('referrals/rewards', [ReferralController::class, 'rewards']);
    Route::get('referrals',         [ReferralController::class, 'index']);
});

// ── Notifications ─────────────────────────────────────────────────────────
Route::middleware('auth:api')->group(function () {
    Route::get('notifications',              [NotificationController::class, 'index']);
    Route::post('notifications/read-all',    [NotificationController::class, 'readAll']);
    Route::post('notifications/{id}/read',   [NotificationController::class, 'read']);
});

// ── Marketplace public routes ──────────────────────────────────────────────
Route::prefix('marketplace')->group(function () {
    Route::get('categories',           [MarketplaceCatalogueController::class, 'categories']);
    Route::get('services',             [MarketplaceCatalogueController::class, 'services']);
    Route::get('services/{slug}',      [MarketplaceCatalogueController::class, 'show']);
});

// ── Marketplace auth routes ────────────────────────────────────────────────
Route::prefix('marketplace')->middleware(['auth:api'])->group(function () {
    Route::post('orders',                         [MarketplaceOrderController::class, 'store'])->middleware('throttle:10,1');
    Route::get('orders',                          [MarketplaceOrderController::class, 'index']);
    Route::get('orders/{reference}',              [MarketplaceOrderController::class, 'show']);
    Route::post('orders/{reference}/confirm',     [MarketplaceOrderController::class, 'confirm']);
    Route::post('orders/{reference}/dispute',     [MarketplaceOrderController::class, 'dispute']);
    Route::post('orders/{reference}/cancel',      [MarketplaceOrderController::class, 'cancel']);
});

// ── Vendor routes ──────────────────────────────────────────────────────────
Route::prefix('vendor')->middleware(['auth:api'])->group(function () {
    Route::post('apply',    [VendorProfileController::class, 'apply']);
    Route::get('profile',   [VendorProfileController::class, 'show'])->middleware('vendor.has');
    Route::put('profile',   [VendorProfileController::class, 'update'])->middleware('vendor.has');

    // Approved vendor only
    Route::middleware('vendor.approved')->group(function () {
        Route::get('services',                    [VendorServiceController::class, 'index']);
        Route::post('services',                   [VendorServiceController::class, 'store']);
        Route::put('services/{id}',               [VendorServiceController::class, 'update']);
        Route::post('services/{id}',              [VendorServiceController::class, 'update']); // FormData alias
        Route::post('services/{id}/submit',       [VendorServiceController::class, 'submit']);
        Route::delete('services/{id}',            [VendorServiceController::class, 'destroy']);
        Route::get('orders',                      [VendorOrderController::class, 'index']);
        Route::get('orders/{reference}',          [VendorOrderController::class, 'show']);
        Route::post('orders/{reference}/progress',[VendorOrderController::class, 'markInProgress']);
        Route::post('orders/{reference}/deliver', [VendorOrderController::class, 'deliver']);
        Route::get('earnings',                    [VendorEarningsController::class, 'index']);
        Route::post('payouts',                    [VendorEarningsController::class, 'requestPayout']);
        Route::get('payouts',                     [VendorEarningsController::class, 'payouts']);
    });
});
