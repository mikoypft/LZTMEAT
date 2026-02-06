<?php
// Bootstrap Laravel
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Inventory;
use App\Models\ProductionRecord;

echo "=== INVENTORY DATA ===\n";
$inventory = Inventory::all();
foreach ($inventory as $inv) {
    echo "ID: {$inv->id}, Product ID: {$inv->product_id}, Location: '{$inv->location}', Qty: {$inv->quantity}\n";
}

echo "\n=== PRODUCTION RECORDS ===\n";
$productions = ProductionRecord::with('product')->get();
foreach ($productions as $prod) {
    $productName = $prod->product ? $prod->product->name : 'N/A';
    echo "ID: {$prod->id}, Batch: {$prod->batch_number}, Product: {$productName}, Qty: {$prod->quantity}, Status: {$prod->status}\n";
}

echo "\n=== TEST: Creating Production Facility Inventory ===\n";
// Find product ID 15 (Longganisa)
$existingPF = Inventory::where('product_id', 15)->where('location', 'Production Facility')->first();
if ($existingPF) {
    echo "Production Facility inventory already exists with qty: {$existingPF->quantity}\n";
} else {
    echo "No Production Facility inventory found. Creating one...\n";
    $newInv = Inventory::create([
        'product_id' => 15,
        'location' => 'Production Facility',
        'quantity' => 320, // Sum of all completed productions (20+100+100+50+50)
    ]);
    echo "Created inventory with ID: {$newInv->id}\n";
}

echo "\n=== UPDATED INVENTORY ===\n";
$inventory = Inventory::all();
foreach ($inventory as $inv) {
    echo "ID: {$inv->id}, Product ID: {$inv->product_id}, Location: '{$inv->location}', Qty: {$inv->quantity}\n";
}
