<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            // Marks this order as a reward redemption; prevents it from counting
            // toward the referred user's referral purchase milestones
            $table->foreignId('reward_id')
                  ->nullable()
                  ->after('idempotency_key')
                  ->constrained('referral_rewards')
                  ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropForeign(['reward_id']);
            $table->dropColumn('reward_id');
        });
    }
};
