import { TOTAL_NOTIFICATIONS, OUTPUT_DIRS, PHASE_A } from './config';
import {
    SqlFileWriter, randInt, pick,
    formatMySQL, sqlStr, sqlBool, logProgress, timestampAfter
} from './helpers';
import { GeneratedUser } from './gen-users';
import { GeneratedThread } from './gen-threads';
import { GeneratedPost } from './gen-posts';

// ═══════════════════════════════════════════════════════════
// NOTIFICATION GENERATOR — 150,000 notifications
// Based on real interactions (replies + reactions)
// ═══════════════════════════════════════════════════════════

const REPLY_MESSAGES = [
    '{actor} replied to your thread',
    '{actor} commented on your post',
    '{actor} replied to your comment',
    '{actor} mentioned you in a reply',
    '{actor} responded to your question',
];

const REACTION_MESSAGES = [
    '{actor} liked your post',
    '{actor} found your post insightful',
    '{actor} found your answer helpful',
    '{actor} reacted to your thread',
    '{actor} liked your comment',
];

export async function generateNotifications(
    users: GeneratedUser[],
    threads: GeneratedThread[],
    posts: GeneratedPost[]
): Promise<void> {
    console.log('\n🔔 Generating notifications...');

    const writerA = new SqlFileWriter(
        `${OUTPUT_DIRS.phaseA.notifications}/notifications_phase_a.sql`,
        'notifications',
        ['user_id', 'actor_id', 'type', 'target_type', 'target_id', 'message', 'is_read', 'created_at']
    );
    const writerB = new SqlFileWriter(
        `${OUTPUT_DIRS.phaseB.notifications}/notifications_phase_b.sql`,
        'notifications',
        ['user_id', 'actor_id', 'type', 'target_type', 'target_id', 'message', 'is_read', 'created_at']
    );

    const usersById = new Map(users.map(u => [u.id, u]));
    let generated = 0;

    // 1. Generate reply notifications from posts
    const replyNotifCount = Math.floor(TOTAL_NOTIFICATIONS * 0.60);
    const shuffledPosts = [...posts].sort(() => Math.random() - 0.5).slice(0, replyNotifCount);

    for (const post of shuffledPosts) {
        // Find the thread owner (the person being notified)
        const thread = threads.find(t => t.id === post.threadId);
        if (!thread) continue;

        const recipientId = post.parentId
            ? (posts.find(p => p.id === post.parentId)?.userId ?? thread.userId)
            : thread.userId;

        // Don't notify yourself
        if (recipientId === post.userId) continue;

        const actor = usersById.get(post.userId);
        if (!actor) continue;

        const message = pick(REPLY_MESSAGES).replace('{actor}', actor.username);
        const targetType = post.parentId ? 'post' : 'thread';
        const targetId = post.parentId ?? thread.id;
        const isRead = Math.random() < 0.60;
        const createdAt = timestampAfter(post.createdAt, 1); // Notif comes shortly after
        const phase = createdAt.getTime() < PHASE_A.end.getTime() ? 'A' : 'B';

        const writer = phase === 'A' ? writerA : writerB;
        writer.addRow([
            recipientId.toString(),
            post.userId.toString(),
            sqlStr('reply'),
            sqlStr(targetType),
            targetId.toString(),
            sqlStr(message),
            sqlBool(isRead),
            sqlStr(formatMySQL(createdAt)),
        ]);

        generated++;
        if (generated % 5000 === 0) logProgress('Notifications', generated, TOTAL_NOTIFICATIONS);
        if (generated >= TOTAL_NOTIFICATIONS) break;
    }

    // 2. Generate reaction notifications (fill remaining)
    const remaining = TOTAL_NOTIFICATIONS - generated;
    for (let i = 0; i < remaining; i++) {
        const actor = pick(users);

        // React to a random thread or post
        const isThread = Math.random() < 0.40;
        let recipientId: number;
        let targetType: 'thread' | 'post';
        let targetId: number;
        let refDate: Date;

        if (isThread && threads.length > 0) {
            const thread = pick(threads);
            recipientId = thread.userId;
            targetType = 'thread';
            targetId = thread.id;
            refDate = thread.createdAt;
        } else if (posts.length > 0) {
            const post = pick(posts);
            recipientId = post.userId;
            targetType = 'post';
            targetId = post.id;
            refDate = post.createdAt;
        } else {
            continue;
        }

        // Don't notify yourself
        if (recipientId === actor.id) continue;

        const message = pick(REACTION_MESSAGES).replace('{actor}', actor.username);
        const isRead = Math.random() < 0.60;
        const createdAt = timestampAfter(refDate, 24);
        const phase = createdAt.getTime() < PHASE_A.end.getTime() ? 'A' : 'B';

        const writer = phase === 'A' ? writerA : writerB;
        writer.addRow([
            recipientId.toString(),
            actor.id.toString(),
            sqlStr('reaction'),
            sqlStr(targetType),
            targetId.toString(),
            sqlStr(message),
            sqlBool(isRead),
            sqlStr(formatMySQL(createdAt)),
        ]);

        generated++;
        if (generated % 5000 === 0) logProgress('Notifications', generated, TOTAL_NOTIFICATIONS);
    }

    logProgress('Notifications', generated, TOTAL_NOTIFICATIONS);
    await writerA.close();
    await writerB.close();
    console.log(`  ✅ ${generated.toLocaleString()} notifications generated`);
}
