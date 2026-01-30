<?php
require_once __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

try {
    if (!Schema::hasColumn('categories', 'type')) {
        DB::statement("ALTER TABLE categories ADD COLUMN type VARCHAR(50) DEFAULT 'product'");
        echo "✅ Added 'type' column to categories table\n";
    } else {
        echo "✅ 'type' column already exists\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
