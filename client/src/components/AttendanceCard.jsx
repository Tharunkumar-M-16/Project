import { useState } from 'react';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

const iso = (d) => d.toISOString().slice(0, 10);
const todayStr = () => iso(new Date());

// Last 14 days as {date, day, present}
function lastDays(dates, n = 14) {
  const set = new Set(dates || []);
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.push({ date: iso(d), day: d.getDate(), present: set.has(iso(d)) });
  }
  return out;
}

// Daily attendance tracker — mark today, keep a streak, see recent days.
export default function AttendanceCard() {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const p = user.studentProfile || {};
  const [busy, setBusy] = useState(false);
  const marked = p.lastAttendance === todayStr();

  const mark = async () => {
    setBusy(true);
    try {
      const { data } = await api.post('/profile/attendance');
      await refreshUser();
      toast.success(data.alreadyMarked ? 'Already marked today' : `Marked! 🔥 ${data.streak}-day streak`);
    } catch {
      toast.error('Could not mark attendance');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Daily attendance</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">🔥 {p.streak || 0}-day streak</p>
          <p className="text-xs text-slate-400">{p.activeDays || 0} total days present</p>
        </div>
        <button onClick={mark} disabled={busy || marked} className={marked ? 'btn bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300' : 'btn-primary'}>
          {marked ? '✓ Marked today' : busy ? 'Marking…' : "Mark today's attendance"}
        </button>
      </div>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {lastDays(p.attendanceDates).map((d) => (
          <div
            key={d.date}
            title={d.date}
            className={`grid h-8 w-8 place-items-center rounded-lg text-xs font-medium ${
              d.present
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
            }`}
          >
            {d.day}
          </div>
        ))}
      </div>
    </div>
  );
}
