<?php
require __DIR__ . '/bootstrap/app.php';

$columns = \Illuminate\Support\Facades\Schema::getColumnListing('users');
echo "=== USERS TABLE COLUMNS ===\n";
foreach ($columns as $col) {
    echo "- $col\n";
}
