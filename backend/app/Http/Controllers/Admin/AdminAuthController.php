<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Tymon\JWTAuth\Facades\JWTAuth;

class AdminAuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        $token = JWTAuth::attempt($credentials);

        if (!$token) {
            return response()->json(['message' => 'Invalid credentials.'], 401);
        }

        $user = JWTAuth::user();

        if (!$user->admin_role) {
            JWTAuth::invalidate();
            return response()->json(['message' => 'Access denied. Not an admin.'], 403);
        }

        return response()->json([
            'token'      => $token,
            'token_type' => 'bearer',
            'admin'      => $this->formatAdmin($user),
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json(['admin' => $this->formatAdmin($request->user())]);
    }

    public function logout(): JsonResponse
    {
        JWTAuth::invalidate(JWTAuth::getToken());
        return response()->json(['message' => 'Logged out.']);
    }

    private function formatAdmin($user): array
    {
        return [
            'id'         => $user->id,
            'name'       => $user->name,
            'email'      => $user->email,
            'admin_role' => $user->admin_role,
        ];
    }
}
