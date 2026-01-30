<?php
$pdo = new PDO('mysql:host=127.0.0.1;dbname=lzt_meat', 'root', 'millefiore');

// Check if ingredient_categories table exists
$stmt = $pdo->query("SHOW TABLES LIKE 'ingredient_categories'");
$exists = $stmt->fetch();

if (!$exists) {
    echo "Creating ingredient_categories table...\n";
    
    $pdo->exec("
        CREATE TABLE ingredient_categories (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    ");
    
    echo "✓ Table created successfully\n";
    
    // Add some default ingredient categories
    $categories = [
        ['name' => 'Beef', 'description' => 'All beef products and cuts'],
        ['name' => 'Pork', 'description' => 'All pork products and cuts'],
        ['name' => 'Chicken', 'description' => 'Poultry products'],
        ['name' => 'Lamb', 'description' => 'Lamb and mutton products'],
        ['name' => 'Seafood', 'description' => 'Fish and seafood products'],
        ['name' => 'Seasonings', 'description' => 'Spices and seasonings'],
        ['name' => 'Casings', 'description' => 'Sausage casings and wraps'],
    ];
    
    $stmt = $pdo->prepare('INSERT INTO ingredient_categories (name, description) VALUES (?, ?)');
    foreach ($categories as $cat) {
        $stmt->execute([$cat['name'], $cat['description']]);
    }
    
    echo "✓ Added " . count($categories) . " default ingredient categories\n";
} else {
    echo "Table ingredient_categories already exists\n";
}

// Show current data
echo "\n--- Ingredient Categories ---\n";
$stmt = $pdo->query('SELECT * FROM ingredient_categories ORDER BY name');
$cats = $stmt->fetchAll(PDO::FETCH_ASSOC);
foreach ($cats as $cat) {
    echo $cat['id'] . ". " . $cat['name'] . "\n";
}

// Check product categories too
echo "\n--- Product Categories ---\n";
$stmt = $pdo->query('SELECT * FROM categories ORDER BY name');
$cats = $stmt->fetchAll(PDO::FETCH_ASSOC);
if (count($cats) === 0) {
    echo "No product categories yet.\n";
} else {
    foreach ($cats as $cat) {
        echo $cat['id'] . ". " . $cat['name'] . "\n";
    }
}
