import { Request, Response } from 'express';
import { BlogModel } from '../models/BlogModel';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/AppError';

export const getBlogPosts = catchAsync(async (req: Request, res: Response) => {
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10) || 1);
    const limit = Math.min(60, Math.max(1, parseInt(String(req.query.limit || '24'), 10) || 24));
    const offset = (page - 1) * limit;
    const { rows, total } = await BlogModel.getAllPosts(limit, offset);
    res.removeHeader('Pragma');
    res.removeHeader('Expires');
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600');
    res.json({
        success: true,
        data: rows,
        pagination: {
            page,
            limit,
            total,
            total_pages: Math.ceil(total / limit),
            has_more: offset + rows.length < total,
        },
    });
});

export const getBlogPostBySlug = catchAsync(async (req: Request, res: Response) => {
    const { slug } = req.params;
    const post = await BlogModel.getPostBySlug(slug as string);

    if (!post) {
        throw new AppError('Post not found', 404);
    }

    res.removeHeader('Pragma');
    res.removeHeader('Expires');
    res.setHeader('Cache-Control', 'public, max-age=120, s-maxage=600, stale-while-revalidate=1800');
    res.json({ success: true, data: post });
});

export const getRelatedBlogPosts = catchAsync(async (req: Request, res: Response) => {
    const category = req.query.category as string;
    const excludeId = req.query.excludeId as string;

    if (!category || !excludeId) {
        throw new AppError('Category and excludeId are required', 400);
    }

    const related = await BlogModel.getRelatedPosts(
        category,
        parseInt(excludeId)
    );

    res.removeHeader('Pragma');
    res.removeHeader('Expires');
    res.setHeader('Cache-Control', 'public, max-age=120, s-maxage=600, stale-while-revalidate=1800');
    res.json({ success: true, data: related });
});
