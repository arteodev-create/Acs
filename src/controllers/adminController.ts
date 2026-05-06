import { Request, Response } from 'express';
import pool from '../config/database';
import { v2 as cloudinary } from 'cloudinary';
import IndexingService from '../services/IndexingService';
import fs from 'fs';
import path from 'path';

const getLocalDate = (timeZone: string) => {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(new Date());
    const value = (type: string) => parts.find((part) => part.type === type)?.value;
    return `${value('year')}-${value('month')}-${value('day')}`;
};

const daysBetween = (start: string, end: string) => {
    const startMs = Date.parse(`${start}T00:00:00Z`);
    const endMs = Date.parse(`${end}T00:00:00Z`);
    return Math.floor((endMs - startMs) / 86400000);
};

const setEnvValue = (key: string, value: string) => {
    const envPath = path.resolve(process.cwd(), '.env');
    const lines = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8').split(/\r?\n/) : [];
    let found = false;
    const next = lines.map((line) => {
        if (line.trim().startsWith('#') || !line.includes('=')) return line;
        const name = line.split('=', 1)[0].trim();
        if (name !== key) return line;
        found = true;
        return `${key}=${value}`;
    });
    if (!found) next.push(`${key}=${value}`);
    fs.writeFileSync(envPath, `${next.filter((line, index) => line.length > 0 || index < next.length - 1).join('\n')}\n`);
    process.env[key] = value;
};

