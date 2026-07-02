import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['info', 'document', 'test', 'class', 'account', 'achievement'], default: 'info' },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
    link: { type: String, default: '' }, // optional deep-link the client can act on
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Fast "my unread notifications" queries
notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });
// Auto-expire notifications after 60 days so the collection can't grow unbounded
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 24 * 60 * 60 });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
