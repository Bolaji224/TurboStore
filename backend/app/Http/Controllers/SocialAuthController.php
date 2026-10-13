<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;
use Tymon\JWTAuth\Facades\JWTAuth;

class SocialAuthController extends Controller
{
    public function redirectToGoogle()
    {
        return Socialite::driver('google')
            ->stateless()
            ->redirect();
    }

    public function handleGoogleCallback()
    {
        $frontendUrl = env('FRONTEND_URL', 'http://localhost:5173');

        try {
            $googleUser = Socialite::driver('google')->stateless()->user();
        } catch (\Exception $e) {
            return redirect($frontendUrl . '/auth/callback?error=google_failed');
        }

        $user = User::where('google_id', $googleUser->getId())->first();

        if (!$user) {
            $user = User::where('email', $googleUser->getEmail())->first();
            if ($user) {
                $user->update(['google_id' => $googleUser->getId()]);
            } else {
                $user = User::create([
                    'name'          => $googleUser->getName(),
                    'email'         => $googleUser->getEmail(),
                    'google_id'     => $googleUser->getId(),
                    'password'      => null,
                    'referral_code' => strtoupper(Str::random(8)),
                ]);
            }
        }

        $token = JWTAuth::fromUser($user);

        return redirect($frontendUrl . '/auth/callback?token=' . $token);
    }
}
