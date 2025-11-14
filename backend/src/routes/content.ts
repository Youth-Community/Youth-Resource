import { Router } from 'express';
import {
  createContent,
  getContentList,
  getContentById,
  updateContent,
  deleteContent,
  approveContent,
  rejectContent
} from '../controllers/contentController';
import { authenticateToken, requireManager } from '../middleware/auth';
import { validateContent, handleValidationErrors } from '../middleware/validation';

const router = Router();

router.post('/', authenticateToken, validateContent, handleValidationErrors, createContent);
router.get('/', getContentList);
router.get('/:id', getContentById);
router.put('/:id', authenticateToken, validateContent, handleValidationErrors, updateContent);
router.delete('/:id', authenticateToken, deleteContent);
router.post('/:id/approve', authenticateToken, requireManager, approveContent);
router.post('/:id/reject', authenticateToken, requireManager, rejectContent);

export default router;