<?php

namespace App\Jobs;

use App\Models\WaitlistSubscriber;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Fans a queued batch out into one SendLaunchEmailJob per recipient, released
 * in paced waves (batch_size every batch_delay_seconds). Safe to run twice:
 * each send job re-checks and claims its row before doing anything.
 */
class DispatchLaunchCampaignJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public function __construct(public string $batchId) {}

    public function handle(): void
    {
        $size  = max(1, (int) config('waitlist.launch.batch_size'));
        $delay = max(0, (int) config('waitlist.launch.batch_delay_seconds'));
        $wave  = 0;

        WaitlistSubscriber::where('launch_batch_id', $this->batchId)
            ->where('launch_email_status', WaitlistSubscriber::QUEUED)
            ->select('id')
            ->chunkById($size, function ($rows) use (&$wave, $delay) {
                foreach ($rows as $row) {
                    SendLaunchEmailJob::dispatch($row->id, $this->batchId)
                        ->delay(now()->addSeconds($wave * $delay));
                }
                $wave++;
            });
    }
}
