import { useState, useEffect } from "react";
import {
  Plus,
  X,
  Edit2,
  Trash2,
  FileText,
  Search,
  ChevronDown,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import {
  getSuppliers,
  getSupplierInvoices,
  createSupplierInvoice,
  updateSupplierInvoice,
  deleteSupplierInvoice,
  exportSupplierInvoicesPDF,
  type Supplier,
  type SupplierInvoice,
} from "@/utils/api";

export function SupplierInvoicePage({ userRole }: { userRole?: string }) {
  const isAdmin = userRole === "ADMIN";

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [invoices, setInvoices] = useState<SupplierInvoice[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("");
  const [searchReceipt, setSearchReceipt] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<SupplierInvoice | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SupplierInvoice | null>(null);

  // Form
  const [formSupplierId, setFormSupplierId] = useState("");
  const [formReceipt, setFormReceipt] = useState("");
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));
  const [formAmount, setFormAmount] = useState("");
  const [formPaid, setFormPaid] = useState("");
  const [formRemarks, setFormRemarks] = useState("");
  const [saving, setSaving] = useState(false);

  // PDF export modal
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfTitle, setPdfTitle] = useState("Supplier Invoices");
  const [pdfDateRange, setPdfDateRange] = useState("");
  const [pdfNotes, setPdfNotes] = useState("");
  const [pdfRows, setPdfRows] = useState<SupplierInvoice[]>([]);
  const [pdfExporting, setPdfExporting] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      setLoading(true);
      const [suppData, invData] = await Promise.all([
        getSuppliers(),
        getSupplierInvoices(),
      ]);
      setSuppliers(suppData);
      setInvoices(invData);
    } catch {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditingInvoice(null);
    setFormSupplierId(selectedSupplierId || "");
    setFormReceipt("");
    setFormDate(new Date().toISOString().slice(0, 10));
    setFormAmount("");
    setFormPaid("");
    setFormRemarks("");
    setShowModal(true);
  };

  const openEdit = (inv: SupplierInvoice) => {
    setEditingInvoice(inv);
    setFormSupplierId(inv.supplierId);
    setFormReceipt(inv.receiptNumber);
    setFormDate(inv.invoiceDate);
    setFormAmount(String(inv.amount));
    setFormPaid(String(inv.paid));
    setFormRemarks(inv.remarks ?? "");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingInvoice(null);
  };

  const handleSave = async () => {
    if (!formSupplierId) { toast.error("Please select a supplier"); return; }
    const amount = parseFloat(formAmount);
    if (isNaN(amount) || amount <= 0) { toast.error("Please enter a valid amount"); return; }
    const paid = parseFloat(formPaid || "0");

    try {
      setSaving(true);
      if (editingInvoice) {
        await updateSupplierInvoice(editingInvoice.id, {
          supplierId: formSupplierId,
          receiptNumber: formReceipt.trim(),
          invoiceDate: formDate,
          amount,
          paid,
          remarks: formRemarks.trim() || undefined,
        });
        toast.success("Invoice updated");
      } else {
        await createSupplierInvoice({
          supplierId: formSupplierId,
          receiptNumber: formReceipt.trim(),
          invoiceDate: formDate,
          amount,
          paid,
          remarks: formRemarks.trim() || undefined,
        });
        toast.success("Invoice added");
      }
      closeModal();
      await loadAll();
    } catch {
      toast.error("Failed to save invoice");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteSupplierInvoice(deleteTarget.id);
      toast.success("Invoice deleted");
      setDeleteTarget(null);
      await loadAll();
    } catch {
      toast.error("Failed to delete invoice");
    }
  };

  const openPdfModal = () => {
    const supplier = suppliers.find((s) => s.id === selectedSupplierId);
    const defaultTitle = supplier ? supplier.name : "Supplier Invoices";
    const parts: string[] = [];
    if (dateFrom) parts.push(`From: ${new Date(dateFrom + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`);
    if (dateTo)   parts.push(`To: ${new Date(dateTo + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`);
    setPdfTitle(defaultTitle);
    setPdfDateRange(parts.join("  |  "));
    setPdfNotes("");
    setPdfRows(filtered.map((inv) => ({ ...inv })));
    setShowPdfModal(true);
  };

  const handlePdfRowChange = (
    index: number,
    field: "amount" | "paid" | "remarks",
    value: string,
  ) => {
    setPdfRows((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row;
        if (field === "remarks") return { ...row, remarks: value };
        const num = parseFloat(value) || 0;
        const updated = { ...row, [field]: num };
        updated.balance = Math.max(0, updated.amount - updated.paid);
        return updated;
      }),
    );
  };

  const handleExportPDF = async () => {
    if (pdfRows.length === 0) { toast.error("No invoices to export"); return; }
    setPdfExporting(true);
    try {
      const supplier = suppliers.find((s) => s.id === selectedSupplierId);
      await exportSupplierInvoicesPDF({
        title: pdfTitle || "Supplier Invoices",
        supplierName: supplier?.name,
        supplierAddress: supplier?.address,
        dateRange: pdfDateRange || undefined,
        notes: pdfNotes || undefined,
        invoices: pdfRows.map((inv) => ({
          invoiceDate: inv.invoiceDate,
          receiptNumber: inv.receiptNumber,
          supplierName: inv.supplierName,
          amount: inv.amount,
          paid: inv.paid,
          balance: inv.balance,
          remarks: inv.remarks,
        })),
      });
      toast.success("PDF downloaded successfully!");
      setShowPdfModal(false);
    } catch (err: any) {
      toast.error(err?.message || "Failed to generate PDF");
    } finally {
      setPdfExporting(false);
    }
  };

  // Filtered list
  const filtered = invoices.filter((inv) => {
    if (selectedSupplierId && inv.supplierId !== selectedSupplierId) return false;
    if (searchReceipt && !inv.receiptNumber.toLowerCase().includes(searchReceipt.toLowerCase())) return false;
    if (dateFrom && inv.invoiceDate < dateFrom) return false;
    if (dateTo && inv.invoiceDate > dateTo) return false;
    return true;
  });

  const totalAmount  = filtered.reduce((s, i) => s + i.amount, 0);
  const totalPaid    = filtered.reduce((s, i) => s + i.paid, 0);
  const totalBalance = filtered.reduce((s, i) => s + i.balance, 0);

  const fmt = (n: number) =>
    n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const selectedSupplier = suppliers.find((s) => s.id === selectedSupplierId);

  return (
    <>
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Supplier Invoices</h1>
          <p className="text-muted-foreground text-sm">
            Track supplier receipts, payments, and outstanding balances
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <button
              onClick={openAdd}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Invoice
            </button>
          )}
          <button
            onClick={openPdfModal}
            disabled={filtered.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-xl p-4 mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Supplier filter */}
        <div className="relative">
          <label className="block text-xs text-muted-foreground mb-1">Supplier</label>
          <div className="relative">
            <select
              value={selectedSupplierId}
              onChange={(e) => setSelectedSupplierId(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Suppliers</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {/* Receipt search */}
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Receipt #</label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search receipt..."
              value={searchReceipt}
              onChange={(e) => setSearchReceipt(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Date from */}
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Date From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Date to */}
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Date To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Amount</p>
          <p className="text-xl font-bold">₱{fmt(totalAmount)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Paid</p>
          <p className="text-xl font-bold text-green-600">₱{fmt(totalPaid)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Outstanding Balance</p>
          <p className={`text-xl font-bold ${totalBalance > 0 ? "text-red-600" : "text-green-600"}`}>
            ₱{fmt(totalBalance)}
          </p>
        </div>
      </div>

      {/* Selected supplier header (like the image) */}
      {selectedSupplier && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-4 text-center">
          <h2 className="text-lg font-bold uppercase">{selectedSupplier.name}</h2>
          {selectedSupplier.address && (
            <p className="text-sm text-muted-foreground">{selectedSupplier.address}</p>
          )}
        </div>
      )}

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-muted-foreground">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No invoices found</p>
            {isAdmin && (
              <button
                onClick={openAdd}
                className="mt-3 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90"
              >
                Add First Invoice
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Supplier</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Receipt #</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Amount</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Paid</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Balance</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Remarks</th>
                  {isAdmin && (
                    <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.map((inv, i) => (
                  <tr
                    key={inv.id}
                    className={`border-b border-border last:border-0 hover:bg-muted/20 transition-colors ${i % 2 === 0 ? "" : "bg-muted/10"}`}
                  >
                    <td className="px-4 py-3 text-sm whitespace-nowrap">
                      {new Date(inv.invoiceDate + "T00:00:00").toLocaleDateString("en-US", {
                        month: "2-digit", day: "2-digit", year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">{inv.supplierName}</td>
                    <td className="px-4 py-3 text-sm">{inv.receiptNumber || <span className="text-muted-foreground">—</span>}</td>
                    <td className="px-4 py-3 text-sm text-right font-medium">₱{fmt(inv.amount)}</td>
                    <td className="px-4 py-3 text-sm text-right text-green-600">
                      {inv.paid > 0 ? `₱${fmt(inv.paid)}` : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-semibold">
                      <span className={inv.balance > 0 ? "text-red-600" : "text-green-600"}>
                        ₱{fmt(inv.balance)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground max-w-[200px] truncate">
                      {inv.remarks || <span>—</span>}
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEdit(inv)}
                            className="p-1.5 hover:bg-accent rounded text-muted-foreground hover:text-foreground transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(inv)}
                            className="p-1.5 hover:bg-red-50 rounded text-muted-foreground hover:text-red-600 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
              {/* Totals row */}
              <tfoot>
                <tr className="bg-muted/30 border-t-2 border-border">
                  <td colSpan={3} className="px-4 py-3 text-sm font-bold uppercase">Total</td>
                  <td className="px-4 py-3 text-sm font-bold text-right">₱{fmt(totalAmount)}</td>
                  <td className="px-4 py-3 text-sm font-bold text-right text-green-600">
                    {totalPaid > 0 ? `₱${fmt(totalPaid)}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-right">
                    <span className={totalBalance > 0 ? "text-red-600" : "text-green-600"}>
                      ₱{fmt(totalBalance)}
                    </span>
                  </td>
                  <td colSpan={isAdmin ? 2 : 1} />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-lg font-bold">
                {editingInvoice ? "Edit Invoice" : "Add Invoice"}
              </h2>
              <button onClick={closeModal} className="p-2 hover:bg-accent rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Supplier */}
              <div>
                <label className="block text-sm font-medium mb-1">Supplier *</label>
                <div className="relative">
                  <select
                    value={formSupplierId}
                    onChange={(e) => setFormSupplierId(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Select supplier…</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              {/* Receipt # */}
              <div>
                <label className="block text-sm font-medium mb-1">Receipt #</label>
                <input
                  type="text"
                  value={formReceipt}
                  onChange={(e) => setFormReceipt(e.target.value)}
                  placeholder="e.g. 9043"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium mb-1">Date *</label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Amount & Paid side by side */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Amount (₱) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Paid (₱)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formPaid}
                    onChange={(e) => setFormPaid(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Balance preview */}
              {formAmount && (
                <div className="bg-muted/30 rounded-lg p-3 text-sm">
                  <span className="text-muted-foreground">Balance: </span>
                  <span className="font-semibold">
                    ₱{fmt(Math.max(0, (parseFloat(formAmount) || 0) - (parseFloat(formPaid) || 0)))}
                  </span>
                </div>
              )}

              {/* Remarks */}
              <div>
                <label className="block text-sm font-medium mb-1">Remarks</label>
                <textarea
                  value={formRemarks}
                  onChange={(e) => setFormRemarks(e.target.value)}
                  placeholder="Optional notes…"
                  rows={2}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 p-5 border-t border-border">
              <button
                onClick={closeModal}
                className="flex-1 border border-border py-2 rounded-lg hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-primary text-primary-foreground py-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {saving ? "Saving…" : editingInvoice ? "Update" : "Add Invoice"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold mb-2">Delete Invoice</h2>
            <p className="text-muted-foreground mb-1">
              Receipt <span className="font-medium text-foreground">#{deleteTarget.receiptNumber || deleteTarget.id}</span> from{" "}
              <span className="font-medium text-foreground">{deleteTarget.supplierName}</span>
            </p>
            <p className="text-muted-foreground mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 border border-border py-2 rounded-lg hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>

    {/* ── PDF Export Modal ──────────────────────────────────── */}
    {showPdfModal && (
      <div className="fixed inset-0 bg-black/60 z-50 flex flex-col">
        <div className="flex-1 bg-white flex flex-col overflow-hidden">
          {/* Modal Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Review &amp; Export — Supplier Invoices</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Edit any values below before exporting. Changes here do not affect the database.
              </p>
            </div>
            <button
              onClick={() => setShowPdfModal(false)}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-auto p-6 space-y-5">
            {/* Header fields */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Document Header</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
                  <input
                    type="text"
                    value={pdfTitle}
                    onChange={(e) => setPdfTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="e.g. Supplier Invoices — January 2026"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Date Range / Period</label>
                  <input
                    type="text"
                    value={pdfDateRange}
                    onChange={(e) => setPdfDateRange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="e.g. January 1 – January 31, 2026"
                  />
                </div>
              </div>
              <div className="mt-3">
                <label className="block text-xs font-medium text-gray-600 mb-1">Notes / Remarks (printed at bottom)</label>
                <textarea
                  value={pdfNotes}
                  onChange={(e) => setPdfNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  placeholder="Optional notes…"
                />
              </div>
            </div>

            {/* Invoices table */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-700">Invoices ({pdfRows.length})</h3>
                <p className="text-xs text-gray-400">Columns with blue headers are editable</p>
              </div>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="text-xs min-w-full">
                  <thead>
                    <tr>
                      <th className="bg-gray-100 border-b border-gray-200 px-3 py-2 text-left font-semibold text-gray-700 min-w-[95px]">Date</th>
                      <th className="bg-gray-100 border-b border-gray-200 px-3 py-2 text-left font-semibold text-gray-700 min-w-[100px]">Receipt #</th>
                      <th className="bg-gray-100 border-b border-gray-200 px-3 py-2 text-left font-semibold text-gray-700 min-w-[130px]">Supplier</th>
                      <th className="bg-blue-100 border-b border-gray-200 px-3 py-2 text-right font-semibold text-blue-700 min-w-[110px]">Amount (₱) ✏</th>
                      <th className="bg-blue-100 border-b border-gray-200 px-3 py-2 text-right font-semibold text-blue-700 min-w-[110px]">Paid (₱) ✏</th>
                      <th className="bg-gray-100 border-b border-gray-200 px-3 py-2 text-right font-semibold text-gray-700 min-w-[100px]">Balance</th>
                      <th className="bg-blue-100 border-b border-gray-200 px-3 py-2 text-left font-semibold text-blue-700 min-w-[160px]">Remarks ✏</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pdfRows.map((inv, i) => (
                      <tr key={inv.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-3 py-1.5 text-gray-700">
                          {new Date(inv.invoiceDate + "T00:00:00").toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" })}
                        </td>
                        <td className="px-3 py-1.5 text-gray-700">{inv.receiptNumber || "—"}</td>
                        <td className="px-3 py-1.5 font-medium text-gray-800">{inv.supplierName}</td>
                        <td className="px-1.5 py-1">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={inv.amount}
                            onChange={(e) => handlePdfRowChange(i, "amount", e.target.value)}
                            className="w-full text-right px-2 py-1 border border-blue-200 rounded bg-blue-50 focus:ring-1 focus:ring-blue-400 focus:outline-none text-xs"
                          />
                        </td>
                        <td className="px-1.5 py-1">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={inv.paid}
                            onChange={(e) => handlePdfRowChange(i, "paid", e.target.value)}
                            className="w-full text-right px-2 py-1 border border-blue-200 rounded bg-blue-50 focus:ring-1 focus:ring-blue-400 focus:outline-none text-xs"
                          />
                        </td>
                        <td className={`px-3 py-1.5 text-right font-semibold ${inv.balance > 0 ? "text-red-600" : "text-green-700"}`}>
                          ₱{inv.balance.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-1.5 py-1">
                          <input
                            type="text"
                            value={inv.remarks ?? ""}
                            onChange={(e) => handlePdfRowChange(i, "remarks", e.target.value)}
                            placeholder="—"
                            className="w-full px-2 py-1 border border-blue-200 rounded bg-blue-50 focus:ring-1 focus:ring-blue-400 focus:outline-none text-xs"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-100 border-t-2 border-gray-300">
                      <td colSpan={3} className="px-3 py-2 font-bold text-gray-800 text-xs uppercase">
                        Total ({pdfRows.length} invoice{pdfRows.length !== 1 ? "s" : ""})
                      </td>
                      <td className="px-3 py-2 text-right font-bold text-gray-800 text-xs">
                        ₱{pdfRows.reduce((s, r) => s + r.amount, 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-3 py-2 text-right font-bold text-green-700 text-xs">
                        ₱{pdfRows.reduce((s, r) => s + r.paid, 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                      </td>
                      <td className={`px-3 py-2 text-right font-bold text-xs ${pdfRows.reduce((s, r) => s + r.balance, 0) > 0 ? "text-red-600" : "text-green-700"}`}>
                        ₱{pdfRows.reduce((s, r) => s + r.balance, 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
            <button
              onClick={() => setShowPdfModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleExportPDF}
              disabled={pdfExporting || pdfRows.length === 0}
              className="flex items-center gap-2 px-5 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              {pdfExporting ? "Generating PDF…" : "Export as PDF"}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
