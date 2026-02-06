<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Inventory;

echo "=== ALL LOCATIONS ===" . PHP_EOL;
$locations = Inventory::select('location')->distinct()->pluck('location')->toArray();
print_r($locations);

echo "\n=== ALL INVENTORY ===" . PHP_EOL;
$all = Inventory::with('product')->get();
foreach ($all as $i) {
    $productName = $i->product ? $i->product->name : 'Unknown';
    echo "Product: {$i->product_id} ({$productName}), Location: {$i->location}, Qty: {$i->quantity}" . PHP_EOL;
}
