import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

export const ROLES = ['student', 'tutor', 'mentor', 'admin'];

// A skill the student has, with a self/verified proficiency level 0-100
const userSkillSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    level: { type: Number, min: 0, max: 100, default: 0 }, // proficiency
    verified: { type: Boolean, default: false }, // set true when earned via test
  },
  { _id: false }
);

// Metrics that feed the ReadyScore pillars for a student
const studentProfileSchema = new mongoose.Schema(
  {
    targetRole: { type: String, default: '' }, // e.g. "Frontend Developer"
    skills: { type: [userSkillSchema], default: [] },
    projectsCompleted: { type: Number, default: 0 }, // Applied ability
    activeDays: { type: Number, default: 0 }, // Consistency (learning streak days)
    mentorEndorsements: { type: Number, default: 0 }, // Soft signals
    mockInterviews: { type: Number, default: 0 }, // Soft signals
    mentor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true },
    // Login identifier (the "ID" a mentor gives a student/tutor)
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    email: { type: String, lowercase: true, trim: true, default: '' }, // optional
    password: { type: String, required: [true, 'Password is required'], minlength: 3, select: false },
    role: { type: String, enum: ROLES, default: 'student' },
    avatar: { type: String, default: '' },
    // Who created this account (the mentor). Null for seeded staff.
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    studentProfile: { type: studentProfileSchema, default: () => ({}) },
  },
  { timestamps: true }
);

// Hash password before save
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
