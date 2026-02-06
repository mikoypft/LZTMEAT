<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\ProductionRecord;
use App\Models\Inventory;

echo "=== LATEST PRODUCTION RECORDS ===" . PHP_EOL;
$productions = ProductionRecord::where('product_id', 15)
    ->orderBy('created_at', 'desc')
    ->limit(5)
    ->get();

foreach ($productions as $p) {
    echo "ID: {$p->id}, Qty: {$p->quantity}, Status: {$p->status}, Batch: {$p->batch_number}, Created: {$p->created_at}" . PHP_EOL;
}

echo "\n=== CURRENT PRODUCTION FACILITY INVENTORY ===" . PHP_EOL;
$inv = Inventory::where('product_id', 15)
    ->where('location', 'Production Facility')
    ->first();

if ($inv) {
    echo "Current quantity: {$inv->quantity}" . PHP_EOL;
    echo "Last updated: {$inv->updated_at}" . PHP_EOL;
} else {
    echo "No inventory record found" . PHP_EOL;
}

echo "\n=== TOTAL COMPLETED FOR PRODUCT 15 ===" . PHP_EOL;
$total = ProductionRecord::where('product_id', 15)
    ->where('status', 'completed')
    ->sum('quantity');
echo "Total: {$total}" . PHP_EOL;
