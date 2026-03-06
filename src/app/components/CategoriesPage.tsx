import { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  Tag,
  Search,
  RefreshCw,
  Package,
  Beef,
  Edit2,
} from "lucide-react";
import { toast } from "sonner";
import {
  getCategories,
  addCategory,
  deleteCategory,
  updateCategory,
  getIngredientCategories,
  addIngredientCategory,
  deleteIngredientCategory,
  updateIngredientCategory,
  getProductMixCategories,
  addProductMixCategory,
  deleteProductMixCategory,
  updateProductMixCategory,
  getProductMixItems,
  addProductToMix,
  deleteProductMixItem,
  getProducts,
  getProductMixCategoryDefaultIngredients,
  saveProductMixCategoryDefaultIngredients,
  getIngredients,
  type Category,
  type ProductMixItem,
  type Product,
  type Ingredient,
  type DefaultIngredient,
} from "@/utils/api";

export function CategoriesPage({ userRole }: { userRole?: string }) {
  const isAdmin = userRole === "ADMIN";
  const [productCategories, setProductCategories] = useState<Category[]>([]);
  const [ingredientCategories, setIngredientCategories] = useState<Category[]>(
    [],
  );
  const [productMixCategories, setProductMixCategories] = useState<Category[]>(
    [],
  );
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingIngredients, setLoadingIngredients] = useState(true);
  const [loadingProductMix, setLoadingProductMix] = useState(true);
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [ingredientSearchTerm, setIngredientSearchTerm] = useState("");
  const [productMixSearchTerm, setProductMixSearchTerm] = useState("");
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showAddIngredientModal, setShowAddIngredientModal] = useState(false);
  const [showAddProductMixModal, setShowAddProductMixModal] = useState(false);
  const [editingProductCategory, setEditingProductCategory] =
    useState<Category | null>(null);
  const [editingIngredientCategory, setEditingIngredientCategory] =
    useState<Category | null>(null);
  const [editingProductMixCategory, setEditingProductMixCategory] =
    useState<Category | null>(null);

  useEffect(() => {
    loadProductCategories();
    loadIngredientCategories();
    loadProductMixCategories();
  }, []);

  const loadProductCategories = async () => {
    try {
      setLoadingProducts(true);
      const data = await getCategories();
      setProductCategories(data);
    } catch (error) {
      console.error("Error loading product categories:", error);
      toast.error("Failed to load product categories");
    } finally {
      setLoadingProducts(false);
    }
  };

  const loadIngredientCategories = async () => {
    try {
      setLoadingIngredients(true);
      const data = await getIngredientCategories();
      setIngredientCategories(data);
    } catch (error) {
      console.error("Error loading ingredient categories:", error);
      toast.error("Failed to load ingredient categories");
    } finally {
      setLoadingIngredients(false);
    }
  };

  const loadProductMixCategories = async () => {
    try {
      setLoadingProductMix(true);
      const data = await getProductMixCategories();
      setProductMixCategories(data);
    } catch (error) {
      console.error("Error loading product mix categories:", error);
      // Silently fail if table doesn't exist yet - just show empty state
      setProductMixCategories([]);
    } finally {
      setLoadingProductMix(false);
    }
  };

  const handleDeleteProductCategory = async (id: string, name: string) => {
    if (
      !confirm(
        `Are you sure you want to delete the product category "${name}"?`,
      )
    ) {
      return;
    }

    try {
      await deleteCategory(id);
      toast.success("Product category deleted successfully");
      loadProductCategories();
    } catch (error: any) {
      console.error("Error deleting category:", error);
      toast.error(error.message || "Failed to delete category");
    }
  };

  const handleDeleteIngredientCategory = async (id: string, name: string) => {
    if (
      !confirm(
        `Are you sure you want to delete the ingredient category "${name}"?`,
      )
    ) {
      return;
    }

    try {
      await deleteIngredientCategory(id);
      toast.success("Ingredient category deleted successfully");
      loadIngredientCategories();
    } catch (error: any) {
      console.error("Error deleting category:", error);
      toast.error(error.message || "Failed to delete category");
    }
  };

  const handleEditProductCategory = (category: Category) => {
    setEditingProductCategory(category);
  };

  const handleEditIngredientCategory = (category: Category) => {
    setEditingIngredientCategory(category);
  };

  const handleDeleteProductMixCategory = async (id: string, name: string) => {
    if (
      !confirm(
        `Are you sure you want to delete the product mix category "${name}"?`,
      )
    ) {
      return;
    }

    try {
      await deleteProductMixCategory(id);
      toast.success("Product mix category deleted successfully");
      loadProductMixCategories();
    } catch (error: any) {
      console.error("Error deleting category:", error);
      toast.error(error.message || "Failed to delete category");
    }
  };

  const handleEditProductMixCategory = (category: Category) => {
    setEditingProductMixCategory(category);
  };

  const filteredProductCategories = productCategories.filter(
    (cat) =>
      cat.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
      cat.description?.toLowerCase().includes(productSearchTerm.toLowerCase()),
  );

  const filteredIngredientCategories = ingredientCategories.filter(
    (cat) =>
      cat.name.toLowerCase().includes(ingredientSearchTerm.toLowerCase()) ||
      cat.description
        ?.toLowerCase()
        .includes(ingredientSearchTerm.toLowerCase()),
  );

  const filteredProductMixCategories = productMixCategories.filter(
    (cat) =>
      cat.name.toLowerCase().includes(productMixSearchTerm.toLowerCase()) ||
      cat.description
        ?.toLowerCase()
        .includes(productMixSearchTerm.toLowerCase()),
  );

  return (
    <div className="h-full overflow-auto bg-muted/30">
      <div className="container mx-auto p-4 lg:p-6 space-y-4 lg:space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl mb-1">Categories</h1>
            <p className="text-muted-foreground text-sm md:text-base">
              Manage categories for ingredients and products
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                loadIngredientCategories();
                loadProductCategories();
                loadProductMixCategories();
              }}
              className="flex items-center gap-2 bg-card border border-border text-foreground px-4 py-2 rounded-lg hover:bg-muted transition-colors text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Refresh All</span>
            </button>
          </div>
        </div>

        {/* Three Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Ingredient Categories - Left */}
          <div className="bg-card rounded-lg border border-border">
            <div className="p-4 lg:p-6 border-b border-border">
              <div className="flex items-center justify-between mb-4">
                <h2 className="flex items-center gap-2 text-lg font-semibold">
                  <Beef className="w-5 h-5 text-orange-600" />
                  Ingredient Categories ({ingredientCategories.length})
                </h2>
                {isAdmin && (
                  <button
                    onClick={() => setShowAddIngredientModal(true)}
                    className="flex items-center gap-2 bg-orange-600 text-white px-3 py-1.5 rounded-lg hover:bg-orange-700 transition-colors text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Add
                  </button>
                )}
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search ingredient categories..."
                  value={ingredientSearchTerm}
                  onChange={(e) => setIngredientSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                />
              </div>
            </div>

            {loadingIngredients ? (
              <div className="p-8 text-center">
                <RefreshCw className="w-6 h-6 text-orange-600 animate-spin mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">Loading...</p>
              </div>
            ) : filteredIngredientCategories.length === 0 ? (
              <div className="p-8 text-center">
                <Beef className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground text-sm mb-3">
                  {ingredientSearchTerm
                    ? "No matching categories"
                    : "No ingredient categories yet"}
                </p>
                {!ingredientSearchTerm && isAdmin && (
                  <button
                    onClick={() => setShowAddIngredientModal(true)}
                    className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors text-sm"
                  >
                    Add First Category
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-border max-h-96 overflow-y-auto">
                {filteredIngredientCategories.map((category) => (
                  <div
                    key={category.id}
                    className="p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Tag className="w-4 h-4 text-orange-600 flex-shrink-0" />
                          <h3 className="font-medium truncate">
                            {category.name}
                          </h3>
                        </div>
                        {category.description && (
                          <p className="text-xs text-muted-foreground truncate">
                            {category.description}
                          </p>
                        )}
                      </div>

                      {isAdmin && (
                        <div className="flex gap-2 flex-shrink-0">
                          <button
                            onClick={() =>
                              handleEditIngredientCategory(category)
                            }
                            className="flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100 transition-colors text-xs"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() =>
                              handleDeleteIngredientCategory(
                                category.id,
                                category.name,
                              )
                            }
                            className="flex items-center gap-1 bg-red-50 text-red-600 px-2 py-1 rounded hover:bg-red-100 transition-colors text-xs"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Categories - Right */}
          <div className="bg-card rounded-lg border border-border">
            <div className="p-4 lg:p-6 border-b border-border">
              <div className="flex items-center justify-between mb-4">
                <h2 className="flex items-center gap-2 text-lg font-semibold">
                  <Package className="w-5 h-5 text-blue-600" />
                  Product Categories ({productCategories.length})
                </h2>
                {isAdmin && (
                  <button
                    onClick={() => setShowAddProductModal(true)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Add
                  </button>
                )}
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search product categories..."
                  value={productSearchTerm}
                  onChange={(e) => setProductSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>

            {loadingProducts ? (
              <div className="p-8 text-center">
                <RefreshCw className="w-6 h-6 text-blue-600 animate-spin mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">Loading...</p>
              </div>
            ) : filteredProductCategories.length === 0 ? (
              <div className="p-8 text-center">
                <Package className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground text-sm mb-3">
                  {productSearchTerm
                    ? "No matching categories"
                    : "No product categories yet"}
                </p>
                {!productSearchTerm && isAdmin && (
                  <button
                    onClick={() => setShowAddProductModal(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    Add First Category
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-border max-h-96 overflow-y-auto">
                {filteredProductCategories.map((category) => (
                  <div
                    key={category.id}
                    className="p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Tag className="w-4 h-4 text-blue-600 flex-shrink-0" />
                          <h3 className="font-medium truncate">
                            {category.name}
                          </h3>
                        </div>
                        {category.description && (
                          <p className="text-xs text-muted-foreground truncate">
                            {category.description}
                          </p>
                        )}
                      </div>

                      {isAdmin && (
                        <div className="flex gap-2 flex-shrink-0">
                          <button
                            onClick={() => handleEditProductCategory(category)}
                            className="flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100 transition-colors text-xs"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() =>
                              handleDeleteProductCategory(
                                category.id,
                                category.name,
                              )
                            }
                            className="flex items-center gap-1 bg-red-50 text-red-600 px-2 py-1 rounded hover:bg-red-100 transition-colors text-xs"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Mix Categories */}
          <div className="bg-card rounded-lg border border-border">
            <div className="p-4 lg:p-6 border-b border-border">
              <div className="flex items-center justify-between mb-4">
                <h2 className="flex items-center gap-2 text-lg font-semibold">
                  <Tag className="w-5 h-5 text-purple-600" />
                  Product Mix Categories ({productMixCategories.length})
                </h2>
                {isAdmin && (
                  <button
                    onClick={() => setShowAddProductMixModal(true)}
                    className="flex items-center gap-2 bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 transition-colors text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Add
                  </button>
                )}
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search product mix categories..."
                  value={productMixSearchTerm}
                  onChange={(e) => setProductMixSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                />
              </div>
            </div>

            {loadingProductMix ? (
              <div className="p-8 text-center">
                <RefreshCw className="w-6 h-6 text-purple-600 animate-spin mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">Loading...</p>
              </div>
            ) : filteredProductMixCategories.length === 0 ? (
              <div className="p-8 text-center">
                <Tag className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground text-sm mb-3">
                  {productMixSearchTerm
                    ? "No matching categories"
                    : "No product mix categories yet"}
                </p>
                {!productMixSearchTerm && isAdmin && (
                  <button
                    onClick={() => setShowAddProductMixModal(true)}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm"
                  >
                    Add First Category
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-border max-h-96 overflow-y-auto">
                {filteredProductMixCategories.map((category) => (
                  <div
                    key={category.id}
                    className="p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Tag className="w-4 h-4 text-purple-600 flex-shrink-0" />
                          <h3 className="font-medium truncate">
                            {category.name}
                          </h3>
                        </div>
                        {category.description && (
                          <p className="text-xs text-muted-foreground truncate">
                            {category.description}
                          </p>
                        )}
                      </div>

                      {isAdmin && (
                        <div className="flex gap-2 flex-shrink-0">
                          <button
                            onClick={() =>
                              handleEditProductMixCategory(category)
                            }
                            className="flex items-center gap-1 bg-purple-50 text-purple-600 px-2 py-1 rounded hover:bg-purple-100 transition-colors text-xs"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() =>
                              handleDeleteProductMixCategory(
                                category.id,
                                category.name,
                              )
                            }
                            className="flex items-center gap-1 bg-red-50 text-red-600 px-2 py-1 rounded hover:bg-red-100 transition-colors text-xs"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Ingredient Category Modal */}
      {(showAddIngredientModal || editingIngredientCategory) && (
        <AddCategoryModal
          type="ingredient"
          category={editingIngredientCategory}
          onClose={() => {
            setShowAddIngredientModal(false);
            setEditingIngredientCategory(null);
          }}
          onSuccess={() => {
            setShowAddIngredientModal(false);
            setEditingIngredientCategory(null);
            loadIngredientCategories();
          }}
        />
      )}

      {/* Add/Edit Product Category Modal */}
      {(showAddProductModal || editingProductCategory) && (
        <AddCategoryModal
          type="product"
          category={editingProductCategory}
          onClose={() => {
            setShowAddProductModal(false);
            setEditingProductCategory(null);
          }}
          onSuccess={() => {
            setShowAddProductModal(false);
            setEditingProductCategory(null);
            loadProductCategories();
          }}
        />
      )}

      {/* Add/Edit Product Mix Category Modal */}
      {(showAddProductMixModal || editingProductMixCategory) && (
        <AddCategoryModal
          key={editingProductMixCategory?.id || "new"}
          type="product-mix"
          category={editingProductMixCategory}
          onClose={() => {
            setShowAddProductMixModal(false);
            setEditingProductMixCategory(null);
          }}
          onSuccess={() => {
            setShowAddProductMixModal(false);
            setEditingProductMixCategory(null);
            loadProductMixCategories();
          }}
        />
      )}
    </div>
  );
}

function AddCategoryModal({
  type,
  category,
  onClose,
  onSuccess,
}: {
  type: "ingredient" | "product" | "product-mix";
  category?: Category | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: category?.name ?? "",
    description: category?.description ?? "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<ProductMixItem[]>(
    [],
  );
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [showProductList, setShowProductList] = useState(false);
  const [allIngredients, setAllIngredients] = useState<Ingredient[]>([]);
  const [defaultIngredients, setDefaultIngredients] = useState<
    Array<{ ingredientId: string }>
  >([]);
  const [loadingIngredients, setLoadingIngredients] = useState(false);
  const [showIngredientList, setShowIngredientList] = useState(false);

  const isIngredient = type === "ingredient";
  const isProductMix = type === "product-mix";
  const isEditing = !!category;

  // Load product data for product mix categories
  useEffect(() => {
    if (isProductMix) {
      loadProductData();
    }
  }, [isProductMix]);

  const loadProductData = async () => {
    setLoadingProducts(true);
    setLoadingIngredients(true);
    try {
      const [products, ingredients] = await Promise.all([
        getProducts(),
        getIngredients(),
      ]);
      setAvailableProducts(products);
      setAllIngredients(ingredients);

      if (category?.id) {
        const [items, defaults] = await Promise.all([
          getProductMixItems(category.id),
          getProductMixCategoryDefaultIngredients(category.id),
        ]);
        setSelectedProducts(items);
        setDefaultIngredients(
          defaults.length > 0
            ? defaults.map((d) => ({ ingredientId: d.ingredientId }))
            : [],
        );
      }
    } catch (error) {
      console.error("Error loading products:", error);
    } finally {
      setLoadingProducts(false);
      setLoadingIngredients(false);
    }
  };

  const handleAddProduct = async (product: Product) => {
    if (selectedProducts.some((p) => p.productId === product.id)) {
      toast.error("Product already added");
      return;
    }

    const newItem: ProductMixItem = {
      id: `temp-${Date.now()}`,
      productMixCategoryId: category?.id || "",
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      price: product.price,
      unit: product.unit,
      quantity: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setSelectedProducts([...selectedProducts, newItem]);
    setProductSearchTerm("");

    // If editing an existing category, save immediately to backend
    if (category?.id) {
      try {
        await addProductToMix(category.id, product.id);
        toast.success("Product added to mix");
      } catch (error: any) {
        console.error("Error adding product:", error);
        toast.error(error.message || "Failed to add product");
        // Remove from state if backend fails
        setSelectedProducts(selectedProducts);
      }
    }
  };

  const handleRemoveProduct = async (mixItemId: string, productId: string) => {
    setSelectedProducts(
      selectedProducts.filter((p) => p.productId !== productId),
    );

    // If editing an existing category, remove from backend immediately
    if (category?.id) {
      try {
        await deleteProductMixItem(mixItemId);
        toast.success("Product removed from mix");
      } catch (error) {
        console.error("Error removing product:", error);
        toast.error("Failed to remove product");
        // Reload to get correct state
        loadProductData();
      }
    }
  };

  const filteredProducts = availableProducts.filter(
    (p) =>
      !selectedProducts.some((sp) => sp.productId === p.id) &&
      p.name.toLowerCase().includes(productSearchTerm.toLowerCase()),
  );

  const addIngredientRow = () => {
    setDefaultIngredients([...defaultIngredients, { ingredientId: "" }]);
  };

  const removeIngredientRow = (index: number) => {
    setDefaultIngredients(defaultIngredients.filter((_, i) => i !== index));
  };

  const updateDefaultIngredient = (
    index: number,
    field: string,
    value: string,
  ) => {
    const updated = [...defaultIngredients];
    updated[index] = { ...updated[index], [field]: value };
    setDefaultIngredients(updated);
  };

  const saveDefaultIngredients = async (categoryId: string) => {
    try {
      const validIngredients = defaultIngredients.filter(
        (ing) => ing.ingredientId,
      );

      // Always call the API — even with an empty array — so deletions are persisted
      await saveProductMixCategoryDefaultIngredients(
        categoryId,
        validIngredients,
      );
    } catch (error) {
      console.error("Error saving default ingredients:", error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Category name is required");
      return;
    }

    if (isSubmitting) return;

    try {
      setIsSubmitting(true);

      if (isEditing) {
        if (isIngredient) {
          await updateIngredientCategory(category!.id, {
            name: formData.name.trim(),
            description: formData.description.trim(),
          });
        } else if (isProductMix) {
          await updateProductMixCategory(category!.id, {
            name: formData.name.trim(),
            description: formData.description.trim(),
          });
          // Save default ingredients for edited category
          await saveDefaultIngredients(category!.id);
        } else {
          await updateCategory(category!.id, {
            name: formData.name.trim(),
            description: formData.description.trim(),
          });
        }
        toast.success(
          `${isIngredient ? "Ingredient" : isProductMix ? "Product Mix" : "Product"} category updated successfully`,
        );
      } else {
        if (isIngredient) {
          await addIngredientCategory({
            name: formData.name.trim(),
            description: formData.description.trim(),
          });
        } else if (isProductMix) {
          const newCategory = await addProductMixCategory({
            name: formData.name.trim(),
            description: formData.description.trim(),
          });

          // Add products to the newly created mix
          if (selectedProducts.length > 0 && newCategory.id) {
            for (const product of selectedProducts) {
              try {
                await addProductToMix(newCategory.id, product.productId);
              } catch (error) {
                console.error("Error adding product to mix:", error);
              }
            }
          }

          // Save default ingredients for new category
          if (newCategory.id) {
            await saveDefaultIngredients(newCategory.id);
          }
        } else {
          await addCategory({
            name: formData.name.trim(),
            description: formData.description.trim(),
          });
        }
        toast.success(
          `${isIngredient ? "Ingredient" : isProductMix ? "Product Mix" : "Product"} category created successfully`,
        );
      }

      onSuccess();
    } catch (error: any) {
      console.error(
        isEditing ? "Error updating category:" : "Error creating category:",
        error,
      );
      toast.error(error.message || "Failed to save category");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        className={`bg-card rounded-lg w-full border border-border max-h-[90vh] overflow-y-auto ${isProductMix ? "max-w-2xl" : "max-w-md"}`}
      >
        <div
          className={`p-6 border-b border-border ${isIngredient ? "bg-orange-50" : isProductMix ? "bg-purple-50" : "bg-blue-50"}`}
        >
          <h2
            className={`text-xl font-semibold flex items-center gap-2 ${isIngredient ? "text-orange-700" : isProductMix ? "text-purple-700" : "text-blue-700"}`}
          >
            {isIngredient ? (
              <Beef className="w-5 h-5" />
            ) : isProductMix ? (
              <Tag className="w-5 h-5" />
            ) : (
              <Package className="w-5 h-5" />
            )}
            {isEditing ? "Edit" : "Add"}{" "}
            {isIngredient
              ? "Ingredient"
              : isProductMix
                ? "Product Mix"
                : "Product"}{" "}
            Category
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Category Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder={
                isIngredient
                  ? "e.g., Beef, Pork, Seasonings"
                  : isProductMix
                    ? "e.g., Combo Packs, Mixed Boxes"
                    : "e.g., Fresh Sausages, Smoked Meats"
              }
              className={`w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 ${isIngredient ? "focus:ring-orange-500" : isProductMix ? "focus:ring-purple-500" : "focus:ring-blue-500"}`}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Description (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Brief description of this category"
              rows={3}
              className={`w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 resize-none ${isIngredient ? "focus:ring-orange-500" : isProductMix ? "focus:ring-purple-500" : "focus:ring-blue-500"}`}
            />
          </div>

          {/* Product Selection for Product Mix */}
          {isProductMix && (
            <div className="border-t border-border pt-4">
              <label className="block text-sm font-medium mb-2">
                Products in Mix ({selectedProducts.length})
              </label>

              {loadingProducts ? (
                <div className="text-center py-4">
                  <RefreshCw className="w-5 h-5 animate-spin text-purple-600 mx-auto" />
                </div>
              ) : (
                <>
                  {/* Selected Products */}
                  {selectedProducts.length > 0 && (
                    <div className="space-y-1.5 mb-3 max-h-32 overflow-y-auto">
                      {selectedProducts.map((item) => (
                        <div
                          key={item.productId}
                          className="flex items-center justify-between p-2 bg-purple-50 rounded border border-purple-200"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {item.productName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {item.sku}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              handleRemoveProduct(item.id, item.productId)
                            }
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Products Button */}
                  <button
                    type="button"
                    onClick={() => setShowProductList(!showProductList)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    {showProductList ? "Hide Products" : "Add Products"}
                  </button>

                  {/* Product List */}
                  {showProductList && (
                    <div className="mt-3 space-y-2">
                      <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          type="text"
                          placeholder="Search products..."
                          value={productSearchTerm}
                          onChange={(e) => setProductSearchTerm(e.target.value)}
                          className="w-full pl-8 pr-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                        />
                      </div>

                      <div className="max-h-48 overflow-y-auto space-y-1.5">
                        {filteredProducts.length === 0 ? (
                          <p className="text-center text-xs text-muted-foreground py-3">
                            {productSearchTerm
                              ? "No matching products"
                              : "All products added"}
                          </p>
                        ) : (
                          filteredProducts.map((product) => (
                            <div
                              key={product.id}
                              className="flex items-center justify-between p-2 bg-card border border-border rounded hover:border-purple-300 transition-colors"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {product.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {product.sku} • {product.category}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleAddProduct(product)}
                                className="flex items-center gap-1 text-xs bg-purple-600 text-white px-2 py-1 rounded hover:bg-purple-700 transition-colors"
                              >
                                <Plus className="w-3 h-3" />
                                Add
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Default Ingredients Section for Product Mix */}
          {isProductMix && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-purple-700">
                    Default Ingredients ({defaultIngredients.length})
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Ingredients that will be used for this product mix
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addIngredientRow}
                  className="flex items-center gap-1 text-sm bg-purple-100 text-purple-700 px-3 py-1.5 rounded hover:bg-purple-200 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>

              {loadingIngredients ? (
                <p className="text-sm text-muted-foreground text-center py-3">
                  Loading ingredients...
                </p>
              ) : defaultIngredients.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-3 bg-purple-50 rounded border border-purple-200">
                  No default ingredients set. Click "Add" to define ingredients.
                </p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {defaultIngredients.map((ing, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <div className="flex-1">
                        <select
                          value={ing.ingredientId}
                          onChange={(e) =>
                            updateDefaultIngredient(
                              index,
                              "ingredientId",
                              e.target.value,
                            )
                          }
                          className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                        >
                          <option value="">Select Ingredient</option>
                          {allIngredients.map((ingredient) => (
                            <option key={ingredient.id} value={ingredient.id}>
                              {ingredient.name} ({ingredient.unit})
                            </option>
                          ))}
                        </select>
                      </div>
                      <button
                        type="button"
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
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-muted border border-border rounded-lg hover:bg-muted/80 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 ${isIngredient ? "bg-orange-600 hover:bg-orange-700" : isProductMix ? "bg-purple-600 hover:bg-purple-700" : "bg-blue-600 hover:bg-blue-700"}`}
              disabled={isSubmitting}
            >
              {isSubmitting
                ? isEditing
                  ? "Updating..."
                  : "Creating..."
                : isEditing
                  ? "Update Category"
                  : "Create Category"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
