import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Attendee, Event } from '../lib/database.types';
import { Calendar, MapPin, Ticket } from 'lucide-react';

export function TicketPage() {
  const { attendeeId } = useParams<{ attendeeId: string }>();
  const [attendee, setAttendee] = useState<Attendee | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!attendeeId) { setNotFound(true); setLoading(false); return; }
    loadTicket();
  }, [attendeeId]);

  const loadTicket = async () => {
    const { data: att } = await supabase
      .from('attendees')
      .select('*')
      .eq('id', attendeeId)
      .maybeSingle();

    if (!att) { setNotFound(true); setLoading(false); return; }

    const { data: ev } = await supabase
      .from('events')
      .select('*')
      .eq('id', att.event_id)
      .maybeSingle();

    setAttendee(att);
    setEvent(ev);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-slate-400 text-sm">Loading ticket...</div>
      </div>
    );
  }

  if (notFound || !attendee || !event) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-400 text-lg font-semibold">Ticket not found</p>
          <p className="text-slate-500 mt-2 text-sm">Please contact event staff for assistance.</p>
        </div>
      </div>
    );
  }

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(attendee.id)}&size=280x280&bgcolor=ffffff&margin=10`;
  const eventDate = new Date(event.event_date).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <p className="text-slate-400 text-xs uppercase tracking-widest mb-1">Your Ticket</p>
          <h1 className="text-xl font-bold text-white">{event.name}</h1>
        </div>

        <div className="bg-white rounded-2xl overflow-hidden shadow-2xl">
          {/* Header band */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-5">
            <p className="text-white/60 text-xs uppercase tracking-widest mb-1">Attendee</p>
            <p className="text-white text-xl font-bold">
              {attendee.salutation ? `${attendee.salutation} ` : ''}{attendee.first_name} {attendee.last_name}
            </p>
            {attendee.ticket_type && (
              <span className="inline-flex items-center gap-1.5 mt-2.5 px-2.5 py-1 bg-white/20 text-white text-xs font-semibold rounded-full">
                <Ticket size={11} /> {attendee.ticket_type}
              </span>
            )}
          </div>

          {/* Tear-off divider */}
          <div className="relative flex items-center -mx-0">
            <div className="absolute -left-3 w-6 h-6 bg-slate-900 rounded-full" />
            <div className="flex-1 border-t-2 border-dashed border-slate-200 mx-6" />
            <div className="absolute -right-3 w-6 h-6 bg-slate-900 rounded-full" />
          </div>

          {/* QR code */}
          <div className="flex justify-center pt-6 pb-4 px-6">
            <img
              src={qrUrl}
              alt="Check-in QR Code"
              className="w-52 h-52 rounded-xl border border-slate-100"
              crossOrigin="anonymous"
            />
          </div>
          <p className="text-center text-xs text-slate-400 pb-4">Scan at check-in</p>

          {/* Event info */}
          <div className="px-6 pb-5 space-y-2.5 border-t border-slate-100 pt-4">
            <div className="flex items-start gap-2.5">
              <Calendar size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-slate-600">{eventDate}</p>
            </div>
            {event.location && (
              <div className="flex items-start gap-2.5">
                <MapPin size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-slate-600">{event.location}</p>
              </div>
            )}
          </div>

          <div className="bg-slate-50 border-t border-slate-100 px-6 py-3 text-center">
            <p className="text-xs text-slate-400">Powered by Asterixify Innovations</p>
          </div>
        </div>
      </div>
    </div>
  );
}
