import { Router } from 'express';
import {
  getMe,
  loginUser,
  logoutUser,
  registerUser,
} from '../controllers/authController.ts';
import { protect } from '../middleware/authMiddleware.ts';
import { requireDb } from '../middleware/dbMiddleware.ts';

const router = Router();

router.post('/register', requireDb, registerUser);
router.post('/login', requireDb, loginUser);
router.post('/logout', logoutUser);
router.get('/me', requireDb, protect, getMe);

export default router;
