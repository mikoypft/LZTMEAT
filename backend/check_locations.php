<?php
require 'vendor/autoload.php';
require 'bootstrap/app.php';

use Illuminate\Support\Facades\DB;

$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$locations = DB::table('inventory')
    ->select('location')
    ->distinct()
    ->pluck('location')
    ->toArray();

echo "Distinct locations in inventory:\n";
print_r($locations);

echo "\n\nInventory records:\n";
$inventory = DB::table('inventory')->get();
foreach ($inventory as $inv) {
    echo "Product: {$inv->product_id}, Location: {$inv->location}, Qty: {$inv->quantity}\n";
}
