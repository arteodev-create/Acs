import { Request, Response } from 'express';
import pool from '../config/database';
import SeoService from '../services/SeoService';
import fs from 'fs';
import path from 'path';
import { slugify } from '../utils/slugUtils';

const ALL_URLS_QUERY_LIMIT = 5000;
const SITE_URL = 'https://recode.arteosocial.com';

// Bộ đệm InMemory Sitemap Cache (Chống DDoS & tối ưu TTFB)
let sitemapCache: string | null = null;
let sitemapCacheTime: number = 0;
const CACHE_TTL = 1000 * 60 * 60; // 1 giờ

export const submitToGoogleIndex = async (req: Request, res: Response): Promise<any> => {
    const { url, type = 'URL_UPDATED' } = req.body;

    if (!url) {
        return res.status(400).json({ success: false, message: 'Vui lòng cung cấp URL.' });
    }

    try {
        const data = await SeoService.submitUrl(url, type);
        return res.status(200).json({
            success: true,
            message: 'Đã gửi yêu cầu Indexing thành công.',
            data
        });
    } catch (error: any) {
        let msg = 'Lỗi khi gửi yêu cầu Indexing.';
        if (error.code === 403) msg = 'Lỗi quyền truy cập (403) hoặc Hết Quota.';
        if (error.code === 429) msg = 'QUOTA EXCEEDED';
        if (error.message.includes('Service Account Key not found')) msg = 'Chưa cấu hình Service Account Key.';

        return res.status(error.code || 500).json({ success: false, message: msg, error: error.message });
    }
};

