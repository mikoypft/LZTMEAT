import { useState, useEffect } from "react";
import {
  Package,
  Search,
  Filter,
  AlertTriangle,
  TrendingUp,
  Download,
  FileText,
  RefreshCw,
  Edit,
  X,
  Plus,
  Minus,
  Save,
  Trash2,
  Store,
  Lock,
} from "lucide-react";
import { UserData } from "@/app/components/LoginPage";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  getProducts,
  getInventory,
  updateInventoryQuantity,
  addProduct,
  addInventory,
  deleteAllProducts,
  deleteProduct,
  getStores,
  createTransfer,
  getIngredients,
  saveProductDefaultIngredients,
  type Product as APIProduct,
  type InventoryRecord,
  type StoreLocation,
  type Ingredient,
} from "@/utils/api";
import { toast } from "sonner";
import { getCategories, type Category, API_BASE_URL } from "@/utils/api";

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  stockProduction: number;
  storeStocks: { [storeName: string]: number }; // Dynamic store stocks
  totalStock: number;
  minStockLevel: number;
  reorderPoint: number;
  reorderQuantity: number;
  unit: string;
  lastUpdated: string;
  price: number;
}

interface StockAdjustment {
  id: string;
  itemId: string;
  location: string;
  quantity: number;
  type: "add" | "remove";
  reason: string;
  date: string;
  performedBy: string;
}

const MOCK_INVENTORY: InventoryItem[] = [
  {
    id: "1",
    name: "Longanisa (Sweet)",
    sku: "SAU-001",
    category: "Sausages",
    stockProduction: 450,
    storeStocks: { "Store 1": 150, "Store 2": 120 },
    totalStock: 815,
    minStockLevel: 100,
    reorderPoint: 200,
    reorderQuantity: 500,
    unit: "KG",
    lastUpdated: "2026-01-13 14:30",
    price: 10.0,
  },
  {
    id: "2",
    name: "Longanisa (Spicy)",
    sku: "SAU-002",
    category: "Sausages",
    stockProduction: 320,
    storeStocks: { "Store 1": 120, "Store 2": 100 },
    totalStock: 620,
    minStockLevel: 80,
    reorderPoint: 150,
    reorderQuantity: 400,
    unit: "KG",
    lastUpdated: "2026-01-13 14:15",
    price: 12.0,
  },
  {
    id: "3",
    name: "Tocino (Pork)",
    sku: "CUR-001",
    category: "Cured Meats",
    stockProduction: 280,
    storeStocks: { "Store 1": 80, "Store 2": 65 },
    totalStock: 470,
    minStockLevel: 70,
    reorderPoint: 130,
    reorderQuantity: 350,
    unit: "KG",
    lastUpdated: "2026-01-13 13:45",
    price: 15.0,
  },
  {
    id: "4",
    name: "Tapa (Beef)",
    sku: "CUR-002",
    category: "Cured Meats",
    stockProduction: 220,
    storeStocks: { "Store 1": 65, "Store 2": 48 },
    totalStock: 385,
    minStockLevel: 60,
    reorderPoint: 120,
    reorderQuantity: 300,
    unit: "KG",
    lastUpdated: "2026-01-13 12:30",
    price: 20.0,
  },
  {
    id: "5",
    name: "Chorizo de Bilbao",
    sku: "SAU-003",
    category: "Sausages",
    stockProduction: 350,
    storeStocks: { "Store 1": 90, "Store 2": 75 },
    totalStock: 600,
    minStockLevel: 80,
    reorderPoint: 150,
    reorderQuantity: 400,
    unit: "KG",
    lastUpdated: "2026-01-13 15:00",
    price: 14.0,
  },
  {
    id: "6",
    name: "Shanghai (Spring Rolls)",
    sku: "RTC-001",
    category: "Ready-to-Cook",
    stockProduction: 500,
    storeStocks: { "Store 1": 200, "Store 2": 180 },
    totalStock: 1045,
    minStockLevel: 150,
    reorderPoint: 300,
    reorderQuantity: 600,
    unit: "KG",
    lastUpdated: "2026-01-13 14:45",
    price: 8.0,
  },
  {
    id: "7",
    name: "Embutido (Meatloaf)",
    sku: "PRO-001",
    category: "Processed Meats",
    stockProduction: 260,
    storeStocks: { "Store 1": 75, "Store 2": 60 },
    totalStock: 450,
    minStockLevel: 60,
    reorderPoint: 120,
    reorderQuantity: 300,
    unit: "KG",
    lastUpdated: "2026-01-13 13:15",
    price: 18.0,
  },
  {
    id: "8",
    name: "Filipino Hotdog",
    sku: "SAU-004",
    category: "Sausages",
    stockProduction: 420,
    storeStocks: { "Store 1": 180, "Store 2": 145 },
    totalStock: 900,
    minStockLevel: 120,
    reorderPoint: 250,
    reorderQuantity: 550,
    unit: "KG",
    lastUpdated: "2026-01-13 14:50",
    price: 11.0,
  },
  {
    id: "9",
    name: "Ham (Sliced)",
    sku: "PRO-002",
    category: "Processed Meats",
    stockProduction: 190,
    storeStocks: { "Store 1": 55, "Store 2": 45 },
    totalStock: 340,
    minStockLevel: 50,
    reorderPoint: 100,
    reorderQuantity: 250,
    unit: "KG",
    lastUpdated: "2026-01-13 13:30",
    price: 25.0,
  },
  {
    id: "10",
    name: "Bacon (Smoked)",
    sku: "PRO-003",
    category: "Processed Meats",
    stockProduction: 230,
    storeStocks: { "Store 1": 70, "Store 2": 55 },
    totalStock: 420,
    minStockLevel: 60,
    reorderPoint: 120,
    reorderQuantity: 300,
    unit: "KG",
    lastUpdated: "2026-01-13 14:20",
    price: 22.0,
  },
  {
    id: "11",
    name: "Ground Pork",
    sku: "GRD-001",
    category: "Ground Meats",
    stockProduction: 380,
    storeStocks: { "Store 1": 110, "Store 2": 95 },
    totalStock: 670,
    minStockLevel: 90,
    reorderPoint: 180,
    reorderQuantity: 450,
    unit: "KG",
    lastUpdated: "2026-01-13 15:10",
    price: 16.0,
  },
  {
    id: "12",
    name: "Ground Beef",
    sku: "GRD-002",
    category: "Ground Meats",
    stockProduction: 320,
    storeStocks: { "Store 1": 95, "Store 2": 80 },
    totalStock: 570,
    minStockLevel: 80,
    reorderPoint: 160,
    reorderQuantity: 400,
    unit: "KG",
    lastUpdated: "2026-01-13 15:05",
    price: 17.0,
  },
];

