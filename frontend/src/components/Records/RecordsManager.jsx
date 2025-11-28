import { useState, useMemo, useCallback } from 'react';
import { useRecords, formatCurrency, formatMonth } from '../../hooks/useFinanceData';
import { recordAPI } from '../../api';
import { 
  Save, 
  Filter, 
  AlertCircle, 
  Trash2, 
  CheckSquare, 
  Square, 
  MinusSquare,
  X,
  Search,
  SlidersHorizontal,
  Home,
  User
} from 'lucide-react';

const CATEGORY_TYPE_ORDER = ['Income', 'Fixed Expense', 'Utility', 'Static Loan', 'Dynamic Debt'];

const typeColors = {
  'Income': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  'Fixed Expense': 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  'Utility': 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
  'Static Loan': 'text-violet-400 bg-violet-500/10 border-violet-500/30',
  'Dynamic Debt': 'text-coral-400 bg-coral-500/10 border-coral-500/30',
};

export default function RecordsManager({ userId, monthYear, users, categories }) {
  const { records, loading, error, saveRecord, bulkSaveRecords, refresh } = useRecords(userId, monthYear);
  const [editedRecords, setEditedRecords] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saveError, setSaveError] = useState(null);
  
  // Selection state
  const [selectedIds, setSelectedIds] = useState(new Set());
  
  // Filter state
  const [filters, setFilters] = useState({
    type: 'all',
    user: 'all',
    search: '',
    amountMin: '',
    amountMax: '',
    hasAmount: 'all', // all, withAmount, zeroOnly
    savedOnly: true, // Only show records that exist in database
  });
  const [showFilters, setShowFilters] = useState(false);

  const isFamilyView = userId === 'family';

  // Group categories by type
  const categoriesByType = useMemo(() => {
    const grouped = {};
    categories.forEach(cat => {
      if (!grouped[cat.type]) {
        grouped[cat.type] = [];
      }
      grouped[cat.type].push(cat);
    });
    return grouped;
  }, [categories]);

  // Build display data - merge records with categories
  const displayData = useMemo(() => {
    const data = [];
    const targetUsers = isFamilyView ? users : users.filter(u => u.id === parseInt(userId));

    CATEGORY_TYPE_ORDER.forEach(type => {
      const typeCats = categoriesByType[type] || [];
      typeCats.forEach(cat => {
        targetUsers.forEach(user => {
          // Find existing record
          const record = records.find(r => 
            r.userId === user.id && r.categoryId === cat.id
          );
          
          data.push({
            key: `${user.id}-${cat.id}`,
            id: record?.id,
            userId: user.id,
            userName: user.name,
            categoryId: cat.id,
            categoryName: cat.name,
            categoryType: cat.type,
            isRecurring: cat.isRecurring,
            isHousehold: cat.isHousehold,
            amount: record?.amount || 0,
            note: record?.note || '',
            recordId: record?.id,
          });
        });
      });
    });

    return data;
  }, [records, categories, users, userId, isFamilyView, categoriesByType]);

  // Apply filters
  const filteredData = useMemo(() => {
    return displayData.filter(item => {
      // Saved only filter - only show records that exist in database
      if (filters.savedOnly && !item.id) return false;
      
      // Type filter
      if (filters.type !== 'all' && item.categoryType !== filters.type) return false;
      
      // User filter
      if (filters.user !== 'all' && item.userId !== parseInt(filters.user)) return false;
      
      // Search filter (category name or note)
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesCategory = item.categoryName.toLowerCase().includes(searchLower);
        const matchesNote = ((editedRecords[item.key]?.note ?? item.note) || '').toLowerCase().includes(searchLower);
        const matchesUser = item.userName.toLowerCase().includes(searchLower);
        if (!matchesCategory && !matchesNote && !matchesUser) return false;
      }
      
      // Amount filters
      const amount = editedRecords[item.key]?.amount ?? item.amount;
      
      if (filters.amountMin !== '' && amount < parseFloat(filters.amountMin)) return false;
      if (filters.amountMax !== '' && amount > parseFloat(filters.amountMax)) return false;
      
      // Has amount filter
      if (filters.hasAmount === 'withAmount' && amount === 0) return false;
      if (filters.hasAmount === 'zeroOnly' && amount !== 0) return false;
      
      return true;
    });
  }, [displayData, filters, editedRecords]);

  // Count active filters (not counting savedOnly since it's the default)
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.type !== 'all') count++;
    if (filters.user !== 'all') count++;
    if (filters.search) count++;
    if (filters.amountMin !== '') count++;
    if (filters.amountMax !== '') count++;
    if (filters.hasAmount !== 'all') count++;
    if (!filters.savedOnly) count++; // Count when showing all (not default)
    return count;
  }, [filters]);

  // Check if there are pending changes
  const hasChanges = Object.keys(editedRecords).length > 0;

  // Selection helpers
  const allVisibleSelected = filteredData.length > 0 && 
    filteredData.every(item => item.id && selectedIds.has(item.id));
  const someVisibleSelected = filteredData.some(item => item.id && selectedIds.has(item.id));
  const selectableCount = filteredData.filter(item => item.id).length;

  function toggleSelectAll() {
    if (allVisibleSelected) {
      // Deselect all visible
      const newSelected = new Set(selectedIds);
      filteredData.forEach(item => {
        if (item.id) newSelected.delete(item.id);
      });
      setSelectedIds(newSelected);
    } else {
      // Select all visible that have IDs
      const newSelected = new Set(selectedIds);
      filteredData.forEach(item => {
        if (item.id) newSelected.add(item.id);
      });
      setSelectedIds(newSelected);
    }
  }

  function toggleSelect(id) {
    if (!id) return;
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  function handleAmountChange(key, value) {
    const numValue = parseFloat(value) || 0;
    setEditedRecords(prev => ({
      ...prev,
      [key]: { ...prev[key], amount: numValue },
    }));
  }

  function handleNoteChange(key, value) {
    setEditedRecords(prev => ({
      ...prev,
      [key]: { ...prev[key], note: value },
    }));
  }

  async function handleSaveAll() {
    if (!hasChanges) return;

    setSaving(true);
    setSaveError(null);

    try {
      const recordsToSave = Object.entries(editedRecords).map(([key, changes]) => {
        const original = displayData.find(d => d.key === key);
        return {
          userId: original.userId,
          categoryId: original.categoryId,
          monthYear,
          amount: changes.amount ?? original.amount,
          note: changes.note ?? original.note,
        };
      });

      await bulkSaveRecords(recordsToSave);
      setEditedRecords({});
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteSelected() {
    if (selectedIds.size === 0) return;
    
    const confirmMsg = `Are you sure you want to delete ${selectedIds.size} record${selectedIds.size > 1 ? 's' : ''}? This action cannot be undone.`;
    if (!confirm(confirmMsg)) return;

    setDeleting(true);
    setSaveError(null);

    try {
      await recordAPI.bulkDelete(Array.from(selectedIds));
      setSelectedIds(new Set());
      await refresh();
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setDeleting(false);
    }
  }

  async function handleDeleteAllFiltered() {
    const deletableIds = filteredData.filter(item => item.id).map(item => item.id);
    if (deletableIds.length === 0) {
      setSaveError('No records to delete (records must be saved first)');
      return;
    }

    const confirmMsg = `Are you sure you want to delete ALL ${deletableIds.length} filtered records? This action cannot be undone.`;
    if (!confirm(confirmMsg)) return;

    setDeleting(true);
    setSaveError(null);

    try {
      await recordAPI.bulkDelete(deletableIds);
      setSelectedIds(new Set());
      await refresh();
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setDeleting(false);
    }
  }

  function clearFilters() {
    setFilters({
      type: 'all',
      user: 'all',
      search: '',
      amountMin: '',
      amountMax: '',
      hasAmount: 'all',
      savedOnly: true,
    });
  }

  function getDisplayAmount(item) {
    if (editedRecords[item.key]?.amount !== undefined) {
      return editedRecords[item.key].amount;
    }
    return item.amount;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Financial Records</h1>
          <p className="text-navy-400">{formatMonth(monthYear)}</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Delete Selected Button */}
          {selectedIds.size > 0 && (
            <button
              onClick={handleDeleteSelected}
              disabled={deleting}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium bg-coral-500/20 text-coral-400 border border-coral-500/30 hover:bg-coral-500/30 transition-colors"
            >
              {deleting ? (
                <div className="w-4 h-4 border-2 border-coral-400 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              <span>Delete ({selectedIds.size})</span>
            </button>
          )}

          {/* Save Button */}
          <button
            onClick={handleSaveAll}
            disabled={!hasChanges || saving}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all ${
              hasChanges 
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-400 hover:to-emerald-500 shadow-lg shadow-emerald-500/25'
                : 'bg-navy-700 text-navy-400 cursor-not-allowed'
            }`}
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>Save Changes</span>
            {hasChanges && (
              <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                {Object.keys(editedRecords).length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {(error || saveError) && (
        <div className="flex items-center gap-3 bg-coral-500/10 border border-coral-500/30 rounded-xl p-4 text-coral-400">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error || saveError}</span>
          <button onClick={() => setSaveError(null)} className="ml-auto p-1 hover:bg-coral-500/20 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="glass rounded-xl">
        {/* Filter Header */}
        <div className="flex items-center justify-between p-4 border-b border-navy-700/50">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                showFilters || activeFilterCount > 0
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-navy-400 hover:text-white hover:bg-navy-700'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="px-1.5 py-0.5 bg-emerald-500 text-white text-xs rounded-full">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Quick Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                placeholder="Search categories, notes..."
                className="bg-navy-800/80 border border-navy-600 rounded-lg pl-9 pr-4 py-1.5 text-sm text-white placeholder-navy-500 w-64"
              />
              {filters.search && (
                <button
                  onClick={() => setFilters(prev => ({ ...prev, search: '' }))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-navy-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm text-navy-400">
            <span>Showing {filteredData.length} of {displayData.length} records</span>
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="text-emerald-400 hover:text-emerald-300"
              >
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="p-4 border-b border-navy-700/50 bg-navy-800/30">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {/* Type Filter */}
              <div>
                <label className="block text-xs text-navy-400 mb-1">Category Type</label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full bg-navy-800 border border-navy-600 rounded-lg px-3 py-1.5 text-sm text-white"
                >
                  <option value="all">All Types</option>
                  {CATEGORY_TYPE_ORDER.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* User Filter */}
              {isFamilyView && (
                <div>
                  <label className="block text-xs text-navy-400 mb-1">User</label>
                  <select
                    value={filters.user}
                    onChange={(e) => setFilters(prev => ({ ...prev, user: e.target.value }))}
                    className="w-full bg-navy-800 border border-navy-600 rounded-lg px-3 py-1.5 text-sm text-white"
                  >
                    <option value="all">All Users</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>{user.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Amount Min */}
              <div>
                <label className="block text-xs text-navy-400 mb-1">Min Amount</label>
                <input
                  type="number"
                  value={filters.amountMin}
                  onChange={(e) => setFilters(prev => ({ ...prev, amountMin: e.target.value }))}
                  placeholder="₪0"
                  className="w-full bg-navy-800 border border-navy-600 rounded-lg px-3 py-1.5 text-sm text-white placeholder-navy-500"
                />
              </div>

              {/* Amount Max */}
              <div>
                <label className="block text-xs text-navy-400 mb-1">Max Amount</label>
                <input
                  type="number"
                  value={filters.amountMax}
                  onChange={(e) => setFilters(prev => ({ ...prev, amountMax: e.target.value }))}
                  placeholder="₪∞"
                  className="w-full bg-navy-800 border border-navy-600 rounded-lg px-3 py-1.5 text-sm text-white placeholder-navy-500"
                />
              </div>

              {/* Has Amount Filter */}
              <div>
                <label className="block text-xs text-navy-400 mb-1">Amount Status</label>
                <select
                  value={filters.hasAmount}
                  onChange={(e) => setFilters(prev => ({ ...prev, hasAmount: e.target.value }))}
                  className="w-full bg-navy-800 border border-navy-600 rounded-lg px-3 py-1.5 text-sm text-white"
                >
                  <option value="all">All</option>
                  <option value="withAmount">With Amount ({">"} 0)</option>
                  <option value="zeroOnly">Zero Only</option>
                </select>
              </div>

              {/* Show Mode */}
              <div>
                <label className="block text-xs text-navy-400 mb-1">Show Records</label>
                <select
                  value={filters.savedOnly ? 'saved' : 'all'}
                  onChange={(e) => setFilters(prev => ({ ...prev, savedOnly: e.target.value === 'saved' }))}
                  className="w-full bg-navy-800 border border-navy-600 rounded-lg px-3 py-1.5 text-sm text-white"
                >
                  <option value="saved">Saved Only</option>
                  <option value="all">All Categories (for data entry)</option>
                </select>
              </div>

              {/* Bulk Actions */}
              <div>
                <label className="block text-xs text-navy-400 mb-1">Bulk Actions</label>
                <button
                  onClick={handleDeleteAllFiltered}
                  disabled={deleting || filteredData.filter(i => i.id).length === 0}
                  className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-sm bg-coral-500/20 text-coral-400 border border-coral-500/30 hover:bg-coral-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Delete All Filtered</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Records Table */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-navy-800/50">
              <tr>
                <th className="text-left px-4 py-4 w-12">
                  <button
                    onClick={toggleSelectAll}
                    className="p-1 text-navy-400 hover:text-white transition-colors"
                    disabled={selectableCount === 0}
                  >
                    {allVisibleSelected ? (
                      <CheckSquare className="w-5 h-5 text-emerald-400" />
                    ) : someVisibleSelected ? (
                      <MinusSquare className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </button>
                </th>
                {isFamilyView && (
                  <th className="text-left px-4 py-4 text-sm font-medium text-navy-400">User</th>
                )}
                <th className="text-left px-4 py-4 text-sm font-medium text-navy-400">Category</th>
                <th className="text-left px-4 py-4 text-sm font-medium text-navy-400">Type</th>
                <th className="text-right px-4 py-4 text-sm font-medium text-navy-400">Amount</th>
                <th className="text-left px-4 py-4 text-sm font-medium text-navy-400">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-700/50">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={isFamilyView ? 6 : 5} className="px-6 py-12 text-center">
                    <div className="text-navy-400 mb-2">
                      {filters.savedOnly ? 'No saved records found' : 'No records match your filters'}
                    </div>
                    {filters.savedOnly && (
                      <button
                        onClick={() => setFilters(prev => ({ ...prev, savedOnly: false }))}
                        className="text-emerald-400 hover:text-emerald-300 text-sm"
                      >
                        Show all categories to add records →
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => {
                  const isEdited = editedRecords[item.key] !== undefined;
                  const isSelected = item.id && selectedIds.has(item.id);
                  
                  return (
                    <tr 
                      key={item.key}
                      className={`hover:bg-navy-800/30 transition-colors ${
                        isEdited ? 'bg-emerald-500/5' : ''
                      } ${isSelected ? 'bg-violet-500/10' : ''}`}
                    >
                      <td className="px-4 py-4">
                      {item.id ? (
                        <button
                          onClick={() => toggleSelect(item.id)}
                          className="p-1 transition-colors text-navy-400 hover:text-white"
                          title="Select record"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <Square className="w-5 h-5" />
                          )}
                        </button>
                      ) : (
                        <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded" title="Not saved yet">
                          NEW
                        </span>
                      )}
                      </td>
                      {isFamilyView && (
                        <td className="px-4 py-4">
                          <span className="text-white font-medium">{item.userName}</span>
                        </td>
                      )}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-white">{item.categoryName}</span>
                          {item.isRecurring && (
                            <span className="px-2 py-0.5 bg-violet-500/20 text-violet-400 text-xs rounded-full">
                              Recurring
                            </span>
                          )}
                          <span 
                            className={`flex items-center px-1.5 py-0.5 text-xs rounded ${
                              item.isHousehold 
                                ? 'bg-cyan-500/20 text-cyan-400' 
                                : 'bg-amber-500/20 text-amber-400'
                            }`}
                            title={item.isHousehold ? 'Household (shared)' : 'Individual (personal)'}
                          >
                            {item.isHousehold ? <Home className="w-3 h-3" /> : <User className="w-3 h-3" />}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${typeColors[item.categoryType]}`}>
                          {item.categoryType}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end">
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400">₪</span>
                            <input
                              type="number"
                              value={getDisplayAmount(item)}
                              onChange={(e) => handleAmountChange(item.key, e.target.value)}
                              className={`w-32 bg-navy-800/80 border rounded-lg px-3 pl-7 py-2 text-right font-mono text-sm ${
                                isEdited 
                                  ? 'border-emerald-500/50 text-emerald-400' 
                                  : 'border-navy-600 text-white'
                              }`}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <input
                          type="text"
                          placeholder="Add note..."
                          value={editedRecords[item.key]?.note ?? item.note}
                          onChange={(e) => handleNoteChange(item.key, e.target.value)}
                          className="w-full bg-navy-800/80 border border-navy-600 rounded-lg px-3 py-2 text-sm text-white placeholder-navy-500"
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary by Type */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {CATEGORY_TYPE_ORDER.map(type => {
          const typeRecords = displayData.filter(d => d.categoryType === type);
          const total = typeRecords.reduce((sum, r) => {
            const amount = editedRecords[r.key]?.amount ?? r.amount;
            return sum + amount;
          }, 0);
          
          return (
            <div key={type} className={`glass-light rounded-xl p-4 border ${typeColors[type]}`}>
              <p className="text-sm text-navy-400 mb-1">{type}</p>
              <p className={`text-xl font-bold font-mono ${typeColors[type].split(' ')[0]}`}>
                {formatCurrency(total)}
              </p>
            </div>
          );
        })}
      </div>

      {/* Selection Info Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 ml-32 glass rounded-2xl px-6 py-4 flex items-center gap-4 shadow-2xl border border-navy-600 animate-slide-up">
          <span className="text-white font-medium">
            {selectedIds.size} record{selectedIds.size > 1 ? 's' : ''} selected
          </span>
          <button
            onClick={handleDeleteSelected}
            disabled={deleting}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-coral-500 text-white font-medium hover:bg-coral-400 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Selected</span>
          </button>
          <button
            onClick={clearSelection}
            className="p-2 text-navy-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
