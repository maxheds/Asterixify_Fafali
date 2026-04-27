import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { X, Plus, GripVertical, Trash2, Lock } from 'lucide-react';

interface FormField {
  id: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'textarea' | 'select' | 'number' | 'date';
  required: boolean;
  active: boolean;
  options?: string[];
  placeholder?: string;
  isDefault?: boolean;
}

interface FormFieldEditorProps {
  eventId: string;
  currentFields: FormField[];
  onClose: () => void;
  onSuccess: () => void;
}

const DEFAULT_FIELDS: FormField[] = [
  { id: 'first_name', label: 'First Name', type: 'text', required: true, active: true, placeholder: 'John', isDefault: true },
  { id: 'last_name', label: 'Last Name', type: 'text', required: true, active: true, placeholder: 'Doe', isDefault: true },
  { id: 'email', label: 'Email', type: 'email', required: true, active: true, placeholder: 'john@example.com', isDefault: true },
  { id: 'phone', label: 'Phone', type: 'tel', required: true, active: true, placeholder: '0244000000', isDefault: true },
  { id: 'gender', label: 'Gender', type: 'select', required: true, active: true, options: ['Male', 'Female'], isDefault: true },
  { id: 'organization', label: 'Company/Organization', type: 'text', required: true, active: true, placeholder: 'ABC Corporation', isDefault: true },
  { id: 'age_group', label: 'Age Group', type: 'select', required: false, active: true, options: ['Under 18', '18-25', '26-35', '36-45', '46-55', '56-65', '65+'], isDefault: true },
  { id: 'ticket_type', label: 'Ticket Type', type: 'select', required: false, active: true, options: ['Attendee', 'Event Organiser', 'Media', 'Waiter', 'Security'], isDefault: true },
];

