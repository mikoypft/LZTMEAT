<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\ProductionRecord;
use App\Models\Inventory;

// First, let's manually add B013's quantity to inventory since it was missed
echo "=== FIXING B013 INVENTORY ===\n";

$b013 = ProductionRecord::where('batch_number', 'B013')->first();
if ($b013) {
    $inventory = Inventory::where('product_id', $b013->product_id)
        ->where('location', 'Production Facility')
        ->first();
    
    $oldQty = $inventory->quantity;
    $inventory->increment('quantity', $b013->quantity);
    echo "Fixed B013: Added {$b013->quantity} to inventory. ({$oldQty} -> {$inventory->quantity})\n";
}

// Now let's reset B013 to 'in-progress' so we can test the flow
echo "\n=== RESETTING B013 TO 'in-progress' FOR TESTING ===\n";
$b013->update(['status' => 'in-progress']);
echo "B013 status reset to 'in-progress'\n";

// Roll back the inventory we just added
$inventory = Inventory::where('product_id', $b013->product_id)
    ->where('location', 'Production Facility')
    ->first();
$inventory->decrement('quantity', $b013->quantity);
echo "Rolled back inventory: now at {$inventory->quantity}\n";

echo "\n=== NOW TEST THE FLOW ===\n";
echo "B013 is in 'in-progress' state. Go to the UI and change it to 'Completed'.\n";
echo "The inventory should update from {$inventory->quantity} to " . ($inventory->quantity + $b013->quantity) . "\n";
