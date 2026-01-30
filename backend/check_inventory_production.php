<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Inventory;

echo "=== Inventory at Production Facility ===" . PHP_EOL;
$inv = Inventory::where('location', 'Production Facility')->with('product')->get();
if ($inv->isEmpty()) {
    echo "No inventory records found at Production Facility" . PHP_EOL;
} else {
    foreach ($inv as $i) {
        $productName = $i->product ? $i->product->name : 'Unknown';
        echo "Product ID: {$i->product_id} ({$productName}), Qty: {$i->quantity}" . PHP_EOL;
    }
}
