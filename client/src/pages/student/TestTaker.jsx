import { useState } from 'react';
import api from '../../api/axios.js';
import { useAuth } from '../../context/AuthContext.jsx';

// Take an auto-graded MCQ test; shows the result, XP/badges earned and optional AI tips.
export default function TestTaker({ test, onDone }) {
  const { refreshUser } = useAuth();
  const [answers, setAnswers] = useState(Array(test.questions.length).fill(-1));
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [feedback, setFeedback] = useState('');
  const [fbBusy, setFbBusy] = useState(false);

  const choose = (qi, oi) => setAnswers(answers.map((a, i) => (i === qi ? oi : a)));

  const submit = async () => {
    if (answers.some((a) => a === -1)) return setErr('Answer every question first.');
    setErr('');
    setBusy(true);
    try {
      const { data } = await api.post(`/tests/${test._id}/submit`, { answers });
      setResult(data);
      refreshUser().catch(() => {}); // update XP / badges / streak in the UI
    } catch (e) {
      setErr(e.response?.data?.message || 'Could not submit');
    } finally {
      setBusy(false);
    }
  };

  const getTips = async () => {
    setFbBusy(true);
    try {
      const { data } = await api.post('/ai/feedback', {
        testTitle: test.title, skill: test.skill, percent: result.percent, score: result.score, total: result.total,
      });
      setFeedback(data.feedback);
    } catch (e) {
      setFeedback(e.response?.data?.message || 'AI tips are unavailable right now.');
    } finally {
      setFbBusy(false);
    }
  };

  if (result) {
    return (
      <div className="card mt-3 text-center animate-scale-in">
        <p className="text-4xl font-bold text-brand-600 dark:text-brand-400">{result.percent}%</p>
        <p className="text-sm text-slate-600 dark:text-slate-300">{result.score} / {result.total} correct</p>

        {result.skillUpdated && (
          <p className="mt-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
            ✓ Verified <b>{result.skillUpdated.skill}</b> at level {result.skillUpdated.level}!
          </p>
        )}

        {feedback ? (
          <div className="surface mt-3 whitespace-pre-wrap rounded-xl px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-200">{feedback}</div>
        ) : (
          <button onClick={getTips} disabled={fbBusy} className="btn-secondary btn-sm mt-2">
            {fbBusy ? 'Thinking…' : '✨ Get AI study tips'}
          </button>
        )}

        <div><button onClick={onDone} className="btn-primary btn-sm mt-3">Done</button></div>
      </div>
    );
  }

  return (
    <div className="card mt-3 animate-fade-in">
      {err && <div className="mb-2 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">{err}</div>}
      <div className="space-y-4">
        {test.questions.map((q, qi) => (
          <div key={q._id}>
            <p className="mb-2 text-sm font-medium text-slate-800 dark:text-slate-100">{qi + 1}. {q.text}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {q.options.map((o, oi) => (
                <label key={oi}
                  className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${
                    answers[qi] === oi
                      ? 'border-brand-500 bg-brand-50 text-brand-700 shadow-soft dark:bg-brand-500/10 dark:text-brand-300'
                      : 'border-slate-200 hover:border-brand-300 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800'
                  }`}>
                  <input type="radio" name={`q-${q._id}`} checked={answers[qi] === oi}
                    onChange={() => choose(qi, oi)} className="accent-brand-600" />
                  {o}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
      <button onClick={submit} disabled={busy} className="btn-primary mt-4 w-full">
        {busy ? 'Submitting…' : 'Submit test'}
      </button>
    </div>
  );
}
