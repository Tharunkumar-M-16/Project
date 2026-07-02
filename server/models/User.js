import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

export const ROLES = ['student', 'tutor', 'mentor', 'admin'];

// A skill the student has, with a self/verified proficiency level 0-100
const userSkillSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    level: { type: Number, min: 0, max: 100, default: 0 }, // proficiency
    verified: { type: Boolean, default: false }, // set true ONLY when earned via a test
  },
  { _id: false }
);

// Learning metrics + daily attendance for a student
const studentProfileSchema = new mongoose.Schema(
  {
    targetRole: { type: String, default: '' }, // e.g. "Frontend Developer"
    skills: { type: [userSkillSchema], default: [] },
    projectsCompleted: { type: Number, default: 0 }, // Applied ability (self-reported)
    mentorEndorsements: { type: Number, default: 0 }, // mentor-awarded only
    mockInterviews: { type: Number, default: 0 },
    mentor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    // --- Daily attendance ---
    activeDays: { type: Number, default: 0 }, // total unique days marked present
    streak: { type: Number, default: 0 }, // consecutive days present
    lastAttendance: { type: String, default: '' }, // YYYY-MM-DD of last mark
    attendanceDates: { type: [String], default: [] }, // recent YYYY-MM-DD dates (for the calendar)
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true },
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    email: { type: String, lowercase: true, trim: true, default: '' },
    password: { type: String, required: [true, 'Password is required'], minlength: 3, select: false },
    role: { type: String, enum: ROLES, default: 'student' },
    avatar: { type: String, default: '' },
    // --- Personal details (student fills these in on their profile) ---
    phone: { type: String, default: '', trim: true },
    college: { type: String, default: '', trim: true },
    degree: { type: String, default: '', trim: true },
    // Who created this account (the mentor). Null for seeded staff.
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    // The tutor a student belongs to (their cohort). Mentor assigns this.
    assignedTutor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    mustChangePassword: { type: Boolean, default: false },
    studentProfile: { type: studentProfileSchema, default: () => ({}) },
  },
  { timestamps: true }
);

userSchema.index({ role: 1 });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = function (entered) {
  return bcrypt.compare(entered, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
