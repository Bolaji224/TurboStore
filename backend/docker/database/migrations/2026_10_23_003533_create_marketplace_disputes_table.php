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
        Schema::create('marketplace_disputes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('marketplace_order_id')->unique()->constrained('marketplace_orders')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('vendor_id')->constrained('vendors');
            $table->string('reason'); // not_delivered, wrong_service, quality_issue, other
            $table->text('description');
            $table->string('status')->default('open'); // open, under_review, resolved_refund, resolved_no_refund, closed
            $table->text('resolution_note')->nullable();
            $table->foreignId('resolved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('marketplace_disputes');
    }
};
