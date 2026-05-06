import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/database';
import { AuthRequest } from '../middleware/authMiddleware';
import admin from '../config/firebaseAdmin';
import { verifyTurnstileToken } from '../services/turnstileService';

const generateToken = (id: number) => {
    if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
        throw new Error('JWT_SECRET is required in production.');
    }
    return jwt.sign({ id }, process.env.JWT_SECRET || 'development-only-secret', {
        expiresIn: '1d'
    });
};

const generateRefreshToken = (id: number) => {
    if (!process.env.JWT_REFRESH_SECRET && process.env.NODE_ENV === 'production') {
        throw new Error('JWT_REFRESH_SECRET is required in production.');
    }
    return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET || 'development-only-refresh-secret', {
        expiresIn: '7d'
    });
};

export const register = async (req: Request, res: Response): Promise<any> => {
    const { username, email, password, turnstileToken } = req.body;

    const isHuman = await verifyTurnstileToken(turnstileToken);
    if (!isHuman) {
        return res.status(403).json({ success: false, message: 'Turnstile verification failed.' });
    }

    try {
        const [existing]: any = await pool.query('SELECT * FROM users WHERE email = ? OR username = ?', [email, username]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Email or Username already exists.' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const [result]: any = await pool.query(
            'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
            [username, email, passwordHash]
        );

        const userId = result.insertId;
        const token = generateToken(userId);

        res.status(201).json({
            success: true,
            data: { id: userId, username, email, token }
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const login = async (req: Request, res: Response): Promise<any> => {
    const { email, password, turnstileToken } = req.body;

    const isHuman = await verifyTurnstileToken(turnstileToken);
    if (!isHuman) {
        return res.status(403).json({ success: false, message: 'Turnstile verification failed.' });
    }

    try {
        const [users]: any = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid credentials.' });
        }

        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials.' });
        }

        const token = generateToken(user.id);
        const refreshToken = generateRefreshToken(user.id);

        res.json({
            success: true,
            data: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                token,
                refreshToken
            }
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const firebaseLogin = async (req: Request, res: Response): Promise<any> => {
    const { idToken, turnstileToken } = req.body;

    const isHuman = await verifyTurnstileToken(turnstileToken);
    if (!isHuman) {
        return res.status(403).json({ success: false, message: 'Turnstile verification failed.' });
    }

    if (!idToken) return res.status(400).json({ success: false, message: 'ID Token is required.' });

    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const { email, name, picture } = decodedToken;

        if (!email) return res.status(400).json({ success: false, message: 'Email not provided by Firebase.' });

        const [users]: any = await pool.query('SELECT * FROM users WHERE email = ?', [email]);

        let user;
        if (users.length === 0) {
            const username = name || email.split('@')[0];
            const [result]: any = await pool.query(
                'INSERT INTO users (username, email, password_hash, avatar_url, is_verified) VALUES (?, ?, ?, ?, ?)',
                [username, email, 'fb_oauth_no_password', picture, true]
            );

            const [newUser]: any = await pool.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
            user = newUser[0];
        } else {
            user = users[0];
        }

        const token = generateToken(user.id);
        const refreshToken = generateRefreshToken(user.id);

        res.json({
            success: true,
            data: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                avatar: user.avatar_url,
                token,
                refreshToken
            }
        });

    } catch (error: any) {
        console.error('[Firebase Login Error]:', error.message);
        res.status(401).json({ success: false, message: 'Invalid or expired Firebase token.' });
    }
};

export const logout = (req: Request, res: Response) => {
    res.json({ success: true, message: 'Logged out successfully.' });
};

export const refreshToken = async (req: Request, res: Response): Promise<any> => {
    const { token } = req.body;

    if (!token) return res.status(401).json({ success: false, message: 'Refresh Token is required.' });

    try {
        const decoded: any = jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'refresh_secret');
        const newToken = generateToken(decoded.id);
        res.json({ success: true, token: newToken });
    } catch (error) {
        res.status(401).json({ success: false, message: 'Invalid Refresh Token.' });
    }
};

export const getMe = async (req: AuthRequest, res: Response) => {
    res.json({ success: true, data: req.user });
};
