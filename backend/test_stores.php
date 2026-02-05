<?php
require __DIR__ . '/bootstrap/app.php';
$app = app();

$stores = \App\Models\Store::all(['id', 'name']);
echo "=== STORES IN DATABASE ===\n";
foreach ($stores as $store) {
    echo "ID: " . $store->id . ", Name: " . $store->name . "\n";
}
echo "\nTotal stores: " . count($stores) . "\n";
