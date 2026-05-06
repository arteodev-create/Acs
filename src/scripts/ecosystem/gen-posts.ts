import { TOTAL_POSTS, PHASE_A, OUTPUT_DIRS } from './config';
import {
    SqlFileWriter, randInt, pick,
    formatMySQL, sqlStr, logProgress, timestampAfter
} from './helpers';
import { SKILLS, YOUTUBE_IDS, REAL_LINKS } from './data-pools';
import { GeneratedUser } from './gen-users';
import { GeneratedThread } from './gen-threads';

// ═══════════════════════════════════════════════════════════
// POST GENERATOR — 180,000 replies with natural conversation
// ═══════════════════════════════════════════════════════════

export interface GeneratedPost {
    id: number;
    threadId: number;
    userId: number;
    parentId: number | null;
    createdAt: Date;
    phase: 'A' | 'B';
}

// --- Short replies (1–3 sentences) ---
const SHORT_REPLIES = [
    'Thanks for sharing this! Super helpful.',
    'This is exactly what I was looking for. Appreciate the detailed breakdown.',
    '+1 on this approach. We use something similar at work and it scales well.',
    'Great post! Bookmarked for future reference.',
    'Hmm, I had a different experience. For me {tech} worked better for this use case.',
    'Have you tried the new {tech} update? It might solve this issue out of the box.',
    'Solid advice. I made this exact mistake last month and it cost us days of debugging.',
    'Interesting perspective. I\'d love to see benchmarks comparing this with {tech}.',
    'Not sure I agree with the {tech} recommendation here. In my experience it introduces too much complexity.',
    'This is gold. Shared with my team.',
    'Clean solution! One minor suggestion: you might want to add error handling for the edge case where the input is null.',
    'I was literally debugging this exact issue yesterday. Wish I had seen this sooner.',
    '🔥 This is the kind of content that makes Re-Code awesome.',
    'Nice write-up! Would be great to see a follow-up covering {topic}.',
    'Disagree. {tech} has changed a lot since then. The new version addresses most of these concerns.',
    'Quick note: this approach doesn\'t work if you\'re running behind a reverse proxy. Ask me how I know...',
    'I\'ve been using this pattern for about 6 months now and can confirm it holds up well in production.',
    'This saved my bacon. Had the same error and your solution fixed it immediately.',
    'Worth mentioning that {tech} has a built-in solution for this since v{version}.',
    'Can someone ELI5 the second paragraph? I\'m not following the logic there.',
    'Wow, I had no idea about this. Time to refactor some code...',
    'Great tip! Though I\'d add that you should also consider {topic} when implementing this.',
    'This is controversial but I actually agree. We ditched {tech} for {tech2} last quarter and haven\'t looked back.',
    'Anyone else getting weird behavior with this on Safari? Works fine on Chrome/Firefox.',
    'Not to nitpick but there\'s a typo in the third code block. Should be `.catch()` not `.cath()`.',
    'Perfect timing. I was just about to start a project that needs exactly this.',
    'How does this handle concurrent requests? That\'s usually where things break down.',
    'Simple and effective. No over-engineering. Love it.',
    'I tried this and it actually made things slower in my case. Might be specific to my setup though.',
    'Yo this is fire 🔥 Exactly what the community needs more of.',
    'Following for updates. This is a space I\'m actively exploring.',
    'The code example is clean but I\'d recommend wrapping it in a try-catch for production use.',
    'This is one of those "I wish I knew this 2 years ago" posts.',
    'Anyone else notice this breaks when you upgrade to Node 22?',
    'Really well explained. The diagram alone is worth the read.',
    'Respectfully disagree. This oversimplifies the problem. In real production environments, you also need to handle {scenario}.',
    'TIL! Thanks for the explanation.',
    'This is the way. Been doing this for years and never had issues.',
];

