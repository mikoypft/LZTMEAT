import { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  CreditCard,
  Banknote,
  Smartphone,
  Edit,
  Save,
  X,
  Receipt,
  Percent,
  UserPlus,
  Store,
  RefreshCw,
} from "lucide-react";
import {
  getProducts,
  getInventory,
  createSale,
  getStores,
  addProduct,
  addInventory,
  getCategories,
  getDiscountSettings,
  type Product as APIProduct,
  type InventoryRecord,
  type StoreLocation,
  type Category,
} from "@/utils/api";
import { toast } from "sonner";
import type { UserData } from "@/app/components/LoginPage";

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  sku: string;
}

interface CartItem extends Product {
  quantity: number;
  discount: number;
  basePrice?: number; // Original price before weight adjustment
}

interface Customer {
  name: string;
}

interface POSPageProps {
  currentUser?: UserData;
}

const MOCK_PRODUCTS: Product[] = [
  {
    id: "1",
    name: "Longanisa (Sweet)",
    price: 185.0,
    stock: 150,
    category: "Sausages",
    sku: "SAU-001",
  },
  {
    id: "2",
    name: "Longanisa (Spicy)",
    price: 185.0,
    stock: 120,
    category: "Sausages",
    sku: "SAU-002",
  },
  {
    id: "3",
    name: "Tocino (Pork)",
    price: 220.0,
    stock: 80,
    category: "Cured Meats",
    sku: "CUR-001",
  },
  {
    id: "4",
    name: "Tapa (Beef)",
    price: 280.0,
    stock: 65,
    category: "Cured Meats",
    sku: "CUR-002",
  },
  {
    id: "5",
    name: "Chorizo de Bilbao",
    price: 195.0,
    stock: 90,
    category: "Sausages",
    sku: "SAU-003",
  },
  {
    id: "6",
    name: "Shanghai (Spring Rolls)",
    price: 150.0,
    stock: 200,
    category: "Ready-to-Cook",
    sku: "RTC-001",
  },
  {
    id: "7",
    name: "Embutido (Meatloaf)",
    price: 210.0,
    stock: 75,
    category: "Processed Meats",
    sku: "PRO-001",
  },
  {
    id: "8",
    name: "Filipino Hotdog",
    price: 165.0,
    stock: 180,
    category: "Sausages",
    sku: "SAU-004",
  },
  {
    id: "9",
    name: "Ham (Sliced)",
    price: 245.0,
    stock: 55,
    category: "Processed Meats",
    sku: "PRO-002",
  },
  {
    id: "10",
    name: "Bacon (Smoked)",
    price: 275.0,
    stock: 70,
    category: "Processed Meats",
    sku: "PRO-003",
  },
  {
    id: "11",
    name: "Ground Pork",
    price: 180.0,
    stock: 110,
    category: "Ground Meats",
    sku: "GRD-001",
  },
  {
    id: "12",
    name: "Ground Beef",
    price: 240.0,
    stock: 95,
    category: "Ground Meats",
    sku: "GRD-002",
  },
];

