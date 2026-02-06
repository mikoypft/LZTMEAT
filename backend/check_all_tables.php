<?php
$pdo = new PDO('mysql:host=127.0.0.1;dbname=lzt_meat', 'root', 'millefiore');

$tables = ['sales', 'production_records', 'transfers', 'suppliers', 'ingredients'];

foreach ($tables as $table) {
    echo "\n=== $table ===\n";
    $stmt = $pdo->query("DESCRIBE $table");
    while($row = $stmt->fetch(PDO::FETCH_ASSOC)) { 
        echo $row['Field'] . ' - ' . $row['Type'] . PHP_EOL; 
    }
}
