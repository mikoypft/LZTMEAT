<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Safe migration for Plesk production environment
 * Adds transfer receipt tracking fields without affecting existing data
 * All new columns are nullable to preserve existing transfer records
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('transfers', function (Blueprint $table) {
            // Check and add quantity_received column
            if (!Schema::hasColumn('transfers', 'quantity_received')) {
                $table->decimal('quantity_received', 10, 2)
                    ->nullable()
                    ->after('quantity')
                    ->comment('Actual quantity received (for reconciliation)');
            }
            
            // Check and add discrepancy_reason column
            if (!Schema::hasColumn('transfers', 'discrepancy_reason')) {
                $table->string('discrepancy_reason')
                    ->nullable()
                    ->after('quantity_received')
                    ->comment('Reason for any quantity discrepancy');
            }
            
            // Check and add received_by column
            if (!Schema::hasColumn('transfers', 'received_by')) {
                $table->string('received_by')
                    ->nullable()
                    ->after('discrepancy_reason')
                    ->comment('Name/ID of person who received the transfer');
            }
            
            // Check and add received_at column
            if (!Schema::hasColumn('transfers', 'received_at')) {
                $table->timestamp('received_at')
                    ->nullable()
                    ->after('received_by')
                    ->comment('Timestamp when transfer was received');
            }
        });
    }

    public function down(): void
    {
        Schema::table('transfers', function (Blueprint $table) {
            // Only drop if columns exist
            if (Schema::hasColumn('transfers', 'quantity_received')) {
                $table->dropColumn('quantity_received');
            }
            if (Schema::hasColumn('transfers', 'discrepancy_reason')) {
                $table->dropColumn('discrepancy_reason');
            }
            if (Schema::hasColumn('transfers', 'received_by')) {
                $table->dropColumn('received_by');
            }
            if (Schema::hasColumn('transfers', 'received_at')) {
                $table->dropColumn('received_at');
            }
        });
    }
};
