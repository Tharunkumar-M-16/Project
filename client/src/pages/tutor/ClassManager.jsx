import { useEffect, useState } from 'react';
import api from '../../api/axios.js';
import CreateTestForm from './CreateTestForm.jsx';
import { classStatus, statusBadgeClass } from '../../utils/classStatus.js';

// One document row with an inline edit menu.
function DocumentRow({ classId, doc, onChange }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ title: doc.title, url: doc.url });

  const save = async () => {
    const { data } = await api.put(`/classes/${classId}/documents/${doc._id}`, form);
    setEditing(false);
    onChange(data);
  };
  const remove = async () => {
    const { data } = await api.delete(`/classes/${classId}/documents/${doc._id}`);
    onChange(data);
  };

  if (editing) {
    return (
      <div className="flex flex-wrap items-center gap-2 rounded-lg bg-slate-50 p-2">
        <input className="input flex-1" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <input className="input flex-1" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
        <button onClick={save} className="btn-primary text-sm">Save</button>
        <button onClick={() => setEditing(false)} className="btn-ghost text-sm">Cancel</button>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
      <a href={doc.url} target="_blank" rel="noreferrer" className="text-sm text-slate-700 hover:text-brand-600">
        📄 {doc.title}
      </a>
      <div className="flex gap-2 text-sm">
        <button onClick={() => setEditing(true)} className="text-brand-600">Edit</button>
        <button onClick={remove} className="text-rose-500">Delete</button>
      </div>
    </div>
  );
}

// One class card for a tutor: live link, documents (add/edit/delete), tests (add/edit), submissions.
export default function ClassManager({ liveClass, onDeleted }) {
  const [docs, setDocs] = useState(liveClass.documents || []);
  const [doc, setDoc] = useState({ title: '', url: '' });
  const [tests, setTests] = useState([]);
  const [showTestForm, setShowTestForm] = useState(false);
  const [editingTest, setEditingTest] = useState(null); // test being edited
  const [subs, setSubs] = useState({});

  const st = classStatus(liveClass);

  const loadTests = () =>
    api.get(`/tests/class/${liveClass._id}`).then((r) => setTests(r.data)).catch(() => {});

  useEffect(() => {
    loadTests();
  }, []);

  const deleteClass = async () => {
    if (!confirm(`Delete "${liveClass.title}"? This removes its tests too.`)) return;
    try {
      await api.delete(`/classes/${liveClass._id}`);
      onDeleted?.();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not delete class');
    }
  };

  const addDoc = async (e) => {
    e.preventDefault();
    if (!doc.title || !doc.url) return;
    const { data } = await api.post(`/classes/${liveClass._id}/documents`, doc);
    setDocs(data);
    setDoc({ title: '', url: '' });
  };

  const viewSubs = async (testId) => {
    if (subs[testId]) return setSubs((s) => ({ ...s, [testId]: null }));
    const { data } = await api.get(`/tests/${testId}/submissions`);
    setSubs((s) => ({ ...s, [testId]: data }));
  };

  return (
    <div className="card">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-slate-900">{liveClass.title}</h3>
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusBadgeClass(st.status)}`}>
              {st.label}
            </span>
          </div>
          <p className="text-sm text-slate-500">
            {liveClass.subject} · {liveClass.students?.length || 0} students
            {liveClass.schedule && ` · ${new Date(liveClass.schedule).toLocaleString()}`}
            {st.status === 'ended' && ` · ran ${st.ranMinutes} min`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {st.status === 'live' && (
            <a href={liveClass.meetingLink} target="_blank" rel="noreferrer" className="btn-primary text-sm">
              ▶ Start live class
            </a>
          )}
          {st.status === 'upcoming' && (
            <span className="btn cursor-not-allowed bg-slate-100 text-sm text-slate-400">
              Starts {new Date(liveClass.schedule).toLocaleString()}
            </span>
          )}
          {st.status === 'ended' && (
            <button onClick={deleteClass} className="btn border border-rose-200 text-sm text-rose-600 hover:bg-rose-50">
              🗑 Delete class
            </button>
          )}
        </div>
      </div>

      {/* Documents */}
      <div className="mt-5">
        <h4 className="mb-2 text-sm font-semibold text-slate-700">Documents</h4>
        <div className="mb-3 space-y-2">
          {docs.length === 0 && <span className="text-sm text-slate-400">No documents yet.</span>}
          {docs.map((d) => (
            <DocumentRow key={d._id} classId={liveClass._id} doc={d} onChange={setDocs} />
          ))}
        </div>
        <form onSubmit={addDoc} className="flex flex-wrap gap-2">
          <input className="input flex-1" placeholder="Document title" value={doc.title} onChange={(e) => setDoc({ ...doc, title: e.target.value })} />
          <input className="input flex-1" placeholder="URL (Drive / PDF link)" value={doc.url} onChange={(e) => setDoc({ ...doc, url: e.target.value })} />
          <button className="btn-ghost border border-slate-200 text-sm">Add doc</button>
        </form>
      </div>

      {/* Tests */}
      <div className="mt-5 border-t border-slate-100 pt-4">
        <div className="mb-2 flex items-center justify-between">
          <h4 className="text-sm font-semibold text-slate-700">Tests</h4>
          <button onClick={() => { setShowTestForm((v) => !v); setEditingTest(null); }} className="text-sm font-medium text-brand-600">
            {showTestForm ? 'Cancel' : '+ Assign test'}
          </button>
        </div>

        {showTestForm && (
          <CreateTestForm classId={liveClass._id}
            onCreated={() => { setShowTestForm(false); loadTests(); }} />
        )}

        <div className="space-y-2">
          {tests.length === 0 && <p className="text-sm text-slate-400">No tests yet.</p>}
          {tests.map((t) => (
            <div key={t._id} className="rounded-lg border border-slate-200 p-3">
              {editingTest === t._id ? (
                <CreateTestForm classId={liveClass._id} test={t}
                  onCreated={() => { setEditingTest(null); loadTests(); }} />
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-800">{t.title}</p>
                    <p className="text-xs text-slate-500">
                      {t.questions.length} questions{t.skill && ` · verifies "${t.skill}"`} · {t.submissions?.length || 0} submissions
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditingTest(t._id); setShowTestForm(false); }} className="btn-ghost border border-slate-200 text-sm">Edit</button>
                    <button onClick={() => viewSubs(t._id)} className="btn-ghost border border-slate-200 text-sm">
                      {subs[t._id] ? 'Hide' : 'Submissions'}
                    </button>
                  </div>
                </div>
              )}
              {subs[t._id] && (
                <div className="mt-2 space-y-1 text-sm">
                  {subs[t._id].submissions.length === 0 && <p className="text-slate-400">No submissions yet.</p>}
                  {subs[t._id].submissions.map((s) => (
                    <div key={s._id} className="flex justify-between rounded bg-slate-50 px-2 py-1">
                      <span className="text-slate-600">{s.student?.name || 'Student'}</span>
                      <span className="font-semibold text-slate-800">{s.score}/{s.total} ({s.percent}%)</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
