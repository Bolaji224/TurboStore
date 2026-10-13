<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\Request;

class AuditLogService
{
    public function log(
        User    $admin,
        string  $action,
        mixed   $target = null,
        array   $payload = [],
        ?string $ip = null,
    ): AuditLog {
        return AuditLog::create([
            'admin_id'    => $admin->id,
            'action'      => $action,
            'target_type' => $target ? get_class($target) : null,
            'target_id'   => $target?->id,
            'payload'     => $payload ?: null,
            'ip_address'  => $ip,
        ]);
    }

    public function logFromRequest(Request $request, string $action, mixed $target = null, array $payload = []): AuditLog
    {
        return $this->log($request->user(), $action, $target, $payload, $request->ip());
    }
}
