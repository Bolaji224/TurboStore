<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Local mirror of the pre-launch waitlist (source of truth: the Klaviyo list
 * the waitlist site writes to) plus per-recipient launch campaign state.
 *
 * New table only — no existing tables are altered.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('waitlist_subscribers', function (Blueprint $table) {
            $table->id();

            // ── Waitlist data (synced from Klaviyo) ──────────────────────────
            $table->string('email')->unique();                 // normalised lower-case
            $table->string('first_name')->nullable();
            $table->string('source', 32)->default('klaviyo');
            $table->string('external_id')->nullable()->unique(); // Klaviyo profile id
            $table->string('marketing_consent', 32)->nullable(); // SUBSCRIBED | UNSUBSCRIBED | ...
            $table->timestamp('subscribed_at')->nullable();

            // ── Platform account link / onboarding ───────────────────────────
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            // existing_verified | existing_unverified | created
            $table->string('account_status', 32)->nullable();
            $table->timestamp('account_created_at')->nullable();  // created by this campaign
            $table->string('activation_token_hash', 64)->nullable(); // sha256 of the emailed token
            $table->timestamp('activation_expires_at')->nullable();
            $table->timestamp('activated_at')->nullable();

            // ── Launch email delivery ────────────────────────────────────────
            // pending | queued | sending | sent | failed | skipped
            $table->string('launch_email_status', 16)->default('pending');
            $table->string('launch_batch_id', 36)->nullable();
            $table->timestamp('launch_email_queued_at')->nullable();
            $table->timestamp('launch_email_sent_at')->nullable();
            $table->unsignedSmallInteger('launch_email_attempts')->default(0);
            $table->text('launch_email_last_error')->nullable();
            $table->string('skip_reason', 64)->nullable();

            $table->timestamps();

            $table->index('launch_email_status');
            $table->index('launch_batch_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('waitlist_subscribers');
    }
};
