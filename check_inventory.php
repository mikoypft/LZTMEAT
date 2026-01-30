<?php
$servername = "127.0.0.1";
$username = "root";
$password = "millefiore";
$dbname = "lzt_meat";

try {
    $pdo = new PDO("mysql:host=$servername;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Check inventory table
    echo "=== Inventory Table ===\n";
    $stmt = $pdo->query("SHOW TABLES LIKE 'inventory'");
    if ($stmt->fetch()) {
        echo "Table exists!\n";
        $stmt = $pdo->query("DESCRIBE inventory");
        $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($columns as $col) {
            echo "  - {$col['Field']} ({$col['Type']})\n";
        }
        
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM inventory");
        $count = $stmt->fetch(PDO::FETCH_ASSOC);
        echo "\nTotal inventory records: {$count['count']}\n";
        
        // Show inventory data
        echo "\n=== Inventory Data ===\n";
        $stmt = $pdo->query("SELECT i.*, p.name as product_name FROM inventory i LEFT JOIN products p ON i.product_id = p.id ORDER BY p.name LIMIT 20");
        $records = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($records as $r) {
            echo "  - Product: {$r['product_name']}, Location: {$r['location']}, Qty: {$r['quantity']}\n";
        }
    } else {
        echo "Table does NOT exist! Creating...\n";
        $pdo->exec("
            CREATE TABLE inventory (
                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                product_id BIGINT UNSIGNED,
                location VARCHAR(255) NOT NULL,
                quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
                UNIQUE KEY unique_product_location (product_id, location)
            )
        ");
        echo "Table created!\n";
    }
    
    // Check products
    echo "\n=== Products Check ===\n";
    $stmt = $pdo->query("SELECT * FROM products ORDER BY name");
    $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "Total products: " . count($products) . "\n";
    foreach ($products as $p) {
        echo "  - ID: {$p['id']}, Name: {$p['name']}\n";
    }
    
    // Check stores
    echo "\n=== Stores Check ===\n";
    $stmt = $pdo->query("SELECT * FROM stores ORDER BY name");
    $stores = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "Total stores: " . count($stores) . "\n";
    foreach ($stores as $s) {
        echo "  - ID: {$s['id']}, Name: {$s['name']}\n";
    }
    
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
