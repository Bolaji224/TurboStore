<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\NumberController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\PasskeyController;
use App\Http\Controllers\ReferralController;
use App\Http\Controllers\WalletController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function () {
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login',    [AuthController::class, 'login']);

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
Route::middleware('auth:api')->group(function () {
    Route::get('wallet',               [WalletController::class, 'show']);
    Route::get('wallet/transactions',  [WalletController::class, 'transactions']);
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
