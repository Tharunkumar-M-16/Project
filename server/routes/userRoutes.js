import express from 'express';
import {
  listUsers,
  createUser,
  resetPassword,
  deleteUser,
} from '../controllers/userController.js';
import { protect, authorize } from '../middleware/auth.js';

// All user management is controlled by the mentor (admin also allowed).
const router = express.Router();
router.get('/', protect, authorize('mentor', 'admin'), listUsers);
router.post('/', protect, authorize('mentor', 'admin'), createUser);
router.put('/:id/password', protect, authorize('mentor', 'admin'), resetPassword);
router.delete('/:id', protect, authorize('mentor', 'admin'), deleteUser);

export default router;
