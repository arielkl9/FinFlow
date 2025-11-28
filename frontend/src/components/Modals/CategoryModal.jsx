import { useState } from 'react';
import { X, Plus, Trash2, Tag, AlertCircle, Home, User, GripVertical } from 'lucide-react';
import { categoryAPI } from '../../api';

const CATEGORY_TYPES = [
  { value: 'Income', label: 'Income', color: 'text-emerald-400 bg-emerald-500/10', borderColor: 'border-emerald-500/30', dropColor: 'bg-emerald-500/20' },
  { value: 'Fixed Expense', label: 'Fixed Expense', color: 'text-amber-400 bg-amber-500/10', borderColor: 'border-amber-500/30', dropColor: 'bg-amber-500/20' },
  { value: 'Utility', label: 'Utility', color: 'text-cyan-400 bg-cyan-500/10', borderColor: 'border-cyan-500/30', dropColor: 'bg-cyan-500/20' },
];

export default function CategoryModal({ isOpen, onClose, categories, onRefresh }) {
  const [newCategory, setNewCategory] = useState({ name: '', type: 'Fixed Expense', isRecurring: true, isHousehold: true });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(null);
  const [draggedCategory, setDraggedCategory] = useState(null);
  const [dragOverType, setDragOverType] = useState(null);

  if (!isOpen) return null;

  async function handleAddCategory(e) {
    e.preventDefault();
    if (!newCategory.name.trim()) return;

    setSaving(true);
    setError(null);

    try {
      await categoryAPI.create(newCategory);
      await onRefresh();
      setNewCategory({ name: '', type: 'Fixed Expense', isRecurring: true, isHousehold: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteCategory(id) {
    if (!confirm('Are you sure? This will delete all associated records.')) return;

    setDeleting(id);
    setError(null);

    try {
      await categoryAPI.delete(id);
      await onRefresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(null);
    }
  }

  async function handleToggleHousehold(category) {
    setUpdating(category.id);
    setError(null);

    try {
      await categoryAPI.update(category.id, { isHousehold: !category.isHousehold });
      await onRefresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdating(null);
    }
  }

  // Drag and Drop handlers
  function handleDragStart(e, category) {
    setDraggedCategory(category);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', category.id.toString());
    // Add a slight delay to show the drag effect
    setTimeout(() => {
      e.target.style.opacity = '0.5';
    }, 0);
  }

  function handleDragEnd(e) {
    e.target.style.opacity = '1';
    setDraggedCategory(null);
    setDragOverType(null);
  }

  function handleDragOver(e, typeValue) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedCategory && draggedCategory.type !== typeValue) {
      setDragOverType(typeValue);
    }
  }

  function handleDragLeave(e) {
    // Only clear if leaving the drop zone entirely
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverType(null);
    }
  }

  async function handleDrop(e, newType) {
    e.preventDefault();
    setDragOverType(null);

    if (!draggedCategory || draggedCategory.type === newType) {
      return;
    }

    setUpdating(draggedCategory.id);
    setError(null);

    try {
      await categoryAPI.update(draggedCategory.id, { type: newType });
      await onRefresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdating(null);
      setDraggedCategory(null);
    }
  }

  // Group categories by type
  const categoriesByType = CATEGORY_TYPES.map(type => ({
    ...type,
    categories: categories.filter(c => c.type === type.value),
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-sm animate-fade-in">
      <div className="glass rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-navy-700/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-violet-500/20 border border-violet-500/30">
              <Tag className="w-5 h-5 text-violet-400" />
            </div>
            <h2 className="text-xl font-bold text-white">Manage Categories</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-navy-400 hover:text-white hover:bg-navy-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Add New Category Form */}
        <div className="p-6 border-b border-navy-700/50">
          <h3 className="text-sm font-medium text-navy-300 mb-3">Add New Category</h3>
          
          {error && (
            <div className="flex items-center gap-2 bg-coral-500/10 border border-coral-500/30 rounded-xl p-3 mb-4 text-coral-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleAddCategory} className="space-y-3">
            {/* Row 1: Name and Type */}
            <div className="flex gap-3">
              <input
                type="text"
                value={newCategory.name}
                onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Category name (e.g., Gym, Groceries)"
                className="flex-1 bg-navy-800 border border-navy-600 rounded-xl px-4 py-2.5 text-white placeholder-navy-500"
              />
              <select
                value={newCategory.type}
                onChange={(e) => setNewCategory(prev => ({ ...prev, type: e.target.value }))}
                className="bg-navy-800 border border-navy-600 rounded-xl px-4 py-2.5 text-white min-w-[140px]"
              >
                {CATEGORY_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
            
            {/* Row 2: Options and Add button */}
            <div className="flex gap-3 items-center">
              <label className="flex items-center gap-2 bg-navy-800 border border-navy-600 rounded-xl px-3 py-2 cursor-pointer" title="Monthly recurring expense">
                <input
                  type="checkbox"
                  checked={newCategory.isRecurring}
                  onChange={(e) => setNewCategory(prev => ({ ...prev, isRecurring: e.target.checked }))}
                  className="w-4 h-4 rounded border-navy-600 bg-navy-700 text-emerald-500 focus:ring-emerald-500"
                />
                <span className="text-sm text-navy-300">Recurring</span>
              </label>
              <label className="flex items-center gap-2 bg-navy-800 border border-navy-600 rounded-xl px-3 py-2 cursor-pointer" title="Household = shared family expense, Individual = personal">
                <input
                  type="checkbox"
                  checked={newCategory.isHousehold}
                  onChange={(e) => setNewCategory(prev => ({ ...prev, isHousehold: e.target.checked }))}
                  className="w-4 h-4 rounded border-navy-600 bg-navy-700 text-cyan-500 focus:ring-cyan-500"
                />
                <span className="text-sm text-navy-300">Household</span>
              </label>
              <button
                type="submit"
                disabled={saving || !newCategory.name.trim()}
                className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-medium rounded-xl hover:from-emerald-400 hover:to-emerald-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                <span>Add</span>
              </button>
            </div>
          </form>
        </div>

        {/* Categories List */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {categoriesByType.map(typeGroup => (
              <div 
                key={typeGroup.value}
                onDragOver={(e) => handleDragOver(e, typeGroup.value)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, typeGroup.value)}
                className={`p-3 rounded-xl transition-all duration-200 ${
                  dragOverType === typeGroup.value 
                    ? `${typeGroup.dropColor} border-2 border-dashed ${typeGroup.borderColor}` 
                    : 'border-2 border-transparent'
                }`}
              >
                <h4 className={`text-sm font-medium mb-3 ${typeGroup.color.split(' ')[0]}`}>
                  {typeGroup.label}
                  <span className="ml-2 text-navy-500">({typeGroup.categories.length})</span>
                  {dragOverType === typeGroup.value && draggedCategory?.type !== typeGroup.value && (
                    <span className="ml-2 text-xs text-white bg-navy-600 px-2 py-0.5 rounded">
                      Drop here to move
                    </span>
                  )}
                </h4>
                
                {typeGroup.categories.length === 0 ? (
                  <p className={`text-sm italic ${dragOverType === typeGroup.value ? 'text-navy-300' : 'text-navy-500'}`}>
                    {dragOverType === typeGroup.value ? 'Drop category here' : 'No categories'}
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {typeGroup.categories.map(category => (
                      <div
                        key={category.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, category)}
                        onDragEnd={handleDragEnd}
                        className={`flex items-center justify-between px-4 py-2.5 rounded-xl border ${typeGroup.color} group cursor-grab active:cursor-grabbing transition-all ${
                          updating === category.id ? 'opacity-50' : ''
                        } ${draggedCategory?.id === category.id ? 'ring-2 ring-white/50' : ''}`}
                      >
                        <div className="flex items-center gap-2">
                          <GripVertical className="w-4 h-4 text-navy-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                          <span className="text-white">{category.name}</span>
                          {category.isRecurring && (
                            <span className="px-1.5 py-0.5 bg-violet-500/30 text-violet-300 text-xs rounded" title="Recurring">
                              R
                            </span>
                          )}
                          <button
                            onClick={() => handleToggleHousehold(category)}
                            disabled={updating === category.id}
                            className={`flex items-center gap-1 px-1.5 py-0.5 text-xs rounded transition-colors ${
                              category.isHousehold 
                                ? 'bg-cyan-500/30 text-cyan-300 hover:bg-cyan-500/40' 
                                : 'bg-amber-500/30 text-amber-300 hover:bg-amber-500/40'
                            }`}
                            title={category.isHousehold ? 'Household (shared) - click to change' : 'Individual (personal) - click to change'}
                          >
                            {updating === category.id ? (
                              <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin"></div>
                            ) : category.isHousehold ? (
                              <Home className="w-3 h-3" />
                            ) : (
                              <User className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                        <button
                          onClick={() => handleDeleteCategory(category.id)}
                          disabled={deleting === category.id}
                          className="p-1.5 rounded-lg text-navy-400 hover:text-coral-400 hover:bg-coral-500/10 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          {deleting === category.id ? (
                            <div className="w-4 h-4 border-2 border-coral-400 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-navy-700/50 space-y-1">
          <p className="text-xs text-navy-500 text-center">
            <span className="px-1 py-0.5 bg-violet-500/30 text-violet-300 rounded">R</span> = Recurring (copied each month) • 
            <span className="inline-flex items-center gap-0.5 px-1 py-0.5 bg-cyan-500/30 text-cyan-300 rounded ml-1"><Home className="w-3 h-3" /></span> = Household (shared) • 
            <span className="inline-flex items-center gap-0.5 px-1 py-0.5 bg-amber-500/30 text-amber-300 rounded ml-1"><User className="w-3 h-3" /></span> = Individual (personal)
          </p>
          <p className="text-xs text-navy-600 text-center">
            Drag categories between sections to change type • Click household/individual badge to toggle
          </p>
        </div>
      </div>
    </div>
  );
}
