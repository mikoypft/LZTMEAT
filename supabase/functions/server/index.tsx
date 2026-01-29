import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Create Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// ==================== RETRY LOGIC FOR DATABASE OPERATIONS ====================

interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
}

/**
 * Retry wrapper for database operations with exponential backoff
 * Handles transient network errors like connection resets
 */
async function withRetry<T>(
  operation: () => Promise<T>,
  operationName: string,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 100,
    maxDelay = 2000,
    backoffMultiplier = 2
  } = options;

  let lastError: Error | null = null;
  let delay = initialDelay;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      // Check if error is retryable (connection errors, timeouts, etc.)
      const errorMessage = error?.message || String(error);
      const isRetryable = 
        errorMessage.includes('connection reset') ||
        errorMessage.includes('connection error') ||
        errorMessage.includes('ECONNRESET') ||
        errorMessage.includes('timeout') ||
        errorMessage.includes('ETIMEDOUT') ||
        errorMessage.includes('network') ||
        errorMessage.includes('fetch failed');

      if (!isRetryable || attempt === maxRetries) {
        console.error(`❌ ${operationName} failed after ${attempt} attempt(s):`, error);
        throw error;
      }

      console.warn(`⚠️ ${operationName} failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`);
      console.warn(`   Error: ${errorMessage.substring(0, 150)}`);
      
      // Wait before retrying with exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay));
      delay = Math.min(delay * backoffMultiplier, maxDelay);
    }
  }

  throw lastError || new Error(`${operationName} failed after ${maxRetries} retries`);
}

// Wrapped KV operations with retry logic
const kvWithRetry = {
  async get(key: string): Promise<any> {
    return withRetry(() => kv.get(key), `kv.get('${key}')`);
  },
  
  async set(key: string, value: any): Promise<void> {
    return withRetry(() => kv.set(key, value), `kv.set('${key}')`);
  },
  
  async del(key: string): Promise<void> {
    return withRetry(() => kv.del(key), `kv.del('${key}')`);
  },
  
  async mget(keys: string[]): Promise<any[]> {
    return withRetry(() => kv.mget(keys), `kv.mget([${keys.join(', ')}])`);
  },
  
  async mset(entries: Array<[string, any]>): Promise<void> {
    return withRetry(() => kv.mset(entries), `kv.mset(${entries.length} entries)`);
  },
  
  async getByPrefix(prefix: string): Promise<any[]> {
    return withRetry(() => kv.getByPrefix(prefix), `kv.getByPrefix('${prefix}')`);
  }
};

// ==================== END RETRY LOGIC ====================

