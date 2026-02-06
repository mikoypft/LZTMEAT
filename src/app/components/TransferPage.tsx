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
  receiveTransfer,
  getAllUsers,
  getInventory,
  type Product,
  type TransferRequest,
  type AllUser,
  type InventoryRecord,
} from "@/utils/api";
import { toast } from "sonner";

interface Transfer {
  id: string;
  productName: string;
  sku: string;
  quantity: number;
  quantityReceived?: number;
  discrepancy?: number;
  discrepancyReason?: string;
  unit: string;
  from: string;
  to: string;
  date: string;
  time: string;
  status: "pending" | "in-transit" | "completed" | "cancelled" | "rejected";
  transferredBy: string;
  receivedBy?: string;
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
  const [inventory, setInventory] = useState<InventoryRecord[]>([]);
  const [users, setUsers] = useState<AllUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [selectedTransfer, setSelectedTransfer] =
    useState<TransferRequest | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [receiveData, setReceiveData] = useState({
    quantityReceived: "",
    discrepancyReason: "",
    receivedBy: "",
  });
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
      const [transfersData, storesData, productsData, usersData, inventoryData] =
        await Promise.all([
          getTransfers(),
          getStores(),
          getProducts(),
          getAllUsers(),
          getInventory(),
        ]);
      // Sort transfers by createdAt in descending order (newest first)
      const sortedTransfers = transfersData.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      setTransfers(sortedTransfers);
      setStores(storesData.filter((s) => s.status === "active")); // Only show active stores
      
      // Combine products with inventory data for easier access
      const productsWithStock = productsData.map((product: Product) => {
        // For now, calculate total stock across all locations
        const invRecords = inventoryData.filter(
          (inv: InventoryRecord) => String(inv.productId) === String(product.id)
        );
        const totalStock = invRecords.reduce((sum, inv) => sum + (Number(inv.quantity) || 0), 0);
        return {
          ...product,
          stock: totalStock,
        };
      });
      
      // Also create a location-specific version for when "from" location is selected
      const createProductsForLocation = (location: string) => {
        return productsData.map((product: Product) => {
          const inv = inventoryData.find(
            (i: InventoryRecord) => String(i.productId) === String(product.id) && i.location === location
          );
          return {
            ...product,
            stock: inv ? Number(inv.quantity) || 0 : 0,
          };
        });
      };
      
      setProducts(productsWithStock);
      setInventory(inventoryData);
      setUsers(usersData);
      
