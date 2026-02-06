<?php
require 'vendor/autoload.php';
require 'bootstrap/app.php';

$app = resolve(\Illuminate\Foundation\Application::class);
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

$result = DB::table('ingredients')->where('id', 1)->update(['stock' => 200.00]);
echo "Updated " . $result . " rows to stock = 200.00\n";

$stock = DB::table('ingredients')->where('id', 1)->first()->stock;
echo "Current stock in DB: " . $stock . "\n";
?>
