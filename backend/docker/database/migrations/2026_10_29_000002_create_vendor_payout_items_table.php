<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vendor_payout_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('vendor_payout_request_id')
                  ->constrained('vendor_payout_requests')
                  ->onDelete('cascade');
            $table->foreignId('vendor_earning_id')
                  ->constrained('vendor_earnings');
            $table->unsignedBigInteger('amount_kobo');
            $table->timestamps();

            $table->unique(['vendor_payout_request_id', 'vendor_earning_id'], 'vpi_payout_earning_unique');
            $table->index('vendor_earning_id', 'vpi_earning_id_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vendor_payout_items');
    }
};
