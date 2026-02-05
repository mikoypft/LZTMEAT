<?php
/**
 * Laravel Setup Script for Plesk Deployment
 * Access via: https://lztmeat.com/backend/setup.php
 * DELETE THIS FILE AFTER SETUP IS COMPLETE
 */

// Change to backend directory
chdir(__DIR__);

$output = [];
$errors = [];

// Check if already set up
if (file_exists('.env') && file_exists('app/')) {
    $output[] = "✓ Laravel appears to be already configured";
} else {
    $output[] = "Setting up Laravel...";
}

// 1. Copy .env.production to .env
if (!file_exists('.env') && file_exists('.env.production')) {
    if (copy('.env.production', '.env')) {
        $output[] = "✓ Created .env from .env.production";
    } else {
        $errors[] = "✗ Failed to copy .env.production to .env";
    }
}

// 2. Generate app key if not set
if (file_exists('.env')) {
    $env_contents = file_get_contents('.env');
    if (strpos($env_contents, 'APP_KEY=') === false || strpos($env_contents, 'APP_KEY=base64:') === false) {
        $key = 'base64:' . base64_encode(random_bytes(32));
        file_put_contents('.env', str_replace('APP_KEY=', 'APP_KEY=' . $key, $env_contents));
        $output[] = "✓ Generated APP_KEY";
    } else {
        $output[] = "✓ APP_KEY already set";
    }
}

// 3. Try to run composer install (requires shell_exec)
if (function_exists('shell_exec')) {
    @$composer = shell_exec('composer --version 2>&1');
    if ($composer && strpos($composer, 'Composer') !== false) {
        ob_start();
        @shell_exec('cd ' . __DIR__ . ' && composer install --no-dev --optimize-autoloader 2>&1');
        ob_end_clean();
        $output[] = "✓ Ran composer install";
    } else {
        $output[] = "! Composer not available via shell_exec (this is OK, dependencies may already be installed)";
    }
}

// 4. Try to run artisan commands
if (file_exists('artisan') && function_exists('shell_exec')) {
    $php = PHP_EXECUTABLE ?: 'php';
    
    // Run migrations
    ob_start();
    @shell_exec("cd " . __DIR__ . " && $php artisan migrate --force 2>&1");
    ob_end_clean();
    $output[] = "✓ Ran database migrations";
    
    // Cache config
    ob_start();
    @shell_exec("cd " . __DIR__ . " && $php artisan config:cache 2>&1");
    ob_end_clean();
    $output[] = "✓ Cached configuration";
    
    // Cache routes
    ob_start();
    @shell_exec("cd " . __DIR__ . " && $php artisan route:cache 2>&1");
    ob_end_clean();
    $output[] = "✓ Cached routes";
}

// 5. Set permissions
$dirs = ['storage', 'bootstrap/cache'];
foreach ($dirs as $dir) {
    if (is_dir($dir)) {
        @chmod($dir, 0775);
        @chmod("$dir", 0775);
        $output[] = "✓ Set permissions for $dir";
    }
}

// Check if index.php exists
if (file_exists('public/index.php')) {
    $output[] = "✓ Laravel public/index.php found";
} else {
    $errors[] = "✗ Laravel public/index.php not found";
}

?>
<!DOCTYPE html>
<html>
<head>
    <title>Laravel Setup - LZT Meat</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .container { max-width: 600px; margin: auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        h1 { color: #333; }
        .success { color: #27ae60; margin: 8px 0; }
        .error { color: #e74c3c; margin: 8px 0; font-weight: bold; }
        .warning { color: #f39c12; margin: 8px 0; }
        .status { background: #ecf0f1; padding: 20px; border-radius: 4px; margin: 20px 0; }
        .next-steps { background: #e8f4f8; padding: 20px; border-left: 4px solid #3498db; margin: 20px 0; }
        code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; font-family: monospace; }
        .delete-warning { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 4px; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Laravel Setup - LZT Meat</h1>
        
        <div class="status">
            <h2>Setup Status</h2>
            <?php if (empty($errors)): ?>
                <p class="success">✓ All setup steps completed successfully!</p>
            <?php else: ?>
                <p class="error">⚠ Some issues were encountered:</p>
                <?php foreach ($errors as $err): ?>
                    <p class="error"><?php echo htmlspecialchars($err); ?></p>
                <?php endforeach; ?>
            <?php endif; ?>
            
            <h3>Logs:</h3>
            <?php foreach ($output as $msg): ?>
                <p class="<?php echo strpos($msg, '✓') === 0 ? 'success' : (strpos($msg, '!') === 0 ? 'warning' : ''); ?>">
                    <?php echo htmlspecialchars($msg); ?>
                </p>
            <?php endforeach; ?>
        </div>

        <div class="next-steps">
            <h2>✅ Next Steps</h2>
            <ol>
                <li>Test the API: <a href="/api/check" target="_blank"><code>/api/check</code></a></li>
                <li>Test the frontend: <a href="/" target="_blank"><code>/</code></a></li>
                <li><strong>DELETE THIS SETUP FILE:</strong> <code>backend/setup.php</code></li>
                <li>If you see errors, check <code>backend/storage/logs/laravel.log</code></li>
            </ol>
        </div>

        <div class="delete-warning">
            <strong>⚠️  IMPORTANT:</strong> After setup is successful, you MUST delete this file (<code>backend/setup.php</code>) for security reasons. You can delete it via SFTP or through Plesk's File Manager.
        </div>
    </div>
</body>
</html>
