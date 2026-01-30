<?php
$servername = "127.0.0.1";
$username = "root";
$password = "millefiore";
$dbname = "lzt_meat";

try {
    $pdo = new PDO("mysql:host=$servername;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Get all products
    $stmt = $pdo->query("SELECT * FROM products");
    $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get all stores
    $stmt = $pdo->query("SELECT * FROM stores");
    $stores = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "Initializing inventory for " . count($products) . " products...\n\n";
    
    // Prepare insert statement with ON DUPLICATE KEY UPDATE
    $stmt = $pdo->prepare("
        INSERT INTO inventory (product_id, location, quantity, created_at, updated_at) 
        VALUES (?, ?, ?, NOW(), NOW())
        ON DUPLICATE KEY UPDATE quantity = VALUES(quantity), updated_at = NOW()
    ");
    
    foreach ($products as $product) {
        // Random production stock between 100-500
        $productionStock = rand(100, 500);
        
        // Add to Production Facility
        $stmt->execute([$product['id'], 'Production Facility', $productionStock]);
        echo "  {$product['name']}: Production Facility = {$productionStock} kg\n";
        
        // Add to each store with random quantities
        foreach ($stores as $store) {
            $storeStock = rand(30, 150);
            $stmt->execute([$product['id'], $store['name'], $storeStock]);
            echo "  {$product['name']}: {$store['name']} = {$storeStock} kg\n";
        }
        echo "\n";
    }
    
    echo "\n=== Inventory Summary ===\n";
    $stmt = $pdo->query("SELECT i.*, p.name as product_name FROM inventory i LEFT JOIN products p ON i.product_id = p.id ORDER BY p.name, i.location");
    $inventory = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $currentProduct = '';
    foreach ($inventory as $inv) {
        if ($currentProduct !== $inv['product_name']) {
            $currentProduct = $inv['product_name'];
            echo "\n{$inv['product_name']}:\n";
        }
        echo "  - {$inv['location']}: {$inv['quantity']} kg\n";
    }
    
    echo "\nInventory initialized successfully!\n";
    
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
