import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

// Shared login form. `staff` variant is used by the hidden /manual-login route.
export default function Login({ staff = false }) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(username, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center px-4 py-10">
      <div className="w-full max-w-md animate-fade-up">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-indigo-600 text-2xl font-extrabold text-white shadow-glow">
            5
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {staff ? 'Staff sign in' : 'Welcome back'}
          </h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            {staff ? 'Admin & mentor access' : 'Sign in to your 5Rings Class account'}
          </p>
        </div>

        <form onSubmit={submit} className="card space-y-5 shadow-lift">
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm font-medium text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}
          <div>
            <label className="label">Login ID</label>
            <input className="input" value={username} onChange={(e) => setUsername(e.target.value)}
              placeholder="your login ID" autoFocus required />
          </div>
          <div>
            <label className="label">Password</label>
            <div className="relative">
              <input className="input pr-12" type={showPw ? 'text' : 'password'} value={password}
                onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute inset-y-0 right-0 grid w-11 place-items-center text-slate-400 transition-colors hover:text-slate-700 dark:hover:text-slate-200"
                title={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
          <button className="btn-primary w-full" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        {!staff && (
          <p className="mt-5 text-center text-xs text-slate-400">
            Don’t have an ID? Ask your mentor to create your account.
          </p>
        )}
      </div>
    </div>
  );
}
