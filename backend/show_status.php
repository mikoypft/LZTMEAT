<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Transfer;
use App\Models\Inventory;

echo "=== CURRENT TRANSFERS ===" . PHP_EOL;
$transfers = Transfer::with('product')->orderBy('id', 'desc')->limit(5)->get();
foreach ($transfers as $t) {
    echo "ID: {$t->id}, {$t->product->name}, {$t->from} → {$t->to}, Status: {$t->status}, Qty: {$t->quantity}" . PHP_EOL;
}

echo "\n=== CURRENT INVENTORY FOR LONGGANISA ===" . PHP_EOL;
$inv = Inventory::where('product_id', 4)->get();
foreach ($inv as $i) {
    echo "Location: {$i->location}, Qty: {$i->quantity}" . PHP_EOL;
}
