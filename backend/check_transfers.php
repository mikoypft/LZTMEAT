<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Transfer;

echo "=== ALL TRANSFERS ===" . PHP_EOL;
$transfers = Transfer::with('product')->get();
foreach ($transfers as $t) {
    echo "ID: {$t->id}, Product: {$t->product->name}, From: {$t->from}, To: {$t->to}, Status: {$t->status}, Qty: {$t->quantity}" . PHP_EOL;
}
