<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Services\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminSettingsController extends Controller
{
    public function __construct(private AuditLogService $auditLog) {}

    public function index(): JsonResponse
    {
        $settings = Setting::orderBy('key')->get(['key', 'value', 'type', 'description']);
        return response()->json(['settings' => $settings]);
    }

    public function update(Request $request): JsonResponse
    {
        $request->validate([
            'settings'             => 'required|array',
            'settings.*.key'       => 'required|string|max:100',
            'settings.*.value'     => 'nullable|string',
            'settings.*.type'      => 'required|in:string,integer,boolean,json',
            'settings.*.description' => 'nullable|string|max:255',
        ]);

        foreach ($request->settings as $s) {
            Setting::set($s['key'], $s['value'] ?? '', $s['type'], $s['description'] ?? null);
        }

        $this->auditLog->logFromRequest($request, 'settings.update', null, ['keys' => array_column($request->settings, 'key')]);

        return response()->json(['message' => 'Settings updated.', 'settings' => Setting::orderBy('key')->get(['key', 'value', 'type', 'description'])]);
    }

    public function destroy(Request $request, string $key): JsonResponse
    {
        Setting::where('key', $key)->delete();
        $this->auditLog->logFromRequest($request, 'settings.delete', null, ['key' => $key]);
        return response()->json(['message' => 'Setting deleted.']);
    }
}
