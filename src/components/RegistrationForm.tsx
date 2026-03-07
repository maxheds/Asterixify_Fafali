import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Event, Attendee } from '../lib/database.types';
import { Calendar, MapPin, CheckCircle2, ChevronRight, ChevronLeft, AlertCircle } from 'lucide-react';
import { Badge } from './Badge';
import { sendRegistrationEmail } from '../lib/emailService';

interface RegistrationFormProps {
  onSuccess?: () => void;
}

export function RegistrationForm({ onSuccess }: RegistrationFormProps = {}) {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [registeredAttendee, setRegisteredAttendee] = useState<Attendee | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    salutation: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    gender: '',
    organization: '',
  });
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({});
  const [error, setError] = useState<string>('');
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    if (submitted && countdown > 0) {
      const timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [submitted, countdown]);

  const loadEvents = async () => {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('is_active', true)
      .order('event_date', { ascending: true });

    if (!error && data && data.length > 0) {
      setEvents(data);
      setSelectedEventId(data[0].id);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    const { data, error } = await supabase
      .from('attendees')
      .insert([{
        ...formData,
        event_id: selectedEventId,
        registration_source: 'online',
        form_data: customFieldValues,
      }])
      .select()
      .single();

    setLoading(false);

    if (error) {
      setError('Registration failed. Please try again.');
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        }
      }, 3000);
      return;
    }

    if (data) {
      setRegisteredAttendee(data);
      setSubmitted(true);

      if (selectedEvent) {
        await sendRegistrationEmail({
          salutation: data.salutation,
          first_name: data.first_name,
          last_name: data.last_name,
          to_email: data.email,
          event_name: selectedEvent.name,
          event_date: new Date(selectedEvent.event_date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
          event_location: selectedEvent.location || 'TBA',
        });
      }

      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        }
      }, 5000);
    }
  };

  const renderCustomField = (field: any) => {
    const value = customFieldValues[field.id] || '';

    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            required={field.required}
            value={value}
            onChange={(e) => setCustomFieldValues({ ...customFieldValues, [field.id]: e.target.value })}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            rows={3}
            placeholder={field.placeholder || ''}
          />
        );

      case 'select':
        return (
          <select
            required={field.required}
            value={value}
            onChange={(e) => setCustomFieldValues({ ...customFieldValues, [field.id]: e.target.value })}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
          >
            <option value="">Select an option</option>
            {field.options?.map((option: string) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      default:
        return (
          <input
            type={field.type}
            required={field.required}
            value={value}
            onChange={(e) => setCustomFieldValues({ ...customFieldValues, [field.id]: e.target.value })}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            placeholder={field.placeholder || ''}
          />
        );
    }
  };

  const selectedEvent = events.find(e => e.id === selectedEventId);
  const allFormFields = selectedEvent?.custom_fields || [];
  const activeFields = allFormFields.filter((f: any) => f.active !== false);
  const customFields = activeFields.filter((f: any) =>
    !['first_name', 'last_name', 'email', 'phone', 'gender', 'organization'].includes(f.id)
  );

  const isFieldActive = (fieldId: string) => {
    const field = allFormFields.find((f: any) => f.id === fieldId);
    return field ? field.active !== false : true;
  };

  const isFieldRequired = (fieldId: string) => {
    const field = allFormFields.find((f: any) => f.id === fieldId);
    return field ? field.required !== false : true;
  };

  const totalSteps = customFields.length > 0 ? 4 : 3;

  const canProceedStep1 = (() => {
    if (isFieldActive('first_name') && isFieldRequired('first_name') && !formData.first_name) return false;
    if (isFieldActive('last_name') && isFieldRequired('last_name') && !formData.last_name) return false;
    if (isFieldActive('email') && isFieldRequired('email') && !formData.email) return false;
    return true;
  })();

  const canProceedStep2 = () => {
    if (isFieldActive('phone') && isFieldRequired('phone') && !formData.phone) return false;
    if (isFieldActive('gender') && isFieldRequired('gender') && !formData.gender) return false;
    if (isFieldActive('organization') && isFieldRequired('organization') && !formData.organization) return false;
    return true;
  };

  const canProceedStep3 = () => {
    if (customFields.length === 0) return true;

    for (const field of customFields) {
      if (field.required && !customFieldValues[field.id]) {
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    setRegisteredAttendee(null);
    setFormData({
      salutation: '',
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      gender: '',
      organization: '',
    });
    setCustomFieldValues({});
    setCurrentStep(1);
    setCountdown(5);
    setError('');
  };

  if (submitted && registeredAttendee && selectedEvent) {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 py-8 px-4 print:hidden">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
              <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={48} className="text-green-600" />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-3">Registration Complete!</h2>
              <p className="text-lg text-slate-700 mb-4">
                Your digital badge has been generated. You can download or print it below.
              </p>

              <Badge attendee={registeredAttendee} event={selectedEvent} />

              <div className="flex gap-3 justify-center mt-8">
                <button
                  onClick={() => window.print()}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  Print Badge
                </button>
              </div>

              <p className="text-sm text-slate-500 mt-4">
                A confirmation email with your badge has been sent to {registeredAttendee.email}
              </p>
              <p className="text-sm text-slate-500 mb-6">
                Redirecting to home page in {countdown} second{countdown !== 1 ? 's' : ''}...
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={handleReset}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Register Another Person
                </button>
                {onSuccess && (
                  <button
                    onClick={onSuccess}
                    className="px-6 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors font-medium"
                  >
                    Back to Home
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="hidden print:block print:w-full print:h-full">
          <Badge attendee={registeredAttendee} event={selectedEvent} />
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 py-3 px-4 overflow-y-auto">
      <div className="max-w-3xl mx-auto pb-3">
        <div className="text-center mb-2">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-1 tracking-tight">Event Registration</h1>
          <p className="text-sm text-slate-600">Join us for an amazing experience</p>
        </div>

        {selectedEvent && (
          <div className="bg-white rounded-xl shadow-md border border-slate-200 px-4 py-3 mb-3">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <h2 className="text-xl font-bold text-slate-900">{selectedEvent.name}</h2>
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2 text-slate-600">
                  <Calendar size={18} className="text-blue-600" />
                  <span>{new Date(selectedEvent.event_date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}</span>
                </div>
                {selectedEvent.location && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <MapPin size={18} className="text-blue-600" />
                    <span>{selectedEvent.location}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-3 flex items-start gap-3">
            <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-red-900 font-semibold mb-1">Registration Error</h3>
              <p className="text-red-700 text-sm">{error}</p>
              <p className="text-red-600 text-xs mt-2">Redirecting to home page...</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-4 md:p-5">
          <div className="mb-3">
            <div className="flex items-center justify-between mb-3">
              {Array.from({ length: totalSteps }).map((_, index) => (
                <div key={index} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${
                        currentStep > index + 1
                          ? 'bg-green-600 text-white'
                          : currentStep === index + 1
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {currentStep > index + 1 ? <CheckCircle2 size={20} /> : index + 1}
                    </div>
                    <span className="text-xs font-medium text-slate-600 mt-2 text-center">
                      {index === 0
                        ? 'Basic Info'
                        : index === 1
                        ? 'Contact'
                        : index === 2 && customFields.length > 0
                        ? 'Additional'
                        : 'Review'}
                    </span>
                  </div>
                  {index < totalSteps - 1 && (
                    <div
                      className={`h-1 flex-1 mx-2 transition-colors ${
                        currentStep > index + 1 ? 'bg-green-600' : 'bg-slate-200'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          <form className="space-y-3">
            {events.length > 1 && currentStep === 1 && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Select Event <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                >
                  {events.map(event => (
                    <option key={event.id} value={event.id}>
                      {event.name} - {new Date(event.event_date).toLocaleDateString()}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {currentStep === 1 && (
              <>
                <h3 className="text-lg font-bold text-slate-900 mb-3">Basic Information</h3>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Salutation
                  </label>
                  <select
                    value={formData.salutation}
                    onChange={(e) => setFormData({ ...formData, salutation: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  >
                    <option value="">Select salutation</option>
                    <option value="Mr.">Mr.</option>
                    <option value="Mrs.">Mrs.</option>
                    <option value="Ms.">Ms.</option>
                    <option value="Dr.">Dr.</option>
                    <option value="Prof.">Prof.</option>
                    <option value="Rev.">Rev.</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {isFieldActive('first_name') && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        First Name {isFieldRequired('first_name') && <span className="text-red-500">*</span>}
                      </label>
                      <input
                        type="text"
                        required={isFieldRequired('first_name')}
                        value={formData.first_name}
                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                        placeholder="John"
                      />
                    </div>
                  )}

                  {isFieldActive('last_name') && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Last Name {isFieldRequired('last_name') && <span className="text-red-500">*</span>}
                      </label>
                      <input
                        type="text"
                        required={isFieldRequired('last_name')}
                        value={formData.last_name}
                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                        placeholder="Doe"
                      />
                    </div>
                  )}
                </div>

                {isFieldActive('email') && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Email Address {isFieldRequired('email') && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="email"
                      required={isFieldRequired('email')}
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      placeholder="john.doe@example.com"
                    />
                  </div>
                )}
              </>
            )}

            {currentStep === 2 && (
              <>
                <h3 className="text-lg font-bold text-slate-900 mb-3">Contact Information</h3>

                {isFieldActive('phone') && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Phone Number {isFieldRequired('phone') && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="tel"
                      required={isFieldRequired('phone')}
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      placeholder="+233 123 456 7890"
                    />
                  </div>
                )}

                {isFieldActive('gender') && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Gender {isFieldRequired('gender') && <span className="text-red-500">*</span>}
                    </label>
                    <select
                      required={isFieldRequired('gender')}
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    >
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </div>
                )}

                {isFieldActive('organization') && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Company/Organization {isFieldRequired('organization') && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="text"
                      required={isFieldRequired('organization')}
                      value={formData.organization}
                      onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      placeholder="ABC Corporation"
                    />
                  </div>
                )}
              </>
            )}

            {currentStep === 3 && customFields.length > 0 && (
              <>
                <h3 className="text-lg font-bold text-slate-900 mb-3">Additional Information</h3>

                {customFields.map((field: any) => (
                  <div key={field.id}>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      {field.label} {field.required && <span className="text-red-500">*</span>}
                    </label>
                    {renderCustomField(field)}
                  </div>
                ))}
              </>
            )}

            {((currentStep === 3 && customFields.length === 0) || (currentStep === 4 && customFields.length > 0)) && (
              <>
                <h3 className="text-lg font-bold text-slate-900 mb-3">Review and Print Your Badge</h3>

                <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                  {formData.salutation && (
                    <div>
                      <p className="text-xs font-semibold text-slate-600 mb-1">Salutation</p>
                      <p className="text-sm text-slate-900 font-medium">{formData.salutation}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs font-semibold text-slate-600 mb-1">First Name</p>
                      <p className="text-sm text-slate-900 font-medium">{formData.first_name}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-600 mb-1">Last Name</p>
                      <p className="text-sm text-slate-900 font-medium">{formData.last_name}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-slate-600 mb-1">Email</p>
                    <p className="text-slate-900 font-medium">{formData.email}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs font-semibold text-slate-600 mb-1">Phone</p>
                      <p className="text-sm text-slate-900 font-medium">{formData.phone}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-600 mb-1">Gender</p>
                      <p className="text-sm text-slate-900 font-medium">{formData.gender}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-slate-600 mb-1">Company/Organization</p>
                    <p className="text-slate-900 font-medium">{formData.organization}</p>
                  </div>

                  {customFields.length > 0 && Object.keys(customFieldValues).length > 0 && (
                    <>
                      <div className="border-t border-slate-300 pt-4 mt-4">
                        <p className="text-sm font-bold text-slate-700 mb-3">Additional Information</p>
                        {customFields.map((field: any) => {
                          const value = customFieldValues[field.id];
                          if (!value) return null;
                          return (
                            <div key={field.id} className="mb-3">
                              <p className="text-xs font-semibold text-slate-600 mb-1">{field.label}</p>
                              <p className="text-sm text-slate-900 font-medium">{value}</p>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              </>
            )}

            <div className="flex gap-3 pt-4">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-semibold"
                >
                  <ChevronLeft size={20} />
                  Back
                </button>
              )}

              {currentStep < totalSteps ? (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={
                    currentStep === 1
                      ? !canProceedStep1
                      : currentStep === 2
                      ? !canProceedStep2()
                      : !canProceedStep3()
                  }
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/20"
                >
                  Next
                  <ChevronRight size={20} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading || !selectedEventId}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-50 shadow-lg shadow-green-600/20"
                >
                  {loading ? 'Registering...' : 'Complete Registration'}
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="text-center mt-4 text-slate-600 space-y-1">
          <p className="text-xs">Your information is secure and will only be used for event purposes.</p>
          <p className="text-xs text-slate-500">Developed and Built by Asterixify Innovations © 2025</p>
        </div>
      </div>
    </div>
  );
}
