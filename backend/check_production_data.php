<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\ProductionRecord;
use App\Models\Inventory;

echo "=== PRODUCTION RECORDS ===" . PHP_EOL;
$productions = ProductionRecord::with('product')->get();
if ($productions->isEmpty()) {
    echo "No production records found" . PHP_EOL;
} else {
    foreach ($productions as $p) {
        $productName = $p->product ? $p->product->name : 'Unknown';
        echo "ID: {$p->id}, Product: {$productName} (ID: {$p->product_id}), Qty: {$p->quantity}, Status: {$p->status}, Batch: {$p->batch_number}" . PHP_EOL;
    }
}

echo "\n=== INVENTORY RECORDS ===" . PHP_EOL;
$inventory = Inventory::with('product')->get();
if ($inventory->isEmpty()) {
    echo "No inventory records found" . PHP_EOL;
} else {
    foreach ($inventory as $i) {
        $productName = $i->product ? $i->product->name : 'Unknown';
        echo "Product: {$productName} (ID: {$i->product_id}), Location: {$i->location}, Qty: {$i->quantity}" . PHP_EOL;
    }
}

echo "\n=== PRODUCTION FACILITY TOTALS ===" . PHP_EOL;
$productionFacility = Inventory::where('location', 'Production Facility')->with('product')->sum('quantity');
echo "Total quantity in Production Facility: {$productionFacility}" . PHP_EOL;
