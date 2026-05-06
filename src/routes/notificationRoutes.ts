import { Router } from 'express';
import { getMyNotifications, markRead } from '../controllers/notificationController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.get('/', protect, getMyNotifications);
router.patch('/:id/read', protect, markRead);

export default router;
