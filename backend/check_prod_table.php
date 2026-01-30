<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

// Get the table structure
$columns = DB::select("DESCRIBE production_records");

echo "Production Records Table Structure:\n";
echo str_pad("Field", 20) . str_pad("Type", 20) . str_pad("Null", 10) . str_pad("Key", 10) . str_pad("Default", 15) . "Extra\n";
echo str_repeat("-", 80) . "\n";

foreach ($columns as $col) {
    echo str_pad($col->Field, 20) 
        . str_pad($col->Type, 20) 
        . str_pad($col->Null, 10) 
        . str_pad($col->Key, 10) 
        . str_pad($col->Default ?? 'NULL', 15) 
        . ($col->Extra ?? '') . "\n";
}
