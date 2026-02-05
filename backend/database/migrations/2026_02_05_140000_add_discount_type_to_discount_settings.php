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
        Schema::table('discount_settings', function (Blueprint $table) {
            $table->enum('discount_type', ['percentage', 'fixed_amount'])->default('percentage')->after('wholesale_discount_percent');
            $table->decimal('wholesale_discount_amount', 8, 2)->nullable()->after('discount_type')->comment('Fixed discount amount when using fixed_amount type');
        });

        // Update existing record to use percentage type
        DB::table('discount_settings')->update(['discount_type' => 'percentage']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('discount_settings', function (Blueprint $table) {
            $table->dropColumn(['discount_type', 'wholesale_discount_amount']);
        });
    }
};
