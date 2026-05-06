import { Request, Response } from 'express';
import { ForumModel } from '../models/ForumModel';
import { ReactionModel } from '../models/ReactionModel';
import pool from '../config/database';
import IndexingService from '../services/IndexingService';
import { CloudinaryService } from '../services/CloudinaryService';
import { ReputationUtils } from '../utils/ReputationUtils';
import { NotificationModel } from '../models/NotificationModel';
import { SocialService } from '../services/SocialService';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/AppError';

export const getCategories = catchAsync(async (req: Request, res: Response) => {
    const categories = await ForumModel.getAllCategories();
    res.json({ success: true, data: categories });
});

export const getThreads = catchAsync(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    const { rows, total } = await ForumModel.getThreads(limit, offset);

    res.json({
        success: true,
        data: rows,
        pagination: {
            current_page: page,
            limit,
            total_records: total,
            total_pages: Math.ceil(total / limit),
            has_more: page * limit < total
        }
    });
});

export const createThread = catchAsync(async (req: any, res: Response) => {
    const { title, content, category_id } = req.body;
    const user_id = req.user.id;

    if (!title || !content || !category_id) {
        throw new AppError('Please provide title, content and category ID', 400);
    }

    const cleanTitle = title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[-\s]+/g, '-').trim();
    const slug = `${cleanTitle}-${Date.now()}`;

    const insertId = await ForumModel.createThread({
        title,
        slug,
        content,
        user_id,
        category_id
    });

    const threadUrl = `https://recode.arteosocial.com/forum/${slug}`;

    // SEO: Real-time Indexing
    import('../services/SeoService').then(s => s.default.submitUrl(threadUrl).catch(err => console.error('[AutoIndex] Failed:', err.message)));

    IndexingService.notify(threadUrl); // Internal indexing service (if distinct) or legacy?

    // Social Auto-post
    SocialService.notifyNewContent({
        title,
        url: threadUrl,
        type: 'thread',
        author: req.user.username
    });

    res.status(201).json({ success: true, data: { id: insertId, slug } });
});

export const getThreadDetail = catchAsync(async (req: Request, res: Response) => {
    const slug = req.params.slug as string;

    const thread: any = await ForumModel.getThreadBySlug(slug);
    if (!thread) {
        throw new AppError('Thread not found', 404);
    }

    const posts: any = await ForumModel.getPostsByThreadId(thread.id);

    // Generate Dynamic OG Image
    const ogImage = CloudinaryService.getDynamicOgImageUrl(thread.title, thread.username);

    // Add Rank Info & Initial Structure
    let threadWithRank = {
        ...thread,
        og_image: ogImage,
        author_rank: ReputationUtils.getRank(thread.reputation_points, thread.role)
    };

    // Get current user's reactions
    const userId = (req as any).user?.id;
    let userReactions = {};
    if (userId) {
        const postIds = posts.map((p: any) => p.id);
        userReactions = await ReactionModel.getUserReactions(userId, 'post', postIds);

        const [threadReaction]: any = await pool.query( // Using pool as connection might not be available in all scopes
            'SELECT reaction_type FROM reactions WHERE user_id = ? AND target_type = "thread" AND target_id = ?',
            [userId, thread.id]
        );
        (threadWithRank as any).user_reaction = threadReaction[0]?.reaction_type || null;
    }

    // Attach posts with their ranks and reactions
    threadWithRank.posts = Array.isArray(posts) ? posts.map((p: any) => ({
        ...p,
        author_rank: ReputationUtils.getRank(p.reputation_points, p.role),
        user_reaction: (userReactions as any)[p.id] || null
    })) : [];

    res.json({ success: true, data: threadWithRank });
});

export const getPostDetail = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;

    const post = await ForumModel.getPostById(parseInt(id));
    if (!post) {
        throw new AppError('Post not found', 404);
    }

    const userId = (req as any).user?.id;
    if (userId) {
        const [userReaction]: any = await pool.query(
            'SELECT reaction_type FROM reactions WHERE user_id = ? AND target_type = "post" AND target_id = ?',
            [userId, post.id]
        );
        (post as any).user_reaction = userReaction[0]?.reaction_type || null;
    }

    res.json({ success: true, data: post });
});

export const createPost = catchAsync(async (req: any, res: Response) => {
    const { thread_id, content, parent_id } = req.body;
    const user_id = req.user.id;

    if (!thread_id || !content) {
        throw new AppError('Please provide thread ID and content', 400);
    }

    const insertId = await ForumModel.createPost({
        thread_id,
        user_id,
        content,
        parent_id
    });

    // Create Notification
    const post: any = await ForumModel.getPostById(insertId);
    if (post && post.user_id !== user_id) {
        // Nếu là trả lời một bình luận (nested)
        if (parent_id) {
            const parentPost: any = await ForumModel.getPostById(parent_id);
            if (parentPost && parentPost.user_id !== user_id) {
                await NotificationModel.create({
                    user_id: parentPost.user_id,
                    actor_id: user_id,
                    type: 'reply',
                    target_type: 'post',
                    target_id: parent_id,
                    message: `${req.user.username} replied to your comment.`
                });
            }
        } else {
            // Trả lời Thread chính
            await NotificationModel.create({
                user_id: post.user_id, // Thread owner
                actor_id: user_id,
                type: 'reply',
                target_type: 'thread',
                target_id: thread_id,
                message: `${req.user.username} replied to your thread: "${post.thread_title}"`
            });
        }
    }

    const postUrl = `https://recode.arteosocial.com/forum/post/${insertId}`;
    IndexingService.notify(postUrl);

    res.status(201).json({ success: true, data: { id: insertId } });
});

export const getRelatedThreads = catchAsync(async (req: Request, res: Response) => {
    const { categoryId, excludeId } = req.query;

    if (!categoryId || !excludeId) {
        throw new AppError('categoryId and excludeId are required', 400);
    }

    const related = await ForumModel.getRelatedThreads(
        parseInt(categoryId as string),
        parseInt(excludeId as string)
    );

    res.json({ success: true, data: related });
});
