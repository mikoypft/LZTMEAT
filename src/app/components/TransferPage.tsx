import { useState, useEffect } from "react";
import {
  ArrowRightLeft,
  CheckCircle,
  Clock,
  XCircle,
  Plus,
  Package,
  RefreshCw,
} from "lucide-react";
import {
  getStores,
  type StoreLocation,
  getProducts,
  getTransfers,
  createTransfer,
  updateTransferStatus,
  type Product,
  type TransferRequest,
} from "@/utils/api";
import { toast } from "sonner";

interface Transfer {
  id: string;
  productName: string;
  sku: string;
  quantity: number;
  unit: string;
  from: string;
  to: string;
  date: string;
  time: string;
  status: "pending" | "in-transit" | "completed" | "cancelled" | "rejected";
  transferredBy: string;
}

const PRODUCTS: Product[] = [
  { name: "Longanisa (Sweet)", sku: "SAU-001", unit: "KG" },
  { name: "Longanisa (Spicy)", sku: "SAU-002", unit: "KG" },
  { name: "Tocino (Pork)", sku: "CUR-001", unit: "KG" },
  { name: "Tapa (Beef)", sku: "CUR-002", unit: "KG" },
  { name: "Chorizo de Bilbao", sku: "SAU-003", unit: "KG" },
  { name: "Shanghai (Spring Rolls)", sku: "RTC-001", unit: "KG" },
  { name: "Embutido (Meatloaf)", sku: "PRO-001", unit: "KG" },
  { name: "Filipino Hotdog", sku: "SAU-004", unit: "KG" },
  { name: "Ham (Sliced)", sku: "PRO-002", unit: "KG" },
  { name: "Bacon (Smoked)", sku: "PRO-003", unit: "KG" },
  { name: "Ground Pork", sku: "GRD-001", unit: "KG" },
  { name: "Ground Beef", sku: "GRD-002", unit: "KG" },
];

const LOCATIONS: StoreLocation[] = [
  "Production Facility",
  "Store 1",
  "Store 2",
  "Store 3",
];

