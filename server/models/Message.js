import mongoose from 'mongoose';

// A 1-on-1 direct message (student <-> their assigned tutor).
const messageSchema = new mongoose.Schema(
  {
    from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    to: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    body: { type: String, required: true, trim: true },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Fetch a conversation between two users quickly, newest last.
messageSchema.index({ from: 1, to: 1, createdAt: 1 });
messageSchema.index({ to: 1, read: 1 });

const Message = mongoose.model('Message', messageSchema);
export default Message;
