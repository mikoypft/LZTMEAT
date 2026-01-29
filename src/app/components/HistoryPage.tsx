import { useState, useEffect } from 'react';
import { 
  Calendar, Filter, Search, Download, ChevronDown, ChevronUp, 
  ChevronLeft, ChevronRight, Package, ShoppingCart, Factory, 
  Truck, Archive, Clock, User
} from 'lucide-react';
import { getSystemHistory, exportHistoryToCSV, type SystemHistoryEntry } from '@/utils/api';
import { toast } from 'sonner';
import React from 'react';

const ACTION_TYPES = [
  { value: 'all', label: 'All Actions' },
  { value: 'sale', label: 'Sales' },
  { value: 'production', label: 'Production' },
  { value: 'transfer', label: 'Transfers' },
  { value: 'inventory', label: 'Inventory' },
];

export function HistoryPage() {
  const [historyData, setHistoryData] = useState<SystemHistoryEntry[]>([]);
  const [filteredData, setFilteredData] = useState<SystemHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [sortColumn, setSortColumn] = useState<'timestamp' | 'action' | 'user'>('timestamp');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadHistoryData();
  }, []);

  useEffect(() => {
    filterAndSortData();
  }, [historyData, searchTerm, filterAction, sortColumn, sortDirection]);

  const loadHistoryData = async () => {
    try {
      setLoading(true);
      const data = await getSystemHistory();
      setHistoryData(data);
    } catch (error) {
      console.error('Error loading history data:', error);
      toast.error('Failed to load system history');
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortData = () => {
    let filtered = [...historyData];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(entry => 
        entry.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        JSON.stringify(entry.details).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply action filter
    if (filterAction !== 'all') {
      filtered = filtered.filter(entry => entry.action.toLowerCase().includes(filterAction));
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let compareA: any;
      let compareB: any;

      if (sortColumn === 'timestamp') {
        compareA = new Date(a.timestamp).getTime();
        compareB = new Date(b.timestamp).getTime();
      } else if (sortColumn === 'action') {
        compareA = a.action.toLowerCase();
        compareB = b.action.toLowerCase();
      } else if (sortColumn === 'user') {
        compareA = a.user.toLowerCase();
        compareB = b.user.toLowerCase();
      }

      if (sortDirection === 'asc') {
        return compareA > compareB ? 1 : -1;
      } else {
        return compareA < compareB ? 1 : -1;
      }
    });

    setFilteredData(filtered);
    setCurrentPage(1);
  };

  const handleSort = (column: 'timestamp' | 'action' | 'user') => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  const toggleRowExpansion = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const handleExportCSV = async () => {
    try {
      await exportHistoryToCSV(filteredData);
      toast.success('History exported to CSV successfully');
    } catch (error) {
      console.error('Error exporting history:', error);
      toast.error('Failed to export history');
    }
  };

  const getActionIcon = (action: string) => {
    const actionLower = action.toLowerCase();
    if (actionLower.includes('sale')) return ShoppingCart;
    if (actionLower.includes('production')) return Factory;
    if (actionLower.includes('transfer')) return Truck;
    if (actionLower.includes('inventory')) return Package;
    return Archive;
  };

  const getActionColor = (action: string) => {
    const actionLower = action.toLowerCase();
    if (actionLower.includes('sale')) return 'text-green-600 bg-green-50';
    if (actionLower.includes('production')) return 'text-blue-600 bg-blue-50';
    if (actionLower.includes('transfer')) return 'text-purple-600 bg-purple-50';
    if (actionLower.includes('inventory')) return 'text-orange-600 bg-orange-50';
    return 'text-gray-600 bg-gray-50';
  };

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Clock className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading system history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto bg-muted/30">
      <div className="container mx-auto p-4 lg:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold mb-2">System History</h1>
            <p className="text-sm text-muted-foreground">
              Comprehensive log of all system activities and transactions
            </p>
          </div>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export to CSV
          </button>
        </div>

        {/* Filters and Search */}
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search history..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Action Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <select
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
              >
                {ACTION_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {/* Results count */}
          <div className="mt-4 text-sm text-muted-foreground">
            Showing {startIndex + 1}-{Math.min(endIndex, filteredData.length)} of {filteredData.length} records
          </div>
        </div>

        {/* History Table */}
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-left py-3 px-4">
                    <button
                      onClick={() => handleSort('timestamp')}
                      className="flex items-center gap-2 hover:text-primary transition-colors"
                    >
                      <Calendar className="w-4 h-4" />
                      Date & Time
                      {sortColumn === 'timestamp' && (
                        sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="text-left py-3 px-4">
                    <button
                      onClick={() => handleSort('action')}
                      className="flex items-center gap-2 hover:text-primary transition-colors"
                    >
                      Action
                      {sortColumn === 'action' && (
                        sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="text-left py-3 px-4">
                    <button
                      onClick={() => handleSort('user')}
                      className="flex items-center gap-2 hover:text-primary transition-colors"
                    >
                      <User className="w-4 h-4" />
                      User
                      {sortColumn === 'user' && (
                        sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="text-left py-3 px-4">Description</th>
                  <th className="text-left py-3 px-4">Details</th>
                </tr>
              </thead>
              <tbody>
                {currentData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-muted-foreground">
                      <Archive className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No history records found</p>
                    </td>
                  </tr>
                ) : (
                  currentData.flatMap((entry) => {
                    const ActionIcon = getActionIcon(entry.action);
                    const isExpanded = expandedRows.has(entry.id);
                    
                    const rows = [
                      <tr key={entry.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-4 text-sm">
                          {new Date(entry.timestamp).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="py-3 px-4">
                          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${getActionColor(entry.action)}`}>
                            <ActionIcon className="w-4 h-4" />
                            {entry.action}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm font-medium">{entry.user}</td>
                        <td className="py-3 px-4 text-sm">{entry.description}</td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => toggleRowExpansion(entry.id)}
                            className="text-primary hover:underline text-sm flex items-center gap-1"
                          >
                            {isExpanded ? (
                              <>
                                <ChevronUp className="w-4 h-4" />
                                Hide
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-4 h-4" />
                                View
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    ];
                    
                    if (isExpanded) {
                      rows.push(
                        <tr key={`${entry.id}-details`} className="bg-muted/30">
                          <td colSpan={5} className="py-4 px-4">
                            <div className="bg-background rounded-lg p-4 border border-border">
                              <h4 className="text-sm font-semibold mb-2">Details:</h4>
                              <pre className="text-xs overflow-auto max-h-64 bg-muted/50 p-3 rounded">
                                {JSON.stringify(entry.details, null, 2)}
                              </pre>
                            </div>
                          </td>
                        </tr>
                      );
                    }
                    
                    return rows;
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}