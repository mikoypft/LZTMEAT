<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\ProductionRecord;
use App\Models\Inventory;

// Get the actual total from database
$total = ProductionRecord::where('product_id', 15)
    ->where('status', 'completed')
    ->sum('quantity');

echo "Updating inventory to match actual completed production total..." . PHP_EOL;
echo "Expected: {$total}" . PHP_EOL;

$inv = Inventory::updateOrCreate(
    [
        'product_id' => 15,
        'location' => 'Production Facility'
    ],
    ['quantity' => $total]
);

echo "✓ Updated! Current inventory: {$inv->quantity}" . PHP_EOL;