export const getDailyAiStatus = async (req: Request, res: Response): Promise<any> => {
    const timeZone = process.env.AI_DAILY_POST_TIMEZONE || 'Asia/Bangkok';
    const startDate = process.env.AI_DAILY_POST_START_DATE || '2025-05-03';
    const today = getLocalDate(timeZone);
    const dayOffset = daysBetween(startDate, today);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS ai_daily_posts (
            id BIGSERIAL PRIMARY KEY,
            run_date DATE NOT NULL UNIQUE,
            status VARCHAR(32) NOT NULL DEFAULT 'pending',
            blog_post_id BIGINT REFERENCES blog_posts(id) ON DELETE SET NULL,
            model VARCHAR(160) NOT NULL,
            prompt_version VARCHAR(40) NOT NULL DEFAULT 'v1',
            topic TEXT,
            error_message TEXT,
            started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            completed_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    `);

    const [todayRows]: any = await pool.query(
        `SELECT d.*, b.slug, b.title
         FROM ai_daily_posts d
         LEFT JOIN blog_posts b ON b.id = d.blog_post_id
         WHERE d.run_date = ?
         LIMIT 1`,
        [today]
    );
    const [recentRows]: any = await pool.query(
        `SELECT d.run_date, d.status, d.blog_post_id, d.topic, d.error_message, d.started_at, d.completed_at, b.slug, b.title
         FROM ai_daily_posts d
         LEFT JOIN blog_posts b ON b.id = d.blog_post_id
         ORDER BY d.run_date DESC
         LIMIT 14`
    );

    res.json({
        success: true,
        enabled: String(process.env.AI_DAILY_POST_ENABLED || 'false').toLowerCase() === 'true',
        model: process.env.AI_DAILY_POST_MODEL || 'inclusionai/ling-2.6-1t:free',
        start_date: startDate,
        today,
        timezone: timeZone,
        day_number: dayOffset >= 0 ? dayOffset + 1 : null,
        has_openrouter_key: Boolean(process.env.OPENROUTER_API_KEY),
        today_status: todayRows[0] || null,
        recent_runs: recentRows,
        safety: {
            max_one_post_per_day: true,
            duplicate_day_guard: true,
            advisory_lock: true,
            kill_switch_env: 'AI_DAILY_POST_ENABLED=false',
        },
    });
};

export const setDailyAiEnabled = async (req: Request, res: Response): Promise<any> => {
    const enabled = Boolean(req.body?.enabled);
    setEnvValue('AI_DAILY_POST_ENABLED', enabled ? 'true' : 'false');
    res.json({
        success: true,
        enabled,
        message: enabled
            ? 'Daily AI posting is enabled for the next cron run.'
            : 'Daily AI posting is disabled. Cron will skip without calling OpenRouter.',
    });
};

export const migrateAvatars = async (req: Request, res: Response): Promise<any> => {
    console.log('[Admin] Avatar and content media migration started.');

    // Trả về phản hồi ngay lập tức để hất văng mọi lỗi CORS/Timeout của trình duyệt
    res.status(200).json({
        success: true,
        status: 'Migration Started in Background',
        message: 'Media migration is running in the background. Check server logs for progress.',
        build_id: process.env.BUILD_ID || 'RECODE_API'
    });

    // Bắt đầu quá trình sync ngầm (không await để không block phản hồi)
    (async () => {
        // Explicitly configure cloudinary on the fly
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
            api_key: process.env.CLOUDINARY_API_KEY || '',
            api_secret: process.env.CLOUDINARY_API_SECRET || '',
            secure: true
        });

        try {
            let totalProcessed = 0;
            const startTime = Date.now();
            console.log('[NUCLEAR-ASYNC] Background process started...');

            // --- 1. MIGRATION USER AVATARS ---
            const [users]: any = await pool.query(
                "SELECT id, username, avatar_url FROM users WHERE avatar_url IS NOT NULL AND avatar_url != '' AND avatar_url NOT LIKE '%res.cloudinary.com%'"
            );
            console.log(`[NUCLEAR-ASYNC] Found ${users.length} avatars to migrate.`);

            for (const user of users) {
                try {
                    const result = await cloudinary.uploader.upload(user.avatar_url, {
                        folder: 'recode_avatars',
                        public_id: `avatar_${user.username}`,
                        overwrite: true,
                        transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }, { quality: 'auto', fetch_format: 'auto' }]
                    });
                    await pool.query('UPDATE users SET avatar_url = ? WHERE id = ?', [result.secure_url, user.id]);
                    totalProcessed++;

                    if (totalProcessed % 5 === 0) {
                        console.log(`[NUCLEAR-HEARTBEAT] Background Progress: ${totalProcessed}/${users.length}`);
                    }
                    await new Promise(resolve => setTimeout(resolve, 300));
                } catch (err: any) {
                    console.error(`[Avatar Fail] ${user.username}:`, err.message);
                }
            }

            // --- 2. MIGRATION CONTENT IMAGES ---
            const tables = [
                { name: 'blog_posts', contentField: 'content' },
                { name: 'threads', contentField: 'content' },
                { name: 'posts', contentField: 'content' },
                { name: 'recode_scripts', contentField: 'description' }
            ];

            const imgRegex = /(!\[.*?\]\()?(https?:\/\/[^\s)]+\.(?:png|jpg|jpeg|gif|webp|svg)[^\s)]*)(\))?/gi;

            for (const table of tables) {
                try {
                    const [rows]: any = await pool.query(`
                        SELECT id, ${table.contentField} 
                        FROM ${table.name} 
                        WHERE ${table.contentField} LIKE '%http%' 
                        AND ${table.contentField} NOT LIKE '%res.cloudinary.com%'
                    `);

                    console.log(`[NUCLEAR-ASYNC] ${table.name}: ${rows.length} rows to scan.`);

                    for (const row of rows) {
                        let content = row[table.contentField];
                        let match;
                        let hasChanged = false;
                        imgRegex.lastIndex = 0;

                        while ((match = imgRegex.exec(content)) !== null) {
                            const originalUrl = match[2];
                            if (originalUrl.includes('res.cloudinary.com')) continue;

                            const isExternal =
                                originalUrl.includes('unsplash.com') ||
                                originalUrl.includes('pravatar.cc') ||
                                originalUrl.includes('githubusercontent.com') ||
                                originalUrl.includes('imgur.com');

                            if (!isExternal) continue;

                            try {
                                const uploadRes = await cloudinary.uploader.upload(originalUrl, {
                                    folder: `recode_${table.name}`,
                                    transformation: [{ quality: 'auto', fetch_format: 'auto' }]
                                });

                                content = content.replace(originalUrl, uploadRes.secure_url);
                                hasChanged = true;
                                totalProcessed++;
                                console.log(`[NUCLEAR-ASYNC] Migrated: ${originalUrl.substring(0, 30)}...`);
                                await new Promise(resolve => setTimeout(resolve, 300));
                            } catch (uploadErr: any) {
                                console.error(`[Upload Fail] ${table.name} ID ${row.id}:`, uploadErr.message);
                            }
                        }

                        if (hasChanged) {
                            await pool.query(`UPDATE ${table.name} SET ${table.contentField} = ? WHERE id = ?`, [content, row.id]);
                        }
                    }
                } catch (tableErr: any) {
                    console.error(`[NUCLEAR-TABLE-ERR] ${table.name}:`, tableErr.message);
                }
            }
            console.log(`[NUCLEAR-ASYNC] FINISHED. Processed ${totalProcessed} images total.`);
        } catch (globalErr: any) {
            console.error('[NUCLEAR-ASYNC-FATAL] Background sync crashed:', globalErr);
        }
    })();
};

export const fixTemporalAnomalies = async (req: Request, res: Response): Promise<any> => {
    console.log('[TEMPORAL-FIX] One Big Beautiful Bill Act triggered...');

    try {
        const [users]: any = await pool.query('SELECT id, username, created_at FROM users');
        let fixedCount = 0;
        const fixedUsers: any[] = [];

        for (const user of users) {
            // 1. Find earliest content date
            const [threads]: any = await pool.query('SELECT MIN(created_at) as min_date FROM threads WHERE user_id = ?', [user.id]);
            const [posts]: any = await pool.query('SELECT MIN(created_at) as min_date FROM posts WHERE user_id = ?', [user.id]);
            const [blogs]: any = await pool.query('SELECT MIN(created_at) as min_date FROM blog_posts WHERE author_id = ?', [user.id]);

            const dates = [
                threads[0].min_date ? new Date(threads[0].min_date) : null,
                posts[0].min_date ? new Date(posts[0].min_date) : null,
                blogs[0].min_date ? new Date(blogs[0].min_date) : null
            ].filter(d => d !== null) as Date[];

            if (dates.length === 0) continue;

            // Get absolute earliest content date
            const minContentDate = new Date(Math.min(...dates.map(d => d.getTime())));
            const userCreatedAt = new Date(user.created_at);

            // 2. Check if User is "younger" than their content (Anomaly)
            if (userCreatedAt > minContentDate) {
                // 3. Fix: Backdate user to (MinContentDate - Random(1s to 3 days))
                const randomSeconds = Math.floor(Math.random() * (3 * 24 * 60 * 60)) + 1; // 1s to 3 days
                const newCreatedAt = new Date(minContentDate.getTime() - randomSeconds * 1000);

                await pool.query('UPDATE users SET created_at = ? WHERE id = ?', [newCreatedAt, user.id]);

                fixedCount++;
                fixedUsers.push({
                    username: user.username,
                    old: userCreatedAt.toISOString(),
                    new: newCreatedAt.toISOString(),
                    reason: `Older content found at ${minContentDate.toISOString()}`
                });

                console.log(`[TEMPORAL-FIX] Fixed ${user.username}: ${userCreatedAt.toISOString()} -> ${newCreatedAt.toISOString()}`);
            }
        }

        res.json({
            success: true,
            message: `The Bill is Signed! Fixed ${fixedCount} temporal anomalies.`,
            details: fixedUsers
        });

    } catch (error: any) {
        console.error('[TEMPORAL-FIX Error]:', error.message);
        res.status(500).json({ success: false, message: 'Failed to sign the bill.', error: error.message });
    }
};

export const fixRecodeScripts = async (req: Request, res: Response): Promise<any> => {
    console.log('[RECODE-FIX] Start fixing all recode scripts...');
    try {
        const [scripts]: any = await pool.query('SELECT id, title, code_content FROM recode_scripts');
        let fixedCount = 0;
        const updatedUrls: string[] = [];

        for (const script of scripts) {
            let content = script.code_content || '';
            let originalCode = content;
            let isModified = true;

            // 1. CLEAN METADATA (Làm sạch Tên, Description, Tags)
            const cleanTitle = script.title
                .replace(/v\\d+/gi, '')
                .replace(/#\\d+/g, '')
                .replace(/(final|test)/gi, '')
                .replace(/[`'"]/g, '')
                .trim();

            const newDescription = `Bộ lọc dữ liệu thuật toán tùy chỉnh nội bộ: ${cleanTitle}`;
            const baseId = `core-logic-${script.id}`;

            // 2. TẠO POOL CODE LOGIC ĐA DẠNG ĐỂ LÀM GIÀU DATABASE KHI GẶP CODE TRÙNG/RÁC
            const dummyLogics = [
                {
                    logic: `class MatchAnalyzer {\\n  public filter(posts: any[]) {\\n    return posts.filter(p => p.content.includes('highlight')).sort((a,b) => b.likes - a.likes);\\n  }\\n}`
                },
                {
                    logic: `class CryptoSentiment {\\n  public analyze(data: any[]) {\\n    return data.map(coin => ({...coin, isBullish: coin.price_change > 0 }));\\n  }\\n}`
                },
                {
                    logic: `class DataScraper {\\n  public extract(text: string) {\\n    const emails = text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\\.[a-zA-Z0-9_-]+)/gi);\\n    return { emails: emails || [], count: emails ? emails.length : 0 };\\n  }\\n}`
                },
                {
                    logic: `class ContentModerator {\\n  public clean(text: string) {\\n    return text.replace(/(fuck|shit|bitch)/gi, '***');\\n  }\\n}`
                },
                {
                    logic: `class CarScanner {\\n  public detect(images: string[]) {\\n    return images.filter(img => img.includes('vehicle') || img.includes('car_plate'));\\n  }\\n}`
                },
                {
                    logic: `class GamingAggregator {\\n  public getTrending(steamData: any[]) {\\n    return steamData.filter(game => game.currentPlayers > 50000);\\n  }\\n}`
                },
                {
                    logic: `class BeautyFilter {\\n  public enhance(imgData: any) {\\n    return { ...imgData, blurLevel: 0.5, skinSoftening: true };\\n  }\\n}`
                },
                {
                    logic: `class AnimeRecommender {\\n  public suggest(userHistory: string[]) {\\n    if (userHistory.includes('Naruto')) return ['Bleach', 'One Piece'];\\n    return ['Attack on Titan'];\\n  }\\n}`
                },
                {
                    logic: `class CodeReviewerAI {\\n  public review(code: string) {\\n    const errors = [];\\n    if (code.includes('console.log')) errors.push('Remove console.log');\\n    return { passed: errors.length === 0, errors };\\n  }\\n}`
                },
                {
                    logic: `class SeoOptimizer {\\n  public analyze(html: string) {\\n    const missingH1 = !html.includes('<h1>');\\n    return { score: missingH1 ? 50 : 100, missingH1 };\\n  }\\n}`
                },
                {
                    logic: `class WeatherForecast {\\n  public predict(location: string, historyData: any[]) {\\n    return { location, rainProbability: Math.random() * 100, temp: 25 };\\n  }\\n}`
                },
                {
                    logic: `class RealEstateAppraiser {\\n  public estimate(sqm: number, locationId: string) {\\n    const basePrice = 1000;\\n    return { estValue: sqm * basePrice * 1.5, currency: 'USD' };\\n  }\\n}`
                }
            ];

            // Nếu code cũ quá ngắn hoặc có dấu hiệu là code rác HealthMonitor quá nhiều, lấy ngẫu nhiên 1 template
            let finalHelperCode = '';
            if (originalCode.length < 50 || originalCode.includes('HealthMonitor')) {
                const randomTopic = dummyLogics[Math.floor(Math.random() * dummyLogics.length)];
                finalHelperCode = `${randomTopic.logic}`;
            } else {
                // Giữ lại lõi cũ nếu đã là code tốt và XÓA triệt để mọi comment C-Style // hoặc /* */
                finalHelperCode = originalCode.replace(new RegExp('//.*', 'g'), '').replace(new RegExp('/\\\\*[\\\\s\\\\S]*?\\\\*/', 'g'), '').trim();
            }

            // 3. TẠO CODE BLOCK CHUẨN (Generator String Build)
            const codeParts = [
                `import { z } from 'zod';`,
                ``,
                `${finalHelperCode}`,
                ``,
                `export const inputSchema = z.object({});`,
                `export const outputSchema = z.object({});`,
                ``,
                `export const generatedBlock_${script.id} = {`,
                `  id: '${baseId}',`,
                `  name: '${cleanTitle}',`,
                `  category: 'logic',`,
                `  description: '${newDescription}',`,
                `  icon: '⚡',`,
                `  tags: ['system', 'auto-generated'],`,
                `  inputSchema,`,
                `  outputSchema,`,
                ``,
                `  execute: async (inputs: any = {}, context: any = {}) => {`,
                `    try {`,
                `      return { success: true, data: null, message: 'Executed' };`,
                `    } catch (err: any) {`,
                `      throw new Error('Execute Failed: ' + err.message);`,
                `    }`,
                `  }`,
                `};`
            ];

            content = codeParts.join('\\n');

            // 4. LƯU XUỐNG CƠ SỞ DỮ LIỆU
            await pool.query(
                'UPDATE recode_scripts SET code_content = ?, title = ?, description = ?, tags = ? WHERE id = ?',
                [content, cleanTitle, newDescription, 'system,auto-generated', script.id]
            );

            fixedCount++;
            updatedUrls.push(`https://recode.arteosocial.com/templates/${script.id}`);
        }

        res.json({
            success: true,
            message: `Fixed ${fixedCount} scripts. Generated ${updatedUrls.length} URLs for indexing.`,
            urls: updatedUrls
        });
    } catch (error: any) {
        console.error('[RECODE-FIX Error]:', error.message);
        res.status(500).json({ success: false, message: 'Failed to fix recode scripts.', error: error.message });
    }
};
