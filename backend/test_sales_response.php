<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Sale;

echo "=== API Response Simulation ===" . PHP_EOL;
$sales = Sale::with(['user', 'store'])->limit(3)->get();

echo "Raw sales count: " . $sales->count() . PHP_EOL . PHP_EOL;

foreach ($sales as $s) {
    $response = [
        'id' => $s->id,
        'transactionId' => $s->transaction_id,
        'date' => $s->created_at?->toDateString() ?? date('Y-m-d'),
        'location' => $s->store?->name,
        'storeId' => $s->store_id,
        'cashier' => $s->user?->full_name,
        'userId' => $s->user_id,
        'username' => $s->user?->username,
        'customer' => $s->customer,
        'items' => is_string($s->items) ? json_decode($s->items, true) : $s->items,
        'subtotal' => $s->subtotal,
        'globalDiscount' => $s->global_discount,
        'tax' => $s->tax,
        'total' => $s->total,
        'paymentMethod' => $s->payment_method,
        'salesType' => $s->sales_type,
        'timestamp' => $s->created_at?->toIso8601String() ?? now()->toIso8601String(),
    ];
    
    echo "Sale ID: {$s->id}" . PHP_EOL;
    echo "  transactionId: {$response['transactionId']}" . PHP_EOL;
    echo "  location: {$response['location']}" . PHP_EOL;
    echo "  total: {$response['total']}" . PHP_EOL;
    echo "  items type: " . gettype($response['items']) . PHP_EOL;
    echo "  items: " . json_encode($response['items']) . PHP_EOL;
    echo PHP_EOL;
}
