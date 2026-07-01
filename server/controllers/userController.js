import User from '../models/User.js';
import LiveClass from '../models/Class.js';

// GET /api/users  — list users (mentor/admin). ?role= to filter.
export const listUsers = async (req, res) => {
  const filter = req.query.role ? { role: req.query.role } : {};
  const users = await User.find(filter).sort('-createdAt');

  // Enrich with a light activity summary for the "elaborate" admin/mentor view
  const enriched = await Promise.all(
    users.map(async (u) => {
      const obj = u.toObject();
      if (u.role === 'tutor') obj.classesCount = await LiveClass.countDocuments({ tutor: u._id });
      if (u.role === 'student') obj.enrolledCount = await LiveClass.countDocuments({ students: u._id });
      return obj;
    })
  );
  res.json(enriched);
};

// POST /api/users  — mentor/admin creates a student or tutor account
export const createUser = async (req, res) => {
  const { name, username, password, role, email } = req.body;
  if (!name || !username || !password) {
    return res.status(400).json({ message: 'Name, username (ID) and password are required' });
  }
  const allowed = ['student', 'tutor'];
  if (!allowed.includes(role)) {
    return res.status(400).json({ message: 'Mentor can only create student or tutor accounts' });
  }
  const exists = await User.findOne({ username: username.toLowerCase().trim() });
  if (exists) return res.status(400).json({ message: 'That ID is already taken' });

  const user = await User.create({
    name,
    username: username.toLowerCase().trim(),
    email: email || '',
    password,
    role,
    createdBy: req.user._id,
  });
  res.status(201).json({
    _id: user._id, name: user.name, username: user.username, role: user.role,
  });
};

// PUT /api/users/:id/password  — mentor/admin resets a user's password
export const resetPassword = async (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 3) {
    return res.status(400).json({ message: 'Password must be at least 3 characters' });
  }
  const user = await User.findById(req.params.id).select('+password');
  if (!user) return res.status(404).json({ message: 'User not found' });
  if (['admin', 'mentor'].includes(user.role)) {
    return res.status(403).json({ message: 'Cannot reset a staff account here' });
  }
  user.password = password;
  await user.save();
  res.json({ message: 'Password updated' });
};

// DELETE /api/users/:id  — mentor/admin removes a student/tutor account
export const deleteUser = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  if (['admin', 'mentor'].includes(user.role)) {
    return res.status(403).json({ message: 'Cannot delete a staff account' });
  }
  await user.deleteOne();
  res.json({ message: 'User removed' });
};
