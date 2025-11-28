import { Calendar, Zap, ArrowRight } from 'lucide-react';
import { formatMonth } from '../../hooks/useFinanceData';

export default function MonthSetupPrompt({ monthStatus, monthYear, onSetup }) {
  if (!monthStatus) return null;

  const { dynamicProgress, staticProgress, dynamicSetCount, dynamicTotalCount } = monthStatus;

  return (
    <div className="glass rounded-2xl p-6 border border-amber-500/30 animate-fade-in">
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-xl bg-amber-500/20 border border-amber-500/30">
          <Calendar className="w-6 h-6 text-amber-400" />
        </div>
        
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-1">
            Complete {formatMonth(monthYear)} Setup
          </h3>
          <p className="text-navy-300 text-sm mb-4">
            You have variable expenses that need to be entered for this month.
          </p>

          {/* Progress */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-navy-400">Static Payments</span>
                <span className="text-violet-400">{staticProgress}%</span>
              </div>
              <div className="h-2 bg-navy-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-violet-500 rounded-full transition-all"
                  style={{ width: `${staticProgress}%` }}
                />
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-navy-400">Variable Expenses</span>
                <span className="text-amber-400">{dynamicProgress}%</span>
              </div>
              <div className="h-2 bg-navy-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-500 rounded-full transition-all"
                  style={{ width: `${dynamicProgress}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-navy-400 mb-4">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>{dynamicSetCount} of {dynamicTotalCount} variable expenses entered</span>
          </div>

          <button
            onClick={onSetup}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-medium rounded-xl hover:from-amber-400 hover:to-amber-500 transition-all shadow-lg shadow-amber-500/25"
          >
            <span>Enter This Month's Expenses</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

