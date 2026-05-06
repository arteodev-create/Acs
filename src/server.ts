if (typeof (global as any).File === 'undefined') {
    (global as any).File = class File extends Blob {
        name: string;
        lastModified: number;
        constructor(parts: any[], name: string, options?: any) {
            super(parts, options);
            this.name = name;
            this.lastModified = options?.lastModified || Date.now();
        }
    };
}

import express, { Request, Response } from 'express';
import * as dotenv from 'dotenv';
import corsMiddleware from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { createServer } from 'http';
import forumRoutes from './routes/forumRoutes';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import seoRoutes from './routes/seoRoutes';
import templateRoutes from './routes/templateRoutes';
import blogRoutes from './routes/blogRoutes';
import reactionRoutes from './routes/reactionRoutes';
import notificationRoutes from './routes/notificationRoutes';
import adminRoutes from './routes/adminRoutes';
import searchRoutes from './routes/searchRoutes';
import metadataRoutes from './routes/metadataRoutes';
import systemRoutes from './routes/systemRoutes';
import { errorHandler } from './middleware/errorHandler';
import { AppError } from './utils/AppError';
import { getProfileByUsername } from './controllers/userController';
import { pingDatabase } from './config/database';

dotenv.config();

const app = express();
const buildId = process.env.BUILD_ID || 'RECODE_API';

const getAllowedOrigins = () => [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'https://recode.arteosocial.com',
    ...(process.env.FRONTEND_URL || '').split(','),
    ...(process.env.CORS_ORIGINS || '').split(','),
]
    .map((item) => item.trim())
    .filter(Boolean);

const isAllowedOrigin = (origin: string) => {
    if (!origin) return true;
    return getAllowedOrigins().includes(origin) || (process.env.NODE_ENV === 'development' && origin.includes('localhost'));
};

app.use((req, res, next) => {
    res.setHeader('X-Build-ID', buildId);
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    const origin = req.headers.origin || '';
    if (origin && isAllowedOrigin(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control, Pragma');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Max-Age', '86400');
    }

    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }

    next();
});

app.get('/api/diag', async (_req, res) => {
    let database = 'down';
    try {
        await pingDatabase();
        database = 'up';
    } catch (error) {
        database = 'down';
    }

    res.status(200).json({
        status: 'Recode API online',
        build_id: buildId,
        data_source: 'live',
        database,
        timestamp: new Date().toISOString(),
    });
});

app.use(corsMiddleware({
    origin: (origin, callback) => {
        if (!origin || isAllowedOrigin(origin)) {
            return callback(null, true);
        }
        return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
}));

process.on('uncaughtException', (err) => {
    console.error('[Fatal] Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason) => {
    console.error('[Fatal] Unhandled Rejection:', reason);
});

app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false,
}));
app.use(compression());
app.use(morgan('dev'));
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

app.set('trust proxy', 1);

app.use((req, res, next) => {
    if (req.method !== 'GET') {
        console.log(`[REQ] ${req.method} ${req.url} - Origin: ${req.headers.origin || 'none'}`);
    }
    next();
});

app.get('/@:username', (req: Request, res: Response) => {
    if (typeof req.params.username === 'string') {
        req.params.username = req.params.username.replace(/^@/, '');
    }
    return getProfileByUsername(req, res);
});

app.use('/api/forum', forumRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/seo', seoRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/reactions', reactionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/metadata', metadataRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/system', systemRoutes);

app.get('/health', async (_req, res) => {
    try {
        await pingDatabase();
        res.status(200).json({ success: true, status: 'ok', database: 'up' });
    } catch (error: any) {
        res.status(503).json({ success: false, status: 'degraded', database: 'down', message: error.message });
    }
});

app.use((req, res, next) => next(new AppError(`Route ${req.originalUrl} not found`, 404)));
app.use(errorHandler);

const httpServer = createServer(app);
const PORT = process.env.PORT || 4000;

const server = httpServer.listen(PORT, () => {
    console.log(`[Recode API] Server running on port ${PORT}`);
});

server.keepAliveTimeout = Number(process.env.SERVER_KEEP_ALIVE_TIMEOUT_MS || 120000);
server.headersTimeout = Number(process.env.SERVER_HEADERS_TIMEOUT_MS || 125000);

export default app;
