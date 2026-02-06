<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\ProductionRecord;
use App\Models\Inventory;

echo "=== CREATING TEST PRODUCTION ===\n";

// Create a new test production with in-progress status
$testProduction = ProductionRecord::create([
    'product_id' => 15, // Longganisa
    'quantity' => 75,
    'batch_number' => 'B_TEST_001',
    'operator' => 'Test User',
    'status' => 'in-progress',
]);

echo "Created: Batch {$testProduction->batch_number}, ID: {$testProduction->id}, Status: '{$testProduction->status}', Qty: {$testProduction->quantity}\n";

// Check inventory before update
$invBefore = Inventory::where('product_id', 15)
    ->where('location', 'Production Facility')
    ->first();
echo "\nInventory BEFORE completing: " . ($invBefore ? $invBefore->quantity : 0) . " kg\n";

// Now update status to completed
echo "\n=== UPDATING STATUS TO COMPLETED ===\n";
$testProduction->update(['status' => 'completed']);
echo "Updated status to: '{$testProduction->status}'\n";

// Manually run the inventory logic
$oldStatus = 'in-progress';
$newStatus = 'completed';

if ($newStatus === 'completed' && $oldStatus !== 'completed') {
    echo "Condition met: adding to inventory...\n";
    
    $inventory = Inventory::where('product_id', $testProduction->product_id)
        ->where('location', 'Production Facility')
        ->first();

    if ($inventory) {
        $oldQty = $inventory->quantity;
        $inventory->increment('quantity', $testProduction->quantity);
        echo "Incremented: {$oldQty} + {$testProduction->quantity} = {$inventory->quantity}\n";
    } else {
        $newInv = Inventory::create([
            'product_id' => $testProduction->product_id,
            'location' => 'Production Facility',
            'quantity' => $testProduction->quantity,
        ]);
        echo "Created new inventory: {$newInv->quantity} kg\n";
    }
}

// Check inventory after update
$invAfter = Inventory::where('product_id', 15)
    ->where('location', 'Production Facility')
    ->first();
echo "\nInventory AFTER completing: " . ($invAfter ? $invAfter->quantity : 0) . " kg\n";

// Clean up test data
ProductionRecord::where('batch_number', 'B_TEST_001')->delete();
echo "\nTest production deleted.\n";
