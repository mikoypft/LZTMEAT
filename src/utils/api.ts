// Configure API based on environment
// Set to 'laravel' to use Laravel backend, or 'supabase' for Supabase
const API_MODE = import.meta.env.VITE_API_MODE || "laravel";

let API_BASE: string;

if (API_MODE === "laravel") {
  API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000/api";
} else {
  const { projectId, publicAnonKey } = await import("/utils/supabase/info");
  API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-26f4e13f`;
}

// Helper function for API requests
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  // Add authorization header based on API mode
  if (API_MODE === "supabase") {
    const { publicAnonKey } = await import("/utils/supabase/info");
    headers["Authorization"] = `Bearer ${publicAnonKey}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const text = await response.text();
    // Try to parse as JSON, otherwise use as error message
    let errorData: any = {};
    try {
      // Strip HTML content from response and extract JSON
      const jsonMatch = text.match(/{[\s\S]*}/);
      if (jsonMatch) {
        errorData = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      // Ignore JSON parse errors
    }
    const errorMessage =
      errorData.error || `API request failed: ${response.statusText}`;
    console.error(`API Error [${endpoint}]:`, errorMessage, errorData);
    throw new Error(errorMessage);
  }

  const text = await response.text();
  // Strip HTML content from response and extract JSON
  const jsonMatch = text.match(/{[\s\S]*}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }

  throw new Error(`Invalid response format from ${endpoint}`);
}

// ==================== AUTH API ====================

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: "ADMIN" | "STORE" | "PRODUCTION" | "POS";
  employeeRole?: "Store" | "Production" | "Employee"; // Employee-specific role
  permissions?: string[]; // Permissions for Employee role
  storeId?: string; // Store assignment
  storeName?: string; // Store name
  canLogin?: boolean; // Whether user can login
}

export async function login(username: string, password: string): Promise<User> {
  const data = await apiRequest<{ user: User }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  return data.user;
}

export async function refreshSession(
  userId: string,
  username: string,
): Promise<User> {
  const data = await apiRequest<{ user: User }>("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ userId, username }),
  });
  return data.user;
}

// ==================== PRODUCTS API ====================

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  unit: string;
  image: string | null;
}

export async function getProducts(): Promise<Product[]> {
  const data = await apiRequest<{ products: Product[] }>("/products");
  return data.products;
}

export async function addProduct(
  product: Omit<Product, "id">,
): Promise<Product> {
  const data = await apiRequest<{ product: Product }>("/products", {
    method: "POST",
    body: JSON.stringify(product),
  });
  return data.product;
}

export async function updateProduct(
  id: string,
  updates: Partial<Product>,
): Promise<Product> {
  const data = await apiRequest<{ product: Product }>(`/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  });
  return data.product;
}

export async function deleteProduct(id: string): Promise<void> {
  await apiRequest<{ success: boolean }>(`/products/${id}`, {
    method: "DELETE",
  });
}

export async function deleteAllProducts(): Promise<void> {
  await apiRequest<{ success: boolean }>("/products/delete-all", {
    method: "DELETE",
  });
}

// ==================== CATEGORIES API ====================

export interface Category {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

export async function getCategories(): Promise<Category[]> {
  const data = await apiRequest<{ categories: Category[] }>("/categories");
  return data.categories;
}

export async function addCategory(
  category: Omit<Category, "id" | "createdAt">,
): Promise<Category> {
  const data = await apiRequest<{ category: Category }>("/categories", {
    method: "POST",
    body: JSON.stringify(category),
  });
  return data.category;
}

export async function updateCategory(
  id: string,
  category: Omit<Category, "id" | "createdAt">,
): Promise<Category> {
  const data = await apiRequest<{ category: Category }>(`/categories/${id}`, {
    method: "PUT",
    body: JSON.stringify(category),
  });
  return data.category;
}

export async function deleteCategory(id: string): Promise<void> {
  await apiRequest<{ success: boolean }>(`/categories/${id}`, {
    method: "DELETE",
  });
}

// Ingredient Categories API
export async function getIngredientCategories(): Promise<Category[]> {
  const data = await apiRequest<{ categories: Category[] }>(
    "/ingredient-categories",
  );
  return data.categories;
}

export async function addIngredientCategory(
  category: Omit<Category, "id" | "createdAt">,
): Promise<Category> {
  const data = await apiRequest<{ category: Category }>(
    "/ingredient-categories",
    {
      method: "POST",
      body: JSON.stringify(category),
    },
  );
  return data.category;
}

export async function updateIngredientCategory(
  id: string,
  category: Omit<Category, "id" | "createdAt">,
): Promise<Category> {
  const data = await apiRequest<{ category: Category }>(
    `/ingredient-categories/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(category),
    },
  );
  return data.category;
}

