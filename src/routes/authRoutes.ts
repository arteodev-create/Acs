import { Router } from 'express';
import { register, login, logout, refreshToken, getMe, firebaseLogin } from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/firebase-login', firebaseLogin);
router.post('/logout', logout);
router.post('/refresh-token', refreshToken);
router.get('/me', protect, getMe);

export default router;
