<?php

/**
 * LZT Meat Simple API Server
 * A lightweight API server that directly handles requests
 */

// Debug mode - always show errors
error_reporting(E_ALL);
ini_set('display_errors', '1');

// Set CORS headers for all requests
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-User-ID, X-User-Name');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json; charset=utf-8');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Log the request for debugging
$logFile = __DIR__ . '/api_requests.log';
$logMsg = date('Y-m-d H:i:s') . " - " . $_SERVER['REQUEST_METHOD'] . " " . $_SERVER['REQUEST_URI'] . "\n";
error_log($logMsg, 3, $logFile);

// Load environment variables (prefer .env.production for Plesk, fallback to .env for local dev)
$envFile = __DIR__ . '/.env.production';
if (!file_exists($envFile)) {
    $envFile = __DIR__ . '/.env';
}

$envLoaded = false;
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        // Skip comments
        if (strpos(trim($line), '#') === 0 || trim($line) === '') continue;
        
        if (strpos($line, '=') !== false) {
            list($key, $value) = explode('=', $line, 2);
            $key = trim($key);
            $value = trim($value);
            // Remove quotes if present
            $value = preg_replace('/^["\']|["\']$/', '', $value);
            $_ENV[$key] = $value;
            // Also set via putenv for getenv()
            putenv("$key=$value");
        }
    }
    $envLoaded = true;
} else {
    // Log warning - no env file found
    error_log(date('Y-m-d H:i:s') . " - WARNING: No .env or .env.production found in " . __DIR__ . " - using defaults", 3, __DIR__ . '/env_not_found.log');
}

// Database configuration - use env vars, with sensible defaults
$dbHost = !empty($_ENV['DB_HOST']) ? trim($_ENV['DB_HOST']) : (getenv('DB_HOST') ?: 'localhost');
$dbPort = !empty($_ENV['DB_PORT']) ? trim($_ENV['DB_PORT']) : (getenv('DB_PORT') ?: '3306');
$dbName = !empty($_ENV['DB_DATABASE']) ? trim($_ENV['DB_DATABASE']) : (getenv('DB_DATABASE') ?: 'lztmeat_admin');
$dbUser = !empty($_ENV['DB_USERNAME']) ? trim($_ENV['DB_USERNAME']) : (getenv('DB_USERNAME') ?: 'lztmeat');
$dbPass = !empty($_ENV['DB_PASSWORD']) ? trim($_ENV['DB_PASSWORD']) : (getenv('DB_PASSWORD') ?: 'Lztmeat@2026');

// EMERGENCY OVERRIDE: Force production credentials on Plesk if old values detected
// This happens when env file isn't being read properly
if ($dbUser === 'root' || $dbName === 'lzt_meat' || empty($dbPass)) {
    $dbHost = 'localhost';
    $dbPort = '3306';
    $dbName = 'lztmeat_admin';
    $dbUser = 'lztmeat';
    $dbPass = 'Lztmeat@2026';
}

// Log what env was loaded for debugging
error_log(date('Y-m-d H:i:s') . " - Backend API starting\n" .
          "Env loaded: $envLoaded from: $envFile\n" .
          "DB config: host=$dbHost, port=$dbPort, db=$dbName, user=$dbUser\n" .
          "_ENV keys: " . implode(', ', array_keys($_ENV)) . "\n", 
          3, __DIR__ . '/env_debug.log');