export async function deleteIngredientCategory(id: string): Promise<void> {
  await apiRequest<{ success: boolean }>(`/ingredient-categories/${id}`, {
    method: "DELETE",
  });
}

// ==================== INVENTORY API ====================

export interface InventoryRecord {
  id: string;
  productId: string;
  location: string;
  quantity: number;
  lastUpdated: string;
}

export async function getInventory(
  location?: string,
): Promise<InventoryRecord[]> {
  const endpoint = location
    ? `/inventory?location=${encodeURIComponent(location)}`
    : "/inventory";
  const data = await apiRequest<{ inventory: InventoryRecord[] }>(endpoint);
  return data.inventory;
}

export async function updateInventoryQuantity(
  productId: string,
  location: string,
  quantity: number,
): Promise<InventoryRecord> {
  const data = await apiRequest<{ inventory: InventoryRecord }>(
    `/inventory/update`,
    {
      method: "PUT",
      body: JSON.stringify({ productId, location, quantity }),
    },
  );
  return data.inventory;
}

export async function addInventory(
  productId: string,
  location: string,
  quantity: number,
): Promise<InventoryRecord> {
  const data = await apiRequest<{ inventory: InventoryRecord }>("/inventory", {
    method: "POST",
    body: JSON.stringify({ productId, location, quantity }),
  });
  return data.inventory;
}

// ==================== INGREDIENTS API ====================

export interface Ingredient {
  id: string;
  name: string;
  code: string;
  category: string;
  unit: string;
  stock: number;
  minStockLevel: number;
  reorderPoint: number;
  costPerUnit: number;
  supplier: string;
  lastUpdated: string;
  expiryDate?: string | null;
}

export async function getIngredients(): Promise<Ingredient[]> {
  const data = await apiRequest<{ ingredients: Ingredient[] }>("/ingredients");
  return data.ingredients;
}

export async function updateIngredient(
  id: string,
  updates: Partial<Ingredient>,
): Promise<Ingredient> {
  const data = await apiRequest<{ ingredient: Ingredient }>(
    `/ingredients/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(updates),
    },
  );
  return data.ingredient;
}

export async function addIngredient(
  ingredient: Omit<Ingredient, "id"> & { supplierId?: string },
): Promise<Ingredient> {
  // Convert supplier name to supplierId if needed
  const payload = {
    ...ingredient,
    ...(ingredient.supplierId && { supplierId: ingredient.supplierId }),
  };
  const data = await apiRequest<{ ingredient: Ingredient }>("/ingredients", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return data.ingredient;
}

export async function deleteIngredient(id: string): Promise<void> {
  await apiRequest<{ ingredient: Ingredient }>(`/ingredients/${id}`, {
    method: "DELETE",
  });
}

export async function resetIngredients(): Promise<Ingredient[]> {
  const data = await apiRequest<{ ingredients: Ingredient[] }>(
    "/ingredients/reset",
    {
      method: "POST",
    },
  );
  return data.ingredients;
}

// ==================== SALES API ====================

export interface SaleItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  discount?: number;
}

export interface Sale {
  id?: string;
  transactionId: string;
  date: string;
  location?: string; // Store location where sale was made
  storeId?: string; // Store ID
  cashier?: string; // Cashier full name
  userId?: string; // User ID who made the transaction
  username?: string; // Username who made the transaction
  customer: { name: string; phone: string; email: string } | null;
  items: SaleItem[];
  subtotal: number;
  globalDiscount: number;
  tax: number;
  total: number;
  paymentMethod: string;
  timestamp?: string;
}

export async function getSales(
  startDate?: string,
  endDate?: string,
): Promise<Sale[]> {
  let endpoint = "/sales";
  if (startDate && endDate) {
    endpoint += `?startDate=${startDate}&endDate=${endDate}`;
  }
  const data = await apiRequest<{ sales: Sale[] }>(endpoint);
  return data.sales;
}

export async function createSale(
  sale: Omit<Sale, "id" | "timestamp">,
): Promise<Sale> {
  const data = await apiRequest<{ sale: Sale }>("/sales", {
    method: "POST",
    body: JSON.stringify(sale),
  });
  return data.sale;
}

export async function updateSale(
  id: string,
  updates: Partial<Sale>,
): Promise<Sale> {
  const data = await apiRequest<{ sale: Sale }>(`/sales/${id}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  });
  return data.sale;
}

