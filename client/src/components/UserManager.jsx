import { useCallback, useEffect, useState } from 'react';
import api from '../api/axios.js';
import Modal from './Modal.jsx';
import StudentDetailModal from './StudentDetailModal.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

const roleBadge = {
  student: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',
  tutor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
  mentor: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
  admin: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300',
};
const staff = ['admin', 'mentor'];

// Mentor control panel (create/assign/endorse/reset/delete). readOnly for admin & tutor.
export default function UserManager({ readOnly = false }) {
  const toast = useToast();
  const { user: me } = useAuth();
  const canView = me.role === 'mentor' || me.role === 'admin';
  const [data, setData] = useState({ users: [], total: 0, page: 1, pages: 1 });
  const [detailFor, setDetailFor] = useState(null);
  const [tutors, setTutors] = useState([]);
  const [form, setForm] = useState({ name: '', username: '', password: '', role: 'student', assignedTutor: '' });
  const [q, setQ] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(false);
  const [pwFor, setPwFor] = useState(null); // user being password-reset
  const [pwValue, setPwValue] = useState('');
  const [delFor, setDelFor] = useState(null); // user being deleted

  const load = useCallback(() => {
    const params = { page, limit: 20 };
    if (q) params.q = q;
    if (roleFilter) params.role = roleFilter;
    return api.get('/users', { params }).then((r) => setData(r.data)).catch(() => {});
  }, [page, q, roleFilter]);

  // The assign-tutor dropdowns read from this list, so keep it fresh — not just
  // on mount, but after a new tutor is created (otherwise it stays empty/stale
  // until a full page reload).
  const loadTutors = useCallback(() => {
    if (readOnly) return undefined;
    return api.get('/users/tutors').then((r) => setTutors(r.data)).catch(() => {});
  }, [readOnly]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadTutors(); }, [loadTutors]);

  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const createUser = async (e) => {
    e.preventDefault();
    const createdRole = form.role;
    setBusy(true);
    try {
      await api.post('/users', form);
      toast.success(`Created ${form.role} "${form.username}"`);
      setForm({ name: '', username: '', password: '', role: 'student', assignedTutor: '' });
      setPage(1);
      load();
      if (createdRole === 'tutor') loadTutors(); // new tutor must appear in the assign dropdowns
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not create user');
    } finally {
      setBusy(false);
    }
  };

  const doReset = async () => {
    if (pwValue.length < 6) return toast.error('Password must be at least 6 characters');
    try {
      await api.put(`/users/${pwFor._id}/password`, { password: pwValue });
      toast.success(`Password reset for ${pwFor.username}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not reset');
    } finally {
      setPwFor(null); setPwValue('');
    }
  };

  const doDelete = async () => {
    try {
      await api.delete(`/users/${delFor._id}`);
      toast.success('User removed');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete');
    } finally {
      setDelFor(null);
    }
  };

  const endorse = async (u) => {
    try {
      await api.post(`/users/${u._id}/endorse`);
      toast.success(`Endorsed ${u.name}`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not endorse');
    }
  };

  const assign = async (u, tutorId) => {
    try {
      await api.put(`/users/${u._id}/tutor`, { tutorId });
      toast.success('Tutor updated');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not assign');
    }
  };

  return (
    <div className="space-y-6">
      {!readOnly && (
        <form onSubmit={createUser} className="card space-y-4">
          <h2 className="section-title">Create a login (student / tutor)</h2>
          <div className="grid gap-3 sm:grid-cols-4">
            <input className="input" placeholder="Full name" value={form.name} onChange={update('name')} required />
            <input className="input" placeholder="Login ID" value={form.username} onChange={update('username')} required />
            <input className="input" placeholder="Temp password (6+)" value={form.password} onChange={update('password')} required />
            <select className="input" value={form.role} onChange={update('role')}>
              <option value="student">Student</option>
              <option value="tutor">Tutor</option>
            </select>
          </div>
          {form.role === 'student' && (
            <select className="input sm:max-w-xs" value={form.assignedTutor} onChange={update('assignedTutor')}>
              <option value="">— Assign to tutor (optional) —</option>
              {tutors.map((t) => <option key={t._id} value={t._id}>{t.name} ({t.username})</option>)}
            </select>
          )}
          <button className="btn-primary" disabled={busy}>{busy ? 'Creating…' : 'Create account'}</button>
          <p className="text-xs text-slate-400">New users must set their own password on first login.</p>
        </form>
      )}

      <div className="card">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="section-title">Users ({data.total})</h2>
          <div className="flex gap-2">
            <input className="input w-40 sm:w-56" placeholder="Search name / ID…" value={q}
              onChange={(e) => { setPage(1); setQ(e.target.value); }} />
            <select className="input w-32" value={roleFilter} onChange={(e) => { setPage(1); setRoleFilter(e.target.value); }}>
              <option value="">All roles</option>
              <option value="student">Students</option>
              <option value="tutor">Tutors</option>
              <option value="mentor">Mentors</option>
              <option value="admin">Admins</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-400">
              <tr className="border-b border-slate-100 dark:border-slate-800">
                <th className="py-2 font-semibold">Name</th>
                <th className="py-2 font-semibold">ID</th>
                <th className="py-2 font-semibold">Role</th>
                <th className="py-2 font-semibold">Tutor / Progress</th>
                {!readOnly && <th className="py-2 text-right font-semibold">Controls</th>}
              </tr>
            </thead>
            <tbody>
              {data.users.map((u) => (
                <tr key={u._id} className="border-b border-slate-50 transition hover:bg-slate-50/70 dark:border-slate-800/60 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 font-medium text-slate-800 dark:text-slate-100">{u.name}</td>
                  <td className="py-2.5 text-slate-500">{u.username}</td>
                  <td className="py-2.5">
                    <span className={`chip text-xs font-semibold ${roleBadge[u.role]}`}>{u.role}</span>
                  </td>
                  <td className="py-2.5 text-slate-500">
                    {u.role === 'student' && (
                      <span className="flex flex-wrap items-center gap-2 text-xs">
                        <span>🔥{u.studentProfile?.streak || 0} · {u.studentProfile?.activeDays || 0}d · 🏅{u.studentProfile?.mentorEndorsements || 0}</span>
                        {u.assignedTutor && <span className="text-slate-400">· {u.assignedTutor.name || 'tutor'}</span>}
                        {canView && <button onClick={() => setDetailFor(u._id)} className="link">View</button>}
                      </span>
                    )}
                    {u.role === 'tutor' && <span className="text-xs">{u.classesCount ?? 0} classes · {u.studentsCount ?? 0} students</span>}
                    {staff.includes(u.role) && '—'}
                  </td>
                  {!readOnly && (
                    <td className="py-2.5 text-right">
                      {!staff.includes(u.role) ? (
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          {u.role === 'student' && (
                            <>
                              <button onClick={() => endorse(u)} className="btn-secondary btn-sm">Endorse</button>
                              <select
                                className="input w-32 !py-1.5 text-xs"
                                value={u.assignedTutor?._id || ''}
                                onChange={(e) => assign(u, e.target.value)}
                              >
                                <option value="">No tutor</option>
                                {tutors.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
                              </select>
                            </>
                          )}
                          <button onClick={() => setPwFor(u)} className="btn-secondary btn-sm">Reset PW</button>
                          <button onClick={() => setDelFor(u)} className="btn-danger btn-sm">Delete</button>
                        </div>
                      ) : (
                        <span className="chip surface text-xs text-slate-400">protected</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
              {data.users.length === 0 && (
                <tr><td colSpan={5} className="py-10 text-center text-sm text-slate-400">No users found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {data.pages > 1 && (
          <div className="mt-4 flex items-center justify-center gap-3 text-sm">
            <button className="btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
            <span className="text-slate-500">Page {data.page} / {data.pages}</span>
            <button className="btn-secondary btn-sm" disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)}>Next</button>
          </div>
        )}
      </div>

      <Modal open={!!pwFor} onClose={() => setPwFor(null)} title={`Reset password — ${pwFor?.name || ''}`}>
        <input className="input" type="text" placeholder="New temporary password (6+)" value={pwValue} onChange={(e) => setPwValue(e.target.value)} autoFocus />
        <p className="mt-2 text-xs text-slate-400">The user will be asked to set their own password on next login.</p>
        <div className="mt-4 flex justify-end gap-2">
          <button className="btn-secondary" onClick={() => setPwFor(null)}>Cancel</button>
          <button className="btn-primary" onClick={doReset}>Reset</button>
        </div>
      </Modal>

      <StudentDetailModal userId={detailFor} onClose={() => setDetailFor(null)} />

      <Modal open={!!delFor} onClose={() => setDelFor(null)} title="Delete user">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Delete <b>{delFor?.name}</b> ({delFor?.username})? This removes their {delFor?.role === 'tutor' ? 'classes, posts and tests' : 'enrolments and submissions'}. This cannot be undone.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <button className="btn-secondary" onClick={() => setDelFor(null)}>Cancel</button>
          <button className="btn-danger" onClick={doDelete}>Delete</button>
        </div>
      </Modal>
    </div>
  );
}
