import { useState, useEffect } from "react";
import { Save, AlertCircle, Percent, Package, Search, Tag, XCircle } from "lucide-react";
import { toast } from "sonner";
import {
  getDiscountSettings,
  updateDiscountSettings,
  getProducts,
  toggleProductDiscountable,
  type Product,
} from "../../utils/api";

export function DiscountsPage({ userRole }: { userRole?: string }) {
  const isAdmin = userRole === "ADMIN";
  const [settings, setSettings] = useState({
    wholesaleMinUnits: 5,
    discountType: "percentage" as "percentage" | "fixed_amount",
    wholesaleDiscountPercent: 1,
    wholesaleDiscountAmount: 0,
  });
  const [originalSettings, setOriginalSettings] = useState({
    wholesaleMinUnits: 5,
    discountType: "percentage" as "percentage" | "fixed_amount",
    wholesaleDiscountPercent: 1,
    wholesaleDiscountAmount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [productSearch, setProductSearch] = useState("");

  useEffect(() => {
    loadSettings();
    loadProducts();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await getDiscountSettings();
      setSettings({
        wholesaleMinUnits: data.wholesaleMinUnits,
        discountType: data.discountType,
        wholesaleDiscountPercent: data.wholesaleDiscountPercent,
        wholesaleDiscountAmount: data.wholesaleDiscountAmount || 0,
      });
      setOriginalSettings({
        wholesaleMinUnits: data.wholesaleMinUnits,
        discountType: data.discountType,
        wholesaleDiscountPercent: data.wholesaleDiscountPercent,
        wholesaleDiscountAmount: data.wholesaleDiscountAmount || 0,
      });
    } catch (error) {
      console.error("Error loading discount settings:", error);
      toast.error("Failed to load discount settings");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof typeof settings, value: any) => {
    const newSettings = { ...settings, [field]: value };
    setSettings(newSettings);

    const changed =
      newSettings.wholesaleMinUnits !== originalSettings.wholesaleMinUnits ||
      newSettings.discountType !== originalSettings.discountType ||
      newSettings.wholesaleDiscountPercent !==
        originalSettings.wholesaleDiscountPercent ||
      newSettings.wholesaleDiscountAmount !==
        originalSettings.wholesaleDiscountAmount;
    setHasChanges(changed);
  };

  const handleSave = async () => {
    if (settings.wholesaleMinUnits < 1) {
      toast.error("Minimum units must be at least 1");
      return;
    }

    if (settings.wholesaleMinUnits > 1000) {
      toast.error("Minimum units cannot exceed 1000");
      return;
    }

    if (settings.discountType === "percentage") {
      if (settings.wholesaleDiscountPercent < 0) {
        toast.error("Discount percentage cannot be negative");
        return;
      }
      if (settings.wholesaleDiscountPercent > 100) {
        toast.error("Discount percentage cannot exceed 100%");
        return;
      }
    } else {
      if (settings.wholesaleDiscountAmount < 0) {
        toast.error("Discount amount cannot be negative");
        return;
      }
    }

    try {
      setSaving(true);
      await updateDiscountSettings({
        wholesaleMinUnits: settings.wholesaleMinUnits,
        discountType: settings.discountType,
        wholesaleDiscountPercent: settings.wholesaleDiscountPercent,
        wholesaleDiscountAmount: settings.wholesaleDiscountAmount,
      });

      setOriginalSettings(settings);
      setHasChanges(false);
      toast.success("Discount settings updated successfully");
    } catch (error) {
      console.error("Error updating settings:", error);
      toast.error("Failed to update discount settings");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(originalSettings);
    setHasChanges(false);
  };

  const loadProducts = async () => {
    try {
      setProductsLoading(true);
      const data = await getProducts();
      setProducts(data);
    } catch (error) {
      console.error("Error loading products:", error);
    } finally {
      setProductsLoading(false);
    }
  };

  const handleToggleDiscountable = async (product: Product) => {
    if (!isAdmin) return;
    const newVal = product.discountable === false ? true : false;
    setTogglingId(String(product.id));
    try {
      const updated = await toggleProductDiscountable(String(product.id), newVal);
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, discountable: updated.discountable } : p)),
      );
      toast.success(
        newVal ? `${product.name} is now discountable` : `${product.name} excluded from discounts`,
      );
    } catch (error) {
      toast.error("Failed to update product discount eligibility");
    } finally {
      setTogglingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  const exampleOrderTotal = 1000;
  const discountAmount =
    settings.discountType === "percentage"
      ? (settings.wholesaleDiscountPercent / 100) * exampleOrderTotal
      : settings.wholesaleDiscountAmount;

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    (p.category ?? "").toLowerCase().includes(productSearch.toLowerCase()),
  );
  const discountableCount = products.filter((p) => p.discountable !== false).length;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Discount Settings</h1>
        <p className="text-gray-600 mt-2">
          Configure wholesale and retail discount parameters
        </p>
      </div>

      <div className="flex gap-6 items-start">
        {/* ── LEFT: Settings ─────────────────────────────────── */}
        <div className="flex-1 min-w-0">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-700">
              <p className="font-medium">How it works:</p>
              <p className="mt-1">
                When the total quantity of items in an order reaches the minimum
                units threshold, the entire order is classified as wholesale and
                receives the configured discount.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="space-y-6">
              <div>
                <label
                  htmlFor="minUnits"
                  className="block text-sm font-medium text-gray-900 mb-2"
                >
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-red-600" />
                    Minimum Units for Wholesale
                  </div>
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  Orders with total items equal to or greater than this will be
                  classified as wholesale
                </p>
                <div className="flex items-center gap-3">
                  <input
                    id="minUnits"
                    type="number"
                    min="1"
                    max="1000"
                    step="1"
                    value={settings.wholesaleMinUnits}
                    onChange={(e) =>
                      handleChange(
                        "wholesaleMinUnits",
                        parseInt(e.target.value) || 1,
                      )
                    }
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent w-32"
                  />
                  <span className="text-gray-600 font-medium">units</span>
                </div>
                <div className="mt-3 p-3 bg-gray-50 rounded text-sm text-gray-700">
                  <p>
                    <strong>Current:</strong> Orders with{" "}
                    <strong>{settings.wholesaleMinUnits} or more units</strong>{" "}
                    qualify as wholesale
                  </p>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-200">
                <label className="block text-sm font-medium text-gray-900 mb-4">
                  <div className="flex items-center gap-2">
                    <Percent className="w-5 h-5 text-red-600" />
                    Discount Type
                  </div>
                </label>
                <div className="flex gap-4 mb-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="discountType"
                      value="percentage"
                      checked={settings.discountType === "percentage"}
                      onChange={() => handleChange("discountType", "percentage")}
                      className="w-4 h-4 text-red-600 cursor-pointer"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Percentage Discount
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="discountType"
                      value="fixed_amount"
                      checked={settings.discountType === "fixed_amount"}
                      onChange={() => handleChange("discountType", "fixed_amount")}
                      className="w-4 h-4 text-red-600 cursor-pointer"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Fixed Amount Discount
                    </span>
                  </label>
                </div>

                {settings.discountType === "percentage" && (
                  <div>
                    <label
                      htmlFor="discountPercent"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Discount Percentage
                    </label>
                    <p className="text-xs text-gray-500 mb-3">
                      The percentage of the order total to discount
                    </p>
                    <div className="flex items-center gap-3 mb-3">
                      <input
                        id="discountPercent"
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={settings.wholesaleDiscountPercent}
                        onChange={(e) =>
                          handleChange(
                            "wholesaleDiscountPercent",
                            parseFloat(e.target.value) || 0,
                          )
                        }
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent w-32"
                      />
                      <span className="text-gray-600 font-medium">%</span>
                    </div>
                    <div className="p-3 bg-gray-50 rounded text-sm text-gray-700">
                      <p>
                        <strong>Current:</strong>{" "}
                        <strong>
                          {settings.wholesaleDiscountPercent}% discount
                        </strong>{" "}
                        applied to wholesale orders
                      </p>
                    </div>
                  </div>
                )}

                {settings.discountType === "fixed_amount" && (
                  <div>
                    <label
                      htmlFor="discountAmount"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Fixed Discount Amount
                    </label>
                    <p className="text-xs text-gray-500 mb-3">
                      The fixed amount (in ₱) to deduct from the order total
                    </p>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-gray-600 font-medium">₱</span>
                      <input
                        id="discountAmount"
                        type="number"
                        min="0"
                        step="0.01"
                        value={settings.wholesaleDiscountAmount}
                        onChange={(e) =>
                          handleChange(
                            "wholesaleDiscountAmount",
                            parseFloat(e.target.value) || 0,
                          )
                        }
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent w-32"
                      />
                    </div>
                    <div className="p-3 bg-gray-50 rounded text-sm text-gray-700">
                      <p>
                        <strong>Current:</strong>{" "}
                        <strong>
                          ₱{settings.wholesaleDiscountAmount.toFixed(2)} discount
                        </strong>{" "}
                        applied to wholesale orders
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 mb-3">
                  Example Calculation
                </h3>
                <div className="bg-gradient-to-br from-red-50 to-orange-50 border border-red-200 rounded-lg p-4 space-y-2 text-sm">
                  <p>
                    <span className="text-gray-600">
                      Order with 10 items totaling ₱
                      {exampleOrderTotal.toLocaleString()}:
                    </span>
                  </p>
                  <ul className="space-y-1 ml-4 text-gray-700">
                    <li>
                      ✓ Qualifies as wholesale:{" "}
                      {10 >= settings.wholesaleMinUnits ? "Yes" : "No"}
                    </li>
                    <li>💰 Discount amount: ₱{discountAmount.toFixed(2)}</li>
                    <li>
                      📊 Final price: ₱
                      {(exampleOrderTotal - discountAmount).toFixed(2)}
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              {isAdmin && (
              <button
                onClick={handleSave}
                disabled={!hasChanges || saving}
                className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
              >
                <Save className="w-5 h-5" />
                {saving ? "Saving..." : "Save Changes"}
              </button>
              )}
              {isAdmin && (
              <button
                onClick={handleReset}
                disabled={!hasChanges}
                className="flex items-center gap-2 px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                Reset
              </button>
              )}
            </div>

            {hasChanges && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-yellow-800">
                  You have unsaved changes. Click "Save Changes" to apply them.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Products panel ───────────────────────────── */}
        <div className="w-80 flex-shrink-0">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-red-600" />
                  Discountable Products
                </h2>
                <span className="text-xs text-gray-500">
                  {discountableCount}/{products.length} eligible
                </span>
              </div>
              <p className="text-xs text-gray-500 mb-3">
                Toggle to include or exclude products from wholesale discounts
              </p>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="overflow-y-auto max-h-[560px]">
              {productsLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" />
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="p-6 text-center text-sm text-gray-400">
                  No products found
                </div>
              ) : (
                filteredProducts.map((product) => {
                  const isDiscountable = product.discountable !== false;
                  const isToggling = togglingId === String(product.id);
                  return (
                    <div
                      key={product.id}
                      className="flex items-center justify-between px-4 py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {isDiscountable ? (
                          <Tag className="w-4 h-4 text-green-500 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className={`text-sm font-medium truncate ${isDiscountable ? "text-gray-900" : "text-gray-400"}`}>
                            {product.name}
                          </p>
                          <p className="text-xs text-gray-400 truncate">{product.category}</p>
                        </div>
                      </div>
                      {isAdmin ? (
                        <button
                          onClick={() => handleToggleDiscountable(product)}
                          disabled={isToggling}
                          title={isDiscountable ? "Click to exclude from discounts" : "Click to include in discounts"}
                          className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors focus:outline-none ml-2 ${
                            isToggling ? "opacity-50 cursor-wait" : "cursor-pointer"
                          } ${isDiscountable ? "bg-green-500" : "bg-gray-300"}`}
                        >
                          <span
                            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                              isDiscountable ? "translate-x-5" : "translate-x-0"
                            }`}
                          />
                        </button>
                      ) : (
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            isDiscountable ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {isDiscountable ? "Eligible" : "Excluded"}
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
