<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\ReferralService;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Tymon\JWTAuth\Facades\JWTAuth;
use Tymon\JWTAuth\Exceptions\JWTException;

class AuthController extends Controller
{
    public function __construct(private ReferralService $referralService) {}

    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name'     => 'required|string|max:255',
            'email'    => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = User::create([
            'name'          => $request->name,
            'email'         => $request->email,
            'password'      => $request->password,
            'referral_code' => strtoupper(Str::random(8)),
            'referred_by'   => $request->referral_code ?? null,
        ]);

        if ($request->filled('referral_code')) {
            $this->referralService->handleRegistration($user, $request->referral_code);
        }

        $token = JWTAuth::fromUser($user);

        return response()->json([
            'message' => 'Registration successful.',
            'user'    => $this->formatUser($user),
            'token'   => $token,
        ], 201);
    }

    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            if (!$token = JWTAuth::attempt($request->only('email', 'password'))) {
                return response()->json(['message' => 'Invalid email or password'], 401);
            }
        } catch (JWTException $e) {
            return response()->json(['message' => 'Could not create token'], 500);
        }

        $user = auth()->user();

        return response()->json([
            'message'        => 'Login successful',
            'user'           => $this->formatUser($user),
            'token'          => $token,
            'email_verified' => $user->hasVerifiedEmail(),
        ]);
    }

    public function me()
    {
        $user = auth()->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        return response()->json(['user' => $this->formatUser($user)]);
    }

    public function logout()
    {
        try {
            JWTAuth::invalidate(JWTAuth::getToken());
        } catch (JWTException $e) {
            // Token already invalid — still log out
        }
        return response()->json(['message' => 'Logged out successfully']);
    }

    public function refresh()
    {
        try {
            $token = JWTAuth::refresh(JWTAuth::getToken());
            return response()->json(['token' => $token]);
        } catch (JWTException $e) {
            return response()->json(['message' => 'Token cannot be refreshed'], 401);
        }
    }

    public function resendVerification(Request $request)
    {
        $user = auth()->user();

        if ($user->hasVerifiedEmail()) {
            return response()->json(['message' => 'Email already verified'], 400);
        }

        try {
            $user->sendEmailVerificationNotification();
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to send verification email. Please try again.'], 500);
        }

        return response()->json(['message' => 'Verification email resent successfully']);
    }

    // Called when the user clicks the link in their email (web route, redirects browser)
    public function verifyEmail(Request $request, $id, $hash)
    {
        $frontendUrl = env('FRONTEND_URL', 'http://localhost:5173');
        $user        = User::find($id);

        if (!$user) {
            return redirect($frontendUrl . '/verify-email?error=invalid');
        }

        if (!hash_equals((string) $hash, sha1($user->getEmailForVerification()))) {
            return redirect($frontendUrl . '/verify-email?error=invalid');
        }

        if (!$request->hasValidSignature()) {
            return redirect($frontendUrl . '/verify-email?error=expired');
        }

        if (!$user->hasVerifiedEmail()) {
            $user->markEmailAsVerified();
            event(new Verified($user));
        }

        return redirect($frontendUrl . '/dashboard?verified=1');
    }

    private function formatUser(User $user): array
    {
        return [
            'id'               => $user->id,
            'name'             => $user->name,
            'email'            => $user->email,
            'referral_code'    => $user->referral_code,
            'email_verified'   => $user->hasVerifiedEmail(),
            'wallet_balance'   => (int) $user->wallet_balance,
            'wallet_naira'     => round($user->wallet_balance / 100, 2),
            'created_at'       => $user->created_at,
        ];
    }
}
