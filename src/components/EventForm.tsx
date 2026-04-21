import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X } from 'lucide-react';
import { Event } from '../lib/database.types';

interface EventFormProps {
  event?: Event;
  onClose: () => void;
  onSuccess: () => void;
}

export function EventForm({ event, onClose, onSuccess }: EventFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    event_date: '',
    location: '',
    event_flyer: '',
    is_active: true,
    primary_color: '',
    secondary_color: '',
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (event) {
      setFormData({
        name: event.name,
        description: event.description || '',
        event_date: event.event_date.split('T')[0],
        location: event.location || '',
        event_flyer: event.event_flyer || '',
        is_active: event.is_active,
        primary_color: event.primary_color || '',
        secondary_color: (event as any).secondary_color || '',
      });
    }
  }, [event]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      ...formData,
      primary_color: formData.primary_color || null,
      secondary_color: formData.secondary_color || null,
    };

    setErrorMsg(null);

    if (event) {
      const { error } = await supabase
        .from('events')
        .update(payload)
        .eq('id', event.id);

      setLoading(false);
      if (error) {
        setErrorMsg(error.message);
      } else {
        onSuccess();
      }
    } else {
      const { error } = await supabase
        .from('events')
        .insert([{ ...payload, app_id: 'default_app' }]);

      setLoading(false);
      if (error) {
        setErrorMsg(error.message);
      } else {
        onSuccess();
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900">{event ? 'Edit Event' : 'Create New Event'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Event Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              placeholder="Annual Tech Conference"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              rows={3}
              placeholder="Event description..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Date</label>
            <input
              type="date"
              required
              value={formData.event_date}
              onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              placeholder="Convention Center, Hall A"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Event Flyer URL</label>
            <input
              type="url"
              value={formData.event_flyer}
              onChange={(e) => setFormData({ ...formData, event_flyer: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              placeholder="https://example.com/flyer.jpg or use Pexels link"
            />
            <p className="text-xs text-slate-500 mt-1">Add a link to your event flyer or promotional image</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Button Colour</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={formData.primary_color || '#000000'}
                onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                className="w-12 h-10 rounded-lg border border-slate-300 cursor-pointer p-1"
              />
              <input
                type="text"
                value={formData.primary_color}
                onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent font-mono text-sm"
                placeholder="#000000 (leave blank for frosted glass)"
              />
              {formData.primary_color && (
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, primary_color: '' })}
                  className="text-xs text-slate-500 hover:text-red-500 transition-colors whitespace-nowrap"
                >
                  Clear
                </button>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">Pick a colour for the Registration button. Leave blank to use the default frosted glass style.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Check-In Button Colour</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={formData.secondary_color || '#000000'}
                onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                className="w-12 h-10 rounded-lg border border-slate-300 cursor-pointer p-1"
              />
              <input
                type="text"
                value={formData.secondary_color}
                onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent font-mono text-sm"
                placeholder="#000000 (leave blank for frosted glass)"
              />
              {formData.secondary_color && (
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, secondary_color: '' })}
                  className="text-xs text-slate-500 hover:text-red-500 transition-colors whitespace-nowrap"
                >
                  Clear
                </button>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">Pick a colour for the Check-In button. Leave blank to use the default frosted glass style.</p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-5 h-5 rounded border-slate-300 text-green-600 focus:ring-green-600"
              />
              <div>
                <span className="text-sm font-medium text-slate-900">Event is Active</span>
                <p className="text-xs text-slate-600 mt-0.5">
                  {formData.is_active
                    ? 'This event is active and available for check-ins'
                    : 'This event is inactive - no check-ins allowed'}
                </p>
              </div>
            </label>
          </div>

          {errorMsg && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-start gap-3">
              <span className="text-red-500 font-bold text-lg leading-none mt-0.5">!</span>
              <p className="text-sm text-red-700">{errorMsg}</p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
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
              {loading ? (event ? 'Updating...' : 'Creating...') : (event ? 'Update Event' : 'Create Event')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
