import { useState, useEffect } from "react";
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  X,
  Phone,
  MapPin,
  Key,
  Store,
  ShieldCheck,
  Check,
  Copy,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Briefcase,
  GraduationCap,
  Heart,
  CreditCard,
  User2,
  FileText,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import {
  getEmployees,
  getAllUsers,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  deleteUser,
  getStores,
  type Employee,
  type AllUser,
  type StoreLocation,
  type EmployeeProfile,
} from "@/utils/api";

// Granular admin sub-permissions
const ADMIN_GRANULAR_PERMISSIONS = [
  {
    id: "admin_perm_inventory",
    label: "Product Inventory",
    actions: [
      { id: "admin_perm_inventory_add", label: "Add" },
      { id: "admin_perm_inventory_edit", label: "Edit" },
      { id: "admin_perm_inventory_delete", label: "Delete" },
    ],
  },
  {
    id: "admin_perm_ingredients",
    label: "Ingredients / Raw Materials",
    actions: [
      { id: "admin_perm_ingredients_add", label: "Add" },
      { id: "admin_perm_ingredients_edit", label: "Edit" },
      { id: "admin_perm_ingredients_adjust", label: "Adjust" },
      { id: "admin_perm_ingredients_delete", label: "Delete" },
    ],
  },
  {
    id: "admin_perm_categories",
    label: "Categories",
    actions: [
      { id: "admin_perm_categories_add", label: "Add" },
      { id: "admin_perm_categories_edit", label: "Edit" },
      { id: "admin_perm_categories_delete", label: "Delete" },
    ],
  },
  {
    id: "admin_perm_suppliers",
    label: "Suppliers & Invoices",
    actions: [
      { id: "admin_perm_suppliers_add", label: "Add" },
      { id: "admin_perm_suppliers_edit", label: "Edit" },
      { id: "admin_perm_suppliers_delete", label: "Delete" },
    ],
  },
  {
    id: "admin_perm_transactions",
    label: "Transactions (Cash In/Out)",
    actions: [
      { id: "admin_perm_transactions_add", label: "Add" },
      { id: "admin_perm_transactions_cashout", label: "Cash Out" },
      { id: "admin_perm_transactions_edit", label: "Edit" },
    ],
  },
  {
    id: "admin_perm_transfer",
    label: "Transfer",
    actions: [
      { id: "admin_perm_transfer_new", label: "New Transfer" },
      { id: "admin_perm_transfer_return", label: "Return" },
    ],
  },
];

// Production sub-permissions
const PRODUCTION_SUB_PERMISSIONS = [
  {
    id: "production_mix",
    label: "Mixing",
    description: "Can start and perform mixing",
  },
  {
    id: "production_pack",
    label: "Packing",
    description: "Can start and perform packing",
  },
  {
    id: "production_cook",
    label: "Cooking",
    description: "Can start and perform cooking",
  },
];

// Available permissions for Employee role
const AVAILABLE_PERMISSIONS = [
  {
    id: "dashboard",
    label: "Dashboard",
    description: "View dashboard and analytics",
  },
  { id: "pos", label: "Point of Sale", description: "Access POS system" },
  {
    id: "production",
    label: "Production",
    description: "Manage production records",
  },
  {
    id: "inventory",
    label: "Product Inventory",
    description: "View and manage inventory",
  },
  {
    id: "categories",
    label: "Categories",
    description: "Manage product categories",
  },
  {
    id: "ingredients",
    label: "Raw Materials Inventory",
    description: "View and manage ingredients",
  },
  {
    id: "transfer",
    label: "Transfer",
    description: "Manage inventory transfers",
  },
  { id: "sales", label: "Sales", description: "View sales reports" },
  { id: "reports", label: "Reports", description: "Generate and view reports" },
  { id: "stores", label: "Stores", description: "Manage store locations" },
  {
    id: "employees",
    label: "Users",
    description: "Manage users and employees",
  },
  { id: "suppliers", label: "Suppliers", description: "Manage suppliers" },
  {
    id: "supplier-invoices",
    label: "Supplier Invoices",
    description: "Track supplier invoices and payments",
  },
  { id: "discounts", label: "Settings", description: "Manage price settings" },
  { id: "history", label: "History", description: "View history logs" },
  {
    id: "transactions",
    label: "Cash-in / Cash-out",
    description: "View cash-in / cash-out",
  },
];

