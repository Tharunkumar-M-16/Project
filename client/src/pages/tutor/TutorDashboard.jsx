import { useEffect, useState } from 'react';
import api from '../../api/axios.js';
import ClassManager from './ClassManager.jsx';
import PostManager from './PostManager.jsx';
import UserManager from '../../components/UserManager.jsx';
import Messages from '../../components/Messages.jsx';
import Tabs from '../../components/Tabs.jsx';
import { useToast } from '../../context/ToastContext.jsx';

export default function TutorDashboard() {
  const [tab, setTab] = useState('classes');
  const [classes, setClasses] = useState([]);
  const [form, setForm] = useState({ title: '', subject: '', description: '', schedule: '', durationMins: 60, meetingLink: '' });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const load = () =>
    api.get('/classes', { params: { scope: 'mine' } }).then((r) => setClasses(r.data)).catch(() => {});
  useEffect(() => { load().finally(() => setLoading(false)); }, []);

  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const createClass = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post('/classes', { ...form, durationMins: Number(form.durationMins) });
      toast.success('Class created!');
      setForm({ title: '', subject: '', description: '', schedule: '', durationMins: 60, meetingLink: '' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not create class');
    } finally {
      setBusy(false);
    }
  };

  const tabs = [
    { key: 'classes', icon: '🎥', label: 'Classes' },
    { key: 'posts', icon: '📢', label: 'Posts' },
    { key: 'students', icon: '👥', label: 'Students' },
    { key: 'messages', icon: '💬', label: 'Messages' },
  ];

  return (
    <div className="space-y-6 pb-24 sm:pb-0">
      <div className="hero bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600">
        <p className="text-sm font-medium uppercase tracking-wider text-white/70">Tutor workspace</p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Tutor dashboard</h1>
        <p className="mt-1 max-w-xl text-white/85">Run live classes, publish posts, assign tests, and support your students.</p>
      </div>

      <Tabs tabs={tabs} value={tab} onChange={setTab} />

      {tab === 'posts' && <PostManager />}
      {tab === 'messages' && <Messages />}
      {tab === 'students' && (
        <div>
          <p className="mb-3 text-sm text-slate-500">Your assigned students. Mentors manage accounts and endorsements.</p>
          <UserManager readOnly />
        </div>
      )}

      {tab === 'classes' && (
        <>
          <form onSubmit={createClass} className="card space-y-3">
            <h2 className="section-title flex items-center gap-2">🎬 Create a live class</h2>
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
                <input className="input" type="number" min="5" max="600" value={form.durationMins} onChange={update('durationMins')} />
              </div>
              <div>
                <label className="label">Meeting link (optional)</label>
                <input className="input" placeholder="auto Jitsi if blank" value={form.meetingLink} onChange={update('meetingLink')} />
              </div>
            </div>
            <button className="btn-primary" disabled={busy}>{busy ? 'Creating…' : 'Create class'}</button>
          </form>

          <div>
            <h2 className="mb-3 section-title">My classes</h2>
            {loading && <p className="text-slate-400">Loading…</p>}
            {!loading && classes.length === 0 && <p className="text-sm text-slate-400">No classes yet — create one above.</p>}
            <div className="space-y-4">
              {classes.map((c) => <ClassManager key={c._id} liveClass={c} onDeleted={load} />)}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
