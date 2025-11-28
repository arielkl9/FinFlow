import { useState, useEffect, useCallback } from 'react';
import { assetAPI } from '../../api';
import { formatCurrency, formatMonth, getCurrentMonth } from '../../hooks/useFinanceData';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  X,
  Save,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  GraduationCap,
  Shield,
  Briefcase,
  BarChart3,
  Building2,
  DollarSign,
  Target,
  Clock,
  Calendar,
  ChevronDown,
  ChevronUp,
  Percent,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  History
} from 'lucide-react';

const ASSET_TYPES = {
  emergency_fund: { label: 'Emergency Fund', icon: Shield, color: 'emerald', description: 'Safety net for unexpected expenses' },
  education_fund: { label: 'Education Fund', icon: GraduationCap, color: 'blue', description: 'Savings for education' },
  espp: { label: 'ESPP', icon: Building2, color: 'violet', description: 'Employee Stock Purchase Plan' },
  rsu: { label: 'RSU', icon: Briefcase, color: 'amber', description: 'Restricted Stock Units' },
  stock: { label: 'Stocks', icon: BarChart3, color: 'cyan', description: 'Individual stocks & ETFs' },
  savings: { label: 'Savings', icon: PiggyBank, color: 'pink', description: 'General savings account' },
  other: { label: 'Other', icon: Wallet, color: 'gray', description: 'Other investments' },
};

const colorClasses = {
  emerald: { bg: 'bg-emerald-500/20', border: 'border-emerald-500/30', text: 'text-emerald-400' },
  blue: { bg: 'bg-blue-500/20', border: 'border-blue-500/30', text: 'text-blue-400' },
  violet: { bg: 'bg-violet-500/20', border: 'border-violet-500/30', text: 'text-violet-400' },
  amber: { bg: 'bg-amber-500/20', border: 'border-amber-500/30', text: 'text-amber-400' },
  cyan: { bg: 'bg-cyan-500/20', border: 'border-cyan-500/30', text: 'text-cyan-400' },
  pink: { bg: 'bg-pink-500/20', border: 'border-pink-500/30', text: 'text-pink-400' },
  gray: { bg: 'bg-gray-500/20', border: 'border-gray-500/30', text: 'text-gray-400' },
  coral: { bg: 'bg-coral-500/20', border: 'border-coral-500/30', text: 'text-coral-400' },
};

