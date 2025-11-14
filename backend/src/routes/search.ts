import { Router } from 'express';
import {
  globalSearch,
  getSearchSuggestions,
  getTrendingContent
} from '../controllers/searchController';
import { validateSearch, handleValidationErrors } from '../middleware/validation';

const router = Router();

router.get('/', validateSearch, handleValidationErrors, globalSearch);
router.get('/suggestions', getSearchSuggestions);
router.get('/trending', getTrendingContent);

export default router;