import { useState, useEffect, useContext } from "react";
import {
  Factory,
  TrendingUp,
  Package,
  Clock,
  Save,
  Plus,
  ChefHat,
  X,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { IngredientsContext } from "@/app/context/IngredientsContext";
import {
  getProducts,
  getProductionRecords,
  createProductionRecord,
  updateProductionRecordStatus,
  deleteProductionRecord,
  getEmployees,
  getProductDefaultIngredients,
  type Product as APIProduct,
  type ProductionRecord as APIProductionRecord,
  type Employee,
} from "@/utils/api";
import { toast } from "sonner";

interface ProductionEntry {
  id: string;
  productName: string;
  weightKg: number;
  date: string;
  time: string;
  batchNumber: string;
  status: "in-progress" | "completed" | "quality-check";
  ingredientsUsed: Array<{
    code: string;
    name: string;
    quantity: number;
    unit: string;
  }>;
}

const MOCK_PRODUCTION_DATA: ProductionEntry[] = [
  {
    id: "1",
    productName: "Longanisa (Sweet)",
    weightKg: 125.5,
    date: "2026-01-13",
    time: "08:00",
    batchNumber: "B001",
    status: "completed",
    ingredientsUsed: [],
  },
  {
    id: "2",
    productName: "Tocino (Pork)",
    weightKg: 85.3,
    date: "2026-01-13",
    time: "09:30",
    batchNumber: "B002",
    status: "completed",
    ingredientsUsed: [],
  },
  {
    id: "3",
    productName: "Shanghai (Spring Rolls)",
    weightKg: 95.0,
    date: "2026-01-13",
    time: "10:15",
    batchNumber: "B003",
    status: "in-progress",
    ingredientsUsed: [],
  },
  {
    id: "4",
    productName: "Chorizo de Bilbao",
    weightKg: 72.0,
    date: "2026-01-13",
    time: "11:45",
    batchNumber: "B004",
    status: "completed",
    ingredientsUsed: [],
  },
];

const DAILY_PRODUCTION_CHART = [
  { day: "Mon", weight: 420 },
  { day: "Tue", weight: 380 },
  { day: "Wed", weight: 450 },
  { day: "Thu", weight: 520 },
  { day: "Fri", weight: 480 },
  { day: "Sat", weight: 350 },
  { day: "Sun", weight: 280 },
];

const PRODUCT_DISTRIBUTION = [
  { name: "Coffee Beans", value: 35 },
  { name: "Tea", value: 25 },
  { name: "Bakery", value: 20 },
  { name: "Dairy", value: 20 },
];

const COLORS = [
  "#dc2626",
  "#ef4444",
  "#f87171",
  "#fca5a5",
  "#fb923c",
  "#fbbf24",
  "#a3e635",
  "#4ade80",
];

interface IngredientInput {
  code: string;
  quantity: string;
}

export function ProductionDashboard() {
  const context = useContext(IngredientsContext);

  // Safety check - shouldn't be needed but helps with hot reload issues
  if (!context) {
    return (
      <div className="h-full flex items-center justify-center">
        <p>Loading ingredients...</p>
      </div>
    );
  }

  const { ingredients, deductIngredient, refreshIngredients } = context;
  const [productions, setProductions] = useState<ProductionEntry[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProduction, setNewProduction] = useState({
    productName: "",
    productId: "",
    weightKg: "",
    batchNumber: "",
    employeeName: "",
  });
  const [selectedIngredients, setSelectedIngredients] = useState<
    IngredientInput[]
  >([]);
  const [products, setProducts] = useState<APIProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    show: boolean;
    productionId?: string;
  }>({ show: false });
  const [completionConfirmation, setCompletionConfirmation] = useState<{
    show: boolean;
    production?: ProductionEntry;
    actualWeight?: string;
    additionalIngredients?: IngredientInput[];
  }>({ show: false });

  // Load products and production records from database on mount
  useEffect(() => {
    loadProducts();
    loadProductionRecords();
    loadEmployees();
  }, []);

  // Auto-generate batch number when form is shown
  useEffect(() => {
    if (showAddForm && productions.length > 0) {
      // Find the highest batch number
      const batchNumbers = productions
        .map((p) => {
          const match = p.batchNumber.match(/^B(\d+)$/);
          return match ? parseInt(match[1], 10) : 0;
        })
        .filter((num) => !isNaN(num));

      const maxBatchNum =
        batchNumbers.length > 0 ? Math.max(...batchNumbers) : 0;
      const nextBatchNum = maxBatchNum + 1;
      const nextBatchNumber = `B${String(nextBatchNum).padStart(3, "0")}`;

      setNewProduction((prev) => ({ ...prev, batchNumber: nextBatchNumber }));
    } else if (showAddForm && productions.length === 0) {
      // First production record
      setNewProduction((prev) => ({ ...prev, batchNumber: "B001" }));
    }
  }, [showAddForm, productions]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const productsData = await getProducts();
      setProducts(productsData);
    } catch (error) {
      console.error("Error loading products:", error);
      toast.error("Failed to load products from inventory");
    } finally {
      setLoading(false);
    }
  };

  const loadProductionRecords = async () => {
    try {
      const records = await getProductionRecords();
      // Transform API records to local format
      const transformedRecords: ProductionEntry[] = records.map(
        (record: any) => {
          const date = new Date(record.timestamp);
          return {
            id: record.id,
            productName: record.productName,
            weightKg: record.quantity,
            date: date.toISOString().split("T")[0],
            time: date.toTimeString().split(" ")[0].substring(0, 5),
            batchNumber: record.batchNumber,
            status: record.status || "completed",
            ingredientsUsed:
              record.initialIngredients &&
              Array.isArray(record.initialIngredients)
                ? record.initialIngredients.map((ing: any) => ({
                    code: ing.ingredientId || ing.code || "",
                    name: ing.ingredientName || ing.name || "",
                    quantity: ing.quantity || 0,
                    unit: ing.unit || "kg",
                  }))
                : [],
          };
        },
      );
      setProductions(transformedRecords);
    } catch (error) {
      console.error("Error loading production records:", error);
      toast.error("Failed to load production history");
    }
  };

  const loadEmployees = async () => {
    try {
      const employeesData = await getEmployees();
      setEmployees(employeesData);
    } catch (error) {
      console.error("Error loading employees:", error);
      toast.error("Failed to load employees");
    }
  };

  // Calculate today's date
  const today = new Date().toISOString().split("T")[0];

  // Calculate total produced today (only today's production)
  const totalProducedToday =
    productions
      .filter((p) => p.date === today)
      .reduce((sum, p) => sum + (Number(p.weightKg) || 0), 0) || 0;
  const inProgressCount = productions.filter(
    (p) => p.status === "in-progress",
  ).length;
  const completedCount = productions.filter(
    (p) => p.status === "completed",
  ).length;

  // Calculate weekly production data (last 7 days)
  const getWeeklyProductionData = () => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const today = new Date();
    const weekData = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const dayName = days[date.getDay()];

      const dayProduction = productions
        .filter((p) => p.date === dateStr)
        .reduce((sum, p) => sum + p.weightKg, 0);

      weekData.push({
        day: dayName,
        weight: Math.round(dayProduction * 10) / 10, // Round to 1 decimal
      });
    }

    return weekData;
  };

  // Calculate vs last week percentage
  const calculateVsLastWeek = () => {
    const today = new Date();

    // Calculate this week's production (last 7 days)
    let thisWeekTotal = 0;
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      thisWeekTotal += productions
        .filter((p) => p.date === dateStr)
        .reduce((sum, p) => sum + p.weightKg, 0);
    }

    // Calculate last week's production (days 7-13 ago)
    let lastWeekTotal = 0;
    for (let i = 7; i < 14; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      lastWeekTotal += productions
        .filter((p) => p.date === dateStr)
        .reduce((sum, p) => sum + p.weightKg, 0);
    }

    // Calculate percentage change
    if (lastWeekTotal === 0) {
      // If last week had no production
      if (thisWeekTotal > 0) {
        return { value: 100, isPositive: true }; // 100% increase from 0
      }
      return { value: 0, isPositive: true }; // No change
    }

    const percentChange =
      ((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100;
    return {
      value: Math.round(percentChange * 10) / 10, // Round to 1 decimal
      isPositive: percentChange >= 0,
    };
  };

  // Calculate product distribution data
  const getProductDistribution = () => {
    const productTotals: { [key: string]: number } = {};

    // Sum up production quantities by product
    productions.forEach((prod) => {
      if (productTotals[prod.productName]) {
        productTotals[prod.productName] += prod.weightKg;
      } else {
        productTotals[prod.productName] = prod.weightKg;
      }
    });

    // Calculate total
    const total = Object.values(productTotals).reduce(
      (sum, val) => sum + val,
      0,
    );

    // Convert to percentages and format for chart
    if (total === 0) {
      return [{ name: "No Production Data", value: 100 }];
    }

    return Object.entries(productTotals)
      .map(([name, value]) => ({
        name,
        value: Math.round((value / total) * 100 * 10) / 10, // Round to 1 decimal
      }))
      .sort((a, b) => b.value - a.value) // Sort by value descending
      .slice(0, 8); // Show top 8 products
  };

  const weeklyProductionData = getWeeklyProductionData();
  const productDistributionData = getProductDistribution();
  const vsLastWeek = calculateVsLastWeek();

  const addIngredientRow = () => {
    setSelectedIngredients([
      ...selectedIngredients,
      { code: "", quantity: "" },
    ]);
  };

  const removeIngredientRow = (index: number) => {
    setSelectedIngredients(selectedIngredients.filter((_, i) => i !== index));
  };

  const updateIngredient = (
    index: number,
    field: "code" | "quantity",
    value: string,
  ) => {
    const updated = [...selectedIngredients];
    updated[index] = { ...updated[index], [field]: value };
    setSelectedIngredients(updated);
  };

  const handleAddProduction = async () => {
    if (!newProduction.productName || newProduction.productName.trim() === "") {
      toast.error("Please select a product name");
      return;
    }

    if (!newProduction.weightKg || parseFloat(newProduction.weightKg) <= 0) {
      toast.error("Please enter a valid weight (KG)");
      return;
    }

    if (!newProduction.batchNumber || newProduction.batchNumber.trim() === "") {
      toast.error("Please ensure batch number is generated");
      return;
    }

    if (!newProduction.productId) {
      toast.error("Please select a product from inventory");
      return;
    }

    if (
      !newProduction.employeeName ||
      newProduction.employeeName.trim() === ""
    ) {
      toast.error("Please select an employee");
      return;
    }

    // Validate ingredients
    const validIngredients = selectedIngredients.filter(
      (ing) => ing.code && ing.quantity,
    );
    if (validIngredients.length === 0) {
      toast.error("Please add at least one ingredient");
      return;
    }

    // Check if all ingredients have sufficient stock
    const ingredientsUsedAPI: Array<{
      ingredientId: string;
      ingredientName: string;
      quantity: number;
    }> = [];

    for (const ing of validIngredients) {
      const ingredient = ingredients.find((i) => i.code === ing.code);
      if (!ingredient) {
        toast.error(`Ingredient ${ing.code} not found`);
        return;
      }

      const qty = parseFloat(ing.quantity);
      if (isNaN(qty) || qty <= 0) {
        toast.error(`Invalid quantity for ${ingredient.name}`);
        return;
      }

      if (ingredient.stock < qty) {
        toast.error(
          `Insufficient stock for ${ingredient.name}. Available: ${ingredient.stock} ${ingredient.unit}`,
        );
        return;
      }

      ingredientsUsedAPI.push({
        ingredientId: ingredient.id,
        ingredientName: ingredient.name,
        quantity: qty,
      });
    }

    try {
      const producedWeight = parseFloat(newProduction.weightKg);

      // Create production record in database (this will automatically update inventory and deduct ingredients)
      const productionPayload = {
        productId: newProduction.productId,
        productName: newProduction.productName,
        quantity: producedWeight,
        batchNumber: newProduction.batchNumber,
        operator: "Current User",
        initialIngredients: ingredientsUsedAPI,
      };

      console.log("Creating production with payload:", productionPayload);

      const record = await createProductionRecord(productionPayload);

      // Also deduct ingredients from local state
      for (const ing of validIngredients) {
        const ingredient = ingredients.find((i) => i.code === ing.code);
        if (ingredient) {
          const qty = parseFloat(ing.quantity);
          await deductIngredient(ing.code, qty);
        }
      }

      // Reload production records to get updated list
      await loadProductionRecords();

      // Refresh ingredients to show updated stock in real-time
      await refreshIngredients();

      setNewProduction({
        productName: "",
        productId: "",
        weightKg: "",
        batchNumber: "",
        employeeName: "",
      });
      setSelectedIngredients([]);
      setShowAddForm(false);

      toast.success(
        `Production added! ${producedWeight} kg of ${newProduction.productName} added to Production Facility inventory.`,
      );
    } catch (error) {
      console.error("Error adding production:", error);
      toast.error("Failed to add production to database");
    }
  };

  const updateStatus = async (
    id: string,
    status: ProductionEntry["status"],
  ) => {
    // If trying to mark as completed, show confirmation modal instead
    if (status === "completed") {
      const production = productions.find((p) => p.id === id);
      if (production) {
        setCompletionConfirmation({
          show: true,
          production,
          actualWeight: production.weightKg,
          additionalIngredients: [],
        });
      }
      return;
    }

    // For other statuses, update directly
    try {
      console.log("Updating status:", { id, status });
      // Update in database
      const result = await updateProductionRecordStatus(id, status);
      console.log("Update result:", result);

      // Update local state
      setProductions(
        productions.map((p) => (p.id === id ? { ...p, status } : p)),
      );

      toast.success("Production status updated");
    } catch (error) {
      console.error("Error updating production status:", error);
      toast.error("Failed to update status");
    }
  };

  const confirmCompletion = async () => {
    const { production, actualWeight, additionalIngredients } =
      completionConfirmation;
    if (!production) return;

    try {
      // Update in database with new weight
      const result = await updateProductionRecordStatus(
        production.id,
        "completed",
        {
          actualWeight: actualWeight
            ? parseFloat(actualWeight)
            : production.weightKg,
          additionalIngredients: additionalIngredients || [],
        },
      );
      console.log("Update result:", result);

      // Update local state
      setProductions(
        productions.map((p) =>
          p.id === production.id
            ? {
                ...p,
                status: "completed",
                weightKg: actualWeight || p.weightKg,
              }
            : p,
        ),
      );

      const productName = result.productName || production.productName;
      const quantity = actualWeight || production.weightKg;
      toast.success(
        `Production completed! ${quantity} KG ${productName} added to Production Facility inventory.`,
      );

      // Refresh ingredients to reflect stock changes from additional ingredients
      await refreshIngredients();

      setCompletionConfirmation({ show: false });
    } catch (error) {
      console.error("Error completing production:", error);
      toast.error("Failed to complete production");
    }
  };

  const deleteProduction = async (id: string) => {
    // Show confirmation modal instead of browser confirm
    setDeleteConfirmation({ show: true, productionId: id });
  };

  const confirmDelete = async () => {
    const id = deleteConfirmation.productionId;
    if (!id) return;

    console.log(
      "Frontend: Attempting to delete production with ID:",
      id,
      "Type:",
      typeof id,
    );

    try {
      // Delete in database
      await deleteProductionRecord(id);

      // Update local state
      setProductions(productions.filter((p) => p.id !== id));

      // Refresh ingredients to show returned stock in real-time
      await refreshIngredients();

      toast.success("Production record deleted");
    } catch (error) {
      console.error("Error deleting production record:", error);
      toast.error("Failed to delete record");
    } finally {
      setDeleteConfirmation({ show: false });
    }
  };

  return (
    <div className="h-full overflow-auto bg-muted/30">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-card rounded-lg p-6 border border-border">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-primary/10 p-3 rounded-lg">
                <Package className="w-6 h-6 text-primary" />
              </div>
            </div>
            <p className="text-3xl text-primary mb-1">
              {(totalProducedToday || 0).toFixed(1)} KG
            </p>
            <p className="text-sm text-muted-foreground">
              Total Produced Today
            </p>
          </div>

          <div className="bg-card rounded-lg p-6 border border-border">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-primary/10 p-3 rounded-lg">
                <Clock className="w-6 h-6 text-primary" />
              </div>
            </div>
            <p className="text-3xl text-primary mb-1">{inProgressCount}</p>
            <p className="text-sm text-muted-foreground">In Progress</p>
          </div>

          <div className="bg-card rounded-lg p-6 border border-border">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-primary/10 p-3 rounded-lg">
                <Factory className="w-6 h-6 text-primary" />
              </div>
            </div>
            <p className="text-3xl text-primary mb-1">{completedCount}</p>
            <p className="text-sm text-muted-foreground">Completed Batches</p>
          </div>

          <div className="bg-card rounded-lg p-6 border border-border">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-primary/10 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
            </div>
            <p className="text-3xl text-primary mb-1">
              {vsLastWeek.isPositive ? "+" : ""}
              {vsLastWeek.value}%
            </p>
            <p className="text-sm text-muted-foreground">vs Last Week</p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Production Chart */}
          <div className="bg-card rounded-lg p-6 border border-border">
            <h3 className="mb-4">Weekly Production (KG)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={weeklyProductionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="weight" fill="#dc2626" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Product Distribution */}
          <div className="bg-card rounded-lg p-6 border border-border">
            <h3 className="mb-4">Product Distribution (%)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={productDistributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {productDistributionData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Production Entry Form */}
        <div className="bg-card rounded-lg border border-border">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Factory className="w-6 h-6 text-primary" />
              <h2>Encode Production (KG)</h2>
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Production
            </button>
          </div>

          {showAddForm && (
            <div className="p-6 bg-secondary/50 border-b border-border space-y-4">
              {/* Production Details - Row 1 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-2">Product Name *</label>
                  <select
                    value={newProduction.productId}
                    onChange={async (e) => {
                      const selectedId = e.target.value;
                      const product = products.find(
                        (p) => String(p.id) === selectedId,
                      );
                      setNewProduction({
                        ...newProduction,
                        productId: selectedId,
                        productName: product?.name || "",
                      });

                      // Auto-load default ingredients for selected product
                      if (selectedId) {
                        try {
                          const defaults =
                            await getProductDefaultIngredients(selectedId);
                          if (defaults && defaults.length > 0) {
                            const loadedIngredients = defaults.map((d) => {
                              // Find the ingredient in the context by ID to get its code
                              const ing = ingredients.find(
                                (i) => String(i.id) === String(d.ingredientId),
                              );
                              return {
                                code: ing?.code || d.ingredientCode || "",
                                quantity: String(d.quantity),
                              };
                            });
                            setSelectedIngredients(loadedIngredients);
                            toast.info(
                              `Loaded ${defaults.length} default ingredient(s) for ${product?.name || "product"}`,
                            );
                          } else {
                            setSelectedIngredients([]);
                          }
                        } catch (err) {
                          console.error(
                            "Error loading default ingredients:",
                            err,
                          );
                          // Don't show error toast - just leave ingredients empty
                          setSelectedIngredients([]);
                        }
                      } else {
                        setSelectedIngredients([]);
                      }
                    }}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Select Product</option>
                    {products.map((product) => (
                      <option key={product.id} value={String(product.id)}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-2">Weight (KG) *</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newProduction.weightKg}
                    onChange={(e) =>
                      setNewProduction({
                        ...newProduction,
                        weightKg: e.target.value,
                      })
                    }
                    placeholder="0.0"
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Production Details - Row 2 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-2">Employee Name *</label>
                  <select
                    value={newProduction.employeeName}
                    onChange={(e) =>
                      setNewProduction({
                        ...newProduction,
                        employeeName: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Select Employee</option>
                    {employees.map((employee) => (
                      <option key={employee.id} value={employee.fullName}>
                        {employee.fullName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-2">
                    Batch Number (Auto-generated)
                  </label>
                  <input
                    type="text"
                    value={newProduction.batchNumber}
                    onChange={(e) =>
                      setNewProduction({
                        ...newProduction,
                        batchNumber: e.target.value,
                      })
                    }
                    placeholder="B001"
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-gray-100"
                    readOnly
                  />
                </div>
              </div>

              {/* Ingredients Section */}
              <div className="bg-background rounded-lg p-4 border border-border">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <ChefHat className="w-5 h-5 text-primary" />
                    <h3 className="text-sm font-medium">Ingredients Used</h3>
                  </div>
                  <button
                    onClick={addIngredientRow}
                    className="flex items-center gap-1 text-sm bg-primary text-primary-foreground px-3 py-1.5 rounded hover:bg-primary/90"
                  >
                    <Plus className="w-4 h-4" />
                    Add Ingredient
                  </button>
                </div>

                {selectedIngredients.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Click "Add Ingredient" to add ingredients for this
                    production
                  </p>
                ) : (
                  <div className="space-y-2">
                    {selectedIngredients.map((ing, index) => (
                      <div key={index} className="flex gap-2 items-start">
                        <div className="flex-1">
                          <select
                            value={ing.code}
                            onChange={(e) =>
                              updateIngredient(index, "code", e.target.value)
                            }
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                          >
                            <option value="">Select Ingredient</option>
                            {ingredients.map((ingredient) => (
                              <option
                                key={ingredient.code}
                                value={ingredient.code}
                              >
                                {ingredient.name} ({ingredient.unit}) - Stock:{" "}
                                {ingredient.stock}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="w-32">
                          <input
                            type="number"
                            step="0.1"
                            value={ing.quantity}
                            onChange={(e) =>
                              updateIngredient(
                                index,
                                "quantity",
                                e.target.value,
                              )
                            }
                            placeholder="Qty"
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                          />
                        </div>
                        <button
                          onClick={() => removeIngredientRow(index)}
                          className="p-2 hover:bg-red-100 text-red-600 rounded"
                          title="Remove"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Save Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleAddProduction}
                  className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Save Production
                </button>
              </div>
            </div>
          )}

          {/* Production List */}
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4">Batch #</th>
                    <th className="text-left py-3 px-4">Product Name</th>
                    <th className="text-left py-3 px-4">Weight (KG)</th>
                    <th className="text-left py-3 px-4">Ingredients</th>
                    <th className="text-left py-3 px-4">Date</th>
                    <th className="text-left py-3 px-4">Time</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {productions.map((production) => (
                    <tr
                      key={production.id}
                      className="border-b border-border hover:bg-muted/50"
                    >
                      <td className="py-3 px-4">{production.batchNumber}</td>
                      <td className="py-3 px-4">{production.productName}</td>
                      <td className="py-3 px-4 text-primary">
                        {(Number(production.weightKg) || 0).toFixed(1)} KG
                      </td>
                      <td className="py-3 px-4">
                        {production.ingredientsUsed.length > 0 ? (
                          <div className="text-xs">
                            {production.ingredientsUsed.map((ing, idx) => (
                              <div key={idx} className="text-muted-foreground">
                                {ing.name}: {ing.quantity} {ing.unit}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            No ingredients recorded
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">{production.date}</td>
                      <td className="py-3 px-4">{production.time}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs ${
                            production.status === "completed"
                              ? "bg-green-100 text-green-700"
                              : production.status === "in-progress"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {production.status === "in-progress"
                            ? "In Progress"
                            : production.status === "completed"
                              ? "Completed"
                              : "Quality Check"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={production.status}
                          onChange={(e) =>
                            updateStatus(
                              production.id,
                              e.target.value as ProductionEntry["status"],
                            )
                          }
                          className="px-2 py-1 bg-background border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          <option value="in-progress">In Progress</option>
                          <option value="quality-check">Quality Check</option>
                          <option value="completed">Completed</option>
                        </select>
                        <button
                          onClick={() => deleteProduction(production.id)}
                          className="ml-2 px-2 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmation.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg max-w-md w-full p-6 border border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Delete Production Record</h2>
                <p className="text-sm text-muted-foreground">
                  This action cannot be undone
                </p>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-800">
                Are you sure you want to delete this production record? All
                associated data will be permanently removed.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmation({ show: false })}
                className="flex-1 px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Completion Confirmation Modal */}
      {completionConfirmation.show && completionConfirmation.production && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-card rounded-lg max-w-2xl w-full p-6 border border-border my-auto">
            <h2 className="text-2xl font-bold mb-6">
              Confirm Production Completion
            </h2>

            {/* Production Details Summary */}
            <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-muted/30 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Product</p>
                <p className="font-semibold">
                  {completionConfirmation.production.productName}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Batch #</p>
                <p className="font-semibold">
                  {completionConfirmation.production.batchNumber}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-semibold">
                  {completionConfirmation.production.date}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Time</p>
                <p className="font-semibold">
                  {completionConfirmation.production.time}
                </p>
              </div>
            </div>

            {/* Initial Ingredients Used */}
            <div className="mb-6">
              <h3 className="font-semibold mb-3">Initial Ingredients Used</h3>
              <div className="space-y-2 p-3 bg-muted/20 rounded-lg">
                {completionConfirmation.production.ingredientsUsed &&
                completionConfirmation.production.ingredientsUsed.length > 0 ? (
                  completionConfirmation.production.ingredientsUsed.map(
                    (ing, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span>{ing.name || ing.code}</span>
                        <span className="font-medium">
                          {ing.quantity} {ing.unit || "unit"}
                        </span>
                      </div>
                    ),
                  )
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No initial ingredients recorded
                  </p>
                )}
              </div>
            </div>

            {/* Actual Weight Input */}
            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2">
                Actual Weight Produced (KG) *
              </label>
              <input
                type="number"
                step="0.1"
                value={completionConfirmation.actualWeight || ""}
                onChange={(e) =>
                  setCompletionConfirmation({
                    ...completionConfirmation,
                    actualWeight: e.target.value,
                  })
                }
                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter actual weight produced"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Planned: {completionConfirmation.production.weightKg} KG
              </p>
            </div>

            {/* Additional Ingredients */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Additional Ingredients Used</h3>
                <button
                  onClick={() => {
                    const newIng = [
                      ...(completionConfirmation.additionalIngredients || []),
                      { code: "", quantity: "" },
                    ];
                    setCompletionConfirmation({
                      ...completionConfirmation,
                      additionalIngredients: newIng,
                    });
                  }}
                  className="text-sm bg-primary text-primary-foreground px-3 py-1 rounded hover:bg-primary/90 transition-colors flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Add Ingredient
                </button>
              </div>

              <div className="space-y-3">
                {completionConfirmation.additionalIngredients &&
                completionConfirmation.additionalIngredients.length > 0 ? (
                  completionConfirmation.additionalIngredients.map(
                    (ing, idx) => {
                      const selectedIngredient = ingredients.find(
                        (i) => i.id.toString() === ing.code,
                      );
                      return (
                        <div key={idx} className="flex gap-2 items-start">
                          <select
                            value={ing.code}
                            onChange={(e) => {
                              const updated = [
                                ...(completionConfirmation.additionalIngredients ||
                                  []),
                              ];
                              updated[idx].code = e.target.value;
                              setCompletionConfirmation({
                                ...completionConfirmation,
                                additionalIngredients: updated,
                              });
                            }}
                            className="flex-1 px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                          >
                            <option value="">Select ingredient</option>
                            {ingredients.map((ingredient) => (
                              <option
                                key={ingredient.id}
                                value={ingredient.id.toString()}
                              >
                                {ingredient.name} (Stock: {ingredient.stock}{" "}
                                {ingredient.unit})
                              </option>
                            ))}
                          </select>
                          <input
                            type="number"
                            step="0.1"
                            placeholder="Qty"
                            value={ing.quantity}
                            onChange={(e) => {
                              const updated = [
                                ...(completionConfirmation.additionalIngredients ||
                                  []),
                              ];
                              updated[idx].quantity = e.target.value;
                              setCompletionConfirmation({
                                ...completionConfirmation,
                                additionalIngredients: updated,
                              });
                            }}
                            className="w-24 px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                          />
                          {selectedIngredient && (
                            <div className="text-xs text-muted-foreground whitespace-nowrap py-2">
                              Available: {selectedIngredient.stock}{" "}
                              {selectedIngredient.unit}
                            </div>
                          )}
                          <button
                            onClick={() => {
                              const updated =
                                completionConfirmation.additionalIngredients?.filter(
                                  (_, i) => i !== idx,
                                ) || [];
                              setCompletionConfirmation({
                                ...completionConfirmation,
                                additionalIngredients: updated,
                              });
                            }}
                            className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    },
                  )
                ) : (
                  <p className="text-sm text-muted-foreground p-2 bg-muted/20 rounded">
                    No additional ingredients. Click "Add Ingredient" to add
                    wrapper, oil, or other ingredients used.
                  </p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-border">
              <button
                onClick={() => setCompletionConfirmation({ show: false })}
                className="flex-1 px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmCompletion}
                disabled={!completionConfirmation.actualWeight}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirm & Complete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
