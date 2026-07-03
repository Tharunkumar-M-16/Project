import Post from '../models/Post.js';
import Test from '../models/Test.js';
import { notifyAllStudents } from '../services/notify.js';
import { forStudent } from './testController.js';
import { sanitizeLinks } from '../utils/sanitize.js';

// Attach each post's tests (answers hidden for students).
async function attachTests(posts, user) {
  const ids = posts.map((p) => p._id);
  const tests = await Test.find({ postId: { $in: ids } }).sort('-createdAt');
  const byPost = new Map();
  for (const t of tests) {
    const key = String(t.postId);
    if (!byPost.has(key)) byPost.set(key, []);
    byPost.get(key).push(user.role === 'student' ? forStudent(t, user._id) : t.toObject());
  }
  return posts.map((p) => ({ ...p.toObject(), tests: byPost.get(String(p._id)) || [] }));
}

// POST /api/posts — tutor publishes a post
export const createPost = async (req, res) => {
  const { title, body, links, documents } = req.body;
  if (!title) return res.status(400).json({ message: 'Post title is required' });
  const post = await Post.create({
    title,
    body: body || '',
    links: sanitizeLinks(links),
    documents: sanitizeLinks((documents || []).filter((d) => d?.title)),
    tutor: req.user._id,
  });
  await notifyAllStudents(`New post from ${req.user.name}: ${title}`, 'info');
  res.status(201).json(post);
};

// GET /api/posts — feed. ?scope=mine for a tutor's own posts.
export const listPosts = async (req, res) => {
  const filter = req.query.scope === 'mine' ? { tutor: req.user._id } : {};
  const posts = await Post.find(filter).populate('tutor', 'name').sort('-createdAt');
  res.json(await attachTests(posts, req.user));
};

// GET /api/posts/:id
export const getPost = async (req, res) => {
  const post = await Post.findById(req.params.id).populate('tutor', 'name');
  if (!post) return res.status(404).json({ message: 'Post not found' });
  const [withTests] = await attachTests([post], req.user);
  res.json(withTests);
};

// PUT /api/posts/:id — tutor edits their own post
export const updatePost = async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: 'Post not found' });
  if (!post.tutor.equals(req.user._id) && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only the author can edit this post' });
  }
  const { title, body, links, documents } = req.body;
  if (title !== undefined) post.title = title;
  if (body !== undefined) post.body = body;
  if (links !== undefined) post.links = sanitizeLinks(links);
  if (documents !== undefined) post.documents = sanitizeLinks(documents.filter((d) => d?.title));
  await post.save();
  await notifyAllStudents(`Post updated: ${post.title}`, 'info');
  res.json(post);
};

// DELETE /api/posts/:id — removes the post and its tests
export const deletePost = async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: 'Post not found' });
  if (!post.tutor.equals(req.user._id) && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only the author can delete this post' });
  }
  await Test.deleteMany({ postId: post._id });
  await post.deleteOne();
  res.json({ message: 'Post deleted' });
};
