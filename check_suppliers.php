<?php
$pdo = new PDO('mysql:host=127.0.0.1;dbname=lzt_meat', 'root', 'millefiore');
$stmt = $pdo->query('DESC suppliers');
$columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
foreach ($columns as $col) {
    $required = $col['Null'] === 'NO' ? ' - REQUIRED' : '';
    echo $col['Field'] . " (" . $col['Type'] . ")" . $required . "\n";
}
