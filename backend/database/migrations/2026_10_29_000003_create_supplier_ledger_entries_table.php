<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('supplier_ledger_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('vendor_id')->constrained('vendors')->onDelete('cascade');
            $table->string('idempotency_key')->unique();
            // earning_credited | earning_reversed | payout_reserved | payout_released | payout_settled
            $table->string('entry_type');
            $table->bigInteger('amount_kobo'); // signed: +ve credit, -ve debit on available balance
            $table->string('description');
            $table->string('related_model_type')->nullable();
            $table->unsignedBigInteger('related_model_id')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index('vendor_id',   'sle_vendor_id_index');
            $table->index('entry_type',  'sle_entry_type_index');
            $table->index(['related_model_type', 'related_model_id'], 'sle_related_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('supplier_ledger_entries');
    }
};
