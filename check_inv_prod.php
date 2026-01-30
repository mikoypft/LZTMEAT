<?php
$conn = mysqli_connect('localhost', 'root', '', 'lzt_meat');

echo "=== INVENTORY TABLE ===\n";
$result = mysqli_query($conn, 'SELECT i.*, p.name FROM inventory i JOIN products p ON i.product_id = p.id');
while($row = mysqli_fetch_assoc($result)) {
    echo "Product: {$row['name']}, Location: {$row['location']}, Qty: {$row['quantity']}\n";
}

echo "\n=== PRODUCTION RECORDS ===\n";
$result = mysqli_query($conn, 'SELECT pr.id, pr.quantity, pr.batch_number, pr.status, p.name FROM production_records pr JOIN products p ON pr.product_id = p.id ORDER BY pr.id DESC');
while($row = mysqli_fetch_assoc($result)) {
    echo "Batch: {$row['batch_number']}, Product: {$row['name']}, Qty: {$row['quantity']}, Status: {$row['status']}\n";
}
