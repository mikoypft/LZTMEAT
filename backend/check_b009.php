<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\ProductionRecord;

// Get B009 directly
$b009 = ProductionRecord::where('batch_number', 'B009')->first();

if ($b009) {
    echo "B009 in database:\n";
    echo "  ID: {$b009->id}\n";
    echo "  Batch: {$b009->batch_number}\n";
    echo "  Status field value: ";
    var_dump($b009->status);
    echo "  Status === 'in-progress': " . ($b009->status === 'in-progress' ? 'TRUE' : 'FALSE') . "\n";
    echo "  Status === 'completed': " . ($b009->status === 'completed' ? 'TRUE' : 'FALSE') . "\n";
} else {
    echo "B009 not found\n";
}
