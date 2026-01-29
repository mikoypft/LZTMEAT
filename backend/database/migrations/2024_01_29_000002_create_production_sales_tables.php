<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('production_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->onDelete('cascade');
            $table->integer('quantity');
            $table->string('batch_number')->unique();
            $table->string('operator');
            $table->timestamps();
        });

        Schema::create('production_ingredients', function (Blueprint $table) {
            $table->id();
            $table->foreignId('production_id')->constrained('production_records')->onDelete('cascade');
            $table->foreignId('ingredient_id')->constrained('ingredients')->onDelete('cascade');
            $table->decimal('quantity', 10, 2);
        });

        Schema::create('sales', function (Blueprint $table) {
            $table->id();
            $table->string('transaction_id')->unique();
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('store_id')->nullable()->constrained('stores')->onDelete('set null');
            $table->json('customer')->nullable();
            $table->json('items');
            $table->decimal('subtotal', 10, 2);
            $table->decimal('global_discount', 10, 2)->default(0);
            $table->decimal('tax', 10, 2)->default(0);
            $table->decimal('total', 10, 2);
            $table->string('payment_method');
            $table->timestamps();
        });

        Schema::create('transfers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->onDelete('cascade');
            $table->string('from');
            $table->string('to');
            $table->integer('quantity');
            $table->enum('status', ['Pending', 'In Transit', 'Completed', 'Cancelled'])->default('Pending');
            $table->string('requested_by');
            $table->timestamps();
        });

        Schema::create('system_history', function (Blueprint $table) {
            $table->id();
            $table->string('action');
            $table->string('entity')->nullable();
            $table->string('entity_id')->nullable();
            $table->json('details')->nullable();
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('system_history');
        Schema::dropIfExists('transfers');
        Schema::dropIfExists('sales');
        Schema::dropIfExists('production_ingredients');
        Schema::dropIfExists('production_records');
    }
};
