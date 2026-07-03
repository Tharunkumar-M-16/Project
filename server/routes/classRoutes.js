import express from 'express';
import {
  createClass,
  listClasses,
  getClass,
  deleteClass,
  enrollClass,
  markAttendance,
  getClassAttendance,
  addDocument,
  updateDocument,
  deleteDocument,
} from '../controllers/classController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();
router.get('/', protect, listClasses);
router.post('/', protect, authorize('tutor', 'admin'), createClass);
router.get('/:id', protect, getClass);
router.get('/:id/attendance', protect, authorize('tutor', 'mentor', 'admin'), getClassAttendance);
router.delete('/:id', protect, authorize('tutor', 'admin'), deleteClass);
router.post('/:id/enroll', protect, authorize('student'), enrollClass);
router.post('/:id/attendance', protect, authorize('student'), markAttendance);
router.post('/:id/documents', protect, authorize('tutor', 'admin'), addDocument);
router.put('/:id/documents/:docId', protect, authorize('tutor', 'admin'), updateDocument);
router.delete('/:id/documents/:docId', protect, authorize('tutor', 'admin'), deleteDocument);

export default router;
