import mongoose from 'mongoose';

// A document/resource attached to a class (a link to a PDF, slides, Drive file, etc.)
const documentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

// An attendance record — a student joined the live session.
const attendanceSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

// A smart live online class created by a tutor.
const classSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    subject: { type: String, default: '', trim: true },
    description: { type: String, default: '' },
    tutor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    schedule: { type: Date, required: true }, // when the live session happens
    durationMins: { type: Number, default: 60 }, // live window length (default 1 hour)
    // Live video room — defaults to a free Jitsi room (set in the controller after create)
    meetingLink: { type: String, default: '' },
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true }],
    documents: { type: [documentSchema], default: [] },
    attendance: { type: [attendanceSchema], default: [] },
    // Lifecycle: 'scheduled' until the window passes, then persisted as 'ended'
    status: { type: String, enum: ['scheduled', 'ended'], default: 'scheduled' },
    endedAt: { type: Date }, // recorded when the live window closes
  },
  { timestamps: true }
);

const LiveClass = mongoose.model('Class', classSchema);
export default LiveClass;
