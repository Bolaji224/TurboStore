<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureVendorApproved
{
    public function handle(Request $request, Closure $next): Response
    {
        $vendor = $request->user()?->vendor;

        if (!$vendor || $vendor->status !== 'approved') {
            return response()->json(['message' => 'Vendor account required.'], 403);
        }

        return $next($request);
    }
}
