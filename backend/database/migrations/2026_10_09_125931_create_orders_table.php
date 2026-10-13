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
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('reference')->unique();              // TurboStore ref e.g. TS-000001
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('provider');                        // fivesim | smspool | grizzly
            $table->string('provider_order_id')->nullable();   // Provider's own order/activation ID
            $table->string('country');                         // Provider-native country code
            $table->string('service');                         // Provider-native service code
            $table->string('service_name');                    // Display name e.g. "WhatsApp"
            $table->string('phone_number')->nullable();        // Assigned virtual number
            $table->unsignedBigInteger('customer_price');      // In kobo (NGN × 100)
            $table->decimal('provider_cost', 10, 4)->default(0); // Provider cost in USD
            $table->string('status')->default('pending');      // Normalized TurboStore status
            $table->string('otp')->nullable();                 // Received OTP code
            $table->string('idempotency_key')->unique();       // Prevent double purchases
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamp('refunded_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index('provider_order_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
