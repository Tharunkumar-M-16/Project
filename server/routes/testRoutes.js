import express from 'express';
import {
  createTest,
  updateTest,
  listTestsForClass,
  listTestsForPost,
  submitTest,
  getSubmissions,
} from '../controllers/testController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();
router.post('/', protect, authorize('tutor', 'admin'), createTest);
router.put('/:id', protect, authorize('tutor', 'admin'), updateTest);
router.get('/class/:classId', protect, listTestsForClass);
router.get('/post/:postId', protect, listTestsForPost);
router.post('/:id/submit', protect, authorize('student'), submitTest);
router.get('/:id/submissions', protect, authorize('tutor', 'mentor', 'admin'), getSubmissions);

export default router;
