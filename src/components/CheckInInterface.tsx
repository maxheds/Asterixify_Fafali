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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">Confirm Your Details</h2>

          <div className="bg-slate-50 rounded-lg p-6 mb-6 space-y-4">
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-1">Full Name</p>
              <p className="text-lg text-slate-900 font-semibold">
                {selectedAttendee.first_name} {selectedAttendee.last_name}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-600 mb-1">Email</p>
              <p className="text-slate-900">{selectedAttendee.email}</p>
            </div>

            {selectedAttendee.phone && (
              <div>
                <p className="text-xs font-semibold text-slate-600 mb-1">Phone</p>
                <p className="text-slate-900">{selectedAttendee.phone}</p>
              </div>
            )}

            {selectedAttendee.organization && (
              <div>
                <p className="text-xs font-semibold text-slate-600 mb-1">Company/Organization</p>
                <p className="text-slate-900">{selectedAttendee.organization}</p>
              </div>
            )}

            {selectedAttendee.ticket_type && (
              <div>
                <p className="text-xs font-semibold text-slate-600 mb-1">Ticket Type</p>
                <p className="text-slate-900">{selectedAttendee.ticket_type}</p>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleReset}
              className="flex-1 px-6 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmCheckIn}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-50"
            >
              {loading ? 'Checking In...' : 'Confirm Check-In'}
            </button>
          </div>
        </div>
        <div className="text-center mt-8 text-slate-600 space-y-2">
          <p className="text-xs text-slate-500">Developed and Built by Asterixify Innovations © 2025</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-8">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Welcome to {event.name}</h2>
            <p className="text-slate-600">
              Please enter your name, email, or phone number to check in
            </p>
          </div>

          <div className="mb-6">
            <div className="relative">
              <Search size={24} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Enter your name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-12 pr-4 py-4 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent text-lg"
                autoFocus
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={!searchQuery.trim() || loading}
              className="w-full mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>

          {searchResults.length > 0 && (
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              <h3 className="text-lg font-semibold text-slate-900 mb-3">Select Your Name:</h3>
              {searchResults.map((attendee) => (
                <button
                  key={attendee.id}
                  onClick={() => handleSelectAttendee(attendee)}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    attendee.checked_in
                      ? 'bg-green-50 border-green-300'
                      : 'bg-white border-slate-200 hover:border-blue-600 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-lg text-slate-900">
                        {attendee.first_name} {attendee.last_name}
                      </div>
                      <div className="text-sm text-slate-600">{attendee.email}</div>
                      {attendee.organization && (
                        <div className="text-sm text-slate-600">{attendee.organization}</div>
                      )}
                    </div>
                    {attendee.checked_in && (
                      <div className="bg-green-100 px-3 py-1 rounded-full">
                        <span className="text-xs font-semibold text-green-700">CHECKED IN</span>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {searchQuery && searchResults.length === 0 && !loading && (
            <div className="text-center py-8">
              <p className="text-slate-600 mb-2 font-medium">No registration found matching your search.</p>
              <p className="text-sm text-slate-500 mb-4">Please check your spelling or contact event staff for assistance.</p>
              {onRegister && (
                <button
                  onClick={onRegister}
                  className="px-5 py-2.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-semibold text-sm shadow-md hover:shadow-lg"
                >
                  Register for Event
                </button>
              )}
            </div>
          )}

          {onHome && (
            <div className="mt-8 text-center">
              <button
                onClick={onHome}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                ← Back to Home
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="text-center pb-8 text-slate-600 space-y-2">
        <p className="text-sm">Your information is secure and will only be used for event purposes.</p>
        <p className="text-xs text-slate-500">Developed and Built by Asterixify Innovations © 2025</p>
      </div>
    </div>
  );
}
