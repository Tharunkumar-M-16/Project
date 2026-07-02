import express from 'express';
import { aiStatus, askAI, aiGenerateTest, aiFeedback } from '../controllers/aiController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();
router.get('/status', protect, aiStatus);
router.post('/chat', protect, authorize('student'), askAI);
router.post('/feedback', protect, authorize('student'), aiFeedback);
router.post('/generate-test', protect, authorize('tutor', 'admin'), aiGenerateTest);

export default router;
