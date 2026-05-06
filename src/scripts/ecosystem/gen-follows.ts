import { TOTAL_FOLLOWS, OUTPUT_DIRS, PHASE_A } from './config';
import {
    SqlFileWriter, randInt, pick,
    formatMySQL, sqlStr, logProgress, naturalTimestamp
} from './helpers';
import { GeneratedUser } from './gen-users';

// ═══════════════════════════════════════════════════════════
// FOLLOWS GENERATOR — 240,000 follow relationships
// Power-law: top users attract more followers
// ═══════════════════════════════════════════════════════════

export async function generateFollows(users: GeneratedUser[]): Promise<void> {
    console.log('\n👥 Generating follows...');

    const writerA = new SqlFileWriter(
        `${OUTPUT_DIRS.phaseA.follows}/follows_phase_a.sql`,
        'follows',
        ['follower_id', 'following_id', 'created_at']
    );
    const writerB = new SqlFileWriter(
        `${OUTPUT_DIRS.phaseB.follows}/follows_phase_b.sql`,
        'follows',
        ['follower_id', 'following_id', 'created_at']
    );

    // Build weighted pool: higher reputation = more likely to be followed
    const topUsers = users.filter(u => u.reputation > 200).sort((a, b) => b.reputation - a.reputation);
    const midUsers = users.filter(u => u.reputation > 50 && u.reputation <= 200);
    const allUsersById = new Map(users.map(u => [u.id, u]));

    // Track unique follow pairs
    const usedFollows = new Set<string>();
    let generated = 0;
    let attempts = 0;
    const maxAttempts = TOTAL_FOLLOWS * 3;

    while (generated < TOTAL_FOLLOWS && attempts < maxAttempts) {
        attempts++;

        const follower = pick(users);
        let following: GeneratedUser;

        // Weighted: 50% follow top users, 30% follow mid, 20% random
        const rand = Math.random();
        if (rand < 0.50 && topUsers.length > 0) {
            following = pick(topUsers);
        } else if (rand < 0.80 && midUsers.length > 0) {
            following = pick(midUsers);
        } else {
            following = pick(users);
        }

        // No self-follow
        if (follower.id === following.id) continue;

        const key = `${follower.id}-${following.id}`;
        if (usedFollows.has(key)) continue;
        usedFollows.add(key);

        // 30% mutual follows
        if (Math.random() < 0.30 && generated < TOTAL_FOLLOWS - 1) {
            const reverseKey = `${following.id}-${follower.id}`;
            if (!usedFollows.has(reverseKey)) {
                usedFollows.add(reverseKey);

                const mutualDate = naturalTimestamp(
                    new Date(Math.max(follower.joinedAt.getTime(), following.joinedAt.getTime())),
                    PHASE_A.end.getTime() < Date.now() ? new Date() : PHASE_A.end
                );
                const mutualPhase = mutualDate.getTime() < PHASE_A.end.getTime() ? 'A' : 'B';
                const mutualWriter = mutualPhase === 'A' ? writerA : writerB;
                mutualWriter.addRow([
                    following.id.toString(),
                    follower.id.toString(),
                    sqlStr(formatMySQL(mutualDate)),
                ]);
                generated++;
            }
        }

        // Follow timestamp: after both users joined
        const laterJoin = new Date(Math.max(follower.joinedAt.getTime(), following.joinedAt.getTime()));
        const createdAt = naturalTimestamp(laterJoin, new Date('2026-04-14T23:59:59+07:00'));
        const phase = createdAt.getTime() < PHASE_A.end.getTime() ? 'A' : 'B';
        const dateStr = formatMySQL(createdAt);

        const writer = phase === 'A' ? writerA : writerB;
        writer.addRow([
            follower.id.toString(),
            following.id.toString(),
            sqlStr(dateStr),
        ]);

        generated++;
        logProgress('Follows', generated, TOTAL_FOLLOWS);
    }

    await writerA.close();
    await writerB.close();
    console.log(`  ✅ ${generated.toLocaleString()} follow relationships generated`);
}
