import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Fail fast at startup if the signing secret is missing/weak — a missing secret
// silently breaks token verification instead of erroring clearly.
export function assertAuthConfig() {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error('JWT_SECRET is not set. Add it to server/.env.');
  if (process.env.NODE_ENV === 'production' && s.length < 24) {
    throw new Error('JWT_SECRET is too short for production. Use a long random string (32+ chars).');
  }
}

async function resolveUser(token) {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  return User.findById(decoded.id);
}

// Verify JWT (from the Authorization header) and attach the user to req.
export const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) return res.status(401).json({ message: 'Not authorized, no token' });
  try {
    req.user = await resolveUser(token);
    if (!req.user) return res.status(401).json({ message: 'User not found' });
    next();
  } catch {
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

// Same as protect but reads the token from ?token= (EventSource can't set headers).
export const protectQuery = async (req, res, next) => {
  const token = req.query.token;
  if (!token) return res.status(401).json({ message: 'Not authorized, no token' });
  try {
    req.user = await resolveUser(token);
    if (!req.user) return res.status(401).json({ message: 'User not found' });
    next();
  } catch {
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

// Restrict a route to specific roles: authorize('admin', 'tutor')
export const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res
      .status(403)
      .json({ message: `Role '${req.user.role}' is not allowed to access this resource` });
  }
  next();
};
