import { useState, useEffect, useCallback } from 'react';
import { loanAPI } from '../../api';
import { formatCurrency } from '../../hooks/useFinanceData';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Building2, 
  Car, 
  GraduationCap,
  Home,
  Calculator,
  X,
  Save,
  TrendingDown,
  Calendar,
  Percent
} from 'lucide-react';

const LOAN_ICONS = {
  'Mortgage': Home,
  'Car': Car,
  'Student': GraduationCap,
  'default': Building2,
};

function getLoanIcon(name) {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('mortgage') || lowerName.includes('home') || lowerName.includes('house')) return Home;
  if (lowerName.includes('car') || lowerName.includes('auto') || lowerName.includes('vehicle')) return Car;
  if (lowerName.includes('student') || lowerName.includes('education')) return GraduationCap;
  return Building2;
}

function calculateMonthsRemaining(remainingBalance, monthlyPayment, interestRate) {
  if (monthlyPayment <= 0 || remainingBalance <= 0) return 0;
  if (interestRate === 0) return Math.ceil(remainingBalance / monthlyPayment);
  
  const monthlyRate = interestRate / 100 / 12;
  const monthlyInterest = remainingBalance * monthlyRate;
  if (monthlyPayment <= monthlyInterest) return Infinity;
  
  const n = -Math.log(1 - (monthlyRate * remainingBalance) / monthlyPayment) / Math.log(1 + monthlyRate);
  return Math.ceil(n);
}

