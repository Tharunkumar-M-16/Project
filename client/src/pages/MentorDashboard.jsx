import { useEffect, useState } from 'react';
import api from '../api/axios.js';
import UserManager from '../components/UserManager.jsx';
import { classStatus, statusBadgeClass } from '../utils/classStatus.js';

// Mentor is the controller: manages all logins, assigns students to tutors, endorses students, and oversees classes.
export default function MentorDashboard() {
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    api.get('/classes').then((r) => setClasses(r.data)).catch(() => {});
  }, []);

  const totalLiveMinutes = classes.reduce((sum, c) => sum + classStatus(c).ranMinutes, 0);

  return (
    <div className="space-y-6">
      <div className="hero bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500">
        <p className="text-sm font-medium uppercase tracking-wider text-white/70">Mentor workspace</p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Mentor control panel</h1>
        <p className="mt-1 max-w-xl text-white/85">Manage logins, assign students to tutors, endorse students, and oversee classes.</p>
      </div>

      <UserManager />

      <div className="card">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">All classes</h2>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            Total live time: {totalLiveMinutes} min
          </span>
        </div>
        {classes.length === 0 && <p className="text-sm text-slate-400">No classes yet.</p>}
        <div className="grid gap-3 sm:grid-cols-2">
          {classes.map((c) => {
            const st = classStatus(c);
            return (
              <div key={c._id} className="card card-hover !p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{c.title}</p>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusBadgeClass(st.status)}`}>{st.label}</span>
                </div>
                <p className="text-sm text-slate-500">{c.subject} · by {c.tutor?.name}</p>
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                  <span>👥 {c.studentCount ?? c.students?.length ?? 0} students</span>
                  <span>👤 {c.attendance?.length ?? 0} attended</span>
                  <span>📄 {c.documents?.length || 0} docs</span>
                  {c.schedule && <span>🗓️ {new Date(c.schedule).toLocaleString()}</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
