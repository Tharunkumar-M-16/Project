import { useEffect, useState } from 'react';
import api from '../api/axios.js';

const roleBadge = {
  student: 'bg-blue-100 text-blue-700',
  tutor: 'bg-emerald-100 text-emerald-700',
  mentor: 'bg-amber-100 text-amber-700',
  admin: 'bg-rose-100 text-rose-700',
};

// Mentor/admin control panel: create, reset-password, and delete student/tutor accounts.
export default function UserManager({ readOnly = false }) {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ name: '', username: '', password: '', role: 'student' });
  const [msg, setMsg] = useState('');

  const load = () => api.get('/users').then((r) => setUsers(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const createUser = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      await api.post('/users', form);
      setMsg(`Created ${form.role} "${form.username}"`);
      setForm({ name: '', username: '', password: '', role: 'student' });
      load();
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      setMsg(err.response?.data?.message || 'Could not create user');
    }
  };

  const resetPw = async (u) => {
    const pw = prompt(`New password for ${u.name} (${u.username}):`);
    if (!pw) return;
    await api.put(`/users/${u._id}/password`, { password: pw });
    setMsg(`Password reset for ${u.username}`);
    setTimeout(() => setMsg(''), 3000);
  };

  const remove = async (u) => {
    if (!confirm(`Delete ${u.name} (${u.username})? This cannot be undone.`)) return;
    await api.delete(`/users/${u._id}`);
    load();
  };

  const staff = ['admin', 'mentor'];

  return (
    <div className="space-y-6">
      {!readOnly && (
        <form onSubmit={createUser} className="card space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">Create a login (student / tutor)</h2>
          {msg && <div className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">{msg}</div>}
          <div className="grid gap-3 sm:grid-cols-4">
            <input className="input" placeholder="Full name" value={form.name} onChange={update('name')} required />
            <input className="input" placeholder="Login ID" value={form.username} onChange={update('username')} required />
            <input className="input" placeholder="Password" value={form.password} onChange={update('password')} required />
            <select className="input" value={form.role} onChange={update('role')}>
              <option value="student">Student</option>
              <option value="tutor">Tutor</option>
            </select>
          </div>
          <button className="btn-primary">Create account</button>
        </form>
      )}

      <div className="card">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">All users ({users.length})</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-slate-400">
              <tr className="border-b border-slate-100">
                <th className="py-2">Name</th>
                <th className="py-2">ID</th>
                <th className="py-2">Role</th>
                <th className="py-2">Activity</th>
                <th className="py-2">Joined</th>
                {!readOnly && <th className="py-2 text-right">Controls</th>}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} className="border-b border-slate-50">
                  <td className="py-2 font-medium text-slate-800">{u.name}</td>
                  <td className="py-2 text-slate-500">{u.username}</td>
                  <td className="py-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${roleBadge[u.role]}`}>{u.role}</span>
                  </td>
                  <td className="py-2 text-slate-500">
                    {u.role === 'tutor' && `${u.classesCount ?? 0} classes`}
                    {u.role === 'student' && `${u.enrolledCount ?? 0} enrolled`}
                    {staff.includes(u.role) && '—'}
                  </td>
                  <td className="py-2 text-slate-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                  {!readOnly && (
                    <td className="py-2 text-right">
                      {!staff.includes(u.role) ? (
                        <div className="flex justify-end gap-3">
                          <button onClick={() => resetPw(u)} className="text-brand-600">Reset PW</button>
                          <button onClick={() => remove(u)} className="text-rose-500">Delete</button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-300">protected</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
