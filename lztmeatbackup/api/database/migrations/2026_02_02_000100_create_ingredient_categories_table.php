<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Create ingredient_categories table
        Schema::create('ingredient_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->text('description')->nullable();
            $table->timestamps();
        });

        // Optionally add category_id to ingredients table as foreign key
        // Schema::table('ingredients', function (Blueprint $table) {
        //     $table->foreignId('ingredient_category_id')->nullable()->constrained('ingredient_categories')->onDelete('set null');
        // });
    }

    public function down(): void
    {
        Schema::dropIfExists('ingredient_categories');
    }
};
