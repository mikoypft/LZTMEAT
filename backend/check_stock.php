<?php
require 'vendor/autoload.php';
require 'bootstrap/app.php';

$app = resolve(\Illuminate\Foundation\Application::class);
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

$stock = DB::table('ingredients')->where('id', 1)->first();
echo "Pork Belly stock in DB: " . $stock->stock . "\n";
echo "Type: " . gettype($stock->stock) . "\n";

echo "\nUpdating to 300...\n";
$result = DB::table('ingredients')->where('id', 1)->update(['stock' => 300.00]);
echo "Updated " . $result . " rows\n";

$stock = DB::table('ingredients')->where('id', 1)->first();
echo "Stock after update: " . $stock->stock . "\n";
?>
