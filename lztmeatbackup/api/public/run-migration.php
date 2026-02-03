<?php
// Run migrations via browser
// Access this at: https://lztmeat.com/api/run-migration.php

// Set up error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Set up the Laravel application
require __DIR__ . '/../bootstrap/app.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';

try {
    // Get the Laravel kernel
    $kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);

    // Run migrations
    echo "<h2>Running Migrations...</h2>";
    echo "<pre>";
    
    // Disable the time limit
    set_time_limit(0);
    
    // Run the migrate command
    $exitCode = $kernel->call('migrate', [
        '--force' => true,
        '--path' => 'database/migrations'
    ]);
    
    echo "</pre>";
    
    if ($exitCode === 0) {
        echo "<h3 style='color: green;'>✓ Migrations completed successfully!</h3>";
    } else {
        echo "<h3 style='color: red;'>✗ Migration failed with exit code: $exitCode</h3>";
    }
} catch (Exception $e) {
    echo "<h3 style='color: red;'>Error:</h3>";
    echo "<pre>" . $e->getMessage() . "\n" . $e->getTraceAsString() . "</pre>";
}
?>
