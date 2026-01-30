<?php
$pdo = new PDO('mysql:host=127.0.0.1;port=3306;dbname=lzt_meat;charset=utf8mb4', 'root', '');
$stmt = $pdo->query('DESCRIBE sales');
$columns = $stmt->fetchAll();
echo "Current sales table structure:\n";
foreach ($columns as $col) {
    echo $col['Field'] . ' : ' . $col['Type'] . "\n";
}
?>
