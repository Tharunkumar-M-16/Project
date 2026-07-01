import { useEffect, useState } from 'react';
import api from '../api/axios.js';
import UserManager from '../components/UserManager.jsx';
import { classStatus, statusBadgeClass } from '../utils/classStatus.js';

// Mentor is the controller: manages all logins and oversees all classes.
export default function MentorDashboard() {
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    api.get('/classes').then((r) => setClasses(r.data)).catch(() => {});
  }, []);

  // Sum of minutes across classes that have run (ended = full, live = elapsed)
  const totalLiveMinutes = classes.reduce((sum, c) => sum + classStatus(c).ranMinutes, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Mentor control panel</h1>
        <p className="text-slate-500">Create and manage every login, and oversee all classes.</p>
      </div>

      {/* Full user control */}
      <UserManager />

      {/* Oversight of all classes + total live time */}
      <div className="card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">All classes</h2>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600">
            Total live time: {totalLiveMinutes} min
          </span>
        </div>
        {classes.length === 0 && <p className="text-sm text-slate-400">No classes yet.</p>}
        <div className="grid gap-3 sm:grid-cols-2">
          {classes.map((c) => {
            const st = classStatus(c);
            return (
              <div key={c._id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-slate-900">{c.title}</p>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusBadgeClass(st.status)}`}>
                    {st.label}
                  </span>
                </div>
                <p className="text-sm text-slate-500">{c.subject} · by {c.tutor?.name}</p>
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                  <span>👥 {c.students?.length || 0} students</span>
                  <span>📄 {c.documents?.length || 0} docs</span>
                  {c.schedule && <span>🗓️ {new Date(c.schedule).toLocaleString()}</span>}
                  <span className="font-semibold text-slate-600">
                    {st.status === 'ended' ? `⏱ ran ${st.ranMinutes} min`
                      : st.status === 'live' ? `⏱ live ${st.ranMinutes} min`
                      : `⏱ ${st.durationMins} min planned`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
