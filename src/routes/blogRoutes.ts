import { Router } from 'express';
import { getBlogPosts, getBlogPostBySlug, getRelatedBlogPosts } from '../controllers/blogController';
import { setCacheControl } from '../middleware/cacheMiddleware';

const router = Router();

router.get('/', setCacheControl(300), getBlogPosts);
router.get('/related', setCacheControl(300), getRelatedBlogPosts);
router.get('/:slug', setCacheControl(300), getBlogPostBySlug);

export default router;
