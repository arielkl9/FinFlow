import { useState } from 'react';
import { Plus, X, DollarSign, FileText, Tag, User } from 'lucide-react';
import { recordAPI } from '../../api';
import { getCurrentMonth } from '../../hooks/useFinanceData';

export default function QuickAdd({ users, categories, onSuccess }) {
  const [isOpen, setIsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    userId: '',
    categoryId: '',
    amount: '',
    note: '',
  });

  function resetForm() {
    setFormData({ userId: '', categoryId: '', amount: '', note: '' });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.userId || !formData.categoryId || !formData.amount) return;

    setSaving(true);
    try {
      await recordAPI.save({
        userId: formData.userId,
        categoryId: formData.categoryId,
        amount: parseFloat(formData.amount),
        monthYear: getCurrentMonth(),
        note: formData.note,
      });
      resetForm();
      setIsOpen(false);
      onSuccess?.();
    } catch (err) {
      console.error('Failed to save:', err);
    } finally {
      setSaving(false);
    }
  }

  // Group categories by type for better selection
  const categoryGroups = categories.reduce((acc, cat) => {
    if (!acc[cat.type]) acc[cat.type] = [];
    acc[cat.type].push(cat);
    return acc;
  }, {});

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 z-40 w-14 h-14 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-110 transition-all flex items-center justify-center group"
        title="Quick Add Record"
      >
        <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform" />
      </button>

      {/* Quick Add Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-sm animate-fade-in">
          <div className="glass rounded-2xl w-full max-w-md animate-slide-up">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-navy-700/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                  <Plus className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Quick Add</h2>
                  <p className="text-xs text-navy-400">Add a record for this month</p>
                </div>
              </div>
              <button
                onClick={() => { setIsOpen(false); resetForm(); }}
                className="p-2 rounded-lg text-navy-400 hover:text-white hover:bg-navy-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* User Selection */}
              <div>
                <label className="flex items-center gap-2 text-sm text-navy-400 mb-2">
                  <User className="w-4 h-4" />
                  Who is this for?
                </label>
                <div className="flex flex-wrap gap-2">
                  {users.map(user => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, userId: user.id }))}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                        formData.userId === user.id
                          ? 'bg-emerald-500 text-white'
                          : 'bg-navy-800 text-navy-300 hover:bg-navy-700 border border-navy-600'
                      }`}
                    >
                      {user.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category Selection */}
              <div>
                <label className="flex items-center gap-2 text-sm text-navy-400 mb-2">
                  <Tag className="w-4 h-4" />
                  Category
                </label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
                  className="w-full bg-navy-800 border border-navy-600 rounded-xl px-4 py-3 text-white"
                  required
                >
                  <option value="">Select a category...</option>
                  {Object.entries(categoryGroups).map(([type, cats]) => (
                    <optgroup key={type} label={type}>
                      {cats.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="flex items-center gap-2 text-sm text-navy-400 mb-2">
                  <DollarSign className="w-4 h-4" />
                  Amount
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-navy-400 text-lg">₪</span>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="0"
                    className="w-full bg-navy-800 border border-navy-600 rounded-xl px-4 pl-10 py-3 text-white text-xl font-mono"
                    required
                  />
                </div>
              </div>

              {/* Note (optional) */}
              <div>
                <label className="flex items-center gap-2 text-sm text-navy-400 mb-2">
                  <FileText className="w-4 h-4" />
                  Note <span className="text-navy-500">(optional)</span>
                </label>
                <input
                  type="text"
                  value={formData.note}
                  onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
                  placeholder="Add a note..."
                  className="w-full bg-navy-800 border border-navy-600 rounded-xl px-4 py-3 text-white placeholder-navy-500"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={saving || !formData.userId || !formData.categoryId || !formData.amount}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-medium rounded-xl hover:from-emerald-400 hover:to-emerald-500 transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    <span>Add Record</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