export default function LoansManager({ userId, users }) {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLoan, setEditingLoan] = useState(null);

  const loadLoans = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (userId !== 'family') params.userId = userId;
      const data = await loanAPI.getAll(params);
      setLoans(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadLoans();
  }, [loadLoans]);

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this loan?')) return;
    try {
      await loanAPI.delete(id);
      await loadLoans();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSave(data, id) {
    try {
      if (id) {
        await loanAPI.update(id, data);
      } else {
        await loanAPI.create(data);
      }
      await loadLoans();
      setIsModalOpen(false);
      setEditingLoan(null);
    } catch (err) {
      throw err;
    }
  }

  // Calculate totals
  const totalRemaining = loans.reduce((sum, l) => sum + (l.remainingBalance || 0), 0);
  const totalMonthly = loans.reduce((sum, l) => sum + (l.monthlyPayment || 0), 0);
  const totalPrincipal = loans.reduce((sum, l) => sum + (l.totalPrincipal || 0), 0);
  const totalPaid = totalPrincipal - totalRemaining;

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
          <h1 className="text-2xl font-bold text-white">Loans</h1>
          <p className="text-navy-400">Fixed monthly payment loans</p>
        </div>
        <button
          onClick={() => { setEditingLoan(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-medium rounded-xl hover:from-emerald-400 hover:to-emerald-500 transition-all shadow-lg shadow-emerald-500/25"
        >
          <Plus className="w-5 h-5" />
          <span>Add Loan</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass rounded-2xl p-5">
          <p className="text-sm text-navy-400 mb-2">Total Remaining</p>
          <p className="text-2xl font-bold text-coral-400 font-mono">
            {formatCurrency(totalRemaining)}
          </p>
        </div>
        <div className="glass rounded-2xl p-5">
          <p className="text-sm text-navy-400 mb-2">Monthly Payments</p>
          <p className="text-2xl font-bold text-white font-mono">
            {formatCurrency(totalMonthly)}
          </p>
        </div>
        <div className="glass rounded-2xl p-5">
          <p className="text-sm text-navy-400 mb-2">Total Paid Off</p>
          <p className="text-2xl font-bold text-emerald-400 font-mono">
            {formatCurrency(totalPaid)}
          </p>
        </div>
        <div className="glass rounded-2xl p-5">
          <p className="text-sm text-navy-400 mb-2">Active Loans</p>
          <p className="text-2xl font-bold text-white font-mono">
            {loans.length}
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-coral-500/10 border border-coral-500/30 rounded-xl p-4 text-coral-400">
          {error}
        </div>
      )}

      {/* Loans List */}
      {loans.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <Building2 className="w-16 h-16 text-navy-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No Loans Yet</h3>
          <p className="text-navy-400 mb-6">Add your first loan to track payments and progress.</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-medium rounded-xl"
          >
            <Plus className="w-5 h-5" />
            <span>Add Your First Loan</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {loans.map((loan, index) => (
            <LoanCard 
              key={loan.id}
              loan={loan}
              onEdit={() => { setEditingLoan(loan); setIsModalOpen(true); }}
              onDelete={() => handleDelete(loan.id)}
              style={{ animationDelay: `${index * 100}ms` }}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      <LoanModal 
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingLoan(null); }}
        loan={editingLoan}
        users={users}
        onSave={handleSave}
      />
    </div>
  );
}

function LoanCard({ loan, onEdit, onDelete, style }) {
  const Icon = getLoanIcon(loan.name);
  const monthsRemaining = calculateMonthsRemaining(
    loan.remainingBalance,
    loan.monthlyPayment,
    loan.interestRate
  );
  
  const progressPercent = loan.totalPrincipal > 0
    ? ((loan.totalPrincipal - loan.remainingBalance) / loan.totalPrincipal) * 100
    : 0;

  const yearsRemaining = monthsRemaining === Infinity 
    ? '∞' 
    : monthsRemaining > 12 
      ? `${Math.floor(monthsRemaining / 12)}y ${monthsRemaining % 12}m`
      : `${monthsRemaining}m`;

  return (
    <div className="glass rounded-2xl p-6 group animate-slide-up" style={style}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-violet-500/20 border border-violet-500/30">
            <Icon className="w-6 h-6 text-violet-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{loan.name}</h3>
            <p className="text-sm text-navy-400">{loan.user?.name}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onEdit} className="p-2 rounded-lg bg-navy-700/50 text-navy-400 hover:text-white">
            <Edit2 className="w-4 h-4" />
          </button>
          <button onClick={onDelete} className="p-2 rounded-lg bg-navy-700/50 text-navy-400 hover:text-coral-400">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-navy-400">Paid off</span>
          <span className="text-emerald-400 font-medium">{progressPercent.toFixed(1)}%</span>
        </div>
        <div className="h-2 bg-navy-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-navy-800/50 rounded-xl p-3">
          <p className="text-xs text-navy-400 mb-1">Remaining</p>
          <p className="text-white font-bold font-mono">{formatCurrency(loan.remainingBalance)}</p>
        </div>
        <div className="bg-navy-800/50 rounded-xl p-3">
          <p className="text-xs text-navy-400 mb-1">Monthly</p>
          <p className="text-white font-bold font-mono">{formatCurrency(loan.monthlyPayment)}</p>
        </div>
        <div className="bg-navy-800/50 rounded-xl p-3">
          <p className="text-xs text-navy-400 mb-1">Interest</p>
          <p className="text-white font-bold font-mono">{loan.interestRate}%</p>
        </div>
        <div className="bg-navy-800/50 rounded-xl p-3">
          <p className="text-xs text-navy-400 mb-1">Time Left</p>
          <p className="text-emerald-400 font-bold">{yearsRemaining}</p>
        </div>
      </div>
    </div>
  );
}

function LoanModal({ isOpen, onClose, loan, users, onSave }) {
  const [formData, setFormData] = useState({
    userId: '',
    name: '',
    totalPrincipal: '',
    remainingBalance: '',
    interestRate: '',
    monthlyPayment: '',
    startDate: new Date().toISOString().split('T')[0],
    targetPayoffDate: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (loan) {
      setFormData({
        userId: loan.userId,
        name: loan.name,
        totalPrincipal: loan.totalPrincipal,
        remainingBalance: loan.remainingBalance,
        interestRate: loan.interestRate || '',
        monthlyPayment: loan.monthlyPayment,
        startDate: loan.startDate ? new Date(loan.startDate).toISOString().split('T')[0] : '',
        targetPayoffDate: loan.targetPayoffDate ? new Date(loan.targetPayoffDate).toISOString().split('T')[0] : '',
      });
    } else {
      setFormData({
        userId: users[0]?.id || '',
        name: '',
        totalPrincipal: '',
        remainingBalance: '',
        interestRate: '',
        monthlyPayment: '',
        startDate: new Date().toISOString().split('T')[0],
        targetPayoffDate: '',
      });
    }
  }, [loan, users]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    
    try {
      await onSave(formData, loan?.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-sm animate-fade-in">
      <div className="glass rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-navy-700/50">
          <h2 className="text-xl font-bold text-white">
            {loan ? 'Edit Loan' : 'Add New Loan'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg text-navy-400 hover:text-white hover:bg-navy-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-coral-500/10 border border-coral-500/30 rounded-xl p-3 text-coral-400 text-sm">
              {error}
            </div>
          )}

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

          <div>
            <label className="block text-sm text-navy-400 mb-1.5">Loan Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Home Mortgage, Car Loan"
              className="w-full bg-navy-800 border border-navy-600 rounded-xl px-4 py-2.5 text-white"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-navy-400 mb-1.5">Original Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400">₪</span>
                <input
                  type="number"
                  value={formData.totalPrincipal}
                  onChange={(e) => setFormData(prev => ({ ...prev, totalPrincipal: e.target.value }))}
                  className="w-full bg-navy-800 border border-navy-600 rounded-xl pl-8 pr-4 py-2.5 text-white"
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
                  placeholder="Same as original"
                  className="w-full bg-navy-800 border border-navy-600 rounded-xl pl-8 pr-4 py-2.5 text-white"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-navy-400 mb-1.5">Monthly Payment</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400">₪</span>
                <input
                  type="number"
                  value={formData.monthlyPayment}
                  onChange={(e) => setFormData(prev => ({ ...prev, monthlyPayment: e.target.value }))}
                  className="w-full bg-navy-800 border border-navy-600 rounded-xl pl-8 pr-4 py-2.5 text-white"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-navy-400 mb-1.5">Interest Rate</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  value={formData.interestRate}
                  onChange={(e) => setFormData(prev => ({ ...prev, interestRate: e.target.value }))}
                  placeholder="0"
                  className="w-full bg-navy-800 border border-navy-600 rounded-xl px-4 pr-8 py-2.5 text-white"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400">%</span>
              </div>
            </div>
          </div>

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
              <label className="block text-sm text-navy-400 mb-1.5">Target Payoff</label>
              <input
                type="date"
                value={formData.targetPayoffDate}
                onChange={(e) => setFormData(prev => ({ ...prev, targetPayoffDate: e.target.value }))}
                className="w-full bg-navy-800 border border-navy-600 rounded-xl px-4 py-2.5 text-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-medium rounded-xl hover:from-emerald-400 hover:to-emerald-500 transition-all mt-6"
          >
            {saving ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>{loan ? 'Update Loan' : 'Add Loan'}</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

