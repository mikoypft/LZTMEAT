import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Package, ShoppingCart, Factory, Users, AlertTriangle, Activity, Calendar, ArrowUpRight, ArrowDownRight, BarChart3, RefreshCw } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { UserRole } from './LoginPage';
import { getProducts, getInventory, getSales, getProductionRecords, getTransfers, type Sale, type ProductionRecord, type TransferRequest, type Product, type InventoryRecord } from '@/utils/api';
import { toast } from 'sonner';

interface DashboardPageProps {
  userRole: UserRole;
  userName: string;
}

interface DashboardData {
  totalRevenue: number;
  totalOrders: number;
  totalProduction: number;
  lowStockCount: number;
  salesByDay: { name: string; sales: number; orders: number }[];
  productionByDay: { name: string; produced: number }[];
  categoryData: { name: string; value: number; color: string }[];
  topProducts: { name: string; sold: number; revenue: number; trend: 'up' | 'down'; change: number }[];
  recentActivity: { type: string; message: string; time: string; icon: any; color: string }[];
  inventoryTrend: { name: string; stock: number }[];
}

const COLORS = ['#ef4444', '#f87171', '#fca5a5', '#fecaca', '#fee2e2', '#fef2f2'];

export function DashboardPage({ userRole, userName }: DashboardPageProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('week');
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalRevenue: 0,
    totalOrders: 0,
    totalProduction: 0,
    lowStockCount: 0,
    salesByDay: [],
    productionByDay: [],
    categoryData: [],
    topProducts: [],
    recentActivity: [],
    inventoryTrend: []
  });

  useEffect(() => {
    loadDashboardData();
  }, [selectedPeriod]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [products, inventory, sales, productionRecords, transfers] = await Promise.all([
        getProducts(),
        getInventory(),
        getSales(),
        getProductionRecords(),
        getTransfers()
      ]);

      // Calculate total revenue and orders
      const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
      const totalOrders = sales.length;

      // Calculate total production
      const totalProduction = productionRecords.reduce((sum, record) => sum + record.quantity, 0);

      // Calculate low stock items
      const MIN_STOCK_THRESHOLD = 50;
      const inventoryByProduct = new Map<string, number>();
      inventory.forEach((inv: InventoryRecord) => {
        const current = inventoryByProduct.get(inv.productId) || 0;
        inventoryByProduct.set(inv.productId, current + inv.quantity);
      });
      const lowStockCount = Array.from(inventoryByProduct.values()).filter(qty => qty < MIN_STOCK_THRESHOLD).length;

      // Sales by day (last 7 days)
      const salesByDay = getLast7DaysData(sales);

      // Production by day (last 7 days)
      const productionByDay = getLast7DaysProduction(productionRecords);

      // Category distribution
      const categoryData = getCategoryDistribution(products, sales);

      // Top products
      const topProducts = getTopProducts(products, sales);

      // Recent activity
      const recentActivity = getRecentActivity(sales, productionRecords, transfers, inventory);

      // Inventory trend (last 4 weeks) - simplified for now
      const inventoryTrend = [
        { name: 'Week 1', stock: Math.floor(inventory.reduce((sum, inv) => sum + inv.quantity, 0) * 0.85) },
        { name: 'Week 2', stock: Math.floor(inventory.reduce((sum, inv) => sum + inv.quantity, 0) * 0.92) },
        { name: 'Week 3', stock: Math.floor(inventory.reduce((sum, inv) => sum + inv.quantity, 0) * 0.88) },
        { name: 'Week 4', stock: inventory.reduce((sum, inv) => sum + inv.quantity, 0) }
      ];

      setDashboardData({
        totalRevenue,
        totalOrders,
        totalProduction,
        lowStockCount,
        salesByDay,
        productionByDay,
        categoryData,
        topProducts,
        recentActivity,
        inventoryTrend
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getLast7DaysData = (sales: Sale[]) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return {
        name: days[date.getDay()],
        date: date.toISOString().split('T')[0],
        sales: 0,
        orders: 0
      };
    });

    sales.forEach(sale => {
      const saleDate = new Date(sale.timestamp || sale.date).toISOString().split('T')[0];
      const dayData = last7Days.find(d => d.date === saleDate);
      if (dayData) {
        dayData.sales += sale.total;
        dayData.orders += 1;
      }
    });

    return last7Days.map(({ name, sales, orders }) => ({ name, sales, orders }));
  };

  const getLast7DaysProduction = (records: ProductionRecord[]) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return {
        name: days[date.getDay()],
        date: date.toISOString().split('T')[0],
        produced: 0
      };
    });

    records.forEach(record => {
      const recordDate = new Date(record.timestamp).toISOString().split('T')[0];
      const dayData = last7Days.find(d => d.date === recordDate);
      if (dayData) {
        dayData.produced += record.quantity;
      }
    });

    return last7Days.map(({ name, produced }) => ({ name, produced }));
  };

  const getCategoryDistribution = (products: Product[], sales: Sale[]) => {
    const categoryMap = new Map<string, number>();
    
    sales.forEach(sale => {
      sale.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          const current = categoryMap.get(product.category) || 0;
          categoryMap.set(product.category, current + (item.quantity * item.price));
        }
      });
    });

    const entries = Array.from(categoryMap.entries());
    const total = entries.reduce((sum, [_, value]) => sum + value, 0);

    return entries.map(([category, value], index) => ({
      name: category,
      value: total > 0 ? Math.round((value / total) * 100) : 0,
      color: COLORS[index % COLORS.length]
    }));
  };

  const getTopProducts = (products: Product[], sales: Sale[]) => {
    const productMap = new Map<string, { sold: number; revenue: number }>();

    sales.forEach(sale => {
      sale.items.forEach(item => {
        const current = productMap.get(item.productId) || { sold: 0, revenue: 0 };
        productMap.set(item.productId, {
          sold: current.sold + item.quantity,
          revenue: current.revenue + (item.quantity * item.price)
        });
      });
    });

    const topProductsData = Array.from(productMap.entries())
      .map(([productId, data]) => {
        const product = products.find(p => p.id === productId);
        return {
          name: product?.name || 'Unknown Product',
          sold: data.sold,
          revenue: data.revenue,
          trend: Math.random() > 0.3 ? 'up' as const : 'down' as const,
          change: Math.floor(Math.random() * 20) * (Math.random() > 0.3 ? 1 : -1)
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return topProductsData;
  };

  const getRecentActivity = (
    sales: Sale[], 
    productionRecords: ProductionRecord[], 
    transfers: TransferRequest[],
    inventory: InventoryRecord[]
  ) => {
    const activities: any[] = [];

    // Recent sales
    sales.slice(-3).reverse().forEach(sale => {
      activities.push({
        type: 'sale',
        message: `New sale: ₱${sale.total.toLocaleString()}`,
        time: formatTimeAgo(new Date(sale.timestamp || sale.date)),
        icon: ShoppingCart,
        color: 'text-green-600',
        timestamp: new Date(sale.timestamp || sale.date).getTime()
      });
    });

    // Recent production
    productionRecords.slice(-2).reverse().forEach(record => {
      activities.push({
        type: 'production',
        message: `Production completed: ${record.quantity} KG ${record.productName}`,
        time: formatTimeAgo(new Date(record.timestamp)),
        icon: Factory,
        color: 'text-blue-600',
        timestamp: new Date(record.timestamp).getTime()
      });
    });

    // Recent transfers
    transfers.filter(t => t.status === 'Completed').slice(-2).reverse().forEach(transfer => {
      activities.push({
        type: 'transfer',
        message: `Transfer to ${transfer.to} completed: ${transfer.quantity} KG ${transfer.productName}`,
        time: formatTimeAgo(new Date(transfer.updatedAt || transfer.createdAt)),
        icon: Package,
        color: 'text-purple-600',
        timestamp: new Date(transfer.updatedAt || transfer.createdAt).getTime()
      });
    });

    // Low stock alerts
    const MIN_STOCK = 50;
    const inventoryByProduct = new Map<string, number>();
    inventory.forEach(inv => {
      const current = inventoryByProduct.get(inv.productId) || 0;
      inventoryByProduct.set(inv.productId, current + inv.quantity);
    });

    inventoryByProduct.forEach((qty, productId) => {
      if (qty < MIN_STOCK) {
        const inv = inventory.find(i => i.productId === productId);
        if (inv) {
          activities.push({
            type: 'alert',
            message: `Low stock alert (${qty} KG)`,
            time: formatTimeAgo(new Date(inv.lastUpdated)),
            icon: AlertTriangle,
            color: 'text-orange-600',
            timestamp: new Date(inv.lastUpdated).getTime()
          });
        }
      }
    });

    return activities.sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);
  };

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getRoleSpecificMetrics = () => {
    const avgOrderValue = dashboardData.totalOrders > 0 
      ? dashboardData.totalRevenue / dashboardData.totalOrders 
      : 0;

    switch (userRole) {
      case 'ADMIN':
        return [
          {
            title: 'Total Revenue',
            value: `₱${dashboardData.totalRevenue.toLocaleString()}`,
            change: '+12.5%',
            trend: 'up',
            icon: DollarSign,
            bgColor: 'bg-green-50',
            iconColor: 'text-green-600',
          },
          {
            title: 'Total Orders',
            value: dashboardData.totalOrders.toString(),
            change: '+8.2%',
            trend: 'up',
            icon: ShoppingCart,
            bgColor: 'bg-blue-50',
            iconColor: 'text-blue-600',
          },
          {
            title: 'Production Output',
            value: `${dashboardData.totalProduction} KG`,
            change: '+5.7%',
            trend: 'up',
            icon: Factory,
            bgColor: 'bg-purple-50',
            iconColor: 'text-purple-600',
          },
          {
            title: 'Low Stock Items',
            value: dashboardData.lowStockCount.toString(),
            change: '-2',
            trend: 'down',
            icon: AlertTriangle,
            bgColor: 'bg-orange-50',
            iconColor: 'text-orange-600',
          },
        ];
      case 'STORE':
        return [
          {
            title: 'Store Sales',
            value: `₱${(dashboardData.totalRevenue * 0.4).toLocaleString()}`,
            change: '+15.3%',
            trend: 'up',
            icon: DollarSign,
            bgColor: 'bg-green-50',
            iconColor: 'text-green-600',
          },
          {
            title: 'Orders Today',
            value: dashboardData.totalOrders.toString(),
            change: '+6',
            trend: 'up',
            icon: ShoppingCart,
            bgColor: 'bg-blue-50',
            iconColor: 'text-blue-600',
          },
          {
            title: 'Avg Order Value',
            value: `₱${avgOrderValue.toFixed(2)}`,
            change: '+4.2%',
            trend: 'up',
            icon: TrendingUp,
            bgColor: 'bg-purple-50',
            iconColor: 'text-purple-600',
          },
          {
            title: 'Store Inventory',
            value: dashboardData.inventoryTrend[dashboardData.inventoryTrend.length - 1]?.stock.toString() || '0',
            change: '-35',
            trend: 'down',
            icon: Package,
            bgColor: 'bg-orange-50',
            iconColor: 'text-orange-600',
          },
        ];
      case 'PRODUCTION':
        const todayProduction = dashboardData.productionByDay[dashboardData.productionByDay.length - 1]?.produced || 0;
        return [
          {
            title: 'Daily Production',
            value: `${todayProduction} KG`,
            change: '+8%',
            trend: 'up',
            icon: Factory,
            bgColor: 'bg-blue-50',
            iconColor: 'text-blue-600',
          },
          {
            title: 'Production Target',
            value: '95%',
            change: '+3%',
            trend: 'up',
            icon: Activity,
            bgColor: 'bg-green-50',
            iconColor: 'text-green-600',
          },
          {
            title: 'Total Produced',
            value: `${dashboardData.totalProduction} KG`,
            change: '+2',
            trend: 'up',
            icon: Package,
            bgColor: 'bg-purple-50',
            iconColor: 'text-purple-600',
          },
          {
            title: 'Low Stock Alerts',
            value: dashboardData.lowStockCount.toString(),
            change: '-5',
            trend: 'down',
            icon: AlertTriangle,
            bgColor: 'bg-orange-50',
            iconColor: 'text-orange-600',
          },
        ];
      default:
        return [];
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-muted/30">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto bg-muted/30">
      <div className="container mx-auto p-4 lg:p-6 space-y-4 lg:space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl mb-1">
              {getGreeting()}, {userName}!
            </h1>
            <p className="text-muted-foreground text-sm md:text-base">
              Here's what's happening with your {userRole.toLowerCase()} operations today.
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as any)}
              className="px-4 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
            <button 
              onClick={loadDashboardData}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
          {getRoleSpecificMetrics().map((metric, index) => {
            const Icon = metric.icon;
            return (
              <div key={index} className="bg-card rounded-lg p-4 lg:p-6 border border-border hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className={`${metric.bgColor} p-2 lg:p-3 rounded-lg`}>
                    <Icon className={`w-5 h-5 lg:w-6 lg:h-6 ${metric.iconColor}`} />
                  </div>
                  <span className={`flex items-center gap-1 text-xs lg:text-sm ${
                    metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {metric.trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    {metric.change}
                  </span>
                </div>
                <p className="text-2xl lg:text-3xl mb-1">{metric.value}</p>
                <p className="text-xs lg:text-sm text-muted-foreground">{metric.title}</p>
              </div>
            );
          })}
        </div>

        {/* Charts Section */}
        <div className="grid lg:grid-cols-2 gap-4 lg:gap-6">
          {/* Sales/Production Chart */}
          <div className="bg-card rounded-lg p-4 lg:p-6 border border-border">
            <div className="flex items-center justify-between mb-4">
              <h2>
                {userRole === 'PRODUCTION' ? 'Production Performance' : 'Sales Overview'}
              </h2>
              <BarChart3 className="w-5 h-5 text-muted-foreground" />
            </div>
            <ResponsiveContainer width="100%" height={250}>
              {userRole === 'PRODUCTION' ? (
                <BarChart data={dashboardData.productionByDay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="produced" fill="#3b82f6" name="Produced (KG)" />
                </BarChart>
              ) : (
                <AreaChart data={dashboardData.salesByDay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="sales" stroke="#dc2626" fill="#fca5a5" name="Sales (₱)" />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Category Distribution */}
          {userRole === 'ADMIN' && (
            <div className="bg-card rounded-lg p-4 lg:p-6 border border-border">
              <div className="flex items-center justify-between mb-4">
                <h2>Sales by Category</h2>
                <Package className="w-5 h-5 text-muted-foreground" />
              </div>
              {dashboardData.categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={dashboardData.categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {dashboardData.categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                  No sales data available
                </div>
              )}
            </div>
          )}

          {/* Orders Trend for Store */}
          {userRole === 'STORE' && (
            <div className="bg-card rounded-lg p-4 lg:p-6 border border-border">
              <div className="flex items-center justify-between mb-4">
                <h2>Orders Trend</h2>
                <ShoppingCart className="w-5 h-5 text-muted-foreground" />
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={dashboardData.salesByDay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="orders" stroke="#dc2626" strokeWidth={2} name="Orders" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Inventory Trend for Production */}
          {userRole === 'PRODUCTION' && (
            <div className="bg-card rounded-lg p-4 lg:p-6 border border-border">
              <div className="flex items-center justify-between mb-4">
                <h2>Inventory Trend</h2>
                <Package className="w-5 h-5 text-muted-foreground" />
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={dashboardData.inventoryTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="stock" stroke="#10b981" fill="#86efac" name="Stock (KG)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Bottom Section */}
        <div className="grid lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Top Products */}
          <div className="lg:col-span-2 bg-card rounded-lg border border-border">
            <div className="p-4 lg:p-6 border-b border-border">
              <h2>Top Performing Products</h2>
            </div>
            <div className="p-4 lg:p-6">
              {dashboardData.topProducts.length > 0 ? (
                <div className="space-y-3">
                  {dashboardData.topProducts.map((product, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex-1">
                        <p className="font-medium text-sm mb-1">{product.name}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>Sold: {product.sold}</span>
                          <span>•</span>
                          <span>Revenue: ₱{product.revenue.toFixed(2)}</span>
                        </div>
                      </div>
                      <div className={`flex items-center gap-1 text-sm ${
                        product.trend === 'up' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {product.trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        <span>{Math.abs(product.change)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  No sales data available
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-card rounded-lg border border-border">
            <div className="p-4 lg:p-6 border-b border-border">
              <h2>Recent Activity</h2>
            </div>
            <div className="p-4 lg:p-6">
              {dashboardData.recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.recentActivity.map((activity, index) => {
                    const Icon = activity.icon;
                    return (
                      <div key={index} className="flex gap-3">
                        <div className={`${activity.color} p-2 rounded-lg h-fit`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm mb-1">{activity.message}</p>
                          <p className="text-xs text-muted-foreground">{activity.time}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  No recent activity
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-card rounded-lg p-4 lg:p-6 border border-border">
          <h2 className="mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {userRole === 'ADMIN' && (
              <>
                <button className="flex flex-col items-center gap-2 p-4 bg-primary/5 hover:bg-primary/10 rounded-lg transition-colors">
                  <ShoppingCart className="w-6 h-6 text-primary" />
                  <span className="text-sm">New Sale</span>
                </button>
                <button className="flex flex-col items-center gap-2 p-4 bg-primary/5 hover:bg-primary/10 rounded-lg transition-colors">
                  <Factory className="w-6 h-6 text-primary" />
                  <span className="text-sm">Production</span>
                </button>
                <button className="flex flex-col items-center gap-2 p-4 bg-primary/5 hover:bg-primary/10 rounded-lg transition-colors">
                  <Package className="w-6 h-6 text-primary" />
                  <span className="text-sm">Inventory</span>
                </button>
                <button className="flex flex-col items-center gap-2 p-4 bg-primary/5 hover:bg-primary/10 rounded-lg transition-colors">
                  <Users className="w-6 h-6 text-primary" />
                  <span className="text-sm">Reports</span>
                </button>
              </>
            )}
            {userRole === 'STORE' && (
              <>
                <button className="flex flex-col items-center gap-2 p-4 bg-primary/5 hover:bg-primary/10 rounded-lg transition-colors">
                  <ShoppingCart className="w-6 h-6 text-primary" />
                  <span className="text-sm">New Sale</span>
                </button>
                <button className="flex flex-col items-center gap-2 p-4 bg-primary/5 hover:bg-primary/10 rounded-lg transition-colors">
                  <Package className="w-6 h-6 text-primary" />
                  <span className="text-sm">Stock Check</span>
                </button>
                <button className="flex flex-col items-center gap-2 p-4 bg-primary/5 hover:bg-primary/10 rounded-lg transition-colors">
                  <AlertTriangle className="w-6 h-6 text-primary" />
                  <span className="text-sm">Alerts</span>
                </button>
                <button className="flex flex-col items-center gap-2 p-4 bg-primary/5 hover:bg-primary/10 rounded-lg transition-colors">
                  <TrendingUp className="w-6 h-6 text-primary" />
                  <span className="text-sm">Sales Report</span>
                </button>
              </>
            )}
            {userRole === 'PRODUCTION' && (
              <>
                <button className="flex flex-col items-center gap-2 p-4 bg-primary/5 hover:bg-primary/10 rounded-lg transition-colors">
                  <Factory className="w-6 h-6 text-primary" />
                  <span className="text-sm">New Production</span>
                </button>
                <button className="flex flex-col items-center gap-2 p-4 bg-primary/5 hover:bg-primary/10 rounded-lg transition-colors">
                  <Package className="w-6 h-6 text-primary" />
                  <span className="text-sm">Stock Status</span>
                </button>
                <button className="flex flex-col items-center gap-2 p-4 bg-primary/5 hover:bg-primary/10 rounded-lg transition-colors">
                  <Activity className="w-6 h-6 text-primary" />
                  <span className="text-sm">Efficiency</span>
                </button>
                <button className="flex flex-col items-center gap-2 p-4 bg-primary/5 hover:bg-primary/10 rounded-lg transition-colors">
                  <TrendingUp className="w-6 h-6 text-primary" />
                  <span className="text-sm">Reports</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
