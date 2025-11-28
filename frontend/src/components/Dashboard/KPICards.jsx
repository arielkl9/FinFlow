import { TrendingUp, TrendingDown, CreditCard, Wallet, DollarSign, ArrowUpRight, ArrowDownRight, Info, Receipt, Landmark, Banknote } from 'lucide-react';
import { formatCurrency } from '../../hooks/useFinanceData';
import Tooltip from '../Common/Tooltip';

export default function KPICards({ summary }) {
  if (!summary) return null;

  const loanPayments = summary.totalLoanPayments || 0;
  const debtMinimumPayments = summary.totalMinimumPaymentsDue || 0;
  const totalLoanDebt = (summary.totalLoanPayments || 0) + (summary.totalDebtPayments || 0);
  const totalCategoryDebts = summary.totalCategoryDebts || 0;
  const totalExpenses = (summary.totalFixedExpenses || 0) + (summary.totalUtilities || 0) + totalCategoryDebts + totalLoanDebt;
  
  const cards = [
    {
      title: 'Total Income',
      value: summary.totalIncome,
      icon: DollarSign,
      color: 'emerald',
      trend: 'up',
      description: 'Monthly earnings',
      tooltip: 'Sum of all income sources (salary, freelance, etc.)',
    },
    {
      title: 'Total Expenses',
      value: totalExpenses,
      icon: Receipt,
      color: 'coral',
      trend: 'down',
      description: 'All monthly costs',
      tooltip: `Fixed: ${formatCurrency(summary.totalFixedExpenses || 0)}, Utilities: ${formatCurrency(summary.totalUtilities || 0)}, Credit/Debts: ${formatCurrency(totalCategoryDebts)}, Loans & Debts: ${formatCurrency(totalLoanDebt)}`,
    },
    {
      title: 'Fixed & Utilities',
      value: summary.totalFixedExpenses + summary.totalUtilities,
      icon: Wallet,
      color: 'amber',
      trend: 'neutral',
      description: 'Bills & utilities',
      tooltip: 'Regular monthly costs like rent, insurance, and utilities',
    },
    {
      title: 'Net Cash Flow',
      value: summary.netCashFlow,
      icon: summary.netCashFlow >= 0 ? TrendingUp : TrendingDown,
      color: summary.netCashFlow >= 0 ? 'emerald' : 'coral',
      trend: summary.netCashFlow >= 0 ? 'up' : 'down',
      description: summary.netCashFlow >= 0 ? 'Surplus' : 'Deficit',
      tooltip: 'Income minus all expenses. Positive = saving money, Negative = overspending',
    },
  ];

  const colorClasses = {
    emerald: {
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
      icon: 'text-emerald-400',
      glow: 'glow-emerald',
    },
    coral: {
      bg: 'bg-coral-500/10',
      border: 'border-coral-500/30',
      icon: 'text-coral-400',
      glow: 'glow-coral',
    },
    violet: {
      bg: 'bg-violet-500/10',
      border: 'border-violet-500/30',
      icon: 'text-violet-400',
      glow: 'glow-violet',
    },
    amber: {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
      icon: 'text-amber-400',
      glow: '',
    },
  };

  return (
    <div className="space-y-4">
      {/* Main KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, index) => {
          const Icon = card.icon;
          const colors = colorClasses[card.color];
          
          return (
            <div 
              key={card.title}
              className={`glass rounded-2xl p-6 ${colors.glow} animate-slide-up`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl ${colors.bg} ${colors.border} border`}>
                  <Icon className={`w-6 h-6 ${colors.icon}`} />
                </div>
                <div className="flex items-center gap-2">
                  <div className={`flex items-center gap-1 text-xs ${
                    card.trend === 'up' ? 'text-emerald-400' : 
                    card.trend === 'down' ? 'text-coral-400' : 
                    'text-navy-400'
                  }`}>
                    {card.trend === 'up' && <ArrowUpRight className="w-3 h-3" />}
                    {card.trend === 'down' && <ArrowDownRight className="w-3 h-3" />}
                    <span>{card.description}</span>
                  </div>
                  <Tooltip content={card.tooltip} position="left">
                    <Info className="w-3.5 h-3.5 text-navy-500 hover:text-navy-300 cursor-help" />
                  </Tooltip>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-navy-400 mb-1">{card.title}</p>
                <p className={`text-2xl font-bold font-mono ${
                  card.title === 'Net Cash Flow' 
                    ? card.value >= 0 ? 'text-emerald-400' : 'text-coral-400'
                    : 'text-white'
                }`}>
                  {card.value < 0 ? '-' : ''}{formatCurrency(Math.abs(card.value))}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Loans & Debts Breakdown */}
      <div className="glass rounded-2xl p-5 animate-slide-up" style={{ animationDelay: '400ms' }}>
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="w-5 h-5 text-violet-400" />
          <h3 className="text-white font-semibold">Monthly Payment Obligations</h3>
          <Tooltip content="Required monthly payments for loans and debts. This is what you MUST pay each month." position="right">
            <Info className="w-3.5 h-3.5 text-navy-500 hover:text-navy-300 cursor-help" />
          </Tooltip>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Loan Payments */}
          <div className="bg-navy-800/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Landmark className="w-4 h-4 text-violet-400" />
              <span className="text-sm text-navy-400">Loan Payments</span>
            </div>
            <p className="text-xl font-bold text-violet-400 font-mono">
              {formatCurrency(loanPayments)}
            </p>
            <p className="text-xs text-navy-500 mt-1">
              Fixed monthly installments
            </p>
          </div>

          {/* Debt Minimum Payments */}
          <div className="bg-navy-800/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Banknote className="w-4 h-4 text-amber-400" />
              <span className="text-sm text-navy-400">Debt Minimums</span>
            </div>
            <p className="text-xl font-bold text-amber-400 font-mono">
              {formatCurrency(debtMinimumPayments)}
            </p>
            <p className="text-xs text-navy-500 mt-1">
              Required minimum payments
            </p>
          </div>

          {/* Total */}
          <div className="bg-violet-500/10 border border-violet-500/30 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="w-4 h-4 text-violet-400" />
              <span className="text-sm text-navy-400">Total Required</span>
            </div>
            <p className="text-xl font-bold text-white font-mono">
              {formatCurrency(loanPayments + debtMinimumPayments)}
            </p>
            <p className="text-xs text-navy-500 mt-1">
              {formatCurrency(summary.totalLoansRemaining + summary.totalDebtsRemaining)} total remaining
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

