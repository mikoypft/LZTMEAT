import { useState, useEffect } from "react";
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Calendar,
  FlaskConical,
  Package,
  Flame,
  ShoppingBag,
  Plus,
  CheckCircle,
  Clock,
  X,
} from "lucide-react";
import {
  getProductionRecords,
  ProductionRecord,
  getSalesDiscrepancies,
  createSalesDiscrepancy,
  adjustSalesDiscrepancy,
  SalesDiscrepancy,
  getProducts,
  getStores,
  Product,
  StoreLocation,
} from "@/utils/api";
import { UserData } from "@/app/components/LoginPage";

function formatDate(ts: string) {
  const d = new Date(ts);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function DiscrepancyBadge({
  value,
  unit = "kg",
}: {
  value: number;
  unit?: string;
}) {
  const abs = Math.abs(value);
  const color =
    abs === 0
      ? "bg-green-100 text-green-700"
      : abs < 1
        ? "bg-yellow-100 text-yellow-700"
        : "bg-red-100 text-red-700";
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${color}`}
    >
      {value > 0 ? "+" : ""}
      {value.toFixed(3)} {unit}
    </span>
  );
}

interface TableSection {
  label: string;
  icon: React.ElementType;
  color: string;
  records: ProductionRecord[];
  discrepancyKey:
    | "mixingDiscrepancy"
    | "packingDiscrepancy"
    | "cookingDiscrepancy";
  reasonKey:
    | "mixingDiscrepancyReason"
    | "packingDiscrepancyReason"
    | "cookingDiscrepancyReason";
  phaseLabel: string;
  inputLabel: string;
  outputLabel: string;
  getInput: (r: ProductionRecord) => string;
  getOutput: (r: ProductionRecord) => string;
}

// ─── Report Sales Discrepancy Modal ───────────────────────────────────────────
function ReportModal({
  currentUser,
  stores,
  products,
  onClose,
  onSaved,
}: {
  currentUser: UserData;
  stores: StoreLocation[];
  products: Product[];
  onClose: () => void;
  onSaved: (d: SalesDiscrepancy) => void;
}) {
  const [storeName, setStoreName] = useState(currentUser.storeName || "");
  const [storeId, setStoreId] = useState<string>(currentUser.storeId || "");
  const [productId, setProductId] = useState("");
  const [productName, setProductName] = useState("");
  const [unit, setUnit] = useState("kg");
  const [shiftDate, setShiftDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [shift, setShift] = useState<"AM" | "PM" | "">("");
  const [startingStock, setStartingStock] = useState("");
  const [salesQuantity, setSalesQuantity] = useState("");
  const [reportedRemaining, setReportedRemaining] = useState("");
  const [cashier, setCashier] = useState(currentUser.fullName || "");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const start = parseFloat(startingStock) || 0;
  const sold = parseFloat(salesQuantity) || 0;
  const reported = parseFloat(reportedRemaining) || 0;
  const expected = start - sold;
  const discrepancy = expected - reported;

  const handleProductChange = (id: string) => {
    setProductId(id);
    const p = products.find((p) => String(p.id) === id);
    if (p) {
      setProductName(p.name);
      setUnit(p.unit || "kg");
    }
  };

  const handleStoreChange = (id: string) => {
    setStoreId(id);
    const s = stores.find((s) => s.id === id);
    if (s) setStoreName(s.name);
  };

  const handleSubmit = async () => {
    if (
      !storeName ||
      !productId ||
      !productName ||
      !startingStock ||
      !reportedRemaining
    ) {
      setError("Please fill in all required fields.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const result = await createSalesDiscrepancy({
        storeName,
        storeId: storeId || null,
        productId,
        productName,
        unit,
        shiftDate,
        shift: shift || null,
        startingStock: start,
        salesQuantity: sold,
        reportedRemaining: reported,
        cashier: cashier || null,
        userId: null,
        notes: notes || null,
      });
      onSaved(result);
      onClose();
    } catch (e: any) {
      setError(e.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-bold text-lg">Report Sales Discrepancy</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                Store *
              </label>
              <select
                value={storeId}
                onChange={(e) => handleStoreChange(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select store…</option>
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                Product *
              </label>
              <select
                value={productId}
                onChange={(e) => handleProductChange(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select product…</option>
                {products.map((p) => (
                  <option key={p.id} value={String(p.id)}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                Date *
              </label>
              <input
                type="date"
                value={shiftDate}
                onChange={(e) => setShiftDate(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                Shift
              </label>
              <select
                value={shift}
                onChange={(e) => setShift(e.target.value as "AM" | "PM" | "")}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All shifts</option>
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                Starting Stock *
              </label>
              <div className="flex">
                <input
                  type="number"
                  min="0"
                  step="0.001"
                  value={startingStock}
                  onChange={(e) => setStartingStock(e.target.value)}
                  placeholder="0.000"
                  className="w-full px-3 py-2 bg-background border border-border rounded-l-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <span className="px-2 py-2 bg-muted border border-l-0 border-border rounded-r-lg text-xs text-muted-foreground">
                  {unit}
                </span>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                Qty Sold
              </label>
              <div className="flex">
                <input
                  type="number"
                  min="0"
                  step="0.001"
                  value={salesQuantity}
                  onChange={(e) => setSalesQuantity(e.target.value)}
                  placeholder="0.000"
                  className="w-full px-3 py-2 bg-background border border-border rounded-l-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <span className="px-2 py-2 bg-muted border border-l-0 border-border rounded-r-lg text-xs text-muted-foreground">
                  {unit}
                </span>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                Reported Remaining *
              </label>
              <div className="flex">
                <input
                  type="number"
                  min="0"
                  step="0.001"
                  value={reportedRemaining}
                  onChange={(e) => setReportedRemaining(e.target.value)}
                  placeholder="0.000"
                  className="w-full px-3 py-2 bg-background border border-border rounded-l-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <span className="px-2 py-2 bg-muted border border-l-0 border-border rounded-r-lg text-xs text-muted-foreground">
                  {unit}
                </span>
              </div>
            </div>
          </div>

          {/* Live discrepancy preview */}
          {(startingStock || salesQuantity || reportedRemaining) && (
            <div className="bg-muted rounded-lg px-4 py-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Expected remaining
                </span>
                <span className="font-medium">
                  {expected.toFixed(3)} {unit}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Reported remaining
                </span>
                <span className="font-medium">
                  {reported.toFixed(3)} {unit}
                </span>
              </div>
              <div className="flex justify-between border-t border-border pt-1 mt-1">
                <span className="font-semibold">Discrepancy</span>
                <DiscrepancyBadge value={discrepancy} unit={unit} />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">
              Responsible Cashier
            </label>
            <input
              type="text"
              value={cashier}
              onChange={(e) => setCashier(e.target.value)}
              placeholder="Cashier name…"
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Optional notes…"
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 px-5 py-4 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-muted text-foreground text-sm font-medium hover:bg-muted/80"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save Discrepancy"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Adjust Discrepancy Modal ─────────────────────────────────────────────────
function AdjustModal({
  discrepancy,
  currentUser,
  onClose,
  onAdjusted,
}: {
  discrepancy: SalesDiscrepancy;
  currentUser: UserData;
  onClose: () => void;
  onAdjusted: (id: string) => void;
}) {
  const [unitCost, setUnitCost] = useState(
    discrepancy.unitPrice != null && discrepancy.unitPrice > 0
      ? discrepancy.unitPrice.toFixed(2)
      : ""
  );
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const cost = parseFloat(unitCost) || 0;
  const total = discrepancy.discrepancyAmount * cost;

  const handleSubmit = async () => {
    setSaving(true);
    setError("");
    try {
      await adjustSalesDiscrepancy(
        discrepancy.id,
        cost,
        notes || undefined,
        discrepancy.cashier || currentUser.fullName || undefined,
        undefined,
      );
      onAdjusted(discrepancy.id);
      onClose();
    } catch (e: any) {
      setError(e.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-bold text-lg">Record Discrepancy Adjustment</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="bg-muted rounded-lg px-4 py-3 text-sm space-y-1">
            <p>
              <span className="text-muted-foreground">Product:</span>{" "}
              <span className="font-medium">{discrepancy.productName}</span>
            </p>
            <p>
              <span className="text-muted-foreground">Store:</span>{" "}
              <span className="font-medium">{discrepancy.storeName}</span>
            </p>
            <p>
              <span className="text-muted-foreground">Missing:</span>{" "}
              <span className="font-semibold text-red-600">
                {discrepancy.discrepancyAmount.toFixed(3)} {discrepancy.unit}
              </span>
            </p>
            <p>
              <span className="text-muted-foreground">Cashier:</span>{" "}
              <span className="font-medium">{discrepancy.cashier || "—"}</span>
            </p>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">
              Unit Cost (₱ per {discrepancy.unit})
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={unitCost}
              onChange={(e) => setUnitCost(e.target.value)}
              placeholder="0.00"
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {discrepancy.unitPrice != null && discrepancy.unitPrice > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Auto-filled from product price · ₱{discrepancy.unitPrice.toFixed(2)} / {discrepancy.unit}
              </p>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Optional notes…"
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 px-5 py-4 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-muted text-foreground text-sm font-medium hover:bg-muted/80"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Confirm Adjustment"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Sales Discrepancies Section ──────────────────────────────────────────────
function SalesDiscrepanciesSection({
  currentUser,
  dateFrom,
  dateTo,
}: {
  currentUser: UserData;
  dateFrom: string;
  dateTo: string;
}) {
  const [items, setItems] = useState<SalesDiscrepancy[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [adjustTarget, setAdjustTarget] = useState<SalesDiscrepancy | null>(
    null,
  );
  const [stores, setStores] = useState<StoreLocation[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [data, storeList, productList] = await Promise.all([
        getSalesDiscrepancies(dateFrom || undefined, dateTo || undefined),
        getStores(),
        getProducts(),
      ]);
      setItems(data);
      setStores(storeList);
      setProducts(productList);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateFrom, dateTo]);

  const pending = items.filter((i) => i.status === "pending");
  const adjusted = items.filter((i) => i.status === "adjusted");

  const handleAdjusted = (id: string) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: "adjusted" } : i)),
    );
  };

  return (
    <>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <button
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/40 transition-colors"
          onClick={() => setCollapsed((v) => !v)}
        >
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-5 h-5 text-violet-600" />
            <span className="font-semibold text-foreground">
              Sales Discrepancies
            </span>
            <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
              {items.length}
            </span>
            {pending.length > 0 && (
              <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold">
                {pending.length} pending
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowReport(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90"
            >
              <Plus className="w-3.5 h-3.5" /> Report
            </button>
            {collapsed ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
        </button>

        {!collapsed && (
          <>
            {loading ? (
              <div className="px-5 py-10 text-center text-muted-foreground text-sm">
                Loading…
              </div>
            ) : items.length === 0 ? (
              <div className="px-5 py-10 text-center text-muted-foreground text-sm">
                No sales discrepancies found
                {dateFrom || dateTo ? " for the selected date range" : ""}.
                Click <strong>Report</strong> to log one.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-t border-border bg-muted/30">
                      {[
                        "Date",
                        "Shift",
                        "Store",
                        "Product",
                        "Starting",
                        "Sold",
                        "Expected",
                        "Reported",
                        "Discrepancy",
                        "Cashier",
                        "Status",
                        "Action",
                      ].map((h) => (
                        <th
                          key={h}
                          className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((r, idx) => (
                      <tr
                        key={r.id}
                        className={`border-t border-border ${idx % 2 === 1 ? "bg-muted/10" : ""} hover:bg-muted/20 transition-colors`}
                      >
                        <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                          {formatDate(r.shiftDate)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {r.shift ? (
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-semibold ${r.shift === "AM" ? "bg-yellow-100 text-yellow-700" : "bg-blue-100 text-blue-700"}`}
                            >
                              {r.shift}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {r.storeName}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap font-medium">
                          {r.productName}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          {r.startingStock.toFixed(3)} {r.unit}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          {r.salesQuantity.toFixed(3)} {r.unit}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          {r.expectedRemaining.toFixed(3)} {r.unit}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          {r.reportedRemaining.toFixed(3)} {r.unit}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <DiscrepancyBadge
                            value={r.discrepancyAmount}
                            unit={r.unit}
                          />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {r.cashier || "—"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {r.status === "adjusted" ? (
                            <span className="flex items-center gap-1 text-green-600 text-xs font-semibold">
                              <CheckCircle className="w-3.5 h-3.5" /> Adjusted
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-amber-600 text-xs font-semibold">
                              <Clock className="w-3.5 h-3.5" /> Pending
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {r.status === "pending" ? (
                            <button
                              onClick={() => setAdjustTarget(r)}
                              className="px-3 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg text-xs font-semibold transition-colors"
                            >
                              Adjust
                            </button>
                          ) : (
                            r.adjustment && (
                              <span className="text-xs text-muted-foreground">
                                ₱{r.adjustment.totalCost.toFixed(2)} charged
                              </span>
                            )
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {showReport && (
        <ReportModal
          currentUser={currentUser}
          stores={stores}
          products={products}
          onClose={() => setShowReport(false)}
          onSaved={(d) => setItems((prev) => [d, ...prev])}
        />
      )}

      {adjustTarget && (
        <AdjustModal
          discrepancy={adjustTarget}
          currentUser={currentUser}
          onClose={() => setAdjustTarget(null)}
          onAdjusted={handleAdjusted}
        />
      )}
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
interface DiscrepanciesPageProps {
  currentUser: UserData;
}

export function DiscrepanciesPage({ currentUser }: DiscrepanciesPageProps) {
  const [records, setRecords] = useState<ProductionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const data = await getProductionRecords(
        dateFrom || undefined,
        dateTo || undefined,
      );
      setRecords(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mixingRecords = records.filter(
    (r) => r.mixingDiscrepancy !== null && r.mixingDiscrepancy !== undefined,
  );
  const packingRecords = records.filter(
    (r) => r.packingDiscrepancy !== null && r.packingDiscrepancy !== undefined,
  );
  const cookingRecords = records.filter(
    (r) => r.cookingDiscrepancy !== null && r.cookingDiscrepancy !== undefined,
  );

  const sections: TableSection[] = [
    {
      label: "Mixing Discrepancies",
      icon: FlaskConical,
      color: "text-blue-600",
      records: mixingRecords,
      discrepancyKey: "mixingDiscrepancy",
      reasonKey: "mixingDiscrepancyReason",
      phaseLabel: "Mixing",
      inputLabel: "Ingredients Used",
      outputLabel: "Mix Weight",
      getInput: (r) => {
        const total = (r.initialIngredients || []).reduce(
          (sum: number, ing: any) => sum + Number(ing.quantity || 0),
          0,
        );
        return total > 0 ? `${total.toFixed(3)} kg` : "—";
      },
      getOutput: (r) =>
        r.mixWeight != null ? `${r.mixWeight.toFixed(3)} kg` : "—",
    },
    {
      label: "Packing Discrepancies",
      icon: Package,
      color: "text-orange-600",
      records: packingRecords,
      discrepancyKey: "packingDiscrepancy",
      reasonKey: "packingDiscrepancyReason",
      phaseLabel: "Packing",
      inputLabel: "Mix Weight (Input)",
      outputLabel: "Raw Packed Output",
      getInput: (r) =>
        r.mixWeight != null ? `${r.mixWeight.toFixed(3)} kg` : "—",
      getOutput: (r) =>
        r.rawPackedItems != null ? `${r.rawPackedItems.toFixed(3)} kg` : "—",
    },
    {
      label: "Cooking Discrepancies",
      icon: Flame,
      color: "text-red-600",
      records: cookingRecords,
      discrepancyKey: "cookingDiscrepancy",
      reasonKey: "cookingDiscrepancyReason",
      phaseLabel: "Cooking",
      inputLabel: "Mix Used (Input)",
      outputLabel: "Total Output",
      getInput: (r) => (r.mixUsed != null ? `${r.mixUsed.toFixed(3)} kg` : "—"),
      getOutput: (r) =>
        r.quantity != null ? `${Number(r.quantity).toFixed(3)} kg` : "—",
    },
  ];

  const totalDiscrepancy = (
    key: "mixingDiscrepancy" | "packingDiscrepancy" | "cookingDiscrepancy",
    recs: ProductionRecord[],
  ) => recs.reduce((sum, r) => sum + Math.abs(Number(r[key] ?? 0)), 0);

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Discrepancies</h1>
            <p className="text-sm text-muted-foreground">
              Sales, mixing, packing &amp; cooking discrepancies
            </p>
          </div>
        </div>

        {/* Date filter + refresh */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-card border border-border rounded-lg px-2 py-1">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="text-sm bg-transparent outline-none w-32"
            />
          </div>
          <span className="text-muted-foreground text-sm">to</span>
          <div className="flex items-center gap-1 bg-card border border-border rounded-lg px-2 py-1">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="text-sm bg-transparent outline-none w-32"
            />
          </div>
          <button
            onClick={fetchRecords}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Loading…" : "Apply"}
          </button>
        </div>
      </div>

      {/* Sales Discrepancies — always at top */}
      <SalesDiscrepanciesSection
        currentUser={currentUser}
        dateFrom={dateFrom}
        dateTo={dateTo}
      />

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {sections.map((s) => {
          const Icon = s.icon;
          const total = totalDiscrepancy(s.discrepancyKey, s.records);
          return (
            <div
              key={s.label}
              className="bg-card border border-border rounded-xl p-4 flex items-center gap-4"
            >
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                <Icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">
                  {s.phaseLabel}
                </p>
                <p className="text-lg font-bold text-foreground">
                  {total.toFixed(3)} kg
                </p>
                <p className="text-xs text-muted-foreground">
                  {s.records.length} record{s.records.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tables */}
      {sections.map((section) => {
        const Icon = section.icon;
        const isCollapsed = collapsed[section.label];
        return (
          <div
            key={section.label}
            className="bg-card border border-border rounded-xl overflow-hidden"
          >
            {/* Section header */}
            <button
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/40 transition-colors"
              onClick={() =>
                setCollapsed((prev) => ({
                  ...prev,
                  [section.label]: !prev[section.label],
                }))
              }
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 ${section.color}`} />
                <span className="font-semibold text-foreground">
                  {section.label}
                </span>
                <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                  {section.records.length}
                </span>
              </div>
              {isCollapsed ? (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              )}
            </button>

            {!isCollapsed && (
              <>
                {section.records.length === 0 ? (
                  <div className="px-5 py-10 text-center text-muted-foreground text-sm">
                    No {section.phaseLabel.toLowerCase()} discrepancies found
                    {dateFrom || dateTo ? " for the selected date range" : ""}.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-t border-border bg-muted/30">
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">
                            Date
                          </th>
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">
                            Batch #
                          </th>
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">
                            Product / Mix
                          </th>
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">
                            Operator
                          </th>
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">
                            {section.inputLabel}
                          </th>
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">
                            {section.outputLabel}
                          </th>
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">
                            Discrepancy
                          </th>
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">
                            Reason
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {section.records.map((r, idx) => {
                          const discVal = Number(
                            r[section.discrepancyKey] ?? 0,
                          );
                          const reason =
                            (r[section.reasonKey] as
                              | string
                              | null
                              | undefined) || "";
                          const productLabel =
                            r.productMixCategoryName || r.productName || "—";
                          return (
                            <tr
                              key={r.id}
                              className={`border-t border-border ${idx % 2 === 1 ? "bg-muted/10" : ""} hover:bg-muted/20 transition-colors`}
                            >
                              <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                                {formatDate(r.timestamp)}
                              </td>
                              <td className="px-4 py-3 font-mono text-xs whitespace-nowrap">
                                {r.batchNumber}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap max-w-[160px] truncate">
                                {productLabel}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                {r.operator || "—"}
                              </td>
                              <td className="px-4 py-3 text-right whitespace-nowrap">
                                {section.getInput(r)}
                              </td>
                              <td className="px-4 py-3 text-right whitespace-nowrap">
                                {section.getOutput(r)}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <DiscrepancyBadge value={discVal} />
                              </td>
                              <td className="px-4 py-3 max-w-[200px]">
                                {reason ? (
                                  <span className="text-foreground">
                                    {reason}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground italic">
                                    No reason provided
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
