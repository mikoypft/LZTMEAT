<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('inventory', function (Blueprint $table) {
            // Change quantity from integer to decimal to support fractional weights (e.g., 1.5kg, 2.3kg)
            $table->decimal('quantity', 10, 2)->change();
        });
    }

    public function down()
    {
        Schema::table('inventory', function (Blueprint $table) {
            $table->integer('quantity')->change();
        });
    }
};
