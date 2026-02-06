import {
  Filter,
  Eye,
  Edit2,
  ChevronDown,
  ChevronUp,
  Percent,
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import {
  updateSale,
  getSales,
  getStores,
  exportDailyReportCSV,
  type Sale,
  type StoreLocation,
} from "@/utils/api";
import { toast } from "sonner";
import { Search, DollarSign, TrendingUp, RefreshCw } from "lucide-react";
import type { UserRole, UserData } from "@/app/components/LoginPage";

interface SaleRecord {
  id: string;
  transactionId: string;
  date: string;
  time: string;
  store: string;
  customer: string;
  items: number;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: "Cash" | "Card" | "GCash" | "Mobile Payment";
  cashier: string;
  status: "Completed" | "Refunded" | "Pending";
  reseco?: number;
  originalTotal?: number;
}

const MOCK_SALES: SaleRecord[] = [
  {
    id: "1",
    transactionId: "TXN-2026-001",
    date: "2026-01-13",
    time: "09:15 AM",
    store: "Store 1",
    customer: "John Doe",
    items: 5,
    subtotal: 124.5,
    discount: 12.45,
    tax: 8.96,
    total: 121.01,
    paymentMethod: "Card",
    cashier: "Sarah Johnson",
    status: "Completed",
  },
  {
    id: "2",
    transactionId: "TXN-2026-002",
    date: "2026-01-13",
    time: "09:32 AM",
    store: "Store 2",
    customer: "Jane Smith",
    items: 3,
    subtotal: 67.8,
    discount: 0,
    tax: 5.42,
    total: 73.22,
    paymentMethod: "Cash",
    cashier: "Mike Brown",
    status: "Completed",
  },
  {
    id: "3",
    transactionId: "TXN-2026-003",
    date: "2026-01-13",
    time: "10:05 AM",
    store: "Store 1",
    customer: "Robert Wilson",
    items: 8,
    subtotal: 245.99,
    discount: 24.6,
    tax: 17.71,
    total: 239.1,
    paymentMethod: "Mobile Payment",
    cashier: "Sarah Johnson",
    status: "Completed",
  },
  {
    id: "4",
    transactionId: "TXN-2026-004",
    date: "2026-01-13",
    time: "10:18 AM",
    store: "Store 3",
    customer: "Emily Davis",
    items: 2,
    subtotal: 45.5,
    discount: 0,
    tax: 3.64,
    total: 49.14,
    paymentMethod: "Card",
    cashier: "Alex Martinez",
    status: "Completed",
  },
  {
    id: "5",
    transactionId: "TXN-2026-005",
    date: "2026-01-13",
    time: "11:22 AM",
    store: "Store 2",
    customer: "Michael Brown",
    items: 6,
    subtotal: 189.75,
    discount: 18.98,
    tax: 13.66,
    total: 184.43,
    paymentMethod: "Cash",
    cashier: "Mike Brown",
    status: "Completed",
  },
  {
    id: "6",
    transactionId: "TXN-2026-006",
    date: "2026-01-13",
    time: "11:45 AM",
    store: "Store 1",
    customer: "Sarah Anderson",
    items: 4,
    subtotal: 98.6,
    discount: 9.86,
    tax: 7.1,
    total: 95.84,
    paymentMethod: "Card",
    cashier: "Sarah Johnson",
    status: "Completed",
  },
  {
    id: "7",
    transactionId: "TXN-2026-007",
    date: "2026-01-13",
    time: "12:10 PM",
    store: "Store 3",
    customer: "David Lee",
    items: 7,
    subtotal: 215.3,
    discount: 0,
    tax: 17.22,
    total: 232.52,
    paymentMethod: "Mobile Payment",
    cashier: "Alex Martinez",
    status: "Completed",
  },
  {
    id: "8",
    transactionId: "TXN-2026-008",
    date: "2026-01-12",
    time: "02:30 PM",
    store: "Store 2",
    customer: "Lisa Garcia",
    items: 3,
    subtotal: 78.9,
    discount: 7.89,
    tax: 5.68,
    total: 76.69,
    paymentMethod: "Cash",
    cashier: "Mike Brown",
    status: "Completed",
  },
  {
    id: "9",
    transactionId: "TXN-2026-009",
    date: "2026-01-12",
    time: "03:15 PM",
    store: "Store 1",
    customer: "Thomas White",
    items: 10,
    subtotal: 342.8,
    discount: 34.28,
    tax: 24.68,
    total: 333.2,
    paymentMethod: "Card",
    cashier: "Sarah Johnson",
    status: "Completed",
  },
  {
    id: "10",
    transactionId: "TXN-2026-010",
    date: "2026-01-12",
    time: "04:00 PM",
    store: "Store 3",
    customer: "Maria Rodriguez",
    items: 5,
    subtotal: 156.45,
    discount: 0,
    tax: 12.52,
    total: 168.97,
    paymentMethod: "Mobile Payment",
    cashier: "Alex Martinez",
    status: "Completed",
  },
  {
    id: "11",
    transactionId: "TXN-2026-011",
    date: "2026-01-12",
    time: "04:45 PM",
    store: "Store 2",
    customer: "Walk-in Customer",
    items: 2,
    subtotal: 34.5,
    discount: 0,
    tax: 2.76,
    total: 37.26,
    paymentMethod: "Cash",
    cashier: "Mike Brown",
    status: "Completed",
  },
  {
    id: "12",
    transactionId: "TXN-2026-012",
    date: "2026-01-11",
    time: "10:20 AM",
    store: "Store 1",
    customer: "Jessica Taylor",
    items: 6,
    subtotal: 187.2,
    discount: 18.72,
    tax: 13.48,
    total: 181.96,
    paymentMethod: "Card",
    cashier: "Sarah Johnson",
    status: "Refunded",
  },
  {
    id: "13",
    transactionId: "TXN-2026-013",
    date: "2026-01-11",
    time: "11:30 AM",
    store: "Store 3",
    customer: "Christopher Martin",
    items: 4,
    subtotal: 112.9,
    discount: 0,
    tax: 9.03,
    total: 121.93,
    paymentMethod: "Mobile Payment",
    cashier: "Alex Martinez",
    status: "Completed",
  },
  {
    id: "14",
    transactionId: "TXN-2026-014",
    date: "2026-01-11",
    time: "01:15 PM",
    store: "Store 2",
    customer: "Amanda Clark",
    items: 7,
    subtotal: 234.6,
    discount: 23.46,
    tax: 16.89,
    total: 228.03,
    paymentMethod: "Cash",
    cashier: "Mike Brown",
    status: "Completed",
  },
  {
    id: "15",
    transactionId: "TXN-2026-015",
    date: "2026-01-11",
    time: "02:50 PM",
    store: "Store 1",
    customer: "Daniel Harris",
    items: 3,
    subtotal: 89.25,
    discount: 0,
    tax: 7.14,
    total: 96.39,
    paymentMethod: "Card",
    cashier: "Sarah Johnson",
    status: "Completed",
  },
];

interface SalesDataTableProps {
  userRole: UserRole;
  currentUser: UserData;
}

export function SalesDataTable({ userRole, currentUser }: SalesDataTableProps) {
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [storesList, setStoresList] = useState<string[]>(["All Stores"]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStore, setSelectedStore] = useState<string>("All Stores");
  const [selectedPayment, setSelectedPayment] = useState<string>("All Methods");
  const [selectedStatus, setSelectedStatus] = useState<string>("All Status");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [sortField, setSortField] = useState<keyof SaleRecord>("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [selectedSale, setSelectedSale] = useState<SaleRecord | null>(null);
  const [editingSale, setEditingSale] = useState<SaleRecord | null>(null);
  const [resecoAmount, setResecoAmount] = useState<string>("0");

  const paymentMethods = [
    "All Methods",
    "Cash",
    "Card",
    "GCash",
    "Mobile Payment",
  ];
  const statuses = ["All Status", "Completed", "Refunded", "Pending"];

  useEffect(() => {
    loadSalesData();
  }, []);

  const loadSalesData = async () => {
    try {
      setLoading(true);
      const [salesData, storesData] = await Promise.all([
        getSales(),
        getStores(),
      ]);

      console.log("Raw salesData from API:", salesData);
      console.log("Number of sales:", salesData.length);
      if (salesData.length > 0) {
        console.log("First sale:", salesData[0]);
      }

      // Transform Sale[] to SaleRecord[]
      const transformedSales: SaleRecord[] = salesData.map((sale: any) => {
        try {
          const timestamp =
            sale.timestamp || sale.date || new Date().toISOString();
          const date = new Date(timestamp);
          const itemsArray = Array.isArray(sale.items) ? sale.items : [];

          const totalVal = parseFloat(String(sale.total)) || 0;
          const subtotalVal = parseFloat(String(sale.subtotal)) || 0;
          let discountVal =
            parseFloat(String(sale.globalDiscount || sale.discount)) || 0;

          // If discount is 0 but subtotal > total, calculate from the difference
          if (discountVal === 0 && subtotalVal > totalVal) {
            discountVal = subtotalVal - totalVal;
          }

          const taxVal = parseFloat(String(sale.tax)) || 0;

          const transformed = {
            id: sale.id || sale.transactionId,
            transactionId: sale.transactionId || "Unknown",
            date: date.toISOString().split("T")[0],
            time: date.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            store: sale.location || "Unknown Store",
            customer: sale.customer?.name || "Walk-in Customer",
            items: itemsArray.length,
            subtotal: subtotalVal,
            discount: discountVal,
            tax: taxVal,
            total: totalVal,
            paymentMethod: (sale.paymentMethod as any) || "Cash",
            cashier: String(sale.cashier || sale.username || "Unknown"),
            status: "Completed" as const,
          };

          console.log("Transformed single sale:", transformed);
          return transformed;
        } catch (err) {
          console.error("Error transforming sale:", sale, err);
          throw err;
        }
      });

      console.log("Final transformed sales:", transformedSales);
      console.log(
        "Final total:",
        transformedSales.reduce((sum, s) => sum + s.total, 0),
      );

      setSales(transformedSales);

      // Build store list from actual stores
      const storeNames = storesData.map((store) => store.name);
      setStoresList(["All Stores", ...storeNames]);
    } catch (error) {
      console.error("Error loading sales data:", error);
      toast.error("Failed to load sales data");
    } finally {
      setLoading(false);
    }
  };

  // Filter sales
  const filteredSales = sales.filter((sale) => {
    try {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        String(sale.transactionId || "")
          .toLowerCase()
          .includes(searchLower) ||
        String(sale.customer || "")
          .toLowerCase()
          .includes(searchLower) ||
        String(sale.cashier || "")
          .toLowerCase()
          .includes(searchLower);

      const matchesStore =
        selectedStore === "All Stores" || sale.store === selectedStore;
      const matchesPayment =
        selectedPayment === "All Methods" ||
        sale.paymentMethod === selectedPayment;
      const matchesStatus =
        selectedStatus === "All Status" || sale.status === selectedStatus;

      return matchesSearch && matchesStore && matchesPayment && matchesStatus;
    } catch (err) {
      console.error("Filter error for sale:", sale, err);
      return false;
    }
  });

  console.log("Current sales count:", sales.length);
  console.log("Filtered sales count:", filteredSales.length);
  console.log("Filtered sales:", filteredSales);

  // Sort sales
  const sortedSales = [...filteredSales].sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];

    // Handle date and time sorting
    if (sortField === "date") {
      aValue = new Date(a.date + " " + a.time).getTime();
      bValue = new Date(b.date + " " + b.time).getTime();
    }

    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const handleSort = (field: keyof SaleRecord) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Calculate totals
  const totalSales = filteredSales.reduce((sum, sale) => {
    const total = Number(sale.total) || 0;
    return sum + total;
  }, 0);
  const totalTransactions = filteredSales.length;
  const avgTransactionValue =
    totalTransactions > 0 ? totalSales / totalTransactions : 0;
  const totalDiscount = filteredSales.reduce((sum, sale) => {
    const discount = Number(sale.discount) || 0;
    return sum + discount;
  }, 0);

  console.log("Total sales calculated:", totalSales);
  console.log("Total transactions:", totalTransactions);
  console.log("Average transaction value:", avgTransactionValue);

  // Export Daily Report to CSV (server-side)
  const handleExportDailyCSV = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      toast.promise(exportDailyReportCSV(today), {
        loading: "Generating CSV report...",
        success: "CSV report downloaded successfully!",
        error: "Failed to generate CSV report",
      });
    } catch (error) {
      console.error("Error exporting CSV:", error);
    }
  };

  const SortIcon = ({ field }: { field: keyof SaleRecord }) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    );
  };

  const handleEditSale = (sale: SaleRecord) => {
    setEditingSale(sale);
    setResecoAmount(sale.reseco?.toString() || "0");
  };

  const handleSaveReseco = () => {
    if (!editingSale) return;

    const reseco = parseFloat(resecoAmount) || 0;
    const originalTotal = editingSale.originalTotal || editingSale.total;
    const newTotal = Math.max(0, originalTotal - reseco);

    setSales(
      sales.map((sale) =>
        sale.id === editingSale.id
          ? { ...sale, reseco, originalTotal, total: newTotal }
          : sale,
      ),
    );

    // Update the sale in the database
    updateSale(editingSale.id, { reseco, total: newTotal })
      .then(() => toast.success("Reseco updated successfully"))
      .catch((error) => {
        console.error("Error updating reseco:", error);
        toast.error("Failed to update reseco");
      });

    setEditingSale(null);
    setResecoAmount("0");
  };

  const handleCancelEdit = () => {
    setEditingSale(null);
    setResecoAmount("0");
  };

  const handlePrintReceipt = (sale: SaleRecord) => {
    // Generate receipt content
    const now = new Date(`${sale.date} ${sale.time}`);
    let receipt = "========================================\n";
    receipt += "       LZT MEAT PRODUCTS\n";
    receipt += "========================================\n";
    receipt += `Date: ${new Date(sale.date).toLocaleDateString()}\n`;
    receipt += `Time: ${sale.time}\n`;
    receipt += `Transaction #: ${sale.transactionId}\n`;
    receipt += `Store: ${sale.store}\n`;
    receipt += `Cashier: ${sale.cashier}\n`;
    if (sale.customer && sale.customer !== "Walk-in Customer") {
      receipt += `Customer: ${sale.customer}\n`;
    }
    receipt += "========================================\n\n";

    receipt += `Items Purchased: ${sale.items}\n`;
    receipt += "(See transaction details for item breakdown)\n\n";

    receipt += "----------------------------------------\n";
    receipt += `Subtotal: ₱${(Number(sale.subtotal) || 0).toFixed(2)}\n`;
    if (Number(sale.discount || 0) > 0) {
      receipt += `Discount: -₱${(Number(sale.discount) || 0).toFixed(2)}\n`;
    }
    if (sale.reseco && Number(sale.reseco) > 0) {
      receipt += `Reseco: -₱${(Number(sale.reseco) || 0).toFixed(2)}\n`;
    }
    receipt += `Tax (8%): ₱${(Number(sale.tax) || 0).toFixed(2)}\n`;
    receipt += "----------------------------------------\n";
    receipt += `TOTAL: ₱${(Number(sale.total) || 0).toFixed(2)}\n`;
    receipt += "========================================\n";
    receipt += `Payment Method: ${sale.paymentMethod}\n`;
    receipt += "========================================\n\n";
    receipt += "     Thank you for your business!\n";
    receipt += "       Please come again!\n";
    receipt += "========================================\n";

    // Create a print window
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Receipt - ${sale.transactionId}</title>
          <style>
            @media print {
              body {
                margin: 0;
                padding: 20px;
              }
              @page {
                margin: 0;
              }
            }
            body {
              font-family: 'Courier New', monospace;
              font-size: 12px;
              line-height: 1.4;
              max-width: 300px;
              margin: 0 auto;
              padding: 20px;
            }
            pre {
              margin: 0;
              white-space: pre-wrap;
              word-wrap: break-word;
            }
            .print-button {
              display: block;
              margin: 20px auto;
              padding: 10px 20px;
              background: #dc2626;
              color: white;
              border: none;
              border-radius: 5px;
              cursor: pointer;
              font-size: 14px;
            }
            .print-button:hover {
              background: #b91c1c;
            }
            @media print {
              .print-button {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <pre>${receipt}</pre>
          <button class="print-button" onclick="window.print()">🖨️ Print Receipt</button>
        </body>
        </html>
      `);
      printWindow.document.close();

      // Auto-focus and optionally auto-print
      printWindow.focus();

      // Uncomment the next line if you want automatic print dialog
      // setTimeout(() => printWindow.print(), 250);
    } else {
      // Fallback if popup is blocked
      alert(receipt);
      toast.error("Pop-up blocked. Please allow pop-ups to print receipts.");
    }

    toast.success("Receipt opened in new window");
  };

  return (
    <div className="h-full overflow-auto bg-muted/30">
      {loading ? (
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <RefreshCw className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">
              Loading sales data...
            </p>
          </div>
        </div>
      ) : (
        <div className="container mx-auto p-4 lg:p-6 space-y-4 lg:space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl lg:text-3xl font-semibold mb-1">
                Sales History
              </h1>
              <p className="text-sm text-muted-foreground">
                View all sales transactions from every store
              </p>
            </div>
            <button
              onClick={loadSalesData}
              className="flex items-center gap-2 bg-card border border-border px-4 py-2 rounded-lg hover:bg-muted transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>

          {/* Header Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
            <div className="bg-card rounded-lg p-4 lg:p-6 border border-border">
              <div className="flex items-center justify-between mb-3">
                <div className="bg-green-100 p-2 lg:p-3 rounded-lg">
                  <DollarSign className="w-5 h-5 lg:w-6 lg:h-6 text-green-600" />
                </div>
              </div>
              <p className="text-2xl lg:text-3xl text-green-600 mb-1">
                ₱{(Number(totalSales) || 0).toFixed(2)}
              </p>
              <p className="text-xs lg:text-sm text-muted-foreground">
                Total Sales
              </p>
            </div>

            <div className="bg-card rounded-lg p-4 lg:p-6 border border-border">
              <div className="flex items-center justify-between mb-3">
                <div className="bg-blue-100 p-2 lg:p-3 rounded-lg">
                  <TrendingUp className="w-5 h-5 lg:w-6 lg:h-6 text-blue-600" />
                </div>
              </div>
              <p className="text-2xl lg:text-3xl text-blue-600 mb-1">
                {totalTransactions}
              </p>
              <p className="text-xs lg:text-sm text-muted-foreground">
                Transactions
              </p>
            </div>

            <div className="bg-card rounded-lg p-4 lg:p-6 border border-border">
              <div className="flex items-center justify-between mb-3">
                <div className="bg-purple-100 p-2 lg:p-3 rounded-lg">
                  <DollarSign className="w-5 h-5 lg:w-6 lg:h-6 text-purple-600" />
                </div>
              </div>
              <p className="text-2xl lg:text-3xl text-purple-600 mb-1">
                ₱{(Number(avgTransactionValue) || 0).toFixed(2)}
              </p>
              <p className="text-xs lg:text-sm text-muted-foreground">
                Avg Transaction
              </p>
            </div>

            <div className="bg-card rounded-lg p-4 lg:p-6 border border-border">
              <div className="flex items-center justify-between mb-3">
                <div className="bg-orange-100 p-2 lg:p-3 rounded-lg">
                  <DollarSign className="w-5 h-5 lg:w-6 lg:h-6 text-orange-600" />
                </div>
              </div>
              <p className="text-2xl lg:text-3xl text-orange-600 mb-1">
                ₱{(Number(totalDiscount) || 0).toFixed(2)}
              </p>
              <p className="text-xs lg:text-sm text-muted-foreground">
                Total Discount
              </p>
            </div>
          </div>

          {/* Filters and Actions */}
          <div className="bg-card rounded-lg p-4 lg:p-6 border border-border space-y-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by transaction ID, customer, or cashier..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Filter by:
                </span>
              </div>
              <select
                value={selectedStore}
                onChange={(e) => setSelectedStore(e.target.value)}
                className="px-3 py-1.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              >
                {storesList.map((store) => (
                  <option key={store} value={store}>
                    {store}
                  </option>
                ))}
              </select>
              <select
                value={selectedPayment}
                onChange={(e) => setSelectedPayment(e.target.value)}
                className="px-3 py-1.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              >
                {paymentMethods.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-1.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Sales Table */}
          <div className="bg-card rounded-lg border border-border">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th
                      onClick={() => handleSort("transactionId")}
                      className="text-left py-3 px-4 text-sm cursor-pointer hover:bg-muted/70"
                    >
                      <div className="flex items-center gap-1">
                        Transaction ID
                        <SortIcon field="transactionId" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort("date")}
                      className="text-left py-3 px-4 text-sm cursor-pointer hover:bg-muted/70"
                    >
                      <div className="flex items-center gap-1">
                        Date & Time
                        <SortIcon field="date" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort("store")}
                      className="text-left py-3 px-4 text-sm cursor-pointer hover:bg-muted/70"
                    >
                      <div className="flex items-center gap-1">
                        Store Name
                        <SortIcon field="store" />
                      </div>
                    </th>
                    <th className="text-left py-3 px-4 text-sm">Customer</th>
                    <th className="text-left py-3 px-4 text-sm">Cashier</th>
                    <th className="text-right py-3 px-4 text-sm">Items</th>
                    <th
                      onClick={() => handleSort("total")}
                      className="text-right py-3 px-4 text-sm cursor-pointer hover:bg-muted/70"
                    >
                      <div className="flex items-center justify-end gap-1">
                        Total
                        <SortIcon field="total" />
                      </div>
                    </th>
                    <th className="text-left py-3 px-4 text-sm">Payment</th>
                    <th className="text-left py-3 px-4 text-sm">Status</th>
                    <th className="text-left py-3 px-4 text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedSales.map((sale) => (
                    <tr
                      key={sale.id}
                      className="border-b border-border hover:bg-muted/50"
                    >
                      <td className="py-3 px-4 text-sm font-mono">
                        {sale.transactionId}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <div>
                          <p>{new Date(sale.date).toLocaleDateString()}</p>
                          <p className="text-xs text-muted-foreground">
                            {sale.time}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs">
                          {sale.store}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm">{sale.customer}</td>
                      <td className="py-3 px-4 text-left text-sm">
                        {sale.cashier}
                      </td>
                      <td className="py-3 px-4 text-right text-sm">
                        {sale.items}
                      </td>
                      <td className="py-3 px-4 text-right text-sm">
                        <div>
                          <p className="text-primary font-medium">
                            ₱{(Number(sale.total) || 0).toFixed(2)}
                          </p>
                          {Number(sale.discount || 0) > 0 && (
                            <p className="text-xs text-green-600">
                              Disc: -₱{(Number(sale.discount) || 0).toFixed(2)}
                            </p>
                          )}
                          {sale.reseco && Number(sale.reseco) > 0 && (
                            <p className="text-xs text-orange-600">
                              Reseco: -₱{(Number(sale.reseco) || 0).toFixed(2)}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {sale.paymentMethod}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            sale.status === "Completed"
                              ? "bg-green-100 text-green-700"
                              : sale.status === "Refunded"
                                ? "bg-red-100 text-red-700"
                                : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {sale.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1">
                          <button
                            onClick={() => setSelectedSale(sale)}
                            className="p-1.5 hover:bg-accent rounded"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditSale(sale)}
                            className="p-1.5 hover:bg-accent rounded"
                            title="Edit Reseco"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {sortedSales.length === 0 && (
              <div className="py-12 text-center text-muted-foreground">
                <p>No sales records found</p>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Sale Details Modal */}
      {selectedSale && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2>Transaction Details</h2>
              <button
                onClick={() => setSelectedSale(null)}
                className="p-2 hover:bg-accent rounded"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Transaction ID
                  </p>
                  <p className="font-mono">{selectedSale.transactionId}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Status</p>
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      selectedSale.status === "Completed"
                        ? "bg-green-100 text-green-700"
                        : selectedSale.status === "Refunded"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {selectedSale.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Date & Time
                  </p>
                  <p>
                    {new Date(selectedSale.date).toLocaleDateString()}{" "}
                    {selectedSale.time}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Store</p>
                  <p>{selectedSale.store}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Customer</p>
                  <p>{selectedSale.customer}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Cashier</p>
                  <p>{selectedSale.cashier}</p>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <h3 className="mb-3">Payment Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Items ({selectedSale.items})
                    </span>
                    <span>
                      ₱{(Number(selectedSale.subtotal) || 0).toFixed(2)}
                    </span>
                  </div>
                  {Number(selectedSale.discount || 0) > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>
                        -₱{(Number(selectedSale.discount) || 0).toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax (8%)</span>
                    <span>₱{(Number(selectedSale.tax) || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-border">
                    <span className="font-medium">Total</span>
                    <span className="text-xl text-primary font-medium">
                      ₱{(Number(selectedSale.total) || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="text-muted-foreground">
                      Payment Method
                    </span>
                    <span>{selectedSale.paymentMethod}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => setSelectedSale(null)}
                  className="flex-1 border border-border py-2 rounded-lg hover:bg-accent transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => handlePrintReceipt(selectedSale)}
                  className="flex-1 bg-primary text-primary-foreground py-2 rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Print Receipt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Reseco Modal */}
      {editingSale && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2>Edit Reseco Deduction</h2>
              <button
                onClick={handleCancelEdit}
                className="p-2 hover:bg-accent rounded"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Transaction ID
                </p>
                <p className="font-mono">{editingSale.transactionId}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Customer</p>
                <p>{editingSale.customer}</p>
              </div>

              <div className="border-t border-border pt-4">
                <h3 className="mb-3">Amount Calculation</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Original Total
                    </span>
                    <span>
                      ₱
                      {(
                        Number(
                          editingSale.originalTotal || editingSale.total,
                        ) || 0
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm mb-2">Reseco Amount ($)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={resecoAmount}
                  onChange={(e) => setResecoAmount(e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter reseco amount"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  This amount will be deducted from the sale total
                </p>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">New Total</span>
                  <span className="text-2xl text-primary font-medium">
                    ₱
                    {Math.max(
                      0,
                      (Number(editingSale.originalTotal || editingSale.total) ||
                        0) - parseFloat(resecoAmount || "0"),
                    ).toFixed(2)}
                  </span>
                </div>
                {parseFloat(resecoAmount || "0") > 0 && (
                  <p className="text-xs text-orange-600 mt-2">
                    Reseco deduction: -₱
                    {parseFloat(resecoAmount || "0").toFixed(2)}
                  </p>
                )}
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  onClick={handleCancelEdit}
                  className="flex-1 border border-border py-2 rounded-lg hover:bg-accent transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveReseco}
                  className="flex-1 bg-primary text-primary-foreground py-2 rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Save Reseco
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
