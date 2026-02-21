<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('transfers', function (Blueprint $table) {
            $table->enum('type', ['forward', 'return_backorder', 'return_scrap'])
                  ->default('forward')
                  ->after('status');
            $table->text('return_notes')->nullable()->after('type');
        });
    }

    public function down(): void
    {
        Schema::table('transfers', function (Blueprint $table) {
            $table->dropColumn(['type', 'return_notes']);
        });
    }
};
