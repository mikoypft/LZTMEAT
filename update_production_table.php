<?php
$servername = "127.0.0.1";
$username = "root";
$password = "millefiore";
$dbname = "lzt_meat";

try {
    $pdo = new PDO("mysql:host=$servername;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Add missing columns to production_records table
    echo "Adding status column...\n";
    try {
        $pdo->exec("ALTER TABLE production_records ADD COLUMN status ENUM('in-progress', 'completed', 'quality-check') DEFAULT 'in-progress' AFTER operator");
        echo "  Added status column\n";
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'Duplicate column') !== false) {
            echo "  status column already exists\n";
        } else {
            throw $e;
        }
    }
    
    echo "Adding ingredients_used column...\n";
    try {
        $pdo->exec("ALTER TABLE production_records ADD COLUMN ingredients_used JSON AFTER status");
        echo "  Added ingredients_used column\n";
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'Duplicate column') !== false) {
            echo "  ingredients_used column already exists\n";
        } else {
            throw $e;
        }
    }
    
    echo "Adding notes column...\n";
    try {
        $pdo->exec("ALTER TABLE production_records ADD COLUMN notes TEXT AFTER ingredients_used");
        echo "  Added notes column\n";
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'Duplicate column') !== false) {
            echo "  notes column already exists\n";
        } else {
            throw $e;
        }
    }
    
    // Change quantity to DECIMAL for precision
    echo "Changing quantity to DECIMAL(10,2)...\n";
    $pdo->exec("ALTER TABLE production_records MODIFY COLUMN quantity DECIMAL(10,2) NOT NULL DEFAULT 0");
    echo "  Done\n";
    
    echo "\nFinal production_records structure:\n";
    $stmt = $pdo->query("DESCRIBE production_records");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($columns as $col) {
        echo "  - {$col['Field']} ({$col['Type']})\n";
    }
    
    echo "\nAll changes applied successfully!\n";
    
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
