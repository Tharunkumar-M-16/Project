import LiveClass from '../models/Class.js';
import Test from '../models/Test.js';
import User from '../models/User.js';
import { notifyClassStudents } from '../services/notify.js';
import { classLifecycle } from '../services/classLifecycle.js';
import { safeUrl } from '../utils/sanitize.js';

// Attach computed lifecycle to a plain object (does not persist).
function attach(doc) {
  const obj = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  return { ...obj, lifecycle: classLifecycle(obj) };
}

// Compute lifecycle and lazily persist the "ended" state for a single doc.
async function withLifecycle(doc) {
  const lc = classLifecycle(doc);
  if (lc.status === 'ended' && doc.status !== 'ended') {
    doc.status = 'ended';
    doc.endedAt = new Date(lc.endsAt);
    await doc.save();
  }
  return { ...doc.toObject(), lifecycle: lc };
}

const canManage = (liveClass, user) => liveClass.tutor.equals(user._id) || user.role === 'admin';

// POST /api/classes — tutor creates a live class
export const createClass = async (req, res) => {
  const { title, subject, description, schedule, durationMins, meetingLink } = req.body;
  if (!title) return res.status(400).json({ message: 'Class title is required' });
  if (!schedule) return res.status(400).json({ message: 'A scheduled date & time is required' });
  const dur = Number(durationMins) || 60;
  if (dur < 5 || dur > 600) return res.status(400).json({ message: 'Duration must be between 5 and 600 minutes' });

  // A custom meeting link must be a safe http(s) URL; otherwise auto-generate one below.
  const cleanLink = meetingLink ? safeUrl(meetingLink) : '';
  if (meetingLink && !cleanLink) return res.status(400).json({ message: 'Meeting link must be a valid http(s) URL' });

  const liveClass = await LiveClass.create({
    title, subject, description, schedule, durationMins: dur,
    meetingLink: cleanLink, tutor: req.user._id,
  });
  if (!liveClass.meetingLink) {
    liveClass.meetingLink = `https://meet.jit.si/5RingsClass-${liveClass._id}`;
    await liveClass.save();
  }
  res.status(201).json(await withLifecycle(liveClass));
};

// GET /api/classes — list classes (each with computed lifecycle)
//   ?scope=mine  -> tutor's own / student's enrolled
export const listClasses = async (req, res) => {
  let filter = {};
  if (req.query.scope === 'mine') {
    filter = req.user.role === 'tutor' ? { tutor: req.user._id } : { students: req.user._id };
  } else if (req.user.role === 'student' && req.user.assignedTutor) {
    // Students browse classes from their own tutor's cohort.
    filter = { tutor: req.user.assignedTutor };
  }
  const classes = await LiveClass.find(filter).populate('tutor', 'name email').sort('-createdAt');

  // Bulk-persist any classes whose window has closed (avoids a save() per doc).
  const toEnd = classes.filter((c) => c.status !== 'ended' && classLifecycle(c).status === 'ended');
  if (toEnd.length) {
    await LiveClass.updateMany(
      { _id: { $in: toEnd.map((c) => c._id) } },
      [{ $set: { status: 'ended', endedAt: { $add: ['$schedule', { $multiply: ['$durationMins', 60000] }] } } }]
    );
  }

  const isStaff = req.user.role === 'mentor' || req.user.role === 'admin';
  res.json(
    classes.map((c) => {
      const out = attach(c);
      out.studentCount = c.students.length;
      // Privacy: only staff/owner see the raw enrolled-student list.
      const owner = c.tutor?._id?.equals(req.user._id);
      if (!isStaff && !owner) {
        delete out.students;
        delete out.attendance;
      }
      return out;
    })
  );
};

// GET /api/classes/:id
export const getClass = async (req, res) => {
  const liveClass = await LiveClass.findById(req.params.id)
    .populate('tutor', 'name email')
    .populate('students', 'name email');
  if (!liveClass) return res.status(404).json({ message: 'Class not found' });

  const out = await withLifecycle(liveClass);
  const owner = liveClass.tutor._id.equals(req.user._id);
  const isStaff = req.user.role === 'mentor' || req.user.role === 'admin';
  if (!owner && !isStaff) {
    // Don't leak the enrolled-student roster to other students.
    out.studentCount = liveClass.students.length;
    delete out.students;
    delete out.attendance;
  }
  res.json(out);
};

// DELETE /api/classes/:id — tutor can remove a class ONLY after it has ended
export const deleteClass = async (req, res) => {
  const liveClass = await LiveClass.findById(req.params.id);
  if (!liveClass) return res.status(404).json({ message: 'Class not found' });
  if (!canManage(liveClass, req.user)) {
    return res.status(403).json({ message: 'Only the class tutor can delete this class' });
  }
  if (classLifecycle(liveClass).status !== 'ended') {
    return res.status(400).json({ message: 'You can only delete a class after it has ended' });
  }
  await Test.deleteMany({ classId: liveClass._id });
  await liveClass.deleteOne();
  res.json({ message: 'Class deleted' });
};

// POST /api/classes/:id/enroll — student joins a class (atomic; no duplicates)
export const enrollClass = async (req, res) => {
  const liveClass = await LiveClass.findById(req.params.id);
  if (!liveClass) return res.status(404).json({ message: 'Class not found' });
  // Cohort rule: a student must have an assigned tutor and may only enroll in
  // that tutor's classes. (Previously a student with no tutor could enroll anywhere.)
  if (!req.user.assignedTutor || !liveClass.tutor.equals(req.user.assignedTutor)) {
    return res.status(403).json({ message: 'You can only enroll in your own tutor’s classes' });
  }
  const result = await LiveClass.updateOne(
    { _id: liveClass._id, students: { $ne: req.user._id } },
    { $addToSet: { students: req.user._id } }
  );
  if (result.modifiedCount === 0) return res.status(400).json({ message: 'Already enrolled' });
  res.json({ message: 'Enrolled', classId: liveClass._id });
};

