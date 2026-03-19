import React, { useState, useEffect } from "react";
import {
  Plus,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  User,
  FileText,
  ArrowDownCircle,
  Pencil,
} from "lucide-react";
import { API_BASE_URL, getTransactionCategories } from "../../utils/api";
import { toast } from "sonner";

interface Transaction {
  id: string;
  type: "Cash In" | "Cash Out";
  amount: number;
  description: string;
  category: string;
  reference?: string;
  createdBy: string;
  timestamp: string;
  sourceTransactionId?: string | null;
  shift?: "AM" | "PM" | null;
}

interface TransactionsPageProps {
  user: any;
}

const TransactionsPage: React.FC<TransactionsPageProps> = ({ user }) => {
  const isAdmin =
    user?.role === "ADMIN" ||
    !!user?.permissions?.includes("admin_permissions") ||
    !!user?.permissions?.includes("admin_perm_transactions");
  const canAdd =
    isAdmin || !!user?.permissions?.includes("admin_perm_transactions_add");
  const canEdit =
    isAdmin || !!user?.permissions?.includes("admin_perm_transactions_edit");
  const canCashOut =
    isAdmin || !!user?.permissions?.includes("admin_perm_transactions_cashout");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [cashInCategories, setCashInCategories] = useState<string[]>([
    "Sales",
    "Investment",
    "Loan",
    "Refund",
    "Other Income",
  ]);
  const [cashOutCategories, setCashOutCategories] = useState<string[]>([
    "Supplies",
    "Utilities",
    "Salaries",
    "Rent",
    "Transportation",
    "Maintenance",
    "Other Expenses",
  ]);

  // Form states
  const [type, setType] = useState<"Cash In" | "Cash Out">("Cash In");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [reference, setReference] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [cashOutConfirm, setCashOutConfirm] = useState<Transaction | null>(
    null,
  );
  const [cashOutLoading, setCashOutLoading] = useState(false);

  // Edit state
  const [editTarget, setEditTarget] = useState<Transaction | null>(null);
  const [editType, setEditType] = useState<"Cash In" | "Cash Out">("Cash In");
  const [editAmount, setEditAmount] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editReference, setEditReference] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => {
    fetchTransactions();
    getTransactionCategories()
      .then((cats) => {
        if (cats.cashIn?.length) setCashInCategories(cats.cashIn);
        if (cats.cashOut?.length) setCashOutCategories(cats.cashOut);
      })
      .catch(() => {});
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/transactions`, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || []);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransaction = async () => {
    if (!amount || !description || !category) {
      toast.error("Please fill in all required fields");
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/transactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type,
          amount: numAmount,
          description,
          category,
          reference: reference || undefined,
          createdBy: user?.fullName || "Admin",
          shift: user?.shift || null,
        }),
      });

      if (response.ok) {
        await fetchTransactions();
        setIsAddModalOpen(false);
        // Reset form
        setType("Cash In");
        setAmount("");
        setDescription("");
        setCategory("");
        setReference("");
        toast.success("Transaction added successfully");
      } else {
        toast.error("Failed to add transaction");
      }
    } catch (error) {
      console.error("Error adding transaction:", error);
      toast.error("Error adding transaction");
    }
  };

  const openEditModal = (t: Transaction) => {
    setEditTarget(t);
    setEditType(t.type);
    setEditAmount(String(t.amount));
    setEditDescription(t.description);
    setEditCategory(t.category);
    setEditReference(t.reference || "");
  };

  const handleEditTransaction = async () => {
    if (!editTarget) return;
    const numAmount = parseFloat(editAmount);
    if (!editAmount || isNaN(numAmount) || numAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (!editDescription || !editCategory) {
      toast.error("Please fill in all required fields");
      return;
    }
    setEditSaving(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/transactions/${editTarget.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: editType,
            amount: numAmount,
            description: editDescription,
            category: editCategory,
            reference: editReference || null,
          }),
        },
      );
      if (response.ok) {
        await fetchTransactions();
        setEditTarget(null);
        toast.success("Transaction updated successfully");
      } else {
        const err = await response.json();
        toast.error(err.error || "Failed to update transaction");
      }
    } catch {
      toast.error("Error updating transaction");
    } finally {
      setEditSaving(false);
    }
  };

  const handleQuickCashOut = async (source: Transaction) => {
    setCashOutLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "Cash Out",
          amount: source.amount,
          description: source.description,
          category: source.category,
          reference: source.reference || undefined,
          createdBy: user?.fullName || "Admin",
          sourceTransactionId: source.id,
          shift: source.shift || null,
        }),
      });
      if (response.ok) {
        await fetchTransactions();
        setCashOutConfirm(null);
        toast.success("Cash out transaction recorded successfully");
      } else {
        toast.error("Failed to record cash out");
      }
    } catch (error) {
      console.error("Error recording quick cash out:", error);
      toast.error("Error recording cash out");
    } finally {
      setCashOutLoading(false);
    }
  };

  // Filter by date range
  const filteredTransactions = transactions.filter((t) => {
    const tDate = new Date(t.timestamp).toISOString().split("T")[0];
    const matchesFrom = !dateFrom || tDate >= dateFrom;
    const matchesTo = !dateTo || tDate <= dateTo;
    return matchesFrom && matchesTo;
  });

  // Calculate totals
  const totalCashIn = filteredTransactions
    .filter((t) => t.type === "Cash In")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalCashOut = filteredTransactions
    .filter((t) => t.type === "Cash Out")
    .reduce((sum, t) => sum + t.amount, 0);

  const netBalance = totalCashIn - totalCashOut;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Cash-in / Cash-out
          </h1>
          <p className="text-gray-600 mt-1">
            Manage cash in and cash out transactions
          </p>
        </div>
        {canAdd && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Transaction
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-700 text-sm font-medium">
                Total Cash In
              </p>
              <p className="text-3xl font-bold text-green-900 mt-2">
                ₱
                {totalCashIn.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-700" />
            </div>
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-700 text-sm font-medium">Total Cash Out</p>
              <p className="text-3xl font-bold text-red-900 mt-2">
                ₱
                {totalCashOut.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-200 rounded-full flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-red-700" />
            </div>
          </div>
        </div>

        <div
          className={`${netBalance >= 0 ? "bg-blue-50 border-blue-200" : "bg-orange-50 border-orange-200"} border rounded-lg p-6`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p
                className={`${netBalance >= 0 ? "text-blue-700" : "text-orange-700"} text-sm font-medium`}
              >
                Net Balance
              </p>
              <p
                className={`text-3xl font-bold ${netBalance >= 0 ? "text-blue-900" : "text-orange-900"} mt-2`}
              >
                ₱
                {Math.abs(netBalance).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>
            <div
              className={`w-12 h-12 ${netBalance >= 0 ? "bg-blue-200" : "bg-orange-200"} rounded-full flex items-center justify-center`}
            >
              <DollarSign
                className={`w-6 h-6 ${netBalance >= 0 ? "text-blue-700" : "text-orange-700"}`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Date Filter */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">From:</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">To:</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
        </div>
        {(dateFrom || dateTo) && (
          <button
            onClick={() => {
              setDateFrom("");
              setDateTo("");
            }}
            className="text-sm text-red-600 hover:text-red-800 underline"
          >
            Clear dates
          </button>
        )}
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reference
                </th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created By
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    Loading transactions...
                  </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No transactions found. Click "Add Transaction" to create
                    one.
                  </td>
                </tr>
              ) : (
                (() => {
                  const amTx = filteredTransactions.filter(
                    (t) => t.shift === "AM",
                  );
                  const pmTx = filteredTransactions.filter(
                    (t) => t.shift === "PM",
                  );
                  const untagged = filteredTransactions.filter((t) => !t.shift);

                  const renderRows = (items: Transaction[]) =>
                    items.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(transaction.timestamp).toLocaleString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                              transaction.type === "Cash In"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {transaction.type === "Cash In" ? (
                              <TrendingUp className="w-3 h-3" />
                            ) : (
                              <TrendingDown className="w-3 h-3" />
                            )}
                            {transaction.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {transaction.category}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {transaction.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {transaction.reference || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <span
                            className={`text-sm font-semibold ${
                              transaction.type === "Cash In"
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {transaction.type === "Cash In" ? "+" : "-"}₱
                            {transaction.amount.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {transaction.createdBy}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {/* Fixed two-slot layout: Edit left, Cash Out right */}
                          <div className="flex items-center gap-2">
                            {/* Left slot — Edit */}
                            <div className="w-[72px]">
                              {canEdit && (
                                <button
                                  onClick={() => openEditModal(transaction)}
                                  className="inline-flex items-center gap-1 w-full justify-center px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-medium transition-colors"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                  Edit
                                </button>
                              )}
                            </div>
                            {/* Right slot — Cash Out */}
                            <div className="w-[90px]">
                              {transaction.type === "Cash In" &&
                                canCashOut &&
                                (() => {
                                  const alreadyCashedOut = transactions.some(
                                    (t) =>
                                      t.type === "Cash Out" &&
                                      t.sourceTransactionId === transaction.id,
                                  );
                                  return alreadyCashedOut ? (
                                    <span className="inline-flex items-center gap-1 w-full justify-center px-3 py-1.5 bg-gray-100 text-gray-400 border border-gray-200 rounded-lg text-xs font-medium cursor-not-allowed">
                                      <ArrowDownCircle className="w-3.5 h-3.5" />
                                      Cashed Out
                                    </span>
                                  ) : (
                                    <button
                                      onClick={() =>
                                        setCashOutConfirm(transaction)
                                      }
                                      className="inline-flex items-center gap-1 w-full justify-center px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-medium transition-colors"
                                    >
                                      <ArrowDownCircle className="w-3.5 h-3.5" />
                                      Cash Out
                                    </button>
                                  );
                                })()}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ));

                  const renderGroupHeader = (
                    label: string,
                    count: number,
                    colorClass: string,
                  ) => (
                    <tr key={`hdr-${label}`} className={colorClass}>
                      <td
                        colSpan={8}
                        className="px-6 py-2 text-xs font-semibold uppercase tracking-wider"
                      >
                        {label}{" "}
                        <span className="font-normal opacity-70">
                          ({count})
                        </span>
                      </td>
                    </tr>
                  );

                  return (
                    <>
                      {amTx.length > 0 &&
                        renderGroupHeader(
                          "AM Shift",
                          amTx.length,
                          "bg-blue-50 text-blue-700 border-b border-blue-100",
                        )}
                      {renderRows(amTx)}
                      {pmTx.length > 0 &&
                        renderGroupHeader(
                          "PM Shift",
                          pmTx.length,
                          "bg-orange-50 text-orange-700 border-b border-orange-100",
                        )}
                      {renderRows(pmTx)}
                      {untagged.length > 0 &&
                        (amTx.length > 0 || pmTx.length > 0) &&
                        renderGroupHeader(
                          "Unassigned",
                          untagged.length,
                          "bg-gray-50 text-gray-500 border-b border-gray-100",
                        )}
                      {renderRows(untagged)}
                    </>
                  );
                })()
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Cash Out Confirmation Modal */}
      {cashOutConfirm && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => setCashOutConfirm(null)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              Confirm Cash Out
            </h2>
            <p className="text-sm text-gray-500 mb-5">
              A new Cash Out transaction will be recorded with the following
              details:
            </p>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm mb-6">
              <div className="flex justify-between">
                <span className="text-gray-500">Category</span>
                <span className="font-medium text-gray-900">
                  {cashOutConfirm.category}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Description</span>
                <span className="font-medium text-gray-900 text-right max-w-[60%]">
                  {cashOutConfirm.description}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Reference</span>
                <span className="font-medium text-gray-900">
                  {cashOutConfirm.reference || "-"}
                </span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-2 mt-2">
                <span className="text-gray-500 font-medium">Amount</span>
                <span className="font-bold text-red-600">
                  -₱
                  {cashOutConfirm.amount.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setCashOutConfirm(null)}
                disabled={cashOutLoading}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleQuickCashOut(cashOutConfirm)}
                disabled={cashOutLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium"
              >
                {cashOutLoading ? "Recording..." : "Confirm Cash Out"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Transaction Modal */}
      {editTarget && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => !editSaving && setEditTarget(null)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">
                Edit Transaction
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                ID #{editTarget.id} · Created by {editTarget.createdBy}
              </p>

              <div className="space-y-4">
                {/* Transaction Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Transaction Type *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setEditType("Cash In")}
                      className={`flex items-center justify-center gap-2 px-4 py-3 border-2 rounded-lg transition-all ${
                        editType === "Cash In"
                          ? "border-green-500 bg-green-50 text-green-700"
                          : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      <TrendingUp className="w-5 h-5" />
                      Cash In
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditType("Cash Out")}
                      className={`flex items-center justify-center gap-2 px-4 py-3 border-2 rounded-lg transition-all ${
                        editType === "Cash Out"
                          ? "border-red-500 bg-red-50 text-red-700"
                          : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      <TrendingDown className="w-5 h-5" />
                      Cash Out
                    </button>
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount (₱) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="">Select a category</option>
                    {(editType === "Cash In"
                      ? cashInCategories
                      : cashOutCategories
                    ).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                    rows={3}
                    placeholder="Enter transaction description"
                  />
                </div>

                {/* Reference */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reference Number (Optional)
                  </label>
                  <input
                    type="text"
                    value={editReference}
                    onChange={(e) => setEditReference(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="e.g., INV-001, Receipt #123"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  disabled={editSaving}
                  onClick={() => setEditTarget(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  disabled={editSaving}
                  onClick={handleEditTransaction}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
                >
                  {editSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Transaction Modal */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => setIsAddModalOpen(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Add Transaction
              </h2>

              <div className="space-y-4">
                {/* Transaction Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Transaction Type *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setType("Cash In")}
                      className={`flex items-center justify-center gap-2 px-4 py-3 border-2 rounded-lg transition-all ${
                        type === "Cash In"
                          ? "border-green-500 bg-green-50 text-green-700"
                          : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      <TrendingUp className="w-5 h-5" />
                      Cash In
                    </button>
                    <button
                      type="button"
                      onClick={() => setType("Cash Out")}
                      className={`flex items-center justify-center gap-2 px-4 py-3 border-2 rounded-lg transition-all ${
                        type === "Cash Out"
                          ? "border-red-500 bg-red-50 text-red-700"
                          : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      <TrendingDown className="w-5 h-5" />
                      Cash Out
                    </button>
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount (₱) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="">Select a category</option>
                    {(type === "Cash In"
                      ? cashInCategories
                      : cashOutCategories
                    ).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                    rows={3}
                    placeholder="Enter transaction description"
                  />
                </div>

                {/* Reference */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reference Number (Optional)
                  </label>
                  <input
                    type="text"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="e.g., INV-001, Receipt #123"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setType("Cash In");
                    setAmount("");
                    setDescription("");
                    setCategory("");
                    setReference("");
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddTransaction}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Add Transaction
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionsPage;
