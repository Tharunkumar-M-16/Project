import express from 'express';
import { myNotifications, markAllRead, markOneRead } from '../controllers/notificationController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.get('/', protect, myNotifications);
router.put('/read-all', protect, markAllRead);
router.put('/:id/read', protect, markOneRead);

export default router;
