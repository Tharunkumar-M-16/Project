import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

// Shown full-screen when a mentor-created / reset account logs in for the first time.
export default function ForcePasswordChange() {
  const { changePassword } = useAuth();
  const toast = useToast();
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (next.length < 6) return toast.error('Password must be at least 6 characters');
    if (next !== confirm) return toast.error('Passwords do not match');
    setBusy(true);
    try {
      await changePassword(null, next);
      toast.success('Password set — welcome!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not set password');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center px-4 py-10">
      <div className="w-full max-w-md animate-fade-up">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-indigo-600 text-2xl text-white shadow-glow">
            🔐
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Set your password</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">For security, choose a new password before continuing.</p>
        </div>
        <form onSubmit={submit} className="card space-y-4 shadow-lift">
          <div>
            <label className="label">New password</label>
            <input className="input" type="password" value={next} onChange={(e) => setNext(e.target.value)} autoFocus required />
          </div>
          <div>
            <label className="label">Confirm password</label>
            <input className="input" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
          </div>
          <button className="btn-primary w-full" disabled={busy}>{busy ? 'Saving…' : 'Set password & continue'}</button>
        </form>
      </div>
    </div>
  );
}
