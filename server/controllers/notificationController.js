import Notification from '../models/Notification.js';

// GET /api/notifications — my notifications, newest first (last 50)
export const myNotifications = async (req, res) => {
  const items = await Notification.find({ recipient: req.user._id }).sort('-createdAt').limit(50);
  const unread = await Notification.countDocuments({ recipient: req.user._id, read: false });
  res.json({ notifications: items, unread });
};

// PUT /api/notifications/read-all — mark all mine as read
export const markAllRead = async (req, res) => {
  await Notification.updateMany({ recipient: req.user._id, read: false }, { read: true });
  res.json({ message: 'All marked read' });
};

// PUT /api/notifications/:id/read — mark one mine as read
export const markOneRead = async (req, res) => {
  await Notification.updateOne({ _id: req.params.id, recipient: req.user._id }, { read: true });
  res.json({ message: 'Marked read' });
};
