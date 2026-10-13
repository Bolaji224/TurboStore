<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\AdminUserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminUserController extends Controller
{
    public function __construct(private AdminUserService $service) {}

    public function index(Request $request): JsonResponse
    {
        $users = $this->service->list(
            filters: $request->only(['search', 'is_suspended', 'sort', 'dir']),
            perPage: (int) $request->get('per_page', 20),
        );

        return response()->json([
            'users' => $users->map(fn($u) => $this->service->formatUser($u)),
            'meta'  => [
                'total'        => $users->total(),
                'per_page'     => $users->perPage(),
                'current_page' => $users->currentPage(),
                'last_page'    => $users->lastPage(),
            ],
        ]);
    }

    public function show(User $user): JsonResponse
    {
        return response()->json($this->service->detail($user));
    }

    public function suspend(Request $request, User $user): JsonResponse
    {
        $request->validate(['reason' => 'required|string|max:500']);

        if ($user->admin_role) {
            return response()->json(['message' => 'Cannot suspend an admin account.'], 422);
        }

        $this->service->suspend($user, $request->reason, $request->user());
        return response()->json(['message' => 'User suspended.', 'user' => $this->service->formatUser($user->fresh())]);
    }

    public function restore(Request $request, User $user): JsonResponse
    {
        $this->service->restore($user, $request->user());
        return response()->json(['message' => 'User restored.', 'user' => $this->service->formatUser($user->fresh())]);
    }

    public function adjustWallet(Request $request, User $user): JsonResponse
    {
        $request->validate([
            'amount_naira' => 'required|numeric|not_in:0',
            'description'  => 'required|string|max:255',
        ]);

        $amountKobo = (int) round($request->amount_naira * 100);

        $this->service->adjustWallet($user, $amountKobo, $request->description, $request->user());

        return response()->json([
            'message' => 'Wallet adjusted.',
            'user'    => $this->service->formatUser($user->fresh()),
        ]);
    }
}
