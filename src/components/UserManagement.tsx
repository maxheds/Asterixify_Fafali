import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { hashPassword } from '../lib/auth';
import { AdminUser } from '../lib/database.types';
import { UserPlus, Trash2, RefreshCw, ShieldCheck, Shield, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';

interface UserManagementProps {
  currentUsername: string;
}

interface NewUserForm {
  username: string;
  password: string;
  confirmPassword: string;
  role: 'master' | 'admin';
}

interface ResetPasswordForm {
  userId: string;
  username: string;
  newPassword: string;
  confirmPassword: string;
}

export function UserManagement({ currentUsername }: UserManagementProps) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [resetForm, setResetForm] = useState<ResetPasswordForm | null>(null);
  const [newUser, setNewUser] = useState<NewUserForm>({ username: '', password: '', confirmPassword: '', role: 'admin' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .order('created_at', { ascending: true });

    if (!error && data) {
      setUsers(data);
    }
    setLoading(false);
  };

  const flashSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 4000);
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newUser.username.trim().length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }
    if (newUser.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (newUser.password !== newUser.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const exists = users.some(u => u.username === newUser.username.trim().toLowerCase());
    if (exists) {
      setError('A user with that username already exists');
      return;
    }

    setSubmitting(true);
    try {
      const { hash, salt } = await hashPassword(newUser.password);
      const { error: insertError } = await supabase
        .from('admin_users')
        .insert({
          username: newUser.username.trim().toLowerCase(),
          password_hash: hash,
          salt,
          role: newUser.role,
          is_active: true,
          app_id: 'default_app',
        });

      if (insertError) {
        setError('Failed to create user. Please try again.');
      } else {
        setNewUser({ username: '', password: '', confirmPassword: '', role: 'admin' });
        setShowAddForm(false);
        flashSuccess(`User "${newUser.username.trim().toLowerCase()}" created successfully`);
        loadUsers();
      }
    } catch {
      setError('Failed to create user. Please try again.');
    }
    setSubmitting(false);
  };

  const handleToggleActive = async (user: AdminUser) => {
    if (user.username === currentUsername) {
      setError("You can't deactivate your own account");
      return;
    }

    const { error } = await supabase
      .from('admin_users')
      .update({ is_active: !user.is_active })
      .eq('id', user.id);

    if (!error) {
      flashSuccess(`User "${user.username}" ${user.is_active ? 'deactivated' : 'activated'}`);
      loadUsers();
    }
  };

  const handleDeleteUser = async (user: AdminUser) => {
    if (user.username === currentUsername) {
      setError("You can't delete your own account");
      return;
    }
    if (!confirm(`Delete user "${user.username}"? This cannot be undone.`)) return;

    const { error } = await supabase
      .from('admin_users')
      .delete()
      .eq('id', user.id);

    if (!error) {
      flashSuccess(`User "${user.username}" deleted`);
      loadUsers();
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetForm) return;
    setError('');

    if (resetForm.newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (resetForm.newPassword !== resetForm.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      const { hash, salt } = await hashPassword(resetForm.newPassword);
      const { error: updateError } = await supabase
        .from('admin_users')
        .update({ password_hash: hash, salt })
        .eq('id', resetForm.userId);

      if (updateError) {
        setError('Failed to reset password. Please try again.');
      } else {
        setResetForm(null);
        flashSuccess(`Password for "${resetForm.username}" reset successfully`);
      }
    } catch {
      setError('Failed to reset password. Please try again.');
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Admin Users</h3>
          <p className="text-sm text-slate-500 mt-0.5">Manage who can access the admin portal</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadUsers}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => { setShowAddForm(true); setError(''); }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <UserPlus size={16} />
            Add User
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
          <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
          <p className="text-red-700 text-sm">{error}</p>
          <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600 text-xs">✕</button>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg p-3">
          <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" />
          <p className="text-green-700 text-sm">{success}</p>
        </div>
      )}

      {/* Add User Form */}
      {showAddForm && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
          <h4 className="font-semibold text-slate-900 mb-4">New Admin User</h4>
          <form onSubmit={handleAddUser} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Username</label>
                <input
                  type="text"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  placeholder="e.g. john_doe"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoComplete="off"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as 'master' | 'admin' })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="admin">Admin</option>
                  <option value="master">Master</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    placeholder="Min. 8 characters"
                    className="w-full px-3 py-2 pr-8 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400">
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Confirm Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newUser.confirmPassword}
                  onChange={(e) => setNewUser({ ...newUser, confirmPassword: e.target.value })}
                  placeholder="Re-enter password"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium"
              >
                {submitting ? 'Creating...' : 'Create User'}
              </button>
              <button
                type="button"
                onClick={() => { setShowAddForm(false); setError(''); setNewUser({ username: '', password: '', confirmPassword: '', role: 'admin' }); }}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-sm rounded-lg hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reset Password Form */}
      {resetForm && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <h4 className="font-semibold text-slate-900 mb-1">Reset Password — <span className="text-blue-600">{resetForm.username}</span></h4>
          <p className="text-xs text-slate-500 mb-4">The user will need to use this new password on their next login.</p>
          <form onSubmit={handleResetPassword} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">New Password</label>
                <div className="relative">
                  <input
                    type={showResetPassword ? 'text' : 'password'}
                    value={resetForm.newPassword}
                    onChange={(e) => setResetForm({ ...resetForm, newPassword: e.target.value })}
                    placeholder="Min. 8 characters"
                    className="w-full px-3 py-2 pr-8 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoFocus
                  />
                  <button type="button" onClick={() => setShowResetPassword(!showResetPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400">
                    {showResetPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Confirm Password</label>
                <input
                  type={showResetPassword ? 'text' : 'password'}
                  value={resetForm.confirmPassword}
                  onChange={(e) => setResetForm({ ...resetForm, confirmPassword: e.target.value })}
                  placeholder="Re-enter password"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-amber-600 text-white text-sm rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 font-medium"
              >
                {submitting ? 'Saving...' : 'Reset Password'}
              </button>
              <button
                type="button"
                onClick={() => { setResetForm(null); setError(''); }}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-sm rounded-lg hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users Table */}
      {loading ? (
        <div className="text-center py-8 text-slate-500 text-sm">Loading users...</div>
      ) : (
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">Username</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">Role</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">Created</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {users.map((user) => (
                <tr key={user.id} className={`hover:bg-slate-50 transition-colors ${!user.is_active ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900 text-sm">{user.username}</span>
                      {user.username === currentUsername && (
                        <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded font-medium">You</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {user.role === 'master' ? (
                        <ShieldCheck size={14} className="text-purple-600" />
                      ) : (
                        <Shield size={14} className="text-slate-400" />
                      )}
                      <span className={`text-sm font-medium capitalize ${user.role === 'master' ? 'text-purple-700' : 'text-slate-600'}`}>
                        {user.role}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${user.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => { setResetForm({ userId: user.id, username: user.username, newPassword: '', confirmPassword: '' }); setError(''); }}
                        className="px-2 py-1 text-xs text-amber-700 hover:bg-amber-50 rounded transition-colors font-medium"
                        title="Reset password"
                      >
                        Reset PW
                      </button>
                      {user.username !== currentUsername && (
                        <>
                          <button
                            onClick={() => handleToggleActive(user)}
                            className={`px-2 py-1 text-xs rounded transition-colors font-medium ${user.is_active ? 'text-slate-600 hover:bg-slate-100' : 'text-green-700 hover:bg-green-50'}`}
                          >
                            {user.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                            title="Delete user"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-500 text-sm">No admin users found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
