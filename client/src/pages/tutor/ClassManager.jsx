import { useEffect, useState } from 'react';
import api from '../../api/axios.js';
import CreateTestForm from './CreateTestForm.jsx';
import Modal from '../../components/Modal.jsx';
import ClassAttendanceModal from '../../components/ClassAttendanceModal.jsx';
import { classStatus, statusBadgeClass } from '../../utils/classStatus.js';
import { useToast } from '../../context/ToastContext.jsx';

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
      <div className="flex flex-wrap items-center gap-2 rounded-lg surface p-2">
        <input className="input flex-1" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <input className="input flex-1" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
        <button onClick={save} className="btn-primary btn-sm">Save</button>
        <button onClick={() => setEditing(false)} className="btn-ghost btn-sm">Cancel</button>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-between rounded-lg surface px-3 py-2">
      <a href={doc.url} target="_blank" rel="noreferrer" className="link text-sm text-slate-700 dark:text-slate-300">📄 {doc.title}</a>
      <div className="flex gap-2">
        <button onClick={() => setEditing(true)} className="btn-ghost btn-sm">Edit</button>
        <button onClick={remove} className="btn-danger btn-sm">Delete</button>
      </div>
    </div>
  );
}

export default function ClassManager({ liveClass, onDeleted }) {
  const toast = useToast();
  const [docs, setDocs] = useState(liveClass.documents || []);
  const [doc, setDoc] = useState({ title: '', url: '' });
  const [tests, setTests] = useState([]);
  const [showTestForm, setShowTestForm] = useState(false);
  const [editingTest, setEditingTest] = useState(null);
  const [subs, setSubs] = useState({});
  const [confirmDel, setConfirmDel] = useState(false);
  const [showAttendance, setShowAttendance] = useState(false);

  const st = classStatus(liveClass);

  const loadTests = () => api.get(`/tests/class/${liveClass._id}`).then((r) => setTests(r.data)).catch(() => {});
  useEffect(() => { loadTests(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const deleteClass = async () => {
    try {
      await api.delete(`/classes/${liveClass._id}`);
      toast.success('Class deleted');
      onDeleted?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete class');
    } finally {
      setConfirmDel(false);
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
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="section-title">{liveClass.title}</h3>
            <span className={`chip ${statusBadgeClass(st.status)}`}>{st.label}</span>
          </div>
          <p className="text-sm text-slate-500">
            {liveClass.subject} · {liveClass.studentCount ?? liveClass.students?.length ?? 0} students · 👤 {liveClass.attendance?.length ?? 0} attended
            {liveClass.schedule && ` · ${new Date(liveClass.schedule).toLocaleString()}`}
            {st.status === 'ended' && ` · ran ${st.ranMinutes} min`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setShowAttendance(true)} className="btn-secondary btn-sm">👤 Attendance</button>
          {st.status === 'live' && (
            <a href={liveClass.meetingLink} target="_blank" rel="noreferrer" className="btn-primary btn-sm">▶ Start live class</a>
          )}
          {st.status === 'upcoming' && (
            <span className="chip cursor-not-allowed bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
              Starts {new Date(liveClass.schedule).toLocaleString()}
            </span>
          )}
          {st.status === 'ended' && (
            <button onClick={() => setConfirmDel(true)} className="btn-danger btn-sm">
              🗑 Delete class
            </button>
          )}
        </div>
      </div>

      <div className="mt-6">
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Documents</h4>
        <div className="mb-3 space-y-2">
          {docs.length === 0 && <p className="rounded-xl surface px-4 py-5 text-center text-sm text-slate-400 dark:text-slate-500">No documents yet.</p>}
          {docs.map((d) => <DocumentRow key={d._id} classId={liveClass._id} doc={d} onChange={setDocs} />)}
        </div>
        <form onSubmit={addDoc} className="flex flex-wrap gap-2">
          <input className="input flex-1" placeholder="Document title" value={doc.title} onChange={(e) => setDoc({ ...doc, title: e.target.value })} />
          <input className="input flex-1" placeholder="URL (Drive / PDF link)" value={doc.url} onChange={(e) => setDoc({ ...doc, url: e.target.value })} />
          <button className="btn-secondary btn-sm">Add doc</button>
        </form>
      </div>

      <div className="mt-6 border-t border-slate-100 pt-5 dark:border-slate-800">
        <div className="mb-3 flex items-center justify-between">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Tests</h4>
          <button onClick={() => { setShowTestForm((v) => !v); setEditingTest(null); }} className="btn-ghost btn-sm">
            {showTestForm ? 'Cancel' : '+ Assign test'}
          </button>
        </div>

        {showTestForm && <CreateTestForm classId={liveClass._id} onCreated={() => { setShowTestForm(false); loadTests(); }} />}

        <div className="space-y-2">
          {tests.length === 0 && <p className="rounded-xl surface px-4 py-6 text-center text-sm text-slate-400 dark:text-slate-500">No tests yet.</p>}
          {tests.map((t) => (
            <div key={t._id} className="surface rounded-xl p-4">
              {editingTest === t._id ? (
                <CreateTestForm classId={liveClass._id} test={t} onCreated={() => { setEditingTest(null); loadTests(); }} />
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-800 dark:text-slate-100">{t.title}</p>
                    <p className="text-xs text-slate-500">
                      {t.questions.length} questions{t.skill && ` · ${t.skill}`} · {t.submissions?.length || 0} submissions
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditingTest(t._id); setShowTestForm(false); }} className="btn-secondary btn-sm">Edit</button>
                    <button onClick={() => viewSubs(t._id)} className="btn-secondary btn-sm">
                      {subs[t._id] ? 'Hide' : 'Submissions'}
                    </button>
                  </div>
                </div>
              )}
              {subs[t._id] && (
                <div className="mt-2 space-y-1 text-sm">
                  {subs[t._id].submissions.length === 0 && <p className="text-slate-400">No submissions yet.</p>}
                  {subs[t._id].submissions.map((s) => (
                    <div key={s._id} className="flex justify-between rounded-lg surface px-3 py-1.5">
                      <span className="text-slate-600 dark:text-slate-300">{s.student?.name || 'Student'}</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-100">{s.score}/{s.total} ({s.percent}%)</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <ClassAttendanceModal classId={showAttendance ? liveClass._id : null} onClose={() => setShowAttendance(false)} />

      <Modal open={confirmDel} onClose={() => setConfirmDel(false)} title="Delete class">
        <p className="text-sm text-slate-600 dark:text-slate-300">Delete "{liveClass.title}"? This removes its tests too.</p>
        <div className="mt-4 flex justify-end gap-2">
          <button className="btn-ghost" onClick={() => setConfirmDel(false)}>Cancel</button>
          <button className="btn-danger" onClick={deleteClass}>Delete</button>
        </div>
      </Modal>
    </div>
  );
}