export function TransferPage() {
  const [transfers, setTransfers] = useState<TransferRequest[]>([]);
  const [stores, setStores] = useState<StoreLocation[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTransfer, setNewTransfer] = useState({
    productId: "",
    quantity: "",
    from: "",
    to: "",
    requestedBy: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [transfersData, storesData, productsData] = await Promise.all([
        getTransfers(),
        getStores(),
        getProducts(),
      ]);
      setTransfers(transfersData);
      setStores(storesData.filter((s) => s.status === "active")); // Only show active stores
      setProducts(productsData);

      // Set default locations if stores exist
      if (storesData.length > 0) {
        const mainStore = storesData.find((s) => s.name === "Main Store");
        const firstOtherStore = storesData.find((s) => s.name !== "Main Store");
        setNewTransfer((prev) => ({
          ...prev,
          from: mainStore?.name || storesData[0].name,
          to: firstOtherStore?.name || storesData[1]?.name || "",
        }));
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransfer = async () => {
    if (
      !newTransfer.productId ||
      !newTransfer.quantity ||
      !newTransfer.requestedBy
    ) {
      alert("Please fill in all fields");
      return;
    }

    if (newTransfer.from === newTransfer.to) {
      alert("Source and destination must be different");
      return;
    }

    const product = products.find(
      (p) => p.id === Number(newTransfer.productId),
    );
    if (!product) {
      alert("Product not found");
      return;
    }

    const transferData = {
      productId: Number(newTransfer.productId),
      quantity: parseFloat(newTransfer.quantity),
      from: newTransfer.from,
      to: newTransfer.to,
      transferredBy: newTransfer.requestedBy,
    };

    try {
      const createdTransfer = await createTransfer(transferData);
      setTransfers([createdTransfer, ...transfers]);
      setNewTransfer({
        productId: "",
        quantity: "",
        from: "",
        to: "",
        requestedBy: "",
      });
      setShowAddForm(false);
      toast.success("Transfer created successfully");
    } catch (error) {
      console.error("Transfer error:", error);
      toast.error("Failed to create transfer");
    }
  };

  const updateStatus = async (id: string, status: Transfer["status"]) => {
    try {
      await updateTransferStatus(id, status);
      setTransfers(transfers.map((t) => (t.id === id ? { ...t, status } : t)));
      toast.success("Transfer status updated successfully");
    } catch (error) {
      toast.error("Failed to update transfer status");
    }
  };

  const getStatusIcon = (status: Transfer["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "in-transit":
        return <Clock className="w-5 h-5 text-blue-600" />;
      case "cancelled":
        return <XCircle className="w-5 h-5 text-red-600" />;
      case "rejected":
        return <XCircle className="w-5 h-5 text-orange-600" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: Transfer["status"]) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700";
      case "in-transit":
        return "bg-blue-100 text-blue-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      case "rejected":
        return "bg-orange-100 text-orange-700";
      default:
        return "bg-yellow-100 text-yellow-700";
    }
  };

  const pendingCount = transfers.filter((t) => t.status === "pending").length;
  const inTransitCount = transfers.filter(
    (t) => t.status === "in-transit",
  ).length;
  const today = new Date().toISOString().split("T")[0];
  const completedToday = transfers.filter(
    (t) => t.status === "completed" && t.date === today,
  ).length;

  return (
    <div className="h-full overflow-auto bg-muted/30">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-card rounded-lg p-6 border border-border">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-primary/10 p-3 rounded-lg">
                <ArrowRightLeft className="w-6 h-6 text-primary" />
              </div>
            </div>
            <p className="text-3xl text-primary mb-1">{transfers.length}</p>
            <p className="text-sm text-muted-foreground">Total Transfers</p>
          </div>

          <div className="bg-card rounded-lg p-6 border border-border">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-yellow-100 p-3 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <p className="text-3xl text-yellow-600 mb-1">{pendingCount}</p>
            <p className="text-sm text-muted-foreground">Pending</p>
          </div>

          <div className="bg-card rounded-lg p-6 border border-border">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-3xl text-blue-600 mb-1">{inTransitCount}</p>
            <p className="text-sm text-muted-foreground">In Transit</p>
          </div>

          <div className="bg-card rounded-lg p-6 border border-border">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-green-100 p-3 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-3xl text-green-600 mb-1">{completedToday}</p>
            <p className="text-sm text-muted-foreground">Completed Today</p>
          </div>
        </div>

        {/* Create New Transfer */}
        <div className="bg-card rounded-lg border border-border">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ArrowRightLeft className="w-6 h-6 text-primary" />
              <h2>Transfer Management</h2>
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-5 h-5" />
              New Transfer
            </button>
          </div>

          {showAddForm && (
            <div className="p-6 bg-secondary/50 border-b border-border">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm mb-2">Product</label>
                  <select
                    value={newTransfer.productId}
                    onChange={(e) =>
                      setNewTransfer({
                        ...newTransfer,
                        productId: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Select Product</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} ({product.sku})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-2">Quantity</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newTransfer.quantity}
                    onChange={(e) =>
                      setNewTransfer({
                        ...newTransfer,
                        quantity: e.target.value,
                      })
                    }
                    placeholder="0.0"
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2">From</label>
                  <select
                    value={newTransfer.from}
                    onChange={(e) =>
                      setNewTransfer({ ...newTransfer, from: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="Production Facility">
                      Production Facility
                    </option>
                    {stores.map((location) => (
                      <option key={location.name} value={location.name}>
                        {location.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-2">To</label>
                  <select
                    value={newTransfer.to}
                    onChange={(e) =>
                      setNewTransfer({ ...newTransfer, to: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="Production Facility">
                      Production Facility
                    </option>
                    {stores.map((location) => (
                      <option key={location.name} value={location.name}>
                        {location.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-2">Transferred By</label>
                  <input
                    type="text"
                    value={newTransfer.requestedBy}
                    onChange={(e) =>
                      setNewTransfer({
                        ...newTransfer,
                        requestedBy: e.target.value,
                      })
                    }
                    placeholder="Enter name"
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              <div className="mt-4 flex gap-2 justify-end">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddTransfer}
                  className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Create Transfer
                </button>
              </div>
            </div>
          )}

          {/* Transfers List */}
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4">Product</th>
                    <th className="text-left py-3 px-4">SKU</th>
                    <th className="text-right py-3 px-4">Quantity</th>
                    <th className="text-left py-3 px-4">From</th>
                    <th className="text-center py-3 px-4"></th>
                    <th className="text-left py-3 px-4">To</th>
                    <th className="text-left py-3 px-4">Date & Time</th>
                    <th className="text-left py-3 px-4">Transferred By</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transfers.map((transfer) => (
                    <tr
                      key={transfer.id}
                      className="border-b border-border hover:bg-muted/50"
                    >
                      <td className="py-3 px-4">{transfer.productName}</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {transfer.sku}
                      </td>
                      <td className="py-3 px-4 text-right text-primary">
                        {transfer.quantity} {transfer.unit}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                          {transfer.from}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <ArrowRightLeft className="w-4 h-4 text-muted-foreground mx-auto" />
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm">
                          {transfer.to}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {transfer.date} {transfer.time}
                      </td>
                      <td className="py-3 px-4">{transfer.transferredBy}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(transfer.status)}
                          <span
                            className={`px-3 py-1 rounded-full text-xs ${getStatusColor(transfer.status)}`}
                          >
                            {transfer.status.charAt(0).toUpperCase() +
                              transfer.status.slice(1)}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={transfer.status}
                          onChange={(e) =>
                            updateStatus(
                              transfer.id,
                              e.target.value as Transfer["status"],
                            )
                          }
                          className="px-2 py-1 bg-background border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          <option value="pending">Pending</option>
                          <option value="in-transit">In Transit</option>
                          <option value="completed">Completed</option>
                          <option value="rejected">Rejected</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-card rounded-lg p-6 border border-border">
            <h3 className="mb-4">Recent Transfers to Stores</h3>
            <div className="space-y-3">
              {transfers
                .filter((t) => t.to !== "Production Facility")
                .slice(0, 3)
                .map((transfer) => (
                  <div
                    key={transfer.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{transfer.productName}</p>
                      <p className="text-sm text-muted-foreground">
                        {transfer.from} → {transfer.to}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-primary">
                        {transfer.quantity} {transfer.unit}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {transfer.time}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className="bg-card rounded-lg p-6 border border-border">
            <h3 className="mb-4">Transfer Summary</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Completed</span>
                </div>
                <span className="text-xl text-green-600">
                  {transfers.filter((t) => t.status === "completed").length}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <span>In Transit</span>
                </div>
                <span className="text-xl text-blue-600">{inTransitCount}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-yellow-600" />
                  <span>Pending</span>
                </div>
                <span className="text-xl text-yellow-600">{pendingCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
