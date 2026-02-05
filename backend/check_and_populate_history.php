<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\SystemHistory;
use App\Models\Sale;
use App\Models\Transfer;

echo "=== Database State ===" . PHP_EOL;
echo "Sales count: " . Sale::count() . PHP_EOL;
echo "Transfers count: " . Transfer::count() . PHP_EOL;
echo "SystemHistory count: " . SystemHistory::count() . PHP_EOL . PHP_EOL;

// Create history records for existing sales
$sales = Sale::latest()->limit(5)->get();
echo "Creating history for " . $sales->count() . " recent sales..." . PHP_EOL;

foreach ($sales as $sale) {
    SystemHistory::firstOrCreate(
        ['entity' => 'Sale', 'entity_id' => $sale->id],
        [
            'user_id' => $sale->user_id,
            'action' => 'Sale',
            'description' => "Sale #{$sale->transaction_id}",
            'details' => json_encode(['total' => $sale->total]),
            'created_at' => $sale->created_at,
        ]
    );
}

// Create history records for existing transfers
$transfers = Transfer::latest()->limit(5)->get();
echo "Creating history for " . $transfers->count() . " recent transfers..." . PHP_EOL;

foreach ($transfers as $transfer) {
    SystemHistory::firstOrCreate(
        ['entity' => 'Transfer', 'entity_id' => $transfer->id],
        [
            'action' => 'Transfer',
            'description' => "Transfer: {$transfer->from} → {$transfer->to}",
            'details' => json_encode(['quantity' => $transfer->quantity]),
            'created_at' => $transfer->created_at,
        ]
    );
}

// Create history records for existing production
$production = [];
echo "Creating history for " . count($production) . " recent production records..." . PHP_EOL;

foreach ($production as $prod) {
    SystemHistory::firstOrCreate(
        ['entity' => 'Production', 'entity_id' => $prod->id],
        [
            'user_id' => $prod->user_id,
            'action' => 'Production',
            'description' => "Production: {$prod->product->name}",
            'details' => json_encode(['quantity' => $prod->quantity]),
            'created_at' => $prod->created_at,
        ]
    );
}

echo "\n=== Result ===" . PHP_EOL;
echo "SystemHistory count: " . SystemHistory::count() . PHP_EOL;

$recent = SystemHistory::latest()->limit(5)->get();
echo "Recent history records:" . PHP_EOL;
foreach ($recent as $h) {
    echo "  - {$h->action} ({$h->entity}): {$h->description}" . PHP_EOL;
}
