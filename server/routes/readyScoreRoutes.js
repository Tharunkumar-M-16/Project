import express from 'express';
import {
  myReadyScore,
  readyScoreForRole,
  readyScoreForUser,
} from '../controllers/readyScoreController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();
router.get('/', protect, myReadyScore);
router.get('/user/:id', protect, authorize('tutor', 'mentor', 'admin'), readyScoreForUser);
router.get('/:roleName', protect, readyScoreForRole);

export default router;
