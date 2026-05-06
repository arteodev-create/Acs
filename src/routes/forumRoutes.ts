import { Router } from 'express';
import {
    getCategories,
    getThreads,
    createThread,
    getThreadDetail,
    createPost,
    getPostDetail,
    getRelatedThreads
} from '../controllers/forumController';
import { protect } from '../middleware/authMiddleware';
import { setCacheControl } from '../middleware/cacheMiddleware';

const router = Router();

router.get('/categories', setCacheControl(3600), getCategories); // Cache Category lâu hơn 1 chút
router.get('/threads', setCacheControl(300), getThreads);
router.get('/threads/related', setCacheControl(300), getRelatedThreads);
router.get('/threads/:slug', setCacheControl(300), getThreadDetail);
router.get('/posts/:id', setCacheControl(300), getPostDetail);
router.post('/threads', protect, createThread);
router.post('/posts', protect, createPost);

export default router;
