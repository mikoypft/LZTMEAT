<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\ProductionRecord;
use App\Models\Inventory;

// Get total completed production quantity
$completedTotal = ProductionRecord::where('product_id', 15)
    ->where('status', 'completed')
    ->sum('quantity');

echo "Fixing inventory for Product 15 (Longganisa)..." . PHP_EOL;
echo "Expected total: {$completedTotal}" . PHP_EOL;

// Update the Production Facility inventory to match total completed
$inventory = Inventory::updateOrCreate(
    [
        'product_id' => 15,
        'location' => 'Production Facility'
    ],
    ['quantity' => $completedTotal]
);

echo "Updated Production Facility inventory to: {$inventory->quantity} units" . PHP_EOL;
echo "✓ Inventory corrected!" . PHP_EOL;
