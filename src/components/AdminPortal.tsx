import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Event, Attendee } from '../lib/database.types';
import { Plus, Calendar, Download, Upload, Settings, Edit2, BarChart3, Filter, Trash2 } from 'lucide-react';
import { EventForm } from './EventForm';
import { AttendeesList } from './AttendeesList';
import { ImportAttendees } from './ImportAttendees';
import { FormFieldEditor } from './FormFieldEditor';
import { ReportingDashboard } from './ReportingDashboard';

export function AdminPortal({ onNavigateToCheckIn, onLogout }: { onNavigateToCheckIn: (eventId: string) => void; onLogout?: () => void }) {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<Event | undefined>(undefined);
  const [showImport, setShowImport] = useState(false);
  const [showFormEditor, setShowFormEditor] = useState(false);
  const [showReports, setShowReports] = useState(false);
  const [stats, setStats] = useState<{ total: number; checkedIn: number }>({ total: 0, checkedIn: 0 });
  const [loading, setLoading] = useState(true);
  const [showAllEvents, setShowAllEvents] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      loadStats();
      const subscription = supabase
        .channel('attendees-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'attendees', filter: `event_id=eq.${selectedEvent.id}` }, () => {
          loadStats();
        })
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [selectedEvent]);

  const loadEvents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('event_date', { ascending: false });

    if (!error && data) {
      setEvents(data);
      const activeEvents = data.filter(e => e.is_active);
      if (activeEvents.length > 0 && !selectedEvent) {
        setSelectedEvent(activeEvents[0]);
      } else if (data.length > 0 && !selectedEvent) {
        setSelectedEvent(data[0]);
      }
    }
    setLoading(false);
  };

  const displayedEvents = showAllEvents ? events : events.filter(e => e.is_active);

  const loadStats = async () => {
    if (!selectedEvent) return;

    const { data, error } = await supabase
      .from('attendees')
      .select('checked_in')
      .eq('event_id', selectedEvent.id);

    if (!error && data) {
      setStats({
        total: data.length,
        checkedIn: data.filter(a => a.checked_in).length,
      });
    }
  };

  const handleEventCreated = () => {
    setShowEventForm(false);
    setEventToEdit(undefined);
    loadEvents();
  };

  const handleEditEvent = (event: Event) => {
    setEventToEdit(event);
    setShowEventForm(true);
  };

  const handleImportComplete = () => {
    setShowImport(false);
    loadStats();
  };

  const handleDeleteEvent = async (event: Event) => {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', event.id);

    if (!error) {
      if (selectedEvent?.id === event.id) {
        setSelectedEvent(null);
      }
      setEventToDelete(null);
      loadEvents();
    }
  };

  const exportAttendees = async () => {
    if (!selectedEvent) return;

    const { data, error } = await supabase
      .from('attendees')
      .select('*')
      .eq('event_id', selectedEvent.id);

    if (!error && data) {
      const csv = [
        ['First Name', 'Last Name', 'Email', 'Phone', 'Organization', 'Age Group', 'Ticket Type', 'Special Requirements', 'Checked In', 'Checked In At', 'Checked In By', 'Registration Source'],
        ...data.map(a => [
          a.first_name,
          a.last_name,
          a.email,
          a.phone,
          a.organization || '',
          a.age_group || '',
          a.ticket_type,
          a.special_requirements || '',
          a.checked_in ? 'Yes' : 'No',
          a.checked_in_at || '',
          a.checked_in_by || '',
          a.registration_source || '',
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedEvent.name}-attendees.csv`;
      a.click();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-shrink-0 print:hidden">
        <div className="flex items-center justify-between gap-6 mb-8">
          <div className="flex-shrink-0">
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Asterixify Event System</h1>
            <p className="text-slate-600 mt-2">Manage events and track attendees effortlessly</p>
          </div>

          {selectedEvent && (
            <div className="flex items-center gap-4 flex-1 justify-end">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 px-6 py-4">
                <div className="text-xs text-slate-600 font-medium">Total Attendees</div>
                <div className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 px-6 py-4">
                <div className="text-xs text-slate-600 font-medium">Checked In</div>
                <div className="text-2xl font-bold text-green-600 mt-1">{stats.checkedIn}</div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 px-6 py-4">
                <div className="text-xs text-slate-600 font-medium">Check-in Rate</div>
                <div className="text-2xl font-bold text-slate-900 mt-1">
                  {stats.total > 0 ? Math.round((stats.checkedIn / stats.total) * 100) : 0}%
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowEventForm(true)}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20 flex-shrink-0"
            >
              <Plus size={20} />
              New Event
            </button>
            {onLogout && (
              <button
                onClick={onLogout}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20 flex-shrink-0"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto px-4 sm:px-6 lg:px-8 pb-8 flex-1 min-h-0 w-full print:hidden">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
          <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Calendar size={20} className="text-blue-600" />
                Events
              </h2>
              <button
                onClick={() => setShowAllEvents(!showAllEvents)}
                className={`p-2 rounded-lg transition-colors ${
                  showAllEvents
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
                title={showAllEvents ? 'Show active events only' : 'Show all events'}
              >
                <Filter size={18} />
              </button>
            </div>
            <div className="space-y-2 overflow-y-auto flex-1">
              {displayedEvents.map((event) => (
                <div
                  key={event.id}
                  className={`w-full p-4 rounded-lg transition-all ${
                    selectedEvent?.id === event.id
                      ? 'bg-blue-50 border-2 border-blue-600'
                      : 'bg-slate-50 border-2 border-transparent hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <button
                      onClick={() => setSelectedEvent(event)}
                      className="flex-1 text-left"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-slate-900">{event.name}</span>
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                          event.is_active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-slate-200 text-slate-600'
                        }`}>
                          {event.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="text-sm text-slate-500 mt-1">{new Date(event.event_date).toLocaleDateString()}</div>
                      <div className="text-xs text-slate-400 mt-1">{event.location}</div>
                    </button>
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditEvent(event);
                        }}
                        className="p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Edit event"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEventToDelete(event);
                        }}
                        className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete event"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {displayedEvents.length === 0 && (
                <div className="text-center text-slate-500 py-8">
                  {showAllEvents
                    ? 'No events yet. Create your first event to get started.'
                    : 'No active events. Click the filter icon to view all events.'}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-3 flex flex-col min-h-0">
            {selectedEvent ? (
              <>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col flex-1 min-h-0">
                  <div className="flex items-center justify-between p-6 border-b border-slate-200 flex-shrink-0">
                    <div>
                      <h2 className="text-xl font-semibold text-slate-900">Attendees - {selectedEvent.name}</h2>
                      {selectedEvent.custom_fields && selectedEvent.custom_fields.length > 0 && (
                        <p className="text-sm text-slate-500 mt-1">
                          Custom fields: {selectedEvent.custom_fields.map((f: any) => f.label).join(', ')}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowFormEditor(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                      >
                        <Settings size={18} />
                        Form Fields {selectedEvent.custom_fields && selectedEvent.custom_fields.length > 0 && (
                          <span className="ml-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                            {selectedEvent.custom_fields.length}
                          </span>
                        )}
                      </button>
                      <button
                        onClick={() => setShowReports(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
                      >
                        <BarChart3 size={18} />
                        Reports
                      </button>
                      <button
                        onClick={() => setShowImport(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                      >
                        <Upload size={18} />
                        Import
                      </button>
                      <button
                        onClick={exportAttendees}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                      >
                        <Download size={18} />
                        Export
                      </button>
                      <button
                        onClick={() => onNavigateToCheckIn(selectedEvent.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Check-In Mode
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 p-6 min-h-0">
                    <AttendeesList eventId={selectedEvent.id} />
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                <Calendar size={48} className="text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 text-lg">Select an event to view attendees</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="print:hidden">
        {showEventForm && (
          <EventForm
            event={eventToEdit}
            onClose={() => {
              setShowEventForm(false);
              setEventToEdit(undefined);
            }}
            onSuccess={handleEventCreated}
          />
        )}

        {showImport && selectedEvent && (
          <ImportAttendees eventId={selectedEvent.id} onClose={() => setShowImport(false)} onSuccess={handleImportComplete} />
        )}

        {showFormEditor && selectedEvent && (
          <FormFieldEditor
            eventId={selectedEvent.id}
            currentFields={selectedEvent.custom_fields || []}
            onClose={() => setShowFormEditor(false)}
            onSuccess={() => {
              setShowFormEditor(false);
              loadEvents();
            }}
          />
        )}

        {showReports && selectedEvent && (
          <ReportingDashboard
            event={selectedEvent}
            onClose={() => setShowReports(false)}
          />
        )}

        {eventToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Delete Event</h3>
              <p className="text-slate-600 mb-6">
                Are you sure you want to delete "{eventToDelete.name}"? This action cannot be undone and will also delete all attendees associated with this event.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setEventToDelete(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteEvent(eventToDelete)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete Event
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
