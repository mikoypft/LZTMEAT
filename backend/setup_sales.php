<?php

/**
 * Setup script for Sales tables
 */

// Load environment variables
$envFile = __DIR__ . '/.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos($line, '=') !== false && strpos($line, '#') !== 0) {
            list($key, $value) = explode('=', $line, 2);
            $_ENV[trim($key)] = trim($value);
        }
    }
}

// Database configuration
$dbHost = $_ENV['DB_HOST'] ?? '127.0.0.1';
$dbPort = $_ENV['DB_PORT'] ?? '3306';
$dbName = $_ENV['DB_DATABASE'] ?? 'lzt_meat';
$dbUser = $_ENV['DB_USERNAME'] ?? 'root';
$dbPass = $_ENV['DB_PASSWORD'] ?? '';

// Create database connection
try {
    $pdo = new PDO(
        "mysql:host=$dbHost;port=$dbPort;dbname=$dbName;charset=utf8mb4",
        $dbUser,
        $dbPass,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]
    );
    
    echo "✓ Connected to database\n";
    
    // Check if sales table exists
    $stmt = $pdo->query("SHOW TABLES LIKE 'sales'");
    if ($stmt->rowCount() > 0) {
        echo "✓ Sales table exists\n";
    } else {
        echo "✗ Sales table missing, creating...\n";
        $pdo->exec("
            CREATE TABLE sales (
                id INT PRIMARY KEY AUTO_INCREMENT,
                transaction_id VARCHAR(255) UNIQUE NOT NULL,
                user_id INT,
                store_id INT,
                location VARCHAR(255),
                customer_name VARCHAR(255),
                customer_phone VARCHAR(20),
                customer_email VARCHAR(255),
                subtotal DECIMAL(12, 2) DEFAULT 0,
                global_discount DECIMAL(12, 2) DEFAULT 0,
                tax DECIMAL(12, 2) DEFAULT 0,
                total DECIMAL(12, 2) NOT NULL,
                payment_method VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_store_id (store_id),
                INDEX idx_user_id (user_id),
                INDEX idx_created_at (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        ");
        echo "✓ Sales table created\n";
    }
    
    // Check if sale_items table exists
    $stmt = $pdo->query("SHOW TABLES LIKE 'sale_items'");
    if ($stmt->rowCount() > 0) {
        echo "✓ Sale items table exists\n";
    } else {
        echo "✗ Sale items table missing, creating...\n";
        $pdo->exec("
            CREATE TABLE sale_items (
                id INT PRIMARY KEY AUTO_INCREMENT,
                sale_id INT NOT NULL,
                product_id VARCHAR(255) NOT NULL,
                quantity DECIMAL(10, 2) NOT NULL,
                unit_price DECIMAL(12, 2) NOT NULL,
                discount DECIMAL(5, 2) DEFAULT 0,
                total DECIMAL(12, 2) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_sale_id (sale_id),
                INDEX idx_product_id (product_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        ");
        echo "✓ Sale items table created\n";
    }
    
    // Check if sales table has location column
    $stmt = $pdo->prepare("SHOW COLUMNS FROM sales LIKE 'location'");
    $stmt->execute();
    if ($stmt->rowCount() === 0) {
        echo "Adding 'location' column to sales table...\n";
        $pdo->exec("ALTER TABLE sales ADD COLUMN location VARCHAR(255) AFTER store_id");
        echo "✓ Location column added\n";
    }
    
    // Check if sales table has customer info columns
    $stmt = $pdo->prepare("SHOW COLUMNS FROM sales LIKE 'customer_name'");
    $stmt->execute();
    if ($stmt->rowCount() === 0) {
        echo "Adding customer columns to sales table...\n";
        $pdo->exec("ALTER TABLE sales ADD COLUMN customer_name VARCHAR(255) AFTER location");
        $pdo->exec("ALTER TABLE sales ADD COLUMN customer_phone VARCHAR(20) AFTER customer_name");
        $pdo->exec("ALTER TABLE sales ADD COLUMN customer_email VARCHAR(255) AFTER customer_phone");
        echo "✓ Customer columns added\n";
    }
    
    // Check if sales table has financial detail columns
    $stmt = $pdo->prepare("SHOW COLUMNS FROM sales LIKE 'subtotal'");
    $stmt->execute();
    if ($stmt->rowCount() === 0) {
        echo "Adding financial columns to sales table...\n";
        $pdo->exec("ALTER TABLE sales ADD COLUMN subtotal DECIMAL(12, 2) DEFAULT 0 AFTER customer_email");
        $pdo->exec("ALTER TABLE sales ADD COLUMN global_discount DECIMAL(12, 2) DEFAULT 0 AFTER subtotal");
        $pdo->exec("ALTER TABLE sales ADD COLUMN tax DECIMAL(12, 2) DEFAULT 0 AFTER global_discount");
        echo "✓ Financial columns added\n";
    }
    
    echo "\n✓ All tables are properly configured!\n";
    
} catch (PDOException $e) {
    echo "✗ Database error: " . $e->getMessage() . "\n";
    exit(1);
}
?>
