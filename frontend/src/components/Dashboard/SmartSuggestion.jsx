import { Lightbulb, TrendingDown, Clock, DollarSign, ArrowRight, TrendingUp, PiggyBank, Shield, BarChart3 } from 'lucide-react';
import { formatCurrency } from '../../hooks/useFinanceData';

/**
 * Smart Suggestion Component
 * 
 * Displays intelligent recommendations based on the user's financial data.
 * - If debts exist: suggest paying extra to highest interest debt
 * - If no debts: suggest investing or saving the surplus
 */
export default function SmartSuggestion({ data }) {
  if (!data) return null;

  // No suggestion available (no surplus)
  if (!data.hasSuggestion) {
    return (
      <div className="glass rounded-2xl p-6 border border-navy-600/50 animate-slide-up delay-100">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-navy-700/50">
            <Lightbulb className="w-6 h-6 text-navy-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-1">Smart Suggestion</h3>
            <p className="text-navy-300">{data.message}</p>
            {data.surplus < 0 && (
              <p className="text-coral-400 text-sm mt-2">
                Deficit: {formatCurrency(Math.abs(data.surplus))}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Investment suggestion (no debts to pay)
  if (data.suggestionType === 'invest') {
    const { surplus, investment, options } = data;

    return (
      <div className="glass rounded-2xl p-6 border border-violet-500/30 glow-violet animate-slide-up delay-100">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 rounded-xl bg-violet-500/20 border border-violet-500/30">
            <TrendingUp className="w-6 h-6 text-violet-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-1">Investment Opportunity</h3>
            <p className="text-violet-400">{data.message}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Monthly Surplus */}
          <div className="bg-navy-800/50 rounded-xl p-4 border border-navy-700/50">
            <div className="flex items-center gap-2 text-navy-400 text-sm mb-2">
              <DollarSign className="w-4 h-4" />
              <span>Monthly Surplus</span>
            </div>
            <p className="text-2xl font-bold text-emerald-400 font-mono">
              {formatCurrency(surplus)}
            </p>
          </div>

          {/* 5-Year Projection */}
          <div className="bg-navy-800/50 rounded-xl p-4 border border-navy-700/50">
            <div className="flex items-center gap-2 text-navy-400 text-sm mb-2">
              <BarChart3 className="w-4 h-4" />
              <span>5-Year Projection</span>
            </div>
            <p className="text-2xl font-bold text-violet-400 font-mono">
              {formatCurrency(investment.projectedIn5Years)}
            </p>
            <p className="text-xs text-navy-500 mt-1">
              {investment.assumedReturn} return
            </p>
          </div>

          {/* Potential Gain */}
          <div className="bg-navy-800/50 rounded-xl p-4 border border-navy-700/50">
            <div className="flex items-center gap-2 text-navy-400 text-sm mb-2">
              <TrendingUp className="w-4 h-4" />
              <span>Potential Gain</span>
            </div>
            <p className="text-2xl font-bold text-emerald-400 font-mono">
              +{formatCurrency(investment.projectedGain)}
            </p>
            <p className="text-xs text-navy-500 mt-1">
              From {formatCurrency(investment.totalInvested)} invested
            </p>
          </div>
        </div>

        {/* Investment Options */}
        <div className="bg-navy-800/30 rounded-xl p-4 border border-navy-700/50">
          <h4 className="text-sm font-medium text-navy-300 mb-3">Recommended Options</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {options.map((option, i) => (
              <div 
                key={option.name}
                className="flex items-start gap-3 p-3 rounded-lg bg-navy-700/30 border border-navy-600/50"
              >
                <div className={`p-2 rounded-lg ${
                  i === 0 ? 'bg-emerald-500/20 text-emerald-400' :
                  i === 1 ? 'bg-violet-500/20 text-violet-400' :
                  'bg-amber-500/20 text-amber-400'
                }`}>
                  {i === 0 ? <Shield className="w-4 h-4" /> :
                   i === 1 ? <BarChart3 className="w-4 h-4" /> :
                   <PiggyBank className="w-4 h-4" />}
                </div>
                <div>
                  <p className="text-white text-sm font-medium">{option.name}</p>
                  <p className="text-xs text-navy-400">{option.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Debt payment suggestion
  const { surplus, debt, recommendation } = data;

  return (
    <div className="glass rounded-2xl p-6 border border-emerald-500/30 glow-emerald animate-slide-up delay-100">
      <div className="flex items-start gap-4 mb-6">
        <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30">
          <Lightbulb className="w-6 h-6 text-emerald-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-1">Pay Off Debt Faster</h3>
          <p className="text-emerald-400">{data.message}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Surplus Info */}
        <div className="bg-navy-800/50 rounded-xl p-4 border border-navy-700/50">
          <div className="flex items-center gap-2 text-navy-400 text-sm mb-2">
            <DollarSign className="w-4 h-4" />
            <span>Available Surplus</span>
          </div>
          <p className="text-2xl font-bold text-emerald-400 font-mono">
            {formatCurrency(surplus)}
          </p>
        </div>

        {/* Target Debt */}
        <div className="bg-navy-800/50 rounded-xl p-4 border border-navy-700/50">
          <div className="flex items-center gap-2 text-navy-400 text-sm mb-2">
            <TrendingDown className="w-4 h-4" />
            <span>Target Debt</span>
          </div>
          <p className="text-lg font-semibold text-white">{debt.name}</p>
          <div className="flex items-center gap-2 mt-1">
            {debt.interestRate > 0 && (
              <>
                <span className="text-sm text-coral-400 font-mono">{debt.interestRate}% APR</span>
                <span className="text-navy-500">•</span>
              </>
            )}
            <span className="text-sm text-navy-400">{formatCurrency(debt.remainingBalance)} remaining</span>
          </div>
        </div>

        {/* Impact */}
        <div className="bg-navy-800/50 rounded-xl p-4 border border-navy-700/50">
          <div className="flex items-center gap-2 text-navy-400 text-sm mb-2">
            <Clock className="w-4 h-4" />
            <span>Estimated Impact</span>
          </div>
          <div className="space-y-1">
            {recommendation.monthsSaved > 0 && (
              <p className="text-white">
                <span className="text-emerald-400 font-bold">{recommendation.monthsSaved}</span> months saved
              </p>
            )}
            {recommendation.interestSaved > 0 && (
              <p className="text-white">
                <span className="text-emerald-400 font-bold">{formatCurrency(recommendation.interestSaved)}</span> interest saved
              </p>
            )}
            <p className="text-white">
              <span className="text-violet-400 font-bold">{recommendation.monthsToPayoff}</span> months to pay off
            </p>
          </div>
        </div>
      </div>

      {/* Action Hint */}
      <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
        <p className="text-sm text-emerald-300">
          💡 <strong>Tip:</strong> Go to the <strong>Debts</strong> tab and add a payment of {formatCurrency(recommendation.extraPayment)} to "{debt.name}" this month.
        </p>
      </div>
    </div>
  );
}
