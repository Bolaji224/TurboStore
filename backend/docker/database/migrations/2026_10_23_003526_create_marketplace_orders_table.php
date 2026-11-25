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
        Schema::create('marketplace_orders', function (Blueprint $table) {
            $table->id();
            $table->string('reference')->unique(); // MO-XXXXXXXX
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade'); // buyer
            $table->foreignId('vendor_id')->constrained('vendors');
            $table->foreignId('service_id')->constrained('marketplace_services');
            $table->unsignedBigInteger('price_kobo'); // server-set price at time of order
            $table->unsignedTinyInteger('commission_rate'); // locked commission rate at time of order
            $table->unsignedBigInteger('commission_kobo')->default(0); // platform commission amount
            $table->unsignedBigInteger('vendor_earning_kobo')->default(0); // vendor's net earning
            $table->string('status')->default('pending'); // pending, paid, in_progress, delivered, completed, disputed, cancelled, refunded
            $table->text('requirements_provided')->nullable(); // customer's input
            $table->text('delivery_notes')->nullable(); // vendor's delivery note
            $table->text('delivery_proof')->nullable(); // URL or text evidence
            $table->string('idempotency_key')->unique()->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('delivered_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('disputed_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamp('refunded_at')->nullable();
            $table->timestamp('auto_complete_at')->nullable(); // 72h after delivery if no action
            $table->timestamps();

            $table->index('user_id');
            $table->index('vendor_id');
            $table->index('service_id');
            $table->index('status');
            $table->index('reference');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('marketplace_orders');
    }
};
