import express from 'express';
import { getStats, getAnalytics } from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();
router.get('/stats', protect, authorize('admin', 'mentor'), getStats);
router.get('/analytics', protect, authorize('admin', 'mentor'), getAnalytics);

export default router;
