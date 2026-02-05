<?php
/**
 * Root index.php - serves the frontend SPA and routes API/backend requests
 * This is the main entry point for all requests to the application
 */

// Set up error handling
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// Get the request path
$request = $_SERVER['REQUEST_URI'] ?? '/';

// Remove query string
$request = parse_url($request, PHP_URL_PATH);

// Remove leading slash
$requestPath = ltrim($request, '/');

try {
    // Handle API routes - route to Laravel backend
    if ($requestPath === 'api' || strpos($requestPath, 'api/') === 0) {
        // Check if backend exists
        $backendIndex = __DIR__ . '/backend/public/index.php';
        if (!file_exists($backendIndex)) {
            http_response_code(500);
            die('Backend Laravel application not found at: ' . $backendIndex);
        }
        require_once $backendIndex;
        exit;
    }

    // Handle backend routes (except setup.php)
    if (($requestPath === 'backend' || strpos($requestPath, 'backend/') === 0) && strpos($requestPath, 'backend/setup.php') !== 0) {
        $backendIndex = __DIR__ . '/backend/public/index.php';
        if (!file_exists($backendIndex)) {
            http_response_code(500);
            die('Backend Laravel application not found');
        }
        require_once $backendIndex;
        exit;
    }

    // Don't route these paths - serve actual files if they exist
    if (strpos($requestPath, 'setup.php') === 0 || strpos($requestPath, 'favicon.ico') === 0) {
        $filePath = __DIR__ . '/' . $requestPath;
        if (file_exists($filePath) && is_file($filePath)) {
            header('Content-Type: ' . mime_content_type($filePath));
            readfile($filePath);
            exit;
        }
        http_response_code(404);
        exit;
    }

    // Handle dist static assets
    if (strpos($requestPath, 'dist/assets/') === 0 || strpos($requestPath, 'dist/') === 0) {
        $filePath = __DIR__ . '/' . $requestPath;
        
        // Security: prevent directory traversal
        $realPath = realpath($filePath);
        $distDir = realpath(__DIR__ . '/dist');
        
        if ($realPath && $distDir && strpos($realPath, $distDir) === 0 && file_exists($realPath) && is_file($realPath)) {
            $ext = strtolower(pathinfo($realPath, PATHINFO_EXTENSION));
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
            readfile($realPath);
            exit;
        }
    }

    // For everything else, serve the SPA frontend
    $indexPath = __DIR__ . '/dist/index.html';
    
    if (!file_exists($indexPath)) {
        http_response_code(500);
        die('Frontend not found. Run: npm run build');
    }
    
    header('Content-Type: text/html; charset=utf-8');
    header('Cache-Control: no-cache, no-store, must-revalidate');
    readfile($indexPath);
    
} catch (Exception $e) {
    http_response_code(500);
    error_log('Router error: ' . $e->getMessage());
    die('Application error. Check logs.');
}


