import express from 'express';
import {
  listUsers,
  listTutors,
  createUser,
  assignTutor,
  endorseStudent,
  resetPassword,
  deleteUser,
  getUserDetail,
} from '../controllers/userController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// A tutor may list their own cohort; mentor/admin manage everyone.
router.get('/', protect, authorize('mentor', 'admin', 'tutor'), listUsers);
router.get('/tutors', protect, authorize('mentor', 'admin'), listTutors);
router.get('/:id', protect, authorize('mentor', 'admin'), getUserDetail);
router.post('/', protect, authorize('mentor', 'admin'), createUser);
router.put('/:id/tutor', protect, authorize('mentor', 'admin'), assignTutor);
router.post('/:id/endorse', protect, authorize('mentor', 'admin'), endorseStudent);
router.put('/:id/password', protect, authorize('mentor', 'admin'), resetPassword);
router.delete('/:id', protect, authorize('mentor', 'admin'), deleteUser);

export default router;
