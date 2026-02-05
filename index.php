<?php
/**
 * Root index.php - serves the frontend SPA
 * API/backend requests are handled by backend/.htaccess
 */

$request = $_SERVER['REQUEST_URI'] ?? '/';
$request = parse_url($request, PHP_URL_PATH);
$requestPath = ltrim($request, '/');

// Serve static files from dist folder
if (strpos($requestPath, 'dist/') === 0) {
    $filePath = __DIR__ . '/' . $requestPath;
    if (file_exists($filePath) && is_file($filePath)) {
        $ext = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
        $mimeTypes = [
            'js'    => 'application/javascript; charset=utf-8',
            'css'   => 'text/css; charset=utf-8',
            'json'  => 'application/json',
            'html'  => 'text/html; charset=utf-8',
            'png'   => 'image/png',
            'jpg'   => 'image/jpeg',
            'jpeg'  => 'image/jpeg',
            'gif'   => 'image/gif',
            'svg'   => 'image/svg+xml',
            'woff'  => 'font/woff',
            'woff2' => 'font/woff2',
        ];
        header('Content-Type: ' . ($mimeTypes[$ext] ?? 'application/octet-stream'));
        header('Cache-Control: public, max-age=31536000');
        readfile($filePath);
        exit;
    }
}

// Serve the SPA frontend for all other requests
$indexPath = __DIR__ . '/dist/index.html';
if (file_exists($indexPath)) {
    header('Content-Type: text/html; charset=utf-8');
    header('Cache-Control: no-cache, no-store, must-revalidate');
    readfile($indexPath);
    exit;
}

// Frontend not built
http_response_code(500);
echo "Error: Frontend build not found. Run: npm run build\n";



