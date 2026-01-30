<?php
require 'bootstrap/app.php';

use Illuminate\Support\Facades\DB;

$columns = DB::select('DESCRIBE inventory');
echo "Inventory Table Schema:\n";
foreach($columns as $col) {
    echo $col->Field . ' - ' . $col->Type . ' (NULL: ' . $col->Null . ')\n';
}

// Check current inventory
echo "\n\nCurrent Inventory (first 5):\n";
$inventory = DB::table('inventory')->limit(5)->get();
foreach($inventory as $inv) {
    echo "Product ID: {$inv->product_id}, Store ID: {$inv->store_id}, Quantity: {$inv->quantity}\n";
}

echo "\n\nChecking sales table:\n";
$sales = DB::table('sales')->orderBy('id', 'desc')->limit(3)->get();
foreach($sales as $sale) {
    echo "Sale ID: {$sale->id}, Transaction: {$sale->transaction_id}, Items: {$sale->items}\n";
}
