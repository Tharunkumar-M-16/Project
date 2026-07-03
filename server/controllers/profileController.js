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

const isYmd = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
const serverDay = () => new Date().toISOString().slice(0, 10);
// Shift a YYYY-MM-DD by whole days (UTC math on a date-only string is exact).
const shiftDay = (ymd, days) => {
  const d = new Date(ymd + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};
const prevDay = (ymd) => shiftDay(ymd, -1);
// Resolve the student's local calendar day. The client sends its own date so
// "once per day" tracks the student's local midnight, not the server's UTC one.
// Any real timezone is within ±1 day of UTC; reject anything outside that so a
// client can't backfill or race the streak far into the future.
const resolveToday = (clientDate) => {
  const server = serverDay();
  if (!isYmd(clientDate)) return server;
  const ok = [prevDay(server), server, shiftDay(server, 1)];
  return ok.includes(clientDate) ? clientDate : server;
};

// PUT /api/profile — a user updates their own profile details
export const updateProfile = async (req, res) => {
  const user = req.user;
  const { name, avatar, phone, college, degree } = req.body;
  if (name) user.name = String(name).trim();
  if (avatar !== undefined) user.avatar = avatar;
  if (phone !== undefined) user.phone = String(phone).trim();
  if (college !== undefined) user.college = String(college).trim();
  if (degree !== undefined) user.degree = String(degree).trim();
  await user.save();
  res.json({ user: sanitize(user) });
};

// POST /api/profile/attendance — student marks today's attendance (once per day)
export const markDailyAttendance = async (req, res) => {
  const p = req.user.studentProfile;
  const today = resolveToday(req.body?.date);
  if (p.lastAttendance === today) {
    return res.json({ alreadyMarked: true, streak: p.streak, activeDays: p.activeDays, attendanceDates: p.attendanceDates });
  }
  p.streak = p.lastAttendance === prevDay(today) ? (p.streak || 0) + 1 : 1;
  p.lastAttendance = today;
  p.activeDays = (p.activeDays || 0) + 1;
  p.attendanceDates = [...(p.attendanceDates || []), today].slice(-90); // keep last 90 days
  await req.user.save();
  res.json({ alreadyMarked: false, streak: p.streak, activeDays: p.activeDays, attendanceDates: p.attendanceDates });
};
