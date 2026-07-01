import mongoose from 'mongoose';

// A target career role and the skills it requires — the benchmark ReadyScore compares against.
const requiredSkillSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    minLevel: { type: Number, min: 0, max: 100, default: 60 }, // proficiency needed
    weight: { type: Number, min: 1, default: 1 }, // relative importance
  },
  { _id: false }
);

const roleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, default: '' },
    requiredSkills: { type: [requiredSkillSchema], default: [] },
    requiredProjects: { type: Number, default: 3 }, // for Applied pillar
  },
  { timestamps: true }
);

const Role = mongoose.model('Role', roleSchema);
export default Role;
