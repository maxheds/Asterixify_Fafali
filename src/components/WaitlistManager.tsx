import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { WaitlistEntry } from '../lib/database.types';
import { Clock, Trash2, Users, AlertTriangle } from 'lucide-react';

interface WaitlistManagerProps {
  eventId: string;
}

export function WaitlistManager({ eventId }: WaitlistManagerProps) {
  const [entries, setEntries]         = useState<WaitlistEntry[]>([]);
  const [loading, setLoading]         = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<WaitlistEntry | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    load();
    const sub = supabase
      .channel('waitlist-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'waitlist', filter: `event_id=eq.${eventId}` }, load)
      .subscribe();
    return () => { sub.unsubscribe(); };
  }, [eventId]);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('waitlist')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: true });
    setEntries(data ?? []);
    setLoading(false);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    await supabase.from('waitlist').delete().eq('id', deleteTarget.id);
    setDeleteTarget(null);
    setDeleteLoading(false);
    load();
  };

  if (loading) return <div className="text-center py-8 text-slate-400 text-sm">Loading waitlist...</div>;

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="bg-slate-100 p-4 rounded-2xl mb-3">
          <Users size={32} className="text-slate-300" />
        </div>
        <p className="text-slate-500 font-medium">No one on the waitlist</p>
        <p className="text-slate-400 text-sm mt-1">People will appear here when the event reaches capacity</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="mb-3 flex items-center gap-2">
        <div className="bg-amber-100 p-1.5 rounded-lg">
          <Clock size={14} className="text-amber-600" />
        </div>
        <p className="text-sm text-slate-600">
          <span className="font-semibold text-slate-900">{entries.length}</span> {entries.length === 1 ? 'person' : 'people'} waiting — listed in order of registration
        </p>
      </div>

      <div className="border border-slate-200 rounded-xl overflow-hidden flex-1">
        <div className="overflow-y-auto">
          <table className="w-full border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
              <tr>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-600">#</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-600">Name</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-600">Email</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-600">Phone</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-600">Ticket</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-600">Joined</th>
                <th className="text-right px-3 py-2.5 text-xs font-semibold text-slate-600"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {entries.map((entry, index) => (
                <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-3 py-2.5">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${index === 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                      {index + 1}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <p className="text-sm font-medium text-slate-900">
                      {entry.salutation && `${entry.salutation} `}{entry.first_name} {entry.last_name}
                    </p>
                    {entry.organization && <p className="text-xs text-slate-400">{entry.organization}</p>}
                  </td>
                  <td className="px-3 py-2.5 text-sm text-slate-600">{entry.email}</td>
                  <td className="px-3 py-2.5 text-sm text-slate-600">{entry.phone || '-'}</td>
                  <td className="px-3 py-2.5">
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">{entry.ticket_type || 'Attendee'}</span>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-slate-400">
                    {new Date(entry.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <button
                      onClick={() => setDeleteTarget(entry)}
                      className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Remove from waitlist"
                    >
                      <Trash2 size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <div className="flex flex-col items-center text-center mb-5">
              <div className="bg-red-100 p-4 rounded-full mb-4">
                <AlertTriangle size={28} className="text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-1">Remove from Waitlist</h3>
              <p className="text-slate-500 text-sm">
                Remove <span className="font-semibold text-slate-700">{deleteTarget.first_name} {deleteTarget.last_name}</span> from the waitlist? This cannot be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleteLoading}
                className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-semibold text-sm"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteLoading}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-semibold text-sm disabled:opacity-50"
              >
                {deleteLoading ? 'Removing...' : 'Yes, Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
