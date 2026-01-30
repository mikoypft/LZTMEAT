<?php
$pdo = new PDO('mysql:host=127.0.0.1;dbname=lzt_meat', 'root', 'millefiore');
$stmt = $pdo->query('SHOW TABLES');
$tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
foreach ($tables as $table) {
    $count = $pdo->query("SELECT COUNT(*) FROM $table")->fetch(PDO::FETCH_COLUMN);
    echo "$table: $count records\n";
}

// Check ingredients table specifically
echo "\n--- Ingredients Table ---\n";
$stmt = $pdo->query('DESC ingredients');
$columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
foreach ($columns as $col) {
    echo $col['Field'] . " (" . $col['Type'] . ")\n";
}
