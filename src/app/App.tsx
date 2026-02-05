import { useState, useEffect } from "react";
import {
  ShoppingCart,
  Package,
  Factory,
  ArrowRightLeft,
  BarChart3,
  Menu,
  X,
  LogOut,
  User,
  Receipt,
  ChefHat,
  Tag,
  Store,
  Users,
  History,
  DollarSign,
  Percent,
} from "lucide-react";
import { POSPage } from "@/app/components/POSPage";
import { ProductionDashboard } from "@/app/components/ProductionDashboard";
import { InventoryPage } from "@/app/components/InventoryPage";
import { IngredientsInventoryPage } from "@/app/components/IngredientsInventoryPage";
import { TransferPage } from "@/app/components/TransferPage";
import { LoginPage, UserData, UserRole } from "@/app/components/LoginPage";
import { EnhancedDashboardPage } from "@/app/components/EnhancedDashboardPage";
import { SalesDataTable } from "@/app/components/SalesDataTable";
import { IngredientsProvider } from "@/app/context/IngredientsContext";
import { Toaster } from "@/app/components/ui/sonner";
import { CategoriesPage } from "@/app/components/CategoriesPage";
import { StoresManagementPage } from "@/app/components/StoresManagementPage";
import { EmployeesPage } from "@/app/components/EmployeesPage";
import { SuppliersPage } from "@/app/components/SuppliersPage";
import { HistoryPage } from "@/app/components/HistoryPage";
import { DiscountsPage } from "@/app/components/DiscountsPage";
import TransactionsPage from "@/app/components/TransactionsPage";
import { refreshSession } from "@/utils/api";

type Page =
  | "dashboard"
  | "pos"
  | "production"
  | "inventory"
  | "ingredients"
  | "transfer"
  | "sales"
  | "categories"
  | "stores"
  | "employees"
  | "suppliers"
  | "history"
  | "transactions"
  | "discounts";

