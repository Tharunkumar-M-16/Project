import { useEffect, useState } from 'react';
import api from '../api/axios.js';
import Modal from './Modal.jsx';

const fmt = (d) => (d ? new Date(d).toLocaleString() : '—');

// Attendance monitor for one live class: how long the live ran, who attended
// (with join time + approx minutes present) and who was enrolled but absent.
export default function ClassAttendanceModal({ classId, onClose }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!classId) return;
    setData(null);
    setError('');
    api.get(`/classes/${classId}/attendance`).then((r) => setData(r.data)).catch(() => setError('Could not load attendance.'));
  }, [classId]);

  return (
    <Modal open={!!classId} onClose={onClose} title="Live class attendance">
      {error ? (
        <p className="py-8 text-center text-sm text-rose-500">{error}</p>
      ) : !data ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-5 w-full" />)}</div>
      ) : (
        <div className="space-y-4">
          <div>
            <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{data.title}</p>
            <p className="text-sm text-slate-500">
              {data.subject || 'Class'} · by {data.tutor?.name} · 🗓️ {fmt(data.schedule)}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              ['Live ran', data.status === 'upcoming' ? 'Not started' : `${data.ranMinutes}m / ${data.durationMins}m`],
              ['Attended', `${data.attendedCount} / ${data.enrolledCount}`],
              ['Status', data.status],
            ].map(([label, val]) => (
              <div key={label} className="surface rounded-xl p-2.5">
                <p className="text-base font-bold capitalize text-slate-900 dark:text-slate-100">{val}</p>
                <p className="text-[11px] text-slate-500">{label}</p>
              </div>
            ))}
          </div>

          <div>
            <p className="label mb-2">Attended the live ({data.attendance.length})</p>
            {data.attendance.length === 0 && <p className="text-sm text-slate-400">No one joined the live session.</p>}
            <div className="space-y-1.5">
              {data.attendance.map((a) => (
                <div key={a.student?._id || a.student} className="flex flex-wrap items-center justify-between gap-1 rounded-xl surface px-3 py-2 text-sm">
                  <span className="font-medium text-slate-800 dark:text-slate-100">{a.student?.name || 'Student'}</span>
                  <span className="text-xs text-slate-500">
                    joined {fmt(a.joinedAt)}{a.attendedMinutes != null && ` · ~${a.attendedMinutes}m present`}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {data.absentees?.length > 0 && (
            <div>
              <p className="label mb-2">Enrolled but absent ({data.absentees.length})</p>
              <div className="flex flex-wrap gap-2">
                {data.absentees.map((s) => (
                  <span key={s._id} className="chip surface text-xs text-slate-600 dark:text-slate-300">{s.name}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
