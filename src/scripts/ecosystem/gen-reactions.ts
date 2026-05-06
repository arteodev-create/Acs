import { TOTAL_REACTIONS, REACTION_WEIGHTS, OUTPUT_DIRS, PHASE_A } from './config';
import {
    SqlFileWriter, randInt, pick, weightedPick,
    formatMySQL, sqlStr, logProgress, timestampAfter
} from './helpers';
import { GeneratedUser } from './gen-users';
import { GeneratedThread } from './gen-threads';
import { GeneratedPost } from './gen-posts';

// ═══════════════════════════════════════════════════════════
// REACTION GENERATOR — 300,000 reactions (like/insightful/helpful)
// ═══════════════════════════════════════════════════════════

export async function generateReactions(
    users: GeneratedUser[],
    threads: GeneratedThread[],
    posts: GeneratedPost[]
): Promise<void> {
    console.log('\n❤️ Generating reactions...');

    const writerA = new SqlFileWriter(
        `${OUTPUT_DIRS.phaseA.reactions}/reactions_phase_a.sql`,
        'reactions',
        ['user_id', 'target_type', 'target_id', 'reaction_type', 'created_at']
    );
    const writerB = new SqlFileWriter(
        `${OUTPUT_DIRS.phaseB.reactions}/reactions_phase_b.sql`,
        'reactions',
        ['user_id', 'target_type', 'target_id', 'reaction_type', 'created_at']
    );

    // Track unique reactions: "userId-targetType-targetId"
    const usedReactions = new Set<string>();
    let generated = 0;
    let attempts = 0;
    const maxAttempts = TOTAL_REACTIONS * 3;

    while (generated < TOTAL_REACTIONS && attempts < maxAttempts) {
        attempts++;

        const user = pick(users);
        const reactionType = weightedPick(REACTION_WEIGHTS as Record<string, number>);

        // 60% react to posts, 40% react to threads
        let targetType: 'thread' | 'post';
        let targetId: number;
        let refDate: Date;

        if (Math.random() < 0.60 && posts.length > 0) {
            targetType = 'post';
            const post = posts[randInt(0, posts.length - 1)];
            targetId = post.id;
            refDate = post.createdAt;
        } else {
            targetType = 'thread';
            const thread = threads[randInt(0, threads.length - 1)];
            targetId = thread.id;
            refDate = thread.createdAt;
        }

        // Unique check
        const key = `${user.id}-${targetType}-${targetId}`;
        if (usedReactions.has(key)) continue;

        // Don't react to own content
        if (targetType === 'thread') {
            const thread = threads.find(t => t.id === targetId);
            if (thread && thread.userId === user.id) continue;
        } else {
            const post = posts.find(p => p.id === targetId);
            if (post && post.userId === user.id) continue;
        }

        usedReactions.add(key);

        // Reaction timestamp: after the content was posted (minutes to hours later)
        const createdAt = timestampAfter(refDate, 48);
        const phase = createdAt.getTime() < PHASE_A.end.getTime() ? 'A' : 'B';
        const dateStr = formatMySQL(createdAt);

        const writer = phase === 'A' ? writerA : writerB;
        writer.addRow([
            user.id.toString(),
            sqlStr(targetType),
            targetId.toString(),
            sqlStr(reactionType),
            sqlStr(dateStr),
        ]);

        generated++;
        logProgress('Reactions', generated, TOTAL_REACTIONS);
    }

    await writerA.close();
    await writerB.close();
    console.log(`  ✅ ${generated.toLocaleString()} reactions generated (${attempts.toLocaleString()} attempts)`);
}
