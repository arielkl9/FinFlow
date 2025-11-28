import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useDashboardData, formatCurrency, formatMonth } from '../../hooks/useFinanceData';
import { assetAPI, variableDebtAPI } from '../../api';
import SmartSuggestion from './SmartSuggestion';
import EmptyState from './EmptyState';
import DebtTrendChart from '../Charts/DebtTrendChart';
import ExpenseBreakdownChart from '../Charts/ExpenseBreakdownChart';
import UserComparisonChart from '../Charts/UserComparisonChart';
import DebtOverviewChart from '../Charts/DebtOverviewChart';
import { 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  AlertTriangle,
  CheckCircle2,
  Calendar,
  CreditCard,
  Receipt,
  Landmark,
  Zap,
  ArrowRight,
  PiggyBank,
  Percent,
  Clock,
  Wallet,
  BarChart3,
  Shield,
  GraduationCap,
  Building2,
  LineChart,
  Banknote,
  Scale,
  Sparkles,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Info,
  Lightbulb,
  DollarSign,
  TrendingDown as TrendDown
} from 'lucide-react';

export default function Dashboard({ userId, monthYear, users, onNavigate, onEnterValues }) {
  const { 
    summary, 
    expenseBreakdown, 
    debtTrends, 
    userComparison, 
    smartSuggestion,
    debtOverview,
    monthStatus,
    loading, 
    error,
    refresh 
  } = useDashboardData(userId, monthYear);

  // Fetch assets data
  const [assetsData, setAssetsData] = useState({ assets: [], summary: null });
  const [assetsLoading, setAssetsLoading] = useState(true);

  // Fetch credit cards data for dropdown
  const [creditCards, setCreditCards] = useState([]);
  const [showCreditDropdown, setShowCreditDropdown] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const creditButtonRef = useRef(null);

  useEffect(() => {
    async function loadAssets() {
      try {
        setAssetsLoading(true);
        const params = userId !== 'family' ? { userId } : {};
        const [assets, assetSummary] = await Promise.all([
          assetAPI.getAll(params).catch(() => []),
          assetAPI.getSummary(params).catch(() => null),
        ]);
        setAssetsData({ assets, summary: assetSummary });
      } catch (err) {
        console.error('Error loading assets:', err);
      } finally {
        setAssetsLoading(false);
      }
    }
    loadAssets();
  }, [userId]);

  // Fetch credit cards
  useEffect(() => {
    async function loadCreditCards() {
      try {
        const params = userId !== 'family' ? { userId } : {};
        const cards = await variableDebtAPI.getAll(params).catch(() => []);
        setCreditCards(cards);
      } catch (err) {
        console.error('Error loading credit cards:', err);
      }
    }
    loadCreditCards();
  }, [userId, summary]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-navy-400 text-sm">Loading your finances...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass rounded-2xl p-6 text-center">
        <p className="text-coral-400">Error loading dashboard: {error}</p>
        <button 
          onClick={refresh}
          className="mt-4 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-400 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const isFamilyView = userId === 'family';
  const viewTitle = isFamilyView 
    ? 'Family Overview' 
    : `${users.find(u => u.id === parseInt(userId))?.name || 'User'}'s Dashboard`;

  const noDataAtAll = monthStatus && !monthStatus.isSetup;

  if (noDataAtAll) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">{viewTitle}</h1>
            <p className="text-navy-400">{formatMonth(monthYear)}</p>
          </div>
        </div>
        <EmptyState 
          onAddData={onEnterValues} 
          onStartMonth={onEnterValues} 
        />
      </div>
    );
  }

  // Calculate totals
  const totalAssets = assetsData.summary?.totalValue || 0;
  const totalLiabilities = (summary?.totalLoansRemaining || 0) + (summary?.totalDebtsRemaining || 0);
  const netWorth = totalAssets - totalLiabilities;

  // Calculate financial health score with detailed breakdown
  const calculateHealthScoreWithDetails = () => {
    if (!summary) return { score: 0, factors: [], improvements: [] };
    
    let score = 50; // Base score
    const factors = [];
    const improvements = [];
    
    // 1. Cash Flow Analysis (+20 max / -20 min)
    const currentSavingsRate = summary.totalIncome > 0 ? (summary.netCashFlow / summary.totalIncome) * 100 : 0;
    if (summary.netCashFlow > 0) {
      const cashFlowPoints = Math.min(currentSavingsRate * 2, 20);
      score += cashFlowPoints;
      factors.push({
        label: 'Cash Flow',
        points: `+${Math.round(cashFlowPoints)}`,
        status: 'positive',
        detail: `Saving ${Math.round(currentSavingsRate)}% of income`
      });
      if (currentSavingsRate < 20) {
        improvements.push({
          icon: PiggyBank,
          title: 'Increase Savings Rate',
          text: `Currently saving ${Math.round(currentSavingsRate)}%. Aim for 20% to build wealth faster.`,
          impact: 'high'
        });
      }
    } else {
      const penalty = Math.min(Math.abs(summary.netCashFlow) / 100, 20);
      score -= penalty;
      factors.push({
        label: 'Cash Flow',
        points: `-${Math.round(penalty)}`,
        status: 'negative',
        detail: `Overspending by ${formatCurrency(Math.abs(summary.netCashFlow))}`
      });
      improvements.push({
        icon: AlertTriangle,
        title: 'Reduce Spending',
        text: `You're spending ${formatCurrency(Math.abs(summary.netCashFlow))} more than you earn. Cut non-essential expenses.`,
        impact: 'critical'
      });
    }
    
    // 2. Debt-to-Income Ratio (+15 max / -10 min)
    const debtPayments = (summary.totalLoanPayments || 0) + (summary.totalDebtPayments || 0);
    const debtToIncome = summary.totalIncome > 0 ? (debtPayments / summary.totalIncome) * 100 : 0;
    let dtiPoints = 0;
    let dtiStatus = 'positive';
    
    if (debtToIncome < 20) {
      dtiPoints = 15;
      dtiStatus = 'positive';
    } else if (debtToIncome < 35) {
      dtiPoints = 10;
      dtiStatus = 'positive';
    } else if (debtToIncome < 50) {
      dtiPoints = 5;
      dtiStatus = 'neutral';
      improvements.push({
        icon: CreditCard,
        title: 'Lower Debt Payments',
        text: `${Math.round(debtToIncome)}% of income goes to debt. Target under 35% for better financial flexibility.`,
        impact: 'medium'
      });
    } else {
      dtiPoints = -10;
      dtiStatus = 'negative';
      improvements.push({
        icon: CreditCard,
        title: 'High Debt Burden',
        text: `${Math.round(debtToIncome)}% of income goes to debt payments. Focus on paying down high-interest debt.`,
        impact: 'high'
      });
    }
    score += dtiPoints;
    factors.push({
      label: 'Debt-to-Income',
      points: dtiPoints >= 0 ? `+${dtiPoints}` : `${dtiPoints}`,
      status: dtiStatus,
      detail: `${Math.round(debtToIncome)}% of income to debt`
    });
    
    // 3. Income Status (+10)
    if (summary.totalIncome > 0) {
      score += 10;
      factors.push({
        label: 'Has Income',
        points: '+10',
        status: 'positive',
        detail: formatCurrency(summary.totalIncome) + '/month'
      });
    } else {
      factors.push({
        label: 'No Income',
        points: '0',
        status: 'negative',
        detail: 'No income recorded'
      });
      improvements.push({
        icon: DollarSign,
        title: 'Record Income',
        text: 'Add your income sources to get accurate financial health tracking.',
        impact: 'critical'
      });
    }
    
    // 4. Assets (+5)
    if (totalAssets > 0) {
      score += 5;
      factors.push({
        label: 'Has Assets',
        points: '+5',
        status: 'positive',
        detail: formatCurrency(totalAssets) + ' total'
      });
    } else {
      factors.push({
        label: 'No Assets',
        points: '0',
        status: 'neutral',
        detail: 'No assets recorded'
      });
      improvements.push({
        icon: Shield,
        title: 'Start Building Assets',
        text: 'Open an emergency fund or start investing to build long-term wealth.',
        impact: 'medium'
      });
    }
    
    // 5. Net Worth (+5)
    if (netWorth > 0) {
      score += 5;
      factors.push({
        label: 'Positive Net Worth',
        points: '+5',
        status: 'positive',
        detail: formatCurrency(netWorth)
      });
    } else if (netWorth < 0) {
      factors.push({
        label: 'Negative Net Worth',
        points: '0',
        status: 'negative',
        detail: formatCurrency(netWorth)
      });
      improvements.push({
        icon: Scale,
        title: 'Improve Net Worth',
        text: 'Pay down debts while building assets to move from negative to positive net worth.',
        impact: 'high'
      });
    }
    
    return {
      score: Math.max(0, Math.min(100, Math.round(score))),
      factors,
      improvements: improvements.slice(0, 3) // Top 3 improvements
    };
  };

  const healthData = calculateHealthScoreWithDetails();
  const healthScore = healthData.score;
  const getHealthColor = (score) => {
    if (score >= 70) return 'emerald';
    if (score >= 50) return 'amber';
    return 'coral';
  };
  const healthColor = getHealthColor(healthScore);

  // Calculate savings rate
  const savingsRate = summary?.totalIncome > 0 
    ? Math.round((summary.netCashFlow / summary.totalIncome) * 100) 
    : 0;

  // Calculate budget usage
  const totalExpenses = (summary?.totalFixedExpenses || 0) + 
    (summary?.totalUtilities || 0) + 
    (summary?.totalCategoryDebts || 0) + 
    (summary?.totalLoanPayments || 0) + 
    (summary?.totalDebtPayments || 0);
  const budgetUsage = summary?.totalIncome > 0 
    ? Math.round((totalExpenses / summary.totalIncome) * 100) 
    : 0;

  // Group assets by type for display
  const assetsByType = assetsData.summary?.byType || {};

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{viewTitle}</h1>
          <p className="text-navy-400">{formatMonth(monthYear)}</p>
        </div>
        <button
          onClick={() => { refresh(); }}
          className="flex items-center gap-2 px-4 py-2 glass-light rounded-xl text-sm text-navy-300 hover:text-white transition-colors group"
        >
          <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
          Refresh
        </button>
      </div>

      {/* Net Worth Hero Card */}
      <div className="glass rounded-2xl p-6 bg-gradient-to-br from-navy-800/80 to-navy-900/80 border border-navy-700/50">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20">
              <Scale className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Net Worth</h2>
              <p className="text-sm text-navy-400">Assets minus Liabilities</p>
            </div>
          </div>
          <div className={`text-3xl font-bold font-mono ${netWorth >= 0 ? 'text-emerald-400' : 'text-coral-400'}`}>
            {netWorth >= 0 ? '+' : ''}{formatCurrency(netWorth)}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Assets Side */}
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-emerald-400 font-medium">Total Assets</span>
            </div>
            <p className="text-2xl font-bold text-white font-mono">{formatCurrency(totalAssets)}</p>
            {Object.keys(assetsByType).length > 0 && (
              <div className="mt-3 space-y-1">
                {Object.entries(assetsByType).slice(0, 3).map(([type, data]) => (
                  <div key={type} className="flex justify-between text-xs">
                    <span className="text-navy-400 capitalize">{type.replace('_', ' ')}</span>
                    <span className="text-navy-300">{formatCurrency(data.totalValue)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Liabilities Side */}
          <div className="bg-coral-500/10 border border-coral-500/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-coral-400" />
              <span className="text-sm text-coral-400 font-medium">Total Liabilities</span>
            </div>
            <p className="text-2xl font-bold text-white font-mono">{formatCurrency(totalLiabilities)}</p>
            <div className="mt-3 space-y-1">
              {(summary?.totalLoansRemaining || 0) > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-navy-400">Loans</span>
                  <span className="text-navy-300">{formatCurrency(summary.totalLoansRemaining)}</span>
                </div>
              )}
              {(summary?.totalDebtsRemaining || 0) > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-navy-400">Credit Cards</span>
                  <span className="text-navy-300">{formatCurrency(summary.totalDebtsRemaining)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Financial Health Score + Key Metrics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Financial Health Score Card - Expandable */}
        <FinancialHealthCard 
          healthScore={healthScore}
          healthColor={healthColor}
          healthData={healthData}
          formatCurrency={formatCurrency}
        />

        {/* Quick Stats */}
        <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Income */}
          <div className="glass rounded-xl p-4 flex flex-col min-h-[120px]">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-emerald-500/20">
                <Banknote className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-xs text-navy-400">Income</span>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <p className="text-4xl font-bold text-emerald-400 font-mono">
                {formatCurrency(summary?.totalIncome || 0)}
              </p>
            </div>
          </div>

          {/* Expenses */}
          <div className="glass rounded-xl p-4 flex flex-col min-h-[120px]">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-coral-500/20">
                <Receipt className="w-4 h-4 text-coral-400" />
              </div>
              <span className="text-xs text-navy-400">Expenses</span>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <p className="text-4xl font-bold text-coral-400 font-mono">
                {formatCurrency(totalExpenses)}
              </p>
            </div>
          </div>

          {/* Net Cash Flow */}
          <div className="glass rounded-xl p-4 flex flex-col min-h-[120px]">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-md ${summary?.netCashFlow >= 0 ? 'bg-emerald-500/20' : 'bg-coral-500/20'}`}>
                <PiggyBank className={`w-4 h-4 ${summary?.netCashFlow >= 0 ? 'text-emerald-400' : 'text-coral-400'}`} />
              </div>
              <span className="text-xs text-navy-400">Net Flow</span>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <p className={`text-4xl font-bold font-mono ${summary?.netCashFlow >= 0 ? 'text-emerald-400' : 'text-coral-400'}`}>
                {summary?.netCashFlow >= 0 ? '+' : ''}{formatCurrency(summary?.netCashFlow || 0)}
              </p>
            </div>
          </div>

          {/* Savings Rate */}
          <div className="glass rounded-xl p-4 flex flex-col min-h-[120px]">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-md ${savingsRate >= 20 ? 'bg-emerald-500/20' : savingsRate >= 0 ? 'bg-amber-500/20' : 'bg-coral-500/20'}`}>
                <Percent className={`w-4 h-4 ${savingsRate >= 20 ? 'text-emerald-400' : savingsRate >= 0 ? 'text-amber-400' : 'text-coral-400'}`} />
              </div>
              <span className="text-xs text-navy-400">Savings Rate</span>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <p className={`text-4xl font-bold font-mono ${savingsRate >= 20 ? 'text-emerald-400' : savingsRate >= 0 ? 'text-amber-400' : 'text-coral-400'}`}>
                {savingsRate}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Budget Progress Bar */}
      <div className="glass rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-navy-400" />
            <span className="text-white font-medium text-sm">Monthly Budget</span>
          </div>
          <span className={`text-sm font-mono ${budgetUsage <= 100 ? 'text-emerald-400' : 'text-coral-400'}`}>
            {budgetUsage}% used
          </span>
        </div>
        <div className="h-3 bg-navy-700 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${
              budgetUsage <= 80 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' :
              budgetUsage <= 100 ? 'bg-gradient-to-r from-amber-500 to-amber-400' :
              'bg-gradient-to-r from-coral-500 to-coral-400'
            }`}
            style={{ width: `${Math.min(budgetUsage, 100)}%` }}
          />
        </div>
        <div className="flex justify-between mt-1.5 text-xs text-navy-400">
          <span>Spent: {formatCurrency(totalExpenses)}</span>
          <span>Income: {formatCurrency(summary?.totalIncome || 0)}</span>
        </div>
      </div>

      {/* Assets Overview (if has assets) */}
      {assetsData.assets.length > 0 && (
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-cyan-400" />
              <h3 className="text-white font-semibold">Assets & Investments</h3>
            </div>
            <button 
              onClick={() => onNavigate?.('assets')}
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
            >
              View All <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {/* Emergency Fund */}
            <AssetTypeCard 
              icon={Shield}
              label="Emergency Fund"
              value={assetsByType['emergency_fund']?.totalValue || 0}
              color="emerald"
            />
            
            {/* Education Fund */}
            <AssetTypeCard 
              icon={GraduationCap}
              label="Education"
              value={assetsByType['education_fund']?.totalValue || 0}
              color="violet"
            />
            
            {/* ESPP */}
            <AssetTypeCard 
              icon={Building2}
              label="ESPP"
              value={assetsByType['espp']?.totalValue || 0}
              color="cyan"
            />
            
            {/* RSU */}
            <AssetTypeCard 
              icon={Sparkles}
              label="RSU"
              value={assetsByType['rsu']?.totalValue || 0}
              color="amber"
            />
            
            {/* Stocks */}
            <AssetTypeCard 
              icon={LineChart}
              label="Stocks"
              value={assetsByType['stock']?.totalValue || 0}
              color="coral"
            />
          </div>
        </div>
      )}

      {/* Payment Obligations Card */}
      <div className="glass rounded-2xl p-5 overflow-visible">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="w-5 h-5 text-violet-400" />
          <h3 className="text-white font-semibold">Monthly Payment Obligations</h3>
        </div>
        
        {/* Regular Monthly Obligations */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
          {/* Static/Fixed Expenses */}
          <div className="bg-navy-800/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Receipt className="w-4 h-4 text-cyan-400" />
              <span className="text-sm text-navy-400">Fixed Bills</span>
            </div>
            <p className="text-xl font-bold text-cyan-400 font-mono">
              {formatCurrency(summary?.totalFixedExpenses || 0)}
            </p>
            <p className="text-xs text-navy-500 mt-1">Static payments</p>
          </div>

          {/* Loan Payments */}
          <div className="bg-navy-800/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Landmark className="w-4 h-4 text-violet-400" />
              <span className="text-sm text-navy-400">Loans</span>
            </div>
            <p className="text-xl font-bold text-violet-400 font-mono">
              {formatCurrency(summary?.totalLoanPayments || 0)}
            </p>
            <p className="text-xs text-navy-500 mt-1">Loan installments</p>
          </div>

          {/* Card Minimum Payments (Ongoing cards only) */}
          <div className="bg-navy-800/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="w-4 h-4 text-amber-400" />
              <span className="text-sm text-navy-400">Card Minimums</span>
            </div>
            <p className="text-xl font-bold text-amber-400 font-mono">
              {formatCurrency(summary?.totalMinimumPaymentsDue || 0)}
            </p>
            <p className="text-xs text-navy-500 mt-1">Ongoing cards</p>
          </div>

          {/* Total Monthly (Recurring) */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-amber-400" />
              <span className="text-sm text-navy-400">Total Monthly</span>
            </div>
            <p className="text-xl font-bold text-amber-400 font-mono">
              {formatCurrency(
                (summary?.totalFixedExpenses || 0) + 
                (summary?.totalLoanPayments || 0) + 
                (summary?.totalMinimumPaymentsDue || 0)
              )}
            </p>
            <p className="text-xs text-navy-500 mt-1">Every month</p>
          </div>
        </div>

        {/* One-Time + Total This Month + Credit Info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 overflow-visible">
          {/* One-Time Payments (Temporary cards) */}
          <div className="bg-pink-500/10 border border-pink-500/30 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-pink-400" />
              <span className="text-sm text-navy-400">One-Time</span>
            </div>
            <p className="text-xl font-bold text-pink-400 font-mono">
              {formatCurrency(summary?.totalOneTimePayments || 0)}
            </p>
            <p className="text-xs text-navy-500 mt-1">Pay in full</p>
          </div>

          {/* Total This Month */}
          <div className="bg-coral-500/10 border border-coral-500/30 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-coral-400" />
              <span className="text-sm text-navy-400">Total Required</span>
            </div>
            <p className="text-xl font-bold text-coral-400 font-mono">
              {formatCurrency(
                (summary?.totalFixedExpenses || 0) + 
                (summary?.totalLoanPayments || 0) + 
                (summary?.totalMinimumPaymentsDue || 0) +
                (summary?.totalOneTimePayments || 0)
              )}
            </p>
            <p className="text-xs text-navy-500 mt-1">This month</p>
          </div>

          {/* Credit Used */}
          <div className="bg-navy-800/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="w-4 h-4 text-coral-400" />
              <span className="text-sm text-navy-400">Credit Used</span>
            </div>
            <p className="text-xl font-bold text-coral-400 font-mono">
              {formatCurrency(summary?.totalDebtsRemaining || 0)}
            </p>
            <p className="text-xs text-navy-500 mt-1">
              of {formatCurrency(summary?.totalCreditLimit || 0)}
            </p>
          </div>

          {/* Credit Available - with dropdown */}
          <div 
            ref={creditButtonRef}
            className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4"
          >
            <button
              onClick={() => {
                if (!showCreditDropdown && creditButtonRef.current) {
                  const rect = creditButtonRef.current.getBoundingClientRect();
                  setDropdownPos({
                    top: rect.bottom + 8 + window.scrollY,
                    left: rect.left + window.scrollX,
                    width: Math.max(rect.width, 280),
                  });
                }
                setShowCreditDropdown(!showCreditDropdown);
              }}
              className="w-full text-left"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm text-navy-400">Credit Left</span>
                </div>
                {showCreditDropdown ? (
                  <ChevronUp className="w-4 h-4 text-navy-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-navy-400" />
                )}
              </div>
              <p className="text-xl font-bold text-emerald-400 font-mono">
                {formatCurrency(summary?.totalCreditAvailable || 0)}
              </p>
              <p className="text-xs text-navy-500 mt-1">Click to see by card</p>
            </button>
          </div>

          {/* Credit Dropdown Portal - rendered at body level to escape all stacking contexts */}
          {showCreditDropdown && createPortal(
            <>
              {/* Backdrop to close dropdown */}
              <div 
                className="fixed inset-0" 
                style={{ zIndex: 99998 }}
                onClick={() => setShowCreditDropdown(false)}
              />
              {/* Dropdown menu */}
              <div 
                className="absolute bg-navy-800 border border-navy-700 rounded-xl shadow-2xl overflow-hidden"
                style={{ 
                  zIndex: 99999,
                  top: dropdownPos.top + 'px',
                  left: dropdownPos.left + 'px',
                  width: dropdownPos.width + 'px',
                }}
              >
                <div className="max-h-64 overflow-y-auto">
                  {creditCards.filter(card => card.creditLimit > 0).length === 0 ? (
                    <div className="p-4 text-center text-navy-400 text-sm">
                      No cards with credit limits set
                    </div>
                  ) : (
                    creditCards
                      .filter(card => card.creditLimit > 0)
                      .sort((a, b) => (b.creditLimit - b.currentBalance) - (a.creditLimit - a.currentBalance))
                      .map(card => {
                        const creditLeft = card.creditLimit - card.currentBalance;
                        const usagePercent = (card.currentBalance / card.creditLimit) * 100;
                        return (
                          <div key={card.id} className="p-3 border-b border-navy-700/50 last:border-b-0 hover:bg-navy-700/30">
                            <div className="flex justify-between items-start mb-1">
                              <div>
                                <p className="text-sm font-medium text-white">{card.name}</p>
                                <p className="text-xs text-navy-400">{card.user?.name}</p>
                              </div>
                              <p className={`text-sm font-bold font-mono ${creditLeft > 0 ? 'text-emerald-400' : 'text-coral-400'}`}>
                                {formatCurrency(creditLeft)}
                              </p>
                            </div>
                            {/* Usage bar */}
                            <div className="mt-2">
                              <div className="h-1.5 bg-navy-600 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all ${
                                    usagePercent > 80 ? 'bg-coral-500' : 
                                    usagePercent > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                                  }`}
                                  style={{ width: `${Math.min(usagePercent, 100)}%` }}
                                />
                              </div>
                              <div className="flex justify-between mt-1">
                                <span className="text-[10px] text-navy-500">
                                  {formatCurrency(card.currentBalance)} used
                                </span>
                                <span className="text-[10px] text-navy-500">
                                  {formatCurrency(card.creditLimit)} limit
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              </div>
            </>,
            document.body
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <QuickActionButton 
          icon={Calendar} 
          label="Enter Values" 
          color="amber"
          onClick={onEnterValues}
        />
        <QuickActionButton 
          icon={Receipt} 
          label="View Records" 
          color="cyan"
          onClick={() => onNavigate?.('records')}
        />
        <QuickActionButton 
          icon={Landmark} 
          label="Manage Loans" 
          color="violet"
          onClick={() => onNavigate?.('loans')}
        />
        <QuickActionButton 
          icon={CreditCard} 
          label="Credit Cards" 
          color="coral"
          onClick={() => onNavigate?.('debts')}
        />
        <QuickActionButton 
          icon={Wallet} 
          label="Assets" 
          color="emerald"
          onClick={() => onNavigate?.('assets')}
        />
      </div>

      {/* Smart Suggestion */}
      {smartSuggestion && <SmartSuggestion data={smartSuggestion} />}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expense Breakdown */}
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-white">Expense Breakdown</h3>
              <p className="text-sm text-navy-400">Where your money goes</p>
            </div>
          </div>
          <ExpenseBreakdownChart data={expenseBreakdown} />
        </div>

        {/* Credit Card Overview */}
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-white">Credit Cards & Loans</h3>
              <p className="text-sm text-navy-400">Balance breakdown</p>
            </div>
            <button 
              onClick={() => onNavigate?.('debts')}
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              Manage <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <DebtOverviewChart data={debtOverview} />
        </div>
      </div>

      {/* Payment History Trend */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Payment History</h3>
            <p className="text-sm text-navy-400">Monthly debt payments over time</p>
          </div>
        </div>
        <DebtTrendChart data={debtTrends} />
      </div>

      {/* User Comparison (Family View Only) */}
      {isFamilyView && userComparison && userComparison.length > 0 && (
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-white">Family Comparison</h3>
              <p className="text-sm text-navy-400">Income vs Expenses per member</p>
            </div>
          </div>
          <UserComparisonChart data={userComparison} />
        </div>
      )}

      {/* Financial Tips */}
      <FinancialTips 
        netCashFlow={summary?.netCashFlow || 0} 
        savingsRate={savingsRate}
        hasAssets={totalAssets > 0}
        hasDebts={totalLiabilities > 0}
        netWorth={netWorth}
      />
    </div>
  );
}

