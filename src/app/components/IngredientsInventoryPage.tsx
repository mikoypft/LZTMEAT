import { useState, useContext, useEffect } from 'react';
import { Package, AlertTriangle, TrendingUp, Search, Filter, Plus, Minus, Download, RotateCcw, X, Save, Trash2 } from 'lucide-react';
import { IngredientsContext, Ingredient } from '@/app/context/IngredientsContext';
import { addIngredient, updateIngredient, deleteIngredient, resetIngredients, getSuppliers, type Supplier } from '@/utils/api';
import { toast } from 'sonner';

export function IngredientsInventoryPage() {
  const context = useContext(IngredientsContext);
  
  // Safety check for context
  if (!context) {
    return (
      <div className="h-full flex items-center justify-center">
        <p>Loading ingredients inventory...</p>
      </div>
    );
  }
  
  const { ingredients, adjustStock, setIngredients } = context;
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [showAddIngredientModal, setShowAddIngredientModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  // Load suppliers from database
  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      const suppliersData = await getSuppliers();
      setSuppliers(suppliersData);
    } catch (error) {
      console.error('Error loading suppliers:', error);
      toast.error('Failed to load suppliers');
    }
  };

  const categories = ['All', ...Array.from(new Set(ingredients.map(item => item.category)))];

  const filteredIngredients = ingredients.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const lowStockItems = ingredients.filter(item => item.stock < item.minStockLevel);
  const reorderItems = ingredients.filter(item => item.stock <= item.reorderPoint);
  const totalItems = ingredients.length;
  const totalValue = ingredients.reduce((sum, item) => sum + (item.stock * item.costPerUnit), 0);

  // Stock Adjustment Function
  const handleStockAdjustment = async (adjustment: {
    quantity: number;
    type: 'add' | 'remove';
    reason: string;
  }) => {
    if (!selectedIngredient) return;

    try {
      await adjustStock(selectedIngredient.id, adjustment.quantity, adjustment.type, adjustment.reason);
      
      const ingredient = ingredients.find(i => i.id === selectedIngredient.id);
      if (ingredient) {
        const delta = adjustment.type === 'add' ? adjustment.quantity : -adjustment.quantity;
        const newStock = Math.max(0, ingredient.stock + delta);
        
        await updateIngredient(selectedIngredient.id, {
          stock: newStock,
          lastUpdated: new Date().toISOString()
        });
        
        toast.success('Stock adjusted successfully');
      }

      setShowAdjustmentModal(false);
      setSelectedIngredient(null);
    } catch (error) {
      console.error('Error adjusting stock:', error);
      toast.error('Failed to adjust stock');
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
      console.log(`Attempting to delete ingredient ID: "${selectedIngredient.id}" (type: ${typeof selectedIngredient.id})`);
      console.log(`Ingredient name: ${selectedIngredient.name}`);
      
      await deleteIngredient(selectedIngredient.id);
      
      // Remove from local state
      setIngredients(ingredients.filter(i => i.id !== selectedIngredient.id));
      toast.success(`Ingredient "${selectedIngredient.name}" deleted successfully`);
      setShowDeleteConfirm(false);
      setSelectedIngredient(null);
    } catch (error) {
      console.error('Error deleting ingredient:', error);
      toast.error('Failed to delete ingredient');
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
      toast.success('Ingredients reset successfully');
    } catch (error) {
      console.error('Error resetting ingredients:', error);
      toast.error('Failed to reset ingredients');
    } finally {
      setIsResetting(false);
      setShowResetConfirm(false);
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Code', 'Ingredient Name', 'Category', 'Stock', 'Unit', 'Cost/Unit', 'Total Value', 'Supplier', 'Expiry Date'];
    const rows = ingredients.map(item => [
      item.code,
      item.name,
      item.category,
      item.stock,
      item.unit,
      item.costPerUnit.toFixed(2),
      (item.stock * item.costPerUnit).toFixed(2),
      item.supplier,
      item.expiryDate || 'N/A'
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ingredients-inventory-${new Date().toISOString().split('T')[0]}.csv`;
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
            <p className="text-2xl lg:text-3xl text-primary mb-1">{totalItems}</p>
            <p className="text-xs lg:text-sm text-muted-foreground">Total Ingredients</p>
          </div>

          <div className="bg-card rounded-lg p-4 lg:p-6 border border-border">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-green-100 p-2 lg:p-3 rounded-lg">
                <TrendingUp className="w-5 h-5 lg:w-6 lg:h-6 text-green-600" />
              </div>
            </div>
            <p className="text-2xl lg:text-3xl text-green-600 mb-1">₱{totalValue.toFixed(2)}</p>
            <p className="text-xs lg:text-sm text-muted-foreground">Inventory Value</p>
          </div>

          <div className="bg-card rounded-lg p-4 lg:p-6 border border-border">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-red-100 p-2 lg:p-3 rounded-lg">
                <AlertTriangle className="w-5 h-5 lg:w-6 lg:h-6 text-red-600" />
              </div>
            </div>
            <p className="text-2xl lg:text-3xl text-red-600 mb-1">{lowStockItems.length}</p>
            <p className="text-xs lg:text-sm text-muted-foreground">Low Stock Alerts</p>
          </div>

          <div className="bg-card rounded-lg p-4 lg:p-6 border border-border">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-orange-100 p-2 lg:p-3 rounded-lg">
                <AlertTriangle className="w-5 h-5 lg:w-6 lg:h-6 text-orange-600" />
              </div>
            </div>
            <p className="text-2xl lg:text-3xl text-orange-600 mb-1">{reorderItems.length}</p>
            <p className="text-xs lg:text-sm text-muted-foreground">Need Reorder</p>
          </div>
        </div>

        {/* Search, Filters and Actions */}
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
              <button
                onClick={() => setShowAddIngredientModal(true)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </button>
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

          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Filter by:</span>
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Low Stock Alerts */}
        {lowStockItems.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 lg:p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <h3 className="text-red-900 font-medium">Critical Low Stock Alerts</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {lowStockItems.map(item => (
                <div key={item.id} className="bg-background rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.code}</p>
                    </div>
                    <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">
                      CRITICAL
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">Current:</p>
                      <p className="text-red-600 font-medium">{item.stock} {item.unit}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Min Level:</p>
                      <p className="font-medium">{item.minStockLevel} {item.unit}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Desktop Table View - Hidden on Mobile */}
        <div className="hidden lg:block bg-card rounded-lg border border-border">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium">Code</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">Ingredient Name</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">Category</th>
                  <th className="text-right py-3 px-4 text-sm font-medium">Stock</th>
                  <th className="text-right py-3 px-4 text-sm font-medium">Value</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredIngredients.map(item => {
                  const isLowStock = item.stock < item.minStockLevel;
                  const needsReorder = item.stock <= item.reorderPoint;
                  const totalValue = item.stock * item.costPerUnit;
                  
                  return (
                    <tr key={item.id} className="border-b border-border hover:bg-muted/50">
                      <td className="py-3 px-4 text-sm font-mono">{item.code}</td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-sm font-medium">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.supplier}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-xs">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-primary font-medium text-sm">
                        {item.stock} {item.unit}
                      </td>
                      <td className="py-3 px-4 text-right text-sm">
                        ₱{totalValue.toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        {isLowStock ? (
                          <span className="flex items-center gap-1 text-red-600 text-xs">
                            <AlertTriangle className="w-4 h-4" />
                            Critical
                          </span>
                        ) : needsReorder ? (
                          <span className="text-orange-600 text-xs">Reorder</span>
                        ) : (
                          <span className="text-green-600 text-xs">Normal</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1">
                          <button
                            onClick={() => {
                              setSelectedIngredient(item);
                              setShowAdjustmentModal(true);
                            }}
                            className="p-1.5 hover:bg-accent rounded"
                            title="Adjust Stock"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedIngredient(item);
                              setShowDeleteConfirm(true);
                            }}
                            className="p-1.5 hover:bg-red-100 rounded text-red-600"
                            title="Delete Ingredient"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredIngredients.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">
              <p>No ingredients found</p>
            </div>
          )}
        </div>

        {/* Mobile Card View - Shown on Mobile/Tablet */}
        <div className="lg:hidden space-y-3">
          {filteredIngredients.map(item => {
            const isLowStock = item.stock < item.minStockLevel;
            const needsReorder = item.stock <= item.reorderPoint;
            const totalValue = item.stock * item.costPerUnit;
            
            return (
              <div key={item.id} className="bg-card rounded-lg border border-border p-4">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">{item.name}</h3>
                      {isLowStock ? (
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Critical
                        </span>
                      ) : needsReorder ? (
                        <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs">Reorder</span>
                      ) : (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">Normal</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground font-mono">{item.code}</p>
                    <p className="text-xs text-muted-foreground">{item.supplier}</p>
                  </div>
                  <span className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-xs">
                    {item.category}
                  </span>
                </div>

                {/* Stock Info */}
                <div className="flex items-center justify-between mb-3 pb-3 border-b border-border">
                  <div>
                    <p className="text-xs text-muted-foreground">Stock</p>
                    <p className="text-lg font-bold text-primary">{item.stock} {item.unit}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Total Value</p>
                    <p className="text-lg font-bold text-green-600">₱{totalValue.toFixed(2)}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedIngredient(item);
                      setShowAdjustmentModal(true);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground px-3 py-2 rounded-lg hover:bg-primary/90 transition-colors text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Adjust Stock
                  </button>
                  <button
                    onClick={() => {
                      setSelectedIngredient(item);
                      setShowDeleteConfirm(true);
                    }}
                    className="flex items-center justify-center gap-2 bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}

          {filteredIngredients.length === 0 && (
            <div className="bg-card rounded-lg border border-border p-12 text-center text-muted-foreground">
              <p>No ingredients found</p>
            </div>
          )}
        </div>

        {/* Category Summary Widgets */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.filter(cat => cat !== 'All').map(category => {
            const categoryItems = ingredients.filter(item => item.category === category);
            const categoryValue = categoryItems.reduce((sum, item) => sum + (item.stock * item.costPerUnit), 0);
            const categoryStock = categoryItems.reduce((sum, item) => sum + item.stock, 0);
            
            return (
              <div key={category} className="bg-card rounded-lg p-4 border border-border">
                <h3 className="text-sm font-medium mb-3">{category}</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Items:</span>
                    <span className="font-medium">{categoryItems.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Stock:</span>
                    <span className="font-medium">{categoryStock.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Value:</span>
                    <span className="text-primary font-medium">₱{categoryValue.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
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
              toast.success(`Ingredient "${ingredient.name}" added successfully`);
              setShowAddIngredientModal(false);
            } catch (error) {
              console.error('Error adding ingredient:', error);
              toast.error('Failed to add ingredient');
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedIngredient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4 text-red-600">
              <AlertTriangle className="w-6 h-6" />
              <h2 className="text-lg font-semibold">Delete Ingredient</h2>
            </div>
            
            <p className="text-sm mb-6">
              Are you sure you want to delete <strong>{selectedIngredient.name}</strong> ({selectedIngredient.code})? 
              This action cannot be undone.
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
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4 text-red-600">
              <AlertTriangle className="w-6 h-6" />
              <h2 className="text-lg font-semibold">Reset Ingredients</h2>
            </div>
            
            <p className="text-sm mb-6">
              Are you sure you want to reset all ingredients to default values? 
              This action cannot be undone.
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
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <RotateCcw className="w-4 h-4" />
                {isResetting ? 'Resetting...' : 'Reset'}
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
  const [quantity, setQuantity] = useState(0);
  const [type, setType] = useState<'add' | 'remove'>('add');
  const [reason, setReason] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity <= 0 || !reason) {
      alert('Please enter quantity and reason');
      return;
    }
    setIsAdjusting(true);
    onAdjust({ quantity, type, reason });
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
            <p className="text-2xl font-bold text-primary">{ingredient.stock} {ingredient.unit}</p>
          </div>

          <div>
            <label className="block text-sm mb-2">Type</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setType('add')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border transition-colors ${
                  type === 'add' 
                    ? 'bg-green-600 text-white border-green-600' 
                    : 'border-border hover:bg-accent'
                }`}
              >
                <Plus className="w-4 h-4" />
                Add Stock
              </button>
              <button
                type="button"
                onClick={() => setType('remove')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border transition-colors ${
                  type === 'remove' 
                    ? 'bg-red-600 text-white border-red-600' 
                    : 'border-border hover:bg-accent'
                }`}
              >
                <Minus className="w-4 h-4" />
                Remove Stock
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm mb-2">Quantity ({ingredient.unit})</label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={quantity}
              onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
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
              {isAdjusting ? 'Adjusting...' : 'Apply Adjustment'}
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
}: {
  onAdd: (newIng: any) => void;
  onClose: () => void;
  isAdding: boolean;
  suppliers: Supplier[];
  ingredients: Ingredient[];
}) {
  // Auto-generate incremental code
  const generateNextCode = () => {
    if (ingredients.length === 0) return 'ING-001';
    
    // Extract numbers from existing codes
    const numbers = ingredients
      .map(ing => {
        const match = ing.code.match(/ING-(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter(num => num > 0);
    
    // Get the highest number
    const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
    const nextNumber = maxNumber + 1;
    
    // Format with leading zeros
    return `ING-${String(nextNumber).padStart(3, '0')}`;
  };

  const [name, setName] = useState('');
  const [code] = useState(generateNextCode());
  const [category, setCategory] = useState('');
  const [unit, setUnit] = useState('');
  const [costPerUnit, setCostPerUnit] = useState(0);
  const [minStockLevel, setMinStockLevel] = useState(0);
  const [reorderPoint, setReorderPoint] = useState(0);
  const [supplier, setSupplier] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !category || !unit || costPerUnit <= 0 || minStockLevel <= 0 || reorderPoint <= 0 || !supplier) {
      alert('Please fill in all required fields');
      return;
    }
    const newIngredient = {
      name,
      code,
      category,
      unit,
      costPerUnit,
      minStockLevel,
      reorderPoint,
      supplier,
      expiryDate: expiryDate || null,
      stock: 0,
      lastUpdated: new Date().toISOString()
    };
    onAdd(newIngredient);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Add New Ingredient</h2>
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
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g., Raw Meat, Seasonings"
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
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
                onChange={(e) => setCostPerUnit(parseFloat(e.target.value) || 0)}
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
                onChange={(e) => setMinStockLevel(parseFloat(e.target.value) || 0)}
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
                onChange={(e) => setReorderPoint(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm mb-2">Supplier *</label>
            <select
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            >
              <option value="">Select Supplier</option>
              {suppliers.map(sup => (
                <option key={sup.id} value={sup.name}>{sup.name}</option>
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
              {isAdding ? 'Adding...' : 'Add Ingredient'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}