<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureNotSuspended
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && $user->is_suspended) {
            return response()->json([
                'message' => 'Your account has been suspended.' . ($user->suspension_reason ? ' Reason: ' . $user->suspension_reason : ''),
                'code'    => 'account_suspended',
            ], 403);
        }

        return $next($request);
    }
}
