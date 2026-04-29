import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { hashPassword, verifyPassword } from '../lib/auth';
import { Event, Attendee } from '../lib/database.types';
import {
  Plus, Calendar, Download, Upload, Settings, Edit2, BarChart3,
  Filter, Trash2, Users, KeyRound, Eye, EyeOff, AlertCircle,
  CheckCircle2, Smartphone, ChevronLeft, ChevronRight, FileText, Maximize2,
  LayoutDashboard, Copy, MessageCircle, Clock,
} from 'lucide-react';
import { EventForm } from './EventForm';
import { AttendeesList } from './AttendeesList';
import { ImportAttendees } from './ImportAttendees';
import { FormFieldEditor } from './FormFieldEditor';
import { ReportingDashboard } from './ReportingDashboard';
import { UserManagement } from './UserManagement';
import { NotificationSettings } from './NotificationSettings';
import { SmsManager } from './SmsManager';
import { LiveDashboard } from './LiveDashboard';
import { FeedbackManager } from './FeedbackManager';
import { WaitlistManager } from './WaitlistManager';

interface AdminPortalProps {
  onNavigateToCheckIn: (eventId: string) => void;
  onLogout?: () => void;
  adminUsername: string;
  adminRole: 'master' | 'admin';
}

type ActiveTab = 'events' | 'settings' | 'sms' | 'users' | 'feedback';
type EventView = 'attendees' | 'dashboard' | 'waitlist';

