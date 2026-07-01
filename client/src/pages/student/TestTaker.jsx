import { useState } from 'react';
import api from '../../api/axios.js';

// Take an auto-graded MCQ test; shows the result (and any skill it verified).
export default function TestTaker({ test, onDone }) {
  const [answers, setAnswers] = useState(Array(test.questions.length).fill(-1));
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const choose = (qi, oi) => setAnswers(answers.map((a, i) => (i === qi ? oi : a)));

  const submit = async () => {
    if (answers.some((a) => a === -1)) return setErr('Answer every question first.');
    setErr('');
    setBusy(true);
    try {
      const { data } = await api.post(`/tests/${test._id}/submit`, { answers });
      setResult(data);
    } catch (e) {
      setErr(e.response?.data?.message || 'Could not submit');
    } finally {
      setBusy(false);
    }
  };

  if (result) {
    return (
      <div className="mt-3 rounded-lg bg-white p-4 text-center">
        <p className="text-3xl font-bold text-brand-600">{result.percent}%</p>
        <p className="text-sm text-slate-600">{result.score} / {result.total} correct</p>
        {result.skillUpdated && (
          <p className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            ✓ Verified <b>{result.skillUpdated.skill}</b> at level {result.skillUpdated.level} — your ReadyScore updated!
          </p>
        )}
        <button onClick={onDone} className="btn-primary mt-3 text-sm">Done</button>
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-lg bg-white p-4">
      {err && <div className="mb-2 rounded bg-rose-50 px-3 py-2 text-sm text-rose-700">{err}</div>}
      <div className="space-y-4">
        {test.questions.map((q, qi) => (
          <div key={q._id}>
            <p className="mb-2 text-sm font-medium text-slate-800">{qi + 1}. {q.text}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {q.options.map((o, oi) => (
                <label key={oi}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                    answers[qi] === oi ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200'
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