// --- Medium replies (1–3 paragraphs) ---
const MEDIUM_REPLIES = [
    `Great question! I dealt with this last quarter when we were scaling our {project}.\n\nWhat worked for us was using {tech} with a {pattern} pattern. The key insight is that you don't need to {scenario} synchronously — you can defer it to a background job and process it in batches.\n\nHere's the rough approach:\n1. Accept the request immediately\n2. Queue the heavy operation\n3. Return a polling endpoint for status\n\nThis took our P99 from 2s down to 200ms.`,

    `I want to push back a little on the idea that {tech} is always the right choice here.\n\nYes, it's great for prototyping and small-to-medium projects. But once you hit certain scale thresholds, the abstraction starts to leak. We experienced this firsthand when our traffic went from 1K to 50K RPM.\n\nWhat I'd recommend instead:\n- Below 10K RPM: {tech} is fine, don't overcomplicate things\n- 10K-100K RPM: Consider {tech2} for the hot paths\n- Above 100K RPM: You probably need a custom solution tailored to your specific bottlenecks`,

    `Building on what @{username} said above — there's a nuance here that I think is important.\n\nThe pattern works well when your data is relatively static. But if you're dealing with high write throughput, you need to invalidate the cache carefully. I've seen too many teams implement this without a proper invalidation strategy and end up serving stale data.\n\nMy rule of thumb: if your data changes more than once per minute, use a different approach. Something like a write-through cache or event-driven invalidation works much better.\n\nHappy to share our implementation if anyone's interested.`,

    `I've been working with {tech} since its early days, and I think this thread misses a crucial point.\n\nThe performance comparison isn't really apples-to-apples. When you benchmark {tech} vs {tech2}, you need to account for:\n- Cold start times (huge for serverless)\n- Memory overhead at scale\n- GC pressure under sustained load\n\nIn my benchmarks, {tech} wins for bursty workloads but {tech2} is significantly better for steady-state high-throughput scenarios.\n\nFull benchmark repo: {link}`,

    `This is a solid tutorial, but I want to add some production hardening tips that are often overlooked:\n\n**1. Always set timeouts**\nI can't stress this enough. Without explicit timeouts, a single slow downstream service can cascade and bring down your entire system.\n\n\`\`\`javascript\nconst controller = new AbortController();\nconst timeout = setTimeout(() => controller.abort(), 5000);\n\`\`\`\n\n**2. Use circuit breakers**\nWhen a service is down, stop hammering it. Give it time to recover.\n\n**3. Log correlation IDs**\nWhen debugging distributed systems, correlation IDs are your best friend. Pass them through every service boundary.\n\nThese three things alone would have prevented 80% of the production incidents I've seen.`,

    `I actually wrote a blog post about this exact topic last month. The TL;DR is:\n\n- {tech} is optimized for developer experience, not raw performance\n- If you need both, consider using {tech} for your hot paths and {tech2} for everything else\n- The 80/20 rule applies: optimize the 20% of code that handles 80% of traffic\n\nThe biggest mistake I see is premature optimization. Profile first, optimize second. Always.\n\nGreat discussion thread btw. This is why I keep coming back to Re-Code.`,

    `@{username} raises a good point, but I think the reality is more nuanced.\n\nWe migrated from {tech} to {tech2} last year and here's what actually happened:\n\n**Week 1-2**: Everything felt faster and cleaner\n**Month 1**: Started hitting edge cases the docs don't cover\n**Month 3**: Had to write custom middleware to work around limitations\n**Month 6**: Net positive, but the migration cost was higher than expected\n\nConclusion: yes, {tech2} is better for our use case. But budget 2x whatever time you think the migration will take. There are always surprises.`,
];

