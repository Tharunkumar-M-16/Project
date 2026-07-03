import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import ChangePasswordModal from './ChangePasswordModal.jsx';
import NotificationBell from './NotificationBell.jsx';

const roleBadge = {
  student: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',
  tutor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
  mentor: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
  admin: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300',
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [menu, setMenu] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/70 backdrop-blur-xl dark:border-slate-800/70 dark:bg-slate-950/70">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link to="/dashboard" className="group flex items-center gap-2.5">
          <span className="flex h-9 items-center rounded-xl bg-white px-2.5 shadow-card ring-1 ring-slate-200/80 transition-transform group-hover:scale-105 dark:ring-slate-700">
            <img src="/logo-wordmark.png" alt="5Rings" className="h-4 w-auto" />
          </span>
          <span className="font-display text-lg font-bold tracking-tight text-slate-500 dark:text-slate-400">Class</span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={toggle}
            title="Toggle theme"
            className="grid h-9 w-9 place-items-center rounded-xl text-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          {user && (
            <>
              <NotificationBell />
              <span className={`hidden capitalize sm:inline-flex chip ${roleBadge[user.role]}`}>{user.role}</span>
              <div className="relative">
                <button
                  onClick={() => setMenu((v) => !v)}
                  className="flex items-center gap-2 rounded-xl py-1 pl-1 pr-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-brand-100 to-brand-200 text-xs font-bold text-brand-700 ring-1 ring-brand-200 dark:from-brand-500/20 dark:to-brand-500/10 dark:text-brand-300 dark:ring-brand-500/20">
                    {user.name?.[0]?.toUpperCase() || 'U'}
                  </span>
                  <span className="hidden sm:inline">{user.name}</span>
                  <svg className={`hidden h-4 w-4 text-slate-400 transition-transform sm:block ${menu ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                  </svg>
                </button>
                {menu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setMenu(false)} />
                    <div className="absolute right-0 z-20 mt-2 w-56 origin-top-right animate-scale-in overflow-hidden rounded-2xl border border-slate-200 bg-white p-1 shadow-lift dark:border-slate-800 dark:bg-slate-900">
                      <div className="border-b border-slate-100 px-3 py-2.5 dark:border-slate-800">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{user.name}</p>
                        <p className="truncate text-xs text-slate-400">{user.username || user.email || `${user.role} account`}</p>
                      </div>
                      <button
                        onClick={() => { setMenu(false); setPwOpen(true); }}
                        className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        🔑 Change password
                      </button>
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
                      >
                        ↪ Logout
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      <ChangePasswordModal open={pwOpen} onClose={() => setPwOpen(false)} />
    </header>
  );
}
