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
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
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
    } catch (Exception $tableErr) {
        error_log('transactions table creation: ' . $tableErr->getMessage());
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
            ],
        ];
    },
    
    'GET /api/products' => function() use ($pdo) {
        $stmt = $pdo->query('SELECT p.*, c.name as category FROM products p LEFT JOIN categories c ON p.category_id = c.id ORDER BY p.name');
        $products = $stmt->fetchAll();
        
        return [
            'products' => array_map(function($p) {
                return [
                    'id' => (string)$p['id'],
                    'name' => $p['name'],
                    'category' => $p['category'] ?? 'Uncategorized',
                    'price' => (float)$p['price'],
                    'unit' => $p['unit'],
                    'image' => $p['image'],
                ];
            }, $products),
        ];
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
    
    'DELETE /api/products/{id}' => function() use ($pdo) {
        $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        $id = substr($uri, strrpos($uri, '/') + 1);
        
        if (empty($id)) {
            return ['error' => 'Product ID is required'];
        }
        
        try {
            // Delete related inventory records first
            $stmt = $pdo->prepare('DELETE FROM inventory WHERE product_id = ?');
            $stmt->execute([$id]);
            
            // Delete the product
            $stmt = $pdo->prepare('DELETE FROM products WHERE id = ?');
            $stmt->execute([$id]);
            
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
                ORDER BY i.name
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
                        'quantity' => (float)$d['quantity'],
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
                VALUES (?, ?, ?, NOW(), NOW())
            ');
            
            foreach ($ingredients as $ing) {
                $ingredientId = $ing['ingredientId'] ?? null;
                $quantity = isset($ing['quantity']) ? floatval($ing['quantity']) : 0;
                
                if ($ingredientId && $quantity > 0) {
                    $stmt->execute([$productId, $ingredientId, $quantity]);
                }
            }
            
            // Fetch the saved defaults
            $stmt = $pdo->prepare('
                SELECT pdi.*, i.name as ingredient_name, i.code as ingredient_code, i.unit as ingredient_unit, i.stock as ingredient_stock
                FROM product_default_ingredients pdi
                JOIN ingredients i ON pdi.ingredient_id = i.id
                WHERE pdi.product_id = ?
                ORDER BY i.name
            ');
            $stmt->execute([$productId]);
            $defaults = $stmt->fetchAll();
            
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
                        'quantity' => (float)$d['quantity'],
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
        
        $stmt = $pdo->prepare('DELETE FROM categories WHERE id = ?');
        $stmt->execute([$id]);
        
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
        
        $stmt = $pdo->prepare('DELETE FROM ingredient_categories WHERE id = ?');
        $stmt->execute([$id]);
        
        return ['success' => true];
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
        
        $stmt = $pdo->prepare('DELETE FROM stores WHERE id = ?');
        $stmt->execute([$id]);
        
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
        
        $query = 'SELECT s.* FROM sales s';
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
        try {
            $pdo->beginTransaction();
            
            // Validate required fields
            if (empty($body['items']) || !is_array($body['items'])) {
                http_response_code(400);
                return ['error' => 'Items array is required'];
            }
            
            if (empty($body['storeId'])) {
                http_response_code(400);
                return ['error' => 'Store ID is required'];
            }
            
            // Ensure wholesale_discount column exists
            try {
                $stmt = $pdo->query("SHOW COLUMNS FROM sales LIKE 'wholesale_discount'");
                if ($stmt->rowCount() === 0) {
                    $pdo->exec("ALTER TABLE sales ADD COLUMN wholesale_discount DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER global_discount");
                }
            } catch (Exception $e) {
                // Log but continue
                error_log('Could not add wholesale_discount column: ' . $e->getMessage());
            }
            
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
                    created_at,
                    updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
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
            ]);
            
            $saleId = (string)$pdo->lastInsertId();
            
            // Process each item
            foreach ($body['items'] as $item) {
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
                
                // Deduct from inventory - use location from body or default to "Main Store"
                $location = $body['location'] ?? $body['storeId'] ?? 'Main Store';
                $invStmt = $pdo->prepare('
                    UPDATE inventory 
                    SET quantity = quantity - ? 
                    WHERE product_id = ? AND location = ?
                ');
                
                $invStmt->execute([
                    $item['quantity'],
                    $item['productId'],
                    $location
                ]);
                
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
                            -$item['quantity']
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
            $pdo->rollBack();
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
        
        $query = 'SELECT pr.*, p.name as product_name FROM production_records pr LEFT JOIN products p ON pr.product_id = p.id';
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
            'records' => array_map(function($r) {
                return [
                    'id' => (string)$r['id'],
                    'productId' => (string)$r['product_id'],
                    'productName' => $r['product_name'] ?? 'Unknown Product',
                    'quantity' => (float)$r['quantity'],
                    'batchNumber' => $r['batch_number'],
                    'operator' => $r['operator'],
                    'status' => $r['status'] ?? 'in-progress',
                    'initialIngredients' => $r['initial_ingredients'] ? json_decode($r['initial_ingredients'], true) : null,
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
            $stmt = $pdo->prepare('INSERT INTO production_records (product_id, quantity, batch_number, operator, status, initial_ingredients, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())');
            $stmt->execute([
                $body['productId'] ?? null,
                $body['quantity'] ?? 0,
                $body['batchNumber'] ?? '',
                $body['operator'] ?? '',
                $body['status'] ?? 'in-progress',
                $initialIngredientsJson,
            ]);
            
            $id = $pdo->lastInsertId();
            $productId = $body['productId'] ?? null;
            $quantity = $body['quantity'] ?? 0;
            
            // Add produced quantity to Production Facility inventory
            if ($productId && $quantity > 0) {
                $stmt = $pdo->prepare('
                    INSERT INTO inventory (product_id, location, quantity, created_at) 
                    VALUES (?, ?, ?, NOW())
                    ON DUPLICATE KEY UPDATE quantity = quantity + ?, updated_at = NOW()
                ');
                $stmt->execute([$productId, 'Production Facility', $quantity, $quantity]);
            }
            
            // Deduct initial ingredients from ingredients table (don't fail if deduction fails)
            if (!empty($body['initialIngredients']) && is_array($body['initialIngredients'])) {
                foreach ($body['initialIngredients'] as $ing) {
                    $ingredientId = $ing['ingredientId'] ?? null;
                    $ingredientQty = isset($ing['quantity']) ? floatval($ing['quantity']) : 0;
                    
                    if ($ingredientId && $ingredientQty > 0) {
                        try {
                            // Deduct from the ingredients table stock column
                            $stmt = $pdo->prepare('
                                UPDATE ingredients 
                                SET stock = stock - ?, updated_at = NOW()
                                WHERE id = ?
                            ');
                            $stmt->execute([$ingredientQty, $ingredientId]);
                        } catch (Exception $ingredientError) {
                            // Log error but continue - don't fail the entire production creation
                            error_log('Ingredient deduction failed for ID ' . $ingredientId . ': ' . $ingredientError->getMessage());
                        }
                    }
                }
            }
            
            // Fetch the created record
            $stmt = $pdo->prepare('SELECT pr.*, p.name as product_name FROM production_records pr LEFT JOIN products p ON pr.product_id = p.id WHERE pr.id = ?');
            $stmt->execute([$id]);
            $r = $stmt->fetch();
            
            return [
                'record' => [
                    'id' => (string)$r['id'],
                    'productId' => (string)$r['product_id'],
                    'productName' => $r['product_name'] ?? 'Unknown Product',
                    'quantity' => (float)$r['quantity'],
                    'batchNumber' => $r['batch_number'],
                    'operator' => $r['operator'],
                    'status' => $r['status'] ?? 'in-progress',
                    'initialIngredients' => $r['initial_ingredients'] ? json_decode($r['initial_ingredients'], true) : null,
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
            
            return [
                'record' => [
                    'id' => (string)$r['id'],
                    'productId' => (string)$r['product_id'],
                    'productName' => $r['product_name'] ?? 'Unknown Product',
                    'quantity' => (float)$r['quantity'],
                    'batchNumber' => $r['batch_number'],
                    'operator' => $r['operator'],
                    'status' => $r['status'] ?? 'in-progress',
                    'initialIngredients' => $r['initial_ingredients'] ? json_decode($r['initial_ingredients'], true) : null,
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
        
        return [
            'record' => [
                'id' => (string)$r['id'],
                'productId' => (string)$r['product_id'],
                'productName' => $r['product_name'] ?? 'Unknown Product',
                'quantity' => (float)$r['quantity'],
                'batchNumber' => $r['batch_number'],
                'operator' => $r['operator'],
                'status' => $r['status'] ?? 'in-progress',
                'initialIngredients' => $r['initial_ingredients'] ? json_decode($r['initial_ingredients'], true) : null,
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
        
        $stmt = $pdo->prepare('DELETE FROM production_records WHERE id = ?');
        $stmt->execute([$id]);
        
        return ['success' => true, 'message' => 'Production record deleted'];
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
                    discrepancy_reason = ?, 
                    received_by = ?, 
                    received_at = NOW() 
                WHERE id = ?
            ');
            
            $stmt->execute([
                'Completed',
                $quantityReceived,
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
            
            $discrepancy = $originalQuantity - $quantityReceived;
            
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

            return ['success' => true];
        } catch (Exception $e) {
            http_response_code(500);
            return ['error' => 'Failed to delete supplier: ' . $e->getMessage()];
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
                    'id' => (int)$ingredient['id'],
                    'name' => $ingredient['name'],
                    'stock' => $newStock,
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
                ];
            }, $users),
        ];
    },
    
    'GET /api/users/all' => function() use ($pdo) {
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
            
            $stmt = $pdo->prepare('INSERT INTO users (username, password, full_name, mobile, address, role, store_id, can_login, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())');
            $bindParams = [
                $username,
                $passwordHash,
                trim($fullName),
                $body['mobile'] ?? null,
                $body['address'] ?? null,
                $role,
                (isset($body['storeId']) && !empty($body['storeId'])) ? $body['storeId'] : null,
                1
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
                    'password' => $password
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
                    'permissions' => !empty($user['permissions']) ? json_decode($user['permissions'], true) : []
                ]
            ];
        } catch (Exception $e) {
            return ['error' => $e->getMessage()];
        }
    },
    
    'DELETE /api/users/{id}' => function() use ($pdo) {
        $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        $id = substr($uri, strrpos($uri, '/') + 1);
        
        $stmt = $pdo->prepare('DELETE FROM users WHERE id = ?');
        $stmt->execute([$id]);
        
        return ['success' => true];
    },
    
    'DELETE /api/employees/{id}' => function() use ($pdo) {
        $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        $id = substr($uri, strrpos($uri, '/') + 1);
        
        $stmt = $pdo->prepare('DELETE FROM users WHERE id = ?');
        $stmt->execute([$id]);
        
        return ['success' => true];
    },
    
    'GET /api/inventory' => function() use ($pdo) {
        $location = $_GET['location'] ?? null;
        
        $query = 'SELECT i.*, p.name as product_name FROM inventory i LEFT JOIN products p ON i.product_id = p.id';
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
        
        $stmt = $pdo->prepare('DELETE FROM ingredients WHERE id = ?');
        $stmt->execute([$id]);
        
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
                    return [
                        'id' => (int)$record['id'],
                        'action' => $record['action'],
                        'description' => $record['action'],
                        'user' => $record['user_name'] ?? 'System',
                        'timestamp' => $record['created_at'],
                        'details' => $record['details'] ? json_decode($record['details'], true) : null,
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

            if ($amount <= 0) {
                http_response_code(400);
                return ['error' => 'Amount must be greater than 0'];
            }

            $stmt = $pdo->prepare('
                INSERT INTO transactions (type, amount, description, category, reference, created_by, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
            ');
            $stmt->execute([$type, $amount, $description, $category, $reference, $createdBy]);

            $id = (string)$pdo->lastInsertId();

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

            return ['success' => true, 'message' => 'Transaction deleted'];
        } catch (Exception $e) {
            http_response_code(500);
            return ['error' => 'Failed to delete transaction: ' . $e->getMessage()];
        }
    },

    'GET /api/reports/daily-pdf' => function() use ($pdo) {
        try {
            // Set timezone to Philippines
            date_default_timezone_set('Asia/Manila');
            try { $pdo->exec("SET time_zone = '+08:00'"); } catch (Exception $tzErr) { /* ignore */ }

            $date = $_GET['date'] ?? date('Y-m-d');
            $storeId = $_GET['storeId'] ?? null;

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
            $salesStmt = $pdo->prepare($salesQuery);
            $salesStmt->execute($params);
            $sales = $salesStmt->fetchAll();

            error_log('[PDF Report] Date: ' . $date . ', StoreId: ' . ($storeId ?? 'ALL') . ', Sales found: ' . count($sales));

            // Get products with inventory
            $productsStmt = $pdo->query('SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id ORDER BY p.name');
            $products = $productsStmt->fetchAll();

            // Group sales by product
            $salesByProduct = [];
            $totalSales = 0;
            $totalDiscount = 0;
            $paymentBreakdown = [];

            foreach ($sales as $sale) {
                $totalSales += (float)$sale['total'];
                $totalDiscount += (float)($sale['global_discount'] ?? 0);

                $method = $sale['payment_method'] ?? 'Cash';
                if (!isset($paymentBreakdown[$method])) {
                    $paymentBreakdown[$method] = ['method' => $method, 'count' => 0, 'amount' => 0];
                }
                $paymentBreakdown[$method]['count']++;
                $paymentBreakdown[$method]['amount'] += (float)$sale['total'];

                $items = json_decode($sale['items'], true);
                if (is_array($items)) {
                    foreach ($items as $item) {
                        $name = $item['name'] ?? 'Unknown';
                        $qty = $item['quantity'] ?? 0;
                        $price = $item['price'] ?? 0;
                        if (!isset($salesByProduct[$name])) {
                            $salesByProduct[$name] = ['quantity' => 0, 'total_sales' => 0];
                        }
                        $salesByProduct[$name]['quantity'] += $qty;
                        $salesByProduct[$name]['total_sales'] += ($qty * $price);
                    }
                }
            }

            // Build product rows
            $productTableRows = '';
            $totalAmount = 0;
            $totalKgSales = 0;
            $totalUnitPrice = 0;
            $totalWGs = 0;
            $totalStocks = 0;
            $totalAdd = 0;
            $totalPickUp = 0;
            $totalReturn = 0;
            $totalScrapBO = 0;
            $totalTurnOver = 0;
            $totalTotalSales = 0;
            $totalWholesaleKg = 0;
            $totalWholesaleDisc = 0;

            foreach ($products as $product) {
                $productName = $product['name'];
                $unitPrice = (float)$product['price'];

                // Get inventory
                $invStmt = $pdo->prepare('SELECT quantity FROM inventory WHERE product_id = ?' . ($storeId ? ' AND location = ?' : '') . ' LIMIT 1');
                $invParams = [$product['id']];
                if ($storeId) $invParams[] = $storeLocation;
                $invStmt->execute($invParams);
                $inv = $invStmt->fetch();
                $stock = $inv ? (float)$inv['quantity'] : 0;

                $quantity = isset($salesByProduct[$productName]) ? $salesByProduct[$productName]['quantity'] : 0;
                $productTotalSales = isset($salesByProduct[$productName]) ? $salesByProduct[$productName]['total_sales'] : 0;
                $totalAmount += $productTotalSales;
                $totalKgSales += $quantity;
                $totalUnitPrice += $unitPrice;
                $totalStocks += $stock;
                $totalPickUp += $quantity;
                $totalTotalSales += $productTotalSales;

                $productTableRows .= '<tr>';
                $productTableRows .= '<td>' . htmlspecialchars($productName) . '</td>';
                $productTableRows .= '<td class="number">' . number_format($unitPrice, 2) . '</td>';
                $productTableRows .= '<td class="number">0</td>';
                $productTableRows .= '<td class="number">' . $stock . '</td>';
                $productTableRows .= '<td class="number">0</td>';
                $productTableRows .= '<td class="number">' . $quantity . '</td>';
                $productTableRows .= '<td class="number">0</td>';
                $productTableRows .= '<td class="number">0</td>';
                $productTableRows .= '<td class="number">0</td>';
                $productTableRows .= '<td class="number">' . number_format($quantity, 2) . '</td>';
                $productTableRows .= '<td class="number">P ' . number_format($productTotalSales, 2) . '</td>';
                $productTableRows .= '<td class="number">0</td>';
                $productTableRows .= '<td class="number">0</td>';
                $productTableRows .= '<td class="number">P ' . number_format($productTotalSales, 2) . '</td>';
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
            $html .= '.document-container { border: 3px solid #000; margin: 72px; padding: 20px; }';
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
            $html .= '<span class="info-item"><strong>NAME:</strong> ' . htmlspecialchars($storeName) . '</span>';
            $html .= '<span class="info-item"><strong>LOC:</strong> ' . htmlspecialchars($storeLocation) . '</span>';
            $html .= '<span class="info-item"><strong>DATE:</strong> ' . $dateFormatted . '</span>';
            $html .= '</div></div>';
            $html .= '<div class="section-title">PRODUCTS</div>';
            $html .= '<table class="products-table"><thead>';
            $html .= '<tr><th colspan="11"></th><th colspan="2" style="background-color:#ffcc00;text-align:center;font-weight:bold;font-size:7px;border:1px solid #000;">WHOLESALE</th><th></th></tr>';
            $html .= '<tr><th>PRODUCTS</th><th>UNIT PRICE</th><th>WGs</th><th>STOCKS</th><th>ADD</th><th>PICK UP</th><th>RETURN</th><th>SCRAP/B.O.</th><th>TURN OVER</th><th>KG SALES</th><th>TOTAL SALES</th><th>KG</th><th>DISC.</th><th>AMOUNT</th></tr>';
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
            $html .= '<td class="number"><strong>P ' . number_format($totalTotalSales, 2) . '</strong></td>';
            $html .= '<td class="number"><strong>' . number_format($totalWholesaleKg, 2) . '</strong></td>';
            $html .= '<td class="number"><strong>' . number_format($totalWholesaleDisc, 2) . '</strong></td>';
            $html .= '<td class="number"><strong>P ' . number_format($totalAmount, 2) . '</strong></td>';
            $html .= '</tr></tbody></table>';

            // Query cash out transactions for this date if the table exists
            $cashOutRows = '';
            $cashOutTotal = 0;
            try {
                $txCheck = $pdo->query("SHOW TABLES LIKE 'transactions'");
                if ($txCheck->rowCount() > 0) {
                    $txQuery = 'SELECT * FROM transactions WHERE type = ? AND DATE(created_at) = ? ORDER BY created_at ASC';
                    $txParams = ['Cash Out', $date];
                    $txStmt = $pdo->prepare($txQuery);
                    $txStmt->execute($txParams);
                    $cashOutTxns = $txStmt->fetchAll();
                    foreach ($cashOutTxns as $tx) {
                        $txDesc = htmlspecialchars($tx['description'] ?? $tx['category'] ?? 'Cash Out');
                        $txAmount = (float)($tx['amount'] ?? 0);
                        $cashOutTotal += $txAmount;
                        $cashOutRows .= '<tr><td>' . $txDesc . '</td><td class="number">P ' . number_format($txAmount, 2) . '</td></tr>';
                    }
                }
            } catch (Exception $txErr) {
                error_log('Cash out query error: ' . $txErr->getMessage());
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
            foreach ($denominations as $den) {
                $html .= '<tr><td>' . $den . '</td><td></td><td></td></tr>';
            }
            $html .= '<tr class="total-row"><td><strong>TOTAL</strong></td><td></td><td></td></tr>';
            $html .= '</table></td></tr></table>';

            // Computation
            $html .= '<div class="section-title">COMPUTATION</div>';
            $html .= '<table class="cash-out-table">';
            $html .= '<tr><td>TOTAL SALES</td><td class="number">P ' . number_format($totalSales, 2) . '</td></tr>';
            $html .= '<tr><td>CASH OUT</td><td class="number">P ' . number_format($cashOutTotal, 2) . '</td></tr>';
            $netSales = $totalSales - $cashOutTotal;
            $html .= '<tr><td style="border-top:2px solid #000;border-bottom:2px solid #000;"><strong>GROSS SALES</strong></td><td class="number" style="border-top:2px solid #000;border-bottom:2px solid #000;"><strong>P ' . number_format($grossSales, 2) . '</strong></td></tr>';
            $over = $grossSales - $cashOutTotal;
            $html .= '<tr style="background-color:#ffcc00;"><td><strong>OVER</strong></td><td class="number"><strong>P ' . number_format($over, 2) . '</strong></td></tr>';
            $html .= '</table>';

            // Remarks + Signatures
            $html .= '<div class="section-title">REMARKS</div>';
            $html .= '<div style="border:1px solid #000;padding:5px;min-height:20px;"></div>';
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
            $dompdf->setPaper('A4', 'portrait');
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