export function FormFieldEditor({ eventId, currentFields, onClose, onSuccess }: FormFieldEditorProps) {
  const [defaultFields, setDefaultFields] = useState<FormField[]>(() => {
    return DEFAULT_FIELDS.map(df => {
      const existing = currentFields.find(f => f.id === df.id);
      return existing ? { ...df, label: existing.label ?? df.label, active: existing.active ?? true, required: existing.required ?? df.required, placeholder: existing.placeholder ?? df.placeholder } : df;
    });
  });
  const [customFields, setCustomFields] = useState<FormField[]>(
    currentFields.filter(f => !DEFAULT_FIELDS.find(df => df.id === f.id))
  );
  const [loading, setLoading] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [draggedType, setDraggedType] = useState<'default' | 'custom' | null>(null);

  const addCustomField = () => {
    setCustomFields([
      ...customFields,
      {
        id: `custom_field_${Date.now()}`,
        label: 'New Custom Field',
        type: 'text',
        required: false,
        active: true,
        placeholder: '',
        isDefault: false,
      },
    ]);
  };

  const updateDefaultField = (id: string, updates: Partial<FormField>) => {
    setDefaultFields(defaultFields.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  };

  const updateCustomField = (id: string, updates: Partial<FormField>) => {
    setCustomFields(customFields.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  };

  const removeCustomField = (id: string) => {
    setCustomFields(customFields.filter((f) => f.id !== id));
  };

  const handleDragStart = (index: number, type: 'default' | 'custom') => {
    setDraggedIndex(index);
    setDraggedType(type);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (dropIndex: number, dropType: 'default' | 'custom') => {
    if (draggedIndex === null || draggedType === null) return;

    if (draggedType === 'default' && dropType === 'default') {
      const newFields = [...defaultFields];
      const [removed] = newFields.splice(draggedIndex, 1);
      newFields.splice(dropIndex, 0, removed);
      setDefaultFields(newFields);
    } else if (draggedType === 'custom' && dropType === 'custom') {
      const newFields = [...customFields];
      const [removed] = newFields.splice(draggedIndex, 1);
      newFields.splice(dropIndex, 0, removed);
      setCustomFields(newFields);
    }

    setDraggedIndex(null);
    setDraggedType(null);
  };

  const handleSave = async () => {
    setLoading(true);

    const allFields = [...defaultFields, ...customFields];

    const { error } = await supabase
      .from('events')
      .update({ custom_fields: allFields })
      .eq('id', eventId);

    setLoading(false);

    if (!error) {
      onSuccess();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-slate-50">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Registration Form Configuration</h2>
            <p className="text-sm text-slate-600 mt-1">Customize all form fields for this event</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Lock size={20} className="text-blue-600" />
              <h3 className="text-lg font-bold text-slate-900">Default Fields</h3>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              These are the core fields included in every registration form. You cannot delete them, but you can edit their labels, required setting, and placeholder text.
            </p>
            <div className="space-y-3">
              {defaultFields.map((field, index) => (
                <div
                  key={field.id}
                  draggable
                  onDragStart={() => handleDragStart(index, 'default')}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(index, 'default')}
                  className={`border-2 rounded-lg p-4 transition-colors cursor-move ${
                    field.active ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-300 opacity-60'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="pt-2 text-blue-400 cursor-grab active:cursor-grabbing">
                      <GripVertical size={20} />
                    </div>

                    <div className="flex-1">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Field Label</label>
                          <input
                            type="text"
                            value={field.label}
                            onChange={(e) => updateDefaultField(field.id, { label: e.target.value })}
                            className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Field Type</label>
                          <div className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm text-slate-500">
                            {field.type}
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Required</label>
                          <select
                            value={field.required ? 'yes' : 'no'}
                            onChange={(e) => updateDefaultField(field.id, { required: e.target.value === 'yes' })}
                            className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="yes">Yes</option>
                            <option value="no">No</option>
                          </select>
                        </div>
                      </div>

                      {field.type !== 'select' && (
                        <div className="mb-3">
                          <label className="block text-xs font-medium text-slate-700 mb-1">Placeholder</label>
                          <input
                            type="text"
                            value={field.placeholder || ''}
                            onChange={(e) => updateDefaultField(field.id, { placeholder: e.target.value })}
                            className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter placeholder text..."
                          />
                        </div>
                      )}

                      {field.type === 'select' && field.options && (
                        <div className="mb-3">
                          <label className="block text-xs font-medium text-slate-700 mb-1">Options</label>
                          <div className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm">
                            {field.options.join(', ')}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-2 mt-3">
                        <button
                          onClick={() => updateDefaultField(field.id, { active: !field.active })}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            field.active
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                          }`}
                        >
                          {field.active ? 'Active' : 'Inactive'}
                        </button>
                        <span className="text-xs text-slate-600">
                          {field.active ? 'This field will appear in registration' : 'This field is hidden from registration'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-4">
              <Plus size={20} className="text-green-600" />
              <h3 className="text-lg font-bold text-slate-900">Custom Fields</h3>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              Add additional custom fields to collect specific information for your event. These fields are fully customizable.
            </p>

            {customFields.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-lg border-2 border-dashed border-slate-300">
                <Plus size={48} className="text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 mb-4">No custom fields yet</p>
                <button
                  onClick={addCustomField}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Add Your First Custom Field
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {customFields.map((field, index) => (
                  <div
                    key={field.id}
                    draggable
                    onDragStart={() => handleDragStart(index, 'custom')}
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop(index, 'custom')}
                    className={`border-2 rounded-lg p-4 transition-colors cursor-move ${
                      field.active ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-300 opacity-60'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="pt-2 cursor-grab active:cursor-grabbing text-green-400">
                        <GripVertical size={20} />
                      </div>

                      <div className="flex-1 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">Field Label</label>
                            <input
                              type="text"
                              value={field.label}
                              onChange={(e) => updateCustomField(field.id, { label: e.target.value })}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-green-600 focus:border-transparent"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">Field Type</label>
                            <select
                              value={field.type}
                              onChange={(e) => updateCustomField(field.id, { type: e.target.value as any })}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-green-600 focus:border-transparent"
                            >
                              <option value="text">Text</option>
                              <option value="email">Email</option>
                              <option value="tel">Phone</option>
                              <option value="number">Number</option>
                              <option value="date">Date</option>
                              <option value="textarea">Long Text</option>
                              <option value="select">Dropdown</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Placeholder</label>
                          <input
                            type="text"
                            value={field.placeholder || ''}
                            onChange={(e) => updateCustomField(field.id, { placeholder: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-green-600 focus:border-transparent"
                          />
                        </div>

                        {field.type === 'select' && (
                          <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">
                              Options (comma-separated)
                            </label>
                            <input
                              type="text"
                              value={field.options?.join(', ') || ''}
                              onChange={(e) =>
                                updateCustomField(field.id, {
                                  options: e.target.value.split(',').map((o) => o.trim()),
                                })
                              }
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-green-600 focus:border-transparent"
                              placeholder="Option 1, Option 2, Option 3"
                            />
                          </div>
                        )}

                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={(e) => updateCustomField(field.id, { required: e.target.checked })}
                            className="rounded border-slate-300 text-green-600 focus:ring-green-600"
                          />
                          <span className="text-sm text-slate-700">Required field</span>
                        </label>

                        <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                          <button
                            onClick={() => updateCustomField(field.id, { active: !field.active })}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                              field.active
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                            }`}
                          >
                            {field.active ? 'Active' : 'Inactive'}
                          </button>
                          <span className="text-xs text-slate-600">
                            {field.active ? 'This field will appear in registration' : 'This field is hidden from registration'}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => removeCustomField(field.id)}
                        className="pt-2 text-red-600 hover:text-red-700 transition-colors"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  onClick={addCustomField}
                  className="w-full px-4 py-3 border-2 border-dashed border-green-300 rounded-lg text-green-600 hover:border-green-600 hover:bg-green-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus size={20} />
                  Add Another Custom Field
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 p-6 border-t border-slate-200 bg-slate-50">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Form Configuration'}
          </button>
        </div>
      </div>
    </div>
  );
}
