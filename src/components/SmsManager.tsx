import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  getNotificationSettings,
  invalidateSettingsCache,
  sendBulkSMS,
  DEFAULT_REGISTRATION_TEMPLATE,
  DEFAULT_CHECKIN_TEMPLATE,
} from '../lib/smsService';
import { Event } from '../lib/database.types';
import { Smartphone, RotateCcw, Send, CheckCircle2, AlertCircle, Link } from 'lucide-react';

const VARIABLES = [
  { key: '{name}',             desc: 'Attendee first name' },
  { key: '{event_name}',       desc: 'Event name' },
  { key: '{date}',             desc: 'Event date (registration SMS)' },
  { key: '{location}',         desc: 'Event location (registration SMS)' },
  { key: '{time}',             desc: 'Check-in timestamp (check-in SMS)' },
  { key: '{programme_link}',   desc: 'Programme / agenda link (auto-removed if not set)' },
];

export function SmsManager() {
  // ── Settings ──────────────────────────────────────────────────────────────
  const [smsEnabled,   setSmsEnabled]   = useState(true);
  const [regTemplate,  setRegTemplate]  = useState(DEFAULT_REGISTRATION_TEMPLATE);
  const [ciTemplate,   setCiTemplate]   = useState(DEFAULT_CHECKIN_TEMPLATE);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsFeedback, setSettingsFeedback] = useState('');
  const [settingsError,    setSettingsError]    = useState('');

  // ── Programme links ───────────────────────────────────────────────────────
  const [events,          setEvents]          = useState<Event[]>([]);
  const [programmeLinks,  setProgrammeLinks]  = useState<Record<string, string>>({});
  const [savingLinks,     setSavingLinks]     = useState(false);
  const [linksFeedback,   setLinksFeedback]   = useState('');

  // ── Blast ─────────────────────────────────────────────────────────────────
  const [blastEventId,  setBlastEventId]  = useState('');
  const [blastFilter,   setBlastFilter]   = useState<'all' | 'checked_in' | 'pending'>('all');
  const [blastPhones,   setBlastPhones]   = useState<string[]>([]);
  const [blastMessage,  setBlastMessage]  = useState('');
  const [blastSending,  setBlastSending]  = useState(false);
  const [blastProgress, setBlastProgress] = useState(0);
  const [blastResult,   setBlastResult]   = useState<{ sent: number; failed: number } | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => { loadAll(); }, []);

  useEffect(() => {
    if (blastEventId) loadBlastPhones();
  }, [blastEventId, blastFilter]);

  const loadAll = async () => {
    setLoading(true);
    const [settings, eventsRes] = await Promise.all([
      getNotificationSettings(),
      supabase.from('events').select('*').order('event_date', { ascending: false }),
    ]);

    setSmsEnabled(settings.sms_enabled);
    setRegTemplate(settings.sms_registration_template);
    setCiTemplate(settings.sms_checkin_template);

    if (!eventsRes.error && eventsRes.data) {
      setEvents(eventsRes.data);
      const links: Record<string, string> = {};
      eventsRes.data.forEach((e: Event) => { links[e.id] = e.programme_link || ''; });
      setProgrammeLinks(links);
      if (eventsRes.data.length > 0) setBlastEventId(eventsRes.data[0].id);
    }
    setLoading(false);
  };

  const loadBlastPhones = async () => {
    if (!blastEventId) return;
    let query = supabase.from('attendees').select('phone').eq('event_id', blastEventId);
    if (blastFilter === 'checked_in') query = query.eq('checked_in', true);
    if (blastFilter === 'pending')    query = query.eq('checked_in', false);
    const { data } = await query;
    setBlastPhones((data ?? []).map((a: { phone: string }) => a.phone).filter(Boolean));
  };

  const saveSettings = async () => {
    setSavingSettings(true);
    setSettingsError('');
    const { error } = await supabase.from('notification_settings').upsert(
      {
        app_id: 'default_app',
        sms_enabled: smsEnabled,
        sms_registration_template: regTemplate.trim() || DEFAULT_REGISTRATION_TEMPLATE,
        sms_checkin_template: ciTemplate.trim() || DEFAULT_CHECKIN_TEMPLATE,
      },
      { onConflict: 'app_id' },
    );
    if (error) {
      setSettingsError('Failed to save. Please try again.');
    } else {
      invalidateSettingsCache();
      setSettingsFeedback('Saved successfully.');
      setTimeout(() => setSettingsFeedback(''), 3000);
    }
    setSavingSettings(false);
  };

  const saveProgrammeLinks = async () => {
    setSavingLinks(true);
    await Promise.all(
      Object.entries(programmeLinks).map(([id, link]) =>
        supabase.from('events').update({ programme_link: link || null }).eq('id', id)
      )
    );
    setLinksFeedback('Programme links saved.');
    setTimeout(() => setLinksFeedback(''), 3000);
    setSavingLinks(false);
  };

  const handleBlastSend = async () => {
    if (!blastMessage.trim() || blastPhones.length === 0) return;
    setBlastSending(true);
    setBlastProgress(0);
    const result = await sendBulkSMS(blastPhones, blastMessage, (done, total) => {
      setBlastProgress(Math.round((done / total) * 100));
    });
    setBlastResult(result);
    setBlastSending(false);
  };

  const charClass = (len: number) =>
    len > 160 ? 'text-red-500 font-semibold' : len > 140 ? 'text-amber-500' : 'text-slate-400';

  if (loading) {
    return <div className="text-center py-12 text-slate-500 text-sm">Loading SMS Manager...</div>;
  }

  return (
    <div className="space-y-10 max-w-3xl">

      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900">SMS Manager</h3>
        <p className="text-sm text-slate-500 mt-0.5">
          Manage SMS notifications, update message templates, set programme links per event, and send blasts.
        </p>
      </div>

      {/* ── SMS Toggle ──────────────────────────────────────────────────────── */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
        <label className="flex items-center justify-between cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-2 rounded-lg">
              <Smartphone size={18} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">SMS Notifications</p>
              <p className="text-xs text-slate-500">Via Arkesel — sent only when a phone number is on file</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSmsEnabled(v => !v)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${smsEnabled ? 'bg-green-600' : 'bg-slate-300'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${smsEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </label>
      </div>

      {/* ── Templates ───────────────────────────────────────────────────────── */}
      <div className="space-y-5">
        <div>
          <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">SMS Templates</h4>
          <p className="text-xs text-slate-500 mt-0.5">Keep under 160 characters to avoid multi-part SMS charges.</p>
        </div>

        {/* Variable chips */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-xs font-semibold text-amber-800 mb-2">Available variables</p>
          <div className="flex flex-wrap gap-2">
            {VARIABLES.map(v => (
              <span
                key={v.key}
                title={v.desc}
                className="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs rounded font-mono cursor-help border border-amber-300"
              >
                {v.key}
              </span>
            ))}
          </div>
          <p className="text-xs text-amber-700 mt-2">
            Hover a variable to see what it inserts. If <code className="font-mono bg-amber-100 px-1 rounded">{'{programme_link}'}</code> is empty for an event it is removed automatically — no broken text.
          </p>
        </div>

        {/* Registration template */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-medium text-slate-700">Registration SMS</label>
            <button
              type="button"
              onClick={() => setRegTemplate(DEFAULT_REGISTRATION_TEMPLATE)}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              <RotateCcw size={11} /> Reset
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
            <span className={`text-xs ${charClass(regTemplate.length)}`}>{regTemplate.length} / 160</span>
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
            >
              <RotateCcw size={11} /> Reset
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
            <span className={`text-xs ${charClass(ciTemplate.length)}`}>{ciTemplate.length} / 160</span>
          </div>
        </div>

        {settingsError && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
            <AlertCircle size={15} className="text-red-500 flex-shrink-0" />
            <p className="text-red-700 text-sm">{settingsError}</p>
          </div>
        )}
        {settingsFeedback && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg p-3">
            <CheckCircle2 size={15} className="text-green-500 flex-shrink-0" />
            <p className="text-green-700 text-sm">{settingsFeedback}</p>
          </div>
        )}
        <button
          onClick={saveSettings}
          disabled={savingSettings}
          className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {savingSettings ? 'Saving...' : 'Save Templates'}
        </button>
      </div>

      {/* ── Programme Links ──────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Programme Links</h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Set a programme or agenda URL per event. Use <code className="font-mono bg-slate-100 px-1 rounded text-slate-600">{'{programme_link}'}</code> in your template above to include it.
          </p>
        </div>

        {events.length === 0 ? (
          <p className="text-sm text-slate-400 py-4 text-center">No events found.</p>
        ) : (
          <div className="space-y-2">
            {events.map(event => (
              <div key={event.id} className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-lg p-3">
                <div className="flex-shrink-0">
                  <div className={`w-2.5 h-2.5 rounded-full ${event.is_active ? 'bg-green-500' : 'bg-slate-300'}`} />
                </div>
                <div className="w-44 flex-shrink-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{event.name}</p>
                  <p className="text-xs text-slate-400">{new Date(event.event_date).toLocaleDateString()}</p>
                </div>
                <div className="relative flex-1">
                  <Link size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="url"
                    value={programmeLinks[event.id] || ''}
                    onChange={e => setProgrammeLinks({ ...programmeLinks, [event.id]: e.target.value })}
                    placeholder="https://..."
                    className="w-full pl-8 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {linksFeedback && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg p-3">
            <CheckCircle2 size={15} className="text-green-500 flex-shrink-0" />
            <p className="text-green-700 text-sm">{linksFeedback}</p>
          </div>
        )}
        <button
          onClick={saveProgrammeLinks}
          disabled={savingLinks || events.length === 0}
          className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {savingLinks ? 'Saving...' : 'Save Programme Links'}
        </button>
      </div>

      {/* ── SMS Blast ───────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">SMS Blast</h4>
          <p className="text-xs text-slate-500 mt-0.5">Send a custom message to attendees of a specific event.</p>
        </div>

        {blastResult ? (
          <div className="text-center py-10 bg-slate-50 border border-slate-200 rounded-xl">
            <CheckCircle2 size={44} className="text-green-500 mx-auto mb-3" />
            <p className="text-lg font-bold text-slate-900 mb-1">Blast Sent!</p>
            <p className="text-slate-600 text-sm">
              {blastResult.sent} sent successfully
              {blastResult.failed > 0 && `, ${blastResult.failed} failed`}
            </p>
            <button
              onClick={() => { setBlastResult(null); setBlastMessage(''); setBlastProgress(0); }}
              className="mt-5 px-5 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium"
            >
              Send Another
            </button>
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Event</label>
                <select
                  value={blastEventId}
                  onChange={e => setBlastEventId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {events.map(e => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Recipients</label>
                <div className="flex gap-1">
                  {(['all', 'checked_in', 'pending'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setBlastFilter(f)}
                      className={`flex-1 px-2 py-2 text-xs font-medium rounded-lg transition-colors ${
                        blastFilter === f
                          ? 'bg-blue-600 text-white'
                          : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {f === 'all' ? 'All' : f === 'checked_in' ? 'Checked In' : 'Pending'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-4 py-3">
              <Smartphone size={15} className="text-green-600 flex-shrink-0" />
              <span className="text-sm text-slate-700">
                <strong>{blastPhones.length}</strong> recipient{blastPhones.length !== 1 ? 's' : ''} will receive this message
              </span>
            </div>

            {blastPhones.length === 0 && blastEventId && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-700 text-sm">
                No attendees with phone numbers match this filter.
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Message</label>
              <textarea
                value={blastMessage}
                onChange={e => setBlastMessage(e.target.value)}
                rows={4}
                placeholder="Type your message here..."
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
              <div className="flex justify-end mt-1">
                <span className={`text-xs ${charClass(blastMessage.length)}`}>{blastMessage.length} / 160</span>
              </div>
            </div>

            {blastSending && (
              <div>
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>Sending…</span><span>{blastProgress}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full transition-all duration-300" style={{ width: `${blastProgress}%` }} />
                </div>
              </div>
            )}

            <button
              onClick={handleBlastSend}
              disabled={blastSending || !blastMessage.trim() || blastPhones.length === 0}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold disabled:opacity-50"
            >
              <Send size={15} />
              {blastSending ? 'Sending…' : `Send to ${blastPhones.length} recipient${blastPhones.length !== 1 ? 's' : ''}`}
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
