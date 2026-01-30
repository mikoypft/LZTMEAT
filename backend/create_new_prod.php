<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\ProductionRecord;

// Create a new production
$production = ProductionRecord::create([
    'product_id' => 15, // Longganisa
    'quantity' => 75,
    'batch_number' => 'B014',
    'operator' => 'Test Operator',
    'status' => 'in-progress',
]);

echo "Created new production:\n";
echo "  Batch: {$production->batch_number}\n";
echo "  Status: '{$production->status}'\n";
echo "  ID: {$production->id}\n";
