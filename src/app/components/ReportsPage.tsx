import { useState, useEffect } from "react";
import { Download, FileText, Calendar } from "lucide-react";
import {
  exportDailyReportPDF,
  exportDailyReportCSV,
  getStores,
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
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [loadingCsv, setLoadingCsv] = useState(false);
  const [stores, setStores] = useState<StoreLocation[]>([]);

  // Load stores on component mount
  useEffect(() => {
    const loadStores = async () => {
      try {
        const storesData = await getStores();
        setStores(storesData);
      } catch (error) {
        console.error("Error loading stores:", error);
        toast.error("Failed to load stores");
      }
    };
    loadStores();
  }, []);

  // Export to PDF
  const handleExportPDF = async () => {
    try {
      setLoadingPdf(true);
      toast.promise(
        exportDailyReportPDF(selectedDate, selectedStore || undefined, currentUser?.fullName || currentUser?.username || 'Unknown'),
        {
          loading: "Generating PDF report...",
          success: "PDF report downloaded successfully!",
          error: "Failed to generate PDF report",
        },
      );
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast.error("Failed to generate PDF report");
    } finally {
      setLoadingPdf(false);
    }
  };

  // Export to CSV
  const handleExportCSV = async () => {
    try {
      setLoadingCsv(true);
      toast.promise(
        exportDailyReportCSV(selectedDate, selectedStore || undefined),
        {
          loading: "Generating CSV report...",
          success: "CSV report downloaded successfully!",
          error: "Failed to generate CSV report",
        },
      );
    } catch (error) {
      console.error("Error exporting CSV:", error);
      toast.error("Failed to generate CSV report");
    } finally {
      setLoadingCsv(false);
    }
  };

  return (
    <div className="h-full overflow-auto bg-muted/30">
      <div className="container mx-auto p-4 lg:p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-semibold mb-1">Reports</h1>
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
          </div>

          {/* Export Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleExportPDF}
              disabled={loadingPdf || loadingCsv}
              className="w-full flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              <Download className="w-5 h-5" />
              {loadingPdf ? "Generating PDF..." : "Export as PDF"}
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
                  Detailed sales report with inventory movement and transactions
                  in professional PDF format
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

        {/* Report Format Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">Report Information</h3>
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
  );
}
