import User from '../models/User.js';

const sanitize = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  avatar: user.avatar,
  phone: user.phone,
  college: user.college,
  degree: user.degree,
  studentProfile: user.studentProfile,
});

const todayStr = () => new Date().toISOString().slice(0, 10);
const yesterdayStr = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
};

// PUT /api/profile — a user updates their own profile details
export const updateProfile = async (req, res) => {
  const user = req.user;
  const { name, avatar, targetRole, phone, college, degree } = req.body;
  if (name) user.name = String(name).trim();
  if (avatar !== undefined) user.avatar = avatar;
  if (phone !== undefined) user.phone = String(phone).trim();
  if (college !== undefined) user.college = String(college).trim();
  if (degree !== undefined) user.degree = String(degree).trim();
  if (targetRole !== undefined) user.studentProfile.targetRole = targetRole;
  await user.save();
  res.json({ user: sanitize(user) });
};

// POST /api/profile/attendance — student marks today's attendance (once per day)
export const markDailyAttendance = async (req, res) => {
  const p = req.user.studentProfile;
  const today = todayStr();
  if (p.lastAttendance === today) {
    return res.json({ alreadyMarked: true, streak: p.streak, activeDays: p.activeDays, attendanceDates: p.attendanceDates });
  }
  p.streak = p.lastAttendance === yesterdayStr() ? (p.streak || 0) + 1 : 1;
  p.lastAttendance = today;
  p.activeDays = (p.activeDays || 0) + 1;
  p.attendanceDates = [...(p.attendanceDates || []), today].slice(-90); // keep last 90 days
  await req.user.save();
  res.json({ alreadyMarked: false, streak: p.streak, activeDays: p.activeDays, attendanceDates: p.attendanceDates });
};

// PUT /api/profile/skills — replace the student's self-declared skill list.
// Students CANNOT mark a skill "verified" (earned only via a skill-tagged test);
// previously-verified skills keep their verified status and floor level.
export const updateSkills = async (req, res) => {
  const user = req.user;
  const { skills } = req.body;
  if (!Array.isArray(skills)) return res.status(400).json({ message: 'skills must be an array' });
  const prevVerified = new Map(
    (user.studentProfile.skills || []).filter((s) => s.verified).map((s) => [s.name.toLowerCase(), s])
  );
  user.studentProfile.skills = skills
    .filter((s) => s?.name)
    .map((s) => {
      const name = String(s.name).trim();
      const earned = prevVerified.get(name.toLowerCase());
      const level = Math.max(0, Math.min(100, Number(s.level) || 0));
      return earned ? { name, level: Math.max(level, earned.level), verified: true } : { name, level, verified: false };
    });
  await user.save();
  res.json({ studentProfile: user.studentProfile });
};

// PUT /api/profile/metrics — a student self-reports ONLY portfolio projects.
export const updateMetrics = async (req, res) => {
  const user = req.user;
  if (req.body.projectsCompleted !== undefined) {
    user.studentProfile.projectsCompleted = Math.max(0, Number(req.body.projectsCompleted) || 0);
  }
  await user.save();
  res.json({ studentProfile: user.studentProfile });
};
