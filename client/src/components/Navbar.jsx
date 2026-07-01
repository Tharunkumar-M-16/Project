import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const roleBadge = {
  student: 'bg-blue-100 text-blue-700',
  tutor: 'bg-emerald-100 text-emerald-700',
  mentor: 'bg-amber-100 text-amber-700',
  admin: 'bg-rose-100 text-rose-700',
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/dashboard" className="flex items-center gap-2 font-bold text-brand-700">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white">R</span>
          ReadyScore
        </Link>
        {user && (
          <div className="flex items-center gap-3">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${roleBadge[user.role]}`}>
              {user.role}
            </span>
            <span className="hidden text-sm text-slate-600 sm:inline">{user.name}</span>
            <button onClick={handleLogout} className="btn-ghost text-sm">
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
