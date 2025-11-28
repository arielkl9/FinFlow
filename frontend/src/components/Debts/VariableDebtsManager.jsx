import { useState, useEffect, useCallback } from 'react';
import { variableDebtAPI } from '../../api';
import { formatCurrency, formatMonth, getCurrentMonth } from '../../hooks/useFinanceData';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  CreditCard,
  Zap,
  TrendingDown,
  X,
  Save,
  Calendar,
  History,
  ChevronDown,
  ChevronUp,
  Check,
  Clock,
  Banknote,
  ShoppingCart,
  ArrowUpCircle
} from 'lucide-react';

export default function VariableDebtsManager({ userId, users, monthYear }) {
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState(null);
  const [paymentInputs, setPaymentInputs] = useState({});
  const [savingPayment, setSavingPayment] = useState({});
  
  // Balance update modal state
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
  const [balanceUpdateDebt, setBalanceUpdateDebt] = useState(null);

  const currentMonth = monthYear || getCurrentMonth();

  const loadDebts = useCallback(async () => {
    try {
      setLoading(true);
      const params = { monthYear: currentMonth };
      if (userId !== 'family') params.userId = userId;
      const data = await variableDebtAPI.getAll(params);
      setDebts(data);
      
      // Initialize payment inputs with current month payments
      const inputs = {};
      data.forEach(d => {
        inputs[d.id] = d.currentMonthPayment || '';
      });
      setPaymentInputs(inputs);
      
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId, currentMonth]);

  useEffect(() => {
    loadDebts();
  }, [loadDebts]);

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this card?')) return;
    try {
      await variableDebtAPI.delete(id);
      await loadDebts();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSave(data, id) {
    try {
      if (id) {
        await variableDebtAPI.update(id, data);
      } else {
        await variableDebtAPI.create(data);
      }
      await loadDebts();
      setIsModalOpen(false);
      setEditingDebt(null);
    } catch (err) {
      throw err;
    }
  }

  async function handleSavePayment(debtId) {
    const amount = parseFloat(paymentInputs[debtId]) || 0;
    setSavingPayment(prev => ({ ...prev, [debtId]: true }));
    
    try {
      await variableDebtAPI.recordPayment(debtId, {
        amount,
        monthYear: currentMonth,
        updateBalance: true,
      });
      await loadDebts();
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingPayment(prev => ({ ...prev, [debtId]: false }));
    }
  }

  async function handlePayFull(debtId) {
    setSavingPayment(prev => ({ ...prev, [debtId]: true }));
    
    try {
      await variableDebtAPI.payFull(debtId, { monthYear: currentMonth });
      await loadDebts();
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingPayment(prev => ({ ...prev, [debtId]: false }));
    }
  }

  // Open balance update modal
  function handleOpenBalanceModal(debt) {
    setBalanceUpdateDebt(debt);
    setIsBalanceModalOpen(true);
  }

  // Update balance to new value (SET, not add)
  async function handleUpdateBalance(debtId, newBalance) {
    try {
      await variableDebtAPI.updateBalance(debtId, parseFloat(newBalance));
      await loadDebts();
      setIsBalanceModalOpen(false);
      setBalanceUpdateDebt(null);
    } catch (err) {
      setError(err.message);
    }
  }

  // Delete payment and revert balance
  async function handleDeletePayment(debtId, paymentId) {
    if (!confirm('Delete this payment? The balance will be restored.')) return;
    try {
      await variableDebtAPI.deletePayment(debtId, paymentId, true);
      await loadDebts();
    } catch (err) {
      setError(err.message);
    }
  }

  // Delete transaction (disabled for now)
  async function handleDeleteTransaction(debtId, transactionId) {
    // Transactions feature disabled
    alert('Transaction history feature is not yet available.');
  }

  // Separate regular debts and temporary debts
  const regularDebts = debts.filter(d => !d.isTemporary);
  const temporaryDebts = debts.filter(d => d.isTemporary);

  // Calculate totals - separate ongoing from one-time
  const totalDebt = debts.reduce((sum, d) => sum + (d.currentBalance || 0), 0);
  const totalPaymentsThisMonth = debts.reduce((sum, d) => sum + (d.currentMonthPayment || 0), 0);
  
  // Only ongoing debts have minimum payments
  const totalMinimum = regularDebts.reduce((sum, d) => sum + (d.minimumPayment || 0), 0);
  
  // One-time debts: full balance is due
  const totalOneTime = temporaryDebts.reduce((sum, d) => sum + (d.currentBalance || 0), 0);
  
  // Total required this month = minimums + one-time
  const totalThisMonth = totalMinimum + totalOneTime;

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
          <h1 className="text-2xl font-bold text-white">Credit Cards</h1>
          <p className="text-navy-400">Track balances, payments, and pay down your cards</p>
        </div>
        <button
          onClick={() => { setEditingDebt(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-medium rounded-xl hover:from-emerald-400 hover:to-emerald-500 transition-all shadow-lg shadow-emerald-500/25"
        >
          <Plus className="w-5 h-5" />
          <span>Add Card</span>
        </button>
      </div>

      {/* Current Month Banner */}
      <div className="glass rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-amber-400" />
          <div>
            <p className="text-white font-medium">Recording payments for {formatMonth(currentMonth)}</p>
            <p className="text-sm text-navy-400">Enter how much you paid down each debt this month</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="space-y-4">
        {/* Top Row: Balance & Paid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="glass rounded-2xl p-5">
            <p className="text-sm text-navy-400 mb-2">Total Balance</p>
            <p className="text-2xl font-bold text-coral-400 font-mono">
              {formatCurrency(totalDebt)}
            </p>
          </div>
          <div className="glass rounded-2xl p-5">
            <p className="text-sm text-navy-400 mb-2">Paid This Month</p>
            <p className="text-2xl font-bold text-emerald-400 font-mono">
              {formatCurrency(totalPaymentsThisMonth)}
            </p>
          </div>
        </div>

        {/* Bottom Row: Monthly Minimum + One-Time + Total */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="w-4 h-4 text-amber-400" />
              <p className="text-sm text-navy-400">Monthly Minimum</p>
            </div>
            <p className="text-2xl font-bold text-amber-400 font-mono">
              {formatCurrency(totalMinimum)}
            </p>
            <p className="text-xs text-navy-500 mt-1">Ongoing cards only</p>
          </div>
          <div className="glass rounded-2xl p-5 border border-pink-500/30">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-pink-400" />
              <p className="text-sm text-navy-400">One-Time Payments</p>
            </div>
            <p className="text-2xl font-bold text-pink-400 font-mono">
              {formatCurrency(totalOneTime)}
            </p>
            <p className="text-xs text-navy-500 mt-1">Pay in full this month</p>
          </div>
          <div className="glass rounded-2xl p-5 border border-coral-500/30 bg-coral-500/5">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-coral-400" />
              <p className="text-sm text-navy-400">Total This Month</p>
            </div>
            <p className="text-2xl font-bold text-coral-400 font-mono">
              {formatCurrency(totalThisMonth)}
            </p>
            <p className="text-xs text-navy-500 mt-1">Minimum + One-time</p>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-coral-500/10 border border-coral-500/30 rounded-xl p-4 text-coral-400">
          {error}
        </div>
      )}

      {/* Full Payment Cards Section - No revolving debt */}
      {temporaryDebts.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-semibold text-white">Full Payment Cards</h2>
            <span className="text-xs text-navy-400 bg-navy-700/50 px-2 py-0.5 rounded-full">
              No revolving debt
            </span>
          </div>
          <div className="space-y-4">
            {temporaryDebts.map((debt, index) => (
              <TemporaryDebtCard
                key={debt.id}
                debt={debt}
                currentMonth={currentMonth}
                onPayFull={() => handlePayFull(debt.id)}
                isSaving={savingPayment[debt.id]}
                onEdit={() => { setEditingDebt(debt); setIsModalOpen(true); }}
                onDelete={() => handleDelete(debt.id)}
                onUpdateBalance={() => handleOpenBalanceModal(debt)}
                onDeletePayment={(paymentId) => handleDeletePayment(debt.id, paymentId)}
                style={{ animationDelay: `${index * 100}ms` }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Regular Cards Section */}
      {debts.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <CreditCard className="w-16 h-16 text-navy-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No Credit Cards Yet</h3>
          <p className="text-navy-400 mb-6">Add your credit cards to track balances and payments.</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-medium rounded-xl"
          >
            <Plus className="w-5 h-5" />
            <span>Add Your First Card</span>
          </button>
        </div>
      ) : regularDebts.length > 0 && (
        <div className="space-y-4">
          {temporaryDebts.length > 0 && (
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-coral-400" />
              <h2 className="text-lg font-semibold text-white">Revolving Credit Cards</h2>
              <span className="text-xs text-navy-400 bg-navy-700/50 px-2 py-0.5 rounded-full">
                Minimum payments
              </span>
            </div>
          )}
          {regularDebts.map((debt, index) => (
            <DebtCard 
              key={debt.id}
              debt={debt}
              currentMonth={currentMonth}
              paymentValue={paymentInputs[debt.id]}
              onPaymentChange={(val) => setPaymentInputs(prev => ({ ...prev, [debt.id]: val }))}
              onSavePayment={() => handleSavePayment(debt.id)}
              isSaving={savingPayment[debt.id]}
              onEdit={() => { setEditingDebt(debt); setIsModalOpen(true); }}
              onDelete={() => handleDelete(debt.id)}
              onUpdateBalance={() => handleOpenBalanceModal(debt)}
              onDeletePayment={(paymentId) => handleDeletePayment(debt.id, paymentId)}
              style={{ animationDelay: `${index * 100}ms` }}
            />
          ))}
        </div>
      )}

      {/* Card Edit Modal */}
      <DebtModal 
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingDebt(null); }}
        debt={editingDebt}
        users={users}
        onSave={handleSave}
      />

      {/* Balance Update Modal */}
      <BalanceUpdateModal
        isOpen={isBalanceModalOpen}
        onClose={() => { setIsBalanceModalOpen(false); setBalanceUpdateDebt(null); }}
        debt={balanceUpdateDebt}
        onSave={handleUpdateBalance}
      />
    </div>
  );
}

// Card for temporary (one-time payment) cards - no revolving debt
function TemporaryDebtCard({ debt, currentMonth, onPayFull, isSaving, onEdit, onDelete, onUpdateBalance, onDeletePayment, style }) {
  const [showHistory, setShowHistory] = useState(false);
  const isPaidOff = debt.currentBalance === 0;
  const hasPayment = debt.currentMonthPayment > 0;
  const creditLeft = debt.creditLimit > 0 ? debt.creditLimit - debt.currentBalance : null;

  return (
    <div className={`glass rounded-2xl overflow-hidden animate-slide-up border-l-4 ${isPaidOff ? 'border-l-emerald-500' : 'border-l-amber-500'}`} style={style}>
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${isPaidOff ? 'bg-emerald-500/20 border-emerald-500/30' : 'bg-amber-500/20 border-amber-500/30'} border`}>
              <CreditCard className={`w-6 h-6 ${isPaidOff ? 'text-emerald-400' : 'text-amber-400'}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-white">{debt.name}</h3>
                <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">
                  Full Payment
                </span>
              </div>
              <p className="text-sm text-navy-400">{debt.user?.name}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button onClick={onEdit} className="p-2 rounded-lg bg-navy-700/50 text-navy-400 hover:text-white">
              <Edit2 className="w-4 h-4" />
            </button>
            <button onClick={onDelete} className="p-2 rounded-lg bg-navy-700/50 text-navy-400 hover:text-coral-400">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Card stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-navy-800/50 rounded-xl p-3 text-center">
            <p className="text-xs text-navy-400 mb-1">Balance</p>
            <p className={`text-xl font-bold font-mono ${isPaidOff ? 'text-emerald-400' : 'text-coral-400'}`}>
              {formatCurrency(debt.currentBalance)}
            </p>
          </div>
          <div className="bg-navy-800/50 rounded-xl p-3 text-center">
            <p className="text-xs text-navy-400 mb-1">Credit Left</p>
            <p className={`text-xl font-bold font-mono ${creditLeft !== null && creditLeft > 0 ? 'text-emerald-400' : 'text-navy-500'}`}>
              {creditLeft !== null ? formatCurrency(creditLeft) : '—'}
            </p>
          </div>
          <div className="bg-navy-800/50 rounded-xl p-3 text-center">
            <p className="text-xs text-navy-400 mb-1">Credit Limit</p>
            <p className="text-xl font-bold text-cyan-400 font-mono">
              {debt.creditLimit > 0 ? formatCurrency(debt.creditLimit) : '—'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={onUpdateBalance}
            className="flex items-center gap-2 px-3 py-2 bg-navy-700/50 text-navy-300 rounded-lg hover:bg-navy-700 hover:text-white transition-colors text-sm"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Update Balance</span>
          </button>
          
          {!isPaidOff ? (
            <button
              onClick={onPayFull}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-medium rounded-lg hover:from-amber-400 hover:to-amber-500 transition-all disabled:opacity-50 ml-auto"
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Banknote className="w-4 h-4" />
                  <span>Pay Full</span>
                </>
              )}
            </button>
          ) : (
            <div className="flex items-center gap-2 ml-auto">
              <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 font-medium rounded-lg">
                <Check className="w-4 h-4" />
                <span>Paid</span>
              </div>
            </div>
          )}
        </div>
        
        {hasPayment && (
          <p className="text-sm text-emerald-400 mb-3">
            ✓ Payment of {formatCurrency(debt.currentMonthPayment)} recorded for {formatMonth(currentMonth)}
          </p>
        )}

        {/* Payment History Toggle */}
        {debt.payments && debt.payments.length > 0 && (
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 text-sm text-navy-400 hover:text-white transition-colors mt-2"
          >
            <History className="w-4 h-4" />
            <span>Payment History ({debt.payments.length})</span>
            {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Payment History */}
      {showHistory && debt.payments && debt.payments.length > 0 && (
        <div className="border-t border-navy-700/50 p-4 bg-navy-800/30">
          <p className="text-xs text-navy-500 mb-2">Monthly Payments</p>
          <div className="space-y-2">
            {debt.payments.slice(0, 12).map(payment => (
              <div key={payment.id} className="flex justify-between text-sm items-center group">
                <span className="text-navy-400">{formatMonth(payment.monthYear)}</span>
                <div className="flex items-center gap-2">
                  <span className="text-white font-mono">{formatCurrency(payment.amount)}</span>
                  <button
                    onClick={() => onDeletePayment(payment.id)}
                    className="p-1 rounded text-navy-500 hover:text-coral-400 hover:bg-coral-500/10 opacity-0 group-hover:opacity-100 transition-all"
                    title="Delete payment (reverts balance)"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Card for regular ongoing debts (revolving credit)
function DebtCard({ debt, currentMonth, paymentValue, onPaymentChange, onSavePayment, isSaving, onEdit, onDelete, onUpdateBalance, onDeletePayment, style }) {
  const [showHistory, setShowHistory] = useState(false);
  
  const hasPayment = debt.currentMonthPayment > 0;
  const meetsMinimum = (parseFloat(paymentValue) || 0) >= debt.minimumPayment;
  const creditLeft = debt.creditLimit > 0 ? debt.creditLimit - debt.currentBalance : null;

  return (
    <div className="glass rounded-2xl overflow-hidden animate-slide-up" style={style}>
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${hasPayment ? 'bg-emerald-500/20 border-emerald-500/30' : 'bg-coral-500/20 border-coral-500/30'} border`}>
              <CreditCard className={`w-6 h-6 ${hasPayment ? 'text-emerald-400' : 'text-coral-400'}`} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">{debt.name}</h3>
              <p className="text-sm text-navy-400">{debt.user?.name}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button onClick={onEdit} className="p-2 rounded-lg bg-navy-700/50 text-navy-400 hover:text-white">
              <Edit2 className="w-4 h-4" />
            </button>
            <button onClick={onDelete} className="p-2 rounded-lg bg-navy-700/50 text-navy-400 hover:text-coral-400">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="bg-navy-800/50 rounded-xl p-3 text-center">
            <p className="text-xs text-navy-400 mb-1">Balance</p>
            <p className="text-xl font-bold text-coral-400 font-mono">{formatCurrency(debt.currentBalance)}</p>
          </div>
          <div className="bg-navy-800/50 rounded-xl p-3 text-center">
            <p className="text-xs text-navy-400 mb-1">Credit Left</p>
            <p className={`text-xl font-bold font-mono ${creditLeft !== null && creditLeft > 0 ? 'text-emerald-400' : 'text-navy-500'}`}>
              {creditLeft !== null ? formatCurrency(creditLeft) : '—'}
            </p>
          </div>
          <div className="bg-navy-800/50 rounded-xl p-3 text-center">
            <p className="text-xs text-navy-400 mb-1">Credit Limit</p>
            <p className="text-xl font-bold text-cyan-400 font-mono">
              {debt.creditLimit > 0 ? formatCurrency(debt.creditLimit) : '—'}
            </p>
          </div>
          <div className="bg-navy-800/50 rounded-xl p-3 text-center">
            <p className="text-xs text-navy-400 mb-1">Min Payment</p>
            <p className="text-xl font-bold text-amber-400 font-mono">{formatCurrency(debt.minimumPayment)}</p>
          </div>
        </div>

        {/* Update Balance Button */}
        <button
          onClick={onUpdateBalance}
          className="flex items-center gap-2 px-3 py-2 mb-4 bg-navy-700/50 text-navy-300 rounded-lg hover:bg-navy-700 hover:text-white transition-colors text-sm w-full justify-center"
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Update Balance (New Purchases)</span>
        </button>

        {/* Payment Input */}
        <div className="bg-navy-800/30 rounded-xl p-4">
          <label className="flex items-center gap-2 text-sm text-navy-400 mb-3">
            <TrendingDown className="w-4 h-4" />
            How much did you pay this month?
          </label>
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400">₪</span>
              <input
                type="number"
                value={paymentValue}
                onChange={(e) => onPaymentChange(e.target.value)}
                placeholder="0"
                className={`w-full bg-navy-800 border rounded-xl pl-8 pr-4 py-3 text-xl font-mono text-white ${
                  meetsMinimum ? 'border-emerald-500/50' : 'border-navy-600'
                }`}
              />
            </div>
            <button
              onClick={onSavePayment}
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-medium rounded-xl hover:from-emerald-400 hover:to-emerald-500 transition-all disabled:opacity-50"
            >
              {isSaving ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : hasPayment ? (
                <>
                  <Check className="w-5 h-5" />
                  <span>Update</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Save</span>
                </>
              )}
            </button>
          </div>
          {!meetsMinimum && debt.minimumPayment > 0 && (
            <p className="text-sm text-amber-400 mt-2">
              ⚠️ Below minimum payment of {formatCurrency(debt.minimumPayment)}
            </p>
          )}
          {hasPayment && (
            <p className="text-sm text-emerald-400 mt-2">
              ✓ Payment of {formatCurrency(debt.currentMonthPayment)} recorded for {formatMonth(currentMonth)}
            </p>
          )}
        </div>

        {/* Payment History Toggle */}
        {debt.payments && debt.payments.length > 0 && (
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 text-sm text-navy-400 hover:text-white transition-colors mt-4"
          >
            <History className="w-4 h-4" />
            <span>Payment History ({debt.payments.length})</span>
            {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Payment History */}
      {showHistory && debt.payments && debt.payments.length > 0 && (
        <div className="border-t border-navy-700/50 p-4 bg-navy-800/30">
          <p className="text-xs text-navy-500 mb-2">Monthly Payments</p>
          <div className="space-y-2">
            {debt.payments.slice(0, 12).map(payment => (
              <div key={payment.id} className="flex justify-between text-sm items-center group">
                <span className="text-navy-400">{formatMonth(payment.monthYear)}</span>
                <div className="flex items-center gap-2">
                  <span className="text-white font-mono">{formatCurrency(payment.amount)}</span>
                  <button
                    onClick={() => onDeletePayment(payment.id)}
                    className="p-1 rounded text-navy-500 hover:text-coral-400 hover:bg-coral-500/10 opacity-0 group-hover:opacity-100 transition-all"
                    title="Delete payment"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DebtModal({ isOpen, onClose, debt, users, onSave }) {
  const [formData, setFormData] = useState({
    userId: '',
    name: '',
    currentBalance: '',
    creditLimit: '',
    minimumPayment: '',
    isTemporary: false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (debt) {
      setFormData({
        userId: debt.userId,
        name: debt.name,
        currentBalance: debt.currentBalance,
        creditLimit: debt.creditLimit || '',
        minimumPayment: debt.minimumPayment || '',
        isTemporary: debt.isTemporary || false,
      });
    } else {
      setFormData({
        userId: users[0]?.id || '',
        name: '',
        currentBalance: '',
        creditLimit: '',
        minimumPayment: '',
        isTemporary: false,
      });
    }
  }, [debt, users]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    
    try {
      await onSave(formData, debt?.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-sm animate-fade-in">
      <div className="glass rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-navy-700/50">
          <h2 className="text-xl font-bold text-white">
            {debt ? 'Edit Card' : 'Add Credit Card'}
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

          {/* Card Type Toggle */}
          <div>
            <label className="block text-sm text-navy-400 mb-2">Payment Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, isTemporary: false }))}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${
                  !formData.isTemporary 
                    ? 'bg-coral-500/20 border-coral-500/50 text-coral-400' 
                    : 'bg-navy-800 border-navy-600 text-navy-400 hover:border-navy-500'
                }`}
              >
                <CreditCard className="w-5 h-5" />
                <span className="font-medium">Ongoing</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, isTemporary: true }))}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${
                  formData.isTemporary 
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' 
                    : 'bg-navy-800 border-navy-600 text-navy-400 hover:border-navy-500'
                }`}
              >
                <Zap className="w-5 h-5" />
                <span className="font-medium">One-Time</span>
              </button>
            </div>
            <p className="text-xs text-navy-500 mt-2">
              {formData.isTemporary 
                ? '⚡ No revolving debt - Full balance paid each month'
                : '💳 Revolving debt - Paid down over time with minimum payments'
              }
            </p>
          </div>

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
            <label className="block text-sm text-navy-400 mb-1.5">Card Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder={formData.isTemporary ? "e.g., November Credit Card Bill" : "e.g., Visa, Mastercard, Amex"}
              className="w-full bg-navy-800 border border-navy-600 rounded-xl px-4 py-2.5 text-white"
              required
            />
          </div>

          {/* Current Balance and Credit Limit - same for both card types */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-navy-400 mb-1.5">Current Balance</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400">₪</span>
                <input
                  type="number"
                  value={formData.currentBalance}
                  onChange={(e) => setFormData(prev => ({ ...prev, currentBalance: e.target.value }))}
                  placeholder={formData.isTemporary ? "This month's balance" : "How much do you owe?"}
                  className="w-full bg-navy-800 border border-navy-600 rounded-xl pl-8 pr-4 py-2.5 text-white"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-navy-400 mb-1.5">Credit Limit</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400">₪</span>
                <input
                  type="number"
                  value={formData.creditLimit}
                  onChange={(e) => setFormData(prev => ({ ...prev, creditLimit: e.target.value }))}
                  placeholder="Card limit"
                  className="w-full bg-navy-800 border border-navy-600 rounded-xl pl-8 pr-4 py-2.5 text-white"
                />
              </div>
            </div>
          </div>

          {/* Minimum Payment - only for ongoing cards */}
          {!formData.isTemporary && (
            <div>
              <label className="block text-sm text-navy-400 mb-1.5">Minimum Payment</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400">₪</span>
                <input
                  type="number"
                  value={formData.minimumPayment}
                  onChange={(e) => setFormData(prev => ({ ...prev, minimumPayment: e.target.value }))}
                  placeholder="0"
                  className="w-full bg-navy-800 border border-navy-600 rounded-xl pl-8 pr-4 py-2.5 text-white"
                />
              </div>
            </div>
          )}

          {/* Info text for one-time cards */}
          {formData.isTemporary && (
            <p className="text-xs text-amber-400/70 bg-amber-500/10 rounded-lg px-3 py-2">
              💡 Full balance is due at end of month (no minimum payment)
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className={`w-full flex items-center justify-center gap-2 px-5 py-3 text-white font-medium rounded-xl transition-all mt-6 ${
              formData.isTemporary
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500'
                : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500'
            }`}
          >
            {saving ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>{debt ? 'Update Card' : 'Add Card'}</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

// Modal for updating balance (SET new value directly)
function BalanceUpdateModal({ isOpen, onClose, debt, onSave }) {
  const [newBalance, setNewBalance] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && debt) {
      setNewBalance(debt.currentBalance.toString());
    }
  }, [isOpen, debt]);

  async function handleSubmit(e) {
    e.preventDefault();
    const value = parseFloat(newBalance);
    if (isNaN(value) || value < 0) return;
    
    setSaving(true);
    try {
      await onSave(debt.id, value);
    } finally {
      setSaving(false);
    }
  }

  if (!isOpen || !debt) return null;

  const parsedNew = parseFloat(newBalance) || 0;
  const difference = parsedNew - debt.currentBalance;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-sm animate-fade-in">
      <div className="glass rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-navy-700/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-coral-500/20 border border-coral-500/30">
              <ShoppingCart className="w-5 h-5 text-coral-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Update Balance</h2>
              <p className="text-sm text-navy-400">{debt.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-navy-400 hover:text-white hover:bg-navy-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-navy-800/50 rounded-xl p-4 mb-4">
            <div className="flex justify-between items-center">
              <span className="text-navy-400">Previous Balance</span>
              <span className="text-xl font-bold text-navy-400 font-mono">{formatCurrency(debt.currentBalance)}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm text-navy-400 mb-1.5">New Balance</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400">₪</span>
              <input
                type="number"
                value={newBalance}
                onChange={(e) => setNewBalance(e.target.value)}
                placeholder="Enter new balance"
                className="w-full bg-navy-800 border border-navy-600 rounded-xl pl-8 pr-4 py-3 text-xl font-mono text-white"
                autoFocus
                min="0"
              />
            </div>
            <p className="text-xs text-navy-500 mt-1">Enter the total current balance on your card statement</p>
          </div>

          {difference !== 0 && (
            <div className="bg-navy-800/50 rounded-xl p-4">
              <div className="flex justify-between items-center">
                <span className="text-navy-400">Change</span>
                <span className={`text-lg font-bold font-mono ${difference > 0 ? 'text-coral-400' : 'text-emerald-400'}`}>
                  {difference > 0 ? '+' : ''}{formatCurrency(difference)}
                </span>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={saving || newBalance === ''}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-coral-500 to-coral-600 text-white font-medium rounded-xl hover:from-coral-400 hover:to-coral-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <ArrowUpCircle className="w-5 h-5" />
                <span>Update Balance</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
