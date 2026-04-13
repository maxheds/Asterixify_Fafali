import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  getNotificationSettings,
  invalidateSettingsCache,
  DEFAULT_REGISTRATION_TEMPLATE,
  DEFAULT_CHECKIN_TEMPLATE,
} from '../lib/smsService';
import { Mail, Smartphone, CheckCircle2, AlertCircle, RotateCcw } from 'lucide-react';

const PLACEHOLDERS = [
  { key: '{name}',       desc: 'Attendee first name' },
  { key: '{event_name}', desc: 'Event name' },
  { key: '{date}',       desc: 'Event date (registration SMS)' },
  { key: '{location}',   desc: 'Event location (registration SMS)' },
  { key: '{time}',       desc: 'Check-in timestamp (check-in SMS)' },
];

export function NotificationSettings() {
  const [smsEnabled, setSmsEnabled]   = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [regTemplate, setRegTemplate]   = useState(DEFAULT_REGISTRATION_TEMPLATE);
  const [ciTemplate,  setCiTemplate]    = useState(DEFAULT_CHECKIN_TEMPLATE);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [success,   setSuccess]   = useState('');
  const [error,     setError]     = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    const s = await getNotificationSettings();
    setSmsEnabled(s.sms_enabled);
    setEmailEnabled(s.email_enabled);
    setRegTemplate(s.sms_registration_template);
    setCiTemplate(s.sms_checkin_template);
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    const { error: dbErr } = await supabase
      .from('notification_settings')
      .upsert(
        {
          app_id: 'default_app',
          sms_enabled: smsEnabled,
          email_enabled: emailEnabled,
          sms_registration_template: regTemplate.trim() || DEFAULT_REGISTRATION_TEMPLATE,
          sms_checkin_template: ciTemplate.trim() || DEFAULT_CHECKIN_TEMPLATE,
        },
        { onConflict: 'app_id' },
      );

    if (dbErr) {
      setError('Failed to save settings. Please try again.');
    } else {
      invalidateSettingsCache();
      setSuccess('Settings saved successfully.');
      setTimeout(() => setSuccess(''), 3000);
    }
    setSaving(false);
  };

  const charClass = (len: number) =>
    len > 160
      ? 'text-red-500 font-semibold'
      : len > 140
      ? 'text-amber-500'
      : 'text-slate-400';

  if (loading) {
    return <div className="text-center py-12 text-slate-500 text-sm">Loading settings...</div>;
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">Notification Settings</h3>
        <p className="text-sm text-slate-500 mt-0.5">
          Control how attendees are notified and customise SMS message content.
        </p>
      </div>

      {/* ── Channel toggles ─────────────────────────────────────────────── */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
        <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Channels</h4>

        <label className="flex items-center justify-between cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Mail size={18} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">Email Notifications</p>
              <p className="text-xs text-slate-500">Registration confirmation & check-in emails</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setEmailEnabled(v => !v)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              emailEnabled ? 'bg-blue-600' : 'bg-slate-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                emailEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </label>

        <div className="border-t border-slate-200" />

        <label className="flex items-center justify-between cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-2 rounded-lg">
              <Smartphone size={18} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">SMS Notifications</p>
              <p className="text-xs text-slate-500">Via Arkesel — only sent when phone number is provided</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSmsEnabled(v => !v)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              smsEnabled ? 'bg-green-600' : 'bg-slate-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                smsEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </label>
      </div>

      {/* ── SMS templates ───────────────────────────────────────────────── */}
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">SMS Templates</h4>
            <p className="text-xs text-slate-500 mt-0.5">Keep under 160 characters to avoid multi-part SMS charges.</p>
          </div>
        </div>

        {/* Placeholder reference */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-xs font-semibold text-amber-800 mb-2">Available placeholders</p>
          <div className="flex flex-wrap gap-2">
            {PLACEHOLDERS.map(p => (
              <span
                key={p.key}
                title={p.desc}
                className="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs rounded font-mono cursor-help border border-amber-300"
              >
                {p.key}
              </span>
            ))}
          </div>
          <p className="text-xs text-amber-700 mt-2">Hover a placeholder to see what it inserts.</p>
        </div>

        {/* Registration template */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-medium text-slate-700">Registration SMS</label>
            <button
              type="button"
              onClick={() => setRegTemplate(DEFAULT_REGISTRATION_TEMPLATE)}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors"
              title="Reset to default"
            >
              <RotateCcw size={11} />
              Reset
            </button>
          </div>
          <textarea
            value={regTemplate}
            onChange={e => setRegTemplate(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono"
          />
          <div className="flex justify-between mt-1">
            <p className="text-xs text-slate-400">Sent when an attendee completes registration</p>
            <span className={`text-xs ${charClass(regTemplate.length)}`}>
              {regTemplate.length} / 160
            </span>
          </div>
        </div>

        {/* Check-in template */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-medium text-slate-700">Check-in SMS</label>
            <button
              type="button"
              onClick={() => setCiTemplate(DEFAULT_CHECKIN_TEMPLATE)}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors"
              title="Reset to default"
            >
              <RotateCcw size={11} />
              Reset
            </button>
          </div>
          <textarea
            value={ciTemplate}
            onChange={e => setCiTemplate(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono"
          />
          <div className="flex justify-between mt-1">
            <p className="text-xs text-slate-400">Sent when an attendee checks in to the event</p>
            <span className={`text-xs ${charClass(ciTemplate.length)}`}>
              {ciTemplate.length} / 160
            </span>
          </div>
        </div>
      </div>

      {/* ── Feedback & save ─────────────────────────────────────────────── */}
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
