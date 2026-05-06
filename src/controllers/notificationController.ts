import { Response } from 'express';
import { NotificationModel } from '../models/NotificationModel';
import { catchAsync } from '../utils/catchAsync';

export const getMyNotifications = catchAsync(async (req: any, res: Response) => {
    const userId = req.user.id;
    const notifications = await NotificationModel.getByUser(userId);
    const unreadCount = await NotificationModel.getUnreadCount(userId);

    res.json({
        success: true,
        data: {
            notifications,
            unreadCount
        }
    });
});

export const markRead = catchAsync(async (req: any, res: Response) => {
    const userId = req.user.id;
    const { id } = req.params;

    if (id === 'all') {
        await NotificationModel.markAllAsRead(userId);
    } else {
        await NotificationModel.markAsRead(parseInt(id), userId);
    }

    res.json({ success: true, message: 'Notification(s) marked as read' });
});
