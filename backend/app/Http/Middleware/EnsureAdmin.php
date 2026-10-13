<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAdmin
{
    public function handle(Request $request, Closure $next, string $role = 'admin'): Response
    {
        $user = $request->user();

        if (!$user || !$user->admin_role) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        // super_admin passes all checks; admin only passes 'admin' check
        if ($role === 'super_admin' && $user->admin_role !== 'super_admin') {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        return $next($request);
    }
}
