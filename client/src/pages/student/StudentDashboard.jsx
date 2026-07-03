import { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import AttendanceCard from '../../components/AttendanceCard.jsx';
import Messages from '../../components/Messages.jsx';
import ProfileForm from '../../components/ProfileForm.jsx';
import ClassCalendar from '../../components/ClassCalendar.jsx';
import Tabs from '../../components/Tabs.jsx';
import StudentClasses from './StudentClasses.jsx';
import PostsFeed from './PostsFeed.jsx';

const TABS = [
  { key: 'home', icon: '🏠', label: 'Home' },
  { key: 'calendar', icon: '🗓️', label: 'Calendar' },
  { key: 'chat', icon: '💬', label: 'Chat' },
  { key: 'profile', icon: '👤', label: 'Profile' },
];

export default function StudentDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState('home');

  return (
    <div className="space-y-6 pb-24 sm:pb-0">
      <div className="hero bg-gradient-to-br from-brand-600 via-indigo-600 to-violet-600">
        <p className="text-sm font-medium uppercase tracking-wider text-white/70">Student workspace</p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Hi {user.name.split(' ')[0]} 👋</h1>
        <p className="mt-1 max-w-lg text-white/85">Your live classes, chat, and study tools — all in one place.</p>
      </div>

      <Tabs tabs={TABS} value={tab} onChange={setTab} />

      {tab === 'home' && (
        <div className="grid gap-6 lg:grid-cols-3">
          <aside className="order-1 space-y-6 lg:order-2 lg:col-span-1">
            <AttendanceCard />
          </aside>
          <div className="order-2 space-y-6 lg:order-1 lg:col-span-2">
            <StudentClasses />
            <PostsFeed />
          </div>
        </div>
      )}
      {tab === 'calendar' && <ClassCalendar />}
      {tab === 'chat' && <Messages />}
      {tab === 'profile' && <ProfileForm />}
    </div>
  );
}
