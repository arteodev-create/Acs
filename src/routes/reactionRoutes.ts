import { Router } from 'express';
import { toggleReaction, getReactionInfo } from '../controllers/reactionController';
import { protect, optionalProtect } from '../middleware/authMiddleware';

const router = Router();

router.get('/info', optionalProtect, getReactionInfo);
router.post('/toggle', protect, toggleReaction);

export default router;
