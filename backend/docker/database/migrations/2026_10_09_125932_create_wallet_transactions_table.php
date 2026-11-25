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
        Schema::create('wallet_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('order_id')->nullable()->constrained('orders')->nullOnDelete();
            $table->string('type');                         // deposit | purchase | refund | adjustment
            $table->bigInteger('amount');                   // In kobo; positive=credit, negative=debit
            $table->unsignedBigInteger('balance_before');   // Wallet balance before this transaction
            $table->unsignedBigInteger('balance_after');    // Wallet balance after this transaction
            $table->string('reference')->unique();          // Unique transaction reference
            $table->string('description');
            $table->timestamps();

            $table->index(['user_id', 'type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('wallet_transactions');
    }
};
