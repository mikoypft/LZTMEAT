<?php
// Test POST /api/ingredients endpoint
$ch = curl_init('http://localhost:8000/api/ingredients');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);

$newIngredient = [
    'name' => 'Test Ingredient',
    'code' => 'TEST-001',
    'category' => 'Test',
    'unit' => 'kg',
    'stock' => 50.00,
    'min_stock_level' => 10,
    'reorder_point' => 20,
    'cost_per_unit' => 100,
    'supplier_id' => 1
];

curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($newIngredient));
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Code: $httpCode\n";
echo "Response: $response\n";

if ($httpCode === 201) {
    $data = json_decode($response, true);
    echo "✓ New ingredient created with ID: " . $data['ingredient']['id'] . "\n";
} else {
    echo "✗ Failed to create ingredient\n";
}
