import express from 'express';
import { getStats } from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();
router.get('/stats', protect, authorize('admin', 'mentor'), getStats);

export default router;
