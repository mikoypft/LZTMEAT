<?php
$pdo = new PDO('mysql:host=127.0.0.1;dbname=lzt_meat', 'root', 'millefiore');
$stmt = $pdo->query('SELECT id, username, full_name, role FROM users LIMIT 5');
$users = $stmt->fetchAll(PDO::FETCH_ASSOC);
foreach ($users as $user) {
    echo 'User: ' . $user['username'] . ' (' . $user['full_name'] . ') - Role: ' . $user['role'] . "\n";
}
