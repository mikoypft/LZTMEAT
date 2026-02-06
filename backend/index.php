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

// Load environment variables (check .env first, then .env.production as fallback)
$envFile = __DIR__ . '/.env';
if (!file_exists($envFile)) {
    $envFile = __DIR__ . '/.env.production';
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
        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        $sales = $stmt->fetchAll();
        
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
                
                return [
                    'id' => (string)$s['id'],
                    'transactionId' => $s['transaction_id'],
                    'date' => $s['created_at'],
                    'timestamp' => $s['created_at'],
                    'location' => $s['location'],
                    'customerName' => $s['customer_name'],
                    'customerPhone' => $s['customer_phone'],
                    'customerEmail' => $s['customer_email'],
                    'subtotal' => (float)$s['subtotal'],
                    'globalDiscount' => (float)$s['global_discount'],
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
            
            if (empty($body['storeId']) || empty($body['location'])) {
                http_response_code(400);
                return ['error' => 'Store ID and location are required'];
            }
            
            // Create sales record
            $stmt = $pdo->prepare('
                INSERT INTO sales (
                    transaction_id, 
                    user_id, 
                    store_id, 
                    location,
                    customer,
                    customer_name,
                    customer_phone,
                    customer_email,
                    items,
                    subtotal,
                    global_discount,
                    tax,
                    total, 
                    payment_method
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ');
            
            // Build customer object for JSON
            $customerData = null;
            if (!empty($body['customer'])) {
                $customerData = json_encode($body['customer']);
            }
            
            // Build items array for JSON
            $itemsData = json_encode($body['items']);
            
            $stmt->execute([
                $body['transactionId'] ?? '',
                $body['userId'] ?? null,
                $body['storeId'] ?? null,
                $body['location'] ?? '',
                $customerData,
                $body['customer']['name'] ?? null,
                $body['customer']['phone'] ?? null,
                $body['customer']['email'] ?? null,
                $itemsData,
                $body['subtotal'] ?? 0,
                $body['globalDiscount'] ?? 0,
                $body['tax'] ?? 0,
                $body['total'] ?? 0,
                $body['paymentMethod'] ?? 'Cash',
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
                
                // Deduct from inventory
                $invStmt = $pdo->prepare('
                    UPDATE inventory 
                    SET quantity = quantity - ? 
                    WHERE product_id = ? AND location = ?
                ');
                
                $invStmt->execute([
                    $item['quantity'],
                    $item['productId'],
                    $body['location']
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
                            $body['location'],
                            -$item['quantity']
                        ]);
                    } catch (Exception $e) {
                        // Inventory record might already exist, just log
                        error_log("Could not create inventory record: " . $e->getMessage());
                    }
                }
            }
            
            $pdo->commit();
            
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
        $stmt = $pdo->query('SELECT pr.*, p.name as product_name FROM production_records pr LEFT JOIN products p ON pr.product_id = p.id ORDER BY pr.created_at DESC LIMIT 100');
        $records = $stmt->fetchAll();
        
        return [
            'records' => array_map(function($r) {
                $ingredientsUsed = null;
                if (!empty($r['ingredients_used'])) {
                    $ingredientsUsed = json_decode($r['ingredients_used'], true);
                }
                return [
                    'id' => (string)$r['id'],
                    'productId' => (string)$r['product_id'],
                    'productName' => $r['product_name'] ?? 'Unknown Product',
                    'quantity' => (float)$r['quantity'],
                    'batchNumber' => $r['batch_number'],
                    'operator' => $r['operator'],
                    'status' => $r['status'] ?? 'in-progress',
                    'ingredientsUsed' => $ingredientsUsed,
                    'notes' => $r['notes'],
                    'timestamp' => $r['created_at'],
                ];
            }, $records),
        ];
    },
    
    'POST /api/production' => function() use ($pdo, $body) {
        $ingredientsJson = null;
        if (!empty($body['ingredientsUsed'])) {
            $ingredientsJson = json_encode($body['ingredientsUsed']);
        }
        
        $stmt = $pdo->prepare('INSERT INTO production_records (product_id, quantity, batch_number, operator, status, ingredients_used, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())');
        $stmt->execute([
            $body['productId'] ?? null,
            $body['quantity'] ?? 0,
            $body['batchNumber'] ?? '',
            $body['operator'] ?? '',
            $body['status'] ?? 'in-progress',
            $ingredientsJson,
            $body['notes'] ?? null,
        ]);
        
        $id = $pdo->lastInsertId();
        
        // Fetch the created record
        $stmt = $pdo->prepare('SELECT pr.*, p.name as product_name FROM production_records pr LEFT JOIN products p ON pr.product_id = p.id WHERE pr.id = ?');
        $stmt->execute([$id]);
        $r = $stmt->fetch();
        
        $ingredientsUsed = null;
        if (!empty($r['ingredients_used'])) {
            $ingredientsUsed = json_decode($r['ingredients_used'], true);
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
                'ingredientsUsed' => $ingredientsUsed,
                'notes' => $r['notes'],
                'timestamp' => $r['created_at'],
            ]
        ];
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
        
        $ingredientsUsed = null;
        if (!empty($r['ingredients_used'])) {
            $ingredientsUsed = json_decode($r['ingredients_used'], true);
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
                'ingredientsUsed' => $ingredientsUsed,
                'notes' => $r['notes'],
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
                return [
                    'id' => (string)$t['id'],
                    'productId' => (string)$t['product_id'],
                    'productName' => $t['product_name'] ?? 'Unknown Product',
                    'from' => $t['from'],
                    'to' => $t['to'],
                    'quantity' => (float)$t['quantity'],
                    'status' => $t['status'],
                    'requestedBy' => $t['requested_by'],
                    'createdAt' => $t['created_at'],
                ];
            }, $transfers),
        ];
    },
    
    'POST /api/transfers' => function() use ($pdo, $body) {
        $stmt = $pdo->prepare('INSERT INTO transfers (product_id, `from`, `to`, quantity, status, requested_by, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())');
        $stmt->execute([
            $body['productId'] ?? null,
            $body['from'] ?? '',
            $body['to'] ?? '',
            $body['quantity'] ?? 0,
            $body['status'] ?? 'Pending',
            $body['requestedBy'] ?? '',
        ]);
        
        return ['transfer' => ['id' => (string)$pdo->lastInsertId()]];
    },
    
    'GET /api/suppliers' => function() use ($pdo) {
        $stmt = $pdo->query('SELECT * FROM suppliers ORDER BY name');
        $suppliers = $stmt->fetchAll();
        
        return [
            'suppliers' => array_map(function($s) {
                return [
                    'id' => (string)$s['id'],
                    'name' => $s['name'],
                    'email' => $s['email'],
                    'phone' => $s['phone'],
                    'address' => $s['address'],
                ];
            }, $suppliers),
        ];
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
                    'mobile' => $u['phone'] ?? '',
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
            
            $stmt = $pdo->prepare('INSERT INTO users (username, password, full_name, phone, address, role, store_id, can_login, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())');
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
                    'mobile' => $user['phone'] ?? '',
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
                $updates[] = 'phone = ?';
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
            
            return [
                'employee' => [
                    'id' => (string)$user['id'],
                    'username' => $user['username'],
                    'name' => $user['full_name'],
                    'mobile' => $user['phone'] ?? '',
                    'address' => $user['address'] ?? '',
                    'role' => $user['role'],
                    'storeId' => $user['store_id'] ? (string)$user['store_id'] : null,
                    'storeName' => $user['store_name'],
                    'canLogin' => (bool)$user['can_login'],
                    'createdAt' => $user['created_at']
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
                        'entity' => $record['entity'],
                        'entityId' => $record['entity_id'],
                        'details' => $record['details'] ? json_decode($record['details'], true) : null,
                        'userId' => $record['user_id'] ? (int)$record['user_id'] : null,
                        'userName' => $record['user_name'],
                        'createdAt' => $record['created_at'],
                        'updatedAt' => $record['updated_at'],
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
