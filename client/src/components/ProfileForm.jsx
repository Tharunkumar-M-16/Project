import { useState } from 'react';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

// Student account page — personal details persisted to the DB.
export default function ProfileForm() {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({
    name: user.name || '',
    phone: user.phone || '',
    college: user.college || '',
    degree: user.degree || '',
    targetRole: user.studentProfile?.targetRole || '',
  });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.put('/profile', form);
      await refreshUser();
      toast.success('Profile saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-center gap-4">
          <span className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-indigo-600 text-2xl font-bold text-white">
            {user.name?.[0]?.toUpperCase() || 'U'}
          </span>
          <div>
            <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{user.name}</p>
            <p className="text-sm text-slate-500">Login ID: <b>{user.username || user.email}</b></p>
            {user.createdAt && (
              <p className="text-xs text-slate-400">Member since {new Date(user.createdAt).toLocaleDateString()}</p>
            )}
          </div>
        </div>
      </div>

      <form onSubmit={save} className="card space-y-4">
        <h2 className="section-title">My details</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Full name</label>
            <input className="input" value={form.name} onChange={set('name')} required />
          </div>
          <div>
            <label className="label">Phone number</label>
            <input className="input" value={form.phone} onChange={set('phone')} placeholder="e.g. +91 98765 43210" />
          </div>
          <div>
            <label className="label">College</label>
            <input className="input" value={form.college} onChange={set('college')} placeholder="Your college / school" />
          </div>
          <div>
            <label className="label">Degree</label>
            <input className="input" value={form.degree} onChange={set('degree')} placeholder="e.g. B.Tech CSE" />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Target role (for your ReadyScore)</label>
            <input className="input" value={form.targetRole} onChange={set('targetRole')} placeholder="e.g. Frontend Developer" />
          </div>
        </div>
        <button className="btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save profile'}</button>
      </form>
    </div>
  );
}
