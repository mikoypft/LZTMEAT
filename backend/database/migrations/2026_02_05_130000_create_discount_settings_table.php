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
        Schema::create('discount_settings', function (Blueprint $table) {
            $table->id();
            $table->integer('wholesale_min_units')->default(5)->comment('Minimum units to qualify as wholesale');
            $table->decimal('wholesale_discount_percent', 5, 2)->default(1.00)->comment('Discount percentage for wholesale');
            $table->timestamps();
        });

        // Insert default settings
        DB::table('discount_settings')->insert([
            'wholesale_min_units' => 5,
            'wholesale_discount_percent' => 1.00,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('discount_settings');
    }
};
