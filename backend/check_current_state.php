<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\ProductionRecord;
use App\Models\Inventory;

echo "=== ALL PRODUCTION RECORDS FOR PRODUCT 15 ===" . PHP_EOL;
$all = ProductionRecord::where('product_id', 15)->orderBy('created_at', 'desc')->get();
echo "Total records: " . $all->count() . PHP_EOL;

foreach ($all as $p) {
    echo "ID: {$p->id}, Qty: {$p->quantity}, Status: {$p->status}, Batch: {$p->batch_number}, Created: {$p->created_at}" . PHP_EOL;
}

echo "\n=== INVENTORY TABLE DATA ===" . PHP_EOL;
$inv = Inventory::where('product_id', 15)->get();
foreach ($inv as $i) {
    echo "Location: {$i->location}, Qty: {$i->quantity}, Updated: {$i->updated_at}" . PHP_EOL;
}

echo "\n=== CALCULATION ===" . PHP_EOL;
$completed = ProductionRecord::where('product_id', 15)
    ->where('status', 'completed')
    ->sum('quantity');
echo "Sum of all COMPLETED productions: {$completed}" . PHP_EOL;

$inProgress = ProductionRecord::where('product_id', 15)
    ->where('status', 'in-progress')
    ->sum('quantity');
echo "Sum of all IN-PROGRESS productions: {$inProgress}" . PHP_EOL;

$productionFacility = Inventory::where('product_id', 15)
    ->where('location', 'Production Facility')
    ->first();
echo "Production Facility Inventory: " . ($productionFacility ? $productionFacility->quantity : "Not found") . PHP_EOL;
