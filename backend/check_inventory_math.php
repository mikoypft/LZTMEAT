<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\ProductionRecord;
use App\Models\Inventory;

// Calculate sum of all completed productions for product 15
$completedTotal = ProductionRecord::where('product_id', 15)
    ->where('status', 'completed')
    ->sum('quantity');

echo "=== TOTAL COMPLETED PRODUCTIONS FOR PRODUCT 15 ===" . PHP_EOL;
echo "Total quantity from all completed batches: {$completedTotal}" . PHP_EOL;

// Check all inventory for product 15
echo "\n=== ALL INVENTORY FOR PRODUCT 15 ===" . PHP_EOL;
$allInv = Inventory::where('product_id', 15)->with('product')->get();
foreach ($allInv as $i) {
    echo "Location: {$i->location}, Qty: {$i->quantity}" . PHP_EOL;
}

$totalInv = Inventory::where('product_id', 15)->sum('quantity');
echo "Total across all locations: {$totalInv}" . PHP_EOL;

echo "\n=== DIFFERENCE ===" . PHP_EOL;
$difference = $completedTotal - $totalInv;
echo "Expected (completed productions): {$completedTotal}" . PHP_EOL;
echo "Actual (inventory): {$totalInv}" . PHP_EOL;
echo "Missing: {$difference}" . PHP_EOL;
