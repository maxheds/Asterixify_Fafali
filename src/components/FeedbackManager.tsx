import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Event, FeedbackQuestion, FeedbackResponse } from '../lib/database.types';
import { Plus, Star, Trash2, CheckCircle2, AlertCircle, Send, ToggleLeft, ToggleRight } from 'lucide-react';
import { sendBulkSMS } from '../lib/smsService';

type QuestionSummary =
  | { type: 'rating'; avg: string; count: number }
  | { type: 'yesno'; yes: number; no: number; pct: number; count: number }
  | { type: 'text'; responses: string[]; count: number };

export function FeedbackManager() {
  const [questions, setQuestions] = useState<FeedbackQuestion[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [responseEventId, setResponseEventId] = useState('');
  const [responses, setResponses] = useState<FeedbackResponse[]>([]);
  const [loadingQ, setLoadingQ] = useState(true);
  const [loadingR, setLoadingR] = useState(false);

  const [newText, setNewText] = useState('');
  const [newType, setNewType] = useState<'rating' | 'yesno' | 'text'>('rating');
  const [adding, setAdding] = useState(false);

  const [sendEventId, setSendEventId] = useState('');
  const [sendFeedback, setSendFeedback] = useState('');
  const [sendError, setSendError] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => { loadAll(); }, []);

  useEffect(() => {
    if (responseEventId) loadResponses();
  }, [responseEventId]);

  const loadAll = async () => {
    setLoadingQ(true);
    const [qRes, evRes] = await Promise.all([
      supabase.from('feedback_questions').select('*').order('sort_order'),
      supabase.from('events').select('*').order('event_date', { ascending: false }),
    ]);
    setQuestions(qRes.data || []);
    const evs = evRes.data || [];
    setEvents(evs);
    if (evs.length > 0) { setResponseEventId(evs[0].id); setSendEventId(evs[0].id); }
    setLoadingQ(false);
  };

  const loadResponses = async () => {
    setLoadingR(true);
    const { data } = await supabase
      .from('feedback_responses')
      .select('*')
      .eq('event_id', responseEventId);
    setResponses(data || []);
    setLoadingR(false);
  };

  const toggleQuestion = async (q: FeedbackQuestion) => {
    await supabase.from('feedback_questions').update({ is_active: !q.is_active }).eq('id', q.id);
    setQuestions(prev => prev.map(x => x.id === q.id ? { ...x, is_active: !x.is_active } : x));
  };

  const deleteQuestion = async (id: string) => {
    await supabase.from('feedback_questions').delete().eq('id', id);
    setQuestions(prev => prev.filter(q => q.id !== id));
  };

  const addQuestion = async () => {
    if (!newText.trim()) return;
    setAdding(true);
    const maxOrder = questions.length > 0 ? Math.max(...questions.map(q => q.sort_order)) : 0;
    const { data } = await supabase
      .from('feedback_questions')
      .insert({ question_text: newText.trim(), answer_type: newType, sort_order: maxOrder + 1, is_preset: false, app_id: 'default_app' })
      .select()
      .maybeSingle();
    if (data) setQuestions(prev => [...prev, data]);
    setNewText('');
    setAdding(false);
  };

  const handleSendRequests = async () => {
    if (!sendEventId) return;
    setSending(true);
    setSendError('');
    setSendFeedback('');

    const event = events.find(e => e.id === sendEventId);
    if (!event) { setSending(false); return; }

    const { data: attendees } = await supabase
      .from('attendees')
      .select('id, phone, first_name')
      .eq('event_id', sendEventId);

    const withPhones = (attendees || []).filter((a: { phone: string }) => a.phone);
    if (withPhones.length === 0) {
      setSendError('No checked-in attendees with phone numbers found for this event.');
      setSending(false);
      return;
    }

    const baseUrl = window.location.origin;
    let sent = 0;
    for (const att of withPhones as { id: string; phone: string; first_name: string }[]) {
      const msg = `Hi ${att.first_name}! Thanks for attending ${event.name}. Please share your feedback: ${baseUrl}/feedback/${att.id}`;
      await sendBulkSMS([att.phone], msg, () => {});
      sent++;
    }

    setSendFeedback(`Feedback requests sent to ${sent} attendee${sent !== 1 ? 's' : ''}.`);
    setTimeout(() => setSendFeedback(''), 5000);
    setSending(false);
  };

  const getQuestionSummary = (q: FeedbackQuestion): QuestionSummary | null => {
    const qResponses = responses.filter(r => r.question_id === q.id && r.answer_text);
    if (qResponses.length === 0) return null;

    if (q.answer_type === 'rating') {
      const avg = qResponses.reduce((sum, r) => sum + Number(r.answer_text), 0) / qResponses.length;
      return { type: 'rating', avg: avg.toFixed(1), count: qResponses.length };
    }
    if (q.answer_type === 'yesno') {
      const yes = qResponses.filter(r => r.answer_text === 'Yes').length;
      const no = qResponses.length - yes;
      const pct = Math.round((yes / qResponses.length) * 100);
      return { type: 'yesno', yes, no, pct, count: qResponses.length };
    }
    return { type: 'text', responses: qResponses.map(r => r.answer_text), count: qResponses.length };
  };

  if (loadingQ) return <div className="text-center py-12 text-slate-500 text-sm">Loading Feedback Manager...</div>;

  return (
    <div className="space-y-10 max-w-3xl">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">Feedback Manager</h3>
        <p className="text-sm text-slate-500 mt-0.5">Manage questions, send feedback requests, and view responses.</p>
      </div>

      {/* Questions */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Questions</h4>

        <div className="space-y-2">
          {questions.map(q => (
            <div key={q.id} className={`flex items-center gap-3 p-4 rounded-xl border transition-opacity ${q.is_active ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-200 opacity-50'}`}>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{q.question_text}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-slate-400 capitalize">{q.answer_type === 'yesno' ? 'Yes / No' : q.answer_type === 'rating' ? 'Star Rating' : 'Open Text'}</span>
                  {q.is_preset && <span className="text-xs text-blue-500 font-medium">Preset</span>}
                </div>
              </div>
              <button
                onClick={() => toggleQuestion(q)}
                title={q.is_active ? 'Disable question' : 'Enable question'}
                className="flex-shrink-0"
              >
                {q.is_active
                  ? <ToggleRight size={24} className="text-blue-600" />
                  : <ToggleLeft size={24} className="text-slate-400" />
                }
              </button>
              {!q.is_preset && (
                <button
                  onClick={() => deleteQuestion(q.id)}
                  className="flex-shrink-0 text-slate-400 hover:text-red-500 transition-colors"
                  title="Delete question"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}

          {questions.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-4">No questions yet. Add one below.</p>
          )}
        </div>

        {/* Add question */}
        <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-4 space-y-3">
          <p className="text-sm font-medium text-slate-700">Add Custom Question</p>
          <input
            type="text"
            value={newText}
            onChange={e => setNewText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addQuestion()}
            placeholder="e.g. How was the food?"
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="flex gap-2">
            <select
              value={newType}
              onChange={e => setNewType(e.target.value as 'rating' | 'yesno' | 'text')}
              className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="rating">Star Rating (1–5)</option>
              <option value="yesno">Yes / No</option>
              <option value="text">Open Text</option>
            </select>
            <button
              onClick={addQuestion}
              disabled={adding || !newText.trim()}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex-shrink-0"
            >
              <Plus size={15} /> Add
            </button>
          </div>
        </div>
      </div>

      {/* Send feedback requests */}
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Send Feedback Requests</h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Sends a personalised SMS with a unique feedback link to all checked-in attendees who have a phone number.
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
          <div className="flex gap-3 flex-wrap">
            <select
              value={sendEventId}
              onChange={e => setSendEventId(e.target.value)}
              className="flex-1 min-w-48 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select event...</option>
              {events.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
            <button
              onClick={handleSendRequests}
              disabled={!sendEventId || sending}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex-shrink-0"
            >
              <Send size={15} /> {sending ? 'Sending...' : 'Send Requests'}
            </button>
          </div>

          {sendError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
              <AlertCircle size={15} className="text-red-500 flex-shrink-0" />
              <p className="text-red-700 text-sm">{sendError}</p>
            </div>
          )}
          {sendFeedback && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg p-3">
              <CheckCircle2 size={15} className="text-green-500 flex-shrink-0" />
              <p className="text-green-700 text-sm">{sendFeedback}</p>
            </div>
          )}
        </div>
      </div>

      {/* Responses */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Responses</h4>
          <select
            value={responseEventId}
            onChange={e => setResponseEventId(e.target.value)}
            className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            {events.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </div>

        {loadingR ? (
          <div className="text-center py-8 text-slate-400 text-sm">Loading responses...</div>
        ) : responses.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm bg-slate-50 rounded-xl border border-slate-200">
            No responses yet for this event.
          </div>
        ) : (
          <div className="space-y-4">
            {questions.filter(q => q.is_active).map(q => {
              const summary = getQuestionSummary(q);
              if (!summary) return null;
              return (
                <div key={q.id} className="bg-white border border-slate-200 rounded-xl p-5">
                  <p className="text-sm font-semibold text-slate-800 mb-1">{q.question_text}</p>
                  <p className="text-xs text-slate-400 mb-4">{summary.count} response{summary.count !== 1 ? 's' : ''}</p>

                  {summary.type === 'rating' && (
                    <div className="flex items-center gap-3">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map(n => (
                          <Star
                            key={n}
                            size={22}
                            className={n <= Math.round(Number(summary.avg)) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}
                          />
                        ))}
                      </div>
                      <span className="text-2xl font-bold text-slate-900">{summary.avg}</span>
                      <span className="text-sm text-slate-400">/ 5</span>
                    </div>
                  )}

                  {summary.type === 'yesno' && (
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-xs text-slate-600 mb-1">
                          <span>Yes — {summary.yes}</span>
                          <span>{summary.pct}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2.5">
                          <div className="bg-green-500 h-2.5 rounded-full transition-all" style={{ width: `${summary.pct}%` }} />
                        </div>
                      </div>
                      <p className="text-xs text-slate-400">No — {summary.no} ({100 - summary.pct}%)</p>
                    </div>
                  )}

                  {summary.type === 'text' && (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {summary.responses.map((r, i) => (
                        <div key={i} className="bg-slate-50 rounded-lg px-3 py-2">
                          <p className="text-sm text-slate-700">{r}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
