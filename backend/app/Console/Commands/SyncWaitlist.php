<?php

namespace App\Console\Commands;

use App\Services\LaunchCampaignService;
use Illuminate\Console\Command;

/**
 * Read-only import of the Klaviyo waitlist into waitlist_subscribers.
 * Does NOT send any email.
 */
class SyncWaitlist extends Command
{
    protected $signature   = 'waitlist:sync';
    protected $description = 'Import waitlist subscribers from Klaviyo (read-only, sends no emails)';

    public function handle(LaunchCampaignService $campaign): int
    {
        $this->info('Syncing waitlist from Klaviyo…');

        try {
            $result = $campaign->syncFromKlaviyo();
        } catch (\Throwable $e) {
            $this->error($e->getMessage());
            return self::FAILURE;
        }

        $this->table(array_keys($result), [array_values($result)]);
        $this->info('Eligible for launch email: ' . $campaign->stats()['eligible']);

        return self::SUCCESS;
    }
}