// --- Long replies (code-heavy or detailed analysis) ---
const LONG_REPLIES = [
    `Let me provide a complete solution since I've built exactly this before.\n\n## Architecture\n\nThe key is to separate the concerns properly:\n\n\`\`\`\n┌────────────┐    ┌─────────────┐    ┌──────────┐\n│   Client   │───▶│  API Server │───▶│   Queue  │\n└────────────┘    └──────┬──────┘    └─────┬────┘\n                         │                 │\n                  ┌──────▼──────┐   ┌──────▼────┐\n                  │   Cache     │   │  Workers  │\n                  │   (Redis)   │   │  (N pods) │\n                  └─────────────┘   └───────────┘\n\`\`\`\n\n## Implementation\n\n\`\`\`typescript\n// Queue processor with graceful shutdown\nclass QueueProcessor {\n  private isShuttingDown = false;\n  \n  async process(job: Job): Promise<void> {\n    if (this.isShuttingDown) return;\n    \n    const startTime = performance.now();\n    try {\n      await this.handleJob(job);\n      metrics.recordSuccess(performance.now() - startTime);\n    } catch (error) {\n      metrics.recordFailure(error);\n      if (job.retries < MAX_RETRIES) {\n        await this.requeueWithBackoff(job);\n      } else {\n        await this.moveToDeadLetter(job);\n      }\n    }\n  }\n  \n  async shutdown(): Promise<void> {\n    this.isShuttingDown = true;\n    await this.drainCurrentJobs();\n  }\n}\n\`\`\`\n\n## Key Considerations\n\n1. **Idempotency** — Every job handler must be idempotent. Network failures will cause retries.\n2. **Backpressure** — If workers can't keep up, you need to slow down producers.\n3. **Monitoring** — Track queue depth, processing rate, and error rate.\n4. **Dead letter queue** — Jobs that fail too many times need a separate queue for manual investigation.\n\nThis pattern has handled 500K+ jobs/day for us without issues. The secret is keeping each job small and fast.\n\nLet me know if you want me to go deeper into any of these areas!`,

    `I spent last weekend profiling this exact scenario and here are my findings.\n\n## Test Setup\n\n- **Hardware**: M2 MacBook Pro, 16GB RAM\n- **Runtime**: Node.js 22.1 with --max-old-space-size=4096\n- **Database**: PostgreSQL 16 with pgbouncer\n- **Load tool**: k6 with {number} virtual users\n\n## Results\n\n| Approach | P50 | P95 | P99 | Throughput |\n|----------|-----|-----|-----|------------|\n| Naive (no cache) | 145ms | 890ms | 2.1s | 420 RPS |\n| Redis cache | 12ms | 45ms | 120ms | 8,500 RPS |\n| In-memory LRU | 3ms | 8ms | 22ms | 25,000 RPS |\n| Hybrid (LRU + Redis) | 5ms | 15ms | 40ms | 18,000 RPS |\n\n## Analysis\n\nThe in-memory LRU wins on raw speed, but has limitations:\n- Cache is per-process (not shared across instances)\n- Cold starts are expensive\n- Memory pressure at high cardinality\n\nFor most deployments, I recommend the hybrid approach:\n\n\`\`\`typescript\nclass HybridCache<T> {\n  private localCache: LRUCache<string, T>;\n  private redisClient: Redis;\n  \n  async get(key: string): Promise<T | undefined> {\n    // L1: Check local cache first (microseconds)\n    const local = this.localCache.get(key);\n    if (local) return local;\n    \n    // L2: Check Redis (milliseconds)\n    const remote = await this.redisClient.get(key);\n    if (remote) {\n      const parsed = JSON.parse(remote) as T;\n      this.localCache.set(key, parsed); // Promote to L1\n      return parsed;\n    }\n    \n    return undefined;\n  }\n}\n\`\`\`\n\n## Conclusion\n\nDon't just throw Redis at everything. Profile your specific access patterns first. If your data set fits in memory and you're running a single instance, in-memory cache is 10x faster.\n\nFull benchmark code: {link}\nRelated talk: https://www.youtube.com/watch?v=${pick(YOUTUBE_IDS)}`,
];

// --- Replace placeholders ---
function fillReply(template: string, users: GeneratedUser[]): string {
    const tech = pick(SKILLS);
    const tech2 = pick(SKILLS.filter(s => s !== tech));
    const user = pick(users);

    return template
        .replace(/\{tech\}/g, tech)
        .replace(/\{tech2\}/g, tech2)
        .replace(/\{topic\}/g, pick(['caching', 'state management', 'auth', 'error handling', 'testing', 'deployment', 'monitoring', 'security', 'performance', 'accessibility']))
        .replace(/\{project\}/g, pick(['API gateway', 'dashboard', 'CMS', 'chat app', 'analytics platform', 'auth service']))
        .replace(/\{pattern\}/g, pick(['pub/sub', 'observer', 'saga', 'CQRS', 'repository']))
        .replace(/\{scenario\}/g, pick(['handle high traffic', 'process real-time data', 'manage distributed state', 'scale horizontally', 'maintain consistency']))
        .replace(/\{username\}/g, user.username)
        .replace(/\{link\}/g, pick(REAL_LINKS))
        .replace(/\{number\}/g, randInt(100, 10000).toString())
        .replace(/\{version\}/g, `${randInt(2, 5)}.${randInt(0, 9)}`)
        ;
}

