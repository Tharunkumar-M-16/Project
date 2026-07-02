import { useAuth } from '../context/AuthContext.jsx';
import ForcePasswordChange from '../components/ForcePasswordChange.jsx';
import StudentDashboard from './student/StudentDashboard.jsx';
import TutorDashboard from './tutor/TutorDashboard.jsx';
import MentorDashboard from './MentorDashboard.jsx';
import AdminDashboard from './AdminDashboard.jsx';

// Routes each role to its own dashboard.
export default function Dashboard() {
  const { user } = useAuth();

  // First-login / post-reset: force a password change before anything else.
  if (user.mustChangePassword) return <ForcePasswordChange />;

  switch (user.role) {
    case 'student':
      return <StudentDashboard />;
    case 'tutor':
      return <TutorDashboard />;
    case 'mentor':
      return <MentorDashboard />;
    case 'admin':
      return <AdminDashboard />;
    default:
      return <p>Unknown role.</p>;
  }
}
