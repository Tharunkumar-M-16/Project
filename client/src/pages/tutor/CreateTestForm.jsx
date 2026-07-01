import { useState } from 'react';
import api from '../../api/axios.js';

const blankQ = () => ({ text: '', options: ['', '', '', ''], correctIndex: 0 });
const toLocal = (d) => (d ? new Date(d).toISOString().slice(0, 16) : '');

// Build OR edit an auto-graded MCQ test attached to a class OR a post.
// Pass `test` to edit (PUT), omit to create (POST).
export default function CreateTestForm({ classId, postId, test = null, onCreated }) {
  const editing = !!test;
  const [title, setTitle] = useState(test?.title || '');
  const [skill, setSkill] = useState(test?.skill || '');
  const [dueDate, setDueDate] = useState(toLocal(test?.dueDate));
  const [questions, setQuestions] = useState(
    test?.questions?.length
      ? test.questions.map((q) => ({ text: q.text, options: [...q.options], correctIndex: q.correctIndex }))
      : [blankQ()]
  );
  const [err, setErr] = useState('');

  const setQ = (i, patch) => setQuestions(questions.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));
  const setOpt = (qi, oi, val) =>
    setQ(qi, { options: questions[qi].options.map((o, idx) => (idx === oi ? val : o)) });

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    for (const q of questions) {
      if (!q.text.trim() || q.options.some((o) => !o.trim())) {
        return setErr('Every question needs text and all 4 options filled.');
      }
    }
    try {
      if (editing) {
        await api.put(`/tests/${test._id}`, { title, skill, dueDate: dueDate || undefined, questions });
      } else {
        await api.post('/tests', { title, classId, postId, skill, dueDate: dueDate || undefined, questions });
      }
      onCreated?.();
    } catch (e2) {
      setErr(e2.response?.data?.message || 'Could not save test');
    }
  };

  return (
    <form onSubmit={submit} className="mb-3 space-y-3 rounded-lg bg-slate-50 p-4">
      {err && <div className="rounded bg-rose-50 px-3 py-2 text-sm text-rose-700">{err}</div>}
      {editing && <p className="text-xs font-medium text-amber-600">Editing — saving will notify enrolled students.</p>}
      <div className="grid gap-2 sm:grid-cols-3">
        <input className="input" placeholder="Test title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <input className="input" placeholder="Verifies skill (e.g. React)" value={skill} onChange={(e) => setSkill(e.target.value)} />
        <input className="input" type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
      </div>

      {questions.map((q, qi) => (
        <div key={qi} className="rounded-lg border border-slate-200 bg-white p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-600">Question {qi + 1}</span>
            {questions.length > 1 && (
              <button type="button" onClick={() => setQuestions(questions.filter((_, idx) => idx !== qi))}
                className="text-xs text-rose-500">remove</button>
            )}
          </div>
          <input className="input mb-2" placeholder="Question text" value={q.text} onChange={(e) => setQ(qi, { text: e.target.value })} />
          <div className="grid gap-2 sm:grid-cols-2">
            {q.options.map((o, oi) => (
              <label key={oi} className="flex items-center gap-2 rounded-lg border border-slate-200 px-2">
                <input type="radio" name={`correct-${test?._id || 'new'}-${qi}`} checked={q.correctIndex === oi}
                  onChange={() => setQ(qi, { correctIndex: oi })} className="accent-brand-600" />
                <input className="w-full border-0 bg-transparent py-2 outline-none" placeholder={`Option ${oi + 1}`}
                  value={o} onChange={(e) => setOpt(qi, oi, e.target.value)} />
              </label>
            ))}
          </div>
          <p className="mt-1 text-xs text-slate-400">Select the radio next to the correct option.</p>
        </div>
      ))}

      <div className="flex gap-2">
        <button type="button" onClick={() => setQuestions([...questions, blankQ()])} className="btn-ghost border border-slate-200 text-sm">
          + Add question
        </button>
        <button className="btn-primary text-sm">{editing ? 'Save changes' : 'Assign test'}</button>
      </div>
    </form>
  );
}
