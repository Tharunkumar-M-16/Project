import { useEffect, useState } from 'react';
import api from '../../api/axios.js';
import ClassManager from './ClassManager.jsx';
import PostManager from './PostManager.jsx';

export default function TutorDashboard() {
  const [tab, setTab] = useState('classes');
  const [classes, setClasses] = useState([]);
  const [form, setForm] = useState({ title: '', subject: '', description: '', schedule: '', durationMins: 60, meetingLink: '' });
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  const load = () =>
    api.get('/classes', { params: { scope: 'mine' } }).then((r) => setClasses(r.data)).catch(() => {});

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const createClass = async (e) => {
    e.preventDefault();
    try {
      await api.post('/classes', { ...form, durationMins: Number(form.durationMins) });
      setMsg('Class created!');
      setForm({ title: '', subject: '', description: '', schedule: '', durationMins: 60, meetingLink: '' });
      load();
      setTimeout(() => setMsg(''), 2500);
    } catch (err) {
      setMsg(err.response?.data?.message || 'Could not create class');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Tutor dashboard</h1>
        <p className="text-slate-500">Run live classes, publish posts, share resources, and assign tests.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        {[['classes', '🎥 Live classes'], ['posts', '📢 Posts']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${
              tab === key ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'posts' && <PostManager />}

      {tab === 'classes' && (
      <>
      <form onSubmit={createClass} className="card space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">Create a live class</h2>
        {msg && <div className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">{msg}</div>}
        <div className="grid gap-3 sm:grid-cols-2">
          <input className="input" placeholder="Class title (e.g. React Fundamentals)" value={form.title} onChange={update('title')} required />
          <input className="input" placeholder="Subject (e.g. Frontend)" value={form.subject} onChange={update('subject')} />
        </div>
        <textarea className="input" rows="2" placeholder="Description" value={form.description} onChange={update('description')} />
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="label">Schedule (live goes active at this time)</label>
            <input className="input" type="datetime-local" value={form.schedule} onChange={update('schedule')} required />
          </div>
          <div>
            <label className="label">Duration (mins)</label>
            <input className="input" type="number" min="15" value={form.durationMins} onChange={update('durationMins')} />
          </div>
          <div>
            <label className="label">Meeting link (optional)</label>
            <input className="input" placeholder="auto Jitsi if blank" value={form.meetingLink} onChange={update('meetingLink')} />
          </div>
        </div>
        <button className="btn-primary">Create class</button>
      </form>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-slate-900">My classes</h2>
        {loading && <p className="text-slate-400">Loading…</p>}
        {!loading && classes.length === 0 && <p className="text-sm text-slate-400">No classes yet — create one above.</p>}
        <div className="space-y-4">
          {classes.map((c) => (
            <ClassManager key={c._id} liveClass={c} onDeleted={load} />
          ))}
        </div>
      </div>
      </>
      )}
    </div>
  );
}