const SESSION_KEY = "lzt_user_session";
const SESSION_EXPIRY_KEY = "lzt_session_expiry";
const SESSION_PAGE_KEY = "lzt_current_page";
const SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 hours in milliseconds

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [inventoryKey, setInventoryKey] = useState(0);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const savedSession = localStorage.getItem(SESSION_KEY);
        const savedExpiry = localStorage.getItem(SESSION_EXPIRY_KEY);
        const savedPage = localStorage.getItem(SESSION_PAGE_KEY);

        if (savedSession && savedExpiry) {
          const expiryTime = parseInt(savedExpiry, 10);
          const now = Date.now();

          // Check if session has expired
          if (now < expiryTime) {
            const userData: UserData = JSON.parse(savedSession);
            console.log("✅ Session restored for:", userData.username);
            console.log("  - Store:", userData.storeName || "None");
            console.log("  - StoreId:", userData.storeId || "None");
            console.log(
              "⏰ Session expires in:",
              Math.round((expiryTime - now) / 1000 / 60),
              "minutes",
            );

            // Use cached session directly
            setCurrentUser(userData);

            // Restore the last page if valid
            if (savedPage && (savedPage as Page)) {
              setCurrentPage(savedPage as Page);
              console.log("📄 Restored page:", savedPage);
            }
          } else {
            console.log("⚠️ Session expired, clearing...");
            clearSession();
          }
        } else {
          console.log("ℹ️ No saved session found");
        }
      } catch (error) {
        console.error("Error restoring session:", error);
        clearSession();
      } finally {
        setSessionChecked(true);
      }
    };

    checkSession();
  }, []);

  // Save session when user changes
  useEffect(() => {
    if (currentUser) {
      saveSession(currentUser);
    }
  }, [currentUser]);

  // Save current page to session
  useEffect(() => {
    if (currentUser && sessionChecked) {
      localStorage.setItem(SESSION_PAGE_KEY, currentPage);
    }
  }, [currentPage, currentUser, sessionChecked]);

  const saveSession = (userData: UserData) => {
    try {
      const expiryTime = Date.now() + SESSION_DURATION;
      localStorage.setItem(SESSION_KEY, JSON.stringify(userData));
      localStorage.setItem(SESSION_EXPIRY_KEY, expiryTime.toString());
      console.log(
        "💾 Session saved, expires at:",
        new Date(expiryTime).toLocaleString(),
      );
    } catch (error) {
      console.error("Error saving session:", error);
    }
  };

  const clearSession = () => {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_EXPIRY_KEY);
    localStorage.removeItem(SESSION_PAGE_KEY);
    console.log("🗑️ Session cleared");
  };

  const handleLogin = (userData: UserData) => {
    setCurrentUser(userData);
    saveSession(userData);

    // Determine the initial page based on user role and type
    let initialPage: Page = "dashboard";

    console.log("=== LOGIN: Determining Initial Page ===");
    console.log("User:", userData.username);
    console.log("Role:", userData.role);
    console.log("Employee Role:", userData.employeeRole);
    console.log("Assigned Store:", userData.storeName);
    console.log("Store ID:", userData.storeId);

    // 1. POS users (dedicated POS-only role) go directly to POS
    if (userData.role === "POS") {
      initialPage = "pos";
      console.log("✅ POS role detected → Redirecting to Point of Sale");
      console.log("🔒 User will be locked to store:", userData.storeName);
    }
    // 2. ADMIN users go to dashboard
    else if (userData.role === "ADMIN") {
      initialPage = "dashboard";
      console.log("✅ ADMIN role detected → Redirecting to Dashboard");
    }
    // 3. STORE role users go to POS
    else if (userData.role === "STORE") {
      initialPage = "pos";
      console.log("✅ STORE role detected → Redirecting to Point of Sale");
      console.log("🔒 User will be locked to store:", userData.storeName);
    }
    // 4. PRODUCTION role users go to production dashboard
    else if (userData.role === "PRODUCTION") {
      initialPage = "production";
      console.log(
        "✅ PRODUCTION role detected → Redirecting to Production Dashboard",
      );
    }
    // 5. Employee-based roles (for employees created in admin)
    else if (userData.employeeRole === "Store") {
      initialPage = "pos";
      console.log("✅ Store Employee detected → Redirecting to Point of Sale");
      console.log("🔒 User will be locked to store:", userData.storeName);
    } else if (userData.employeeRole === "Production") {
      initialPage = "production";
      console.log(
        "✅ Production Employee detected → Redirecting to Production Dashboard",
      );
    } else if (userData.employeeRole === "Employee") {
      // For employees with custom permissions, check what they have access to
      const permissions = userData.permissions || [];
      if (permissions.includes("pos")) {
        initialPage = "pos";
        console.log(
          "✅ Employee with POS permission → Redirecting to Point of Sale",
        );
        console.log("🔒 User will be locked to store:", userData.storeName);
      } else if (permissions.includes("inventory")) {
        initialPage = "inventory";
        console.log(
          "✅ Employee with Inventory permission → Redirecting to Inventory",
        );
      } else if (permissions.includes("sales")) {
        initialPage = "sales";
        console.log("✅ Employee with Sales permission → Redirecting to Sales");
      } else {
        initialPage = "dashboard";
        console.log(
          "✅ Employee with no specific permissions → Redirecting to Dashboard",
        );
      }
    }

    console.log("Final Page:", initialPage);
    console.log("======================================");

    setCurrentPage(initialPage);
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setCurrentUser(null);
    setCurrentPage("dashboard");
    setSidebarOpen(false);
    setShowLogoutConfirm(false);
    clearSession();
  };

  // Define menu items based on user role and permissions
  const getMenuItems = () => {
    // For employees with Employee role, check permissions
    if (currentUser?.employeeRole === "Employee") {
      const permissions = currentUser.permissions || [];
      const permissionMap: Record<string, Page> = {
        pos: "pos",
        inventory: "inventory",
        categories: "categories",
        ingredients: "ingredients",
        sales: "sales",
        history: "history",
      };

      // Dashboard is always available for Employee role
      const items: Array<{
        id: Page;
        icon: any;
        label: string;
        roles: string[];
      }> = [
        {
          id: "dashboard" as Page,
          icon: BarChart3,
          label: "Dashboard",
          roles: ["ADMIN"],
        },
      ];

      // Add menu items based on permissions
      const allMenuItems = [
        {
          id: "pos" as Page,
          icon: ShoppingCart,
          label: "Point of Sale",
          permission: "pos",
        },
        {
          id: "inventory" as Page,
          icon: Package,
          label: "Inventory",
          permission: "inventory",
        },
        {
          id: "categories" as Page,
          icon: Tag,
          label: "Categories",
          permission: "categories",
        },
        {
          id: "ingredients" as Page,
          icon: ChefHat,
          label: "Ingredients",
          permission: "ingredients",
        },
        {
          id: "sales" as Page,
          icon: Receipt,
          label: "Sales",
          permission: "sales",
        },
        {
          id: "history" as Page,
          icon: History,
          label: "History",
          permission: "history",
        },
      ];

      allMenuItems.forEach((item) => {
        if (permissions.includes(item.permission)) {
          items.push({ ...item, roles: ["ADMIN"] });
        }
      });

      return items;
    }

    // For Store employees, show only store-related pages
    if (currentUser?.employeeRole === "Store") {
      return [
        {
          id: "dashboard" as Page,
          icon: BarChart3,
          label: "Dashboard",
          roles: ["STORE"],
        },
        {
          id: "pos" as Page,
          icon: ShoppingCart,
          label: "Point of Sale",
          roles: ["STORE"],
        },
        {
          id: "inventory" as Page,
          icon: Package,
          label: "Inventory",
          roles: ["STORE"],
        },
        {
          id: "categories" as Page,
          icon: Tag,
          label: "Categories",
          roles: ["STORE"],
        },
        {
          id: "ingredients" as Page,
          icon: ChefHat,
          label: "Ingredients",
          roles: ["STORE"],
        },
        {
          id: "sales" as Page,
          icon: Receipt,
          label: "Sales",
          roles: ["STORE"],
        },
        {
          id: "history" as Page,
          icon: History,
          label: "History",
          roles: ["STORE"],
        },
      ];
    }

    // For Production employees, show only production-related pages
    if (currentUser?.employeeRole === "Production") {
      return [
        {
          id: "dashboard" as Page,
          icon: BarChart3,
          label: "Dashboard",
          roles: ["PRODUCTION"],
        },
        {
          id: "production" as Page,
          icon: Factory,
          label: "Production",
          roles: ["PRODUCTION"],
        },
        {
          id: "ingredients" as Page,
          icon: ChefHat,
          label: "Ingredients",
          roles: ["PRODUCTION"],
        },
        {
          id: "transfer" as Page,
          icon: ArrowRightLeft,
          label: "Transfer",
          roles: ["PRODUCTION"],
        },
        {
          id: "history" as Page,
          icon: History,
          label: "History",
          roles: ["PRODUCTION"],
        },
      ];
    }

    // Default role-based menu (for system users)
    const baseItems = [
      {
        id: "dashboard" as Page,
        icon: BarChart3,
        label: "Dashboard",
        roles: ["ADMIN", "STORE", "PRODUCTION"],
      },
    ];

    const roleSpecificItems = [
      {
        id: "pos" as Page,
        icon: ShoppingCart,
        label: "Point of Sale",
        roles: ["ADMIN", "STORE"],
      },
      {
        id: "production" as Page,
        icon: Factory,
        label: "Production",
        roles: ["ADMIN", "PRODUCTION"],
      },
      {
        id: "inventory" as Page,
        icon: Package,
        label: "Inventory",
        roles: ["ADMIN", "STORE"],
      },
      {
        id: "categories" as Page,
        icon: Tag,
        label: "Categories",
        roles: ["ADMIN", "STORE"],
      },
      {
        id: "ingredients" as Page,
        icon: ChefHat,
        label: "Ingredients",
        roles: ["ADMIN", "STORE", "PRODUCTION"],
      },
      {
        id: "transfer" as Page,
        icon: ArrowRightLeft,
        label: "Transfer",
        roles: ["ADMIN", "PRODUCTION"],
      },
      {
        id: "sales" as Page,
        icon: Receipt,
        label: "Sales",
        roles: ["ADMIN", "STORE"],
      },
      { id: "stores" as Page, icon: Store, label: "Stores", roles: ["ADMIN"] },
      {
        id: "employees" as Page,
        icon: Users,
        label: "Users",
        roles: ["ADMIN"],
      },
      {
        id: "suppliers" as Page,
        icon: Tag,
        label: "Suppliers",
        roles: ["ADMIN"],
      },
      {
        id: "discounts" as Page,
        icon: Percent,
        label: "Discounts",
        roles: ["ADMIN"],
      },
      {
        id: "history" as Page,
        icon: History,
        label: "History",
        roles: ["ADMIN", "STORE", "PRODUCTION"],
      },
      {
        id: "transactions" as Page,
        icon: DollarSign,
        label: "Transactions",
        roles: ["ADMIN", "STORE", "PRODUCTION"],
      },
    ];

    return [...baseItems, ...roleSpecificItems].filter((item) =>
      item.roles.includes(currentUser?.role || ""),
    );
  };

  const handlePageChange = (page: Page) => {
    // Check if user has access to this page
    const allowedPages = menuItems.map((item) => item.id);

    // For POS role, only allow POS page
    if (currentUser?.role === "POS" && page !== "pos") {
      console.warn("POS users can only access POS page");
      return;
    }

    // For all other roles, check if the page is in their menu items
    if (!allowedPages.includes(page)) {
      console.warn(`User does not have access to ${page}`);
      return;
    }

    // Increment inventory key when navigating to inventory to force fresh data load
    if (page === "inventory") {
      setInventoryKey((prev) => prev + 1);
    }

    setCurrentPage(page);
    setSidebarOpen(false);
  };

  // Show login page if not authenticated
  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // POS-only view (no sidebar, only POS)
  if (currentUser.role === "POS") {
    return (
      <IngredientsProvider>
        <div className="size-full flex flex-col bg-background">
          {/* POS Header */}
          <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 lg:px-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">Point of Sale</h1>
                  <p className="text-xs text-muted-foreground">POS Terminal</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-lg">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                <span className="text-sm">Live</span>
              </div>

              <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-lg">
                <User className="w-4 h-4" />
                <span className="text-sm hidden sm:inline">
                  {currentUser.fullName}
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors border border-red-200"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </header>

          {/* POS Content */}
          <main className="flex-1 overflow-auto">
            <POSPage currentUser={currentUser} />
          </main>
        </div>

        {/* Logout Confirmation Modal - POS View */}
        {showLogoutConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm mx-4">
              <h2 className="text-lg font-bold text-gray-900 mb-2">Logout</h2>
              <p className="text-gray-600 mb-6">
                Are you sure you want to logout?
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmLogout}
                  className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors font-medium"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}

        <Toaster />
      </IngredientsProvider>
    );
  }

  const menuItems = getMenuItems();

  return (
    <IngredientsProvider>
      <div className="size-full flex bg-background">
        {/* Sidebar */}
        <aside
          className={`fixed lg:sticky inset-y-0 left-0 z-50 w-64 h-screen bg-primary text-primary-foreground transform transition-transform duration-300 ease-in-out flex flex-col ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } lg:translate-x-0`}
        >
          {/* Sidebar Header */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-primary-foreground/20">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-8 h-8" />
              <div className="flex flex-col">
                <h1 className="text-sm font-semibold leading-tight">
                  LZT Meat Products
                </h1>
                <span className="text-xs opacity-80">Management System</span>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 hover:bg-primary-foreground/10 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Info */}
          <div className="px-4 py-3 border-b border-primary-foreground/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-foreground/20 rounded-full flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {currentUser.fullName}
                </p>
                <p className="text-xs opacity-70">{currentUser.role}</p>
              </div>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 py-4 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handlePageChange(item.id)}
                  className={`w-full flex items-center gap-3 px-6 py-3 transition-colors ${
                    isActive
                      ? "bg-primary-foreground text-primary border-r-4 border-primary"
                      : "hover:bg-primary-foreground/10"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Logout Button */}
          <div className="p-4 border-t border-primary-foreground/20">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 bg-primary-foreground/10 hover:bg-primary-foreground/20 py-2.5 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
            <div className="mt-3 text-xs opacity-70 text-center">
              <p>© 2026 LZT Meat Products</p>
              <p className="mt-1">v1.0.0</p>
            </div>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Bar */}
          <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 lg:px-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-accent rounded"
              >
                <Menu className="w-6 h-6" />
              </button>
              <h2 className="text-lg md:text-xl">
                {menuItems.find((item) => item.id === currentPage)?.label}
              </h2>
            </div>
            <div className="flex items-center gap-3 relative">
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-lg">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                <span className="text-sm">Live</span>
              </div>

              {/* User Button */}
              <button className="flex items-center gap-2 px-3 py-1.5 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors">
                <User className="w-4 h-4" />
                <span className="text-sm hidden sm:inline">
                  {currentUser.username}
                </span>
              </button>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-auto">
            {currentPage === "dashboard" && (
              <EnhancedDashboardPage
                userRole={currentUser.role}
                userName={currentUser.fullName}
                onNavigate={handlePageChange}
              />
            )}
            {currentPage === "pos" && <POSPage currentUser={currentUser} />}
            {currentPage === "production" && <ProductionDashboard />}
            {currentPage === "inventory" && (
              <InventoryPage key={inventoryKey} currentUser={currentUser} />
            )}
            {currentPage === "ingredients" && (
              <IngredientsInventoryPage currentUser={currentUser} />
            )}
            {currentPage === "transfer" && <TransferPage />}
            {currentPage === "sales" && (
              <SalesDataTable
                userRole={currentUser.role}
                currentUser={currentUser}
              />
            )}
            {currentPage === "categories" && <CategoriesPage />}
            {currentPage === "stores" && <StoresManagementPage />}
            {currentPage === "employees" && <EmployeesPage />}
            {currentPage === "suppliers" && <SuppliersPage />}
            {currentPage === "discounts" && <DiscountsPage />}
            {currentPage === "history" && <HistoryPage />}
            {currentPage === "transactions" && (
              <TransactionsPage user={currentUser} />
            )}
          </main>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm mx-4">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Logout</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to logout?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      <Toaster />
    </IngredientsProvider>
  );
}
