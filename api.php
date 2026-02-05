<?php
/**
 * API Gateway - Routes API requests to Laravel backend
 * This bypasses .htaccess rewrite issues with Phusion Passenger
 */

// Get the request path
$requestUri = $_SERVER['REQUEST_URI'] ?? '';
$path = parse_url($requestUri, PHP_URL_PATH);

// Remove /api.php prefix if present
$path = str_replace('/api.php', '', $path);

// Set required environment variables
$_SERVER['REQUEST_URI'] = $path;
$_SERVER['SCRIPT_NAME'] = '/backend/public/index.php';
$_SERVER['SCRIPT_FILENAME'] = __DIR__ . '/backend/public/index.php';
$_SERVER['DOCUMENT_ROOT'] = __DIR__ . '/backend/public';

// Change to backend directory
chdir(__DIR__ . '/backend/public');

// Load and execute Laravel
require __DIR__ . '/backend/public/index.php';
