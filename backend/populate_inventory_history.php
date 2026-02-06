<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\SystemHistory;
use App\Models\Inventory;

$output = "=== Populating History for Inventory ===" . PHP_EOL;

// Get all inventory records
$inventory = Inventory::with('product')->get();
$output .= "Found " . $inventory->count() . " inventory records" . PHP_EOL . PHP_EOL;

$count = 0;
foreach ($inventory as $inv) {
    $historyKey = "inventory_{$inv->product_id}_{$inv->location}";
    
    $exists = SystemHistory::where('entity', 'Inventory')
        ->where('entity_id', $historyKey)
        ->exists();
    
    if (!$exists) {
        SystemHistory::create([
            'action' => 'Inventory Stock',
            'entity' => 'Inventory',
            'entity_id' => $historyKey,
            'description' => "{$inv->product->name} at {$inv->location}",
            'details' => json_encode([
                'product_id' => $inv->product_id,
                'product_name' => $inv->product->name,
                'location' => $inv->location,
                'quantity' => $inv->quantity,
                'sku' => $inv->product->sku,
            ]),
            'created_at' => now(),
        ]);
        $count++;
        $output .= "  ✓ Created inventory history for {$inv->product->name} at {$inv->location}" . PHP_EOL;
    }
}

$output .= "\nCreated $count new inventory history records" . PHP_EOL;
$output .= "Total SystemHistory records now: " . SystemHistory::count() . PHP_EOL;

// Show summary
$output .= "\n=== History Summary ===" . PHP_EOL;
$byEntity = SystemHistory::select('entity', \DB::raw('count(*) as count'))
    ->groupBy('entity')
    ->get();

$output .= "By Entity:" . PHP_EOL;
foreach ($byEntity as $item) {
    $output .= "  {$item->entity}: {$item->count}" . PHP_EOL;
}

echo $output;
file_put_contents(__DIR__ . '/history_output.txt', $output);

