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
        Schema::create('marketplace_services', function (Blueprint $table) {
            $table->id();
            $table->foreignId('vendor_id')->constrained('vendors')->onDelete('cascade');
            $table->foreignId('category_id')->constrained('marketplace_categories');
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('description');
            $table->string('platform'); // copy from category or vendor-set
            $table->text('what_you_get'); // what customer receives
            $table->text('requirements')->nullable(); // what customer must provide
            $table->unsignedBigInteger('starting_price_kobo');
            $table->unsignedTinyInteger('delivery_days')->default(1);
            $table->text('refund_policy')->nullable();
            $table->string('status')->default('draft'); // draft, pending_review, approved, rejected, suspended
            $table->text('rejection_reason')->nullable();
            $table->boolean('is_featured')->default(false);
            $table->decimal('avg_rating', 3, 2)->nullable();
            $table->unsignedInteger('review_count')->default(0);
            $table->unsignedInteger('order_count')->default(0);
            $table->timestamp('approved_at')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('vendor_id');
            $table->index('category_id');
            $table->index('status');
            $table->index('platform');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('marketplace_services');
    }
};
