import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X, Calendar, MapPin, Image, Users, Palette, ToggleRight } from 'lucide-react';
import { Event } from '../lib/database.types';
import { checkAndPromote } from '../lib/waitlist';

interface EventFormProps {
  event?: Event;
  onClose: () => void;
  onSuccess: () => void;
}

export function EventForm({ event, onClose, onSuccess }: EventFormProps) {
  const [formData, setFormData] = useState({
    name:            '',
    description:     '',
    event_date:      '',
    location:        '',
    event_flyer:     '',
    is_active:       true,
    primary_color:   '',
    secondary_color: '',
    max_attendees:   '',
  });
  const [loading, setLoading]   = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (event) {
      setFormData({
        name:            event.name,
        description:     event.description || '',
        event_date:      event.event_date.split('T')[0],
        location:        event.location || '',
        event_flyer:     event.event_flyer || '',
        is_active:       event.is_active,
        primary_color:   event.primary_color || '',
        secondary_color: event.secondary_color || '',
        max_attendees:   event.max_attendees?.toString() || '',
      });
    }
  }, [event]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const newMax = formData.max_attendees ? parseInt(formData.max_attendees, 10) : null;
    const payload = {
      ...formData,
      primary_color:   formData.primary_color || null,
      secondary_color: formData.secondary_color || null,
      max_attendees:   newMax,
    };

    if (event) {
      const { error } = await supabase.from('events').update(payload).eq('id', event.id);
      setLoading(false);
      if (error) { setErrorMsg(error.message); return; }

      // If capacity was increased, check for waitlist promotions
      const oldMax = event.max_attendees;
      if (newMax && (!oldMax || newMax > oldMax)) {
        await checkAndPromote(event.id);
      }
    } else {
      const { error } = await supabase.from('events').insert([{ ...payload, app_id: 'default_app' }]);
      setLoading(false);
      if (error) { setErrorMsg(error.message); return; }
    }

    onSuccess();
  };

  const field = (label: string) => `block text-sm font-semibold text-slate-700 mb-1.5`;
  const input = `w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white transition-shadow`;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{event ? 'Edit Event' : 'Create New Event'}</h2>
            <p className="text-sm text-slate-400 mt-0.5">{event ? 'Update the details below' : 'Fill in the details to create your event'}</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Scrollable form body */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          <form id="event-form" onSubmit={handleSubmit} className="space-y-6">

            {/* ── Basic Information ── */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-blue-50 p-1.5 rounded-lg"><Calendar size={15} className="text-blue-600" /></div>
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Basic Information</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className={field('name')}>Event Name <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={input}
                    placeholder="e.g. Annual Tech Conference 2026"
                  />
                </div>
                <div>
                  <label className={field('description')}>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className={`${input} resize-none`}
                    rows={3}
                    placeholder="A short description of the event..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={field('event_date')}>Date <span className="text-red-400">*</span></label>
                    <input
                      type="date"
                      required
                      value={formData.event_date}
                      onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                      className={input}
                    />
                  </div>
                  <div>
                    <label className={field('location')}>
                      <span className="flex items-center gap-1"><MapPin size={12} /> Location</span>
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className={input}
                      placeholder="e.g. Convention Centre, Hall A"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100" />

            {/* ── Capacity ── */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-amber-50 p-1.5 rounded-lg"><Users size={15} className="text-amber-600" /></div>
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Capacity</h3>
              </div>
              <div>
                <label className={field('max_attendees')}>Maximum Attendees</label>
                <input
                  type="number"
                  min="1"
                  value={formData.max_attendees}
                  onChange={(e) => setFormData({ ...formData, max_attendees: e.target.value })}
                  className={input}
                  placeholder="Leave blank for unlimited"
                />
                <p className="text-xs text-slate-400 mt-1.5">
                  When the limit is reached, new registrants are offered a waitlist spot and automatically promoted if a place opens up.
                </p>
              </div>
            </div>

            <div className="border-t border-slate-100" />

            {/* ── Appearance ── */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-violet-50 p-1.5 rounded-lg"><Palette size={15} className="text-violet-600" /></div>
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Appearance</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className={field('event_flyer')}>
                    <span className="flex items-center gap-1"><Image size={12} /> Event Flyer URL</span>
                  </label>
                  <input
                    type="url"
                    value={formData.event_flyer}
                    onChange={(e) => setFormData({ ...formData, event_flyer: e.target.value })}
                    className={input}
                    placeholder="https://example.com/flyer.jpg"
                  />
                  <p className="text-xs text-slate-400 mt-1.5">Paste a link to your event flyer or promotional image.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {/* Registration button colour */}
                  <div>
                    <label className={field('primary_color')}>Registration Button Colour</label>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-shrink-0">
                        <input
                          type="color"
                          value={formData.primary_color || '#3b82f6'}
                          onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                          className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer p-1 bg-white"
                        />
                      </div>
                      <input
                        type="text"
                        value={formData.primary_color}
                        onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                        className={`${input} flex-1 font-mono`}
                        placeholder="#3b82f6"
                        maxLength={7}
                      />
                    </div>
                    {formData.primary_color && (
                      <button type="button" onClick={() => setFormData({ ...formData, primary_color: '' })}
                        className="text-xs text-slate-400 hover:text-red-500 transition-colors mt-1">
                        Clear (use default)
                      </button>
                    )}
                  </div>
                  {/* Check-in button colour */}
                  <div>
                    <label className={field('secondary_color')}>Check-In Button Colour</label>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-shrink-0">
                        <input
                          type="color"
                          value={formData.secondary_color || '#3b82f6'}
                          onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                          className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer p-1 bg-white"
                        />
                      </div>
                      <input
                        type="text"
                        value={formData.secondary_color}
                        onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                        className={`${input} flex-1 font-mono`}
                        placeholder="#3b82f6"
                        maxLength={7}
                      />
                    </div>
                    {formData.secondary_color && (
                      <button type="button" onClick={() => setFormData({ ...formData, secondary_color: '' })}
                        className="text-xs text-slate-400 hover:text-red-500 transition-colors mt-1">
                        Clear (use default)
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100" />

            {/* ── Status ── */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-green-50 p-1.5 rounded-lg"><ToggleRight size={15} className="text-green-600" /></div>
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Status</h3>
              </div>
              <label className="flex items-center justify-between cursor-pointer bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Event is Active</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {formData.is_active
                      ? 'Registration and check-in are open'
                      : 'Event is hidden — no registration or check-in allowed'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${formData.is_active ? 'bg-green-500' : 'bg-slate-300'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${formData.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </label>
            </div>

            {errorMsg && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-3">
                <span className="text-red-500 font-bold text-lg leading-none mt-0.5">!</span>
                <p className="text-sm text-red-700">{errorMsg}</p>
              </div>
            )}
          </form>
        </div>

        {/* Sticky footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-slate-100 bg-white flex-shrink-0 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-semibold text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="event-form"
            disabled={loading}
            className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 font-semibold text-sm shadow-sm"
          >
            {loading
              ? (event ? 'Updating...' : 'Creating...')
              : (event ? 'Update Event' : 'Create Event')}
          </button>
        </div>
      </div>
    </div>
  );
}
