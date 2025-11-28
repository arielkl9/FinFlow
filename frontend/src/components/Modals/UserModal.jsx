import { useState } from 'react';
import { X, Plus, Trash2, User, AlertCircle, Users } from 'lucide-react';
import { userAPI } from '../../api';

export default function UserModal({ isOpen, onClose, users, onRefresh }) {
  const [newUserName, setNewUserName] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  async function handleAddUser(e) {
    e.preventDefault();
    if (!newUserName.trim()) return;

    setSaving(true);
    setError(null);

    try {
      await userAPI.create(newUserName.trim());
      await onRefresh();
      setNewUserName('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteUser(id, name) {
    if (!confirm(`Are you sure you want to delete "${name}"? This will delete ALL their financial records and debts.`)) return;

    setDeleting(id);
    setError(null);

    try {
      await userAPI.delete(id);
      await onRefresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-sm animate-fade-in">
      <div className="glass rounded-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-navy-700/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30">
              <Users className="w-5 h-5 text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold text-white">Manage Profiles</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-navy-400 hover:text-white hover:bg-navy-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Add New User Form */}
        <div className="p-6 border-b border-navy-700/50">
          <h3 className="text-sm font-medium text-navy-300 mb-3">Add New Profile</h3>
          
          {error && (
            <div className="flex items-center gap-2 bg-coral-500/10 border border-coral-500/30 rounded-xl p-3 mb-4 text-coral-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleAddUser} className="flex gap-3">
            <input
              type="text"
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
              placeholder="Enter name (e.g., John, Sarah)"
              className="flex-1 bg-navy-800 border border-navy-600 rounded-xl px-4 py-2.5 text-white placeholder-navy-500"
            />
            <button
              type="submit"
              disabled={saving || !newUserName.trim()}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-medium rounded-xl hover:from-emerald-400 hover:to-emerald-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Plus className="w-4 h-4" />
              )}
              <span>Add</span>
            </button>
          </form>
        </div>

        {/* Users List */}
        <div className="p-6">
          <h3 className="text-sm font-medium text-navy-300 mb-3">
            Current Profiles
            <span className="ml-2 text-navy-500">({users.length})</span>
          </h3>
          
          {users.length === 0 ? (
            <p className="text-sm text-navy-500 italic text-center py-4">
              No profiles yet. Add one above!
            </p>
          ) : (
            <div className="space-y-2">
              {users.map(user => (
                <div
                  key={user.id}
                  className="flex items-center justify-between px-4 py-3 rounded-xl bg-navy-800/50 border border-navy-700/50 group hover:border-navy-600 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-violet-500 flex items-center justify-center text-white font-semibold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-white font-medium">{user.name}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteUser(user.id, user.name)}
                    disabled={deleting === user.id}
                    className="p-2 rounded-lg text-navy-400 hover:text-coral-400 hover:bg-coral-500/10 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    {deleting === user.id ? (
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

        {/* Footer */}
        <div className="p-6 border-t border-navy-700/50">
          <p className="text-xs text-navy-500 text-center">
            Deleting a profile will remove all their financial records and debts.
          </p>
        </div>
      </div>
    </div>
  );
}

