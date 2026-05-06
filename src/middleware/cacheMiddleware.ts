import { Request, Response, NextFunction } from 'express';

/**
 * Middleware bổ sung Cache-Control Header
 * Giúp tối ưu SEO, tăng tốc Time-To-First-Byte bằng mạng CDN 
 * @param durationSeconds Thời gian sống tính bằng giây (Mặc định: 15 phút)
 */
export const setCacheControl = (durationSeconds: number = 900) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (req.method === 'GET') {
            // Cho phép CDN và Trình duyệt Cache các request công khai (Ví dụ Bài viết, Blog)
            res.setHeader('Cache-Control', `public, max-age=${durationSeconds}`);
        } else {
            // Tắt cache hoàn toàn đối với các hành động POST, PUT, DELETE
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
        }
        next();
    };
};
