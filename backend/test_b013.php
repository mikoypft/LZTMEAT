<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\ProductionRecord;
use App\Models\Inventory;

// Get B013
$production = ProductionRecord::where('batch_number', 'B013')->first();

echo "Before update:\n";
echo "  B013 Status: '{$production->status}'\n";

$inventory = Inventory::where('product_id', $production->product_id)
    ->where('location', 'Production Facility')
    ->first();
echo "  Inventory: {$inventory->quantity}\n\n";

// Simulate the updateStatus API call
echo "=== Calling updateStatus logic ===\n";
$oldStatus = $production->status;
$newStatus = 'completed';

echo "oldStatus: '$oldStatus'\n";
echo "newStatus: '$newStatus'\n";
echo "Condition: newStatus === 'completed' && oldStatus !== 'completed'\n";
echo "Result: " . (($newStatus === 'completed' && $oldStatus !== 'completed') ? 'TRUE' : 'FALSE') . "\n\n";

// Update the status
$production->update(['status' => $newStatus]);

// If transitioning to completed status, add products to inventory
if ($newStatus === 'completed' && $oldStatus !== 'completed') {
    echo "Adding to inventory...\n";
    
    $inventory = Inventory::where('product_id', $production->product_id)
        ->where('location', 'Production Facility')
        ->first();

    if ($inventory) {
        $oldQty = $inventory->quantity;
        $inventory->increment('quantity', $production->quantity);
        echo "Updated inventory: {$oldQty} + {$production->quantity} = {$inventory->quantity}\n";
    }
} else {
    echo "NOT adding to inventory (condition failed)\n";
}

echo "\nAfter update:\n";
$production->refresh();
$inventory->refresh();
echo "  B013 Status: '{$production->status}'\n";
echo "  Inventory: {$inventory->quantity}\n";