function FinancialHealthCard({ healthScore, healthColor, healthData, formatCurrency }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const statusColors = {
    positive: 'text-emerald-400',
    neutral: 'text-amber-400',
    negative: 'text-coral-400',
  };
  
  const impactColors = {
    critical: 'bg-coral-500/20 border-coral-500/30 text-coral-400',
    high: 'bg-amber-500/20 border-amber-500/30 text-amber-400',
    medium: 'bg-cyan-500/20 border-cyan-500/30 text-cyan-400',
  };

  return (
    <div className="glass rounded-2xl p-6 lg:col-span-1">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-navy-400">Financial Health</h3>
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-xs text-navy-400 hover:text-white transition-colors"
        >
          <Info className="w-4 h-4" />
          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>
      
      {/* Circular Score */}
      <div className="relative w-28 h-28 mx-auto mb-4">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="56"
            cy="56"
            r="48"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-navy-700"
          />
          <circle
            cx="56"
            cy="56"
            r="48"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            strokeDasharray={`${healthScore * 3.02} 302`}
            strokeLinecap="round"
            className={`text-${healthColor}-400 transition-all duration-1000`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center flex-col">
          <span className={`text-2xl font-bold text-${healthColor}-400`}>{healthScore}</span>
          <span className="text-xs text-navy-400">/ 100</span>
        </div>
      </div>

      <div className="text-center mb-4">
        <p className={`text-sm font-medium text-${healthColor}-400`}>
          {healthScore >= 70 ? 'Excellent' : healthScore >= 50 ? 'Good' : 'Needs Work'}
        </p>
      </div>

      {/* Expandable Details */}
      {isExpanded && (
        <div className="space-y-4 pt-4 border-t border-navy-700 animate-fade-in">
          {/* Score Breakdown */}
          <div>
            <h4 className="text-xs font-medium text-navy-400 mb-2 flex items-center gap-1">
              <BarChart3 className="w-3 h-3" />
              Score Breakdown
            </h4>
            <div className="space-y-2">
              {healthData.factors.map((factor, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`font-mono font-bold ${statusColors[factor.status]}`}>
                      {factor.points}
                    </span>
                    <span className="text-navy-300">{factor.label}</span>
                  </div>
                  <span className="text-navy-500 text-right max-w-[100px] truncate" title={factor.detail}>
                    {factor.detail}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* How to Improve */}
          {healthData.improvements.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-navy-400 mb-2 flex items-center gap-1">
                <Lightbulb className="w-3 h-3" />
                How to Improve
              </h4>
              <div className="space-y-2">
                {healthData.improvements.map((improvement, i) => {
                  const Icon = improvement.icon;
                  return (
                    <div 
                      key={i} 
                      className={`p-2 rounded-lg border ${impactColors[improvement.impact]}`}
                    >
                      <div className="flex items-start gap-2">
                        <Icon className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-medium text-white">{improvement.title}</p>
                          <p className="text-xs text-navy-400 mt-0.5">{improvement.text}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Perfect Score Message */}
          {healthData.improvements.length === 0 && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <p className="text-xs text-emerald-400 font-medium">
                  Great job! Your finances are in excellent shape.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AssetTypeCard({ icon: Icon, label, value, color }) {
  const colorClasses = {
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    violet: 'bg-violet-500/10 border-violet-500/20 text-violet-400',
    cyan: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
    amber: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    coral: 'bg-coral-500/10 border-coral-500/20 text-coral-400',
  };

  return (
    <div className={`rounded-xl p-3 border ${colorClasses[color]}`}>
      <Icon className="w-4 h-4 mb-2" />
      <p className="text-xs text-navy-400 mb-1">{label}</p>
      <p className="text-sm font-bold text-white font-mono">{formatCurrency(value)}</p>
    </div>
  );
}

function QuickActionButton({ icon: Icon, label, color, onClick }) {
  const colorClasses = {
    amber: 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20',
    emerald: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20',
    violet: 'bg-violet-500/10 border-violet-500/30 text-violet-400 hover:bg-violet-500/20',
    coral: 'bg-coral-500/10 border-coral-500/30 text-coral-400 hover:bg-coral-500/20',
    cyan: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20',
  };

  return (
    <button
      onClick={onClick}
      className={`group flex items-center gap-3 p-4 rounded-xl border transition-all ${colorClasses[color]}`}
    >
      <Icon className="w-5 h-5" />
      <span className="font-medium text-white text-sm">{label}</span>
      <ArrowRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}

function FinancialTips({ netCashFlow, savingsRate, hasAssets, hasDebts, netWorth }) {
  const tips = [];

  // Dynamic tips based on financial status
  if (netCashFlow >= 0) {
    if (savingsRate >= 20) {
      tips.push({
        icon: CheckCircle2,
        color: 'emerald',
        title: 'Excellent Savings!',
        text: `Saving ${savingsRate}% of income. Consider investing or building an emergency fund.`,
      });
    } else {
      tips.push({
        icon: PiggyBank,
        color: 'amber',
        title: 'Increase Savings',
        text: 'Aim to save 20% of your income for long-term financial security.',
      });
    }
  } else {
    tips.push({
      icon: AlertTriangle,
      color: 'coral',
      title: 'Spending Alert',
      text: 'You\'re spending more than you earn. Review non-essential expenses.',
    });
  }

  if (!hasAssets) {
    tips.push({
      icon: Shield,
      color: 'cyan',
      title: 'Start an Emergency Fund',
      text: 'Build 3-6 months of expenses for unexpected situations.',
    });
  }

  if (hasDebts) {
    tips.push({
      icon: TrendingUp,
      color: 'violet',
      title: 'Pay Off High-Interest',
      text: 'Extra payments on high-interest debt save money long-term.',
    });
  }

  if (netWorth < 0) {
    tips.push({
      icon: Target,
      color: 'amber',
      title: 'Improve Net Worth',
      text: 'Focus on paying down debts while building assets over time.',
    });
  } else if (netWorth > 0 && hasAssets) {
    tips.push({
      icon: LineChart,
      color: 'emerald',
      title: 'Keep Growing',
      text: 'Consider diversifying investments for long-term growth.',
    });
  }

  // Limit to 3 tips
  const displayTips = tips.slice(0, 3);

  const colorClasses = {
    emerald: 'text-emerald-400 bg-emerald-500/20',
    coral: 'text-coral-400 bg-coral-500/20',
    amber: 'text-amber-400 bg-amber-500/20',
    violet: 'text-violet-400 bg-violet-500/20',
    cyan: 'text-cyan-400 bg-cyan-500/20',
  };

  return (
    <div className="glass-light rounded-2xl p-6">
      <h3 className="text-sm font-medium text-navy-400 mb-4">💡 Financial Tips</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {displayTips.map((tip, i) => {
          const Icon = tip.icon;
          return (
            <div key={i} className="bg-navy-800/30 rounded-xl p-4">
              <div className={`p-2 rounded-lg ${colorClasses[tip.color]} w-fit mb-3`}>
                <Icon className="w-4 h-4" />
              </div>
              <p className="text-sm font-medium text-white mb-1">{tip.title}</p>
              <p className="text-xs text-navy-400">{tip.text}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
