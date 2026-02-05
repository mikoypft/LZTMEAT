<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

$checks = ['success' => [], 'errors' => []];

// ===== PATHS =====
$paths = [
    'dist/index.html' => __DIR__ . '/dist/index.html',
    'backend/' => __DIR__ . '/backend',
    'backend/.env.production' => __DIR__ . '/backend/.env.production',
    '.htaccess' => __DIR__ . '/.htaccess',
];

foreach ($paths as $name => $path) {
    if (is_file($path) || is_dir($path)) {
        $checks['success'][] = "✓ $name exists";
    } else {
        $checks['errors'][] = "✗ $name NOT FOUND at " . $path;
    }
}

// ===== ENVIRONMENT =====
$checks['success'][] = "Server: " . $_SERVER['SERVER_SOFTWARE'];
$checks['success'][] = "PHP Version: " . phpversion();
$checks['success'][] = "Document Root: " . $_SERVER['DOCUMENT_ROOT'];

// ===== EXTENSIONS =====
foreach (['pdo', 'pdo_mysql', 'openssl'] as $ext) {
    if (extension_loaded($ext)) {
        $checks['success'][] = "✓ Extension: $ext";
    } else {
        $checks['errors'][] = "✗ Missing: $ext";
    }
}

// ===== DATABASE =====
$envFile = __DIR__ . '/backend/.env.production';
if (file_exists($envFile)) {
    $env = [];
    foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        if (strpos($line, '#') === 0 || !strpos($line, '=')) continue;
        list($k, $v) = explode('=', $line, 2);
        $env[trim($k)] = trim(trim($v), '"\'');
    }
    
    if (isset($env['DB_HOST'], $env['DB_DATABASE'], $env['DB_USERNAME'], $env['DB_PASSWORD'])) {
        try {
            new PDO(
                "mysql:host={$env['DB_HOST']};dbname={$env['DB_DATABASE']}",
                $env['DB_USERNAME'],
                $env['DB_PASSWORD']
            );
            $checks['success'][] = "✓ Database: Connected ({$env['DB_DATABASE']})";
        } catch (Exception $e) {
            $checks['errors'][] = "✗ Database: Connection failed - " . $e->getMessage();
        }
    }
}

// ===== LARAVEL =====
if (file_exists(__DIR__ . '/backend/artisan')) {
    $checks['success'][] = "✓ Laravel: artisan found";
} else {
    $checks['errors'][] = "✗ Laravel: artisan not found (composer install needed)";
}

if (file_exists(__DIR__ . '/backend/bootstrap/app.php')) {
    $checks['success'][] = "✓ Laravel: bootstrap found";
} else {
    $checks['errors'][] = "✗ Laravel: bootstrap/app.php not found";
}

// ===== FRONTEND =====
if (file_exists(__DIR__ . '/dist/index.html')) {
    $size = filesize(__DIR__ . '/dist/index.html');
    $checks['success'][] = "✓ Frontend: dist/index.html (" . number_format($size) . " bytes)";
} else {
    $checks['errors'][] = "✗ Frontend: dist/index.html not found (npm run build needed)";
}

?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Setup Check - LZTMEAT</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f5f7fa; padding: 20px; line-height: 1.6; }
        .container { max-width: 800px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden; }
        h1 { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; margin: 0; }
        .content { padding: 30px; }
        h2 { color: #333; margin-top: 25px; margin-bottom: 15px; border-bottom: 2px solid #f0f0f0; padding-bottom: 8px; }
        h2:first-of-type { margin-top: 0; }
        .item { padding: 10px 12px; margin: 8px 0; border-left: 4px solid #ddd; background: #fafafa; border-radius: 4px; }
        .success { border-left-color: #28a745; background: #f0fdf4; color: #166534; }
        .error { border-left-color: #dc3545; background: #fef2f2; color: #991b1b; }
        .info { border-left-color: #0dcaf0; background: #f0f9ff; color: #0369a1; }
        .steps { background: #fff8f0; border: 1px solid #fed7aa; border-radius: 6px; padding: 20px; margin-top: 20px; }
        .steps h3 { color: #c2410c; margin-bottom: 12px; }
        .steps ol { margin-left: 20px; }
        .steps li { margin: 8px 0; color: #78350f; }
        code { background: #f3f4f6; padding: 2px 6px; border-radius: 3px; font-family: 'Monaco', monospace; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔍 LZTMEAT Setup Status</h1>
        <div class="content">
            
            <h2>✓ Checks Passed</h2>
            <?php if (empty($checks['success'])): ?>
                <div class="item error">No successful checks</div>
            <?php else: ?>
                <?php foreach ($checks['success'] as $msg): ?>
                    <div class="item success"><?= htmlspecialchars($msg) ?></div>
                <?php endforeach; ?>
            <?php endif; ?>
            
            <h2>✗ Issues</h2>
            <?php if (empty($checks['errors'])): ?>
                <div class="item success">✓ No issues detected! Your site should work.</div>
            <?php else: ?>
                <?php foreach ($checks['errors'] as $msg): ?>
                    <div class="item error">⚠️ <?= htmlspecialchars($msg) ?></div>
                <?php endforeach; ?>
            <?php endif; ?>
            
            <div class="steps">
                <h3>📋 Troubleshooting Steps</h3>
                <ol>
                    <li><strong>Verify Plesk pulled latest code:</strong><br>
                        In Plesk → Websites → Git → Check the commit hash matches your latest push
                    </li>
                    <li><strong>Restart Apache:</strong><br>
                        In Plesk → Services & Applications → Service Management → Apache → Restart
                    </li>
                    <li><strong>Hard refresh browser:</strong><br>
                        Press <code>Ctrl+Shift+R</code> (Windows) or <code>Cmd+Shift+R</code> (Mac)
                    </li>
                    <li><strong>If still getting errors after these steps:</strong><br>
                        Your hosting provider may need to run on the server:
                        <div style="background: #f3f4f6; padding: 10px; margin-top: 8px; border-radius: 4px; font-family: monospace; font-size: 0.85em; overflow-x: auto;">
cd /var/www/vhosts/lztmeat.com/httpdocs/backend<br>
composer install<br>
php artisan key:generate<br>
php artisan migrate
                        </div>
                    </li>
                </ol>
            </div>
            
            <p style="margin-top: 20px; font-size: 0.9em; color: #666;">
                This diagnostic page is at: <code><?= $_SERVER['REQUEST_URI'] ?></code><br>
                You can delete setup.php after deployment is complete.
            </p>
        </div>
    </div>
</body>
</html>