export const getUrlMetadata = async (req: Request, res: Response) => {
    const { url } = req.query;

    if (!url) {
        return res.status(400).json({ success: false, message: 'Vui lòng cung cấp URL.' });
    }

    try {
        const data = await SeoService.getUrlMetadata(url as string);
        if (!data) {
            return res.json({ success: true, message: 'URL chưa từng được gửi lên Indexing API (hoặc đã quá lâu).', data: null });
        }
        return res.json({ success: true, data });
    } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const markAsIndexed = async (req: Request, res: Response) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ success: false, message: 'Vui lòng cung cấp URL.' });
    }

    try {
        // We can reuse the logic from SeoService or keep it simple here. 
        // Since SeoService.updateLastIndexed is private, let's keep the logic here or make it public.
        // For now, let's verify if we should expose updateLastIndexed. 
        // Actually, let's just use direct DB update here as it is specific to "Manual Mark" without API call.
        const now = new Date();
        let updated = false;

        if (url.includes('/forum/')) {
            const slug = url.split('/forum/')[1];
            const [result]: any = await pool.query('UPDATE threads SET last_indexed_at = ? WHERE slug = ?', [now, slug]);
            if (result.affectedRows > 0) updated = true;
        } else if (url.includes('/blog/')) {
            const slug = url.split('/blog/')[1];
            const [result]: any = await pool.query('UPDATE blog_posts SET last_indexed_at = ? WHERE slug = ?', [now, slug]);
            if (result.affectedRows > 0) updated = true;
        } else if (url.includes('/@')) {
            const username = url.split('/@')[1];
            const [result]: any = await pool.query('UPDATE users SET last_indexed_at = ? WHERE username = ?', [now, username]);
            if (result.affectedRows > 0) updated = true;
        } else {
            return res.json({ success: true, message: 'URL này là trang tĩnh, không cần lưu DB (hoặc chưa hỗ trợ).' });
        }

        if (updated) {
            return res.json({ success: true, message: 'Đã đánh dấu đã index thủ công.' });
        } else {
            return res.status(404).json({ success: false, message: 'Không tìm thấy URL trong cơ sở dữ liệu để cập nhật.' });
        }

    } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const pingSitemap = async (req: Request, res: Response) => {
    try {
        const sitemapUrl = 'https://recode.arteosocial.com/sitemap.xml';
        const googlePingUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`;

        // Simple fetch to Google
        await fetch(googlePingUrl);

        res.json({ success: true, message: 'Đã gửi tín hiệu Ping Sitemap lên Google.' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Lỗi khi Ping Sitemap: ' + error.message });
    }
};

export const getIndexingStatus = async (req: Request, res: Response) => {
    try {
        const [threads]: any = await pool.query('SELECT COUNT(*) as count, COUNT(last_indexed_at) as indexed FROM threads');
        const [users]: any = await pool.query('SELECT COUNT(*) as count, COUNT(last_indexed_at) as indexed FROM users');
        const [blogs]: any = await pool.query('SELECT COUNT(*) as count, COUNT(last_indexed_at) as indexed FROM blog_posts');

        // Check if service account file exists using unified logic in Service
        const hasCredentials = SeoService.hasCredentials();

        res.json({
            success: true,
            hasCredentials,
            stats: {
                totalUrls: threads[0].count + users[0].count + blogs[0].count,
                totalIndexed: threads[0].indexed + users[0].indexed + blogs[0].indexed,
                threads: { total: threads[0].count, indexed: threads[0].indexed },
                users: { total: users[0].count, indexed: users[0].indexed },
                blogs: { total: blogs[0].count, indexed: blogs[0].indexed }
            }
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getAllUrls = async (req: Request, res: Response) => {
    try {
        const baseUrl = SITE_URL;

        // 1. Static Pages
        const staticPages = [
            '', '/recode-arteo', '/forum', '/blog', '/docs', '/templates', '/changelog',
            '/transparency', '/status', '/support', '/about', '/privacy',
            '/terms', '/mediakit'
        ].map(p => `${baseUrl}${p}`);

        // 2. Fetch Dynamic Data with Timestamps
        const [threads]: any = await pool.query('SELECT t.slug, t.updated_at, t.last_indexed_at FROM threads t JOIN users u ON t.user_id = u.id WHERE t.created_at <= NOW()');
        const [blogs]: any = await pool.query('SELECT b.slug, b.updated_at, b.last_indexed_at FROM blog_posts b JOIN users u ON b.author_id = u.id WHERE b.created_at <= NOW()');
        const [categories]: any = await pool.query('SELECT slug FROM categories');
        const [scripts]: any = await pool.query('SELECT id, updated_at, created_at FROM recode_scripts WHERE created_at <= NOW()');
        const [users]: any = await pool.query('SELECT username, updated_at, last_indexed_at FROM users WHERE created_at <= NOW() LIMIT 2000');

        const checkShouldIndex = (updatedAt: Date, lastIndexedAt: Date | null) => {
            if (!lastIndexedAt) return true;
            return new Date(updatedAt) > new Date(lastIndexedAt);
        };

        const threadUrls = threads.map((t: any) => ({
            url: `${baseUrl}/forum/${t.slug}`,
            shouldIndex: checkShouldIndex(t.updated_at, t.last_indexed_at)
        }));
        const blogUrls = blogs.map((b: any) => ({
            url: `${baseUrl}/blog/${b.slug}`,
            shouldIndex: checkShouldIndex(b.updated_at, b.last_indexed_at)
        }));
        const categoryUrls = categories.map((cat: any) => ({
            url: `${baseUrl}/forum/category/${encodeURIComponent(String(cat.slug || '').trim())}`,
            shouldIndex: true
        }));
        const scriptUrls = scripts.map((script: any) => ({
            url: `${baseUrl}/templates/${script.id}`,
            shouldIndex: true
        }));
        const userUrls = users.map((u: any) => ({
            url: `${baseUrl}/@${encodeURIComponent(String(u.username || '').trim())}`,
            shouldIndex: checkShouldIndex(u.updated_at, u.last_indexed_at)
        }));

        const staticPagesObjs = staticPages.map(url => ({ url, shouldIndex: true })); // Always index static pages for now

        const allUrls = [
            ...staticPagesObjs,
            ...categoryUrls,
            ...threadUrls,
            ...blogUrls,
            ...scriptUrls,
            ...userUrls
        ];

        res.json({
            success: true,
            total: allUrls.length,
            urls: allUrls
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getSitemap = async (req: Request, res: Response) => {
    // Trả kết quả từ RAM ngay lập tức nếu cache còn sống
    if (sitemapCache && (Date.now() - sitemapCacheTime < CACHE_TTL)) {
        res.set('Content-Type', 'text/xml');
        res.setHeader('Cache-Control', 'public, max-age=3600');
        return res.send(sitemapCache);
    }

    // Helper to escape XML special characters
    const escapeXml = (unsafe: string) => {
        if (!unsafe) return '';
        return unsafe.replace(/[<>&'"]/g, (c) => {
            switch (c) {
                case '<': return '&lt;';
                case '>': return '&gt;';
                case '&': return '&amp;';
                case '\'': return '&apos;';
                case '"': return '&quot;';
                default: return c;
            }
        });
    };

    try {
        const baseUrl = SITE_URL;

        // 1. Static Pages (Updated list)
        const staticPages = [
            '',
            '/recode-arteo',
            '/forum',
            '/blog',
            '/docs',
            '/templates',
            '/changelog',
            '/transparency',
            '/status',
            '/support',
            '/about',
            '/privacy',
            '/terms',
            '/mediakit'
        ];

        // 2. Fetch Dynamic Data
        const [threads]: any = await pool.query('SELECT t.slug, t.title, t.content, t.updated_at, t.created_at FROM threads t JOIN users u ON t.user_id = u.id WHERE t.created_at <= NOW()');
        const [blogs]: any = await pool.query('SELECT b.slug, b.title, b.content, b.updated_at, b.created_at FROM blog_posts b JOIN users u ON b.author_id = u.id WHERE b.created_at <= NOW()');
        const [categories]: any = await pool.query('SELECT slug FROM categories');
        const [users]: any = await pool.query('SELECT username, avatar_url, updated_at, created_at FROM users WHERE created_at <= NOW() LIMIT 1000');
        const [scripts]: any = await pool.query('SELECT id, title, updated_at, created_at FROM recode_scripts WHERE created_at <= NOW()');

        console.log(`[Sitemap Sync] Static: ${staticPages.length}, Threads: ${threads.length}, Blogs: ${blogs.length}, Categories: ${categories.length}, Users: ${users.length}, Templates: ${scripts.length}`);

        const xmlEntries: string[] = [];
        const todayStr = new Date().toISOString().split('T')[0];
        const imgRegex = /!\[.*?\]\((https?:\/\/.*?\.(?:png|jpg|jpeg|gif|webp|svg).*?)\)/i;

        // Static Pages
        staticPages.forEach(page => {
            const isHome = page === '';
            xmlEntries.push(`
        <url>
            <loc>${baseUrl}${page}</loc>
            <lastmod>${todayStr}</lastmod>
            <changefreq>${isHome ? 'daily' : 'weekly'}</changefreq>
            <priority>${isHome ? '1.0' : '0.8'}</priority>
        </url>`);
        });

        // Category Pages (NEW)
        categories.forEach((cat: any) => {
            const slug = String(cat.slug || '').trim();
            if (!slug) return;
            xmlEntries.push(`
        <url>
            <loc>${baseUrl}/forum/category/${escapeXml(encodeURIComponent(slug))}</loc>
            <lastmod>${todayStr}</lastmod>
            <changefreq>daily</changefreq>
            <priority>0.8</priority>
        </url>`);
        });

        // Helper to generate Photo Detail entries
        const generatePhotoEntries = (content: string, titleContext: string) => {
            if (!content) return [];
            const photoEntries: string[] = [];

            // Find all Markdown images: ![alt](url)
            const allImagesRegex = /!\[.*?\]\((https?:\/\/.*?\.(?:png|jpg|jpeg|gif|webp|svg|bmp|tiff).*?)\)/gi;
            let match;
            while ((match = allImagesRegex.exec(content)) !== null) {
                const imgUrl = match[1];
                // Extract Unsplash ID
                const unsplashMatch = imgUrl.match(/unsplash\.com\/([^?]+)/);
                if (unsplashMatch) {
                    const photoId = unsplashMatch[1];
                    photoEntries.push(`
        <url>
            <loc>${baseUrl}/photo/${escapeXml(photoId)}</loc>
            <lastmod>${todayStr}</lastmod>
            <changefreq>monthly</changefreq>
            <priority>0.6</priority>
            <image:image>
                <image:loc>${escapeXml(imgUrl)}</image:loc>
                <image:title>High Resolution: ${escapeXml(titleContext)}</image:title>
            </image:image>
        </url>`);
                }
            }
            return photoEntries;
        };

        // Threads (Enhanced with Image Sitemap + Photo Pages)
        threads.forEach((thread: any) => {
            const slug = String(thread.slug || '').trim();
            if (!slug) return;
            let entry = `
        <url>
            <loc>${baseUrl}/forum/${escapeXml(encodeURIComponent(slug))}</loc>
            <lastmod>${new Date(thread.updated_at || thread.created_at).toISOString().split('T')[0]}</lastmod>
            <changefreq>daily</changefreq>
            <priority>0.9</priority>`;

            // Find ALL images for the thread itself (Max 1000 per Google spec)
            const allImagesRegex = /!\[.*?\]\((https?:\/\/.*?\.(?:png|jpg|jpeg|gif|webp|svg|bmp|tiff).*?)\)/gi;
            if (thread.content) {
                let match;
                let imgCount = 0;
                while ((match = allImagesRegex.exec(thread.content)) !== null && imgCount < 1000) {
                    entry += `
            <image:image>
                <image:loc>${escapeXml(match[1])}</image:loc>
                <image:title>${escapeXml(thread.title)} Image ${imgCount + 1}</image:title>
            </image:image>`;
                    imgCount++;
                }
            }

            entry += `
        </url>`;
            xmlEntries.push(entry);

            // Generate Photo Detail Pages for this thread
            const photoPages = generatePhotoEntries(thread.content || '', thread.title);
            xmlEntries.push(...photoPages);
        });

        // Blogs (Enhanced with Image Sitemap + Photo Pages)
        blogs.forEach((blog: any) => {
            const slug = String(blog.slug || '').trim();
            if (!slug) return;
            let entry = `
        <url>
            <loc>${baseUrl}/blog/${escapeXml(encodeURIComponent(slug))}</loc>
            <lastmod>${new Date(blog.updated_at || blog.created_at).toISOString().split('T')[0]}</lastmod>
            <changefreq>weekly</changefreq>
            <priority>0.8</priority>`;

            // Extract ALL images from content (Max 1000 per Google spec)
            const allImagesRegex = /!\[.*?\]\((https?:\/\/.*?\.(?:png|jpg|jpeg|gif|webp|svg|bmp|tiff).*?)\)/gi;
            if (blog.content) {
                let match;
                let imgCount = 0;
                while ((match = allImagesRegex.exec(blog.content)) !== null && imgCount < 1000) {
                    entry += `
            <image:image>
                <image:loc>${escapeXml(match[1])}</image:loc>
                <image:title>${escapeXml(blog.title)} Image ${imgCount + 1}</image:title>
            </image:image>`;
                    imgCount++;
                }
            }

            entry += `
        </url>`;
            xmlEntries.push(entry);

            // Generate Photo Detail Pages for this blog
            const photoPages = generatePhotoEntries(blog.content || '', blog.title);
            xmlEntries.push(...photoPages);
        });

        // User Profiles (Enhanced with Image Sitemap)
        users.forEach((user: any) => {
            const username = String(user.username || '').trim();
            if (!username) return;
            let entry = `
        <url>
            <loc>${baseUrl}/@${escapeXml(encodeURIComponent(username))}</loc>
            <lastmod>${new Date(user.updated_at || user.created_at).toISOString().split('T')[0]}</lastmod>
            <changefreq>weekly</changefreq>
            <priority>0.7</priority>`;

            if (user.avatar_url) {
                entry += `
            <image:image>
                <image:loc>${escapeXml(user.avatar_url)}</image:loc>
                <image:title>${escapeXml(username)} - Professional Profile</image:title>
            </image:image>`;
            }

            entry += `
        </url>`;
            xmlEntries.push(entry);
        });

        // Templates (Template Library)
        scripts.forEach((script: any) => {
            xmlEntries.push(`
        <url>
            <loc>${baseUrl}/templates/${script.id}</loc>
            <lastmod>${new Date(script.updated_at || script.created_at).toISOString().split('T')[0]}</lastmod>
            <changefreq>monthly</changefreq>
            <priority>0.7</priority>
        </url>`);
        });

        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n';
        xml += xmlEntries.join('\n');
        xml += '\n</urlset>';

        // Lưu bản ghi vào RAM
        sitemapCache = xml;
        sitemapCacheTime = Date.now();

        res.set('Content-Type', 'text/xml');
        res.setHeader('Cache-Control', 'public, max-age=3600');
        res.send(xml);
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getSitemapData = async (req: Request, res: Response) => {
    try {
        // 1. Fetch Threads
        const [threads]: any = await pool.query('SELECT t.slug, t.updated_at, t.created_at FROM threads t JOIN users u ON t.user_id = u.id WHERE t.created_at <= NOW() ORDER BY t.created_at DESC');

        // 2. Fetch Users
        const [users]: any = await pool.query('SELECT username, created_at FROM users WHERE created_at <= NOW() ORDER BY created_at DESC');

        // 3. Fetch Blogs
        const [blogs]: any = await pool.query('SELECT b.slug, b.updated_at, b.created_at FROM blog_posts b JOIN users u ON b.author_id = u.id WHERE b.created_at <= NOW() ORDER BY b.created_at DESC');

        res.json({
            success: true,
            data: {
                threads,
                users,
                blogs
            }
        });
    } catch (error: any) {
        console.error('[Seo Data Error]:', error.message);
        res.status(500).json({ success: false, message: 'Server error fetching SEO data.' });
    }
};

export const bulkCleanupSlugs = async (req: Request, res: Response) => {
    try {
        console.log('[SEO] Starting bulk slug cleanup via Admin...');
        let updatedThreads = 0;
        let updatedBlogs = 0;

        // Helper function to find a unique slug in a specific table
        const findUniqueSlug = async (table: string, baseSlug: string, id: number) => {
            let slug = baseSlug;
            let counter = 1;
            let isUnique = false;

            while (!isUnique) {
                const [rows]: any = await pool.query(
                    `SELECT id FROM ${table} WHERE slug = ? AND id != ?`,
                    [slug, id]
                );
                if (rows.length === 0) {
                    isUnique = true;
                } else {
                    counter++;
                    slug = `${baseSlug}-${counter}`;
                }
            }
            return slug;
        };

        // 1. Clean Threads
        const [threads]: any = await pool.query('SELECT id, title, slug FROM threads');
        for (const thread of threads) {
            const baseSlug = slugify(thread.title);
            const cleanSlug = await findUniqueSlug('threads', baseSlug, thread.id);

            if (cleanSlug !== thread.slug) {
                await pool.query('UPDATE threads SET slug = ? WHERE id = ?', [cleanSlug, thread.id]);
                updatedThreads++;
            }
        }

        // 2. Clean Blog Posts
        const [blogs]: any = await pool.query('SELECT id, title, slug FROM blog_posts');
        for (const blog of blogs) {
            const baseSlug = slugify(blog.title);
            const cleanSlug = await findUniqueSlug('blog_posts', baseSlug, blog.id);

            if (cleanSlug !== blog.slug) {
                await pool.query('UPDATE blog_posts SET slug = ? WHERE id = ?', [cleanSlug, blog.id]);
                updatedBlogs++;
            }
        }

        res.json({
            success: true,
            message: `Đã làm sạch thành công ${updatedThreads} threads và ${updatedBlogs} blog posts.`,
            stats: { updatedThreads, updatedBlogs }
        });
    } catch (error: any) {
        console.error('[SEO Cleanup Error]:', error.message);
        res.status(500).json({ success: false, message: 'Lỗi khi làm sạch slug: ' + error.message });
    }
};

export const getRobotsTxt = (req: Request, res: Response) => {
    const robots = `User-agent: *
Allow: /
Allow: /recode-arteo
Allow: /about
Allow: /forum
Allow: /blog
Allow: /templates
Allow: /docs
Allow: /privacy
Allow: /terms
Allow: /contact
Allow: /transparency
Allow: /mediakit
Allow: /changelog
Allow: /status
Allow: /support
Allow: /llms.txt
Allow: /site-index.json
Disallow: /api/
Disallow: /auth/
Disallow: /profile/
Disallow: /forum/create
Disallow: /login
Disallow: /register
Disallow: /admin
Disallow: /admin-tools
Disallow: /*?search=*
Disallow: /*?sort=*

User-agent: GPTBot
Allow: /
Allow: /llms.txt
Allow: /site-index.json
Disallow: /admin
Disallow: /profile
Disallow: /login
Disallow: /register

User-agent: CCBot
Allow: /
Allow: /llms.txt
Allow: /site-index.json
Disallow: /admin
Disallow: /profile
Disallow: /login
Disallow: /register

Sitemap: https://recode.arteosocial.com/sitemap.xml
`;
    res.set('Content-Type', 'text/plain');
    res.send(robots);
};
