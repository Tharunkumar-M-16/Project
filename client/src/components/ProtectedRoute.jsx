import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

// Guards routes: requires login, optionally restricts to specific roles.
export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="grid min-h-screen place-items-center text-slate-400">Loading…</div>;
  }
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
}
