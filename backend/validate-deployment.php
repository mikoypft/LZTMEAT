<?php
/**
 * Pre-deployment Validation Script
 * Checks all required API endpoints and database tables before deployment
 * Run this before pushing to production
 */

ini_set('display_errors', 1);
error_reporting(E_ALL);

// Load environment
$envFile = __DIR__ . '/.env.production';
if (!file_exists($envFile)) {
    $envFile = __DIR__ . '/.env';
}

if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos($line, '=') !== false && strpos($line, '#') !== 0) {
            list($key, $value) = explode('=', $line, 2);
            $_ENV[trim($key)] = trim($value, '\'"');
        }
    }
}

// Connect to database
try {
    $pdo = new PDO(
        'mysql:host=' . ($_ENV['DB_HOST'] ?? 'localhost') . 
        ';port=' . ($_ENV['DB_PORT'] ?? '3306'),
        $_ENV['DB_USERNAME'] ?? 'lztmeat',
        $_ENV['DB_PASSWORD'] ?? 'Lztmeat@2026'
    );
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "✓ Database connection successful\n";
} catch (Exception $e) {
    echo "✗ Database connection failed: " . $e->getMessage() . "\n";
    exit(1);
}

// Check required tables
$requiredTables = [
    'users',
    'stores',
    'products',
    'categories',
    'sales',
    'sales_items',
    'ingredients',
    'inventory',
    'production',
    'transfers',
    'system_history',
    'discount_settings',
    'suppliers',
    'stock_adjustments',
];

echo "\nValidating database tables:\n";
$missingTables = [];

foreach ($requiredTables as $table) {
    $stmt = $pdo->query("SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA='" . ($_ENV['DB_DATABASE'] ?? 'lztmeat_admin') . "' AND TABLE_NAME='$table'");
    $exists = $stmt->fetchColumn() > 0;
    
    if ($exists) {
        echo "✓ $table\n";
    } else {
        echo "✗ $table (MISSING)\n";
        $missingTables[] = $table;
    }
}

if(!empty($missingTables)) {
    echo "\nWarning: Missing tables: " . implode(', ', $missingTables) . "\n";
    echo "Run: php backend/setup-database.php\n";
}

// Load backend/index.php and check for required endpoints
echo "\nValidating API endpoints:\n";

$routes = [];
require __DIR__ . '/index.php';

$requiredEndpoints = [
    'GET /api/health',
    'GET /api/products',
    'POST /api/products',
    'GET /api/categories',
    'GET /api/stores',
    'GET /api/sales',
    'GET /api/inventory',
    'GET /api/ingredients',
    'GET /api/production',
    'GET /api/transfers',
    'GET /api/users',
    'GET /api/suppliers',
    'GET /api/history',
    'GET /api/discount-settings',
    'PUT /api/discount-settings',
    'GET /api/auth/profile',
];

$missingEndpoints = [];

foreach ($requiredEndpoints as $endpoint) {
    // Check exact match
    if (isset($routes[$endpoint])) {
        echo "✓ $endpoint\n";
    } else {
        // Check if dynamic route exists
        $pattern = preg_replace('/{[^}]+}/', '([^/]+)', $endpoint);
        $pattern = '#^' . $pattern . '$#';
        
        $found = false;
        foreach (array_keys($routes) as $routePath) {
            $routePattern = preg_replace('/{[^}]+}/', '([^/]+)', $routePath);
            $routePattern = '#^' . $routePattern . '$#';
            if (preg_match($routePattern, $endpoint)) {
                $found = true;
                echo "✓ $endpoint\n";
                break;
            }
        }
        
        if (!$found) {
            echo "✗ $endpoint (MISSING)\n";
            $missingEndpoints[] = $endpoint;
        }
    }
}

if (!empty($missingEndpoints)) {
    echo "\nError: Missing endpoints:\n";
    foreach ($missingEndpoints as $endpoint) {
        echo "  - $endpoint\n";
    }
    exit(1);
}

// Check critical columns in key tables
echo "\nValidating critical database columns:\n";

$columnChecks = [
    'users' => ['id', 'username', 'full_name', 'password', 'role'],
    'products' => ['id', 'name', 'category_id', 'price'],
    'sales' => ['id', 'store_id', 'user_id', 'subtotal'],
    'discount_settings' => ['id', 'wholesale_min_units', 'discount_type'],
    'system_history' => ['id', 'action', 'entity', 'user_id'],
];

$missingColumns = [];

foreach ($columnChecks as $table => $columns) {
    foreach ($columns as $column) {
        try {
            $stmt = $pdo->query("SHOW COLUMNS FROM $table LIKE '$column'");
            $result = $stmt->fetch();
            if ($result) {
                echo "✓ $table.$column\n";
            } else {
                echo "✗ $table.$column (MISSING)\n";
                $missingColumns[] = "$table.$column";
            }
        } catch (Exception $e) {
            echo "✗ $table.$column (ERROR: " . $e->getMessage() . ")\n";
            $missingColumns[] = "$table.$column";
        }
    }
}

if (!empty($missingColumns)) {
    echo "\nWarning: Missing columns: " . implode(', ', $missingColumns) . "\n";
}

echo "\n========================================\n";

if (empty($missingEndpoints) && empty($missingColumns)) {
    echo "✓ ALL VALIDATIONS PASSED - Ready to deploy!\n";
    exit(0);
} else {
    echo "✗ VALIDATION FAILED - Fix issues before pushing\n";
    exit(1);
}
