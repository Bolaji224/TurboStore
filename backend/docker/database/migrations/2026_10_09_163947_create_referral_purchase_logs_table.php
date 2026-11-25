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
        Schema::create('referral_purchase_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('referral_id')->constrained('referral_relationships')->cascadeOnDelete();
            $table->foreignId('order_id')->constrained('orders')->cascadeOnDelete();
            $table->timestamps();

            // Idempotency: one log entry per order — prevents double-counting
            $table->unique('order_id');
            $table->index('referral_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('referral_purchase_logs');
    }
};
