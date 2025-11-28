import { useState } from 'react';
import { Users, Calendar, ChevronDown, Plus, Edit3, CheckCircle, UserPlus, Trash2, AlertTriangle, X, Home, User } from 'lucide-react';
import { formatMonth, getCurrentMonth } from '../../hooks/useFinanceData';
import { workflowAPI, recordAPI } from '../../api';

function getNextMonth(monthYear) {
  const [year, month] = monthYear.split('-').map(Number);
  const nextDate = new Date(year, month, 1);
  return `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;
}

export default function TopBar({ 
  users, 
  selectedUserId, 
  setSelectedUserId,
  selectedMonth,
  setSelectedMonth,
  availableMonths,
  refreshMonths,
  onManageUsers,
  onEnterValues,
}) {
  const [isCreatingMonth, setIsCreatingMonth] = useState(false);
  const [isDeletingMonth, setIsDeletingMonth] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAddMonth, setShowAddMonth] = useState(false);
  const [newMonthYear, setNewMonthYear] = useState(() => {
    // Default to next month
    const now = new Date();
    now.setMonth(now.getMonth() + 1);
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [result, setResult] = useState(null);

  // Check if selected month already exists
  const monthExists = availableMonths.includes(newMonthYear);

  async function handleAddNewMonth() {
    if (isCreatingMonth || monthExists) return;
    
    try {
      setIsCreatingMonth(true);
      // Find closest previous month to copy from
      const sourceMonth = availableMonths.find(m => m < newMonthYear) || availableMonths[0];
      const response = await workflowAPI.startNewMonth({ 
        targetMonth: newMonthYear,
        sourceMonth: sourceMonth 
      });
      setResult({ success: true, message: `Created ${formatMonth(newMonthYear)}` });
      setShowAddMonth(false);
      await refreshMonths();
      setSelectedMonth(newMonthYear);
      
      setTimeout(() => setResult(null), 3000);
    } catch (error) {
      setResult({ success: false, message: error.message });
      setTimeout(() => setResult(null), 5000);
    } finally {
      setIsCreatingMonth(false);
    }
  }

  async function handleDeleteMonth() {
    if (isDeletingMonth) return;
    
    try {
      setIsDeletingMonth(true);
      const response = await recordAPI.deleteMonth(selectedMonth);
      setResult({ success: true, message: `Deleted all records for ${formatMonth(selectedMonth)}` });
      setShowDeleteConfirm(false);
      await refreshMonths();
      
      // Switch to another month if available
      const remainingMonths = availableMonths.filter(m => m !== selectedMonth);
      if (remainingMonths.length > 0) {
        setSelectedMonth(remainingMonths[0]);
      }
      
      setTimeout(() => setResult(null), 3000);
    } catch (error) {
      setResult({ success: false, message: error.message });
      setTimeout(() => setResult(null), 5000);
    } finally {
      setIsDeletingMonth(false);
    }
  }

  return (
    <header className="sticky top-0 z-40 glass border-b border-navy-700/50 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left: User & Month Selectors */}
        <div className="flex items-center gap-4">
          {/* User Selector */}
          <div className="relative">
            <label className="flex items-center gap-2 text-sm text-navy-400 mb-1">
              <Users className="w-4 h-4" />
              <span>Profile</span>
            </label>
            <div className="flex items-center gap-2">
              <div className="relative">
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="appearance-none bg-navy-800/80 border border-navy-600 rounded-xl px-4 py-2.5 pr-10 text-white font-medium min-w-[160px] cursor-pointer hover:border-emerald-500/50 transition-colors"
                >
                  <option value="family">👨‍👩‍👧 Family View</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      👤 {user.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400 pointer-events-none" />
              </div>
              <button
                onClick={onManageUsers}
                className="p-2.5 rounded-xl bg-navy-800/80 border border-navy-600 text-navy-400 hover:text-emerald-400 hover:border-emerald-500/50 transition-colors"
                title="Manage Profiles"
              >
                <UserPlus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Month Selector */}
          <div className="relative">
            <label className="flex items-center gap-2 text-sm text-navy-400 mb-1">
              <Calendar className="w-4 h-4" />
              <span>Month</span>
            </label>
            <div className="flex items-center gap-2">
              <div className="relative">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="appearance-none bg-navy-800/80 border border-navy-600 rounded-xl px-4 py-2.5 pr-10 text-white font-medium min-w-[180px] cursor-pointer hover:border-emerald-500/50 transition-colors"
                >
                  {availableMonths.map(month => (
                    <option key={month} value={month}>
                      {formatMonth(month)}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400 pointer-events-none" />
              </div>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2.5 rounded-xl bg-navy-800/80 border border-navy-600 text-navy-400 hover:text-coral-400 hover:border-coral-500/50 transition-colors"
                title="Delete this month's data"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-3">
          {/* Result Message */}
          {result && (
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm animate-fade-in ${
              result.success 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                : 'bg-coral-500/20 text-coral-400 border border-coral-500/30'
            }`}>
              <CheckCircle className="w-4 h-4" />
              {result.message}
            </div>
          )}

          {/* Enter Values Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEnterValues('household')}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white font-medium rounded-xl hover:from-cyan-400 hover:to-cyan-500 transition-all shadow-lg shadow-cyan-500/25"
              title="Enter household/shared expenses"
            >
              <Home className="w-4 h-4" />
              <span>Household</span>
            </button>
            <button
              onClick={() => onEnterValues('individual')}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-medium rounded-xl hover:from-amber-400 hover:to-amber-500 transition-all shadow-lg shadow-amber-500/25"
              title="Enter individual/personal expenses"
            >
              <User className="w-4 h-4" />
              <span>Individual</span>
            </button>
          </div>

          {/* Add New Month Button */}
          <button
            onClick={() => setShowAddMonth(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all bg-navy-700 border border-navy-600 text-white hover:bg-navy-600 hover:border-navy-500"
          >
            <Plus className="w-4 h-4" />
            <span>Add Month</span>
          </button>
        </div>
      </div>

      {/* Delete Month Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-sm animate-fade-in">
          <div className="glass rounded-2xl w-full max-w-md p-6 animate-slide-up">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-xl bg-coral-500/20 border border-coral-500/30">
                <AlertTriangle className="w-6 h-6 text-coral-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Delete Month Data</h3>
                <p className="text-sm text-navy-400">This action cannot be undone</p>
              </div>
            </div>
            
            <p className="text-navy-300 mb-6">
              Are you sure you want to delete <strong className="text-white">{formatMonth(selectedMonth)}</strong>? 
              This will permanently remove all financial records for this month.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2.5 text-navy-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteMonth}
                disabled={isDeletingMonth}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-coral-500 to-coral-600 text-white font-medium rounded-xl hover:from-coral-400 hover:to-coral-500 transition-all disabled:opacity-50"
              >
                {isDeletingMonth ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                <span>Delete Month</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Month Modal */}
      {showAddMonth && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-sm animate-fade-in">
          <div className="glass rounded-2xl w-full max-w-md p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30">
                  <Calendar className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Add New Month</h3>
                  <p className="text-sm text-navy-400">Choose which month to create</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddMonth(false)}
                className="p-2 rounded-lg text-navy-400 hover:text-white hover:bg-navy-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm text-navy-400 mb-2">Select Month</label>
              <input
                type="month"
                value={newMonthYear}
                onChange={(e) => setNewMonthYear(e.target.value)}
                className="w-full bg-navy-800 border border-navy-600 rounded-xl px-4 py-3 text-white font-medium focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50"
              />
              {monthExists && (
                <p className="text-coral-400 text-sm mt-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  This month already exists
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowAddMonth(false)}
                className="px-4 py-2.5 text-navy-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddNewMonth}
                disabled={isCreatingMonth || monthExists}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-medium rounded-xl hover:from-emerald-400 hover:to-emerald-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreatingMonth ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                <span>Create Month</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
