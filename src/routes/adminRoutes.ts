import { Router } from 'express';
import { submitToGoogle, getIndexingStatus } from '../controllers/indexingController';
import { fixTemporalAnomalies, fixRecodeScripts, getDailyAiStatus, setDailyAiEnabled } from '../controllers/adminController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = Router();

router.use(protect);
router.use(authorize('admin', 'superadmin'));

router.post('/indexing/submit', submitToGoogle);
router.get('/indexing/status', getIndexingStatus);
router.post('/fix-temporal-anomalies', fixTemporalAnomalies);
router.post('/fix-recode-scripts', fixRecodeScripts);
router.get('/daily-ai/status', getDailyAiStatus);
router.post('/daily-ai/enabled', setDailyAiEnabled);

export default router;
