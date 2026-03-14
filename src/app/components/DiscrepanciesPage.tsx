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
} from "lucide-react";
import { getProductionRecords, ProductionRecord } from "@/utils/api";

function formatDate(ts: string) {
  const d = new Date(ts);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function DiscrepancyBadge({ value }: { value: number }) {
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
      {value.toFixed(3)} kg
    </span>
  );
}

interface TableSection {
  label: string;
  icon: React.ElementType;
  color: string;
  records: ProductionRecord[];
  discrepancyKey: "mixingDiscrepancy" | "packingDiscrepancy" | "cookingDiscrepancy";
  reasonKey: "mixingDiscrepancyReason" | "packingDiscrepancyReason" | "cookingDiscrepancyReason";
  phaseLabel: string;
  inputLabel: string;
  outputLabel: string;
  getInput: (r: ProductionRecord) => string;
  getOutput: (r: ProductionRecord) => string;
}

export function DiscrepanciesPage() {
  const [records, setRecords] = useState<ProductionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const data = await getProductionRecords(dateFrom || undefined, dateTo || undefined);
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
      getInput: (r) =>
        r.mixUsed != null ? `${r.mixUsed.toFixed(3)} kg` : "—",
      getOutput: (r) =>
        r.quantity != null ? `${Number(r.quantity).toFixed(3)} kg` : "—",
    },
  ];

  const totalDiscrepancy = (
    key: "mixingDiscrepancy" | "packingDiscrepancy" | "cookingDiscrepancy",
    recs: ProductionRecord[],
  ) =>
    recs.reduce((sum, r) => sum + Math.abs(Number(r[key] ?? 0)), 0);

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
              Production discrepancies across mixing, packing, and cooking phases
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
                    {(dateFrom || dateTo) ? " for the selected date range" : ""}.
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
                          const discVal = Number(r[section.discrepancyKey] ?? 0);
                          const reason = (r[section.reasonKey] as string | null | undefined) || "";
                          const productLabel =
                            r.productMixCategoryName ||
                            r.productName ||
                            "—";
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
                                  <span className="text-foreground">{reason}</span>
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
