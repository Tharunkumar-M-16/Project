import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';

const publicUser = (user) => ({
  _id: user._id,
  name: user.name,
  username: user.username,
  email: user.email,
  role: user.role,
  avatar: user.avatar,
  phone: user.phone || '',
  college: user.college || '',
  degree: user.degree || '',
  assignedTutor: user.assignedTutor || null,
  mustChangePassword: !!user.mustChangePassword,
  createdAt: user.createdAt,
  studentProfile: user.studentProfile,
});

// POST /api/auth/login  — login by username (ID) + password
export const login = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }
  const user = await User.findOne({ username: String(username).toLowerCase().trim() }).select('+password');
  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ message: 'Invalid ID or password' });
  }
  res.json({ token: generateToken(user._id), user: publicUser(user) });
};

// GET /api/auth/me
export const getMe = async (req, res) => {
  res.json({ user: publicUser(req.user) });
};

// PUT /api/auth/password — a logged-in user changes their OWN password
export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ message: 'New password must be at least 6 characters' });
  }
  const user = await User.findById(req.user._id).select('+password');
  // Users forced to change their password skip the current-password check on first change.
  if (!user.mustChangePassword) {
    if (!currentPassword || !(await user.matchPassword(currentPassword))) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
  }
  user.password = newPassword;
  user.mustChangePassword = false;
  await user.save();
  res.json({ message: 'Password updated', user: publicUser(user) });
};

export { publicUser };