export function EmployeesPage({
  userRole,
  userPermissions,
}: {
  userRole?: string;
  userPermissions?: string[];
}) {
  const isAdmin = userRole === "ADMIN";
  const canManageShift =
    isAdmin || (userPermissions?.includes("admin_permissions") ?? false);
  const [employees, setEmployees] = useState<AllUser[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<AllUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<{
    name: string;
    mobile: string;
    address: string;
    role?: "STORE" | "PRODUCTION" | "POS" | "EMPLOYEE";
    storeId?: string;
    permissions?: string[];
    shift?: "AM" | "PM" | null;
    dateOfBirth: string;
    gender: string;
    civilStatus: string;
    nationality: string;
    bloodType: string;
    height: string;
    weight: string;
    sssNumber: string;
    philhealthNumber: string;
    tinNumber: string;
    pagibigNumber: string;
    emergencyContactName: string;
    emergencyContactRelationship: string;
    emergencyContactPhone: string;
    dateHired: string;
    position: string;
    department: string;
    education: { school: string; degree: string; yearGraduated: string }[];
  }>({
    name: "",
    mobile: "",
    address: "",
    role: undefined,
    storeId: "",
    permissions: [],
    shift: null,
    dateOfBirth: "",
    gender: "",
    civilStatus: "",
    nationality: "",
    bloodType: "",
    height: "",
    weight: "",
    sssNumber: "",
    philhealthNumber: "",
    tinNumber: "",
    pagibigNumber: "",
    emergencyContactName: "",
    emergencyContactRelationship: "",
    emergencyContactPhone: "",
    dateHired: "",
    position: "",
    department: "",
    education: [],
  });
  const [stores, setStores] = useState<StoreLocation[]>([]);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<AllUser | null>(
    null,
  );
  const [passwordData, setPasswordData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [newEmployeeCredentials, setNewEmployeeCredentials] = useState<{
    username: string;
    password: string;
    name: string;
  } | null>(null);
  const [copiedField, setCopiedField] = useState<
    "username" | "password" | null
  >(null);
  const [viewingEmployee, setViewingEmployee] = useState<AllUser | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    show: boolean;
    userId: string;
    userName: string;
  }>({ show: false, userId: "", userName: "" });

  useEffect(() => {
    loadEmployees();
    loadStores();
  }, []);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const data = await getAllUsers();
      console.log("=== EMPLOYEES LOADED ===");
      console.log("Total users:", data.length);

      // Log mark_sioson specifically for debugging
      const markSioson = data.find((u) => u.username === "mark_sioson");
      if (markSioson) {
        console.log("→ mark_sioson found in loaded data:");
        console.log("  - ID:", markSioson.id);
        console.log("  - StoreId:", markSioson.storeId);
        console.log("  - StoreName:", markSioson.storeName);
        console.log("  - Role:", markSioson.role);
      }

      setEmployees(data);
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const loadStores = async () => {
    try {
      const data = await getStores();
      setStores(data);
    } catch (error) {
      console.error("Error loading stores:", error);
      toast.error("Failed to load stores");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Please enter employee name");
      return;
    }

    if (!formData.mobile.trim()) {
      toast.error("Please enter mobile number");
      return;
    }

    // Validate Philippine mobile number format
    const phoneRegex = /^(09|\+639)\d{9}$/;
    if (!phoneRegex.test(formData.mobile.replace(/\s/g, ""))) {
      toast.error(
        "Please enter a valid Philippine mobile number (09XXXXXXXXX)",
      );
      return;
    }

    console.log("=== SUBMITTING EMPLOYEE FORM ===");
    console.log("FormData being sent:", formData);
    console.log("StoreId:", formData.storeId);
    console.log("StoreId type:", typeof formData.storeId);

    // Build clean data object - only include non-empty values
    const cleanData: any = {
      name: formData.name,
      mobile: formData.mobile,
      address: formData.address,
      role: formData.role,
      permissions: formData.permissions || [],
      shift: formData.shift ?? null,
      employeeProfile: {
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        civilStatus: formData.civilStatus,
        nationality: formData.nationality,
        bloodType: formData.bloodType,
        height: formData.height,
        weight: formData.weight,
        sssNumber: formData.sssNumber,
        philhealthNumber: formData.philhealthNumber,
        tinNumber: formData.tinNumber,
        pagibigNumber: formData.pagibigNumber,
        emergencyContactName: formData.emergencyContactName,
        emergencyContactRelationship: formData.emergencyContactRelationship,
        emergencyContactPhone: formData.emergencyContactPhone,
        dateHired: formData.dateHired,
        position: formData.position,
        department: formData.department,
        education: formData.education,
      },
    };

    // Only include storeId if it's provided and not empty
    if (formData.storeId && formData.storeId.trim()) {
      cleanData.storeId = formData.storeId;
    }

    console.log("Clean data being sent:", cleanData);
    console.log("Is Editing?", !!editingEmployee);
    if (editingEmployee) {
      console.log("Editing Employee ID:", editingEmployee.id);
      console.log("Previous StoreId:", editingEmployee.storeId);
      console.log("Previous StoreName:", editingEmployee.storeName);
    }

    // Find the store name for logging
    const selectedStore = stores.find((s) => s.id === cleanData.storeId);
    console.log("Selected Store Name:", selectedStore?.name || "None");

    try {
      if (editingEmployee) {
        console.log("→ Calling updateEmployee API...");
        const result = await updateEmployee(editingEmployee.id, cleanData);
        console.log("→ Update result from server:", result);
        if (result) {
          console.log("  - StoreId in response:", result.storeId);
          console.log("  - StoreName in response:", result.storeName);
        }
        toast.success("Employee updated successfully");
        await loadEmployees();
        resetForm();
      } else {
        console.log(
          "Creating new employee with data:",
          JSON.stringify(cleanData),
        );
        const newEmployee = await createEmployee(cleanData);
        console.log("New employee created:", JSON.stringify(newEmployee));

        if (!newEmployee) {
          console.error("newEmployee is falsy - API returned no employee data");
          toast.error(
            "Employee may have been created but server returned unexpected response. Please refresh.",
          );
          await loadEmployees();
          resetForm();
          return;
        }

        toast.success("Employee added successfully");

        // Check if credentials were returned
        if (newEmployee.username && newEmployee.password) {
          setNewEmployeeCredentials({
            username: newEmployee.username,
            password: newEmployee.password,
            name: newEmployee.name,
          });
          setShowCredentialsModal(true);
        } else {
          console.error(
            "Employee created but credentials not returned:",
            newEmployee,
          );
          toast.warning(
            "Employee created but credentials were not generated. Please set password manually.",
          );
        }

        await loadEmployees();
        resetForm();
      }
    } catch (error) {
      console.error("Error saving employee:", error);
      toast.error("Failed to save employee");
    }
  };

  const handleEdit = (employee: AllUser) => {
    setEditingEmployee(employee);
    const p: EmployeeProfile = (employee as any).employeeProfile || {};
    setFormData({
      name: employee.name,
      mobile: employee.mobile || "",
      address: employee.address || "",
      role: employee.role,
      storeId: employee.storeId || "",
      permissions: employee.permissions || [],
      shift: employee.shift ?? null,
      dateOfBirth: p.dateOfBirth || "",
      gender: p.gender || "",
      civilStatus: p.civilStatus || "",
      nationality: p.nationality || "",
      bloodType: p.bloodType || "",
      height: p.height || "",
      weight: p.weight || "",
      sssNumber: p.sssNumber || "",
      philhealthNumber: p.philhealthNumber || "",
      tinNumber: p.tinNumber || "",
      pagibigNumber: p.pagibigNumber || "",
      emergencyContactName: p.emergencyContactName || "",
      emergencyContactRelationship: p.emergencyContactRelationship || "",
      emergencyContactPhone: p.emergencyContactPhone || "",
      dateHired: p.dateHired || "",
      position: p.position || "",
      department: p.department || "",
      education: p.education || [],
    });
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string, userName: string) => {
    setDeleteConfirmation({ show: true, userId: id, userName });
  };

  const confirmDelete = async () => {
    try {
      console.log("Deleting user with ID:", deleteConfirmation.userId);
      await deleteUser(deleteConfirmation.userId);
      toast.success("User deleted successfully");
      await loadEmployees();
      setDeleteConfirmation({ show: false, userId: "", userName: "" });
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete user");
    }
  };

  const handleToggleCanLogin = async (employee: AllUser) => {
    try {
      const newCanLogin = !employee.canLogin;
      await updateEmployee(employee.id, { canLogin: newCanLogin });
      toast.success(
        `Login access ${newCanLogin ? "enabled" : "disabled"} for ${employee.name}`,
      );
      await loadEmployees();
    } catch (error) {
      console.error("Error toggling canLogin:", error);
      toast.error("Failed to update login permission");
    }
  };

  const handleToggleShift = async (employee: AllUser) => {
    try {
      const newShift = employee.shift === "AM" ? "PM" : "AM";
      await updateEmployee(employee.id, { shift: newShift });
      toast.success(`${employee.name} assigned to ${newShift} shift`);
      await loadEmployees();
    } catch (error) {
      console.error("Error toggling shift:", error);
      toast.error("Failed to update shift");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      mobile: "",
      address: "",
      role: undefined,
      storeId: "",
      permissions: [],
      shift: null,
      dateOfBirth: "",
      gender: "",
      civilStatus: "",
      nationality: "",
      bloodType: "",
      height: "",
      weight: "",
      sssNumber: "",
      philhealthNumber: "",
      tinNumber: "",
      pagibigNumber: "",
      emergencyContactName: "",
      emergencyContactRelationship: "",
      emergencyContactPhone: "",
      dateHired: "",
      position: "",
      department: "",
      education: [],
    });
    setShowAddForm(false);
    setEditingEmployee(null);
  };

  const handlePasswordModalOpen = (employee: AllUser) => {
    setSelectedEmployee(employee);
    setPasswordData({
      username: employee.name,
      password: "",
      confirmPassword: "",
    });
    setShowPasswordModal(true);
  };

  const handlePasswordModalClose = () => {
    setSelectedEmployee(null);
    setPasswordData({ username: "", password: "", confirmPassword: "" });
    setShowPasswordModal(false);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!passwordData.username.trim()) {
      toast.error("Please enter a username");
      return;
    }

    if (!passwordData.password.trim()) {
      toast.error("Please enter a password");
      return;
    }

    if (passwordData.password !== passwordData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      if (selectedEmployee) {
        await updateEmployee(selectedEmployee.id, {
          username: passwordData.username,
          password: passwordData.password,
        });
        toast.success(
          `Login credentials set successfully! Username: ${passwordData.username}`,
        );
        await loadEmployees();
      }

      handlePasswordModalClose();
    } catch (error) {
      console.error("Error updating password:", error);
      toast.error("Failed to set password");
    }
  };

  const handleCopy = (field: "username" | "password") => {
    const text =
      field === "username"
        ? newEmployeeCredentials?.username
        : newEmployeeCredentials?.password;
    if (text) {
      // Try modern Clipboard API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard
          .writeText(text)
          .then(() => {
            setCopiedField(field);
            toast.success(`Copied ${field} to clipboard`);
            setTimeout(() => setCopiedField(null), 2000);
          })
          .catch(() => {
            // Fallback to older method
            fallbackCopy(text, field);
          });
      } else {
        // Fallback for browsers that don't support Clipboard API
        fallbackCopy(text, field);
      }
    }
  };

  const fallbackCopy = (text: string, field: "username" | "password") => {
    try {
      // Create a temporary textarea element
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      textarea.style.top = "-9999px";
      document.body.appendChild(textarea);

      // Select and copy the text
      textarea.select();
      textarea.setSelectionRange(0, 99999); // For mobile devices

      const successful = document.execCommand("copy");
      document.body.removeChild(textarea);

      if (successful) {
        setCopiedField(field);
        toast.success(`Copied ${field} to clipboard`);
        setTimeout(() => setCopiedField(null), 2000);
      } else {
        toast.error(`Failed to copy ${field}. Please copy manually.`);
      }
    } catch (err) {
      console.error("Fallback copy failed:", err);
      toast.error(`Failed to copy ${field}. Please copy manually.`);
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Users</h1>
              <p className="text-gray-600">Manage all users in the system</p>
            </div>
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add User
            </button>
          )}
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {editingEmployee ? "Edit Employee" : "Add New Employee"}
              </h2>
              <button
                onClick={resetForm}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!editingEmployee && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> Login credentials will be
                    automatically generated for this employee. You'll see them
                    after creating the account.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Employee Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Enter employee name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mobile Number *
                </label>
                <input
                  type="tel"
                  value={formData.mobile}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Allow only digits, +, and spaces
                    if (/^[\d+\s]*$/.test(value) || value === "") {
                      setFormData({ ...formData, mobile: value });
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Enter mobile number (09XXXXXXXXX)"
                  maxLength="13"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Format: 09XXXXXXXXX or +639XXXXXXXXX
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Enter address"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      role: e.target.value as
                        | "STORE"
                        | "PRODUCTION"
                        | "POS"
                        | "EMPLOYEE",
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="">Select a role</option>
                  <option value="STORE">Store</option>
                  <option value="PRODUCTION">Production</option>
                  <option value="POS">POS</option>
                  <option value="EMPLOYEE">Employee</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Store
                </label>
                <select
                  value={formData.storeId}
                  onChange={(e) =>
                    setFormData({ ...formData, storeId: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="">Select a store</option>
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Permissions (only for Employee role) */}
              {formData.role === "EMPLOYEE" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Permissions
                  </label>
                  <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 grid grid-cols-2 gap-x-4 gap-y-3">
                    {AVAILABLE_PERMISSIONS.map((perm) => (
                      <div
                        key={perm.id}
                        className={
                          perm.id === "production" &&
                          formData.permissions?.includes("production")
                            ? "col-span-2"
                            : ""
                        }
                      >
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={
                              formData.permissions?.includes(perm.id) || false
                            }
                            onChange={(e) => {
                              let newPermissions = e.target.checked
                                ? [...(formData.permissions || []), perm.id]
                                : (formData.permissions || []).filter(
                                    (p) => p !== perm.id,
                                  );
                              // If unchecking production, also remove sub-permissions
                              if (
                                !e.target.checked &&
                                perm.id === "production"
                              ) {
                                newPermissions = newPermissions.filter(
                                  (p) =>
                                    !PRODUCTION_SUB_PERMISSIONS.some(
                                      (s) => s.id === p,
                                    ),
                                );
                              }
                              setFormData({
                                ...formData,
                                permissions: newPermissions,
                              });
                            }}
                            className="mt-0.5 w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                          />
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">
                              {perm.label}
                            </div>
                            <div className="text-xs text-gray-500">
                              {perm.description}
                            </div>
                          </div>
                        </label>
                        {/* Production sub-permissions — visible when production is checked */}
                        {perm.id === "production" &&
                          formData.permissions?.includes("production") && (
                            <div className="ml-7 mt-2 space-y-2 border-l-2 border-red-200 pl-3">
                              <p className="text-xs font-medium text-gray-600 mb-1">
                                Production Actions
                              </p>
                              {PRODUCTION_SUB_PERMISSIONS.map((sub) => (
                                <label
                                  key={sub.id}
                                  className="flex items-start gap-3 cursor-pointer"
                                >
                                  <input
                                    type="checkbox"
                                    checked={
                                      formData.permissions?.includes(sub.id) ||
                                      false
                                    }
                                    onChange={(e) => {
                                      const newPermissions = e.target.checked
                                        ? [
                                            ...(formData.permissions || []),
                                            sub.id,
                                          ]
                                        : (formData.permissions || []).filter(
                                            (p) => p !== sub.id,
                                          );
                                      setFormData({
                                        ...formData,
                                        permissions: newPermissions,
                                      });
                                    }}
                                    className="mt-0.5 w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                                  />
                                  <div className="flex-1">
                                    <div className="text-sm font-medium text-gray-900">
                                      {sub.label}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {sub.description}
                                    </div>
                                  </div>
                                </label>
                              ))}
                            </div>
                          )}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Select which features this employee can access
                  </p>
                  {/* Admin Permissions — granular */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="mb-3">
                      <div className="text-sm font-medium text-gray-900">
                        Admin Permissions
                      </div>
                      <div className="text-xs text-gray-500">
                        Grant admin-level actions on specific pages, or enable
                        all at once
                      </div>
                    </div>

                    {/* Select All toggle */}
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="text-sm text-gray-700 font-medium">
                          Select All
                        </div>
                        <div className="text-xs text-gray-500">
                          Grant all admin actions across every page
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const has =
                            formData.permissions?.includes("admin_permissions");
                          const newPerms = has
                            ? (formData.permissions || []).filter(
                                (p) => p !== "admin_permissions",
                              )
                            : [
                                ...(formData.permissions || []),
                                "admin_permissions",
                              ];
                          setFormData({ ...formData, permissions: newPerms });
                        }}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          formData.permissions?.includes("admin_permissions")
                            ? "bg-red-600"
                            : "bg-gray-200"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            formData.permissions?.includes("admin_permissions")
                              ? "translate-x-6"
                              : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>

                    {/* Individual granular sub-permissions */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-3">
                      {ADMIN_GRANULAR_PERMISSIONS.map((section) => {
                        const hasAll =
                          formData.permissions?.includes("admin_permissions") ??
                          false;
                        const hasSectionAll =
                          formData.permissions?.includes(section.id) ?? false;
                        const effectiveAll = hasAll || hasSectionAll;
                        return (
                          <div key={section.id} className="space-y-1.5">
                            <label
                              className={`flex items-center gap-2.5 ${hasAll ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                            >
                              <input
                                type="checkbox"
                                checked={effectiveAll}
                                disabled={hasAll}
                                onChange={(e) => {
                                  const newPermissions = e.target.checked
                                    ? [
                                        ...(formData.permissions || []),
                                        section.id,
                                      ]
                                    : (formData.permissions || []).filter(
                                        (p) => p !== section.id,
                                      );
                                  setFormData({
                                    ...formData,
                                    permissions: newPermissions,
                                  });
                                }}
                                className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                              />
                              <span className="text-sm font-semibold text-gray-900">
                                {section.label}
                              </span>
                            </label>
                            <div className="ml-6 flex flex-wrap gap-x-4 gap-y-1.5">
                              {section.actions.map((action) => {
                                const hasAction =
                                  formData.permissions?.includes(action.id) ??
                                  false;
                                const checked = effectiveAll || hasAction;
                                return (
                                  <label
                                    key={action.id}
                                    className={`flex items-center gap-1.5 ${effectiveAll ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      disabled={effectiveAll}
                                      onChange={(e) => {
                                        const newPermissions = e.target.checked
                                          ? [
                                              ...(formData.permissions || []),
                                              action.id,
                                            ]
                                          : (formData.permissions || []).filter(
                                              (p) => p !== action.id,
                                            );
                                        setFormData({
                                          ...formData,
                                          permissions: newPermissions,
                                        });
                                      }}
                                      className="w-3.5 h-3.5 text-red-600 border-gray-300 rounded focus:ring-red-500"
                                    />
                                    <span className="text-xs text-gray-700">
                                      {action.label}
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Production sub-permissions for PRODUCTION role */}
              {formData.role === "PRODUCTION" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Production Permissions
                  </label>
                  <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 space-y-3">
                    <p className="text-xs text-gray-500 mb-2">
                      Select which production actions this employee can perform
                    </p>
                    {PRODUCTION_SUB_PERMISSIONS.map((sub) => (
                      <label
                        key={sub.id}
                        className="flex items-start gap-3 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={
                            formData.permissions?.includes(sub.id) || false
                          }
                          onChange={(e) => {
                            const newPermissions = e.target.checked
                              ? [...(formData.permissions || []), sub.id]
                              : (formData.permissions || []).filter(
                                  (p) => p !== sub.id,
                                );
                            setFormData({
                              ...formData,
                              permissions: newPermissions,
                            });
                          }}
                          className="mt-0.5 w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">
                            {sub.label}
                          </div>
                          <div className="text-xs text-gray-500">
                            {sub.description}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* ─── Personal Details ─── */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 flex items-center gap-2 border-b border-gray-200">
                  <User2 className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-semibold text-gray-700">
                    Personal Details
                  </span>
                </div>
                <div className="p-4 grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          dateOfBirth: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Gender
                    </label>
                    <select
                      value={formData.gender}
                      onChange={(e) =>
                        setFormData({ ...formData, gender: e.target.value })
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    >
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Civil Status
                    </label>
                    <select
                      value={formData.civilStatus}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          civilStatus: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    >
                      <option value="">Select</option>
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Widowed">Widowed</option>
                      <option value="Separated">Separated</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Nationality
                    </label>
                    <input
                      type="text"
                      value={formData.nationality}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          nationality: e.target.value,
                        })
                      }
                      placeholder="e.g. Filipino"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Blood Type
                    </label>
                    <select
                      value={formData.bloodType}
                      onChange={(e) =>
                        setFormData({ ...formData, bloodType: e.target.value })
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    >
                      <option value="">Select</option>
                      {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(
                        (bt) => (
                          <option key={bt} value={bt}>
                            {bt}
                          </option>
                        ),
                      )}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Height (cm)
                      </label>
                      <input
                        type="number"
                        value={formData.height}
                        onChange={(e) =>
                          setFormData({ ...formData, height: e.target.value })
                        }
                        placeholder="cm"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Weight (kg)
                      </label>
                      <input
                        type="number"
                        value={formData.weight}
                        onChange={(e) =>
                          setFormData({ ...formData, weight: e.target.value })
                        }
                        placeholder="kg"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ─── Government IDs ─── */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 flex items-center gap-2 border-b border-gray-200">
                  <CreditCard className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-semibold text-gray-700">
                    Government IDs
                  </span>
                </div>
                <div className="p-4 grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      SSS Number
                    </label>
                    <input
                      type="text"
                      value={formData.sssNumber}
                      onChange={(e) =>
                        setFormData({ ...formData, sssNumber: e.target.value })
                      }
                      placeholder="XX-XXXXXXX-X"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      PhilHealth Number
                    </label>
                    <input
                      type="text"
                      value={formData.philhealthNumber}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          philhealthNumber: e.target.value,
                        })
                      }
                      placeholder="XX-XXXXXXXXX-X"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      TIN Number
                    </label>
                    <input
                      type="text"
                      value={formData.tinNumber}
                      onChange={(e) =>
                        setFormData({ ...formData, tinNumber: e.target.value })
                      }
                      placeholder="XXX-XXX-XXX"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Pag-IBIG Number
                    </label>
                    <input
                      type="text"
                      value={formData.pagibigNumber}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          pagibigNumber: e.target.value,
                        })
                      }
                      placeholder="XXXX-XXXX-XXXX"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* ─── Emergency Contact ─── */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 flex items-center gap-2 border-b border-gray-200">
                  <Heart className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-semibold text-gray-700">
                    Emergency Contact
                  </span>
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Contact Name
                    </label>
                    <input
                      type="text"
                      value={formData.emergencyContactName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          emergencyContactName: e.target.value,
                        })
                      }
                      placeholder="Full name"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Relationship
                      </label>
                      <input
                        type="text"
                        value={formData.emergencyContactRelationship}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            emergencyContactRelationship: e.target.value,
                          })
                        }
                        placeholder="e.g. Spouse, Parent"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="text"
                        value={formData.emergencyContactPhone}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            emergencyContactPhone: e.target.value,
                          })
                        }
                        placeholder="09XXXXXXXXX"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ─── Employment Details ─── */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 flex items-center gap-2 border-b border-gray-200">
                  <Briefcase className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-semibold text-gray-700">
                    Employment Details
                  </span>
                </div>
                <div className="p-4 grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Date Hired
                    </label>
                    <input
                      type="date"
                      value={formData.dateHired}
                      onChange={(e) =>
                        setFormData({ ...formData, dateHired: e.target.value })
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Position / Job Title
                    </label>
                    <input
                      type="text"
                      value={formData.position}
                      onChange={(e) =>
                        setFormData({ ...formData, position: e.target.value })
                      }
                      placeholder="e.g. Meat Packer"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Department
                    </label>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) =>
                        setFormData({ ...formData, department: e.target.value })
                      }
                      placeholder="e.g. Production, Sales"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* ─── Education ─── */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-red-600" />
                    <span className="text-sm font-semibold text-gray-700">
                      Education
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        education: [
                          ...formData.education,
                          { school: "", degree: "", yearGraduated: "" },
                        ],
                      })
                    }
                    className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add
                  </button>
                </div>
                <div className="p-4 space-y-3">
                  {formData.education.length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-2">
                      No education entries — click Add to add one.
                    </p>
                  )}
                  {formData.education.map((edu, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-[1fr_1fr_90px_32px] gap-2 items-end"
                    >
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          School / University
                        </label>
                        <input
                          type="text"
                          value={edu.school}
                          onChange={(e) => {
                            const ed = [...formData.education];
                            ed[idx] = { ...ed[idx], school: e.target.value };
                            setFormData({ ...formData, education: ed });
                          }}
                          placeholder="School name"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Degree / Course
                        </label>
                        <input
                          type="text"
                          value={edu.degree}
                          onChange={(e) => {
                            const ed = [...formData.education];
                            ed[idx] = { ...ed[idx], degree: e.target.value };
                            setFormData({ ...formData, education: ed });
                          }}
                          placeholder="e.g. BS Nursing"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Year
                        </label>
                        <input
                          type="text"
                          value={edu.yearGraduated}
                          onChange={(e) => {
                            const ed = [...formData.education];
                            ed[idx] = {
                              ...ed[idx],
                              yearGraduated: e.target.value,
                            };
                            setFormData({ ...formData, education: ed });
                          }}
                          placeholder="2020"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const ed = formData.education.filter(
                            (_, i) => i !== idx,
                          );
                          setFormData({ ...formData, education: ed });
                        }}
                        className="p-2 text-red-400 hover:bg-red-50 rounded-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  {editingEmployee ? "Update Employee" : "Add Employee"}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Employees List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mobile
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned Store
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Can Login
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Shift
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
                      colSpan={7}
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      Loading users...
                    </td>
                  </tr>
                ) : employees.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      No users found. Add your first employee to get started.
                    </td>
                  </tr>
                ) : (
                  employees.map((employee) => (
                    <tr key={employee.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                            <span className="text-red-600 font-medium">
                              {employee.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {employee.name}
                            </div>
                            {employee.username && (
                              <div className="text-xs text-gray-500">
                                @{employee.username}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-gray-700">
                          <Phone className="w-4 h-4 text-gray-400" />
                          {employee.mobile}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {employee.role ? (
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-gray-400" />
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-gray-700">
                                {employee.role}
                              </span>
                              {employee.role === "Employee" &&
                                employee.permissions &&
                                employee.permissions.length > 0 && (
                                  <span className="text-xs text-gray-500">
                                    {employee.permissions.length} permission
                                    {employee.permissions.length !== 1
                                      ? "s"
                                      : ""}
                                  </span>
                                )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">No Role</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {employee.storeId ? (
                          <div className="flex items-center gap-2">
                            <Store className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-700">
                              {employee.storeName ||
                                stores.find((s) => s.id === employee.storeId)
                                  ?.name ||
                                "Unknown Store"}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">
                            Not Assigned
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {isAdmin ? (
                          <button
                            onClick={() => handleToggleCanLogin(employee)}
                            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                              employee.canLogin !== false
                                ? "bg-green-100 text-green-700 hover:bg-green-200"
                                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                            }`}
                            title={
                              employee.canLogin !== false
                                ? "Click to disable login"
                                : "Click to enable login"
                            }
                          >
                            {employee.canLogin !== false ? (
                              <>
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>Yes</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3.5 h-3.5" />
                                <span>No</span>
                              </>
                            )}
                          </button>
                        ) : (
                          <span
                            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
                              employee.canLogin !== false
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            {employee.canLogin !== false ? (
                              <>
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>Yes</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3.5 h-3.5" />
                                <span>No</span>
                              </>
                            )}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {canManageShift ? (
                          <button
                            onClick={() => handleToggleShift(employee)}
                            className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                              employee.shift === "AM"
                                ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                                : employee.shift === "PM"
                                  ? "bg-orange-100 text-orange-700 hover:bg-orange-200"
                                  : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                            }`}
                            title={
                              employee.shift
                                ? `Click to switch to ${employee.shift === "AM" ? "PM" : "AM"}`
                                : "Click to assign AM shift"
                            }
                          >
                            {employee.shift ?? "—"}
                          </button>
                        ) : (
                          <span
                            className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold ${
                              employee.shift === "AM"
                                ? "bg-blue-100 text-blue-700"
                                : employee.shift === "PM"
                                  ? "bg-orange-100 text-orange-700"
                                  : "bg-gray-100 text-gray-400"
                            }`}
                          >
                            {employee.shift ?? "—"}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setViewingEmployee(employee)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="View Profile"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => handleEdit(employee)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                          {isAdmin && (
                            <button
                              onClick={() =>
                                handleDelete(employee.id, employee.name)
                              }
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                          {isAdmin && (
                            <button
                              onClick={() => handlePasswordModalOpen(employee)}
                              className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                              title="Set Password"
                            >
                              <Key className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Password Modal */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 w-96">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Set Password for {selectedEmployee?.name}
                </h2>
                <button
                  onClick={handlePasswordModalClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username *
                  </label>
                  <input
                    type="text"
                    value={passwordData.username}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        username: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Enter username"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This username will be used for login
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    value={passwordData.password}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        password: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Enter password"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        confirmPassword: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Confirm password"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                  >
                    Set Password
                  </button>
                  <button
                    type="button"
                    onClick={handlePasswordModalClose}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View Profile Modal */}
        {viewingEmployee && (
          <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl my-8">
              {/* Header */}
              <div className="bg-red-600 rounded-t-xl px-6 py-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-white text-2xl font-bold">
                      {viewingEmployee.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      {viewingEmployee.name}
                    </h2>
                    <p className="text-red-100 text-sm">
                      {(viewingEmployee as any).employeeProfile?.position ||
                        viewingEmployee.role ||
                        "Employee"}
                    </p>
                    {viewingEmployee.username && (
                      <p className="text-red-200 text-xs">
                        @{viewingEmployee.username}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setViewingEmployee(null)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-500">Mobile:</span>
                    <span className="text-gray-800 font-medium">
                      {viewingEmployee.mobile || "—"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Store className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-500">Store:</span>
                    <span className="text-gray-800 font-medium">
                      {viewingEmployee.storeName || "Not Assigned"}
                    </span>
                  </div>
                  <div className="flex items-start gap-2 text-sm col-span-2">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                    <span className="text-gray-500">Address:</span>
                    <span className="text-gray-800 font-medium">
                      {viewingEmployee.address || "—"}
                    </span>
                  </div>
                </div>

                {(() => {
                  const p: EmployeeProfile =
                    (viewingEmployee as any).employeeProfile || {};
                  const hasPersonal =
                    p.dateOfBirth ||
                    p.gender ||
                    p.civilStatus ||
                    p.nationality ||
                    p.bloodType ||
                    p.height ||
                    p.weight;
                  const hasGovt =
                    p.sssNumber ||
                    p.philhealthNumber ||
                    p.tinNumber ||
                    p.pagibigNumber;
                  const hasEmergency = p.emergencyContactName;
                  const hasEmployment =
                    p.dateHired || p.position || p.department;
                  const hasEducation = p.education && p.education.length > 0;

                  return (
                    <>
                      {hasPersonal && (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <User2 className="w-4 h-4 text-red-600" />
                            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                              Personal Details
                            </h3>
                          </div>
                          <div className="grid grid-cols-2 gap-2 bg-gray-50 rounded-lg p-4">
                            {p.dateOfBirth && (
                              <div className="text-sm">
                                <span className="text-gray-500">
                                  Date of Birth:{" "}
                                </span>
                                <span className="font-medium">
                                  {p.dateOfBirth}
                                </span>
                              </div>
                            )}
                            {p.gender && (
                              <div className="text-sm">
                                <span className="text-gray-500">Gender: </span>
                                <span className="font-medium">{p.gender}</span>
                              </div>
                            )}
                            {p.civilStatus && (
                              <div className="text-sm">
                                <span className="text-gray-500">
                                  Civil Status:{" "}
                                </span>
                                <span className="font-medium">
                                  {p.civilStatus}
                                </span>
                              </div>
                            )}
                            {p.nationality && (
                              <div className="text-sm">
                                <span className="text-gray-500">
                                  Nationality:{" "}
                                </span>
                                <span className="font-medium">
                                  {p.nationality}
                                </span>
                              </div>
                            )}
                            {p.bloodType && (
                              <div className="text-sm">
                                <span className="text-gray-500">
                                  Blood Type:{" "}
                                </span>
                                <span className="font-medium">
                                  {p.bloodType}
                                </span>
                              </div>
                            )}
                            {(p.height || p.weight) && (
                              <div className="text-sm">
                                <span className="text-gray-500">
                                  Height/Weight:{" "}
                                </span>
                                <span className="font-medium">
                                  {p.height ? p.height + " cm" : "—"} /{" "}
                                  {p.weight ? p.weight + " kg" : "—"}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {hasEmployment && (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <Briefcase className="w-4 h-4 text-red-600" />
                            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                              Employment
                            </h3>
                          </div>
                          <div className="grid grid-cols-2 gap-2 bg-gray-50 rounded-lg p-4">
                            {p.position && (
                              <div className="text-sm">
                                <span className="text-gray-500">
                                  Position:{" "}
                                </span>
                                <span className="font-medium">
                                  {p.position}
                                </span>
                              </div>
                            )}
                            {p.department && (
                              <div className="text-sm">
                                <span className="text-gray-500">
                                  Department:{" "}
                                </span>
                                <span className="font-medium">
                                  {p.department}
                                </span>
                              </div>
                            )}
                            {p.dateHired && (
                              <div className="text-sm">
                                <span className="text-gray-500">
                                  Date Hired:{" "}
                                </span>
                                <span className="font-medium">
                                  {p.dateHired}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {hasGovt && (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <CreditCard className="w-4 h-4 text-red-600" />
                            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                              Government IDs
                            </h3>
                          </div>
                          <div className="grid grid-cols-2 gap-2 bg-gray-50 rounded-lg p-4">
                            {p.sssNumber && (
                              <div className="text-sm">
                                <span className="text-gray-500">SSS: </span>
                                <span className="font-medium font-mono">
                                  {p.sssNumber}
                                </span>
                              </div>
                            )}
                            {p.philhealthNumber && (
                              <div className="text-sm">
                                <span className="text-gray-500">
                                  PhilHealth:{" "}
                                </span>
                                <span className="font-medium font-mono">
                                  {p.philhealthNumber}
                                </span>
                              </div>
                            )}
                            {p.tinNumber && (
                              <div className="text-sm">
                                <span className="text-gray-500">TIN: </span>
                                <span className="font-medium font-mono">
                                  {p.tinNumber}
                                </span>
                              </div>
                            )}
                            {p.pagibigNumber && (
                              <div className="text-sm">
                                <span className="text-gray-500">
                                  Pag-IBIG:{" "}
                                </span>
                                <span className="font-medium font-mono">
                                  {p.pagibigNumber}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {hasEmergency && (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <Heart className="w-4 h-4 text-red-600" />
                            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                              Emergency Contact
                            </h3>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-4 text-sm">
                            <span className="font-medium">
                              {p.emergencyContactName}
                            </span>
                            {p.emergencyContactRelationship && (
                              <span className="text-gray-500">
                                {" "}
                                ({p.emergencyContactRelationship})
                              </span>
                            )}
                            {p.emergencyContactPhone && (
                              <span className="ml-2 text-gray-600">
                                — {p.emergencyContactPhone}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {hasEducation && (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <GraduationCap className="w-4 h-4 text-red-600" />
                            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                              Education
                            </h3>
                          </div>
                          <div className="space-y-2">
                            {p.education!.map((edu, i) => (
                              <div
                                key={i}
                                className="bg-gray-50 rounded-lg p-3 text-sm"
                              >
                                <div className="font-medium text-gray-800">
                                  {edu.school}
                                </div>
                                <div className="text-gray-600">
                                  {edu.degree}
                                  {edu.yearGraduated
                                    ? " · " + edu.yearGraduated
                                    : ""}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {!hasPersonal &&
                        !hasGovt &&
                        !hasEmergency &&
                        !hasEmployment &&
                        !hasEducation && (
                          <div className="text-center py-6 text-gray-400">
                            <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                            <p className="text-sm">
                              No additional profile information on file.
                            </p>
                            <p className="text-xs mt-1">
                              Click the edit button to add resume details.
                            </p>
                          </div>
                        )}
                    </>
                  );
                })()}

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      setViewingEmployee(null);
                      handleEdit(viewingEmployee!);
                    }}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
                  >
                    Edit Profile
                  </button>
                  <button
                    onClick={() => setViewingEmployee(null)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium text-sm"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Credentials Modal */}
        {showCredentialsModal && newEmployeeCredentials && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 w-96">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Employee Created Successfully!
                </h2>
                <button
                  onClick={() => setShowCredentialsModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-green-800">
                  <strong>Login credentials have been generated.</strong> Please
                  save them securely and share with the employee.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Employee Name
                  </label>
                  <input
                    type="text"
                    value={newEmployeeCredentials.name || "N/A"}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg"
                    readOnly
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={newEmployeeCredentials.username || "Not generated"}
                      className="w-full px-4 py-2 pr-10 bg-gray-50 border border-gray-300 rounded-lg"
                      readOnly
                    />
                    <button
                      type="button"
                      onClick={() => handleCopy("username")}
                      className="absolute right-2 top-2 p-2 hover:bg-gray-200 rounded-lg transition-colors"
                      disabled={!newEmployeeCredentials.username}
                    >
                      {copiedField === "username" ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-500" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={newEmployeeCredentials.password || "Not generated"}
                      className="w-full px-4 py-2 pr-10 bg-gray-50 border border-gray-300 rounded-lg font-mono"
                      readOnly
                    />
                    <button
                      type="button"
                      onClick={() => handleCopy("password")}
                      className="absolute right-2 top-2 p-2 hover:bg-gray-200 rounded-lg transition-colors"
                      disabled={!newEmployeeCredentials.password}
                    >
                      {copiedField === "password" ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-500" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    This password is only shown once. Make sure to save it!
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCredentialsModal(false)}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  I've Saved the Credentials
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirmation.show && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 w-96">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Delete User
                  </h2>
                  <p className="text-sm text-gray-500">
                    This action cannot be undone
                  </p>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-red-800">
                  Are you sure you want to delete{" "}
                  <span className="font-semibold">
                    "{deleteConfirmation.userName}"
                  </span>
                  ? This will permanently remove the user from the system.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() =>
                    setDeleteConfirmation({
                      show: false,
                      userId: "",
                      userName: "",
                    })
                  }
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
