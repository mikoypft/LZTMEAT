<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Create stores first (no dependencies)
        Schema::create('stores', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->text('address');
            $table->string('contact_person')->nullable();
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamps();
        });

        // Create users (depends on stores)
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('username')->unique();
            $table->string('email')->nullable()->unique();
            $table->string('full_name');
            $table->enum('role', ['ADMIN', 'STORE', 'PRODUCTION', 'POS', 'EMPLOYEE'])->default('EMPLOYEE');
            $table->enum('employee_role', ['Store', 'Production', 'Employee', 'POS'])->nullable();
            $table->foreignId('store_id')->nullable()->constrained('stores')->onDelete('set null');
            $table->json('permissions')->nullable();
            $table->boolean('can_login')->default(true);
            $table->string('password');
            $table->rememberToken();
            $table->timestamps();
        });

        // Categories
        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->text('description')->nullable();
            $table->timestamps();
        });

        // Products (depends on categories)
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->foreignId('category_id')->constrained('categories')->onDelete('cascade');
            $table->decimal('price', 10, 2);
            $table->string('unit');
            $table->string('image')->nullable();
            $table->timestamps();
        });

        // Suppliers
        Schema::create('suppliers', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('contact_person');
            $table->string('phone');
            $table->string('email');
            $table->text('address');
            $table->timestamps();
        });

        // Ingredients (depends on suppliers)
        Schema::create('ingredients', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->unique();
            $table->string('category');
            $table->string('unit');
            $table->decimal('stock', 10, 2);
            $table->decimal('min_stock_level', 10, 2);
            $table->decimal('reorder_point', 10, 2);
            $table->decimal('cost_per_unit', 10, 2);
            $table->foreignId('supplier_id')->nullable()->constrained('suppliers')->onDelete('set null');
            $table->date('expiry_date')->nullable();
            $table->timestamps();
        });

        // Inventory (depends on products)
        Schema::create('inventory', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->onDelete('cascade');
            $table->string('location');
            $table->integer('quantity');
            $table->timestamps();
            $table->unique(['product_id', 'location']);
        });

        // Production records (depends on products)
        Schema::create('production_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->onDelete('cascade');
            $table->integer('quantity');
            $table->string('batch_number')->unique();
            $table->string('operator');
            $table->timestamps();
        });

        // Production ingredients (depends on production_records and ingredients)
        Schema::create('production_ingredients', function (Blueprint $table) {
            $table->id();
            $table->foreignId('production_id')->constrained('production_records')->onDelete('cascade');
            $table->foreignId('ingredient_id')->constrained('ingredients')->onDelete('cascade');
            $table->decimal('quantity', 10, 2);
        });

        // Sales (depends on users and stores)
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

        // Transfers (depends on products)
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

        // System history (depends on users)
        Schema::create('system_history', function (Blueprint $table) {
            $table->id();
            $table->string('action');
            $table->string('entity')->nullable();
            $table->string('entity_id')->nullable();
            $table->json('details')->nullable();
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
        });

        // Password reset tokens
        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        // Sessions
        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sessions');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('system_history');
        Schema::dropIfExists('transfers');
        Schema::dropIfExists('sales');
        Schema::dropIfExists('production_ingredients');
        Schema::dropIfExists('production_records');
        Schema::dropIfExists('inventory');
        Schema::dropIfExists('ingredients');
        Schema::dropIfExists('suppliers');
        Schema::dropIfExists('products');
        Schema::dropIfExists('categories');
        Schema::dropIfExists('users');
        Schema::dropIfExists('stores');
    }
};
