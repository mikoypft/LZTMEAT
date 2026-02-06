<?php
$pdo = new PDO('mysql:host=127.0.0.1;dbname=lzt_meat', 'root', 'millefiore');
$stmt = $pdo->query('SHOW TABLES');
while($row = $stmt->fetch(PDO::FETCH_NUM)) { 
    echo $row[0] . PHP_EOL; 
}
