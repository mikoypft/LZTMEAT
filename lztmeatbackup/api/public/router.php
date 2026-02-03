<?php
// Error suppression to prevent warnings in output
error_reporting(E_ALL & ~E_DEPRECATED & ~E_USER_DEPRECATED);
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);

// Get the requested URI
$uri = parse_url($_SERVER["REQUEST_URI"], PHP_URL_PATH);

// Handle static files
if (is_file(__DIR__ . $uri)) {
    return false;
}

// Route everything else to index.php
require_once __DIR__ . '/index.php';
