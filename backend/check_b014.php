<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\ProductionRecord;

$prod = ProductionRecord::where('batch_number', 'B014')->first();
if ($prod) {
    echo "B014 Status: '{$prod->status}'\n";
    
    // Reset it to test
    $prod->update(['status' => 'in-progress']);
    echo "Reset to 'in-progress'\n";
} else {
    echo "B014 not found\n";
}
