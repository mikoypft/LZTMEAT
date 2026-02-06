<?php
/**
 * Database Setup Script
 * Creates all necessary tables and initializes schema
 * Run this on deployment or when setting up a new environment
 */

ini_set('display_errors', 1);
error_reporting(E_ALL);

// Load environment
$envFile = __DIR__ . '/.env.production';
if (!file_exists($envFile)) {
    $envFile = __DIR__ . '/.env';
}

if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos($line, '=') !== false && strpos($line, '#') !== 0) {
            list($key, $value) = explode('=', $line, 2);
            $_ENV[trim($key)] = trim($value, '\'"');
        }
    }
}

$dbHost = $_ENV['DB_HOST'] ?? 'localhost';
$dbPort = $_ENV['DB_PORT'] ?? '3306';
$dbName = $_ENV['DB_DATABASE'] ?? 'lztmeat_admin';
$dbUser = $_ENV['DB_USERNAME'] ?? 'lztmeat';
$dbPass = $_ENV['DB_PASSWORD'] ?? 'Lztmeat@2026';

echo "=== Database Setup ===\n";
echo "Host: $dbHost\n";
echo "Database: $dbName\n";
echo "User: $dbUser\n\n";

try {
    $pdo = new PDO(
        "mysql:host=$dbHost;port=$dbPort",
        $dbUser,
        $dbPass
    );
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (Exception $e) {
    echo "Error: Cannot connect to database: " . $e->getMessage() . "\n";
    exit(1);
}

// Use database
try {
    $pdo->exec("CREATE DATABASE IF NOT EXISTS $dbName");
    $pdo->exec("USE $dbName");
    echo "✓ Database ready\n";
} catch (Exception $e) {
    echo "Error creating database: " . $e->getMessage() . "\n";
    exit(1);
}

// Create all required tables
$tables = [
    'users' => "
        CREATE TABLE IF NOT EXISTS users (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(255) UNIQUE NOT NULL,
            email VARCHAR(255) UNIQUE,
            full_name VARCHAR(255) NOT NULL,
            role ENUM('ADMIN', 'STORE', 'PRODUCTION', 'POS', 'EMPLOYEE') DEFAULT 'EMPLOYEE',
            employee_role ENUM('Store', 'Production', 'Employee', 'POS'),
            store_id BIGINT,
            permissions JSON,
            can_login BOOLEAN DEFAULT TRUE,
            password VARCHAR(255) NOT NULL,
            remember_token VARCHAR(100),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            mobile_address VARCHAR(255),
            INDEX(username),
            INDEX(email)
        )
    ",
    
    'stores' => "
        CREATE TABLE IF NOT EXISTS stores (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) UNIQUE NOT NULL,
            address VARCHAR(255),
            phone VARCHAR(20),
            email VARCHAR(255),
            manager_id BIGINT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX(name)
        )
    ",
    
    'categories' => "
        CREATE TABLE IF NOT EXISTS categories (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) UNIQUE NOT NULL,
            description TEXT,
            type VARCHAR(50),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX(name)
        )
    ",
    
    'products' => "
        CREATE TABLE IF NOT EXISTS products (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            category_id BIGINT NOT NULL,
            price DECIMAL(12, 2) NOT NULL,
            sku VARCHAR(100),
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX(name),
            INDEX(category_id),
            INDEX(sku)
        )
    ",
    
    'sales' => "
        CREATE TABLE IF NOT EXISTS sales (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            store_id BIGINT NOT NULL,
            user_id BIGINT,
            subtotal DECIMAL(12, 2),
            tax DECIMAL(12, 2) DEFAULT 0,
            global_discount DECIMAL(12, 2) DEFAULT 0,
            total DECIMAL(12, 2),
            sales_type VARCHAR(50),
            status VARCHAR(50) DEFAULT 'completed',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX(store_id),
            INDEX(user_id),
            INDEX(created_at)
        )
    ",
    
    'sales_items' => "
        CREATE TABLE IF NOT EXISTS sales_items (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            sale_id BIGINT NOT NULL,
            product_id BIGINT,
            quantity INT NOT NULL,
            price DECIMAL(12, 2),
            discount DECIMAL(5, 2) DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX(sale_id),
            INDEX(product_id)
        )
    ",
    
    'ingredients' => "
        CREATE TABLE IF NOT EXISTS ingredients (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) UNIQUE NOT NULL,
            category_id BIGINT,
            unit VARCHAR(50),
            price_per_unit DECIMAL(12, 2),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX(name),
            INDEX(category_id)
        )
    ",
    
    'inventory' => "
        CREATE TABLE IF NOT EXISTS inventory (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            product_id BIGINT,
            ingredient_id BIGINT,
            location_id BIGINT,
            quantity DECIMAL(15, 3),
            min_quantity DECIMAL(15, 3),
            max_quantity DECIMAL(15, 3),
            last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX(product_id),
            INDEX(ingredient_id),
            INDEX(location_id)
        )
    ",
    
    'production' => "
        CREATE TABLE IF NOT EXISTS production (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            product_id BIGINT,
            quantity DECIMAL(15, 3),
            user_id BIGINT,
            status VARCHAR(50) DEFAULT 'pending',
            type VARCHAR(100),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX(product_id),
            INDEX(status),
            INDEX(created_at)
        )
    ",
    
    'transfers' => "
        CREATE TABLE IF NOT EXISTS transfers (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            from_store_id BIGINT,
            to_store_id BIGINT,
            product_id BIGINT,
            ingredient_id BIGINT,
            quantity DECIMAL(15, 3),
            status VARCHAR(50) DEFAULT 'pending',
            user_id BIGINT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            transfer_receipt_id VARCHAR(255),
            transfer_receipt_date TIMESTAMP,
            INDEX(from_store_id),
            INDEX(to_store_id),
            INDEX(status)
        )
    ",
    
    'suppliers' => "
        CREATE TABLE IF NOT EXISTS suppliers (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            address VARCHAR(255),
            phone VARCHAR(20),
            email VARCHAR(255),
            contact_person VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX(name)
        )
    ",
    
    'system_history' => "
        CREATE TABLE IF NOT EXISTS system_history (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            action VARCHAR(255) NOT NULL,
            entity VARCHAR(255),
            entity_id VARCHAR(255),
            details JSON,
            user_id BIGINT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX(created_at),
            INDEX(entity)
        )
    ",
    
    'discount_settings' => "
        CREATE TABLE IF NOT EXISTS discount_settings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            wholesale_min_units INT NOT NULL DEFAULT 10,
            discount_type VARCHAR(50) NOT NULL DEFAULT 'percentage',
            wholesale_discount_percent DECIMAL(5, 2) DEFAULT 0,
            wholesale_discount_amount DECIMAL(12, 2),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    ",
    
    'stock_adjustments' => "
        CREATE TABLE IF NOT EXISTS stock_adjustments (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            inventory_id BIGINT,
            adjustment_type VARCHAR(50),
            quantity_change DECIMAL(15, 3),
            reason TEXT,
            user_id BIGINT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX(inventory_id),
            INDEX(created_at)
        )
    ",
];

foreach ($tables as $tableName => $sql) {
    try {
        $pdo->exec($sql);
        echo "✓ $tableName\n";
    } catch (Exception $e) {
        echo "✗ $tableName: " . $e->getMessage() . "\n";
    }
}

// Initialize discount_settings with default values if empty
try {
    $stmt = $pdo->query("SELECT COUNT(*) FROM discount_settings");
    if ($stmt->fetchColumn() == 0) {
        $pdo->exec("INSERT INTO discount_settings (wholesale_min_units, discount_type, wholesale_discount_percent) VALUES (10, 'percentage', 0)");
        echo "✓ Default discount settings initialized\n";
    }
} catch (Exception $e) {
    echo "Info: Could not initialize discount settings: " . $e->getMessage() . "\n";
}

echo "\n✓ Database setup complete!\n";