      console.log("Products with stock loaded:", productsWithStock);
      console.log("Inventory data:", inventoryData);

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
      toast.error("Please fill in all fields");
      return;
    }

    if (newTransfer.from === newTransfer.to) {
      toast.error("Source and destination must be different");
      return;
    }

    const product = products.find(
      (p) => String(p.id) === String(newTransfer.productId),
    );
    if (!product) {
      toast.error("Product not found");
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
      console.log("Created transfer response:", createdTransfer);
      
      // Ensure the transfer has all required fields with defaults
      const transferWithDefaults = {
        ...createdTransfer,
        status: createdTransfer.status || "in-transit",
        date: createdTransfer.date || new Date().toISOString().split("T")[0],
        time: createdTransfer.time || new Date().toLocaleTimeString("en-US", { hour12: false }),
      };
      
      setTransfers([transferWithDefaults, ...transfers]);
      setCurrentPage(1);
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

  const handleReceiveTransfer = async () => {
    if (!selectedTransfer) return;

    if (!receiveData.quantityReceived || !receiveData.receivedBy) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const updatedTransfer = await receiveTransfer(
        selectedTransfer.id,
        parseFloat(receiveData.quantityReceived),
        receiveData.discrepancyReason || undefined,
        receiveData.receivedBy,
      );

      setTransfers(
        transfers.map((t) =>
          t.id === selectedTransfer.id ? updatedTransfer : t,
        ),
      );

      const discrepancy = updatedTransfer.discrepancy;
      if (discrepancy && discrepancy > 0) {
        toast.warning(
          `Transfer received with ${discrepancy} ${selectedTransfer.unit} discrepancy (${receiveData.discrepancyReason || "not specified"})`,
        );
      } else {
        toast.success("Transfer received successfully");
      }

      setShowReceiveModal(false);
      setSelectedTransfer(null);
      setReceiveData({
        quantityReceived: "",
        discrepancyReason: "",
        receivedBy: "",
      });
    } catch (error) {
      console.error("Receive error:", error);
      toast.error("Failed to receive transfer");
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

  const inTransitCount = transfers.filter(
    (t) => t.status === "in-transit",
  ).length;
  const today = new Date().toISOString().split("T")[0];
  const completedToday = transfers.filter(
    (t) => t.status === "completed" && t.date === today,
  ).length;

  // Pagination logic
  const itemsPerPage = 5;
  const totalPages = Math.ceil(transfers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTransfers = transfers.slice(startIndex, endIndex);

  return (
    <div className="h-full overflow-auto bg-muted/30">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                    {products && products.length > 0 ? (
                      products.map((product) => {
                        // Get stock for selected location if available, otherwise total
                        let stock = (product as any).stock || 0;
                        if (newTransfer.from) {
                          const locationSpecificStock = inventory.find(
                            (inv) => String(inv.productId) === String(product.id) && inv.location === newTransfer.from
                          );
                          stock = locationSpecificStock ? Number(locationSpecificStock.quantity) || 0 : 0;
                        }
                        const displayUnit = product.unit || "units";
                        return (
                          <option key={product.id} value={product.id}>
                            {product.name} - Stock: {stock} {displayUnit}
                          </option>
                        );
                      })
                    ) : (
                      <option disabled>No products available</option>
                    )}
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
                  <select
                    value={newTransfer.requestedBy}
                    onChange={(e) =>
                      setNewTransfer({
                        ...newTransfer,
                        requestedBy: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Select a user</option>
                    {users.map((user) => (
                      <option
                        key={user.id}
                        value={user.fullName || user.username}
                      >
                        {user.fullName || user.username}
                      </option>
                    ))}
                  </select>
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
                    <th className="text-right py-3 px-4">Qty Sent</th>
                    <th className="text-right py-3 px-4">Qty Received</th>
                    <th className="text-right py-3 px-4">Discrepancy</th>
                    <th className="text-left py-3 px-4">From</th>
                    <th className="text-center py-3 px-4"></th>
                    <th className="text-left py-3 px-4">To</th>
                    <th className="text-left py-3 px-4">Date & Time</th>
                    <th className="text-left py-3 px-4">Transferred By</th>
                    <th className="text-left py-3 px-4">Received By</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTransfers.map((transfer) => (
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
                      <td className="py-3 px-4 text-right">
                        {transfer.quantityReceived !== undefined &&
                        transfer.quantityReceived !== null ? (
                          <span className="text-green-600 font-medium">
                            {transfer.quantityReceived} {transfer.unit}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            -
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {transfer.discrepancy !== undefined &&
                        transfer.discrepancy !== null &&
                        transfer.discrepancy !== 0 ? (
                          <span className="text-orange-600 font-medium">
                            {transfer.discrepancy > 0 ? "-" : "+"}
                            {Math.abs(transfer.discrepancy)} {transfer.unit}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            -
                          </span>
                        )}
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
                        {transfer.receivedBy || "-"}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {transfer.status && getStatusIcon(transfer.status)}
                          <span
                            className={`px-3 py-1 rounded-full text-xs ${transfer.status ? getStatusColor(transfer.status) : "bg-gray-100 text-gray-700"}`}
                          >
                            {transfer.status 
                              ? transfer.status.charAt(0).toUpperCase() + transfer.status.slice(1)
                              : "Unknown"}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {transfer.status === "in-transit" ? (
                            <button
                              onClick={() => {
                                setSelectedTransfer(transfer);
                                setReceiveData({
                                  quantityReceived:
                                    transfer.quantity.toString(),
                                  discrepancyReason: "",
                                  receivedBy: "",
                                });
                                setShowReceiveModal(true);
                              }}
                              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                            >
                              Receive
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages} • Showing{" "}
                  {paginatedTransfers.length} of {transfers.length} transfers
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 border border-border rounded text-sm hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <div className="flex gap-1">
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <button
                        key={i + 1}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`px-3 py-2 rounded text-sm ${
                          currentPage === i + 1
                            ? "bg-primary text-primary-foreground"
                            : "border border-border hover:bg-muted"
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 border border-border rounded text-sm hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
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
            </div>
          </div>
        </div>

        {/* Receive Transfer Modal */}
        {showReceiveModal && selectedTransfer && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  Receive Transfer - {selectedTransfer.productName}
                </h2>
                <button
                  onClick={() => {
                    setShowReceiveModal(false);
                    setReceiveData({
                      quantityReceived: selectedTransfer.quantity,
                      discrepancyReason: "",
                      receivedBy: "",
                    });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleReceiveTransfer();
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Original Quantity Sent
                  </label>
                  <input
                    type="number"
                    value={selectedTransfer.quantity}
                    disabled
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-600"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Quantity sent from {selectedTransfer.fromLocation}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity Received *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={receiveData.quantityReceived}
                    onChange={(e) =>
                      setReceiveData({
                        ...receiveData,
                        quantityReceived: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  {receiveData.quantityReceived !==
                    selectedTransfer.quantity && (
                    <p className="text-xs text-orange-600 mt-1">
                      Discrepancy:{" "}
                      {(
                        selectedTransfer.quantity - receiveData.quantityReceived
                      ).toFixed(2)}{" "}
                      unit(s)
                    </p>
                  )}
                </div>

                {receiveData.quantityReceived < selectedTransfer.quantity && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reason for Discrepancy
                    </label>
                    <select
                      value={receiveData.discrepancyReason}
                      onChange={(e) =>
                        setReceiveData({
                          ...receiveData,
                          discrepancyReason: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select a reason</option>
                      <option value="damaged">Damaged</option>
                      <option value="evaporation">
                        Evaporation/Weight Loss
                      </option>
                      <option value="measurement-error">
                        Measurement Error
                      </option>
                      <option value="theft">Missing/Stolen</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Received By (Name) *
                  </label>
                  <select
                    value={receiveData.receivedBy}
                    onChange={(e) =>
                      setReceiveData({
                        ...receiveData,
                        receivedBy: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select a user</option>
                    {users.map((user) => (
                      <option
                        key={user.id}
                        value={user.fullName || user.username}
                      >
                        {user.fullName || user.username}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowReceiveModal(false);
                      setReceiveData({
                        quantityReceived: selectedTransfer.quantity,
                        discrepancyReason: "",
                        receivedBy: "",
                      });
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
                  >
                    Confirm Receipt
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