export function POSPage({ currentUser }: POSPageProps = {}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [showCheckout, setShowCheckout] = useState(false);
  const [showProductManager, setShowProductManager] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [globalDiscount, setGlobalDiscount] = useState(0);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [stores, setStores] = useState<StoreLocation[]>([]);
  const [selectedStore, setSelectedStore] = useState<StoreLocation | null>(
    null,
  );
  const [categories, setCategories] = useState<Category[]>([]);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptData, setReceiptData] = useState<{
    time: string;
    transactionId: string;
    items: any[];
    subtotal: number;
    globalDiscount: number;
    globalDiscountPercent?: number;
    wholesaleDiscount: number;
    tax: number;
    total: number;
  } | null>(null);
  const [wholesaleDiscount, setWholesaleDiscount] = useState<number>(0);
  const [salesType, setSalesType] = useState<"wholesale" | "retail">("retail");
  const [discountSettings, setDiscountSettings] = useState({
    wholesaleMinUnits: 5,
    discountType: "percentage" as "percentage" | "fixed_amount",
    wholesaleDiscountPercent: 1,
    wholesaleDiscountAmount: 0,
  });
  const [weightAdjustmentModal, setWeightAdjustmentModal] = useState<{
    show: boolean;
    product: Product | null;
    weight: string;
  }>({
    show: false,
    product: null,
    weight: "1",
  });

  // Determine if user can switch stores (only ADMIN can)
  const canSwitchStores = currentUser?.role === "ADMIN";
  const userAssignedStoreId = currentUser?.storeId;
  const userAssignedStoreName = currentUser?.storeName;

  // Debug logging
  console.log("=== POS Page - User Store Assignment ===");
  console.log("Current User:", currentUser?.username);
  console.log("User Role:", currentUser?.role);
  console.log("User Assigned StoreId:", userAssignedStoreId);
  console.log("User Assigned StoreName:", userAssignedStoreName);
  console.log("Can Switch Stores:", canSwitchStores);
  console.log("=======================================");

  // Calculate which price categories qualify for wholesale discount
  const calculateWholesalePrices = (
    cartItems: CartItem[],
  ): { salesType: "wholesale" | "retail"; wholesalePrices: Set<number> } => {
    // Group items by base price (original price before weight adjustment)
    const itemsByBasePrice: { [price: number]: CartItem[] } = {};

    cartItems.forEach((item) => {
      const basePriceKey = item.basePrice || item.price;
      if (!itemsByBasePrice[basePriceKey]) {
        itemsByBasePrice[basePriceKey] = [];
      }
      itemsByBasePrice[basePriceKey].push(item);
    });

    // Check each base price group to see if total quantity exceeds the threshold
    const wholesalePrices = new Set<number>();
    let hasAnyWholesale = false;

    for (const [basePrice, priceGroup] of Object.entries(itemsByBasePrice)) {
      const totalQuantity = priceGroup.reduce(
        (sum, item) => sum + item.quantity,
        0,
      );
      // If quantity >= minimum units threshold, this base price category qualifies for wholesale
      if (totalQuantity >= discountSettings.wholesaleMinUnits) {
        wholesalePrices.add(parseFloat(basePrice));
        hasAnyWholesale = true;
      }
    }

    const salesType = hasAnyWholesale ? "wholesale" : "retail";

    return { salesType, wholesalePrices };
  };

  // Calculate wholesale/retail status based on products with same price
  const calculateWholesaleStatus = (
    cartItems: CartItem[],
  ): { salesType: "wholesale" | "retail"; discountAmount: number } => {
    const { salesType } = calculateWholesalePrices(cartItems);

    if (salesType !== "wholesale") {
      return { salesType, discountAmount: 0 };
    }

    // Calculate discount based on type
    let discountAmount = 0;
    if (discountSettings.discountType === "percentage") {
      // Calculate percentage discount on total
      const total = cartItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      );
      discountAmount =
        (discountSettings.wholesaleDiscountPercent / 100) * total;
    } else {
      // Use fixed amount discount
      discountAmount = discountSettings.wholesaleDiscountAmount || 0;
    }

    return { salesType, discountAmount };
  };

  // Load products and inventory on mount
  useEffect(() => {
    loadStoresFirst();
    loadCategories();
    loadDiscountSettings();
  }, []);

  const loadStoresFirst = async () => {
    try {
      const storeData = await getStores();
      setStores(storeData);

      // If user has an assigned store, use that; otherwise default to first store
      let storeToSelect: StoreLocation | null = null;

      if (userAssignedStoreId) {
        // Find user's assigned store
        storeToSelect =
          storeData.find((s: StoreLocation) => s.id === userAssignedStoreId) ||
          null;
        if (storeToSelect) {
          toast.info(`Locked to your assigned store: ${storeToSelect.name}`, {
            duration: 3000,
          });
        } else {
          toast.error(
            `Your assigned store (${userAssignedStoreName}) was not found.`,
          );
        }
      } else {
        // Default to first store for admin or users without assigned store
        storeToSelect = storeData[0] || null;
      }

      setSelectedStore(storeToSelect);
      // Now load products and inventory with the correct store
      if (storeToSelect) {
        await loadProductsAndInventory(storeToSelect.name);
      }
    } catch (error) {
      console.error("Error loading stores:", error);
      toast.error("Failed to load stores. Please refresh the page.");
    }
  };

  const loadProductsAndInventory = async (storeName?: string) => {
    try {
      setLoading(true);
      const locationToUse = storeName || selectedStore?.name;

      if (!locationToUse) {
        toast.error("No store selected. Please select a store.");
        setLoading(false);
        return;
      }

      const [productsData, inventoryData] = await Promise.all([
        getProducts(),
        getInventory(locationToUse),
      ]);

      // Combine products with inventory data
      const productsWithStock = productsData.map((product: APIProduct) => {
        const inv = inventoryData.find(
          (i: InventoryRecord) => i.productId === product.id,
        );
        return {
          id: product.id,
          name: product.name,
          price: Number(product.price) || 0,
          stock: inv?.quantity || 0,
          category: product.category,
          sku: `SKU-${product.id}`,
        };
      });

      setProducts(productsWithStock);

      // Show warning if current store has low or no inventory
      const lowStockProducts = productsWithStock.filter((p) => p.stock === 0);
      if (lowStockProducts.length > 0) {
        toast.warning(
          `${locationToUse} has ${lowStockProducts.length} product(s) out of stock.`,
        );
      }
    } catch (error) {
      console.error("Error loading products:", error);
      toast.error("Failed to load products. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  };

  const loadStores = async () => {
    try {
      const storeData = await getStores();
      setStores(storeData);
      setSelectedStore(storeData[0] || null); // Default to the first store
    } catch (error) {
      console.error("Error loading stores:", error);
      toast.error("Failed to load stores. Please refresh the page.");
    }
  };

  const loadCategories = async () => {
    try {
      const categoryData = await getCategories();
      setCategories(categoryData);
    } catch (error) {
      console.error("Error loading categories:", error);
      toast.error("Failed to load categories. Please refresh the page.");
    }
  };

  const loadDiscountSettings = async () => {
    try {
      const settings = await getDiscountSettings();
      setDiscountSettings({
        wholesaleMinUnits: settings.wholesaleMinUnits,
        discountType: settings.discountType,
        wholesaleDiscountPercent: settings.wholesaleDiscountPercent,
        wholesaleDiscountAmount: settings.wholesaleDiscountAmount || 0,
      });
      console.log("✓ Discount settings loaded:", settings);
    } catch (error) {
      console.error("Error loading discount settings:", error);
      // Use defaults if fails
    }
  };

  // Reload products when store changes
  useEffect(() => {
    if (selectedStore) {
      loadProductsAndInventory();
    }
  }, [selectedStore]);

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const openWeightAdjustmentModal = (product: Product) => {
    // Validate that we have a selected store
    if (!selectedStore) {
      toast.error("Please select a store before adding items to cart");
      return;
    }

    // Check if product has stock at the selected store
    if (product.stock === 0) {
      toast.error(`${product.name} is out of stock at ${selectedStore.name}`);
      return;
    }

    setWeightAdjustmentModal({
      show: true,
      product,
      weight: "1",
    });
  };

  const addToCart = (adjustedPrice?: number) => {
    const { product, weight } = weightAdjustmentModal;
    if (!product) return;

    const actualWeight = parseFloat(weight) || 1;
    const priceToUse = adjustedPrice || product.price;
    const basePrice = product.price; // Store original base price

    // Look for an existing item with the SAME product ID AND price
    // If prices differ (due to weight), create a new line item instead
    const existingItemWithSamePrice = cart.find(
      (item) => item.id === product.id && item.price === priceToUse,
    );

    if (existingItemWithSamePrice) {
      // Same product, same price - increment quantity
      if (existingItemWithSamePrice.quantity < product.stock) {
        setCart(
          cart.map((item) =>
            item.id === product.id && item.price === priceToUse
              ? { ...item, quantity: item.quantity + 1 }
              : item,
          ),
        );
        toast.success(`Added ${product.name} to cart`);
      } else {
        toast.warning(
          `Cannot add more. Only ${product.stock} available at ${selectedStore?.name}`,
        );
      }
    } else {
      // Different price (different weight) or new product - create new line item
      setCart([
        ...cart,
        { ...product, price: priceToUse, quantity: 1, discount: 0, basePrice },
      ]);
      toast.success(`Added ${product.name} to cart`);
    }

    setWeightAdjustmentModal({
      show: false,
      product: null,
      weight: "1",
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(
      cart.map((item) => {
        if (item.id === productId) {
          const newQuantity = item.quantity + delta;
          if (newQuantity <= 0) return item;
          if (newQuantity > item.stock) return item;
          return { ...item, quantity: newQuantity };
        }
        return item;
      }),
    );
  };

  const updateItemDiscount = (productId: string, discount: number) => {
    if (discount < 0 || discount > 100) return;
    setCart(
      cart.map((item) =>
        item.id === productId ? { ...item, discount } : item,
      ),
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setShowCheckout(false);
    setGlobalDiscount(0);
    setCustomer(null);
  };

  // Update wholesale status whenever cart changes
  useEffect(() => {
    if (cart.length > 0) {
      const { salesType, discountAmount } = calculateWholesaleStatus(cart);
      setSalesType(salesType);
      setWholesaleDiscount(discountAmount);
    } else {
      setSalesType("retail");
      setWholesaleDiscount(0);
    }
  }, [cart]);

  const calculateItemTotal = (item: CartItem) => {
    const itemTotal = item.price * item.quantity;
    const itemDiscount = (itemTotal * item.discount) / 100;
    return itemTotal - itemDiscount;
  };

  // Calculate subtotal with per-category wholesale discounts
  const { wholesalePrices } = calculateWholesalePrices(cart);

  let totalWholesaleDiscount = 0;
  const subtotal = cart.reduce((sum, item) => {
    const itemTotal = item.price * item.quantity;
    // Apply wholesale discount if this item's base price qualifies
    const basePrice = item.basePrice || item.price;
    let wholesaleDiscount = 0;
    if (wholesalePrices.has(basePrice)) {
      if (discountSettings.discountType === "percentage") {
        wholesaleDiscount =
          (itemTotal * discountSettings.wholesaleDiscountPercent) / 100;
      } else {
        // Apply fixed amount discount per unit
        wholesaleDiscount =
          discountSettings.wholesaleDiscountAmount * item.quantity;
      }
    }
    totalWholesaleDiscount += wholesaleDiscount;
    const itemDiscount = (itemTotal * item.discount) / 100;
    const totalDiscount = itemDiscount + wholesaleDiscount;
    return sum + itemTotal - totalDiscount;
  }, 0);

  const globalDiscountAmount = (subtotal * globalDiscount) / 100;
  const afterDiscount = subtotal - globalDiscountAmount;
  const tax = 0; // Tax hidden
  const total = afterDiscount;

  const handleCheckout = async (method: string) => {
    // Validate customer name is required
    if (!customer?.name || customer.name.trim() === "") {
      toast.error("Customer name is required to complete the sale.");
      return;
    }

    // Validate store is selected
    if (!selectedStore) {
      toast.error("No store selected. Cannot process checkout.");
      return;
    }

    // Validate all cart items against current inventory
    const invalidItems: string[] = [];
    cart.forEach((cartItem) => {
      const currentProduct = products.find((p) => p.id === cartItem.id);
      if (!currentProduct) {
        invalidItems.push(`${cartItem.name} (product no longer exists)`);
      } else if (currentProduct.stock < cartItem.quantity) {
        invalidItems.push(
          `${cartItem.name} (only ${currentProduct.stock} available at ${selectedStore.name})`,
        );
      }
    });

    if (invalidItems.length > 0) {
      toast.error(`Cannot checkout. Issues with:\n${invalidItems.join("\n")}`);
      // Reload inventory to sync
      await loadProductsAndInventory();
      return;
    }

    setCheckingOut(true);
    const transactionId = Date.now().toString();
    const now = new Date();
    const receipt = generateReceipt(method);

    // Create sale record - backend will handle inventory deduction
    try {
      const calculatedGlobalDiscountAmount = (subtotal * globalDiscount) / 100;
      const calculatedWholesaleDiscountAmount = totalWholesaleDiscount;
      
      const salePayload = {
        transactionId: transactionId,
        date: now.toISOString(),
        location: selectedStore?.name || "Unknown Store",
        storeId: selectedStore?.id || "",
        cashier:
          currentUser?.fullName || currentUser?.username || "Unknown User",
        userId: currentUser?.id || "",
        username: currentUser?.username || "Unknown",
        customer: customer
          ? {
              name: customer.name,
            }
          : null,
        items: cart.map((item) => ({
          productId: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          discount: item.discount,
        })),
        subtotal: subtotal,
        globalDiscount: calculatedGlobalDiscountAmount,
        wholesaleDiscount: calculatedWholesaleDiscountAmount,
        tax: tax,
        total: total,
        paymentMethod: method,
        salesType: salesType,
      };
      
      console.log("Sale payload:", salePayload);
      console.log("Calculated global discount amount:", calculatedGlobalDiscountAmount);
      console.log("Calculated wholesale discount amount:", calculatedWholesaleDiscountAmount);
      
      await createSale(salePayload);

      toast.success(`Sale recorded successfully at ${selectedStore?.name}!`);

      // Show receipt modal with sale data
      setReceiptData({
        time: now.toLocaleString(),
        transactionId: transactionId,
        items: cart.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          discount: item.discount,
          total: calculateItemTotal(item),
        })),
        subtotal: subtotal,
        globalDiscount: calculatedGlobalDiscountAmount,
        globalDiscountPercent: globalDiscount,
        wholesaleDiscount: calculatedWholesaleDiscountAmount,
        tax: tax,
        total: total,
      });
      setShowReceiptModal(true);

      // Clear cart
      clearCart();

      // Reload inventory from backend to get updated stock levels
      toast.info("Updating inventory levels...");
      await loadProductsAndInventory();

      toast.success(
        `✅ Inventory updated! Stock levels refreshed at ${selectedStore?.name}`,
      );
    } catch (error) {
      console.error("Error creating sale:", error);
      toast.error("Failed to record sale. Please try again.");
    } finally {
      setCheckingOut(false);
    }
  };

  const generateReceipt = (paymentMethod: string): string => {
    const now = new Date();
    let receipt = "========================================\n";
    receipt += "       LZT MEAT PRODUCTS\n";
    receipt += "========================================\n";
    receipt += `Date: ${now.toLocaleDateString()}\n`;
    receipt += `Time: ${now.toLocaleTimeString()}\n`;
    receipt += `Transaction #: ${Date.now()}\n`;
    if (customer) {
      receipt += `Customer: ${customer.name}\n`;
      receipt += `Phone: ${customer.phone}\n`;
    }
    receipt += "========================================\n\n";

    cart.forEach((item) => {
      receipt += `${item.name}\n`;
      receipt += `  ${item.quantity} x ₱${item.price.toFixed(2)} = ₱${(item.price * item.quantity).toFixed(2)}\n`;
      if (item.discount > 0) {
        receipt += `  Item Discount (${item.discount}%): -₱${((item.price * item.quantity * item.discount) / 100).toFixed(2)}\n`;
      }
      receipt += `  Subtotal: ₱${calculateItemTotal(item).toFixed(2)}\n\n`;
    });

    receipt += "----------------------------------------\n";
    receipt += `Subtotal: ₱${subtotal.toFixed(2)}\n`;
    if (globalDiscount > 0) {
      receipt += `Global Discount (${globalDiscount}%): -₱${globalDiscountAmount.toFixed(2)}\n`;
    }
    receipt += "----------------------------------------\n";
    receipt += `TOTAL: ₱${total.toFixed(2)}\n`;
    receipt += `Payment Method: ${paymentMethod}\n`;
    receipt += "========================================\n";
    receipt += "     Thank you for your business!\n";
    receipt += "========================================\n";

    return receipt;
  };

  // Product Management Functions
  const handleSaveProduct = (product: Product) => {
    if (editingProduct) {
      setProducts(products.map((p) => (p.id === product.id ? product : p)));
    } else {
      setProducts([...products, { ...product, id: Date.now().toString() }]);
    }
    setEditingProduct(null);
    setShowProductManager(false);
  };

  const handleDeleteProduct = (productId: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      setProducts(products.filter((p) => p.id !== productId));
    }
  };

  return (
    <div className="h-screen flex flex-col lg:flex-row overflow-hidden">
      {/* Left Side - Products */}
      <div className="flex-1 flex flex-col p-4 lg:p-6 bg-muted/30 overflow-hidden">
        {/* Store Selector */}
        <div className="mb-4 bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Store className="w-5 h-5 text-primary" />
            <label className="text-sm font-medium">Active Store:</label>
            <select
              value={selectedStore?.id?.toString() || ""}
              onChange={(e) => {
                const store = stores.find(
                  (s) =>
                    s.id === Number(e.target.value) || s.id === e.target.value,
                );
                if (store) {
                  setSelectedStore(store);
                  setCart([]); // Clear cart when switching stores
                  loadProductsAndInventory(store.name);
                }
              }}
              className="flex-1 px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={!canSwitchStores}
            >
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name} - {store.address}
                </option>
              ))}
            </select>
            {!canSwitchStores && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-yellow-600 font-medium bg-yellow-50 px-3 py-1.5 rounded-full border border-yellow-200">
                  🔒 Locked to Your Store
                </span>
              </div>
            )}
          </div>
          {selectedStore && (
            <p className="text-xs text-muted-foreground mt-2 ml-8">
              {canSwitchStores
                ? `All transactions will be recorded at ${selectedStore.name}`
                : `You are assigned to ${selectedStore.name}. All transactions will be recorded here.`}
            </p>
          )}
        </div>

        {/* Action Bar */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => {
              setEditingProduct(null);
              setShowProductManager(true);
            }}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Product</span>
          </button>
          <button
            onClick={() => setShowCustomerForm(!showCustomerForm)}
            className="flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-2 rounded-lg hover:bg-accent transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span className="hidden sm:inline">
              {customer ? customer.name : "Add Customer"}
            </span>
          </button>
          <button
            onClick={() => loadProductsAndInventory()}
            disabled={loading}
            className="flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-2 rounded-lg hover:bg-accent transition-colors disabled:opacity-50"
            title="Refresh inventory from database"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Sync Inventory</span>
          </button>
        </div>

        {/* Customer Form */}
        {showCustomerForm && (
          <div className="mb-4 p-4 bg-card border border-border rounded-lg">
            <h3 className="mb-3 flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Customer Information
            </h3>
            <div className="grid grid-cols-1 gap-3">
              <input
                type="text"
                placeholder="Customer Name"
                value={customer?.name || ""}
                onChange={(e) =>
                  setCustomer({
                    name: e.target.value,
                  })
                }
                className="px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => {
                  setCustomer(null);
                  setShowCustomerForm(false);
                }}
                className="px-4 py-2 bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20 transition-colors text-sm"
              >
                Clear Customer
              </button>
              <button
                onClick={() => setShowCustomerForm(false)}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm"
              >
                Save
              </button>
            </div>
          </div>
        )}

        {/* Search and Filter */}
        <div className="mb-4">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search products by name or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedCategory("All")}
              className={`px-4 py-2 rounded-lg transition-colors text-sm ${
                selectedCategory === "All"
                  ? "bg-primary text-primary-foreground"
                  : "bg-background border border-border hover:bg-accent"
              }`}
            >
              All
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.name)}
                className={`px-4 py-2 rounded-lg transition-colors text-sm ${
                  selectedCategory === category.name
                    ? "bg-primary text-primary-foreground"
                    : "bg-background border border-border hover:bg-accent"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                onClick={() =>
                  product.stock > 0 && openWeightAdjustmentModal(product)
                }
                className={`bg-card border border-border rounded-lg p-4 hover:shadow-lg hover:border-primary transition-all group ${product.stock > 0 ? "cursor-pointer" : "opacity-50 cursor-not-allowed"}`}
              >
                <div className="flex flex-col h-full">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-sm flex-1">
                      {product.name}
                    </h3>
                    {currentUser?.role === "ADMIN" && (
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingProduct(product);
                            setShowProductManager(true);
                          }}
                          className="p-1 hover:bg-accent rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProduct(product.id);
                          }}
                          className="p-1 hover:bg-destructive/10 text-destructive rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded w-fit mb-2">
                    {product.category}
                  </span>
                  <p className="text-xs text-muted-foreground mb-3">
                    SKU: {product.sku}
                  </p>
                  <div className="mt-auto flex justify-between items-end">
                    <div>
                      <p className="text-xl text-primary">
                        ₱{product.price.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Stock: {product.stock}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Cart */}
      <div className="w-full lg:w-96 bg-card border-l border-border flex flex-col h-full lg:max-h-screen">
        <div className="bg-primary text-primary-foreground p-4 flex items-center gap-3 flex-shrink-0">
          <ShoppingCart className="w-6 h-6" />
          <h2 className="flex-1">Current Order</h2>
          <span className="bg-primary-foreground text-primary px-3 py-1 rounded-full text-sm">
            {cart.reduce((sum, item) => sum + item.quantity, 0)} items
          </span>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto min-h-0 p-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <ShoppingCart className="w-16 h-16 mb-4 opacity-20" />
              <p>No items in cart</p>
              <p className="text-sm">Add products to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Group items by price */}
              {Object.entries(
                cart.reduce(
                  (acc, item) => {
                    const basePrice = item.basePrice || item.price;
                    if (!acc[basePrice]) {
                      acc[basePrice] = [];
                    }
                    acc[basePrice].push(item);
                    return acc;
                  },
                  {} as { [key: number]: CartItem[] },
                ),
              )
                .sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]))
                .map(([basePrice, items]) => {
                  const basePriceNum = parseFloat(basePrice);
                  // Check if this base price group qualifies for wholesale
                  const isWholesale = wholesalePrices.has(basePriceNum);
                  const categoryTotal = items.reduce(
                    (sum, item) => sum + item.quantity,
                    0,
                  );

                  return (
                    <div
                      key={basePrice}
                      className="border border-border rounded-lg overflow-hidden"
                    >
                      {/* Category Header */}
                      <div
                        className={`p-3 font-semibold text-sm flex justify-between items-center ${
                          isWholesale
                            ? "bg-blue-50 text-blue-900 border-b border-blue-200"
                            : "bg-gray-50 text-gray-900 border-b border-gray-200"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span>₱{basePriceNum.toFixed(2)} Category</span>
                          <span className="text-xs bg-background px-2 py-1 rounded">
                            {categoryTotal} units
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-bold px-2 py-1 rounded ${
                              isWholesale
                                ? "bg-blue-600 text-white"
                                : "bg-gray-600 text-white"
                            }`}
                          >
                            {isWholesale ? "WHOLESALE" : "RETAIL"}
                          </span>
                          {isWholesale && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-semibold">
                              {discountSettings.discountType === "percentage"
                                ? `${discountSettings.wholesaleDiscountPercent}% OFF`
                                : `₱${discountSettings.wholesaleDiscountAmount.toFixed(2)} OFF`}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Category Items */}
                      <div className="space-y-2 p-3 bg-background/50">
                        {items.map((item) => (
                          <div
                            key={`${item.id}-${item.price}`}
                            className="bg-background rounded p-2 border border-border/50"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1">
                                <h4 className="font-medium text-sm">
                                  {item.name}
                                </h4>
                                <p className="text-xs text-muted-foreground">
                                  ₱{item.price.toFixed(2)} each
                                </p>
                              </div>
                              <button
                                onClick={() => removeFromCart(item.id)}
                                className="text-destructive hover:bg-destructive/10 p-1 rounded"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="flex items-center gap-2 mb-2">
                              <div className="flex items-center gap-1 bg-muted rounded-lg border border-border">
                                <button
                                  onClick={() => updateQuantity(item.id, -1)}
                                  disabled={item.quantity <= 1}
                                  className="p-1 hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed rounded-l-lg"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="w-6 text-center text-sm">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => {
                                    setWeightAdjustmentModal({
                                      show: true,
                                      product: item,
                                      weight: "1",
                                    });
                                  }}
                                  disabled={item.quantity >= item.stock}
                                  className="p-1 hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed rounded-r-lg"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>

                              <div className="flex items-center gap-1 flex-1">
                                <Percent className="w-3 h-3 text-muted-foreground" />
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={item.discount}
                                  onChange={(e) =>
                                    updateItemDiscount(
                                      item.id,
                                      parseFloat(e.target.value) || 0,
                                    )
                                  }
                                  placeholder="0"
                                  className="w-full px-2 py-0.5 bg-muted border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                                <span className="text-xs">%</span>
                              </div>
                            </div>

                            <div className="flex justify-between items-center text-xs">
                              <span className="text-muted-foreground">
                                Total:
                              </span>
                              <span className="text-primary font-medium">
                                ₱
                                {(
                                  item.price * item.quantity -
                                  (item.price * item.quantity * item.discount) /
                                    100 -
                                  (isWholesale
                                    ? discountSettings.discountType ===
                                      "percentage"
                                      ? (item.price *
                                          item.quantity *
                                          discountSettings.wholesaleDiscountPercent) /
                                        100
                                      : discountSettings.wholesaleDiscountAmount *
                                        item.quantity
                                    : 0)
                                ).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Cart Summary */}
        {cart.length > 0 && (
          <div className="border-t border-border p-4 space-y-4 flex-shrink-0 bg-background/95">
            {/* Global Discount */}
            <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
              <Percent className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">Global Discount:</span>
              <input
                type="number"
                min="0"
                max="100"
                value={globalDiscount}
                onChange={(e) =>
                  setGlobalDiscount(parseFloat(e.target.value) || 0)
                }
                placeholder="0"
                className="w-16 px-2 py-1 bg-background border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <span className="text-sm">%</span>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>₱{subtotal.toFixed(2)}</span>
              </div>
              {totalWholesaleDiscount > 0 && (
                <div className="flex justify-between text-blue-600">
                  <span>Wholesale Discount:</span>
                  <span>-₱{totalWholesaleDiscount.toFixed(2)}</span>
                </div>
              )}
              {globalDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount ({globalDiscount}%):</span>
                  <span>-₱{globalDiscountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-border">
                <span className="text-base">Total:</span>
                <span className="text-xl text-primary">
                  ₱{total.toFixed(2)}
                </span>
              </div>
            </div>

            {!showCheckout ? (
              <div className="space-y-2">
                <button
                  onClick={() => setShowCheckout(true)}
                  className="w-full bg-primary text-primary-foreground py-3 rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-4 h-4" />
                  Proceed to Payment
                </button>
                <button
                  onClick={clearCart}
                  className="w-full border border-border py-2 rounded-lg hover:bg-accent transition-colors text-sm"
                >
                  Clear Cart
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-center mb-2">
                  Select Payment Method
                </p>
                <button
                  onClick={() => handleCheckout("Cash")}
                  className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2.5 rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <Banknote className="w-5 h-5" />
                  Cash
                </button>
                <button
                  onClick={() => handleCheckout("Card")}
                  className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2.5 rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <CreditCard className="w-5 h-5" />
                  Card
                </button>
                <button
                  onClick={() => handleCheckout("Mobile Payment")}
                  className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2.5 rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <Smartphone className="w-5 h-5" />
                  Mobile Payment
                </button>
                <button
                  onClick={() => setShowCheckout(false)}
                  className="w-full border border-border py-2 rounded-lg hover:bg-accent transition-colors text-sm"
                >
                  Back
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Product Manager Modal */}
      {showProductManager && (
        <ProductManagerModal
          product={editingProduct}
          onSave={handleSaveProduct}
          onClose={() => {
            setShowProductManager(false);
            setEditingProduct(null);
          }}
        />
      )}

      {/* Receipt Modal */}
      {showReceiptModal && receiptData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-primary mb-2">RECEIPT</h2>
              <p className="text-sm text-muted-foreground">
                Transaction Completed
              </p>
            </div>

            <div className="border-t border-b border-border py-4 mb-6 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Date & Time:</span>
                <span className="font-medium">{receiptData.time}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Transaction #:</span>
                <span className="font-medium">{receiptData.transactionId}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Store:</span>
                <span className="font-medium">
                  {selectedStore?.name || "Main Store"}
                </span>
              </div>
              {customer && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Customer:</span>
                  <span className="font-medium">{customer.name}</span>
                </div>
              )}
            </div>

            <div className="mb-6">
              <h3 className="font-semibold text-sm mb-3">Items</h3>
              <div className="space-y-2">
                {receiptData.items.map((item, idx) => (
                  <div key={idx} className="text-sm">
                    <div className="flex justify-between">
                      <span>{item.name}</span>
                      <span className="font-medium">
                        ₱{item.total.toFixed(2)}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground pl-2">
                      {item.quantity} x ₱{item.price.toFixed(2)}
                      {item.discount > 0 && (
                        <span className="ml-2 text-orange-600">
                          -{item.discount}%
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-b border-border py-3 mb-6 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal:</span>
                <span>₱{receiptData.subtotal.toFixed(2)}</span>
              </div>
              {receiptData.globalDiscount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Global Discount ({receiptData.globalDiscountPercent || 0}%):
                  </span>
                  <span className="text-orange-600">
                    -₱{receiptData.globalDiscount.toFixed(2)}
                  </span>
                </div>
              )}
              {receiptData.wholesaleDiscount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Wholesale Discount:
                  </span>
                  <span className="text-orange-600">
                    -₱{receiptData.wholesaleDiscount.toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            <div className="bg-primary/10 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-baseline">
                <span className="text-lg font-semibold text-foreground">
                  Total:
                </span>
                <span className="text-3xl font-bold text-primary">
                  ₱{receiptData.total.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="text-center mb-6">
              <p className="text-sm text-muted-foreground font-medium">
                Thank you for your business!
              </p>
            </div>

            <button
              onClick={() => setShowReceiptModal(false)}
              className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg hover:bg-primary/90 transition-colors font-medium"
            >
              Close Receipt
            </button>
          </div>
        </div>
      )}

      {/* Weight Adjustment Modal */}
      {weightAdjustmentModal.show && weightAdjustmentModal.product && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">
              Adjust Package Weight
            </h2>

            {/* Product Details */}
            <div className="bg-muted/50 rounded-lg p-4 mb-6 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Product:</span>
                <span className="font-medium">
                  {weightAdjustmentModal.product.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">SKU:</span>
                <span className="text-sm">
                  {weightAdjustmentModal.product.sku}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Base Price (1kg):
                </span>
                <span className="font-medium text-primary">
                  ₱{weightAdjustmentModal.product.price.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Weight Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Actual Weight (kg)
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={weightAdjustmentModal.weight}
                onChange={(e) =>
                  setWeightAdjustmentModal({
                    ...weightAdjustmentModal,
                    weight: e.target.value,
                  })
                }
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter weight"
              />
            </div>

            {/* Adjusted Price Display */}
            <div className="bg-primary/10 rounded-lg p-4 mb-6">
              <div className="text-sm text-muted-foreground mb-1">
                Adjusted Price:
              </div>
              <div className="text-2xl font-bold text-primary">
                ₱
                {(
                  weightAdjustmentModal.product.price *
                  (parseFloat(weightAdjustmentModal.weight) || 1)
                ).toFixed(2)}
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                {parseFloat(weightAdjustmentModal.weight) || 1}kg × ₱
                {weightAdjustmentModal.product.price.toFixed(2)}/kg
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() =>
                  setWeightAdjustmentModal({
                    show: false,
                    product: null,
                    weight: "1",
                  })
                }
                className="flex-1 border border-border py-2 rounded-lg hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const adjustedPrice =
                    weightAdjustmentModal.product.price *
                    (parseFloat(weightAdjustmentModal.weight) || 1);
                  addToCart(adjustedPrice);
                }}
                className="flex-1 bg-primary text-primary-foreground py-2 rounded-lg hover:bg-primary/90 transition-colors font-medium"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Product Manager Modal Component
function ProductManagerModal({
  product,
  onSave,
  onClose,
}: {
  product: Product | null;
  onSave: (product: Product) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    name: product?.name || "",
    sku: product?.sku || "",
    category: product?.category || "",
    unit: "kg",
    price: product?.price || 0,
    storeLocation: "",
    initialQuantity: product?.stock || 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stores, setStores] = useState<StoreLocation[]>([]);

  useEffect(() => {
    loadCategories();
    loadStores();
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

  const loadStores = async () => {
    try {
      const storesData = await getStores();
      setStores(storesData);
      if (storesData.length > 0 && !formData.storeLocation) {
        setFormData((prev) => ({ ...prev, storeLocation: storesData[0].name }));
      }
    } catch (error) {
      console.error("Error loading stores:", error);
      toast.error("Failed to load stores");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.sku || formData.price <= 0) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!product && !formData.storeLocation) {
      toast.error("Please select a store location");
      return;
    }

    if (isSubmitting) return;

    try {
      setIsSubmitting(true);

      if (product) {
        // Update existing product (edit mode)
        toast.info("Edit functionality not yet implemented");
        onClose();
      } else {
        // Add new product to database
        const existingProducts = await getProducts();
        const duplicateProduct = existingProducts.find(
          (p: APIProduct) =>
            p.name.toLowerCase() === formData.name.toLowerCase(),
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

        // Create inventory record for the selected store with initial quantity
        await addInventory(
          newProduct.id,
          formData.storeLocation,
          formData.initialQuantity,
        );

        toast.success(
          `Product added to ${formData.storeLocation} with ${formData.initialQuantity} ${formData.unit}`,
        );

        // Reload products
        window.location.reload();
        onClose();
      }
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error("Failed to save product");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2>{product ? "Edit Product" : "Add New Product"}</h2>
          <button onClick={onClose} className="p-2 hover:bg-accent rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-2">Product Name *</label>
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
            <label className="block text-sm mb-2">SKU *</label>
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

          <div>
            <label className="block text-sm mb-2">Category *</label>
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

          <div>
            <label className="block text-sm mb-2">Price (₱) *</label>
            <input
              type="number"
              step="0.01"
              min="0"
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

          {!product && (
            <>
              <div>
                <label className="block text-sm mb-2">Store Location *</label>
                {stores.length > 0 ? (
                  <select
                    value={formData.storeLocation}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        storeLocation: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  >
                    <option value="">Select Store Location</option>
                    {stores.map((store) => (
                      <option key={store.id} value={store.name}>
                        {store.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="text-sm text-muted-foreground p-3 bg-muted rounded-lg">
                    No store locations available. Please create store locations
                    first.
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm mb-2">Initial Quantity</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.initialQuantity}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      initialQuantity: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
            </>
          )}

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
              {isSubmitting
                ? "Saving..."
                : product
                  ? "Update Product"
                  : "Add Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
