import { useEffect, useState } from 'react';
import api from '../api/axios.js';
import Modal from './Modal.jsx';

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-100 py-1.5 text-sm dark:border-slate-800">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-medium text-slate-800 dark:text-slate-100">{value || '—'}</span>
    </div>
  );
}

// Detailed student view for mentor/admin.
export default function StudentDetailModal({ userId, onClose }) {
  const [u, setU] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!userId) return;
    setU(null);
    setError('');
    api.get(`/users/${userId}`).then((r) => setU(r.data)).catch(() => setError('Could not load this student.'));
  }, [userId]);

  return (
    <Modal open={!!userId} onClose={onClose} title="Student details">
      {error ? (
        <p className="py-8 text-center text-sm text-rose-500">{error}</p>
      ) : !u ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="skeleton h-12 w-12 rounded-2xl" />
            <div className="flex-1 space-y-2"><div className="skeleton h-4 w-32" /><div className="skeleton h-3 w-24" /></div>
          </div>
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-4 w-full" />)}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-100 text-lg font-bold text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">
              {u.name?.[0]?.toUpperCase()}
            </span>
            <div>
              <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{u.name}</p>
              <p className="text-sm text-slate-500">ID: {u.username} {u.assignedTutor && `· Tutor: ${u.assignedTutor.name}`}</p>
            </div>
          </div>

          <div>
            <Row label="Phone" value={u.phone} />
            <Row label="Email" value={u.email} />
            <Row label="College" value={u.college} />
            <Row label="Degree" value={u.degree} />
            <Row label="Joined" value={u.createdAt && new Date(u.createdAt).toLocaleDateString()} />
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              ['Enrolled', u.enrolledCount ?? 0],
              ['Lives attended', u.liveClassesAttended ?? 0],
              ['Tests done', u.submissionsCount ?? 0],
              ['Avg score', u.avgScore != null ? `${u.avgScore}%` : '—'],
              ['Active days', `${u.studentProfile?.activeDays || 0}d`],
              ['Streak', `🔥 ${u.studentProfile?.streak || 0}`],
            ].map(([label, val]) => (
              <div key={label} className="surface rounded-xl p-2.5">
                <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{val}</p>
                <p className="text-[11px] text-slate-500">{label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
}