// Initialize database schema on startup
async function initializeDatabase() {
  console.log('Initializing database schema...');
  
  try {
    // Check if tables exist by querying kv_store
    const schemaInitialized = await kv.get('schema_initialized');
    
    if (!schemaInitialized) {
      console.log('First-time setup: Creating database schema...');
      
      // Initialize default data using KV store
      // Users - Only admin user (store as JSONB object, not stringified)
      await kv.set('users', [
        { id: '1', username: 'admin', password: 'admin123', fullName: 'Admin User', role: 'ADMIN', canLogin: true },
        { id: '2', username: 'mark_sioson', password: '123456', fullName: 'Mark Sioson', role: 'POS', canLogin: true }
      ]);
      
      // Products
      await kv.set('products', JSON.stringify([
        { id: '1', name: 'Longanisa - Sweet', category: 'Fresh Sausages', price: 280, unit: 'kg', image: null },
        { id: '2', name: 'Longanisa - Spicy', category: 'Fresh Sausages', price: 280, unit: 'kg', image: null },
        { id: '3', name: 'Tocino - Classic', category: 'Cured Meats', price: 320, unit: 'kg', image: null },
        { id: '4', name: 'Tocino - Spicy', category: 'Cured Meats', price: 320, unit: 'kg', image: null },
        { id: '5', name: 'Tapa - Beef', category: 'Cured Meats', price: 450, unit: 'kg', image: null },
        { id: '6', name: 'Chorizo - Filipino', category: 'Fresh Sausages', price: 300, unit: 'kg', image: null },
        { id: '7', name: 'Shanghai - Pork', category: 'Spring Rolls', price: 350, unit: 'kg', image: null },
        { id: '8', name: 'Embutido - Classic', category: 'Processed Meats', price: 380, unit: 'kg', image: null }
      ]));
      
      // Ingredients (raw materials for production)
      await kv.set('ingredients', JSON.stringify([
        { id: '1', name: 'Ground Pork', code: 'ING-001', category: 'Raw Meat', unit: 'kg', stock: 750, minStockLevel: 100, reorderPoint: 200, costPerUnit: 220, supplier: 'Metro Meat Supply', lastUpdated: new Date().toISOString(), expiryDate: null },
        { id: '2', name: 'Ground Beef', code: 'ING-002', category: 'Raw Meat', unit: 'kg', stock: 325, minStockLevel: 50, reorderPoint: 100, costPerUnit: 380, supplier: 'Metro Meat Supply', lastUpdated: new Date().toISOString(), expiryDate: null },
        { id: '3', name: 'Brown Sugar', code: 'ING-003', category: 'Seasonings', unit: 'kg', stock: 225, minStockLevel: 30, reorderPoint: 60, costPerUnit: 60, supplier: 'Sweet Supplies Co.', lastUpdated: new Date().toISOString(), expiryDate: null },
        { id: '4', name: 'White Sugar', code: 'ING-004', category: 'Seasonings', unit: 'kg', stock: 183, minStockLevel: 25, reorderPoint: 50, costPerUnit: 55, supplier: 'Sweet Supplies Co.', lastUpdated: new Date().toISOString(), expiryDate: null },
        { id: '5', name: 'Soy Sauce', code: 'ING-005', category: 'Seasonings', unit: 'L', stock: 117, minStockLevel: 15, reorderPoint: 30, costPerUnit: 85, supplier: 'Asian Ingredients Inc.', lastUpdated: new Date().toISOString(), expiryDate: null },
        { id: '6', name: 'Vinegar', code: 'ING-006', category: 'Seasonings', unit: 'L', stock: 153, minStockLevel: 20, reorderPoint: 40, costPerUnit: 45, supplier: 'Asian Ingredients Inc.', lastUpdated: new Date().toISOString(), expiryDate: null },
        { id: '7', name: 'Garlic', code: 'ING-007', category: 'Vegetables', unit: 'kg', stock: 75, minStockLevel: 10, reorderPoint: 20, costPerUnit: 180, supplier: 'Fresh Veggies Ltd.', lastUpdated: new Date().toISOString(), expiryDate: null },
        { id: '8', name: 'Salt', code: 'ING-008', category: 'Seasonings', unit: 'kg', stock: 305, minStockLevel: 40, reorderPoint: 80, costPerUnit: 25, supplier: 'Sea Salt Co.', lastUpdated: new Date().toISOString(), expiryDate: null },
        { id: '9', name: 'Black Pepper', code: 'ING-009', category: 'Seasonings', unit: 'kg', stock: 45, minStockLevel: 8, reorderPoint: 15, costPerUnit: 450, supplier: 'Spice World', lastUpdated: new Date().toISOString(), expiryDate: null },
        { id: '10', name: 'Food Coloring', code: 'ING-010', category: 'Additives', unit: 'L', stock: 37, minStockLevel: 6, reorderPoint: 12, costPerUnit: 120, supplier: 'Food Additives Co.', lastUpdated: new Date().toISOString(), expiryDate: null },
        { id: '11', name: 'Hog Casing', code: 'ING-011', category: 'Packaging', unit: 'meter', stock: 500, minStockLevel: 50, reorderPoint: 100, costPerUnit: 15, supplier: 'Packaging Supplies Inc.', lastUpdated: new Date().toISOString(), expiryDate: null }
      ]));
      
      // Inventory (stock levels per location)
      await kv.set('inventory', JSON.stringify([
        // Production Facility
        { id: '1', productId: '1', location: 'Production Facility', quantity: 150, lastUpdated: new Date().toISOString() },
        { id: '2', productId: '2', location: 'Production Facility', quantity: 120, lastUpdated: new Date().toISOString() },
        { id: '3', productId: '3', location: 'Production Facility', quantity: 180, lastUpdated: new Date().toISOString() },
        { id: '4', productId: '4', location: 'Production Facility', quantity: 140, lastUpdated: new Date().toISOString() },
        { id: '5', productId: '5', location: 'Production Facility', quantity: 100, lastUpdated: new Date().toISOString() },
        { id: '6', productId: '6', location: 'Production Facility', quantity: 130, lastUpdated: new Date().toISOString() },
        { id: '7', productId: '7', location: 'Production Facility', quantity: 110, lastUpdated: new Date().toISOString() },
        { id: '8', productId: '8', location: 'Production Facility', quantity: 90, lastUpdated: new Date().toISOString() },
        // Store 1
        { id: '9', productId: '1', location: 'Store 1', quantity: 50, lastUpdated: new Date().toISOString() },
        { id: '10', productId: '2', location: 'Store 1', quantity: 40, lastUpdated: new Date().toISOString() },
        { id: '11', productId: '3', location: 'Store 1', quantity: 60, lastUpdated: new Date().toISOString() },
        { id: '12', productId: '4', location: 'Store 1', quantity: 45, lastUpdated: new Date().toISOString() },
        { id: '13', productId: '5', location: 'Store 1', quantity: 30, lastUpdated: new Date().toISOString() },
        { id: '14', productId: '6', location: 'Store 1', quantity: 35, lastUpdated: new Date().toISOString() },
        { id: '15', productId: '7', location: 'Store 1', quantity: 40, lastUpdated: new Date().toISOString() },
        { id: '16', productId: '8', location: 'Store 1', quantity: 25, lastUpdated: new Date().toISOString() },
        // Store 2
        { id: '17', productId: '1', location: 'Store 2', quantity: 45, lastUpdated: new Date().toISOString() },
        { id: '18', productId: '2', location: 'Store 2', quantity: 38, lastUpdated: new Date().toISOString() },
        { id: '19', productId: '3', location: 'Store 2', quantity: 55, lastUpdated: new Date().toISOString() },
        { id: '20', productId: '4', location: 'Store 2', quantity: 42, lastUpdated: new Date().toISOString() },
        { id: '21', productId: '5', location: 'Store 2', quantity: 28, lastUpdated: new Date().toISOString() },
        { id: '22', productId: '6', location: 'Store 2', quantity: 32, lastUpdated: new Date().toISOString() },
        { id: '23', productId: '7', location: 'Store 2', quantity: 38, lastUpdated: new Date().toISOString() },
        { id: '24', productId: '8', location: 'Store 2', quantity: 22, lastUpdated: new Date().toISOString() }
      ]));
      
      // Sales (empty initially)
      await kv.set('sales', JSON.stringify([]));
      
      // Production Records (empty initially)
      await kv.set('production_records', JSON.stringify([]));
      
      // Transfer Requests (empty initially)
      await kv.set('transfer_requests', JSON.stringify([]));
      
      // Suppliers (initialize with default suppliers)
      await kv.set('suppliers', JSON.stringify([
        { id: 'sup-1', name: 'Metro Meat Supply', contactPerson: 'Juan Dela Cruz', phone: '+63 917 123 4567', email: 'info@metromeat.ph', address: 'Quezon City, Metro Manila', createdAt: new Date().toISOString() },
        { id: 'sup-2', name: 'Sweet Supplies Co.', contactPerson: 'Maria Santos', phone: '+63 918 234 5678', email: 'sales@sweetsupplies.ph', address: 'Makati City, Metro Manila', createdAt: new Date().toISOString() },
        { id: 'sup-3', name: 'Asian Ingredients Inc.', contactPerson: 'Pedro Reyes', phone: '+63 919 345 6789', email: 'orders@asianingredients.ph', address: 'Mandaluyong City, Metro Manila', createdAt: new Date().toISOString() },
        { id: 'sup-4', name: 'Fresh Veggies Ltd.', contactPerson: 'Ana Garcia', phone: '+63 920 456 7890', email: 'contact@freshveggies.ph', address: 'Pasig City, Metro Manila', createdAt: new Date().toISOString() },
        { id: 'sup-5', name: 'Sea Salt Co.', contactPerson: 'Carlos Mendoza', phone: '+63 921 567 8901', email: 'info@seasalt.ph', address: 'Taguig City, Metro Manila', createdAt: new Date().toISOString() },
        { id: 'sup-6', name: 'Spice World', contactPerson: 'Rosa Fernandez', phone: '+63 922 678 9012', email: 'sales@spiceworld.ph', address: 'Parañaque City, Metro Manila', createdAt: new Date().toISOString() },
        { id: 'sup-7', name: 'Food Additives Co.', contactPerson: 'Roberto Cruz', phone: '+63 923 789 0123', email: 'orders@foodadditives.ph', address: 'Las Piñas City, Metro Manila', createdAt: new Date().toISOString() },
        { id: 'sup-8', name: 'Packaging Supplies Inc.', contactPerson: 'Linda Torres', phone: '+63 924 890 1234', email: 'info@packagingsupplies.ph', address: 'Muntinlupa City, Metro Manila', createdAt: new Date().toISOString() }
      ]));
      
      // Stores (initialize with default stores)
      await kv.set('stores', JSON.stringify([
        { id: 'store-1', name: 'Store 1', address: 'Quezon City, Metro Manila', contactPerson: 'Store Manager', phone: '+63 917 111 2222', email: 'store1@lztmeat.ph', status: 'active', createdAt: new Date().toISOString() },
        { id: 'store-2', name: 'Store 2', address: 'Makati City, Metro Manila', contactPerson: 'Store Manager', phone: '+63 917 222 3333', email: 'store2@lztmeat.ph', status: 'active', createdAt: new Date().toISOString() }
      ]));
      
      // Employees (initialize empty)
      await kv.set('employees', JSON.stringify([]));
      
      // Categories (initialize with default categories)
      await kv.set('categories', JSON.stringify([
        { id: 'cat-1', name: 'Fresh Sausages', description: 'Fresh sausage products', createdAt: new Date().toISOString() },
        { id: 'cat-2', name: 'Cured Meats', description: 'Cured and marinated meat products', createdAt: new Date().toISOString() },
        { id: 'cat-3', name: 'Spring Rolls', description: 'Shanghai and spring roll products', createdAt: new Date().toISOString() },
        { id: 'cat-4', name: 'Processed Meats', description: 'Processed meat products', createdAt: new Date().toISOString() }
      ]));
      
      // History logs (initialize empty arrays for each module)
      await kv.set('history_pos', JSON.stringify([]));
      await kv.set('history_inventory', JSON.stringify([]));
      await kv.set('history_production', JSON.stringify([]));
      await kv.set('history_ingredients', JSON.stringify([]));
      
      // Mark schema as initialized
      await kv.set('schema_initialized', 'true');
      
      console.log('Database schema initialized successfully');
    } else {
      console.log('Database schema already initialized');
    }
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

// Initialize database on startup
await initializeDatabase();

// Migration: Add mark_sioson user if it doesn't exist
async function migrateUsers() {
  try {
    let usersData = await kv.get('users');
    let users = [];
    if (usersData) {
      if (typeof usersData === 'string') {
        users = JSON.parse(usersData);
      } else if (Array.isArray(usersData)) {
        users = usersData;
      }
    }
    
    // Check if mark_sioson exists
    const markExists = users.find((u: any) => u.username === 'mark_sioson');
    if (!markExists) {
      console.log('Migration: Adding mark_sioson user...');
      
      // Create user without auto-assigning store - admin will assign manually
      users.push({
        id: '2',
        username: 'mark_sioson',
        password: '123456',
        fullName: 'Mark Sioson',
        role: 'POS',
        canLogin: true,
        storeId: null,  // No default store - admin assigns via UI
        storeName: null
      });
      await kv.set('users', users);
      console.log('Migration: mark_sioson user added successfully (no store assigned - admin will assign)');
    } else {
      console.log('Migration: mark_sioson user already exists');
      
      // REMOVED: Auto-assignment of store to mark_sioson
      // The admin should manually assign stores via the Admin Users page
      // Do not auto-update store assignments - respect what the admin has set
    }
  } catch (error) {
    console.error('Migration error:', error);
  }
}

// Run migration
await migrateUsers();

// Helper function to log history
async function logHistory(
  module: 'pos' | 'inventory' | 'production' | 'ingredients',
  action: string,
  entity: string,
  entityId: string,
  details: any,
  user?: string
) {
  try {
    const historyKey = `history_${module}`;
    const historyData = await kv.get(historyKey);
    const history = historyData ? JSON.parse(historyData) : [];
    
    const record = {
      id: Date.now().toString(),
      action,
      entity,
      entityId,
      details,
      user: user || 'System',
      timestamp: new Date().toISOString()
    };
    
    history.unshift(record); // Add to beginning for newest first
    
    // Keep only last 1000 records per module
    if (history.length > 1000) {
      history.splice(1000);
    }
    
    await kv.set(historyKey, JSON.stringify(history));
    console.log(`History logged: ${module} - ${action} - ${entity}`);
  } catch (error) {
    console.error(`Error logging history for ${module}:`, error);
  }
}

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// ==================== AUTH ROUTES ====================

// Reset database (for debugging - reinitialize all data)
app.post("/make-server-26f4e13f/auth/reset", async (c) => {
  try {
    console.log('Resetting database and reinitializing...');
    
    // Clear the schema_initialized flag to force re-initialization
    await kv.del('schema_initialized');
    
    // Re-run initialization
    await initializeDatabase();
    
    console.log('Database reset and reinitialized successfully');
    return c.json({ message: 'Database reset successfully', success: true });
  } catch (error) {
    console.error('Error resetting database:', error);
    return c.json({ error: 'Failed to reset database' }, 500);
  }
});

// Initialize default users (one-time setup)
app.post("/make-server-26f4e13f/auth/init", async (c) => {
  try {
    const usersData = await kv.get('users');
    let users = (typeof usersData === 'string') ? JSON.parse(usersData) : (usersData || []);
    
    // Initialize default system users if they don't exist
    if (users.length === 0) {
      console.log('Initializing default users...');
      users = [
        { id: '1', username: 'admin', password: 'admin123', fullName: 'Admin User', role: 'ADMIN', canLogin: true },
        { id: '2', username: 'mark_sioson', password: '123456', fullName: 'Mark Sioson', role: 'POS', canLogin: true }
      ];
      await kv.set('users', users);
      console.log('Default users initialized successfully');
      return c.json({ message: 'Default users initialized', users: users.length });
    }
    
    return c.json({ message: 'Users already initialized', users: users.length });
  } catch (error) {
    console.error('Error initializing users:', error);
    return c.json({ error: 'Failed to initialize users' }, 500);
  }
});

// Login endpoint
app.post("/make-server-26f4e13f/auth/login", async (c) => {
  try {
    const body = await c.req.json();
    const { username, password } = body;
    
    console.log(`\n=== LOGIN ATTEMPT START ===`);
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log(`Username: "${username}"`);
    console.log(`Password length: ${password ? password.length : 0}`);
    console.log(`Request body:`, JSON.stringify(body));
    
    // Check system users first (only admin by default)
    let usersData = await kv.get('users');
    console.log(`\n--- KV Store Check ---`);
    console.log(`Raw users data type: ${typeof usersData}`);
    console.log(`Raw users data value: ${usersData}`);
    console.log(`Users data is null: ${usersData === null}`);
    console.log(`Users data is undefined: ${usersData === undefined}`);
    
    let users = [];
    if (usersData) {
      // Check if it's a string (old format) or already an object (new format)
      if (typeof usersData === 'string') {
        try {
          users = JSON.parse(usersData);
          console.log(`Parsed ${users.length} users from stringified data (old format)`);
        } catch (parseError) {
          console.error('Error parsing users data:', parseError);
          users = [];
        }
      } else if (Array.isArray(usersData)) {
        // Already an array (new format from JSONB)
        users = usersData;
        console.log(`Got ${users.length} users directly from JSONB (new format)`);
      } else {
        console.error('Unexpected users data format:', typeof usersData);
        users = [];
      }
    } else {
      console.log('No users data in KV store');
    }
    
    // If no users exist, initialize default admin user
    if (users.length === 0) {
      console.log('\n--- Initializing Default Admin User ---');
      users = [
        { id: '1', username: 'admin', password: 'admin123', fullName: 'Admin User', role: 'ADMIN', canLogin: true },
        { id: '2', username: 'mark_sioson', password: '123456', fullName: 'Mark Sioson', role: 'POS', canLogin: true }
      ];
      // Store as object, not stringified
      await kv.set('users', users);
      console.log('Default users initialized and stored');
      
      // Verify it was stored
      const verifyData = await kv.get('users');
      console.log('Verification read:', verifyData);
      console.log('Verification read type:', typeof verifyData);
    }
    
    console.log(`\n--- User Lookup ---`);
    console.log(`Total users available: ${users.length}`);
    if (users.length > 0) {
      console.log('Available users:');
      users.forEach((u: any, index: number) => {
        console.log(`  [${index}] username="${u.username}" password="${u.password}" role=${u.role}`);
      });
    }
    
    let user = null;
    for (const u of users) {
      const usernameMatch = u.username === username;
      const passwordMatch = u.password === password;
      console.log(`\nComparing with user: "${u.username}"`);
      console.log(`  Username match ("${u.username}" === "${username}"): ${usernameMatch}`);
      console.log(`  Password match ("${u.password}" === "${password}"): ${passwordMatch}`);
      
      if (usernameMatch && passwordMatch) {
        user = u;
        console.log(`  ✓ MATCH FOUND!`);
        break;
      }
    }
    
    
    // If not found in system users, check employees
    if (!user) {
      console.log('\n--- Checking Employees Table ---');
      const employeesData = await kv.get('employees');
      const employees = (typeof employeesData === 'string') ? JSON.parse(employeesData) : (employeesData || []);
      console.log(`Total employees: ${employees.length}`);
      
      const employee = employees.find(
        (e: any) => e.username === username && e.password === password
      );
      
      if (employee) {
        console.log(`Employee found: ${employee.name} with role: ${employee.role}`);
        
        // Check if employee can login
        if (employee.canLogin === false) {
          console.log('❌ Login denied: Employee does not have login permission');
          console.log('===================\n');
          return c.json({ error: 'Login access disabled for this account' }, 403);
        }
        
        // Get store information if employee has a storeId
        let storeName = 'Unassigned Store';
        if (employee.storeId) {
          const storesData = await kv.get('stores');
          const stores = (typeof storesData === 'string') ? JSON.parse(storesData) : (storesData || []);
          const store = stores.find((s: any) => s.id === employee.storeId);
          if (store) {
            storeName = store.name;
          }
        }
        
        // Map employee role to system role
        let systemRole = 'ADMIN'; // Default for Employee role
        if (employee.role === 'Store') {
          systemRole = 'STORE';
        } else if (employee.role === 'Production') {
          systemRole = 'PRODUCTION';
        } else if (employee.role === 'POS') {
          systemRole = 'POS';
        } else if (employee.role === 'Employee') {
          systemRole = 'ADMIN'; // Employee role has admin access but with limited permissions
        }
        
        // Create user object from employee
        user = {
          id: employee.id,
          username: employee.username,
          fullName: employee.name,
          role: systemRole,
          employeeRole: employee.role, // Keep track of employee role
          permissions: employee.permissions || [], // Include permissions
          storeId: employee.storeId,
          storeName: storeName,
          canLogin: employee.canLogin !== false // Include canLogin flag
        };
      } else {
        console.log('No matching employee found');
      }
    } else {
      console.log(`\n✓ System user found: ${user.fullName} (${user.role})`);
      
      // Check if system user can login
      if (user.canLogin === false) {
        console.log('❌ Login denied: User does not have login permission');
        console.log('===================\n');
        return c.json({ error: 'Login access disabled for this account' }, 403);
      }
    }
    
    if (!user) {
      console.log('\n=== LOGIN FAILED ===');
      console.log('Reason: Invalid credentials - no matching user found');
      console.log('===================\n');
      return c.json({ error: 'Invalid credentials' }, 401);
    }
    
    console.log('\n=== LOGIN SUCCESSFUL ===');
    console.log(`User: ${user.fullName}`);
    console.log(`Role: ${user.role}`);
    console.log('========================\n');
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return c.json({ user: userWithoutPassword });
  } catch (error) {
    console.error('\n=== LOGIN ERROR ===');
    console.error('Error details:', error);
    console.error('Error stack:', error.stack);
    console.error('===================\n');
    return c.json({ error: 'Login failed', details: error.message }, 500);
  }
});

// Session refresh endpoint - validates and refreshes user data from database
app.post("/make-server-26f4e13f/auth/refresh", async (c) => {
  try {
    const body = await c.req.json();
    const { userId, username } = body;
    
    console.log(`\n=== SESSION REFRESH ===`);
    console.log(`User ID: ${userId}`);
    console.log(`Username: ${username}`);
    
    // Check system users first
    const usersData = await kv.get('users');
    const users = (typeof usersData === 'string') ? JSON.parse(usersData) : (usersData || []);
    
    // Find user by ID or username
    let user = users.find((u: any) => u.id === userId || u.username === username);
    
    // If not found in system users, check employees
    if (!user) {
      const employeesData = await kv.get('employees');
      const employees = (typeof employeesData === 'string') ? JSON.parse(employeesData) : (employeesData || []);
      
      const employee = employees.find((e: any) => e.id === userId || e.username === username);
      
      if (employee) {
        // Check if employee can login
        if (employee.canLogin === false) {
          console.log('❌ Session refresh denied: Employee login disabled');
          return c.json({ error: 'Login access disabled for this account' }, 403);
        }
        
        // Get store information
        let storeName = employee.storeName || 'Unassigned Store';
        if (employee.storeId && !employee.storeName) {
          const storesData = await kv.get('stores');
          const stores = (typeof storesData === 'string') ? JSON.parse(storesData) : (storesData || []);
          const store = stores.find((s: any) => s.id === employee.storeId);
          if (store) {
            storeName = store.name;
          }
        }
        
        // Map employee role to system role
        let systemRole = 'ADMIN';
        if (employee.role === 'Store') {
          systemRole = 'STORE';
        } else if (employee.role === 'Production') {
          systemRole = 'PRODUCTION';
        } else if (employee.role === 'POS') {
          systemRole = 'POS';
        } else if (employee.role === 'Employee') {
          systemRole = 'ADMIN';
        }
        
        user = {
          id: employee.id,
          username: employee.username,
          fullName: employee.name,
          role: systemRole,
          employeeRole: employee.role,
          permissions: employee.permissions || [],
          storeId: employee.storeId,
          storeName: storeName,
          canLogin: employee.canLogin !== false
        };
      }
    } else {
      // System user found - check if can login
      if (user.canLogin === false) {
        console.log('❌ Session refresh denied: User login disabled');
        return c.json({ error: 'Login access disabled for this account' }, 403);
      }
      
      // Ensure we have the latest store information for system users
      if (user.storeId) {
        const storesData = await kv.get('stores');
        const stores = (typeof storesData === 'string') ? JSON.parse(storesData) : (storesData || []);
        const store = stores.find((s: any) => s.id === user.storeId);
        if (store) {
          user.storeName = store.name;
        }
      }
    }
    
    if (!user) {
      console.log('❌ Session refresh failed: User not found');
      return c.json({ error: 'User not found' }, 404);
    }
    
    console.log(`✓ Session refreshed for: ${user.fullName}`);
    console.log(`  Role: ${user.role}`);
    console.log(`  Store: ${user.storeName || 'None'}`);
    console.log(`  StoreId: ${user.storeId || 'None'}`);
    console.log('======================\n');
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return c.json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Session refresh error:', error);
    return c.json({ error: 'Failed to refresh session' }, 500);
  }
});

// Debug endpoint to check users in KV store
app.get("/make-server-26f4e13f/auth/debug", async (c) => {
  try {
    const usersData = await kv.get('users');
    const users = (typeof usersData === 'string') ? JSON.parse(usersData) : (usersData || []);
    const employeesData = await kv.get('employees');
    const employees = (typeof employeesData === 'string') ? JSON.parse(employeesData) : (employeesData || []);
    
    return c.json({
      usersDataType: typeof usersData,
      usersDataIsNull: usersData === null,
      usersDataIsUndefined: usersData === undefined,
      usersDataRaw: usersData,
      usersCount: users.length,
      users: users.map((u: any) => ({ 
        id: u.id,
        username: u.username, 
        role: u.role, 
        fullName: u.fullName,
        hasPassword: !!u.password
      })),
      employeesCount: employees.length,
      employees: employees.map((e: any) => ({ 
        id: e.id,
        username: e.username, 
        name: e.name, 
        role: e.role,
        hasPassword: !!e.password
      }))
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return c.json({ error: 'Debug failed', details: error.message, stack: error.stack }, 500);
  }
});

// Test login endpoint - creates admin and tests login in one call
app.post("/make-server-26f4e13f/auth/test-login", async (c) => {
  try {
    console.log('\n=== TEST LOGIN ENDPOINT ===');
    
    // Step 1: Force create admin user
    const adminUser = {
      id: '1',
      username: 'admin',
      password: 'admin123',
      fullName: 'Admin User',
      role: 'ADMIN',
      canLogin: true
    };
    
    await kv.set('users', [adminUser]);
    console.log('✓ Admin user created');
    
    // Step 2: Verify it was saved
    const savedData = await kv.get('users');
    console.log('✓ Retrieved users from KV:', savedData);
    console.log('  Type:', typeof savedData);
    console.log('  Is Array:', Array.isArray(savedData));
    console.log('  Length:', Array.isArray(savedData) ? savedData.length : 'N/A');
    
    // Step 3: Try to login with the saved data
    const users = Array.isArray(savedData) ? savedData : [];
    const found = users.find((u: any) => u.username === 'admin' && u.password === 'admin123');
    
    console.log('✓ Login test result:', found ? 'SUCCESS' : 'FAILED');
    
    if (found) {
      const { password: _, ...userWithoutPassword } = found;
      return c.json({ 
        success: true,
        message: 'Test login successful',
        user: userWithoutPassword,
        debug: {
          savedDataType: typeof savedData,
          isArray: Array.isArray(savedData),
          usersCount: users.length
        }
      });
    } else {
      return c.json({ 
        success: false,
        message: 'Login test failed - user not found after saving',
        debug: {
          savedDataType: typeof savedData,
          isArray: Array.isArray(savedData),
          savedData: savedData,
          usersCount: users.length
        }
      }, 400);
    }
  } catch (error) {
    console.error('Test login error:', error);
    return c.json({ error: 'Test login failed', details: error.message, stack: error.stack }, 500);
  }
});

// Add a new system user
app.post("/make-server-26f4e13f/auth/add-user", async (c) => {
  try {
    const body = await c.req.json();
    const { username, password, fullName, role } = body;
    
    console.log('\\n=== ADD USER REQUEST ===');
    console.log(`Username: ${username}`);
    console.log(`Full Name: ${fullName}`);
    console.log(`Role: ${role}`);
    
    // Get current users
    let usersData = await kv.get('users');
    let users = [];
    if (usersData) {
      if (typeof usersData === 'string') {
        users = JSON.parse(usersData);
      } else if (Array.isArray(usersData)) {
        users = usersData;
      }
    }
    
    // Check if user already exists
    const existingUser = users.find((u: any) => u.username === username);
    if (existingUser) {
      console.log('User already exists');
      return c.json({ error: 'User already exists', user: existingUser }, 400);
    }
    
    // Create new user
    const newUser = {
      id: Date.now().toString(),
      username,
      password,
      fullName,
      role,
      canLogin: true
    };
    
    users.push(newUser);
    await kv.set('users', users);
    
    console.log('User added successfully');
    console.log('========================\\n');
    
    const { password: _, ...userWithoutPassword } = newUser;
    return c.json({ message: 'User added successfully', user: userWithoutPassword });
  } catch (error) {
    console.error('Error adding user:', error);
    return c.json({ error: 'Failed to add user', details: error.message }, 500);
  }
});

// ==================== PRODUCTS ROUTES ====================

// Get all products
app.get("/make-server-26f4e13f/products", async (c) => {
  try {
    const productsData = await kv.get('products');
    const products = productsData ? JSON.parse(productsData) : [];
    return c.json({ products });
  } catch (error) {
    console.error('Error fetching products:', error);
    return c.json({ error: 'Failed to fetch products' }, 500);
  }
});

// Add new product
app.post("/make-server-26f4e13f/products", async (c) => {
  try {
    const newProduct = await c.req.json();
    
    const productsData = await kv.get('products');
    const products = productsData ? JSON.parse(productsData) : [];
    
    // Auto-generate SKU based on category
    const categoryPrefix = newProduct.category
      .toUpperCase()
      .replace(/[^A-Z]/g, '')
      .substring(0, 3);
    
    // Find existing products with the same prefix
    const existingWithPrefix = products.filter((p: any) => 
      p.sku && p.sku.startsWith(categoryPrefix + '-')
    );
    
    // Get the highest number for this prefix
    let maxNumber = 0;
    existingWithPrefix.forEach((p: any) => {
      const match = p.sku.match(/-(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNumber) maxNumber = num;
      }
    });
    
    // Generate new SKU
    const newNumber = maxNumber + 1;
    const sku = `${categoryPrefix}-${String(newNumber).padStart(3, '0')}`;
    
    const product = {
      id: Date.now().toString(),
      ...newProduct,
      sku: sku,
      image: newProduct.image || null
    };
    
    products.push(product);
    await kv.set('products', JSON.stringify(products));
    
    // Log history for inventory module
    await logHistory(
      'inventory',
      'Encoded Product',
      'Product',
      product.id,
      {
        productName: product.name,
        sku: product.sku,
        category: product.category,
        unit: product.unit,
        price: product.price
      }
    );
    
    return c.json({ product });
  } catch (error) {
    console.error('Error adding product:', error);
    return c.json({ error: 'Failed to add product' }, 500);
  }
});

// Update product
app.put("/make-server-26f4e13f/products/:id", async (c) => {
  try {
    const id = c.req.param('id');
    const updates = await c.req.json();
    
    const productsData = await kv.get('products');
    const products = productsData ? JSON.parse(productsData) : [];
    
    const index = products.findIndex((p: any) => p.id === id);
    if (index === -1) {
      return c.json({ error: 'Product not found' }, 404);
    }
    
    products[index] = { ...products[index], ...updates };
    await kv.set('products', JSON.stringify(products));
    
    return c.json({ product: products[index] });
  } catch (error) {
    console.error('Error updating product:', error);
    return c.json({ error: 'Failed to update product' }, 500);
  }
});

// Delete all products (must come before /:id route)
app.delete("/make-server-26f4e13f/products/delete-all", async (c) => {
  try {
    // Clear all products
    await kv.set('products', JSON.stringify([]));
    
    // Clear all inventory records
    await kv.set('inventory', JSON.stringify([]));
    
    console.log('All products and inventory cleared from database');
    
    return c.json({ success: true, message: 'All products deleted successfully' });
  } catch (error) {
    console.error('Error deleting all products:', error);
    return c.json({ error: 'Failed to delete all products' }, 500);
  }
});

// Delete product
app.delete("/make-server-26f4e13f/products/:id", async (c) => {
  try {
    const id = c.req.param('id');
    
    const productsData = await kv.get('products');
    const products = productsData ? JSON.parse(productsData) : [];
    
    const filtered = products.filter((p: any) => p.id !== id);
    await kv.set('products', JSON.stringify(filtered));
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    return c.json({ error: 'Failed to delete product' }, 500);
  }
});

// ==================== CATEGORIES ROUTES ====================

// Get all categories
app.get("/make-server-26f4e13f/categories", async (c) => {
  try {
    const categoriesData = await kv.get('categories');
    const categories = categoriesData ? JSON.parse(categoriesData) : [];
    return c.json({ categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return c.json({ error: 'Failed to fetch categories' }, 500);
  }
});

// Add new category
app.post("/make-server-26f4e13f/categories", async (c) => {
  try {
    const newCategory = await c.req.json();
    
    const categoriesData = await kv.get('categories');
    const categories = categoriesData ? JSON.parse(categoriesData) : [];
    
    // Check for duplicate category name
    const existingCategory = categories.find(
      (cat: any) => cat.name.toLowerCase() === newCategory.name.toLowerCase()
    );
    
    if (existingCategory) {
      return c.json({ error: 'Category already exists' }, 400);
    }
    
    const category = {
      id: Date.now().toString(),
      name: newCategory.name,
      description: newCategory.description || '',
      createdAt: new Date().toISOString()
    };
    
    categories.push(category);
    await kv.set('categories', JSON.stringify(categories));
    
    console.log('Category added:', category.name);
    
    return c.json({ category });
  } catch (error) {
    console.error('Error adding category:', error);
    return c.json({ error: 'Failed to add category' }, 500);
  }
});

// Delete category
app.delete("/make-server-26f4e13f/categories/:id", async (c) => {
  try {
    const id = c.req.param('id');
    
    const categoriesData = await kv.get('categories');
    const categories = categoriesData ? JSON.parse(categoriesData) : [];
    
    // Check if any products use this category
    const productsData = await kv.get('products');
    const products = productsData ? JSON.parse(productsData) : [];
    
    const category = categories.find((cat: any) => cat.id === id);
    if (category) {
      const productsUsingCategory = products.filter((p: any) => p.category === category.name);
      
      if (productsUsingCategory.length > 0) {
        return c.json({ 
          error: `Cannot delete category. ${productsUsingCategory.length} product(s) are using this category.` 
        }, 400);
      }
    }
    
    const filtered = categories.filter((cat: any) => cat.id !== id);
    await kv.set('categories', JSON.stringify(filtered));
    
    console.log('Category deleted:', id);
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting category:', error);
    return c.json({ error: 'Failed to delete category' }, 500);
  }
});

// ==================== INVENTORY ROUTES ====================

// Get inventory for all locations or specific location
app.get("/make-server-26f4e13f/inventory", async (c) => {
  try {
    const location = c.req.query('location');
    
    const inventoryData = await kv.get('inventory');
    let inventory = inventoryData ? JSON.parse(inventoryData) : [];
    
    if (location) {
      inventory = inventory.filter((i: any) => i.location === location);
    }
    
    return c.json({ inventory });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return c.json({ error: 'Failed to fetch inventory' }, 500);
  }
});

// Update inventory by productId and location (MUST come before /:id route)
app.put("/make-server-26f4e13f/inventory/update", async (c) => {
  try {
    const { productId, location, quantity } = await c.req.json();
    
    console.log(`Updating inventory: productId=${productId}, location=${location}, quantity=${quantity}`);
    
    const inventoryData = await kv.get('inventory');
    const inventory = inventoryData ? JSON.parse(inventoryData) : [];
    
    const index = inventory.findIndex(
      (i: any) => i.productId === productId && i.location === location
    );
    
    if (index === -1) {
      // Create new inventory record if it doesn't exist
      const newInventory = {
        id: Date.now().toString(),
        productId,
        location,
        quantity,
        lastUpdated: new Date().toISOString()
      };
      inventory.push(newInventory);
      await kv.set('inventory', JSON.stringify(inventory));
      
      console.log(`Created new inventory record for product ${productId} at ${location}`);
      return c.json({ inventory: newInventory });
    }
    
    inventory[index].quantity = quantity;
    inventory[index].lastUpdated = new Date().toISOString();
    
    await kv.set('inventory', JSON.stringify(inventory));
    
    console.log(`Updated inventory: ${inventory[index].quantity} units at ${location}`);
    return c.json({ inventory: inventory[index] });
  } catch (error) {
    console.error('Error updating inventory by productId and location:', error);
    return c.json({ error: 'Failed to update inventory' }, 500);
  }
});

// Update inventory quantity by inventory record ID
app.put("/make-server-26f4e13f/inventory/:id", async (c) => {
  try {
    const id = c.req.param('id');
    const { quantity } = await c.req.json();
    
    const inventoryData = await kv.get('inventory');
    const inventory = inventoryData ? JSON.parse(inventoryData) : [];
    
    const index = inventory.findIndex((i: any) => i.id === id);
    if (index === -1) {
      return c.json({ error: 'Inventory record not found' }, 404);
    }
    
    inventory[index].quantity = quantity;
    inventory[index].lastUpdated = new Date().toISOString();
    
    await kv.set('inventory', JSON.stringify(inventory));
    
    return c.json({ inventory: inventory[index] });
  } catch (error) {
    console.error('Error updating inventory:', error);
    return c.json({ error: 'Failed to update inventory' }, 500);
  }
});

// Add inventory for new product at location
app.post("/make-server-26f4e13f/inventory", async (c) => {
  try {
    const { productId, location, quantity } = await c.req.json();
    
    const inventoryData = await kv.get('inventory');
    const inventory = inventoryData ? JSON.parse(inventoryData) : [];
    
    const newInventory = {
      id: Date.now().toString(),
      productId,
      location,
      quantity,
      lastUpdated: new Date().toISOString()
    };
    
    inventory.push(newInventory);
    await kv.set('inventory', JSON.stringify(inventory));
    
    return c.json({ inventory: newInventory });
  } catch (error) {
    console.error('Error adding inventory:', error);
    return c.json({ error: 'Failed to add inventory' }, 500);
  }
});

// ==================== INGREDIENTS ROUTES ====================

// Get all ingredients
app.get("/make-server-26f4e13f/ingredients", async (c) => {
  try {
    const ingredientsData = await kv.get('ingredients');
    const ingredients = ingredientsData ? JSON.parse(ingredientsData) : [];
    console.log(`=== GET INGREDIENTS ===`);
    console.log(`Total ingredients: ${ingredients.length}`);
    console.log(`All IDs:`, ingredients.map((i: any) => ({ id: i.id, type: typeof i.id, name: i.name })));
    return c.json({ ingredients });
  } catch (error) {
    console.error('Error fetching ingredients:', error);
    return c.json({ error: 'Failed to fetch ingredients' }, 500);
  }
});

// Update ingredient stock
app.put("/make-server-26f4e13f/ingredients/:id", async (c) => {
  try {
    const id = c.req.param('id');
    const updates = await c.req.json();
    
    const ingredientsData = await kv.get('ingredients');
    const ingredients = ingredientsData ? JSON.parse(ingredientsData) : [];
    
    const index = ingredients.findIndex((i: any) => i.id === id);
    if (index === -1) {
      return c.json({ error: 'Ingredient not found' }, 404);
    }
    
    ingredients[index] = { ...ingredients[index], ...updates };
    await kv.set('ingredients', JSON.stringify(ingredients));
    
    return c.json({ ingredient: ingredients[index] });
  } catch (error) {
    console.error('Error updating ingredient:', error);
    return c.json({ error: 'Failed to update ingredient' }, 500);
  }
});

// Add new ingredient
app.post("/make-server-26f4e13f/ingredients", async (c) => {
  try {
    const newIngredient = await c.req.json();
    
    const ingredientsData = await kv.get('ingredients');
    const ingredients = ingredientsData ? JSON.parse(ingredientsData) : [];
    
    const ingredient = {
      id: Date.now().toString(),
      ...newIngredient
    };
    
    ingredients.push(ingredient);
    await kv.set('ingredients', JSON.stringify(ingredients));
    
    // Log history for ingredients module
    await logHistory(
      'ingredients',
      'Encoded Ingredient',
      'Ingredient',
      ingredient.id,
      {
        ingredientName: ingredient.name,
        code: ingredient.code,
        category: ingredient.category,
        unit: ingredient.unit,
        initialStock: ingredient.stock || ingredient.currentStock,
        costPerUnit: ingredient.costPerUnit,
        supplier: ingredient.supplier
      }
    );
    
    return c.json({ ingredient });
  } catch (error) {
    console.error('Error adding ingredient:', error);
    return c.json({ error: 'Failed to add ingredient' }, 500);
  }
});

// Delete ingredient
app.delete("/make-server-26f4e13f/ingredients/:id", async (c) => {
  try {
    const id = c.req.param('id');
    
    const ingredientsData = await kv.get('ingredients');
    const ingredients = ingredientsData ? JSON.parse(ingredientsData) : [];
    
    console.log(`=== DELETE INGREDIENT DEBUG ===`);
    console.log(`Received ID: "${id}" (type: ${typeof id})`);
    console.log(`Total ingredients in DB: ${ingredients.length}`);
    console.log(`All ingredient IDs:`, ingredients.map((i: any) => `"${i.id}" (${typeof i.id})`));
    
    // Convert both IDs to strings for comparison
    const index = ingredients.findIndex((i: any) => String(i.id) === String(id));
    
    console.log(`Found at index: ${index}`);
    
    if (index === -1) {
      console.error(`Ingredient with id ${id} not found in database`);
      console.log(`Available ingredients:`, ingredients.map((i: any) => ({ id: i.id, name: i.name })));
      return c.json({ error: 'Ingredient not found' }, 404);
    }
    
    const deletedIngredient = ingredients[index];
    ingredients.splice(index, 1);
    await kv.set('ingredients', JSON.stringify(ingredients));
    
    console.log(`Successfully deleted ingredient: ${deletedIngredient.name}`);
    return c.json({ ingredient: deletedIngredient });
  } catch (error) {
    console.error('Error deleting ingredient:', error);
    return c.json({ error: 'Failed to delete ingredient' }, 500);
  }
});

// Reset ingredients to default (for debugging/maintenance)
app.post("/make-server-26f4e13f/ingredients/reset", async (c) => {
  try {
    const defaultIngredients = [
      { id: '1', name: 'Ground Pork', code: 'ING-001', category: 'Raw Meat', unit: 'kg', stock: 750, minStockLevel: 100, reorderPoint: 200, costPerUnit: 220, supplier: 'Metro Meat Supply', lastUpdated: new Date().toISOString(), expiryDate: null },
      { id: '2', name: 'Ground Beef', code: 'ING-002', category: 'Raw Meat', unit: 'kg', stock: 325, minStockLevel: 50, reorderPoint: 100, costPerUnit: 380, supplier: 'Metro Meat Supply', lastUpdated: new Date().toISOString(), expiryDate: null },
      { id: '3', name: 'Brown Sugar', code: 'ING-003', category: 'Seasonings', unit: 'kg', stock: 225, minStockLevel: 30, reorderPoint: 60, costPerUnit: 60, supplier: 'Sweet Supplies Co.', lastUpdated: new Date().toISOString(), expiryDate: null },
      { id: '4', name: 'White Sugar', code: 'ING-004', category: 'Seasonings', unit: 'kg', stock: 183, minStockLevel: 25, reorderPoint: 50, costPerUnit: 55, supplier: 'Sweet Supplies Co.', lastUpdated: new Date().toISOString(), expiryDate: null },
      { id: '5', name: 'Soy Sauce', code: 'ING-005', category: 'Seasonings', unit: 'L', stock: 117, minStockLevel: 15, reorderPoint: 30, costPerUnit: 85, supplier: 'Asian Ingredients Inc.', lastUpdated: new Date().toISOString(), expiryDate: null },
      { id: '6', name: 'Vinegar', code: 'ING-006', category: 'Seasonings', unit: 'L', stock: 153, minStockLevel: 20, reorderPoint: 40, costPerUnit: 45, supplier: 'Asian Ingredients Inc.', lastUpdated: new Date().toISOString(), expiryDate: null },
      { id: '7', name: 'Garlic', code: 'ING-007', category: 'Vegetables', unit: 'kg', stock: 75, minStockLevel: 10, reorderPoint: 20, costPerUnit: 180, supplier: 'Fresh Veggies Ltd.', lastUpdated: new Date().toISOString(), expiryDate: null },
      { id: '8', name: 'Salt', code: 'ING-008', category: 'Seasonings', unit: 'kg', stock: 305, minStockLevel: 40, reorderPoint: 80, costPerUnit: 25, supplier: 'Sea Salt Co.', lastUpdated: new Date().toISOString(), expiryDate: null },
      { id: '9', name: 'Black Pepper', code: 'ING-009', category: 'Seasonings', unit: 'kg', stock: 45, minStockLevel: 8, reorderPoint: 15, costPerUnit: 450, supplier: 'Spice World', lastUpdated: new Date().toISOString(), expiryDate: null },
      { id: '10', name: 'Food Coloring', code: 'ING-010', category: 'Additives', unit: 'L', stock: 37, minStockLevel: 6, reorderPoint: 12, costPerUnit: 120, supplier: 'Food Additives Co.', lastUpdated: new Date().toISOString(), expiryDate: null },
      { id: '11', name: 'Hog Casing', code: 'ING-011', category: 'Packaging', unit: 'meter', stock: 500, minStockLevel: 50, reorderPoint: 100, costPerUnit: 15, supplier: 'Packaging Supplies Inc.', lastUpdated: new Date().toISOString(), expiryDate: null }
    ];
    
    await kv.set('ingredients', JSON.stringify(defaultIngredients));
    console.log('Ingredients reset to default values');
    
    return c.json({ message: 'Ingredients reset successfully', ingredients: defaultIngredients });
  } catch (error) {
    console.error('Error resetting ingredients:', error);
    return c.json({ error: 'Failed to reset ingredients' }, 500);
  }
});

// ==================== SALES ROUTES ====================

// Get all sales
app.get("/make-server-26f4e13f/sales", async (c) => {
  try {
    const startDate = c.req.query('startDate');
    const endDate = c.req.query('endDate');
    
    const salesData = await kvWithRetry.get('sales');
    let sales = salesData ? JSON.parse(salesData) : [];
    
    // Filter by date range if provided
    if (startDate && endDate) {
      sales = sales.filter((s: any) => {
        const saleDate = new Date(s.timestamp);
        return saleDate >= new Date(startDate) && saleDate <= new Date(endDate);
      });
    }
    
    return c.json({ sales });
  } catch (error) {
    console.error('Error fetching sales:', error);
    return c.json({ error: 'Failed to fetch sales' }, 500);
  }
});

// Create new sale
app.post("/make-server-26f4e13f/sales", async (c) => {
  try {
    const saleData = await c.req.json();
    
    // Log sale creation for debugging
    console.log('=== CREATING NEW SALE ===');
    console.log('Transaction ID:', saleData.transactionId);
    console.log('Cashier:', saleData.cashier);
    console.log('Username:', saleData.username);
    console.log('User ID:', saleData.userId);
    console.log('Store:', saleData.location);
    console.log('Store ID:', saleData.storeId);
    console.log('Total Amount:', saleData.total);
    console.log('Payment Method:', saleData.paymentMethod);
    console.log('========================');
    
    const salesList = await kv.get('sales');
    const sales = salesList ? JSON.parse(salesList) : [];
    
    const sale = {
      id: Date.now().toString(),
      ...saleData,
      timestamp: new Date().toISOString()
    };
    
    sales.push(sale);
    await kv.set('sales', JSON.stringify(sales));
    
    console.log(`✅ Sale recorded successfully by ${saleData.cashier || saleData.username || 'Unknown User'}`);
    
    // Update inventory quantities at the specified store location
    const saleLocation = saleData.location || 'Main Store'; // Use specified location or default to Main Store
    const inventoryData = await kv.get('inventory');
    const inventory = inventoryData ? JSON.parse(inventoryData) : [];
    
    console.log(`\n📦 UPDATING INVENTORY AT ${saleLocation}...`);
    console.log(`Items to deduct: ${saleData.items.length}`);
    
    let deductedCount = 0;
    let notFoundCount = 0;
    
    for (const item of saleData.items) {
      const invIndex = inventory.findIndex(
        (i: any) => i.productId === item.productId && i.location === saleLocation
      );
      
      if (invIndex !== -1) {
        const previousQty = inventory[invIndex].quantity;
        inventory[invIndex].quantity -= item.quantity;
        inventory[invIndex].lastUpdated = new Date().toISOString();
        
        console.log(`✅ ${item.name}: ${previousQty} → ${inventory[invIndex].quantity} (deducted ${item.quantity})`);
        deductedCount++;
      } else {
        console.warn(`⚠️  WARNING: Inventory record not found for product ${item.productId} (${item.name}) at ${saleLocation}`);
        notFoundCount++;
      }
    }
    
    await kv.set('inventory', JSON.stringify(inventory));
    
    console.log(`\n📊 INVENTORY UPDATE SUMMARY:`);
    console.log(`   ✅ Successfully deducted: ${deductedCount} items`);
    if (notFoundCount > 0) {
      console.log(`   ⚠️  Not found: ${notFoundCount} items`);
    }
    console.log(`   📍 Location: ${saleLocation}`);
    console.log(`========================\n`);
    
    return c.json({ sale });
  } catch (error) {
    console.error('Error creating sale:', error);
    return c.json({ error: 'Failed to create sale' }, 500);
  }
});

// Update sale (for reseco and other edits)
app.put("/make-server-26f4e13f/sales/:id", async (c) => {
  try {
    const id = c.req.param('id');
    const updates = await c.req.json();
    
    console.log('=== UPDATING SALE ===');
    console.log('Sale ID:', id);
    console.log('Updates:', JSON.stringify(updates, null, 2));
    
    const salesData = await kv.get('sales');
    const sales = salesData ? JSON.parse(salesData) : [];
    
    const saleIndex = sales.findIndex((s: any) => s.id === id);
    
    if (saleIndex === -1) {
      return c.json({ error: 'Sale not found' }, 404);
    }
    
    // Update the sale
    sales[saleIndex] = {
      ...sales[saleIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    await kv.set('sales', JSON.stringify(sales));
    
    console.log('✅ Sale updated successfully');
    console.log(`   - Transaction ID: ${sales[saleIndex].transactionId}`);
    if (updates.reseco !== undefined) {
      console.log(`   - Reseco applied: ₱${updates.reseco}`);
      console.log(`   - New total: ₱${sales[saleIndex].total}`);
    }
    console.log('========================\n');
    
    return c.json({ sale: sales[saleIndex] });
  } catch (error) {
    console.error('Error updating sale:', error);
    return c.json({ error: 'Failed to update sale' }, 500);
  }
});

// ==================== PRODUCTION ROUTES ====================

// Get all production records
app.get("/make-server-26f4e13f/production", async (c) => {
  try {
    const productionData = await kv.get('production_records');
    const records = productionData ? JSON.parse(productionData) : [];
    return c.json({ records });
  } catch (error) {
    console.error('Error fetching production records:', error);
    return c.json({ error: 'Failed to fetch production records' }, 500);
  }
});

// Create production record
app.post("/make-server-26f4e13f/production", async (c) => {
  try {
    const recordData = await c.req.json();
    
    const productionData = await kv.get('production_records');
    const records = productionData ? JSON.parse(productionData) : [];
    
    const record = {
      id: Date.now().toString(),
      ...recordData,
      timestamp: new Date().toISOString()
    };
    
    records.push(record);
    await kv.set('production_records', JSON.stringify(records));
    
    // Update inventory at Production Facility
    const inventoryData = await kv.get('inventory');
    const inventory = inventoryData ? JSON.parse(inventoryData) : [];
    
    const invIndex = inventory.findIndex(
      (i: any) => i.productId === recordData.productId && i.location === 'Production Facility'
    );
    
    if (invIndex !== -1) {
      inventory[invIndex].quantity += recordData.quantity;
      inventory[invIndex].lastUpdated = new Date().toISOString();
    } else {
      // Create new inventory record if doesn't exist
      inventory.push({
        id: Date.now().toString() + '_inv',
        productId: recordData.productId,
        location: 'Production Facility',
        quantity: recordData.quantity,
        lastUpdated: new Date().toISOString()
      });
    }
    
    await kv.set('inventory', JSON.stringify(inventory));
    
    // Update ingredient stocks if ingredients used
    if (recordData.ingredientsUsed && recordData.ingredientsUsed.length > 0) {
      const ingredientsData = await kv.get('ingredients');
      const ingredients = ingredientsData ? JSON.parse(ingredientsData) : [];
      
      for (const used of recordData.ingredientsUsed) {
        const ingIndex = ingredients.findIndex((i: any) => i.id === used.ingredientId);
        if (ingIndex !== -1) {
          ingredients[ingIndex].stock -= used.quantity;
          ingredients[ingIndex].lastUpdated = new Date().toISOString();
        }
      }
      
      await kv.set('ingredients', JSON.stringify(ingredients));
    }
    
    // Log history for production module
    const productsData = await kv.get('products');
    const products = productsData ? JSON.parse(productsData) : [];
    const product = products.find((p: any) => p.id === recordData.productId);
    
    await logHistory(
      'production',
      'Encoded Production',
      'Production Record',
      record.id,
      {
        productName: product?.name || 'Unknown Product',
        productId: recordData.productId,
        quantity: recordData.quantity,
        unit: recordData.unit || 'kg',
        batchNumber: recordData.batchNumber,
        ingredientsUsed: recordData.ingredientsUsed?.length || 0,
        notes: recordData.notes
      }
    );
    
    return c.json({ record });
  } catch (error) {
    console.error('Error creating production record:', error);
    return c.json({ error: 'Failed to create production record' }, 500);
  }
});

// Update production record status
app.patch("/make-server-26f4e13f/production/:id", async (c) => {
  try {
    const id = c.req.param('id');
    const { status } = await c.req.json();
    
    const productionData = await kv.get('production_records');
    const records = productionData ? JSON.parse(productionData) : [];
    
    const recordIndex = records.findIndex((r: any) => r.id === id);
    if (recordIndex === -1) {
      return c.json({ error: 'Production record not found' }, 404);
    }
    
    records[recordIndex].status = status;
    records[recordIndex].updatedAt = new Date().toISOString();
    
    await kv.set('production_records', JSON.stringify(records));
    
    return c.json({ record: records[recordIndex] });
  } catch (error) {
    console.error('Error updating production record:', error);
    return c.json({ error: 'Failed to update production record' }, 500);
  }
});

// Delete production record
app.delete("/make-server-26f4e13f/production/:id", async (c) => {
  try {
    const id = c.req.param('id');
    
    console.log('Attempting to delete production record with ID:', id);
    
    const productionData = await kv.get('production_records');
    const records = productionData ? JSON.parse(productionData) : [];
    
    console.log('Total production records:', records.length);
    console.log('Record IDs:', records.map((r: any) => r.id));
    
    const recordIndex = records.findIndex((r: any) => r.id === id);
    if (recordIndex === -1) {
      console.error('Production record not found. ID:', id, 'Available IDs:', records.map((r: any) => r.id));
      return c.json({ error: 'Production record not found' }, 404);
    }
    
    console.log('Found record at index:', recordIndex);
    
    // Remove the record
    records.splice(recordIndex, 1);
    await kv.set('production_records', JSON.stringify(records));
    
    console.log('Successfully deleted production record:', id);
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting production record:', error);
    return c.json({ error: 'Failed to delete production record' }, 500);
  }
});

// ==================== TRANSFER ROUTES ====================

// Get all transfer requests
app.get("/make-server-26f4e13f/transfers", async (c) => {
  try {
    const transfersData = await kv.get('transfer_requests');
    const transfers = transfersData ? JSON.parse(transfersData) : [];
    return c.json({ transfers });
  } catch (error) {
    console.error('Error fetching transfers:', error);
    return c.json({ error: 'Failed to fetch transfers' }, 500);
  }
});

// Create transfer request
app.post("/make-server-26f4e13f/transfers", async (c) => {
  try {
    const transferData = await c.req.json();
    
    const transfersData = await kv.get('transfer_requests');
    const transfers = transfersData ? JSON.parse(transfersData) : [];
    
    const transfer = {
      id: Date.now().toString(),
      ...transferData,
      status: 'Pending',
      createdAt: new Date().toISOString()
    };
    
    transfers.push(transfer);
    await kv.set('transfer_requests', JSON.stringify(transfers));
    
    return c.json({ transfer });
  } catch (error) {
    console.error('Error creating transfer:', error);
    return c.json({ error: 'Failed to create transfer' }, 500);
  }
});

// Update transfer status
app.put("/make-server-26f4e13f/transfers/:id", async (c) => {
  try {
    const id = c.req.param('id');
    const { status } = await c.req.json();
    
    const transfersData = await kv.get('transfer_requests');
    const transfers = transfersData ? JSON.parse(transfersData) : [];
    
    const index = transfers.findIndex((t: any) => t.id === id);
    if (index === -1) {
      return c.json({ error: 'Transfer not found' }, 404);
    }
    
    transfers[index].status = status;
    transfers[index].updatedAt = new Date().toISOString();
    
    // If completed, update inventory
    if (status === 'Completed') {
      const inventoryData = await kv.get('inventory');
      const inventory = inventoryData ? JSON.parse(inventoryData) : [];
      
      const transfer = transfers[index];
      
      // Decrease from source
      const sourceIndex = inventory.findIndex(
        (i: any) => i.productId === transfer.productId && i.location === transfer.from
      );
      if (sourceIndex !== -1) {
        inventory[sourceIndex].quantity -= transfer.quantity;
        inventory[sourceIndex].lastUpdated = new Date().toISOString();
      }
      
      // Increase at destination
      const destIndex = inventory.findIndex(
        (i: any) => i.productId === transfer.productId && i.location === transfer.to
      );
      if (destIndex !== -1) {
        inventory[destIndex].quantity += transfer.quantity;
        inventory[destIndex].lastUpdated = new Date().toISOString();
      } else {
        // Create new inventory record if doesn't exist
        inventory.push({
          id: Date.now().toString() + '_inv',
          productId: transfer.productId,
          location: transfer.to,
          quantity: transfer.quantity,
          lastUpdated: new Date().toISOString()
        });
      }
      
      await kv.set('inventory', JSON.stringify(inventory));
    }
    
    await kv.set('transfer_requests', JSON.stringify(transfers));
    
    return c.json({ transfer: transfers[index] });
  } catch (error) {
    console.error('Error updating transfer:', error);
    return c.json({ error: 'Failed to update transfer' }, 500);
  }
});

// ==================== STORES ROUTES ====================

// Get all stores
app.get("/make-server-26f4e13f/stores", async (c) => {
  try {
    const storesData = await kv.get('stores');
    let stores = storesData ? JSON.parse(storesData) : [];
    
    // Ensure Main Store exists
    const mainStore = stores.find((s: any) => s.name === 'Main Store');
    if (!mainStore) {
      const defaultMainStore = {
        id: 'main-store',
        name: 'Main Store',
        address: 'Main Production Facility',
        contactPerson: 'Admin',
        phone: '',
        email: '',
        status: 'active',
        createdAt: new Date().toISOString()
      };
      stores.unshift(defaultMainStore);
      await kv.set('stores', JSON.stringify(stores));
    }
    
    return c.json({ stores });
  } catch (error) {
    console.error('Error fetching stores:', error);
    return c.json({ error: 'Failed to fetch stores' }, 500);
  }
});

// Create new store
app.post("/make-server-26f4e13f/stores", async (c) => {
  try {
    const newStore = await c.req.json();
    
    const storesData = await kv.get('stores');
    const stores = storesData ? JSON.parse(storesData) : [];
    
    // Check for duplicate store name
    const existingStore = stores.find(
      (s: any) => s.name.toLowerCase() === newStore.name.toLowerCase()
    );
    
    if (existingStore) {
      return c.json({ error: 'Store with this name already exists' }, 400);
    }
    
    const store = {
      id: `store-${Date.now()}`,
      name: newStore.name,
      address: newStore.address,
      contactPerson: newStore.contactPerson || '',
      phone: newStore.phone || '',
      email: newStore.email || '',
      status: newStore.status || 'active',
      createdAt: new Date().toISOString()
    };
    
    stores.push(store);
    await kv.set('stores', JSON.stringify(stores));
    
    console.log('Store created:', store.name);
    
    return c.json({ store });
  } catch (error) {
    console.error('Error creating store:', error);
    return c.json({ error: 'Failed to create store' }, 500);
  }
});

// Update store
app.put("/make-server-26f4e13f/stores/:id", async (c) => {
  try {
    const id = c.req.param('id');
    const updates = await c.req.json();
    
    const storesData = await kv.get('stores');
    const stores = storesData ? JSON.parse(storesData) : [];
    
    const storeIndex = stores.findIndex((s: any) => s.id === id);
    
    if (storeIndex === -1) {
      return c.json({ error: 'Store not found' }, 404);
    }
    
    // Check for duplicate name (excluding current store)
    if (updates.name) {
      const duplicateStore = stores.find(
        (s: any) => s.name.toLowerCase() === updates.name.toLowerCase() && s.id !== id
      );
      
      if (duplicateStore) {
        return c.json({ error: 'Store with this name already exists' }, 400);
      }
    }
    
    // Update store
    stores[storeIndex] = {
      ...stores[storeIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    await kv.set('stores', JSON.stringify(stores));
    
    console.log('Store updated:', stores[storeIndex].name);
    
    return c.json({ store: stores[storeIndex] });
  } catch (error) {
    console.error('Error updating store:', error);
    return c.json({ error: 'Failed to update store' }, 500);
  }
});

// Delete store
app.delete("/make-server-26f4e13f/stores/:id", async (c) => {
  try {
    const id = c.req.param('id');
    
    const storesData = await kv.get('stores');
    const stores = storesData ? JSON.parse(storesData) : [];
    
    const store = stores.find((s: any) => s.id === id);
    
    // Prevent deleting Main Store
    if (store && store.name === 'Main Store') {
      return c.json({ error: 'Cannot delete Main Store' }, 400);
    }
    
    // Check if any transfers reference this store
    const transfersData = await kv.get('transfers');
    const transfers = transfersData ? JSON.parse(transfersData) : [];
    
    if (store) {
      const activeTransfers = transfers.filter(
        (t: any) => (t.from === store.name || t.to === store.name) && 
                    (t.status === 'Pending' || t.status === 'In Transit')
      );
      
      if (activeTransfers.length > 0) {
        return c.json({ 
          error: `Cannot delete store. ${activeTransfers.length} active transfer(s) are associated with this store.` 
        }, 400);
      }
    }
    
    const filtered = stores.filter((s: any) => s.id !== id);
    await kv.set('stores', JSON.stringify(filtered));
    
    console.log('Store deleted:', id);
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting store:', error);
    return c.json({ error: 'Failed to delete store' }, 500);
  }
});

// ==================== EMPLOYEES ROUTES ====================

// Get all employees
app.get("/make-server-26f4e13f/employees", async (c) => {
  try {
    const employeesData = await kv.get('employees');
    const employees = (typeof employeesData === 'string') ? JSON.parse(employeesData) : (employeesData || []);
    
    // Populate store names
    const storesData = await kv.get('stores');
    const stores = (typeof storesData === 'string') ? JSON.parse(storesData) : (storesData || []);
    
    const employeesWithStoreNames = employees.map((employee: any) => {
      if (employee.storeId) {
        const store = stores.find((s: any) => s.id === employee.storeId);
        return {
          ...employee,
          storeName: store ? store.name : null
        };
      }
      return employee;
    });
    
    return c.json({ employees: employeesWithStoreNames });
  } catch (error) {
    console.error('Error fetching employees:', error);
    return c.json({ error: 'Failed to fetch employees' }, 500);
  }
});

// Get all users (both system users and employees)
app.get("/make-server-26f4e13f/users/all", async (c) => {
  try {
    // Get system users
    const usersData = await kv.get('users');
    const systemUsers = (typeof usersData === 'string') ? JSON.parse(usersData) : (usersData || []);
    
    // Get employees
    const employeesData = await kv.get('employees');
    const employees = (typeof employeesData === 'string') ? JSON.parse(employeesData) : (employeesData || []);
    
    // Get stores for populating store names
    const storesData = await kv.get('stores');
    const stores = (typeof storesData === 'string') ? JSON.parse(storesData) : (storesData || []);
    
    // Transform system users to match employee structure
    const transformedSystemUsers = systemUsers.map((user: any) => ({
      id: user.id,
      name: user.fullName,
      username: user.username,
      role: user.role, // ADMIN, STORE, PRODUCTION, POS
      employeeRole: user.employeeRole,
      storeId: user.storeId,
      storeName: user.storeId ? stores.find((s: any) => s.id === user.storeId)?.name : null,
      permissions: user.permissions || [],
      canLogin: user.canLogin !== false,
      mobile: user.mobile || 'N/A',
      address: user.address || 'N/A',
      userType: 'system', // Mark as system user
      createdAt: user.createdAt || null
    }));
    
    // Transform employees to include userType
    const transformedEmployees = employees.map((employee: any) => ({
      ...employee,
      storeName: employee.storeId ? stores.find((s: any) => s.id === employee.storeId)?.name : null,
      userType: 'employee', // Mark as employee
      role: employee.role || 'N/A' // Store, Production, POS, or Employee
    }));
    
    // Combine both lists
    const allUsers = [...transformedSystemUsers, ...transformedEmployees];
    
    return c.json({ users: allUsers });
  } catch (error) {
    console.error('Error fetching all users:', error);
    return c.json({ error: 'Failed to fetch users' }, 500);
  }
});

// Update user (handles both system users and employees)
app.put("/make-server-26f4e13f/users/:id", async (c) => {
  try {
    const id = c.req.param('id');
    const updates = await c.req.json();
    
    console.log(`\n=== UPDATING USER ${id} ===`);
    console.log('Updates received:', JSON.stringify(updates, null, 2));
    console.log('StoreId from request:', updates.storeId);
    console.log('StoreId type:', typeof updates.storeId);
    console.log('StoreId is empty string:', updates.storeId === '');
    console.log('StoreId is null:', updates.storeId === null);
    console.log('StoreId is undefined:', updates.storeId === undefined);
    
    // Check if this is a system user
    const usersData = await kv.get('users');
    const systemUsers = (typeof usersData === 'string') ? JSON.parse(usersData) : (usersData || []);
    const systemUserIndex = systemUsers.findIndex((u: any) => u.id === id);
    
    if (systemUserIndex !== -1) {
      // This is a system user - update in users table only
      console.log('✓ Found system user at index:', systemUserIndex);
      console.log('Current storeId:', systemUsers[systemUserIndex].storeId);
      console.log('Current storeName:', systemUsers[systemUserIndex].storeName);
      
      // Get store name if storeId is being updated
      let storeName = systemUsers[systemUserIndex].storeName;
      let storeIdToSave = systemUsers[systemUserIndex].storeId;
      
      if (updates.storeId !== undefined) {
        // Convert empty string to null
        storeIdToSave = updates.storeId === '' ? null : updates.storeId;
        console.log('→ StoreId will be saved as:', storeIdToSave);
        
        if (storeIdToSave) {
          const storesData = await kv.get('stores');
          const stores = (typeof storesData === 'string') ? JSON.parse(storesData) : (storesData || []);
          const store = stores.find((s: any) => s.id === storeIdToSave);
          storeName = store ? store.name : null;
          console.log('→ StoreName will be saved as:', storeName);
        } else {
          // Clear store name if no store is assigned
          storeName = null;
          console.log('→ Store assignment cleared (no store)');
        }
      }
      
      // Update the system user
      systemUsers[systemUserIndex] = {
        ...systemUsers[systemUserIndex],
        fullName: updates.name || systemUsers[systemUserIndex].fullName,
        mobile: updates.mobile || systemUsers[systemUserIndex].mobile,
        address: updates.address || systemUsers[systemUserIndex].address,
        username: updates.username || systemUsers[systemUserIndex].username,
        password: updates.password || systemUsers[systemUserIndex].password,
        role: updates.role || systemUsers[systemUserIndex].role,
        permissions: updates.permissions !== undefined ? updates.permissions : systemUsers[systemUserIndex].permissions,
        storeId: storeIdToSave,
        storeName: storeName,
        canLogin: updates.hasOwnProperty('canLogin') ? updates.canLogin : systemUsers[systemUserIndex].canLogin
      };
      
      console.log('→ Saving to database...');
      await kv.set('users', systemUsers);
      console.log('✓ Database saved successfully');
      
      // Verify the save by reading back from database
      const verifyData = await kv.get('users');
      const verifyUsers = (typeof verifyData === 'string') ? JSON.parse(verifyData) : (verifyData || []);
      const verifyUser = verifyUsers.find((u: any) => u.id === id);
      
      console.log('→ Verification - Reading back from database:');
      console.log('  - StoreId in DB:', verifyUser?.storeId);
      console.log('  - StoreName in DB:', verifyUser?.storeName);
      console.log('  - Verification:', verifyUser?.storeId === storeIdToSave ? '✓ MATCH' : '❌ MISMATCH');
      console.log('=========================\n');
      
      const updatedUser = {
        id: systemUsers[systemUserIndex].id,
        name: systemUsers[systemUserIndex].fullName,
        username: systemUsers[systemUserIndex].username,
        role: systemUsers[systemUserIndex].role,
        employeeRole: systemUsers[systemUserIndex].employeeRole,
        storeId: systemUsers[systemUserIndex].storeId,
        storeName: systemUsers[systemUserIndex].storeName,
        permissions: systemUsers[systemUserIndex].permissions || [],
        canLogin: systemUsers[systemUserIndex].canLogin !== false,
        mobile: systemUsers[systemUserIndex].mobile || 'N/A',
        address: systemUsers[systemUserIndex].address || 'N/A',
        userType: 'system'
      };
      
      return c.json({ employee: updatedUser });
    }
    
    // Not a system user - check employees
    const employeesData = await kv.get('employees');
    const employees = (typeof employeesData === 'string') ? JSON.parse(employeesData) : (employeesData || []);
    const employeeIndex = employees.findIndex((e: any) => e.id === id);
    
    if (employeeIndex === -1) {
      console.log('❌ User not found in system users or employees');
      console.log('=========================\n');
      return c.json({ error: 'User not found' }, 404);
    }
    
    // This is an employee - update in both employees and users tables
    console.log('✓ Found employee at index:', employeeIndex);
    console.log('Current storeId:', employees[employeeIndex].storeId);
    
    // Convert empty string storeId to null
    if (updates.storeId === '') {
      updates.storeId = null;
      console.log('→ Empty string converted to null');
    }
    
    // Get store name if storeId is being updated
    let storeName = employees[employeeIndex].storeName;
    if (updates.storeId !== undefined) {
      if (updates.storeId) {
        const storesData = await kv.get('stores');
        const stores = (typeof storesData === 'string') ? JSON.parse(storesData) : (storesData || []);
        const store = stores.find((s: any) => s.id === updates.storeId);
        storeName = store ? store.name : null;
        console.log('→ StoreName resolved to:', storeName);
      } else {
        storeName = null;
        console.log('→ Store assignment cleared');
      }
    }
    
    // Update employee with storeName included
    employees[employeeIndex] = {
      ...employees[employeeIndex],
      ...updates,
      storeName: storeName
    };
    
    console.log('→ Saving to employees table...');
    await kv.set('employees', employees);
    console.log('✓ Employees table saved');
    console.log('  - StoreId in employees:', employees[employeeIndex].storeId);
    console.log('  - StoreName in employees:', employees[employeeIndex].storeName);
    
    // Verify the save
    const verifyEmpData = await kv.get('employees');
    const verifyEmps = (typeof verifyEmpData === 'string') ? JSON.parse(verifyEmpData) : (verifyEmpData || []);
    const verifyEmp = verifyEmps.find((e: any) => e.id === id);
    console.log('→ Verification - StoreId in employees DB:', verifyEmp?.storeId);
    
    // Also update the users table if username or password is updated
    if (updates.username || updates.password || updates.role || updates.permissions || updates.name || updates.hasOwnProperty('storeId') || updates.hasOwnProperty('canLogin')) {
      console.log('→ Syncing to users table...');
      const userIndex = systemUsers.findIndex((u: any) => u.id === id);
      
      // Map employee role to system role
      let systemRole = 'ADMIN';
      if (employees[employeeIndex].role === 'Store') {
        systemRole = 'STORE';
      } else if (employees[employeeIndex].role === 'Production') {
        systemRole = 'PRODUCTION';
      } else if (employees[employeeIndex].role === 'POS') {
        systemRole = 'POS';
      } else if (employees[employeeIndex].role === 'Employee') {
        systemRole = 'ADMIN';
      }
      
      // Get store name if storeId exists
      let storeName = null;
      if (employees[employeeIndex].storeId) {
        const storesData = await kv.get('stores');
        const stores = (typeof storesData === 'string') ? JSON.parse(storesData) : (storesData || []);
        const store = stores.find((s: any) => s.id === employees[employeeIndex].storeId);
        if (store) {
          storeName = store.name;
        }
      }
      
      if (userIndex !== -1) {
        // Update existing user
        systemUsers[userIndex] = {
          ...systemUsers[userIndex],
          username: employees[employeeIndex].username,
          password: employees[employeeIndex].password,
          fullName: employees[employeeIndex].name,
          role: systemRole,
          employeeRole: employees[employeeIndex].role,
          permissions: employees[employeeIndex].permissions,
          storeId: employees[employeeIndex].storeId,
          storeName: storeName,
          canLogin: employees[employeeIndex].canLogin
        };
        await kv.set('users', systemUsers);
        console.log('✓ Users table updated');
        console.log('  - StoreId in users:', systemUsers[userIndex].storeId);
        console.log('  - StoreName in users:', systemUsers[userIndex].storeName);
        
        // Verify the save
        const verifyUserData = await kv.get('users');
        const verifyUsers = (typeof verifyUserData === 'string') ? JSON.parse(verifyUserData) : (verifyUserData || []);
        const verifyUser = verifyUsers.find((u: any) => u.id === id);
        console.log('→ Verification - StoreId in users DB:', verifyUser?.storeId);
        console.log('→ Verification - StoreName in users DB:', verifyUser?.storeName);
      } else {
        // Create new user if doesn't exist
        const newUser = {
          id: employees[employeeIndex].id,
          username: employees[employeeIndex].username,
          password: employees[employeeIndex].password,
          fullName: employees[employeeIndex].name,
          role: systemRole,
          employeeRole: employees[employeeIndex].role,
          permissions: employees[employeeIndex].permissions,
          storeId: employees[employeeIndex].storeId,
          storeName: storeName,
          canLogin: employees[employeeIndex].canLogin
        };
        systemUsers.push(newUser);
        await kv.set('users', systemUsers);
        console.log('✓ New user record created');
        console.log('  - StoreId in new user:', newUser.storeId);
        console.log('  - StoreName in new user:', newUser.storeName);
      }
    }
    
    console.log('✓ Employee update complete');
    console.log('=========================\n');
    return c.json({ employee: employees[employeeIndex] });
  } catch (error) {
    console.error('❌ ERROR updating user:', error);
    console.error('Stack trace:', error.stack);
    console.log('=========================\n');
    return c.json({ error: 'Failed to update user' }, 500);
  }
});

// Create new employee
app.post("/make-server-26f4e13f/employees", async (c) => {
  try {
    const newEmployee = await c.req.json();
    
    console.log('\n=== CREATING NEW EMPLOYEE ===');
    console.log('Employee data received:', JSON.stringify(newEmployee, null, 2));
    console.log('StoreId from request:', newEmployee.storeId);
    console.log('StoreId type:', typeof newEmployee.storeId);
    
    const employeesData = await kv.get('employees');
    const employees = employeesData ? JSON.parse(employeesData) : [];
    
    // Auto-generate username from employee name
    const generateUsername = (name: string) => {
      return name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    };
    
    // Generate default password
    const generatePassword = () => {
      return 'emp' + Math.random().toString(36).slice(-6);
    };
    
    const autoUsername = generateUsername(newEmployee.name);
    const autoPassword = generatePassword();
    
    // Convert empty string storeId to null
    if (newEmployee.storeId === '') {
      newEmployee.storeId = null;
    }
    
    // Get store name if storeId is provided
    let storeName = null;
    if (newEmployee.storeId) {
      const storesData = await kv.get('stores');
      const stores = storesData ? JSON.parse(storesData) : [];
      const store = stores.find((s: any) => s.id === newEmployee.storeId);
      if (store) {
        storeName = store.name;
        console.log(`Employee assigned to store: ${storeName} (ID: ${newEmployee.storeId})`);
      }
    }
    
    const employee = {
      id: `emp-${Date.now()}`,
      name: newEmployee.name,
      mobile: newEmployee.mobile,
      address: newEmployee.address || '',
      role: newEmployee.role || null, // Store, Production, POS, or Employee
      storeId: newEmployee.storeId || null,
      storeName: storeName, // Include store name for display
      permissions: newEmployee.permissions || [], // Array of permission IDs
      username: autoUsername,
      password: autoPassword,
      canLogin: newEmployee.canLogin !== false, // Default to true unless explicitly set to false
      createdAt: new Date().toISOString()
    };
    
    employees.push(employee);
    await kv.set('employees', employees);
    console.log(`Employee created: ${employee.name}`);
    console.log(`  - ID: ${employee.id}`);
    console.log(`  - Role: ${employee.role}`);
    console.log(`  - StoreId saved: ${employee.storeId}`);
    console.log(`  - Store: ${storeName || 'No store assigned'}`);
    console.log(`  - Username: ${employee.username}`);
    console.log(`  - Password: ${employee.password}`);
    
    // Automatically add employee to users table for login
    const usersData = await kv.get('users');
    const users = (typeof usersData === 'string') ? JSON.parse(usersData) : (usersData || []);
    
    // Map employee role to system role for dashboard access
    let systemRole = 'ADMIN'; // Default for Employee role
    if (employee.role === 'Store') {
      systemRole = 'STORE'; // Store employees can access store-related pages
    } else if (employee.role === 'Production') {
      systemRole = 'PRODUCTION'; // Production employees can access production pages
    } else if (employee.role === 'POS') {
      systemRole = 'POS'; // POS employees can only access POS
    } else if (employee.role === 'Employee') {
      systemRole = 'ADMIN'; // Custom Employee role gets ADMIN system role but with permission-based access
    }
    
    console.log(`  - System Role: ${systemRole}`);
    console.log(`  - Permissions: ${employee.permissions.length > 0 ? employee.permissions.join(', ') : 'None'}`);
    
    // Check if user already exists with this username
    const existingUserIndex = users.findIndex((u: any) => u.username === employee.username);
    if (existingUserIndex === -1) {
      // Create new user account for login
      const newUser = {
        id: employee.id,
        username: employee.username,
        password: employee.password,
        fullName: employee.name,
        role: systemRole,
        employeeRole: employee.role,
        permissions: employee.permissions,
        storeId: employee.storeId,
        storeName: storeName,
        canLogin: employee.canLogin
      };
      users.push(newUser);
      await kv.set('users', users);
      console.log('✓ User account created automatically for employee login');
      console.log(`  - Can login: ${employee.canLogin ? 'Yes' : 'No'}`);
      console.log(`  - Can access: ${systemRole} dashboard`);
      console.log(`  - StoreId in user record: ${newUser.storeId}`);
      console.log(`  - StoreName in user record: ${newUser.storeName}`);
      if (storeName) {
        console.log(`  - Store restriction: ${storeName} only`);
      }
    } else {
      console.log('⚠ User with this username already exists, skipping user creation');
    }
    
    console.log('=========================\n');
    
    return c.json({ employee });
  } catch (error) {
    console.error('Error creating employee:', error);
    return c.json({ error: 'Failed to create employee' }, 500);
  }
});

// Update employee
app.put("/make-server-26f4e13f/employees/:id", async (c) => {
  try {
    const id = c.req.param('id');
    const updates = await c.req.json();
    
    const employeesData = await kv.get('employees');
    const employees = (typeof employeesData === 'string') ? JSON.parse(employeesData) : (employeesData || []);
    
    const employeeIndex = employees.findIndex((e: any) => e.id === id);
    
    if (employeeIndex === -1) {
      return c.json({ error: 'Employee not found' }, 404);
    }
    
    // Convert empty string storeId to null
    if (updates.storeId === '') {
      updates.storeId = null;
    }
    
    // Update employee
    employees[employeeIndex] = {
      ...employees[employeeIndex],
      ...updates
    };
    
    await kv.set('employees', employees);
    
    // If username or password is updated, also update the users table
    if (updates.username || updates.password || updates.role || updates.permissions || updates.name || updates.hasOwnProperty('storeId') || updates.hasOwnProperty('canLogin')) {
      const usersData = await kv.get('users');
      const users = (typeof usersData === 'string') ? JSON.parse(usersData) : (usersData || []);
      
      const userIndex = users.findIndex((u: any) => u.id === id);
      
      // Map employee role to system role
      let systemRole = 'ADMIN';
      if (employees[employeeIndex].role === 'Store') {
        systemRole = 'STORE';
      } else if (employees[employeeIndex].role === 'Production') {
        systemRole = 'PRODUCTION';
      } else if (employees[employeeIndex].role === 'POS') {
        systemRole = 'POS';
      } else if (employees[employeeIndex].role === 'Employee') {
        systemRole = 'ADMIN';
      }
      
      // Get store name if storeId exists
      let storeName = null;
      if (employees[employeeIndex].storeId) {
        const storesData = await kv.get('stores');
        const stores = (typeof storesData === 'string') ? JSON.parse(storesData) : (storesData || []);
        const store = stores.find((s: any) => s.id === employees[employeeIndex].storeId);
        if (store) {
          storeName = store.name;
        }
      }
      
      if (userIndex !== -1) {
        // Update existing user
        users[userIndex] = {
          ...users[userIndex],
          username: employees[employeeIndex].username,
          password: employees[employeeIndex].password,
          fullName: employees[employeeIndex].name,
          role: systemRole,
          employeeRole: employees[employeeIndex].role,
          permissions: employees[employeeIndex].permissions,
          storeId: employees[employeeIndex].storeId,
          storeName: storeName,
          canLogin: employees[employeeIndex].canLogin
        };
        await kv.set('users', users);
        console.log('User account updated for employee:', employees[employeeIndex].username);
        console.log(`  - Can login: ${employees[employeeIndex].canLogin ? 'Yes' : 'No'}`);
      } else {
        // Create new user if doesn't exist
        const newUser = {
          id: employees[employeeIndex].id,
          username: employees[employeeIndex].username,
          password: employees[employeeIndex].password,
          fullName: employees[employeeIndex].name,
          role: systemRole,
          employeeRole: employees[employeeIndex].role,
          permissions: employees[employeeIndex].permissions,
          storeId: employees[employeeIndex].storeId,
          storeName: storeName,
          canLogin: employees[employeeIndex].canLogin
        };
        users.push(newUser);
        await kv.set('users', users);
        console.log('User account created for employee:', employees[employeeIndex].username);
      }
    }
    
    console.log('Employee updated:', employees[employeeIndex].name);
    
    return c.json({ employee: employees[employeeIndex] });
  } catch (error) {
    console.error('Error updating employee:', error);
    return c.json({ error: 'Failed to update employee' }, 500);
  }
});

// Delete employee
app.delete("/make-server-26f4e13f/employees/:id", async (c) => {
  try {
    const id = c.req.param('id');
    
    const employeesData = await kv.get('employees');
    const employees = (typeof employeesData === 'string') ? JSON.parse(employeesData) : (employeesData || []);
    
    const filtered = employees.filter((e: any) => e.id !== id);
    await kv.set('employees', filtered);
    
    // Also delete from users table
    const usersData = await kv.get('users');
    const users = (typeof usersData === 'string') ? JSON.parse(usersData) : (usersData || []);
    const filteredUsers = users.filter((u: any) => u.id !== id);
    await kv.set('users', filteredUsers);
    
    console.log('Employee deleted:', id);
    console.log('User account deleted for employee:', id);
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting employee:', error);
    return c.json({ error: 'Failed to delete employee' }, 500);
  }
});

// Delete user (works for both system users and employees)
app.delete("/make-server-26f4e13f/users/:id", async (c) => {
  try {
    const id = c.req.param('id');
    console.log('=== DELETING USER ===');
    console.log('User ID:', id);
    
    // Delete from users table
    const usersData = await kv.get('users');
    const users = (typeof usersData === 'string') ? JSON.parse(usersData) : (usersData || []);
    const filteredUsers = users.filter((u: any) => u.id !== id);
    await kv.set('users', filteredUsers);
    console.log('User deleted from users table');
    
    // Also delete from employees table if exists
    const employeesData = await kv.get('employees');
    const employees = (typeof employeesData === 'string') ? JSON.parse(employeesData) : (employeesData || []);
    const filteredEmployees = employees.filter((e: any) => e.id !== id);
    await kv.set('employees', filteredEmployees);
    console.log('User deleted from employees table (if existed)');
    
    console.log('User successfully deleted:', id);
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return c.json({ error: 'Failed to delete user' }, 500);
  }
});

// ==================== SUPPLIERS ROUTES ====================

// Get all suppliers
app.get("/make-server-26f4e13f/suppliers", async (c) => {
  try {
    const suppliersData = await kv.get('suppliers');
    const suppliers = suppliersData ? JSON.parse(suppliersData) : [];
    
    return c.json({ suppliers });
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    return c.json({ error: 'Failed to fetch suppliers' }, 500);
  }
});

// Create new supplier
app.post("/make-server-26f4e13f/suppliers", async (c) => {
  try {
    const newSupplier = await c.req.json();
    
    const suppliersData = await kv.get('suppliers');
    const suppliers = suppliersData ? JSON.parse(suppliersData) : [];
    
    const supplier = {
      id: `sup-${Date.now()}`,
      name: newSupplier.name,
      contactPerson: newSupplier.contactPerson || '',
      phone: newSupplier.phone || '',
      email: newSupplier.email || '',
      address: newSupplier.address || '',
      createdAt: new Date().toISOString()
    };
    
    suppliers.push(supplier);
    await kv.set('suppliers', JSON.stringify(suppliers));
    
    console.log('Supplier created:', supplier.name);
    
    return c.json({ supplier });
  } catch (error) {
    console.error('Error creating supplier:', error);
    return c.json({ error: 'Failed to create supplier' }, 500);
  }
});

// Update supplier
app.put("/make-server-26f4e13f/suppliers/:id", async (c) => {
  try {
    const id = c.req.param('id');
    const updates = await c.req.json();
    
    const suppliersData = await kv.get('suppliers');
    const suppliers = suppliersData ? JSON.parse(suppliersData) : [];
    
    const supplierIndex = suppliers.findIndex((s: any) => s.id === id);
    
    if (supplierIndex === -1) {
      return c.json({ error: 'Supplier not found' }, 404);
    }
    
    // Update supplier
    suppliers[supplierIndex] = {
      ...suppliers[supplierIndex],
      ...updates
    };
    
    await kv.set('suppliers', JSON.stringify(suppliers));
    
    console.log('Supplier updated:', suppliers[supplierIndex].name);
    
    return c.json({ supplier: suppliers[supplierIndex] });
  } catch (error) {
    console.error('Error updating supplier:', error);
    return c.json({ error: 'Failed to update supplier' }, 500);
  }
});

// Delete supplier
app.delete("/make-server-26f4e13f/suppliers/:id", async (c) => {
  try {
    const id = c.req.param('id');
    
    const suppliersData = await kv.get('suppliers');
    const suppliers = suppliersData ? JSON.parse(suppliersData) : [];
    
    const filtered = suppliers.filter((s: any) => s.id !== id);
    await kv.set('suppliers', JSON.stringify(filtered));
    
    console.log('Supplier deleted:', id);
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting supplier:', error);
    return c.json({ error: 'Failed to delete supplier' }, 500);
  }
});

// ==================== HISTORY ROUTES ====================

// Get POS history
app.get("/make-server-26f4e13f/history/pos", async (c) => {
  try {
    const historyData = await kv.get('history_pos');
    const history = historyData ? JSON.parse(historyData) : [];
    return c.json({ history });
  } catch (error) {
    console.error('Error fetching POS history:', error);
    return c.json({ error: 'Failed to fetch POS history' }, 500);
  }
});

// Get Inventory history
app.get("/make-server-26f4e13f/history/inventory", async (c) => {
  try {
    const historyData = await kv.get('history_inventory');
    const history = historyData ? JSON.parse(historyData) : [];
    return c.json({ history });
  } catch (error) {
    console.error('Error fetching inventory history:', error);
    return c.json({ error: 'Failed to fetch inventory history' }, 500);
  }
});

// Get Production history
app.get("/make-server-26f4e13f/history/production", async (c) => {
  try {
    const historyData = await kv.get('history_production');
    const history = historyData ? JSON.parse(historyData) : [];
    return c.json({ history });
  } catch (error) {
    console.error('Error fetching production history:', error);
    return c.json({ error: 'Failed to fetch production history' }, 500);
  }
});

// Get Ingredients history
app.get("/make-server-26f4e13f/history/ingredients", async (c) => {
  try {
    const historyData = await kv.get('history_ingredients');
    const history = historyData ? JSON.parse(historyData) : [];
    return c.json({ history });
  } catch (error) {
    console.error('Error fetching ingredients history:', error);
    return c.json({ error: 'Failed to fetch ingredients history' }, 500);
  }
});

// Get all system history (combined from all sources)
app.get("/make-server-26f4e13f/history", async (c) => {
  try {
    // Fetch all history data
    const [posData, inventoryData, productionData, ingredientsData, salesData, transfersData] = await Promise.all([
      kv.get('history_pos'),
      kv.get('history_inventory'),
      kv.get('history_production'),
      kv.get('history_ingredients'),
      kv.get('sales'),
      kv.get('transfer_requests')
    ]);

    const posHistory = posData ? JSON.parse(posData) : [];
    const inventoryHistory = inventoryData ? JSON.parse(inventoryData) : [];
    const productionHistory = productionData ? JSON.parse(productionData) : [];
    const ingredientsHistory = ingredientsData ? JSON.parse(ingredientsData) : [];
    const sales = salesData ? JSON.parse(salesData) : [];
    const transfers = transfersData ? JSON.parse(transfersData) : [];

    // Combine all history entries
    const allHistory = [];

    // Add POS history
    posHistory.forEach((entry: any) => {
      allHistory.push({
        id: entry.id || `pos-${Date.now()}-${Math.random()}`,
        action: entry.action || 'Sale',
        description: entry.description || `Sale transaction`,
        user: entry.user || 'POS User',
        timestamp: entry.timestamp,
        details: entry.details || entry
      });
    });

    // Add sales as history
    sales.forEach((sale: any) => {
      allHistory.push({
        id: sale.id || sale.transactionId,
        action: 'Sale',
        description: `Sale transaction - ₱${sale.total.toLocaleString()}`,
        user: 'POS User',
        timestamp: sale.timestamp || sale.date,
        details: {
          transactionId: sale.transactionId,
          items: sale.items,
          total: sale.total,
          paymentMethod: sale.paymentMethod,
          location: sale.location
        }
      });
    });

    // Add inventory history
    inventoryHistory.forEach((entry: any) => {
      allHistory.push({
        id: entry.id || `inv-${Date.now()}-${Math.random()}`,
        action: entry.action || 'Inventory Update',
        description: entry.description || `Inventory updated`,
        user: entry.user || 'System',
        timestamp: entry.timestamp,
        details: entry.details || entry
      });
    });

    // Add production history
    productionHistory.forEach((entry: any) => {
      allHistory.push({
        id: entry.id || `prod-${Date.now()}-${Math.random()}`,
        action: entry.action || 'Production',
        description: entry.description || `Production completed`,
        user: entry.user || 'Production User',
        timestamp: entry.timestamp,
        details: entry.details || entry
      });
    });

    // Add ingredients history
    ingredientsHistory.forEach((entry: any) => {
      allHistory.push({
        id: entry.id || `ing-${Date.now()}-${Math.random()}`,
        action: entry.action || 'Ingredient Update',
        description: entry.description || `Ingredient updated`,
        user: entry.user || 'System',
        timestamp: entry.timestamp,
        details: entry.details || entry
      });
    });

    // Add transfer history
    transfers.forEach((transfer: any) => {
      allHistory.push({
        id: transfer.id,
        action: `Transfer - ${transfer.status}`,
        description: `${transfer.quantity} KG ${transfer.productName} from ${transfer.from} to ${transfer.to}`,
        user: transfer.requestedBy,
        timestamp: transfer.updatedAt || transfer.createdAt,
        details: {
          productId: transfer.productId,
          productName: transfer.productName,
          from: transfer.from,
          to: transfer.to,
          quantity: transfer.quantity,
          status: transfer.status
        }
      });
    });

    // Sort by timestamp (newest first)
    allHistory.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return c.json({ history: allHistory });
  } catch (error) {
    console.error('Error fetching system history:', error);
    return c.json({ error: 'Failed to fetch system history' }, 500);
  }
});

// ==================== TRANSACTIONS ROUTES ====================

// Get all transactions
app.get("/make-server-26f4e13f/transactions", async (c) => {
  try {
    const transactionsData = await kv.get('transactions');
    const transactions = transactionsData ? JSON.parse(transactionsData) : [];
    
    // Sort by timestamp, newest first
    transactions.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    return c.json({ transactions });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return c.json({ error: 'Failed to fetch transactions' }, 500);
  }
});

// Create new transaction
app.post("/make-server-26f4e13f/transactions", async (c) => {
  try {
    const transactionData = await c.req.json();
    
    const transactionsListData = await kv.get('transactions');
    const transactions = transactionsListData ? JSON.parse(transactionsListData) : [];
    
    const transaction = {
      id: `txn-${Date.now()}`,
      type: transactionData.type, // 'Cash In' or 'Cash Out'
      amount: transactionData.amount,
      description: transactionData.description,
      category: transactionData.category,
      reference: transactionData.reference || '',
      createdBy: transactionData.createdBy || 'Admin',
      timestamp: new Date().toISOString()
    };
    
    transactions.push(transaction);
    await kv.set('transactions', JSON.stringify(transactions));
    
    console.log(`Transaction created: ${transaction.type} - ₱${transaction.amount}`);
    
    return c.json({ transaction });
  } catch (error) {
    console.error('Error creating transaction:', error);
    return c.json({ error: 'Failed to create transaction' }, 500);
  }
});

// Delete transaction
app.delete("/make-server-26f4e13f/transactions/:id", async (c) => {
  try {
    const id = c.req.param('id');
    
    const transactionsData = await kv.get('transactions');
    const transactions = transactionsData ? JSON.parse(transactionsData) : [];
    
    const filtered = transactions.filter((t: any) => t.id !== id);
    await kv.set('transactions', JSON.stringify(filtered));
    
    console.log('Transaction deleted:', id);
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    return c.json({ error: 'Failed to delete transaction' }, 500);
  }
});

// Health check endpoint
app.get("/make-server-26f4e13f/health", (c) => {
  return c.json({ status: "ok", message: "LZT Meat Products API Server" });
});

// Reset users endpoint (for debugging) - reinitializes admin user
app.post("/make-server-26f4e13f/auth/reset-admin", async (c) => {
  try {
    console.log('\n=== RESETTING ADMIN USER ===');
    
    // Create fresh admin user
    const freshUsers = [{
      id: '1',
      username: 'admin',
      password: 'admin123',
      fullName: 'Admin User',
      role: 'ADMIN'
    }];
    
    // Save back to KV store as JSONB object
    await kv.set('users', freshUsers);
    
    console.log('Admin user reset successfully');
    console.log('Total users after reset:', freshUsers.length);
    
    // Verify it was saved correctly
    const verifyData = await kv.get('users');
    console.log('Verification - data type:', typeof verifyData);
    console.log('Verification - is array:', Array.isArray(verifyData));
    console.log('===========================\n');
    
    return c.json({ 
      success: true, 
      message: 'Admin user reset successfully',
      adminCredentials: {
        username: 'admin',
        password: 'admin123'
      },
      totalUsers: freshUsers.length,
      verificationDataType: typeof verifyData,
      verificationIsArray: Array.isArray(verifyData)
    });
  } catch (error) {
    console.error('Error resetting admin user:', error);
    return c.json({ error: 'Failed to reset admin user', details: error.message, stack: error.stack }, 500);
  }
});

Deno.serve(app.fetch);