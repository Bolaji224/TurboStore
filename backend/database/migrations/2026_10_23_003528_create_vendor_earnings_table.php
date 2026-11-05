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
        Schema::create('vendor_earnings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('vendor_id')->constrained('vendors')->onDelete('cascade');
            $table->foreignId('marketplace_order_id')->constrained('marketplace_orders')->onDelete('cascade');
            $table->bigInteger('amount_kobo'); // not unsigned — can be negative for refunds
            $table->string('type'); // earning, commission_refund, adjustment
            $table->string('status')->default('pending'); // pending, available, paid, reversed
            $table->timestamp('available_at')->nullable(); // when funds become available for payout
            $table->timestamps();

            $table->index('vendor_id');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vendor_earnings');
    }
};
