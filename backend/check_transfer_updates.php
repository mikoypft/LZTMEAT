<?php
// Quick check to see current inventory state
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

use App\Models\Inventory;
use App\Models\Product;

// Get Tocino product
$tocino = Product::where('name', 'Tocino')->first();
if (!$tocino) {
    echo "Tocino not found\n";
    exit;
}

echo "=== Current Inventory for Tocino (ID: {$tocino->id}) ===\n";

$inventory = Inventory::where('product_id', $tocino->id)
    ->orderBy('location')
    ->get();

foreach ($inventory as $inv) {
    echo "Location: {$inv->location} | Quantity: {$inv->quantity} | Updated: {$inv->updated_at}\n";
}

echo "\nTotal records: " . count($inventory) . "\n";

// Also check the most recent transfers
echo "\n=== Recent Transfers for Tocino ===\n";
$transfers = \App\Models\Transfer::where('product_id', $tocino->id)
    ->orderBy('created_at', 'desc')
    ->limit(10)
    ->get();

foreach ($transfers as $t) {
    echo "{$t->created_at}: {$t->from} -> {$t->to} ({$t->quantity} {$tocino->unit}) Status: {$t->status}\n";
}
