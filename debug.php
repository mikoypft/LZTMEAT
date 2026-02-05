<?php
/**
 * Debug script to test the deployment
 * Access: https://lztmeat.com/debug.php
 */

echo '<h1>LZT Meat - Deployment Debug</h1>';
echo '<pre>';

// Check paths
echo "=== DIRECTORY STRUCTURE ===\n";
printf("Root: %s\n", __DIR__);
printf("Dist exists: %s\n", is_dir(__DIR__ . '/dist') ? 'YES' : 'NO');
printf("Dist/index.html exists: %s\n", file_exists(__DIR__ . '/dist/index.html') ? 'YES' : 'NO');
printf("Backend exists: %s\n", is_dir(__DIR__ . '/backend') ? 'YES' : 'NO');
printf("Backend/public/index.php exists: %s\n", file_exists(__DIR__ . '/backend/public/index.php') ? 'YES' : 'NO');
printf("Backend/.env exists: %s\n", file_exists(__DIR__ . '/backend/.env') ? 'YES' : 'NO');

echo "\n=== PHP VERSION & EXTENSIONS ===\n";
printf("PHP Version: %s\n", phpversion());
printf("PDO available: %s\n", extension_loaded('pdo') ? 'YES' : 'NO');
printf("PDO MySQL: %s\n", extension_loaded('pdo_mysql') ? 'YES' : 'NO');
printf("OpenSSL: %s\n", extension_loaded('openssl') ? 'YES' : 'NO');

echo "\n=== SERVER INFO ===\n";
printf("Server Software: %s\n", $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown');
printf("Document Root: %s\n", $_SERVER['DOCUMENT_ROOT'] ?? 'Unknown');

echo "\n=== FRONTEND TEST ===\n";
$distPath = __DIR__ . '/dist/index.html';
if (file_exists($distPath)) {
    echo "✓ dist/index.html found\n";
    $html = file_get_contents($distPath);
    printf("  Size: %d bytes\n", strlen($html));
    printf("  Contains index markup: %s\n", strpos($html, '<div') !== false ? 'YES' : 'NO');
} else {
    echo "✗ dist/index.html NOT found\n";
}

echo "\n</pre>";
?>
