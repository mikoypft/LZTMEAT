<?php
$pdo = new PDO('mysql:host=127.0.0.1;dbname=lzt_meat', 'root', '');
$stmt = $pdo->query('SELECT id, name, category_id FROM ingredients');
foreach ($stmt as $row) {
    echo $row['name'] . ': ' . ($row['category_id'] ?: 'NULL') . PHP_EOL;
}
?>
