import LiveClass from '../models/Class.js';
import Test from '../models/Test.js';
import { notifyClassStudents } from '../services/notify.js';
import { classLifecycle } from '../services/classLifecycle.js';

// Compute lifecycle, and lazily persist the "ended" state so it's recorded.
async function withLifecycle(doc) {
  const lc = classLifecycle(doc);
  if (lc.status === 'ended' && doc.status !== 'ended') {
    doc.status = 'ended';
    doc.endedAt = new Date(lc.endsAt);
    await doc.save();
  }
  return { ...doc.toObject(), lifecycle: lc };
}

// POST /api/classes — tutor creates a live class
export const createClass = async (req, res) => {
  const { title, subject, description, schedule, durationMins, meetingLink } = req.body;
  if (!title) return res.status(400).json({ message: 'Class title is required' });
  if (!schedule) return res.status(400).json({ message: 'A scheduled date & time is required' });

  const liveClass = await LiveClass.create({
    title, subject, description, schedule, durationMins,
    meetingLink, tutor: req.user._id,
  });
  if (!liveClass.meetingLink) {
    liveClass.meetingLink = `https://meet.jit.si/ReadyScore-${liveClass._id}`;
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
  }
  const classes = await LiveClass.find(filter).populate('tutor', 'name email').sort('-createdAt');
  res.json(await Promise.all(classes.map(withLifecycle)));
};

// GET /api/classes/:id
export const getClass = async (req, res) => {
  const liveClass = await LiveClass.findById(req.params.id)
    .populate('tutor', 'name email')
    .populate('students', 'name email');
  if (!liveClass) return res.status(404).json({ message: 'Class not found' });
  res.json(await withLifecycle(liveClass));
};

// DELETE /api/classes/:id — tutor can remove a class ONLY after it has ended
export const deleteClass = async (req, res) => {
  const liveClass = await LiveClass.findById(req.params.id);
  if (!liveClass) return res.status(404).json({ message: 'Class not found' });
  if (!liveClass.tutor.equals(req.user._id) && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only the class tutor can delete this class' });
  }
  const lc = classLifecycle(liveClass);
  if (lc.status !== 'ended') {
    return res.status(400).json({ message: 'You can only delete a class after it has ended' });
  }
  await Test.deleteMany({ classId: liveClass._id }); // clean up its tests
  await liveClass.deleteOne();
  res.json({ message: 'Class deleted' });
};

// POST /api/classes/:id/enroll — student joins a class
export const enrollClass = async (req, res) => {
  const liveClass = await LiveClass.findById(req.params.id);
  if (!liveClass) return res.status(404).json({ message: 'Class not found' });
  if (liveClass.students.some((s) => s.equals(req.user._id))) {
    return res.status(400).json({ message: 'Already enrolled' });
  }
  liveClass.students.push(req.user._id);
  await liveClass.save();
  res.json({ message: 'Enrolled', classId: liveClass._id });
};

// POST /api/classes/:id/documents — tutor attaches a document/resource
export const addDocument = async (req, res) => {
  const { title, url } = req.body;
  if (!title || !url) return res.status(400).json({ message: 'Document title and url are required' });
  const liveClass = await LiveClass.findById(req.params.id);
  if (!liveClass) return res.status(404).json({ message: 'Class not found' });
  if (!liveClass.tutor.equals(req.user._id) && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only the class tutor can add documents' });
  }
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
  if (!liveClass.tutor.equals(req.user._id) && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only the class tutor can edit documents' });
  }
  const doc = liveClass.documents.id(req.params.docId);
  if (!doc) return res.status(404).json({ message: 'Document not found' });
  if (title !== undefined) doc.title = title;
  if (url !== undefined) doc.url = url;
  await liveClass.save();
  await notifyClassStudents(liveClass, `Document updated in "${liveClass.title}": ${doc.title}`, 'document');
  res.json(liveClass.documents);
};

// DELETE /api/classes/:id/documents/:docId — tutor removes a document
export const deleteDocument = async (req, res) => {
  const liveClass = await LiveClass.findById(req.params.id);
  if (!liveClass) return res.status(404).json({ message: 'Class not found' });
  if (!liveClass.tutor.equals(req.user._id) && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only the class tutor can remove documents' });
  }
  const doc = liveClass.documents.id(req.params.docId);
  if (!doc) return res.status(404).json({ message: 'Document not found' });
  doc.deleteOne();
  await liveClass.save();
  res.json(liveClass.documents);
};
