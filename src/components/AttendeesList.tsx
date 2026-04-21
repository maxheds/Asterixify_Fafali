import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Attendee, Event } from '../lib/database.types';
import { Search, CheckCircle2, Circle, Plus, Trash2, Printer, Edit2, RefreshCw, ChevronLeft, ChevronRight, Bell } from 'lucide-react';
import { AddAttendeeForm } from './AddAttendeeForm';
import { Badge } from './Badge';
import { sendCheckInEmail, sendRegistrationEmail } from '../lib/emailService';
import { sendCheckInSMS, sendRegistrationSMS, isEmailEnabled } from '../lib/smsService';

interface AttendeesListProps {
  eventId: string;
}

export function AttendeesList({ eventId }: AttendeesListProps) {
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [filteredAttendees, setFilteredAttendees] = useState<Attendee[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<Event | null>(null);
  const [selectedAttendee, setSelectedAttendee] = useState<Attendee | null>(null);
  const [showBadge, setShowBadge] = useState(false);
  const [editingAttendee, setEditingAttendee] = useState<Attendee | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 50;

  // Resend modal state
  const [resendTarget, setResendTarget] = useState<Attendee | null>(null);
  const [resendEmail, setResendEmail] = useState(true);
  const [resendSMS, setResendSMS] = useState(true);
  const [resendSending, setResendSending] = useState(false);
  const [resendDone, setResendDone] = useState('');

  useEffect(() => {
    loadEvent();
    loadAttendees();

    const subscription = supabase
      .channel('attendees-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendees', filter: `event_id=eq.${eventId}` }, () => {
        loadAttendees();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [eventId]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredAttendees(attendees);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredAttendees(
        attendees.filter(
          (a) =>
            a.first_name.toLowerCase().includes(query) ||
            a.last_name.toLowerCase().includes(query) ||
            a.email.toLowerCase().includes(query)
        )
      );
    }
    setCurrentPage(1);
  }, [searchQuery, attendees]);

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

  const DEFAULT_FIELD_IDS = ['first_name','last_name','email','phone','gender','organization'];

  const getActiveFields = () => {
    if (!event || !event.custom_fields) return [];
    return event.custom_fields.filter((f: any) => f.active !== false);
  };

  const isFieldActive = (fieldId: string) => {
    const activeFields = getActiveFields();
    if (activeFields.length === 0) return true;
    return activeFields.some((f: any) => f.id === fieldId);
  };

  const getActiveCustomFields = () => {
    if (!event || !event.custom_fields) return [];
    return event.custom_fields.filter((f: any) => f.active !== false && !DEFAULT_FIELD_IDS.includes(f.id));
  };

  const showBadgePreview = (attendee: Attendee) => {
    setSelectedAttendee(attendee);
    setShowBadge(true);
  };

  const printBadgeInNewWindow = () => {
    const badgeElement = document.getElementById('badgePrintArea');
    if (!badgeElement) {
      alert('Badge preview not found. Please try again.');
      return;
    }

    const badgeHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Print Badge</title>
          <style>
            @page {
              size: 80mm 60mm;
              margin: 0;
            }

            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }

            html, body {
              width: 80mm;
              height: 60mm;
              margin: 0;
              padding: 0;
              overflow: hidden;
              background: white;
              display: flex;
              align-items: center;
              justify-content: center;
            }

            #badgePrintArea {
              width: 80mm;
              height: 60mm;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 0;
            }

            #badgePrintArea > div {
              width: 80mm;
              height: 60mm;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
            }

            .bg-white {
              background-color: white;
            }

            .border-4 {
              border-width: 4px;
            }

            .border-blue-600 {
              border-color: #2563eb;
            }

            .rounded-xl {
              border-radius: 10px;
            }

            .p-6 {
              padding: 3mm;
            }

            .w-full {
              width: 100%;
              height: 100%;
            }

            .shadow-2xl {
              box-shadow: none;
            }

            .text-center {
              text-align: center;
              word-wrap: break-word;
              overflow-wrap: break-word;
              max-width: 100%;
            }

            .mb-4 {
              margin-bottom: 2mm;
            }

            .text-3xl {
              font-size: 14pt;
              line-height: 16pt;
              max-width: 70mm;
            }

            .font-bold {
              font-weight: 700;
            }

            .text-slate-900 {
              color: #0f172a;
            }

            .mb-2 {
              margin-bottom: 1mm;
            }

            .text-xl {
              font-size: 11pt;
              line-height: 13pt;
              max-width: 70mm;
            }

            .text-slate-600 {
              color: #475569;
            }

            .font-medium {
              font-weight: 500;
            }

            .flex {
              display: flex;
            }

            .flex-col {
              flex-direction: column;
            }

            .items-center {
              align-items: center;
            }

            .justify-center {
              justify-content: center;
            }

            .text-xs {
              font-size: 8pt;
              line-height: 10pt;
            }

            .text-slate-500 {
              color: #64748b;
            }

            .mb-1 {
              margin-bottom: 0.5mm;
            }

            .w-48 {
              width: 36mm;
              height: 36mm;
            }

            .h-48 {
              width: 36mm;
              height: 36mm;
            }

            .hidden {
              display: none;
            }
          </style>
        </head>
        <body>
          ${badgeElement.outerHTML}
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      alert('Please allow popups for this site to print badges');
      return;
    }

    printWindow.document.write(badgeHTML);
    printWindow.document.close();

    printWindow.onload = () => {
      const images = printWindow.document.images;
      let loadedImages = 0;

      const checkAllImagesLoaded = () => {
        loadedImages++;
        if (loadedImages === images.length) {
          setTimeout(() => {
            printWindow.print();
            printWindow.onafterprint = () => printWindow.close();
          }, 100);
        }
      };

      if (images.length === 0) {
        setTimeout(() => {
          printWindow.print();
          printWindow.onafterprint = () => printWindow.close();
        }, 100);
      } else {
        Array.from(images).forEach(img => {
          if (img.complete) {
            checkAllImagesLoaded();
          } else {
            img.onload = checkAllImagesLoaded;
            img.onerror = checkAllImagesLoaded;
          }
        });
      }
    };
  };

  const loadAttendees = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('attendees')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setAttendees(data);
      setFilteredAttendees(data);
    }
    setLoading(false);
  };

  const deleteAttendee = async (attendeeId: string) => {
    if (!confirm('Are you sure you want to delete this attendee?')) return;

    await supabase
      .from('attendees')
      .delete()
      .eq('id', attendeeId);

    loadAttendees();
  };

  const toggleCheckIn = async (attendee: Attendee) => {
    const newStatus = !attendee.checked_in;

    const { error } = await supabase
      .from('attendees')
      .update({
        checked_in: newStatus,
        checked_in_at: newStatus ? new Date().toISOString() : null,
        checked_in_by: newStatus ? 'Admin' : '',
      })
      .eq('id', attendee.id);

    if (!error) {
      if (newStatus && event) {
        const checkedInAt = new Date().toLocaleString('en-US', {
          weekday: 'long', year: 'numeric', month: 'long',
          day: 'numeric', hour: 'numeric', minute: '2-digit',
        });
        const emailOn = await isEmailEnabled();
        await Promise.all([
          emailOn
            ? sendCheckInEmail({
                salutation: attendee.salutation || '',
                first_name: attendee.first_name,
                last_name: attendee.last_name,
                to_email: attendee.email,
                event_name: event.name,
                checked_in_at: checkedInAt,
              })
            : Promise.resolve(),
          sendCheckInSMS({
            first_name: attendee.first_name,
            phone: attendee.phone || '',
            event_name: event.name,
            checked_in_at: checkedInAt,
          }),
        ]);
      }
      loadAttendees();
    }
  };

  const resendNotification = async (attendee: Attendee, sendEmailFlag: boolean, sendSMSFlag: boolean) => {
    if (!event) return;
    const eventDate = new Date(event.event_date).toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
    const emailOn = await isEmailEnabled();
    const tasks: Promise<any>[] = [];
    if (sendEmailFlag && emailOn) {
      tasks.push(sendRegistrationEmail({
        salutation: attendee.salutation || '',
        first_name: attendee.first_name,
        last_name: attendee.last_name,
        to_email: attendee.email,
        event_name: event.name,
        event_date: eventDate,
        event_location: event.location || 'TBA',
      }));
    }
    if (sendSMSFlag) {
      tasks.push(sendRegistrationSMS({
        first_name: attendee.first_name,
        phone: attendee.phone || '',
        event_name: event.name,
        event_date: eventDate,
        event_location: event.location || 'TBA',
      }));
    }
    await Promise.all(tasks);
  };

  const saveEdit = async (attendee: Attendee) => {
    const { error } = await supabase
      .from('attendees')
      .update({
        salutation: attendee.salutation,
        first_name: attendee.first_name,
        last_name: attendee.last_name,
        email: attendee.email,
        phone: attendee.phone,
        gender: attendee.gender,
        organization: attendee.organization,
        ticket_type: attendee.ticket_type,
      })
      .eq('id', attendee.id);

    if (!error) {
      setEditingAttendee(null);
      loadAttendees();
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-slate-600">Loading attendees...</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 mb-4">
        <div className="relative">
          <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search attendees by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
          />
        </div>
        <div className="mt-4 flex gap-3">
          <button
            onClick={() => setShowAddForm(true)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={18} />
            Add Attendee
          </button>
          <button
            onClick={loadAttendees}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50"
            title="Refresh attendees list"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        {filteredAttendees.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            {searchQuery ? 'No attendees found matching your search.' : 'No attendees yet. Import or add attendees to get started.'}
          </div>
        ) : (() => {
          const totalPages = Math.ceil(filteredAttendees.length / PAGE_SIZE);
          const pageAttendees = filteredAttendees.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
          return (
          <div className="border border-slate-200 rounded-lg overflow-hidden flex flex-col flex-1">
            <div className="overflow-y-auto flex-1">
              <table className="w-full border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                  <tr>
                    {(isFieldActive('first_name') || isFieldActive('last_name')) && (
                      <th className="text-left px-2 py-2 text-xs font-semibold text-slate-700 bg-slate-50 max-w-[140px]">Name</th>
                    )}
                    {isFieldActive('email') && (
                      <th className="text-left px-2 py-2 text-xs font-semibold text-slate-700 bg-slate-50 max-w-[160px]">Email</th>
                    )}
                    {isFieldActive('phone') && (
                      <th className="text-left px-2 py-2 text-xs font-semibold text-slate-700 bg-slate-50 max-w-[100px]">Phone</th>
                    )}
                    {isFieldActive('gender') && (
                      <th className="text-left px-2 py-2 text-xs font-semibold text-slate-700 bg-slate-50 max-w-[70px]">Gender</th>
                    )}
                    {isFieldActive('organization') && (
                      <th className="text-left px-2 py-2 text-xs font-semibold text-slate-700 bg-slate-50 max-w-[100px]">Organization</th>
                    )}
                    {getActiveCustomFields().map((field: any) => (
                      <th key={field.id} className="text-left px-2 py-2 text-xs font-semibold text-slate-700 bg-slate-50 max-w-[120px]">{field.label}</th>
                    ))}
                    <th className="text-left px-2 py-2 text-xs font-semibold text-slate-700 bg-slate-50 max-w-[80px]">Ticket</th>
                    <th className="text-left px-2 py-2 text-xs font-semibold text-slate-700 bg-slate-50 max-w-[80px]">Status</th>
                    <th className="text-right px-2 py-2 text-xs font-semibold text-slate-700 bg-slate-50 max-w-[100px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {pageAttendees.map((attendee) => (
                    <tr key={attendee.id} className="hover:bg-slate-50 transition-colors">
                      {(isFieldActive('first_name') || isFieldActive('last_name')) && (
                        <td className="px-2 py-2 max-w-[140px]">
                          <div className="font-medium text-slate-900 text-sm truncate" title={`${attendee.salutation || ''} ${attendee.first_name} ${attendee.last_name}`.trim()}>
                            {attendee.salutation && `${attendee.salutation} `}{attendee.first_name} {attendee.last_name}
                          </div>
                        </td>
                      )}
                      {isFieldActive('email') && (
                        <td className="px-2 py-2 text-slate-600 text-sm max-w-[160px] truncate" title={attendee.email}>{attendee.email}</td>
                      )}
                      {isFieldActive('phone') && (
                        <td className="px-2 py-2 text-slate-600 text-sm max-w-[100px] truncate" title={attendee.phone || '-'}>{attendee.phone || '-'}</td>
                      )}
                      {isFieldActive('gender') && (
                        <td className="px-2 py-2 text-slate-600 text-sm max-w-[70px] truncate">{attendee.gender || '-'}</td>
                      )}
                      {isFieldActive('organization') && (
                        <td className="px-2 py-2 text-slate-600 text-sm max-w-[100px] truncate" title={attendee.organization || '-'}>
                          {attendee.organization || '-'}
                        </td>
                      )}
                      {getActiveCustomFields().map((field: any) => (
                        <td key={field.id} className="px-2 py-2 text-slate-600 text-sm max-w-[120px] truncate" title={(attendee as any).form_data?.[field.id] || '-'}>
                          {(attendee as any).form_data?.[field.id] || '-'}
                        </td>
                      ))}
                      <td className="px-2 py-2 max-w-[80px]">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs inline-block truncate max-w-full" title={attendee.ticket_type}>
                          {attendee.ticket_type}
                        </span>
                      </td>
                      <td className="px-2 py-2 max-w-[80px]">
                        {attendee.checked_in ? (
                          <span className="flex items-center gap-1 text-green-600 text-xs">
                            <CheckCircle2 size={12} />
                            <span className="truncate">Checked In</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-slate-400 text-xs">
                            <Circle size={12} />
                            <span className="truncate">Pending</span>
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-2 max-w-[100px]">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => { setResendTarget(attendee); setResendEmail(true); setResendSMS(true); setResendDone(''); }}
                            className="p-1 text-violet-600 hover:bg-violet-50 rounded transition-colors"
                            title="Resend notification"
                          >
                            <Bell size={12} />
                          </button>
                          <button
                            onClick={() => showBadgePreview(attendee)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Print Badge"
                          >
                            <Printer size={12} />
                          </button>
                          <button
                            onClick={() => setEditingAttendee(attendee)}
                            className="p-1 text-slate-600 hover:bg-slate-50 rounded transition-colors"
                            title="Edit Attendee"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            onClick={() => toggleCheckIn(attendee)}
                            className={`p-1 rounded transition-colors ${
                              attendee.checked_in
                                ? 'text-red-600 hover:bg-red-50'
                                : 'text-green-600 hover:bg-green-50'
                            }`}
                            title={attendee.checked_in ? 'Check Out' : 'Check In'}
                          >
                            {attendee.checked_in ? <Circle size={12} /> : <CheckCircle2 size={12} />}
                          </button>
                          <button
                            onClick={() => deleteAttendee(attendee.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete Attendee"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50 flex-shrink-0">
                <span className="text-xs text-slate-500">
                  Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredAttendees.length)} of {filteredAttendees.length}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-xs font-medium text-slate-700 px-2">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
          );
        })()}
      </div>

      {showAddForm && (
        <AddAttendeeForm
          eventId={eventId}
          event={event}
          onClose={() => setShowAddForm(false)}
          onSuccess={() => {
            setShowAddForm(false);
            loadAttendees();
          }}
        />
      )}

      {editingAttendee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-slate-900 mb-6">Edit Attendee</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Salutation</label>
                <select
                  value={editingAttendee.salutation || ''}
                  onChange={(e) => setEditingAttendee({ ...editingAttendee, salutation: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
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
              {(isFieldActive('first_name') || isFieldActive('last_name')) && (
                <div className="grid grid-cols-2 gap-4">
                  {isFieldActive('first_name') && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">First Name</label>
                      <input
                        type="text"
                        value={editingAttendee.first_name}
                        onChange={(e) => setEditingAttendee({ ...editingAttendee, first_name: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      />
                    </div>
                  )}
                  {isFieldActive('last_name') && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Last Name</label>
                      <input
                        type="text"
                        value={editingAttendee.last_name}
                        onChange={(e) => setEditingAttendee({ ...editingAttendee, last_name: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      />
                    </div>
                  )}
                </div>
              )}
              {isFieldActive('email') && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={editingAttendee.email}
                    onChange={(e) => setEditingAttendee({ ...editingAttendee, email: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  />
                </div>
              )}
              {isFieldActive('phone') && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={editingAttendee.phone || ''}
                    onChange={(e) => setEditingAttendee({ ...editingAttendee, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  />
                </div>
              )}
              {isFieldActive('gender') && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Gender</label>
                  <select
                    value={editingAttendee.gender || ''}
                    onChange={(e) => setEditingAttendee({ ...editingAttendee, gender: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
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
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Organization</label>
                  <input
                    type="text"
                    value={editingAttendee.organization || ''}
                    onChange={(e) => setEditingAttendee({ ...editingAttendee, organization: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Ticket Type</label>
                <input
                  type="text"
                  value={editingAttendee.ticket_type || ''}
                  onChange={(e) => setEditingAttendee({ ...editingAttendee, ticket_type: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => saveEdit(editingAttendee)}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                Save Changes
              </button>
              <button
                onClick={() => setEditingAttendee(null)}
                className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {resendTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Resend Notification</h3>
            <p className="text-sm text-slate-500 mb-4">
              To: <span className="font-medium text-slate-700">{resendTarget.first_name} {resendTarget.last_name}</span>
            </p>

            <div className="space-y-3 mb-5">
              <label className="flex items-center gap-3 cursor-pointer bg-slate-50 border border-slate-200 rounded-lg p-3">
                <input
                  type="checkbox"
                  checked={resendEmail}
                  onChange={(e) => setResendEmail(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-600"
                />
                <div>
                  <p className="text-sm font-medium text-slate-900">Send Email</p>
                  <p className="text-xs text-slate-500">{resendTarget.email}</p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer bg-slate-50 border border-slate-200 rounded-lg p-3">
                <input
                  type="checkbox"
                  checked={resendSMS}
                  onChange={(e) => setResendSMS(e.target.checked)}
                  className="w-4 h-4 text-green-600 border-slate-300 rounded focus:ring-2 focus:ring-green-600"
                />
                <div>
                  <p className="text-sm font-medium text-slate-900">Send SMS</p>
                  <p className="text-xs text-slate-500">{resendTarget.phone || 'No phone number on record'}</p>
                </div>
              </label>
            </div>

            {resendDone && (
              <div className="mb-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                {resendDone}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setResendTarget(null)}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                disabled={resendSending || (!resendEmail && !resendSMS)}
                onClick={async () => {
                  setResendSending(true);
                  await resendNotification(resendTarget, resendEmail, resendSMS);
                  setResendSending(false);
                  const parts = [];
                  if (resendEmail) parts.push('email');
                  if (resendSMS) parts.push('SMS');
                  setResendDone(`${parts.join(' & ')} sent successfully.`);
                  setTimeout(() => setResendTarget(null), 2000);
                }}
                className="flex-1 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50 text-sm font-semibold"
              >
                {resendSending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showBadge && selectedAttendee && event && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full">
            <div className="mb-6 text-center">
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Badge Preview</h3>
              <p className="text-slate-600">Click print to generate the badge</p>
            </div>
            <div className="flex justify-center mb-6">
              <div id="badgePrintArea">
                <Badge attendee={selectedAttendee} event={event} />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={printBadgeInNewWindow}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                <Printer size={20} />
                Print Badge
              </button>
              <button
                onClick={() => {
                  setShowBadge(false);
                  setSelectedAttendee(null);
                }}
                className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
