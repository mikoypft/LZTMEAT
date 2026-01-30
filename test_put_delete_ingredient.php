<?php
// Test PUT /api/ingredients/{id} endpoint
echo "=== Testing PUT /api/ingredients/13 ===\n";
$ch = curl_init('http://localhost:8000/api/ingredients/13');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);

$updateData = [
    'stock' => 75.50,
    'min_stock_level' => 15,
    'reorder_point' => 25
];

curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($updateData));
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

echo "HTTP Code: $httpCode\n";
echo "Response: $response\n\n";

// Test DELETE /api/ingredients/{id} endpoint
echo "=== Testing DELETE /api/ingredients/13 ===\n";
$ch = curl_init('http://localhost:8000/api/ingredients/13');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'DELETE');
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

echo "HTTP Code: $httpCode\n";
echo "Response: $response\n";

// Verify count
echo "\n=== Verifying Ingredient Count ===\n";
$pdo = new PDO('mysql:host=127.0.0.1;dbname=lzt_meat', 'root', 'millefiore');
$count = $pdo->query('SELECT COUNT(*) FROM ingredients')->fetch(PDO::FETCH_COLUMN);
echo "Total ingredients: $count\n";
