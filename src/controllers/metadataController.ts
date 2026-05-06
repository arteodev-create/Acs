import { Request, Response } from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';

export const getUrlMetadata = async (req: Request, res: Response): Promise<any> => {
    const { url } = req.query;

    if (!url || typeof url !== 'string') {
        return res.status(400).json({ success: false, message: 'URL is required.' });
    }

    try {
        const response = await axios.get(url, {
            timeout: 5000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        const $ = cheerio.load(response.data);

        const metadata = {
            title: $('meta[property="og:title"]').attr('content') || $('title').text() || url,
            description: $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || '',
            image: $('meta[property="og:image"]').attr('content') || '',
            url: url,
            siteName: $('meta[property="og:site_name"]').attr('content') || ''
        };

        res.json({ success: true, data: metadata });

    } catch (error: any) {
        console.error(`[Metadata Error] ${url}:`, error.message);
        res.status(500).json({ success: false, message: 'Could not fetch metadata.' });
    }
};
