import User from '../models/User.js';
import LiveClass from '../models/Class.js';
import Test from '../models/Test.js';
import Post from '../models/Post.js';
import Notification from '../models/Notification.js';
import Message from '../models/Message.js';
import Role from '../models/Role.js';
import { notifyUser } from '../services/notify.js';
import { computeReadyScore } from '../services/readyScore.js';

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const publicFields = 'name username email role avatar phone college degree assignedTutor createdAt studentProfile';

// GET /api/users  — mentor/admin: everyone; tutor: only their own students.
// Query: ?role= ?q= ?page= ?limit=
export const listUsers = async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));

  const filter = {};
  if (req.user.role === 'tutor') {
    // A tutor is scoped to their cohort — their assigned students only.
    filter.role = 'student';
    filter.assignedTutor = req.user._id;
  } else if (req.query.role) {
    filter.role = req.query.role;
  }
  if (req.query.q) {
    const rx = new RegExp(escapeRegex(req.query.q), 'i');
    filter.$or = [{ name: rx }, { username: rx }];
  }

  const [total, users] = await Promise.all([
    User.countDocuments(filter),
    User.find(filter)
      .select(publicFields)
      .populate('assignedTutor', 'name username')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(limit),
  ]);

  // Enrich with a light activity summary.
  const enriched = await Promise.all(
    users.map(async (u) => {
      const obj = u.toObject();
      if (u.role === 'tutor') {
        const [classesCount, studentsCount] = await Promise.all([
          LiveClass.countDocuments({ tutor: u._id }),
          User.countDocuments({ assignedTutor: u._id }),
        ]);
        obj.classesCount = classesCount;
        obj.studentsCount = studentsCount;
      }
      if (u.role === 'student') obj.enrolledCount = await LiveClass.countDocuments({ students: u._id });
      return obj;
    })
  );
  res.json({ users: enriched, total, page, pages: Math.ceil(total / limit) || 1 });
};

// GET /api/users/tutors — list tutors (for the assign-tutor dropdown)
export const listTutors = async (req, res) => {
  const tutors = await User.find({ role: 'tutor' }).select('name username').sort('name');
  res.json(tutors);
};

