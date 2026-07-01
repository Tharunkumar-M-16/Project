import express from 'express';
import { myNotifications, markAllRead } from '../controllers/notificationController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.get('/', protect, myNotifications);
router.put('/read-all', protect, markAllRead);

export default router;
