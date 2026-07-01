import express from 'express';
import {
  createPost,
  listPosts,
  getPost,
  updatePost,
  deletePost,
} from '../controllers/postController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();
router.get('/', protect, listPosts);
router.post('/', protect, authorize('tutor', 'admin'), createPost);
router.get('/:id', protect, getPost);
router.put('/:id', protect, authorize('tutor', 'admin'), updatePost);
router.delete('/:id', protect, authorize('tutor', 'admin'), deletePost);

export default router;
