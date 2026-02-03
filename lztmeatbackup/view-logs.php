<?php
/**
 * Log Viewer - View Laravel logs in browser
 * 
 * INSTRUCTIONS:
 * 1. Upload this file to httpdocs/
 * 2. Visit: https://lztmeat.com/view-logs.php
 * 3. DELETE this file after viewing!
 */

header('Content-Type: text/html; charset=utf-8');

$logFile = __DIR__ . '/api/storage/logs/laravel.log';

if (!file_exists($logFile)) {
    die('Log file not found at: ' . $logFile);
}

$logContent = file_get_contents($logFile);
$lines = array_reverse(explode("\n", $logContent));

?>
<!DOCTYPE html>
<html>
<head>
    <title>Laravel Logs</title>
    <style>
        body { font-family: monospace; background: #1e1e1e; color: #00ff00; padding: 20px; }
        .log-entry { margin: 10px 0; padding: 10px; background: #2d2d2d; border-left: 3px solid #666; }
        .error { border-left-color: #ff0000; color: #ff6b6b; }
        .info { border-left-color: #0088ff; }
        .warning { border-left-color: #ffaa00; color: #ffcc66; }
        h1 { color: #00ffff; }
        .delete-btn { background: #ff0000; color: white; padding: 10px 20px; border: none; cursor: pointer; margin: 10px 0; }
    </style>
</head>
<body>
    <h1>Laravel Error Logs (Last 50 entries)</h1>
    <p>Showing most recent logs first...</p>
    
    <div style="background: #ff0000; color: white; padding: 10px; margin: 10px 0;">
        ⚠️ IMPORTANT: Delete this file when done for security!
    </div>

    <?php
    $count = 0;
    foreach ($lines as $line) {
        if (trim($line) === '') continue;
        if ($count++ > 50) break;
        
        $class = 'log-entry';
        if (strpos($line, 'Error') !== false || strpos($line, 'Exception') !== false) {
            $class .= ' error';
        } elseif (strpos($line, 'Warning') !== false) {
            $class .= ' warning';
        } elseif (strpos($line, 'info') !== false) {
            $class .= ' info';
        }
        
        echo "<div class='$class'>" . htmlspecialchars($line) . "</div>";
    }
    ?>

    <form method="POST" style="margin-top: 20px;">
        <button type="submit" name="delete" class="delete-btn">🗑️ Delete this log viewer</button>
    </form>

    <?php
    if (isset($_POST['delete'])) {
        if (unlink(__FILE__)) {
            echo '<p style="color: #00ff00; background: #003300; padding: 10px;">✅ This script has been deleted!</p>';
        }
    }
    ?>
</body>
</html>
