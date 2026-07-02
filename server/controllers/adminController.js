import User from '../models/User.js';
import LiveClass from '../models/Class.js';
import Test from '../models/Test.js';
import { classLifecycle } from '../services/classLifecycle.js';

// GET /api/admin/stats — headline counts for the admin dashboard
export const getStats = async (req, res) => {
  const [total, students, tutors, mentors, classes, tests] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'student' }),
    User.countDocuments({ role: 'tutor' }),
    User.countDocuments({ role: 'mentor' }),
    LiveClass.countDocuments(),
    Test.countDocuments(),
  ]);
  res.json({ counts: { total, students, tutors, mentors, classes, tests } });
};

// GET /api/admin/analytics — richer data for charts + per-tutor oversight
export const getAnalytics = async (req, res) => {
  // Class lifecycle distribution (computed — status is time-based).
  const classes = await LiveClass.find().select('schedule durationMins status tutor attendance students').lean();
  const lifecycle = { upcoming: 0, live: 0, ended: 0 };
  for (const c of classes) lifecycle[classLifecycle(c).status]++;

  // Submission stats via aggregation.
  const [subAgg] = await Test.aggregate([
    { $unwind: '$submissions' },
    { $group: { _id: null, count: { $sum: 1 }, avgPercent: { $avg: '$submissions.percent' } } },
  ]);
  const submissions = { count: subAgg?.count || 0, avgPercent: Math.round(subAgg?.avgPercent || 0) };

  // Per-tutor breakdown.
  const tutors = await User.find({ role: 'tutor' }).select('name').lean();
  const perTutorScore = await Test.aggregate([
    { $unwind: '$submissions' },
    { $group: { _id: '$tutor', avg: { $avg: '$submissions.percent' }, subs: { $sum: 1 } } },
  ]);
  const scoreByTutor = new Map(perTutorScore.map((r) => [String(r._id), r]));
  const tutorRows = await Promise.all(
    tutors.map(async (t) => {
      const [classesCount, studentsCount] = await Promise.all([
        LiveClass.countDocuments({ tutor: t._id }),
        User.countDocuments({ assignedTutor: t._id }),
      ]);
      const s = scoreByTutor.get(String(t._id));
      return {
        _id: t._id,
        name: t.name,
        classes: classesCount,
        students: studentsCount,
        submissions: s?.subs || 0,
        avgScore: Math.round(s?.avg || 0),
      };
    })
  );

  // Role distribution + monthly signups (last 6 months).
  const roleDist = await User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]);

  res.json({
    lifecycle,
    submissions,
    tutors: tutorRows,
    roles: Object.fromEntries(roleDist.map((r) => [r._id, r.count])),
  });
};
