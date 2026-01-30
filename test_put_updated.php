<?php
// Test PUT /api/ingredients/{id} endpoint with partial update
echo "=== Testing PUT /api/ingredients/14 (Partial Update) ===\n";
$ch = curl_init('http://localhost:8000/api/ingredients/14');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);

$updateData = [
    'stock' => 75.50,
    'minStockLevel' => 15,
];

curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($updateData));
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

echo "HTTP Code: $httpCode\n";
if ($httpCode === 200) {
    $data = json_decode($response, true);
    if (isset($data['ingredient'])) {
        echo "✓ Update successful!\n";
        echo "  New Stock: " . $data['ingredient']['stock'] . " kg\n";
        echo "  New Min Stock Level: " . $data['ingredient']['minStockLevel'] . "\n";
    } else {
        echo "Response: $response\n";
    }
} else {
    echo "Response: $response\n";
}

// Clean up - delete test ingredient
echo "\n=== Deleting Test Ingredient ===\n";
$ch = curl_init('http://localhost:8000/api/ingredients/14');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'DELETE');
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
echo "Deleted: HTTP $httpCode\n";
