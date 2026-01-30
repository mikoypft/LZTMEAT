<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\ProductionRecord;

// Simulate what would come from the API
echo "=== TEST: Creating production via simulated API call ===\n";

// This simulates what the frontend sends (no status field)
$productiondData = [
    'product_id' => 15,
    'quantity' => 60,
    'batch_number' => 'B_API_TEST',
    'operator' => 'Test User',
    'status' => null, // Frontend doesn't send this
];

// Apply the ?? 'in-progress' logic
$status = $productiondData['status'] ?? 'in-progress';

echo "Status value after ?? logic: '{$status}'\n";

// Create the record
$record = ProductionRecord::create([
    'product_id' => $productiondData['product_id'],
    'quantity' => $productiondData['quantity'],
    'batch_number' => $productiondData['batch_number'],
    'operator' => $productiondData['operator'],
    'status' => $status,
]);

echo "Created production:\n";
echo "  Batch: {$record->batch_number}\n";
echo "  Status: '{$record->status}'\n";
echo "  Quantity: {$record->quantity}\n";

// Clean up
$record->delete();
echo "\nTest record deleted.\n";