// POST /api/users  — mentor/admin creates a student or tutor account
export const createUser = async (req, res) => {
  const { name, username, password, role, email, assignedTutor } = req.body;
  if (!name || !username || !password) {
    return res.status(400).json({ message: 'Name, username (ID) and password are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }
  if (!['student', 'tutor'].includes(role)) {
    return res.status(400).json({ message: 'You can only create student or tutor accounts' });
  }
  const uname = String(username).toLowerCase().trim();
  if (await User.findOne({ username: uname })) {
    return res.status(400).json({ message: 'That ID is already taken' });
  }

  const doc = {
    name,
    username: uname,
    email: email || '',
    password,
    role,
    createdBy: req.user._id,
    mustChangePassword: true, // force a change on first login
  };
  // Optionally attach a student to a tutor's cohort at creation.
  if (role === 'student' && assignedTutor) {
    const tutor = await User.findById(assignedTutor);
    if (!tutor || tutor.role !== 'tutor') return res.status(400).json({ message: 'Invalid tutor' });
    doc.assignedTutor = tutor._id;
    doc.studentProfile = { mentor: req.user._id };
  }

  const user = await User.create(doc);
  res.status(201).json({ _id: user._id, name: user.name, username: user.username, role: user.role, assignedTutor: user.assignedTutor });
};

// PUT /api/users/:id/tutor — mentor/admin (re)assigns a student to a tutor
export const assignTutor = async (req, res) => {
  const { tutorId } = req.body;
  const student = await User.findById(req.params.id);
  if (!student || student.role !== 'student') return res.status(404).json({ message: 'Student not found' });

  if (tutorId) {
    const tutor = await User.findById(tutorId);
    if (!tutor || tutor.role !== 'tutor') return res.status(400).json({ message: 'Invalid tutor' });
    student.assignedTutor = tutor._id;
    await student.save();
    await notifyUser(student._id, `You have been assigned to tutor ${tutor.name}.`, 'account');
  } else {
    student.assignedTutor = null;
    await student.save();
  }
  res.json({ message: 'Tutor updated', assignedTutor: student.assignedTutor });
};

// POST /api/users/:id/endorse — mentor/admin endorses a student (Soft-signals pillar)
export const endorseStudent = async (req, res) => {
  const student = await User.findById(req.params.id);
  if (!student || student.role !== 'student') return res.status(404).json({ message: 'Student not found' });
  student.studentProfile.mentorEndorsements = (student.studentProfile.mentorEndorsements || 0) + 1;
  await student.save();
  await notifyUser(student._id, `${req.user.name} endorsed you! 🏅`, 'achievement');
  res.json({ message: 'Endorsed', mentorEndorsements: student.studentProfile.mentorEndorsements });
};

// GET /api/users/:id — detailed profile + activity (mentor/admin)
export const getUserDetail = async (req, res) => {
  const u = await User.findById(req.params.id).populate('assignedTutor', 'name username');
  if (!u) return res.status(404).json({ message: 'User not found' });
  const obj = u.toObject();
  if (u.role === 'student') {
    const [enrolled, subAgg] = await Promise.all([
      LiveClass.countDocuments({ students: u._id }),
      Test.aggregate([
        { $unwind: '$submissions' },
        { $match: { 'submissions.student': u._id } },
        { $group: { _id: null, count: { $sum: 1 }, avg: { $avg: '$submissions.percent' } } },
      ]),
    ]);
    obj.enrolledCount = enrolled;
    obj.submissionsCount = subAgg[0]?.count || 0;
    obj.avgScore = Math.round(subAgg[0]?.avg || 0);
    const role = u.studentProfile?.targetRole ? await Role.findOne({ name: u.studentProfile.targetRole }) : null;
    obj.readyScore = computeReadyScore(u.studentProfile || {}, role);
  }
  res.json(obj);
};

// PUT /api/users/:id/password  — mentor/admin resets a user's password
export const resetPassword = async (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }
  const user = await User.findById(req.params.id).select('+password');
  if (!user) return res.status(404).json({ message: 'User not found' });
  if (['admin', 'mentor'].includes(user.role)) {
    return res.status(403).json({ message: 'Cannot reset a staff account here' });
  }
  user.password = password;
  user.mustChangePassword = true;
  await user.save();
  await notifyUser(user._id, 'Your password was reset. Please set a new one.', 'account');
  res.json({ message: 'Password updated' });
};

// DELETE /api/users/:id  — mentor/admin removes a student/tutor account (with cascade)
export const deleteUser = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  if (['admin', 'mentor'].includes(user.role)) {
    return res.status(403).json({ message: 'Cannot delete a staff account' });
  }

  if (user.role === 'tutor') {
    // Remove the tutor's classes + any tests tied to them, their posts + tests, and unassign students.
    const classes = await LiveClass.find({ tutor: user._id }).select('_id');
    const classIds = classes.map((c) => c._id);
    await Test.deleteMany({ $or: [{ tutor: user._id }, { classId: { $in: classIds } }] });
    const posts = await Post.find({ tutor: user._id }).select('_id');
    await Test.deleteMany({ postId: { $in: posts.map((p) => p._id) } });
    await Post.deleteMany({ tutor: user._id });
    await LiveClass.deleteMany({ tutor: user._id });
    await User.updateMany({ assignedTutor: user._id }, { $set: { assignedTutor: null } });
  } else if (user.role === 'student') {
    // Remove the student from every class + attendance, and drop their submissions.
    await LiveClass.updateMany(
      { $or: [{ students: user._id }, { 'attendance.student': user._id }] },
      { $pull: { students: user._id, attendance: { student: user._id } } }
    );
    await Test.updateMany(
      { 'submissions.student': user._id },
      { $pull: { submissions: { student: user._id } } }
    );
  }
  await Notification.deleteMany({ recipient: user._id });
  await Message.deleteMany({ $or: [{ from: user._id }, { to: user._id }] });
  await user.deleteOne();
  res.json({ message: 'User removed' });
};
