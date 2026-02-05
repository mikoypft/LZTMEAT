<?php
/**
 * Root index.php - serves the frontend SPA
 * This is a fallback to ensure dist/index.html is served for all SPA routes
 */

// Get the request path
$request = $_SERVER['REQUEST_URI'];

// Remove query string
$request = parse_url($request, PHP_URL_PATH);

// Remove leading slash
$request = ltrim($request, '/');

// Handle special paths
if (strpos($request, 'api/') === 0 || $request === 'api') {
    // Route to Laravel API
    require_once __DIR__ . '/backend/public/index.php';
    exit;
}

if (strpos($request, 'backend/') === 0 || $request === 'backend') {
    if ($request !== 'backend/setup.php') {
        // Route to Laravel backend
        require_once __DIR__ . '/backend/public/index.php';
        exit;
    }
}

// For everything else, serve the frontend
// Check if it's requesting a real file in dist/assets
if (strpos($request, 'dist/') === 0) {
    // Serve the actual file
    $file = __DIR__ . '/' . $request;
    if (file_exists($file) && is_file($file)) {
        // Set proper MIME type
        $ext = pathinfo($file, PATHINFO_EXTENSION);
        $mimeTypes = [
            'js' => 'application/javascript',
            'css' => 'text/css',
            'json' => 'application/json',
            'png' => 'image/png',
            'jpg' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'gif' => 'image/gif',
            'svg' => 'image/svg+xml',
            'woff' => 'font/woff',
            'woff2' => 'font/woff2',
            'ttf' => 'font/ttf',
            'eot' => 'application/vnd.ms-fontobject',
        ];
        header('Content-Type: ' . ($mimeTypes[$ext] ?? 'application/octet-stream'));
        echo file_get_contents($file);
        exit;
    }
}

// Serve dist/index.html for all other requests (SPA routing)
if (file_exists(__DIR__ . '/dist/index.html')) {
    header('Content-Type: text/html; charset=utf-8');
    echo file_get_contents(__DIR__ . '/dist/index.html');
    exit;
}

// Fallback if dist doesn't exist
http_response_code(404);
echo "Frontend not found. Please run: npm run build";
