<?php
$servername = "127.0.0.1";
$username = "root";
$password = "millefiore";
$dbname = "lzt_meat";

try {
    $pdo = new PDO("mysql:host=$servername;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Add phone column if it doesn't exist
    $pdo->exec("ALTER TABLE users ADD COLUMN phone VARCHAR(20) NULL AFTER full_name");
    echo "Added phone column\n";
} catch (PDOException $e) {
    if (strpos($e->getMessage(), 'Duplicate column') === false) {
        echo "Phone column: " . $e->getMessage() . "\n";
    }
}

try {
    $pdo = new PDO("mysql:host=$servername;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Add address column if it doesn't exist
    $pdo->exec("ALTER TABLE users ADD COLUMN address TEXT NULL AFTER phone");
    echo "Added address column\n";
} catch (PDOException $e) {
    if (strpos($e->getMessage(), 'Duplicate column') === false) {
        echo "Address column: " . $e->getMessage() . "\n";
    }
}

echo "Columns added successfully\n";
?>
