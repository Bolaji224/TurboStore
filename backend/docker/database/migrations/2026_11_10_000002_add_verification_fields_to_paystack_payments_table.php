<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Verification audit trail for Paystack payments.
 *
 * Additive and nullable only — existing rows and the status enum are untouched.
 *  - verified_at:             when Paystack's API confirmed this exact payment
 *                             (NULL on a 'success' row = credited without verification)
 *  - flag_reason:             set when Paystack confirms a charge that does NOT match
 *                             our record (amount/currency); such payments are never
 *                             auto-credited and need manual review
 *  - verification_attempts /
 *    last_verification_at:    observability for reconciliation
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('paystack_payments', function (Blueprint $table) {
            $table->timestamp('verified_at')->nullable()->after('paystack_data');
            $table->string('flag_reason', 64)->nullable()->after('verified_at');
            $table->unsignedSmallInteger('verification_attempts')->default(0)->after('flag_reason');
            $table->timestamp('last_verification_at')->nullable()->after('verification_attempts');

            $table->index('flag_reason');
        });
    }

    public function down(): void
    {
        Schema::table('paystack_payments', function (Blueprint $table) {
            $table->dropIndex(['flag_reason']);
            $table->dropColumn(['verified_at', 'flag_reason', 'verification_attempts', 'last_verification_at']);
        });
    }
};
