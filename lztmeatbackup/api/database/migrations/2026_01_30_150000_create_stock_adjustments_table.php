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
        Schema::create('stock_adjustments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('ingredient_id');
            $table->string('ingredient_name'); // Store name for historical reference
            $table->string('ingredient_code'); // Store code for historical reference
            $table->enum('type', ['add', 'remove']); // Type of adjustment
            $table->decimal('quantity', 10, 2); // Amount adjusted
            $table->decimal('previous_stock', 10, 2); // Stock before adjustment
            $table->decimal('new_stock', 10, 2); // Stock after adjustment
            $table->string('unit'); // Unit of measurement
            $table->text('reason')->nullable(); // Reason/remarks for adjustment
            $table->unsignedBigInteger('user_id')->nullable(); // Who made the adjustment
            $table->string('user_name')->nullable(); // Store user name for historical reference
            $table->string('ip_address')->nullable(); // IP address for audit trail
            $table->timestamps();

            // Foreign key constraints
            $table->foreign('ingredient_id')
                  ->references('id')
                  ->on('ingredients')
                  ->onDelete('cascade');
            
            $table->foreign('user_id')
                  ->references('id')
                  ->on('users')
                  ->onDelete('set null');

            // Indexes for faster queries
            $table->index('ingredient_id');
            $table->index('user_id');
            $table->index('type');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_adjustments');
    }
};
