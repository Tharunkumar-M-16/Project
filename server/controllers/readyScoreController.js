import User from '../models/User.js';
import Role from '../models/Role.js';
import { computeReadyScore } from '../services/readyScore.js';

// GET /api/readyscore  — score for the logged-in student (their targetRole)
export const myReadyScore = async (req, res) => {
  const profile = req.user.studentProfile || {};
  const role = profile.targetRole
    ? await Role.findOne({ name: profile.targetRole })
    : null;
  res.json(computeReadyScore(profile, role));
};

// GET /api/readyscore/:roleName — score against ANY target role (what-if)
export const readyScoreForRole = async (req, res) => {
  const role = await Role.findOne({ name: req.params.roleName });
  if (!role) return res.status(404).json({ message: 'Role not found' });
  res.json(computeReadyScore(req.user.studentProfile || {}, role));
};

// GET /api/readyscore/user/:id — tutor/mentor/admin view of a student's score
export const readyScoreForUser = async (req, res) => {
  const student = await User.findById(req.params.id);
  if (!student) return res.status(404).json({ message: 'Student not found' });
  const role = student.studentProfile?.targetRole
    ? await Role.findOne({ name: student.studentProfile.targetRole })
    : null;
  res.json({
    student: { _id: student._id, name: student.name, email: student.email },
    ...computeReadyScore(student.studentProfile || {}, role),
  });
};