export function InventoryPage({
  currentUser,
}: {
  currentUser: UserData | null;
}) {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showReorderReport, setShowReorderReport] = useState(false);
  const [showEncodeProductModal, setShowEncodeProductModal] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [storeLocations, setStoreLocations] = useState<StoreLocation[]>([]);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [showDeleteProductModal, setShowDeleteProductModal] = useState(false);
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);
  const [deleteProductName, setDeleteProductName] = useState("");

  // Load inventory data from database
  useEffect(() => {
    loadInventoryData();
    loadCategories();
    loadStoreLocations();

    // Auto-refresh inventory every 1 second for real-time updates
    const interval = setInterval(() => {
      loadInventoryData();
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const loadInventoryData = async () => {
    try {
      setLoading(true);
      console.log("Loading inventory data...");
      const [productsData, inventoryData, storesData] = await Promise.all([
        getProducts(),
        getInventory(),
        getStores(),
      ]);

      console.log("Inventory data received:", inventoryData);

      // Combine products with inventory data across all locations
      const inventoryItems = productsData.map((product: APIProduct) => {
        // Find the production/facility inventory (could be "Production" or "Production Facility")
        let productionInv = inventoryData.find(
          (i: InventoryRecord) =>
            i.productId === product.id &&
            (i.location === "Production Facility" ||
              i.location === "Production"),
        );

        // Build store stocks dynamically (excluding production/facility location)
        const storeStocks: { [storeName: string]: number } = {};
        let totalStoreStock = 0;

        storesData.forEach((store: StoreLocation) => {
          // Skip if this store is the production facility
          if (
            store.name === "Production Facility" ||
            store.name === "Production"
          ) {
            return;
          }
          const storeInv = inventoryData.find(
            (i: InventoryRecord) =>
              i.productId === product.id && i.location === store.name,
          );
          const quantity = storeInv?.quantity || 0;
          storeStocks[store.name] = quantity;
          totalStoreStock += quantity;
        });

        const stockProduction = productionInv?.quantity || 0;
        const totalStock = stockProduction + totalStoreStock;

        return {
          id: product.id,
          name: product.name,
          sku: product.sku || `SKU-${product.id}`,
          category: product.category,
          stockProduction,
          storeStocks,
          totalStock,
          minStockLevel: 50,
          reorderPoint: 100,
          reorderQuantity: 200,
          unit: product.unit || "kg",
          lastUpdated: productionInv?.lastUpdated || new Date().toISOString(),
          price: product.price,
        };
      });

      console.log("Processed inventory items:", inventoryItems);
      setInventory(inventoryItems);
    } catch (error) {
      console.error("Error loading inventory:", error);
      toast.error("Failed to load inventory data");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAllProducts = async () => {
    setShowDeleteAllModal(true);
  };

  const handleConfirmDeleteAllProducts = async () => {
    setDeleteError("");
    setDeleteLoading(true);

    try {
      // Verify password by making API call
      const response = await fetch(`${API_BASE_URL}/verify-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: currentUser?.id,
          password: deletePassword,
        }),
      });

      if (!response.ok) {
        setDeleteError("Invalid password. Please try again.");
        setDeleteLoading(false);
        return;
      }

      // Password verified, proceed with deletion
      await deleteAllProducts();
      toast.success("All products deleted successfully");
      setShowDeleteAllModal(false);
      setDeletePassword("");
      await loadInventoryData();
    } catch (error) {
      console.error("Error deleting all products:", error);
      setDeleteError("Failed to delete products. Please try again.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteProduct = async (
    productId: string,
    productName: string,
  ) => {
    setDeleteProductId(productId);
    setDeleteProductName(productName);
    setShowDeleteProductModal(true);
  };

  const handleConfirmDeleteProduct = async () => {
    if (!deleteProductId) return;

    try {
      setLoading(true);
      await deleteProduct(deleteProductId);
      toast.success("Product deleted successfully");
      setShowDeleteProductModal(false);
      setDeleteProductId(null);
      setDeleteProductName("");
      await loadInventoryData();
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Failed to delete product");
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const categoriesData = await getCategories();
      setCategories(categoriesData);
    } catch (error) {
      console.error("Error loading categories:", error);
      toast.error("Failed to load categories");
    }
  };

  const loadStoreLocations = async () => {
    try {
      const storesData = await getStores();
      // Filter out "Production Facility" from store locations since it's shown separately as "Production"
      const filteredStores = storesData.filter(
        (store) =>
          store.name !== "Production Facility" && store.name !== "Production",
      );
      setStoreLocations(filteredStores);
    } catch (error) {
      console.error("Error loading store locations:", error);
      toast.error("Failed to load store locations");
    }
  };

  const filteredInventory = inventory.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || item.category === selectedCategory;
    const matchesLowStock =
      !lowStockOnly || item.totalStock < item.minStockLevel;
    return matchesSearch && matchesCategory && matchesLowStock;
  });

  const lowStockItems = inventory.filter(
    (item) => item.totalStock < item.minStockLevel,
  );
  const reorderItems = inventory.filter((item) => {
    // Check if any store's stock is below reorder point
    return Object.values(item.storeStocks).some(
      (stock) => stock <= item.reorderPoint,
    );
  });
  const totalValue = inventory.reduce((sum, item) => sum + item.totalStock, 0);

  const stockByLocation = inventory.map((item) => {
    const chartData: any = {
      name:
        item.name.length > 15 ? item.name.substring(0, 15) + "..." : item.name,
      Production: item.stockProduction,
    };

    // Add each store's stock dynamically
    storeLocations.forEach((store) => {
      chartData[store.name] = item.storeStocks[store.name] || 0;
    });

    return chartData;
  });

  // Stock Adjustment Function (Bidirectional)
  const handleStockAdjustment = async (adjustment: {
    fromLocation: string;
    toLocation: string;
    quantity: number;
    reason: string;
  }) => {
    if (!selectedItem) return;

    // Check if source has enough stock
    const sourceStock =
      adjustment.fromLocation === "Production"
        ? selectedItem.stockProduction
        : selectedItem.storeStocks[adjustment.fromLocation] || 0;

    if (sourceStock < adjustment.quantity) {
      toast.error(
        `Not enough stock in ${adjustment.fromLocation}! Available: ${sourceStock} ${selectedItem.unit}`,
      );
      return;
    }

    try {
      console.log("Starting transfer:", { sourceStock, adjustment });

      // Deduct from source location
      console.log(
        `Deducting ${adjustment.quantity} from ${adjustment.fromLocation} (current: ${sourceStock})`,
      );
      const deductResult = await updateInventoryQuantity(
        selectedItem.id,
        adjustment.fromLocation,
        sourceStock - adjustment.quantity,
      );
      console.log("Deduct result:", deductResult);

      // Add to destination location
      const destStock =
        adjustment.toLocation === "Production"
          ? selectedItem.stockProduction
          : selectedItem.storeStocks[adjustment.toLocation] || 0;

      console.log(
        `Adding ${adjustment.quantity} to ${adjustment.toLocation} (current: ${destStock})`,
      );
      const addResult = await updateInventoryQuantity(
        selectedItem.id,
        adjustment.toLocation,
        destStock + adjustment.quantity,
      );
      console.log("Add result:", addResult);

      // Create transfer record
      try {
        await createTransfer({
          productId: selectedItem.id,
          from: adjustment.fromLocation,
          to: adjustment.toLocation,
          quantity: adjustment.quantity,
          transferredBy: user?.username || "System",
        });
        console.log("Transfer record created");
      } catch (transferError) {
        console.error(
          "Warning: Transfer record creation failed:",
          transferError,
        );
        // Don't fail the entire operation if transfer record creation fails
      }

      toast.success(
        `Transferred ${adjustment.quantity} ${selectedItem.unit} from ${adjustment.fromLocation} to ${adjustment.toLocation}`,
      );

      // Add a small delay to ensure backend has processed the update
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Reload inventory to reflect changes
      console.log("Reloading inventory data...");
      await loadInventoryData();
      setShowAdjustmentModal(false);
      setSelectedItem(null);
    } catch (error) {
      console.error("Error adjusting stock:", error);
      toast.error("Failed to adjust stock");
    }
  };

  // Update Inventory Item
  const handleUpdateItem = (updatedItem: InventoryItem) => {
    // Calculate total stock dynamically from all stores
    let totalStoreStock = 0;
    Object.values(updatedItem.storeStocks).forEach((stock) => {
      totalStoreStock += stock;
    });

    setInventory(
      inventory.map((item) =>
        item.id === updatedItem.id
          ? {
              ...updatedItem,
              totalStock: updatedItem.stockProduction + totalStoreStock,
              lastUpdated: new Date().toLocaleString(),
            }
          : item,
      ),
    );
    setShowAddProductModal(false);
    setSelectedItem(null);
  };

  // Export to CSV
  const exportToCSV = () => {
    // Build dynamic headers with all store names
    const storeHeaders = storeLocations.map((store) => store.name);
    const headers = [
      "SKU",
      "Product Name",
      "Category",
      "Production",
      ...storeHeaders,
      "Total Stock",
      "Min Level",
      "Reorder Point",
      "Unit",
      "Last Updated",
    ];

    const rows = inventory.map((item) => {
      const storeValues = storeLocations.map(
        (store) => item.storeStocks[store.name] || 0,
      );
      return [
        item.sku,
        item.name,
        item.category,
        item.stockProduction,
        ...storeValues,
        item.totalStock,
        item.minStockLevel,
        item.reorderPoint,
        item.unit,
        item.lastUpdated,
      ];
    });

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inventory-report-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  // Generate Reorder Report
  const generateReorderReport = () => {
    setShowReorderReport(true);
  };

  return (
    <div className="h-full overflow-auto bg-muted/30">
      <div className="container mx-auto p-4 lg:p-6 space-y-4 lg:space-y-6">
        {/* Header Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
          <div className="bg-card rounded-lg p-4 lg:p-6 border border-border">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-primary/10 p-2 lg:p-3 rounded-lg">
                <Package className="w-5 h-5 lg:w-6 lg:h-6 text-primary" />
              </div>
            </div>
            <p className="text-2xl lg:text-3xl text-primary mb-1">
              {inventory.length}
            </p>
            <p className="text-xs lg:text-sm text-muted-foreground">
              Total Products
            </p>
          </div>

          <div className="bg-card rounded-lg p-4 lg:p-6 border border-border">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-green-100 p-2 lg:p-3 rounded-lg">
                <TrendingUp className="w-5 h-5 lg:w-6 lg:h-6 text-green-600" />
              </div>
            </div>
            <p className="text-2xl lg:text-3xl text-green-600 mb-1">
              {totalValue.toLocaleString()}
            </p>
            <p className="text-xs lg:text-sm text-muted-foreground">
              Total Stock Units
            </p>
          </div>

          <div className="bg-card rounded-lg p-4 lg:p-6 border border-border">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-red-100 p-2 lg:p-3 rounded-lg">
                <AlertTriangle className="w-5 h-5 lg:w-6 lg:h-6 text-red-600" />
              </div>
            </div>
            <p className="text-2xl lg:text-3xl text-red-600 mb-1">
              {lowStockItems.length}
            </p>
            <p className="text-xs lg:text-sm text-muted-foreground">
              Low Stock Alerts
            </p>
          </div>

          <div className="bg-card rounded-lg p-4 lg:p-6 border border-border">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-orange-100 p-2 lg:p-3 rounded-lg">
                <RefreshCw className="w-5 h-5 lg:w-6 lg:h-6 text-orange-600" />
              </div>
            </div>
            <p className="text-2xl lg:text-3xl text-orange-600 mb-1">
              {reorderItems.length}
            </p>
            <p className="text-xs lg:text-sm text-muted-foreground">
              Need Reorder
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowEncodeProductModal(true)}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Encode Product
          </button>
          <button
            onClick={() => setShowReorderReport(!showReorderReport)}
            className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            {showReorderReport ? "Hide" : "Show"} Reorder List
          </button>
          <button
            onClick={loadInventoryData}
            className="hidden flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-2 rounded-lg hover:bg-accent transition-colors text-sm"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={handleDeleteAllProducts}
            className="hidden flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
            disabled={loading || currentUser?.role !== "ADMIN"}
            title={
              currentUser?.role !== "ADMIN"
                ? "Only admins can delete all products"
                : ""
            }
          >
            <Trash2 className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Delete All Products
          </button>
        </div>

        {/* Reorder List */}
        {showReorderReport && reorderItems.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 lg:p-6">
            <div className="flex items-center gap-3 mb-4">
              <RefreshCw className="w-6 h-6 text-orange-600" />
              <h3 className="text-orange-900">Items Requiring Reorder</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {reorderItems.map((item) => (
                <div key={item.id} className="bg-background rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        SKU: {item.sku}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        item.totalStock < item.minStockLevel
                          ? "bg-red-100 text-red-700"
                          : "bg-orange-100 text-orange-700"
                      }`}
                    >
                      {item.totalStock < item.minStockLevel
                        ? "CRITICAL"
                        : "LOW"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Current:</p>
                      <p className="text-orange-600 font-medium">
                        {item.totalStock} {item.unit}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Reorder:</p>
                      <p className="text-green-600 font-medium">
                        {item.reorderQuantity} {item.unit}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stock Distribution Chart */}
        <div className="bg-card rounded-lg p-4 lg:p-6 border border-border">
          <h2 className="mb-4">Stock Distribution by Location</h2>
          <div className="overflow-x-auto">
            <ResponsiveContainer width="100%" height={300} minWidth={300}>
              <BarChart
                data={stockByLocation}
                margin={{ top: 20, right: 30, left: 0, bottom: 80 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="Production" fill="#3b82f6" />
                {storeLocations.map((store, index) => (
                  <Bar
                    key={store.id}
                    dataKey={store.name}
                    fill={
                      ["#10b981", "#f59e0b", "#8b5cf6", "#ec4899"][index % 4]
                    }
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Legend below chart */}
          <div className="flex justify-center gap-6 mt-4 pt-4 border-t border-border">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span className="text-sm">Production</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-sm">Main Store</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-amber-500 rounded"></div>
              <span className="text-sm">Branch Store</span>
            </div>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="bg-card rounded-lg border border-border">
          <div className="p-4 lg:p-6 border-b border-border">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by name or SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-muted-foreground" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="All">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-muted-foreground" />
                <label className="text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={lowStockOnly}
                    onChange={(e) => setLowStockOnly(e.target.checked)}
                  />
                  Show Low Stock Only
                </label>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left py-3 px-4 text-sm">SKU</th>
                  <th className="text-left py-3 px-4 text-sm">Product</th>
                  <th className="text-left py-3 px-4 text-sm">Category</th>
                  <th className="text-right py-3 px-4 text-sm">Production</th>
                  {storeLocations.map((store) => (
                    <th key={store.id} className="text-right py-3 px-4 text-sm">
                      {store.name}
                    </th>
                  ))}
                  <th className="text-right py-3 px-4 text-sm">Total</th>
                  <th className="text-left py-3 px-4 text-sm">Status</th>
                  <th className="text-left py-3 px-4 text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.map((item) => {
                  const isLowStock = item.totalStock < item.minStockLevel;
                  const needsReorder = item.totalStock <= item.reorderPoint;
                  return (
                    <tr
                      key={item.id}
                      className="border-b border-border hover:bg-muted/50"
                    >
                      <td className="py-3 px-4 text-sm">{item.sku}</td>
                      <td className="py-3 px-4 text-sm">{item.name}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-xs">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-sm">
                        {item.stockProduction}
                      </td>
                      {storeLocations.map((store) => (
                        <td
                          key={store.id}
                          className="py-3 px-4 text-right text-sm"
                        >
                          {item.storeStocks[store.name] || 0}
                        </td>
                      ))}
                      <td className="py-3 px-4 text-right text-primary font-medium text-sm">
                        {item.totalStock} {item.unit}
                      </td>
                      <td className="py-3 px-4">
                        {isLowStock ? (
                          <span className="flex items-center gap-1 text-red-600 text-xs">
                            <AlertTriangle className="w-4 h-4" />
                            Critical
                          </span>
                        ) : needsReorder ? (
                          <span className="text-orange-600 text-xs">
                            Reorder
                          </span>
                        ) : (
                          <span className="text-green-600 text-xs">Normal</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1">
                          <button
                            onClick={() => {
                              setSelectedItem(item);
                              setShowAdjustmentModal(true);
                            }}
                            className="p-1.5 hover:bg-accent rounded"
                            title="Adjust Stock"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedItem(item);
                              setShowAddProductModal(true);
                            }}
                            className="p-1.5 hover:bg-accent rounded"
                            title="Edit Item"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() =>
                              handleDeleteProduct(item.id, item.name)
                            }
                            className="p-1.5 hover:bg-red-600 rounded"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Alerts */}
        {lowStockItems.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 lg:p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <h3 className="text-red-900">Critical Low Stock Alerts</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {lowStockItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between bg-background rounded p-3"
                >
                  <div>
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      SKU: {item.sku}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-red-600 font-medium">
                      {item.totalStock} {item.unit}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Min: {item.minStockLevel}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Stock Adjustment Modal */}
      {showAdjustmentModal && selectedItem && (
        <StockAdjustmentModal
          item={selectedItem}
          onAdjust={handleStockAdjustment}
          onClose={() => {
            setShowAdjustmentModal(false);
            setSelectedItem(null);
          }}
        />
      )}

      {/* Edit Item Modal */}
      {showAddProductModal && selectedItem && (
        <EditItemModal
          item={selectedItem}
          onSave={handleUpdateItem}
          onClose={() => {
            setShowAddProductModal(false);
            setSelectedItem(null);
          }}
        />
      )}

      {/* Encode Product Modal */}
      {showEncodeProductModal && (
        <EncodeProductModal
          onClose={() => setShowEncodeProductModal(false)}
          onAddProduct={loadInventoryData}
        />
      )}

      {/* Delete All Products Modal */}
      {showDeleteAllModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  Delete All Products
                </h2>
                <p className="text-sm text-muted-foreground">
                  This action cannot be undone
                </p>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-800 font-medium mb-2">⚠️ Warning</p>
              <p className="text-red-700 text-sm">
                You are about to permanently delete ALL products from the
                database. This includes all product data, inventory records, and
                related information.
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-foreground mb-2">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-primary" />
                  Admin Password
                </div>
              </label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => {
                  setDeletePassword(e.target.value);
                  setDeleteError("");
                }}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && deletePassword && !deleteLoading) {
                    handleConfirmDeleteAllProducts();
                  }
                }}
                placeholder="Enter your admin password"
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-foreground placeholder-muted-foreground"
                disabled={deleteLoading}
                autoFocus
              />
              {deleteError && (
                <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  {deleteError}
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowDeleteAllModal(false);
                  setDeletePassword("");
                  setDeleteError("");
                }}
                disabled={deleteLoading}
                className="flex-1 px-4 py-2 rounded-lg bg-muted text-foreground hover:bg-muted/80 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeleteAllProducts}
                disabled={deleteLoading || !deletePassword}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {deleteLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete All Products
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Product Modal */}
      {showDeleteProductModal && deleteProductId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  Delete Product
                </h2>
                <p className="text-sm text-muted-foreground">
                  This action cannot be undone
                </p>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-800 font-medium mb-2">⚠️ Warning</p>
              <p className="text-red-700 text-sm">
                You are about to permanently delete{" "}
                <span className="font-semibold">"{deleteProductName}"</span>{" "}
                from the database. This includes all related inventory records.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowDeleteProductModal(false);
                  setDeleteProductId(null);
                  setDeleteProductName("");
                }}
                disabled={loading}
                className="flex-1 px-4 py-2 rounded-lg bg-muted text-foreground hover:bg-muted/80 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeleteProduct}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete Product
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reorder Report Modal */}
      {showReorderReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <RefreshCw className="w-6 h-6 text-primary" />
                <h2 className="text-xl font-bold">Reorder Report</h2>
              </div>
              <button
                onClick={() => setShowReorderReport(false)}
                className="p-2 hover:bg-accent rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Report Header */}
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Generated</p>
              <p className="font-semibold">{new Date().toLocaleString()}</p>
              <p className="text-sm text-muted-foreground mt-2">
                Items requiring reorder:{" "}
                <span className="font-bold text-primary">
                  {reorderItems.length}
                </span>
              </p>
            </div>

            {/* Report Items */}
            {reorderItems.length > 0 ? (
              <div className="space-y-3">
                {reorderItems.map((item) => {
                  // Find stores with low stock
                  const lowStores = storeLocations.filter(
                    (store) =>
                      (item.storeStocks[store.name] || 0) <= item.reorderPoint,
                  );

                  return (
                    <div
                      key={item.id}
                      className={`p-4 border rounded-lg ${
                        item.totalStock < item.minStockLevel
                          ? "bg-red-50 border-red-300"
                          : "bg-orange-50 border-orange-300"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold text-base">{item.name}</p>
                          <p className="text-xs text-muted-foreground">
                            SKU: {item.sku}
                          </p>
                        </div>
                        <span
                          className={`text-xs font-bold px-2 py-1 rounded ${
                            item.totalStock < item.minStockLevel
                              ? "bg-red-600 text-white"
                              : "bg-orange-600 text-white"
                          }`}
                        >
                          {item.totalStock < item.minStockLevel
                            ? "CRITICAL"
                            : "LOW"}
                        </span>
                      </div>

                      {/* Low Stock Stores - Now at Top */}
                      <div className="mb-3 p-2 bg-white/50 rounded border border-current/20">
                        <p className="text-xs font-semibold text-muted-foreground mb-1">
                          Low Stock Store:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {lowStores.map((store) => (
                            <span
                              key={store.id}
                              className="inline-block bg-orange-200 text-orange-900 text-xs px-2 py-1 rounded font-medium"
                            >
                              {store.name}: {item.storeStocks[store.name] || 0}{" "}
                              {item.unit}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-muted-foreground">Reorder Point</p>
                          <p className="font-semibold">
                            {item.reorderPoint} {item.unit}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Min Level</p>
                          <p className="font-semibold">
                            {item.minStockLevel} {item.unit}
                          </p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-muted-foreground">
                            Recommended Order
                          </p>
                          <p className="font-semibold">
                            {item.reorderQuantity} {item.unit}
                          </p>
                        </div>
                      </div>

                      {/* Transfer Stock Button */}
                      <div className="mt-4">
                        <button
                          onClick={() => {
                            setSelectedItem(item);
                            setShowAdjustmentModal(true);
                          }}
                          className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                        >
                          <RefreshCw className="w-4 h-4" />
                          Transfer Stock
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <TrendingUp className="w-12 h-12 text-green-600 mx-auto mb-2 opacity-50" />
                <p className="text-muted-foreground">
                  No items require reordering
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  All stock levels are healthy
                </p>
              </div>
            )}

            {/* Action Button */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowReorderReport(false)}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Stock Adjustment Modal
function StockAdjustmentModal({
  item,
  onAdjust,
  onClose,
}: {
  item: InventoryItem;
  onAdjust: (adjustment: any) => void;
  onClose: () => void;
}) {
  const [fromLocation, setFromLocation] = useState("Production");
  const [toLocation, setToLocation] = useState("");
  const [quantity, setQuantity] = useState(0);
  const [reason, setReason] = useState("");
  const [stores, setStores] = useState<StoreLocation[]>([]);

  useEffect(() => {
    loadStores();
  }, []);

  const loadStores = async () => {
    try {
      const storesData = await getStores();
      setStores(storesData);
      if (storesData.length > 0 && !toLocation) {
        setToLocation(storesData[0].name);
      }
    } catch (error) {
      console.error("Error loading stores:", error);
      toast.error("Failed to load stores");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity <= 0 || !reason || !toLocation || !fromLocation) {
      toast.error("Please enter quantity, from/to location, and reason");
      return;
    }
    onAdjust({ fromLocation, toLocation, quantity, reason });
  };

  const getAvailableStock = () => {
    if (fromLocation === "Production") {
      return item.stockProduction;
    }
    return item.storeStocks[fromLocation] || 0;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2>Transfer Stock - {item.name}</h2>
          <button onClick={onClose} className="p-2 hover:bg-accent rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Available Stock Info */}
        <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Available in {fromLocation}
              </p>
              <p className="text-xl font-bold text-primary">
                {getAvailableStock()} {item.unit}
              </p>
            </div>
            <Package className="w-8 h-8 text-orange-600" />
          </div>
          {getAvailableStock() === 0 && (
            <p className="text-xs text-red-600 mt-2">
              ⚠️ No stock available in {fromLocation}!
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-2">Transfer From *</label>
            <select
              value={fromLocation}
              onChange={(e) => setFromLocation(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            >
              <option value="Production">Production</option>
              {stores.map((store) => (
                <option key={store.id} value={store.name}>
                  {store.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm mb-2">Transfer to *</label>
            {stores.length > 0 ? (
              <select
                value={toLocation}
                onChange={(e) => setToLocation(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              >
                <option value="">Select Destination</option>
                <option value="Production">Production</option>
                {stores.map((store) => (
                  <option key={store.id} value={store.name}>
                    {store.name} (Current: {item.storeStocks[store.name] || 0}{" "}
                    {item.unit})
                  </option>
                ))}
              </select>
            ) : (
              <div className="text-sm text-muted-foreground p-3 bg-muted rounded-lg">
                No stores available. Please create stores first.
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm mb-2">
              Quantity to Transfer ({item.unit}) *
            </label>
            <input
              type="number"
              min="0"
              step="0.1"
              max={getAvailableStock()}
              value={quantity}
              onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder={`Max: ${getAvailableStock()}`}
              required
            />
            {quantity > getAvailableStock() && (
              <p className="text-xs text-red-600 mt-1">
                ⚠️ Quantity exceeds available {fromLocation} stock!
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm mb-2">Reason for Transfer *</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Store restock, Customer demand, etc."
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary min-h-[80px]"
              required
            />
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-border py-2 rounded-lg hover:bg-accent transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              disabled={
                quantity > getAvailableStock() || getAvailableStock() === 0
              }
            >
              <RefreshCw className="w-4 h-4" />
              Transfer Stock
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Edit Item Modal
function EditItemModal({
  item,
  onSave,
  onClose,
}: {
  item: InventoryItem;
  onSave: (item: InventoryItem) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState(item);
  const [storeLocations, setStoreLocations] = useState<StoreLocation[]>([]);

  useEffect(() => {
    loadStoreLocations();
  }, []);

  const loadStoreLocations = async () => {
    try {
      const storesData = await getStores();
      setStoreLocations(storesData);
    } catch (error) {
      console.error("Error loading store locations:", error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2>Edit Inventory Item</h2>
          <button onClick={onClose} className="p-2 hover:bg-accent rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-2">Product Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
            <div>
              <label className="block text-sm mb-2">SKU</label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) =>
                  setFormData({ ...formData, sku: e.target.value })
                }
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-2">Min Stock Level</label>
              <input
                type="number"
                value={formData.minStockLevel}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    minStockLevel: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm mb-2">Reorder Point</label>
              <input
                type="number"
                value={formData.reorderPoint}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    reorderPoint: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm mb-2">Reorder Quantity</label>
            <input
              type="number"
              value={formData.reorderQuantity}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  reorderQuantity: parseFloat(e.target.value) || 0,
                })
              }
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-border py-2 rounded-lg hover:bg-accent transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2 rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Encode Product Modal
function EncodeProductModal({
  onClose,
  onAddProduct,
}: {
  onClose: () => void;
  onAddProduct: () => void;
}) {
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    unit: "kg",
    price: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [allIngredients, setAllIngredients] = useState<Ingredient[]>([]);
  const [defaultIngredients, setDefaultIngredients] = useState<
    Array<{ ingredientId: string; quantity: string }>
  >([]);

  useEffect(() => {
    loadCategories();
    loadIngredients();
  }, []);

  const loadCategories = async () => {
    try {
      const categoriesData = await getCategories();
      setCategories(categoriesData);
      if (categoriesData.length > 0 && !formData.category) {
        setFormData((prev) => ({ ...prev, category: categoriesData[0].name }));
      }
    } catch (error) {
      console.error("Error loading categories:", error);
      toast.error("Failed to load categories");
    }
  };

  const loadIngredients = async () => {
    try {
      const ingredientsData = await getIngredients();
      setAllIngredients(ingredientsData);
    } catch (error) {
      console.error("Error loading ingredients:", error);
    }
  };

  const addIngredientRow = () => {
    setDefaultIngredients([
      ...defaultIngredients,
      { ingredientId: "", quantity: "" },
    ]);
  };

  const removeIngredientRow = (index: number) => {
    setDefaultIngredients(defaultIngredients.filter((_, i) => i !== index));
  };

  const updateDefaultIngredient = (
    index: number,
    field: "ingredientId" | "quantity",
    value: string,
  ) => {
    const updated = [...defaultIngredients];
    updated[index] = { ...updated[index], [field]: value };
    setDefaultIngredients(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    try {
      setIsSubmitting(true);

      // Check if product name already exists
      const existingProducts = await getProducts();
      const duplicateProduct = existingProducts.find(
        (p: APIProduct) => p.name.toLowerCase() === formData.name.toLowerCase(),
      );

      if (duplicateProduct) {
        toast.error(
          `Product "${formData.name}" already exists in the database!`,
        );
        setIsSubmitting(false);
        return;
      }

      const newProduct = await addProduct({
        name: formData.name,
        category: formData.category,
        unit: formData.unit,
        price: formData.price,
        image: null,
      });

      // Save default ingredients if any were added
      const validIngredients = defaultIngredients.filter(
        (ing) => ing.ingredientId && ing.quantity && parseFloat(ing.quantity) > 0,
      );
      if (validIngredients.length > 0 && newProduct.id) {
        try {
          await saveProductDefaultIngredients(
            String(newProduct.id),
            validIngredients.map((ing) => ({
              ingredientId: ing.ingredientId,
              quantity: parseFloat(ing.quantity),
            })),
          );
        } catch (err) {
          console.error("Error saving default ingredients:", err);
          toast.error("Product created but failed to save default ingredients");
        }
      }

      toast.success(
        `Product "${formData.name}" has been created${validIngredients.length > 0 ? " with default ingredients" : ""}. Add stock via Production or transfer from other locations.`,
      );
      onAddProduct();
      onClose();
    } catch (error) {
      console.error("Error encoding product:", error);
      toast.error("Failed to encode product");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2>Encode New Product</h2>
          <button onClick={onClose} className="p-2 hover:bg-accent rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-2">Product Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              SKU will be automatically generated based on category
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-2">Category</label>
              {categories.length > 0 ? (
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-sm text-muted-foreground p-3 bg-muted rounded-lg">
                  No categories available. Please create categories first.
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm mb-2">Unit</label>
              <select
                value={formData.unit}
                onChange={(e) =>
                  setFormData({ ...formData, unit: e.target.value })
                }
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="kg">kg</option>
                <option value="g">g</option>
                <option value="lb">lb</option>
                <option value="oz">oz</option>
                <option value="unit">unit</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm mb-2">Price (₱)</label>
            <input
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  price: parseFloat(e.target.value) || 0,
                })
              }
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          {/* Default Ingredients Section */}
          <div className="bg-background rounded-lg p-4 border border-border">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-medium">Default Ingredients for Production</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  These ingredients will be auto-loaded when this product is selected for production
                </p>
              </div>
              <button
                type="button"
                onClick={addIngredientRow}
                className="flex items-center gap-1 text-sm bg-primary text-primary-foreground px-3 py-1.5 rounded hover:bg-primary/90"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>

            {defaultIngredients.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-3">
                No default ingredients set. Click "Add" to define ingredients for this product.
              </p>
            ) : (
              <div className="space-y-2">
                {defaultIngredients.map((ing, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <div className="flex-1">
                      <select
                        value={ing.ingredientId}
                        onChange={(e) =>
                          updateDefaultIngredient(index, "ingredientId", e.target.value)
                        }
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                      >
                        <option value="">Select Ingredient</option>
                        {allIngredients.map((ingredient) => (
                          <option key={ingredient.id} value={ingredient.id}>
                            {ingredient.name} ({ingredient.unit})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="w-28">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={ing.quantity}
                        onChange={(e) =>
                          updateDefaultIngredient(index, "quantity", e.target.value)
                        }
                        placeholder="Qty"
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeIngredientRow(index)}
                      className="p-2 hover:bg-red-100 text-red-600 rounded"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-border py-2 rounded-lg hover:bg-accent transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              disabled={isSubmitting}
            >
              <Save className="w-4 h-4" />
              {isSubmitting ? "Encoding..." : "Encode Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
