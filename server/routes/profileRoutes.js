import express from 'express';
import { updateProfile, updateSkills, updateMetrics, markDailyAttendance } from '../controllers/profileController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.put('/', protect, updateProfile);
router.put('/skills', protect, updateSkills);
router.put('/metrics', protect, updateMetrics);
router.post('/attendance', protect, markDailyAttendance);

export default router;
