import { useEffect, useState } from 'react';
import api from '../api/axios.js';
import UserManager from '../components/UserManager.jsx';

function StatCard({ label, value, icon = '📊', accent = 'text-slate-900 dark:text-slate-100' }) {
  return (
    <div className="card card-hover">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-base dark:bg-slate-800">{icon}</span>
      </div>
      <p className={`mt-2 font-display text-3xl font-bold tracking-tight ${accent}`}>{value}</p>
    </div>
  );
}

// Simple dependency-free horizontal bar chart.
function BarChart({ title, data, color = 'bg-brand-500' }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="card">
      <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">{title}</h3>
      <div className="space-y-2">
        {data.map((d) => (
          <div key={d.label} className="flex items-center gap-3">
            <span className="w-24 shrink-0 text-xs capitalize text-slate-500">{d.label}</span>
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div className={`h-full rounded-full transition-all duration-700 ease-out ${color}`} style={{ width: `${(d.value / max) * 100}%` }} />
            </div>
            <span className="w-8 shrink-0 text-right text-xs font-semibold text-slate-600 dark:text-slate-300">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    api.get('/admin/stats').then((r) => setStats(r.data)).catch(() => {});
    api.get('/admin/analytics').then((r) => setAnalytics(r.data)).catch(() => {});
  }, []);

  if (!stats) return <p className="text-slate-400">Loading analytics…</p>;
  const { counts } = stats;

  return (
    <div className="space-y-6">
      <div className="hero bg-gradient-to-br from-slate-800 via-slate-800 to-slate-600">
        <p className="text-sm font-medium uppercase tracking-wider text-white/60">Admin workspace</p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Admin dashboard</h1>
        <p className="mt-1 max-w-xl text-white/80">Platform overview, analytics and the full user directory.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total users" value={counts.total} icon="👥" />
        <StatCard label="Students" value={counts.students} icon="🎓" accent="text-brand-600 dark:text-brand-400" />
        <StatCard label="Tutors" value={counts.tutors} icon="🧑‍🏫" accent="text-emerald-600 dark:text-emerald-400" />
        <StatCard label="Mentors" value={counts.mentors} icon="🧭" accent="text-amber-600 dark:text-amber-400" />
        <StatCard label="Classes" value={counts.classes} icon="🎥" />
        <StatCard label="Tests" value={counts.tests} icon="📝" />
        {analytics && <StatCard label="Total submissions" value={analytics.submissions.count} icon="📥" />}
        {analytics && <StatCard label="Avg test score" value={`${analytics.submissions.avgPercent}%`} icon="🎯" accent="text-brand-600 dark:text-brand-400" />}
      </div>

      {analytics && (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <BarChart
              title="Users by role"
              data={['student', 'tutor', 'mentor', 'admin'].map((r) => ({ label: r, value: analytics.roles[r] || 0 }))}
            />
            <BarChart
              title="Classes by status"
              color="bg-emerald-500"
              data={[
                { label: 'upcoming', value: analytics.lifecycle.upcoming },
                { label: 'live', value: analytics.lifecycle.live },
                { label: 'ended', value: analytics.lifecycle.ended },
              ]}
            />
          </div>

          {analytics.tutors.length > 0 && (
            <div className="card">
              <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Tutor performance</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-slate-400">
                    <tr className="border-b border-slate-100 dark:border-slate-800">
                      <th className="py-2">Tutor</th>
                      <th className="py-2">Classes</th>
                      <th className="py-2">Students</th>
                      <th className="py-2">Submissions</th>
                      <th className="py-2">Avg score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.tutors.map((t) => (
                      <tr key={t._id} className="border-b border-slate-50 dark:border-slate-800/60">
                        <td className="py-2 font-medium text-slate-800 dark:text-slate-100">{t.name}</td>
                        <td className="py-2 text-slate-500">{t.classes}</td>
                        <td className="py-2 text-slate-500">{t.students}</td>
                        <td className="py-2 text-slate-500">{t.submissions}</td>
                        <td className="py-2 font-semibold text-brand-600 dark:text-brand-400">{t.avgScore}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      <UserManager readOnly />
    </div>
  );
}
