import { 
  LayoutDashboard, 
  Receipt, 
  CreditCard, 
  Settings,
  TrendingUp,
  HelpCircle,
  ChevronRight,
  Lock,
  Building2,
  PiggyBank
} from 'lucide-react';

const navItems = [
  { 
    id: 'dashboard', 
    label: 'Dashboard', 
    description: 'Overview & insights',
    icon: LayoutDashboard 
  },
  { 
    id: 'records', 
    label: 'Records', 
    description: 'Income & expenses',
    icon: Receipt 
  },
  { 
    id: 'assets', 
    label: 'Assets', 
    description: 'Investments & savings',
    icon: PiggyBank 
  },
  { 
    id: 'loans', 
    label: 'Loans', 
    description: 'Fixed monthly payments',
    icon: Building2 
  },
  { 
    id: 'debts', 
    label: 'Credit Cards', 
    description: 'Track & pay down',
    icon: CreditCard 
  },
  { 
    id: 'setup', 
    label: 'Static Setup', 
    description: 'Fixed monthly amounts',
    icon: Lock 
  },
];

export default function Sidebar({ activeView, setActiveView, onOpenSettings }) {
  return (
    <aside className="fixed left-0 top-0 h-screen w-64 glass border-r border-navy-700/50 flex flex-col z-50">
      {/* Logo */}
      <div className="p-6 border-b border-navy-700/50">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-violet-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gradient">FinFlow</h1>
            <p className="text-xs text-navy-400">Personal Finance</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <p className="text-xs font-medium text-navy-500 uppercase tracking-wider mb-3 px-3">Menu</p>
        <ul className="space-y-1">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            
            return (
              <li key={item.id} style={{ animationDelay: `${index * 50}ms` }} className="animate-fade-in">
                <button
                  onClick={() => setActiveView(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group ${
                    isActive 
                      ? 'bg-gradient-to-r from-emerald-500/20 to-violet-500/20 text-white border border-emerald-500/30' 
                      : 'text-navy-300 hover:text-white hover:bg-navy-800/50'
                  }`}
                >
                  <div className={`p-2 rounded-lg transition-colors ${
                    isActive ? 'bg-emerald-500/20' : 'bg-navy-800/50 group-hover:bg-navy-700/50'
                  }`}>
                    <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-400' : ''}`} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-sm">{item.label}</p>
                    <p className={`text-xs ${isActive ? 'text-emerald-400/70' : 'text-navy-500'}`}>
                      {item.description}
                    </p>
                  </div>
                  {isActive && (
                    <ChevronRight className="w-4 h-4 text-emerald-400" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Settings */}
      <div className="p-4 border-t border-navy-700/50">
        <p className="text-xs font-medium text-navy-500 uppercase tracking-wider mb-3 px-3">Settings</p>
        <button
          onClick={onOpenSettings}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-navy-300 hover:text-white hover:bg-navy-800/50 transition-all duration-200 group"
        >
          <div className="p-2 rounded-lg bg-navy-800/50 group-hover:bg-navy-700/50 transition-colors">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-medium text-sm">Categories</p>
            <p className="text-xs text-navy-500">Manage expense types</p>
          </div>
        </button>
      </div>

      {/* Help / Version */}
      <div className="p-4 border-t border-navy-700/50">
        <div className="flex items-center justify-between text-xs text-navy-500">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span>Connected</span>
          </div>
          <span>v1.0</span>
        </div>
      </div>
    </aside>
  );
}
