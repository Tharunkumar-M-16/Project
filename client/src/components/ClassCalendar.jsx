import { useEffect, useState } from 'react';
import api from '../api/axios.js';
import { classStatus, statusBadgeClass } from '../utils/classStatus.js';
import { useToast } from '../context/ToastContext.jsx';
import { safeUrl } from '../utils/url.js';

const dayLabel = (d) => {
  const date = new Date(d);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const same = (a, b) => a.toDateString() === b.toDateString();
  if (same(date, today)) return 'Today';
  if (same(date, tomorrow)) return 'Tomorrow';
  return date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
};

function ClassRow({ c, onJoin }) {
  const st = classStatus(c);
  return (
    <div className="card card-hover !p-4 flex items-center gap-3">
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-brand-50 text-center dark:bg-brand-500/10">
        <span className="text-xs font-bold text-brand-700 dark:text-brand-300">
          {new Date(c.schedule).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-slate-900 dark:text-slate-100">{c.title}</p>
        <p className="truncate text-xs text-slate-500">{c.subject} · {c.tutor?.name}</p>
      </div>
      <span className={`chip ${statusBadgeClass(st.status)}`}>{st.label}</span>
      {st.canJoin && <button onClick={() => onJoin(c)} className="btn-primary btn-sm">Join</button>}
    </div>
  );
}

// Easy calendar/agenda of a student's enrolled classes, with a "next up" reminder.
export default function ClassCalendar() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    api.get('/classes', { params: { scope: 'mine' } }).then((r) => setClasses(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const join = async (c) => {
    try {
      const { data } = await api.post(`/classes/${c._id}/attendance`);
      const link = safeUrl(data.meetingLink || c.meetingLink);
      if (link) window.open(link, '_blank', 'noopener');
      else toast.error('This class has no valid meeting link');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not join');
    }
  };

  if (loading) return <div className="card text-sm text-slate-400">Loading your schedule…</div>;
  if (classes.length === 0)
    return <div className="card text-center text-sm text-slate-400">You're not enrolled in any classes yet — enroll from the Home tab.</div>;

  const now = Date.now();
  const upcoming = classes
    .filter((c) => classStatus(c).status !== 'ended')
    .sort((a, b) => new Date(a.schedule) - new Date(b.schedule));
  const past = classes.filter((c) => classStatus(c).status === 'ended').sort((a, b) => new Date(b.schedule) - new Date(a.schedule));

  // Group upcoming by day
  const groups = {};
  for (const c of upcoming) {
    const key = new Date(c.schedule).toDateString();
    (groups[key] = groups[key] || []).push(c);
  }

  const next = upcoming.find((c) => classStatus(c).status === 'live') || upcoming[0];

  return (
    <div className="space-y-6">
      {next && (
        <div className="hero animate-fade-up bg-gradient-to-r from-brand-600 to-indigo-500">
          <p className="text-xs uppercase tracking-wide opacity-80">{classStatus(next).status === 'live' ? '● Live now' : 'Next class'}</p>
          <h3 className="mt-1 text-xl font-bold">{next.title}</h3>
          <p className="text-sm opacity-90">
            {next.subject} · {next.tutor?.name} · {new Date(next.schedule).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
          </p>
          {classStatus(next).canJoin && (
            <button onClick={() => join(next)} className="btn-secondary mt-3">
              🎥 Join now
            </button>
          )}
        </div>
      )}

      {Object.entries(groups).map(([key, list]) => (
        <div key={key}>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{dayLabel(list[0].schedule)}</h3>
          <div className="space-y-2">
            {list.map((c) => <ClassRow key={c._id} c={c} onJoin={join} />)}
          </div>
        </div>
      ))}

      {past.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Past classes</h3>
          <div className="space-y-2 opacity-70">
            {past.slice(0, 5).map((c) => <ClassRow key={c._id} c={c} onJoin={join} />)}
          </div>
        </div>
      )}
    </div>
  );
}
