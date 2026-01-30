<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Status column is now created in the main schema migration
        // This migration is a no-op to prevent duplicate column errors
    }

    public function down(): void
    {
        // No-op
    }
};
