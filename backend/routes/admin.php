<?php

use App\Http\Controllers\Admin\AdminAuthController;
use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\Admin\AdminOrderController;
use App\Http\Controllers\Admin\AdminReferralController;
use App\Http\Controllers\Admin\AdminReportsController;
use App\Http\Controllers\Admin\AdminSettingsController;
use App\Http\Controllers\Admin\AdminTransactionController;
use App\Http\Controllers\Admin\AdminUserController;
use Illuminate\Support\Facades\Route;

// Admin auth
Route::prefix('auth')->group(function () {
    Route::post('login', [AdminAuthController::class, 'login']);

    Route::middleware(['auth:api', 'admin'])->group(function () {
        Route::get('me',      [AdminAuthController::class, 'me']);
        Route::post('logout', [AdminAuthController::class, 'logout']);
    });
});

// All protected admin routes
Route::middleware(['auth:api', 'admin'])->group(function () {

    // Dashboard
    Route::get('dashboard/overview', [AdminDashboardController::class, 'overview']);
    Route::get('dashboard/activity', [AdminDashboardController::class, 'activity']);

    // Users
    Route::get('users',                        [AdminUserController::class, 'index']);
    Route::get('users/{user}',                 [AdminUserController::class, 'show']);
    Route::post('users/{user}/suspend',        [AdminUserController::class, 'suspend']);
    Route::post('users/{user}/restore',        [AdminUserController::class, 'restore']);
    Route::post('users/{user}/wallet/adjust',  [AdminUserController::class, 'adjustWallet']);

    // Orders
    Route::get('orders',              [AdminOrderController::class, 'index']);
    Route::get('orders/{order}',      [AdminOrderController::class, 'show']);
    Route::post('orders/{order}/cancel', [AdminOrderController::class, 'cancel']);

    // Transactions
    Route::get('transactions', [AdminTransactionController::class, 'index']);

    // Referrals
    Route::get('referrals/stats', [AdminReferralController::class, 'stats']);
    Route::get('referrals',       [AdminReferralController::class, 'index']);

    // Reports
    Route::get('reports/revenue', [AdminReportsController::class, 'revenue']);
    Route::get('reports/orders',  [AdminReportsController::class, 'orders']);
    Route::get('reports/users',   [AdminReportsController::class, 'users']);

    // Settings
    Route::get('settings',           [AdminSettingsController::class, 'index']);
    Route::post('settings',          [AdminSettingsController::class, 'update']);
    Route::delete('settings/{key}',  [AdminSettingsController::class, 'destroy']);
});
