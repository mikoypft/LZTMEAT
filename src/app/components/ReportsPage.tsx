import { useState, useEffect } from "react";
import { Download, FileText, Calendar, Edit3, Save, X } from "lucide-react";
import {
  exportDailyReportPDF,
  exportDailyReportCSV,
  getStores,
  getAllUsers,
  getReportPreview,
  saveReportData,
  type AllUser,
  type ReportPreview,
  type ReportRow,
} from "../../utils/api";
import { toast } from "sonner";
import type { StoreLocation } from "../../utils/api";

interface ReportsPageProps {
  currentUser?: any;
}

export function ReportsPage({ currentUser }: ReportsPageProps) {
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  });
  const [selectedStore, setSelectedStore] = useState<string>("");
  const [selectedCashier, setSelectedCashier] = useState<string>("");
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [loadingCsv, setLoadingCsv] = useState(false);
  const [stores, setStores] = useState<StoreLocation[]>([]);
  const [cashiers, setCashiers] = useState<AllUser[]>([]);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [preview, setPreview] = useState<ReportPreview | null>(null);
  const [editedRows, setEditedRows] = useState<ReportRow[]>([]);
  const [reporterName, setReporterName] = useState<string>("");
  const [remarks, setRemarks] = useState<string>("");
  const [editedDenominations, setEditedDenominations] = useState<Record<string, number>>({"5000": 0, "1000": 0, "500": 0, "200": 0, "100": 0, "50": 0, "20": 0});
  const [saving, setSaving] = useState(false);

  const DENOM_LIST = ["5000", "1000", "500", "200", "100", "50", "20"];

  useEffect(() => {
    const loadData = async () => {
      try {
        const [storesData, usersData] = await Promise.all([
          getStores(),
          getAllUsers(),
        ]);
        setStores(storesData);
        setCashiers(usersData);
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Failed to load filter options");
      }
    };
    loadData();
  }, []);

  const handleOpenPreview = async () => {
    setPreviewLoading(true);
    setShowModal(true);
    try {
      const data = await getReportPreview(
        selectedDate,
        selectedStore || undefined,
        selectedCashier || undefined,
      );
      setPreview(data);
      setEditedRows(data.rows.map((r) => ({ ...r })));
      setReporterName(
        data.header.reporterName ??
          (currentUser?.fullName || currentUser?.username || ""),
      );
      setRemarks(data.header.remarks ?? "");
      setEditedDenominations(
        Object.assign({"5000": 0, "1000": 0, "500": 0, "200": 0, "100": 0, "50": 0, "20": 0}, data.denominations ?? {})
      );
    } catch (_) {
      toast.error("Failed to load report preview");
      setShowModal(false);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleRowChange = (
    index: number,
    field: keyof ReportRow,
    value: string,
  ) => {
    setEditedRows((prev) =>
      prev.map((row, i) =>
        i === index ? { ...row, [field]: parseFloat(value) || 0 } : row,
      ),
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveReportData({
        date: selectedDate,
        storeId: selectedStore || undefined,
        cashierId: selectedCashier || undefined,
        reporterName,
        remarks,
        rows: editedRows,
        denominations: editedDenominations,
      });
      toast.success("Report data saved successfully");
    } catch (_) {
      toast.error("Failed to save report data");
    } finally {
      setSaving(false);
    }
  };

  const handleExportPDF = async () => {
    // Save first (non-fatal), then export
    setSaving(true);
    try {
      await saveReportData({
        date: selectedDate,
        storeId: selectedStore || undefined,
        cashierId: selectedCashier || undefined,
        reporterName,
        remarks,
        rows: editedRows,
        denominations: editedDenominations,
      });
    } catch (_) {
      /* non-fatal */
    } finally {
      setSaving(false);
    }

    setLoadingPdf(true);
    try {
      await toast.promise(
        exportDailyReportPDF(
          selectedDate,
          selectedStore || undefined,
          reporterName || currentUser?.fullName || currentUser?.username || "Unknown",
          selectedCashier || undefined,
        ),
        {
          loading: "Generating PDF...",
          success: "PDF downloaded successfully!",
          error: (err) => err?.message || "Failed to generate PDF",
        },
      );
    } catch (_) {
      // handled by toast
    } finally {
      setLoadingPdf(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      setLoadingCsv(true);
      toast.promise(
        exportDailyReportCSV(
          selectedDate,
          selectedStore || undefined,
          selectedCashier || undefined,
        ),
        {
          loading: "Generating CSV report...",
          success: "CSV report downloaded successfully!",
          error: (err) => err?.message || "Failed to generate CSV report",
        },
      );
    } catch (_) {
      toast.error("Failed to generate CSV report");
    } finally {
      setLoadingCsv(false);
    }
  };

  const grandTotalSales = editedRows.reduce((s, r) => s + r.totalSales, 0);

  return (
    <>
      <div className="h-full overflow-auto bg-muted/30">
        <div className="container mx-auto p-4 lg:p-6 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl lg:text-3xl font-semibold mb-1">
              Reports
            </h1>
            <p className="text-sm text-muted-foreground">
              Generate and download daily sales reports
            </p>
          </div>

          {/* Report Generator Card */}
          <div className="bg-card rounded-lg border border-border p-6 space-y-6">
            <div className="space-y-4">
              {/* Date Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Report Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Select the date for the report
                </p>
              </div>

              {/* Store Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Store (Optional)
                </label>
                <select
                  value={selectedStore}
                  onChange={(e) => setSelectedStore(e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">All Stores</option>
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  Leave blank to include all stores
                </p>
              </div>

              {/* Cashier Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Cashier (Optional)
                </label>
                <select
                  value={selectedCashier}
                  onChange={(e) => setSelectedCashier(e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">All Cashiers</option>
                  {cashiers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.fullName || user.name || user.username}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  Leave blank to include all cashiers
                </p>
              </div>
            </div>

            {/* Export Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleOpenPreview}
                disabled={loadingPdf || loadingCsv || previewLoading}
                className="w-full flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                <Edit3 className="w-5 h-5" />
                {previewLoading ? "Loading Preview..." : "Review & Export PDF"}
              </button>

              <button
                onClick={handleExportCSV}
                disabled={loadingPdf || loadingCsv}
                className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-3 rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                <Download className="w-5 h-5" />
                {loadingCsv ? "Generating CSV..." : "Export as CSV"}
              </button>
            </div>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-card rounded-lg border border-border p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium mb-1">PDF Report</h3>
                  <p className="text-sm text-muted-foreground">
                    Review and edit report data before exporting to professional
                    PDF format
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-lg border border-border p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Download className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium mb-1">CSV Export</h3>
                  <p className="text-sm text-muted-foreground">
                    Spreadsheet-compatible data export for detailed analysis and
                    record keeping
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Report Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">
              Report Information
            </h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>
                • PDF reports include inventory status, sales summary, and
                signature lines
              </li>
              <li>
                • CSV exports contain transaction-level detail for further
                analysis
              </li>
              <li>• Reports are always generated for the selected date</li>
              <li>
                • Leave store selection blank to include data from all locations
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* ── Report Edit Modal ─────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex flex-col">
          <div className="flex-1 bg-white flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Review &amp; Edit Report
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Edit the report data before exporting. Changes are saved to
                  the database.
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {previewLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" />
              </div>
            ) : preview ? (
              <>
                {/* Scrollable content */}
                <div className="flex-1 overflow-auto p-6 space-y-6">
                  {/* Report Header Info */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">
                      Report Header
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          NAME (Reporter)
                        </label>
                        <input
                          type="text"
                          value={reporterName}
                          onChange={(e) => setReporterName(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="Reporter name..."
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          STORE
                        </label>
                        <input
                          type="text"
                          value={preview.header.storeName}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-100 text-gray-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          DATE
                        </label>
                        <input
                          type="text"
                          value={new Date(
                            selectedDate + "T00:00:00",
                          ).toLocaleDateString("en-US", {
                            month: "2-digit",
                            day: "2-digit",
                            year: "numeric",
                          })}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-100 text-gray-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Products Table */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-semibold text-gray-700">
                        Products
                      </h3>
                      <p className="text-xs text-gray-400">
                        Columns with blue headers are editable
                      </p>
                    </div>
                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                      <table className="text-xs min-w-full">
                        <thead>
                          <tr>
                            <th className="bg-gray-100 border-b border-gray-200 px-3 py-2 text-left font-semibold text-gray-700 sticky left-0 min-w-[160px]">
                              PRODUCT
                            </th>
                            <th className="bg-gray-100 border-b border-gray-200 px-3 py-2 text-right font-semibold text-gray-700 min-w-[80px]">
                              UNIT PRICE
                            </th>
                            <th className="bg-blue-100 border-b border-gray-200 px-3 py-2 text-right font-semibold text-blue-700 min-w-[70px]">
                              WGs ✏
                            </th>
                            <th className="bg-gray-100 border-b border-gray-200 px-3 py-2 text-right font-semibold text-gray-700 min-w-[70px]">
                              STOCKS
                            </th>
                            <th className="bg-blue-100 border-b border-gray-200 px-3 py-2 text-right font-semibold text-blue-700 min-w-[70px]">
                              ADD ✏
                            </th>
                            <th className="bg-gray-100 border-b border-gray-200 px-3 py-2 text-right font-semibold text-gray-700 min-w-[75px]">
                              PICK UP
                            </th>
                            <th className="bg-blue-100 border-b border-gray-200 px-3 py-2 text-right font-semibold text-blue-700 min-w-[80px]">
                              RETURN ✏
                            </th>
                            <th className="bg-blue-100 border-b border-gray-200 px-3 py-2 text-right font-semibold text-blue-700 min-w-[95px]">
                              SCRAP/B.O. ✏
                            </th>
                            <th className="bg-blue-100 border-b border-gray-200 px-3 py-2 text-right font-semibold text-blue-700 min-w-[95px]">
                              TURN OVER ✏
                            </th>
                            <th className="bg-gray-100 border-b border-gray-200 px-3 py-2 text-right font-semibold text-gray-700 min-w-[75px]">
                              KG SALES
                            </th>
                            <th className="bg-gray-100 border-b border-gray-200 px-3 py-2 text-right font-semibold text-gray-700 min-w-[90px]">
                              TOTAL SALES
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {editedRows.map((row, i) => (
                            <tr
                              key={row.productId}
                              className="border-b border-gray-100 hover:bg-gray-50"
                            >
                              <td className="px-3 py-1.5 font-medium text-gray-800 sticky left-0 bg-white">
                                {row.productName}
                              </td>
                              <td className="px-3 py-1.5 text-right text-gray-600">
                                ₱{row.unitPrice.toFixed(2)}
                              </td>
                              <td className="px-1.5 py-1">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.001"
                                  value={row.wgs}
                                  onChange={(e) =>
                                    handleRowChange(i, "wgs", e.target.value)
                                  }
                                  className="w-full text-right px-2 py-1 border border-blue-300 rounded text-xs focus:ring-1 focus:ring-blue-500"
                                />
                              </td>
                              <td className="px-3 py-1.5 text-right text-gray-600">
                                {row.stocks.toFixed(2)}
                              </td>
                              <td className="px-1.5 py-1">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.001"
                                  value={row.addQty}
                                  onChange={(e) =>
                                    handleRowChange(i, "addQty", e.target.value)
                                  }
                                  className="w-full text-right px-2 py-1 border border-blue-300 rounded text-xs focus:ring-1 focus:ring-blue-500"
                                />
                              </td>
                              <td className="px-3 py-1.5 text-right text-gray-600">
                                {row.pickUp.toFixed(2)}
                              </td>
                              <td className="px-1.5 py-1">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.001"
                                  value={row.returnQty}
                                  onChange={(e) =>
                                    handleRowChange(
                                      i,
                                      "returnQty",
                                      e.target.value,
                                    )
                                  }
                                  className="w-full text-right px-2 py-1 border border-blue-300 rounded text-xs focus:ring-1 focus:ring-blue-500"
                                />
                              </td>
                              <td className="px-1.5 py-1">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.001"
                                  value={row.scrapBo}
                                  onChange={(e) =>
                                    handleRowChange(
                                      i,
                                      "scrapBo",
                                      e.target.value,
                                    )
                                  }
                                  className="w-full text-right px-2 py-1 border border-blue-300 rounded text-xs focus:ring-1 focus:ring-blue-500"
                                />
                              </td>
                              <td className="px-1.5 py-1">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.001"
                                  value={row.turnOver}
                                  onChange={(e) =>
                                    handleRowChange(
                                      i,
                                      "turnOver",
                                      e.target.value,
                                    )
                                  }
                                  className="w-full text-right px-2 py-1 border border-blue-300 rounded text-xs focus:ring-1 focus:ring-blue-500"
                                />
                              </td>
                              <td className="px-3 py-1.5 text-right text-gray-600">
                                {row.kgSales.toFixed(2)}
                              </td>
                              <td className="px-3 py-1.5 text-right text-gray-800 font-medium">
                                ₱{row.totalSales.toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-yellow-50 border-t-2 border-gray-300">
                            <td className="px-3 py-2 font-bold text-gray-800 sticky left-0 bg-yellow-50">
                              TOTAL
                            </td>
                            <td className="px-3 py-2 text-right font-bold text-gray-800">
                              —
                            </td>
                            <td className="px-3 py-2 text-right font-bold text-gray-800">
                              {editedRows
                                .reduce((s, r) => s + r.wgs, 0)
                                .toFixed(3)}
                            </td>
                            <td className="px-3 py-2 text-right font-bold text-gray-800">
                              {editedRows
                                .reduce((s, r) => s + r.stocks, 0)
                                .toFixed(2)}
                            </td>
                            <td className="px-3 py-2 text-right font-bold text-gray-800">
                              {editedRows
                                .reduce((s, r) => s + r.addQty, 0)
                                .toFixed(3)}
                            </td>
                            <td className="px-3 py-2 text-right font-bold text-gray-800">
                              {editedRows
                                .reduce((s, r) => s + r.pickUp, 0)
                                .toFixed(2)}
                            </td>
                            <td className="px-3 py-2 text-right font-bold text-gray-800">
                              {editedRows
                                .reduce((s, r) => s + r.returnQty, 0)
                                .toFixed(3)}
                            </td>
                            <td className="px-3 py-2 text-right font-bold text-gray-800">
                              {editedRows
                                .reduce((s, r) => s + r.scrapBo, 0)
                                .toFixed(3)}
                            </td>
                            <td className="px-3 py-2 text-right font-bold text-gray-800">
                              {editedRows
                                .reduce((s, r) => s + r.turnOver, 0)
                                .toFixed(3)}
                            </td>
                            <td className="px-3 py-2 text-right font-bold text-gray-800">
                              {editedRows
                                .reduce((s, r) => s + r.kgSales, 0)
                                .toFixed(2)}
                            </td>
                            <td className="px-3 py-2 text-right font-bold text-gray-800">
                              ₱{grandTotalSales.toFixed(2)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  {/* Payment Breakdown + Denomination Entry */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">
                        Payment Breakdown
                      </h3>
                      {preview.paymentBreakdown.length === 0 ? (
                        <p className="text-xs text-gray-400 italic">
                          No payment records for this date.
                        </p>
                      ) : (
                        <table className="w-full text-sm">
                          <thead>
                            <tr>
                              <th className="text-left text-xs text-gray-500 pb-1">
                                Method
                              </th>
                              <th className="text-right text-xs text-gray-500 pb-1">
                                Count
                              </th>
                              <th className="text-right text-xs text-gray-500 pb-1">
                                Amount
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {preview.paymentBreakdown.map((p) => (
                              <tr
                                key={p.method}
                                className="border-t border-gray-200"
                              >
                                <td className="py-1 text-gray-700">
                                  {p.method}
                                </td>
                                <td className="py-1 text-right text-gray-600">
                                  {p.count}
                                </td>
                                <td className="py-1 text-right font-medium text-gray-800">
                                  ₱{p.amount.toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>

                    {/* SALES — denomination table (editable) */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">
                        SALES — Denomination Entry ✏
                      </h3>
                      <table className="w-full text-sm">
                        <thead>
                          <tr>
                            <th className="text-left text-xs text-blue-600 pb-1 font-semibold">
                              DEN
                            </th>
                            <th className="text-right text-xs text-blue-600 pb-1 font-semibold">
                              # (Count)
                            </th>
                            <th className="text-right text-xs text-gray-500 pb-1">
                              TOTAL
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {DENOM_LIST.map((den) => {
                            const count = editedDenominations[den] ?? 0;
                            const total = count * parseInt(den);
                            return (
                              <tr key={den} className="border-t border-gray-200">
                                <td className="py-1 text-gray-700 font-medium">
                                  {den}
                                </td>
                                <td className="py-1 pl-2">
                                  <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={count === 0 ? "" : count}
                                    placeholder="0"
                                    onChange={(e) =>
                                      setEditedDenominations((prev) => ({
                                        ...prev,
                                        [den]: parseInt(e.target.value) || 0,
                                      }))
                                    }
                                    className="w-full text-right px-2 py-0.5 border border-blue-300 rounded text-xs focus:ring-1 focus:ring-blue-500"
                                  />
                                </td>
                                <td className="py-1 text-right text-gray-700">
                                  {total > 0 ? `₱${total.toLocaleString()}` : ""}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr className="border-t-2 border-gray-300 bg-yellow-50">
                            <td className="py-1 font-bold text-gray-800">
                              TOTAL
                            </td>
                            <td className="py-1 text-right font-bold text-gray-800">
                              {DENOM_LIST.reduce(
                                (s, d) => s + (editedDenominations[d] ?? 0),
                                0,
                              )}
                            </td>
                            <td className="py-1 text-right font-bold text-gray-800">
                              ₱
                              {DENOM_LIST.reduce(
                                (s, d) =>
                                  s +
                                  (editedDenominations[d] ?? 0) * parseInt(d),
                                0,
                              ).toLocaleString()}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  {/* Computation Summary */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">
                      Computation
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-gray-500">Total Sales</p>
                        <p className="font-semibold text-gray-800">
                          ₱{preview.totalSales.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Cash Out</p>
                        <p className="font-semibold text-gray-800">
                          ₱{preview.cashOutTotal.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Gross Sales</p>
                        <p className="font-bold text-gray-900">
                          ₱{(preview.totalSales + preview.cashOutTotal).toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">OVER</p>
                        <p className="font-bold text-yellow-700">
                          ₱{(preview.totalSales + preview.cashOutTotal - preview.cashOutTotal).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Remarks */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Remarks
                    </label>
                    <textarea
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      rows={3}
                      placeholder="Add any remarks or notes..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                    />
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <div className="flex gap-3">
                    <button
                      onClick={handleSave}
                      disabled={saving || loadingPdf}
                      className="flex items-center gap-2 px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                      <Save className="w-4 h-4" />
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                    <button
                      onClick={handleExportPDF}
                      disabled={saving || loadingPdf}
                      className="flex items-center gap-2 px-5 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                      <Download className="w-4 h-4" />
                      {loadingPdf ? "Generating..." : "Save & Export PDF"}
                    </button>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </>
  );
}
