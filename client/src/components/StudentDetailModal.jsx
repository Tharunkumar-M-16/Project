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

  useEffect(() => {
    if (!userId) return;
    setU(null);
    api.get(`/users/${userId}`).then((r) => setU(r.data)).catch(() => {});
  }, [userId]);

  return (
    <Modal open={!!userId} onClose={onClose} title="Student details">
      {!u ? (
        <p className="py-8 text-center text-sm text-slate-400">Loading…</p>
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
            <Row label="Target role" value={u.studentProfile?.targetRole} />
            <Row label="Joined" value={u.createdAt && new Date(u.createdAt).toLocaleDateString()} />
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              ['ReadyScore', u.readyScore?.readyScore ?? '—'],
              ['Avg score', u.avgScore != null ? `${u.avgScore}%` : '—'],
              ['Enrolled', u.enrolledCount ?? 0],
              ['Tests done', u.submissionsCount ?? 0],
              ['Attendance', `${u.studentProfile?.activeDays || 0}d`],
              ['Streak', `🔥 ${u.studentProfile?.streak || 0}`],
            ].map(([label, val]) => (
              <div key={label} className="surface rounded-xl p-2.5">
                <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{val}</p>
                <p className="text-[11px] text-slate-500">{label}</p>
              </div>
            ))}
          </div>

          {u.studentProfile?.skills?.length > 0 && (
            <div>
              <p className="label mb-2">Skills</p>
              <div className="flex flex-wrap gap-2">
                {u.studentProfile.skills.map((s) => (
                  <span key={s.name} className={`chip text-xs ${s.verified ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300' : 'surface text-slate-600 dark:text-slate-300'}`}>
                    {s.name} {s.level}%{s.verified && ' ✓'}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
