import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Event, Attendee } from '../lib/database.types';
import { Calendar, MapPin, CheckCircle2, ChevronRight, ChevronLeft, AlertCircle } from 'lucide-react';
import { Badge } from './Badge';
import { sendRegistrationEmail } from '../lib/emailService';
import { sendRegistrationSMS, isEmailEnabled } from '../lib/smsService';

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
    age_group: '',
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

    // Duplicate attendee check — same email in the same event
    const { data: existing } = await supabase
      .from('attendees')
      .select('id')
      .eq('event_id', selectedEventId)
      .eq('email', formData.email.trim().toLowerCase())
      .maybeSingle();

    if (existing) {
      setError('This email address is already registered for this event. Please check your inbox for your confirmation email.');
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('attendees')
      .insert({
        ...formData,
        event_id: selectedEventId,
        registration_source: 'online',
        form_data: customFieldValues,
        app_id: 'default_app',
      })
      .select()
      .maybeSingle();

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
        const eventDate = new Date(selectedEvent.event_date).toLocaleDateString('en-US', {
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        });
        const emailOn = await isEmailEnabled();
        await Promise.all([
          emailOn
            ? sendRegistrationEmail({
                salutation: data.salutation,
                first_name: data.first_name,
                last_name: data.last_name,
                to_email: data.email,
                event_name: selectedEvent.name,
                event_date: eventDate,
                event_location: selectedEvent.location || 'TBA',
              })
            : Promise.resolve(),
          sendRegistrationSMS({
            first_name: data.first_name,
            phone: data.phone || '',
            event_name: selectedEvent.name,
            event_date: eventDate,
            event_location: selectedEvent.location || 'TBA',
          }),
        ]);
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
            className="w-full px-3 py-2 text-sm bg-slate-700/80 border border-lime-500/30 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-lime-500 text-white placeholder-slate-400"
            rows={2}
            placeholder={field.placeholder || ''}
          />
        );

      case 'select':
        return (
          <select
            required={field.required}
            value={value}
            onChange={(e) => setCustomFieldValues({ ...customFieldValues, [field.id]: e.target.value })}
            className="w-full px-3 py-2 text-sm bg-slate-700/80 border border-lime-500/30 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-lime-500 text-white"
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
            className="w-full px-3 py-2 text-sm bg-slate-700/80 border border-lime-500/30 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-lime-500 text-white placeholder-slate-400"
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
    if (isFieldActive('age_group') && isFieldRequired('age_group') && !formData.age_group) return false;
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
      age_group: '',
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
    <div className="h-full flex flex-col bg-transparent py-3 px-4">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto pb-3">
          {selectedEvent && (
            <div className="flex items-center justify-center gap-4 text-sm mb-3">
              <div className="flex items-center gap-2 text-lime-300">
                <Calendar size={16} className="text-lime-400" />
                <span>{new Date(selectedEvent.event_date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}</span>
              </div>
              {selectedEvent.location && (
                <div className="flex items-center gap-2 text-lime-300">
                  <MapPin size={16} className="text-lime-400" />
                  <span>{selectedEvent.location}</span>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="bg-red-900/80 backdrop-blur-sm border border-red-500/50 rounded-xl p-3 mb-3 flex items-start gap-2">
              <AlertCircle size={18} className="text-red-300 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-red-100 font-semibold text-base">Registration Error</h3>
                <p className="text-red-200 text-sm">{error}</p>
                <p className="text-red-300 text-sm mt-1">Redirecting to home page...</p>
              </div>
            </div>
          )}

          <div className="bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-lime-500/30 p-4 sm:p-5">
            <div className="mb-3">
              <div className="flex items-center justify-between mb-3">
              {Array.from({ length: totalSteps }).map((_, index) => (
                <div key={index} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm sm:text-base font-bold transition-colors ${
                        currentStep > index + 1
                          ? 'bg-lime-600 text-white'
                          : currentStep === index + 1
                          ? 'bg-lime-500 text-white'
                          : 'bg-slate-700 text-slate-400 border border-lime-500/30'
                      }`}
                    >
                      {currentStep > index + 1 ? <CheckCircle2 size={18} /> : index + 1}
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-lime-200 mt-1.5 text-center">
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
                      className={`h-1 flex-1 mx-1 transition-colors ${
                        currentStep > index + 1 ? 'bg-lime-600' : 'bg-slate-700'
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
                <label className="block text-xs font-semibold text-lime-200 mb-1">
                  Select Event <span className="text-red-400">*</span>
                </label>
                <select
                  required
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-700/80 border border-lime-500/30 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-lime-500 text-white"
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
                  <h3 className="text-lg sm:text-xl font-bold text-lime-300 mb-3">Basic Information</h3>

                <div>
                  <label className="block text-xs font-semibold text-lime-200 mb-1">
                    Salutation
                  </label>
                  <select
                    value={formData.salutation}
                    onChange={(e) => setFormData({ ...formData, salutation: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-700/80 border border-lime-500/30 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-lime-500 text-white"
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {isFieldActive('first_name') && (
                    <div>
                      <label className="block text-xs font-semibold text-lime-200 mb-1">
                        First Name {isFieldRequired('first_name') && <span className="text-red-400">*</span>}
                      </label>
                      <input
                        type="text"
                        required={isFieldRequired('first_name')}
                        value={formData.first_name}
                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                        className="w-full px-3 py-2 text-sm bg-slate-700/80 border border-lime-500/30 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-lime-500 text-white placeholder-slate-400"
                        placeholder="John"
                      />
                    </div>
                  )}

                  {isFieldActive('last_name') && (
                    <div>
                      <label className="block text-xs font-semibold text-lime-200 mb-1">
                        Last Name {isFieldRequired('last_name') && <span className="text-red-400">*</span>}
                      </label>
                      <input
                        type="text"
                        required={isFieldRequired('last_name')}
                        value={formData.last_name}
                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                        className="w-full px-3 py-2 text-sm bg-slate-700/80 border border-lime-500/30 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-lime-500 text-white placeholder-slate-400"
                        placeholder="Doe"
                      />
                    </div>
                  )}
                </div>

                {isFieldActive('email') && (
                  <div>
                    <label className="block text-xs font-semibold text-lime-200 mb-1">
                      Email Address {isFieldRequired('email') && <span className="text-red-400">*</span>}
                    </label>
                    <input
                      type="email"
                      required={isFieldRequired('email')}
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 text-sm bg-slate-700/80 border border-lime-500/30 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-lime-500 text-white placeholder-slate-400"
                      placeholder="john.doe@example.com"
                    />
                  </div>
                )}
              </>
            )}

              {currentStep === 2 && (
                <>
                  <h3 className="text-lg sm:text-xl font-bold text-lime-300 mb-3">Contact Information</h3>

                {isFieldActive('phone') && (
                  <div>
                    <label className="block text-xs font-semibold text-lime-200 mb-1">
                      Phone Number {isFieldRequired('phone') && <span className="text-red-400">*</span>}
                    </label>
                    <input
                      type="tel"
                      required={isFieldRequired('phone')}
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 text-sm bg-slate-700/80 border border-lime-500/30 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-lime-500 text-white placeholder-slate-400"
                      placeholder="+233 123 456 7890"
                    />
                  </div>
                )}

                {isFieldActive('gender') && (
                  <div>
                    <label className="block text-xs font-semibold text-lime-200 mb-1">
                      Gender {isFieldRequired('gender') && <span className="text-red-400">*</span>}
                    </label>
                    <select
                      required={isFieldRequired('gender')}
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="w-full px-3 py-2 text-sm bg-slate-700/80 border border-lime-500/30 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-lime-500 text-white"
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
                    <label className="block text-xs font-semibold text-lime-200 mb-1">
                      Company/Organization {isFieldRequired('organization') && <span className="text-red-400">*</span>}
                    </label>
                    <input
                      type="text"
                      required={isFieldRequired('organization')}
                      value={formData.organization}
                      onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                      className="w-full px-3 py-2 text-sm bg-slate-700/80 border border-lime-500/30 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-lime-500 text-white placeholder-slate-400"
                      placeholder="ABC Corporation"
                    />
                  </div>
                )}

                {isFieldActive('age_group') && (
                  <div>
                    <label className="block text-xs font-semibold text-lime-200 mb-1">
                      Age Group {isFieldRequired('age_group') && <span className="text-red-400">*</span>}
                    </label>
                    <select
                      required={isFieldRequired('age_group')}
                      value={formData.age_group}
                      onChange={(e) => setFormData({ ...formData, age_group: e.target.value })}
                      className="w-full px-3 py-2 text-sm bg-slate-700/80 border border-lime-500/30 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-lime-500 text-white"
                    >
                      <option value="">Select age group</option>
                      <option value="Under 18">Under 18</option>
                      <option value="18-25">18-25</option>
                      <option value="26-35">26-35</option>
                      <option value="36-45">36-45</option>
                      <option value="46-55">46-55</option>
                      <option value="56-65">56-65</option>
                      <option value="65+">65+</option>
                    </select>
                  </div>
                )}
              </>
            )}

              {currentStep === 3 && customFields.length > 0 && (
                <>
                  <h3 className="text-lg sm:text-xl font-bold text-lime-300 mb-3">Additional Information</h3>

                {customFields.map((field: any) => (
                  <div key={field.id}>
                    <label className="block text-xs font-semibold text-lime-200 mb-1">
                      {field.label} {field.required && <span className="text-red-400">*</span>}
                    </label>
                    {renderCustomField(field)}
                  </div>
                ))}
              </>
            )}

              {((currentStep === 3 && customFields.length === 0) || (currentStep === 4 && customFields.length > 0)) && (
                <>
                  <h3 className="text-lg sm:text-xl font-bold text-lime-300 mb-3">Review and Print Your Badge</h3>

                <div className="bg-slate-700/60 backdrop-blur-sm rounded-lg p-2 space-y-2 border border-lime-500/20">
                  {formData.salutation && (
                    <div>
                      <p className="text-[10px] font-semibold text-lime-300 mb-0.5">Salutation</p>
                      <p className="text-xs text-white font-medium">{formData.salutation}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                      <p className="text-[10px] font-semibold text-lime-300 mb-0.5">First Name</p>
                      <p className="text-xs text-white font-medium">{formData.first_name}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-lime-300 mb-0.5">Last Name</p>
                      <p className="text-xs text-white font-medium">{formData.last_name}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-semibold text-lime-300 mb-0.5">Email</p>
                    <p className="text-xs text-white font-medium">{formData.email}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                      <p className="text-[10px] font-semibold text-lime-300 mb-0.5">Phone</p>
                      <p className="text-xs text-white font-medium">{formData.phone}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-lime-300 mb-0.5">Gender</p>
                      <p className="text-xs text-white font-medium">{formData.gender}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-semibold text-lime-300 mb-0.5">Company/Organization</p>
                    <p className="text-xs text-white font-medium">{formData.organization}</p>
                  </div>

                  {formData.age_group && (
                    <div>
                      <p className="text-[10px] font-semibold text-lime-300 mb-0.5">Age Group</p>
                      <p className="text-xs text-white font-medium">{formData.age_group}</p>
                    </div>
                  )}

                  {customFields.length > 0 && Object.keys(customFieldValues).length > 0 && (
                    <>
                      <div className="border-t border-lime-500/30 pt-2 mt-2">
                        <p className="text-xs font-bold text-lime-300 mb-2">Additional Information</p>
                        {customFields.map((field: any) => {
                          const value = customFieldValues[field.id];
                          if (!value) return null;
                          return (
                            <div key={field.id} className="mb-2">
                              <p className="text-[10px] font-semibold text-lime-300 mb-0.5">{field.label}</p>
                              <p className="text-xs text-white font-medium">{value}</p>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              </>
            )}

              <div className="flex gap-3 pt-3">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-base border border-lime-500/30 text-lime-300 rounded-lg hover:bg-lime-500/10 transition-colors font-semibold"
                  >
                    <ChevronLeft size={18} />
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
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-base bg-lime-600 text-white rounded-lg hover:bg-lime-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-lime-600/20"
                  >
                    Next
                    <ChevronRight size={18} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading || !selectedEventId}
                    className="flex-1 px-4 py-3 text-base bg-lime-600 text-white rounded-lg hover:bg-lime-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-lime-600/20"
                  >
                    {loading ? 'Registering...' : 'Complete Registration'}
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="text-center mt-3 text-lime-200 space-y-1">
            <p className="text-xs">Your information is secure and will only be used for event purposes.</p>
            <p className="text-xs text-lime-300">Developed and Built by Asterixify Innovations © 2026</p>
          </div>
        </div>
      </div>
    </div>
  );
}
