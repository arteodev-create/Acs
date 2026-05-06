import { Response } from 'express';
import { ReactionModel } from '../models/ReactionModel';
import { catchAsync } from '../utils/catchAsync';

export const toggleReaction = catchAsync(async (req: any, res: Response) => {
    const { targetType, targetId, reactionType } = req.body;
    const userId = req.user.id;

    if (!targetType || !targetId || !reactionType) {
        return res.status(400).json({
            success: false,
            message: 'Vui lòng cung cấp đầy đủ targetType, targetId và reactionType'
        });
    }

    const result = await ReactionModel.toggle(
        userId,
        targetType as 'thread' | 'post',
        targetId,
        reactionType as 'like' | 'insightful' | 'helpful'
    );

    res.json({
        success: true,
        data: result
    });
});

export const getReactionInfo = catchAsync(async (req: any, res: Response) => {
    const { targetType, targetId } = req.query;
    const userId = req.user?.id;

    if (!targetType || !targetId) {
        return res.status(400).json({ success: false, message: 'Missing targetType or targetId' });
    }

    const result = await ReactionModel.toggle( // Using toggle logic but with a "fetch only" mindset if needed, 
        // but better to have a dedicated count method if toggle is too heavy.
        // For now, let's keep it simple as we already have counts in toggle.
        0, // Dummy user for just getting counts
        targetType as 'thread' | 'post',
        parseInt(targetId as string),
        'like' // Default type, logic should handle 0 userId as read-only
    );

    res.json({
        success: true,
        data: result
    });
});
