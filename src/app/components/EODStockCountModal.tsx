import { useState, useEffect } from "react";
import { ClipboardList, X, AlertTriangle, CheckCircle, Lock, Eye, EyeOff } from "lucide-react";
import {
  getInventory,
  getProducts,
  submitEODCount,
  verifyPassword,
  EODStockCountItem,
  InventoryRecord,
  Product,
} from "@/utils/api";
import { UserData } from "@/app/components/LoginPage";

export const EOD_SESSION_KEY_PREFIX = "eod_session_";

export function setEODSessionMarker(user: UserData) {
  if (!user.storeId) return;
  const key = `${EOD_SESSION_KEY_PREFIX}${user.id}`;
  localStorage.setItem(
    key,
    JSON.stringify({
      userId: user.id,
      userName: user.fullName || user.username,
      storeId: user.storeId,
      storeName: user.storeName,
      shift: user.shift ?? null,
      loginTime: new Date().toISOString(),
    }),
  );
}

export function clearEODSessionMarker(userId: string) {
  localStorage.removeItem(`${EOD_SESSION_KEY_PREFIX}${userId}`);
}

export function getPendingEODSession(userId: string): {
  userId: string;
  userName: string;
  storeId: string;
  storeName: string;
  shift: "AM" | "PM" | null;
  loginTime: string;
} | null {
  try {
    const raw = localStorage.getItem(`${EOD_SESSION_KEY_PREFIX}${userId}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// ─── Row in the stock count table ────────────────────────────────────────────
interface CountRow {
  productId: string;
  productName: string;
  unit: string;
  expectedQty: number;
  actualQty: string; // string so input field is controlled
}

// ─── Main Modal ───────────────────────────────────────────────────────────────
interface EODStockCountModalProps {
  currentUser: UserData;
  /** Called after EOD is successfully submitted — triggers actual logout */
  onConfirmLogout: () => void;
  /** Called if user cancels (stays logged in) */
  onCancel: () => void;
  /** Optional: pre-fill for a recovery count (previous session) */
  recoverySession?: {
    userId: string;
    userName: string;
    storeId: string;
    storeName: string;
    shift: "AM" | "PM" | null;
    loginTime: string;
  } | null;
}

export function EODStockCountModal({
  currentUser,
  onConfirmLogout,
  onCancel,
  recoverySession,
}: EODStockCountModalProps) {
  const [rows, setRows] = useState<CountRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notes, setNotes] = useState("");

  // Use recovery session data or current user
  const targetStoreName = recoverySession?.storeName ?? currentUser.storeName ?? "";
  const targetStoreId   = recoverySession?.storeId   ?? currentUser.storeId   ?? null;
  const targetShift     = recoverySession?.shift      ?? currentUser.shift     ?? null;
  const targetUserId    = recoverySession?.userId     ?? currentUser.id        ?? null;
  const targetUserName  = recoverySession?.userName   ?? (currentUser.fullName || currentUser.username);

  const shiftDate = new Date().toISOString().slice(0, 10);

  // Fetch inventory for the store and build rows
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [inv, products]: [InventoryRecord[], Product[]] = await Promise.all([
          getInventory(targetStoreName),
          getProducts(),
        ]);

        const productMap: Record<string, Product> = {};
        products.forEach((p) => { productMap[String(p.id)] = p; });

        const builtRows: CountRow[] = inv
          .filter((i) => i.quantity >= 0)
          .map((i) => {
            const p = productMap[i.productId];
            return {
              productId:   i.productId,
              productName: i.productName || p?.name || `Product ${i.productId}`,
              unit:        i.unit        || p?.unit  || "kg",
              expectedQty: i.quantity,
              actualQty:   "",
            };
          });

        setRows(builtRows);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [targetStoreName]);

  const updateActual = (idx: number, value: string) => {
    setRows((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], actualQty: value };
      return next;
    });
  };

  // Items that have a discrepancy (expected > actual)
  const rowsWithDisc = rows.filter((r) => {
    const actual = parseFloat(r.actualQty);
    return !isNaN(actual) && r.expectedQty - actual > 0.0005;
  });

  const allFilled = rows.length > 0 && rows.every((r) => r.actualQty !== "");

  const handleSubmit = async () => {
    if (!allFilled) { setError("Please fill in the actual quantity for all products."); return; }
    if (!password)  { setError("Please enter your password to confirm."); return; }

    setSubmitting(true);
    setError("");

    try {
      // 1. Verify password
      const userId = targetUserId ?? currentUser.id;
      if (userId) {
        const valid = await verifyPassword(String(userId), password);
        if (!valid) {
          setError("Incorrect password. Please try again.");
          setSubmitting(false);
          return;
        }
      }

      // 2. Build items payload
      const items: EODStockCountItem[] = rows.map((r) => ({
        productId:   r.productId,
        productName: r.productName,
        unit:        r.unit,
        expectedQty: r.expectedQty,
        actualQty:   parseFloat(r.actualQty) || 0,
      }));

      // 3. Submit EOD count (backend auto-creates discrepancy records)
      await submitEODCount({
        userId:    userId   ? String(userId) : null,
        userName:  targetUserName,
        storeId:   targetStoreId,
        storeName: targetStoreName,
        shiftDate,
        shift:     targetShift,
        notes:     notes || null,
        items,
      });

      // 4. Clear the localStorage session marker
      if (userId) clearEODSessionMarker(String(userId));

      // 5. Trigger actual logout
      onConfirmLogout();
    } catch (e: any) {
      setError(e.message || "Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-border flex-shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  End of Shift Stock Count
                </h2>
                <p className="text-sm text-muted-foreground">
                  {targetStoreName}
                  {targetShift ? ` · ${targetShift} Shift` : ""}
                  {" · "}{new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="text-muted-foreground hover:text-foreground mt-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {recoverySession && (
            <div className="mt-3 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-sm text-amber-800">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>
                Your previous session on{" "}
                <strong>
                  {new Date(recoverySession.loginTime).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </strong>{" "}
                ended without an end-of-shift count. Please complete it now.
              </span>
            </div>
          )}
        </div>

        {/* Table body — scrollable */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="py-16 text-center text-muted-foreground text-sm">
              Loading inventory…
            </div>
          ) : rows.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground text-sm">
              No inventory records found for {targetStoreName}.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm z-10">
                <tr>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Product</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Expected</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actual</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Discrepancy</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => {
                  const actual    = parseFloat(row.actualQty);
                  const hasActual = !isNaN(actual);
                  const disc      = hasActual ? row.expectedQty - actual : null;
                  const discColor =
                    disc === null ? "" :
                    disc <= 0    ? "text-green-600" :
                    disc < 1     ? "text-yellow-600" :
                                   "text-red-600";

                  return (
                    <tr
                      key={row.productId}
                      className={`border-t border-border ${disc !== null && disc > 0 ? "bg-red-50/40" : ""} hover:bg-muted/20 transition-colors`}
                    >
                      <td className="px-5 py-3 font-medium">
                        {row.productName}
                        <span className="ml-1 text-xs text-muted-foreground">({row.unit})</span>
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground">
                        {row.expectedQty.toFixed(3)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <input
                          type="number"
                          min="0"
                          step="0.001"
                          value={row.actualQty}
                          onChange={(e) => updateActual(idx, e.target.value)}
                          placeholder="0.000"
                          className="w-28 px-2 py-1 bg-background border border-border rounded-lg text-right text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </td>
                      <td className={`px-4 py-3 text-right font-semibold ${discColor}`}>
                        {disc !== null
                          ? `${disc > 0 ? "−" : "+"}${Math.abs(disc).toFixed(3)}`
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t border-border px-6 py-5 space-y-4">
          {/* Discrepancy summary */}
          {rowsWithDisc.length > 0 && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 text-sm text-red-700">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>
                <strong>{rowsWithDisc.length}</strong> item{rowsWithDisc.length !== 1 ? "s" : ""} with stock discrepancy —
                these will be auto-logged and may result in an adjustment charge.
              </span>
            </div>
          )}
          {allFilled && rowsWithDisc.length === 0 && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-2.5 text-sm text-green-700">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span>All stock counts match — no discrepancies.</span>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">
              Shift notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Any notes for this shift…"
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          {/* Password confirmation */}
          <div>
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-1">
              <Lock className="w-3.5 h-3.5" /> Confirm with your password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="Enter your password…"
                className="w-full px-3 py-2 pr-10 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex justify-between items-center">
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded-lg bg-muted text-foreground text-sm font-medium hover:bg-muted/80"
            >
              Cancel (stay logged in)
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || loading}
              className="px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 flex items-center gap-2"
            >
              {submitting ? "Submitting…" : "Submit & Logout"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
