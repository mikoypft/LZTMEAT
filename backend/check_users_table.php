<?php
$pdo = new PDO('mysql:host=127.0.0.1;dbname=lzt_meat', 'root', 'millefiore');
$stmt = $pdo->query('DESCRIBE users');
while($row = $stmt->fetch(PDO::FETCH_ASSOC)) { 
    echo $row['Field'] . ' - ' . $row['Type'] . PHP_EOL; 
}
