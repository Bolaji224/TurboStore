<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureHasVendor
{
    public function handle(Request $request, Closure $next): Response
    {
        $vendor = $request->user()?->vendor;

        if (!$vendor) {
            return response()->json(['message' => 'You do not have a vendor profile.'], 404);
        }

        return $next($request);
    }
}
