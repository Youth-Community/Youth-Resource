import { Router } from 'express';
import {
  createPodcast,
  getPodcasts,
  getPodcastById,
  playPodcast,
  downloadPodcast,
  getPodcastCategories
} from '../controllers/podcastController';
import { authenticateToken, requireManager } from '../middleware/auth';
import { validateContent, handleValidationErrors } from '../middleware/validation';

const router = Router();

router.post('/', authenticateToken, requireManager, validateContent, handleValidationErrors, createPodcast);
router.get('/', getPodcasts);
router.get('/categories', getPodcastCategories);
router.get('/:id', getPodcastById);
router.post('/:id/play', authenticateToken, playPodcast);
router.post('/:id/download', authenticateToken, downloadPodcast);

export default router;