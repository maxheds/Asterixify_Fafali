import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { sendRegistrationEmail } from '../lib/emailService';
import { sendRegistrationSMS, isEmailEnabled } from '../lib/smsService';
import { Event } from '../lib/database.types';
import { X } from 'lucide-react';

interface AddAttendeeFormProps {
  eventId: string;
  event?: Event | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddAttendeeForm({ eventId, event, onClose, onSuccess }: AddAttendeeFormProps) {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    ticket_type: 'General',
    organization: '',
    age_group: '',
    special_requirements: '',
  });
  const [sendNotification, setSendNotification] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase
      .from('attendees')
      .insert([{ ...formData, event_id: eventId, registration_source: 'onsite', app_id: 'default_app' }])
      .select()
      .maybeSingle();

    if (!error && data && sendNotification && event) {
      const eventDate = new Date(event.event_date).toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      });
      const emailOn = await isEmailEnabled();
      await Promise.all([
        emailOn
          ? sendRegistrationEmail({
              salutation: '',
              first_name: data.first_name,
              last_name: data.last_name,
              to_email: data.email,
              event_name: event.name,
              event_date: eventDate,
              event_location: event.location || 'TBA',
            })
          : Promise.resolve(),
        sendRegistrationSMS({
          first_name: data.first_name,
          phone: data.phone || '',
          event_name: event.name,
          event_date: eventDate,
          event_location: event.location || 'TBA',
        }),
      ]);
    }

    setLoading(false);
    if (!error) onSuccess();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Add Attendee</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">First Name</label>
            <input
              type="text"
              required
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Last Name</label>
            <input
              type="text"
              required
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Organization</label>
            <input
              type="text"
              value={formData.organization}
              onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              placeholder="Church or organization name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Ticket Type</label>
            <select
              value={formData.ticket_type}
              onChange={(e) => setFormData({ ...formData, ticket_type: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            >
              <option value="General">General</option>
              <option value="VIP">VIP</option>
              <option value="Student">Student</option>
              <option value="Press">Press</option>
            </select>
          </div>

          {event && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sendNotification}
                  onChange={(e) => setSendNotification(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-600"
                />
                <div>
                  <p className="text-sm font-medium text-slate-900">Send registration notification</p>
                  <p className="text-xs text-slate-500">Email + SMS confirmation sent to this attendee</p>
                </div>
              </label>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Attendee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
