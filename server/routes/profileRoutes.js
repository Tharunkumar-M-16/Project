import express from 'express';
import { updateProfile, updateSkills, updateMetrics } from '../controllers/profileController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.put('/', protect, updateProfile);
router.put('/skills', protect, updateSkills);
router.put('/metrics', protect, updateMetrics);

export default router;
