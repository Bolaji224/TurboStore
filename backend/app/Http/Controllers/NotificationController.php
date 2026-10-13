<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use App\Services\NotificationService;

class NotificationController extends Controller
{
    public function __construct(private NotificationService $notificationService) {}

    /** GET /api/notifications */
    public function index()
    {
        $user = auth()->user();

        $notifications = Notification::where('user_id', $user->id)
            ->orderByDesc('created_at')
            ->limit(30)
            ->get();

        return response()->json([
            'notifications' => $notifications->map(fn($n) => $this->format($n)),
            'unread_count'  => $notifications->whereNull('read_at')->count(),
        ]);
    }

    /** POST /api/notifications/read-all */
    public function readAll()
    {
        Notification::where('user_id', auth()->id())
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json(['message' => 'All notifications marked as read.']);
    }

    /** POST /api/notifications/{id}/read */
    public function read(int $id)
    {
        $notification = Notification::where('id', $id)
            ->where('user_id', auth()->id())
            ->firstOrFail();

        $notification->update(['read_at' => now()]);

        return response()->json(['message' => 'Notification marked as read.']);
    }

    private function format(Notification $n): array
    {
        return [
            'id'         => $n->id,
            'type'       => $n->type,
            'title'      => $n->title,
            'body'       => $n->body,
            'data'       => $n->data,
            'unread'     => $n->isUnread(),
            'created_at' => $n->created_at->toIso8601String(),
        ];
    }
}
