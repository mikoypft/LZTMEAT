<?php
$pdo = new PDO('mysql:host=127.0.0.1;dbname=lzt_meat', 'root', 'millefiore');

// First, seed suppliers
echo "Seeding suppliers...\n";
$suppliers = [
    ['name' => 'ABC Meat Supply', 'contact_person' => 'John Smith', 'email' => 'john@abcmeat.com', 'phone' => '555-1001', 'address' => '123 Meat District St, Food City'],
    ['name' => 'Fresh Farms Co', 'contact_person' => 'Maria Garcia', 'email' => 'maria@freshfarms.com', 'phone' => '555-1002', 'address' => '456 Farm Lane, Agricultural Zone'],
    ['name' => 'Quality Meats Ltd', 'contact_person' => 'Robert Lee', 'email' => 'robert@qualitymeats.com', 'phone' => '555-1003', 'address' => '789 Premium Ave, Market District'],
    ['name' => 'Premium Imports', 'contact_person' => 'Sarah Johnson', 'email' => 'sarah@premiumimports.com', 'phone' => '555-1004', 'address' => '321 Trade St, Import Hub'],
    ['name' => 'Local Herds', 'contact_person' => 'Tom Wilson', 'email' => 'tom@localherds.com', 'phone' => '555-1005', 'address' => '654 Rural Rd, Countryside'],
];

$stmt = $pdo->prepare('INSERT INTO suppliers (name, contact_person, email, phone, address, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())');
foreach ($suppliers as $supplier) {
    $stmt->execute([$supplier['name'], $supplier['contact_person'], $supplier['email'], $supplier['phone'], $supplier['address']]);
}
echo "✓ Added " . count($suppliers) . " suppliers\n";

// Seed ingredients
echo "\nSeeding ingredients...\n";
$ingredients = [
    ['name' => 'Beef Chuck', 'code' => 'BEEF-001', 'category' => 'Beef', 'unit' => 'kg', 'stock' => 150.50, 'min_stock' => 50, 'reorder' => 80, 'cost' => 450.00, 'supplier_id' => 1],
    ['name' => 'Beef Ribeye', 'code' => 'BEEF-002', 'category' => 'Beef', 'unit' => 'kg', 'stock' => 85.25, 'min_stock' => 30, 'reorder' => 50, 'cost' => 850.00, 'supplier_id' => 1],
    ['name' => 'Pork Shoulder', 'code' => 'PORK-001', 'category' => 'Pork', 'unit' => 'kg', 'stock' => 120.00, 'min_stock' => 40, 'reorder' => 60, 'cost' => 320.00, 'supplier_id' => 2],
    ['name' => 'Pork Belly', 'code' => 'PORK-002', 'category' => 'Pork', 'unit' => 'kg', 'stock' => 95.75, 'min_stock' => 20, 'reorder' => 40, 'cost' => 480.00, 'supplier_id' => 2],
    ['name' => 'Chicken Breast', 'code' => 'CHK-001', 'category' => 'Chicken', 'unit' => 'kg', 'stock' => 200.00, 'min_stock' => 80, 'reorder' => 100, 'cost' => 250.00, 'supplier_id' => 3],
    ['name' => 'Chicken Thighs', 'code' => 'CHK-002', 'category' => 'Chicken', 'unit' => 'kg', 'stock' => 180.50, 'min_stock' => 60, 'reorder' => 80, 'cost' => 180.00, 'supplier_id' => 3],
    ['name' => 'Lamb Chops', 'code' => 'LAMB-001', 'category' => 'Lamb', 'unit' => 'kg', 'stock' => 42.00, 'min_stock' => 15, 'reorder' => 25, 'cost' => 950.00, 'supplier_id' => 4],
    ['name' => 'Lamb Shoulder', 'code' => 'LAMB-002', 'category' => 'Lamb', 'unit' => 'kg', 'stock' => 58.30, 'min_stock' => 20, 'reorder' => 30, 'cost' => 720.00, 'supplier_id' => 4],
    ['name' => 'Fish Fillet', 'code' => 'FISH-001', 'category' => 'Seafood', 'unit' => 'kg', 'stock' => 65.00, 'min_stock' => 30, 'reorder' => 40, 'cost' => 550.00, 'supplier_id' => 5],
    ['name' => 'Shrimp', 'code' => 'FISH-002', 'category' => 'Seafood', 'unit' => 'kg', 'stock' => 35.00, 'min_stock' => 10, 'reorder' => 20, 'cost' => 1200.00, 'supplier_id' => 5],
    ['name' => 'Ground Beef', 'code' => 'BEEF-003', 'category' => 'Beef', 'unit' => 'kg', 'stock' => 15.00, 'min_stock' => 25, 'reorder' => 30, 'cost' => 380.00, 'supplier_id' => 1],
    ['name' => 'Beef Liver', 'code' => 'BEEF-004', 'category' => 'Beef', 'unit' => 'kg', 'stock' => 22.50, 'min_stock' => 10, 'reorder' => 15, 'cost' => 280.00, 'supplier_id' => 1],
];

$stmt = $pdo->prepare('INSERT INTO ingredients (name, code, category, unit, stock, min_stock_level, reorder_point, cost_per_unit, supplier_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())');
foreach ($ingredients as $ing) {
    $stmt->execute([$ing['name'], $ing['code'], $ing['category'], $ing['unit'], $ing['stock'], $ing['min_stock'], $ing['reorder'], $ing['cost'], $ing['supplier_id']]);
}
echo "✓ Added " . count($ingredients) . " ingredients\n";

// Verify
$count = $pdo->query('SELECT COUNT(*) FROM ingredients')->fetch(PDO::FETCH_COLUMN);
$supplier_count = $pdo->query('SELECT COUNT(*) FROM suppliers')->fetch(PDO::FETCH_COLUMN);
echo "\n✓ Database now has:\n";
echo "  - $supplier_count suppliers\n";
echo "  - $count ingredients\n";
