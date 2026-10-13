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
        Schema::create('referral_rewards', function (Blueprint $table) {
            $table->id();
            $table->foreignId('referrer_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('referral_id')->constrained('referral_relationships')->cascadeOnDelete();
            $table->unsignedInteger('milestone');           // 10, 20, 30 …
            $table->string('status')->default('available'); // available | pending_use | redeemed
            $table->foreignId('redeemed_order_id')->nullable()->constrained('orders')->nullOnDelete();
            $table->timestamp('redeemed_at')->nullable();
            $table->timestamps();

            // One reward per milestone per referral relationship
            $table->unique(['referral_id', 'milestone']);
            $table->index(['referrer_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('referral_rewards');
    }
};
