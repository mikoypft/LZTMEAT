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
} from "@/utils/api";

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
    label: "Inventory",
    description: "View and manage inventory",
  },
  {
    id: "categories",
    label: "Categories",
    description: "Manage product categories",
  },
  {
    id: "ingredients",
    label: "Ingredients",
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
  { id: "discounts", label: "Discounts", description: "Manage discounts" },
  { id: "history", label: "History", description: "View history logs" },
  {
    id: "transactions",
    label: "Transactions",
    description: "View transactions",
  },
];

export function EmployeesPage() {
  const [employees, setEmployees] = useState<AllUser[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<AllUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<{
    name: string;
    mobile: string;
    address: string;
    role?: "Store" | "Production" | "POS" | "Employee";
    storeId?: string;
    permissions?: string[];
  }>({
    name: "",
    mobile: "",
    address: "",
    role: undefined,
    storeId: "",
    permissions: [],
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
        console.log("Creating new employee");
        const newEmployee = await createEmployee(cleanData);
        console.log("New employee created:", newEmployee);
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
    setFormData({
      name: employee.name,
      mobile: employee.mobile,
      address: employee.address,
      role: employee.role,
      storeId: employee.storeId || "",
      permissions: employee.permissions || [],
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) {
      return;
    }

    try {
      console.log("Deleting user with ID:", id);
      await deleteUser(id);
      toast.success("User deleted successfully");
      await loadEmployees();
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

  const resetForm = () => {
    setFormData({
      name: "",
      mobile: "",
      address: "",
      role: undefined,
      storeId: "",
      permissions: [],
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
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add User
          </button>
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
                        | "Store"
                        | "Production"
                        | "POS"
                        | "Employee",
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="">Select a role</option>
                  <option value="Store">Store</option>
                  <option value="Production">Production</option>
                  <option value="POS">POS</option>
                  <option value="Employee">Employee</option>
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
              {formData.role === "Employee" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Permissions
                  </label>
                  <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 space-y-3">
                    {AVAILABLE_PERMISSIONS.map((perm) => (
                      <label
                        key={perm.id}
                        className="flex items-start gap-3 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={
                            formData.permissions?.includes(perm.id) || false
                          }
                          onChange={(e) => {
                            const newPermissions = e.target.checked
                              ? [...(formData.permissions || []), perm.id]
                              : (formData.permissions || []).filter(
                                  (p) => p !== perm.id,
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
                            {perm.label}
                          </div>
                          <div className="text-xs text-gray-500">
                            {perm.description}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Select which features this employee can access
                  </p>
                </div>
              )}

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
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      Loading users...
                    </td>
                  </tr>
                ) : employees.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
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
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(employee)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(employee.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handlePasswordModalOpen(employee)}
                            className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                            title="Set Password"
                          >
                            <Key className="w-4 h-4" />
                          </button>
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
      </div>
    </div>
  );
}
