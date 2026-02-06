<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Sale;
use Carbon\Carbon;

echo "=== Sales from past 7 days ===" . PHP_EOL;
$startDate = Carbon::parse('2026-02-05')->startOfDay()->subDays(7);
$endDate = Carbon::parse('2026-02-05')->endOfDay();

$sales = Sale::with(['store', 'user'])
    ->whereBetween('created_at', [$startDate, $endDate])
    ->get();

echo "Count: " . $sales->count() . PHP_EOL . PHP_EOL;

foreach ($sales as $sale) {
    echo "Sale ID: {$sale->id}" . PHP_EOL;
    echo "  Date: {$sale->created_at}" . PHP_EOL;
    echo "  Items: " . json_encode($sale->items) . PHP_EOL;
    echo "  Items type: " . gettype($sale->items) . PHP_EOL;
    echo PHP_EOL;
}
