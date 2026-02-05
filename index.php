<?php
/**
 * Root index.php - serves the frontend SPA and routes API/backend requests
 * This is the main entry point for all requests to the application
 */

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 0); // Don't display errors to users
ini_set('log_errors', 1);

// Get the request path
$request = $_SERVER['REQUEST_URI'] ?? '/';

// Remove query string
$request = parse_url($request, PHP_URL_PATH);

// Remove leading slash for cleaner comparisons
$requestPath = ltrim($request, '/');

// Handle API routes - route to Laravel backend
if ($requestPath === 'api' || strpos($requestPath, 'api/') === 0) {
    require_once __DIR__ . '/backend/public/index.php';
    exit;
}

// Handle backend routes (except setup.php) - route to Laravel
if (($requestPath === 'backend' || strpos($requestPath, 'backend/') === 0) && strpos($requestPath, 'backend/setup.php') !== 0) {
    require_once __DIR__ . '/backend/public/index.php';
    exit;
}

// Handle static assets from dist
if (strpos($requestPath, 'dist/assets/') === 0 || strpos($requestPath, 'dist/') === 0) {
    $filePath = __DIR__ . '/' . $requestPath;
    
    // Security check - prevent directory traversal
    $realPath = realpath($filePath);
    $distDir = realpath(__DIR__ . '/dist');
    
    if ($realPath && $distDir && strpos($realPath, $distDir) === 0 && file_exists($realPath) && is_file($realPath)) {
        // Set proper MIME type
        $ext = strtolower(pathinfo($realPath, PATHINFO_EXTENSION));
        $mimeTypes = [
            'js'    => 'application/javascript; charset=utf-8',
            'css'   => 'text/css; charset=utf-8',
            'json'  => 'application/json',
            'png'   => 'image/png',
            'jpg'   => 'image/jpeg',
            'jpeg'  => 'image/jpeg',
            'gif'   => 'image/gif',
            'svg'   => 'image/svg+xml',
            'woff'  => 'font/woff',
            'woff2' => 'font/woff2',
            'ttf'   => 'font/ttf',
            'eot'   => 'application/vnd.ms-fontobject',
            'html'  => 'text/html; charset=utf-8',
        ];
        
        $mimeType = $mimeTypes[$ext] ?? 'application/octet-stream';
        header('Content-Type: ' . $mimeType);
        header('Cache-Control: public, max-age=31536000'); // 1 year cache for assets
        readfile($realPath);
        exit;
    }
}

// For all other requests, serve the SPA frontend
$indexPath = __DIR__ . '/dist/index.html';

if (file_exists($indexPath)) {
    header('Content-Type: text/html; charset=utf-8');
    header('Cache-Control: no-cache, no-store, must-revalidate'); // Don't cache HTML
    echo file_get_contents($indexPath);
    exit;
}

// Fallback error if frontend is not built
http_response_code(500);
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Application Error</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .container { max-width: 800px; margin: auto; background: white; padding: 40px; border-radius: 8px; }
        h1 { color: #d32f2f; }
        p { color: #666; line-height: 1.6; }
        code { background: #f5f5f5; padding: 10px; display: block; margin: 20px 0; border-radius: 4px; font-family: monospace; }
    </style>
</head>
<body>
    <div class="container">
        <h1>⚠️ Application Error</h1>
        <p>The frontend distribution folder is missing or incomplete.</p>
        <p>Please ensure the frontend has been built by running:</p>
        <code>npm run build</code>
        <p>Then ensure the <code>dist/index.html</code> file exists on the server.</p>
    </div>
</body>
</html>

