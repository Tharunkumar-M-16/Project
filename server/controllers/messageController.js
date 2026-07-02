import User from '../models/User.js';
import Message from '../models/Message.js';
import { pushToUser } from '../services/events.js';

// A student may chat only with their assigned tutor; a tutor only with their students.
async function counterpartAllowed(me, otherId) {
  const other = await User.findById(otherId).select('role assignedTutor name');
  if (!other) return null;
  if (me.role === 'student' && me.assignedTutor && String(me.assignedTutor) === String(other._id)) return other;
  if (me.role === 'tutor' && other.role === 'student' && String(other.assignedTutor) === String(me._id)) return other;
  return null;
}

// GET /api/messages — my conversations (student: their tutor; tutor: their students)
export const listConversations = async (req, res) => {
  let others = [];
  if (req.user.role === 'student' && req.user.assignedTutor) {
    const t = await User.findById(req.user.assignedTutor).select('name');
    if (t) others = [t];
  } else if (req.user.role === 'tutor') {
    others = await User.find({ assignedTutor: req.user._id, role: 'student' }).select('name');
  }
  const convos = await Promise.all(
    others.map(async (o) => {
      const last = await Message.findOne({
        $or: [{ from: req.user._id, to: o._id }, { from: o._id, to: req.user._id }],
      }).sort('-createdAt');
      const unread = await Message.countDocuments({ from: o._id, to: req.user._id, read: false });
      return {
        user: { _id: o._id, name: o.name },
        last: last ? { body: last.body, createdAt: last.createdAt, mine: String(last.from) === String(req.user._id) } : null,
        unread,
      };
    })
  );
  res.json(convos);
};

// GET /api/messages/unread — total unread across conversations (for a badge)
export const unreadCount = async (req, res) => {
  const unread = await Message.countDocuments({ to: req.user._id, read: false });
  res.json({ unread });
};

// GET /api/messages/:userId — the conversation with one counterpart (marks incoming read)
export const getConversation = async (req, res) => {
  const other = await counterpartAllowed(req.user, req.params.userId);
  if (!other) return res.status(403).json({ message: 'You cannot message this user' });
  const messages = await Message.find({
    $or: [{ from: req.user._id, to: other._id }, { from: other._id, to: req.user._id }],
  })
    .sort('createdAt')
    .limit(200);
  await Message.updateMany({ from: other._id, to: req.user._id, read: false }, { read: true });
  res.json({ user: { _id: other._id, name: other.name }, messages });
};

// POST /api/messages — send a message; pushes a real-time event to the recipient
export const sendMessage = async (req, res) => {
  const { to, body } = req.body;
  if (!body || !String(body).trim()) return res.status(400).json({ message: 'Message cannot be empty' });
  const other = await counterpartAllowed(req.user, to);
  if (!other) return res.status(403).json({ message: 'You cannot message this user' });
  const msg = await Message.create({ from: req.user._id, to: other._id, body: String(body).slice(0, 2000) });
  pushToUser(other._id, 'message', {
    _id: msg._id,
    from: String(req.user._id),
    fromName: req.user.name,
    body: msg.body,
    createdAt: msg.createdAt,
  });
  res.status(201).json(msg);
};
