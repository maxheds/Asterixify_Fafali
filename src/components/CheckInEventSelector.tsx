import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Event } from '../lib/database.types';
import { Calendar, MapPin, ArrowLeft, Users } from 'lucide-react';

interface CheckInEventSelectorProps {
  onSelectEvent: (eventId: string) => void;
  onBack: () => void;
}

export function CheckInEventSelector({ onSelectEvent, onBack }: CheckInEventSelectorProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('is_active', true)
      .order('event_date', { ascending: true });

    if (data) {
      setEvents(data);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 rounded-lg hover:bg-slate-100 transition-colors shadow-sm"
          >
            <ArrowLeft size={20} />
            Back to Home
          </button>
        </div>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-3">Select Event for Check-In</h1>
          <p className="text-slate-600 text-lg">Choose the event you want to check attendees into</p>
        </div>

        {events.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-12 text-center">
            <Users size={64} className="text-slate-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">No Active Events</h2>
            <p className="text-slate-600">There are no active events available for check-in at this time.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <button
                key={event.id}
                onClick={() => onSelectEvent(event.id)}
                className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 hover:shadow-xl hover:border-green-500 transition-all transform hover:scale-105 text-left"
              >
                <h3 className="text-xl font-bold text-slate-900 mb-3">{event.name}</h3>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-slate-600 text-sm">
                    <Calendar size={16} className="text-green-600" />
                    <span>{new Date(event.event_date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}</span>
                  </div>
                  {event.location && (
                    <div className="flex items-center gap-2 text-slate-600 text-sm">
                      <MapPin size={16} className="text-green-600" />
                      <span>{event.location}</span>
                    </div>
                  )}
                </div>
                {event.description && (
                  <p className="text-slate-600 text-sm line-clamp-2">{event.description}</p>
                )}
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <span className="text-green-600 font-semibold text-sm">Click to start check-in →</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
