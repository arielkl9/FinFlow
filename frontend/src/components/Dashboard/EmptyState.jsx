import { BarChart3, Plus, ArrowRight, Sparkles } from 'lucide-react';

export default function EmptyState({ onAddData, onStartMonth }) {
  return (
    <div className="glass rounded-2xl p-12 text-center animate-fade-in">
      <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-navy-700 to-navy-800 flex items-center justify-center">
        <BarChart3 className="w-10 h-10 text-navy-400" />
      </div>
      
      <h2 className="text-2xl font-bold text-white mb-3">No Data Yet</h2>
      <p className="text-navy-400 mb-8 max-w-md mx-auto">
        Start tracking your finances by adding your first records. You can add income, expenses, and debts.
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <button
          onClick={onAddData}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-medium rounded-xl hover:from-emerald-400 hover:to-emerald-500 transition-all shadow-lg shadow-emerald-500/25"
        >
          <Plus className="w-5 h-5" />
          <span>Add Your First Record</span>
        </button>
        
        <button
          onClick={onStartMonth}
          className="flex items-center gap-2 px-6 py-3 glass-light rounded-xl text-navy-300 hover:text-white transition-colors"
        >
          <Sparkles className="w-5 h-5" />
          <span>Start New Month</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Tips */}
      <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
        {[
          { emoji: '💡', title: 'Tip: Quick Add', text: 'Use the green + button in the bottom-right corner for fast entry' },
          { emoji: '👨‍👩‍👧', title: 'Family View', text: 'Switch between profiles or view combined household finances' },
          { emoji: '📊', title: 'Smart Insights', text: 'Add data to see charts and personalized suggestions' },
        ].map((tip, i) => (
          <div key={i} className="glass-light rounded-xl p-4">
            <div className="text-2xl mb-2">{tip.emoji}</div>
            <p className="text-sm font-medium text-white mb-1">{tip.title}</p>
            <p className="text-xs text-navy-400">{tip.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

