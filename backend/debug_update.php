<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\ProductionRecord;
use App\Models\Inventory;

// Get B013 (the latest one you created)
$production = ProductionRecord::where('batch_number', 'B013')->first();

if (!$production) {
    echo "B013 not found. Let me check all recent productions:\n";
    $recent = ProductionRecord::orderBy('id', 'desc')->take(5)->get();
    foreach ($recent as $p) {
        echo "  Batch: {$p->batch_number}, ID: {$p->id}, Status: '{$p->status}'\n";
    }
    exit;
}

echo "Found B013:\n";
echo "  ID: {$production->id}\n";
echo "  Batch: {$production->batch_number}\n";
echo "  Current Status: '{$production->status}'\n";
echo "  Quantity: {$production->quantity}\n";
echo "  Product ID: {$production->product_id}\n";

// Check current inventory
$inventory = Inventory::where('product_id', $production->product_id)
    ->where('location', 'Production Facility')
    ->first();

echo "\nCurrent Production Facility inventory: " . ($inventory ? $inventory->quantity : 'NOT FOUND') . "\n";

// Now simulate what updateStatus should do
$oldStatus = $production->status;
$newStatus = 'completed';

echo "\n=== SIMULATING updateStatus ===\n";
echo "Old Status: '{$oldStatus}'\n";
echo "New Status: '{$newStatus}'\n";
echo "Condition check: newStatus === 'completed' && oldStatus !== 'completed'\n";
echo "  newStatus === 'completed': " . ($newStatus === 'completed' ? 'TRUE' : 'FALSE') . "\n";
echo "  oldStatus !== 'completed': " . ($oldStatus !== 'completed' ? 'TRUE' : 'FALSE') . "\n";
echo "  Overall: " . (($newStatus === 'completed' && $oldStatus !== 'completed') ? 'SHOULD ADD TO INVENTORY' : 'WILL NOT ADD TO INVENTORY') . "\n";

if ($newStatus === 'completed' && $oldStatus !== 'completed') {
    echo "\n=== ADDING TO INVENTORY ===\n";
    
    if ($inventory) {
        $oldQty = $inventory->quantity;
        $inventory->increment('quantity', $production->quantity);
        echo "Updated inventory: {$oldQty} + {$production->quantity} = {$inventory->quantity}\n";
    } else {
        $newInv = Inventory::create([
            'product_id' => $production->product_id,
            'location' => 'Production Facility',
            'quantity' => $production->quantity,
        ]);
        echo "Created new inventory with qty: {$newInv->quantity}\n";
    }
    
    // Also update the status
    $production->update(['status' => 'completed']);
    echo "Updated production status to 'completed'\n";
}

// Check final inventory
$inventory = Inventory::where('product_id', $production->product_id)
    ->where('location', 'Production Facility')
    ->first();

echo "\nFinal Production Facility inventory: " . ($inventory ? $inventory->quantity : 'NOT FOUND') . "\n";
