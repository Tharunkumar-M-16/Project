import { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import Notifications from '../../components/Notifications.jsx';
import AttendanceCard from '../../components/AttendanceCard.jsx';
import AIChat from '../../components/AIChat.jsx';
import Messages from '../../components/Messages.jsx';
import ProfileForm from '../../components/ProfileForm.jsx';
import ClassCalendar from '../../components/ClassCalendar.jsx';
import StudentClasses from './StudentClasses.jsx';
import PostsFeed from './PostsFeed.jsx';

const TABS = [
  ['home', '🏠 Home'],
  ['calendar', '🗓️ Calendar'],
  ['chat', '💬 Chat'],
  ['ai', '✨ Ask AI'],
  ['profile', '👤 Profile'],
];

export default function StudentDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState('home');

  return (
    <div className="space-y-6">
      <div className="hero bg-gradient-to-br from-brand-600 via-indigo-600 to-violet-600">
        <p className="text-sm font-medium uppercase tracking-wider text-white/70">Student workspace</p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Hi {user.name.split(' ')[0]} 👋</h1>
        <p className="mt-1 max-w-lg text-white/85">Your live classes, chat, and study tools — all in one place.</p>
      </div>

      <div className="tab-list">
        {TABS.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`tab ${tab === key ? 'tab-active' : ''}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'home' && (
        <div className="space-y-6">
          <AttendanceCard />
          <Notifications />
          <StudentClasses />
          <PostsFeed />
        </div>
      )}
      {tab === 'calendar' && <ClassCalendar />}
      {tab === 'chat' && <Messages />}
      {tab === 'ai' && <AIChat />}
      {tab === 'profile' && <ProfileForm />}
    </div>
  );
}
