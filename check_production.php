<?php
$servername = "127.0.0.1";
$username = "root";
$password = "millefiore";
$dbname = "lzt_meat";

try {
    $pdo = new PDO("mysql:host=$servername;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Check if production_records table exists
    $stmt = $pdo->query("SHOW TABLES LIKE 'production_records'");
    $tableExists = $stmt->fetch();
    
    if ($tableExists) {
        echo "production_records table EXISTS\n\n";
        
        // Show table structure
        $stmt = $pdo->query("DESCRIBE production_records");
        $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo "Columns:\n";
        foreach ($columns as $col) {
            echo "  - {$col['Field']} ({$col['Type']})\n";
        }
        
        // Count records
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM production_records");
        $count = $stmt->fetch(PDO::FETCH_ASSOC);
        echo "\nTotal records: {$count['count']}\n";
    } else {
        echo "production_records table DOES NOT EXIST\n";
        echo "Creating table...\n";
        
        $pdo->exec("
            CREATE TABLE production_records (
                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                product_id BIGINT UNSIGNED,
                quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
                batch_number VARCHAR(50),
                operator VARCHAR(255),
                status ENUM('in-progress', 'completed', 'quality-check') DEFAULT 'in-progress',
                ingredients_used JSON,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
            )
        ");
        
        echo "Table created successfully!\n";
    }
    
    // Check if products table exists and has data
    echo "\n--- Products Table Check ---\n";
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM products");
    $count = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "Total products: {$count['count']}\n";
    
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
