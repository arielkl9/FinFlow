import { useState, useEffect } from 'react';
import { Lock, Save, AlertCircle, Check, Info } from 'lucide-react';
import { categoryAPI } from '../../api';
import { formatCurrency } from '../../hooks/useFinanceData';

export default function StaticPaymentsManager({ categories, onRefresh }) {
  const [editMode, setEditMode] = useState(false);
  const [values, setValues] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Filter to only show recurring categories
  const recurringCategories = categories.filter(c => c.isRecurring);

  useEffect(() => {
    // Initialize values from categories
    const initial = {};
    recurringCategories.forEach(cat => {
      initial[cat.id] = {
        isStatic: cat.isStatic || false,
        defaultAmount: cat.defaultAmount || 0,
      };
    });
    setValues(initial);
  }, [categories]);

  function handleToggleStatic(catId) {
    setValues(prev => ({
      ...prev,
      [catId]: { ...prev[catId], isStatic: !prev[catId]?.isStatic },
    }));
  }

  function handleAmountChange(catId, amount) {
    setValues(prev => ({
      ...prev,
      [catId]: { ...prev[catId], defaultAmount: parseFloat(amount) || 0 },
    }));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);

    try {
      // Update each category that changed
      const updates = Object.entries(values).map(([catId, val]) => 
        categoryAPI.update(catId, {
          isStatic: val.isStatic,
          defaultAmount: val.defaultAmount,
        })
      );

      await Promise.all(updates);
      await onRefresh?.();
      setSuccess(true);
      setEditMode(false);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  // Group by type
  const groupedCategories = recurringCategories.reduce((acc, cat) => {
    if (!acc[cat.type]) acc[cat.type] = [];
    acc[cat.type].push(cat);
    return acc;
  }, {});

  const totalStatic = Object.entries(values)
    .filter(([_, val]) => val.isStatic)
    .reduce((sum, [_, val]) => sum + (val.defaultAmount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-violet-500/20 border border-violet-500/30">
            <Lock className="w-6 h-6 text-violet-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Static Payments Setup</h2>
            <p className="text-sm text-navy-400">
              Set default amounts for payments that don't change each month
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {success && (
            <div className="flex items-center gap-2 text-emerald-400 text-sm animate-fade-in">
              <Check className="w-4 h-4" />
              Saved!
            </div>
          )}
          
          {editMode ? (
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-medium rounded-xl hover:from-emerald-400 hover:to-emerald-500 transition-all disabled:opacity-50"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>Save Changes</span>
            </button>
          ) : (
            <button
              onClick={() => setEditMode(true)}
              className="px-4 py-2 glass-light rounded-xl text-navy-300 hover:text-white transition-colors"
            >
              Edit Defaults
            </button>
          )}
        </div>
      </div>

      {/* Info Box */}
      <div className="flex items-start gap-3 bg-navy-800/50 rounded-xl p-4">
        <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-navy-300">
          <p className="font-medium text-white mb-1">How Static Payments Work</p>
          <p>Mark categories as "static" and set a default amount. When you start a new month, these amounts will be automatically filled in. Variable expenses (like utilities) will reset to ₪0 for you to enter.</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-coral-500/10 border border-coral-500/30 rounded-xl p-4 text-coral-400">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Summary */}
      <div className="glass rounded-xl p-4">
        <div className="flex items-center justify-between">
          <span className="text-navy-400">Total Monthly Static Payments</span>
          <span className="text-2xl font-bold text-violet-400 font-mono">
            {formatCurrency(totalStatic)}
          </span>
        </div>
      </div>

      {/* Categories by Type */}
      <div className="space-y-6">
        {Object.entries(groupedCategories).map(([type, cats]) => (
          <div key={type} className="glass rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-navy-800/50 border-b border-navy-700/50">
              <h3 className="font-medium text-white">{type}</h3>
            </div>
            <div className="divide-y divide-navy-700/50">
              {cats.map(cat => {
                const val = values[cat.id] || { isStatic: false, defaultAmount: 0 };
                
                return (
                  <div key={cat.id} className="px-4 py-3 flex items-center gap-4">
                    {/* Toggle */}
                    <button
                      onClick={() => editMode && handleToggleStatic(cat.id)}
                      disabled={!editMode}
                      className={`w-12 h-7 rounded-full transition-colors relative ${
                        val.isStatic ? 'bg-violet-500' : 'bg-navy-600'
                      } ${!editMode && 'opacity-60'}`}
                    >
                      <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${
                        val.isStatic ? 'left-6' : 'left-1'
                      }`} />
                    </button>

                    {/* Category Name */}
                    <div className="flex-1">
                      <p className="text-white">{cat.name}</p>
                      <p className="text-xs text-navy-500">
                        {val.isStatic ? 'Static - same each month' : 'Variable - changes monthly'}
                      </p>
                    </div>

                    {/* Amount Input */}
                    {val.isStatic && (
                      <div className="relative w-32">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400">₪</span>
                        <input
                          type="number"
                          value={val.defaultAmount || ''}
                          onChange={(e) => handleAmountChange(cat.id, e.target.value)}
                          disabled={!editMode}
                          placeholder="0"
                          className="w-full bg-navy-800 border border-navy-600 rounded-lg pl-8 pr-3 py-2 text-white font-mono text-right disabled:opacity-60"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

