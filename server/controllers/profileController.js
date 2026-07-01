import User from '../models/User.js';

// PUT /api/profile  — student updates their own profile / metrics
export const updateProfile = async (req, res) => {
  const user = req.user;
  const { name, avatar, targetRole } = req.body;

  if (name) user.name = name;
  if (avatar !== undefined) user.avatar = avatar;
  if (targetRole !== undefined) user.studentProfile.targetRole = targetRole;

  await user.save();
  res.json({ user: sanitize(user) });
};

// PUT /api/profile/skills — replace the student's skill list
// body: { skills: [{ name, level }] }
export const updateSkills = async (req, res) => {
  const user = req.user;
  const { skills } = req.body;
  if (!Array.isArray(skills)) {
    return res.status(400).json({ message: 'skills must be an array' });
  }
  user.studentProfile.skills = skills
    .filter((s) => s?.name)
    .map((s) => ({
      name: String(s.name).trim(),
      level: Math.max(0, Math.min(100, Number(s.level) || 0)),
      verified: !!s.verified,
    }));
  await user.save();
  res.json({ studentProfile: user.studentProfile });
};

// PUT /api/profile/metrics — bump the pillar metrics (demo/manual for MVP)
// body: { projectsCompleted, activeDays, mentorEndorsements, mockInterviews }
export const updateMetrics = async (req, res) => {
  const user = req.user;
  const p = user.studentProfile;
  const fields = ['projectsCompleted', 'activeDays', 'mentorEndorsements', 'mockInterviews'];
  for (const f of fields) {
    if (req.body[f] !== undefined) p[f] = Math.max(0, Number(req.body[f]) || 0);
  }
  await user.save();
  res.json({ studentProfile: user.studentProfile });
};

const sanitize = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  avatar: user.avatar,
  studentProfile: user.studentProfile,
});
