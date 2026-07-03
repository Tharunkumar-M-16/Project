import Test from '../models/Test.js';
import LiveClass from '../models/Class.js';
import Post from '../models/Post.js';
import { notifyClassStudents, notifyAllStudents } from '../services/notify.js';

// Strip correct answers before sending a test to a student.
export const forStudent = (test, studentId) => {
  const mine = test.submissions.find((s) => s.student.equals(studentId));
  return {
    _id: test._id,
    title: test.title,
    classId: test.classId,
    postId: test.postId,
    skill: test.skill,
    dueDate: test.dueDate,
    questions: test.questions.map((q) => ({ _id: q._id, text: q.text, options: q.options })),
    mySubmission: mine
      ? { score: mine.score, total: mine.total, percent: mine.percent, submittedAt: mine.submittedAt }
      : null,
  };
};

// Validate a question array coming from the client / AI.
function validateQuestions(questions) {
  if (!Array.isArray(questions) || questions.length === 0) return 'At least one question is required';
  for (const q of questions) {
    if (!q || !q.text || typeof q.text !== 'string') return 'Every question needs text';
    if (!Array.isArray(q.options) || q.options.length < 2) return 'Every question needs at least 2 options';
    if (!Number.isInteger(q.correctIndex) || q.correctIndex < 0 || q.correctIndex >= q.options.length) {
      return 'Each question needs a valid correct answer';
    }
  }
  return null;
}

// POST /api/tests — tutor assigns a test to a class OR a post
export const createTest = async (req, res) => {
  const { title, classId, postId, skill, dueDate, questions } = req.body;
  if (!title) return res.status(400).json({ message: 'A test title is required' });
  const qErr = validateQuestions(questions);
  if (qErr) return res.status(400).json({ message: qErr });
  if (!classId && !postId) return res.status(400).json({ message: 'A classId or postId is required' });

  let liveClass = null;
  if (classId) {
    liveClass = await LiveClass.findById(classId);
    if (!liveClass) return res.status(404).json({ message: 'Class not found' });
    if (!liveClass.tutor.equals(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You can only add tests to your own class' });
    }
  } else {
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (!post.tutor.equals(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You can only add tests to your own post' });
    }
  }

  const test = await Test.create({ title, classId, postId, skill: skill?.trim() || '', dueDate, questions, tutor: req.user._id });
  if (liveClass) await notifyClassStudents(liveClass, `New test in "${liveClass.title}": ${title}`, 'test');
  else await notifyAllStudents(`New test posted: ${title}`, 'test');
  res.status(201).json(test);
};

// PUT /api/tests/:id — tutor updates a test (notifies students)
export const updateTest = async (req, res) => {
  const { title, skill, dueDate, questions } = req.body;
  const test = await Test.findById(req.params.id);
  if (!test) return res.status(404).json({ message: 'Test not found' });
  if (!test.tutor.equals(req.user._id) && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only the test author can edit it' });
  }
  if (questions !== undefined) {
    const qErr = validateQuestions(questions);
    if (qErr) return res.status(400).json({ message: qErr });
    test.questions = questions;
  }
  if (title !== undefined) test.title = title;
  if (skill !== undefined) test.skill = skill.trim();
  if (dueDate !== undefined) test.dueDate = dueDate;
  await test.save();

  if (test.classId) {
    const liveClass = await LiveClass.findById(test.classId);
    if (liveClass) await notifyClassStudents(liveClass, `Test updated in "${liveClass.title}": ${test.title}`, 'test');
  } else {
    await notifyAllStudents(`Test updated: ${test.title}`, 'test');
  }
  res.json(test);
};

const isStaff = (user) => user.role === 'mentor' || user.role === 'admin';

// GET /api/tests/class/:classId — tests for a class.
// Raw questions (with correct answers) go ONLY to the owning tutor or staff;
// everyone else — students AND other tutors — gets the answer-stripped view.
export const listTestsForClass = async (req, res) => {
  const [tests, cls] = await Promise.all([
    Test.find({ classId: req.params.classId }).sort('-createdAt'),
    LiveClass.findById(req.params.classId).select('tutor'),
  ]);
  const owner = cls && cls.tutor.equals(req.user._id);
  if (owner || isStaff(req.user)) return res.json(tests);
  res.json(tests.map((t) => forStudent(t, req.user._id)));
};

// GET /api/tests/post/:postId — tests attached to a post (same answer-hiding rule).
export const listTestsForPost = async (req, res) => {
  const [tests, post] = await Promise.all([
    Test.find({ postId: req.params.postId }).sort('-createdAt'),
    Post.findById(req.params.postId).select('tutor'),
  ]);
  const owner = post && post.tutor.equals(req.user._id);
  if (owner || isStaff(req.user)) return res.json(tests);
  res.json(tests.map((t) => forStudent(t, req.user._id)));
};

// POST /api/tests/:id/submit — student submits answers; auto-graded here
export const submitTest = async (req, res) => {
  const { answers } = req.body;
  if (!Array.isArray(answers)) return res.status(400).json({ message: 'answers must be an array' });

  const test = await Test.findById(req.params.id);
  if (!test) return res.status(404).json({ message: 'Test not found' });

  // Authorization: a class-linked test may only be taken by an enrolled student.
  // (Post-linked tests are part of the open feed and stay available to any student.)
  if (test.classId) {
    const liveClass = await LiveClass.findById(test.classId).select('students');
    if (!liveClass || !liveClass.students.some((s) => s.equals(req.user._id))) {
      return res.status(403).json({ message: 'Enroll in this class before taking its test' });
    }
  }

  // Auto-grade
  const total = test.questions.length;
  let score = 0;
  test.questions.forEach((q, i) => {
    if (answers[i] === q.correctIndex) score += 1;
  });
  const percent = total > 0 ? Math.round((score / total) * 100) : 0;

  // Atomic insert that also enforces "one submission per student" — closes the
  // check-then-save race where two parallel requests both passed the old .some() check.
  const updated = await Test.findOneAndUpdate(
    { _id: test._id, 'submissions.student': { $ne: req.user._id } },
    { $push: { submissions: { student: req.user._id, answers, score, total, percent } } },
    { new: true }
  );
  if (!updated) return res.status(400).json({ message: 'You already submitted this test' });

  res.json({ score, total, percent });
};

// GET /api/tests/:id/submissions — the test author (or a mentor/admin) views submissions
export const getSubmissions = async (req, res) => {
  const test = await Test.findById(req.params.id).populate('submissions.student', 'name email');
  if (!test) return res.status(404).json({ message: 'Test not found' });
  // IDOR fix: a tutor may only see submissions for tests they authored.
  if (req.user.role === 'tutor' && !test.tutor.equals(req.user._id)) {
    return res.status(403).json({ message: 'You can only view submissions for your own tests' });
  }
  res.json({
    title: test.title,
    skill: test.skill,
    totalQuestions: test.questions.length,
    submissions: test.submissions,
  });
};
