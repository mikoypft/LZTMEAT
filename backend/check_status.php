<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\ProductionRecord;

echo "=== ALL PRODUCTION RECORDS WITH STATUS ===\n";
$productions = ProductionRecord::all();
foreach ($productions as $prod) {
    echo "Batch: {$prod->batch_number}, Qty: {$prod->quantity}, Status: '{$prod->status}', Created: {$prod->created_at}\n";
}
