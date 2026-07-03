import mongoose from 'mongoose';

// One auto-graded multiple-choice question.
const questionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    options: { type: [String], required: true }, // e.g. ["A", "B", "C", "D"]
    correctIndex: { type: Number, required: true }, // index into options
  },
  { _id: true }
);

// A student's submission — graded automatically on submit.
const submissionSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    answers: { type: [Number], default: [] }, // chosen option index per question
    score: { type: Number, default: 0 }, // correct answers
    total: { type: Number, default: 0 }, // number of questions
    percent: { type: Number, default: 0 }, // 0-100
    submittedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

// A test/quiz a tutor assigns to a class.
const testSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    // A test belongs to EITHER a live class OR a post.
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
    postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
    tutor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    skill: { type: String, default: '' }, // optional topic tag for the test
    dueDate: { type: Date },
    questions: { type: [questionSchema], default: [] },
    submissions: { type: [submissionSchema], default: [] },
  },
  { timestamps: true }
);

testSchema.index({ classId: 1 });
testSchema.index({ postId: 1 });
testSchema.index({ tutor: 1 });

const Test = mongoose.model('Test', testSchema);
export default Test;
