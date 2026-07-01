import express from 'express';
import { listRoles, getRole, createRole } from '../controllers/roleController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();
router.get('/', protect, listRoles);
router.get('/:name', protect, getRole);
router.post('/', protect, authorize('admin', 'tutor'), createRole);

export default router;
