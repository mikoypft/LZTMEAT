<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== FIXING TRANSFER DATA ===" . PHP_EOL . PHP_EOL;

// Get all transfers with missing data
$transfers = DB::table('transfers')
    ->whereNull('quantity_received')
    ->orWhereRaw("(status = 'Completed' AND received_by IS NULL)")
    ->orWhereRaw("(status = 'Completed' AND received_at IS NULL)")
    ->get();

echo "Transfers to fix: " . count($transfers) . PHP_EOL . PHP_EOL;

$fixed = 0;
$errors = 0;

foreach ($transfers as $transfer) {
    try {
        $updates = [];
        
        // Fix missing quantity_received - assume full receipt
        if (is_null($transfer->quantity_received)) {
            $updates['quantity_received'] = $transfer->quantity;
        }
        
        // Fix missing received_by for completed transfers
        if ($transfer->status === 'Completed' && is_null($transfer->received_by)) {
            // Use requested_by or default to 'admin'
            $updates['received_by'] = $transfer->requested_by ?? 'admin';
        }
        
        // Fix missing received_at for completed transfers
        if ($transfer->status === 'Completed' && is_null($transfer->received_at)) {
            // Use created_at timestamp
            $updates['received_at'] = $transfer->created_at;
        }
        
        if (!empty($updates)) {
            DB::table('transfers')
                ->where('id', $transfer->id)
                ->update($updates);
            
            $fixed++;
            echo "✓ Fixed Transfer ID: {$transfer->id}" . PHP_EOL;
            echo "  Updates: " . json_encode($updates) . PHP_EOL;
        }
    } catch (Exception $e) {
        $errors++;
        echo "✗ Error fixing Transfer ID: {$transfer->id}" . PHP_EOL;
        echo "  Error: " . $e->getMessage() . PHP_EOL;
    }
}

echo PHP_EOL . "=== SUMMARY ===" . PHP_EOL;
echo "Successfully fixed: $fixed transfers" . PHP_EOL;
echo "Errors encountered: $errors" . PHP_EOL . PHP_EOL;

// Show results
echo "=== VERIFICATION ===" . PHP_EOL;
$result = DB::table('transfers')
    ->join('products', 'transfers.product_id', '=', 'products.id')
    ->select(
        'transfers.id',
        'products.name',
        'transfers.quantity',
        'transfers.quantity_received',
        'transfers.status',
        'transfers.received_by',
        'transfers.received_at'
    )
    ->whereNull('quantity_received')
    ->orWhereRaw("(status = 'Completed' AND received_by IS NULL)")
    ->orWhereRaw("(status = 'Completed' AND received_at IS NULL)")
    ->get();

if (count($result) === 0) {
    echo "✓ All transfer data has been successfully populated!" . PHP_EOL;
} else {
    echo "⚠ Still " . count($result) . " transfers with missing data:" . PHP_EOL;
    foreach ($result as $r) {
        echo "  ID: {$r->id} | {$r->name} | Qty Received: {$r->quantity_received} | Received By: {$r->received_by}" . PHP_EOL;
    }
}
