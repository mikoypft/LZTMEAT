<?php
/**
 * Simple diagnostic and setup script - place at root
 * Access: https://lztmeat.com/setup.php
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

$output = [];
$errors = [];

// Get backend path
$backendPath = __DIR__ . '/backend';

$output[] = "📍 Project Path: " . __DIR__;
$output[] = "📍 Backend Path: " . $backendPath;

// 1. Check if backend exists
if (is_dir($backendPath)) {
    $output[] = "✓ Backend directory found";
} else {
    $errors[] = "✗ Backend directory not found at: $backendPath";
}

// 2. Check .env.production
$envProdPath = $backendPath . '/.env.production';
if (file_exists($envProdPath)) {
    $output[] = "✓ .env.production found";
    
    // Copy to .env if it doesn't exist
    $envPath = $backendPath . '/.env';
    if (!file_exists($envPath)) {
        if (copy($envProdPath, $envPath)) {
            $output[] = "✓ Created .env from .env.production";
        } else {
            $errors[] = "✗ Cannot copy .env.production to .env - check permissions";
        }
    } else {
        $output[] = "✓ .env already exists";
    }
} else {
    $errors[] = "✗ .env.production not found at: $envProdPath";
}

// 3. Generate APP_KEY
$envFile = $backendPath . '/.env';
if (file_exists($envFile)) {
    $envContent = file_get_contents($envFile);
    if (strpos($envContent, 'APP_KEY=base64:') === false) {
        $appKey = 'base64:' . bin2hex(random_bytes(32));
        // Replace APP_KEY line carefully
        $lines = explode("\n", $envContent);
        $newLines = [];
        $found = false;
        foreach ($lines as $line) {
            if (strpos($line, 'APP_KEY=') === 0) {
                $newLines[] = 'APP_KEY=' . $appKey;
                $found = true;
            } else {
                $newLines[] = $line;
            }
        }
        $newContent = implode("\n", $newLines);
        if (file_put_contents($envFile, $newContent)) {
            $output[] = "✓ Generated APP_KEY";
        } else {
            $errors[] = "✗ Cannot write to .env file - check permissions";
        }
    } else {
        $output[] = "✓ APP_KEY already generated";
    }
}

// 4. Check artisan
if (file_exists($backendPath . '/artisan')) {
    $output[] = "✓ Laravel artisan found";
} else {
    $errors[] = "✗ Laravel artisan not found - composer dependencies may not be installed";
}

// 5. Check storage/logs
$storageDir = $backendPath . '/storage';
$logsDir = $storageDir . '/logs';
if (!is_dir($logsDir)) {
    @mkdir($logsDir, 0777, true);
}
if (is_dir($logsDir)) {
    $output[] = "✓ Storage/logs directory accessible";
} else {
    $errors[] = "✗ Cannot access storage/logs directory";
}

// 6. Check bootstrap/cache
$bootCacheDir = $backendPath . '/bootstrap/cache';
if (!is_dir($bootCacheDir)) {
    @mkdir($bootCacheDir, 0777, true);
}
if (is_writeable($backendPath . '/bootstrap')) {
    $output[] = "✓ Bootstrap directory writable";
} else {
    $errors[] = "⚠ Bootstrap directory may not be writable";
}

// 7. Try to detect Laravel version
if (file_exists($backendPath . '/vendor/laravel/framework/src/Illuminate/Foundation/Application.php')) {
    $output[] = "✓ Laravel framework installed";
} else {
    $errors[] = "⚠ Laravel framework might not be installed (check vendor folder)";
}

// 8. Check database config
if (file_exists($envFile)) {
    $envContent = file_get_contents($envFile);
    $hasDb = preg_match('/DB_DATABASE\s*=\s*\w+/', $envContent);
    $hasUser = preg_match('/DB_USERNAME\s*=\s*\w+/', $envContent);
    if ($hasDb && $hasUser) {
        if (preg_match('/DB_DATABASE\s*=\s*(\w+)/', $envContent, $m)) {
            $output[] = "✓ Database configured: DB=" . $m[1];
        }
    } else {
        $errors[] = "⚠ Database credentials not fully configured - check .env file";
    }
}

// 9. Check dist folder
if (is_dir(__DIR__ . '/dist')) {
    if (file_exists(__DIR__ . '/dist/index.html')) {
        $output[] = "✓ Frontend dist/index.html found";
    } else {
        $errors[] = "⚠ dist folder found but no index.html (run: npm run build)";
    }
} else {
    $errors[] = "⚠ dist folder not found (run: npm run build)";
}

// 10. Check .htaccess
if (file_exists(__DIR__ . '/.htaccess')) {
    $output[] = "✓ Root .htaccess found";
} else {
    $errors[] = "⚠ Root .htaccess not found - routing may fail";
}

$status = empty($errors) ? 'success' : 'warning';
?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LZT Meat - Setup Diagnostic</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f0f2f5;
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            text-align: center;
        }
        .header h1 {
            font-size: 32px;
            margin-bottom: 10px;
        }
        .content {
            padding: 40px;
        }
        .status-badge {
            display: inline-block;
            padding: 10px 20px;
            border-radius: 20px;
            font-weight: 600;
            margin-bottom: 30px;
            font-size: 14px;
        }
        .status-badge.success {
            background: #d4edda;
            color: #155724;
        }
        .status-badge.warning {
            background: #fff3cd;
            color: #856404;
        }
        .section {
            margin-bottom: 40px;
        }
        .section h2 {
            font-size: 18px;
            margin-bottom: 20px;
            color: #333;
            border-bottom: 2px solid #f0f2f5;
            padding-bottom: 10px;
        }
        .log-item {
            padding: 12px 16px;
            margin-bottom: 8px;
            border-radius: 6px;
            font-family: 'Monaco', 'Courier New', monospace;
            font-size: 13px;
            line-height: 1.6;
        }
        .log-success {
            background: #f0f8f4;
            color: #27ae60;
            border-left: 4px solid #27ae60;
        }
        .log-error {
            background: #fdf0f0;
            color: #dc3545;
            border-left: 4px solid #dc3545;
            font-weight: 500;
        }
        .log-warning {
            background: #fffbf0;
            color: #f39c12;
            border-left: 4px solid #f39c12;
        }
        .next-steps {
            background: #e7f3ff;
            border-left: 4px solid #2196F3;
            padding: 20px;
            border-radius: 6px;
            margin-top: 30px;
        }
        .next-steps h3 {
            color: #1976d2;
            margin-bottom: 15px;
        }
        .next-steps ol {
            margin-left: 25px;
        }
        .next-steps li {
            margin: 10px 0;
            color: #333;
        }
        .next-steps code {
            background: white;
            padding: 2px 8px;
            border-radius: 4px;
            font-family: monospace;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 LZT Meat Setup</h1>
            <p>Deployment Diagnostic</p>
        </div>
        
        <div class="content">
            <div class="status-badge <?php echo $status; ?>">
                <?php echo $status === 'success' ? '✅ All Systems Ready' : '⚠️ Review Issues Below'; ?>
            </div>

            <div class="section">
                <h2>Setup Status</h2>
                <?php foreach ($output as $msg): ?>
                    <div class="log-item log-success"><?php echo htmlspecialchars($msg); ?></div>
                <?php endforeach; ?>
                
                <?php if (!empty($errors)): ?>
                    <div style="margin-top: 20px;">
                        <?php foreach ($errors as $err): ?>
                            <div class="log-item log-error"><?php echo htmlspecialchars($err); ?></div>
                        <?php endforeach; ?>
                    </div>
                <?php endif; ?>
            </div>

            <?php if ($status === 'success'): ?>
                <div class="next-steps">
                    <h3>✅ Ready for Production</h3>
                    <ol>
                        <li>Visit: <a href="/" target="_blank">https://lztmeat.com</a> (Frontend)</li>
                        <li>Test API: <a href="/api" target="_blank">https://lztmeat.com/api</a></li>
                        <li><strong>Delete this file:</strong> Delete <code>setup.php</code> from the root via Plesk File Manager</li>
                    </ol>
                </div>
            <?php else: ?>
                <div class="next-steps">
                    <h3>⚠️ Manual Setup Required</h3>
                    <p style="margin-bottom: 15px;">Contact Plesk support or run these commands:</p>
                    <ol>
                        <li><code>cd backend && composer install --no-dev --optimize-autoloader</code></li>
                        <li><code>php artisan key:generate</code></li>
                        <li><code>php artisan migrate --force</code></li>
                        <li><code>chmod -R 777 storage bootstrap/cache</code></li>
                    </ol>
                </div>
            <?php endif; ?>
        </div>
    </div>
</body>
</html>
