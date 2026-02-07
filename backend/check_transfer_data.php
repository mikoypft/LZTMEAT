<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== TRANSFER DATA AUDIT ===" . PHP_EOL . PHP_EOL;

// Check all transfers and their data completeness
$transfers = DB::table('transfers')
    ->join('products', 'transfers.product_id', '=', 'products.id')
    ->select(
        'transfers.id',
        'products.name',
        'transfers.quantity',
        'transfers.quantity_received',
        'transfers.from',
        'transfers.to',
        'transfers.status',
        'transfers.requested_by',
        'transfers.received_by',
        'transfers.received_at',
        'transfers.discrepancy_reason',
        'transfers.created_at'
    )
    ->orderBy('transfers.created_at', 'desc')
    ->get();

echo "Total Transfers: " . count($transfers) . PHP_EOL . PHP_EOL;

$missingData = [];

foreach ($transfers as $transfer) {
    $missing = [];
    
    if (is_null($transfer->quantity_received)) {
        $missing[] = 'quantity_received';
    }
    if (is_null($transfer->received_by) && $transfer->status === 'Completed') {
        $missing[] = 'received_by';
    }
    if (is_null($transfer->received_at) && $transfer->status === 'Completed') {
        $missing[] = 'received_at';
    }
    
    if (!empty($missing)) {
        $missingData[] = [
            'id' => $transfer->id,
            'product' => $transfer->name,
            'status' => $transfer->status,
            'quantity' => $transfer->quantity,
            'qty_received' => $transfer->quantity_received,
            'from' => $transfer->from,
            'to' => $transfer->to,
            'received_by' => $transfer->received_by,
            'received_at' => $transfer->received_at,
            'missing_fields' => implode(', ', $missing)
        ];
    }
}

echo "Transfers with Missing Data: " . count($missingData) . PHP_EOL . PHP_EOL;

foreach ($missingData as $item) {
    echo "ID: {$item['id']} | Product: {$item['product']} | Status: {$item['status']} | Qty: {$item['quantity']}" . PHP_EOL;
    echo "  From: {$item['from']} | To: {$item['to']}" . PHP_EOL;
    echo "  Missing Fields: {$item['missing_fields']}" . PHP_EOL;
    echo "  ---" . PHP_EOL;
}

echo PHP_EOL . "=== SUMMARY ===" . PHP_EOL;
echo "Total transfers: " . count($transfers) . PHP_EOL;
echo "Transfers with missing data: " . count($missingData) . PHP_EOL;
