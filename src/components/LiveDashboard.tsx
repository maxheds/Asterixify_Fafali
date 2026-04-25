import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Users, UserCheck, Clock, TrendingUp } from 'lucide-react';

interface LiveDashboardProps {
  eventId: string;
  eventName: string;
}

interface ArrivalBucket {
  label: string;
  hour: number;
  count: number;
}

function parseHour(label: string): number {
  const match = label.match(/(\d+)\s*(AM|PM)/i);
  if (!match) return 0;
  let h = parseInt(match[1]);
  if (match[2].toUpperCase() === 'PM' && h !== 12) h += 12;
  if (match[2].toUpperCase() === 'AM' && h === 12) h = 0;
  return h;
}

export function LiveDashboard({ eventId, eventName }: LiveDashboardProps) {
  const [total, setTotal] = useState(0);
  const [checkedIn, setCheckedIn] = useState(0);
  const [arrivals, setArrivals] = useState<ArrivalBucket[]>([]);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    loadData();
    const sub = supabase
      .channel('dashboard-' + eventId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendees', filter: `event_id=eq.${eventId}` }, loadData)
      .subscribe();
    return () => { sub.unsubscribe(); };
  }, [eventId]);

  const loadData = async () => {
    const { data } = await supabase
      .from('attendees')
      .select('checked_in, checked_in_at')
      .eq('event_id', eventId);

    if (!data) return;

    setTotal(data.length);
    const ci = data.filter(a => a.checked_in);
    setCheckedIn(ci.length);
    setLastUpdated(new Date());

    const buckets: Record<string, { label: string; hour: number; count: number }> = {};
    ci.filter(a => a.checked_in_at).forEach(a => {
      const d = new Date(a.checked_in_at!);
      const label = d.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
      if (!buckets[label]) buckets[label] = { label, hour: parseHour(label), count: 0 };
      buckets[label].count++;
    });

    const sorted = Object.values(buckets).sort((a, b) => a.hour - b.hour);
    setArrivals(sorted);
  };

  const rate = total > 0 ? Math.round((checkedIn / total) * 100) : 0;
  const pending = total - checkedIn;
  const maxCount = arrivals.length > 0 ? Math.max(...arrivals.map(a => a.count)) : 1;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Live Dashboard</h3>
          <p className="text-sm text-slate-500 mt-0.5">{eventName}</p>
        </div>
        <span className="text-xs text-slate-400">
          Updated {lastUpdated.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={<Users size={20} className="text-blue-600" />} label="Registered" value={total} bg="bg-blue-50 border-blue-100" />
        <StatCard icon={<UserCheck size={20} className="text-green-600" />} label="Checked In" value={checkedIn} bg="bg-green-50 border-green-100" />
        <StatCard icon={<Clock size={20} className="text-amber-600" />} label="Pending" value={pending} bg="bg-amber-50 border-amber-100" />
        <StatCard icon={<TrendingUp size={20} className="text-purple-600" />} label="Attendance Rate" value={`${rate}%`} bg="bg-purple-50 border-purple-100" />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex justify-between text-sm font-medium text-slate-700 mb-3">
          <span>Check-in Progress</span>
          <span>{checkedIn} / {total}</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-4">
          <div
            className="bg-green-500 h-4 rounded-full transition-all duration-700 flex items-center justify-end pr-2"
            style={{ width: `${Math.max(rate, rate > 0 ? 8 : 0)}%` }}
          >
            {rate >= 10 && <span className="text-white text-xs font-bold">{rate}%</span>}
          </div>
        </div>
        {rate < 10 && rate > 0 && (
          <p className="text-right text-xs text-green-600 font-semibold mt-1">{rate}%</p>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h4 className="text-sm font-semibold text-slate-700 mb-5">Arrivals by Hour</h4>
        {arrivals.length === 0 ? (
          <div className="flex items-center justify-center h-24 text-slate-400 text-sm">
            No check-ins recorded yet
          </div>
        ) : (
          <div className="flex items-end gap-3" style={{ height: '140px' }}>
            {arrivals.map(bucket => (
              <div key={bucket.label} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                <span className="text-xs font-semibold text-slate-600">{bucket.count}</span>
                <div
                  className="w-full bg-blue-500 rounded-t-md transition-all duration-500 min-h-[4px]"
                  style={{ height: `${Math.max(4, Math.round((bucket.count / maxCount) * 100))}px` }}
                />
                <span className="text-xs text-slate-400 truncate w-full text-center">{bucket.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, bg }: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  bg: string;
}) {
  return (
    <div className={`${bg} border rounded-xl p-4 flex items-center gap-3`}>
      <div className="flex-shrink-0">{icon}</div>
      <div>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <p className="text-xs text-slate-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}
