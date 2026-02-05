<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Sale;

echo "=== SALES RECORDS ===" . PHP_EOL;
$sales = Sale::with('store', 'user')->limit(20)->get();

echo "Total sales count: " . Sale::count() . PHP_EOL . PHP_EOL;

if ($sales->isEmpty()) {
    echo "No sales records found in database." . PHP_EOL;
} else {
    foreach ($sales as $sale) {
        echo "ID: {$sale->id}, TransactionID: {$sale->transaction_id}" . PHP_EOL;
        echo "  Date: {$sale->created_at}" . PHP_EOL;
        echo "  Store: {$sale->store?->name}" . PHP_EOL;
        echo "  User: {$sale->user?->full_name}" . PHP_EOL;
        echo "  Total: {$sale->total}" . PHP_EOL;
        echo "  Items: " . (is_array($sale->items) ? count($sale->items) : 'N/A') . PHP_EOL;
        echo PHP_EOL;
    }
}

$pdo = new PDO('mysql:host=127.0.0.1;port=3306;dbname=lzt_meat;charset=utf8mb4', 'root', '');
$stmt = $pdo->query('DESCRIBE sales');
$columns = $stmt->fetchAll();
echo "Current sales table structure:\n";
foreach ($columns as $col) {
    echo $col['Field'] . ' : ' . $col['Type'] . "\n";
}
?>
