import express from 'express';
import { listConversations, unreadCount, getConversation, sendMessage } from '../controllers/messageController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();
router.get('/', protect, authorize('student', 'tutor'), listConversations);
router.get('/unread', protect, authorize('student', 'tutor'), unreadCount);
router.get('/:userId', protect, authorize('student', 'tutor'), getConversation);
router.post('/', protect, authorize('student', 'tutor'), sendMessage);

export default router;
