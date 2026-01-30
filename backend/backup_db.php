<?php

require_once 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';

$host = env('DB_HOST');
$user = env('DB_USERNAME');
$password = env('DB_PASSWORD');
$database = env('DB_DATABASE');
$date = date('Y-m-d_H-i-s');
$backupName = 'lzt_meat_backup_' . $date . '.sql';
$backupDir = dirname(__FILE__) . '/../backups';
$backupPath = $backupDir . '/' . $backupName;

// Ensure backup directory exists
if (!is_dir($backupDir)) {
    mkdir($backupDir, 0755, true);
}

// Build mysqldump command
$command = sprintf(
    'mysqldump --host=%s --user=%s --password=%s %s > "%s"',
    escapeshellarg($host),
    escapeshellarg($user),
    escapeshellarg($password),
    escapeshellarg($database),
    $backupPath
);

echo "Creating backup: $backupName\n";
echo "Command: $command\n";

$output = [];
$exitCode = 0;
exec($command, $output, $exitCode);

if ($exitCode === 0 && file_exists($backupPath)) {
    $fileSize = filesize($backupPath);
    echo "✅ Backup created successfully!\n";
    echo "   File: $backupName\n";
    echo "   Size: " . number_format($fileSize) . " bytes\n";
} else {
    echo "❌ Backup failed with exit code: $exitCode\n";
    if (!empty($output)) {
        echo "Error output:\n";
        echo implode("\n", $output) . "\n";
    }
}

// List current backups
echo "\n--- Current Backups ---\n";
$backups = glob($backupDir . '/lzt_meat_backup_*.sql');
if ($backups) {
    rsort($backups); // Sort newest first
    foreach ($backups as $backup) {
        $name = basename($backup);
        $size = filesize($backup);
        echo "$name (" . number_format($size) . " bytes)\n";
    }
} else {
    echo "No backups found.\n";
}
