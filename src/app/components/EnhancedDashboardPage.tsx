import { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  ShoppingCart,
  Factory,
  Users,
  AlertTriangle,
  Activity,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  RefreshCw,
  Bell,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  BoxIcon,
  Tag,
  FileText,
  Download,
  Filter,
  Search,
  Eye,
  ChevronRight,
  Settings,
  PieChart,
  TrendingUpIcon,
  AlertCircle,
  MapPin,
  Plus,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from "recharts";
import { UserRole } from "./LoginPage";
import {
  getProducts,
  getInventory,
  getSales,
  getProductionRecords,
  getTransfers,
  getCategories,
  type Sale,
  type ProductionRecord,
  type TransferRequest,
  type Product,
  type InventoryRecord,
  type Category,
} from "@/utils/api";
import { toast } from "sonner";

interface DashboardPageProps {
  userRole: UserRole;
  userName: string;
  onNavigate?: (page: string) => void;
}

interface ComprehensiveMetrics {
  totalRevenue: number;
  totalOrders: number;
  totalProduction: number;
  lowStockCount: number;
  totalInventoryValue: number;
  avgOrderValue: number;
  pendingTransfers: number;
  completedTransfersToday: number;
  categoriesCount: number;
  productsCount: number;
  totalInventoryKG: number;
  revenueGrowth: number;
  ordersGrowth: number;
  productionGrowth: number;
}

interface AlertItem {
  id: string;
  type: "critical" | "warning" | "info";
  title: string;
  message: string;
  time: string;
  action?: string;
}

const COLORS = [
  "#ef4444",
  "#f87171",
  "#fca5a5",
  "#fb923c",
  "#fbbf24",
  "#a3e635",
];

export function EnhancedDashboardPage({
  userRole,
  userName,
  onNavigate,
}: DashboardPageProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<
    "today" | "week" | "month"
  >("today");
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<ComprehensiveMetrics>({
    totalRevenue: 0,
    totalOrders: 0,
    totalProduction: 0,
    lowStockCount: 0,
    totalInventoryValue: 0,
    avgOrderValue: 0,
    pendingTransfers: 0,
    completedTransfersToday: 0,
    categoriesCount: 0,
    productsCount: 0,
    totalInventoryKG: 0,
    revenueGrowth: 12.5,
    ordersGrowth: 8.2,
    productionGrowth: 5.7,
  });

  const [chartData, setChartData] = useState({
    salesByDay: [] as any[],
    productionByDay: [] as any[],
    categoryDistribution: [] as any[],
    topProducts: [] as any[],
    inventoryByLocation: [] as any[],
    revenueVsProduction: [] as any[],
  });

  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [lowStockDetails, setLowStockDetails] = useState<
    Array<{ name: string; quantity: number; status: "critical" | "warning" }>
  >([]);
  const [recentTransfers, setRecentTransfers] = useState<TransferRequest[]>([]);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);

  useEffect(() => {
    loadComprehensiveData();
  }, [selectedPeriod]);

  const getDateRange = () => {
    const now = new Date();
    let startDate = new Date();

    if (selectedPeriod === "today") {
      startDate.setHours(0, 0, 0, 0);
    } else if (selectedPeriod === "week") {
      startDate.setDate(now.getDate() - 7);
    } else if (selectedPeriod === "month") {
      startDate.setDate(now.getDate() - 30);
    }

    return startDate;
  };

  const filterByDateRange = (items: any[], dateField = "timestamp") => {
    const startDate = getDateRange();
    return items.filter((item) => {
      const itemDate = new Date(item[dateField] || item.date || item.createdAt);
      return itemDate >= startDate;
    });
  };

  const loadComprehensiveData = async () => {
    try {
      setLoading(true);

      const [
        products,
        inventory,
        sales,
        productionRecords,
        transfers,
        categories,
      ] = await Promise.all([
        getProducts(),
        getInventory(),
        getSales(),
        getProductionRecords(),
        getTransfers(),
        getCategories(),
      ]);

      // Filter data by selected period
      const filteredSales = filterByDateRange(sales, "timestamp");
      const filteredProduction = filterByDateRange(
        productionRecords,
        "timestamp",
      );
      const filteredTransfers = filterByDateRange(transfers, "createdAt");

      // Calculate comprehensive metrics
      const totalRevenue = filteredSales.reduce(
        (sum, sale) => sum + (Number(sale.total) || 0),
        0,
      );
      const totalOrders = filteredSales.length;
      const totalProduction = filteredProduction.reduce(
        (sum, record) => sum + record.quantity,
        0,
      );
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Inventory metrics
      const totalInventoryKG = inventory.reduce(
        (sum, inv) => sum + inv.quantity,
        0,
      );
      const totalInventoryValue = inventory.reduce((sum, inv) => {
        const product = products.find((p: Product) => p.id === inv.productId);
        return sum + (product ? inv.quantity * product.price : 0);
      }, 0);

      // Low stock calculation - Per-store basis
      // Default reorder point threshold
      const REORDER_POINT = 100;

      // Group inventory by productId to check per-store status
      const inventoryByProductAndLocation = new Map<
        string,
        { [location: string]: number }
      >();
      inventory.forEach((inv: InventoryRecord) => {
        if (!inventoryByProductAndLocation.has(inv.productId)) {
          inventoryByProductAndLocation.set(inv.productId, {});
        }
        inventoryByProductAndLocation.get(inv.productId)![inv.location] =
          inv.quantity;
      });

      // Count products where any non-production location has stock below reorder point
      let lowStockCount = 0;
      inventoryByProductAndLocation.forEach((locations) => {
        const hasLowStock = Object.entries(locations).some(
          ([location, quantity]) => {
            // Skip production facilities
            if (
              location === "Production" ||
              location === "Production Facility"
            ) {
              return false;
            }
            return quantity <= REORDER_POINT;
          },
        );
        if (hasLowStock) {
          lowStockCount++;
        }
      });

      // Create inventoryByProduct map for alert generation (total across all locations)
      const inventoryByProduct = new Map<string, number>();
      inventory.forEach((inv: InventoryRecord) => {
        const current = inventoryByProduct.get(inv.productId) || 0;
        inventoryByProduct.set(inv.productId, current + inv.quantity);
      });

      // Transfer metrics
      const pendingTransfers = filteredTransfers.filter(
        (t: TransferRequest) => t.status === "in-transit",
      ).length;
      const today = new Date().toISOString().split("T")[0];
      const completedTransfersToday = filteredTransfers.filter(
        (t: TransferRequest) =>
          t.status === "completed" &&
          new Date(t.updatedAt || t.createdAt).toISOString().split("T")[0] ===
            today,
      ).length;

      setMetrics({
        totalRevenue,
        totalOrders,
        totalProduction,
        lowStockCount,
        totalInventoryValue,
        avgOrderValue,
        pendingTransfers,
        completedTransfersToday,
        categoriesCount: categories.length,
        productsCount: products.length,
        totalInventoryKG,
        revenueGrowth: 12.5,
        ordersGrowth: 8.2,
        productionGrowth: 5.7,
      });

      // Generate chart data
      setChartData({
        salesByDay: generateSalesByDay(filteredSales, selectedPeriod),
        productionByDay: generateProductionByDay(
          filteredProduction,
          selectedPeriod,
        ),
        categoryDistribution: generateCategoryDistribution(
          products,
          filteredSales,
        ),
        topProducts: generateTopProducts(products, filteredSales),
        inventoryByLocation: generateInventoryByLocation(inventory),
        revenueVsProduction: generateRevenueVsProduction(
          filteredSales,
          filteredProduction,
        ),
      });

      // Generate alerts
      setAlerts(
        generateAlerts(
          inventory,
          filteredTransfers,
          products,
          inventoryByProduct,
        ),
      );

      // Generate recent activity
      setRecentActivity(
        generateRecentActivity(
          filteredSales,
          filteredProduction,
          filteredTransfers,
          inventory,
        ),
      );

      // Generate low stock details
      setLowStockDetails(generateLowStockDetails(products, inventoryByProduct));

      // Generate recent transfers
      setRecentTransfers(filteredTransfers.slice(-5).reverse());

      // Generate recent sales - show last 10 sales from all stores
      const sortedSales = [...filteredSales].sort((a, b) => {
        const dateA = new Date(a.timestamp || a.date).getTime();
        const dateB = new Date(b.timestamp || b.date).getTime();
        return dateB - dateA; // Most recent first
      });
      setRecentSales(sortedSales.slice(0, 10));
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const generateSalesByDay = (
    sales: Sale[],
    period: "today" | "week" | "month",
  ) => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    let daysCount = 7;

    if (period === "today") {
      daysCount = 1;
    } else if (period === "week") {
      daysCount = 7;
    } else if (period === "month") {
      daysCount = 30;
    }

    const last7Days = Array.from({ length: daysCount }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (daysCount - 1 - i));
      return {
        name:
          daysCount === 1
            ? "Today"
            : daysCount === 7
              ? days[date.getDay()]
              : date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                }),
        date: date.toISOString().split("T")[0],
        sales: 0,
        orders: 0,
        revenue: 0,
      };
    });

    sales.forEach((sale) => {
      const saleDate = new Date(sale.timestamp || sale.date)
        .toISOString()
        .split("T")[0];
      const dayData = last7Days.find((d) => d.date === saleDate);
      if (dayData) {
        dayData.revenue += sale.total;
        dayData.orders += 1;
      }
    });

    return last7Days.map(({ name, revenue, orders }) => ({
      name,
      revenue,
      orders,
    }));
  };

  const generateProductionByDay = (
    records: ProductionRecord[],
    period: "today" | "week" | "month",
  ) => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    let daysCount = 7;

    if (period === "today") {
      daysCount = 1;
    } else if (period === "week") {
      daysCount = 7;
    } else if (period === "month") {
      daysCount = 30;
    }

    const last7Days = Array.from({ length: daysCount }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (daysCount - 1 - i));
      return {
        name:
          daysCount === 1
            ? "Today"
            : daysCount === 7
              ? days[date.getDay()]
              : date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                }),
        date: date.toISOString().split("T")[0],
        produced: 0,
      };
    });

    records.forEach((record) => {
      const recordDate = new Date(record.timestamp).toISOString().split("T")[0];
      const dayData = last7Days.find((d) => d.date === recordDate);
      if (dayData) {
        dayData.produced += record.quantity;
      }
    });

    return last7Days;
  };

  const generateCategoryDistribution = (products: Product[], sales: Sale[]) => {
    const categoryMap = new Map<string, number>();

    sales.forEach((sale) => {
      if (sale.items && Array.isArray(sale.items)) {
        sale.items.forEach((item) => {
          const product = products.find((p) => p.id === item.productId);
          if (product) {
            const current = categoryMap.get(product.category) || 0;
            categoryMap.set(
              product.category,
              current + item.quantity * item.price,
            );
          }
        });
      }
    });

    return Array.from(categoryMap.entries()).map(([name, value], index) => ({
      name,
      value: Math.round(value),
      color: COLORS[index % COLORS.length],
    }));
  };

  const generateTopProducts = (products: Product[], sales: Sale[]) => {
    const productMap = new Map<string, { sold: number; revenue: number }>();

    sales.forEach((sale) => {
      if (sale.items && Array.isArray(sale.items)) {
        sale.items.forEach((item) => {
          const current = productMap.get(item.productId) || {
            sold: 0,
            revenue: 0,
          };
          productMap.set(item.productId, {
            sold: current.sold + item.quantity,
            revenue: current.revenue + item.quantity * item.price,
          });
        });
      }
    });

    const topProductsData = Array.from(productMap.entries())
      .map(([productId, data]) => {
        const product = products.find((p) => p.id === productId);
        return product
          ? {
              name: product.name,
              sold: data.sold,
              revenue: data.revenue,
            }
          : null;
      })
      .filter(Boolean)
      .sort((a, b) => (b?.revenue || 0) - (a?.revenue || 0))
      .slice(0, 5);

    return topProductsData;
  };

  const generateInventoryByLocation = (inventory: InventoryRecord[]) => {
    const locationMap = new Map<string, number>();

    inventory.forEach((inv) => {
      const current = locationMap.get(inv.location) || 0;
      locationMap.set(inv.location, current + inv.quantity);
    });

    return Array.from(locationMap.entries()).map(([name, stock]) => ({
      name,
      stock,
    }));
  };

  const generateRevenueVsProduction = (
    sales: Sale[],
    productionRecords: ProductionRecord[],
  ) => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return {
        name: days[date.getDay()],
        date: date.toISOString().split("T")[0],
        revenue: 0,
        production: 0,
      };
    });

    sales.forEach((sale) => {
      const saleDate = new Date(sale.timestamp || sale.date)
        .toISOString()
        .split("T")[0];
      const dayData = last7Days.find((d) => d.date === saleDate);
      if (dayData) dayData.revenue += sale.total;
    });

    productionRecords.forEach((record) => {
      const recordDate = new Date(record.timestamp).toISOString().split("T")[0];
      const dayData = last7Days.find((d) => d.date === recordDate);
      if (dayData) dayData.production += record.quantity * 10; // Scale for visibility
    });

    return last7Days;
  };

  const generateAlerts = (
    inventory: InventoryRecord[],
    transfers: TransferRequest[],
    products: Product[],
    inventoryByProduct: Map<string, number>,
  ): AlertItem[] => {
    const alerts: AlertItem[] = [];

    // Critical stock alerts
    inventoryByProduct.forEach((qty, productId) => {
      if (qty < 20) {
        const product = products.find((p) => p.id === productId);
        if (product) {
          alerts.push({
            id: `critical-${productId}`,
            type: "critical",
            title: "Critical Stock Level",
            message: `${product.name} has only ${qty} KG remaining`,
            time: "Now",
            action: "Reorder Now",
          });
        }
      } else if (qty < 50) {
        const product = products.find((p) => p.id === productId);
        if (product) {
          alerts.push({
            id: `warning-${productId}`,
            type: "warning",
            title: "Low Stock Warning",
            message: `${product.name} stock is running low (${qty} KG)`,
            time: "5 min ago",
          });
        }
      }
    });

    // In transit transfer alerts
    const pendingTransfers = transfers.filter((t) => t.status === "in-transit");
    if (pendingTransfers.length > 0) {
      alerts.push({
        id: "pending-transfers",
        type: "info",
        title: "In Transit Transfers",
        message: `${pendingTransfers.length} transfer(s) awaiting receipt`,
        time: "10 min ago",
        action: "Review",
      });
    }

    return alerts.slice(0, 5);
  };

  const generateRecentActivity = (
    sales: Sale[],
    productionRecords: ProductionRecord[],
    transfers: TransferRequest[],
    inventory: InventoryRecord[],
  ) => {
    const activities: any[] = [];

    sales
      .slice(-3)
      .reverse()
      .forEach((sale) => {
        activities.push({
          type: "sale",
          message: `New sale: ₱${sale.total.toLocaleString()}`,
          detail: `${sale.items.length} items sold`,
          time: formatTimeAgo(new Date(sale.timestamp || sale.date)),
          icon: ShoppingCart,
          color: "text-green-600",
          bgColor: "bg-green-50",
          timestamp: new Date(sale.timestamp || sale.date).getTime(),
        });
      });

    productionRecords
      .slice(-2)
      .reverse()
      .forEach((record) => {
        activities.push({
          type: "production",
          message: `Production completed`,
          detail: `${record.quantity} KG ${record.productName}`,
          time: formatTimeAgo(new Date(record.timestamp)),
          icon: Factory,
          color: "text-blue-600",
          bgColor: "bg-blue-50",
          timestamp: new Date(record.timestamp).getTime(),
        });
      });

    transfers
      .filter((t) => t.status === "completed")
      .slice(-2)
      .reverse()
      .forEach((transfer) => {
        activities.push({
          type: "transfer",
          message: `Transfer completed`,
          detail: `${transfer.quantity} KG ${transfer.productName} to ${transfer.to}`,
          time: formatTimeAgo(
            new Date(transfer.updatedAt || transfer.createdAt),
          ),
          icon: Truck,
          color: "text-purple-600",
          bgColor: "bg-purple-50",
          timestamp: new Date(
            transfer.updatedAt || transfer.createdAt,
          ).getTime(),
        });
      });

    return activities.sort((a, b) => b.timestamp - a.timestamp).slice(0, 8);
  };

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const generateLowStockDetails = (
    products: Product[],
    inventoryByProduct: Map<string, number>,
  ) => {
    const lowStockDetails: Array<{
      name: string;
      quantity: number;
      status: "critical" | "warning";
    }> = [];

    inventoryByProduct.forEach((qty, productId) => {
      const product = products.find((p) => p.id === productId);
      if (product) {
        if (qty < 20) {
          lowStockDetails.push({
            name: product.name,
            quantity: qty,
            status: "critical",
          });
        } else if (qty < 50) {
          lowStockDetails.push({
            name: product.name,
            quantity: qty,
            status: "warning",
          });
        }
      }
    });

    return lowStockDetails;
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-muted/30">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto bg-muted/30">
      <div className="container mx-auto p-4 lg:p-6 space-y-6">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl mb-1">
              {getGreeting()}, {userName}! 👋
            </h1>
            <p className="text-sm lg:text-base text-muted-foreground">
              Here's what's happening with your inventory system today
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadComprehensiveData}
              className="flex items-center gap-2 bg-card border border-border text-foreground px-4 py-2 rounded-lg hover:bg-muted transition-colors text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <div className="flex items-center gap-2 bg-card border border-border rounded-lg overflow-hidden">
              {["today", "week", "month"].map((period) => (
                <button
                  key={period}
                  onClick={() => setSelectedPeriod(period as any)}
                  className={`px-3 py-2 text-sm transition-colors ${
                    selectedPeriod === period
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                >
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Revenue"
            value={`₱${(Math.round((Number(metrics.totalRevenue) || 0) * 100) / 100).toFixed(2)}`}
            change={`+${metrics.revenueGrowth}%`}
            trend="up"
            icon={DollarSign}
            bgColor="bg-green-50"
            iconColor="text-green-600"
          />
          <MetricCard
            title="Total Orders"
            value={metrics.totalOrders.toString()}
            change={`+${metrics.ordersGrowth}%`}
            trend="up"
            icon={ShoppingCart}
            bgColor="bg-blue-50"
            iconColor="text-blue-600"
          />
          <MetricCard
            title="Production Output"
            value={`${metrics.totalProduction} KG`}
            change={`+${metrics.productionGrowth}%`}
            trend="up"
            icon={Factory}
            bgColor="bg-purple-50"
            iconColor="text-purple-600"
          />
          <MetricCard
            title="Low Stock Items"
            value={metrics.lowStockCount.toString()}
            change={metrics.lowStockCount > 5 ? "High" : "Normal"}
            trend={metrics.lowStockCount > 5 ? "up" : "down"}
            icon={AlertTriangle}
            bgColor="bg-orange-50"
            iconColor="text-orange-600"
          />
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card rounded-lg p-4 border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                Inventory Value
              </span>
              <Package className="w-4 h-4 text-primary" />
            </div>
            <p className="text-2xl font-semibold">
              ₱{metrics.totalInventoryValue.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.totalInventoryKG} KG total
            </p>
          </div>

          <div className="bg-card rounded-lg p-4 border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                Avg Order Value
              </span>
              <TrendingUpIcon className="w-4 h-4 text-primary" />
            </div>
            <p className="text-2xl font-semibold">
              ₱{metrics.avgOrderValue.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Per transaction
            </p>
          </div>

          <div className="bg-card rounded-lg p-4 border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                In Transit Transfers
              </span>
              <Truck className="w-4 h-4 text-primary" />
            </div>
            <p className="text-2xl font-semibold">{metrics.pendingTransfers}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.completedTransfersToday} completed today
            </p>
          </div>

          <div className="bg-card rounded-lg p-4 border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                Product Catalog
              </span>
              <Tag className="w-4 h-4 text-primary" />
            </div>
            <p className="text-2xl font-semibold">{metrics.productsCount}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.categoriesCount} categories
            </p>
          </div>
        </div>

        {/* Alerts Section */}
        {alerts.length > 0 && (
          <div className="bg-card rounded-lg p-6 border border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                Active Alerts
              </h2>
              <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">
                {alerts.filter((a) => a.type === "critical").length} Critical
              </span>
            </div>
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-lg border-l-4 ${
                    alert.type === "critical"
                      ? "bg-red-50 border-red-500"
                      : alert.type === "warning"
                        ? "bg-orange-50 border-orange-500"
                        : "bg-blue-50 border-blue-500"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {alert.type === "critical" ? (
                          <XCircle className="w-4 h-4 text-red-600" />
                        ) : alert.type === "warning" ? (
                          <AlertCircle className="w-4 h-4 text-orange-600" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-blue-600" />
                        )}
                        <h4 className="text-sm font-semibold">{alert.title}</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {alert.message}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {alert.time}
                      </span>
                      {alert.action && (
                        <button className="text-xs bg-primary text-primary-foreground px-3 py-1 rounded hover:bg-primary/90">
                          {alert.action}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sales & Orders Trend */}
          <div className="bg-card rounded-lg p-6 border border-border">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Sales & Orders Trend
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={chartData.salesByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6b7280" />
                <YAxis yAxisId="left" stroke="#6b7280" />
                <YAxis yAxisId="right" orientation="right" stroke="#6b7280" />
                <Tooltip />
                <Legend />
                <Bar
                  yAxisId="left"
                  dataKey="orders"
                  fill="#3b82f6"
                  name="Orders"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="revenue"
                  stroke="#ef4444"
                  strokeWidth={2}
                  name="Revenue (₱)"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Category Distribution */}
          <div className="bg-card rounded-lg p-6 border border-border">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-primary" />
              Sales by Category
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={chartData.categoryDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) =>
                    `${name}: ₱${value.toLocaleString()}`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.categoryDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>

          {/* Production Trend */}
          <div className="bg-card rounded-lg p-6 border border-border">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Factory className="w-5 h-5 text-primary" />
              Production Output
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData.productionByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="produced"
                  stroke="#8b5cf6"
                  fill="#c4b5fd"
                  name="Produced (KG)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Inventory by Location */}
          <div className="bg-card rounded-lg p-6 border border-border">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Inventory by Location
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.inventoryByLocation} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" stroke="#6b7280" />
                <YAxis dataKey="name" type="category" stroke="#6b7280" />
                <Tooltip />
                <Bar dataKey="stock" fill="#10b981" name="Stock (KG)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Products */}
          <div className="bg-card rounded-lg p-6 border border-border">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Top Performing Products
            </h3>
            <div className="space-y-3">
              {chartData.topProducts.map((product, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-semibold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{product?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {product?.sold} KG sold
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm text-green-600">
                      ₱{product?.revenue.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-card rounded-lg p-6 border border-border">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Recent Activity
            </h3>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {recentActivity.map((activity, index) => {
                const Icon = activity.icon;
                return (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className={`p-2 rounded-lg ${activity.bgColor}`}>
                      <Icon className={`w-4 h-4 ${activity.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{activity.message}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {activity.detail}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {activity.time}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Quick Actions - Only for Admin */}
        {userRole === "ADMIN" && (
          <div className="bg-card rounded-lg p-6 border border-border">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button
                onClick={() => onNavigate?.("pos")}
                className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border hover:bg-primary hover:text-primary-foreground transition-colors group"
              >
                <Plus className="w-6 h-6" />
                <span className="text-sm font-medium">New Sale</span>
              </button>
              <button
                onClick={() => onNavigate?.("production")}
                className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border hover:bg-primary hover:text-primary-foreground transition-colors group"
              >
                <Factory className="w-6 h-6" />
                <span className="text-sm font-medium">Record Production</span>
              </button>
              <button
                onClick={() => onNavigate?.("transfer")}
                className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border hover:bg-primary hover:text-primary-foreground transition-colors group"
              >
                <Truck className="w-6 h-6" />
                <span className="text-sm font-medium">Create Transfer</span>
              </button>
              <button
                onClick={() => onNavigate?.("inventory")}
                className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border hover:bg-primary hover:text-primary-foreground transition-colors group"
              >
                <FileText className="w-6 h-6" />
                <span className="text-sm font-medium">View Inventory</span>
              </button>
            </div>
          </div>
        )}

        {/* Transfer History */}
        <div className="bg-card rounded-lg border border-border">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Truck className="w-5 h-5 text-primary" />
              Recent Transfer History
            </h3>
            <button
              onClick={() => onNavigate?.("transfer")}
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              View All
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium">
                    Transfer ID
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium">
                    Product
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium">
                    From
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium">
                    To
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium">
                    Quantity
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentTransfers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-12 text-center text-muted-foreground"
                    >
                      <Truck className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No transfer records found</p>
                    </td>
                  </tr>
                ) : (
                  recentTransfers.map((transfer) => (
                    <tr
                      key={transfer.id}
                      className="border-b border-border hover:bg-muted/50"
                    >
                      <td className="py-3 px-4 text-sm font-mono text-muted-foreground">
                        #{String(transfer.id).padStart(4, "0")}
                      </td>
                      <td className="py-3 px-4 text-sm font-medium">
                        {transfer.productName}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          {transfer.from}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          {transfer.to}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm font-medium">
                        {transfer.quantity} KG
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            transfer.status === "completed"
                              ? "bg-green-100 text-green-700"
                              : transfer.status === "pending"
                                ? "bg-yellow-100 text-yellow-700"
                                : transfer.status === "in-transit"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-red-100 text-red-700"
                          }`}
                        >
                          {transfer.status.charAt(0).toUpperCase() +
                            transfer.status.slice(1).replace("-", " ")}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {new Date(transfer.createdAt).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          },
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Sales */}
        <div className="bg-card rounded-lg border border-border">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-primary" />
              Recent Sales
            </h3>
            <button
              onClick={() => onNavigate?.("sales")}
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              View All
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium">
                    Transaction ID
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium">
                    Date & Time
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium">
                    Store Location
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium">
                    Items
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium">
                    Payment Method
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium">
                    Total Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentSales.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-12 text-center text-muted-foreground"
                    >
                      <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No sales records found</p>
                    </td>
                  </tr>
                ) : (
                  recentSales.map((sale) => (
                    <tr
                      key={sale.id || sale.transactionId}
                      className="border-b border-border hover:bg-muted/50"
                    >
                      <td className="py-3 px-4 text-sm font-mono text-muted-foreground">
                        {sale.transactionId}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {new Date(sale.timestamp || sale.date).toLocaleString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          {sale.location || "Main Store"}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {sale.items && Array.isArray(sale.items)
                              ? sale.items.length
                              : 0}{" "}
                            items
                          </span>
                          <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                            {sale.items && Array.isArray(sale.items)
                              ? sale.items.map((item) => item.name).join(", ")
                              : "N/A"}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            sale.paymentMethod === "Cash"
                              ? "bg-green-100 text-green-700"
                              : sale.paymentMethod === "Card"
                                ? "bg-blue-100 text-blue-700"
                                : sale.paymentMethod === "GCash"
                                  ? "bg-purple-100 text-purple-700"
                                  : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {sale.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm font-semibold text-green-600">
                        ₱{sale.total.toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  change,
  trend,
  icon: Icon,
  bgColor,
  iconColor,
}: {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down";
  icon: any;
  bgColor: string;
  iconColor: string;
}) {
  return (
    <div className="bg-card rounded-lg p-6 border border-border">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-muted-foreground">{title}</span>
        <div className={`p-3 rounded-lg ${bgColor}`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-2xl lg:text-3xl font-semibold">{value}</p>
        <div className="flex items-center gap-1">
          {trend === "up" ? (
            <ArrowUpRight className="w-4 h-4 text-green-600" />
          ) : (
            <ArrowDownRight className="w-4 h-4 text-green-600" />
          )}
          <span className="text-sm text-green-600 font-medium">{change}</span>
          <span className="text-xs text-muted-foreground">
            from last period
          </span>
        </div>
      </div>
    </div>
  );
}
