import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { hashPassword, verifyPassword } from '../lib/auth';
import { Lock, AlertCircle, User, ShieldCheck } from 'lucide-react';

interface AdminLoginProps {
  onSuccess: (username: string, role: 'master' | 'admin') => void;
  onCancel: () => void;
}

type Mode = 'loading' | 'login' | 'setup';

export function AdminLogin({ onSuccess, onCancel }: AdminLoginProps) {
  const [mode, setMode] = useState<Mode>('loading');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Check whether any admin users exist; if not, show setup mode.
  useEffect(() => {
    const checkUsers = async () => {
      const { data, error } = await supabase
        .from('admin_users')
        .select('id')
        .eq('is_active', true)
        .limit(1);

      if (error || !data || data.length === 0) {
        setMode('setup');
      } else {
        setMode('login');
      }
    };
    checkUsers();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error: dbError } = await supabase
        .from('admin_users')
        .select('id, username, password_hash, salt, role, is_active')
        .eq('username', username.trim().toLowerCase())
        .eq('is_active', true)
        .maybeSingle();

      if (dbError || !data) {
        setError('Incorrect username or password');
        setLoading(false);
        return;
      }

      const valid = await verifyPassword(password, data.password_hash, data.salt);
      if (!valid) {
        setError('Incorrect username or password');
        setLoading(false);
        return;
      }

      onSuccess(data.username, data.role as 'master' | 'admin');
    } catch {
      setError('Authentication failed. Please try again.');
    }

    setLoading(false);
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (username.trim().length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const { hash, salt } = await hashPassword(password);
      const { error: insertError } = await supabase
        .from('admin_users')
        .insert({
          username: username.trim().toLowerCase(),
          password_hash: hash,
          salt,
          role: 'master',
          is_active: true,
          app_id: 'default_app',
        });

      if (insertError) {
        setError('Failed to create master account. Please try again.');
        setLoading(false);
        return;
      }

      onSuccess(username.trim().toLowerCase(), 'master');
    } catch {
      setError('Setup failed. Please try again.');
    }

    setLoading(false);
  };

  if (mode === 'loading') {
    return (
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-8 border border-slate-700 flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  if (mode === 'setup') {
    return (
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-8 border border-slate-700">
        <div className="flex items-center justify-center mb-6">
          <div className="bg-blue-600/20 p-4 rounded-full">
            <ShieldCheck size={32} className="text-blue-400" />
          </div>
        </div>

        <h2 className="text-3xl font-bold text-white text-center mb-2">First-Time Setup</h2>
        <p className="text-slate-400 text-center mb-8">Create your master admin account to get started</p>

        <form onSubmit={handleSetup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Username</label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose a username"
                className="w-full pl-9 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-slate-500"
                autoFocus
                autoComplete="off"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full pl-9 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-slate-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Confirm Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="w-full pl-9 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-slate-500"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/50 rounded-lg p-3">
              <AlertCircle size={18} className="text-red-400 flex-shrink-0" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !username || !password || !confirmPassword}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold mt-2"
          >
            {loading ? 'Creating Account...' : 'Create Master Account'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-8 border border-slate-700">
      <div className="flex items-center justify-center mb-6">
        <div className="bg-slate-700/50 p-4 rounded-full">
          <Lock size={32} className="text-blue-400" />
        </div>
      </div>

      <h2 className="text-3xl font-bold text-white text-center mb-2">Admin Access</h2>
      <p className="text-slate-400 text-center mb-8">Enter your credentials to continue</p>

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Username</label>
          <div className="relative">
            <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              className="w-full pl-9 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-slate-500"
              autoFocus
              autoComplete="username"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full pl-9 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-slate-500"
              autoComplete="current-password"
            />
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/50 rounded-lg p-3">
            <AlertCircle size={18} className="text-red-400 flex-shrink-0" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-3 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !username || !password}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
          >
            {loading ? 'Verifying...' : 'Access Admin'}
          </button>
        </div>
      </form>
    </div>
  );
}
