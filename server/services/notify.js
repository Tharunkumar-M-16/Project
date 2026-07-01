import Notification from '../models/Notification.js';
import User from '../models/User.js';

// Create a notification for every student enrolled in a class.
export async function notifyClassStudents(liveClass, message, type = 'info') {
  const students = liveClass.students || [];
  if (students.length === 0) return;
  await Notification.insertMany(
    students.map((studentId) => ({ recipient: studentId, message, type, classId: liveClass._id }))
  );
}

// Create a notification for every student (used for feed posts / global tests).
export async function notifyAllStudents(message, type = 'info') {
  const students = await User.find({ role: 'student' }).select('_id');
  if (students.length === 0) return;
  await Notification.insertMany(students.map((s) => ({ recipient: s._id, message, type })));
}