export default function AssetsManager({ userId, users }) {
  const [assets, setAssets] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [selectedType, setSelectedType] = useState('all');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (userId !== 'family') params.userId = userId;
      
      const [assetsData, summaryData] = await Promise.all([
        assetAPI.getAll(params),
        assetAPI.getSummary(params),
      ]);
      
      setAssets(assetsData);
      setSummary(summaryData);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this asset?')) return;
    try {
      await assetAPI.delete(id);
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSave(data, id) {
    try {
      if (id) {
        await assetAPI.update(id, data);
      } else {
        await assetAPI.create(data);
      }
      await loadData();
      setIsModalOpen(false);
      setEditingAsset(null);
    } catch (err) {
      throw err;
    }
  }

  async function handleAddTransaction(assetId, transaction) {
    try {
      await assetAPI.addTransaction(assetId, transaction);
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  // Filter assets by type
  const filteredAssets = selectedType === 'all' 
    ? assets 
    : assets.filter(a => a.type === selectedType);

  // Group assets by type for display
  const assetsByType = {};
  filteredAssets.forEach(asset => {
    if (!assetsByType[asset.type]) {
      assetsByType[asset.type] = [];
    }
    assetsByType[asset.type].push(asset);
  });

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
          <h1 className="text-2xl font-bold text-white">Assets & Investments</h1>
          <p className="text-navy-400">Track your savings, stocks, and employee benefits</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="p-2.5 glass-light rounded-xl text-navy-400 hover:text-white transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={() => { setEditingAsset(null); setIsModalOpen(true); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-medium rounded-xl hover:from-emerald-400 hover:to-emerald-500 transition-all shadow-lg shadow-emerald-500/25"
          >
            <Plus className="w-5 h-5" />
            <span>Add Asset</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-lg bg-emerald-500/20">
                <Wallet className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-sm text-navy-400">Total Assets</span>
            </div>
            <p className="text-2xl font-bold text-emerald-400 font-mono">
              {formatCurrency(summary.totalValue)}
            </p>
          </div>

          <div className="glass rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-lg bg-violet-500/20">
                <DollarSign className="w-4 h-4 text-violet-400" />
              </div>
              <span className="text-sm text-navy-400">Total Invested</span>
            </div>
            <p className="text-2xl font-bold text-violet-400 font-mono">
              {formatCurrency(summary.totalCostBasis)}
            </p>
          </div>

          <div className="glass rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className={`p-2 rounded-lg ${summary.totalGainLoss >= 0 ? 'bg-emerald-500/20' : 'bg-coral-500/20'}`}>
                {summary.totalGainLoss >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-coral-400" />
                )}
              </div>
              <span className="text-sm text-navy-400">Total Gain/Loss</span>
            </div>
            <p className={`text-2xl font-bold font-mono ${summary.totalGainLoss >= 0 ? 'text-emerald-400' : 'text-coral-400'}`}>
              {summary.totalGainLoss >= 0 ? '+' : ''}{formatCurrency(summary.totalGainLoss)}
            </p>
            <p className={`text-xs mt-1 ${summary.totalGainLoss >= 0 ? 'text-emerald-500' : 'text-coral-500'}`}>
              {summary.gainLossPercent >= 0 ? '+' : ''}{summary.gainLossPercent}%
            </p>
          </div>

          <div className="glass rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <BarChart3 className="w-4 h-4 text-amber-400" />
              </div>
              <span className="text-sm text-navy-400">Asset Count</span>
            </div>
            <p className="text-2xl font-bold text-white font-mono">
              {assets.length}
            </p>
            <p className="text-xs text-navy-500 mt-1">
              Across {Object.keys(summary.byType || {}).length} categories
            </p>
          </div>
        </div>
      )}

      {/* Type Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedType('all')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            selectedType === 'all'
              ? 'bg-white text-navy-900'
              : 'bg-navy-800 text-navy-400 hover:text-white'
          }`}
        >
          All Assets
        </button>
        {Object.entries(ASSET_TYPES).map(([key, { label, icon: Icon, color }]) => (
          <button
            key={key}
            onClick={() => setSelectedType(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              selectedType === key
                ? `${colorClasses[color].bg} ${colorClasses[color].border} border ${colorClasses[color].text}`
                : 'bg-navy-800 text-navy-400 hover:text-white'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-coral-500/10 border border-coral-500/30 rounded-xl p-4 text-coral-400">
          {error}
        </div>
      )}

      {/* Assets List */}
      {assets.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <Wallet className="w-16 h-16 text-navy-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No Assets Yet</h3>
          <p className="text-navy-400 mb-6">Start tracking your investments, savings, and employee benefits.</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-medium rounded-xl"
          >
            <Plus className="w-5 h-5" />
            <span>Add Your First Asset</span>
          </button>
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="glass rounded-2xl p-8 text-center">
          <p className="text-navy-400">No assets in this category</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(assetsByType).map(([type, typeAssets]) => {
            const typeInfo = ASSET_TYPES[type] || ASSET_TYPES.other;
            const TypeIcon = typeInfo.icon;
            const colors = colorClasses[typeInfo.color];
            
            return (
              <div key={type} className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${colors.bg} ${colors.border} border`}>
                    <TypeIcon className={`w-5 h-5 ${colors.text}`} />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">{typeInfo.label}</h2>
                    <p className="text-xs text-navy-500">{typeInfo.description}</p>
                  </div>
                  <div className="ml-auto">
                    <span className={`text-sm font-mono ${colors.text}`}>
                      {formatCurrency(typeAssets.reduce((sum, a) => sum + a.currentValue, 0))}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {typeAssets.map((asset, index) => (
                    <AssetCard 
                      key={asset.id}
                      asset={asset}
                      typeInfo={typeInfo}
                      colors={colors}
                      onEdit={() => { setEditingAsset(asset); setIsModalOpen(true); }}
                      onDelete={() => handleDelete(asset.id)}
                      onAddTransaction={(tx) => handleAddTransaction(asset.id, tx)}
                      style={{ animationDelay: `${index * 100}ms` }}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <AssetModal 
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingAsset(null); }}
        asset={editingAsset}
        users={users}
        onSave={handleSave}
      />
    </div>
  );
}

function AssetCard({ asset, typeInfo, colors, onEdit, onDelete, onAddTransaction, style }) {
  const [showDetails, setShowDetails] = useState(false);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  
  const gainLoss = asset.currentValue - asset.costBasis;
  const gainLossPercent = asset.costBasis > 0 ? ((gainLoss / asset.costBasis) * 100).toFixed(1) : 0;
  const progressPercent = asset.targetAmount ? Math.min((asset.currentValue / asset.targetAmount) * 100, 100) : null;

  const TypeIcon = typeInfo.icon;

  return (
    <div className="glass rounded-2xl overflow-hidden animate-slide-up" style={style}>
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${colors.bg} ${colors.border} border`}>
              <TypeIcon className={`w-5 h-5 ${colors.text}`} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">{asset.name}</h3>
              <p className="text-sm text-navy-400">{asset.user?.name}</p>
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

        {/* Main Value */}
        <div className="mb-4">
          <p className="text-3xl font-bold text-white font-mono">
            {formatCurrency(asset.currentValue)}
          </p>
          {asset.costBasis > 0 && (
            <div className="flex items-center gap-2 mt-1">
              {gainLoss >= 0 ? (
                <ArrowUpRight className="w-4 h-4 text-emerald-400" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-coral-400" />
              )}
              <span className={`text-sm font-mono ${gainLoss >= 0 ? 'text-emerald-400' : 'text-coral-400'}`}>
                {gainLoss >= 0 ? '+' : ''}{formatCurrency(gainLoss)} ({gainLossPercent}%)
              </span>
            </div>
          )}
        </div>

        {/* Progress Bar (for funds with targets) */}
        {progressPercent !== null && (
          <div className="mb-4">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-navy-400">Progress to Goal</span>
              <span className={colors.text}>{progressPercent.toFixed(0)}%</span>
            </div>
            <div className="h-2 bg-navy-700 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  progressPercent >= 100 ? 'bg-emerald-500' : `bg-gradient-to-r from-${typeInfo.color}-500 to-${typeInfo.color}-400`
                }`}
                style={{ width: `${progressPercent}%`, background: progressPercent < 100 ? undefined : undefined }}
              />
            </div>
            <p className="text-xs text-navy-500 mt-1">
              Target: {formatCurrency(asset.targetAmount)}
            </p>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {asset.type === 'stock' || asset.type === 'espp' ? (
            <>
              <div className="bg-navy-800/50 rounded-lg p-2.5 text-center">
                <p className="text-xs text-navy-400">Shares</p>
                <p className="text-sm font-bold text-white font-mono">{asset.shares}</p>
              </div>
              <div className="bg-navy-800/50 rounded-lg p-2.5 text-center">
                <p className="text-xs text-navy-400">Symbol</p>
                <p className="text-sm font-bold text-white">{asset.symbol || '-'}</p>
              </div>
            </>
          ) : asset.type === 'rsu' ? (
            <>
              <div className="bg-navy-800/50 rounded-lg p-2.5 text-center">
                <p className="text-xs text-navy-400">Vested</p>
                <p className="text-sm font-bold text-emerald-400 font-mono">{asset.vestedUnits}</p>
              </div>
              <div className="bg-navy-800/50 rounded-lg p-2.5 text-center">
                <p className="text-xs text-navy-400">Unvested</p>
                <p className="text-sm font-bold text-amber-400 font-mono">{asset.unvestedUnits}</p>
              </div>
            </>
          ) : (
            <>
              <div className="bg-navy-800/50 rounded-lg p-2.5 text-center">
                <p className="text-xs text-navy-400">Cost Basis</p>
                <p className="text-sm font-bold text-white font-mono">{formatCurrency(asset.costBasis)}</p>
              </div>
              <div className="bg-navy-800/50 rounded-lg p-2.5 text-center">
                <p className="text-xs text-navy-400">Monthly</p>
                <p className="text-sm font-bold text-white font-mono">{formatCurrency(asset.monthlyContribution)}</p>
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => setShowTransactionForm(!showTransactionForm)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${colors.bg} ${colors.border} border ${colors.text} hover:opacity-80`}
          >
            <Plus className="w-4 h-4" />
            Add Transaction
          </button>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="p-2 rounded-xl bg-navy-700/50 text-navy-400 hover:text-white"
          >
            {showDetails ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Transaction Form */}
      {showTransactionForm && (
        <div className="border-t border-navy-700/50 p-4 bg-navy-800/30">
          <QuickTransactionForm 
            assetType={asset.type}
            onSubmit={(tx) => {
              onAddTransaction(tx);
              setShowTransactionForm(false);
            }}
            onCancel={() => setShowTransactionForm(false)}
          />
        </div>
      )}

      {/* Details Panel */}
      {showDetails && (
        <div className="border-t border-navy-700/50 p-4 bg-navy-800/30">
          <h4 className="text-sm font-medium text-navy-400 mb-3 flex items-center gap-2">
            <History className="w-4 h-4" />
            Recent Transactions
          </h4>
          {asset.transactions && asset.transactions.length > 0 ? (
            <div className="space-y-2">
              {asset.transactions.slice(0, 5).map(tx => (
                <div key={tx.id} className="flex justify-between items-center text-sm">
                  <div>
                    <span className="text-white capitalize">{tx.type}</span>
                    {tx.note && <span className="text-navy-500 ml-2">• {tx.note}</span>}
                  </div>
                  <div className="text-right">
                    <span className={`font-mono ${
                      ['deposit', 'contribution', 'dividend', 'vest'].includes(tx.type) 
                        ? 'text-emerald-400' 
                        : 'text-coral-400'
                    }`}>
                      {['deposit', 'contribution', 'dividend'].includes(tx.type) ? '+' : '-'}
                      {formatCurrency(tx.amount)}
                    </span>
                    <p className="text-xs text-navy-500">
                      {new Date(tx.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-navy-500">No transactions yet</p>
          )}
        </div>
      )}
    </div>
  );
}

function QuickTransactionForm({ assetType, onSubmit, onCancel }) {
  const [type, setType] = useState('deposit');
  const [amount, setAmount] = useState('');
  const [units, setUnits] = useState('');
  const [note, setNote] = useState('');

  const transactionTypes = {
    emergency_fund: ['deposit', 'withdraw'],
    education_fund: ['deposit', 'withdraw'],
    savings: ['deposit', 'withdraw'],
    stock: ['buy', 'sell', 'dividend'],
    espp: ['buy', 'sell', 'dividend'],
    rsu: ['vest', 'sell'],
    other: ['deposit', 'withdraw', 'buy', 'sell'],
  };

  const types = transactionTypes[assetType] || transactionTypes.other;

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit({
      type,
      amount: parseFloat(amount) || 0,
      units: units ? parseFloat(units) : null,
      note,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-navy-400 mb-1">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full bg-navy-800 border border-navy-600 rounded-lg px-3 py-2 text-white text-sm"
          >
            {types.map(t => (
              <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-navy-400 mb-1">Amount</label>
          <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-navy-400 text-sm">₪</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="w-full bg-navy-800 border border-navy-600 rounded-lg pl-6 pr-3 py-2 text-white text-sm"
              required
            />
          </div>
        </div>
      </div>
      
      {['buy', 'sell', 'vest'].includes(type) && (
        <div>
          <label className="block text-xs text-navy-400 mb-1">Units/Shares</label>
          <input
            type="number"
            value={units}
            onChange={(e) => setUnits(e.target.value)}
            placeholder="0"
            className="w-full bg-navy-800 border border-navy-600 rounded-lg px-3 py-2 text-white text-sm"
          />
        </div>
      )}

      <div>
        <label className="block text-xs text-navy-400 mb-1">Note (optional)</label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Optional note"
          className="w-full bg-navy-800 border border-navy-600 rounded-lg px-3 py-2 text-white text-sm"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 bg-navy-700 text-navy-300 rounded-lg text-sm hover:bg-navy-600"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm hover:bg-emerald-400"
        >
          Add
        </button>
      </div>
    </form>
  );
}

function AssetModal({ isOpen, onClose, asset, users, onSave }) {
  const [formData, setFormData] = useState({
    userId: '',
    name: '',
    type: 'emergency_fund',
    currentValue: '',
    costBasis: '',
    targetAmount: '',
    monthlyContribution: '',
    symbol: '',
    shares: '',
    totalUnits: '',
    vestedUnits: '',
    grantDate: '',
    vestingEndDate: '',
    discountPercent: '15',
    institution: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (asset) {
      setFormData({
        userId: asset.userId,
        name: asset.name,
        type: asset.type,
        currentValue: asset.currentValue || '',
        costBasis: asset.costBasis || '',
        targetAmount: asset.targetAmount || '',
        monthlyContribution: asset.monthlyContribution || '',
        symbol: asset.symbol || '',
        shares: asset.shares || '',
        totalUnits: asset.totalUnits || '',
        vestedUnits: asset.vestedUnits || '',
        grantDate: asset.grantDate ? new Date(asset.grantDate).toISOString().split('T')[0] : '',
        vestingEndDate: asset.vestingEndDate ? new Date(asset.vestingEndDate).toISOString().split('T')[0] : '',
        discountPercent: asset.discountPercent || '15',
        institution: asset.institution || '',
        notes: asset.notes || '',
      });
    } else {
      setFormData({
        userId: users[0]?.id || '',
        name: '',
        type: 'emergency_fund',
        currentValue: '',
        costBasis: '',
        targetAmount: '',
        monthlyContribution: '',
        symbol: '',
        shares: '',
        totalUnits: '',
        vestedUnits: '',
        grantDate: '',
        vestingEndDate: '',
        discountPercent: '15',
        institution: '',
        notes: '',
      });
    }
  }, [asset, users]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    
    try {
      await onSave(formData, asset?.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (!isOpen) return null;

  const typeInfo = ASSET_TYPES[formData.type] || ASSET_TYPES.other;
  const TypeIcon = typeInfo.icon;
  const colors = colorClasses[typeInfo.color];

  const showStockFields = ['stock', 'espp'].includes(formData.type);
  const showRSUFields = formData.type === 'rsu';
  const showFundFields = ['emergency_fund', 'education_fund', 'savings'].includes(formData.type);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-sm animate-fade-in">
      <div className="glass rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-navy-700/50">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${colors.bg} ${colors.border} border`}>
              <TypeIcon className={`w-5 h-5 ${colors.text}`} />
            </div>
            <h2 className="text-xl font-bold text-white">
              {asset ? 'Edit Asset' : 'Add New Asset'}
            </h2>
          </div>
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

          {/* Asset Type */}
          <div>
            <label className="block text-sm text-navy-400 mb-2">Asset Type</label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(ASSET_TYPES).map(([key, { label, icon: Icon, color }]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, type: key }))}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all ${
                    formData.type === key
                      ? `${colorClasses[color].bg} ${colorClasses[color].border} ${colorClasses[color].text}`
                      : 'bg-navy-800 border-navy-600 text-navy-400 hover:border-navy-500'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* User */}
          <div>
            <label className="block text-sm text-navy-400 mb-1.5">Owner</label>
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

          {/* Name */}
          <div>
            <label className="block text-sm text-navy-400 mb-1.5">Asset Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder={`e.g., ${typeInfo.label}`}
              className="w-full bg-navy-800 border border-navy-600 rounded-xl px-4 py-2.5 text-white"
              required
            />
          </div>

          {/* Value Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-navy-400 mb-1.5">Current Value</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400">₪</span>
                <input
                  type="number"
                  value={formData.currentValue}
                  onChange={(e) => setFormData(prev => ({ ...prev, currentValue: e.target.value }))}
                  placeholder="0"
                  className="w-full bg-navy-800 border border-navy-600 rounded-xl pl-8 pr-4 py-2.5 text-white"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-navy-400 mb-1.5">Cost Basis</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400">₪</span>
                <input
                  type="number"
                  value={formData.costBasis}
                  onChange={(e) => setFormData(prev => ({ ...prev, costBasis: e.target.value }))}
                  placeholder="Total invested"
                  className="w-full bg-navy-800 border border-navy-600 rounded-xl pl-8 pr-4 py-2.5 text-white"
                />
              </div>
            </div>
          </div>

          {/* Fund-specific fields */}
          {showFundFields && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-navy-400 mb-1.5">Target Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400">₪</span>
                  <input
                    type="number"
                    value={formData.targetAmount}
                    onChange={(e) => setFormData(prev => ({ ...prev, targetAmount: e.target.value }))}
                    placeholder="Goal amount"
                    className="w-full bg-navy-800 border border-navy-600 rounded-xl pl-8 pr-4 py-2.5 text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-navy-400 mb-1.5">Monthly Contribution</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400">₪</span>
                  <input
                    type="number"
                    value={formData.monthlyContribution}
                    onChange={(e) => setFormData(prev => ({ ...prev, monthlyContribution: e.target.value }))}
                    placeholder="0"
                    className="w-full bg-navy-800 border border-navy-600 rounded-xl pl-8 pr-4 py-2.5 text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Stock-specific fields */}
          {showStockFields && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-navy-400 mb-1.5">Stock Symbol</label>
                <input
                  type="text"
                  value={formData.symbol}
                  onChange={(e) => setFormData(prev => ({ ...prev, symbol: e.target.value.toUpperCase() }))}
                  placeholder="e.g., AAPL"
                  className="w-full bg-navy-800 border border-navy-600 rounded-xl px-4 py-2.5 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-navy-400 mb-1.5">Shares</label>
                <input
                  type="number"
                  step="0.001"
                  value={formData.shares}
                  onChange={(e) => setFormData(prev => ({ ...prev, shares: e.target.value }))}
                  placeholder="0"
                  className="w-full bg-navy-800 border border-navy-600 rounded-xl px-4 py-2.5 text-white"
                />
              </div>
            </div>
          )}

          {/* ESPP discount */}
          {formData.type === 'espp' && (
            <div>
              <label className="block text-sm text-navy-400 mb-1.5">ESPP Discount %</label>
              <div className="relative">
                <input
                  type="number"
                  value={formData.discountPercent}
                  onChange={(e) => setFormData(prev => ({ ...prev, discountPercent: e.target.value }))}
                  placeholder="15"
                  className="w-full bg-navy-800 border border-navy-600 rounded-xl px-4 pr-8 py-2.5 text-white"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400">%</span>
              </div>
            </div>
          )}

          {/* RSU-specific fields */}
          {showRSUFields && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-navy-400 mb-1.5">Total Units</label>
                  <input
                    type="number"
                    value={formData.totalUnits}
                    onChange={(e) => setFormData(prev => ({ ...prev, totalUnits: e.target.value }))}
                    placeholder="0"
                    className="w-full bg-navy-800 border border-navy-600 rounded-xl px-4 py-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-navy-400 mb-1.5">Vested Units</label>
                  <input
                    type="number"
                    value={formData.vestedUnits}
                    onChange={(e) => setFormData(prev => ({ ...prev, vestedUnits: e.target.value }))}
                    placeholder="0"
                    className="w-full bg-navy-800 border border-navy-600 rounded-xl px-4 py-2.5 text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-navy-400 mb-1.5">Grant Date</label>
                  <input
                    type="date"
                    value={formData.grantDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, grantDate: e.target.value }))}
                    className="w-full bg-navy-800 border border-navy-600 rounded-xl px-4 py-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-navy-400 mb-1.5">Vesting End Date</label>
                  <input
                    type="date"
                    value={formData.vestingEndDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, vestingEndDate: e.target.value }))}
                    className="w-full bg-navy-800 border border-navy-600 rounded-xl px-4 py-2.5 text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-navy-400 mb-1.5">Stock Symbol</label>
                <input
                  type="text"
                  value={formData.symbol}
                  onChange={(e) => setFormData(prev => ({ ...prev, symbol: e.target.value.toUpperCase() }))}
                  placeholder="e.g., GOOG"
                  className="w-full bg-navy-800 border border-navy-600 rounded-xl px-4 py-2.5 text-white"
                />
              </div>
            </>
          )}

          {/* Institution & Notes */}
          <div>
            <label className="block text-sm text-navy-400 mb-1.5">Institution/Broker</label>
            <input
              type="text"
              value={formData.institution}
              onChange={(e) => setFormData(prev => ({ ...prev, institution: e.target.value }))}
              placeholder="e.g., Bank, Broker name"
              className="w-full bg-navy-800 border border-navy-600 rounded-xl px-4 py-2.5 text-white"
            />
          </div>

          <div>
            <label className="block text-sm text-navy-400 mb-1.5">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Any additional notes..."
              rows={2}
              className="w-full bg-navy-800 border border-navy-600 rounded-xl px-4 py-2.5 text-white resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className={`w-full flex items-center justify-center gap-2 px-5 py-3 text-white font-medium rounded-xl transition-all mt-6 ${colors.bg} hover:opacity-80 border ${colors.border}`}
            style={{ background: `linear-gradient(to right, var(--tw-gradient-from), var(--tw-gradient-to))` }}
          >
            {saving ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>{asset ? 'Update Asset' : 'Add Asset'}</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

