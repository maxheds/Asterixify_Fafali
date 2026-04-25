import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Attendee, Event, FeedbackQuestion } from '../lib/database.types';
import { Star, CheckCircle2 } from 'lucide-react';

export function FeedbackForm() {
  const { attendeeId } = useParams<{ attendeeId: string }>();
  const [attendee, setAttendee] = useState<Attendee | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [questions, setQuestions] = useState<FeedbackQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!attendeeId) { setError('Invalid feedback link.'); setLoading(false); return; }
    loadForm();
  }, [attendeeId]);

  const loadForm = async () => {
    const { data: att } = await supabase
      .from('attendees')
      .select('*')
      .eq('id', attendeeId)
      .maybeSingle();

    if (!att) { setError('Feedback link not found.'); setLoading(false); return; }

    const [evRes, qRes] = await Promise.all([
      supabase.from('events').select('*').eq('id', att.event_id).maybeSingle(),
      supabase.from('feedback_questions').select('*').eq('is_active', true).order('sort_order'),
    ]);

    if (qRes.data && qRes.data.length > 0) {
      const { data: existing } = await supabase
        .from('feedback_responses')
        .select('id')
        .eq('attendee_id', attendeeId)
        .eq('question_id', qRes.data[0].id)
        .maybeSingle();
      if (existing) setSubmitted(true);
    }

    setAttendee(att);
    setEvent(evRes.data);
    setQuestions(qRes.data || []);
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!attendee) return;
    setSubmitting(true);
    setError('');

    const responses = questions.map(q => ({
      app_id: 'default_app',
      event_id: attendee.event_id,
      attendee_id: attendee.id,
      question_id: q.id,
      answer_text: answers[q.id] || '',
    }));

    const { error: err } = await supabase.from('feedback_responses').insert(responses);
    if (err) {
      setError('Failed to submit. Please try again.');
    } else {
      setSubmitted(true);
    }
    setSubmitting(false);
  };

  const allAnswered = questions.length > 0 && questions.every(q => (answers[q.id] || '').trim() !== '');

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-500 text-sm">Loading...</div>
      </div>
    );
  }

  if (error && !attendee) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-500 font-semibold">{error}</p>
          <p className="text-slate-400 text-sm mt-2">Please contact event staff for assistance.</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg max-w-sm w-full p-8 text-center">
          <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} className="text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Thank You!</h2>
          <p className="text-slate-600 text-sm">
            Your feedback has been received. We appreciate you taking the time.
          </p>
          <p className="text-slate-400 text-xs mt-6">Powered by Asterixify Innovations</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900">{event?.name}</h1>
          <p className="text-slate-500 mt-1 text-sm">
            Hi {attendee?.first_name}, we'd love your feedback!
          </p>
        </div>

        {questions.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">
            No feedback questions are set up yet.
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {questions.map((q, i) => (
                <div key={q.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                  <p className="text-sm font-semibold text-slate-800 mb-4">
                    {i + 1}. {q.question_text}
                  </p>

                  {q.answer_type === 'rating' && (
                    <div className="flex gap-2 justify-center">
                      {[1, 2, 3, 4, 5].map(n => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setAnswers({ ...answers, [q.id]: String(n) })}
                          className="p-1 transition-transform hover:scale-110"
                        >
                          <Star
                            size={32}
                            className={`transition-colors ${
                              Number(answers[q.id]) >= n
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-slate-200 hover:text-amber-200'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  )}

                  {q.answer_type === 'yesno' && (
                    <div className="flex gap-3">
                      {['Yes', 'No'].map(opt => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setAnswers({ ...answers, [q.id]: opt })}
                          className={`flex-1 py-3 rounded-xl text-sm font-semibold border-2 transition-all ${
                            answers[q.id] === opt
                              ? opt === 'Yes'
                                ? 'bg-green-600 border-green-600 text-white'
                                : 'bg-red-500 border-red-500 text-white'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}

                  {q.answer_type === 'text' && (
                    <textarea
                      value={answers[q.id] || ''}
                      onChange={e => setAnswers({ ...answers, [q.id]: e.target.value })}
                      rows={3}
                      placeholder="Type your response here..."
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                  )}
                </div>
              ))}
            </div>

            {error && (
              <p className="mt-4 text-center text-sm text-red-500">{error}</p>
            )}

            <button
              onClick={handleSubmit}
              disabled={submitting || !allAnswered}
              className="w-full mt-6 py-3.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-md shadow-blue-600/20"
            >
              {submitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </>
        )}

        <p className="text-center text-slate-400 text-xs mt-8">Powered by Asterixify Innovations</p>
      </div>
    </div>
  );
}