interface ChangePasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export function AdminPortal({ onNavigateToCheckIn, onLogout, adminUsername, adminRole }: AdminPortalProps) {
  const [activeTab, setActiveTab]           = useState<ActiveTab>('events');
  const [events, setEvents]                 = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent]   = useState<Event | null>(null);
  const [showEventForm, setShowEventForm]   = useState(false);
  const [eventToEdit, setEventToEdit]       = useState<Event | undefined>(undefined);
  const [showImport, setShowImport]         = useState(false);
  const [showFormEditor, setShowFormEditor] = useState(false);
  const [showReports, setShowReports]       = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [eventToDelete, setEventToDelete]   = useState<Event | null>(null);
  const [stats, setStats]                   = useState<{ total: number; checkedIn: number }>({ total: 0, checkedIn: 0 });
  const [loading, setLoading]               = useState(true);
  const [showAllEvents, setShowAllEvents]   = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [eventCounts, setEventCounts] = useState<Record<string, number>>({});
  const [exportFilter, setExportFilter] = useState<'all' | 'checked_in' | 'pending'>('all');
  const [eventView, setEventView] = useState<EventView>('attendees');
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Change-password state
  const [cpForm, setCpForm]           = useState<ChangePasswordForm>({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [cpError, setCpError]         = useState('');
  const [cpSuccess, setCpSuccess]     = useState('');
  const [cpLoading, setCpLoading]     = useState(false);
  const [showCpPasswords, setShowCpPasswords] = useState(false);

  useEffect(() => { loadEvents(); }, []);

  useEffect(() => {
    if (selectedEvent) {
      loadStats();
      const sub = supabase
        .channel('attendees-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'attendees', filter: `event_id=eq.${selectedEvent.id}` }, loadStats)
        .subscribe();
      return () => { sub.unsubscribe(); };
    }
  }, [selectedEvent]);

  const loadEvents = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('events').select('*').order('event_date', { ascending: false });
    if (!error && data) {
      setEvents(data);
      const active = data.filter(e => e.is_active);
      if (!selectedEvent) setSelectedEvent(active[0] ?? data[0] ?? null);
      loadEventCounts(data);
    }
    setLoading(false);
  };

  const loadEventCounts = async (eventList: Event[]) => {
    if (eventList.length === 0) return;
    const { data } = await supabase
      .from('attendees')
      .select('event_id')
      .in('event_id', eventList.map(e => e.id));
    if (data) {
      const counts: Record<string, number> = {};
      data.forEach((a: { event_id: string }) => {
        counts[a.event_id] = (counts[a.event_id] || 0) + 1;
      });
      setEventCounts(counts);
    }
  };

  const toggleEventActive = async (event: Event, e: React.MouseEvent) => {
    e.stopPropagation();
    await supabase.from('events').update({ is_active: !event.is_active }).eq('id', event.id);
    loadEvents();
  };

  const exportPDF = async () => {
    if (!selectedEvent) return;
    const { data, error } = await supabase.from('attendees').select('*').eq('event_id', selectedEvent.id);
    if (!error && data) {
      const filtered = exportFilter === 'all' ? data : data.filter((a: Attendee) => exportFilter === 'checked_in' ? a.checked_in : !a.checked_in);
      const customFields = (selectedEvent.custom_fields || []).filter((f: any) =>
        f.active !== false && !['first_name','last_name','email','phone','gender','organization'].includes(f.id)
      );
      const headers = ['Name','Gender','Email','Phone','Organization','Age Group','Ticket','Status',...customFields.map((f: any) => f.label)];
      const filterLabel = exportFilter === 'all' ? 'All Attendees' : exportFilter === 'checked_in' ? 'Checked In' : 'Pending';
      const rows = filtered.map((a: Attendee) => ({
        name: `${a.salutation || ''} ${a.first_name} ${a.last_name}`.trim(),
        gender: a.gender || '-',
        email: a.email, phone: a.phone || '-', org: a.organization || '-',
        age_group: a.age_group || '-',
        ticket: a.ticket_type || '-',
        status: a.checked_in ? 'Checked In' : 'Pending',
        custom: customFields.map((f: any) => (a as any).form_data?.[f.id] || '-'),
      }));
      const printWindow = window.open('', '_blank');
      if (!printWindow) return;
      printWindow.document.write(`<!DOCTYPE html><html><head><title>${selectedEvent.name} — Attendees</title><style>
        body{font-family:sans-serif;padding:24px;color:#1e293b}
        h1{font-size:18px;font-weight:700;margin:0 0 4px}
        .meta{color:#64748b;font-size:12px;margin-bottom:20px}
        table{width:100%;border-collapse:collapse;font-size:11px}
        th{background:#f1f5f9;padding:8px;border:1px solid #e2e8f0;font-weight:600;text-align:left}
        td{padding:6px 8px;border:1px solid #e2e8f0}
        tr:nth-child(even) td{background:#f8fafc}
        .green{color:#16a34a;font-weight:600}.grey{color:#94a3b8}
        @page{margin:1cm}
      </style></head><body>
      <h1>${selectedEvent.name}</h1>
      <p class="meta">${filtered.length} attendees (${filterLabel}) &middot; Exported ${new Date().toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</p>
      <table><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>
      ${rows.map(r=>`<tr>
        <td>${r.name}</td><td>${r.gender}</td><td>${r.email}</td><td>${r.phone}</td><td>${r.org}</td><td>${r.age_group}</td><td>${r.ticket}</td>
        <td class="${r.status==='Checked In'?'green':'grey'}">${r.status}</td>
        ${r.custom.map((c: string)=>`<td>${c}</td>`).join('')}
      </tr>`).join('')}
      </tbody></table></body></html>`);
      printWindow.document.close();
      printWindow.onload = () => { printWindow.print(); };
    }
  };

  const loadStats = async () => {
    if (!selectedEvent) return;
    const { data, error } = await supabase.from('attendees').select('checked_in').eq('event_id', selectedEvent.id);
    if (!error && data) {
      setStats({ total: data.length, checkedIn: data.filter(a => a.checked_in).length });
    }
  };

  const displayedEvents = showAllEvents ? events : events.filter(e => e.is_active);

  const handleDeleteEvent = async (event: Event) => {
    const { error } = await supabase.from('events').delete().eq('id', event.id);
    if (!error) {
      if (selectedEvent?.id === event.id) setSelectedEvent(null);
      setEventToDelete(null);
      loadEvents();
    }
  };

  const exportAttendees = async () => {
    if (!selectedEvent) return;
    const { data, error } = await supabase.from('attendees').select('*').eq('event_id', selectedEvent.id);
    if (!error && data) {
      const filtered = exportFilter === 'all' ? data : data.filter((a: Attendee) => exportFilter === 'checked_in' ? a.checked_in : !a.checked_in);
      const customFieldDefs = (selectedEvent.custom_fields || []).filter((f: any) =>
        f.active !== false && !['first_name','last_name','email','phone','gender','organization','age_group'].includes(f.id)
      );
      const quote = (val: any) => `"${String(val ?? '').replace(/"/g, '""')}"`;
      const csv = [
        ['Salutation','First Name','Last Name','Email','Phone','Gender','Organization','Age Group','Ticket Type','Special Requirements','Checked In','Checked In At','Checked In By','Registration Source',...customFieldDefs.map((f: any) => f.label)],
        ...filtered.map((a: Attendee) => [
          a.salutation || '', a.first_name, a.last_name, a.email, a.phone || '',
          a.gender || '', a.organization || '', a.age_group || '', a.ticket_type || '',
          a.special_requirements || '',
          a.checked_in ? 'Yes' : 'No',
          a.checked_in_at || '', a.checked_in_by || '', a.registration_source || '',
          ...customFieldDefs.map((f: any) => (a as any).form_data?.[f.id] || ''),
        ]),
      ].map(row => row.map(quote).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url  = window.URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = `${selectedEvent.name}-attendees.csv`; a.click();
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setCpError(''); setCpSuccess('');
    if (cpForm.newPassword.length < 8) { setCpError('New password must be at least 8 characters'); return; }
    if (cpForm.newPassword !== cpForm.confirmPassword) { setCpError('Passwords do not match'); return; }
    setCpLoading(true);
    try {
      const { data, error } = await supabase.from('admin_users').select('password_hash, salt').eq('username', adminUsername).maybeSingle();
      if (error || !data) { setCpError('Failed to verify current password'); setCpLoading(false); return; }
      const valid = await verifyPassword(cpForm.currentPassword, data.password_hash, data.salt);
      if (!valid) { setCpError('Current password is incorrect'); setCpLoading(false); return; }
      const { hash, salt } = await hashPassword(cpForm.newPassword);
      const { error: upErr } = await supabase.from('admin_users').update({ password_hash: hash, salt }).eq('username', adminUsername);
      if (upErr) { setCpError('Failed to update password. Please try again.'); }
      else {
        setCpSuccess('Password updated successfully!');
        setCpForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setTimeout(() => { setShowChangePassword(false); setCpSuccess(''); }, 2000);
      }
    } catch { setCpError('Failed to update password. Please try again.'); }
    setCpLoading(false);
  };

  const handleLaunchKiosk = async () => {
    try {
      await document.documentElement.requestFullscreen();
    } catch {
      // Fullscreen not supported or denied — continue anyway
    }
    onLogout?.();
  };

  const cloneEvent = async (event: Event, e: React.MouseEvent) => {
    e.stopPropagation();
    const { id: _id, created_at: _ca, updated_at: _ua, ...rest } = event;
    await supabase.from('events').insert([{ ...rest, name: `${event.name} (Copy)`, is_active: false, app_id: 'default_app' }]);
    loadEvents();
  };

  const checkInRate = stats.total > 0 ? Math.round((stats.checkedIn / stats.total) * 100) : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200 shadow-sm flex-shrink-0 print:hidden">
        <div className="px-4 sm:px-6 lg:px-8 flex items-center gap-4 h-16">

          {/* Title */}
          <div className="flex-shrink-0">
            <h1 className="text-sm font-bold text-slate-900 tracking-tight">Asterixify</h1>
            <p className="text-xs text-slate-400">Event Management</p>
          </div>

          <div className="w-px h-8 bg-slate-200 flex-shrink-0" />

          {/* Navigation */}
          <div className="flex-1 flex items-center gap-1">
            {/* Primary: Events */}
            <button
              onClick={() => setActiveTab('events')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                activeTab === 'events'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Calendar size={15} /> Events
            </button>

            <div className="w-px h-5 bg-slate-200 mx-2 flex-shrink-0" />

            {/* Secondary tabs — master only */}
            {adminRole === 'master' && ([
              { key: 'settings', icon: <Settings size={13} />,      label: 'Settings'  },
              { key: 'sms',      icon: <Smartphone size={13} />,    label: 'Communications' },
              { key: 'feedback', icon: <MessageCircle size={13} />, label: 'Feedback'  },
              { key: 'users',    icon: <Users size={13} />,         label: 'Users'     },
            ] as { key: ActiveTab; icon: React.ReactNode; label: string }[]).map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  activeTab === tab.key
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}

            {activeTab === 'events' && (
              <>
                <div className="flex-1" />
                <button
                  onClick={() => setShowEventForm(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs font-semibold"
                >
                  <Plus size={14} /> New Event
                </button>
              </>
            )}
          </div>

          {/* Profile + Logout */}
          <div className="flex-shrink-0 flex items-center gap-2">
            <div className="relative">
              {showProfileMenu && (
                <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
              )}
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors relative z-50"
              >
                <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {adminUsername.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-semibold text-slate-900 leading-none">{adminUsername}</p>
                  <p className={`text-xs leading-none mt-0.5 font-medium ${adminRole === 'master' ? 'text-purple-600' : 'text-slate-400'}`}>
                    {adminRole}
                  </p>
                </div>
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
                  <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
                    <p className="text-sm font-semibold text-slate-900">{adminUsername}</p>
                    <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium mt-1 ${adminRole === 'master' ? 'bg-purple-100 text-purple-700' : 'bg-slate-200 text-slate-600'}`}>
                      {adminRole}
                    </span>
                  </div>
                  <button
                    onClick={() => { setShowChangePassword(true); setCpError(''); setCpSuccess(''); setShowProfileMenu(false); }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <KeyRound size={14} className="text-slate-400" /> Change Password
                  </button>
                </div>
              )}
            </div>

            {onLogout && (
              <button
                onClick={onLogout}
                className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xs font-semibold"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className="px-4 sm:px-6 lg:px-8 pb-6 pt-4 flex-1 min-h-0 w-full print:hidden">

        {activeTab === 'settings' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-full overflow-y-auto">
            <NotificationSettings />
          </div>
        )}

        {activeTab === 'sms' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-full overflow-y-auto">
            <SmsManager />
          </div>
        )}

        {activeTab === 'feedback' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-full overflow-y-auto">
            <FeedbackManager />
          </div>
        )}

        {activeTab === 'users' && adminRole === 'master' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-full overflow-y-auto">
            <UserManagement currentUsername={adminUsername} />
          </div>
        )}

        {activeTab === 'events' && (
          <div className="flex gap-5 h-full">

            {/* ── Events sidebar ── */}
            <div className={`transition-all duration-300 flex-shrink-0 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden ${sidebarCollapsed ? 'w-12' : 'w-64'}`}>
              {sidebarCollapsed ? (
                <div className="flex flex-col items-center gap-2 py-3">
                  <button
                    onClick={() => setSidebarCollapsed(false)}
                    className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
                    title="Expand sidebar"
                  >
                    <ChevronRight size={18} />
                  </button>
                  {displayedEvents.map(event => (
                    <button
                      key={event.id}
                      onClick={() => setSelectedEvent(event)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white transition-all flex-shrink-0 ${selectedEvent?.id === event.id ? 'ring-2 ring-blue-600 ring-offset-1' : ''} ${event.is_active ? 'bg-blue-500' : 'bg-slate-400'}`}
                      title={event.name}
                    >
                      {event.name.charAt(0).toUpperCase()}
                    </button>
                  ))}
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between px-4 pt-4 pb-3 flex-shrink-0 border-b border-slate-100">
                    <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Calendar size={15} className="text-blue-600" /> Events
                    </h2>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setShowAllEvents(!showAllEvents)}
                        className={`p-1.5 rounded-lg transition-colors ${showAllEvents ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                        title={showAllEvents ? 'Show active only' : 'Show all events'}
                      >
                        <Filter size={13} />
                      </button>
                      <button
                        onClick={() => setSidebarCollapsed(true)}
                        className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"
                        title="Collapse sidebar"
                      >
                        <ChevronLeft size={13} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5 overflow-y-auto flex-1 p-3">
                    {displayedEvents.map((event) => {
                      const count = eventCounts[event.id] || 0;
                      const isSelected = selectedEvent?.id === event.id;
                      return (
                        <div
                          key={event.id}
                          className={`rounded-xl border-2 transition-all ${isSelected ? 'bg-blue-50 border-blue-500' : 'bg-slate-50 border-transparent hover:border-slate-200 hover:bg-white'}`}
                        >
                          <div className="p-3">
                            <div className="flex items-start justify-between gap-1 mb-2">
                              <button onClick={() => setSelectedEvent(event)} className="flex-1 text-left min-w-0">
                                <p className={`font-semibold text-sm truncate leading-tight ${isSelected ? 'text-blue-900' : 'text-slate-900'}`}>
                                  {event.name}
                                </p>
                                <p className="text-xs text-slate-400 mt-0.5">
                                  {new Date(event.event_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </p>
                              </button>
                              <div className="flex gap-0.5 flex-shrink-0">
                                <button
                                  onClick={(e) => { e.stopPropagation(); setEventToEdit(event); setShowEventForm(true); }}
                                  className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Edit"
                                >
                                  <Edit2 size={11} />
                                </button>
                                <button
                                  onClick={(e) => cloneEvent(event, e)}
                                  className="p-1 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                  title="Duplicate"
                                >
                                  <Copy size={11} />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setEventToDelete(event); }}
                                  className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 size={11} />
                                </button>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <button
                                onClick={(e) => toggleEventActive(event, e)}
                                className={`px-2 py-0.5 text-xs font-semibold rounded-full transition-colors ${event.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-500'}`}
                              >
                                {event.is_active ? 'Active' : 'Inactive'}
                              </button>
                              <span className={`text-xs font-semibold ${isSelected ? 'text-blue-700' : 'text-slate-400'}`}>
                                {count} {count === 1 ? 'attendee' : 'attendees'}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {displayedEvents.length === 0 && (
                      <div className="text-center text-slate-400 text-sm py-10">
                        {showAllEvents ? 'No events yet.' : 'No active events.'}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* ── Main panel ── */}
            <div className="flex-1 flex flex-col min-h-0 min-w-0">
              {selectedEvent ? (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col flex-1 min-h-0">

                  {/* Panel header */}
                  <div className="px-5 pt-4 pb-3 border-b border-slate-100 flex-shrink-0 space-y-3">

                    {/* Row 1: event name + view toggle + primary actions */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="min-w-0">
                          <h2 className="text-base font-bold text-slate-900 truncate">{selectedEvent.name}</h2>
                          <p className="text-xs text-slate-400 mt-0.5 truncate">
                            {new Date(selectedEvent.event_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            {selectedEvent.location && ` · ${selectedEvent.location}`}
                          </p>
                        </div>
                        <div className="flex bg-slate-100 border border-slate-200 rounded-lg overflow-hidden flex-shrink-0">
                          <button
                            onClick={() => setEventView('attendees')}
                            className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium transition-colors ${eventView === 'attendees' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-200'}`}
                          >
                            <Users size={12} /> Attendees
                          </button>
                          <button
                            onClick={() => setEventView('waitlist')}
                            className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium transition-colors ${eventView === 'waitlist' ? 'bg-amber-500 text-white' : 'text-slate-600 hover:bg-slate-200'}`}
                          >
                            <Clock size={12} /> Waitlist
                          </button>
                          <button
                            onClick={() => setEventView('dashboard')}
                            className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium transition-colors ${eventView === 'dashboard' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-200'}`}
                          >
                            <LayoutDashboard size={12} /> Dashboard
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => onNavigateToCheckIn(selectedEvent.id)}
                          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs font-semibold shadow-sm"
                        >
                          Check-In Mode
                        </button>
                        <button
                          onClick={handleLaunchKiosk}
                          className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors text-xs font-semibold"
                          title="Launch fullscreen kiosk mode"
                        >
                          <Maximize2 size={12} /> Kiosk
                        </button>
                      </div>
                    </div>

                    {/* Row 2: stat cards */}
                    <div className="flex items-center gap-2">
                      {[
                        { label: 'Total',      value: stats.total,                      color: 'text-slate-800', bg: 'bg-slate-50 border-slate-200'   },
                        { label: 'Checked In', value: stats.checkedIn,                  color: 'text-green-700', bg: 'bg-green-50 border-green-200'   },
                        { label: 'Pending',    value: stats.total - stats.checkedIn,    color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200'   },
                        { label: 'Rate',       value: `${checkInRate}%`,                color: 'text-blue-700',  bg: 'bg-blue-50 border-blue-200'     },
                      ].map(stat => (
                        <div key={stat.label} className={`border rounded-lg px-3 py-1.5 text-center min-w-[58px] ${stat.bg}`}>
                          <p className={`text-lg font-bold leading-none ${stat.color}`}>{stat.value}</p>
                          <p className="text-xs text-slate-500 mt-0.5 whitespace-nowrap">{stat.label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Row 3: secondary actions */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => setShowFormEditor(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors text-xs font-medium"
                      >
                        <Settings size={12} /> Form Fields
                        {selectedEvent.custom_fields?.length > 0 && (
                          <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">{selectedEvent.custom_fields.length}</span>
                        )}
                      </button>
                      <button
                        onClick={() => setShowReports(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 text-violet-700 border border-violet-200 rounded-lg hover:bg-violet-100 transition-colors text-xs font-medium"
                      >
                        <BarChart3 size={12} /> Reports
                      </button>

                      <div className="flex-1" />

                      <button
                        onClick={() => setShowImport(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors text-xs font-medium"
                      >
                        <Upload size={12} /> Import
                      </button>

                      <div className="flex items-center bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                        {(['all', 'checked_in', 'pending'] as const).map((f) => (
                          <button
                            key={f}
                            onClick={() => setExportFilter(f)}
                            className={`px-2.5 py-1.5 text-xs font-medium transition-colors ${exportFilter === f ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-200'}`}
                          >
                            {f === 'all' ? 'All' : f === 'checked_in' ? 'Checked In' : 'Pending'}
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={exportAttendees}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors text-xs font-medium"
                      >
                        <Download size={12} /> CSV
                      </button>
                      <button
                        onClick={exportPDF}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors text-xs font-medium"
                      >
                        <FileText size={12} /> PDF
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 p-5 min-h-0 overflow-y-auto">
                    {eventView === 'dashboard'
                      ? <LiveDashboard eventId={selectedEvent.id} eventName={selectedEvent.name} />
                      : eventView === 'waitlist'
                      ? <WaitlistManager eventId={selectedEvent.id} />
                      : <AttendeesList eventId={selectedEvent.id} />
                    }
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col items-center justify-center flex-1 text-center p-12">
                  <div className="bg-blue-50 p-5 rounded-2xl mb-4">
                    <Calendar size={40} className="text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-700 mb-1">No event selected</h3>
                  <p className="text-slate-400 text-sm mb-4">Choose an event from the sidebar or create a new one</p>
                  <button
                    onClick={() => setShowEventForm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold"
                  >
                    <Plus size={16} /> Create Event
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Overlays ─────────────────────────────────────────────────────── */}
      <div className="print:hidden">

        {showEventForm && (
          <EventForm
            event={eventToEdit}
            onClose={() => { setShowEventForm(false); setEventToEdit(undefined); }}
            onSuccess={() => { setShowEventForm(false); setEventToEdit(undefined); loadEvents(); }}
          />
        )}

        {showImport && selectedEvent && (
          <ImportAttendees eventId={selectedEvent.id} onClose={() => setShowImport(false)} onSuccess={() => { setShowImport(false); loadStats(); }} />
        )}

        {showFormEditor && selectedEvent && (
          <FormFieldEditor
            eventId={selectedEvent.id}
            currentFields={selectedEvent.custom_fields || []}
            onClose={() => setShowFormEditor(false)}
            onSuccess={() => { setShowFormEditor(false); loadEvents(); }}
          />
        )}

        {showReports && selectedEvent && (
          <ReportingDashboard event={selectedEvent} onClose={() => setShowReports(false)} />
        )}

        {/* Delete event confirmation */}
        {eventToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Delete Event</h3>
              <p className="text-slate-600 mb-6">
                Are you sure you want to delete "{eventToDelete.name}"? This cannot be undone and will also delete all associated attendees.
              </p>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setEventToDelete(null)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors">Cancel</button>
                <button onClick={() => handleDeleteEvent(eventToDelete)} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">Delete Event</button>
              </div>
            </div>
          </div>
        )}

        {/* Change Password modal */}
        {showChangePassword && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="bg-blue-100 p-2 rounded-lg"><KeyRound size={20} className="text-blue-600" /></div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Change Password</h3>
                  <p className="text-sm text-slate-500">Update password for <strong>{adminUsername}</strong></p>
                </div>
              </div>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Current Password</label>
                  <div className="relative">
                    <input type={showCpPasswords ? 'text' : 'password'} value={cpForm.currentPassword}
                      onChange={e => setCpForm({ ...cpForm, currentPassword: e.target.value })}
                      placeholder="Enter current password" autoFocus
                      className="w-full px-3 py-2 pr-9 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
                    <button type="button" onClick={() => setShowCpPasswords(!showCpPasswords)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                      {showCpPasswords ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                  <input type={showCpPasswords ? 'text' : 'password'} value={cpForm.newPassword}
                    onChange={e => setCpForm({ ...cpForm, newPassword: e.target.value })}
                    placeholder="At least 8 characters"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
                  <input type={showCpPasswords ? 'text' : 'password'} value={cpForm.confirmPassword}
                    onChange={e => setCpForm({ ...cpForm, confirmPassword: e.target.value })}
                    placeholder="Re-enter new password"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
                </div>
                {cpError && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
                    <AlertCircle size={15} className="text-red-500 flex-shrink-0" /><p className="text-red-700 text-sm">{cpError}</p>
                  </div>
                )}
                {cpSuccess && (
                  <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg p-3">
                    <CheckCircle2 size={15} className="text-green-500 flex-shrink-0" /><p className="text-green-700 text-sm">{cpSuccess}</p>
                  </div>
                )}
                <div className="flex gap-3 pt-1">
                  <button type="submit" disabled={cpLoading || !cpForm.currentPassword || !cpForm.newPassword || !cpForm.confirmPassword}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm font-medium">
                    {cpLoading ? 'Updating...' : 'Update Password'}
                  </button>
                  <button type="button" onClick={() => { setShowChangePassword(false); setCpForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); setCpError(''); }}
                    className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
