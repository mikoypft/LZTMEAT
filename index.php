<?php
/**
 * LZT Meat - Main Entry Point (PHP Router)
 * 
 * This file serves as the PHP entry point for the application.
 * It handles routing when .htaccess mod_rewrite is not available
 * (e.g., when Phusion Passenger intercepts requests).
 * 
 * Routes:
 *  - /api/*   → Laravel backend (backend/public/index.php)
 *  - /*       → React SPA (dist/index.html)
 */

// Suppress deprecation warnings
error_reporting(E_ALL & ~E_DEPRECATED & ~E_USER_DEPRECATED);
ini_set('display_errors', '0');

// Get the request URI
$requestUri = $_SERVER['REQUEST_URI'] ?? '/';
$path = parse_url($requestUri, PHP_URL_PATH);

// ─────────────────────────────────────────────────────────
// 1. Serve static files from dist/ (CSS, JS, images, etc.)
// ─────────────────────────────────────────────────────────
if ($path !== '/' && $path !== '') {
    // Check if the requested file exists in dist/
    $distFile = __DIR__ . '/dist' . $path;
    if (file_exists($distFile) && !is_dir($distFile)) {
        // Determine MIME type
        $mimeTypes = [
            'js'    => 'application/javascript',
            'mjs'   => 'application/javascript',
            'css'   => 'text/css',
            'html'  => 'text/html',
            'json'  => 'application/json',
            'svg'   => 'image/svg+xml',
            'png'   => 'image/png',
            'jpg'   => 'image/jpeg',
            'jpeg'  => 'image/jpeg',
            'gif'   => 'image/gif',
            'ico'   => 'image/x-icon',
            'webp'  => 'image/webp',
            'woff'  => 'font/woff',
            'woff2' => 'font/woff2',
            'ttf'   => 'font/ttf',
            'eot'   => 'application/vnd.ms-fontobject',
            'map'   => 'application/json',
        ];
        
        $ext = strtolower(pathinfo($distFile, PATHINFO_EXTENSION));
        $mime = $mimeTypes[$ext] ?? mime_content_type($distFile);
        
        header('Content-Type: ' . $mime);
        
        // Cache static assets with hashes
        if (preg_match('/\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2)$/', $path)) {
            header('Cache-Control: public, max-age=31536000, immutable');
        }
        
        readfile($distFile);
        exit;
    }
}

// ─────────────────────────────────────────────────────────
// 2. Route API requests to Laravel backend
// ─────────────────────────────────────────────────────────
if (str_starts_with($path, '/api')) {
    // Set CORS headers
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
    header('Access-Control-Allow-Credentials: true');
    header('Content-Type: application/json');

    // Handle preflight
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit;
    }

    // Use standalone API (backend/index.php) which handles its own DB credentials
    // with proper production fallback. Laravel route is disabled to avoid .env
    // credential conflicts between local dev and production.
    $standaloneApi = __DIR__ . '/backend/index.php';

    if (file_exists($standaloneApi)) {
        // Standalone PHP API with built-in production credential handling
        chdir(__DIR__ . '/backend');
        require $standaloneApi;
    } else {
        http_response_code(500);
        echo json_encode([
            'error' => 'Backend not configured',
            'details' => [
                'Laravel not found: ' . $laravelAutoload,
                'Standalone API missing: ' . $standaloneApi,
            ],
        ]);
    }
    exit;
}

// ─────────────────────────────────────────────────────────
// 3. All other requests → React SPA (dist/index.html)
// ─────────────────────────────────────────────────────────
$indexFile = __DIR__ . '/dist/index.html';
if (file_exists($indexFile)) {
    header('Content-Type: text/html; charset=utf-8');
    header('Cache-Control: no-cache, no-store, must-revalidate');
    readfile($indexFile);
} else {
    http_response_code(503);
    echo '<!DOCTYPE html><html><head><title>LZT Meat</title></head>';
    echo '<body style="font-family:sans-serif;text-align:center;padding:50px;">';
    echo '<h1>Site Under Maintenance</h1>';
    echo '<p>The application is being deployed. Please try again in a few minutes.</p>';
    echo '</body></html>';
}
