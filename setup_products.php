<?php
$servername = "127.0.0.1";
$username = "root";
$password = "millefiore";
$dbname = "lzt_meat";

try {
    $pdo = new PDO("mysql:host=$servername;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Check products table structure
    echo "=== Products Table ===\n";
    $stmt = $pdo->query("DESCRIBE products");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($columns as $col) {
        echo "  - {$col['Field']} ({$col['Type']})\n";
    }
    
    // Check count
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM products");
    $count = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "\nTotal products: {$count['count']}\n";
    
    // If no products, check categories first
    if ($count['count'] == 0) {
        echo "\n=== Checking Categories ===\n";
        $stmt = $pdo->query("SELECT * FROM categories ORDER BY id");
        $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo "Categories found: " . count($categories) . "\n";
        
        if (count($categories) == 0) {
            echo "Creating default categories...\n";
            $pdo->exec("INSERT INTO categories (name, description, created_at, updated_at) VALUES 
                ('Sausages', 'Filipino-style sausages', NOW(), NOW()),
                ('Cured Meats', 'Cured and marinated meats', NOW(), NOW()),
                ('Processed Meats', 'Processed meat products', NOW(), NOW())
            ");
            echo "Categories created!\n";
        }
        
        // Get category IDs
        $stmt = $pdo->query("SELECT id FROM categories LIMIT 1");
        $cat = $stmt->fetch(PDO::FETCH_ASSOC);
        $categoryId = $cat['id'];
        
        echo "\nCreating sample products...\n";
        $products = [
            ['Longanisa (Sweet)', 'LONG-001', 'kg', 150.00],
            ['Longanisa (Garlic)', 'LONG-002', 'kg', 160.00],
            ['Tocino (Pork)', 'TOC-001', 'kg', 180.00],
            ['Tocino (Chicken)', 'TOC-002', 'kg', 170.00],
            ['Chorizo de Bilbao', 'CHOR-001', 'kg', 220.00],
            ['Shanghai (Spring Rolls)', 'SHANG-001', 'kg', 140.00],
            ['Hotdog (Jumbo)', 'HOT-001', 'kg', 130.00],
            ['Hotdog (Regular)', 'HOT-002', 'kg', 120.00],
            ['Embutido', 'EMB-001', 'kg', 200.00],
            ['Hamonado', 'HAM-001', 'kg', 250.00],
        ];
        
        $stmt = $pdo->prepare("INSERT INTO products (name, unit, price, category_id, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())");
        
        foreach ($products as $product) {
            $stmt->execute([
                $product[0],
                $product[2],
                $product[3],
                $categoryId
            ]);
            echo "  Created: {$product[0]}\n";
        }
        
        echo "\nProducts created successfully!\n";
    }
    
    // Show all products
    echo "\n=== All Products ===\n";
    $stmt = $pdo->query("SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id ORDER BY p.name");
    $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($products as $p) {
        echo "  - {$p['name']} (SKU: {$p['sku']}, Price: {$p['price']})\n";
    }
    
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
