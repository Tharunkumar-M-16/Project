import User from '../models/User.js';
import LiveClass from '../models/Class.js';
import Test from '../models/Test.js';

// GET /api/admin/stats — headline counts for the admin dashboard
export const getStats = async (req, res) => {
  const [total, students, tutors, mentors, classes, tests] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'student' }),
    User.countDocuments({ role: 'tutor' }),
    User.countDocuments({ role: 'mentor' }),
    LiveClass.countDocuments(),
    Test.countDocuments(),
  ]);
  res.json({ counts: { total, students, tutors, mentors, classes, tests } });
};