// POST /api/classes/:id/attendance — record that a student joined the live session
export const markAttendance = async (req, res) => {
  const liveClass = await LiveClass.findById(req.params.id);
  if (!liveClass) return res.status(404).json({ message: 'Class not found' });
  if (!liveClass.students.some((s) => s.equals(req.user._id))) {
    return res.status(403).json({ message: 'Enroll first to join this class' });
  }
  if (classLifecycle(liveClass).status !== 'live') {
    return res.status(400).json({ message: 'This class is not live right now' });
  }
  if (!liveClass.attendance.some((a) => a.student.equals(req.user._id))) {
    liveClass.attendance.push({ student: req.user._id });
    await liveClass.save();
  }
  res.json({ meetingLink: liveClass.meetingLink });
};

// GET /api/classes/:id/attendance — attendance monitor: how long the live ran,
// who attended (with join time + approx minutes present) and who was absent.
// Visible to the class's own tutor and to mentors/admins.
export const getClassAttendance = async (req, res) => {
  const liveClass = await LiveClass.findById(req.params.id)
    .populate('tutor', 'name username')
    .populate('students', 'name username')
    .populate('attendance.student', 'name username');
  if (!liveClass) return res.status(404).json({ message: 'Class not found' });

  const isStaff = req.user.role === 'mentor' || req.user.role === 'admin';
  const isOwner = liveClass.tutor._id.equals(req.user._id);
  if (!isStaff && !isOwner) {
    return res.status(403).json({ message: 'Not allowed to view this attendance' });
  }

  const lc = classLifecycle(liveClass);
  const endMs = liveClass.endedAt ? new Date(liveClass.endedAt).getTime() : lc.endsAt;
  // "Present" minutes = from when they joined until the class ended (or now, if
  // still live), capped at the class length. We don't track leave events, so this
  // is an upper-bound estimate of time in the room.
  const attendance = liveClass.attendance.map((a) => {
    const joined = a.joinedAt ? new Date(a.joinedAt).getTime() : null;
    let attendedMinutes = null;
    if (joined != null && endMs != null) {
      const until = lc.status === 'live' ? Date.now() : endMs;
      attendedMinutes = Math.max(0, Math.min(lc.durationMins, Math.round((until - joined) / 60000)));
    }
    return { student: a.student, joinedAt: a.joinedAt, attendedMinutes };
  });

  const attendedIds = new Set(liveClass.attendance.map((a) => String(a.student?._id || a.student)));
  const absentees = liveClass.students.filter((s) => !attendedIds.has(String(s._id)));

  res.json({
    _id: liveClass._id,
    title: liveClass.title,
    subject: liveClass.subject,
    tutor: liveClass.tutor,
    status: lc.status,
    schedule: liveClass.schedule,
    durationMins: lc.durationMins,
    ranMinutes: lc.liveMinutes, // how long the live has run (full length once ended)
    endedAt: liveClass.endedAt,
    enrolledCount: liveClass.students.length,
    attendedCount: liveClass.attendance.length,
    attendance,
    absentees,
  });
};

// POST /api/classes/:id/documents — tutor attaches a document/resource
export const addDocument = async (req, res) => {
  const { title } = req.body;
  const url = safeUrl(req.body.url);
  if (!title || !url) return res.status(400).json({ message: 'Document title and a valid http(s) url are required' });
  const liveClass = await LiveClass.findById(req.params.id);
  if (!liveClass) return res.status(404).json({ message: 'Class not found' });
  if (!canManage(liveClass, req.user)) return res.status(403).json({ message: 'Only the class tutor can add documents' });
  liveClass.documents.push({ title, url });
  await liveClass.save();
  await notifyClassStudents(liveClass, `New document in "${liveClass.title}": ${title}`, 'document');
  res.status(201).json(liveClass.documents);
};

// PUT /api/classes/:id/documents/:docId — tutor updates a document (notifies students)
export const updateDocument = async (req, res) => {
  const { title, url } = req.body;
  const liveClass = await LiveClass.findById(req.params.id);
  if (!liveClass) return res.status(404).json({ message: 'Class not found' });
  if (!canManage(liveClass, req.user)) return res.status(403).json({ message: 'Only the class tutor can edit documents' });
  const doc = liveClass.documents.id(req.params.docId);
  if (!doc) return res.status(404).json({ message: 'Document not found' });
  if (title !== undefined) doc.title = title;
  if (url !== undefined) {
    const clean = safeUrl(url);
    if (!clean) return res.status(400).json({ message: 'A valid http(s) url is required' });
    doc.url = clean;
  }
  await liveClass.save();
  await notifyClassStudents(liveClass, `Document updated in "${liveClass.title}": ${doc.title}`, 'document');
  res.json(liveClass.documents);
};

// DELETE /api/classes/:id/documents/:docId — tutor removes a document
export const deleteDocument = async (req, res) => {
  const liveClass = await LiveClass.findById(req.params.id);
  if (!liveClass) return res.status(404).json({ message: 'Class not found' });
  if (!canManage(liveClass, req.user)) return res.status(403).json({ message: 'Only the class tutor can remove documents' });
  const doc = liveClass.documents.id(req.params.docId);
  if (!doc) return res.status(404).json({ message: 'Document not found' });
  doc.deleteOne();
  await liveClass.save();
  res.json(liveClass.documents);
};
