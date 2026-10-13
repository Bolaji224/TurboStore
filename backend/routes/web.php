<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\SocialAuthController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/email/verify/{id}/{hash}', [AuthController::class, 'verifyEmail'])
    ->name('verification.verify');

Route::get('/auth/google/redirect',  [SocialAuthController::class, 'redirectToGoogle']);
Route::get('/auth/google/callback',  [SocialAuthController::class, 'handleGoogleCallback']);
