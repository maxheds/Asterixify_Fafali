import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Event, Attendee } from '../lib/database.types';
import { Search, CheckCircle2, ArrowLeft, Home, User } from 'lucide-react';
import { sendCheckInEmail } from '../lib/emailService';

interface CheckInInterfaceProps {
  eventId: string;
  onBack: () => void;
  onHome?: () => void;
  onRegister?: () => void;
}

export function CheckInInterface({ eventId, onBack, onHome, onRegister }: CheckInInterfaceProps) {
  const [event, setEvent] = useState<Event | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Attendee[]>([]);
  const [selectedAttendee, setSelectedAttendee] = useState<Attendee | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkInStep, setCheckInStep] = useState<'search' | 'confirm' | 'success'>('search');
  const [checkInSuccess, setCheckInSuccess] = useState(false);

  useEffect(() => {
    loadEvent();
  }, [eventId]);

  const loadEvent = async () => {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .maybeSingle();

    if (!error && data) {
      setEvent(data);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    const query = searchQuery.toLowerCase();

    const { data, error } = await supabase
      .from('attendees')
      .select('*')
      .eq('event_id', eventId)
      .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`);

    if (!error && data) {
      setSearchResults(data);
    }
    setLoading(false);
  };

  const handleSelectAttendee = (attendee: Attendee) => {
    setSelectedAttendee(attendee);
    setCheckInStep('confirm');
  };

  const handleConfirmCheckIn = async () => {
    if (!selectedAttendee || selectedAttendee.checked_in) return;

    setLoading(true);

    const { error } = await supabase
      .from('attendees')
      .update({
        checked_in: true,
        checked_in_at: new Date().toISOString(),
        checked_in_by: 'Self Check-In',
      })
      .eq('id', selectedAttendee.id);

    if (!error) {
      await supabase
        .from('check_in_history')
        .insert([{
          attendee_id: selectedAttendee.id,
          event_id: eventId,
          checked_in_by: 'Self Check-In',
          app_id: 'default_app',
        }]);

      if (event) {
        await sendCheckInEmail({
          salutation: selectedAttendee.salutation || '',
          first_name: selectedAttendee.first_name,
          last_name: selectedAttendee.last_name,
          to_email: selectedAttendee.email,
          event_name: event.name,
          checked_in_at: new Date().toLocaleString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          }),
        });
      }

      setCheckInSuccess(true);
      setCheckInStep('success');

      setTimeout(() => {
        if (onHome) {
          onHome();
        }
      }, 3000);
    }

    setLoading(false);
  };

  const handleReset = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSelectedAttendee(null);
    setCheckInStep('search');
    setCheckInSuccess(false);
  };

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center">
        <div className="text-slate-600">Loading event...</div>
      </div>
    );
  }

  if (!event.is_active) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-slate-100 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-8 text-center">
          <div className="bg-red-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <User size={48} className="text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Event Not Active</h2>
          <p className="text-slate-600 mb-6">
            This event is currently not accepting check-ins. Please contact event staff for assistance.
          </p>
          {onHome && (
            <button
              onClick={onHome}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              Back to Home
            </button>
          )}
        </div>
      </div>
    );
  }

  if (checkInStep === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-8 text-center">
          <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={48} className="text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-3">Check-In Successful!</h2>
          <p className="text-lg text-slate-700 mb-2">
            Welcome, {selectedAttendee?.first_name} {selectedAttendee?.last_name}
          </p>
          <p className="text-slate-600 mb-6">
            You have been successfully checked in to {event.name}
          </p>
          <div className="text-sm text-slate-500">
            Redirecting to home page...
          </div>
        </div>
        <div className="text-center mt-8 text-slate-600 space-y-2">
          <p className="text-xs text-slate-500">Developed and Built by Asterixify Innovations © 2025</p>
        </div>
      </div>
    );
  }

  if (checkInStep === 'confirm' && selectedAttendee) {
    if (selectedAttendee.checked_in) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-8 text-center">
            <div className="bg-yellow-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={48} className="text-yellow-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Already Checked In</h2>
            <p className="text-slate-700 mb-2">
              {selectedAttendee.first_name} {selectedAttendee.last_name}
            </p>
            <p className="text-slate-600 mb-6">
              You have already been checked in to this event.
            </p>
            <button
              onClick={handleReset}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              Back to Search
            </button>
          </div>
          <div className="text-center mt-8 text-slate-600 space-y-2">
            <p className="text-xs text-slate-500">Developed and Built by Asterixify Innovations © 2025</p>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-transparent py-2 px-3">
        <div className="max-w-lg mx-auto">
          <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl shadow-lg border border-purple-500/30 p-3">
            <h2 className="text-lg font-bold bg-gradient-to-r from-purple-400 to-purple-300 bg-clip-text text-transparent mb-3 text-center">
              Confirm Your Details
            </h2>

            <div className="bg-slate-700/60 backdrop-blur-sm rounded-lg p-3 mb-3 space-y-2 border border-purple-500/20">
              <div>
                <p className="text-[10px] font-semibold text-purple-300 mb-0.5">Full Name</p>
                <p className="text-sm text-white font-semibold">
                  {selectedAttendee.first_name} {selectedAttendee.last_name}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-semibold text-purple-300 mb-0.5">Email</p>
                <p className="text-xs text-white">{selectedAttendee.email}</p>
              </div>

              {selectedAttendee.phone && (
                <div>
                  <p className="text-[10px] font-semibold text-purple-300 mb-0.5">Phone</p>
                  <p className="text-xs text-white">{selectedAttendee.phone}</p>
                </div>
              )}

              {selectedAttendee.organization && (
                <div>
                  <p className="text-[10px] font-semibold text-purple-300 mb-0.5">Company/Organization</p>
                  <p className="text-xs text-white">{selectedAttendee.organization}</p>
                </div>
              )}

              {selectedAttendee.ticket_type && (
                <div>
                  <p className="text-[10px] font-semibold text-purple-300 mb-0.5">Ticket Type</p>
                  <p className="text-xs text-white">{selectedAttendee.ticket_type}</p>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleReset}
                className="flex-1 px-4 py-2 text-sm bg-slate-700 border border-purple-500/30 text-purple-300 rounded-lg hover:bg-slate-600 transition-colors font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmCheckIn}
                disabled={loading}
                className="flex-1 px-4 py-2 text-sm bg-lime-600 text-white rounded-lg hover:bg-lime-700 transition-colors font-semibold disabled:opacity-50 shadow-lg shadow-lime-600/20"
              >
                {loading ? 'Checking In...' : 'Confirm Check-In'}
              </button>
            </div>
          </div>
          <div className="text-center mt-2 text-purple-200 space-y-0.5">
            <p className="text-[10px] text-purple-300">Developed and Built by Asterixify Innovations © 2025</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent py-2 px-3">
      <div className="max-w-2xl mx-auto">
        <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl shadow-lg border border-purple-500/30 p-3">
          <div className="mb-3 text-center">
            <h2 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-purple-300 bg-clip-text text-transparent mb-1">
              Welcome to {event.name}
            </h2>
            <p className="text-xs text-purple-200">
              Please enter your name, email, or phone number to check in
            </p>
          </div>

          <div className="mb-3">
            <div className="relative mb-2">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400" />
              <input
                type="text"
                placeholder="Enter your name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-3 py-2 text-sm bg-slate-700/80 border border-purple-500/30 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white placeholder-slate-400"
                autoFocus
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={!searchQuery.trim() || loading}
              className="w-full px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold disabled:opacity-50 shadow-lg shadow-purple-600/20"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>

          {searchResults.length > 0 && (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              <h3 className="text-sm font-semibold text-purple-300 mb-2">Select Your Name:</h3>
              {searchResults.map((attendee) => (
                <button
                  key={attendee.id}
                  onClick={() => handleSelectAttendee(attendee)}
                  className={`w-full p-3 rounded-lg border transition-all text-left ${
                    attendee.checked_in
                      ? 'bg-lime-900/30 border-lime-500/50'
                      : 'bg-slate-700/60 border-purple-500/30 hover:border-purple-500 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-sm text-white">
                        {attendee.first_name} {attendee.last_name}
                      </div>
                      <div className="text-xs text-purple-200">{attendee.email}</div>
                      {attendee.organization && (
                        <div className="text-xs text-purple-200">{attendee.organization}</div>
                      )}
                    </div>
                    {attendee.checked_in && (
                      <div className="bg-lime-600/80 px-2 py-0.5 rounded-full">
                        <span className="text-[10px] font-semibold text-white">CHECKED IN</span>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {searchQuery && searchResults.length === 0 && !loading && (
            <div className="text-center py-4">
              <p className="text-purple-200 mb-1 font-medium text-sm">No registration found matching your search.</p>
              <p className="text-xs text-purple-300 mb-3">Please check your spelling or contact event staff for assistance.</p>
              {onRegister && (
                <button
                  onClick={onRegister}
                  className="px-4 py-2 text-sm bg-lime-600 text-white rounded-lg hover:bg-lime-700 transition-colors font-semibold shadow-md"
                >
                  Register for Event
                </button>
              )}
            </div>
          )}

          {onHome && (
            <div className="mt-3 text-center">
              <button
                onClick={onHome}
                className="text-purple-300 hover:text-purple-200 font-medium text-xs"
              >
                ← Back to Home
              </button>
            </div>
          )}
        </div>
        <div className="text-center mt-2 text-purple-200 space-y-0.5">
          <p className="text-[10px]">Your information is secure and will only be used for event purposes.</p>
          <p className="text-[10px] text-purple-300">Developed and Built by Asterixify Innovations © 2025</p>
        </div>
      </div>
    </div>
  );
}
