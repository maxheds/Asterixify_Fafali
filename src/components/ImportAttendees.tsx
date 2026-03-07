import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X, Upload, AlertCircle } from 'lucide-react';
import { sendRegistrationEmail } from '../lib/emailService';

interface ImportAttendeesProps {
  eventId: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormField {
  id: string;
  label: string;
  active: boolean;
  required: boolean;
}

export function ImportAttendees({ eventId, onClose, onSuccess }: ImportAttendeesProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [eventFields, setEventFields] = useState<FormField[]>([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [sendEmails, setSendEmails] = useState(true);

  useEffect(() => {
    loadEventFields();
  }, [eventId]);

  const loadEventFields = async () => {
    const { data, error } = await supabase
      .from('events')
      .select('custom_fields')
      .eq('id', eventId)
      .maybeSingle();

    if (!error && data && data.custom_fields) {
      setEventFields(data.custom_fields);
    }
  };

  const getActiveFields = () => {
    return eventFields.filter(f => f.active !== false);
  };

  const getRequiredFields = () => {
    return eventFields.filter(f => f.active !== false && f.required !== false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError('');

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());

      if (lines.length < 2) {
        setError('CSV file must contain headers and at least one attendee');
        setLoading(false);
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const attendees = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const attendee: any = { event_id: eventId };

        headers.forEach((header, index) => {
          if (header.includes('salutation')) {
            attendee.salutation = values[index];
          } else if (header.includes('first') && header.includes('name')) {
            attendee.first_name = values[index];
          } else if (header.includes('last') && header.includes('name')) {
            attendee.last_name = values[index];
          } else if (header.includes('email')) {
            attendee.email = values[index];
          } else if (header.includes('phone')) {
            attendee.phone = values[index];
          } else if (header.includes('gender')) {
            attendee.gender = values[index];
          } else if (header.includes('company') || header.includes('organization')) {
            attendee.organization = values[index];
          } else if (header.includes('ticket')) {
            attendee.ticket_type = values[index];
          }
        });

        const requiredFields = getRequiredFields();
        let isValid = true;

        for (const field of requiredFields) {
          if (field.id === 'first_name' && !attendee.first_name) isValid = false;
          if (field.id === 'last_name' && !attendee.last_name) isValid = false;
          if (field.id === 'email' && !attendee.email) isValid = false;
          if (field.id === 'phone' && !attendee.phone) isValid = false;
          if (field.id === 'gender' && !attendee.gender) isValid = false;
          if (field.id === 'organization' && !attendee.organization) isValid = false;
        }

        if (isValid) {
          attendee.registration_source = 'imported';
          attendee.app_id = 'default_app';
          attendees.push(attendee);
        }
      }

      if (attendees.length === 0) {
        const requiredFieldNames = getRequiredFields().map(f => f.label).join(', ');
        setError(`No valid attendees found in CSV. Make sure all required columns are included: ${requiredFieldNames}`);
        setLoading(false);
        return;
      }

      const { data: insertedAttendees, error: insertError } = await supabase
        .from('attendees')
        .insert(attendees)
        .select();

      if (insertError) {
        setError('Error importing attendees: ' + insertError.message);
      } else {
        const { data: eventData } = await supabase
          .from('events')
          .select('name, event_date, location')
          .eq('id', eventId)
          .maybeSingle();

        if (eventData && insertedAttendees) {
          let emailsSent = 0;
          if (sendEmails) {
            for (const attendee of insertedAttendees) {
              const emailSent = await sendRegistrationEmail({
                salutation: attendee.salutation || '',
                first_name: attendee.first_name,
                last_name: attendee.last_name,
                to_email: attendee.email,
                event_name: eventData.name,
                event_date: new Date(eventData.event_date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }),
                event_location: eventData.location || 'TBA',
              });
              if (emailSent) emailsSent++;
            }
          }
          setSuccessMessage(`Successfully imported ${insertedAttendees.length} attendee(s).${sendEmails ? ` ${emailsSent} registration email(s) sent.` : ''}`);
        }

        setTimeout(() => {
          onSuccess();
        }, 3000);
      }
    } catch (err) {
      setError('Error reading CSV file. Please make sure it is properly formatted.');
    }

    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Import Attendees</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">CSV Format Requirements</h3>
            <p className="text-sm text-blue-700 mb-3">Your CSV should include these columns based on your event's registration form:</p>

            {eventFields.length > 0 ? (
              <div className="space-y-2">
                <div>
                  <p className="text-xs font-semibold text-blue-900 mb-1">Required Columns:</p>
                  <ul className="text-sm text-blue-700 list-disc list-inside space-y-1">
                    {getRequiredFields().map(field => (
                      <li key={field.id}>{field.label}</li>
                    ))}
                  </ul>
                </div>

                {getActiveFields().filter(f => !f.required).length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-blue-900 mb-1">Optional Columns:</p>
                    <ul className="text-sm text-blue-700 list-disc list-inside space-y-1">
                      {getActiveFields().filter(f => !f.required).map(field => (
                        <li key={field.id}>{field.label}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <ul className="text-sm text-blue-700 list-disc list-inside space-y-1">
                <li>First Name (required)</li>
                <li>Last Name (required)</li>
                <li>Email (required)</li>
                <li>Phone (required)</li>
                <li>Gender (required)</li>
                <li>Company/Organization (required)</li>
              </ul>
            )}
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
            <AlertCircle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-900 mb-1">Important Note</p>
              <p className="text-sm text-amber-700">
                Only rows with all required fields will be imported. Rows missing required data will be skipped.
              </p>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={sendEmails}
                onChange={(e) => setSendEmails(e.target.checked)}
                className="w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-600"
              />
              <div>
                <p className="text-sm font-semibold text-slate-900">Send registration emails</p>
                <p className="text-xs text-slate-600">Automatically send welcome emails to imported attendees</p>
              </div>
            </label>
          </div>

          <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-blue-600 transition-colors">
            <Upload size={48} className="text-slate-400 mx-auto mb-4" />
            <label className="cursor-pointer">
              <span className="text-blue-600 hover:text-blue-700 font-medium">Choose a CSV file</span>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                disabled={loading}
                className="hidden"
              />
            </label>
            <p className="text-sm text-slate-500 mt-2">or drag and drop</p>
          </div>

          {successMessage && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700 text-sm">
              {successMessage}
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
              {error}
            </div>
          )}

          {loading && (
            <div className="text-center text-slate-600">
              {sendEmails ? 'Importing attendees and sending emails...' : 'Importing attendees...'}
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
