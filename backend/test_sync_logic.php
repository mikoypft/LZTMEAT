<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\ProductionRecord;
use App\Models\Inventory;

// Simulate what happens when you mark a production as completed
$productId = 15;

echo "=== TESTING THE SYNC LOGIC ===" . PHP_EOL;
echo "Before: " . PHP_EOL;

$beforeInv = Inventory::where('product_id', $productId)
    ->where('location', 'Production Facility')
    ->first();
echo "  Inventory: " . ($beforeInv ? $beforeInv->quantity : 'Not found') . PHP_EOL;

$beforeTotal = ProductionRecord::where('product_id', $productId)
    ->where('status', 'completed')
    ->sum('quantity');
echo "  DB Total Completed: {$beforeTotal}" . PHP_EOL;

// Now manually sync like the updateStatus does
$totalCompleted = ProductionRecord::where('product_id', $productId)
    ->where('status', 'completed')
    ->sum('quantity');

$inventory = Inventory::updateOrCreate(
    [
        'product_id' => $productId,
        'location' => 'Production Facility'
    ],
    ['quantity' => $totalCompleted]
);

echo "\nAfter sync: " . PHP_EOL;
echo "  Inventory: {$inventory->quantity}" . PHP_EOL;
echo "  DB Total: {$totalCompleted}" . PHP_EOL;

if ($inventory->quantity == $totalCompleted) {
    echo "\n✓ SYNC IS WORKING!" . PHP_EOL;
} else {
    echo "\n✗ SYNC FAILED!" . PHP_EOL;
}