// --- MAIN EXPORT ---
export async function generatePosts(
    users: GeneratedUser[],
    threads: GeneratedThread[]
): Promise<GeneratedPost[]> {
    console.log('\n💬 Generating posts...');
    const posts: GeneratedPost[] = [];

    const writerA = new SqlFileWriter(
        `${OUTPUT_DIRS.phaseA.posts}/posts_phase_a.sql`,
        'posts',
        ['thread_id', 'user_id', 'parent_id', 'content', 'created_at', 'updated_at']
    );
    const writerB = new SqlFileWriter(
        `${OUTPUT_DIRS.phaseB.posts}/posts_phase_b.sql`,
        'posts',
        ['thread_id', 'user_id', 'parent_id', 'content', 'created_at', 'updated_at']
    );

    // Distribute posts across threads (power law: some threads get many, most get few)
    const threadPostCounts: number[] = [];
    let totalAssigned = 0;

    for (const thread of threads) {
        let count: number;
        if (thread.threadType === 'drama') {
            count = randInt(10, 40); // Drama gets more replies
        } else if (thread.threadType === 'deep') {
            count = randInt(5, 25);
        } else if (thread.threadType === 'medium') {
            count = randInt(3, 15);
        } else {
            count = randInt(1, 8);
        }
        threadPostCounts.push(count);
        totalAssigned += count;
    }

    // Scale to match TOTAL_POSTS
    const scaleFactor = TOTAL_POSTS / totalAssigned;
    for (let i = 0; i < threadPostCounts.length; i++) {
        threadPostCounts[i] = Math.max(1, Math.round(threadPostCounts[i] * scaleFactor));
    }

    let postId = 0;

    for (let ti = 0; ti < threads.length; ti++) {
        const thread = threads[ti];
        const postCount = threadPostCounts[ti];
        const threadPostIds: number[] = []; // Track posts in this thread for parent_id

        for (let pi = 0; pi < postCount; pi++) {
            postId++;

            // Pick a user different from thread author (mostly)
            let user: GeneratedUser;
            if (Math.random() < 0.9) {
                user = pick(users.filter(u => u.id !== thread.userId));
            } else {
                // 10% chance thread author responds in their own thread
                user = users.find(u => u.id === thread.userId) || pick(users);
            }

            // parent_id: 30% are nested replies (to previous posts in same thread)
            let parentId: number | null = null;
            if (pi > 0 && Math.random() < 0.30 && threadPostIds.length > 0) {
                parentId = pick(threadPostIds);
            }

            // Timestamp after thread creation
            const createdAt = timestampAfter(thread.createdAt, 168); // Up to 1 week later

            // Content type distribution
            let content: string;
            const rand = Math.random();
            if (rand < 0.50) {
                content = fillReply(pick(SHORT_REPLIES), users);
            } else if (rand < 0.80) {
                content = fillReply(pick(MEDIUM_REPLIES), users);
            } else {
                content = fillReply(pick(LONG_REPLIES), users);
            }

            const phase = createdAt.getTime() < PHASE_A.end.getTime() ? 'A' : 'B';
            const dateStr = formatMySQL(createdAt);

            const writer = phase === 'A' ? writerA : writerB;
            writer.addRow([
                thread.id.toString(),
                user.id.toString(),
                parentId !== null ? parentId.toString() : 'NULL',
                sqlStr(content),
                sqlStr(dateStr),
                sqlStr(dateStr),
            ]);

            posts.push({
                id: postId,
                threadId: thread.id,
                userId: user.id,
                parentId,
                createdAt,
                phase,
            });

            threadPostIds.push(postId);
            if (postId % 5000 === 0) logProgress('Posts', postId, TOTAL_POSTS);
        }
    }

    logProgress('Posts', postId, TOTAL_POSTS);
    await writerA.close();
    await writerB.close();
    console.log(`  ✅ ${postId.toLocaleString()} posts generated across ${threads.length.toLocaleString()} threads`);
    return posts;
}
