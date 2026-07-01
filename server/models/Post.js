import mongoose from 'mongoose';

const linkSchema = new mongoose.Schema(
  { label: { type: String, default: '' }, url: { type: String, required: true, trim: true } },
  { _id: true }
);

const documentSchema = new mongoose.Schema(
  { title: { type: String, required: true, trim: true }, url: { type: String, required: true, trim: true } },
  { _id: true }
);

// A feed post a tutor publishes to all students — text + links + documents (+ optional tests).
const postSchema = new mongoose.Schema(
  {
    tutor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    body: { type: String, default: '' },
    links: { type: [linkSchema], default: [] },
    documents: { type: [documentSchema], default: [] },
  },
  { timestamps: true }
);

const Post = mongoose.model('Post', postSchema);
export default Post;