// ==================== PRODUCTION API ====================

export interface IngredientUsed {
  ingredientId: string;
  ingredientName: string;
  quantity: number;
}

export interface ProductionRecord {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  batchNumber: string;
  operator: string;
  status?: "in-progress" | "completed" | "quality-check";
  ingredientsUsed?: IngredientUsed[];
  notes?: string;
  timestamp: string;
}

export async function getProductionRecords(): Promise<ProductionRecord[]> {
  const data = await apiRequest<{ records: ProductionRecord[] }>("/production");
  return data.records;
}

export async function createProductionRecord(
  record: Omit<ProductionRecord, "id" | "timestamp">,
): Promise<ProductionRecord> {
  console.log("API: Creating production record with:", record);
  const data = await apiRequest<{ record: ProductionRecord }>("/production", {
    method: "POST",
    body: JSON.stringify(record),
  });
  return data.record;
}

export async function updateProductionRecordStatus(
  id: string,
  status: string,
): Promise<ProductionRecord> {
  console.log("API: Updating production status:", { id, status });
  const data = await apiRequest<{ record: ProductionRecord }>(
    `/production/${id}`,
    {
      method: "PUT",
      body: JSON.stringify({ status }),
    },
  );
  console.log("API: Update response:", data);
  return data.record;
}

export async function deleteProductionRecord(id: string): Promise<void> {
  await apiRequest<{ success: boolean }>(`/production/${id}`, {
    method: "DELETE",
  });
}

// ==================== TRANSFER API ====================

export interface TransferRequest {
  id: string;
  productId: string;
  productName: string;
  from: string;
  to: string;
  quantity: number;
  status: "Pending" | "In Transit" | "Completed" | "Cancelled";
  requestedBy: string;
  createdAt: string;
  updatedAt?: string;
}

export async function getTransfers(): Promise<TransferRequest[]> {
  const data = await apiRequest<{ transfers: TransferRequest[] }>("/transfers");
  return data.transfers;
}

export async function createTransfer(
  transfer: Omit<TransferRequest, "id" | "status" | "createdAt" | "updatedAt">,
): Promise<TransferRequest> {
  const data = await apiRequest<{ transfer: TransferRequest }>("/transfers", {
    method: "POST",
    body: JSON.stringify(transfer),
  });
  return data.transfer;
}

export async function updateTransferStatus(
  id: string,
  status: TransferRequest["status"],
): Promise<TransferRequest> {
  const data = await apiRequest<{ transfer: TransferRequest }>(
    `/transfers/${id}`,
    {
      method: "PUT",
      body: JSON.stringify({ status }),
    },
  );
  return data.transfer;
}

// ==================== STORES API ====================

export interface StoreLocation {
  id: string;
  name: string;
  address: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt?: string;
}

export async function getStores(): Promise<StoreLocation[]> {
  const data = await apiRequest<{ stores: StoreLocation[] }>("/stores");
  return data.stores;
}

export async function createStore(
  store: Omit<StoreLocation, "id" | "createdAt" | "updatedAt">,
): Promise<StoreLocation> {
  const data = await apiRequest<{ store: StoreLocation }>("/stores", {
    method: "POST",
    body: JSON.stringify(store),
  });
  return data.store;
}

