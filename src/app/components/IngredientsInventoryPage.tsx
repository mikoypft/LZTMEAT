import { useState, useContext, useEffect, useRef, useCallback } from "react";
import {
  Package,
  AlertTriangle,
  TrendingUp,
  Search,
  Filter,
  Plus,
  Minus,
  Download,
  RotateCcw,
  X,
  Save,
  Trash2,
  Edit2,
  GripVertical,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import {
  IngredientsContext,
  Ingredient,
} from "@/app/context/IngredientsContext";
import {
  addIngredient,
  updateIngredient,
  deleteIngredient,
  resetIngredients,
  getSuppliers,
  getIngredientCategories,
  createStockAdjustment,
  reorderIngredientCategories,
  reorderIngredients,
  type Supplier,
  type Category,
} from "@/utils/api";
import { toast } from "sonner";
import { useDrag, useDrop, DndProvider } from "react-dnd";
import { MultiBackend } from "react-dnd-multi-backend";
import { HTML5toTouch } from "rdndmb-html5-to-touch";

interface UserData {
  id: string;
  username: string;
  fullName?: string;
  role: string;
  storeId?: string;
  storeName?: string;
}

interface IngredientsInventoryPageProps {
  currentUser?: UserData | null;
}

export function IngredientsInventoryPage({
  currentUser,
}: IngredientsInventoryPageProps) {
  const isAdmin =
    currentUser?.role === "ADMIN" ||
    !!currentUser?.permissions?.includes("admin_permissions") ||
    !!currentUser?.permissions?.includes("admin_perm_ingredients");
  const canAdd =
    isAdmin ||
    !!currentUser?.permissions?.includes("admin_perm_ingredients_add");
  const canEdit =
    isAdmin ||
    !!currentUser?.permissions?.includes("admin_perm_ingredients_edit");
  const canAdjust =
    isAdmin ||
    !!currentUser?.permissions?.includes("admin_perm_ingredients_adjust");
  const canDelete =
    isAdmin ||
    !!currentUser?.permissions?.includes("admin_perm_ingredients_delete");
  const context = useContext(IngredientsContext);
  if (!context) {
    return (
      <div className="h-full flex items-center justify-center">
        <p>Loading ingredients inventory...</p>
      </div>
    );
  }

  const { ingredients, adjustStock, setIngredients } = context;
  const [searchTerm, setSearchTerm] = useState("");
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [showAddIngredientModal, setShowAddIngredientModal] = useState(false);
  const [showEditIngredientModal, setShowEditIngredientModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [selectedIngredient, setSelectedIngredient] =
    useState<Ingredient | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  // Ordered categories list (Category objects with id + name)
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  // Track collapsed state per category name
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  // Local ordered ingredients (to avoid re-fetching after drag)
  const [localIngredients, setLocalIngredients] = useState<Ingredient[]>([]);
  // Sync localIngredients when context ingredients change
  useEffect(() => {
    setLocalIngredients(ingredients);
  }, [ingredients]);

  // Load suppliers + categories from database
  useEffect(() => {
    loadSuppliers();
    loadCategories();
  }, []);

  const loadSuppliers = async () => {
    try {
      const suppliersData = await getSuppliers();
      setSuppliers(suppliersData);
    } catch (error) {
      console.error("Error loading suppliers:", error);
    }
  };

  const loadCategories = async () => {
    try {
      const cats = await getIngredientCategories();
      setAllCategories(cats);
    } catch (error) {
      console.error("Error loading ingredient categories:", error);
    }
  };

  // Build ordered list of unique categories that appear in ingredients
  const orderedCategoryNames: string[] = (() => {
    const seen = new Set<string>();
    const result: string[] = [];
    // First: categories from allCategories in sorted order
    for (const cat of allCategories) {
      if (!seen.has(cat.name)) {
        seen.add(cat.name);
        result.push(cat.name);
      }
    }
    // Then: any uncategorized ingredients
    for (const ing of localIngredients) {
      const cat = ing.category || "Uncategorized";
      if (!seen.has(cat)) {
        seen.add(cat);
        result.push(cat);
      }
    }
    return result;
  })();

  const categories = ["All", ...orderedCategoryNames];

  const filteredIngredients = localIngredients.filter((item) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      (item.name && item.name.toLowerCase().includes(q)) ||
      (item.code && item.code.toLowerCase().includes(q)) ||
      (item.supplier && item.supplier.toLowerCase().includes(q))
    );
  });

  // Move a category (drag-drop between categories)
  const moveCategoryItem = useCallback(
    (dragIndex: number, hoverIndex: number) => {
      const newCats = [...allCategories];
      const [removed] = newCats.splice(dragIndex, 1);
      newCats.splice(hoverIndex, 0, removed);
      setAllCategories(newCats);
    },
    [allCategories],
  );

  // Save category order to backend
  const saveCategoryOrder = useCallback(
    async (cats: Category[]) => {
      try {
        await reorderIngredientCategories(
          cats.map((c, idx) => ({ id: c.id, sortOrder: idx })),
        );
      } catch {
        toast.error("Failed to save category order");
      }
    },
    [],
  );

  // Move an ingredient within a category
  const moveIngredientItem = useCallback(
    (categoryName: string, dragIndex: number, hoverIndex: number) => {
      const newIngredients = [...localIngredients];
      const catIngredients = newIngredients.filter(
        (i) => i.category === categoryName,
      );
      const otherIngredients = newIngredients.filter(
        (i) => i.category !== categoryName,
      );
      const [removed] = catIngredients.splice(dragIndex, 1);
      catIngredients.splice(hoverIndex, 0, removed);
      // Merge back — preserve original ordering of other categories
      const merged: Ingredient[] = [];
      let catIdx = 0;
      for (const ing of newIngredients) {
        if (ing.category === categoryName) {
          merged.push(catIngredients[catIdx++]);
        } else {
          merged.push(ing);
        }
      }
      setLocalIngredients(merged);
    },
    [localIngredients],
  );

  // Save ingredient order to backend
  const saveIngredientOrder = useCallback(
    async (categoryName: string, l: Ingredient[]) => {
      try {
        const catItems = l.filter((i) => i.category === categoryName);
        await reorderIngredients(
          catItems.map((ing, idx) => ({ id: ing.id, sortOrder: idx })),
        );
      } catch {
        toast.error("Failed to save ingredient order");
      }
    },
    [],
  );

  const toggleCategory = (catName: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(catName)) next.delete(catName);
      else next.add(catName);
      return next;
    });
  };

  const lowStockItems = ingredients.filter(
    (item) => item.stock < item.minStockLevel,
  );
  const reorderItems = ingredients.filter(
    (item) => item.stock <= item.reorderPoint,
  );
  const totalItems = ingredients.length;
  const totalValue = ingredients.reduce(
    (sum, item) =>
      sum + (Number(item.stock) || 0) * (Number(item.costPerUnit) || 0),
    0,
  );

  // Stock Adjustment Function
  const handleStockAdjustment = async (adjustment: {
    quantity: number;
    type: "add" | "remove";
    reason: string;
  }) => {
    if (!selectedIngredient) return;

    try {
      const ingredient = ingredients.find(
        (i) => i.id === selectedIngredient.id,
      );

      if (!ingredient) {
        toast.error("Ingredient not found");
        return;
      }

      // Record the stock adjustment in the database
      await createStockAdjustment({
        ingredient_id: Number(selectedIngredient.id),
        type: adjustment.type,
        quantity: adjustment.quantity,
        reason: adjustment.reason || "Stock adjustment",
        user_id: currentUser?.id ? Number(currentUser.id) : undefined,
        user_name:
          currentUser?.fullName || currentUser?.username || "Unknown User",
      });

      // Update local state
      await adjustStock(
        selectedIngredient.id,
        adjustment.quantity,
        adjustment.type,
        adjustment.reason,
      );

      const delta =
        adjustment.type === "add" ? adjustment.quantity : -adjustment.quantity;
      const currentStock =
        typeof ingredient.stock === "string"
          ? parseFloat(ingredient.stock)
          : ingredient.stock;
      const newStock = Math.max(0, currentStock + delta);

      await updateIngredient(selectedIngredient.id, {
        stock: newStock,
        lastUpdated: new Date().toISOString(),
      });

      toast.success("Stock adjusted and recorded successfully");

      setShowAdjustmentModal(false);
      setSelectedIngredient(null);
    } catch (error) {
      console.error("Error adjusting stock:", error);
      toast.error("Failed to adjust stock");
    } finally {
      setIsAdjusting(false);
    }
  };

  // Delete Ingredient Function
  const handleDeleteIngredient = async () => {
    if (!selectedIngredient) return;

    setIsDeleting(true);
    try {
      console.log(`=== FRONTEND DELETE ===`);
      console.log(
        `Attempting to delete ingredient ID: "${selectedIngredient.id}" (type: ${typeof selectedIngredient.id})`,
      );
      console.log(`Ingredient name: ${selectedIngredient.name}`);

      await deleteIngredient(selectedIngredient.id);

      // Remove from local state
      setIngredients(ingredients.filter((i) => i.id !== selectedIngredient.id));
      toast.success(
        `Ingredient "${selectedIngredient.name}" deleted successfully`,
      );
      setShowDeleteConfirm(false);
      setSelectedIngredient(null);
    } catch (error) {
      console.error("Error deleting ingredient:", error);
      toast.error("Failed to delete ingredient");
    } finally {
      setIsDeleting(false);
    }
  };

  // Reset Ingredients Function
  const handleResetIngredients = async () => {
    setIsResetting(true);
    try {
      const defaultIngredients = await resetIngredients();
      setIngredients(defaultIngredients);
      toast.success("Ingredients reset successfully");
    } catch (error) {
      console.error("Error resetting ingredients:", error);
      toast.error("Failed to reset ingredients");
    } finally {
      setIsResetting(false);
      setShowResetConfirm(false);
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = [
      "Code",
      "Ingredient Name",
      "Category",
      "Stock",
      "Unit",
      "Cost/Unit",
      "Total Value",
      "Supplier",
      "Expiry Date",
    ];
    const rows = ingredients.map((item) => [
      item.code,
      item.name,
      item.category,
      item.stock,
      item.unit,
      Number(item.costPerUnit || 0).toFixed(2),
      (Number(item.stock || 0) * Number(item.costPerUnit || 0)).toFixed(2),
      item.supplier,
      item.expiryDate || "N/A",
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ingredients-inventory-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  return (
    <div className="h-full overflow-auto bg-muted/30">
      <div className="container mx-auto p-4 lg:p-6 space-y-4 lg:space-y-6">
        {/* Header Stats Widgets */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
          <div className="bg-card rounded-lg p-4 lg:p-6 border border-border">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-primary/10 p-2 lg:p-3 rounded-lg">
                <Package className="w-5 h-5 lg:w-6 lg:h-6 text-primary" />
              </div>
            </div>
            <p className="text-2xl lg:text-3xl text-primary mb-1">
              {totalItems}
            </p>
            <p className="text-xs lg:text-sm text-muted-foreground">
              Total Ingredients
            </p>
          </div>

          <div className="bg-card rounded-lg p-4 lg:p-6 border border-border">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-green-100 p-2 lg:p-3 rounded-lg">
                <TrendingUp className="w-5 h-5 lg:w-6 lg:h-6 text-green-600" />
              </div>
            </div>
            <p className="text-2xl lg:text-3xl text-green-600 mb-1">
              ₱{Number(totalValue || 0).toFixed(2)}
            </p>
            <p className="text-xs lg:text-sm text-muted-foreground">
              Inventory Value
            </p>
          </div>

          <div className="bg-card rounded-lg p-4 lg:p-6 border border-border">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-red-100 p-2 lg:p-3 rounded-lg">
                <AlertTriangle className="w-5 h-5 lg:w-6 lg:h-6 text-red-600" />
              </div>
            </div>
            <p className="text-2xl lg:text-3xl text-red-600 mb-1">
              {lowStockItems.length}
            </p>
            <p className="text-xs lg:text-sm text-muted-foreground">
              Low Stock Alerts
            </p>
          </div>

          <div className="bg-card rounded-lg p-4 lg:p-6 border border-border">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-orange-100 p-2 lg:p-3 rounded-lg">
                <AlertTriangle className="w-5 h-5 lg:w-6 lg:h-6 text-orange-600" />
              </div>
            </div>
            <p className="text-2xl lg:text-3xl text-orange-600 mb-1">
              {reorderItems.length}
            </p>
            <p className="text-xs lg:text-sm text-muted-foreground">
              Need Reorder
            </p>
          </div>
        </div>

        {/* Search and Actions */}
        <div className="bg-card rounded-lg p-4 lg:p-6 border border-border space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search ingredients by name, code, or supplier..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex gap-2">
              {canAdd && (
                <button
                  onClick={() => setShowAddIngredientModal(true)}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add</span>
                </button>
              )}
              <button
                onClick={exportToCSV}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export</span>
              </button>
              <button
                onClick={() => setShowResetConfirm(true)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            </div>
          </div>
          {isAdmin && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <GripVertical className="w-3 h-3" />
              Drag <GripVertical className="w-3 h-3" /> handles to reorder categories and ingredients. Order is saved automatically.
            </p>
          )}
        </div>

        {/* Low Stock Alerts */}
        {lowStockItems.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 lg:p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <h3 className="text-red-900 font-medium">
                Critical Low Stock Alerts
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {lowStockItems.map((item) => (
                <div key={item.id} className="bg-background rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.code}
                      </p>
                    </div>
                    <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">
                      CRITICAL
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">Current:</p>
                      <p className="text-red-600 font-medium">
                        {item.stock} {item.unit}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Min Level:</p>
                      <p className="font-medium">
                        {item.minStockLevel} {item.unit}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Grouped Category Sections with Drag and Drop */}
        <DndProvider backend={MultiBackend} options={HTML5toTouch}>
          <div className="space-y-3">
            {orderedCategoryNames.map((catName, catIdx) => {
              const catIngredients = filteredIngredients.filter(
                (i) => i.category === catName,
              );
              if (catIngredients.length === 0 && searchTerm) return null;
              const isCollapsed = collapsedCategories.has(catName);
              const catCategory = allCategories.find((c) => c.name === catName);
              const catId = catCategory?.id ?? catName;
              return (
                <DraggableCategorySection
                  key={catId}
                  catId={String(catId)}
                  catName={catName}
                  catIndex={catIdx}
                  ingredients={catIngredients}
                  allCategoryIngredients={localIngredients.filter((i) => i.category === catName)}
                  isCollapsed={isCollapsed}
                  isAdmin={isAdmin}
                  canEdit={canEdit}
                  canAdjust={canAdjust}
                  canDelete={canDelete}
                  onToggleCollapse={toggleCategory}
                  onMoveCategory={moveCategoryItem}
                  onDropCategory={() => saveCategoryOrder(allCategories)}
                  onMoveIngredient={moveIngredientItem}
                  onDropIngredient={(updatedList) => saveIngredientOrder(catName, updatedList)}
                  onEditIngredient={(item) => {
                    setSelectedIngredient(item);
                    setShowEditIngredientModal(true);
                  }}
                  onAdjustIngredient={(item) => {
                    setSelectedIngredient(item);
                    setShowAdjustmentModal(true);
                  }}
                  onDeleteIngredient={(item) => {
                    setSelectedIngredient(item);
                    setShowDeleteConfirm(true);
                  }}
                />
              );
            })}
            {filteredIngredients.length === 0 && (
              <div className="bg-card rounded-lg border border-border p-12 text-center text-muted-foreground">
                <p>No ingredients found</p>
              </div>
            )}
          </div>
        </DndProvider>
      </div>

      {/* Stock Adjustment Modal */}
      {showAdjustmentModal && selectedIngredient && (
        <StockAdjustmentModal
          ingredient={selectedIngredient}
          onAdjust={handleStockAdjustment}
          onClose={() => {
            setShowAdjustmentModal(false);
            setSelectedIngredient(null);
          }}
          isAdjusting={isAdjusting}
          setIsAdjusting={setIsAdjusting}
        />
      )}

      {/* Add Ingredient Modal */}
      {showAddIngredientModal && (
        <AddIngredientModal
          onAdd={async (newIng) => {
            setIsAdding(true);
            try {
              const ingredient = await addIngredient(newIng);
              setIngredients([...ingredients, ingredient]);
              toast.success(
                `Ingredient "${ingredient.name}" added successfully`,
              );
              setShowAddIngredientModal(false);
            } catch (error) {
              console.error("Error adding ingredient:", error);
              toast.error("Failed to add ingredient");
            } finally {
              setIsAdding(false);
            }
          }}
          onClose={() => setShowAddIngredientModal(false)}
          isAdding={isAdding}
          suppliers={suppliers}
          ingredients={ingredients}
        />
      )}

      {/* Edit Ingredient Modal */}
      {showEditIngredientModal && selectedIngredient && (
        <AddIngredientModal
          ingredient={selectedIngredient}
          onAdd={async (updatedIng) => {
            setIsAdding(true);
            try {
              const ingredient = await updateIngredient(
                selectedIngredient.id,
                updatedIng,
              );
              setIngredients(
                ingredients.map((ing) =>
                  ing.id === selectedIngredient.id ? ingredient : ing,
                ),
              );
              toast.success(
                `Ingredient "${ingredient.name}" updated successfully`,
              );
              setShowEditIngredientModal(false);
              setSelectedIngredient(null);
            } catch (error) {
              console.error("Error updating ingredient:", error);
              toast.error("Failed to update ingredient");
            } finally {
              setIsAdding(false);
            }
          }}
          onClose={() => {
            setShowEditIngredientModal(false);
            setSelectedIngredient(null);
          }}
          isAdding={isAdding}
          suppliers={suppliers}
          ingredients={ingredients}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedIngredient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4 text-red-600">
              <AlertTriangle className="w-6 h-6" />
              <h2 className="text-lg font-semibold">Delete Ingredient</h2>
            </div>

            <p className="text-sm mb-6">
              Are you sure you want to delete{" "}
              <strong>{selectedIngredient.name}</strong> (
              {selectedIngredient.code})? This action cannot be undone.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setSelectedIngredient(null);
                }}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteIngredient}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4 text-blue-600">
              <AlertTriangle className="w-6 h-6" />
              <h2 className="text-lg font-semibold">Refresh Ingredients</h2>
            </div>

            <p className="text-sm mb-6">
              This will reload all ingredients from the database to get the
              latest updates.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleResetIngredients}
                disabled={isResetting}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <RotateCcw className="w-4 h-4" />
                {isResetting ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Stock Adjustment Modal
function StockAdjustmentModal({
  ingredient,
  onAdjust,
  onClose,
  isAdjusting,
  setIsAdjusting,
}: {
  ingredient: Ingredient;
  onAdjust: (adjustment: any) => void;
  onClose: () => void;
  isAdjusting: boolean;
  setIsAdjusting: (value: boolean) => void;
}) {
  const [quantity, setQuantity] = useState<string>("");
  const [type, setType] = useState<"add" | "remove">("add");
  const [reason, setReason] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(quantity);
    if (!quantity || qty <= 0 || !reason) {
      toast.error("Please enter quantity and reason");
      return;
    }
    setIsAdjusting(true);
    onAdjust({ quantity: qty, type, reason });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Adjust Stock - {ingredient.name}</h2>
          <button onClick={onClose} className="p-2 hover:bg-accent rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-muted/50 rounded p-3">
            <p className="text-sm text-muted-foreground mb-1">Current Stock</p>
            <p className="text-2xl font-bold text-primary">
              {ingredient.stock} {ingredient.unit}
            </p>
          </div>

          <div>
            <label className="block text-sm mb-2">Type</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setType("add")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border transition-colors ${
                  type === "add"
                    ? "bg-green-600 text-white border-green-600"
                    : "border-border hover:bg-accent"
                }`}
              >
                <Plus className="w-4 h-4" />
                Add Stock
              </button>
              <button
                type="button"
                onClick={() => setType("remove")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border transition-colors ${
                  type === "remove"
                    ? "bg-red-600 text-white border-red-600"
                    : "border-border hover:bg-accent"
                }`}
              >
                <Minus className="w-4 h-4" />
                Remove Stock
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm mb-2">
              Quantity ({ingredient.unit})
            </label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              onFocus={(e) => e.target.select()}
              placeholder="0"
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-2">Reason</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Production usage, Spoilage, Restock, etc."
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary min-h-[80px]"
              required
            />
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isAdjusting}
              className="flex-1 border border-border py-2 rounded-lg hover:bg-accent transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isAdjusting}
              className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {isAdjusting ? "Adjusting..." : "Apply Adjustment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Add Ingredient Modal
function AddIngredientModal({
  onAdd,
  onClose,
  isAdding,
  suppliers,
  ingredients,
  ingredient,
}: {
  onAdd: (newIng: any) => void;
  onClose: () => void;
  isAdding: boolean;
  suppliers: Supplier[];
  ingredients: Ingredient[];
  ingredient?: Ingredient;
}) {
  // Auto-generate incremental code
  const generateNextCode = () => {
    if (ingredients.length === 0) return "ING-001";

    // Extract numbers from existing codes
    const numbers = ingredients
      .map((ing) => {
        const match = ing.code.match(/ING-(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter((num) => num > 0);

    // Get the highest number
    const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
    const nextNumber = maxNumber + 1;

    // Format with leading zeros
    return `ING-${String(nextNumber).padStart(3, "0")}`;
  };

  const isEditing = !!ingredient;

  const [name, setName] = useState(ingredient?.name || "");
  const [code] = useState(ingredient?.code || generateNextCode());
  const [category, setCategory] = useState(ingredient?.category || "");
  const [unit, setUnit] = useState(ingredient?.unit || "");
  const [costPerUnit, setCostPerUnit] = useState<string>(
    ingredient?.costPerUnit ? String(ingredient.costPerUnit) : "",
  );
  const [minStockLevel, setMinStockLevel] = useState<string>(
    ingredient?.minStockLevel ? String(ingredient.minStockLevel) : "",
  );
  const [reorderPoint, setReorderPoint] = useState<string>(
    ingredient?.reorderPoint ? String(ingredient.reorderPoint) : "",
  );
  const [supplierId, setSupplierId] = useState(ingredient?.supplierId || "");
  const [expiryDate, setExpiryDate] = useState(ingredient?.expiryDate || "");
  const [ingredientCategories, setIngredientCategories] = useState<Category[]>(
    [],
  );
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Fetch ingredient categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const cats = await getIngredientCategories();
        setIngredientCategories(cats);
      } catch (error) {
        console.error("Error loading ingredient categories:", error);
        toast.error("Failed to load ingredient categories");
      } finally {
        setLoadingCategories(false);
      }
    };
    loadCategories();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cost = parseFloat(costPerUnit);
    const min = parseFloat(minStockLevel);
    const reorder = parseFloat(reorderPoint);
    if (
      !name ||
      !category ||
      !unit ||
      !costPerUnit ||
      cost <= 0 ||
      !minStockLevel ||
      min <= 0 ||
      !reorderPoint ||
      reorder <= 0 ||
      !supplierId
    ) {
      toast.error("Please fill in all required fields");
      return;
    }
    const newIngredient = {
      name,
      code,
      category,
      unit,
      costPerUnit: cost,
      minStockLevel: min,
      reorderPoint: reorder,
      supplierId,
      expiryDate: expiryDate || null,
      stock: 0,
      lastUpdated: new Date().toISOString(),
    };
    onAdd(newIngredient);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">
            {isEditing ? "Edit Ingredient" : "Add New Ingredient"}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-accent rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-2">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter ingredient name"
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-2">Code (Auto-generated)</label>
            <input
              type="text"
              value={code}
              readOnly
              className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-muted-foreground cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm mb-2">Category *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
              disabled={loadingCategories}
            >
              {!category && (
                <option value="">
                  {loadingCategories
                    ? "Loading categories..."
                    : "Select Category"}
                </option>
              )}
              {ingredientCategories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-2">Unit *</label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="kg, L, pcs"
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>

            <div>
              <label className="block text-sm mb-2">Cost per Unit (₱) *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={costPerUnit}
                onChange={(e) => setCostPerUnit(e.target.value)}
                onFocus={(e) => e.target.select()}
                placeholder="0.00"
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-2">Min Stock Level *</label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={minStockLevel}
                onChange={(e) => setMinStockLevel(e.target.value)}
                onFocus={(e) => e.target.select()}
                placeholder="0"
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>

            <div>
              <label className="block text-sm mb-2">Reorder Point *</label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={reorderPoint}
                onChange={(e) => setReorderPoint(e.target.value)}
                onFocus={(e) => e.target.select()}
                placeholder="0"
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm mb-2">Supplier *</label>
            <select
              value={supplierId ? String(supplierId) : ""}
              onChange={(e) =>
                setSupplierId(e.target.value ? Number(e.target.value) : "")
              }
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            >
              {!supplierId && <option value="">Select Supplier</option>}
              {suppliers.map((sup) => (
                <option key={sup.id} value={String(sup.id)}>
                  {sup.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm mb-2">Expiry Date (Optional)</label>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isAdding}
              className="flex-1 border border-border py-2 rounded-lg hover:bg-accent transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isAdding}
              className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isAdding
                ? isEditing
                  ? "Updating..."
                  : "Adding..."
                : isEditing
                  ? "Update Ingredient"
                  : "Add Ingredient"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Drag-and-drop sub-components ───────────────────────────────────────────

const CATEGORY_DND_TYPE = "INGREDIENT_CATEGORY";

function DraggableCategorySection({
  catId,
  catName,
  catIndex,
  ingredients,
  allCategoryIngredients,
  isCollapsed,
  isAdmin,
  canEdit,
  canAdjust,
  canDelete,
  onToggleCollapse,
  onMoveCategory,
  onDropCategory,
  onMoveIngredient,
  onDropIngredient,
  onEditIngredient,
  onAdjustIngredient,
  onDeleteIngredient,
}: {
  catId: string;
  catName: string;
  catIndex: number;
  ingredients: Ingredient[];
  allCategoryIngredients: Ingredient[];
  isCollapsed: boolean;
  isAdmin: boolean;
  canEdit: boolean;
  canAdjust: boolean;
  canDelete: boolean;
  onToggleCollapse: (name: string) => void;
  onMoveCategory: (dragIdx: number, hoverIdx: number) => void;
  onDropCategory: () => void;
  onMoveIngredient: (catName: string, dragIdx: number, hoverIdx: number) => void;
  onDropIngredient: (updatedList: Ingredient[]) => void;
  onEditIngredient: (item: Ingredient) => void;
  onAdjustIngredient: (item: Ingredient) => void;
  onDeleteIngredient: (item: Ingredient) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag, dragPreview] = useDrag({
    type: CATEGORY_DND_TYPE,
    item: { index: catIndex },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
    canDrag: isAdmin,
  });

  const [, drop] = useDrop<{ index: number }, void, {}>({
    accept: CATEGORY_DND_TYPE,
    hover(item, monitor) {
      if (!ref.current) return;
      const dragIndex = item.index;
      const hoverIndex = catIndex;
      if (dragIndex === hoverIndex) return;
      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;
      onMoveCategory(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
    drop() {
      onDropCategory();
    },
  });

  dragPreview(drop(ref));

  return (
    <div
      ref={ref}
      className={`bg-card rounded-lg border border-border overflow-hidden transition-opacity ${isDragging ? "opacity-50" : "opacity-100"}`}
    >
      {/* Category Header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-muted/30 border-b border-border">
        {isAdmin && (
          <div ref={drag as any} className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
            <GripVertical className="w-4 h-4" />
          </div>
        )}
        <button
          onClick={() => onToggleCollapse(catName)}
          className="flex items-center gap-2 flex-1 text-left"
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
          <span className="font-medium text-sm">{catName}</span>
          <span className="ml-1 px-2 py-0.5 bg-secondary text-secondary-foreground rounded-full text-xs">
            {allCategoryIngredients.length}
          </span>
        </button>
      </div>

      {/* Category Body */}
      {!isCollapsed && (
        <>
          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/20">
                <tr>
                  {isAdmin && <th className="w-8 py-2 px-3" />}
                  <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Code</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Name</th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">Stock</th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">Value</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {ingredients.map((item, idx) => (
                  <DraggableIngredientRow
                    key={item.id}
                    item={item}
                    index={idx}
                    categoryName={catName}
                    isAdmin={isAdmin}
                    canEdit={canEdit}
                    canAdjust={canAdjust}
                    canDelete={canDelete}
                    onMoveIngredient={onMoveIngredient}
                    onDropIngredient={onDropIngredient}
                    onEditIngredient={onEditIngredient}
                    onAdjustIngredient={onAdjustIngredient}
                    onDeleteIngredient={onDeleteIngredient}
                  />
                ))}
              </tbody>
            </table>
            {ingredients.length === 0 && (
              <div className="py-6 text-center text-xs text-muted-foreground">No items in this category</div>
            )}
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden divide-y divide-border">
            {ingredients.map((item, idx) => (
              <DraggableMobileIngredientCard
                key={item.id}
                item={item}
                index={idx}
                categoryName={catName}
                isAdmin={isAdmin}
                canEdit={canEdit}
                canAdjust={canAdjust}
                canDelete={canDelete}
                onMoveIngredient={onMoveIngredient}
                onDropIngredient={onDropIngredient}
                onEditIngredient={onEditIngredient}
                onAdjustIngredient={onAdjustIngredient}
                onDeleteIngredient={onDeleteIngredient}
              />
            ))}
            {ingredients.length === 0 && (
              <div className="p-6 text-center text-xs text-muted-foreground">No items in this category</div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

const INGREDIENT_DND_TYPE_PREFIX = "INGREDIENT_ROW_";

function DraggableMobileIngredientCard({
  item,
  index,
  categoryName,
  isAdmin,
  canEdit,
  canAdjust,
  canDelete,
  onMoveIngredient,
  onDropIngredient,
  onEditIngredient,
  onAdjustIngredient,
  onDeleteIngredient,
}: {
  item: Ingredient;
  index: number;
  categoryName: string;
  isAdmin: boolean;
  canEdit: boolean;
  canAdjust: boolean;
  canDelete: boolean;
  onMoveIngredient: (catName: string, dragIdx: number, hoverIdx: number) => void;
  onDropIngredient: (updatedList: Ingredient[]) => void;
  onEditIngredient: (item: Ingredient) => void;
  onAdjustIngredient: (item: Ingredient) => void;
  onDeleteIngredient: (item: Ingredient) => void;
}) {
  const dndType = INGREDIENT_DND_TYPE_PREFIX + categoryName;
  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag, dragPreview] = useDrag({
    type: dndType,
    item: { index },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
    canDrag: isAdmin,
  });

  const [, drop] = useDrop<{ index: number }, void, {}>({
    accept: dndType,
    hover(dragItem, monitor) {
      if (!ref.current) return;
      const dragIndex = dragItem.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) return;
      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;
      onMoveIngredient(categoryName, dragIndex, hoverIndex);
      dragItem.index = hoverIndex;
    },
  });

  dragPreview(drop(ref));

  const isLowStock = item.stock < item.minStockLevel;
  const needsReorder = item.stock <= item.reorderPoint;
  const totalValue = (Number(item.stock) || 0) * (Number(item.costPerUnit) || 0);

  return (
    <div
      ref={ref}
      className={`p-3 transition-opacity ${isDragging ? "opacity-40" : "opacity-100"}`}
    >
      <div className="flex items-start justify-between mb-2">
        {isAdmin && (
          <div ref={drag as any} className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground mr-2 mt-0.5 touch-none">
            <GripVertical className="w-4 h-4" />
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{item.name}</span>
            {isLowStock ? (
              <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-xs flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Critical
              </span>
            ) : needsReorder ? (
              <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded text-xs">Reorder</span>
            ) : (
              <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-xs">Normal</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground font-mono">{item.code}</p>
        </div>
        <div className="flex gap-1 ml-2">
          {canEdit && (
            <button onClick={() => onEditIngredient(item)} className="p-1.5 hover:bg-blue-100 rounded text-blue-600">
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}
          {canAdjust && (
            <button onClick={() => onAdjustIngredient(item)} className="p-1.5 hover:bg-accent rounded">
              <Plus className="w-3.5 h-3.5" />
            </button>
          )}
          {canDelete && (
            <button onClick={() => onDeleteIngredient(item)} className="p-1.5 hover:bg-red-100 rounded text-red-600">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
      <div className={`flex gap-4 text-xs ${isAdmin ? "pl-6" : ""}`}>
        <div>
          <span className="text-muted-foreground">Stock: </span>
          <span className="font-medium text-primary">{item.stock} {item.unit}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Value: </span>
          <span className="font-medium text-green-600">₱{totalValue.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}

function DraggableIngredientRow({
  item,
  index,
  categoryName,
  isAdmin,
  canEdit,
  canAdjust,
  canDelete,
  onMoveIngredient,
  onDropIngredient,
  onEditIngredient,
  onAdjustIngredient,
  onDeleteIngredient,
}: {
  item: Ingredient;
  index: number;
  categoryName: string;
  isAdmin: boolean;
  canEdit: boolean;
  canAdjust: boolean;
  canDelete: boolean;
  onMoveIngredient: (catName: string, dragIdx: number, hoverIdx: number) => void;
  onDropIngredient: (updatedList: Ingredient[]) => void;
  onEditIngredient: (item: Ingredient) => void;
  onAdjustIngredient: (item: Ingredient) => void;
  onDeleteIngredient: (item: Ingredient) => void;
}) {
  const dndType = INGREDIENT_DND_TYPE_PREFIX + categoryName;
  const ref = useRef<HTMLTableRowElement>(null);

  const [{ isDragging }, drag, dragPreview] = useDrag({
    type: dndType,
    item: { index },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
    canDrag: isAdmin,
  });

  const [, drop] = useDrop<{ index: number }, void, {}>({
    accept: dndType,
    hover(dragItem, monitor) {
      if (!ref.current) return;
      const dragIndex = dragItem.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) return;
      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;
      onMoveIngredient(categoryName, dragIndex, hoverIndex);
      dragItem.index = hoverIndex;
    },
  });

  dragPreview(drop(ref));

  const isLowStock = item.stock < item.minStockLevel;
  const needsReorder = item.stock <= item.reorderPoint;
  const totalValue = (Number(item.stock) || 0) * (Number(item.costPerUnit) || 0);

  return (
    <tr
      ref={ref}
      className={`border-b border-border hover:bg-muted/30 transition-opacity ${isDragging ? "opacity-40" : "opacity-100"}`}
    >
      {isAdmin && (
        <td className="py-2 px-3 w-8">
          <div ref={drag as any} className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
            <GripVertical className="w-3.5 h-3.5" />
          </div>
        </td>
      )}
      <td className="py-2 px-3 text-xs font-mono text-muted-foreground">{item.code}</td>
      <td className="py-2 px-3">
        <p className="text-sm font-medium">{item.name}</p>
        {item.supplier && <p className="text-xs text-muted-foreground">{item.supplier}</p>}
      </td>
      <td className="py-2 px-3 text-right text-sm font-medium text-primary">
        {item.stock} {item.unit}
      </td>
      <td className="py-2 px-3 text-right text-sm">
        ₱{totalValue.toFixed(2)}
      </td>
      <td className="py-2 px-3">
        {isLowStock ? (
          <span className="flex items-center gap-1 text-red-600 text-xs">
            <AlertTriangle className="w-3.5 h-3.5" /> Critical
          </span>
        ) : needsReorder ? (
          <span className="text-orange-600 text-xs">Reorder</span>
        ) : (
          <span className="text-green-600 text-xs">Normal</span>
        )}
      </td>
      <td className="py-2 px-3">
        <div className="flex gap-1">
          {canEdit && (
            <button
              onClick={() => onEditIngredient(item)}
              className="p-1.5 hover:bg-blue-100 rounded text-blue-600"
              title="Edit"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}
          {canAdjust && (
            <button
              onClick={() => onAdjustIngredient(item)}
              className="p-1.5 hover:bg-accent rounded"
              title="Adjust Stock"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => onDeleteIngredient(item)}
              className="p-1.5 hover:bg-red-100 rounded text-red-600"
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

