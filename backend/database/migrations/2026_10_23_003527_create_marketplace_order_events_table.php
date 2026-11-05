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
        Schema::create('marketplace_order_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('marketplace_order_id')->constrained('marketplace_orders')->onDelete('cascade');
            $table->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete(); // null = system
            $table->string('event'); // created, paid, in_progress_started, delivered, completed, disputed, cancelled, refunded
            $table->text('note')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('marketplace_order_events');
    }
};
