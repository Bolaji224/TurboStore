<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('admin_role')->nullable()->after('referral_code'); // super_admin | admin
            $table->boolean('is_suspended')->default(false)->after('admin_role');
            $table->timestamp('suspended_at')->nullable()->after('is_suspended');
            $table->string('suspension_reason')->nullable()->after('suspended_at');
            $table->index('admin_role');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['admin_role']);
            $table->dropColumn(['admin_role', 'is_suspended', 'suspended_at', 'suspension_reason']);
        });
    }
};
