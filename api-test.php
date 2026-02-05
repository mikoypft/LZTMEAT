<?php
/**
 * API Test - Check if Laravel backend is reachable
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$result = [
    'status' => 'ok',
    'message' => 'API test endpoint reached',
    'timestamp' => date('Y-m-d H:i:s'),
    'request_uri' => $_SERVER['REQUEST_URI'] ?? 'unknown',
    'script_name' => $_SERVER['SCRIPT_NAME'] ?? 'unknown',
    'php_self' => $_SERVER['PHP_SELF'] ?? 'unknown',
];

// Check if we can reach Laravel
$laravelPublic = __DIR__ . '/backend/public/index.php';
$result['laravel_exists'] = file_exists($laravelPublic);

// Check .env
$envFile = __DIR__ . '/backend/.env';
$envProd = __DIR__ . '/backend/.env.production';
$result['env_exists'] = file_exists($envFile);
$result['env_production_exists'] = file_exists($envProd);

// Check database config
if (file_exists($envProd)) {
    $content = file_get_contents($envProd);
    $result['has_db_config'] = strpos($content, 'DB_DATABASE') !== false;
}

echo json_encode($result, JSON_PRETTY_PRINT);
