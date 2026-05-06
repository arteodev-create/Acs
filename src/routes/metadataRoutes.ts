import { Router } from 'express';
import { getUrlMetadata } from '../controllers/metadataController';

const router = Router();

router.get('/', getUrlMetadata);

export default router;
