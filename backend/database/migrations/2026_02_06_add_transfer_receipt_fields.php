<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('transfers', function (Blueprint $table) {
            if (!Schema::hasColumn('transfers', 'quantity_received')) {
                $table->decimal('quantity_received', 10, 2)->nullable()->after('quantity');
            }
            if (!Schema::hasColumn('transfers', 'discrepancy_reason')) {
                $table->string('discrepancy_reason')->nullable()->after('quantity_received');
            }
            if (!Schema::hasColumn('transfers', 'received_by')) {
                $table->string('received_by')->nullable()->after('discrepancy_reason');
            }
            if (!Schema::hasColumn('transfers', 'received_at')) {
                $table->timestamp('received_at')->nullable()->after('received_by');
            }
        });
    }

    public function down(): void
    {
        Schema::table('transfers', function (Blueprint $table) {
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
