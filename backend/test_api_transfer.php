<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Transfer;
use App\Models\Inventory;

echo "=== BEFORE TRANSFER ===" . PHP_EOL;
$chorizoMain = Inventory::where('product_id', 3)->where('location', 'Main Store')->first();
$chorizoProd = Inventory::where('product_id', 3)->where('location', 'Production Facility')->first();
echo "Chorizo at Main Store: {$chorizoMain->quantity}" . PHP_EOL;
echo "Chorizo at Production Facility: {$chorizoProd->quantity}" . PHP_EOL;

// Create a transfer from Production Facility to Main Store
$transfer = Transfer::create([
    'product_id' => 3, // Chorizo
    'from' => 'Production Facility',
    'to' => 'Main Store',
    'quantity' => 5,
    'requested_by' => 'API Test',
    'status' => 'Pending',
]);

echo "\nCreated transfer ID: {$transfer->id}, Status: {$transfer->status}" . PHP_EOL;

// Now simulate what the API does - update status to "Completed"
// The API sends status="completed" (lowercase with hyphen)
$oldStatus = $transfer->status;
$transfer->update(['status' => 'Completed']);
$transfer->refresh();

echo "Updated status to: {$transfer->status}" . PHP_EOL;

// Now manually run the inventory update logic that happens in updateStatus
if ($transfer->status === 'Completed' && $oldStatus !== 'Completed') {
    $productId = $transfer->product_id;
    $quantity = $transfer->quantity;
    $fromLocation = $transfer->from;
    $toLocation = $transfer->to;
    
    echo "Processing inventory update..." . PHP_EOL;
    
    // Decrease quantity at source
    $sourceInventory = Inventory::where('product_id', $productId)
        ->where('location', $fromLocation)
        ->first();
    
    if ($sourceInventory) {
        $newQty = max(0, $sourceInventory->quantity - $quantity);
        $sourceInventory->quantity = $newQty;
        $sourceInventory->save();
        echo "Decreased source from {$sourceInventory->quantity} to {$newQty}" . PHP_EOL;
    }
    
    // Increase at destination
    $destInventory = Inventory::where('product_id', $productId)
        ->where('location', $toLocation)
        ->first();
    
    if ($destInventory) {
        $newQty = $destInventory->quantity + $quantity;
        $destInventory->quantity = $newQty;
        $destInventory->save();
        echo "Increased destination from {$destInventory->quantity} to {$newQty}" . PHP_EOL;
    } else {
        Inventory::create([
            'product_id' => $productId,
            'location' => $toLocation,
            'quantity' => $quantity
        ]);
        echo "Created new destination inventory with {$quantity}" . PHP_EOL;
    }
}

echo "\n=== AFTER TRANSFER ===" . PHP_EOL;
$chorizoMain = Inventory::where('product_id', 3)->where('location', 'Main Store')->first();
$chorizoProd = Inventory::where('product_id', 3)->where('location', 'Production Facility')->first();
echo "Chorizo at Main Store: {$chorizoMain->quantity}" . PHP_EOL;
echo "Chorizo at Production Facility: {$chorizoProd->quantity}" . PHP_EOL;
