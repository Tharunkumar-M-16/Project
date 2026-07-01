import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';

const publicUser = (user) => ({
  _id: user._id,
  name: user.name,
  username: user.username,
  email: user.email,
  role: user.role,
  avatar: user.avatar,
  studentProfile: user.studentProfile,
});

// POST /api/auth/login  — login by username (ID) + password
export const login = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }
  const user = await User.findOne({ username: username.toLowerCase().trim() }).select('+password');
  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ message: 'Invalid ID or password' });
  }
  res.json({ token: generateToken(user._id), user: publicUser(user) });
};

// GET /api/auth/me
export const getMe = async (req, res) => {
  res.json({ user: publicUser(req.user) });
};

export { publicUser };
