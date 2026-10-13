<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\AdminDashboardService;
use Illuminate\Http\JsonResponse;

class AdminDashboardController extends Controller
{
    public function __construct(private AdminDashboardService $service) {}

    public function overview(): JsonResponse
    {
        return response()->json($this->service->overview());
    }

    public function activity(): JsonResponse
    {
        return response()->json(['activity' => $this->service->recentActivity()]);
    }
}
