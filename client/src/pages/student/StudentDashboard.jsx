import { useAuth } from '../../context/AuthContext.jsx';
import Notifications from '../../components/Notifications.jsx';
import StudentClasses from './StudentClasses.jsx';
import PostsFeed from './PostsFeed.jsx';

export default function StudentDashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Hi {user.name.split(' ')[0]} 👋</h1>
        <p className="text-slate-500">Your live classes, posts, documents and tests — all in one place.</p>
      </div>

      <Notifications />

      {/* Live classes with their documents & tests */}
      <StudentClasses />

      {/* Feed of tutor posts (documents, links, tests) */}
      <PostsFeed />
    </div>
  );
}
