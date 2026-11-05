<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('vendor_payout_requests', function (Blueprint $table) {
            $table->string('payment_reference')->nullable()->after('admin_note');
            $table->text('payout_note')->nullable()->after('payment_reference');
            $table->timestamp('processed_at')->nullable()->after('reviewed_at');
            $table->unsignedBigInteger('processed_by')->nullable()->after('processed_at');
            $table->foreign('processed_by')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('vendor_payout_requests', function (Blueprint $table) {
            $table->dropForeign(['processed_by']);
            $table->dropColumn(['payment_reference', 'payout_note', 'processed_at', 'processed_by']);
        });
    }
};
