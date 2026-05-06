import axios from 'axios';

export class SocialService {
    /**
     * Gửi thông báo bài viết mới sang Webhook (Slack/Discord)
     */
    static async notifyNewContent(data: { title: string, url: string, type: 'blog' | 'thread', author: string }) {
        const webhookUrl = process.env.SOCIAL_WEBHOOK_URL;
        if (!webhookUrl) {
            console.log('[SocialService] No webhook URL configured. Skipping notification.');
            return;
        }

        try {
            const payload = {
                text: `🚀 **${data.type.toUpperCase()} MỚI!**\n\n**${data.title}**\nĐăng bởi: ${data.author}\nXem ngay: ${data.url}`,
                username: 'Recode Social Bot',
                icon_emoji: ':rocket:'
            };

            await axios.post(webhookUrl, payload);
            console.log(`[SocialService] Notified ${data.type} success.`);
        } catch (error) {
            console.error('[SocialService] Error sending webhook:', error);
        }
    }
}
