<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\ProductionRecord;

echo "All Productions:\n";
echo str_pad("ID", 5) . str_pad("Batch", 10) . str_pad("Status", 20) . str_pad("Qty", 10) . str_pad("Created", 20) . "\n";
echo str_repeat("-", 70) . "\n";

$productions = ProductionRecord::orderBy('id', 'desc')->get();
foreach ($productions as $p) {
    echo str_pad($p->id, 5)
        . str_pad($p->batch_number, 10)
        . str_pad($p->status, 20)
        . str_pad($p->quantity, 10)
        . str_pad($p->created_at->format('Y-m-d H:i:s'), 20) . "\n";
}
