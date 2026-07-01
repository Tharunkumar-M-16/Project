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

// A smart live online class created by a tutor.
const classSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    subject: { type: String, default: '', trim: true },
    description: { type: String, default: '' },
    tutor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    schedule: { type: Date, required: true }, // when the live session happens
    durationMins: { type: Number, default: 60 }, // live window length (default 1 hour)
    // Live video room — defaults to a free Jitsi room (set in the controller after create)
    meetingLink: { type: String, default: '' },
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    documents: { type: [documentSchema], default: [] },
    // Lifecycle: 'scheduled' until the window passes, then persisted as 'ended'
    status: { type: String, enum: ['scheduled', 'ended'], default: 'scheduled' },
    endedAt: { type: Date }, // recorded when the live window closes
  },
  { timestamps: true }
);

const LiveClass = mongoose.model('Class', classSchema);
export default LiveClass;
