import { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Percent,
  Package,
  Search,
  Tag,
  XCircle,
  Edit2,
  Check,
  X,
  Scale,
} from "lucide-react";
import { toast } from "sonner";
import {
  getDiscounts,
  createDiscount,
  updateDiscount,
  deleteDiscount,
  updateDiscountProducts,
  getProducts,
  getFractionalPrices,
  setFractionalPrice,
  deleteFractionalPrice,
  type Discount,
  type Product,
  type FractionalPriceRule,
} from "../../utils/api";

interface DiscountCardProps {
  discount: Discount;
  products: Product[];
  isAdmin: boolean;
  onUpdated: (d: Discount) => void;
  onDeleted: (id: number) => void;
}

function DiscountCard({
  discount,
  products,
  isAdmin,
  onUpdated,
  onDeleted,
}: DiscountCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [name, setName] = useState(discount.name);
  const [minUnits, setMinUnits] = useState(discount.wholesaleMinUnits);
  const [discountType, setDiscountType] = useState<
    "percentage" | "fixed_amount"
  >(discount.discountType);
  const [discountValue, setDiscountValue] = useState(discount.discountValue);
  const [isActive, setIsActive] = useState(discount.isActive);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<number>>(
    new Set(discount.productIds),
  );

  useEffect(() => {
    setName(discount.name);
    setMinUnits(discount.wholesaleMinUnits);
    setDiscountType(discount.discountType);
    setDiscountValue(discount.discountValue);
    setIsActive(discount.isActive);
    setSelectedProductIds(new Set(discount.productIds));
  }, [discount]);

  const handleSaveSettings = async () => {
    if (!name.trim()) {
      toast.error("Discount name is required");
      return;
    }
    if (minUnits < 1) {
      toast.error("Minimum units must be at least 1");
      return;
    }
    if (
      discountType === "percentage" &&
      (discountValue < 0 || discountValue > 100)
    ) {
      toast.error("Percentage must be between 0 and 100");
      return;
    }
    if (discountType === "fixed_amount" && discountValue < 0) {
      toast.error("Fixed amount cannot be negative");
      return;
    }
    setSaving(true);
    try {
      const updated = await updateDiscount(discount.id, {
        name: name.trim(),
        wholesaleMinUnits: minUnits,
        discountType,
        discountValue,
        isActive,
      });
      onUpdated({ ...updated, productIds: Array.from(selectedProductIds) });
      setEditing(false);
      toast.success("Discount updated");
    } catch {
      toast.error("Failed to update discount");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async () => {
    if (!isAdmin) return;
    const newActive = !isActive;
    setIsActive(newActive);
    try {
      const updated = await updateDiscount(discount.id, {
        isActive: newActive,
      });
      onUpdated({ ...updated, productIds: Array.from(selectedProductIds) });
    } catch {
      setIsActive(isActive);
      toast.error("Failed to update discount");
    }
  };

  const handleCancelEdit = () => {
    setName(discount.name);
    setMinUnits(discount.wholesaleMinUnits);
    setDiscountType(discount.discountType);
    setDiscountValue(discount.discountValue);
    setIsActive(discount.isActive);
    setEditing(false);
  };

  const handleToggleProduct = async (productId: number) => {
    if (!isAdmin) return;
    const newSet = new Set(selectedProductIds);
    if (newSet.has(productId)) {
      newSet.delete(productId);
    } else {
      newSet.add(productId);
    }
    setSelectedProductIds(newSet);
    try {
      const updated = await updateDiscountProducts(
        discount.id,
        Array.from(newSet),
      );
      onUpdated(updated);
    } catch {
      setSelectedProductIds(selectedProductIds);
      toast.error("Failed to update product assignment");
    }
  };

  const handleSelectAll = async () => {
    if (!isAdmin) return;
    const allIds = products.map((p) => parseInt(String(p.id)));
    setSelectedProductIds(new Set(allIds));
    try {
      const updated = await updateDiscountProducts(discount.id, allIds);
      onUpdated(updated);
      toast.success("All products selected");
    } catch {
      toast.error("Failed to update");
    }
  };

  const handleDeselectAll = async () => {
    if (!isAdmin) return;
    setSelectedProductIds(new Set());
    try {
      const updated = await updateDiscountProducts(discount.id, []);
      onUpdated(updated);
      toast.success("All products deselected");
    } catch {
      toast.error("Failed to update");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteDiscount(discount.id);
      onDeleted(discount.id);
      toast.success(`"${discount.name}" deleted`);
    } catch {
      toast.error("Failed to delete discount");
      setConfirmDelete(false);
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      (p.category ?? "").toLowerCase().includes(productSearch.toLowerCase()),
  );

  const selectedCount = selectedProductIds.size;

  return (
    <div
      className={`bg-white rounded-lg border-2 shadow-sm transition-all ${
        isActive ? "border-green-200" : "border-gray-200"
      }`}
    >
      {/* Card Header */}
      <div className="p-5">
        <div className="flex items-center gap-3">
          {/* Active toggle */}
          {isAdmin && (
            <button
              onClick={handleToggleActive}
              title={isActive ? "Click to deactivate" : "Click to activate"}
              className={`relative flex-shrink-0 w-10 h-5 rounded-full transition-colors focus:outline-none ${
                isActive ? "bg-green-500" : "bg-gray-300"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  isActive ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          )}

          {/* Name */}
          <div className="flex-1 min-w-0">
            {editing ? (
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-base font-semibold border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                autoFocus
              />
            ) : (
              <div className="flex items-center gap-2">
                <span
                  className={`text-base font-semibold truncate ${
                    isActive ? "text-gray-900" : "text-gray-400"
                  }`}
                >
                  {discount.name}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    isActive
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {isActive ? "Active" : "Inactive"}
                </span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {isAdmin &&
              (editing ? (
                <>
                  <button
                    onClick={handleSaveSettings}
                    disabled={saving}
                    className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700 disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" />
                    {saving ? "Saving…" : "Save"}
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 text-gray-700 rounded text-xs font-medium hover:bg-gray-50"
                  >
                    <X className="w-3.5 h-3.5" />
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setEditing(true);
                      setExpanded(true);
                    }}
                    className="p-1.5 text-gray-400 hover:text-gray-700 rounded hover:bg-gray-100"
                    title="Edit discount"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  {confirmDelete ? (
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-red-600 font-medium">
                        Delete?
                      </span>
                      <button
                        onClick={handleDelete}
                        className="px-2 py-1 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setConfirmDelete(false)}
                        className="px-2 py-1 border border-gray-300 text-gray-700 rounded text-xs font-medium hover:bg-gray-50"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(true)}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-red-50"
                      title="Delete discount"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </>
              ))}
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1.5 text-gray-400 hover:text-gray-700 rounded hover:bg-gray-100"
            >
              {expanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Quick summary row */}
        {!editing && (
          <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-red-500" />
              Min{" "}
              <strong className="text-gray-800">
                {discount.wholesaleMinUnits}
              </strong>{" "}
              units
            </span>
            <span className="flex items-center gap-1.5">
              <Percent className="w-3.5 h-3.5 text-red-500" />
              {discount.discountType === "percentage" ? (
                <>
                  <strong className="text-gray-800">
                    {discount.discountValue}%
                  </strong>{" "}
                  off
                </>
              ) : (
                <>
                  <strong className="text-gray-800">
                    ₱{discount.discountValue.toFixed(2)}
                  </strong>{" "}
                  off per unit
                </>
              )}
            </span>
            <span className="flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-red-500" />
              <strong className="text-gray-800">{selectedCount}</strong> product
              {selectedCount !== 1 ? "s" : ""}
            </span>
          </div>
        )}
      </div>

      {/* Expanded body */}
      {expanded && (
        <div className="border-t border-gray-100 p-5 space-y-6">
          {/* Settings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                Minimum Units Threshold
              </label>
              {editing ? (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="9999"
                    value={minUnits}
                    onChange={(e) => setMinUnits(parseInt(e.target.value) || 1)}
                    className="w-24 px-3 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                  />
                  <span className="text-sm text-gray-500">units</span>
                </div>
              ) : (
                <p className="text-sm text-gray-700">
                  Orders with{" "}
                  <strong>{discount.wholesaleMinUnits}+ units</strong> of these
                  products qualify for wholesale pricing.
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                Discount Type &amp; Value
              </label>
              {editing ? (
                <div className="space-y-2">
                  <div className="flex gap-4">
                    <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                      <input
                        type="radio"
                        name={`dtype-${discount.id}`}
                        value="percentage"
                        checked={discountType === "percentage"}
                        onChange={() => setDiscountType("percentage")}
                        className="w-3.5 h-3.5 text-red-600"
                      />
                      Percentage
                    </label>
                    <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                      <input
                        type="radio"
                        name={`dtype-${discount.id}`}
                        value="fixed_amount"
                        checked={discountType === "fixed_amount"}
                        onChange={() => setDiscountType("fixed_amount")}
                        className="w-3.5 h-3.5 text-red-600"
                      />
                      Fixed Amount
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    {discountType === "fixed_amount" && (
                      <span className="text-sm text-gray-600">₱</span>
                    )}
                    <input
                      type="number"
                      min="0"
                      max={discountType === "percentage" ? 100 : undefined}
                      step="0.01"
                      value={discountValue}
                      onChange={(e) =>
                        setDiscountValue(parseFloat(e.target.value) || 0)
                      }
                      className="w-28 px-3 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                    />
                    {discountType === "percentage" && (
                      <span className="text-sm text-gray-600">%</span>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-700">
                  {discount.discountType === "percentage" ? (
                    <>
                      <strong>{discount.discountValue}%</strong> off the item
                      total
                    </>
                  ) : (
                    <>
                      <strong>₱{discount.discountValue.toFixed(2)}</strong> off
                      per unit
                    </>
                  )}
                </p>
              )}
            </div>
          </div>

          {/* Product selection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Applicable Products
                </h4>
                <p className="text-xs text-gray-400 mt-0.5">
                  {selectedCount} of {products.length} selected — discount
                  applies only to selected products
                </p>
              </div>
              {isAdmin && (
                <div className="flex gap-2">
                  <button
                    onClick={handleSelectAll}
                    className="text-xs px-2 py-1 border border-gray-300 rounded hover:bg-gray-50 text-gray-600"
                  >
                    Select all
                  </button>
                  <button
                    onClick={handleDeselectAll}
                    className="text-xs px-2 py-1 border border-gray-300 rounded hover:bg-gray-50 text-gray-600"
                  >
                    Clear all
                  </button>
                </div>
              )}
            </div>

            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search products…"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            <div className="border border-gray-200 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
              {filteredProducts.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-400">
                  No products found
                </div>
              ) : (
                filteredProducts.map((product) => {
                  const pid = parseInt(String(product.id));
                  const isSelected = selectedProductIds.has(pid);
                  return (
                    <div
                      key={product.id}
                      onClick={() => isAdmin && handleToggleProduct(pid)}
                      className={`flex items-center gap-3 px-4 py-2.5 border-b border-gray-100 last:border-0 transition-colors ${
                        isAdmin ? "cursor-pointer hover:bg-gray-50" : ""
                      } ${isSelected ? "bg-green-50" : ""}`}
                    >
                      <div
                        className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                          isSelected
                            ? "bg-green-500 border-green-500"
                            : "bg-white border-gray-300"
                        }`}
                      >
                        {isSelected && (
                          <Check className="w-2.5 h-2.5 text-white" />
                        )}
                      </div>
                      {isSelected ? (
                        <Tag className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-sm font-medium truncate ${
                            isSelected ? "text-gray-900" : "text-gray-500"
                          }`}
                        >
                          {product.name}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {product.category}
                        </p>
                      </div>
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${
                          isSelected
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        {isSelected ? "Included" : "Excluded"}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export function DiscountsPage({ userRole }: { userRole?: string }) {
  const isAdmin = userRole === "ADMIN";
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [fractionalRules, setFractionalRules] = useState<
    Map<number, FractionalPriceRule>
  >(new Map());
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [fractSearch, setFractSearch] = useState("");
  // Local pending edits for fractional prices (productId -> string input)
  const [fractPriceInputs, setFractPriceInputs] = useState<Map<number, string>>(new Map());
  const [fractThreshInputs, setFractThreshInputs] = useState<Map<number, string>>(new Map());
  const [fractSaving, setFractSaving] = useState<Set<number>>(new Set());

  useEffect(() => {
    Promise.all([
      getDiscounts().then(setDiscounts),
      getProducts().then(setProducts),
      getFractionalPrices().then((rules) => {
        const map = new Map<number, FractionalPriceRule>();
        rules.forEach((r) => map.set(r.productId, r));
        setFractionalRules(map);
      }),
    ])
      .catch(() => toast.error("Failed to load settings"))
      .finally(() => setLoading(false));
  }, []);

  // ── Discounts handlers ────────────────────────────────────────────────────

  const handleCreate = async () => {
    const name = newName.trim() || "New Discount";
    setCreating(true);
    try {
      const created = await createDiscount({
        name,
        wholesaleMinUnits: 5,
        discountType: "percentage",
        discountValue: 0,
        isActive: true,
        productIds: [],
      });
      setDiscounts((prev) => [...prev, created]);
      setNewName("");
      toast.success(`"${created.name}" created`);
    } catch {
      toast.error("Failed to create discount");
    } finally {
      setCreating(false);
    }
  };

  const handleUpdated = (updated: Discount) => {
    setDiscounts((prev) =>
      prev.map((d) => (d.id === updated.id ? updated : d)),
    );
  };

  const handleDeleted = (id: number) => {
    setDiscounts((prev) => prev.filter((d) => d.id !== id));
  };

  // ── Fractional price handlers ─────────────────────────────────────────────

  const getFractPriceInput = (pid: number) => {
    if (fractPriceInputs.has(pid)) return fractPriceInputs.get(pid)!;
    const rule = fractionalRules.get(pid);
    return rule !== undefined ? String(rule.fractionalPrice) : "";
  };

  const getFractThreshInput = (pid: number) => {
    if (fractThreshInputs.has(pid)) return fractThreshInputs.get(pid)!;
    const rule = fractionalRules.get(pid);
    return rule !== undefined ? String(rule.thresholdWeight) : "1";
  };

  const handleSaveFractional = async (pid: number) => {
    const rawPrice = getFractPriceInput(pid);
    const rawThresh = getFractThreshInput(pid);
    const price = parseFloat(rawPrice);
    const threshold = parseFloat(rawThresh);
    if (isNaN(price) || price < 0) {
      toast.error("Enter a valid price (0 or greater)");
      return;
    }
    if (isNaN(threshold) || threshold <= 0) {
      toast.error("Threshold weight must be greater than 0");
      return;
    }
    setFractSaving((prev) => new Set(prev).add(pid));
    try {
      if (price === 0 && !fractionalRules.has(pid)) {
        setFractPriceInputs((prev) => { const m = new Map(prev); m.delete(pid); return m; });
        setFractThreshInputs((prev) => { const m = new Map(prev); m.delete(pid); return m; });
        return;
      }
      if (price === 0) {
        await deleteFractionalPrice(pid);
        setFractionalRules((prev) => { const m = new Map(prev); m.delete(pid); return m; });
      } else {
        const rule = await setFractionalPrice(pid, price, threshold);
        setFractionalRules((prev) => new Map(prev).set(pid, rule));
      }
      setFractPriceInputs((prev) => { const m = new Map(prev); m.delete(pid); return m; });
      setFractThreshInputs((prev) => { const m = new Map(prev); m.delete(pid); return m; });
      toast.success("Partial unit price saved");
    } catch {
      toast.error("Failed to save partial unit price");
    } finally {
      setFractSaving((prev) => { const s = new Set(prev); s.delete(pid); return s; });
    }
  };

  const handleClearFractional = async (pid: number) => {
    setFractSaving((prev) => new Set(prev).add(pid));
    try {
      await deleteFractionalPrice(pid);
      setFractionalRules((prev) => { const m = new Map(prev); m.delete(pid); return m; });
      setFractPriceInputs((prev) => { const m = new Map(prev); m.delete(pid); return m; });
      setFractThreshInputs((prev) => { const m = new Map(prev); m.delete(pid); return m; });
      toast.success("Partial unit price removed");
    } catch {
      toast.error("Failed to remove partial unit price");
    } finally {
      setFractSaving((prev) => { const s = new Set(prev); s.delete(pid); return s; });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600" />
      </div>
    );
  }

  const filteredFractProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(fractSearch.toLowerCase()) ||
      (p.category ?? "").toLowerCase().includes(fractSearch.toLowerCase()),
  );
  const rulesCount = fractionalRules.size;

  return (
    <div className="p-6 max-w-4xl space-y-10">
      {/* ── Page Header ───────────────────────────────────────────── */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">
          Manage discount rules and partial-unit pricing for your products.
        </p>
      </div>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* SECTION 1 — DISCOUNT RULES                               */}
      {/* ══════════════════════════════════════════════════════════ */}
      <section>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <Percent className="w-5 h-5 text-red-600" />
              Discount Rules
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Each discount applies to its own set of products when the minimum
              units threshold is reached.
            </p>
          </div>
          {isAdmin && (
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Discount name…"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent w-44"
              />
              <button
                onClick={handleCreate}
                disabled={creating}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                {creating ? "Adding…" : "Add Discount"}
              </button>
            </div>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-5 flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700">
            <p className="font-medium">How discounts work</p>
            <p className="mt-1">
              When a customer orders at least the configured minimum units of
              the selected products, the wholesale discount is applied to those
              items. Multiple discounts coexist and apply independently.
            </p>
          </div>
        </div>

        {discounts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-200">
            <Tag className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-gray-500">No discounts yet</h3>
            <p className="text-xs text-gray-400 mt-1">
              {isAdmin
                ? 'Click "Add Discount" to create your first discount rule.'
                : "No discount rules have been configured."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {discounts.map((d) => (
              <DiscountCard
                key={d.id}
                discount={d}
                products={products}
                isAdmin={isAdmin}
                onUpdated={handleUpdated}
                onDeleted={handleDeleted}
              />
            ))}
          </div>
        )}
      </section>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* SECTION 2 — PARTIAL UNIT PRICING                         */}
      {/* ══════════════════════════════════════════════════════════ */}
      <section>
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Scale className="w-5 h-5 text-red-600" />
            Partial Unit Pricing
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Set a special flat price for when a product is sold below a configurable
            weight threshold. Normal proportional pricing applies at or above
            the threshold.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-5 flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700">
            <p className="font-medium">How partial unit pricing works</p>
            <p className="mt-1">
              If a product is sold <strong>below the configured threshold</strong>,
              the flat price is charged instead of the proportional price.
              For example: threshold = 0.5 kg, partial price = ₱30 — selling
              any weight under 0.5 kg charges ₱30 flat. Leave price at 0 to
              disable for a product.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          {/* Header row */}
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search products…"
                value={fractSearch}
                onChange={(e) => setFractSearch(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent w-full"
              />
            </div>
            <span className="text-xs text-gray-500 ml-4">
              {rulesCount} rule{rulesCount !== 1 ? "s" : ""} configured
            </span>
          </div>

          {/* Product rows */}
          <div className="divide-y divide-gray-100 max-h-[520px] overflow-y-auto">
            {filteredFractProducts.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-400">
                No products found
              </div>
            ) : (
              filteredFractProducts.map((product) => {
                const pid = parseInt(String(product.id));
                const rule = fractionalRules.get(pid);
                const hasRule = !!rule;
                const priceVal = getFractPriceInput(pid);
                const threshVal = getFractThreshInput(pid);
                const savedPrice = rule ? String(rule.fractionalPrice) : "";
                const savedThresh = rule ? String(rule.thresholdWeight) : "1";
                const isDirty =
                  (fractPriceInputs.has(pid) && fractPriceInputs.get(pid) !== savedPrice) ||
                  (fractThreshInputs.has(pid) && fractThreshInputs.get(pid) !== savedThresh);
                const isSaving = fractSaving.has(pid);

                return (
                  <div
                    key={product.id}
                    className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${
                      hasRule ? "bg-green-50/40" : ""
                    }`}
                  >
                    {/* Product info */}
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <Scale
                        className={`w-4 h-4 flex-shrink-0 ${
                          hasRule ? "text-green-500" : "text-gray-300"
                        }`}
                      />
                      <div className="min-w-0">
                        <p
                          className={`text-sm font-medium truncate ${
                            hasRule ? "text-gray-900" : "text-gray-600"
                          }`}
                        >
                          {product.name}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {product.category} &middot; Base: ₱
                          {(product.price ?? 0).toFixed(2)}/unit
                        </p>
                      </div>
                    </div>

                    {/* Inputs / read-only */}
                    {isAdmin ? (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Threshold weight */}
                        <div className="flex flex-col items-start gap-0.5">
                          <label className="text-[10px] text-gray-400 leading-none">Below (kg)</label>
                          <input
                            type="number"
                            min="0.001"
                            step="0.1"
                            placeholder="1"
                            value={threshVal}
                            onChange={(e) =>
                              setFractThreshInputs((prev) => new Map(prev).set(pid, e.target.value))
                            }
                            onKeyDown={(e) =>
                              e.key === "Enter" && handleSaveFractional(pid)
                            }
                            disabled={isSaving}
                            className="w-20 px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:opacity-50"
                          />
                        </div>

                        {/* Flat price */}
                        <div className="flex flex-col items-start gap-0.5">
                          <label className="text-[10px] text-gray-400 leading-none">Flat price (₱)</label>
                          <div className="flex items-center gap-1">
                            <span className="text-sm text-gray-500">₱</span>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                              value={priceVal}
                              onChange={(e) =>
                                setFractPriceInputs((prev) => new Map(prev).set(pid, e.target.value))
                              }
                              onKeyDown={(e) =>
                                e.key === "Enter" && handleSaveFractional(pid)
                              }
                              disabled={isSaving}
                              className="w-24 px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:opacity-50"
                            />
                          </div>
                        </div>

                        {isDirty && (
                          <button
                            onClick={() => handleSaveFractional(pid)}
                            disabled={isSaving}
                            className="flex items-center gap-1 px-2 py-1.5 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700 disabled:opacity-50 self-end mb-0.5"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Save
                          </button>
                        )}
                        {hasRule && !isDirty && (
                          <button
                            onClick={() => handleClearFractional(pid)}
                            disabled={isSaving}
                            title="Remove partial unit price rule"
                            className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-red-50 disabled:opacity-50 self-end mb-0.5"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ) : (
                      <span
                        className={`text-sm font-medium ${
                          hasRule ? "text-green-700" : "text-gray-400"
                        }`}
                      >
                        {hasRule
                          ? `< ${rule.thresholdWeight} kg → ₱${rule.fractionalPrice.toFixed(2)}`
                          : "—"}
                      </span>
                    )}

                    {/* Status badge */}
                    <span
                      className={`flex-shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${
                        hasRule
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {hasRule ? "Custom price" : "Default"}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
