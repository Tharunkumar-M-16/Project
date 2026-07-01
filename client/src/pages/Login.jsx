import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

// Shared login form. `staff` variant is used by the hidden /manual-login route.
export default function Login({ staff = false }) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
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
    <div className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-brand-600 text-xl font-bold text-white">
            R
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            {staff ? 'Staff sign in' : 'Welcome to ReadyScore'}
          </h1>
          <p className="text-slate-500">
            {staff ? 'Admin & mentor access' : 'Smart live online classes'}
          </p>
        </div>

        <form onSubmit={submit} className="card space-y-4">
          {error && (
            <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>
          )}
          <div>
            <label className="label">ID</label>
            <input className="input" value={username} onChange={(e) => setUsername(e.target.value)}
              placeholder="your login ID" autoFocus required />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" value={password}
              onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button className="btn-primary w-full" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        {!staff && (
          <p className="mt-4 text-center text-xs text-slate-400">
            Don’t have an ID? Ask your mentor to create your account.
          </p>
        )}
      </div>
    </div>
  );
}
