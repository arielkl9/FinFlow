import { useState, useEffect } from 'react';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  Zap, 
  Lock,
  AlertCircle,
  Sparkles,
  Home,
  User,
  Plus,
  Trash2
} from 'lucide-react';
import { workflowAPI, recordAPI, categoryAPI } from '../../api';
import { formatMonth, formatCurrency } from '../../hooks/useFinanceData';

const CATEGORY_TYPES = [
  { value: 'Income', label: 'Income' },
  { value: 'Fixed Expense', label: 'Fixed Expense' },
  { value: 'Utility', label: 'Utility' },
];

export default function MonthlySetupWizard({ 
  isOpen, 
  onClose, 
  userId, 
  monthYear, 
  onComplete,
  mode = null // 'household' | 'individual' | null (for selection)
}) {
  const [setupMode, setSetupMode] = useState(mode);
  const [step, setStep] = useState(0);
  const [categories, setCategories] = useState({ static: [], dynamic: [] });
  const [values, setValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  
  // New category form
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', type: 'Fixed Expense', isRecurring: true });
  const [addingCategory, setAddingCategory] = useState(false);

  const STEPS = setupMode ? [
    { id: 'add', title: 'Add New', description: 'Create new categories', icon: Plus },
    { id: 'static', title: 'Static', description: 'Fixed amounts', icon: Lock },
    { id: 'dynamic', title: 'Variable', description: 'Changing amounts', icon: Zap },
    { id: 'review', title: 'Review', description: 'Confirm entries', icon: Check },
  ] : [];

  useEffect(() => {
    if (isOpen && setupMode) {
      loadCategories();
      setStep(0);
    }
  }, [isOpen, userId, monthYear, setupMode]);

  useEffect(() => {
    if (!isOpen) {
      setSetupMode(mode);
      setStep(0);
    }
  }, [isOpen, mode]);

  async function loadCategories() {
    try {
      setLoading(true);
      const data = await workflowAPI.getSetupCategories({ userId, monthYear });
      
      // Filter by household/individual mode
      const filterByMode = (cats) => cats.filter(cat => 
        setupMode === 'household' ? cat.isHousehold : !cat.isHousehold
      );
      
      setCategories({
        static: filterByMode(data.static),
        dynamic: filterByMode(data.dynamic),
      });
      
      // Initialize values from existing data
      const initialValues = {};
      [...data.static, ...data.dynamic].forEach(cat => {
        if ((setupMode === 'household' && cat.isHousehold) || (setupMode === 'individual' && !cat.isHousehold)) {
          cat.users.forEach(user => {
            initialValues[`${user.userId}-${cat.id}`] = user.amount || 0;
          });
        }
      });
      setValues(initialValues);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleValueChange(userId, categoryId, value) {
    setValues(prev => ({
      ...prev,
      [`${userId}-${categoryId}`]: parseFloat(value) || 0,
    }));
  }

  async function handleAddCategory() {
    if (!newCategory.name.trim()) return;
    
    setAddingCategory(true);
    try {
      await categoryAPI.create({
        ...newCategory,
        isHousehold: setupMode === 'household',
      });
      await loadCategories();
      setNewCategory({ name: '', type: 'Fixed Expense', isRecurring: true });
      setShowAddCategory(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setAddingCategory(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError(null);

    try {
      const records = [];
      [...categories.static, ...categories.dynamic].forEach(cat => {
        // For household categories, only save for the first user
        // For individual categories, save for each user
        const usersToSave = cat.isHousehold ? [cat.users[0]] : cat.users;
        usersToSave.forEach(user => {
          records.push({
            userId: user.userId,
            categoryId: cat.id,
            monthYear,
            amount: values[`${user.userId}-${cat.id}`] || 0,
          });
        });
      });

      await recordAPI.bulkSave(records);
      onComplete?.();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function nextStep() {
    if (step < STEPS.length - 1) setStep(s => s + 1);
  }

  function prevStep() {
    if (step > 0) setStep(s => s - 1);
  }

  function calculateTotals() {
    let staticTotal = 0;
    let dynamicTotal = 0;

    categories.static.forEach(cat => {
      const usersToCount = cat.isHousehold ? [cat.users[0]] : cat.users;
      usersToCount.forEach(user => {
        staticTotal += values[`${user.userId}-${cat.id}`] || 0;
      });
    });

    categories.dynamic.forEach(cat => {
      const usersToCount = cat.isHousehold ? [cat.users[0]] : cat.users;
      usersToCount.forEach(user => {
        dynamicTotal += values[`${user.userId}-${cat.id}`] || 0;
      });
    });

    return { staticTotal, dynamicTotal, total: staticTotal + dynamicTotal };
  }

  if (!isOpen) return null;

  const totals = calculateTotals();
  const isFamilyView = userId === 'family';
  const isHouseholdMode = setupMode === 'household';

  // Mode Selection Screen
  if (!setupMode) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/90 backdrop-blur-sm">
        <div className="glass rounded-2xl w-full max-w-lg p-8 animate-slide-up">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-white">Setup {formatMonth(monthYear)}</h2>
              <p className="text-navy-400">Choose what you want to set up</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-navy-400 hover:text-white hover:bg-navy-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => setSetupMode('household')}
              className="w-full flex items-center gap-4 p-6 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 transition-all group"
            >
              <div className="p-4 rounded-xl bg-cyan-500/20 border border-cyan-500/30 group-hover:scale-110 transition-transform">
                <Home className="w-8 h-8 text-cyan-400" />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-semibold text-white">Household Expenses</h3>
                <p className="text-sm text-navy-400">Shared family expenses (rent, utilities, groceries)</p>
              </div>
              <ChevronRight className="w-5 h-5 text-cyan-400 ml-auto" />
            </button>

            <button
              onClick={() => setSetupMode('individual')}
              className="w-full flex items-center gap-4 p-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 transition-all group"
            >
              <div className="p-4 rounded-xl bg-amber-500/20 border border-amber-500/30 group-hover:scale-110 transition-transform">
                <User className="w-8 h-8 text-amber-400" />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-semibold text-white">Individual Expenses</h3>
                <p className="text-sm text-navy-400">Personal expenses (subscriptions, gym, hobbies)</p>
              </div>
              <ChevronRight className="w-5 h-5 text-amber-400 ml-auto" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentStep = STEPS[step];
  const modeColor = isHouseholdMode ? 'cyan' : 'amber';
  const ModeIcon = isHouseholdMode ? Home : User;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/90 backdrop-blur-sm">
      <div className="glass rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-navy-700/50">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl bg-${modeColor}-500/20 border border-${modeColor}-500/30`}>
              <ModeIcon className={`w-5 h-5 text-${modeColor}-400`} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {isHouseholdMode ? 'Household' : 'Individual'} - {formatMonth(monthYear)}
              </h2>
              <p className="text-sm text-navy-400">
                {isHouseholdMode ? 'Shared family expenses' : 'Personal expenses'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-navy-400 hover:text-white hover:bg-navy-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b border-navy-700/50 bg-navy-800/30">
          <div className="flex items-center justify-between">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const isActive = i === step;
              const isComplete = i < step;
              
              return (
                <div key={s.id} className="flex items-center">
                  <button
                    onClick={() => setStep(i)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${
                      isActive 
                        ? `bg-${modeColor}-500/20 text-${modeColor}-400 border border-${modeColor}-500/30` 
                        : isComplete
                          ? `text-${modeColor}-400`
                          : 'text-navy-400'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                      isActive ? `bg-${modeColor}-500` : isComplete ? `bg-${modeColor}-500/30` : 'bg-navy-700'
                    }`}>
                      {isComplete ? (
                        <Check className="w-3.5 h-3.5 text-white" />
                      ) : (
                        <Icon className="w-3.5 h-3.5 text-white" />
                      )}
                    </div>
                    <div className="hidden sm:block text-left">
                      <p className="text-xs font-medium">{s.title}</p>
                    </div>
                  </button>
                  {i < STEPS.length - 1 && (
                    <ChevronRight className="w-4 h-4 text-navy-600 mx-1" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className={`w-10 h-10 border-4 border-${modeColor}-500 border-t-transparent rounded-full animate-spin`}></div>
            </div>
          ) : error ? (
            <div className="flex items-center gap-3 bg-coral-500/10 border border-coral-500/30 rounded-xl p-4 text-coral-400">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          ) : (
            <>
              {/* Step 1: Add New Categories */}
              {step === 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-6">
                    <div className={`p-3 rounded-xl bg-${modeColor}-500/20 border border-${modeColor}-500/30`}>
                      <Plus className={`w-6 h-6 text-${modeColor}-400`} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Add New {isHouseholdMode ? 'Household' : 'Individual'} Categories</h3>
                      <p className="text-sm text-navy-400">
                        Create new expense categories before entering values
                      </p>
                    </div>
                  </div>

                  {/* Add Category Form */}
                  <div className={`rounded-xl border p-4 bg-${modeColor}-500/5 border-${modeColor}-500/20`}>
                    <div className="flex flex-wrap gap-3">
                      <input
                        type="text"
                        value={newCategory.name}
                        onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Category name (e.g., Netflix, Gym)"
                        className="flex-1 min-w-[200px] bg-navy-800 border border-navy-600 rounded-xl px-4 py-2.5 text-white placeholder-navy-500"
                      />
                      <select
                        value={newCategory.type}
                        onChange={(e) => setNewCategory(prev => ({ ...prev, type: e.target.value }))}
                        className="bg-navy-800 border border-navy-600 rounded-xl px-4 py-2.5 text-white"
                      >
                        {CATEGORY_TYPES.map(type => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </select>
                      <label className="flex items-center gap-2 bg-navy-800 border border-navy-600 rounded-xl px-4 py-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newCategory.isRecurring}
                          onChange={(e) => setNewCategory(prev => ({ ...prev, isRecurring: e.target.checked }))}
                          className="w-4 h-4 rounded border-navy-600 bg-navy-700 text-emerald-500"
                        />
                        <span className="text-sm text-navy-300">Recurring</span>
                      </label>
                      <button
                        onClick={handleAddCategory}
                        disabled={addingCategory || !newCategory.name.trim()}
                        className={`flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-${modeColor}-500 to-${modeColor}-600 text-white font-medium rounded-xl hover:from-${modeColor}-400 hover:to-${modeColor}-500 transition-all disabled:opacity-50`}
                      >
                        {addingCategory ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <Plus className="w-4 h-4" />
                        )}
                        <span>Add</span>
                      </button>
                    </div>
                  </div>

                  {/* Existing Categories List */}
                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-navy-400 mb-3">
                      Existing {isHouseholdMode ? 'Household' : 'Individual'} Categories
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[...categories.static, ...categories.dynamic].map(cat => (
                        <div
                          key={cat.id}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-${modeColor}-500/10 border border-${modeColor}-500/20`}
                        >
                          <ModeIcon className={`w-4 h-4 text-${modeColor}-400`} />
                          <span className="text-white text-sm truncate">{cat.name}</span>
                          <span className="text-xs text-navy-500">{cat.type.split(' ')[0]}</span>
                        </div>
                      ))}
                      {categories.static.length === 0 && categories.dynamic.length === 0 && (
                        <p className="col-span-full text-navy-500 text-sm italic">
                          No {isHouseholdMode ? 'household' : 'individual'} categories yet. Add some above!
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Static Payments */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-6">
                    <div className={`p-3 rounded-xl bg-violet-500/20 border border-violet-500/30`}>
                      <Lock className="w-6 h-6 text-violet-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Static Payments</h3>
                      <p className="text-sm text-navy-400">
                        Fixed amounts that stay the same each month
                      </p>
                    </div>
                  </div>

                  {categories.static.length === 0 ? (
                    <div className="text-center py-8 text-navy-400">
                      <Lock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No static {isHouseholdMode ? 'household' : 'individual'} categories.</p>
                      <p className="text-sm">Go back to add some, or continue to variable expenses.</p>
                    </div>
                  ) : (
                    <CategoryInputList 
                      categories={categories.static}
                      values={values}
                      onChange={handleValueChange}
                      isFamilyView={isFamilyView}
                      isStatic={true}
                      isHouseholdMode={isHouseholdMode}
                    />
                  )}
                </div>
              )}

              {/* Step 3: Dynamic/Variable Payments */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 rounded-xl bg-amber-500/20 border border-amber-500/30">
                      <Zap className="w-6 h-6 text-amber-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Variable Expenses</h3>
                      <p className="text-sm text-navy-400">
                        Amounts that change each month
                      </p>
                    </div>
                  </div>

                  {categories.dynamic.length === 0 ? (
                    <div className="text-center py-8 text-navy-400">
                      <Zap className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No variable {isHouseholdMode ? 'household' : 'individual'} categories.</p>
                    </div>
                  ) : (
                    <CategoryInputList 
                      categories={categories.dynamic}
                      values={values}
                      onChange={handleValueChange}
                      isFamilyView={isFamilyView}
                      isStatic={false}
                      isHouseholdMode={isHouseholdMode}
                    />
                  )}
                </div>
              )}

              {/* Step 4: Review */}
              {step === 3 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30">
                      <Sparkles className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Review & Confirm</h3>
                      <p className="text-sm text-navy-400">
                        {isHouseholdMode ? 'Household' : 'Individual'} expenses summary
                      </p>
                    </div>
                  </div>

                  {/* Summary Cards */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-violet-500/10 border border-violet-500/30 rounded-xl p-4 text-center">
                      <p className="text-sm text-violet-400 mb-1">Static</p>
                      <p className="text-2xl font-bold text-white font-mono">
                        {formatCurrency(totals.staticTotal)}
                      </p>
                    </div>
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-center">
                      <p className="text-sm text-amber-400 mb-1">Variable</p>
                      <p className="text-2xl font-bold text-white font-mono">
                        {formatCurrency(totals.dynamicTotal)}
                      </p>
                    </div>
                    <div className={`bg-${modeColor}-500/10 border border-${modeColor}-500/30 rounded-xl p-4 text-center`}>
                      <p className={`text-sm text-${modeColor}-400 mb-1`}>Total {isHouseholdMode ? 'Household' : 'Individual'}</p>
                      <p className="text-2xl font-bold text-white font-mono">
                        {formatCurrency(totals.total)}
                      </p>
                    </div>
                  </div>

                  {/* Detailed Breakdown */}
                  <div className="space-y-4">
                    {categories.static.length > 0 && (
                      <div className="bg-navy-800/30 rounded-xl p-4">
                        <h4 className="text-sm font-medium text-violet-400 mb-3 flex items-center gap-2">
                          <Lock className="w-4 h-4" /> Static Payments
                        </h4>
                        <div className="space-y-2">
                          {categories.static.map(cat => {
                            const usersToSum = cat.isHousehold ? [cat.users[0]] : cat.users;
                            return (
                              <div key={cat.id} className="flex justify-between text-sm">
                                <div className="flex items-center gap-2">
                                  <span className="text-navy-300">{cat.name}</span>
                                  <ModeIcon className={`w-3 h-3 text-${modeColor}-400`} />
                                </div>
                                <span className="text-white font-mono">
                                  {formatCurrency(
                                    usersToSum.reduce((sum, u) => sum + (values[`${u.userId}-${cat.id}`] || 0), 0)
                                  )}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {categories.dynamic.length > 0 && (
                      <div className="bg-navy-800/30 rounded-xl p-4">
                        <h4 className="text-sm font-medium text-amber-400 mb-3 flex items-center gap-2">
                          <Zap className="w-4 h-4" /> Variable Expenses
                        </h4>
                        <div className="space-y-2">
                          {categories.dynamic.map(cat => {
                            const usersToSum = cat.isHousehold ? [cat.users[0]] : cat.users;
                            return (
                              <div key={cat.id} className="flex justify-between text-sm">
                                <div className="flex items-center gap-2">
                                  <span className="text-navy-300">{cat.name}</span>
                                  <ModeIcon className={`w-3 h-3 text-${modeColor}-400`} />
                                </div>
                                <span className="text-white font-mono">
                                  {formatCurrency(
                                    usersToSum.reduce((sum, u) => sum + (values[`${u.userId}-${cat.id}`] || 0), 0)
                                  )}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-navy-700/50">
          <button
            onClick={() => step === 0 ? setSetupMode(null) : prevStep()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-navy-300 hover:text-white hover:bg-navy-700 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>{step === 0 ? 'Back to Selection' : 'Back'}</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-navy-400 hover:text-white transition-colors"
            >
              Cancel
            </button>

            {step < STEPS.length - 1 ? (
              <button
                onClick={nextStep}
                className={`flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-${modeColor}-500 to-${modeColor}-600 text-white font-medium rounded-xl hover:from-${modeColor}-400 hover:to-${modeColor}-500 transition-all`}
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-medium rounded-xl hover:from-emerald-400 hover:to-emerald-500 transition-all disabled:opacity-50"
              >
                {saving ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    <span>Save All</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CategoryInputList({ categories, values, onChange, isFamilyView, isStatic, isHouseholdMode }) {
  return (
    <div className="space-y-4">
      {categories.map(cat => {
        // For household categories, only show one input (first user)
        // For individual categories, show inputs for each user
        const displayUsers = cat.isHousehold ? [cat.users[0]] : cat.users;
        
        return (
          <div 
            key={cat.id} 
            className={`rounded-xl border p-4 ${
              isStatic 
                ? 'bg-violet-500/5 border-violet-500/20' 
                : 'bg-amber-500/5 border-amber-500/20'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <p className="font-medium text-white">{cat.name}</p>
                <span 
                  className={`flex items-center gap-1 px-1.5 py-0.5 text-xs rounded ${
                    isHouseholdMode 
                      ? 'bg-cyan-500/30 text-cyan-300' 
                      : 'bg-amber-500/30 text-amber-300'
                  }`}
                >
                  {isHouseholdMode ? <Home className="w-3 h-3" /> : <User className="w-3 h-3" />}
                </span>
                <p className="text-xs text-navy-400">{cat.type}</p>
              </div>
              {isStatic && cat.defaultAmount > 0 && (
                <span className="text-xs text-violet-400 bg-violet-500/20 px-2 py-1 rounded">
                  Default: {formatCurrency(cat.defaultAmount)}
                </span>
              )}
            </div>

            <div className={`grid gap-3 ${!cat.isHousehold && isFamilyView ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
              {displayUsers.map(user => (
                <div key={user.userId} className="flex items-center gap-3">
                  {!cat.isHousehold && isFamilyView && (
                    <span className="text-sm text-navy-400 w-20">{user.userName}</span>
                  )}
                  {cat.isHousehold && isFamilyView && (
                    <span className="text-sm text-cyan-400 w-24">Total</span>
                  )}
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400">₪</span>
                    <input
                      type="number"
                      value={values[`${user.userId}-${cat.id}`] || ''}
                      onChange={(e) => onChange(user.userId, cat.id, e.target.value)}
                      placeholder="0"
                      className="w-full bg-navy-800 border border-navy-600 rounded-lg pl-8 pr-4 py-2 text-white font-mono focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
