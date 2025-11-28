import { useState } from 'react';
import { useDebts, formatCurrency, formatCurrencyFull } from '../../hooks/useFinanceData';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  CreditCard, 
  TrendingDown, 
  Calendar,
  Percent,
  DollarSign,
  Clock,
  Target,
  X,
  Save
} from 'lucide-react';

const DEBT_TYPES = ['Static Loan', 'Dynamic Debt', 'Credit Card'];

const typeColors = {
  'Static Loan': 'text-violet-400 bg-violet-500/10 border-violet-500/30',
  'Dynamic Debt': 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  'Credit Card': 'text-coral-400 bg-coral-500/10 border-coral-500/30',
};

const typeIcons = {
  'Static Loan': TrendingDown,
  'Dynamic Debt': Clock,
  'Credit Card': CreditCard,
};

/**
 * Calculate months to payoff for a debt
 * Uses the amortization formula: n = -log(1 - (r*P)/M) / log(1+r)
 */
function calculateMonthsToPayoff(remainingBalance, monthlyPayment, interestRate) {
  if (monthlyPayment <= 0 || remainingBalance <= 0) return Infinity;
  
  if (interestRate === 0) {
    return Math.ceil(remainingBalance / monthlyPayment);
  }

  const monthlyRate = interestRate / 100 / 12;
  
  // Check if payment is enough to cover interest
  const monthlyInterest = remainingBalance * monthlyRate;
  if (monthlyPayment <= monthlyInterest) {
    return Infinity; // Will never pay off
  }

  const numerator = -Math.log(1 - (monthlyRate * remainingBalance) / monthlyPayment);
  const denominator = Math.log(1 + monthlyRate);
  return Math.ceil(numerator / denominator);
}

