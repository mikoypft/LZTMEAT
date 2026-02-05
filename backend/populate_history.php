<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\SystemHistory;
use App\Models\Sale;
use App\Models\Transfer;
use App\Models\Production;
use Carbon\Carbon;

echo "=== Populating SystemHistory ===" . PHP_EOL;

// Clear existing history (optional)
// SystemHistory::truncate();

// Log existing sales
$sales = Sale::with('user')->latest()->get();
echo "Found {$sales->count()} sales" . PHP_EOL;

foreach ($sales as $sale) {
    $exists = SystemHistory::where('entity', 'Sale')
        ->where('entity_id', $sale->id)
        ->exists();
    
    if (!$exists) {
        SystemHistory::create([
            'user_id' => $sale->user_id,
            'action' => 'Sale Created',
            'entity' => 'Sale',
            'entity_id' => $sale->id,
            'description' => "Sale transaction #{$sale->transaction_id} - Total: {$sale->total}",
            'details' => json_encode([
                'transaction_id' => $sale->transaction_id,
                'total' => $sale->total,
                'store' => $sale->store?->name,
                'items_count' => is_array($sale->items) ? count($sale->items) : 0,
            ]),
            'created_at' => $sale->created_at,
            'updated_at' => $sale->created_at,
        ]);
        echo "  ✓ Logged sale {$sale->id}" . PHP_EOL;
    }
}

// Log existing transfers
$transfers = Transfer::with('product', 'requestedByUser')->latest()->get();
echo "Found {$transfers->count()} transfers" . PHP_EOL;

foreach ($transfers as $transfer) {
    $exists = SystemHistory::where('entity', 'Transfer')
        ->where('entity_id', $transfer->id)
        ->exists();
    
    if (!$exists) {
        SystemHistory::create([
            'user_id' => null,
            'action' => 'Transfer ' . $transfer->status,
            'entity' => 'Transfer',
            'entity_id' => $transfer->id,
            'description' => "Transfer of {$transfer->product->name} from {$transfer->from} to {$transfer->to}",
            'details' => json_encode([
                'product' => $transfer->product->name,
                'quantity' => $transfer->quantity,
                'from' => $transfer->from,
                'to' => $transfer->to,
                'status' => $transfer->status,
                'requested_by' => $transfer->requested_by,
            ]),
            'created_at' => $transfer->created_at,
            'updated_at' => $transfer->created_at,
        ]);
        echo "  ✓ Logged transfer {$transfer->id}" . PHP_EOL;
    }
}

// Log existing production
$production = Production::with('product', 'user')->latest()->get();
echo "Found {$production->count()} production records" . PHP_EOL;

foreach ($production as $prod) {
    $exists = SystemHistory::where('entity', 'Production')
        ->where('entity_id', $prod->id)
        ->exists();
    
    if (!$exists) {
        SystemHistory::create([
            'user_id' => $prod->user_id,
            'action' => 'Production ' . $prod->status,
            'entity' => 'Production',
            'entity_id' => $prod->id,
            'description' => "Production of {$prod->product->name} - Batch: {$prod->batch_number}",
            'details' => json_encode([
                'product' => $prod->product->name,
                'quantity' => $prod->quantity,
                'batch_number' => $prod->batch_number,
                'status' => $prod->status,
                'operator' => $prod->user?->full_name,
            ]),
            'created_at' => $prod->created_at,
            'updated_at' => $prod->created_at,
        ]);
        echo "  ✓ Logged production {$prod->id}" . PHP_EOL;
    }
}

echo "\n=== SystemHistory Population Complete ===" . PHP_EOL;
echo "Total history records now: " . SystemHistory::count() . PHP_EOL;
