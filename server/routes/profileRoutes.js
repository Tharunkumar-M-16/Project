import express from 'express';
import { updateProfile, markDailyAttendance } from '../controllers/profileController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.put('/', protect, updateProfile);
router.post('/attendance', protect, markDailyAttendance);

export default router;