export async function updateStore(
  id: string,
  updates: Partial<Omit<StoreLocation, "id" | "createdAt" | "updatedAt">>,
): Promise<StoreLocation> {
  const data = await apiRequest<{ store: StoreLocation }>(`/stores/${id}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  });
  return data.store;
}

export async function deleteStore(id: string): Promise<void> {
  await apiRequest<{ success: boolean }>(`/stores/${id}`, {
    method: "DELETE",
  });
}

// ==================== EMPLOYEES API ====================

export interface Employee {
  id: string;
  username: string;
  fullName: string;
  mobile?: string;
  address?: string;
  role?: "ADMIN" | "STORE" | "PRODUCTION" | "POS" | "EMPLOYEE";
  employeeRole?: "Store" | "Production" | "POS" | "Employee";
  storeId?: string;
  storeName?: string;
  canLogin?: boolean;
  createdAt?: string;
}

export async function getEmployees(): Promise<Employee[]> {
  const data = await apiRequest<{ employees: Employee[] }>("/employees");
  return data.employees;
}

export async function createEmployee(
  employee: Omit<Employee, "id" | "createdAt">,
): Promise<Employee> {
  const data = await apiRequest<{ employee: Employee }>("/employees", {
    method: "POST",
    body: JSON.stringify(employee),
  });
  return data.employee;
}

export async function updateEmployee(
  id: string,
  updates: Partial<Omit<Employee, "id" | "createdAt">>,
): Promise<Employee> {
  const data = await apiRequest<{ employee: Employee }>(`/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  });
  return data.employee;
}

export async function deleteEmployee(id: string): Promise<void> {
  await apiRequest<{ success: boolean }>(`/employees/${id}`, {
    method: "DELETE",
  });
}

// Get all users (both system users and employees)
export interface AllUser extends Employee {
  userType?: "system" | "employee";
}

export async function getAllUsers(): Promise<AllUser[]> {
  const data = await apiRequest<{ users: AllUser[] }>("/users/all");
  return data.users;
}

// Delete user (works for both system users and employees)
export async function deleteUser(id: string): Promise<void> {
  await apiRequest<{ success: boolean }>(`/users/${id}`, {
    method: "DELETE",
  });
}

// ==================== SUPPLIERS API ====================

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  createdAt: string;
}

export async function getSuppliers(): Promise<Supplier[]> {
  const data = await apiRequest<{ suppliers: Supplier[] }>("/suppliers");
  return data.suppliers;
}

export async function createSupplier(
  supplier: Omit<Supplier, "id" | "createdAt">,
): Promise<Supplier> {
  const data = await apiRequest<{ supplier: Supplier }>("/suppliers", {
    method: "POST",
    body: JSON.stringify(supplier),
  });
  return data.supplier;
}

export async function updateSupplier(
  id: string,
  updates: Partial<Omit<Supplier, "id" | "createdAt">>,
): Promise<Supplier> {
  const data = await apiRequest<{ supplier: Supplier }>(`/suppliers/${id}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  });
  return data.supplier;
}

export async function deleteSupplier(id: string): Promise<void> {
  await apiRequest<{ success: boolean }>(`/suppliers/${id}`, {
    method: "DELETE",
  });
}

// ==================== HISTORY API ====================

export interface HistoryRecord {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  details: any;
  user: string;
  timestamp: string;
}

export interface SystemHistoryEntry {
  id: string;
  action: string;
  description: string;
  user: string;
  timestamp: string;
  details: any;
}

export async function getPOSHistory(): Promise<HistoryRecord[]> {
  const data = await apiRequest<{ history: HistoryRecord[] }>("/history/pos");
  return data.history;
}

export async function getInventoryHistory(): Promise<HistoryRecord[]> {
  const data = await apiRequest<{ history: HistoryRecord[] }>(
    "/history/inventory",
  );
  return data.history;
}

export async function getProductionHistory(): Promise<HistoryRecord[]> {
  const data = await apiRequest<{ history: HistoryRecord[] }>(
    "/history/production",
  );
  return data.history;
}

export async function getIngredientsHistory(): Promise<HistoryRecord[]> {
  const data = await apiRequest<{ history: HistoryRecord[] }>(
    "/history/ingredients",
  );
  return data.history;
}

export async function getSystemHistory(): Promise<SystemHistoryEntry[]> {
  const data = await apiRequest<{ history: SystemHistoryEntry[] }>("/history");
  return data.history;
}

export async function exportHistoryToCSV(
  data: SystemHistoryEntry[],
): Promise<void> {
  const headers = ["Date & Time", "Action", "User", "Description", "Details"];
  const rows = data.map((entry) => [
    new Date(entry.timestamp).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    entry.action,
    entry.user,
    entry.description,
    JSON.stringify(entry.details),
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `system-history-${new Date().toISOString().split("T")[0]}.csv`,
  );
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
