import { Router } from 'express';
import {
  register,
  login,
  logout,
  refreshToken,
  getProfile
} from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
import { validateRegistration, validateLogin, handleValidationErrors } from '../middleware/validation';

const router = Router();

router.post('/register', validateRegistration, handleValidationErrors, register);
router.post('/login', validateLogin, handleValidationErrors, login);
router.post('/logout', authenticateToken, logout);
router.post('/refresh', refreshToken);
router.get('/profile', authenticateToken, getProfile);

export default router;