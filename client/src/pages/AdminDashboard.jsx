import { useEffect, useState } from 'react';
import api from '../api/axios.js';
import UserManager from '../components/UserManager.jsx';

function StatCard({ label, value, accent = 'text-slate-900' }) {
  return (
    <div className="card">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${accent}`}>{value}</p>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/admin/stats').then((r) => setStats(r.data)).catch(() => {});
  }, []);

  if (!stats) return <p className="text-slate-400">Loading analytics…</p>;
  const { counts } = stats;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Admin dashboard</h1>
        <p className="text-slate-500">Platform overview and full user directory.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Total users" value={counts.total} />
        <StatCard label="Students" value={counts.students} accent="text-brand-600" />
        <StatCard label="Tutors" value={counts.tutors} accent="text-emerald-600" />
        <StatCard label="Mentors" value={counts.mentors} accent="text-amber-600" />
        <StatCard label="Live classes" value={counts.classes} />
        <StatCard label="Tests" value={counts.tests} />
      </div>

      {/* Elaborate, read-only directory of every user */}
      <UserManager readOnly />
    </div>
  );
}
