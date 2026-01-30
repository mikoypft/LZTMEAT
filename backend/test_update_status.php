<?php
// Test the updateStatus endpoint manually
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\ProductionRecord;
use App\Models\Inventory;

// Get the latest production (B008)
$production = ProductionRecord::where('batch_number', 'B008')->first();

if (!$production) {
    echo "Production B008 not found\n";
    exit;
}

echo "=== BEFORE UPDATE ===\n";
echo "Production ID: {$production->id}\n";
echo "Batch: {$production->batch_number}\n";
echo "Current Status: '{$production->status}'\n";
echo "Quantity: {$production->quantity}\n";

// Check current inventory
$inventory = Inventory::where('product_id', $production->product_id)
    ->where('location', 'Production Facility')
    ->first();

echo "Current Inventory Qty: " . ($inventory ? $inventory->quantity : 'NOT FOUND') . "\n";

// Now simulate what the API would do
echo "\n=== SIMULATING UPDATE STATUS ===\n";
$oldStatus = $production->status;
$newStatus = 'completed';

$production->update(['status' => $newStatus]);

// Add to inventory if transitioning to completed
if ($newStatus === 'completed' && $oldStatus !== 'completed') {
    echo "Transitioning to completed, adding to inventory...\n";
    
    $inventory = Inventory::where('product_id', $production->product_id)
        ->where('location', 'Production Facility')
        ->first();

    if ($inventory) {
        $oldQty = $inventory->quantity;
        $inventory->increment('quantity', $production->quantity);
        echo "Updated inventory: {$oldQty} + {$production->quantity} = {$inventory->quantity}\n";
    } else {
        echo "Inventory not found, creating new one\n";
        $newInv = Inventory::create([
            'product_id' => $production->product_id,
            'location' => 'Production Facility',
            'quantity' => $production->quantity,
        ]);
        echo "Created new inventory with qty: {$newInv->quantity}\n";
    }
}

echo "\n=== AFTER UPDATE ===\n";
echo "Production Status: '{$production->status}'\n";
$inventory = Inventory::where('product_id', $production->product_id)
    ->where('location', 'Production Facility')
    ->first();
echo "Inventory Qty: " . ($inventory ? $inventory->quantity : 'NOT FOUND') . "\n";
