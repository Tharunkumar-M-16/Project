import { useEffect, useState } from 'react';
import api from '../../api/axios.js';
import { useToast } from '../../context/ToastContext.jsx';

const blankQ = () => ({ text: '', options: ['', '', '', ''], correctIndex: 0 });
// Stored instant -> local wall-clock for a <input type="datetime-local">.
const toLocal = (d) => {
  if (!d) return '';
  const dt = new Date(d);
  return new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
// datetime-local value (local wall-clock, no tz) -> absolute ISO instant.
const toInstant = (v) => (v ? new Date(v).toISOString() : undefined);

// Build OR edit an auto-graded MCQ test attached to a class OR a post.
// Pass `test` to edit (PUT), omit to create (POST).
export default function CreateTestForm({ classId, postId, test = null, onCreated }) {
  const editing = !!test;
  const toast = useToast();
  const [title, setTitle] = useState(test?.title || '');
  const [skill, setSkill] = useState(test?.skill || '');
  const [dueDate, setDueDate] = useState(toLocal(test?.dueDate));
  const [questions, setQuestions] = useState(
    test?.questions?.length
      ? test.questions.map((q) => ({ text: q.text, options: [...q.options], correctIndex: q.correctIndex }))
      : [blankQ()]
  );
  const [busy, setBusy] = useState(false);

  // --- AI generation ---
  const [aiEnabled, setAiEnabled] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [aiCount, setAiCount] = useState(5);
  const [aiDiff, setAiDiff] = useState('medium');
  const [aiBusy, setAiBusy] = useState(false);

  useEffect(() => {
    api.get('/ai/status').then((r) => setAiEnabled(r.data.enabled)).catch(() => {});
  }, []);

  const setQ = (i, patch) => setQuestions(questions.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));
  const setOpt = (qi, oi, val) => setQ(qi, { options: questions[qi].options.map((o, idx) => (idx === oi ? val : o)) });

  const generate = async () => {
    if (!aiTopic.trim()) return toast.error('Enter a topic for the AI');
    setAiBusy(true);
    try {
      const { data } = await api.post('/ai/generate-test', { topic: aiTopic, numQuestions: aiCount, difficulty: aiDiff });
      setQuestions(data.questions.map((q) => ({ text: q.text, options: [...q.options], correctIndex: q.correctIndex })));
      if (!title) setTitle(`${aiTopic} quiz`);
      toast.success(`Generated ${data.questions.length} questions — review before saving`);
      setAiOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'AI generation failed');
    } finally {
      setAiBusy(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    for (const q of questions) {
      if (!q.text.trim() || q.options.some((o) => !o.trim())) {
        return toast.error('Every question needs text and all 4 options filled.');
      }
    }
    setBusy(true);
    try {
      if (editing) {
        await api.put(`/tests/${test._id}`, { title, skill, dueDate: toInstant(dueDate), questions });
      } else {
        await api.post('/tests', { title, classId, postId, skill, dueDate: toInstant(dueDate), questions });
      }
      toast.success(editing ? 'Test updated' : 'Test assigned');
      onCreated?.();
    } catch (e2) {
      toast.error(e2.response?.data?.message || 'Could not save test');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="mb-3 space-y-4 rounded-xl surface p-4 animate-fade-in">
      {editing && <p className="chip bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">Editing — saving will notify enrolled students.</p>}

      {aiEnabled && !editing && (
        <div className="rounded-xl border border-brand-200 bg-brand-50 p-3 dark:border-brand-800 dark:bg-brand-500/10">
          <button type="button" onClick={() => setAiOpen((v) => !v)} className="text-sm font-semibold text-brand-700 dark:text-brand-300">
            ✨ {aiOpen ? 'Hide AI generator' : 'Generate questions with AI'}
          </button>
          {aiOpen && (
            <div className="mt-3 space-y-2">
              <input className="input" placeholder="Topic (e.g. React hooks)" value={aiTopic} onChange={(e) => setAiTopic(e.target.value)} />
              <div className="flex gap-2">
                <input className="input w-24" type="number" min="1" max="15" value={aiCount} onChange={(e) => setAiCount(e.target.value)} />
                <select className="input" value={aiDiff} onChange={(e) => setAiDiff(e.target.value)}>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
                <button type="button" onClick={generate} disabled={aiBusy} className="btn-primary btn-sm">
                  {aiBusy ? 'Generating…' : 'Generate'}
                </button>
              </div>
              <p className="text-xs text-slate-500">AI drafts are editable — always review before assigning.</p>
            </div>
          )}
        </div>
      )}

      <div className="grid gap-2 sm:grid-cols-3">
        <input className="input sm:col-span-2" placeholder="Test title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <input className="input" type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
      </div>

      {questions.map((q, qi) => (
        <div key={qi} className="card !p-4 animate-fade-in">
          <div className="mb-3 flex items-center justify-between">
            <span className="chip bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">Question {qi + 1}</span>
            {questions.length > 1 && (
              <button type="button" onClick={() => setQuestions(questions.filter((_, idx) => idx !== qi))}
                className="btn-danger btn-sm">remove</button>
            )}
          </div>
          <input className="input mb-3" placeholder="Question text" value={q.text} onChange={(e) => setQ(qi, { text: e.target.value })} />
          <div className="grid gap-2 sm:grid-cols-2">
            {q.options.map((o, oi) => (
              <label key={oi} className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 transition-colors hover:border-brand-300 dark:border-slate-700 dark:hover:border-brand-700">
                <input type="radio" name={`correct-${test?._id || 'new'}-${qi}`} checked={q.correctIndex === oi}
                  onChange={() => setQ(qi, { correctIndex: oi })} className="accent-brand-600" />
                <input className="w-full border-0 bg-transparent py-2 text-slate-800 outline-none dark:text-slate-100" placeholder={`Option ${oi + 1}`}
                  value={o} onChange={(e) => setOpt(qi, oi, e.target.value)} />
              </label>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-400">Select the radio next to the correct option.</p>
        </div>
      ))}

      <div className="flex gap-2">
        <button type="button" onClick={() => setQuestions([...questions, blankQ()])} className="btn-secondary btn-sm">
          + Add question
        </button>
        <button className="btn-primary btn-sm" disabled={busy}>{editing ? 'Save changes' : 'Assign test'}</button>
      </div>
    </form>
  );
}
