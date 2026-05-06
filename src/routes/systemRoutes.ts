import { Router } from 'express';
import { getSystemStatus } from '../controllers/systemController';

const router = Router();

router.get('/status', getSystemStatus);

export default router;
