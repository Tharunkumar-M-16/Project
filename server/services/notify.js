import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { pushToUsers } from './events.js';

// Persist notifications and push a real-time "notification" event to each recipient.
async function deliver(recipientIds, message, type, extra = {}) {
  const ids = recipientIds.map(String);
  if (ids.length === 0) return;
  const docs = ids.map((recipient) => ({ recipient, message, type, ...extra }));
  await Notification.insertMany(docs);
  pushToUsers(ids, 'notification', { message, type, ...extra, createdAt: new Date().toISOString() });
}

// Notify one user.
export async function notifyUser(userId, message, type = 'info', extra = {}) {
  await deliver([userId], message, type, extra);
}

// Notify every student enrolled in a class.
export async function notifyClassStudents(liveClass, message, type = 'info') {
  const students = liveClass.students || [];
  await deliver(students, message, type, { classId: liveClass._id });
}

// Notify every student (used for feed posts / global tests).
export async function notifyAllStudents(message, type = 'info') {
  const students = await User.find({ role: 'student' }).select('_id');
  await deliver(students.map((s) => s._id), message, type);
}
