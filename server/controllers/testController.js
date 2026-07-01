import Test from '../models/Test.js';
import LiveClass from '../models/Class.js';
import Post from '../models/Post.js';
import User from '../models/User.js';
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

// POST /api/tests — tutor assigns a test to a class OR a post
export const createTest = async (req, res) => {
  const { title, classId, postId, skill, dueDate, questions } = req.body;
  if (!title || !Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ message: 'title and at least one question are required' });
  }
  if (!classId && !postId) {
    return res.status(400).json({ message: 'A classId or postId is required' });
  }

  let liveClass = null;
  if (classId) {
    liveClass = await LiveClass.findById(classId);
    if (!liveClass) return res.status(404).json({ message: 'Class not found' });
  } else {
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });
  }

  const test = await Test.create({ title, classId, postId, skill, dueDate, questions, tutor: req.user._id });

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
  if (title !== undefined) test.title = title;
  if (skill !== undefined) test.skill = skill;
  if (dueDate !== undefined) test.dueDate = dueDate;
  if (Array.isArray(questions) && questions.length > 0) test.questions = questions;
  await test.save();

  if (test.classId) {
    const liveClass = await LiveClass.findById(test.classId);
    if (liveClass) await notifyClassStudents(liveClass, `Test updated in "${liveClass.title}": ${test.title}`, 'test');
  } else {
    await notifyAllStudents(`Test updated: ${test.title}`, 'test');
  }
  res.json(test);
};

// GET /api/tests/class/:classId — tests for a class (student view hides answers)
export const listTestsForClass = async (req, res) => {
  const tests = await Test.find({ classId: req.params.classId }).sort('-createdAt');
  if (req.user.role === 'student') {
    return res.json(tests.map((t) => forStudent(t, req.user._id)));
  }
  res.json(tests); // tutor/mentor/admin see full test incl. answers + submissions
};

// GET /api/tests/post/:postId — tests attached to a post (student view hides answers)
export const listTestsForPost = async (req, res) => {
  const tests = await Test.find({ postId: req.params.postId }).sort('-createdAt');
  if (req.user.role === 'student') {
    return res.json(tests.map((t) => forStudent(t, req.user._id)));
  }
  res.json(tests);
};

// POST /api/tests/:id/submit — student submits answers; auto-graded here
export const submitTest = async (req, res) => {
  const { answers } = req.body;
  if (!Array.isArray(answers)) return res.status(400).json({ message: 'answers must be an array' });

  const test = await Test.findById(req.params.id);
  if (!test) return res.status(404).json({ message: 'Test not found' });
  if (test.submissions.some((s) => s.student.equals(req.user._id))) {
    return res.status(400).json({ message: 'You already submitted this test' });
  }

  // Auto-grade
  const total = test.questions.length;
  let score = 0;
  test.questions.forEach((q, i) => {
    if (answers[i] === q.correctIndex) score += 1;
  });
  const percent = Math.round((score / total) * 100);

  test.submissions.push({ student: req.user._id, answers, score, total, percent });
  await test.save();

  // Smart tie-in: a test tagged with a skill verifies that skill on the ReadyScore.
  let skillUpdated = null;
  if (test.skill) {
    const user = await User.findById(req.user._id);
    const skills = user.studentProfile.skills || [];
    const idx = skills.findIndex((s) => s.name.toLowerCase() === test.skill.toLowerCase());
    if (idx >= 0) {
      skills[idx].level = Math.max(skills[idx].level, percent);
      skills[idx].verified = true;
    } else {
      skills.push({ name: test.skill, level: percent, verified: true });
    }
    user.studentProfile.skills = skills;
    // completing graded work also nudges the Consistency pillar
    user.studentProfile.activeDays = (user.studentProfile.activeDays || 0) + 1;
    await user.save();
    skillUpdated = { skill: test.skill, level: Math.max(percent, skills[idx >= 0 ? idx : skills.length - 1].level), verified: true };
  }

  res.json({ score, total, percent, skillUpdated });
};

// GET /api/tests/:id/submissions — tutor/mentor/admin view all submissions
export const getSubmissions = async (req, res) => {
  const test = await Test.findById(req.params.id).populate('submissions.student', 'name email');
  if (!test) return res.status(404).json({ message: 'Test not found' });
  res.json({
    title: test.title,
    skill: test.skill,
    totalQuestions: test.questions.length,
    submissions: test.submissions,
  });
};
