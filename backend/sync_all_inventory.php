<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\ProductionRecord;
use App\Models\Inventory;

// This script fixes inventory to match the actual sum of completed productions
echo "=== SYNCING INVENTORY TO DATABASE ===" . PHP_EOL;

$products = ProductionRecord::select('product_id')
    ->distinct()
    ->get();

foreach ($products as $product) {
    $productId = $product->product_id;
    
    // Get sum of completed
    $totalCompleted = ProductionRecord::where('product_id', $productId)
        ->where('status', 'completed')
        ->sum('quantity');
    
    // Update inventory
    $inv = Inventory::updateOrCreate(
        [
            'product_id' => $productId,
            'location' => 'Production Facility'
        ],
        ['quantity' => $totalCompleted]
    );
    
    echo "Product {$productId}: {$totalCompleted} units synced to inventory" . PHP_EOL;
}

echo "\n✓ All inventories synced!" . PHP_EOL;
