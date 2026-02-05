<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Transfer;
use App\Models\Inventory;

echo "=== BEFORE TRANSFER ===" . PHP_EOL;
$tocinoMain = Inventory::where('product_id', 2)->where('location', 'Main Store')->first();
$tocinoProd = Inventory::where('product_id', 2)->where('location', 'Production Facility')->first();
echo "Tocino at Main Store: {$tocinoMain->quantity}" . PHP_EOL;
echo "Tocino at Production Facility: {$tocinoProd->quantity}" . PHP_EOL;

// Create a transfer from Production Facility to Main Store
$transfer = Transfer::create([
    'product_id' => 2, // Tocino
    'from' => 'Production Facility',
    'to' => 'Main Store',
    'quantity' => 10,
    'requested_by' => 'Test User',
    'status' => 'Pending',
]);

echo "\nCreated transfer ID: {$transfer->id}" . PHP_EOL;

// Simulate marking it as completed
$transfer->status = 'Completed';
$transfer->save();

echo "Marked as Completed" . PHP_EOL;

// Now manually call the update logic (since it would be called via API in real scenario)
// Let's directly execute what TransferController.updateStatus does
$oldStatus = 'Pending';
$status = 'Completed';
if ($status === 'Completed' && $oldStatus !== 'Completed') {
    $productId = $transfer->product_id;
    $quantity = $transfer->quantity;
    $fromLocation = $transfer->from;
    $toLocation = $transfer->to;
    
    // Decrease quantity at source
    $sourceInventory = Inventory::where('product_id', $productId)
        ->where('location', $fromLocation)
        ->first();
    
    if ($sourceInventory) {
        $newQty = max(0, $sourceInventory->quantity - $quantity);
        $sourceInventory->quantity = $newQty;
        $sourceInventory->save();
        echo "Updated source: {$newQty}" . PHP_EOL;
    }
    
    // Increase at destination
    $destInventory = Inventory::where('product_id', $productId)
        ->where('location', $toLocation)
        ->first();
    
    if ($destInventory) {
        $newQty = $destInventory->quantity + $quantity;
        $destInventory->quantity = $newQty;
        $destInventory->save();
        echo "Updated destination: {$newQty}" . PHP_EOL;
    } else {
        Inventory::create([
            'product_id' => $productId,
            'location' => $toLocation,
            'quantity' => $quantity
        ]);
        echo "Created new destination inventory: {$quantity}" . PHP_EOL;
    }
}

echo "\n=== AFTER TRANSFER ===" . PHP_EOL;
$tocinoMain = Inventory::where('product_id', 2)->where('location', 'Main Store')->first();
$tocinoProd = Inventory::where('product_id', 2)->where('location', 'Production Facility')->first();
echo "Tocino at Main Store: {$tocinoMain->quantity}" . PHP_EOL;
echo "Tocino at Production Facility: {$tocinoProd->quantity}" . PHP_EOL;