function DebtCard({ debt, onEdit, onDelete, users }) {
  const Icon = typeIcons[debt.debtType] || CreditCard;
  const monthsToPayoff = calculateMonthsToPayoff(
    debt.remainingBalance,
    debt.monthlyPayment,
    debt.interestRate
  );

  const yearsToPayoff = monthsToPayoff === Infinity 
    ? '∞' 
    : monthsToPayoff > 12 
      ? `${Math.floor(monthsToPayoff / 12)}y ${monthsToPayoff % 12}m`
      : `${monthsToPayoff} months`;

  const progressPercent = debt.totalPrincipal > 0
    ? ((debt.totalPrincipal - debt.remainingBalance) / debt.totalPrincipal) * 100
    : 0;

  return (
    <div className="glass rounded-2xl p-6 hover:border-navy-500/50 transition-colors group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl border ${typeColors[debt.debtType]}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{debt.name}</h3>
            <p className="text-sm text-navy-400">{debt.user?.name}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(debt)}
            className="p-2 rounded-lg bg-navy-700/50 text-navy-400 hover:text-white hover:bg-navy-700 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(debt.id)}
            className="p-2 rounded-lg bg-navy-700/50 text-navy-400 hover:text-coral-400 hover:bg-coral-500/10 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-navy-400">Paid off</span>
          <span className="text-emerald-400 font-medium">{progressPercent.toFixed(1)}%</span>
        </div>
        <div className="h-2 bg-navy-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-navy-800/50 rounded-xl p-3">
          <div className="flex items-center gap-1.5 text-navy-400 text-xs mb-1">
            <DollarSign className="w-3.5 h-3.5" />
            <span>Remaining</span>
          </div>
          <p className="text-white font-bold font-mono">{formatCurrency(debt.remainingBalance)}</p>
        </div>
        
        <div className="bg-navy-800/50 rounded-xl p-3">
          <div className="flex items-center gap-1.5 text-navy-400 text-xs mb-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>Monthly</span>
          </div>
          <p className="text-white font-bold font-mono">{formatCurrency(debt.monthlyPayment)}</p>
        </div>
        
        <div className="bg-navy-800/50 rounded-xl p-3">
          <div className="flex items-center gap-1.5 text-navy-400 text-xs mb-1">
            <Percent className="w-3.5 h-3.5" />
            <span>Interest Rate</span>
          </div>
          <p className={`font-bold font-mono ${debt.interestRate > 10 ? 'text-coral-400' : 'text-white'}`}>
            {debt.interestRate}%
          </p>
        </div>
        
        <div className="bg-navy-800/50 rounded-xl p-3">
          <div className="flex items-center gap-1.5 text-navy-400 text-xs mb-1">
            <Target className="w-3.5 h-3.5" />
            <span>Payoff Time</span>
          </div>
          <p className={`font-bold ${monthsToPayoff === Infinity ? 'text-coral-400' : 'text-emerald-400'}`}>
            {yearsToPayoff}
          </p>
        </div>
      </div>

      {/* Type Badge */}
      <div className="mt-4 flex justify-end">
        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${typeColors[debt.debtType]}`}>
          {debt.debtType}
        </span>
      </div>
    </div>
  );
}

function DebtModal({ isOpen, onClose, debt, users, onSave }) {
  const isEditing = !!debt;
  const [formData, setFormData] = useState({
    userId: debt?.userId || users[0]?.id || '',
    name: debt?.name || '',
    totalPrincipal: debt?.totalPrincipal || '',
    remainingBalance: debt?.remainingBalance || '',
    interestRate: debt?.interestRate || 0,
    monthlyPayment: debt?.monthlyPayment || '',
    debtType: debt?.debtType || 'Static Loan',
    startDate: debt?.startDate ? new Date(debt.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    targetPayoffDate: debt?.targetPayoffDate ? new Date(debt.targetPayoffDate).toISOString().split('T')[0] : '',
  });
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    
    try {
      await onSave({
        ...formData,
        remainingBalance: formData.remainingBalance || formData.totalPrincipal,
      }, debt?.id);
      onClose();
    } catch (err) {
      console.error('Failed to save debt:', err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-sm animate-fade-in">
      <div className="glass rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-navy-700/50">
          <h2 className="text-xl font-bold text-white">
            {isEditing ? 'Edit Debt' : 'Add New Debt'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-navy-400 hover:text-white hover:bg-navy-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* User Selection */}
          <div>
            <label className="block text-sm text-navy-400 mb-1.5">User</label>
            <select
              value={formData.userId}
              onChange={(e) => setFormData(prev => ({ ...prev, userId: e.target.value }))}
              className="w-full bg-navy-800 border border-navy-600 rounded-xl px-4 py-2.5 text-white"
              required
            >
              {users.map(user => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>
          </div>

          {/* Debt Name */}
          <div>
            <label className="block text-sm text-navy-400 mb-1.5">Debt Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Chase Credit Card, Car Loan"
              className="w-full bg-navy-800 border border-navy-600 rounded-xl px-4 py-2.5 text-white placeholder-navy-500"
              required
            />
          </div>

          {/* Debt Type */}
          <div>
            <label className="block text-sm text-navy-400 mb-1.5">Debt Type</label>
            <select
              value={formData.debtType}
              onChange={(e) => setFormData(prev => ({ ...prev, debtType: e.target.value }))}
              className="w-full bg-navy-800 border border-navy-600 rounded-xl px-4 py-2.5 text-white"
            >
              {DEBT_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* Amounts Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-navy-400 mb-1.5">Total Principal</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400">₪</span>
                <input
                  type="number"
                  value={formData.totalPrincipal}
                  onChange={(e) => setFormData(prev => ({ ...prev, totalPrincipal: e.target.value }))}
                  placeholder="0.00"
                  className="w-full bg-navy-800 border border-navy-600 rounded-xl px-4 pl-7 py-2.5 text-white placeholder-navy-500"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-navy-400 mb-1.5">Remaining Balance</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400">₪</span>
                <input
                  type="number"
                  value={formData.remainingBalance}
                  onChange={(e) => setFormData(prev => ({ ...prev, remainingBalance: e.target.value }))}
                  placeholder="Same as principal"
                  className="w-full bg-navy-800 border border-navy-600 rounded-xl px-4 pl-7 py-2.5 text-white placeholder-navy-500"
                />
              </div>
            </div>
          </div>

          {/* Interest & Payment Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-navy-400 mb-1.5">Interest Rate (%)</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  value={formData.interestRate}
                  onChange={(e) => setFormData(prev => ({ ...prev, interestRate: e.target.value }))}
                  placeholder="0.00"
                  className="w-full bg-navy-800 border border-navy-600 rounded-xl px-4 pr-7 py-2.5 text-white placeholder-navy-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400">%</span>
              </div>
            </div>
            <div>
              <label className="block text-sm text-navy-400 mb-1.5">Monthly Payment</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400">₪</span>
                <input
                  type="number"
                  value={formData.monthlyPayment}
                  onChange={(e) => setFormData(prev => ({ ...prev, monthlyPayment: e.target.value }))}
                  placeholder="0.00"
                  className="w-full bg-navy-800 border border-navy-600 rounded-xl px-4 pl-7 py-2.5 text-white placeholder-navy-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Dates Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-navy-400 mb-1.5">Start Date</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full bg-navy-800 border border-navy-600 rounded-xl px-4 py-2.5 text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-navy-400 mb-1.5">Target Payoff (optional)</label>
              <input
                type="date"
                value={formData.targetPayoffDate}
                onChange={(e) => setFormData(prev => ({ ...prev, targetPayoffDate: e.target.value }))}
                className="w-full bg-navy-800 border border-navy-600 rounded-xl px-4 py-2.5 text-white"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-medium rounded-xl hover:from-emerald-400 hover:to-emerald-500 transition-all shadow-lg shadow-emerald-500/25"
            >
              {saving ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>{isEditing ? 'Update Debt' : 'Add Debt'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function DebtManager({ userId, users }) {
  const { debts, loading, error, createDebt, updateDebt, deleteDebt } = useDebts(userId);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState(null);

  function handleEdit(debt) {
    setEditingDebt(debt);
    setIsModalOpen(true);
  }

  async function handleDelete(id) {
    if (confirm('Are you sure you want to delete this debt?')) {
      await deleteDebt(id);
    }
  }

  async function handleSave(data, id) {
    if (id) {
      await updateDebt(id, data);
    } else {
      await createDebt(data);
    }
  }

  function handleCloseModal() {
    setIsModalOpen(false);
    setEditingDebt(null);
  }

  // Calculate totals
  const totalDebt = debts.reduce((sum, d) => sum + (d.remainingBalance || 0), 0);
  const totalMonthlyPayments = debts.reduce((sum, d) => sum + (d.monthlyPayment || 0), 0);
  const highestInterest = debts.length > 0 
    ? Math.max(...debts.map(d => d.interestRate || 0))
    : 0;

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
          <h1 className="text-2xl font-bold text-white">Debt Manager</h1>
          <p className="text-navy-400">Track and manage your debts</p>
        </div>
        
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-medium rounded-xl hover:from-emerald-400 hover:to-emerald-500 transition-all shadow-lg shadow-emerald-500/25"
        >
          <Plus className="w-5 h-5" />
          <span>Add Debt</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass rounded-2xl p-6">
          <p className="text-sm text-navy-400 mb-2">Total Debt</p>
          <p className="text-3xl font-bold text-coral-400 font-mono">
            {formatCurrency(totalDebt)}
          </p>
        </div>
        <div className="glass rounded-2xl p-6">
          <p className="text-sm text-navy-400 mb-2">Monthly Payments</p>
          <p className="text-3xl font-bold text-white font-mono">
            {formatCurrency(totalMonthlyPayments)}
          </p>
        </div>
        <div className="glass rounded-2xl p-6">
          <p className="text-sm text-navy-400 mb-2">Highest Interest</p>
          <p className={`text-3xl font-bold font-mono ${highestInterest > 15 ? 'text-coral-400' : 'text-white'}`}>
            {highestInterest}%
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-coral-500/10 border border-coral-500/30 rounded-xl p-4 text-coral-400">
          {error}
        </div>
      )}

      {/* Debts Grid */}
      {debts.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <CreditCard className="w-16 h-16 text-navy-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No Debts Tracked</h3>
          <p className="text-navy-400 mb-6">Start tracking your debts to see payoff projections and smart suggestions.</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-medium rounded-xl hover:from-emerald-400 hover:to-emerald-500 transition-all"
          >
            <Plus className="w-5 h-5" />
            <span>Add Your First Debt</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {debts.map((debt, index) => (
            <div key={debt.id} className="animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
              <DebtCard 
                debt={debt}
                users={users}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <DebtModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        debt={editingDebt}
        users={users}
        onSave={handleSave}
      />
    </div>
  );
}

