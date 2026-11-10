<?php

namespace App\Http\Controllers;

use App\Models\WaitlistSubscriber;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Tymon\JWTAuth\Facades\JWTAuth;

/**
 * Lets a waitlist subscriber whose account was created by the launch campaign
 * choose their own password via the single-use link in their launch email.
 */
class AccountActivationController extends Controller
{
    private const INVALID = 'This activation link is invalid or has already been used. If you already set your password, please sign in — or use "Forgot password".';

    public function activate(Request $request)
    {
        $data = $request->validate([
            'email'    => 'required|email',
            'token'    => 'required|string|size:64',
            'password' => 'required|string|min:8|confirmed', // same rule as registration
        ]);

        $email = WaitlistSubscriber::normalizeEmail($data['email']);
        $hash  = hash('sha256', $data['token']);

        $result = DB::transaction(function () use ($email, $hash, $data) {
            $sub = WaitlistSubscriber::lockForUpdate()
                ->where('email', $email)
                ->whereNotNull('activation_token_hash')
                ->first();

            // Token must belong to THIS email's record (no cross-account use).
            if (!$sub || !hash_equals($sub->activation_token_hash, $hash)) {
                return ['error' => self::INVALID, 'status' => 422];
            }

            if (!$sub->activation_expires_at || $sub->activation_expires_at->isPast()) {
                return [
                    'error'   => 'This activation link has expired. Use "Forgot password" with your email address to set your password.',
                    'status'  => 422,
                    'expired' => true,
                ];
            }

            $user = $sub->user;
            if (!$user || strtolower($user->email) !== $email) {
                return ['error' => self::INVALID, 'status' => 422];
            }

            if ($user->is_suspended) {
                return ['error' => 'This account is not available. Please contact support.', 'status' => 403];
            }

            $user->update(['password' => $data['password']]); // hashed by the model cast

            // Clicking a secret link delivered to this inbox proves ownership of
            // the address — the same guarantee the verification email provides.
            if (!$user->hasVerifiedEmail()) {
                $user->markEmailAsVerified();
            }

            // Single use.
            $sub->update([
                'activation_token_hash' => null,
                'activation_expires_at' => null,
                'activated_at'          => now(),
            ]);

            return ['user' => $user];
        });

        if (isset($result['error'])) {
            return response()->json(array_filter([
                'message' => $result['error'],
                'expired' => $result['expired'] ?? null,
            ]), $result['status']);
        }

        return response()->json([
            'message' => 'Your account is active. Welcome to TurboStore!',
            'token'   => JWTAuth::fromUser($result['user']),
        ]);
    }
}
