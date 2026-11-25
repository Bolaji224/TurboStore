<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('marketplace_services', function (Blueprint $table) {
            $table->json('extra_images')->nullable()->after('image_url');
        });
    }

    public function down(): void
    {
        Schema::table('marketplace_services', function (Blueprint $table) {
            $table->dropColumn('extra_images');
        });
    }
};
