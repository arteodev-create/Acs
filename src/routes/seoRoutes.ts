import express from 'express';
import { getSitemap, getSitemapData, getRobotsTxt, submitToGoogleIndex, getIndexingStatus, bulkCleanupSlugs } from '../controllers/seoController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/sitemap', getSitemap);
router.get('/data', getSitemapData);
router.get('/robots.txt', getRobotsTxt);
router.post('/index', protect, authorize('admin', 'superadmin'), submitToGoogleIndex);
router.get('/metadata', protect, authorize('admin', 'superadmin'), (req, res) => require('../controllers/seoController').getUrlMetadata(req, res));
router.post('/mark-indexed', protect, authorize('admin', 'superadmin'), (req, res) => require('../controllers/seoController').markAsIndexed(req, res));
router.post('/ping-sitemap', protect, authorize('admin', 'superadmin'), (req, res) => require('../controllers/seoController').pingSitemap(req, res));
router.get('/index/status', protect, authorize('admin', 'superadmin'), getIndexingStatus);
router.post('/cleanup-slugs', protect, authorize('admin', 'superadmin'), bulkCleanupSlugs);

export default router;