// Create database connection
try {
    $pdo = new PDO(
        "mysql:host=$dbHost;port=$dbPort;dbname=$dbName;charset=utf8mb4",
        $dbUser,
        $dbPass,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]
    );
    $dbConnected = true;
    $dbError = null;
    
    // Auto-create product_default_ingredients table if it doesn't exist
    try {
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS product_default_ingredients (
                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                product_id BIGINT UNSIGNED NOT NULL,
                ingredient_id BIGINT UNSIGNED NOT NULL,
                quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
                created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
                FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE,
                UNIQUE KEY unique_product_ingredient (product_id, ingredient_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        ");
    } catch (Exception $tableErr) {
        error_log('product_default_ingredients table creation: ' . $tableErr->getMessage());
    }

    // Auto-create stock_adjustments table if it doesn't exist
    try {
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS stock_adjustments (
                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                ingredient_id BIGINT UNSIGNED NOT NULL,
                ingredient_name VARCHAR(255) NOT NULL,
                ingredient_code VARCHAR(255) NOT NULL,
                type ENUM('add', 'remove') NOT NULL,
                quantity DECIMAL(10,2) NOT NULL,
                previous_stock DECIMAL(10,2) NOT NULL,
                new_stock DECIMAL(10,2) NOT NULL,
                unit VARCHAR(50) NOT NULL,
                reason TEXT NULL,
                user_id BIGINT UNSIGNED NULL,
                user_name VARCHAR(255) NULL,
                ip_address VARCHAR(45) NULL,
                created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_ingredient_id (ingredient_id),
                INDEX idx_user_id (user_id),
                INDEX idx_type (type),
                INDEX idx_created_at (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        ");
    } catch (Exception $tableErr) {
        error_log('stock_adjustments table creation: ' . $tableErr->getMessage());
    }

    // Auto-create system_history table if it doesn't exist
    try {
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS system_history (
                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                action VARCHAR(255) NOT NULL,
                entity VARCHAR(255) NULL,
                entity_id VARCHAR(255) NULL,
                details JSON NULL,
                user_id BIGINT UNSIGNED NULL,
                created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_created_at (created_at),
                INDEX idx_entity (entity),
                INDEX idx_user_id (user_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        ");
    } catch (Exception $tableErr) {
        error_log('system_history table creation: ' . $tableErr->getMessage());
    }

    // Auto-create transactions table if it doesn't exist (for Cash In/Cash Out)
    try {
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS transactions (
                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                type ENUM('Cash In', 'Cash Out') NOT NULL,
                amount DECIMAL(12,2) NOT NULL DEFAULT 0,
                description VARCHAR(500) NULL,
                category VARCHAR(255) NULL,
                reference VARCHAR(255) NULL,
                created_by VARCHAR(255) NULL,
                created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_type (type),
                INDEX idx_created_at (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        ");
        // Add source_transaction_id column if it doesn't exist yet
        $pdo->exec("
            ALTER TABLE transactions
            ADD COLUMN IF NOT EXISTS source_transaction_id BIGINT UNSIGNED NULL DEFAULT NULL
        ");
        // Add shift column if it doesn't exist yet
        try { $pdo->exec("ALTER TABLE transactions ADD COLUMN IF NOT EXISTS shift ENUM('AM','PM') NULL DEFAULT NULL"); } catch(Exception $e) { /* ignore */ }
    } catch (Exception $tableErr) {
        error_log('transactions table creation: ' . $tableErr->getMessage());
    }

    // Auto-create product_mix_inventory table for storing mixed products
    try {
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS product_mix_inventory (
                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                product_mix_category_id BIGINT UNSIGNED NOT NULL,
                product_mix_name VARCHAR(255) NULL,
                weight DECIMAL(10,2) NOT NULL DEFAULT 0,
                unit VARCHAR(50) NOT NULL DEFAULT 'kg',
                stock DECIMAL(10,2) NOT NULL DEFAULT 0,
                cost DECIMAL(10,2) NOT NULL DEFAULT 0,
                production_record_id BIGINT UNSIGNED NULL,
                created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_category (product_mix_category_id),
                INDEX idx_production (production_record_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        ");
        // Make product_mix_name nullable for existing tables
        $pdo->exec("ALTER TABLE product_mix_inventory MODIFY COLUMN product_mix_name VARCHAR(255) NULL");
    } catch (Exception $tableErr) {
        error_log('product_mix_inventory table creation: ' . $tableErr->getMessage());
    }

    // Auto-create raw_product_inventory table for storing raw packed items ready for cooking
    try {
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS raw_product_inventory (
                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                product_mix_category_id BIGINT UNSIGNED NOT NULL,
                product_mix_name VARCHAR(255) NULL,
                weight DECIMAL(10,2) NOT NULL DEFAULT 0,
                unit VARCHAR(50) NOT NULL DEFAULT 'kg',
                stock DECIMAL(10,2) NOT NULL DEFAULT 0,
                cost DECIMAL(10,2) NOT NULL DEFAULT 0,
                production_record_id BIGINT UNSIGNED NULL,
                created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_category (product_mix_category_id),
                INDEX idx_production (production_record_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        ");
    } catch (Exception $tableErr) {
        error_log('raw_product_inventory table creation: ' . $tableErr->getMessage());
    }

    // Auto-create production_outputs table for tracking produced products
    try {
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS production_outputs (
                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                production_record_id BIGINT UNSIGNED NOT NULL,
                product_id BIGINT UNSIGNED NOT NULL,
                product_name VARCHAR(255) NOT NULL,
                quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
                unit VARCHAR(50) NOT NULL,
                created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_production (production_record_id),
                INDEX idx_product (product_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        ");
    } catch (Exception $tableErr) {
        error_log('production_outputs table creation: ' . $tableErr->getMessage());
    }

    // Add new columns to production_records table for mixing/cooking phases
    try {
        // Make product_id nullable for mix productions
        $pdo->exec("ALTER TABLE production_records MODIFY COLUMN product_id BIGINT UNSIGNED NULL");
        $pdo->exec("ALTER TABLE production_records ADD COLUMN IF NOT EXISTS product_mix_category_id BIGINT UNSIGNED NULL AFTER product_id");
        $pdo->exec("ALTER TABLE production_records ADD COLUMN IF NOT EXISTS product_mix_category_name VARCHAR(255) NULL AFTER product_mix_category_id");
        $pdo->exec("ALTER TABLE production_records ADD COLUMN IF NOT EXISTS phase ENUM('mixing', 'packing', 'cooking', 'completed') NOT NULL DEFAULT 'mixing' AFTER status");
        // Update ENUM if column already exists to include 'packing'
        try { $pdo->exec("ALTER TABLE production_records MODIFY COLUMN phase ENUM('mixing', 'packing', 'cooking', 'completed') NOT NULL DEFAULT 'mixing'"); } catch(Exception $e2) {}
        $pdo->exec("ALTER TABLE production_records ADD COLUMN IF NOT EXISTS mix_weight DECIMAL(10,2) NULL AFTER quantity");
        $pdo->exec("ALTER TABLE production_records ADD COLUMN IF NOT EXISTS mix_used DECIMAL(10,2) NULL AFTER mix_weight");
        $pdo->exec("ALTER TABLE production_records ADD COLUMN IF NOT EXISTS raw_packed_items DECIMAL(10,2) NULL AFTER mix_used");
        try { $pdo->exec("ALTER TABLE production_records MODIFY COLUMN raw_packed_items DECIMAL(10,2) NULL"); } catch(Exception $e2) {}
    } catch (Exception $tableErr) {
        error_log('production_records columns addition: ' . $tableErr->getMessage());
    }

    // Ensure quantity columns are DECIMAL to support fractional values
    try { $pdo->exec("ALTER TABLE inventory MODIFY COLUMN quantity DECIMAL(10,2) NOT NULL DEFAULT 0"); } catch(Exception $e) {}
    try { $pdo->exec("ALTER TABLE production_records MODIFY COLUMN quantity DECIMAL(10,2) NOT NULL DEFAULT 0"); } catch(Exception $e) {}
    try { $pdo->exec("ALTER TABLE transfers MODIFY COLUMN quantity DECIMAL(10,2) NOT NULL DEFAULT 0"); } catch(Exception $e) {}
    try { $pdo->exec("ALTER TABLE transfers ADD COLUMN IF NOT EXISTS discrepancy DECIMAL(10,2) DEFAULT NULL"); } catch(Exception $e) {}
    try { $pdo->exec("ALTER TABLE transfers ADD COLUMN IF NOT EXISTS quantity_received DECIMAL(10,2) DEFAULT NULL"); } catch(Exception $e) {}
    try { $pdo->exec("ALTER TABLE transfers ADD COLUMN IF NOT EXISTS discrepancy_reason TEXT DEFAULT NULL"); } catch(Exception $e) {}
    try { $pdo->exec("ALTER TABLE transfers ADD COLUMN IF NOT EXISTS received_by VARCHAR(255) DEFAULT NULL"); } catch(Exception $e) {}
    try { $pdo->exec("ALTER TABLE transfers ADD COLUMN IF NOT EXISTS received_at DATETIME DEFAULT NULL"); } catch(Exception $e) {}
    try { $pdo->exec("ALTER TABLE production_records ADD COLUMN IF NOT EXISTS mixing_discrepancy DECIMAL(10,3) DEFAULT NULL"); } catch(Exception $e) {}
    try { $pdo->exec("ALTER TABLE production_records ADD COLUMN IF NOT EXISTS packing_discrepancy DECIMAL(10,3) DEFAULT NULL"); } catch(Exception $e) {}
    try { $pdo->exec("ALTER TABLE production_records ADD COLUMN IF NOT EXISTS cooking_discrepancy DECIMAL(10,3) DEFAULT NULL"); } catch(Exception $e) {}
    try { $pdo->exec("ALTER TABLE production_records ADD COLUMN IF NOT EXISTS mixing_discrepancy_reason TEXT DEFAULT NULL"); } catch(Exception $e) {}
    try { $pdo->exec("ALTER TABLE production_records ADD COLUMN IF NOT EXISTS packing_discrepancy_reason TEXT DEFAULT NULL"); } catch(Exception $e) {}
    try { $pdo->exec("ALTER TABLE production_records ADD COLUMN IF NOT EXISTS cooking_discrepancy_reason TEXT DEFAULT NULL"); } catch(Exception $e) {}

    // Auto-create sales_discrepancies table
    try {
        $pdo->exec("CREATE TABLE IF NOT EXISTS sales_discrepancies (
            id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
            store_id BIGINT UNSIGNED NULL,
            store_name VARCHAR(255) NOT NULL DEFAULT '',
            product_id VARCHAR(255) NOT NULL DEFAULT '',
            product_name VARCHAR(255) NOT NULL DEFAULT '',
            unit VARCHAR(50) NOT NULL DEFAULT 'kg',
            shift_date DATE NOT NULL,
            shift ENUM('AM','PM') NULL,
            starting_stock DECIMAL(10,3) NOT NULL DEFAULT 0,
            sales_quantity DECIMAL(10,3) NOT NULL DEFAULT 0,
            expected_remaining DECIMAL(10,3) NOT NULL DEFAULT 0,
            reported_remaining DECIMAL(10,3) NOT NULL DEFAULT 0,
            discrepancy_amount DECIMAL(10,3) NOT NULL DEFAULT 0,
            cashier VARCHAR(255) NULL,
            user_id BIGINT UNSIGNED NULL,
            status ENUM('pending','adjusted') NOT NULL DEFAULT 'pending',
            notes TEXT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_sd_store (store_id),
            INDEX idx_sd_date (shift_date),
            INDEX idx_sd_status (status)
        )");
    } catch(Exception $e) { error_log('sales_discrepancies table: ' . $e->getMessage()); }

    // Auto-create discrepancy_adjustments table
    try {
        $pdo->exec("CREATE TABLE IF NOT EXISTS discrepancy_adjustments (
            id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
            sales_discrepancy_id BIGINT UNSIGNED NOT NULL,
            store_name VARCHAR(255) NOT NULL DEFAULT '',
            product_id VARCHAR(255) NULL,
            product_name VARCHAR(255) NOT NULL DEFAULT '',
            quantity DECIMAL(10,3) NOT NULL DEFAULT 0,
            unit VARCHAR(50) NOT NULL DEFAULT 'kg',
            unit_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
            total_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
            cashier VARCHAR(255) NULL,
            user_id BIGINT UNSIGNED NULL,
            notes TEXT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_da_discrepancy (sales_discrepancy_id),
            INDEX idx_da_cashier (cashier),
            INDEX idx_da_created (created_at)
        )");
    } catch(Exception $e) { error_log('discrepancy_adjustments table: ' . $e->getMessage()); }

    // Auto-create eod_stock_counts table
    try {
        $pdo->exec("CREATE TABLE IF NOT EXISTS eod_stock_counts (
            id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
            user_id BIGINT UNSIGNED NULL,
            user_name VARCHAR(255) NOT NULL DEFAULT '',
            store_id BIGINT UNSIGNED NULL,
            store_name VARCHAR(255) NOT NULL DEFAULT '',
            shift_date DATE NOT NULL,
            shift ENUM('AM','PM') NULL,
            notes TEXT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_eod_user (user_id),
            INDEX idx_eod_store (store_id),
            INDEX idx_eod_date (shift_date)
        )");
    } catch(Exception $e) { error_log('eod_stock_counts table: ' . $e->getMessage()); }

    // Auto-create eod_stock_count_items table
    try {
        $pdo->exec("CREATE TABLE IF NOT EXISTS eod_stock_count_items (
            id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
            eod_count_id BIGINT UNSIGNED NOT NULL,
            product_id VARCHAR(255) NOT NULL DEFAULT '',
            product_name VARCHAR(255) NOT NULL DEFAULT '',
            unit VARCHAR(50) NOT NULL DEFAULT 'kg',
            expected_qty DECIMAL(10,3) NOT NULL DEFAULT 0,
            actual_qty DECIMAL(10,3) NOT NULL DEFAULT 0,
            discrepancy DECIMAL(10,3) NOT NULL DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_eod_items_count (eod_count_id)
        )");
    } catch(Exception $e) { error_log('eod_stock_count_items table: ' . $e->getMessage()); }

    // Rename 'Main Store' to 'Amparo Store' if it hasn't been renamed yet
    try {
        $pdo->exec("UPDATE stores SET name = 'Amparo Store' WHERE name = 'Main Store'");
    } catch (Exception $tableErr) {
        error_log('store rename: ' . $tableErr->getMessage());
    }
} catch (PDOException $e) {
    $dbConnected = false;
    $dbError = $e->getMessage();
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    
    // Log error to file for debugging
    $logFile = __DIR__ . '/database_error.log';
    $errorMsg = date('Y-m-d H:i:s') . " - PDO Error: " . $e->getMessage() . "\n";
    $errorMsg .= "Host: $dbHost, Port: $dbPort, Database: $dbName, User: $dbUser\n";
    $errorMsg .= "Env file checked: " . (file_exists('.env') ? '.env' : (file_exists('.env.production') ? '.env.production' : 'NONE FOUND')) . "\n";
    $errorMsg .= "CWD: " . getcwd() . "\n";
    error_log($errorMsg, 3, $logFile);
    
    // Return error response
    $response = [
        'error' => 'Database connection failed',
        'message' => $e->getMessage(),
        'code' => $e->getCode(),
        'details' => [
            'host' => $dbHost,
            'port' => $dbPort,
            'database' => $dbName,
            'user' => $dbUser,
        ]
    ];
    
    echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    exit;
}

// Get the request URI and method
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];

// Get JSON body for POST/PUT requests
$body = json_decode(file_get_contents('php://input'), true) ?? [];

// Log a system history entry (best-effort)
function logSystemHistory($pdo, $action, $entity = null, $entityId = null, $details = null, $userId = null) {
    try {
        // Auto-detect performing user from request header when not explicitly supplied
        if ($userId === null) {
            $userId = isset($_SERVER['HTTP_X_USER_ID']) && $_SERVER['HTTP_X_USER_ID'] !== ''
                ? (int)$_SERVER['HTTP_X_USER_ID']
                : null;
        }
        // Embed performer name in details for resilience (shows even for deleted users)
        if (is_array($details) && isset($_SERVER['HTTP_X_USER_NAME']) && $_SERVER['HTTP_X_USER_NAME'] !== '') {
            $details['_performedBy'] = $_SERVER['HTTP_X_USER_NAME'];
        }
        $stmt = $pdo->prepare('INSERT INTO system_history (action, entity, entity_id, details, user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())');
        $stmt->execute([
            $action,
            $entity,
            $entityId,
            $details ? json_encode($details) : null,
            $userId,
        ]);
    } catch (Exception $e) {
        error_log('system_history insert failed: ' . $e->getMessage());
    }
}

// Simple router
$routes = [
    'GET /' => function() {
        return [
            'message' => 'LZT Meat API Server Running',
            'status' => 'online',
            'version' => '1.0.0',
        ];
    },
    
    'GET /api/health' => function() use ($pdo, $dbConnected, $dbError, $dbHost, $dbPort, $dbName, $dbUser) {
        if (!$dbConnected) {
            http_response_code(500);
            return [
                'status' => 'unhealthy',
                'database' => 'disconnected',
                'error' => $dbError,
                'config' => [
                    'host' => $dbHost,
                    'port' => $dbPort,
                    'database' => $dbName,
                    'user' => $dbUser,
                ]
            ];
        }
        
        try {
            $result = $pdo->query('SELECT 1')->fetch();
            return [
                'status' => 'healthy',
                'database' => 'connected',
                'timestamp' => date('Y-m-d H:i:s'),
            ];
        } catch (Exception $e) {
            http_response_code(500);
            return [
                'status' => 'unhealthy',
                'database' => 'error',
                'error' => $e->getMessage(),
            ];
        }
    },
    
    'GET /api/debug' => function() {
        $envFile = __DIR__ . '/.env';
        if (!file_exists($envFile)) {
            $envFile = __DIR__ . '/.env.production';
        }
        
        return [
            'cwd' => getcwd(),
            'backend_dir' => __DIR__,
            'env_file_checked' => $envFile,
            'env_file_exists' => file_exists($envFile),
            'env_file_readable' => is_readable($envFile),
            'env_vars' => [
                'DB_HOST' => $_ENV['DB_HOST'] ?? 'NOT SET',
                'DB_PORT' => $_ENV['DB_PORT'] ?? 'NOT SET',
                'DB_DATABASE' => $_ENV['DB_DATABASE'] ?? 'NOT SET',
                'DB_USERNAME' => $_ENV['DB_USERNAME'] ?? 'NOT SET',
            ],
            'getenv_DB_HOST' => getenv('DB_HOST') ?: 'NOT SET',
            '_ENV_keys' => array_keys($_ENV),
        ];
    },
    
    'GET /api/debug/fix-mix-inventory' => function() use ($pdo) {
        try {
            // Find production records in cooking phase without inventory
            $stmt = $pdo->query("
                SELECT pr.*, pmc.name as category_name 
                FROM production_records pr
                LEFT JOIN product_mix_categories pmc ON pr.product_mix_category_id = pmc.id
                LEFT JOIN product_mix_inventory pmi ON pmi.production_record_id = pr.id
                WHERE pr.phase IN ('cooking', 'completed') 
                AND pr.product_mix_category_id IS NOT NULL
                AND pmi.id IS NULL
            ");
            $missingRecords = $stmt->fetchAll();
            
            $fixed = [];
            $errors = [];
            
            foreach ($missingRecords as $prod) {
                try {
                    $mixCategoryName = $prod['product_mix_category_name'] ?? $prod['category_name'] ?? 'Unknown Mix';
                    $mixWeight = $prod['mix_weight'] ?? 0;
                    
                    // Calculate cost from initial ingredients
                    $cost = 0;
                    if (!empty($prod['initial_ingredients'])) {
                        $ingredients = json_decode($prod['initial_ingredients'], true);
                        if (is_array($ingredients)) {
                            foreach ($ingredients as $ing) {
                                $cost += ($ing['quantity'] ?? 0) * 10;
                            }
                        }
                    }
                    
                    // Insert missing inventory
                    $insertStmt = $pdo->prepare('
                        INSERT INTO product_mix_inventory (
                            product_mix_category_id,
                            product_mix_name,
                            weight,
                            unit,
                            stock,
                            cost,
                            production_record_id,
                            created_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
                    ');
                    $insertStmt->execute([
                        $prod['product_mix_category_id'],
                        $mixCategoryName,
                        $mixWeight,
                        'kg',
                        $mixWeight,
                        $cost,
                        $prod['id']
                    ]);
                    
                    $fixed[] = [
                        'production_id' => $prod['id'],
                        'batch_number' => $prod['batch_number'],
                        'category_name' => $mixCategoryName,
                        'weight' => (float)$mixWeight
                    ];
                } catch (Exception $e) {
                    $errors[] = [
                        'production_id' => $prod['id'],
                        'error' => $e->getMessage()
                    ];
                }
            }
            
            return [
                'success' => true,
                'found_missing' => count($missingRecords),
                'fixed' => $fixed,
                'errors' => $errors
            ];
        } catch (Exception $e) {
            http_response_code(500);
            return ['error' => 'Failed to fix inventory: ' . $e->getMessage()];
        }
    },
    
    'POST /api/auth/login' => function() use ($pdo, $body) {
        $username = $body['username'] ?? '';
        $password = $body['password'] ?? '';
        
        if (empty($username) || empty($password)) {
            http_response_code(400);
            return ['error' => 'Username and password are required'];
        }
        
        $stmt = $pdo->prepare('SELECT u.*, s.name as store_name FROM users u LEFT JOIN stores s ON u.store_id = s.id WHERE u.username = ?');
        $stmt->execute([$username]);
        $user = $stmt->fetch();
        
        if (!$user) {
            http_response_code(401);
            return ['error' => 'Invalid credentials'];
        }
        
        if (!password_verify($password, $user['password'])) {
            http_response_code(401);
            return ['error' => 'Invalid credentials'];
        }
        
        if (!$user['can_login']) {
            http_response_code(403);
            return ['error' => 'User account is disabled'];
        }
        
        // Parse permissions - handle both JSON string and already decoded
        $permissions = $user['permissions'];
        if (is_string($permissions)) {
            $decoded = json_decode($permissions, true);
            $permissions = is_array($decoded) ? $decoded : [];
        }
        
        return [
            'user' => [
                'id' => (string)$user['id'],
                'username' => $user['username'],
                'fullName' => $user['full_name'],
                'role' => $user['role'],
                'employeeRole' => $user['employee_role'],
                'permissions' => $permissions,
                'storeId' => $user['store_id'] ? (string)$user['store_id'] : null,
                'storeName' => $user['store_name'],
                'canLogin' => (bool)$user['can_login'],
                'shift' => $user['shift'] ?? null,
            ],
        ];
    },
    
    'POST /api/auth/refresh' => function() use ($pdo, $body) {
        $userId = $body['userId'] ?? '';
        
        if (empty($userId)) {
            http_response_code(400);
            return ['error' => 'User ID is required'];
        }
        
        $stmt = $pdo->prepare('SELECT u.*, s.name as store_name FROM users u LEFT JOIN stores s ON u.store_id = s.id WHERE u.id = ?');
        $stmt->execute([$userId]);
        $user = $stmt->fetch();
        
        if (!$user) {
            http_response_code(404);
            return ['error' => 'User not found'];
        }
        
        // Parse permissions
        $permissions = $user['permissions'];
        if (is_string($permissions)) {
            $decoded = json_decode($permissions, true);
            $permissions = is_array($decoded) ? $decoded : [];
        }
        
        return [
            'user' => [
                'id' => (string)$user['id'],
                'username' => $user['username'],
                'fullName' => $user['full_name'],
                'role' => $user['role'],
                'employeeRole' => $user['employee_role'],
                'permissions' => $permissions,
                'storeId' => $user['store_id'] ? (string)$user['store_id'] : null,
                'storeName' => $user['store_name'],
                'canLogin' => (bool)$user['can_login'],
                'shift' => $user['shift'] ?? null,
            ],
        ];
    },
    
    'GET /api/products' => function() use ($pdo) {
        // Ensure discountable column exists
        try {
            $col = $pdo->query("SHOW COLUMNS FROM products LIKE 'discountable'")->fetch();
            if (!$col) {
                $pdo->exec("ALTER TABLE products ADD COLUMN discountable TINYINT(1) NOT NULL DEFAULT 1");
            }
        } catch (Exception $e) { /* ignore */ }

        $stmt = $pdo->query('SELECT p.*, c.name as category FROM products p LEFT JOIN categories c ON p.category_id = c.id ORDER BY p.name');
        $products = $stmt->fetchAll();
        
        return [
            'products' => array_map(function($p) {
                return [
                    'id' => (string)$p['id'],
                    'name' => $p['name'],
                    'sku' => $p['sku'] ?? '',
                    'category' => $p['category'] ?? 'Uncategorized',
                    'price' => (float)$p['price'],
                    'unit' => $p['unit'],
                    'image' => $p['image'],
                    'discountable' => isset($p['discountable']) ? (bool)$p['discountable'] : true,
                    'min_stock_level' => (float)($p['min_stock_level'] ?? 0),
                    'reorder_point' => (float)($p['reorder_point'] ?? 0),
                    'reorder_quantity' => (float)($p['reorder_quantity'] ?? 0),
                ];
            }, $products),
        ];
    },

    'PUT /api/products/{id}/toggle-discount' => function() use ($pdo, $body) {
        $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        preg_match('/\/api\/products\/(\d+)\/toggle-discount/', $uri, $matches);
        $id = $matches[1] ?? null;

        if (empty($id)) {
            return ['error' => 'Product ID is required'];
        }

        try {
            // Ensure discountable column exists
            $col = $pdo->query("SHOW COLUMNS FROM products LIKE 'discountable'")->fetch();
            if (!$col) {
                $pdo->exec("ALTER TABLE products ADD COLUMN discountable TINYINT(1) NOT NULL DEFAULT 1");
            }

            $discountable = isset($body['discountable']) ? (int)(bool)$body['discountable'] : 1;
            $stmt = $pdo->prepare('UPDATE products SET discountable = ?, updated_at = NOW() WHERE id = ?');
            $stmt->execute([$discountable, $id]);

            $stmt = $pdo->prepare('SELECT p.*, c.name as category FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?');
            $stmt->execute([$id]);
            $product = $stmt->fetch();

            if (!$product) {
                return ['error' => 'Product not found'];
            }

            logSystemHistory($pdo, $discountable ? 'Product Discount Enabled' : 'Product Discount Disabled', 'Product', (string)$id, [
                'name' => $product['name'],
                'discountable' => (bool)$discountable,
            ]);

            return [
                'product' => [
                    'id' => (string)$product['id'],
                    'name' => $product['name'],
                    'category' => $product['category'] ?? 'Uncategorized',
                    'price' => (float)$product['price'],
                    'unit' => $product['unit'],
                    'image' => $product['image'],
                    'discountable' => (bool)$product['discountable'],
                ]
            ];
        } catch (Exception $e) {
            http_response_code(500);
            return ['error' => 'Failed to toggle discount: ' . $e->getMessage()];
        }
    },
    
    'POST /api/products' => function() use ($pdo, $body) {
        try {
            // Get category ID from category name
            $categoryId = null;
            if (!empty($body['category'])) {
                $stmt = $pdo->prepare('SELECT id FROM categories WHERE name = ?');
                $stmt->execute([$body['category']]);
                $category = $stmt->fetch();
                $categoryId = $category ? $category['id'] : null;
            }
            
            // Insert new product
            $stmt = $pdo->prepare('INSERT INTO products (name, category_id, unit, price, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())');
            $stmt->execute([
                $body['name'] ?? '',
                $categoryId,
                $body['unit'] ?? 'kg',
                $body['price'] ?? 0,
            ]);
            
            $productId = $pdo->lastInsertId();
            
            // Fetch the created product
            $stmt = $pdo->prepare('SELECT p.*, c.name as category FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?');
            $stmt->execute([$productId]);
            $product = $stmt->fetch();
            
            logSystemHistory($pdo, 'Product Created', 'Product', (string)$productId, [
                'name' => $product['name'],
                'category' => $product['category'] ?? 'Uncategorized',
                'price' => (float)$product['price'],
            ]);
            
            return [
                'product' => [
                    'id' => (string)$product['id'],
                    'name' => $product['name'],
                    'category' => $product['category'] ?? 'Uncategorized',
                    'price' => (float)$product['price'],
                    'unit' => $product['unit'],
                    'image' => $product['image'],
                ]
            ];
        } catch (Exception $e) {
            return ['error' => 'Failed to create product: ' . $e->getMessage()];
        }
    },
    
    'PUT /api/products/{id}' => function() use ($pdo, $body) {
        $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        preg_match('/\/api\/products\/(\d+)/', $uri, $matches);
        $id = $matches[1] ?? null;
        
        if (empty($id)) {
            return ['error' => 'Product ID is required'];
        }
        
        try {
            // Build update query dynamically based on provided fields
            $updates = [];
            $params = [];
            
            if (isset($body['name'])) {
                $updates[] = 'name = ?';
                $params[] = $body['name'];
            }
            if (isset($body['category'])) {
                // look up category_id by name
                $catStmt = $pdo->prepare('SELECT id FROM categories WHERE name = ? LIMIT 1');
                $catStmt->execute([$body['category']]);
                $catRow = $catStmt->fetch();
                if ($catRow) {
                    $updates[] = 'category_id = ?';
                    $params[] = $catRow['id'];
                }
            }
            if (isset($body['min_stock_level'])) {
                $updates[] = 'min_stock_level = ?';
                $params[] = $body['min_stock_level'];
            }
            if (isset($body['reorder_point'])) {
                $updates[] = 'reorder_point = ?';
                $params[] = $body['reorder_point'];
            }
            if (isset($body['reorder_quantity'])) {
                $updates[] = 'reorder_quantity = ?';
                $params[] = $body['reorder_quantity'];
            }
            if (isset($body['price'])) {
                $updates[] = 'price = ?';
                $params[] = (float)$body['price'];
            }
            
            if (empty($updates)) {
                return ['error' => 'No fields to update'];
            }
            
            $updates[] = 'updated_at = NOW()';
            $params[] = $id;
            
            $sql = 'UPDATE products SET ' . implode(', ', $updates) . ' WHERE id = ?';
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            
            // Fetch the updated product
            $stmt = $pdo->prepare('SELECT p.*, c.name as category FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?');
            $stmt->execute([$id]);
            $product = $stmt->fetch();
            
            if (!$product) {
                return ['error' => 'Product not found'];
            }
            
            logSystemHistory($pdo, 'Product Updated', 'Product', (string)$id, [
                'name' => $product['name'],
            ]);
            
            return [
                'product' => [
                    'id' => (string)$product['id'],
                    'name' => $product['name'],
                    'sku' => $product['sku'] ?? '',
                    'category' => $product['category'] ?? 'Uncategorized',
                    'price' => (float)$product['price'],
                    'unit' => $product['unit'],
                    'image' => $product['image'],
                    'min_stock_level' => (float)($product['min_stock_level'] ?? 0),
                    'reorder_point' => (float)($product['reorder_point'] ?? 0),
                    'reorder_quantity' => (float)($product['reorder_quantity'] ?? 0),
                ]
            ];
        } catch (Exception $e) {
            return ['error' => 'Failed to update product: ' . $e->getMessage()];
        }
    },
    
    'DELETE /api/products/{id}' => function() use ($pdo) {
        $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        $id = substr($uri, strrpos($uri, '/') + 1);
        
        if (empty($id)) {
            return ['error' => 'Product ID is required'];
        }
        
        try {
            // Get product name before deleting
            $nameStmt = $pdo->prepare('SELECT name FROM products WHERE id = ?');
            $nameStmt->execute([$id]);
            $productRow = $nameStmt->fetch();
            
            // Delete related inventory records first
            $stmt = $pdo->prepare('DELETE FROM inventory WHERE product_id = ?');
            $stmt->execute([$id]);
            
            // Delete the product
            $stmt = $pdo->prepare('DELETE FROM products WHERE id = ?');
            $stmt->execute([$id]);
            
            logSystemHistory($pdo, 'Product Deleted', 'Product', $id, [
                'name' => $productRow['name'] ?? 'Unknown',
            ]);
            
            return ['success' => true, 'message' => 'Product deleted successfully'];
        } catch (Exception $e) {
            return ['error' => 'Failed to delete product: ' . $e->getMessage()];
        }
    },
    
    'DELETE /api/products' => function() use ($pdo) {
        try {
            // Delete all inventory records
            $stmt = $pdo->query('DELETE FROM inventory');
            
            // Delete all products
            $stmt = $pdo->query('DELETE FROM products');
            
            return ['success' => true, 'message' => 'All products deleted successfully'];
        } catch (Exception $e) {
            return ['error' => 'Failed to delete products: ' . $e->getMessage()];
        }
    },
    
    // Product Default Ingredients API
    'GET /api/products/{id}/default-ingredients' => function() use ($pdo) {
        $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        // Extract product ID from /api/products/{id}/default-ingredients
        preg_match('/\/api\/products\/(\d+)\/default-ingredients/', $uri, $matches);
        $productId = $matches[1] ?? null;
        
        if (!$productId) {
            return ['error' => 'Product ID is required'];
        }
        
        try {
            $stmt = $pdo->prepare('
                SELECT pdi.*, i.name as ingredient_name, i.code as ingredient_code, i.unit as ingredient_unit, i.stock as ingredient_stock
                FROM product_default_ingredients pdi
                JOIN ingredients i ON pdi.ingredient_id = i.id
                WHERE pdi.product_id = ?
                ORDER BY pdi.id
            ');
            $stmt->execute([$productId]);
            $defaults = $stmt->fetchAll();
            
            return [
                'defaultIngredients' => array_map(function($d) {
                    return [
                        'id' => (string)$d['id'],
                        'productId' => (string)$d['product_id'],
                        'ingredientId' => (string)$d['ingredient_id'],
                        'ingredientName' => $d['ingredient_name'],
                        'ingredientCode' => $d['ingredient_code'],
                        'ingredientUnit' => $d['ingredient_unit'],
                        'ingredientStock' => (float)$d['ingredient_stock'],
                        'quantity' => null,
                    ];
                }, $defaults),
            ];
        } catch (Exception $e) {
            http_response_code(500);
            return ['error' => 'Failed to get default ingredients: ' . $e->getMessage()];
        }
    },
    
    'POST /api/products/{id}/default-ingredients' => function() use ($pdo, $body) {
        $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        preg_match('/\/api\/products\/(\d+)\/default-ingredients/', $uri, $matches);
        $productId = $matches[1] ?? null;
        
        if (!$productId) {
            return ['error' => 'Product ID is required'];
        }
        
        $ingredients = $body['ingredients'] ?? [];
        
        if (!is_array($ingredients)) {
            return ['error' => 'Ingredients must be an array'];
        }
        
        try {
            // Delete existing defaults for this product
            $stmt = $pdo->prepare('DELETE FROM product_default_ingredients WHERE product_id = ?');
            $stmt->execute([$productId]);
            
            // Insert new defaults
            $stmt = $pdo->prepare('
                INSERT INTO product_default_ingredients (product_id, ingredient_id, quantity, created_at, updated_at)
                VALUES (?, ?, NULL, NOW(), NOW())
            ');
            
            foreach ($ingredients as $ing) {
                $ingredientId = $ing['ingredientId'] ?? null;
                
                if ($ingredientId) {
                    $stmt->execute([$productId, $ingredientId]);
                }
            }
            
            // Fetch the saved defaults
            $stmt = $pdo->prepare('
                SELECT pdi.*, i.name as ingredient_name, i.code as ingredient_code, i.unit as ingredient_unit, i.stock as ingredient_stock
                FROM product_default_ingredients pdi
                JOIN ingredients i ON pdi.ingredient_id = i.id
                WHERE pdi.product_id = ?
                ORDER BY pdi.id
            ');
            $stmt->execute([$productId]);
            $defaults = $stmt->fetchAll();
            
            logSystemHistory($pdo, 'Product Default Ingredients Updated', 'Product', (string)$productId, [
                'ingredientCount' => count($defaults),
                'ingredients' => array_map(function($d) { return $d['ingredient_name']; }, $defaults),
            ]);
            
            return [
                'success' => true,
                'defaultIngredients' => array_map(function($d) {
                    return [
                        'id' => (string)$d['id'],
                        'productId' => (string)$d['product_id'],
                        'ingredientId' => (string)$d['ingredient_id'],
                        'ingredientName' => $d['ingredient_name'],
                        'ingredientCode' => $d['ingredient_code'],
                        'ingredientUnit' => $d['ingredient_unit'],
                        'ingredientStock' => (float)$d['ingredient_stock'],
                        'quantity' => null,
                    ];
                }, $defaults),
            ];
        } catch (Exception $e) {
            http_response_code(500);
            return ['error' => 'Failed to save default ingredients: ' . $e->getMessage()];
        }
    },
    
    'GET /api/categories' => function() use ($pdo) {
        $stmt = $pdo->query('SELECT * FROM categories ORDER BY name');
        $categories = $stmt->fetchAll();
        
        return [
            'categories' => array_map(function($c) {
                return [
                    'id' => (string)$c['id'],
                    'name' => $c['name'],
                    'description' => $c['description'],
                    'createdAt' => $c['created_at'] ?? date('Y-m-d H:i:s'),
                ];
            }, $categories),
        ];
    },
    
    'POST /api/categories' => function() use ($pdo, $body) {
        $stmt = $pdo->prepare('INSERT INTO categories (name, description, created_at, updated_at) VALUES (?, ?, NOW(), NOW())');
        $stmt->execute([
            $body['name'] ?? '',
            $body['description'] ?? '',
        ]);
        
        $lastId = $pdo->lastInsertId();
        $stmt = $pdo->prepare('SELECT * FROM categories WHERE id = ?');
        $stmt->execute([$lastId]);
        $category = $stmt->fetch();
        
        logSystemHistory($pdo, 'Category Created', 'Category', (string)$lastId, [
            'name' => $category['name'],
        ]);
        
        return [
            'category' => [
                'id' => (string)$category['id'],
                'name' => $category['name'],
                'description' => $category['description'],
                'createdAt' => $category['created_at'],
            ]
        ];
    },
    
    'PUT /api/categories/{id}' => function() use ($pdo, $body) {
        $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        $id = substr($uri, strrpos($uri, '/') + 1);
        
        $stmt = $pdo->prepare('UPDATE categories SET name = ?, description = ?, updated_at = NOW() WHERE id = ?');
        $stmt->execute([
            $body['name'] ?? '',
            $body['description'] ?? '',
            $id
        ]);
        
        $stmt = $pdo->prepare('SELECT * FROM categories WHERE id = ?');
        $stmt->execute([$id]);
        $category = $stmt->fetch();
        
        logSystemHistory($pdo, 'Category Updated', 'Category', (string)$id, [
            'name' => $category['name'],
        ]);
        
        return [
            'category' => [
                'id' => (string)$category['id'],
                'name' => $category['name'],
                'description' => $category['description'],
                'createdAt' => $category['created_at'],
            ]
        ];
    },
    
    'DELETE /api/categories/{id}' => function() use ($pdo) {
        $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        $id = substr($uri, strrpos($uri, '/') + 1);
        
        $nameStmt = $pdo->prepare('SELECT name FROM categories WHERE id = ?');
        $nameStmt->execute([$id]);
        $catRow = $nameStmt->fetch();
        
        $stmt = $pdo->prepare('DELETE FROM categories WHERE id = ?');
        $stmt->execute([$id]);
        
        logSystemHistory($pdo, 'Category Deleted', 'Category', $id, [
            'name' => $catRow['name'] ?? 'Unknown',
        ]);
        
        return ['success' => true];
    },
    
    // Ingredient Categories API
    'GET /api/ingredient-categories' => function() use ($pdo) {
        $stmt = $pdo->query('SELECT * FROM ingredient_categories ORDER BY name');
        $categories = $stmt->fetchAll();
        
        return [
            'categories' => array_map(function($c) {
                return [
                    'id' => (string)$c['id'],
                    'name' => $c['name'],
                    'description' => $c['description'],
                    'createdAt' => $c['created_at'],
                ];
            }, $categories),
        ];
    },
    
    'POST /api/ingredient-categories' => function() use ($pdo, $body) {
        $stmt = $pdo->prepare('INSERT INTO ingredient_categories (name, description, created_at, updated_at) VALUES (?, ?, NOW(), NOW())');
        $stmt->execute([
            $body['name'] ?? '',
            $body['description'] ?? '',
        ]);
        
        $lastId = $pdo->lastInsertId();
        $stmt = $pdo->prepare('SELECT * FROM ingredient_categories WHERE id = ?');
        $stmt->execute([$lastId]);
        $category = $stmt->fetch();
        
        logSystemHistory($pdo, 'Ingredient Category Created', 'IngredientCategory', (string)$lastId, [
            'name' => $category['name'],
        ]);
        
        return [
            'category' => [
                'id' => (string)$category['id'],
                'name' => $category['name'],
                'description' => $category['description'],
                'createdAt' => $category['created_at'],
            ]
        ];
    },
    
    'PUT /api/ingredient-categories/{id}' => function() use ($pdo, $body) {
        $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        $id = substr($uri, strrpos($uri, '/') + 1);
        
        $stmt = $pdo->prepare('UPDATE ingredient_categories SET name = ?, description = ?, updated_at = NOW() WHERE id = ?');
        $stmt->execute([
            $body['name'] ?? '',
            $body['description'] ?? '',
            $id
        ]);
        
        $stmt = $pdo->prepare('SELECT * FROM ingredient_categories WHERE id = ?');
        $stmt->execute([$id]);
        $category = $stmt->fetch();
        
        logSystemHistory($pdo, 'Ingredient Category Updated', 'IngredientCategory', (string)$id, [
            'name' => $category['name'],
        ]);
        
        return [
            'category' => [
                'id' => (string)$category['id'],
                'name' => $category['name'],
                'description' => $category['description'],
                'createdAt' => $category['created_at'],
            ]
        ];
    },
    
    'DELETE /api/ingredient-categories/{id}' => function() use ($pdo) {
        $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        $id = substr($uri, strrpos($uri, '/') + 1);
        
        $nameStmt = $pdo->prepare('SELECT name FROM ingredient_categories WHERE id = ?');
        $nameStmt->execute([$id]);
        $catRow = $nameStmt->fetch();
        
        $stmt = $pdo->prepare('DELETE FROM ingredient_categories WHERE id = ?');
        $stmt->execute([$id]);
        
        logSystemHistory($pdo, 'Ingredient Category Deleted', 'IngredientCategory', $id, [
            'name' => $catRow['name'] ?? 'Unknown',
        ]);
        
        return ['success' => true];
    },
    
    // Product Mix Categories API
    'GET /api/product-mix-categories' => function() use ($pdo) {
        try {
            $stmt = $pdo->query('SELECT * FROM product_mix_categories ORDER BY name');
            $categories = $stmt->fetchAll();
            
            return [
                'categories' => array_map(function($c) {
                    return [
                        'id' => (string)$c['id'],
                        'name' => $c['name'],
                        'description' => $c['description'],
                        'createdAt' => $c['created_at'],
                    ];
                }, $categories),
            ];
        } catch (PDOException $e) {
            // Table doesn't exist yet - return empty array
            return ['categories' => []];
        }
    },
    
    'POST /api/product-mix-categories' => function() use ($pdo, $body) {
        try {
            $stmt = $pdo->prepare('INSERT INTO product_mix_categories (name, description, created_at, updated_at) VALUES (?, ?, NOW(), NOW())');
            $stmt->execute([
                $body['name'] ?? '',
                $body['description'] ?? '',
            ]);
            
            $lastId = $pdo->lastInsertId();
            $stmt = $pdo->prepare('SELECT * FROM product_mix_categories WHERE id = ?');
            $stmt->execute([$lastId]);
            $category = $stmt->fetch();
            
            logSystemHistory($pdo, 'Product Mix Category Created', 'ProductMixCategory', (string)$lastId, [
                'name' => $category['name'],
                'description' => $category['description'],
            ]);
            
            return [
                'category' => [
                    'id' => (string)$category['id'],
                    'name' => $category['name'],
                    'description' => $category['description'],
                    'createdAt' => $category['created_at'],
                ]
            ];
        } catch (PDOException $e) {
            http_response_code(400);
            return ['error' => 'Product mix categories table not created yet. Please run the database migration.'];
        }
    },
    
    'PUT /api/product-mix-categories/{id}' => function() use ($pdo, $body) {
        try {
            $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
            $id = substr($uri, strrpos($uri, '/') + 1);
            
            $stmt = $pdo->prepare('UPDATE product_mix_categories SET name = ?, description = ?, updated_at = NOW() WHERE id = ?');
            $stmt->execute([
                $body['name'] ?? '',
                $body['description'] ?? '',
                $id
            ]);
            
            $stmt = $pdo->prepare('SELECT * FROM product_mix_categories WHERE id = ?');
            $stmt->execute([$id]);
            $category = $stmt->fetch();
            
            logSystemHistory($pdo, 'Product Mix Category Updated', 'ProductMixCategory', (string)$id, [
                'name' => $category['name'],
                'description' => $category['description'],
            ]);
            
            return [
                'category' => [
                    'id' => (string)$category['id'],
                    'name' => $category['name'],
                    'description' => $category['description'],
                    'createdAt' => $category['created_at'],
                ]
            ];
        } catch (PDOException $e) {
            http_response_code(400);
            return ['error' => 'Product mix categories table not created yet. Please run the database migration.'];
        }
    },
    
    'DELETE /api/product-mix-categories/{id}' => function() use ($pdo) {
        try {
            $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
            $id = substr($uri, strrpos($uri, '/') + 1);
            
            $stmt = $pdo->prepare('SELECT name FROM product_mix_categories WHERE id = ?');
            $stmt->execute([$id]);
            $category = $stmt->fetch();
            
            $stmt = $pdo->prepare('DELETE FROM product_mix_categories WHERE id = ?');
            $stmt->execute([$id]);
            
            logSystemHistory($pdo, 'Product Mix Category Deleted', 'ProductMixCategory', $id, [
                'name' => $category['name'] ?? 'Unknown',
            ]);
            
            return ['success' => true];
        } catch (PDOException $e) {
            http_response_code(400);
            return ['error' => 'Product mix categories table not created yet. Please run the database migration.'];
        }
    },
    
    // Product Mix Items API
    'GET /api/product-mix-categories/{id}/items' => function() use ($pdo) {
        try {
            $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
            $segments = explode('/', trim($uri, '/'));
            $categoryId = $segments[2]; // api/product-mix-categories/{id}/items
            
            $stmt = $pdo->prepare('
                SELECT 
                    pmi.id as mix_item_id,
                    pmi.product_mix_category_id,
                    pmi.product_id,
                    p.name as product_name,
                    p.price,
                    p.unit,
                    pmi.created_at
                FROM product_mix_items pmi
                JOIN products p ON pmi.product_id = p.id
                WHERE pmi.product_mix_category_id = ?
                ORDER BY p.name
            ');
            $stmt->execute([$categoryId]);
            $items = $stmt->fetchAll();
            
            return [
                'items' => array_map(function($item) {
                    return [
                        'id' => (string)$item['mix_item_id'],
                        'productMixCategoryId' => (string)$item['product_mix_category_id'],
                        'productId' => (string)$item['product_id'],
                        'productName' => $item['product_name'],
                        'sku' => '',
                        'price' => (float)$item['price'],
                        'unit' => $item['unit'],
                        'quantity' => 1,
                        'createdAt' => $item['created_at'],
                    ];
                }, $items),
            ];
        } catch (PDOException $e) {
            return ['items' => []];
        }
    },
    
    'POST /api/product-mix-categories/{id}/items' => function() use ($pdo, $body) {
        try {
            $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
            $segments = explode('/', trim($uri, '/'));
            $categoryId = $segments[2]; // api/product-mix-categories/{id}/items
            $productId = $body['productId'] ?? '';
            
            // Insert into product_mix_items table
            $stmt = $pdo->prepare('INSERT INTO product_mix_items (product_mix_category_id, product_id) VALUES (?, ?)');
            $stmt->execute([$categoryId, $productId]);
            
            $lastId = $pdo->lastInsertId();
            
            // Get the product details
            $stmt = $pdo->prepare('
                SELECT 
                    pmi.id as mix_item_id,
                    pmi.product_mix_category_id,
                    pmi.product_id,
                    p.name as product_name,
                    p.price,
                    p.unit,
                    pmi.created_at
                FROM product_mix_items pmi
                JOIN products p ON pmi.product_id = p.id
                WHERE pmi.id = ?
            ');
            $stmt->execute([$lastId]);
            $item = $stmt->fetch();
            
            logSystemHistory($pdo, 'Product Added to Mix Category', 'ProductMixCategory', (string)$categoryId, [
                'productId' => (string)$item['product_id'],
                'productName' => $item['product_name'],
            ]);
            
            return [
                'item' => [
                    'id' => (string)$item['mix_item_id'],
                    'productMixCategoryId' => (string)$item['product_mix_category_id'],
                    'productId' => (string)$item['product_id'],
                    'productName' => $item['product_name'],
                    'sku' => '',
                    'price' => (float)$item['price'],
                    'unit' => $item['unit'],
                    'quantity' => 1,
                    'createdAt' => $item['created_at'],
                ]
            ];
        } catch (PDOException $e) {
            http_response_code(400);
            if (strpos($e->getMessage(), 'Duplicate entry') !== false) {
                return ['error' => 'This product is already in the mix.'];
            }
            error_log('Product mix items error: ' . $e->getMessage());
            return ['error' => 'Failed to add product to mix: ' . $e->getMessage()];
        }
    },
    
    'DELETE /api/product-mix-items/{id}' => function() use ($pdo) {
        try {
            $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
            $id = substr($uri, strrpos($uri, '/') + 1);
            
            $stmt = $pdo->prepare('SELECT pmi.id, pmi.product_mix_category_id, pmi.product_id, p.name as product_name FROM product_mix_items pmi JOIN products p ON pmi.product_id = p.id WHERE pmi.id = ?');
            $stmt->execute([$id]);
            $item = $stmt->fetch();
            
            $stmt = $pdo->prepare('DELETE FROM product_mix_items WHERE id = ?');
            $stmt->execute([$id]);
            
            if ($item) {
                logSystemHistory($pdo, 'Product Removed from Mix Category', 'ProductMixCategory', (string)$item['product_mix_category_id'], [
                    'productId' => (string)$item['product_id'],
                    'productName' => $item['product_name'],
                ]);
            }
            
            return ['success' => true];
        } catch (PDOException $e) {
            http_response_code(400);
            return ['error' => 'Failed to delete product mix item.'];
        }
    },
    
    // Product Mix Category Default Ingredients API
    'GET /api/product-mix-categories/{id}/default-ingredients' => function() use ($pdo) {
        $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        preg_match('/\/api\/product-mix-categories\/(\d+)\/default-ingredients/', $uri, $matches);
        $categoryId = $matches[1] ?? null;
        
        if (!$categoryId) {
            return ['error' => 'Category ID is required'];
        }
        
        try {
            // Create table if it doesn't exist
            $pdo->exec('
                CREATE TABLE IF NOT EXISTS product_mix_category_default_ingredients (
                    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                    product_mix_category_id BIGINT UNSIGNED NOT NULL,
                    ingredient_id BIGINT UNSIGNED NOT NULL,
                    quantity DECIMAL(10,2) NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    KEY idx_category (product_mix_category_id),
                    KEY idx_ingredient (ingredient_id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            ');
            
            $stmt = $pdo->prepare('
                SELECT pmcdi.*, i.name as ingredient_name, i.code as ingredient_code, i.unit as ingredient_unit, i.stock as ingredient_stock
                FROM product_mix_category_default_ingredients pmcdi
                JOIN ingredients i ON pmcdi.ingredient_id = i.id
                WHERE pmcdi.product_mix_category_id = ?
                ORDER BY pmcdi.id
            ');
            $stmt->execute([$categoryId]);
            $defaults = $stmt->fetchAll();
            
            return [
                'defaultIngredients' => array_map(function($d) {
                    return [
                        'id' => (string)$d['id'],
                        'categoryId' => (string)$d['product_mix_category_id'],
                        'ingredientId' => (string)$d['ingredient_id'],
                        'ingredientName' => $d['ingredient_name'],
                        'ingredientCode' => $d['ingredient_code'],
                        'ingredientUnit' => $d['ingredient_unit'],
                        'ingredientStock' => (float)$d['ingredient_stock'],
                        'quantity' => null,
                    ];
                }, $defaults),
            ];
        } catch (Exception $e) {
            http_response_code(500);
            return ['error' => 'Failed to get default ingredients: ' . $e->getMessage()];
        }
    },
    
    'POST /api/product-mix-categories/{id}/default-ingredients' => function() use ($pdo, $body) {
        $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        preg_match('/\/api\/product-mix-categories\/(\d+)\/default-ingredients/', $uri, $matches);
        $categoryId = $matches[1] ?? null;
        
        if (!$categoryId) {
            return ['error' => 'Category ID is required'];
        }
        
        $ingredients = $body['ingredients'] ?? [];
        
        if (!is_array($ingredients)) {
            return ['error' => 'Ingredients must be an array'];
        }
        
        try {
            // Delete existing defaults for this category
            $stmt = $pdo->prepare('DELETE FROM product_mix_category_default_ingredients WHERE product_mix_category_id = ?');
            $stmt->execute([$categoryId]);
            
            // Insert new defaults
            $stmt = $pdo->prepare('
                INSERT INTO product_mix_category_default_ingredients (product_mix_category_id, ingredient_id, quantity, created_at, updated_at)
                VALUES (?, ?, NULL, NOW(), NOW())
            ');
            
            foreach ($ingredients as $ing) {
                $ingredientId = $ing['ingredientId'] ?? null;
                
                if ($ingredientId) {
                    $stmt->execute([$categoryId, $ingredientId]);
                }
            }
            
            // Fetch the saved defaults
            $stmt = $pdo->prepare('
                SELECT pmcdi.*, i.name as ingredient_name, i.code as ingredient_code, i.unit as ingredient_unit, i.stock as ingredient_stock
                FROM product_mix_category_default_ingredients pmcdi
                JOIN ingredients i ON pmcdi.ingredient_id = i.id
                WHERE pmcdi.product_mix_category_id = ?
                ORDER BY pmcdi.id
            ');
            $stmt->execute([$categoryId]);
            $defaults = $stmt->fetchAll();
            
            logSystemHistory($pdo, 'Mix Category Default Ingredients Updated', 'ProductMixCategory', (string)$categoryId, [
                'ingredientCount' => count($defaults),
                'ingredients' => array_map(function($d) { return $d['ingredient_name']; }, $defaults),
            ]);
            
            return [
                'success' => true,
                'defaultIngredients' => array_map(function($d) {
                    return [
                        'id' => (string)$d['id'],
                        'categoryId' => (string)$d['product_mix_category_id'],
                        'ingredientId' => (string)$d['ingredient_id'],
                        'ingredientName' => $d['ingredient_name'],
                        'ingredientCode' => $d['ingredient_code'],
                        'ingredientUnit' => $d['ingredient_unit'],
                        'ingredientStock' => (float)$d['ingredient_stock'],
                        'quantity' => null,
                    ];
                }, $defaults),
            ];
        } catch (Exception $e) {
            http_response_code(500);
            return ['error' => 'Failed to save default ingredients: ' . $e->getMessage()];
        }
    },
    
    'GET /api/stores' => function() use ($pdo) {
        $stmt = $pdo->query('SELECT * FROM stores ORDER BY name');
        $stores = $stmt->fetchAll();
        
        return [
            'stores' => array_map(function($s) {
                return [
                    'id' => (string)$s['id'],
                    'name' => $s['name'],
                    'address' => $s['address'],
                    'contactPerson' => $s['contact_person'] ?? null,
                    'phone' => $s['phone'] ?? null,
                    'email' => $s['email'] ?? null,
                    'status' => $s['status'],
                    'createdAt' => $s['created_at'],
                    'updatedAt' => $s['updated_at'] ?? null,
                ];
            }, $stores),
        ];
    },
    
    'POST /api/stores' => function() use ($pdo, $body) {
        $stmt = $pdo->prepare('INSERT INTO stores (name, address, contact_person, phone, email, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())');
        $stmt->execute([
            $body['name'] ?? '',
            $body['address'] ?? '',
            $body['contactPerson'] ?? null,
            $body['phone'] ?? null,
            $body['email'] ?? null,
            $body['status'] ?? 'active',
        ]);
        
        $lastId = $pdo->lastInsertId();
        $stmt = $pdo->prepare('SELECT * FROM stores WHERE id = ?');
        $stmt->execute([$lastId]);
        $store = $stmt->fetch();
        
        logSystemHistory($pdo, 'Store Created', 'Store', (string)$lastId, [
            'name' => $store['name'],
            'address' => $store['address'],
        ]);
        
        return [
            'store' => [
                'id' => (string)$store['id'],
                'name' => $store['name'],
                'address' => $store['address'],
                'contactPerson' => $store['contact_person'] ?? null,
                'phone' => $store['phone'] ?? null,
                'email' => $store['email'] ?? null,
                'status' => $store['status'],
                'createdAt' => $store['created_at'],
                'updatedAt' => $store['updated_at'] ?? null,
            ]
        ];
    },
    
    'PUT /api/stores/{id}' => function() use ($pdo, $body) {
        $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        $id = substr($uri, strrpos($uri, '/') + 1);
        
        $stmt = $pdo->prepare('UPDATE stores SET name = ?, address = ?, contact_person = ?, phone = ?, email = ?, status = ?, updated_at = NOW() WHERE id = ?');
        $stmt->execute([
            $body['name'] ?? '',
            $body['address'] ?? '',
            $body['contactPerson'] ?? null,
            $body['phone'] ?? null,
            $body['email'] ?? null,
            $body['status'] ?? 'active',
            $id
        ]);
        
        $stmt = $pdo->prepare('SELECT * FROM stores WHERE id = ?');
        $stmt->execute([$id]);
        $store = $stmt->fetch();
        
        logSystemHistory($pdo, 'Store Updated', 'Store', (string)$id, [
            'name' => $store['name'],
        ]);
        
        return [
            'store' => [
                'id' => (string)$store['id'],
                'name' => $store['name'],
                'address' => $store['address'],
                'contactPerson' => $store['contact_person'] ?? null,
                'phone' => $store['phone'] ?? null,
                'email' => $store['email'] ?? null,
                'status' => $store['status'],
                'createdAt' => $store['created_at'],
                'updatedAt' => $store['updated_at'] ?? null,
            ]
        ];
    },
    
    'DELETE /api/stores/{id}' => function() use ($pdo) {
        $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        $id = substr($uri, strrpos($uri, '/') + 1);
        
        $nameStmt = $pdo->prepare('SELECT name FROM stores WHERE id = ?');
        $nameStmt->execute([$id]);
        $storeRow = $nameStmt->fetch();
        
        $stmt = $pdo->prepare('DELETE FROM stores WHERE id = ?');
        $stmt->execute([$id]);
        
        logSystemHistory($pdo, 'Store Deleted', 'Store', $id, [
            'name' => $storeRow['name'] ?? 'Unknown',
        ]);
        
        return ['success' => true];
    },
    
    'GET /api/employees' => function() use ($pdo) {
        $stmt = $pdo->query('SELECT u.*, s.name as store_name FROM users u LEFT JOIN stores s ON u.store_id = s.id ORDER BY u.full_name');
        $users = $stmt->fetchAll();
        
        return [
            'employees' => array_map(function($u) {
                return [
                    'id' => (string)$u['id'],
                    'username' => $u['username'],
                    'fullName' => $u['full_name'],
                    'role' => $u['role'],
                    'employeeRole' => $u['employee_role'],
                    'storeId' => $u['store_id'] ? (string)$u['store_id'] : null,
                    'storeName' => $u['store_name'],
                    'canLogin' => (bool)$u['can_login'],
                ];
            }, $users),
        ];
    },
    
    'GET /api/sales' => function() use ($pdo) {
        $startDate = $_GET['startDate'] ?? null;
        $endDate = $_GET['endDate'] ?? null;
        $location = $_GET['location'] ?? null;
        
        error_log('[Sales API] Params: startDate=' . ($startDate ?? 'NULL') . ', endDate=' . ($endDate ?? 'NULL') . ', location=' . ($location ?? 'NULL'));
        
        $query = 'SELECT s.*, u.full_name as cashier_name, u.username as cashier_username FROM sales s LEFT JOIN users u ON s.user_id = u.id';
        $params = [];
        $where = [];
        
        if ($startDate && $endDate) {
            $where[] = 'DATE(s.created_at) BETWEEN ? AND ?';
            $params[] = $startDate;
            $params[] = $endDate;
        }
        
        if ($location) {
            $where[] = 's.location = ?';
            $params[] = $location;
        }
        
        if (!empty($where)) {
            $query .= ' WHERE ' . implode(' AND ', $where);
        }
        
        $query .= ' ORDER BY s.created_at DESC LIMIT 500';
        
        error_log('[Sales API] Query: ' . $query);
        error_log('[Sales API] Params: ' . json_encode($params));
        
        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        $sales = $stmt->fetchAll();
        
        error_log('[Sales API] Result count: ' . count($sales));
        
        return [
            'sales' => array_map(function($s) use ($pdo) {
                // Get items for this sale
                $itemStmt = $pdo->prepare('
                    SELECT si.*, p.name as product_name 
                    FROM sale_items si
                    LEFT JOIN products p ON si.product_id = p.id
                    WHERE si.sale_id = ?
                ');
                $itemStmt->execute([$s['id']]);
                $items = $itemStmt->fetchAll();
                
                // Decode customer JSON or plain string
                $customerName = null;
                $customerPhone = null;
                $customerEmail = null;

                if (!empty($s['customer'])) {
                    $decodedCustomer = json_decode($s['customer'], true);
                    if (json_last_error() === JSON_ERROR_NONE && is_array($decodedCustomer)) {
                        $customerName = $decodedCustomer['name'] ?? null;
                        $customerPhone = $decodedCustomer['phone'] ?? null;
                        $customerEmail = $decodedCustomer['email'] ?? null;
                    } else {
                        $customerName = $s['customer'];
                    }
                }
                
                // Get store location if store_id exists
                $location = null;
                if (!empty($s['store_id'])) {
                    $storeStmt = $pdo->prepare('SELECT name FROM stores WHERE id = ?');
                    $storeStmt->execute([$s['store_id']]);
                    $store = $storeStmt->fetch();
                    $location = $store ? $store['name'] : null;
                }
                
                return [
                    'id' => (string)$s['id'],
                    'transactionId' => $s['transaction_id'],
                    'date' => $s['created_at'],
                    'timestamp' => $s['created_at'],
                    'location' => $location,
                    'customerName' => $customerName,
                    'customerPhone' => $customerPhone,
                    'customerEmail' => $customerEmail,
                    'customer' => $customerName ? [
                        'name' => $customerName,
                        'phone' => $customerPhone,
                        'email' => $customerEmail,
                    ] : null,
                    'subtotal' => (float)$s['subtotal'],
                    'globalDiscount' => (float)($s['global_discount'] ?? 0),
                    'wholesaleDiscount' => (float)($s['wholesale_discount'] ?? 0),
                    'tax' => (float)$s['tax'],
                    'total' => (float)$s['total'],
                    'paymentMethod' => $s['payment_method'],
                    'storeId' => $s['store_id'] ? (string)$s['store_id'] : null,
                    'userId' => $s['user_id'] ? (string)$s['user_id'] : null,
                    'cashierName' => $s['cashier_name'] ?? $s['cashier_username'] ?? null,
                    'shift' => $s['shift'] ?? null,
                    'items' => array_map(function($item) {
                        return [
                            'id' => (string)$item['id'],
                            'productId' => (string)$item['product_id'],
                            'productName' => $item['product_name'],
                            'quantity' => (float)$item['quantity'],
                            'unitPrice' => (float)$item['unit_price'],
                            'price' => (float)$item['unit_price'],
                            'discount' => (float)$item['discount'],
                            'total' => (float)$item['total'],
                        ];
                    }, $items)
                ];
            }, $sales),
        ];
    },
    
    'POST /api/sales' => function() use ($pdo, $body) {
        // DDL must run OUTSIDE any transaction — ALTER TABLE causes implicit COMMIT in MySQL/MariaDB
        // which would silently end any active transaction and make rollBack() throw.
        try {
            $chk = $pdo->query("SHOW COLUMNS FROM sales LIKE 'wholesale_discount'");
            if ($chk->rowCount() === 0) {
                $pdo->exec("ALTER TABLE sales ADD COLUMN wholesale_discount DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER global_discount");
            }
        } catch (Exception $e) {
            error_log('Could not add wholesale_discount column: ' . $e->getMessage());
        }
        try { $pdo->exec("ALTER TABLE sales ADD COLUMN IF NOT EXISTS shift ENUM('AM','PM') NULL DEFAULT NULL"); } catch(Exception $e) { /* ignore */ }

        try {
            // Validate required fields
            if (empty($body['items']) || !is_array($body['items'])) {
                http_response_code(400);
                return ['error' => 'Items array is required'];
            }

            if (empty($body['storeId'])) {
                http_response_code(400);
                return ['error' => 'Store ID is required'];
            }

            $pdo->beginTransaction();

            // Create sales record with wholesale discount column
            $stmt = $pdo->prepare('
                INSERT INTO sales (
                    transaction_id, 
                    user_id, 
                    store_id, 
                    customer,
                    items,
                    subtotal,
                    global_discount,
                    wholesale_discount,
                    tax,
                    total, 
                    payment_method,
                    sales_type,
                    shift,
                    created_at,
                    updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            ');
            
            // Build customer data as valid JSON for the JSON column
            $customerName = null;
            if (!empty($body['customerName'])) {
                $customerName = trim((string)$body['customerName']);
            } elseif (!empty($body['customer']) && is_array($body['customer'])) {
                $customerName = trim((string)($body['customer']['name'] ?? ''));
            }
            if ($customerName === '') {
                $customerName = null;
            }
            if (!$customerName) {
                $customerName = 'Walk-in Customer';
            }
            // Must be valid JSON for MariaDB's JSON column CHECK constraint
            $customerData = json_encode(['name' => $customerName]);
            
            // Build items array for JSON
            $itemsData = json_encode($body['items']);
            
            error_log(date('Y-m-d H:i:s') . ' | Sales endpoint received:');
            error_log('  globalDiscount: ' . ($body['globalDiscount'] ?? 'MISSING') . ' (type: ' . gettype($body['globalDiscount'] ?? null) . ')');
            error_log('  wholesaleDiscount: ' . ($body['wholesaleDiscount'] ?? 'MISSING') . ' (type: ' . gettype($body['wholesaleDiscount'] ?? null) . ')');
            error_log('  subtotal: ' . ($body['subtotal'] ?? 'MISSING'));
            error_log('  total: ' . ($body['total'] ?? 'MISSING'));
            error_log('  Full body: ' . json_encode($body));
            
            $stmt->execute([
                $body['transactionId'] ?? '',
                $body['userId'] ?? null,
                $body['storeId'] ?? null,
                $customerData,
                $itemsData,
                $body['subtotal'] ?? 0,
                $body['globalDiscount'] ?? 0,
                $body['wholesaleDiscount'] ?? 0,
                $body['tax'] ?? 0,
                $body['total'] ?? 0,
                $body['paymentMethod'] ?? 'Cash',
                $body['salesType'] ?? 'retail',
                isset($body['shift']) && in_array($body['shift'], ['AM', 'PM']) ? $body['shift'] : null,
            ]);
            
            $saleId = (string)$pdo->lastInsertId();
            
            // Process each item
            foreach ($body['items'] as $item) {
                // Log what we're processing
                error_log('Processing item: ' . ($item['name'] ?? 'unknown'));
                error_log('  productId: ' . ($item['productId'] ?? 'missing'));
                error_log('  quantity: ' . ($item['quantity'] ?? 'missing'));
                error_log('  weight: ' . (isset($item['weight']) ? $item['weight'] : 'NOT SET'));
                
                // Insert sale item
                $itemStmt = $pdo->prepare('
                    INSERT INTO sale_items (
                        sale_id,
                        product_id,
                        quantity,
                        unit_price,
                        discount,
                        total
                    ) VALUES (?, ?, ?, ?, ?, ?)
                ');
                
                $itemTotal = ($item['price'] * $item['quantity']) - (($item['price'] * $item['quantity'] * $item['discount']) / 100);
                
                $itemStmt->execute([
                    $saleId,
                    $item['productId'],
                    $item['quantity'],
                    $item['price'],
                    $item['discount'],
                    $itemTotal
                ]);
                
                // Deduct from inventory - use weight if provided (for weight-adjusted products), otherwise use quantity
                // This handles cases where products are sold by weight (e.g., 1.5kg) instead of just units
                $deductionAmount = isset($item['weight']) ? floatval($item['weight']) : floatval($item['quantity']);
                error_log('  Deducting from inventory: ' . $deductionAmount . ' (using ' . (isset($item['weight']) ? 'weight' : 'quantity') . ')');
                error_log('  Deduction amount type: ' . gettype($deductionAmount));
                error_log('  Deduction amount value: ' . var_export($deductionAmount, true));
                
                $location = $body['location'] ?? $body['storeId'] ?? 'Amparo Store';
                
                // Log the SQL parameters before execution
                error_log('  SQL UPDATE parameters: productId=' . $item['productId'] . ', location=' . $location . ', deduction=' . $deductionAmount);
                
                // Check current inventory before update
                $checkStmt = $pdo->prepare('SELECT quantity FROM inventory WHERE product_id = ? AND location = ?');
                $checkStmt->execute([$item['productId'], $location]);
                $beforeQty = $checkStmt->fetchColumn();
                error_log('  Inventory BEFORE update: ' . $beforeQty);
                
                $invStmt = $pdo->prepare('
                    UPDATE inventory 
                    SET quantity = GREATEST(quantity - ?, 0) 
                    WHERE product_id = ? AND location = ?
                ');
                
                $invStmt->execute([
                    $deductionAmount,
                    $item['productId'],
                    $location
                ]);
                
                // Log the number of affected rows
                $affectedRows = $invStmt->rowCount();
                error_log('  SQL UPDATE affected ' . $affectedRows . ' row(s)');
                
                // Check inventory after update
                $checkStmt->execute([$item['productId'], $location]);
                $afterQty = $checkStmt->fetchColumn();
                error_log('  Inventory AFTER update: ' . $afterQty);
                error_log('  Actual deduction: ' . ($beforeQty - $afterQty));
                
                // Check if update affected any rows
                if ($invStmt->rowCount() === 0) {
                    // Try to create a new inventory record if it doesn't exist
                    $createInvStmt = $pdo->prepare('
                        INSERT INTO inventory (product_id, location, quantity)
                        VALUES (?, ?, ?)
                    ');
                    
                    try {
                        $createInvStmt->execute([
                            $item['productId'],
                            $location,
                            -$deductionAmount
                        ]);
                    } catch (Exception $e) {
                        // Inventory record might already exist, just log
                        error_log("Could not create inventory record: " . $e->getMessage());
                    }
                }
            }
            
            $pdo->commit();

            logSystemHistory(
                $pdo,
                'Sale Created',
                'Sale',
                $saleId,
                [
                    'transactionId' => $body['transactionId'] ?? '',
                    'total' => $body['total'] ?? 0,
                    'itemCount' => count($body['items']),
                    'storeId' => $body['storeId'] ?? null,
                    'customer' => $customerName ?: null,
                ],
                $body['userId'] ?? null
            );
            
            return [
                'success' => true,
                'sale' => [
                    'id' => $saleId,
                    'transactionId' => $body['transactionId'] ?? '',
                    'total' => $body['total'] ?? 0,
                    'itemCount' => count($body['items'])
                ]
            ];
            
        } catch (Exception $e) {
            if ($pdo->inTransaction()) { $pdo->rollBack(); }
            http_response_code(500);
            return ['error' => 'Failed to process sale: ' . $e->getMessage()];
        }
    },
    
    'GET /api/ingredients' => function() use ($pdo) {
        $stmt = $pdo->query('SELECT i.*, COALESCE(s.name, "Unknown") as supplier_name FROM ingredients i LEFT JOIN suppliers s ON i.supplier_id = s.id ORDER BY i.name');
        $ingredients = $stmt->fetchAll();
        
        return [
            'ingredients' => array_map(function($i) {
                return [
                    'id' => (string)$i['id'],
                    'name' => $i['name'],
                    'code' => $i['code'],
                    'category' => $i['category'],
                    'unit' => $i['unit'],
                    'stock' => (float)$i['stock'],
                    'minStockLevel' => (float)$i['min_stock_level'],
                    'reorderPoint' => (float)$i['reorder_point'],
                    'costPerUnit' => (float)$i['cost_per_unit'],
                    'supplier' => $i['supplier_name'],
                    'lastUpdated' => $i['updated_at'],
                    'expiryDate' => $i['expiry_date'],
                ];
            }, $ingredients),
        ];
    },
    
    'POST /api/ingredients/reset' => function() use ($pdo) {
        // Reset endpoint - simply returns all ingredients (refreshes the list from database)
        $stmt = $pdo->query('SELECT i.*, COALESCE(s.name, "Unknown") as supplier_name FROM ingredients i LEFT JOIN suppliers s ON i.supplier_id = s.id ORDER BY i.name');
        $ingredients = $stmt->fetchAll();
        
        return [
            'ingredients' => array_map(function($i) {
                return [
                    'id' => (string)$i['id'],
                    'name' => $i['name'],
                    'code' => $i['code'],
                    'category' => $i['category'],
                    'unit' => $i['unit'],
                    'stock' => (float)$i['stock'],
                    'minStockLevel' => (float)$i['min_stock_level'],
                    'reorderPoint' => (float)$i['reorder_point'],
                    'costPerUnit' => (float)$i['cost_per_unit'],
                    'supplier' => $i['supplier_name'],
                    'lastUpdated' => $i['updated_at'],
                    'expiryDate' => $i['expiry_date'],
                ];
            }, $ingredients),
        ];
    },
    
    'GET /api/production' => function() use ($pdo) {
        $startDate = $_GET['startDate'] ?? null;
        $endDate = $_GET['endDate'] ?? null;
        
        error_log('[Production API] Params: startDate=' . ($startDate ?? 'NULL') . ', endDate=' . ($endDate ?? 'NULL'));
        
        $query = 'SELECT pr.*, p.name as product_name, pmc.name as product_mix_category_name 
                  FROM production_records pr 
                  LEFT JOIN products p ON pr.product_id = p.id
                  LEFT JOIN product_mix_categories pmc ON pr.product_mix_category_id = pmc.id';
        $params = [];
        $where = [];
        
        if ($startDate && $endDate) {
            $where[] = 'DATE(pr.created_at) BETWEEN ? AND ?';
            $params[] = $startDate;
            $params[] = $endDate;
        }
        
        if (!empty($where)) {
            $query .= ' WHERE ' . implode(' AND ', $where);
        }
        
        $query .= ' ORDER BY pr.created_at DESC LIMIT 100';
        
        error_log('[Production API] Query: ' . $query);
        error_log('[Production API] Params: ' . json_encode($params));
        
        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        $records = $stmt->fetchAll();
        
        error_log('[Production API] Result count: ' . count($records));
        
        return [
            'records' => array_map(function($r) use ($pdo) {
                // Enrich initialIngredients with ingredient details
                $enrichedIngredients = null;
                if ($r['initial_ingredients']) {
                    $initialIngs = json_decode($r['initial_ingredients'], true);
                    if (is_array($initialIngs)) {
                        $enrichedIngredients = [];
                        foreach ($initialIngs as $ing) {
                            $ingredientId = $ing['ingredientId'] ?? null;
                            if ($ingredientId) {
                                $stmt = $pdo->prepare('SELECT name, unit FROM ingredients WHERE id = ?');
                                $stmt->execute([$ingredientId]);
                                $ingredientData = $stmt->fetch();
                                if ($ingredientData) {
                                    $enrichedIngredients[] = [
                                        'ingredientId' => $ingredientId,
                                        'ingredientName' => $ingredientData['name'],
                                        'quantity' => (float)($ing['quantity'] ?? 0),
                                        'unit' => $ingredientData['unit'] ?? 'kg',
                                    ];
                                }
                            }
                        }
                    }
                }
                
                return [
                    'id' => (string)$r['id'],
                    'productId' => $r['product_id'] ? (string)$r['product_id'] : null,
                    'productName' => $r['product_name'] ?? null,
                    'productMixCategoryId' => $r['product_mix_category_id'] ? (string)$r['product_mix_category_id'] : null,
                    'productMixCategoryName' => $r['product_mix_category_name'] ?? null,
                    'quantity' => (float)$r['quantity'],
                    'mixWeight' => $r['mix_weight'] ? (float)$r['mix_weight'] : null,
                    'mixUsed' => $r['mix_used'] ? (float)$r['mix_used'] : null,
                    'rawPackedItems' => $r['raw_packed_items'] !== null ? (float)$r['raw_packed_items'] : null,
                    'batchNumber' => $r['batch_number'],
                    'operator' => $r['operator'],
                    'status' => $r['status'] ?? 'in-progress',
                    'phase' => $r['phase'] ?? 'mixing',
                    'mixingDiscrepancy' => $r['mixing_discrepancy'] !== null ? (float)$r['mixing_discrepancy'] : null,
                    'packingDiscrepancy' => $r['packing_discrepancy'] !== null ? (float)$r['packing_discrepancy'] : null,
                    'cookingDiscrepancy' => $r['cooking_discrepancy'] !== null ? (float)$r['cooking_discrepancy'] : null,
                    'mixingDiscrepancyReason' => $r['mixing_discrepancy_reason'] ?? null,
                    'packingDiscrepancyReason' => $r['packing_discrepancy_reason'] ?? null,
                    'cookingDiscrepancyReason' => $r['cooking_discrepancy_reason'] ?? null,
                    'initialIngredients' => $enrichedIngredients,
                    'timestamp' => $r['created_at'],
                ];
            }, $records),
        ];
    },
    
    'POST /api/production' => function() use ($pdo, $body) {
        $initialIngredientsJson = null;
        if (!empty($body['initialIngredients'])) {
            $initialIngredientsJson = json_encode($body['initialIngredients']);
        }
        
        try {
            // Ensure shift column exists on production_records
            try { $pdo->exec("ALTER TABLE production_records ADD COLUMN IF NOT EXISTS shift ENUM('AM','PM') NULL DEFAULT NULL"); } catch(Exception $e) { /* ignore */ }

            // For product mix production - determine phase and status
            $isProductMix = !empty($body['productMixCategoryId']);
            
            // Allow explicit phase/status override (for starting cooking from existing mix)
            if (!empty($body['phase']) && !empty($body['status'])) {
                $phase = $body['phase'];
                $status = $body['status'];
            } else {
                // Default behavior: mixing for new mix production, cooking for regular products
                $phase = $isProductMix ? 'mixing' : 'cooking';
                $status = $isProductMix ? 'mixing' : 'in-progress';
            }
            
            $stmt = $pdo->prepare('
                INSERT INTO production_records (
                    product_id, 
                    product_mix_category_id, 
                    product_mix_category_name,
                    quantity, 
                    mix_weight,
                    batch_number, 
                    operator, 
                    status, 
                    phase,
                    initial_ingredients,
                    shift,
                    created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
            ');
            $stmt->execute([
                $body['productId'] ?? null,
                $body['productMixCategoryId'] ?? null,
                $body['productMixCategoryName'] ?? null,
                $body['quantity'] ?? 0,
                $body['mixWeight'] ?? null,
                $body['batchNumber'] ?? '',
                $body['operator'] ?? '',
                $status,
                $phase,
                $initialIngredientsJson,
                isset($body['shift']) && in_array($body['shift'], ['AM', 'PM']) ? $body['shift'] : null,
            ]);
            
            $id = $pdo->lastInsertId();
            
            // Deduct initial ingredients from ingredients table stock
            if (!empty($body['initialIngredients']) && is_array($body['initialIngredients'])) {
                foreach ($body['initialIngredients'] as $ing) {
                    $ingredientId = $ing['ingredientId'] ?? null;
                    $ingredientQty = isset($ing['quantity']) ? floatval($ing['quantity']) : 0;
                    
                    if ($ingredientId && $ingredientQty > 0) {
                        try {
                            $stmt = $pdo->prepare('
                                UPDATE ingredients 
                                SET stock = stock - ?, updated_at = NOW()
                                WHERE id = ?
                            ');
                            $stmt->execute([$ingredientQty, $ingredientId]);
                        } catch (Exception $ingredientError) {
                            error_log('Ingredient deduction failed for ID ' . $ingredientId . ': ' . $ingredientError->getMessage());
                        }
                    }
                }
            }
            
            // Fetch the created record
            $stmt = $pdo->prepare('
                SELECT pr.*, p.name as product_name, pmc.name as product_mix_category_name 
                FROM production_records pr 
                LEFT JOIN products p ON pr.product_id = p.id
                LEFT JOIN product_mix_categories pmc ON pr.product_mix_category_id = pmc.id
                WHERE pr.id = ?
            ');
            $stmt->execute([$id]);
            $r = $stmt->fetch();
            
            // Enrich initialIngredients with ingredient details
            $enrichedIngredients = null;
            if ($r['initial_ingredients']) {
                $initialIngs = json_decode($r['initial_ingredients'], true);
                if (is_array($initialIngs)) {
                    $enrichedIngredients = [];
                    foreach ($initialIngs as $ing) {
                        $ingredientId = $ing['ingredientId'] ?? null;
                        if ($ingredientId) {
                            $stmt = $pdo->prepare('SELECT name, unit FROM ingredients WHERE id = ?');
                            $stmt->execute([$ingredientId]);
                            $ingredientData = $stmt->fetch();
                            if ($ingredientData) {
                                $enrichedIngredients[] = [
                                    'ingredientId' => $ingredientId,
                                    'ingredientName' => $ingredientData['name'],
                                    'quantity' => (float)($ing['quantity'] ?? 0),
                                    'unit' => $ingredientData['unit'] ?? 'kg',
                                ];
                            }
                        }
                    }
                }
            }
            
            logSystemHistory($pdo, 'Production Started', 'ProductionRecord', (string)$id, [
                'batchNumber' => $r['batch_number'] ?? '',
                'categoryName' => $r['product_mix_category_name'] ?? $r['product_name'] ?? '',
                'phase' => $r['phase'] ?? 'mixing',
                'operator' => $r['operator'] ?? '',
            ]);
            
            return [
                'record' => [
                    'id' => (string)$r['id'],
                    'productId' => $r['product_id'] ? (string)$r['product_id'] : null,
                    'productName' => $r['product_name'] ?? null,
                    'productMixCategoryId' => $r['product_mix_category_id'] ? (string)$r['product_mix_category_id'] : null,
                    'productMixCategoryName' => $r['product_mix_category_name'] ?? null,
                    'quantity' => (float)$r['quantity'],
                    'mixWeight' => $r['mix_weight'] ? (float)$r['mix_weight'] : null,
                    'mixUsed' => $r['mix_used'] ? (float)$r['mix_used'] : null,
                    'rawPackedItems' => $r['raw_packed_items'] !== null ? (float)$r['raw_packed_items'] : null,
                    'batchNumber' => $r['batch_number'],
                    'operator' => $r['operator'],
                    'status' => $r['status'] ?? 'mixing',
                    'phase' => $r['phase'] ?? 'mixing',
                    'initialIngredients' => $enrichedIngredients,
                    'timestamp' => $r['created_at'],
                ]
            ];
        } catch (Exception $e) {
            http_response_code(500);
            return ['error' => 'Failed to create production record: ' . $e->getMessage()];
        }
    },
    
    'PUT /api/production/{id}' => function() use ($pdo, $body) {
        $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        $id = substr($uri, strrpos($uri, '/') + 1);
        
        if (empty($id)) {
            return ['error' => 'Production ID is required'];
        }
        
        try {
            // Get current production record to know the original quantity
            $stmt = $pdo->prepare('SELECT * FROM production_records WHERE id = ?');
            $stmt->execute([$id]);
            $currentRecord = $stmt->fetch();
            
            if (!$currentRecord) {
                return ['error' => 'Production record not found'];
            }
            
            $originalQuantity = $currentRecord['quantity'];
            $actualQuantity = $body['quantity'] ?? $originalQuantity;
            $productId = $currentRecord['product_id'];
            
            // Update status and quantity if provided
            $updateFields = ['status = ?'];
            $params = [$body['status'] ?? 'in-progress'];
            
            if (isset($body['quantity']) && $body['quantity'] !== null) {
                $updateFields[] = 'quantity = ?';
                $params[] = $body['quantity'];
            }
            
            $params[] = $id;
            
            $stmt = $pdo->prepare('UPDATE production_records SET ' . implode(', ', $updateFields) . ', updated_at = NOW() WHERE id = ?');
            $stmt->execute($params);
            
            // If status is completed and actual quantity differs from original, adjust inventory
            if ($body['status'] === 'completed' && $actualQuantity !== $originalQuantity) {
                $quantityDifference = $actualQuantity - $originalQuantity;
                
                if ($productId && $quantityDifference !== 0) {
                    $stmt = $pdo->prepare('
                        INSERT INTO inventory (product_id, location, quantity, created_at) 
                        VALUES (?, ?, ?, NOW())
                        ON DUPLICATE KEY UPDATE quantity = quantity + ?, updated_at = NOW()
                    ');
                    $stmt->execute([$productId, 'Production Facility', $quantityDifference, $quantityDifference]);
                }
            }
            
            // Deduct additional ingredients if provided (don't fail if deduction fails)
            if (!empty($body['additionalIngredients']) && is_array($body['additionalIngredients'])) {
                foreach ($body['additionalIngredients'] as $ing) {
                    $ingredientCode = $ing['code'] ?? null;
                    $ingredientQty = isset($ing['quantity']) ? floatval($ing['quantity']) : 0;
                    
                    if ($ingredientCode && $ingredientQty > 0) {
                        try {
                            // The code field contains the ingredient ID from the frontend
                            // Try searching by ID first (if it's numeric), then by code or name
                            $ingredient = null;
                            
                            if (is_numeric($ingredientCode)) {
                                // Search by ID first
                                $stmt = $pdo->prepare('SELECT id FROM ingredients WHERE id = ? LIMIT 1');
                                $stmt->execute([$ingredientCode]);
                                $ingredient = $stmt->fetch();
                            }
                            
                            // If not found by ID, try by code or name
                            if (!$ingredient) {
                                $stmt = $pdo->prepare('SELECT id FROM ingredients WHERE code = ? OR LOWER(name) LIKE ? LIMIT 1');
                                $stmt->execute([$ingredientCode, '%' . $ingredientCode . '%']);
                                $ingredient = $stmt->fetch();
                            }
                            
                            if ($ingredient) {
                                $ingredientId = $ingredient['id'];
                                // Deduct from the ingredients table stock column
                                $stmt = $pdo->prepare('
                                    UPDATE ingredients 
                                    SET stock = stock - ?, updated_at = NOW()
                                    WHERE id = ?
                                ');
                                $stmt->execute([$ingredientQty, $ingredientId]);
                            }
                        } catch (Exception $ingredientError) {
                            // Log error but continue - don't fail the production update
                            error_log('Additional ingredient deduction failed for code ' . $ingredientCode . ': ' . $ingredientError->getMessage());
                        }
                    }
                }
            }
            
            // Fetch updated record
            $stmt = $pdo->prepare('SELECT pr.*, p.name as product_name FROM production_records pr LEFT JOIN products p ON pr.product_id = p.id WHERE pr.id = ?');
            $stmt->execute([$id]);
            $r = $stmt->fetch();
            
            if (!$r) {
                return ['error' => 'Production record not found'];
            }
            
            // Enrich initialIngredients with ingredient details
            $enrichedIngredients = null;
            if ($r['initial_ingredients']) {
                $initialIngs = json_decode($r['initial_ingredients'], true);
                if (is_array($initialIngs)) {
                    $enrichedIngredients = [];
                    foreach ($initialIngs as $ing) {
                        $ingredientId = $ing['ingredientId'] ?? null;
                        if ($ingredientId) {
                            $stmt2 = $pdo->prepare('SELECT name, unit FROM ingredients WHERE id = ?');
                            $stmt2->execute([$ingredientId]);
                            $ingredientData = $stmt2->fetch();
                            if ($ingredientData) {
                                $enrichedIngredients[] = [
                                    'ingredientId' => $ingredientId,
                                    'ingredientName' => $ingredientData['name'],
                                    'quantity' => (float)($ing['quantity'] ?? 0),
                                    'unit' => $ingredientData['unit'] ?? 'kg',
                                ];
                            }
                        }
                    }
                }
            }
            
            return [
                'record' => [
                    'id' => (string)$r['id'],
                    'productId' => (string)$r['product_id'],
                    'productName' => $r['product_name'] ?? 'Unknown Product',
                    'quantity' => (float)$r['quantity'],
                    'batchNumber' => $r['batch_number'],
                    'operator' => $r['operator'],
                    'status' => $r['status'] ?? 'in-progress',
                    'initialIngredients' => $enrichedIngredients,
                    'timestamp' => $r['created_at'],
                ]
            ];
        } catch (Exception $e) {
            http_response_code(500);
            return ['error' => 'Failed to update production: ' . $e->getMessage()];
        }
    },
    
    'PATCH /api/production/{id}' => function() use ($pdo, $body) {
        $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        $id = substr($uri, strrpos($uri, '/') + 1);
        
        if (empty($id)) {
            return ['error' => 'Production ID is required'];
        }
        
        // Update status
        $stmt = $pdo->prepare('UPDATE production_records SET status = ?, updated_at = NOW() WHERE id = ?');
        $stmt->execute([
            $body['status'] ?? 'in-progress',
            $id
        ]);
        
        // Fetch updated record
        $stmt = $pdo->prepare('SELECT pr.*, p.name as product_name FROM production_records pr LEFT JOIN products p ON pr.product_id = p.id WHERE pr.id = ?');
        $stmt->execute([$id]);
        $r = $stmt->fetch();
        
        if (!$r) {
            return ['error' => 'Production record not found'];
        }
        
        // Enrich initialIngredients with ingredient details
        $enrichedIngredients = null;
        if ($r['initial_ingredients']) {
            $initialIngs = json_decode($r['initial_ingredients'], true);
            if (is_array($initialIngs)) {
                $enrichedIngredients = [];
                foreach ($initialIngs as $ing) {
                    $ingredientId = $ing['ingredientId'] ?? null;
                    if ($ingredientId) {
                        $stmt2 = $pdo->prepare('SELECT name, unit FROM ingredients WHERE id = ?');
                        $stmt2->execute([$ingredientId]);
                        $ingredientData = $stmt2->fetch();
                        if ($ingredientData) {
                            $enrichedIngredients[] = [
                                'ingredientId' => $ingredientId,
                                'ingredientName' => $ingredientData['name'],
                                'quantity' => (float)($ing['quantity'] ?? 0),
                                'unit' => $ingredientData['unit'] ?? 'kg',
                            ];
                        }
                    }
                }
            }
        }
        
        return [
            'record' => [
                'id' => (string)$r['id'],
                'productId' => (string)$r['product_id'],
                'productName' => $r['product_name'] ?? 'Unknown Product',
                'quantity' => (float)$r['quantity'],
                'batchNumber' => $r['batch_number'],
                'operator' => $r['operator'],
                'status' => $r['status'] ?? 'in-progress',
                'initialIngredients' => $enrichedIngredients,
                'timestamp' => $r['created_at'],
            ]
        ];
    },
    
    'DELETE /api/production/{id}' => function() use ($pdo) {
        $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        $id = substr($uri, strrpos($uri, '/') + 1);
        
        if (empty($id)) {
            return ['error' => 'Production ID is required'];
        }
        
        try {
            // First, get the production record to retrieve initial ingredients and product details
            $stmt = $pdo->prepare('SELECT * FROM production_records WHERE id = ?');
            $stmt->execute([$id]);
            $production = $stmt->fetch();
            
            if (!$production) {
                return ['error' => 'Production record not found'];
            }
            
            // Return ingredients to stock if initial_ingredients is set
            if (!empty($production['initial_ingredients'])) {
                $initialIngredients = json_decode($production['initial_ingredients'], true);
                
                if (is_array($initialIngredients)) {
                    foreach ($initialIngredients as $ing) {
                        $ingredientId = $ing['ingredientId'] ?? null;
                        $ingredientQty = isset($ing['quantity']) ? floatval($ing['quantity']) : 0;
                        
                        if ($ingredientId && $ingredientQty > 0) {
                            try {
                                // Add back to the ingredients table stock column
                                $stmt = $pdo->prepare('
                                    UPDATE ingredients 
                                    SET stock = stock + ?, updated_at = NOW()
                                    WHERE id = ?
                                ');
                                $stmt->execute([$ingredientQty, $ingredientId]);
                            } catch (Exception $ingredientError) {
                                // Log error but continue - don't fail the entire deletion
                                error_log('Ingredient return failed for ID ' . $ingredientId . ': ' . $ingredientError->getMessage());
                            }
                        }
                    }
                }
            }
            
            // Remove produced quantity from Production Facility inventory
            $productId = $production['product_id'];
            $quantity = $production['quantity'];
            
            if ($productId && $quantity > 0) {
                try {
                    $stmt = $pdo->prepare('
                        UPDATE inventory 
                        SET quantity = quantity - ?, updated_at = NOW()
                        WHERE product_id = ? AND location = ?
                    ');
                    $stmt->execute([$quantity, $productId, 'Production Facility']);
                } catch (Exception $inventoryError) {
                    error_log('Inventory reduction failed: ' . $inventoryError->getMessage());
                }
            }
            
            // Finally, delete the production record
            $stmt = $pdo->prepare('DELETE FROM production_records WHERE id = ?');
            $stmt->execute([$id]);
            
            logSystemHistory($pdo, 'Production Deleted', 'ProductionRecord', $id, [
                'batchNumber' => $production['batch_number'] ?? '',
                'categoryName' => $production['product_mix_category_name'] ?? '',
            ]);
            
            return ['success' => true, 'message' => 'Production record deleted and ingredients returned to stock'];
        } catch (Exception $e) {
            http_response_code(500);
            return ['error' => 'Failed to delete production: ' . $e->getMessage()];
        }
    },
    
    // Complete mixing phase - create product mix inventory
    'POST /api/production/{id}/complete-mixing' => function() use ($pdo, $body) {
        $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        preg_match('/\/api\/production\/(\d+)\/complete-mixing/', $uri, $matches);
        $id = $matches[1] ?? null;
        
        if (!$id) {
            return ['error' => 'Production ID is required'];
        }
        
        try {
            // Get production record with category name
            $stmt = $pdo->prepare('
                SELECT pr.*, pmc.name as category_name 
                FROM production_records pr 
                LEFT JOIN product_mix_categories pmc ON pr.product_mix_category_id = pmc.id
                WHERE pr.id = ?
            ');
            $stmt->execute([$id]);
            $production = $stmt->fetch();
            
            if (!$production) {
                return ['error' => 'Production record not found'];
            }
            
            $mixWeight = (float)($body['mixWeight'] ?? 0);
            $rawPackedItems = isset($body['rawPackedItems']) ? (float)$body['rawPackedItems'] : null;
            $mixCategoryId = $production['product_mix_category_id'];
            $mixCategoryName = $production['product_mix_category_name'] ?? $production['category_name'] ?? 'Unknown Mix';
            
            // Ensure we have a valid category name
            if (empty($mixCategoryName)) {
                $mixCategoryName = 'Unknown Mix';
            }

            // Compute mixing discrepancy (total ingredient weight − actual mix weight output)
            $totalIngredientWeight = 0;
            if (!empty($production['initial_ingredients'])) {
                $initialIngs = json_decode($production['initial_ingredients'], true);
                if (is_array($initialIngs)) {
                    foreach ($initialIngs as $ing) {
                        $totalIngredientWeight += (float)($ing['quantity'] ?? 0);
                    }
                }
            }
            $mixingDiscrepancy = round($totalIngredientWeight - $mixWeight, 3);

            // Insert into product_mix_inventory with the mix weight
            $cost = 0;
            $stmt = $pdo->prepare('
                INSERT INTO product_mix_inventory (
                    product_mix_category_id, product_mix_name, weight, unit, stock, cost, production_record_id, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
            ');
            $stmt->execute([
                $mixCategoryId, $mixCategoryName, $mixWeight, 'kg', $mixWeight, $cost, $id
            ]);

            // Mixing is complete — store the output in mix inventory (done above) and mark batch as completed.
            // Do NOT automatically advance to packing; the user will manually start packing from mix inventory when ready.
            $mixingDiscrepancyReason = $body['discrepancyReason'] ?? null;
            $stmt = $pdo->prepare('
                UPDATE production_records 
                SET phase = ?, status = ?, mix_weight = ?, raw_packed_items = ?, product_mix_category_name = ?, mixing_discrepancy = ?, mixing_discrepancy_reason = ?, updated_at = NOW()
                WHERE id = ?
            ');
            $stmt->execute(['completed', 'completed', $mixWeight, $rawPackedItems, $mixCategoryName, $mixingDiscrepancy, $mixingDiscrepancyReason, $id]);
            
            // Return updated record
            $stmt = $pdo->prepare('
                SELECT pr.*, pmc.name as product_mix_category_name 
                FROM production_records pr 
                LEFT JOIN product_mix_categories pmc ON pr.product_mix_category_id = pmc.id
                WHERE pr.id = ?
            ');
            $stmt->execute([$id]);
            $r = $stmt->fetch();
            
            // Log history
            logSystemHistory($pdo, 'Mixing Completed', 'ProductionRecord', $id, [
                'batchNumber'           => $r['batch_number'],
                'operator'              => $r['operator'],
                'category'              => $r['product_mix_category_name'],
                'totalIngredientsKg'    => $totalIngredientWeight,
                'mixWeightKg'           => (float)$r['mix_weight'],
                'mixingDiscrepancy'     => $mixingDiscrepancy,
                'mixingDiscrepancyReason' => $mixingDiscrepancyReason ?: null,
            ]);

            return [
                'record' => [
                    'id' => (string)$r['id'],
                    'productMixCategoryId' => $r['product_mix_category_id'] ? (string)$r['product_mix_category_id'] : null,
                    'productMixCategoryName' => $r['product_mix_category_name'],
                    'quantity' => (float)$r['quantity'],
                    'mixWeight' => (float)$r['mix_weight'],
                    'rawPackedItems' => $r['raw_packed_items'] !== null ? (float)$r['raw_packed_items'] : null,
                    'batchNumber' => $r['batch_number'],
                    'operator' => $r['operator'],
                    'status' => $r['status'],
                    'phase' => $r['phase'],
                    'timestamp' => $r['created_at'],
                ]
            ];
        } catch (Exception $e) {
            http_response_code(500);
            return ['error' => 'Failed to complete mixing: ' . $e->getMessage()];
        }
    },
    
    // Complete packing phase - create product mix inventory
    'POST /api/production/{id}/complete-packing' => function() use ($pdo, $body) {
        $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        preg_match('/\/api\/production\/(\d+)\/complete-packing/', $uri, $matches);
        $id = $matches[1] ?? null;

        if (!$id) {
            return ['error' => 'Production ID is required'];
        }

        try {
            // Get production record with category name
            $stmt = $pdo->prepare('
                SELECT pr.*, pmc.name as category_name
                FROM production_records pr
                LEFT JOIN product_mix_categories pmc ON pr.product_mix_category_id = pmc.id
                WHERE pr.id = ?
            ');
            $stmt->execute([$id]);
            $production = $stmt->fetch();

            if (!$production) {
                return ['error' => 'Production record not found'];
            }

            $rawPackedItems = isset($body['rawPackedItems']) ? (float)$body['rawPackedItems'] : null;
            // Mix inventory weight comes from the original mix_weight recorded during mixing
            $mixWeightForInventory = (float)($production['mix_weight'] ?? 0);

            // Validate: raw packed items cannot be less than mix weight
            if ($rawPackedItems !== null && $mixWeightForInventory > 0 && $rawPackedItems < $mixWeightForInventory) {
                http_response_code(422);
                return ['error' => "Raw packed items ({$rawPackedItems} KG) cannot be less than the mix weight ({$mixWeightForInventory} KG)."];
            }

            // Compute packing discrepancy (mix weight consumed − raw packed items output)
            $packingDiscrepancy = round($mixWeightForInventory - (float)($rawPackedItems ?? 0), 3);
            $mixCategoryId = $production['product_mix_category_id'];
            $mixCategoryName = $production['product_mix_category_name'] ?? $production['category_name'] ?? 'Unknown Mix';

            if (empty($mixCategoryName)) {
                $mixCategoryName = 'Unknown Mix';
            }

            // Calculate cost from initial ingredients
            $cost = 0;
            if (!empty($production['initial_ingredients'])) {
                $ingredients = json_decode($production['initial_ingredients'], true);
                if (is_array($ingredients)) {
                    foreach ($ingredients as $ing) {
                        $cost += ($ing['quantity'] ?? 0) * 10;
                    }
                }
            }

            // Deduct mix weight from product_mix_inventory (mix is consumed during packing)
            if ($mixWeightForInventory > 0) {
                $stmt = $pdo->prepare('
                    UPDATE product_mix_inventory
                    SET stock = GREATEST(0, stock - ?), updated_at = NOW()
                    WHERE product_mix_category_id = ?
                    ORDER BY created_at ASC
                    LIMIT 1
                ');
                $stmt->execute([$mixWeightForInventory, $mixCategoryId]);
            }

            // Create raw product inventory record using the raw packed items weight
            try {
                error_log("Creating raw product inventory from packing: categoryId=$mixCategoryId, name=$mixCategoryName, weight=$rawPackedItems, prodId=$id");

                $stmt = $pdo->prepare('
                    INSERT INTO raw_product_inventory (
                        product_mix_category_id,
                        product_mix_name,
                        weight,
                        unit,
                        stock,
                        cost,
                        production_record_id,
                        created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
                ');
                $result = $stmt->execute([
                    $mixCategoryId,
                    $mixCategoryName,
                    $rawPackedItems,
                    'kg',
                    $rawPackedItems,
                    $cost,
                    $id
                ]);

                if (!$result) {
                    $errorInfo = $stmt->errorInfo();
                    error_log("Raw product inventory INSERT failed: " . print_r($errorInfo, true));
                    throw new Exception("Failed to insert raw product inventory: " . $errorInfo[2]);
                }

                $insertedId = $pdo->lastInsertId();
                error_log("Raw product inventory created with ID: $insertedId");

            } catch (Exception $rawInsertError) {
                error_log("Raw product inventory creation error: " . $rawInsertError->getMessage());
                throw $rawInsertError;
            }

            // Deduct packing ingredients from ingredient stock
            $packingIngredients = $body['packingIngredients'] ?? [];
            if (is_array($packingIngredients) && count($packingIngredients) > 0) {
                foreach ($packingIngredients as $ing) {
                    $ingId  = $ing['ingredientId'] ?? null;
                    $ingQty = isset($ing['quantity']) ? floatval($ing['quantity']) : 0;
                    if ($ingId && $ingQty > 0) {
                        try {
                            $pdo->prepare('UPDATE ingredients SET stock = stock - ?, updated_at = NOW() WHERE id = ?')
                                ->execute([$ingQty, $ingId]);
                        } catch (Exception $ingErr) {
                            error_log('Packing ingredient deduction failed for ID ' . $ingId . ': ' . $ingErr->getMessage());
                        }
                    }
                }
            }

            // Packing is complete — store the output in raw product inventory (done above) and mark batch as completed.
            // Do NOT automatically advance to cooking; the user will manually start cooking from raw inventory when ready.
            $packingDiscrepancyReason = $body['discrepancyReason'] ?? null;
            $stmt = $pdo->prepare('
                UPDATE production_records
                SET phase = ?, status = ?, raw_packed_items = ?, packing_discrepancy = ?, packing_discrepancy_reason = ?, updated_at = NOW()
                WHERE id = ?
            ');
            $stmt->execute(['completed', 'completed', $rawPackedItems, $packingDiscrepancy, $packingDiscrepancyReason, $id]);

            // Return updated record
            $stmt = $pdo->prepare('
                SELECT pr.*, pmc.name as product_mix_category_name
                FROM production_records pr
                LEFT JOIN product_mix_categories pmc ON pr.product_mix_category_id = pmc.id
                WHERE pr.id = ?
            ');
            $stmt->execute([$id]);
            $r = $stmt->fetch();

            // Log history
            logSystemHistory($pdo, 'Packing Completed', 'ProductionRecord', $id, [
                'batchNumber'             => $r['batch_number'],
                'operator'                => $r['operator'],
                'category'                => $r['product_mix_category_name'],
                'mixWeightInputKg'        => $mixWeightForInventory,
                'rawPackedItemsKg'        => $rawPackedItems,
                'packingDiscrepancy'      => $packingDiscrepancy,
                'packingDiscrepancyReason' => $packingDiscrepancyReason ?: null,
            ]);

            return [
                'record' => [
                    'id' => (string)$r['id'],
                    'productMixCategoryId' => $r['product_mix_category_id'] ? (string)$r['product_mix_category_id'] : null,
                    'productMixCategoryName' => $r['product_mix_category_name'],
                    'quantity' => (float)$r['quantity'],
                    'mixWeight' => (float)$r['mix_weight'],
                    'rawPackedItems' => $r['raw_packed_items'] !== null ? (float)$r['raw_packed_items'] : null,
                    'batchNumber' => $r['batch_number'],
                    'operator' => $r['operator'],
                    'status' => $r['status'],
                    'phase' => $r['phase'],
                    'timestamp' => $r['created_at'],
                ]
            ];
        } catch (Exception $e) {
            http_response_code(500);
            return ['error' => 'Failed to complete packing: ' . $e->getMessage()];
        }
    },

    // Complete cooking phase - deduct mix, create products
    'POST /api/production/{id}/complete-cooking' => function() use ($pdo, $body) {
        $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        preg_match('/\/api\/production\/(\d+)\/complete-cooking/', $uri, $matches);
        $id = $matches[1] ?? null;
        
        if (!$id) {
            return ['error' => 'Production ID is required'];
        }
        
        try {
            // Get production record
            $stmt = $pdo->prepare('SELECT * FROM production_records WHERE id = ?');
            $stmt->execute([$id]);
            $production = $stmt->fetch();
            
            if (!$production) {
                return ['error' => 'Production record not found'];
            }
            
            $mixUsed = (float)($body['mixUsed'] ?? 0);
            $products = $body['products'] ?? [];
            $cookingIngredients = $body['cookingIngredients'] ?? [];
            
            // Deduct cooking ingredients from stock
            if (is_array($cookingIngredients) && count($cookingIngredients) > 0) {
                foreach ($cookingIngredients as $ing) {
                    $ingredientId = $ing['ingredientId'] ?? null;
                    $quantity = isset($ing['quantity']) ? floatval($ing['quantity']) : 0;
                    
                    if ($ingredientId && $quantity > 0) {
                        try {
                            $stmt = $pdo->prepare('
                                UPDATE ingredients 
                                SET stock = stock - ?, updated_at = NOW()
                                WHERE id = ?
                            ');
                            $stmt->execute([$quantity, $ingredientId]);
                        } catch (Exception $ingredientError) {
                            error_log('Cooking ingredient deduction failed for ID ' . $ingredientId . ': ' . $ingredientError->getMessage());
                        }
                    }
                }
            }
            
            // Deduct raw packed items from raw_product_inventory
            if ($mixUsed > 0) {
                $stmt = $pdo->prepare('
                    UPDATE raw_product_inventory 
                    SET stock = stock - ?, updated_at = NOW()
                    WHERE product_mix_category_id = ?
                    ORDER BY created_at DESC
                    LIMIT 1
                ');
                $stmt->execute([$mixUsed, $production['product_mix_category_id']]);
            }
            
            // Create product outputs and add to inventory
            if (is_array($products) && count($products) > 0) {
                foreach ($products as $product) {
                    $productId = $product['productId'] ?? null;
                    $quantity = $product['quantity'] ?? 0;
                    
                    if ($productId && $quantity > 0) {
                        // Get product details
                        $stmt = $pdo->prepare('SELECT name, unit FROM products WHERE id = ?');
                        $stmt->execute([$productId]);
                        $productInfo = $stmt->fetch();
                        
                        if ($productInfo) {
                            // Record output
                            $stmt = $pdo->prepare('
                                INSERT INTO production_outputs (
                                    production_record_id,
                                    product_id,
                                    product_name,
                                    quantity,
                                    unit,
                                    created_at
                                ) VALUES (?, ?, ?, ?, ?, NOW())
                            ');
                            $stmt->execute([
                                $id,
                                $productId,
                                $productInfo['name'],
                                $quantity,
                                $productInfo['unit']
                            ]);
                            
                            // Add to Production Facility inventory
                            $stmt = $pdo->prepare('
                                INSERT INTO inventory (product_id, location, quantity, created_at) 
                                VALUES (?, ?, ?, NOW())
                                ON DUPLICATE KEY UPDATE quantity = quantity + ?, updated_at = NOW()
                            ');
                            $stmt->execute([$productId, 'Production Facility', $quantity, $quantity]);
                        }
                    }
                }
            }
            
            // Compute cooking discrepancy (raw packed items used − total finished product output)
            $totalProductOutput = array_sum(array_column($products, 'quantity'));
            $cookingDiscrepancy = round($mixUsed - $totalProductOutput, 3);
            $cookingDiscrepancyReason = $body['discrepancyReason'] ?? null;

            // Update production record to completed
            $stmt = $pdo->prepare('
                UPDATE production_records 
                SET phase = ?, status = ?, mix_used = ?, cooking_discrepancy = ?, cooking_discrepancy_reason = ?, updated_at = NOW()
                WHERE id = ?
            ');
            $stmt->execute(['completed', 'completed', $mixUsed, $cookingDiscrepancy, $cookingDiscrepancyReason, $id]);
            
            // Return updated record with outputs
            $stmt = $pdo->prepare('
                SELECT pr.*, pmc.name as product_mix_category_name 
                FROM production_records pr 
                LEFT JOIN product_mix_categories pmc ON pr.product_mix_category_id = pmc.id
                WHERE pr.id = ?
            ');
            $stmt->execute([$id]);
            $r = $stmt->fetch();
            
            // Get outputs
            $stmt = $pdo->prepare('SELECT * FROM production_outputs WHERE production_record_id = ?');
            $stmt->execute([$id]);
            $outputs = $stmt->fetchAll();
            
            // Log history
            logSystemHistory($pdo, 'Cooking Completed', 'ProductionRecord', $id, [
                'batchNumber'              => $r['batch_number'],
                'operator'                 => $r['operator'],
                'category'                 => $r['product_mix_category_name'],
                'rawPackedUsedKg'          => $mixUsed,
                'totalOutputKg'            => $totalProductOutput,
                'cookingDiscrepancy'       => $cookingDiscrepancy,
                'cookingDiscrepancyReason' => $cookingDiscrepancyReason ?: null,
                'outputCount'              => count($outputs),
            ]);

            return [
                'record' => [
                    'id' => (string)$r['id'],
                    'productMixCategoryId' => $r['product_mix_category_id'] ? (string)$r['product_mix_category_id'] : null,
                    'productMixCategoryName' => $r['product_mix_category_name'],
                    'quantity' => (float)$r['quantity'],
                    'mixWeight' => (float)$r['mix_weight'],
                    'mixUsed' => (float)$r['mix_used'],
                    'batchNumber' => $r['batch_number'],
                    'operator' => $r['operator'],
                    'status' => $r['status'],
                    'phase' => $r['phase'],
                    'timestamp' => $r['created_at'],
                    'outputs' => array_map(function($o) {
                        return [
                            'id' => (string)$o['id'],
                            'productId' => (string)$o['product_id'],
                            'productName' => $o['product_name'],
                            'quantity' => (float)$o['quantity'],
                            'unit' => $o['unit'],
                        ];
                    }, $outputs),
                ]
            ];
        } catch (Exception $e) {
            http_response_code(500);
            return ['error' => 'Failed to complete cooking: ' . $e->getMessage()];
        }
    },
    
    // Start packing from mix inventory (skips mixing step)
    'POST /api/production/start-packing-from-mix' => function() use ($pdo, $body) {
        try {
            $categoryId   = $body['categoryId'] ?? null;
            $categoryName = $body['categoryName'] ?? 'Unknown Mix';
            $batchNumber  = $body['batchNumber'] ?? null;
            $operator     = $body['operator'] ?? '';
            $mixWeight    = isset($body['mixWeight']) ? (float)$body['mixWeight'] : 0;

            if (!$categoryId || !$batchNumber || $mixWeight <= 0) {
                return ['error' => 'categoryId, batchNumber, and mixWeight are required'];
            }

            // Check available mix stock
            $stmt = $pdo->prepare('SELECT SUM(stock) as total FROM product_mix_inventory WHERE product_mix_category_id = ?');
            $stmt->execute([$categoryId]);
            $available = (float)($stmt->fetchColumn() ?? 0);
            if ($available < $mixWeight) {
                return ['error' => "Insufficient mix stock. Available: {$available} KG, Requested: {$mixWeight} KG"];
            }

            // Deduct from mix inventory (oldest first)
            $remaining = $mixWeight;
            $rows = $pdo->prepare('SELECT id, stock FROM product_mix_inventory WHERE product_mix_category_id = ? AND stock > 0 ORDER BY created_at ASC');
            $rows->execute([$categoryId]);
            foreach ($rows->fetchAll() as $row) {
                if ($remaining <= 0) break;
                $deduct = min($remaining, (float)$row['stock']);
                $pdo->prepare('UPDATE product_mix_inventory SET stock = stock - ?, updated_at = NOW() WHERE id = ?')->execute([$deduct, $row['id']]);
                $remaining -= $deduct;
            }

            // Create production record at packing phase
            $packingIngredients = $body['packingIngredients'] ?? [];
            $initialIngredientsJson = !empty($packingIngredients) ? json_encode($packingIngredients) : null;

            $stmt = $pdo->prepare('
                INSERT INTO production_records
                    (product_mix_category_id, product_mix_category_name, batch_number, operator, quantity, mix_weight, phase, status, initial_ingredients, created_at, updated_at)
                VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?, NOW(), NOW())
            ');
            $stmt->execute([$categoryId, $categoryName, $batchNumber, $operator, $mixWeight, 'packing', 'in-progress', $initialIngredientsJson]);
            $newId = $pdo->lastInsertId();

            // Deduct packing ingredients from stock
            if (is_array($packingIngredients) && count($packingIngredients) > 0) {
                foreach ($packingIngredients as $ing) {
                    $ingId  = $ing['ingredientId'] ?? null;
                    $ingQty = isset($ing['quantity']) ? floatval($ing['quantity']) : 0;
                    if ($ingId && $ingQty > 0) {
                        try {
                            $pdo->prepare('UPDATE ingredients SET stock = stock - ?, updated_at = NOW() WHERE id = ?')
                                ->execute([$ingQty, $ingId]);
                        } catch (Exception $ingErr) {
                            error_log('Start-packing ingredient deduction failed for ID ' . $ingId . ': ' . $ingErr->getMessage());
                        }
                    }
                }
            }

            // Log history
            logSystemHistory($pdo, 'Packing Started (from mix inventory)', 'ProductionRecord', $newId, [
                'batchNumber' => $batchNumber,
                'operator'    => $operator,
                'category'    => $categoryName,
                'mixWeight'   => $mixWeight,
                'ingredientsUsed' => count($packingIngredients),
                'note'        => 'Packing started directly from mix inventory (mixing step skipped)',
            ]);

            $stmt = $pdo->prepare('SELECT pr.*, pmc.name as product_mix_category_name FROM production_records pr LEFT JOIN product_mix_categories pmc ON pr.product_mix_category_id = pmc.id WHERE pr.id = ?');
            $stmt->execute([$newId]);
            $r = $stmt->fetch();

            return ['record' => [
                'id' => (string)$r['id'],
                'productMixCategoryId' => (string)$r['product_mix_category_id'],
                'productMixCategoryName' => $r['product_mix_category_name'],
                'batchNumber' => $r['batch_number'],
                'operator' => $r['operator'],
                'quantity' => (float)$r['quantity'],
                'mixWeight' => (float)$r['mix_weight'],
                'phase' => $r['phase'],
                'status' => $r['status'],
                'timestamp' => $r['created_at'],
            ]];
        } catch (Exception $e) {
            http_response_code(500);
            return ['error' => 'Failed to start packing: ' . $e->getMessage()];
        }
    },

    // Start cooking from raw product inventory (skips packing step)
    'POST /api/production/start-cooking-from-raw' => function() use ($pdo, $body) {
        try {
            $categoryId   = $body['categoryId'] ?? null;
            $categoryName = $body['categoryName'] ?? 'Unknown';
            $batchNumber  = $body['batchNumber'] ?? null;
            $operator     = $body['operator'] ?? '';
            $rawWeight    = isset($body['rawWeight']) ? (float)$body['rawWeight'] : 0;

            if (!$categoryId || !$batchNumber || $rawWeight <= 0) {
                return ['error' => 'categoryId, batchNumber, and rawWeight are required'];
            }

            // Check available raw stock
            $stmt = $pdo->prepare('SELECT SUM(stock) as total FROM raw_product_inventory WHERE product_mix_category_id = ?');
            $stmt->execute([$categoryId]);
            $available = (float)($stmt->fetchColumn() ?? 0);
            if ($available < $rawWeight) {
                return ['error' => "Insufficient raw packed stock. Available: {$available} KG, Requested: {$rawWeight} KG"];
            }

            // Deduct from raw inventory (oldest first)
            $remaining = $rawWeight;
            $rows = $pdo->prepare('SELECT id, stock FROM raw_product_inventory WHERE product_mix_category_id = ? AND stock > 0 ORDER BY created_at ASC');
            $rows->execute([$categoryId]);
            foreach ($rows->fetchAll() as $row) {
                if ($remaining <= 0) break;
                $deduct = min($remaining, (float)$row['stock']);
                $pdo->prepare('UPDATE raw_product_inventory SET stock = stock - ?, updated_at = NOW() WHERE id = ?')->execute([$deduct, $row['id']]);
                $remaining -= $deduct;
            }

            // Create production record at cooking phase
            $cookingIngredients = $body['cookingIngredients'] ?? [];
            $initialIngredientsJson = !empty($cookingIngredients) ? json_encode($cookingIngredients) : null;

            $stmt = $pdo->prepare('
                INSERT INTO production_records
                    (product_mix_category_id, product_mix_category_name, batch_number, operator, quantity, raw_packed_items, phase, status, initial_ingredients, created_at, updated_at)
                VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?, NOW(), NOW())
            ');
            $stmt->execute([$categoryId, $categoryName, $batchNumber, $operator, $rawWeight, 'cooking', 'in-progress', $initialIngredientsJson]);
            $newId = $pdo->lastInsertId();

            // Deduct cooking ingredients from stock
            if (is_array($cookingIngredients) && count($cookingIngredients) > 0) {
                foreach ($cookingIngredients as $ing) {
                    $ingId  = $ing['ingredientId'] ?? null;
                    $ingQty = isset($ing['quantity']) ? floatval($ing['quantity']) : 0;
                    if ($ingId && $ingQty > 0) {
                        try {
                            $pdo->prepare('UPDATE ingredients SET stock = stock - ?, updated_at = NOW() WHERE id = ?')
                                ->execute([$ingQty, $ingId]);
                        } catch (Exception $ingErr) {
                            error_log('Start-cooking ingredient deduction failed for ID ' . $ingId . ': ' . $ingErr->getMessage());
                        }
                    }
                }
            }

            // Log history
            logSystemHistory($pdo, 'Cooking Started (from raw inventory)', 'ProductionRecord', $newId, [
                'batchNumber' => $batchNumber,
                'operator'    => $operator,
                'category'    => $categoryName,
                'rawWeight'   => $rawWeight,
                'ingredientsUsed' => count($cookingIngredients),
                'note'        => 'Cooking started directly from raw product inventory (packing step skipped)',
            ]);

            $stmt = $pdo->prepare('SELECT pr.*, pmc.name as product_mix_category_name FROM production_records pr LEFT JOIN product_mix_categories pmc ON pr.product_mix_category_id = pmc.id WHERE pr.id = ?');
            $stmt->execute([$newId]);
            $r = $stmt->fetch();

            return ['record' => [
                'id' => (string)$r['id'],
                'productMixCategoryId' => (string)$r['product_mix_category_id'],
                'productMixCategoryName' => $r['product_mix_category_name'],
                'batchNumber' => $r['batch_number'],
                'operator' => $r['operator'],
                'quantity' => (float)$r['quantity'],
                'rawPackedItems' => (float)$r['raw_packed_items'],
                'phase' => $r['phase'],
                'status' => $r['status'],
                'timestamp' => $r['created_at'],
            ]];
        } catch (Exception $e) {
            http_response_code(500);
            return ['error' => 'Failed to start cooking: ' . $e->getMessage()];
        }
    },

    // Get raw product inventory (packed items ready for cooking)
    'GET /api/raw-product-inventory' => function() use ($pdo) {
        try {
            $stmt = $pdo->query('
                SELECT rpi.*, pmc.name as category_name
                FROM raw_product_inventory rpi
                INNER JOIN product_mix_categories pmc ON rpi.product_mix_category_id = pmc.id
                ORDER BY rpi.created_at DESC
            ');
            $inventory = $stmt->fetchAll();
            
            return [
                'inventory' => array_map(function($i) {
                    return [
                        'id' => (string)$i['id'],
                        'productMixCategoryId' => (string)$i['product_mix_category_id'],
                        'productMixName' => $i['product_mix_name'],
                        'categoryName' => $i['category_name'],
                        'weight' => (float)$i['weight'],
                        'unit' => $i['unit'],
                        'stock' => (float)$i['stock'],
                        'cost' => (float)$i['cost'],
                        'createdAt' => $i['created_at'],
                    ];
                }, $inventory),
            ];
        } catch (Exception $e) {
            http_response_code(500);
            return ['error' => 'Failed to get raw product inventory: ' . $e->getMessage()];
        }
    },
    
    // Get product mix inventory
    'GET /api/product-mix-inventory' => function() use ($pdo) {
        try {
            $stmt = $pdo->query('
                SELECT pmi.*, pmc.name as category_name
                FROM product_mix_inventory pmi
                INNER JOIN product_mix_categories pmc ON pmi.product_mix_category_id = pmc.id
                ORDER BY pmi.created_at DESC
            ');
            $inventory = $stmt->fetchAll();
            
            return [
                'inventory' => array_map(function($i) {
                    return [
                        'id' => (string)$i['id'],
                        'productMixCategoryId' => (string)$i['product_mix_category_id'],
                        'productMixName' => $i['product_mix_name'],
                        'categoryName' => $i['category_name'],
                        'weight' => (float)$i['weight'],
                        'unit' => $i['unit'],
                        'stock' => (float)$i['stock'],
                        'cost' => (float)$i['cost'],
                        'createdAt' => $i['created_at'],
                    ];
                }, $inventory),
            ];
        } catch (Exception $e) {
            http_response_code(500);
            return ['error' => 'Failed to get product mix inventory: ' . $e->getMessage()];
        }
    },
    
    'GET /api/transfers' => function() use ($pdo) {
        $stmt = $pdo->query('SELECT t.*, p.name as product_name FROM transfers t LEFT JOIN products p ON t.product_id = p.id ORDER BY t.created_at DESC LIMIT 100');
        $transfers = $stmt->fetchAll();
        
        return [
            'transfers' => array_map(function($t) {
                $quantityReceived = $t['quantity_received'] ?? null;
                $originalQuantity = $t['quantity'];
                $discrepancy = $quantityReceived ? $originalQuantity - $quantityReceived : null;
                
                return [
                    'id' => (string)$t['id'],
                    'productId' => (string)$t['product_id'],
                    'productName' => $t['product_name'] ?? 'Unknown Product',
                    'sku' => $t['sku'] ?? '',
                    'unit' => $t['unit'] ?? 'kg',
                    'from' => $t['from'],
                    'to' => $t['to'],
                    'quantity' => (float)$t['quantity'],
                    'quantityReceived' => $quantityReceived ? (float)$quantityReceived : null,
                    'discrepancy' => $discrepancy,
                    'discrepancyReason' => $t['discrepancy_reason'],
                    'date' => substr($t['created_at'], 0, 10),
                    'time' => substr($t['created_at'], 11, 5),
                    'status' => strtolower(str_replace(' ', '-', $t['status'])),
                    'transferredBy' => $t['transferred_by'] ?? $t['requested_by'],
                    'receivedBy' => $t['received_by'],
                    'createdAt' => $t['created_at'],
                ];
            }, $transfers),
        ];
    },
    
    'POST /api/transfers' => function() use ($pdo, $body) {
        $stmt = $pdo->prepare('INSERT INTO transfers (product_id, `from`, `to`, quantity, status, requested_by, transferred_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())');
        $stmt->execute([
            $body['productId'] ?? null,
            $body['from'] ?? '',
            $body['to'] ?? '',
            $body['quantity'] ?? 0,
            $body['status'] ?? 'In Transit',
            $body['requestedBy'] ?? '',
            $body['transferredBy'] ?? $body['requestedBy'] ?? '',
        ]);
        
        $transferId = $pdo->lastInsertId();
        
        logSystemHistory($pdo, 'Transfer Created', 'Transfer', (string)$transferId, [
            'from' => $body['from'] ?? '',
            'to' => $body['to'] ?? '',
            'quantity' => $body['quantity'] ?? 0,
            'requestedBy' => $body['requestedBy'] ?? '',
        ]);
        
        // Fetch the created transfer with full details
        $stmt = $pdo->prepare('SELECT t.*, p.name as product_name FROM transfers t LEFT JOIN products p ON t.product_id = p.id WHERE t.id = ?');
        $stmt->execute([$transferId]);
        $t = $stmt->fetch();
        
        if ($t) {
            $quantityReceived = $t['quantity_received'] ?? null;
            $originalQuantity = $t['quantity'];
            $discrepancy = $quantityReceived ? $originalQuantity - $quantityReceived : null;
            
            return [
                'transfer' => [
                    'id' => (string)$t['id'],
                    'productId' => (string)$t['product_id'],
                    'productName' => $t['product_name'] ?? 'Unknown Product',
                    'sku' => $t['sku'] ?? '',
                    'unit' => $t['unit'] ?? 'kg',
                    'from' => $t['from'],
                    'to' => $t['to'],
                    'quantity' => (float)$t['quantity'],
                    'quantityReceived' => $quantityReceived ? (float)$quantityReceived : null,
                    'discrepancy' => $discrepancy,
                    'discrepancyReason' => $t['discrepancy_reason'],
                    'date' => substr($t['created_at'], 0, 10),
                    'time' => substr($t['created_at'], 11, 5),
                    'status' => strtolower(str_replace(' ', '-', $t['status'])),
                    'transferredBy' => $t['transferred_by'] ?? $t['requested_by'],
                    'receivedBy' => $t['received_by'],
                    'createdAt' => $t['created_at'],
                ]
            ];
        }
        
        return ['error' => 'Failed to retrieve created transfer'];
    },
    
    'POST /api/transfers/{id}/receive' => function() use ($pdo, $body) {
        // Extract transfer ID from URI
        $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        preg_match('/\/api\/transfers\/(\d+)\/receive/', $uri, $matches);
        $transferId = $matches[1] ?? null;
        
        if (!$transferId) {
            http_response_code(400);
            return ['error' => 'Transfer ID is required'];
        }
        
        try {
            // Get the transfer
            $stmt = $pdo->prepare('SELECT * FROM transfers WHERE id = ?');
            $stmt->execute([$transferId]);
            $transfer = $stmt->fetch();
            
            if (!$transfer) {
                http_response_code(404);
                return ['error' => 'Transfer not found'];
            }
            
            // Check status
            if ($transfer['status'] !== 'In Transit' && $transfer['status'] !== 'Pending') {
                http_response_code(400);
                return ['error' => 'Transfer must be in transit to receive'];
            }
            
            $quantityReceived = $body['quantityReceived'] ?? $transfer['quantity'];
            $originalQuantity = $transfer['quantity'];
            $productId = $transfer['product_id'];
            $fromLocation = $transfer['from'];
            $toLocation = $transfer['to'];
            
            // Update inventory at source location (decrease)
            $stmt = $pdo->prepare('
                INSERT INTO inventory (product_id, location, quantity, created_at) 
                VALUES (?, ?, ?, NOW())
                ON DUPLICATE KEY UPDATE quantity = quantity - ?, updated_at = NOW()
            ');
            $stmt->execute([$productId, $fromLocation, -$quantityReceived, $quantityReceived]);
            
            // Update inventory at destination location (increase)
            $stmt = $pdo->prepare('
                INSERT INTO inventory (product_id, location, quantity, created_at) 
                VALUES (?, ?, ?, NOW())
                ON DUPLICATE KEY UPDATE quantity = quantity + ?, updated_at = NOW()
            ');
            $stmt->execute([$productId, $toLocation, $quantityReceived, $quantityReceived]);
            
            // Update transfer with receipt details
            $stmt = $pdo->prepare('
                UPDATE transfers 
                SET status = ?, 
                    quantity_received = ?, 
                    discrepancy = ?,
                    discrepancy_reason = ?, 
                    received_by = ?, 
                    received_at = NOW() 
                WHERE id = ?
            ');
            
            $discrepancyValue = (float)$originalQuantity - (float)$quantityReceived;
            
            $stmt->execute([
                'Completed',
                $quantityReceived,
                $discrepancyValue,
                $body['discrepancyReason'] ?? null,
                $body['receivedBy'] ?? null,
                $transferId
            ]);
            
            // Fetch updated transfer with product details
            $stmt = $pdo->prepare('SELECT t.*, p.name as product_name FROM transfers t LEFT JOIN products p ON t.product_id = p.id WHERE t.id = ?');
            $stmt->execute([$transferId]);
            $updatedTransfer = $stmt->fetch();
            
            if (!$updatedTransfer) {
                http_response_code(404);
                return ['error' => 'Transfer not found after update'];
            }
            
            $discrepancy = $discrepancyValue;
            
            logSystemHistory($pdo, 'Transfer Received', 'Transfer', (string)$transferId, [
                'from' => $transfer['from'],
                'to' => $transfer['to'],
                'quantitySent' => $originalQuantity,
                'quantityReceived' => $quantityReceived,
                'discrepancy' => $discrepancy,
                'discrepancyReason' => $body['discrepancyReason'] ?? null,
                'receivedBy' => $body['receivedBy'] ?? null,
            ]);
            
            return [
                'transfer' => [
                    'id' => (string)$updatedTransfer['id'],
                    'productId' => (string)$updatedTransfer['product_id'],
                    'productName' => $updatedTransfer['product_name'],
                    'sku' => $updatedTransfer['sku'] ?? '',
                    'unit' => $updatedTransfer['unit'] ?? 'kg',
                    'from' => $updatedTransfer['from'],
                    'to' => $updatedTransfer['to'],
                    'quantity' => (float)$updatedTransfer['quantity'],
                    'quantityReceived' => (float)$quantityReceived,
                    'discrepancy' => $updatedTransfer['discrepancy'] !== null ? (float)$updatedTransfer['discrepancy'] : $discrepancy,
                    'discrepancyReason' => $updatedTransfer['discrepancy_reason'],
                    'date' => substr($updatedTransfer['created_at'], 0, 10),
                    'time' => substr($updatedTransfer['created_at'], 11, 5),
                    'status' => strtolower(str_replace(' ', '-', $updatedTransfer['status'])),
                    'transferredBy' => $updatedTransfer['transferred_by'] ?? $updatedTransfer['requested_by'],
                    'receivedBy' => $updatedTransfer['received_by'],
                    'createdAt' => $updatedTransfer['created_at'],
                    'updatedAt' => $updatedTransfer['updated_at'],
                ]
            ];
        } catch (Exception $e) {
            http_response_code(500);
            return ['error' => 'Failed to process transfer receipt: ' . $e->getMessage()];
        }
    },
    
    'PUT /api/transfers/{id}' => function() use ($pdo, $body) {
        // Extract transfer ID from URI
        $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        preg_match('/\/api\/transfers\/(\d+)(?:\/|$)/', $uri, $matches);
        $transferId = $matches[1] ?? null;
        
        if (!$transferId) {
            http_response_code(400);
            return ['error' => 'Transfer ID is required'];
        }
        
        try {
            // Get the transfer
            $stmt = $pdo->prepare('SELECT * FROM transfers WHERE id = ?');
            $stmt->execute([$transferId]);
            $transfer = $stmt->fetch();
            
            if (!$transfer) {
                http_response_code(404);
                return ['error' => 'Transfer not found'];
            }
            
            // Map status from kebab-case to proper case
            $statusMap = [
                'pending' => 'Pending',
                'in-transit' => 'In Transit',
                'completed' => 'Completed',
                'cancelled' => 'Cancelled',
                'rejected' => 'Rejected'
            ];
            
            $newStatus = $statusMap[$body['status']] ?? $body['status'];
            
            // Update transfer status
            $stmt = $pdo->prepare('UPDATE transfers SET status = ?, updated_at = NOW() WHERE id = ?');
            $stmt->execute([$newStatus, $transferId]);
            
            // Fetch updated transfer
            $stmt = $pdo->prepare('SELECT t.*, p.name as product_name FROM transfers t LEFT JOIN products p ON t.product_id = p.id WHERE t.id = ?');
            $stmt->execute([$transferId]);
            $updatedTransfer = $stmt->fetch();
            
            if (!$updatedTransfer) {
                http_response_code(404);
                return ['error' => 'Transfer not found after update'];
            }
            
            $quantityReceived = $updatedTransfer['quantity_received'] ?? 0;
            $originalQuantity = $updatedTransfer['quantity'];
            $discrepancy = $quantityReceived > 0 ? $originalQuantity - $quantityReceived : null;
            
            return [
                'transfer' => [
                    'id' => (string)$updatedTransfer['id'],
                    'productId' => (string)$updatedTransfer['product_id'],
                    'productName' => $updatedTransfer['product_name'],
                    'sku' => $updatedTransfer['sku'] ?? '',
                    'unit' => $updatedTransfer['unit'] ?? 'kg',
                    'from' => $updatedTransfer['from'],
                    'to' => $updatedTransfer['to'],
                    'quantity' => (float)$updatedTransfer['quantity'],
                    'quantityReceived' => $quantityReceived ? (float)$quantityReceived : null,
                    'discrepancy' => $discrepancy,
                    'discrepancyReason' => $updatedTransfer['discrepancy_reason'],
                    'date' => substr($updatedTransfer['created_at'], 0, 10),
                    'time' => substr($updatedTransfer['created_at'], 11, 5),
                    'status' => strtolower(str_replace(' ', '-', $updatedTransfer['status'])),
                    'transferredBy' => $updatedTransfer['transferred_by'] ?? $updatedTransfer['requested_by'],
                    'receivedBy' => $updatedTransfer['received_by'],
                    'createdAt' => $updatedTransfer['created_at'],
                    'updatedAt' => $updatedTransfer['updated_at'],
                ]
            ];
        } catch (Exception $e) {
            http_response_code(500);
            return ['error' => 'Failed to update transfer: ' . $e->getMessage()];
        }
    },
    
    'GET /api/suppliers' => function() use ($pdo) {
        $stmt = $pdo->query('SELECT * FROM suppliers ORDER BY name');
        $suppliers = $stmt->fetchAll();
        
        return [
            'suppliers' => array_map(function($s) {
                return [
                    'id' => (string)$s['id'],
                    'name' => $s['name'],
                    'contactPerson' => $s['contact_person'] ?? '',
                    'email' => $s['email'],
                    'phone' => $s['phone'],
                    'address' => $s['address'],
                    'createdAt' => $s['created_at'] ?? date('c'),
                ];
            }, $suppliers),
        ];
    },

    'POST /api/suppliers' => function() use ($pdo, $body) {
        try {
            $name = $body['name'] ?? '';
            $contactPerson = $body['contactPerson'] ?? '';
            $phone = $body['phone'] ?? '';
            $email = $body['email'] ?? '';
            $address = $body['address'] ?? '';

            if (empty($name)) {
                http_response_code(422);
                return ['error' => 'Supplier name is required'];
            }

            $stmt = $pdo->prepare('INSERT INTO suppliers (name, contact_person, phone, email, address, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())');
            $stmt->execute([$name, $contactPerson, $phone, $email, $address]);
            $id = $pdo->lastInsertId();

            $stmt = $pdo->prepare('SELECT * FROM suppliers WHERE id = ?');
            $stmt->execute([$id]);
            $supplier = $stmt->fetch();

            logSystemHistory($pdo, 'Supplier Created', 'Supplier', (string)$id, [
                'name' => $supplier['name'],
                'contactPerson' => $supplier['contact_person'] ?? '',
            ]);

            http_response_code(201);
            return [
                'supplier' => [
                    'id' => (string)$supplier['id'],
                    'name' => $supplier['name'],
                    'contactPerson' => $supplier['contact_person'] ?? '',
                    'phone' => $supplier['phone'],
                    'email' => $supplier['email'],
                    'address' => $supplier['address'],
                    'createdAt' => $supplier['created_at'],
                ],
            ];
        } catch (Exception $e) {
            http_response_code(500);
            return ['error' => 'Failed to create supplier: ' . $e->getMessage()];
        }
    },

    'PUT /api/suppliers/{id}' => function() use ($pdo, $body) {
        try {
            $uri = $_SERVER['REQUEST_URI'];
            preg_match('#/api/suppliers/(\d+)#', $uri, $matches);
            $id = $matches[1] ?? null;

            if (!$id) {
                http_response_code(400);
                return ['error' => 'Supplier ID is required'];
            }

            $stmt = $pdo->prepare('SELECT * FROM suppliers WHERE id = ?');
            $stmt->execute([$id]);
            $supplier = $stmt->fetch();

            if (!$supplier) {
                http_response_code(404);
                return ['error' => 'Supplier not found'];
            }

            $name = $body['name'] ?? $supplier['name'];
            $contactPerson = $body['contactPerson'] ?? $supplier['contact_person'];
            $phone = $body['phone'] ?? $supplier['phone'];
            $email = $body['email'] ?? $supplier['email'];
            $address = $body['address'] ?? $supplier['address'];

            $stmt = $pdo->prepare('UPDATE suppliers SET name = ?, contact_person = ?, phone = ?, email = ?, address = ?, updated_at = NOW() WHERE id = ?');
            $stmt->execute([$name, $contactPerson, $phone, $email, $address, $id]);

            $stmt = $pdo->prepare('SELECT * FROM suppliers WHERE id = ?');
            $stmt->execute([$id]);
            $updated = $stmt->fetch();

            logSystemHistory($pdo, 'Supplier Updated', 'Supplier', (string)$id, [
                'name' => $updated['name'],
            ]);

            return [
                'supplier' => [
                    'id' => (string)$updated['id'],
                    'name' => $updated['name'],
                    'contactPerson' => $updated['contact_person'] ?? '',
                    'phone' => $updated['phone'],
                    'email' => $updated['email'],
                    'address' => $updated['address'],
                    'createdAt' => $updated['created_at'],
                ],
            ];
        } catch (Exception $e) {
            http_response_code(500);
            return ['error' => 'Failed to update supplier: ' . $e->getMessage()];
        }
    },

    'DELETE /api/suppliers/{id}' => function() use ($pdo) {
        try {
            $uri = $_SERVER['REQUEST_URI'];
            preg_match('#/api/suppliers/(\d+)#', $uri, $matches);
            $id = $matches[1] ?? null;

            if (!$id) {
                http_response_code(400);
                return ['error' => 'Supplier ID is required'];
            }

            $stmt = $pdo->prepare('DELETE FROM suppliers WHERE id = ?');
            $stmt->execute([$id]);

            logSystemHistory($pdo, 'Supplier Deleted', 'Supplier', $id, []);

            return ['success' => true];
        } catch (Exception $e) {
            http_response_code(500);
            return ['error' => 'Failed to delete supplier: ' . $e->getMessage()];
        }
    },

    // ==================== SUPPLIER INVOICES ====================

    'GET /api/supplier-invoices' => function() use ($pdo) {
        try {
            $pdo->exec("CREATE TABLE IF NOT EXISTS supplier_invoices (
                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                supplier_id BIGINT UNSIGNED NOT NULL,
                receipt_number VARCHAR(100) NOT NULL,
                invoice_date DATE NOT NULL,
                amount DECIMAL(12,2) NOT NULL DEFAULT 0,
                paid DECIMAL(12,2) NOT NULL DEFAULT 0,
                remarks TEXT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_supplier (supplier_id),
                INDEX idx_date (invoice_date)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

            $supplierId = $_GET['supplierId'] ?? null;
            if ($supplierId) {
                $stmt = $pdo->prepare('SELECT si.*, s.name as supplier_name FROM supplier_invoices si LEFT JOIN suppliers s ON si.supplier_id = s.id WHERE si.supplier_id = ? ORDER BY si.invoice_date DESC, si.id DESC');
                $stmt->execute([$supplierId]);
            } else {
                $stmt = $pdo->query('SELECT si.*, s.name as supplier_name FROM supplier_invoices si LEFT JOIN suppliers s ON si.supplier_id = s.id ORDER BY si.invoice_date DESC, si.id DESC');
            }
            $rows = $stmt->fetchAll();
            return ['invoices' => array_map(function($r) {
                return [
                    'id'             => (string)$r['id'],
                    'supplierId'     => (string)$r['supplier_id'],
                    'supplierName'   => $r['supplier_name'] ?? '',
                    'receiptNumber'  => $r['receipt_number'],
                    'invoiceDate'    => $r['invoice_date'],
                    'amount'         => (float)$r['amount'],
                    'paid'           => (float)$r['paid'],
                    'balance'        => round((float)$r['amount'] - (float)$r['paid'], 2),
                    'remarks'        => $r['remarks'] ?? '',
                    'createdAt'      => $r['created_at'],
                ];
            }, $rows)];
        } catch (Exception $e) {
            http_response_code(500);
            return ['error' => 'Failed to fetch invoices: ' . $e->getMessage()];
        }
    },

    'POST /api/supplier-invoices' => function() use ($pdo, $body) {
        try {
            $pdo->exec("CREATE TABLE IF NOT EXISTS supplier_invoices (
                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                supplier_id BIGINT UNSIGNED NOT NULL,
                receipt_number VARCHAR(100) NOT NULL,
                invoice_date DATE NOT NULL,
                amount DECIMAL(12,2) NOT NULL DEFAULT 0,
                paid DECIMAL(12,2) NOT NULL DEFAULT 0,
                remarks TEXT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_supplier (supplier_id),
                INDEX idx_date (invoice_date)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

            $supplierId    = $body['supplierId'] ?? null;
            $receiptNumber = trim($body['receiptNumber'] ?? '');
            $invoiceDate   = $body['invoiceDate'] ?? date('Y-m-d');
            $amount        = isset($body['amount']) ? (float)$body['amount'] : 0;
            $paid          = isset($body['paid']) ? (float)$body['paid'] : 0;
            $remarks       = $body['remarks'] ?? null;

            if (!$supplierId || $amount <= 0) {
                http_response_code(422);
                return ['error' => 'Supplier and amount are required'];
            }

            $stmt = $pdo->prepare('INSERT INTO supplier_invoices (supplier_id, receipt_number, invoice_date, amount, paid, remarks, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())');
            $stmt->execute([$supplierId, $receiptNumber, $invoiceDate, $amount, $paid, $remarks]);
            $id = $pdo->lastInsertId();

            $row = $pdo->prepare('SELECT si.*, s.name as supplier_name FROM supplier_invoices si LEFT JOIN suppliers s ON si.supplier_id = s.id WHERE si.id = ?');
            $row->execute([$id]);
            $r = $row->fetch();

            http_response_code(201);
            return ['invoice' => [
                'id'            => (string)$r['id'],
                'supplierId'    => (string)$r['supplier_id'],
                'supplierName'  => $r['supplier_name'] ?? '',
                'receiptNumber' => $r['receipt_number'],
                'invoiceDate'   => $r['invoice_date'],
                'amount'        => (float)$r['amount'],
                'paid'          => (float)$r['paid'],
                'balance'       => round((float)$r['amount'] - (float)$r['paid'], 2),
                'remarks'       => $r['remarks'] ?? '',
                'createdAt'     => $r['created_at'],
            ]];
        } catch (Exception $e) {
            http_response_code(500);
            return ['error' => 'Failed to create invoice: ' . $e->getMessage()];
        }
    },

    'PUT /api/supplier-invoices/{id}' => function() use ($pdo, $body) {
        try {
            $uri = $_SERVER['REQUEST_URI'];
            preg_match('#/api/supplier-invoices/(\d+)#', $uri, $matches);
            $id = $matches[1] ?? null;
            if (!$id) { http_response_code(400); return ['error' => 'Invoice ID required']; }

            $stmt = $pdo->prepare('SELECT * FROM supplier_invoices WHERE id = ?');
            $stmt->execute([$id]);
            $existing = $stmt->fetch();
            if (!$existing) { http_response_code(404); return ['error' => 'Invoice not found']; }

            $supplierId    = $body['supplierId']    ?? $existing['supplier_id'];
            $receiptNumber = $body['receiptNumber'] ?? $existing['receipt_number'];
            $invoiceDate   = $body['invoiceDate']   ?? $existing['invoice_date'];
            $amount        = isset($body['amount']) ? (float)$body['amount'] : (float)$existing['amount'];
            $paid          = isset($body['paid'])   ? (float)$body['paid']   : (float)$existing['paid'];
            $remarks       = array_key_exists('remarks', $body) ? $body['remarks'] : $existing['remarks'];

            $pdo->prepare('UPDATE supplier_invoices SET supplier_id=?, receipt_number=?, invoice_date=?, amount=?, paid=?, remarks=?, updated_at=NOW() WHERE id=?')
                ->execute([$supplierId, $receiptNumber, $invoiceDate, $amount, $paid, $remarks, $id]);

            $row = $pdo->prepare('SELECT si.*, s.name as supplier_name FROM supplier_invoices si LEFT JOIN suppliers s ON si.supplier_id = s.id WHERE si.id = ?');
            $row->execute([$id]);
            $r = $row->fetch();
            return ['invoice' => [
                'id'            => (string)$r['id'],
                'supplierId'    => (string)$r['supplier_id'],
                'supplierName'  => $r['supplier_name'] ?? '',
                'receiptNumber' => $r['receipt_number'],
                'invoiceDate'   => $r['invoice_date'],
                'amount'        => (float)$r['amount'],
                'paid'          => (float)$r['paid'],
                'balance'       => round((float)$r['amount'] - (float)$r['paid'], 2),
                'remarks'       => $r['remarks'] ?? '',
                'createdAt'     => $r['created_at'],
            ]];
        } catch (Exception $e) {
            http_response_code(500);
            return ['error' => 'Failed to update invoice: ' . $e->getMessage()];
        }
    },

    'DELETE /api/supplier-invoices/{id}' => function() use ($pdo) {
        try {
            $uri = $_SERVER['REQUEST_URI'];
            preg_match('#/api/supplier-invoices/(\d+)#', $uri, $matches);
            $id = $matches[1] ?? null;
            if (!$id) { http_response_code(400); return ['error' => 'Invoice ID required']; }
            $pdo->prepare('DELETE FROM supplier_invoices WHERE id = ?')->execute([$id]);
            return ['success' => true];
        } catch (Exception $e) {
            http_response_code(500);
            return ['error' => 'Failed to delete invoice: ' . $e->getMessage()];
        }
    },

    'POST /api/supplier-invoices/export-pdf' => function() use ($pdo, $body) {
        try {
            date_default_timezone_set('Asia/Manila');

            $title      = $body['title']           ?? 'Supplier Invoices';
            $suppName   = $body['supplierName']     ?? '';
            $suppAddr   = $body['supplierAddress']  ?? '';
            $dateRange  = $body['dateRange']        ?? '';
            $notes      = $body['notes']            ?? '';
            $invoices   = $body['invoices']         ?? [];

            $fmt = function($n) { return number_format((float)$n, 2); };

            $totalAmount  = array_sum(array_column($invoices, 'amount'));
            $totalPaid    = array_sum(array_column($invoices, 'paid'));
            $totalBalance = array_sum(array_column($invoices, 'balance'));

            // When a single supplier is selected, hide the SUPPLIER column (it's in the header)
            $isSingleSupplier = !empty($suppName);
            $supplierColHdr   = $isSingleSupplier ? '' : '<th>SUPPLIER</th>';
            $totalColSpan     = $isSingleSupplier ? 2 : 3;

            // Build rows
            $rowsHtml = '';
            foreach ($invoices as $inv) {
                $date       = htmlspecialchars(date('m/d/Y', strtotime($inv['invoiceDate'] . 'T00:00:00')));
                $receipt    = htmlspecialchars($inv['receiptNumber'] ?? '');
                $suppTd     = $isSingleSupplier ? '' : '<td>' . htmlspecialchars($inv['supplierName'] ?? '') . '</td>';
                $amount     = $fmt($inv['amount']);
                $paid       = (float)$inv['paid'] > 0 ? $fmt($inv['paid']) : '-';
                $balance    = (float)$inv['balance'];
                $balFmt     = $balance > 0 ? $fmt($balance) : '-';
                $balClass   = $balance > 0 ? 'red' : '';
                $remarks    = htmlspecialchars($inv['remarks'] ?? '');
                $rowsHtml  .= "<tr>
                    <td class=\"center\">{$date}</td>
                    <td class=\"center\">{$receipt}</td>
                    {$suppTd}
                    <td class=\"right\">{$amount}</td>
                    <td class=\"right\">{$paid}</td>
                    <td class=\"right {$balClass}\">{$balFmt}</td>
                    <td>{$remarks}</td>
                </tr>";
            }

            $totalPaidFmt = $totalPaid > 0 ? $fmt($totalPaid) : '-';
            $totalBalFmt  = $totalBalance > 0 ? $fmt($totalBalance) : '-';

            $addrHtml = $suppAddr
                ? '<div class="addr">' . htmlspecialchars($suppAddr) . '</div>'
                : '';

            $dateRangeHtml = $dateRange
                ? '<div class="daterange">' . htmlspecialchars($dateRange) . '</div>'
                : '';

            $notesHtml = $notes
                ? '<div class="notes"><strong>Notes:</strong> ' . nl2br(htmlspecialchars($notes)) . '</div>'
                : '';

            $generatedOn = date('m/d/Y h:i A');

            $html = '<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 10pt; color: #000; padding: 20px 24px; }

  .title-box { border: 2px solid #000; padding: 10px 16px; margin-bottom: 10px; text-align: center; }
  .title-box .company { font-size: 15pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.4px; }
  .title-box .addr { font-size: 9pt; color: #444; margin-top: 3px; }
  .daterange { text-align: center; font-size: 9pt; color: #333; margin-bottom: 10px; }

  table { width: 100%; border-collapse: collapse; }
  th {
    border: 1.5px solid #000;
    padding: 6px 9px;
    text-align: center;
    font-weight: bold;
    font-size: 10pt;
    background: #fff;
  }
  td {
    border: 1px solid #000;
    padding: 5px 9px;
    font-size: 9.5pt;
    vertical-align: top;
  }
  .right { text-align: right; }
  .center { text-align: center; }
  .red { color: #c00000; }

  tfoot td {
    border-top: 2px solid #000;
    font-weight: bold;
    font-size: 10.5pt;
    padding: 6px 9px;
  }
  .total-label { font-size: 11pt; }
  .notes { margin-top: 14px; padding: 8px 10px; border: 1px solid #bbb; font-size: 9pt; }
  .footer { margin-top: 18px; text-align: center; font-size: 8pt; color: #888; border-top: 1px solid #ddd; padding-top: 6px; }
</style>
</head><body>
  <div class="title-box">
    <div class="company">' . htmlspecialchars($title) . '</div>
    ' . $addrHtml . '
  </div>
  ' . $dateRangeHtml . '
  <table>
    <thead>
      <tr>
        <th>DATE</th>
        <th>RECEIPT#</th>
        ' . $supplierColHdr . '
        <th>AMOUNT</th>
        <th>PAID</th>
        <th>BALANCE</th>
        <th>REMARKS</th>
      </tr>
    </thead>
    <tbody>
      ' . $rowsHtml . '
    </tbody>
    <tfoot>
      <tr>
        <td colspan="' . $totalColSpan . '" class="total-label">TOTAL :</td>
        <td class="right red">' . $fmt($totalAmount) . '</td>
        <td class="right red">' . $totalPaidFmt . '</td>
        <td class="right red">' . $totalBalFmt . '</td>
        <td></td>
      </tr>
    </tfoot>
  </table>
  ' . $notesHtml . '
  <div class="footer">Generated on ' . $generatedOn . '</div>
</body></html>';

            $autoloadPath = __DIR__ . '/vendor/autoload.php';
            if (!file_exists($autoloadPath)) {
                http_response_code(500);
                return ['error' => 'PDF library not available.'];
            }
            require_once $autoloadPath;

            $options = new \Dompdf\Options();
            $options->set('isRemoteEnabled', false);
            $options->set('isHtml5ParserEnabled', true);
            $dompdf = new \Dompdf\Dompdf($options);
            $dompdf->loadHtml($html);
            $dompdf->setPaper('letter', $isSingleSupplier ? 'portrait' : 'landscape');
            $dompdf->render();

            $filename = 'Supplier-Invoices-' . date('Ymd') . '.pdf';
            header('Content-Type: application/pdf');
            header('Content-Disposition: attachment; filename="' . $filename . '"');
            header('Cache-Control: no-cache, no-store, must-revalidate');
            echo $dompdf->output();
            exit;

        } catch (Exception $e) {
            http_response_code(500);
            error_log('Supplier Invoice PDF Error: ' . $e->getMessage());
            return ['error' => 'Failed to generate PDF: ' . $e->getMessage()];
        }
    },

    // Stock Adjustments endpoints
    'GET /api/stock-adjustments' => function() use ($pdo) {
        try {
            $query = 'SELECT * FROM stock_adjustments ORDER BY created_at DESC LIMIT 50';
            $stmt = $pdo->query($query);
            $adjustments = $stmt->fetchAll();

            return [
                'success' => true,
                'adjustments' => $adjustments,
                'pagination' => [
                    'total' => count($adjustments),
                    'per_page' => 50,
                    'current_page' => 1,
                    'last_page' => 1,
                ],
            ];
        } catch (Exception $e) {
            http_response_code(500);
            return ['success' => false, 'error' => 'Failed to fetch stock adjustments: ' . $e->getMessage()];
        }
    },

    'POST /api/stock-adjustments' => function() use ($pdo, $body) {
        try {
            $ingredientId = $body['ingredient_id'] ?? null;
            $type = $body['type'] ?? null;
            $quantity = $body['quantity'] ?? null;
            $reason = $body['reason'] ?? null;
            $userId = $body['user_id'] ?? null;
            $userName = $body['user_name'] ?? 'System';

            if (!$ingredientId || !$type || !$quantity) {
                http_response_code(422);
                return ['success' => false, 'message' => 'ingredient_id, type, and quantity are required'];
            }

            if (!in_array($type, ['add', 'remove'])) {
                http_response_code(422);
                return ['success' => false, 'message' => 'type must be add or remove'];
            }

            // Get the ingredient
            $stmt = $pdo->prepare('SELECT * FROM ingredients WHERE id = ?');
            $stmt->execute([$ingredientId]);
            $ingredient = $stmt->fetch();

            if (!$ingredient) {
                http_response_code(404);
                return ['success' => false, 'message' => 'Ingredient not found'];
            }

            $previousStock = (float)$ingredient['stock'];
            $delta = $type === 'add' ? (float)$quantity : -(float)$quantity;
            $newStock = max(0, $previousStock + $delta);

            // Create adjustment record
            $stmt = $pdo->prepare('INSERT INTO stock_adjustments (ingredient_id, ingredient_name, ingredient_code, type, quantity, previous_stock, new_stock, unit, reason, user_id, user_name, ip_address, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())');
            $stmt->execute([
                $ingredient['id'],
                $ingredient['name'],
                $ingredient['code'],
                $type,
                $quantity,
                $previousStock,
                $newStock,
                $ingredient['unit'],
                $reason,
                $userId,
                $userName,
                $_SERVER['REMOTE_ADDR'] ?? null,
            ]);
            $adjustmentId = $pdo->lastInsertId();

            // Update ingredient stock
            $stmt = $pdo->prepare('UPDATE ingredients SET stock = ? WHERE id = ?');
            $stmt->execute([$newStock, $ingredientId]);

            logSystemHistory(
                $pdo,
                'Inventory Adjustment',
                'Ingredient',
                (string)$ingredient['id'],
                [
                    'ingredient' => $ingredient['name'],
                    'type' => $type,
                    'quantity' => $quantity,
                    'previousStock' => $previousStock,
                    'newStock' => $newStock,
                    'reason' => $reason,
                ],
                $userId
            );

            // Fetch the created adjustment
            $stmt = $pdo->prepare('SELECT * FROM stock_adjustments WHERE id = ?');
            $stmt->execute([$adjustmentId]);
            $adjustment = $stmt->fetch();

            http_response_code(201);
            return [
                'success' => true,
                'message' => 'Stock adjustment recorded successfully',
                'adjustment' => $adjustment,
                'ingredient' => [
                    'id' => (string)$ingredient['id'],
                    'name' => $ingredient['name'],
                    'stock' => (float)$newStock,
                ],
            ];
        } catch (Exception $e) {
            http_response_code(500);
            return ['success' => false, 'message' => 'Failed to create stock adjustment', 'error' => $e->getMessage()];
        }
    },

    'GET /api/stock-adjustments/summary' => function() use ($pdo) {
        try {
            $totalAdditions = $pdo->query("SELECT COALESCE(SUM(quantity), 0) FROM stock_adjustments WHERE type = 'add'")->fetchColumn();
            $totalRemovals = $pdo->query("SELECT COALESCE(SUM(quantity), 0) FROM stock_adjustments WHERE type = 'remove'")->fetchColumn();
            $totalAdjustments = $pdo->query("SELECT COUNT(*) FROM stock_adjustments")->fetchColumn();

            $stmt = $pdo->query('SELECT * FROM stock_adjustments ORDER BY created_at DESC LIMIT 10');
            $recent = $stmt->fetchAll();

            return [
                'success' => true,
                'summary' => [
                    'total_additions' => (float)$totalAdditions,
                    'total_removals' => (float)$totalRemovals,
                    'total_adjustments' => (int)$totalAdjustments,
                    'net_change' => (float)$totalAdditions - (float)$totalRemovals,
                ],
                'recent' => $recent,
            ];
        } catch (Exception $e) {
            http_response_code(500);
            return ['success' => false, 'error' => 'Failed to fetch summary: ' . $e->getMessage()];
        }
    },

    'GET /api/stock-adjustments/ingredient/{ingredientId}' => function() use ($pdo) {
        try {
            $uri = $_SERVER['REQUEST_URI'];
            preg_match('#/api/stock-adjustments/ingredient/(\d+)#', $uri, $matches);
            $ingredientId = $matches[1] ?? null;

            if (!$ingredientId) {
                http_response_code(400);
                return ['success' => false, 'message' => 'Ingredient ID is required'];
            }

            $stmt = $pdo->prepare('SELECT * FROM stock_adjustments WHERE ingredient_id = ? ORDER BY created_at DESC LIMIT 100');
            $stmt->execute([$ingredientId]);
            $adjustments = $stmt->fetchAll();

            return [
                'success' => true,
                'adjustments' => $adjustments,
            ];
        } catch (Exception $e) {
            http_response_code(500);
            return ['success' => false, 'error' => 'Failed to fetch history: ' . $e->getMessage()];
        }
    },

    'GET /api/users' => function() use ($pdo) {
        $stmt = $pdo->query('SELECT u.*, s.name as store_name FROM users u LEFT JOIN stores s ON u.store_id = s.id ORDER BY u.full_name');
        $users = $stmt->fetchAll();
        
        return [
            'users' => array_map(function($u) {
                return [
                    'id' => (string)$u['id'],
                    'username' => $u['username'],
                    'fullName' => $u['full_name'],
                    'role' => $u['role'],
                    'storeId' => $u['store_id'] ? (string)$u['store_id'] : null,
                    'storeName' => $u['store_name'],
                    'shift' => $u['shift'] ?? null,
                ];
            }, $users),
        ];
    },
    
    'GET /api/users/all' => function() use ($pdo) {
        // Ensure employee_profile column exists
        try { $pdo->exec("ALTER TABLE users ADD COLUMN employee_profile JSON NULL"); } catch(Exception $e) { /* already exists */ }
        try { $pdo->exec("ALTER TABLE users ADD COLUMN shift ENUM('AM','PM') NULL DEFAULT NULL"); } catch(Exception $e) { /* already exists */ }

        $stmt = $pdo->query('SELECT u.*, s.name as store_name FROM users u LEFT JOIN stores s ON u.store_id = s.id ORDER BY u.full_name');
        $users = $stmt->fetchAll();
        
        return [
            'users' => array_map(function($u) {
                return [
                    'id' => (string)$u['id'],
                    'username' => $u['username'],
                    'name' => $u['full_name'],
                    'mobile' => $u['mobile'] ?? '',
                    'address' => $u['address'] ?? '',
                    'role' => $u['role'],
                    'employeeRole' => $u['employee_role'] ?? null,
                    'storeId' => $u['store_id'] ? (string)$u['store_id'] : null,
                    'storeName' => $u['store_name'],
                    'canLogin' => (bool)($u['can_login'] ?? true),
                    'createdAt' => $u['created_at'] ?? date('Y-m-d H:i:s'),
                    'permissions' => !empty($u['permissions']) ? json_decode($u['permissions'], true) : [],
                    'employeeProfile' => !empty($u['employee_profile']) ? json_decode($u['employee_profile'], true) : null,
                    'shift' => $u['shift'] ?? null,
                ];
            }, $users),
        ];
    },
    
    'POST /api/employees' => function() use ($pdo, $body) {
        try {
            // Accept both 'name' and 'fullName' fields
            $fullName = $body['fullName'] ?? $body['name'] ?? null;
            
            // Validate required fields
            if (empty($fullName)) {
                return ['error' => 'Name is required'];
            }
            
            // Generate username and password
            $username = strtolower(str_replace(' ', '_', trim($fullName)));
            $password = bin2hex(random_bytes(6)); // Generate random 12-character password
            $passwordHash = password_hash($password, PASSWORD_BCRYPT);
            
            // Map frontend role to database enum
            $role = strtoupper($body['employeeRole'] ?? $body['role'] ?? 'EMPLOYEE');
            if ($role === 'STORE') $role = 'STORE';
            else if ($role === 'PRODUCTION') $role = 'PRODUCTION';
            else if ($role === 'POS') $role = 'POS';
            else $role = 'EMPLOYEE';
            
            // Ensure employee_profile column exists
            try { $pdo->exec("ALTER TABLE users ADD COLUMN employee_profile JSON NULL"); } catch(Exception $e) { /* already exists */ }

            $shift = isset($body['shift']) && in_array($body['shift'], ['AM', 'PM']) ? $body['shift'] : null;

            $stmt = $pdo->prepare('INSERT INTO users (username, password, full_name, mobile, address, role, store_id, can_login, permissions, employee_profile, shift, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())');
            $bindParams = [
                $username,
                $passwordHash,
                trim($fullName),
                $body['mobile'] ?? null,
                $body['address'] ?? null,
                $role,
                (isset($body['storeId']) && !empty($body['storeId'])) ? $body['storeId'] : null,
                1,
                isset($body['permissions']) ? json_encode($body['permissions']) : null,
                !empty($body['employeeProfile']) ? json_encode($body['employeeProfile']) : null,
                $shift,
            ];
            
            $result = $stmt->execute($bindParams);
            
            if (!$result) {
                $errorInfo = $stmt->errorInfo();
                return ['error' => 'Failed to insert user', 'details' => $errorInfo];
            }
            
            $lastId = $pdo->lastInsertId();
            
            // Fetch the newly created user
            $stmt = $pdo->prepare('SELECT * FROM users WHERE id = ?');
            $stmt->execute([$lastId]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$user) {
                return ['error' => 'Failed to fetch created user'];
            }
            
            logSystemHistory($pdo, 'User Created', 'User', (string)$lastId, [
                'name' => $user['full_name'],
                'role' => $user['role'],
                'username' => $user['username'],
            ]);
            
            // Get store name if store_id is set
            $storeName = null;
            if (!empty($user['store_id'])) {
                $storeStmt = $pdo->prepare('SELECT name FROM stores WHERE id = ?');
                $storeStmt->execute([$user['store_id']]);
                $store = $storeStmt->fetch(PDO::FETCH_ASSOC);
                $storeName = $store ? $store['name'] : null;
            }
            
            return [
                'employee' => [
                    'id' => (string)$user['id'],
                    'username' => $user['username'],
                    'name' => $user['full_name'],
                    'mobile' => $user['mobile'] ?? '',
                    'address' => $user['address'] ?? '',
                    'role' => $user['role'],
                    'storeId' => !empty($user['store_id']) ? (string)$user['store_id'] : null,
                    'storeName' => $storeName,
                    'canLogin' => (bool)$user['can_login'],
                    'createdAt' => $user['created_at'] ?? date('Y-m-d H:i:s'),
                    'password' => $password,
                    'permissions' => !empty($user['permissions']) ? json_decode($user['permissions'], true) : [],
                    'employeeProfile' => !empty($user['employee_profile']) ? json_decode($user['employee_profile'], true) : null,
                    'shift' => $user['shift'] ?? null,
                ]
            ];
        } catch (Exception $e) {
            return ['error' => 'Error: ' . $e->getMessage()];
        }
    },
    
    'PUT /api/users/{id}' => function() use ($pdo, $body) {
        try {
            $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
            $id = substr($uri, strrpos($uri, '/') + 1);
            
            // Build dynamic update query based on provided fields
            $updates = [];
            $params = [];
            
            if (isset($body['name'])) {
                $updates[] = 'full_name = ?';
                $params[] = $body['name'];
            }
            if (isset($body['mobile'])) {
                $updates[] = 'mobile = ?';
                $params[] = $body['mobile'];
            }
            if (isset($body['address'])) {
                $updates[] = 'address = ?';
                $params[] = $body['address'];
            }
            if (isset($body['role'])) {
                $updates[] = 'role = ?';
                $params[] = strtoupper($body['role']);
            }
            if (isset($body['storeId'])) {
                $updates[] = 'store_id = ?';
                $params[] = !empty($body['storeId']) ? $body['storeId'] : null;
            }
            if (isset($body['permissions'])) {
                $updates[] = 'permissions = ?';
                $params[] = json_encode($body['permissions']);
            }
            if (isset($body['canLogin'])) {
                $updates[] = 'can_login = ?';
                $params[] = $body['canLogin'] ? 1 : 0;
            }
            if (isset($body['username'])) {
                $updates[] = 'username = ?';
                $params[] = $body['username'];
            }
            if (isset($body['password'])) {
                $updates[] = 'password = ?';
                $params[] = password_hash($body['password'], PASSWORD_BCRYPT);
            }
            if (isset($body['employeeProfile'])) {
                $updates[] = 'employee_profile = ?';
                $params[] = json_encode($body['employeeProfile']);
            }
            if (isset($body['shift'])) {
                $updates[] = 'shift = ?';
                $params[] = in_array($body['shift'], ['AM', 'PM']) ? $body['shift'] : null;
            }
            
            if (empty($updates)) {
                return ['error' => 'No fields to update'];
            }
            
            $updates[] = 'updated_at = NOW()';
            $params[] = $id;
            $query = 'UPDATE users SET ' . implode(', ', $updates) . ' WHERE id = ?';
            
            $stmt = $pdo->prepare($query);
            $stmt->execute($params);
            
            // Fetch updated user
            $stmt = $pdo->prepare('SELECT u.*, s.name as store_name FROM users u LEFT JOIN stores s ON u.store_id = s.id WHERE u.id = ?');
            $stmt->execute([$id]);
            $user = $stmt->fetch();
            
            if (!$user) {
                return ['error' => 'User not found after update'];
            }
            
            logSystemHistory($pdo, 'User Updated', 'User', (string)$id, [
                'name' => $user['full_name'] ?? '',
                'role' => $user['role'] ?? '',
            ]);
            
            return [
                'employee' => [
                    'id' => (string)$user['id'],
                    'username' => $user['username'] ?? '',
                    'name' => $user['full_name'] ?? '',
                    'mobile' => $user['mobile'] ?? '',
                    'address' => $user['address'] ?? '',
                    'role' => $user['role'] ?? '',
                    'employeeRole' => $user['employee_role'] ?? null,
                    'storeId' => !empty($user['store_id']) ? (string)$user['store_id'] : null,
                    'storeName' => $user['store_name'] ?? null,
                    'canLogin' => isset($user['can_login']) ? (bool)$user['can_login'] : false,
                    'createdAt' => $user['created_at'] ?? date('Y-m-d H:i:s'),
                    'employeeProfile' => !empty($user['employee_profile']) ? json_decode($user['employee_profile'], true) : null,
                    'permissions' => !empty($user['permissions']) ? json_decode($user['permissions'], true) : [],
                    'shift' => $user['shift'] ?? null,
                ]
            ];
        } catch (Exception $e) {
            return ['error' => $e->getMessage()];
        }
    },
    
    'DELETE /api/users/{id}' => function() use ($pdo) {
        $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        $id = substr($uri, strrpos($uri, '/') + 1);
        
        $nameStmt = $pdo->prepare('SELECT full_name, role FROM users WHERE id = ?');
        $nameStmt->execute([$id]);
        $userRow = $nameStmt->fetch();
        
        $stmt = $pdo->prepare('DELETE FROM users WHERE id = ?');
        $stmt->execute([$id]);
        
        logSystemHistory($pdo, 'User Deleted', 'User', $id, [
            'name' => $userRow['full_name'] ?? 'Unknown',
            'role' => $userRow['role'] ?? '',
        ]);
        
        return ['success' => true];
    },
    
    'DELETE /api/employees/{id}' => function() use ($pdo) {
        $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        $id = substr($uri, strrpos($uri, '/') + 1);
        
        $nameStmt = $pdo->prepare('SELECT full_name, role FROM users WHERE id = ?');
        $nameStmt->execute([$id]);
        $userRow = $nameStmt->fetch();
        
        $stmt = $pdo->prepare('DELETE FROM users WHERE id = ?');
        $stmt->execute([$id]);
        
        logSystemHistory($pdo, 'User Deleted', 'User', $id, [
            'name' => $userRow['full_name'] ?? 'Unknown',
            'role' => $userRow['role'] ?? '',
        ]);
        
        return ['success' => true];
    },
    
    'GET /api/inventory' => function() use ($pdo) {
        $location = $_GET['location'] ?? null;
        
        $query = 'SELECT i.*, p.name as product_name, p.unit as unit FROM inventory i LEFT JOIN products p ON i.product_id = p.id';
        $params = [];
        
        if ($location) {
            $query .= ' WHERE i.location = ?';
            $params = [$location];
        }
        
        $query .= ' ORDER BY p.name';
        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        $inventory = $stmt->fetchAll();
        
        return [
            'inventory' => array_map(function($i) {
                return [
                    'id' => (string)$i['id'],
                    'productId' => (string)$i['product_id'],
                    'productName' => $i['product_name'] ?? '',
                    'unit' => $i['unit'] ?? 'kg',
                    'location' => $i['location'],
                    'quantity' => (float)$i['quantity'],
                    'lastUpdated' => $i['updated_at'],
                ];
            }, $inventory),
        ];
    },
    
    'POST /api/inventory' => function() use ($pdo, $body) {
        $productId = $body['productId'] ?? null;
        $location = $body['location'] ?? '';
        $quantity = $body['quantity'] ?? 0;
        
        if (!$productId || !$location) {
            return ['error' => 'Product ID and location are required'];
        }
        
        // Check if record exists
        $stmt = $pdo->prepare('SELECT id FROM inventory WHERE product_id = ? AND location = ?');
        $stmt->execute([$productId, $location]);
        $existing = $stmt->fetch();
        
        if ($existing) {
            // Update existing
            $stmt = $pdo->prepare('UPDATE inventory SET quantity = ?, updated_at = NOW() WHERE id = ?');
            $stmt->execute([$quantity, $existing['id']]);
            $id = $existing['id'];
        } else {
            // Insert new
            $stmt = $pdo->prepare('INSERT INTO inventory (product_id, location, quantity, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())');
            $stmt->execute([$productId, $location, $quantity]);
            $id = $pdo->lastInsertId();
        }
        
        // Return the inventory record
        $stmt = $pdo->prepare('SELECT * FROM inventory WHERE id = ?');
        $stmt->execute([$id]);
        $inv = $stmt->fetch();
        
        return [
            'inventory' => [
                'id' => (string)$inv['id'],
                'productId' => (string)$inv['product_id'],
                'location' => $inv['location'],
                'quantity' => (float)$inv['quantity'],
                'lastUpdated' => $inv['updated_at'],
            ]
        ];
    },
    
    'PUT /api/inventory/update' => function() use ($pdo, $body) {
        $productId = $body['productId'] ?? null;
        $location = $body['location'] ?? '';
        $quantity = $body['quantity'] ?? 0;
        
        if (!$productId || !$location) {
            return ['error' => 'Product ID and location are required'];
        }
        
        // Check if record exists
        $stmt = $pdo->prepare('SELECT id FROM inventory WHERE product_id = ? AND location = ?');
        $stmt->execute([$productId, $location]);
        $existing = $stmt->fetch();
        
        if ($existing) {
            // Update existing
            $stmt = $pdo->prepare('UPDATE inventory SET quantity = ?, updated_at = NOW() WHERE id = ?');
            $stmt->execute([$quantity, $existing['id']]);
            $id = $existing['id'];
        } else {
            // Insert new if not exists
            $stmt = $pdo->prepare('INSERT INTO inventory (product_id, location, quantity, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())');
            $stmt->execute([$productId, $location, $quantity]);
            $id = $pdo->lastInsertId();
        }
        
        // Return the inventory record
        $stmt = $pdo->prepare('SELECT * FROM inventory WHERE id = ?');
        $stmt->execute([$id]);
        $inv = $stmt->fetch();
        
        return [
            'inventory' => [
                'id' => (string)$inv['id'],
                'productId' => (string)$inv['product_id'],
                'location' => $inv['location'],
                'quantity' => (float)$inv['quantity'],
                'lastUpdated' => $inv['updated_at'],
            ]
        ];
    },
    
    'POST /api/ingredients' => function() use ($pdo, $body) {
        $stmt = $pdo->prepare('INSERT INTO ingredients (name, code, category, unit, stock, min_stock_level, reorder_point, cost_per_unit, supplier_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())');
        $stmt->execute([
            $body['name'] ?? '',
            $body['code'] ?? '',
            $body['category'] ?? '',
            $body['unit'] ?? '',
            $body['stock'] ?? 0,
            $body['minStockLevel'] ?? 0,
            $body['reorderPoint'] ?? 0,
            $body['costPerUnit'] ?? 0,
            $body['supplierId'] ?? null,
        ]);
        
        $lastId = $pdo->lastInsertId();
        
        // Return the complete ingredient object
        $stmt = $pdo->prepare('SELECT i.*, COALESCE(s.name, "Unknown") as supplier_name FROM ingredients i LEFT JOIN suppliers s ON i.supplier_id = s.id WHERE i.id = ?');
        $stmt->execute([$lastId]);
        $ingredient = $stmt->fetch();
        
        logSystemHistory($pdo, 'Ingredient Created', 'Ingredient', (string)$lastId, [
            'name' => $ingredient['name'],
            'code' => $ingredient['code'],
            'unit' => $ingredient['unit'],
            'stock' => (float)$ingredient['stock'],
        ]);
        
        return [
            'ingredient' => [
                'id' => (string)$ingredient['id'],
                'name' => $ingredient['name'],
                'code' => $ingredient['code'],
                'category' => $ingredient['category'],
                'unit' => $ingredient['unit'],
                'stock' => (float)$ingredient['stock'],
                'minStockLevel' => (float)$ingredient['min_stock_level'],
                'reorderPoint' => (float)$ingredient['reorder_point'],
                'costPerUnit' => (float)$ingredient['cost_per_unit'],
                'supplier' => $ingredient['supplier_name'],
                'lastUpdated' => $ingredient['updated_at'],
                'expiryDate' => $ingredient['expiry_date'],
            ]
        ];
    },
    
    'PUT /api/ingredients/{id}' => function() use ($pdo, $body) {
        $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        $id = substr($uri, strrpos($uri, '/') + 1);
        
        // Get existing ingredient first
        $stmt = $pdo->prepare('SELECT * FROM ingredients WHERE id = ?');
        $stmt->execute([$id]);
        $ingredient = $stmt->fetch();
        
        if (!$ingredient) {
            http_response_code(404);
            return ['error' => 'Ingredient not found'];
        }
        
        // Build dynamic update query only for provided fields
        $updates = [];
        $params = [];
        
        if (isset($body['name'])) {
            $updates[] = 'name = ?';
            $params[] = $body['name'];
        }
        if (isset($body['code'])) {
            $updates[] = 'code = ?';
            $params[] = $body['code'];
        }
        if (isset($body['category'])) {
            $updates[] = 'category = ?';
            $params[] = $body['category'];
        }
        if (isset($body['unit'])) {
            $updates[] = 'unit = ?';
            $params[] = $body['unit'];
        }
        if (isset($body['stock'])) {
            $updates[] = 'stock = ?';
            $params[] = $body['stock'];
        }
        if (isset($body['minStockLevel'])) {
            $updates[] = 'min_stock_level = ?';
            $params[] = $body['minStockLevel'];
        }
        if (isset($body['reorderPoint'])) {
            $updates[] = 'reorder_point = ?';
            $params[] = $body['reorderPoint'];
        }
        if (isset($body['costPerUnit'])) {
            $updates[] = 'cost_per_unit = ?';
            $params[] = $body['costPerUnit'];
        }
        if (isset($body['supplierId'])) {
            $updates[] = 'supplier_id = ?';
            $params[] = $body['supplierId'];
        }
        
        // Only update if there are fields to update
        if (!empty($updates)) {
            $updates[] = 'updated_at = NOW()';
            $params[] = $id;
            
            $sql = 'UPDATE ingredients SET ' . implode(', ', $updates) . ' WHERE id = ?';
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
        }
        
        // Return updated ingredient
        $stmt = $pdo->prepare('SELECT i.*, COALESCE(s.name, "Unknown") as supplier_name FROM ingredients i LEFT JOIN suppliers s ON i.supplier_id = s.id WHERE i.id = ?');
        $stmt->execute([$id]);
        $updated = $stmt->fetch();
        
        logSystemHistory($pdo, 'Ingredient Updated', 'Ingredient', (string)$id, [
            'name' => $updated['name'],
            'code' => $updated['code'],
            'unit' => $updated['unit'],
            'stock' => (float)$updated['stock'],
        ]);
        
        return [
            'ingredient' => [
                'id' => (string)$updated['id'],
                'name' => $updated['name'],
                'code' => $updated['code'],
                'category' => $updated['category'],
                'unit' => $updated['unit'],
                'stock' => (float)$updated['stock'],
                'minStockLevel' => (float)$updated['min_stock_level'],
                'reorderPoint' => (float)$updated['reorder_point'],
                'costPerUnit' => (float)$updated['cost_per_unit'],
                'supplier' => $updated['supplier_name'],
                'lastUpdated' => $updated['updated_at'],
                'expiryDate' => $updated['expiry_date'],
            ]
        ];
    },
    
    'DELETE /api/ingredients/{id}' => function() use ($pdo) {
        $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        $id = substr($uri, strrpos($uri, '/') + 1);
        
        // Fetch ingredient name before deleting
        $stmt = $pdo->prepare('SELECT name, code FROM ingredients WHERE id = ?');
        $stmt->execute([$id]);
        $ingredient = $stmt->fetch();
        
        $stmt = $pdo->prepare('DELETE FROM ingredients WHERE id = ?');
        $stmt->execute([$id]);
        
        logSystemHistory($pdo, 'Ingredient Deleted', 'Ingredient', $id, [
            'name' => $ingredient['name'] ?? 'Unknown',
            'code' => $ingredient['code'] ?? '',
        ]);
        
        return ['success' => true];
    },

    'POST /api/verify-password' => function() use ($pdo, $body) {
        $userId = $body['userId'] ?? '';
        $password = $body['password'] ?? '';
        
        if (empty($userId) || empty($password)) {
            http_response_code(400);
            return ['error' => 'User ID and password are required'];
        }
        
        try {
            $stmt = $pdo->prepare('SELECT password, role FROM users WHERE id = ?');
            $stmt->execute([$userId]);
            $user = $stmt->fetch();
            
            if (!$user) {
                http_response_code(401);
                return ['error' => 'User not found'];
            }
            
            // Only allow admins to verify password
            if ($user['role'] !== 'ADMIN') {
                http_response_code(403);
                return ['error' => 'Only admins can perform this action'];
            }
            
            if (!password_verify($password, $user['password'])) {
                http_response_code(401);
                return ['error' => 'Invalid password'];
            }
            
            return ['success' => true, 'message' => 'Password verified'];
        } catch (Exception $e) {
            http_response_code(500);
            return ['error' => 'Failed to verify password: ' . $e->getMessage()];
        }
    },
    
    'GET /api/discount-settings' => function() use ($pdo) {
        try {
            // Create table if it doesn't exist
            $pdo->exec("CREATE TABLE IF NOT EXISTS discount_settings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                wholesale_min_units INT NOT NULL DEFAULT 10,
                discount_type VARCHAR(50) NOT NULL DEFAULT 'percentage',
                wholesale_discount_percent DECIMAL(5, 2) DEFAULT 0,
                wholesale_discount_amount DECIMAL(12, 2) DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )");
            
            // Get or create default setting
            $stmt = $pdo->query('SELECT * FROM discount_settings ORDER BY id LIMIT 1');
            $setting = $stmt->fetch();
            
            if (!$setting) {
                // Insert default setting if none exists
                $pdo->exec("INSERT INTO discount_settings (wholesale_min_units, discount_type, wholesale_discount_percent) 
                           VALUES (10, 'percentage', 0)");
                $stmt = $pdo->query('SELECT * FROM discount_settings ORDER BY id LIMIT 1');
                $setting = $stmt->fetch();
            }
            
            return [
                'settings' => [
                    'id' => (int)$setting['id'],
                    'wholesaleMinUnits' => (int)$setting['wholesale_min_units'],
                    'discountType' => $setting['discount_type'],
                    'wholesaleDiscountPercent' => (float)$setting['wholesale_discount_percent'],
                    'wholesaleDiscountAmount' => $setting['wholesale_discount_amount'] ? (float)$setting['wholesale_discount_amount'] : null,
                ]
            ];
        } catch (Exception $e) {
            http_response_code(500);
            return ['error' => 'Failed to get discount settings: ' . $e->getMessage()];
        }
    },
    
    'PUT /api/discount-settings' => function() use ($pdo, $body) {
        try {
            // Create table if it doesn't exist
            $pdo->exec("CREATE TABLE IF NOT EXISTS discount_settings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                wholesale_min_units INT NOT NULL DEFAULT 10,
                discount_type VARCHAR(50) NOT NULL DEFAULT 'percentage',
                wholesale_discount_percent DECIMAL(5, 2) DEFAULT 0,
                wholesale_discount_amount DECIMAL(12, 2) DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )");
            
            // Get the first setting or create if doesn't exist
            $stmt = $pdo->query('SELECT id FROM discount_settings LIMIT 1');
            $existing = $stmt->fetch();
            
            if (!$existing) {
                // Insert default setting if none exists
                $pdo->exec("INSERT INTO discount_settings (wholesale_min_units, discount_type, wholesale_discount_percent) 
                           VALUES (10, 'percentage', 0)");
                $existing = $pdo->query('SELECT id FROM discount_settings LIMIT 1')->fetch();
            }
            
            // Update the setting
            $stmt = $pdo->prepare('UPDATE discount_settings SET 
                wholesale_min_units = ?,
                discount_type = ?,
                wholesale_discount_percent = ?,
                wholesale_discount_amount = ?
                WHERE id = ?');
            
            $stmt->execute([
                $body['wholesaleMinUnits'] ?? 10,
                $body['discountType'] ?? 'percentage',
                $body['wholesaleDiscountPercent'] ?? 0,
                $body['wholesaleDiscountAmount'] ?? null,
                $existing['id']
            ]);
            
            // Fetch and return updated setting
            $stmt = $pdo->prepare('SELECT * FROM discount_settings WHERE id = ?');
            $stmt->execute([$existing['id']]);
            $setting = $stmt->fetch();
            
            return [
                'settings' => [
                    'id' => (int)$setting['id'],
                    'wholesaleMinUnits' => (int)$setting['wholesale_min_units'],
                    'discountType' => $setting['discount_type'],
                    'wholesaleDiscountPercent' => (float)$setting['wholesale_discount_percent'],
                    'wholesaleDiscountAmount' => $setting['wholesale_discount_amount'] ? (float)$setting['wholesale_discount_amount'] : null,
                ]
            ];
        } catch (Exception $e) {
            http_response_code(500);
            return ['error' => 'Failed to update discount settings: ' . $e->getMessage()];
        }
    },

    // ==================== TRANSACTION CATEGORIES ====================

    'GET /api/transaction-categories' => function() use ($pdo) {
        try {
            $pdo->exec("CREATE TABLE IF NOT EXISTS system_settings (
                `setting_key` VARCHAR(100) NOT NULL PRIMARY KEY,
                `setting_value` LONGTEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )");
            $stmt = $pdo->prepare("SELECT setting_value FROM system_settings WHERE setting_key = 'transaction_categories'");
            $stmt->execute();
            $row = $stmt->fetch();
            $defaults = [
                'cashIn' => ['Sales', 'Investment', 'Loan', 'Refund', 'Other Income'],
                'cashOut' => ['Supplies', 'Utilities', 'Salaries', 'Rent', 'Transportation', 'Maintenance', 'Other Expenses'],
            ];
            if ($row && !empty($row['setting_value'])) {
                $categories = json_decode($row['setting_value'], true);
                return ['categories' => $categories ?: $defaults];
            }
            return ['categories' => $defaults];
        } catch (Exception $e) {
            return ['error' => $e->getMessage()];
        }
    },

    'PUT /api/transaction-categories' => function() use ($pdo, $body) {
        try {
            $pdo->exec("CREATE TABLE IF NOT EXISTS system_settings (
                `setting_key` VARCHAR(100) NOT NULL PRIMARY KEY,
                `setting_value` LONGTEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )");
            $cashIn = array_values(array_filter(array_map('trim', $body['cashIn'] ?? [])));
            $cashOut = array_values(array_filter(array_map('trim', $body['cashOut'] ?? [])));
            $value = json_encode(['cashIn' => $cashIn, 'cashOut' => $cashOut]);
            $stmt = $pdo->prepare("INSERT INTO system_settings (setting_key, setting_value) VALUES ('transaction_categories', ?) ON DUPLICATE KEY UPDATE setting_value = ?, updated_at = NOW()");
            $stmt->execute([$value, $value]);
            return ['categories' => ['cashIn' => $cashIn, 'cashOut' => $cashOut]];
        } catch (Exception $e) {
            return ['error' => $e->getMessage()];
        }
    },

    // ==================== MULTIPLE DISCOUNTS CRUD ====================

    'GET /api/discounts' => function() use ($pdo) {
        try {
            $pdo->exec("CREATE TABLE IF NOT EXISTS discounts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL DEFAULT 'Discount',
                wholesale_min_units INT NOT NULL DEFAULT 5,
                discount_type VARCHAR(50) NOT NULL DEFAULT 'percentage',
                discount_value DECIMAL(10,2) NOT NULL DEFAULT 0,
                is_active TINYINT(1) NOT NULL DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )");
            $pdo->exec("CREATE TABLE IF NOT EXISTS discount_product_map (
                discount_id INT NOT NULL,
                product_id INT NOT NULL,
                PRIMARY KEY (discount_id, product_id),
                INDEX (product_id)
            )");
            $discounts = $pdo->query('SELECT * FROM discounts ORDER BY created_at ASC')->fetchAll();
            $result = [];
            foreach ($discounts as $d) {
                $stmt = $pdo->prepare('SELECT product_id FROM discount_product_map WHERE discount_id = ?');
                $stmt->execute([$d['id']]);
                $productIds = array_map('intval', array_column($stmt->fetchAll(), 'product_id'));
                $result[] = [
                    'id' => (int)$d['id'],
                    'name' => $d['name'],
                    'wholesaleMinUnits' => (int)$d['wholesale_min_units'],
                    'discountType' => $d['discount_type'],
                    'discountValue' => (float)$d['discount_value'],
                    'isActive' => (bool)$d['is_active'],
                    'productIds' => $productIds,
                    'createdAt' => $d['created_at'],
                ];
            }
            return ['discounts' => $result];
        } catch (Exception $e) {
            http_response_code(500);
            return ['error' => 'Failed to get discounts: ' . $e->getMessage()];
        }
    },

    'POST /api/discounts' => function() use ($pdo, $body) {
        try {
            $pdo->exec("CREATE TABLE IF NOT EXISTS discounts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL DEFAULT 'Discount',
                wholesale_min_units INT NOT NULL DEFAULT 5,
                discount_type VARCHAR(50) NOT NULL DEFAULT 'percentage',
                discount_value DECIMAL(10,2) NOT NULL DEFAULT 0,
                is_active TINYINT(1) NOT NULL DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )");
            $pdo->exec("CREATE TABLE IF NOT EXISTS discount_product_map (
                discount_id INT NOT NULL,
                product_id INT NOT NULL,
                PRIMARY KEY (discount_id, product_id),
                INDEX (product_id)
            )");
            $name = trim($body['name'] ?? 'New Discount');
            if ($name === '') $name = 'New Discount';
            $minUnits = max(1, (int)($body['wholesaleMinUnits'] ?? 5));
            $discountType = in_array($body['discountType'] ?? '', ['percentage', 'fixed_amount'])
                ? $body['discountType'] : 'percentage';
            $discountValue = max(0, (float)($body['discountValue'] ?? 0));
            $isActive = isset($body['isActive']) ? (int)(bool)$body['isActive'] : 1;

            $stmt = $pdo->prepare('INSERT INTO discounts (name, wholesale_min_units, discount_type, discount_value, is_active) VALUES (?, ?, ?, ?, ?)');
            $stmt->execute([$name, $minUnits, $discountType, $discountValue, $isActive]);
            $discountId = (int)$pdo->lastInsertId();

            $productIds = [];
            if (!empty($body['productIds']) && is_array($body['productIds'])) {
                $ins = $pdo->prepare('INSERT IGNORE INTO discount_product_map (discount_id, product_id) VALUES (?, ?)');
                foreach ($body['productIds'] as $pid) {
                    $pid = (int)$pid;
                    if ($pid > 0) {
                        $ins->execute([$discountId, $pid]);
                        $productIds[] = $pid;
                    }
                }
            }

            return [
                'discount' => [
                    'id' => $discountId,
                    'name' => $name,
                    'wholesaleMinUnits' => $minUnits,
                    'discountType' => $discountType,
                    'discountValue' => $discountValue,
                    'isActive' => (bool)$isActive,
                    'productIds' => $productIds,
                ]
            ];
        } catch (Exception $e) {
            http_response_code(500);
            return ['error' => 'Failed to create discount: ' . $e->getMessage()];
        }
    },

    'PUT /api/discounts/{id}' => function() use ($pdo, $body) {
        try {
            $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
            preg_match('#/api/discounts/(\d+)$#', $uri, $m);
            $id = isset($m[1]) ? (int)$m[1] : 0;
            if (!$id) { http_response_code(400); return ['error' => 'Invalid discount id']; }

            $stmt = $pdo->prepare('SELECT * FROM discounts WHERE id = ?');
            $stmt->execute([$id]);
            $existing = $stmt->fetch();
            if (!$existing) { http_response_code(404); return ['error' => 'Discount not found']; }

            $name = isset($body['name']) ? trim($body['name']) : $existing['name'];
            if ($name === '') $name = $existing['name'];
            $minUnits = isset($body['wholesaleMinUnits']) ? max(1, (int)$body['wholesaleMinUnits']) : (int)$existing['wholesale_min_units'];
            $discountType = isset($body['discountType']) && in_array($body['discountType'], ['percentage', 'fixed_amount'])
                ? $body['discountType'] : $existing['discount_type'];
            $discountValue = isset($body['discountValue']) ? max(0, (float)$body['discountValue']) : (float)$existing['discount_value'];
            $isActive = isset($body['isActive']) ? (int)(bool)$body['isActive'] : (int)$existing['is_active'];

            $stmt = $pdo->prepare('UPDATE discounts SET name=?, wholesale_min_units=?, discount_type=?, discount_value=?, is_active=?, updated_at=NOW() WHERE id=?');
            $stmt->execute([$name, $minUnits, $discountType, $discountValue, $isActive, $id]);

            $stmt2 = $pdo->prepare('SELECT product_id FROM discount_product_map WHERE discount_id = ?');
            $stmt2->execute([$id]);
            $productIds = array_map('intval', array_column($stmt2->fetchAll(), 'product_id'));

            return [
                'discount' => [
                    'id' => $id,
                    'name' => $name,
                    'wholesaleMinUnits' => $minUnits,
                    'discountType' => $discountType,
                    'discountValue' => $discountValue,
                    'isActive' => (bool)$isActive,
                    'productIds' => $productIds,
                ]
            ];
        } catch (Exception $e) {
            http_response_code(500);
            return ['error' => 'Failed to update discount: ' . $e->getMessage()];
        }
    },

    'DELETE /api/discounts/{id}' => function() use ($pdo) {
        try {
            $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
            preg_match('#/api/discounts/(\d+)$#', $uri, $m);
            $id = isset($m[1]) ? (int)$m[1] : 0;
            if (!$id) { http_response_code(400); return ['error' => 'Invalid discount id']; }
            $pdo->prepare('DELETE FROM discount_product_map WHERE discount_id = ?')->execute([$id]);
            $pdo->prepare('DELETE FROM discounts WHERE id = ?')->execute([$id]);
            return ['success' => true, 'message' => 'Discount deleted'];
        } catch (Exception $e) {
            http_response_code(500);
            return ['error' => 'Failed to delete discount: ' . $e->getMessage()];
        }
    },

    'PUT /api/discounts/{id}/products' => function() use ($pdo, $body) {
        try {
            $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
            preg_match('#/api/discounts/(\d+)/products#', $uri, $m);
            $id = isset($m[1]) ? (int)$m[1] : 0;
            if (!$id) { http_response_code(400); return ['error' => 'Invalid discount id']; }

            $stmt = $pdo->prepare('SELECT id FROM discounts WHERE id = ?');
            $stmt->execute([$id]);
            if (!$stmt->fetch()) { http_response_code(404); return ['error' => 'Discount not found']; }

            // Replace all product associations
            $pdo->prepare('DELETE FROM discount_product_map WHERE discount_id = ?')->execute([$id]);
            $productIds = [];
            if (!empty($body['productIds']) && is_array($body['productIds'])) {
                $ins = $pdo->prepare('INSERT IGNORE INTO discount_product_map (discount_id, product_id) VALUES (?, ?)');
                foreach ($body['productIds'] as $pid) {
                    $pid = (int)$pid;
                    if ($pid > 0) {
                        $ins->execute([$id, $pid]);
                        $productIds[] = $pid;
                    }
                }
            }

            $stmt = $pdo->prepare('SELECT * FROM discounts WHERE id = ?');
            $stmt->execute([$id]);
            $d = $stmt->fetch();

            return [
                'discount' => [
                    'id' => (int)$d['id'],
                    'name' => $d['name'],
                    'wholesaleMinUnits' => (int)$d['wholesale_min_units'],
                    'discountType' => $d['discount_type'],
                    'discountValue' => (float)$d['discount_value'],
                    'isActive' => (bool)$d['is_active'],
                    'productIds' => $productIds,
                ]
            ];
        } catch (Exception $e) {
            http_response_code(500);
            return ['error' => 'Failed to update discount products: ' . $e->getMessage()];
        }
    },

    // ==================== FRACTIONAL (PARTIAL-UNIT) PRICE RULES ====================

    'GET /api/fractional-prices' => function() use ($pdo) {
        try {
            $pdo->exec("CREATE TABLE IF NOT EXISTS product_fractional_prices (
                product_id INT NOT NULL PRIMARY KEY,
                fractional_price DECIMAL(10,2) NOT NULL DEFAULT 0,
                threshold_weight DECIMAL(10,4) NOT NULL DEFAULT 1.0000,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )");
            // Add threshold_weight column if upgrading from old schema
            try { $pdo->exec("ALTER TABLE product_fractional_prices ADD COLUMN threshold_weight DECIMAL(10,4) NOT NULL DEFAULT 1.0000"); } catch (Exception $ignored) {}
            $rows = $pdo->query('SELECT * FROM product_fractional_prices')->fetchAll();
            $result = [];
            foreach ($rows as $r) {
                $result[] = [
                    'productId' => (int)$r['product_id'],
                    'fractionalPrice' => (float)$r['fractional_price'],
                    'thresholdWeight' => (float)$r['threshold_weight'],
                ];
            }
            return ['rules' => $result];
        } catch (Exception $e) {
            http_response_code(500);
            return ['error' => 'Failed to get fractional prices: ' . $e->getMessage()];
        }
    },

    'PUT /api/fractional-prices/{product_id}' => function() use ($pdo, $body) {
        try {
            $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
            preg_match('#/api/fractional-prices/(\d+)$#', $uri, $m);
            $productId = isset($m[1]) ? (int)$m[1] : 0;
            if (!$productId) { http_response_code(400); return ['error' => 'Invalid product_id']; }

            $pdo->exec("CREATE TABLE IF NOT EXISTS product_fractional_prices (
                product_id INT NOT NULL PRIMARY KEY,
                fractional_price DECIMAL(10,2) NOT NULL DEFAULT 0,
                threshold_weight DECIMAL(10,4) NOT NULL DEFAULT 1.0000,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )");
            try { $pdo->exec("ALTER TABLE product_fractional_prices ADD COLUMN threshold_weight DECIMAL(10,4) NOT NULL DEFAULT 1.0000"); } catch (Exception $ignored) {}

            $price = max(0, (float)($body['fractionalPrice'] ?? 0));
            $threshold = max(0.001, (float)($body['thresholdWeight'] ?? 1.0));

            $stmt = $pdo->prepare('INSERT INTO product_fractional_prices (product_id, fractional_price, threshold_weight)
                VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE fractional_price = ?, threshold_weight = ?, updated_at = NOW()');
            $stmt->execute([$productId, $price, $threshold, $price, $threshold]);

            return [
                'rule' => [
                    'productId' => $productId,
                    'fractionalPrice' => $price,
                    'thresholdWeight' => $threshold,
                ]
            ];
        } catch (Exception $e) {
            http_response_code(500);
            return ['error' => 'Failed to set fractional price: ' . $e->getMessage()];
        }
    },

    'DELETE /api/fractional-prices/{product_id}' => function() use ($pdo) {
        try {
            $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
            preg_match('#/api/fractional-prices/(\d+)$#', $uri, $m);
            $productId = isset($m[1]) ? (int)$m[1] : 0;
            if (!$productId) { http_response_code(400); return ['error' => 'Invalid product_id']; }
            $pdo->prepare('DELETE FROM product_fractional_prices WHERE product_id = ?')->execute([$productId]);
            return ['success' => true];
        } catch (Exception $e) {
            http_response_code(500);
            return ['error' => 'Failed to delete fractional price rule: ' . $e->getMessage()];
        }
    },

    'GET /api/history' => function() use ($pdo) {
        try {
            // Create table if it doesn't exist
            $pdo->exec("CREATE TABLE IF NOT EXISTS system_history (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                action VARCHAR(255) NOT NULL,
                entity VARCHAR(255),
                entity_id VARCHAR(255),
                details JSON,
                user_id BIGINT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX(created_at),
                INDEX(entity)
            )");
            
            // Get query parameters for pagination
            $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;
            $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;
            $limit = min($limit, 200); // Max 200 per request
            
            // Get total count
            $countStmt = $pdo->query('SELECT COUNT(*) as count FROM system_history');
            $count = $countStmt->fetch()['count'];
            
            // Get history records
            $stmt = $pdo->query("
                SELECT sh.*, u.full_name as user_name 
                FROM system_history sh
                LEFT JOIN users u ON sh.user_id = u.id
                ORDER BY sh.created_at DESC
                LIMIT $limit OFFSET $offset
            ");
            
            $records = $stmt->fetchAll();
            
            return [
                'history' => array_map(function($record) {
                    $details = $record['details'] ? json_decode($record['details'], true) : null;
                    // Resolve performer name: join > embedded > fallback
                    $performedBy = $record['user_name']
                        ?? ($details['_performedBy'] ?? 'System');
                    // Remove internal key from displayed details
                    if (is_array($details)) unset($details['_performedBy']);
                    return [
                        'id' => (int)$record['id'],
                        'action' => $record['action'],
                        'description' => $record['action'],
                        'user' => $performedBy,
                        'timestamp' => $record['created_at'],
                        'details' => $details,
                    ];
                }, $records),
                'total' => (int)$count,
                'limit' => $limit,
                'offset' => $offset,
            ];
        } catch (Exception $e) {
            http_response_code(500);
            return ['error' => 'Failed to get history: ' . $e->getMessage()];
        }
    },

    'GET /api/transactions' => function() use ($pdo) {
        try {
            $stmt = $pdo->query('SELECT * FROM transactions ORDER BY created_at DESC LIMIT 500');
            $transactions = $stmt->fetchAll();

            return [
                'transactions' => array_map(function($t) {
                    return [
                        'id' => (string)$t['id'],
                        'type' => $t['type'],
                        'amount' => (float)$t['amount'],
                        'description' => $t['description'],
                        'category' => $t['category'],
                        'reference' => $t['reference'],
                        'createdBy' => $t['created_by'],
                        'timestamp' => $t['created_at'],
                        'sourceTransactionId' => isset($t['source_transaction_id']) && $t['source_transaction_id'] ? (string)$t['source_transaction_id'] : null,
                        'shift' => $t['shift'] ?? null,
                    ];
                }, $transactions),
            ];
        } catch (Exception $e) {
            http_response_code(500);
            return ['error' => 'Failed to get transactions: ' . $e->getMessage()];
        }
    },

    'POST /api/transactions' => function() use ($pdo, $body) {
        try {
            $type = $body['type'] ?? 'Cash In';
            $amount = (float)($body['amount'] ?? 0);
            $description = $body['description'] ?? '';
            $category = $body['category'] ?? '';
            $reference = $body['reference'] ?? null;
            $createdBy = $body['createdBy'] ?? 'Admin';
            $sourceTransactionId = isset($body['sourceTransactionId']) ? (int)$body['sourceTransactionId'] : null;
            $shift = isset($body['shift']) && in_array($body['shift'], ['AM', 'PM']) ? $body['shift'] : null;

            if ($amount <= 0) {
                http_response_code(400);
                return ['error' => 'Amount must be greater than 0'];
            }

            $stmt = $pdo->prepare('
                INSERT INTO transactions (type, amount, description, category, reference, created_by, source_transaction_id, shift, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            ');
            $stmt->execute([$type, $amount, $description, $category, $reference, $createdBy, $sourceTransactionId, $shift]);

            $id = (string)$pdo->lastInsertId();

            logSystemHistory($pdo, 'Transaction Created', 'Transaction', $id, [
                'type' => $type,
                'amount' => $amount,
                'description' => $description,
                'category' => $category,
                'createdBy' => $createdBy,
            ]);

            return [
                'success' => true,
                'transaction' => [
                    'id' => $id,
                    'type' => $type,
                    'amount' => $amount,
                    'description' => $description,
                    'category' => $category,
                    'reference' => $reference,
                    'createdBy' => $createdBy,
                    'timestamp' => date('Y-m-d H:i:s'),
                    'sourceTransactionId' => $sourceTransactionId ? (string)$sourceTransactionId : null,
                    'shift' => $shift,
                ],
            ];
        } catch (Exception $e) {
            http_response_code(500);
            return ['error' => 'Failed to create transaction: ' . $e->getMessage()];
        }
    },

    'DELETE /api/transactions/{id}' => function() use ($pdo) {
        $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        $id = basename($uri);

        try {
            $stmt = $pdo->prepare('DELETE FROM transactions WHERE id = ?');
            $stmt->execute([$id]);

            logSystemHistory($pdo, 'Transaction Deleted', 'Transaction', $id, []);

            return ['success' => true, 'message' => 'Transaction deleted'];
        } catch (Exception $e) {
            http_response_code(500);
            return ['error' => 'Failed to delete transaction: ' . $e->getMessage()];
        }
    },

    'GET /api/reports/preview' => function() use ($pdo) {
        try {
            date_default_timezone_set('Asia/Manila');
            try { $pdo->exec("SET time_zone = '+08:00'"); } catch (Exception $tzErr) { /* ignore */ }

            // Ensure tables exist
            $pdo->exec("CREATE TABLE IF NOT EXISTS report_entries (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                report_date DATE NOT NULL,
                store_id INT NOT NULL DEFAULT 0,
                cashier_id INT NOT NULL DEFAULT 0,
                product_id INT NOT NULL,
                wgs DECIMAL(10,3) NOT NULL DEFAULT 0,
                add_qty DECIMAL(10,3) NOT NULL DEFAULT 0,
                return_qty DECIMAL(10,3) NOT NULL DEFAULT 0,
                scrap_bo DECIMAL(10,3) NOT NULL DEFAULT 0,
                turn_over DECIMAL(10,3) NOT NULL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unique_entry (report_date, store_id, cashier_id, product_id)
            )");
            $pdo->exec("CREATE TABLE IF NOT EXISTS report_headers (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                report_date DATE NOT NULL,
                store_id INT NOT NULL DEFAULT 0,
                cashier_id INT NOT NULL DEFAULT 0,
                reporter_name VARCHAR(255) DEFAULT NULL,
                remarks TEXT DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unique_header (report_date, store_id, cashier_id)
            )");
            try { $pdo->exec("ALTER TABLE report_headers ADD COLUMN denominations JSON DEFAULT NULL"); } catch (Exception $colErr) { /* already exists */ }
            try { $pdo->exec("ALTER TABLE report_headers ADD COLUMN cash_out_rows JSON DEFAULT NULL"); } catch (Exception $coErr) { /* already exists */ }
            try { $pdo->exec("ALTER TABLE report_headers ADD COLUMN computation JSON DEFAULT NULL"); } catch (Exception $cpErr) { /* already exists */ }
            try { $pdo->exec("ALTER TABLE report_entries ADD COLUMN reseco_amount DECIMAL(10,2) NOT NULL DEFAULT 0"); } catch (Exception $reErr) { /* already exists */ }

            $date = $_GET['date'] ?? date('Y-m-d');
            $storeId = (int)($_GET['storeId'] ?? 0);
            $cashierId = (int)($_GET['cashierId'] ?? 0);

            // Get store info
            $storeName = 'All Stores';
            $storeLocation = 'N/A';
            if ($storeId) {
                $storeStmt = $pdo->prepare('SELECT * FROM stores WHERE id = ?');
                $storeStmt->execute([$storeId]);
                $store = $storeStmt->fetch();
                if ($store) { $storeName = $store['name']; $storeLocation = $store['location'] ?? 'N/A'; }
            }

            // Get sales
            $salesQuery = 'SELECT s.*, u.full_name as cashier_name FROM sales s LEFT JOIN users u ON s.user_id = u.id WHERE DATE(s.created_at) = ?';
            $params = [$date];
            if ($storeId) { $salesQuery .= ' AND s.store_id = ?'; $params[] = $storeId; }
            if ($cashierId) { $salesQuery .= ' AND s.user_id = ?'; $params[] = $cashierId; }
            $salesStmt = $pdo->prepare($salesQuery);
            $salesStmt->execute($params);
            $sales = $salesStmt->fetchAll();

            $salesByProduct    = [];
            $wholesaleByProduct = [];
            $totalSales = 0;
            $paymentBreakdown = [];
            foreach ($sales as $sale) {
                $totalSales += (float)$sale['total'];
                $method = $sale['payment_method'] ?? 'Cash';
                if (!isset($paymentBreakdown[$method])) $paymentBreakdown[$method] = ['method' => $method, 'count' => 0, 'amount' => 0];
                $paymentBreakdown[$method]['count']++;
                $paymentBreakdown[$method]['amount'] += (float)$sale['total'];
                $items = json_decode($sale['items'], true);
                if (!is_array($items)) continue;
                $wdTotal = (float)($sale['wholesale_discount'] ?? 0);
                $gdTotal = (float)($sale['global_discount']   ?? 0);
                $saleSubtotal = 0;
                foreach ($items as $item) {
                    $saleSubtotal += ((float)($item['quantity'] ?? 0)) * ((float)($item['price'] ?? 0));
                }
                foreach ($items as $item) {
                    $name      = $item['name'] ?? 'Unknown';
                    $qty       = (float)($item['quantity'] ?? 0);
                    $price     = (float)($item['price']    ?? 0);
                    $itemTotal = $qty * $price;
                    if (!isset($salesByProduct[$name])) $salesByProduct[$name] = ['quantity' => 0, 'total_sales' => 0];
                    $salesByProduct[$name]['quantity']    += $qty;
                    $salesByProduct[$name]['total_sales'] += $itemTotal;
                    if (!isset($wholesaleByProduct[$name])) $wholesaleByProduct[$name] = ['kg' => 0, 'disc' => 0, 'global_disc' => 0];
                    if ($saleSubtotal > 0) {
                        $proportion = $itemTotal / $saleSubtotal;
                        if ($wdTotal > 0) {
                            $wholesaleByProduct[$name]['kg']   += $qty;
                            $wholesaleByProduct[$name]['disc'] += $proportion * $wdTotal;
                        }
                        if ($gdTotal > 0) {
                            $wholesaleByProduct[$name]['global_disc'] += $proportion * $gdTotal;
                        }
                    }
                }
            }

            // Pre-fetch transfers for this date/store
            $transfersByProductId = [];
            if ($storeId && $storeName !== 'All Stores') {
                try {
                    $tStmt = $pdo->prepare(
                        "SELECT product_id, `from`, `to`,
                                COALESCE(NULLIF(quantity_received, 0), quantity) AS eff_qty,
                                LOWER(COALESCE(`type`, '')) AS ttype
                         FROM transfers
                         WHERE DATE(created_at) = ?
                           AND (`to` = ? OR `from` = ?)
                           AND LOWER(status) NOT IN ('cancelled', 'rejected')"
                    );
                    $tStmt->execute([$date, $storeName, $storeName]);
                    foreach ($tStmt->fetchAll() as $tr) {
                        $pid   = (int)$tr['product_id'];
                        $qty   = (float)$tr['eff_qty'];
                        $ttype = $tr['ttype'];
                        if (!isset($transfersByProductId[$pid])) {
                            $transfersByProductId[$pid] = ['add' => 0, 'pickup' => 0, 'return' => 0, 'scrap' => 0];
                        }
                        if ($tr['to'] === $storeName) {
                            $transfersByProductId[$pid]['add'] += $qty;
                        } elseif ($tr['from'] === $storeName) {
                            if ($ttype === 'return_backorder')     $transfersByProductId[$pid]['return'] += $qty;
                            elseif ($ttype === 'return_scrap')     $transfersByProductId[$pid]['scrap']  += $qty;
                            else                                   $transfersByProductId[$pid]['pickup'] += $qty;
                        }
                    }
                } catch (Exception $tErr) {
                    error_log('Preview transfer pre-fetch error: ' . $tErr->getMessage());
                }
            }

            // Get products
            $productsStmt = $pdo->query('SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id ORDER BY p.name');
            $products = $productsStmt->fetchAll();

            // Load saved entries
            $entriesStmt = $pdo->prepare('SELECT * FROM report_entries WHERE report_date = ? AND store_id = ? AND cashier_id = ?');
            $entriesStmt->execute([$date, $storeId, $cashierId]);
            $savedEntries = [];
            foreach ($entriesStmt->fetchAll() as $e) { $savedEntries[(int)$e['product_id']] = $e; }

            // Load saved header
            $headerStmt = $pdo->prepare('SELECT * FROM report_headers WHERE report_date = ? AND store_id = ? AND cashier_id = ?');
            $headerStmt->execute([$date, $storeId, $cashierId]);
            $savedHeader = $headerStmt->fetch();

            // Build rows
            $rows = [];
            foreach ($products as $product) {
                $productId   = (int)$product['id'];
                $productName = $product['name'];
                $unitPrice   = (float)$product['price'];

                $invStmt = $pdo->prepare('SELECT quantity FROM inventory WHERE product_id = ?' . ($storeId ? ' AND location = ?' : '') . ' LIMIT 1');
                $invParams = [$productId];
                if ($storeId) $invParams[] = $storeLocation;
                $invStmt->execute($invParams);
                $inv   = $invStmt->fetch();
                $stock = $inv ? max(0, (float)$inv['quantity']) : 0;

                $totalSalesProd = (float)($salesByProduct[$productName]['total_sales'] ?? 0);
                $saved  = $savedEntries[$productId] ?? null;
                $tData  = $transfersByProductId[$productId] ?? ['add' => 0, 'pickup' => 0, 'return' => 0, 'scrap' => 0];
                $wsData = $wholesaleByProduct[$productName]  ?? ['kg' => 0, 'disc' => 0, 'global_disc' => 0];

                $kgSales    = (float)($salesByProduct[$productName]['quantity'] ?? 0);
                $wsKg       = $wsData['kg'];
                $wsDisc     = $wsData['disc'];
                $globalDisc = $wsData['global_disc'];
                $reseco     = $saved ? (float)($saved['reseco_amount'] ?? 0) : 0;
                $netAmount  = max(0, $totalSalesProd - $wsDisc - $globalDisc + $reseco);

                $rows[] = [
                    'productId'    => $productId,
                    'productName'  => $productName,
                    'unitPrice'    => $unitPrice,
                    'wgs'          => $saved ? (float)$saved['wgs']       : 0,
                    'stocks'       => $stock,
                    'addQty'       => $tData['add'],
                    'pickUp'       => $tData['pickup'],
                    'returnQty'    => $tData['return'],
                    'scrapBo'      => $tData['scrap'],
                    'turnOver'     => $saved ? (float)($saved['turn_over'] ?? 0) : 0,
                    'kgSales'      => $kgSales,
                    'totalWeight'  => $kgSales,
                    'totalSales'   => $totalSalesProd,
                    'wholesaleKg'  => $wsKg,
                    'wholesaleDisc'=> $wsDisc,
                    'amount'       => $netAmount,
                    'resecoAmount' => $reseco,
                ];
            }

            // Cash out rows (saved override takes priority over live transactions)
            $cashOutRowsData = [];
            $cashOutTotal = 0;
            try {
                $txCheck = $pdo->query("SHOW TABLES LIKE 'transactions'");
                if ($txCheck->rowCount() > 0) {
                    $txStmt = $pdo->prepare('SELECT description, category, amount FROM transactions WHERE type = ? AND DATE(created_at) = ? ORDER BY created_at ASC');
                    $txStmt->execute(['Cash Out', $date]);
                    foreach ($txStmt->fetchAll() as $tx) {
                        $txAmount = (float)$tx['amount'];
                        $cashOutTotal += $txAmount;
                        $cashOutRowsData[] = ['description' => $tx['description'] ?? $tx['category'] ?? 'Cash Out', 'amount' => $txAmount];
                    }
                }
            } catch (Exception $e) {}

            $defaultDenominations = ['5000' => 0, '1000' => 0, '500' => 0, '200' => 0, '100' => 0, '50' => 0, '20' => 0];
            $savedDenominations = $defaultDenominations;
            if ($savedHeader && !empty($savedHeader['denominations'])) {
                $decoded = json_decode($savedHeader['denominations'], true);
                if (is_array($decoded)) $savedDenominations = array_merge($defaultDenominations, $decoded);
            }

            // Saved cash out rows override
            if ($savedHeader && !empty($savedHeader['cash_out_rows'])) {
                $decoded = json_decode($savedHeader['cash_out_rows'], true);
                if (is_array($decoded)) {
                    $cashOutRowsData = $decoded;
                    $cashOutTotal = array_reduce($cashOutRowsData, fn($c, $r) => $c + (float)($r['amount'] ?? 0), 0);
                }
            }

            // Computation values (saved override or computed)
            $computationValues = ['totalSales' => $totalSales, 'cashOut' => $cashOutTotal, 'grossSales' => $totalSales, 'over' => $totalSales - $cashOutTotal];
            if ($savedHeader && !empty($savedHeader['computation'])) {
                $decoded = json_decode($savedHeader['computation'], true);
                if (is_array($decoded)) $computationValues = array_merge($computationValues, $decoded);
            }

            return [
                'header' => [
                    'reporterName' => $savedHeader ? $savedHeader['reporter_name'] : null,
                    'remarks' => $savedHeader ? $savedHeader['remarks'] : null,
                    'storeName' => $storeName,
                    'date' => $date,
                ],
                'rows' => $rows,
                'paymentBreakdown' => array_values($paymentBreakdown),
                'totalSales' => $totalSales,
                'cashOutTotal' => $cashOutTotal,
                'cashOutRows' => $cashOutRowsData,
                'denominations' => $savedDenominations,
                'computationValues' => $computationValues,
                'hasSavedData' => !empty($savedEntries) || $savedHeader !== false,
            ];
        } catch (Exception $e) {
            http_response_code(500);
            return ['error' => 'Failed to load report preview: ' . $e->getMessage()];
        }
    },

    'POST /api/reports/save-data' => function() use ($pdo, $body) {
        try {
            $pdo->exec("CREATE TABLE IF NOT EXISTS report_entries (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                report_date DATE NOT NULL,
                store_id INT NOT NULL DEFAULT 0,
                cashier_id INT NOT NULL DEFAULT 0,
                product_id INT NOT NULL,
                wgs DECIMAL(10,3) NOT NULL DEFAULT 0,
                add_qty DECIMAL(10,3) NOT NULL DEFAULT 0,
                return_qty DECIMAL(10,3) NOT NULL DEFAULT 0,
                scrap_bo DECIMAL(10,3) NOT NULL DEFAULT 0,
                turn_over DECIMAL(10,3) NOT NULL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unique_entry (report_date, store_id, cashier_id, product_id)
            )");
            $pdo->exec("CREATE TABLE IF NOT EXISTS report_headers (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                report_date DATE NOT NULL,
                store_id INT NOT NULL DEFAULT 0,
                cashier_id INT NOT NULL DEFAULT 0,
                reporter_name VARCHAR(255) DEFAULT NULL,
                remarks TEXT DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unique_header (report_date, store_id, cashier_id)
            )");
            try { $pdo->exec("ALTER TABLE report_headers ADD COLUMN denominations JSON DEFAULT NULL"); } catch (Exception $colErr) { /* already exists */ }
            try { $pdo->exec("ALTER TABLE report_headers ADD COLUMN cash_out_rows JSON DEFAULT NULL"); } catch (Exception $coErr) { /* already exists */ }
            try { $pdo->exec("ALTER TABLE report_headers ADD COLUMN computation JSON DEFAULT NULL"); } catch (Exception $cpErr) { /* already exists */ }
            try { $pdo->exec("ALTER TABLE report_entries ADD COLUMN reseco_amount DECIMAL(10,2) NOT NULL DEFAULT 0"); } catch (Exception $reErr) { /* already exists */ }

            $date = $body['date'] ?? null;
            if (empty($date)) { return ['error' => 'Date is required']; }

            $storeId = (int)($body['storeId'] ?? 0);
            $cashierId = (int)($body['cashierId'] ?? 0);
            $reporterName = $body['reporterName'] ?? null;
            $remarks = $body['remarks'] ?? null;
            $rows = $body['rows'] ?? [];
            $denominationsRaw = $body['denominations'] ?? [];
            $denominationsJson = json_encode($denominationsRaw);
            $cashOutRowsRaw = $body['cashOutRows'] ?? [];
            $cashOutRowsJson = json_encode($cashOutRowsRaw);
            $computationRaw = $body['computation'] ?? [];
            $computationJson = json_encode($computationRaw);

            // Save header
            $headerStmt = $pdo->prepare('INSERT INTO report_headers (report_date, store_id, cashier_id, reporter_name, remarks, denominations, cash_out_rows, computation) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE reporter_name = VALUES(reporter_name), remarks = VALUES(remarks), denominations = VALUES(denominations), cash_out_rows = VALUES(cash_out_rows), computation = VALUES(computation), updated_at = NOW()');
            $headerStmt->execute([$date, $storeId, $cashierId, $reporterName, $remarks, $denominationsJson, $cashOutRowsJson, $computationJson]);

            // Save rows
            $rowStmt = $pdo->prepare('INSERT INTO report_entries (report_date, store_id, cashier_id, product_id, wgs, add_qty, return_qty, scrap_bo, turn_over, reseco_amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE wgs = VALUES(wgs), add_qty = VALUES(add_qty), return_qty = VALUES(return_qty), scrap_bo = VALUES(scrap_bo), turn_over = VALUES(turn_over), reseco_amount = VALUES(reseco_amount), updated_at = NOW()');
            foreach ($rows as $row) {
                $rowStmt->execute([
                    $date, $storeId, $cashierId,
                    (int)$row['productId'],
                    (float)($row['wgs'] ?? 0),
                    (float)($row['addQty'] ?? 0),
                    (float)($row['returnQty'] ?? 0),
                    (float)($row['scrapBo'] ?? 0),
                    (float)($row['turnOver'] ?? 0),
                    (float)($row['resecoAmount'] ?? 0),
                ]);
            }

            logSystemHistory($pdo, 'Report Data Saved', 'Report', $date, [
                'storeId' => $storeId, 'cashierId' => $cashierId, 'rowCount' => count($rows),
            ]);

            return ['success' => true, 'message' => 'Report data saved successfully'];
        } catch (Exception $e) {
            http_response_code(500);
            return ['error' => 'Failed to save report data: ' . $e->getMessage()];
        }
    },

    'GET /api/reports/daily-pdf' => function() use ($pdo) {
        try {
            // Set timezone to Philippines
            date_default_timezone_set('Asia/Manila');
            try { $pdo->exec("SET time_zone = '+08:00'"); } catch (Exception $tzErr) { /* ignore */ }

            $date = $_GET['date'] ?? date('Y-m-d');
            $storeId = $_GET['storeId'] ?? null;
            $cashierId = $_GET['cashierId'] ?? null;
            $userName = $_GET['userName'] ?? 'Unknown';
            $storeIdInt = (int)($storeId ?? 0);
            $cashierIdInt = (int)($cashierId ?? 0);

            // Load saved header (reporter name + remarks override)
            $savedHeaderData = null;
            $savedEntriesData = [];
            try {
                $hStmt = $pdo->prepare('SELECT * FROM report_headers WHERE report_date = ? AND store_id = ? AND cashier_id = ?');
                $hStmt->execute([$date, $storeIdInt, $cashierIdInt]);
                $savedHeaderData = $hStmt->fetch();
                if ($savedHeaderData && !empty($savedHeaderData['reporter_name'])) {
                    $userName = $savedHeaderData['reporter_name'];
                }
                $eStmt = $pdo->prepare('SELECT * FROM report_entries WHERE report_date = ? AND store_id = ? AND cashier_id = ?');
                $eStmt->execute([$date, $storeIdInt, $cashierIdInt]);
                foreach ($eStmt->fetchAll() as $e) { $savedEntriesData[(int)$e['product_id']] = $e; }
            } catch (Exception $savedErr) { /* ignore if tables don't exist yet */ }

            $dateFormatted = date('m/d/Y', strtotime($date));

            // Get store info
            $storeName = 'All Stores';
            $storeLocation = 'N/A';
            if ($storeId) {
                $storeStmt = $pdo->prepare('SELECT * FROM stores WHERE id = ?');
                $storeStmt->execute([$storeId]);
                $store = $storeStmt->fetch();
                if ($store) {
                    $storeName = $store['name'];
                    $storeLocation = $store['location'] ?? 'N/A';
                }
            }

            // Get sales - use DATE() for robust date matching regardless of timezone
            $salesQuery = 'SELECT s.*, u.full_name as cashier_name, st.name as store_name 
                           FROM sales s 
                           LEFT JOIN users u ON s.user_id = u.id 
                           LEFT JOIN stores st ON s.store_id = st.id 
                           WHERE DATE(s.created_at) = ?';
            $params = [$date];
            if ($storeId) {
                $salesQuery .= ' AND s.store_id = ?';
                $params[] = $storeId;
            }
            if ($cashierId) {
                $salesQuery .= ' AND s.user_id = ?';
                $params[] = $cashierId;
            }
            $salesStmt = $pdo->prepare($salesQuery);
            $salesStmt->execute($params);
            $sales = $salesStmt->fetchAll();

            error_log('[PDF Report] Date: ' . $date . ', StoreId: ' . ($storeId ?? 'ALL') . ', Sales found: ' . count($sales));

            // Get products with inventory
            $productsStmt = $pdo->query('SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id ORDER BY p.name');
            $products = $productsStmt->fetchAll();

            // ── Group sales by product + compute per-product discount allocations ──
            $salesByProduct   = [];   // [name => ['quantity' => 0, 'total_sales' => 0]]
            $wholesaleByProduct = []; // [name => ['kg' => 0, 'disc' => 0, 'global_disc' => 0]]
            $totalSales   = 0;
            $totalDiscount = 0;
            $paymentBreakdown = [];

            foreach ($sales as $sale) {
                $totalSales   += (float)$sale['total'];
                $totalDiscount += (float)($sale['global_discount'] ?? 0);

                $method = $sale['payment_method'] ?? 'Cash';
                if (!isset($paymentBreakdown[$method])) {
                    $paymentBreakdown[$method] = ['method' => $method, 'count' => 0, 'amount' => 0];
                }
                $paymentBreakdown[$method]['count']++;
                $paymentBreakdown[$method]['amount'] += (float)$sale['total'];

                $items = json_decode($sale['items'], true);
                if (!is_array($items)) continue;

                $wdTotal = (float)($sale['wholesale_discount'] ?? 0);
                $gdTotal = (float)($sale['global_discount']   ?? 0);

                // Sale subtotal (pre-discount) for proportion base
                $saleSubtotal = 0;
                foreach ($items as $item) {
                    $saleSubtotal += ((float)($item['quantity'] ?? 0)) * ((float)($item['price'] ?? 0));
                }

                foreach ($items as $item) {
                    $name      = $item['name']     ?? 'Unknown';
                    $qty       = (float)($item['quantity'] ?? 0);
                    $price     = (float)($item['price']    ?? 0);
                    $itemTotal = $qty * $price;

                    if (!isset($salesByProduct[$name])) {
                        $salesByProduct[$name] = ['quantity' => 0, 'total_sales' => 0];
                    }
                    $salesByProduct[$name]['quantity']    += $qty;
                    $salesByProduct[$name]['total_sales'] += $itemTotal;

                    if (!isset($wholesaleByProduct[$name])) {
                        $wholesaleByProduct[$name] = ['kg' => 0, 'disc' => 0, 'global_disc' => 0];
                    }
                    if ($saleSubtotal > 0) {
                        $proportion = $itemTotal / $saleSubtotal;
                        // Wholesale KG = all qty from sales that had a wholesale discount
                        if ($wdTotal > 0) {
                            $wholesaleByProduct[$name]['kg']   += $qty;
                            $wholesaleByProduct[$name]['disc'] += $proportion * $wdTotal;
                        }
                        // Global discount allocated proportionally
                        if ($gdTotal > 0) {
                            $wholesaleByProduct[$name]['global_disc'] += $proportion * $gdTotal;
                        }
                    }
                }
            }

            // ── Pre-fetch transfers for this date/store ───────────────────────────
            // [product_id => ['add' => 0, 'pickup' => 0, 'return' => 0, 'scrap' => 0]]
            $transfersByProductId = [];
            if ($storeId && $storeName !== 'All Stores') {
                try {
                    $tStmt = $pdo->prepare(
                        "SELECT product_id,
                                `from`, `to`,
                                COALESCE(NULLIF(quantity_received, 0), quantity) AS eff_qty,
                                LOWER(COALESCE(`type`, '')) AS ttype,
                                LOWER(status) AS lstatus
                         FROM transfers
                         WHERE DATE(created_at) = ?
                           AND (`to` = ? OR `from` = ?)
                           AND LOWER(status) NOT IN ('cancelled', 'rejected')"
                    );
                    $tStmt->execute([$date, $storeName, $storeName]);
                    foreach ($tStmt->fetchAll() as $tr) {
                        $pid   = (int)$tr['product_id'];
                        $qty   = (float)$tr['eff_qty'];
                        $ttype = $tr['ttype'];
                        $to    = $tr['to'];
                        $from  = $tr['from'];
                        if (!isset($transfersByProductId[$pid])) {
                            $transfersByProductId[$pid] = ['add' => 0, 'pickup' => 0, 'return' => 0, 'scrap' => 0];
                        }
                        if ($to === $storeName) {
                            // Stock arriving at this store → ADD
                            $transfersByProductId[$pid]['add'] += $qty;
                        } elseif ($from === $storeName) {
                            if ($ttype === 'return_backorder') {
                                // Good stock returned to production
                                $transfersByProductId[$pid]['return'] += $qty;
                            } elseif ($ttype === 'return_scrap') {
                                // Defective stock sent to production → SCRAP/B.O.
                                $transfersByProductId[$pid]['scrap'] += $qty;
                            } else {
                                // Outgoing to another store → PICK UP
                                $transfersByProductId[$pid]['pickup'] += $qty;
                            }
                        }
                    }
                } catch (Exception $tErr) {
                    error_log('PDF transfer pre-fetch error: ' . $tErr->getMessage());
                }
            }

            // ── Build product rows ────────────────────────────────────────────────
            $productTableRows = '';
            $totalAmount     = 0;
            $totalKgSales    = 0;
            $totalUnitPrice  = 0;
            $totalWGs        = 0;
            $totalStocks     = 0;
            $totalAdd        = 0;
            $totalPickUp     = 0;
            $totalReturn     = 0;
            $totalScrapBO    = 0;
            $totalTurnOver   = 0;
            $totalTotalSales = 0;
            $totalTotalWeight= 0;
            $totalWholesaleKg   = 0;
            $totalWholesaleDisc = 0;
            $totalReseco     = 0;
            $totalNetAmount  = 0;

            foreach ($products as $product) {
                $productName = $product['name'];
                $unitPrice   = (float)$product['price'];

                // Current inventory for this store
                $invStmt = $pdo->prepare('SELECT quantity FROM inventory WHERE product_id = ?' . ($storeId ? ' AND location = ?' : '') . ' LIMIT 1');
                $invParams = [$product['id']];
                if ($storeId) $invParams[] = $storeLocation;
                $invStmt->execute($invParams);
                $inv   = $invStmt->fetch();
                $stock = $inv ? max(0, (float)$inv['quantity']) : 0;

                $quantity         = (float)($salesByProduct[$productName]['quantity']    ?? 0);
                $productTotalSales = (float)($salesByProduct[$productName]['total_sales'] ?? 0);

                // WGS, TURN OVER, RESECO: still from saved manual entries
                $savedEntry   = $savedEntriesData[(int)$product['id']] ?? null;
                $wgs          = $savedEntry ? (float)($savedEntry['wgs']          ?? 0) : 0;
                $turnOver     = $savedEntry ? (float)($savedEntry['turn_over']     ?? 0) : 0;
                $resecoAmount = $savedEntry ? (float)($savedEntry['reseco_amount'] ?? 0) : 0;

                // ADD, PICK UP, RETURN, SCRAP/B.O.: from actual transfer records
                $tData    = $transfersByProductId[(int)$product['id']] ?? ['add' => 0, 'pickup' => 0, 'return' => 0, 'scrap' => 0];
                $addQty   = $tData['add'];
                $pickupQty= $tData['pickup'];
                $returnQty= $tData['return'];
                $scrapBo  = $tData['scrap'];

                // Wholesale KG, DISC from sales data
                $wsData = $wholesaleByProduct[$productName] ?? ['kg' => 0, 'disc' => 0, 'global_disc' => 0];
                $wsKg   = $wsData['kg'];
                $wsDisc = $wsData['disc'];

                // AMOUNT = gross product sales − wholesale discount − global discount share + reseco
                $globalDiscShare = $wsData['global_disc'];
                $netAmount = max(0, $productTotalSales - $wsDisc - $globalDiscShare + $resecoAmount);

                $totalKgSales      += $quantity;
                $totalUnitPrice    += $unitPrice;
                $totalWGs          += $wgs;
                $totalStocks       += $stock;
                $totalAdd          += $addQty;
                $totalPickUp       += $pickupQty;
                $totalReturn       += $returnQty;
                $totalScrapBO      += $scrapBo;
                $totalTurnOver     += $turnOver;
                $totalTotalSales   += $productTotalSales;
                $totalTotalWeight  += $quantity;
                $totalWholesaleKg  += $wsKg;
                $totalWholesaleDisc+= $wsDisc;
                $totalReseco       += $resecoAmount;
                $totalNetAmount    += $netAmount;
                $totalAmount       += $productTotalSales;

                $productTableRows .= '<tr>';
                $productTableRows .= '<td>' . htmlspecialchars($productName) . '</td>';
                $productTableRows .= '<td class="number">' . number_format($unitPrice, 2) . '</td>';
                $productTableRows .= '<td class="number">' . number_format($wgs, 3) . '</td>';
                $productTableRows .= '<td class="number">' . $stock . '</td>';
                $productTableRows .= '<td class="number">' . ($addQty   > 0 ? number_format($addQty,   3) : '') . '</td>';
                $productTableRows .= '<td class="number">' . ($pickupQty> 0 ? number_format($pickupQty,3) : '') . '</td>';
                $productTableRows .= '<td class="number">' . ($returnQty > 0 ? number_format($returnQty,3) : '') . '</td>';
                $productTableRows .= '<td class="number">' . ($scrapBo  > 0 ? number_format($scrapBo,  3) : '') . '</td>';
                $productTableRows .= '<td class="number">' . ($turnOver > 0 ? number_format($turnOver, 3) : '') . '</td>';
                $productTableRows .= '<td class="number">' . ($quantity > 0 ? number_format($quantity, 2) : '') . '</td>';
                $productTableRows .= '<td class="number">' . ($quantity > 0 ? number_format($quantity, 2) : '') . '</td>';
                $productTableRows .= '<td class="number">' . ($productTotalSales > 0 ? 'P ' . number_format($productTotalSales, 2) : '') . '</td>';
                $productTableRows .= '<td class="number">' . ($wsKg  > 0 ? number_format($wsKg,  2) : '') . '</td>';
                $productTableRows .= '<td class="number">' . ($wsDisc > 0 ? number_format($wsDisc, 2) : '') . '</td>';
                $productTableRows .= '<td class="number">' . ($resecoAmount > 0 ? 'P ' . number_format($resecoAmount, 2) : '') . '</td>';
                $productTableRows .= '<td class="number">' . ($netAmount > 0 ? 'P ' . number_format($netAmount, 2) : '') . '</td>';
                $productTableRows .= '</tr>';
            }

            // Payment rows
            $paymentRows = '';
            foreach ($paymentBreakdown as $p) {
                $paymentRows .= '<tr>';
                $paymentRows .= '<td>' . strtoupper(htmlspecialchars($p['method'])) . '</td>';
                $paymentRows .= '<td class="number">' . $p['count'] . '</td>';
                $paymentRows .= '<td class="number">P ' . number_format($p['amount'], 2) . '</td>';
                $paymentRows .= '</tr>';
            }

            $grossSales = $totalSales + $totalDiscount;

            $html = '<!DOCTYPE html><html><head><meta charset="utf-8"><style>';
            $html .= '* { margin: 0; padding: 0; box-sizing: border-box; }';
            $html .= 'body { font-family: Arial, sans-serif; font-size: 8px; color: #000; line-height: 1.2; margin: 0; padding: 0; }';
            $html .= '.document-container { border: 3px solid #000; margin: 1cm; padding: 20px; }';
            $html .= '.header { text-align: center; margin-bottom: 8px; border-bottom: 2px solid #000; padding-bottom: 5px; }';
            $html .= '.header h1 { font-size: 14px; font-weight: bold; margin-bottom: 3px; }';
            $html .= '.header-info { margin-top: 5px; font-size: 8px; }';
            $html .= '.info-item { display: inline-block; margin-right: 20px; }';
            $html .= '.info-item strong { display: inline-block; width: 50px; }';
            $html .= 'table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }';
            $html .= 'th { background-color: #f0f0f0; border: 1px solid #000; padding: 2px; text-align: center; font-weight: bold; font-size: 7px; }';
            $html .= 'td { border: 1px solid #000; padding: 2px; text-align: left; font-size: 8px; }';
            $html .= 'td.number { text-align: right; padding-right: 4px; }';
            $html .= '.products-table th, .products-table td { padding: 1px 2px; font-size: 7px; }';
            $html .= '.total-row { background-color: #ffcc00; font-weight: bold; }';
            $html .= '.section-title { font-size: 8px; font-weight: bold; margin-top: 8px; margin-bottom: 3px; background-color: #f0f0f0; padding: 2px; border: 1px solid #000; text-align: center; }';
            $html .= '.cash-out-table td { padding: 2px; }';
            $html .= '.signature-box { margin-top: 10px; font-size: 7px; }';
            $html .= '.signature { display: inline-block; text-align: center; width: 30%; margin-right: 3%; }';
            $html .= '.signature-line { border-top: 1px solid #000; margin-top: 15px; font-size: 7px; }';
            $html .= '</style></head><body><div class="document-container">';
            $html .= '<div class="header"><h1>LZT MEAT PRODUCTS</h1>';
            $html .= '<div class="header-info">';
            $html .= '<table style="width:100%;border:none;margin:0;padding:0;"><tr>';
            $html .= '<td style="border:none;text-align:left;padding:0;width:40%;"><strong>NAME:</strong> ' . htmlspecialchars($userName) . '</td>';
            $html .= '<td style="border:none;text-align:center;padding:0;width:30%;"><strong>LOC:</strong> ' . htmlspecialchars($storeName) . '</td>';
            $html .= '<td style="border:none;text-align:right;padding:0;width:30%;"><strong>DATE:</strong> ' . $dateFormatted . '</td>';
            $html .= '</tr></table>';
            $html .= '</div></div>';
            $html .= '<div class="section-title">PRODUCTS</div>';
            $html .= '<table class="products-table"><thead>';
            $html .= '<tr><th colspan="12"></th><th colspan="2" style="background-color:#ffcc00;text-align:center;font-weight:bold;font-size:7px;border:1px solid #000;">WHOLESALE</th><th style="background-color:#ffcc00;text-align:center;font-weight:bold;font-size:7px;border:1px solid #000;">RESECO</th><th></th></tr>';
            $html .= '<tr><th>PRODUCTS</th><th>UNIT PRICE</th><th>WGs</th><th>STOCKS</th><th>ADD</th><th>PICK UP</th><th>RETURN</th><th>SCRAP/B.O.</th><th>TURN OVER</th><th>KG SALES</th><th>TOTAL WEIGHT</th><th>TOTAL SALES</th><th>KG</th><th>DISC.</th><th>AMOUNT</th><th>AMOUNT</th></tr>';
            $html .= '</thead><tbody>';
            $html .= $productTableRows;
            $html .= '<tr class="total-row">';
            $html .= '<td></td>';
            $html .= '<td class="number"><strong>TOTAL:</strong></td>';
            $html .= '<td class="number"><strong>' . number_format($totalWGs, 2) . '</strong></td>';
            $html .= '<td class="number"><strong>' . number_format($totalStocks, 2) . '</strong></td>';
            $html .= '<td class="number"><strong>' . number_format($totalAdd, 2) . '</strong></td>';
            $html .= '<td class="number"><strong>' . number_format($totalPickUp, 2) . '</strong></td>';
            $html .= '<td class="number"><strong>' . number_format($totalReturn, 2) . '</strong></td>';
            $html .= '<td class="number"><strong>' . number_format($totalScrapBO, 2) . '</strong></td>';
            $html .= '<td class="number"><strong>' . number_format($totalTurnOver, 2) . '</strong></td>';
            $html .= '<td class="number"><strong>' . number_format($totalKgSales, 2) . '</strong></td>';
            $html .= '<td class="number"><strong>' . number_format($totalTotalWeight, 2) . '</strong></td>';
            $html .= '<td class="number"><strong>P ' . number_format($totalTotalSales, 2) . '</strong></td>';
            $html .= '<td class="number"><strong>' . number_format($totalWholesaleKg, 2) . '</strong></td>';
            $html .= '<td class="number"><strong>' . number_format($totalWholesaleDisc, 2) . '</strong></td>';
            $html .= '<td class="number"><strong>P ' . number_format($totalReseco, 2) . '</strong></td>';
            $html .= '<td class="number"><strong>P ' . number_format($totalNetAmount, 2) . '</strong></td>';
            $html .= '</tr></tbody></table>';

            // Cash out: use saved rows if available, else live transactions
            $cashOutRows = '';
            $cashOutTotal = 0;
            if ($savedHeaderData && !empty($savedHeaderData['cash_out_rows'])) {
                $savedCashOutArr = json_decode($savedHeaderData['cash_out_rows'], true);
                if (is_array($savedCashOutArr)) {
                    foreach ($savedCashOutArr as $co) {
                        $txDesc = htmlspecialchars($co['description'] ?? 'Cash Out');
                        $txAmount = (float)($co['amount'] ?? 0);
                        $cashOutTotal += $txAmount;
                        $cashOutRows .= '<tr><td>' . $txDesc . '</td><td class="number">P ' . number_format($txAmount, 2) . '</td></tr>';
                    }
                }
            } else {
                try {
                    $txCheck = $pdo->query("SHOW TABLES LIKE 'transactions'");
                    if ($txCheck->rowCount() > 0) {
                        $txStmt = $pdo->prepare('SELECT * FROM transactions WHERE type = ? AND DATE(created_at) = ? ORDER BY created_at ASC');
                        $txStmt->execute(['Cash Out', $date]);
                        foreach ($txStmt->fetchAll() as $tx) {
                            $txDesc = htmlspecialchars($tx['description'] ?? $tx['category'] ?? 'Cash Out');
                            $txAmount = (float)($tx['amount'] ?? 0);
                            $cashOutTotal += $txAmount;
                            $cashOutRows .= '<tr><td>' . $txDesc . '</td><td class="number">P ' . number_format($txAmount, 2) . '</td></tr>';
                        }
                    }
                } catch (Exception $txErr) {
                    error_log('Cash out query error: ' . $txErr->getMessage());
                }
            }

            if (empty($cashOutRows)) {
                $cashOutRows = '<tr><td colspan="2" style="text-align:center;font-style:italic;">No cash out transactions</td></tr>';
            }

            // Cash out + Sales section
            $html .= '<table><tr><td style="width:50%;vertical-align:top;border:none;padding-right:5px;">';
            $html .= '<div class="section-title">CASH OUT</div>';
            $html .= '<table class="cash-out-table">';
            $html .= $cashOutRows;
            $html .= '<tr><td style="border-top:2px solid #000;"><strong>TOTAL</strong></td><td class="number" style="border-top:2px solid #000;"><strong>P ' . number_format($cashOutTotal, 2) . '</strong></td></tr>';
            $html .= '</table></td><td style="width:50%;vertical-align:top;border:none;padding-left:5px;">';
            $html .= '<div class="section-title">SALES</div>';
            $html .= '<table><tr><th>DEN</th><th>#</th><th>TOTAL</th></tr>';
            $denominations = ['5000', '1000', '500', '200', '100', '50', '20'];
            $savedDenominations = ['5000' => 0, '1000' => 0, '500' => 0, '200' => 0, '100' => 0, '50' => 0, '20' => 0];
            if ($savedHeaderData && !empty($savedHeaderData['denominations'])) {
                $decoded = json_decode($savedHeaderData['denominations'], true);
                if (is_array($decoded)) $savedDenominations = array_merge($savedDenominations, $decoded);
            }
            $denTotalSum = 0;
            foreach ($denominations as $den) {
                $count = (int)($savedDenominations[$den] ?? 0);
                $denTotal = $count * (int)$den;
                $denTotalSum += $denTotal;
                $html .= '<tr><td>' . $den . '</td><td>' . ($count > 0 ? $count : '') . '</td><td>' . ($denTotal > 0 ? number_format($denTotal, 2) : '') . '</td></tr>';
            }
            $html .= '<tr class="total-row"><td><strong>TOTAL</strong></td><td></td><td>' . ($denTotalSum > 0 ? number_format($denTotalSum, 2) : '') . '</td></tr>';
            $html .= '</table></td></tr></table>';

            // Computation: use saved values if available
            $compTotalSales = $totalSales;
            $compCashOut = $cashOutTotal;
            $compGrossSales = $totalSales;
            $compOver = $totalSales - $cashOutTotal;
            if ($savedHeaderData && !empty($savedHeaderData['computation'])) {
                $savedComp = json_decode($savedHeaderData['computation'], true);
                if (is_array($savedComp)) {
                    if (isset($savedComp['totalSales'])) $compTotalSales = (float)$savedComp['totalSales'];
                    if (isset($savedComp['cashOut'])) $compCashOut = (float)$savedComp['cashOut'];
                    if (isset($savedComp['grossSales'])) $compGrossSales = (float)$savedComp['grossSales'];
                    if (isset($savedComp['over'])) $compOver = (float)$savedComp['over'];
                }
            }
            $html .= '<div class="section-title">COMPUTATION</div>';
            $html .= '<table class="cash-out-table">';
            $html .= '<tr><td>TOTAL SALES</td><td class="number">P ' . number_format($compTotalSales, 2) . '</td></tr>';
            $html .= '<tr><td>CASH OUT</td><td class="number">P ' . number_format($compCashOut, 2) . '</td></tr>';
            $html .= '<tr><td style="border-top:2px solid #000;border-bottom:2px solid #000;"><strong>GROSS SALES</strong></td><td class="number" style="border-top:2px solid #000;border-bottom:2px solid #000;"><strong>P ' . number_format($compGrossSales, 2) . '</strong></td></tr>';
            $html .= '<tr style="background-color:#ffcc00;"><td><strong>OVER</strong></td><td class="number"><strong>P ' . number_format($compOver, 2) . '</strong></td></tr>';
            $html .= '</table>';

            // Remarks + Signatures
            $html .= '<div class="section-title">REMARKS</div>';
            $html .= '<div style="border:1px solid #000;padding:5px;min-height:20px;">' . htmlspecialchars($savedHeaderData['remarks'] ?? '') . '</div>';
            $html .= '<div class="signature-box">';
            $html .= '<div class="signature"><p>Prepared By:</p><div class="signature-line">_____________________</div></div>';
            $html .= '<div class="signature"><p>Checked By:</p><div class="signature-line">_____________________</div></div>';
            $html .= '<div class="signature"><p>Approved By:</p><div class="signature-line">_____________________</div></div>';
            $html .= '</div>';
            $html .= '<p style="text-align:center;margin-top:8px;font-size:7px;border-top:1px solid #000;padding-top:5px;">ATTENTION: Please WRITE a READABLE and CLEAR numbers and points and avoid ALTERATIONS</p>';
            $html .= '</div></body></html>';

            // Use DomPDF from vendor
            $autoloadPath = __DIR__ . '/vendor/autoload.php';
            if (!file_exists($autoloadPath)) {
                http_response_code(500);
                return ['error' => 'PDF library not available. Vendor autoload not found.'];
            }

            require_once $autoloadPath;

            $options = new \Dompdf\Options();
            $options->set('isRemoteEnabled', true);
            $options->set('isHtml5ParserEnabled', true);
            $dompdf = new \Dompdf\Dompdf($options);
            $dompdf->loadHtml($html);
            $dompdf->setPaper('letter', 'portrait');
            $dompdf->render();

            // Output PDF directly
            header('Content-Type: application/pdf');
            header('Content-Disposition: attachment; filename="Daily-Report-' . $date . '.pdf"');
            header('Cache-Control: no-cache, no-store, must-revalidate');
            echo $dompdf->output();
            exit;

        } catch (Exception $e) {
            http_response_code(500);
            error_log('PDF Generation Error: ' . $e->getMessage());
            return ['error' => 'Failed to generate PDF: ' . $e->getMessage()];
        }
    },

    'GET /api/reports/daily-csv' => function() use ($pdo) {
        try {
            // Set timezone to Philippines
            date_default_timezone_set('Asia/Manila');
            try { $pdo->exec("SET time_zone = '+08:00'"); } catch (Exception $tzErr) { /* ignore */ }

            $date = $_GET['date'] ?? date('Y-m-d');
            $storeId = $_GET['storeId'] ?? null;
            $cashierId = $_GET['cashierId'] ?? null;

            $salesQuery = 'SELECT s.*, u.full_name as cashier_name, st.name as store_name 
                           FROM sales s 
                           LEFT JOIN users u ON s.user_id = u.id 
                           LEFT JOIN stores st ON s.store_id = st.id 
                           WHERE DATE(s.created_at) = ?';
            $params = [$date];
            if ($storeId) {
                $salesQuery .= ' AND s.store_id = ?';
                $params[] = $storeId;
            }
            if ($cashierId) {
                $salesQuery .= ' AND s.user_id = ?';
                $params[] = $cashierId;
            }
            $salesQuery .= ' ORDER BY s.created_at ASC';
            $salesStmt = $pdo->prepare($salesQuery);
            $salesStmt->execute($params);
            $sales = $salesStmt->fetchAll();

            $filename = "Daily-Report-{$date}.csv";
            header('Content-Type: text/csv');
            header("Content-Disposition: attachment; filename=\"{$filename}\"");
            header('Cache-Control: no-cache, no-store, must-revalidate');

            $output = fopen('php://output', 'w');

            fputcsv($output, [
                'Transaction ID', 'Date', 'Time', 'Cashier', 'Customer', 'Store',
                'Items Count', 'Subtotal', 'Global Discount', 'Total', 'Payment Method', 'Sales Type',
            ]);

            foreach ($sales as $sale) {
                $items = json_decode($sale['items'], true);
                $itemsCount = is_array($items) ? count($items) : 0;
                $customer = $sale['customer'] ?? '';
                if (is_string($customer)) {
                    $decoded = json_decode($customer, true);
                    $customer = $decoded['name'] ?? $customer;
                }

                fputcsv($output, [
                    $sale['transaction_id'],
                    date('Y-m-d', strtotime($sale['created_at'])),
                    date('H:i:s', strtotime($sale['created_at'])),
                    $sale['cashier_name'] ?? 'Unknown',
                    $customer ?: 'Walk-in',
                    $sale['store_name'] ?? 'Unknown',
                    $itemsCount,
                    number_format((float)$sale['subtotal'], 2),
                    number_format((float)($sale['global_discount'] ?? 0), 2),
                    number_format((float)$sale['total'], 2),
                    $sale['payment_method'] ?? 'Cash',
                    $sale['sales_type'] ?? 'retail',
                ]);
            }

            fclose($output);
            exit;

        } catch (Exception $e) {
            http_response_code(500);
            error_log('CSV Export Error: ' . $e->getMessage());
            return ['error' => 'Failed to generate CSV: ' . $e->getMessage()];
        }
    },

    // ==================== SALES DISCREPANCIES ====================

    'GET /api/sales-discrepancies' => function() use ($pdo) {
        $startDate = $_GET['startDate'] ?? null;
        $endDate   = $_GET['endDate']   ?? null;
        $status    = $_GET['status']    ?? null;

        $where = [];
        $params = [];

        if ($startDate) { $where[] = 'sd.shift_date >= ?'; $params[] = $startDate; }
        if ($endDate)   { $where[] = 'sd.shift_date <= ?'; $params[] = $endDate; }
        if ($status)    { $where[] = 'sd.status = ?';      $params[] = $status; }

        $query = 'SELECT sd.*, da.id as adj_id, da.unit_cost, da.total_cost as adj_total_cost, da.created_at as adj_created_at,
                         COALESCE(p.price, 0) as product_unit_price
                  FROM sales_discrepancies sd
                  LEFT JOIN discrepancy_adjustments da ON da.sales_discrepancy_id = sd.id
                  LEFT JOIN products p ON p.id = sd.product_id'
                 . (!empty($where) ? ' WHERE ' . implode(' AND ', $where) : '')
                 . ' ORDER BY sd.shift_date DESC, sd.created_at DESC';

        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();

        return [
            'discrepancies' => array_map(function($r) {
                return [
                    'id'                => (string)$r['id'],
                    'storeId'           => $r['store_id'] ? (string)$r['store_id'] : null,
                    'storeName'         => $r['store_name'],
                    'productId'         => $r['product_id'],
                    'productName'       => $r['product_name'],
                    'unit'              => $r['unit'],
                    'shiftDate'         => $r['shift_date'],
                    'shift'             => $r['shift'],
                    'startingStock'     => (float)$r['starting_stock'],
                    'salesQuantity'     => (float)$r['sales_quantity'],
                    'expectedRemaining' => (float)$r['expected_remaining'],
                    'reportedRemaining' => (float)$r['reported_remaining'],
                    'discrepancyAmount' => (float)$r['discrepancy_amount'],
                    'cashier'           => $r['cashier'],
                    'userId'            => $r['user_id'] ? (string)$r['user_id'] : null,
                    'status'            => $r['status'],
                    'notes'             => $r['notes'],
                    'createdAt'         => $r['created_at'],
                    'unitPrice'         => (float)$r['product_unit_price'],
                    'adjustment'        => $r['adj_id'] ? [
                        'id'        => (string)$r['adj_id'],
                        'unitCost'  => (float)$r['unit_cost'],
                        'totalCost' => (float)$r['adj_total_cost'],
                        'createdAt' => $r['adj_created_at'],
                    ] : null,
                ];
            }, $rows),
        ];
    },

    'POST /api/sales-discrepancies' => function() use ($pdo, $body) {
        $storeName         = $body['storeName']         ?? '';
        $storeId           = $body['storeId']           ?? null;
        $productId         = $body['productId']         ?? '';
        $productName       = $body['productName']       ?? '';
        $unit              = $body['unit']              ?? 'kg';
        $shiftDate         = $body['shiftDate']         ?? date('Y-m-d');
        $shift             = $body['shift']             ?? null;
        $startingStock     = (float)($body['startingStock']     ?? 0);
        $salesQuantity     = (float)($body['salesQuantity']     ?? 0);
        $reportedRemaining = (float)($body['reportedRemaining'] ?? 0);
        $cashier           = $body['cashier']           ?? null;
        $userId            = $body['userId']            ?? null;
        $notes             = $body['notes']             ?? null;

        if (!$storeName || !$productId || !$productName) {
            http_response_code(400);
            return ['error' => 'storeName, productId, and productName are required'];
        }

        $expectedRemaining  = $startingStock  - $salesQuantity;
        $discrepancyAmount  = $expectedRemaining - $reportedRemaining;

        $stmt = $pdo->prepare(
            'INSERT INTO sales_discrepancies
             (store_id, store_name, product_id, product_name, unit, shift_date, shift,
              starting_stock, sales_quantity, expected_remaining, reported_remaining,
              discrepancy_amount, cashier, user_id, status, notes, created_at, updated_at)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,\'pending\',?,NOW(),NOW())'
        );
        $stmt->execute([
            $storeId, $storeName, $productId, $productName, $unit,
            $shiftDate, $shift,
            $startingStock, $salesQuantity, $expectedRemaining, $reportedRemaining,
            $discrepancyAmount, $cashier, $userId, $notes,
        ]);

        $newId = $pdo->lastInsertId();
        $row = $pdo->prepare('SELECT * FROM sales_discrepancies WHERE id = ?');
        $row->execute([$newId]);
        $r = $row->fetch();

        return [
            'discrepancy' => [
                'id'                => (string)$r['id'],
                'storeId'           => $r['store_id'] ? (string)$r['store_id'] : null,
                'storeName'         => $r['store_name'],
                'productId'         => $r['product_id'],
                'productName'       => $r['product_name'],
                'unit'              => $r['unit'],
                'shiftDate'         => $r['shift_date'],
                'shift'             => $r['shift'],
                'startingStock'     => (float)$r['starting_stock'],
                'salesQuantity'     => (float)$r['sales_quantity'],
                'expectedRemaining' => (float)$r['expected_remaining'],
                'reportedRemaining' => (float)$r['reported_remaining'],
                'discrepancyAmount' => (float)$r['discrepancy_amount'],
                'cashier'           => $r['cashier'],
                'userId'            => $r['user_id'] ? (string)$r['user_id'] : null,
                'status'            => $r['status'],
                'notes'             => $r['notes'],
                'createdAt'         => $r['created_at'],
                'adjustment'        => null,
            ],
        ];
    },

    'POST /api/sales-discrepancies/{id}/adjust' => function() use ($pdo, $body) {        $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        preg_match('/\/api\/sales-discrepancies\/(\d+)\/adjust/', $uri, $matches);
        $id = $matches[1] ?? null;

        if (!$id) {
            http_response_code(400);
            return ['error' => 'Discrepancy ID is required'];
        }

        // Fetch the discrepancy
        $stmt = $pdo->prepare('SELECT * FROM sales_discrepancies WHERE id = ?');
        $stmt->execute([$id]);
        $disc = $stmt->fetch();

        if (!$disc) {
            http_response_code(404);
            return ['error' => 'Discrepancy not found'];
        }

        if ($disc['status'] === 'adjusted') {
            http_response_code(409);
            return ['error' => 'Discrepancy has already been adjusted'];
        }

        $unitCost  = (float)($body['unitCost']  ?? 0);
        $notes     = $body['notes']    ?? null;
        $cashier   = $body['cashier']  ?? $disc['cashier'];
        $userId    = $body['userId']   ?? $disc['user_id'];
        $quantity  = (float)$disc['discrepancy_amount'];
        $totalCost = round($quantity * $unitCost, 2);

        // Insert adjustment record
        $ins = $pdo->prepare(
            'INSERT INTO discrepancy_adjustments
             (sales_discrepancy_id, store_name, product_id, product_name, quantity, unit, unit_cost, total_cost, cashier, user_id, notes, created_at, updated_at)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,NOW(),NOW())'
        );
        $ins->execute([
            $id, $disc['store_name'], $disc['product_id'], $disc['product_name'],
            $quantity, $disc['unit'], $unitCost, $totalCost, $cashier, $userId, $notes,
        ]);
        $adjId = $pdo->lastInsertId();

        // Mark discrepancy as adjusted
        $upd = $pdo->prepare('UPDATE sales_discrepancies SET status = \'adjusted\', updated_at = NOW() WHERE id = ?');
        $upd->execute([$id]);

        return [
            'success'    => true,
            'adjustment' => [
                'id'        => (string)$adjId,
                'unitCost'  => $unitCost,
                'totalCost' => $totalCost,
                'createdAt' => date('Y-m-d H:i:s'),
            ],
        ];
    },

    // ==================== PASSWORD VERIFY ====================

    'POST /api/auth/verify-password' => function() use ($pdo, $body) {
        $userId   = $body['userId']   ?? null;
        $password = $body['password'] ?? '';

        if (!$userId || !$password) {
            http_response_code(400);
            return ['valid' => false, 'error' => 'userId and password are required'];
        }

        $stmt = $pdo->prepare('SELECT password FROM users WHERE id = ?');
        $stmt->execute([$userId]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($password, $user['password'])) {
            http_response_code(401);
            return ['valid' => false, 'error' => 'Incorrect password'];
        }

        return ['valid' => true];
    },

    // ==================== EOD STOCK COUNTS ====================

    // Preflight: check if a store had any sales on a given date and return per-product breakdown
    'GET /api/eod-counts/preflight' => function() use ($pdo) {
        $storeId   = $_GET['storeId']   ?? null;
        $storeName = $_GET['storeName'] ?? '';
        $shiftDate = $_GET['shiftDate'] ?? date('Y-m-d');

        // 1. Count sales for this store on this date (all cashiers)
        if ($storeId) {
            $cStmt = $pdo->prepare('SELECT COUNT(*) FROM sales WHERE store_id = ? AND DATE(created_at) = ?');
            $cStmt->execute([$storeId, $shiftDate]);
        } else {
            // Fallback: no store_id provided → no sales check possible
            return ['hasSales' => false, 'salesCount' => 0, 'items' => []];
        }
        $salesCount = (int)$cStmt->fetchColumn();

        // 2. Current inventory for this store (already reflects all sales + received transfers)
        $invStmt = $pdo->prepare(
            'SELECT i.product_id, COALESCE(p.name, CONCAT("Product ", i.product_id)) as product_name,
                    COALESCE(p.unit, "kg") as unit, i.quantity
             FROM inventory i
             LEFT JOIN products p ON i.product_id = p.id
             WHERE i.location = ?
             ORDER BY p.name'
        );
        $invStmt->execute([$storeName]);
        $inventory = $invStmt->fetchAll();

        // 3. Total sold today per product, ALL cashiers in this store (weight-based deduction may differ
        //    from qty, but this gives a useful reference for the cashier's UI)
        $soldStmt = $pdo->prepare(
            'SELECT si.product_id, SUM(si.quantity) as qty_sold
             FROM sale_items si
             JOIN sales s ON s.id = si.sale_id
             WHERE s.store_id = ? AND DATE(s.created_at) = ?
             GROUP BY si.product_id'
        );
        $soldStmt->execute([$storeId, $shiftDate]);
        $soldMap = [];
        foreach ($soldStmt->fetchAll() as $r) {
            $soldMap[(string)$r['product_id']] = (float)$r['qty_sold'];
        }

        // 4. Transfers received INTO this store today (completed)
        $tInStmt = $pdo->prepare(
            'SELECT product_id, SUM(COALESCE(quantity_received, quantity)) as qty
             FROM transfers
             WHERE `to` = ? AND status = "Completed"
               AND DATE(COALESCE(received_at, updated_at, created_at)) = ?
             GROUP BY product_id'
        );
        $tInStmt->execute([$storeName, $shiftDate]);
        $tInMap = [];
        foreach ($tInStmt->fetchAll() as $r) {
            $tInMap[(string)$r['product_id']] = (float)$r['qty'];
        }

        // 5. Transfers sent OUT of this store today (completed)
        $tOutStmt = $pdo->prepare(
            'SELECT product_id, SUM(COALESCE(quantity_received, quantity)) as qty
             FROM transfers
             WHERE `from` = ? AND status = "Completed"
               AND DATE(COALESCE(received_at, updated_at, created_at)) = ?
             GROUP BY product_id'
        );
        $tOutStmt->execute([$storeName, $shiftDate]);
        $tOutMap = [];
        foreach ($tOutStmt->fetchAll() as $r) {
            $tOutMap[(string)$r['product_id']] = (float)$r['qty'];
        }

        $items = array_map(function($inv) use ($soldMap, $tInMap, $tOutMap) {
            $pid = (string)$inv['product_id'];
            return [
                'productId'      => $pid,
                'productName'    => $inv['product_name'],
                'unit'           => $inv['unit'],
                'expectedQty'    => (float)$inv['quantity'],  // current inventory = ground truth
                'totalSoldToday' => $soldMap[$pid]  ?? 0.0,
                'transfersIn'    => $tInMap[$pid]   ?? 0.0,
                'transfersOut'   => $tOutMap[$pid]  ?? 0.0,
            ];
        }, $inventory);

        return [
            'hasSales'   => $salesCount > 0,
            'salesCount' => $salesCount,
            'items'      => $items,
        ];
    },

    'GET /api/eod-counts' => function() use ($pdo) {
        $userId    = $_GET['userId']    ?? null;
        $startDate = $_GET['startDate'] ?? null;
        $endDate   = $_GET['endDate']   ?? null;

        $where  = [];
        $params = [];
        if ($userId)    { $where[] = 'e.user_id = ?';            $params[] = $userId; }
        if ($startDate) { $where[] = 'e.shift_date >= ?';        $params[] = $startDate; }
        if ($endDate)   { $where[] = 'e.shift_date <= ?';        $params[] = $endDate; }

        $query = 'SELECT e.* FROM eod_stock_counts e'
                 . (!empty($where) ? ' WHERE ' . implode(' AND ', $where) : '')
                 . ' ORDER BY e.shift_date DESC, e.created_at DESC';
        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        $counts = $stmt->fetchAll();

        $result = [];
        foreach ($counts as $c) {
            $iStmt = $pdo->prepare('SELECT * FROM eod_stock_count_items WHERE eod_count_id = ? ORDER BY product_name');
            $iStmt->execute([$c['id']]);
            $items = $iStmt->fetchAll();
            $result[] = [
                'id'         => (string)$c['id'],
                'userId'     => $c['user_id'] ? (string)$c['user_id'] : null,
                'userName'   => $c['user_name'],
                'storeId'    => $c['store_id'] ? (string)$c['store_id'] : null,
                'storeName'  => $c['store_name'],
                'shiftDate'  => $c['shift_date'],
                'shift'      => $c['shift'],
                'notes'      => $c['notes'],
                'createdAt'  => $c['created_at'],
                'items'      => array_map(fn($i) => [
                    'id'           => (string)$i['id'],
                    'productId'    => $i['product_id'],
                    'productName'  => $i['product_name'],
                    'unit'         => $i['unit'],
                    'expectedQty'  => (float)$i['expected_qty'],
                    'actualQty'    => (float)$i['actual_qty'],
                    'discrepancy'  => (float)$i['discrepancy'],
                ], $items),
            ];
        }

        return ['counts' => $result];
    },

    'POST /api/eod-counts' => function() use ($pdo, $body) {
        $userId    = $body['userId']    ?? null;
        $userName  = $body['userName']  ?? '';
        $storeId   = $body['storeId']   ?? null;
        $storeName = $body['storeName'] ?? '';
        $shiftDate = $body['shiftDate'] ?? date('Y-m-d');
        $shift     = $body['shift']     ?? null;
        $notes     = $body['notes']     ?? null;
        $items     = $body['items']     ?? [];

        if (!$userName || !$storeName || empty($items)) {
            http_response_code(400);
            return ['error' => 'userName, storeName, and items are required'];
        }

        $pdo->beginTransaction();
        try {
            $ins = $pdo->prepare(
                'INSERT INTO eod_stock_counts (user_id, user_name, store_id, store_name, shift_date, shift, notes, created_at, updated_at)
                 VALUES (?,?,?,?,?,?,?,NOW(),NOW())'
            );
            $ins->execute([$userId, $userName, $storeId, $storeName, $shiftDate, $shift, $notes]);
            $countId = $pdo->lastInsertId();

            $iIns = $pdo->prepare(
                'INSERT INTO eod_stock_count_items (eod_count_id, product_id, product_name, unit, expected_qty, actual_qty, discrepancy, created_at)
                 VALUES (?,?,?,?,?,?,?,NOW())'
            );

            foreach ($items as $item) {
                $expected    = (float)($item['expectedQty']  ?? 0);
                $actual      = (float)($item['actualQty']    ?? 0);
                $discrepancy = $expected - $actual;
                $iIns->execute([
                    $countId,
                    $item['productId']   ?? '',
                    $item['productName'] ?? '',
                    $item['unit']        ?? 'kg',
                    $expected,
                    $actual,
                    $discrepancy,
                ]);

                // Auto-create a sales_discrepancy record if there is a shortage
                if ($discrepancy > 0) {
                    $dIns = $pdo->prepare(
                        'INSERT INTO sales_discrepancies
                         (store_id, store_name, product_id, product_name, unit, shift_date, shift,
                          starting_stock, sales_quantity, expected_remaining, reported_remaining,
                          discrepancy_amount, cashier, user_id, status, notes, created_at, updated_at)
                         VALUES (?,?,?,?,?,?,?, 0, 0, ?,?,?,?,?,\'pending\',?,NOW(),NOW())'
                    );
                    $note = 'Auto-created from EOD count';
                    $dIns->execute([
                        $storeId, $storeName,
                        $item['productId'] ?? '', $item['productName'] ?? '', $item['unit'] ?? 'kg',
                        $shiftDate, $shift,
                        $expected, $actual, $discrepancy,
                        $userName, $userId, $note,
                    ]);

                    // Reconcile inventory to the physically counted actual quantity
                    $invUpd = $pdo->prepare(
                        'UPDATE inventory SET quantity = ?, updated_at = NOW()
                         WHERE product_id = ? AND location = ?'
                    );
                    $invUpd->execute([$actual, $item['productId'] ?? '', $storeName]);
                }
            }

            $pdo->commit();

            return ['success' => true, 'countId' => (string)$countId];
        } catch (Exception $e) {
            if ($pdo->inTransaction()) { $pdo->rollBack(); }
            http_response_code(500);
            return ['error' => 'Failed to save EOD count: ' . $e->getMessage()];
        }
    },

];

// Find and execute route
$routeKey = "$method $uri";

// Try exact match first
if (isset($routes[$routeKey])) {
    $result = $routes[$routeKey]();
    echo json_encode($result);
} else {
    // Try to match dynamic routes like /api/ingredients/{id}
    $matched = false;
    foreach ($routes as $routePath => $handler) {
        $pattern = preg_replace('/{[^}]+}/', '([^/]+)', $routePath);
        $pattern = '#^' . $pattern . '$#';
        if (preg_match($pattern, $routeKey)) {
            $result = $handler();
            echo json_encode($result);
            $matched = true;
            break;
        }
    }
    
    if (!$matched) {
        http_response_code(404);
        echo json_encode(['error' => 'Endpoint not found', 'path' => $uri, 'method' => $method]);
    }
}
