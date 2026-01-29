import { useState, useEffect } from 'react';
import { Store, MapPin, Plus, Edit2, Trash2, Save, X, Building2, Phone, Mail, User, CheckCircle, Search, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { getStores, createStore, updateStore, deleteStore, type StoreLocation } from '@/utils/api';

export function StoresManagementPage() {
  const [stores, setStores] = useState<StoreLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStore, setEditingStore] = useState<StoreLocation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    contactPerson: '',
    phone: '',
    email: '',
    status: 'active' as 'active' | 'inactive',
  });

  useEffect(() => {
    loadStores();
  }, []);

  const loadStores = async () => {
    try {
      setLoading(true);
      const data = await getStores();
      setStores(data);
    } catch (error) {
      console.error('Error loading stores:', error);
      toast.error('Failed to load stores');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStore = async () => {
    if (!formData.name.trim()) {
      toast.error('Store name is required');
      return;
    }

    if (!formData.address.trim()) {
      toast.error('Store address is required');
      return;
    }

    try {
      await createStore(formData);
      toast.success('Store added successfully');
      setShowAddModal(false);
      resetForm();
      loadStores();
    } catch (error) {
      console.error('Error adding store:', error);
      toast.error('Failed to add store');
    }
  };

  const handleUpdateStore = async () => {
    if (!editingStore) return;

    if (!formData.name.trim()) {
      toast.error('Store name is required');
      return;
    }

    if (!formData.address.trim()) {
      toast.error('Store address is required');
      return;
    }

    try {
      await updateStore(editingStore.id, formData);
      toast.success('Store updated successfully');
      setEditingStore(null);
      resetForm();
      loadStores();
    } catch (error) {
      console.error('Error updating store:', error);
      toast.error('Failed to update store');
    }
  };

  const handleDeleteStore = async (storeId: string, storeName: string) => {
    // Prevent deleting Main Store
    if (storeName === 'Main Store') {
      toast.error('Cannot delete Main Store');
      return;
    }

    if (!confirm(`Are you sure you want to delete "${storeName}"?`)) {
      return;
    }

    try {
      await deleteStore(storeId);
      toast.success('Store deleted successfully');
      loadStores();
    } catch (error) {
      console.error('Error deleting store:', error);
      toast.error('Failed to delete store');
    }
  };

  const handleEdit = (store: StoreLocation) => {
    setEditingStore(store);
    setFormData({
      name: store.name,
      address: store.address,
      contactPerson: store.contactPerson || '',
      phone: store.phone || '',
      email: store.email || '',
      status: store.status,
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      contactPerson: '',
      phone: '',
      email: '',
      status: 'active',
    });
  };

  const handleCancel = () => {
    setShowAddModal(false);
    setEditingStore(null);
    resetForm();
  };

  const filteredStores = stores.filter(store => {
    const matchesSearch = store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         store.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || store.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const activeStoresCount = stores.filter(s => s.status === 'active').length;
  const inactiveStoresCount = stores.filter(s => s.status === 'inactive').length;

  return (
    <div className="h-full overflow-auto bg-muted/30">
      <div className="container mx-auto p-4 lg:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-semibold mb-1 flex items-center gap-2">
              <Building2 className="w-8 h-8 text-primary" />
              Stores Management
            </h1>
            <p className="text-sm lg:text-base text-muted-foreground">
              Manage store locations for inventory transfers
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add New Store
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card rounded-lg p-6 border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Total Stores</span>
              <Store className="w-5 h-5 text-primary" />
            </div>
            <p className="text-3xl font-semibold">{stores.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Including Main Store</p>
          </div>

          <div className="bg-card rounded-lg p-6 border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Active Stores</span>
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-3xl font-semibold text-green-600">{activeStoresCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Currently operational</p>
          </div>

          <div className="bg-card rounded-lg p-6 border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Inactive Stores</span>
              <X className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-3xl font-semibold text-orange-600">{inactiveStoresCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Temporarily closed</p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-card rounded-lg p-4 border border-border">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search stores by name or address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-muted-foreground" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Status</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stores List */}
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <p className="text-muted-foreground">Loading stores...</p>
            </div>
          ) : filteredStores.length === 0 ? (
            <div className="p-12 text-center">
              <Store className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchQuery || filterStatus !== 'all' ? 'No stores match your filters' : 'No stores added yet'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="text-left p-4 font-semibold">Store Name</th>
                    <th className="text-left p-4 font-semibold">Address</th>
                    <th className="text-left p-4 font-semibold">Contact Person</th>
                    <th className="text-left p-4 font-semibold">Phone</th>
                    <th className="text-left p-4 font-semibold">Status</th>
                    <th className="text-center p-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStores.map((store) => (
                    <tr key={store.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className={`p-2 rounded-lg ${
                            store.name === 'Main Store' ? 'bg-red-100' : 'bg-blue-100'
                          }`}>
                            {store.name === 'Main Store' ? (
                              <Building2 className="w-5 h-5 text-red-600" />
                            ) : (
                              <Store className="w-5 h-5 text-blue-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold">{store.name}</p>
                            {store.name === 'Main Store' && (
                              <span className="text-xs text-red-600 font-medium">Primary Location</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          {store.address}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          {store.contactPerson || '-'}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          {store.phone || '-'}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                          store.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-orange-100 text-orange-700'
                        }`}>
                          {store.status === 'active' ? (
                            <CheckCircle className="w-3 h-3" />
                          ) : (
                            <X className="w-3 h-3" />
                          )}
                          {store.status.charAt(0).toUpperCase() + store.status.slice(1)}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEdit(store)}
                            className="p-2 hover:bg-blue-50 rounded-lg transition-colors group"
                            title="Edit Store"
                          >
                            <Edit2 className="w-4 h-4 text-blue-600" />
                          </button>
                          {store.name !== 'Main Store' && (
                            <button
                              onClick={() => handleDeleteStore(store.id, store.name)}
                              className="p-2 hover:bg-red-50 rounded-lg transition-colors group"
                              title="Delete Store"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || editingStore) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-card border-b border-border p-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                {editingStore ? (
                  <>
                    <Edit2 className="w-5 h-5 text-primary" />
                    Edit Store
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5 text-primary" />
                    Add New Store
                  </>
                )}
              </h2>
              <button onClick={handleCancel} className="p-2 hover:bg-muted rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Store Name */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Store Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Branch 1, Downtown Store"
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  disabled={editingStore?.name === 'Main Store'}
                />
                {editingStore?.name === 'Main Store' && (
                  <p className="text-xs text-muted-foreground mt-1">Main Store name cannot be changed</p>
                )}
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Enter complete store address"
                  rows={3}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>

              {/* Contact Person */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Contact Person
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    placeholder="Manager or contact person name"
                    className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+63 XXX XXX XXXX"
                    className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="store@example.com"
                    className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="sticky bottom-0 bg-card border-t border-border p-6 flex items-center justify-end gap-3">
              <button
                onClick={handleCancel}
                className="px-6 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={editingStore ? handleUpdateStore : handleAddStore}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Save className="w-4 h-4" />
                {editingStore ? 'Update Store' : 'Add Store'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
