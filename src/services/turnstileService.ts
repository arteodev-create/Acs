import axios from 'axios';

/**
 * Xác minh token từ Cloudflare Turnstile
 * @param token Token nhận được từ Frontend widget
 * @returns boolean
 */
export const verifyTurnstileToken = async (token: string): Promise<boolean> => {
    // Nếu đang ở môi trường dev và dùng Key test của Cloudflare thì luôn cho qua
    if (token === '1x00000000000000000000AA' || process.env.NODE_ENV === 'development') {
        return true;
    }

    try {
        const response = await axios.post(
            'https://challenges.cloudflare.com/turnstile/v0/siteverify',
            {
                secret: process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY,
                response: token,
            }
        );

        return response.data.success;
    } catch (error) {
        console.error('[Turnstile Error]:', error);
        return false;
    }
};
