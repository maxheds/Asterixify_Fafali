import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getNotificationSettings, invalidateSettingsCache } from '../lib/smsService';
import { Mail, CheckCircle2, AlertCircle } from 'lucide-react';

export function NotificationSettings() {
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [success, setSuccess]   = useState('');
  const [error, setError]       = useState('');

  useEffect(() => {
    getNotificationSettings().then(s => {
      setEmailEnabled(s.email_enabled);
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    const { error: dbErr } = await supabase
      .from('notification_settings')
      .upsert({ app_id: 'default_app', email_enabled: emailEnabled }, { onConflict: 'app_id' });
    if (dbErr) {
      setError('Failed to save. Please try again.');
    } else {
      invalidateSettingsCache();
      setSuccess('Saved successfully.');
      setTimeout(() => setSuccess(''), 3000);
    }
    setSaving(false);
  };

  if (loading) return <div className="text-center py-12 text-slate-500 text-sm">Loading...</div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">Notification Settings</h3>
        <p className="text-sm text-slate-500 mt-0.5">Control email notification delivery. Manage SMS in the SMS Manager tab.</p>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
        <label className="flex items-center justify-between cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Mail size={18} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">Email Notifications</p>
              <p className="text-xs text-slate-500">Registration confirmation &amp; check-in emails via EmailJS</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setEmailEnabled(v => !v)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${emailEnabled ? 'bg-blue-600' : 'bg-slate-300'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${emailEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </label>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
          <AlertCircle size={15} className="text-red-500 flex-shrink-0" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg p-3">
          <CheckCircle2 size={15} className="text-green-500 flex-shrink-0" />
          <p className="text-green-700 text-sm">{success}</p>
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save Settings'}
      </button>
    </div>
  );
}
