<?php
/**
 * Laravel Setup Script for Plesk Deployment
 * Access via: https://lztmeat.com/backend/setup.php
 * DELETE THIS FILE AFTER SETUP IS COMPLETE
 */

// Suppress errors initially
error_reporting(E_ALL);
ini_set('display_errors', 0);

// Change to backend directory
$baseDir = __DIR__;
chdir($baseDir);

$output = [];
$errors = [];
$success = true;

try {
    // 1. Copy .env.production to .env
    if (!file_exists('.env') && file_exists('.env.production')) {
        if (@copy('.env.production', '.env')) {
            $output[] = "✓ Created .env from .env.production";
        } else {
            $errors[] = "Failed to copy .env.production to .env";
            $success = false;
        }
    } elseif (file_exists('.env')) {
        $output[] = "✓ .env already exists";
    }

    // 2. Generate app key if not set
    if (file_exists('.env')) {
        $env_contents = file_get_contents('.env');
        
        // Check if APP_KEY needs to be generated
        if (strpos($env_contents, 'APP_KEY=base64:') === false) {
            $key = 'base64:' . base64_encode(random_bytes(32));
            $env_contents = preg_replace('/APP_KEY=.*/', 'APP_KEY=' . $key, $env_contents);
            if (file_put_contents('.env', $env_contents)) {
                $output[] = "✓ Generated APP_KEY";
            } else {
                $errors[] = "Failed to set APP_KEY in .env";
                $success = false;
            }
        } else {
            $output[] = "✓ APP_KEY already set";
        }
    }

    // 3. Check Laravel structure
    if (file_exists('artisan')) {
        $output[] = "✓ Laravel artisan found";
    } else {
        $errors[] = "Laravel artisan not found - ensure composer dependencies are installed";
        $success = false;
    }

    if (file_exists('public/index.php')) {
        $output[] = "✓ Laravel public/index.php found";
    } else {
        $errors[] = "Laravel public/index.php not found";
        $success = false;
    }

    // 4. Check storage and bootstrap directories
    $dirs = ['storage', 'bootstrap/cache'];
    foreach ($dirs as $dir) {
        if (!is_dir($dir)) {
            @mkdir($dir, 0755, true);
        }
        if (is_dir($dir)) {
            @chmod($dir, 0777);
            $output[] = "✓ Directory $dir ready";
        } else {
            $errors[] = "Cannot access directory $dir";
        }
    }

    // 5. Check database connection
    if (file_exists('.env')) {
        $env = parse_ini_file('.env');
        if (isset($env['DB_DATABASE']) && isset($env['DB_USERNAME'])) {
            $output[] = "✓ Database configured: " . $env['DB_DATABASE'];
        } else {
            $errors[] = "Database credentials not properly set in .env";
        }
    }

    // 6. Try to run artisan migrations if shell_exec is available
    $migration_status = "Not attempted (requires shell_exec)";
    if (function_exists('shell_exec') && function_exists('escapeshellcmd')) {
        $php = PHP_EXECUTABLE ?: 'php';
        $result = @shell_exec("cd " . escapeshellcmd($baseDir) . " && $php artisan migrate --force 2>&1");
        if ($result !== null && strpos($result, 'error') === false) {
            $migration_status = "Attempted successfully";
            $output[] = "✓ Attempted database migrations";
        } else {
            $migration_status = "Failed or skipped - may need manual attention";
        }
    }

} catch (Exception $e) {
    $errors[] = "Error: " . $e->getMessage();
    $success = false;
}

$status = $success && empty($errors) ? "success" : "warning";

?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Laravel Setup - LZT Meat</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container { 
            max-width: 700px;
            width: 100%;
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            padding: 40px;
        }
        h1 { 
            color: #333;
            margin-bottom: 10px;
            font-size: 28px;
        }
        .subtitle {
            color: #666;
            margin-bottom: 30px;
            font-size: 14px;
        }
        .status-badge {
            display: inline-block;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: 600;
            margin-bottom: 20px;
            font-size: 13px;
        }
        .status-badge.success {
            background: #d4edda;
            color: #155724;
        }
        .status-badge.warning {
            background: #fff3cd;
            color: #856404;
        }
        .logs {
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 6px;
            padding: 20px;
            margin: 20px 0;
            font-family: 'Monaco', 'Courier New', monospace;
            font-size: 13px;
            max-height: 400px;
            overflow-y: auto;
        }
        .log-line {
            margin: 6px 0;
            line-height: 1.5;
        }
        .log-success { color: #28a745; }
        .log-error { color: #dc3545; font-weight: bold; }
        .steps {
            background: #e7f3ff;
            border-left: 4px solid #2196F3;
            padding: 20px;
            border-radius: 4px;
            margin: 20px 0;
        }
        .steps h3 {
            color: #1976d2;
            margin-bottom: 12px;
            font-size: 16px;
        }
        .steps ol {
            margin-left: 20px;
        }
        .steps li {
            margin: 8px 0;
            color: #333;
            font-size: 14px;
        }
        .steps code {
            background: #fff;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: monospace;
            font-size: 12px;
        }
        .warning-box {
            background: #fff3cd;
            border: 1px solid #ffc107;
            border-radius: 6px;
            padding: 15px;
            margin-top: 20px;
            color: #856404;
        }
        .warning-box strong {
            display: block;
            margin-bottom: 10px;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Laravel Setup</h1>
        <p class="subtitle">LZT Meat - Plesk Deployment</p>
        
        <div class="status-badge <?php echo $status; ?>">
            <?php echo $status === 'success' ? '✓ Setup Complete' : '⚠ Review Required'; ?>
        </div>

        <div class="logs">
            <div style="margin-bottom: 10px; font-weight: bold; color: #333;">Setup Logs:</div>
            <?php foreach ($output as $msg): ?>
                <div class="log-line log-success"><?php echo htmlspecialchars($msg); ?></div>
            <?php endforeach; ?>
            
            <?php if (!empty($errors)): ?>
                <div style="margin-top: 15px; border-top: 1px solid #ddd; padding-top: 15px;">
                    <?php foreach ($errors as $err): ?>
                        <div class="log-line log-error"><?php echo htmlspecialchars($err); ?></div>
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>
        </div>

        <?php if ($success): ?>
            <div class="steps">
                <h3>✅ Next Steps</h3>
                <ol>
                    <li>Test the frontend: <a href="/" target="_blank">https://lztmeat.com</a></li>
                    <li>Test the API: <a href="/api" target="_blank">https://lztmeat.com/api</a></li>
                    <li><strong>Delete this setup file:</strong> Use Plesk File Manager to delete <code>backend/setup.php</code></li>
                </ol>
            </div>
        <?php else: ?>
            <div class="steps">
                <h3>⚠️ Manual Setup Required</h3>
                <p style="margin-bottom: 15px;">Please run these commands via Plesk Terminal or through a paid support request:</p>
                <ol>
                    <li><code>cd /backend</code></li>
                    <li><code>composer install --no-dev --optimize-autoloader</code></li>
                    <li><code>cp .env.production .env</code></li>
                    <li><code>php artisan key:generate</code></li>
                    <li><code>php artisan migrate --force</code></li>
                    <li><code>php artisan config:cache</code></li>
                    <li><code>php artisan route:cache</code></li>
                    <li><code>chmod -R 777 storage bootstrap/cache</code></li>
                </ol>
            </div>
        <?php endif; ?>

        <div class="warning-box">
            <strong>⚠️ IMPORTANT - Delete This File:</strong>
            After setup is successful, delete <code>backend/setup.php</code> from your server via Plesk's File Manager for security reasons.
        </div>
    </div>
</body>
</html>

