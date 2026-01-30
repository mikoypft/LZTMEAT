<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

// Get the actual column definition
$result = DB::select("SHOW COLUMNS FROM production_records WHERE Field = 'status'");
print_r($result);
