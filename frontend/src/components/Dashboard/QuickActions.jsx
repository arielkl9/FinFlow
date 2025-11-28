import { Receipt, CreditCard, Calendar, TrendingDown, ArrowRight } from 'lucide-react';

export default function QuickActions({ onNavigate, onSetupMonth }) {
  const actions = [
    {
      icon: Calendar,
      label: 'Setup Month',
      description: 'Enter monthly expenses',
      color: 'amber',
      action: onSetupMonth,
    },
    {
      icon: TrendingDown,
      label: 'Log Income',
      description: 'Add income source',
      color: 'emerald',
      action: () => onNavigate('records'),
    },
    {
      icon: CreditCard,
      label: 'Manage Debts',
      description: 'Track debt payments',
      color: 'violet',
      action: () => onNavigate('debts'),
    },
    {
      icon: Receipt,
      label: 'All Records',
      description: 'View all entries',
      color: 'cyan',
      action: () => onNavigate('records'),
    },
  ];

  const colorClasses = {
    amber: 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20',
    emerald: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20',
    violet: 'bg-violet-500/10 border-violet-500/30 text-violet-400 hover:bg-violet-500/20',
    cyan: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20',
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {actions.map((action, i) => {
        const Icon = action.icon;
        return (
          <button
            key={action.label}
            onClick={action.action}
            className={`group flex items-center gap-3 p-4 rounded-xl border transition-all ${colorClasses[action.color]} animate-slide-up`}
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="p-2 rounded-lg bg-navy-800/50">
              <Icon className="w-5 h-5" />
            </div>
            <div className="text-left flex-1">
              <p className="font-medium text-white text-sm">{action.label}</p>
              <p className="text-xs text-navy-400">{action.description}</p>
            </div>
            <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </button>
        );
      })}
    </div>
  );
}

