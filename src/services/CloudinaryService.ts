import { v2 as cloudinary } from 'cloudinary';
import * as dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});

export class CloudinaryService {
    /**
     * Tối ưu hóa một URL ảnh hiện có (ví dụ từ Unsplash, Firebase, v.v.)
     * @param url URL ảnh gốc
     * @param width Chiều rộng mong muốn
     * @param height Chiều cao mong muốn
     */
    static getOptimizedUrl(url: string, width?: number, height?: number) {
        if (!url || url.includes('cloudinary.com')) return url;

        // Nếu là ảnh nội bộ hoặc provider khác, ta có thể route qua Cloudinary Fetch API
        // Format: https://res.cloudinary.com/<cloud_name>/image/fetch/<transformations>/<url>
        const transformations = [
            'f_auto', // Tự động chọn format tốt nhất (WebP, Avif)
            'q_auto', // Tự động nén chất lượng mà không làm hỏng trải nghiệm
            width ? `w_${width}` : '',
            height ? `h_${height}` : '',
            'c_limit' // Giữ aspect ratio
        ].filter(Boolean).join(',');

        return `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/fetch/${transformations}/${encodeURIComponent(url)}`;
    }

    /**
     * Upload ảnh trực tiếp lên Cloudinary
     */
    static async uploadImage(fileContent: string, folder: string = 'recode_social') {
        try {
            const result = await cloudinary.uploader.upload(fileContent, {
                folder,
                resource_type: 'auto'
            });
            return result.secure_url;
        } catch (error) {
            console.error('Cloudinary Upload Error:', error);
            throw error;
        }
    }

    /**
     * Tạo OG Image động bằng Cloudinary Text Overlay
     */
    static getDynamicOgImageUrl(title: string, author: string = 'Recode Social') {
        const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
        const BASE_IMAGE = 'recode_og_base_v1'; // Tên ảnh nền template trong Cloudinary

        // Encode title để đưa vào URL (Cloudinary dùng đặc biệt một số ký tự)
        const cleanTitle = encodeURIComponent(title).replace(/%20/g, '%20');
        const cleanAuthor = encodeURIComponent(`By ${author}`).replace(/%20/g, '%20');

        // Transformations: 
        // 1. Chèn tiêu đề chính (Font bold, size lớn)
        // 2. Chèn tên tác giả/nền tảng (Font nhỏ hơn bên dưới)
        // 3. Logo (Nếu đã setup overlay logo)
        const overlays = [
            `w_800,c_fit,co_rgb:000000,g_west,x_80,y_-40,l_text:Inter_64_bold:${cleanTitle}`,
            `w_800,c_fit,co_rgb:666666,g_west,x_80,y_80,l_text:Inter_24_medium:${cleanAuthor}`
        ].join('/');

        return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${overlays}/${BASE_IMAGE}.jpg`;
    }
}
