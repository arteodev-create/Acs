import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../config/database';

export interface AuthRequest extends Request {
    user?: {
        id: number;
        username: string;
        role: string;
    };
}

const getJwtSecret = () => {
    const secret = process.env.JWT_SECRET;
    if (!secret && process.env.NODE_ENV === 'production') {
        throw new Error('JWT_SECRET is required in production.');
    }
    return secret || 'development-only-secret';
};

const readBearerToken = (req: Request) => {
    const authorization = req.headers.authorization;
    if (authorization && authorization.startsWith('Bearer ')) {
        return authorization.split(' ')[1];
    }
    return null;
};

export const protect = async (req: AuthRequest, res: Response, next: NextFunction): Promise<any> => {
    const token = readBearerToken(req);

    if (!token) {
        return res.status(401).json({ success: false, message: 'Authentication is required.' });
    }

    try {
        const decoded: any = jwt.verify(token, getJwtSecret());
        const [users]: any = await pool.query('SELECT id, username, role FROM users WHERE id = ?', [decoded.id]);

        if (users.length === 0) {
            return res.status(401).json({ success: false, message: 'User not found.' });
        }

        req.user = users[0];
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
    }
};

export const authorize = (...roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ success: false, message: 'You do not have permission to perform this action.' });
        }
        next();
    };
};

export const optionalProtect = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const token = readBearerToken(req);

    if (!token) return next();

    try {
        const decoded: any = jwt.verify(token, getJwtSecret());
        const [users]: any = await pool.query('SELECT id, username, role FROM users WHERE id = ?', [decoded.id]);
        if (users.length > 0) req.user = users[0];
    } catch (error) {
        return next();
    }

    next();
};
