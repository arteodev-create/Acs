import { Router } from 'express';
import { getTemplates, getTemplateById } from '../controllers/templateController';
import { setCacheControl } from '../middleware/cacheMiddleware';

const router = Router();

router.get('/', setCacheControl(300), getTemplates);
router.get('/:id', setCacheControl(300), getTemplateById);

export default router;
