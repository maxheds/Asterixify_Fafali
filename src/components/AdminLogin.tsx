import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Lock, AlertCircle } from 'lucide-react';

interface AdminLoginProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function AdminLogin({ onSuccess, onCancel }: AdminLoginProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error: dbError } = await supabase
        .from('admin_settings')
        .select('admin_password')
        .maybeSingle();

      if (dbError) {
        setError('Failed to verify credentials');
      } else if (data && data.admin_password === password) {
        sessionStorage.setItem('admin_authenticated', 'true');
        onSuccess();
      } else {
        setError('Incorrect password');
      }
    } catch {
      setError('Authentication failed');
    }

    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-8 border border-slate-700">
        <div className="flex items-center justify-center mb-6">
          <div className="bg-slate-700/50 p-4 rounded-full">
            <Lock size={32} className="text-blue-400" />
          </div>
        </div>

        <h2 className="text-3xl font-bold text-white text-center mb-2">Admin Access</h2>
        <p className="text-slate-400 text-center mb-8">Enter password to continue</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-slate-500"
              autoFocus
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/50 rounded-lg p-3">
              <AlertCircle size={18} className="text-red-400" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-3 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !password}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'Access Admin'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
