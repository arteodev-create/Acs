import { TOTAL_BLOG_POSTS, BLOG_CATEGORIES, PHASE_A, PHASE_B, OUTPUT_DIRS } from './config';
import {
    SqlFileWriter, randInt, pick, pickN,
    phaseTimestamp, formatMySQL, sqlStr, uniqueSlug, logProgress
} from './helpers';
import { SKILLS, YOUTUBE_IDS, REAL_LINKS } from './data-pools';
import { GeneratedUser } from './gen-users';

// ═══════════════════════════════════════════════════════════
// BLOG POST GENERATOR — 1,500 quality blog articles
// ═══════════════════════════════════════════════════════════

const BLOG_TITLE_TEMPLATES = [
    'How We Scaled {tech} to Handle {number}M Requests Per Day',
    'The Complete Guide to {topic} in 2026',
    'Why We Migrated From {tech} to {tech2} — And What Happened Next',
    '{topic}: Best Practices for Production-Ready Applications',
    'Building High-Performance {project} With {tech}',
    'Lessons Learned From {months} Months of Running {tech} in Production',
    'Understanding {topic}: A Deep Technical Breakdown',
    '{tech} vs {tech2}: An Honest Comparison for {year}',
    'The Hidden Costs of {topic} Nobody Talks About',
    'From Zero to Production: {topic} With {tech}',
    'How {tech} Changed the Way We Think About {topic}',
    'A Practical Guide to {topic} for Senior Engineers',
    'State of {tech} in {year}: What\'s New and What Changed',
    'Why {topic} Matters More Than Ever in {year}',
    'The Architecture Behind Our {project}',
    'Performance Deep Dive: Optimizing {tech} for {scenario}',
    '{tech} Internals: How It Really Works Under the Hood',
    'Building a Modern {project} From Scratch',
    'Our Journey From Monolith to Microservices',
    'The Definitive {topic} Checklist for Startups',
    'How to Debug {topic} Like a Senior Engineer',
    'What I Wish I Knew Before Using {tech}',
    '{number} Tips for Writing Better {tech} Code',
    'The Future of {topic}: Trends to Watch in {year}',
    'Why Your {project} Needs {topic} Right Now',
    'Rethinking {topic}: A Fresh Perspective',
    'Building Resilient Systems: {topic} Under Extreme Load',
    'Security Best Practices When Working With {tech}',
    'Edge Computing with {tech}: A Practical Introduction',
    'Real-Time {project} Architecture with {tech} and {tech2}',
];

const TOPICS = [
    'authentication', 'caching', 'database design', 'API architecture',
    'CI/CD', 'observability', 'error handling', 'state management',
    'deployment strategies', 'container orchestration', 'testing',
    'code review', 'developer experience', 'performance tuning',
    'security hardening', 'infrastructure as code', 'serverless',
    'data pipelines', 'search infrastructure', 'real-time systems',
];

const PROJECTS = [
    'analytics dashboard', 'notification system', 'payment gateway',
    'content management system', 'developer tools platform',
    'monitoring infrastructure', 'data warehouse', 'API platform',
    'deployment system', 'event processing pipeline',
];

const SCENARIOS = [
    'high-traffic environments', 'distributed systems', 'real-time workloads',
    'serverless architectures', 'multi-cloud deployments', 'edge networks',
];

function generateBlogContent(title: string): string {
    const tech = pick(SKILLS);
    const tech2 = pick(SKILLS.filter(s => s !== tech));
    const youtubeId = pick(YOUTUBE_IDS);
    const link = pick(REAL_LINKS);
    const topic = pick(TOPICS);

    const introTemplates = [
        `In the fast-evolving landscape of software engineering, ${topic} has become a cornerstone of building reliable, scalable applications. After working with ${tech} across multiple production systems, I've compiled the insights that would have saved me countless hours of debugging and refactoring.`,
        `Let me start with a confession: when I first started working with ${tech} for ${topic}, I made every mistake in the book. This post distills ${randInt(6, 24)} months of lessons learned into actionable advice.`,
        `If you're building anything non-trivial with ${tech} in 2026, understanding ${topic} isn't optional — it's essential. This guide covers everything from the fundamentals to advanced patterns that we use in production.`,
        `The tech industry loves to chase shiny new frameworks, but the fundamentals of ${topic} haven't changed much. What has changed is how we implement them. This article explores modern approaches using ${tech}.`,
    ];

    const bodySection1 = `## The Problem Space\n\nBefore diving into solutions, let's understand why ${topic} is harder than it looks. Most tutorials show you the happy path, but production systems face:\n\n- **Concurrency issues**: Multiple processes reading and writing simultaneously\n- **Failure modes**: Network partitions, timeout cascades, partial failures\n- **Scale challenges**: What works for 100 users breaks at 100,000\n- **Operational overhead**: Monitoring, alerting, and debugging in production\n\nI've seen teams spend weeks building elegant ${topic} solutions only to discover they don't hold up under real-world conditions.`;

    const bodySection2 = `## Our Approach\n\nAfter evaluating several options, we settled on ${tech} combined with ${tech2}. Here's the high-level architecture:\n\n\`\`\`\n┌──────────────────┐\n│   Load Balancer   │\n└────────┬─────────┘\n         │\n    ┌────▼────┐\n    │  ${tech}  │ ───▶ Primary datastore\n    └────┬────┘\n         │\n    ┌────▼────┐\n    │  ${tech2} │ ───▶ Cache / queue layer\n    └─────────┘\n\`\`\`\n\n### Key Design Decisions\n\n1. **Separation of concerns**: Each layer has a single responsibility\n2. **Idempotent operations**: Every mutation can be safely retried\n3. **Circuit breakers**: Downstream failures don't cascade upward\n4. **Structured logging**: Every operation emits machine-readable logs with correlation IDs`;

    const bodySection3 = `## Implementation Details\n\nHere's the core implementation:\n\n\`\`\`typescript\nclass ServiceLayer {\n  private readonly cache: CacheClient;\n  private readonly db: DatabaseClient;\n  private readonly metrics: MetricsClient;\n\n  async processRequest(req: Request): Promise<Response> {\n    const timer = this.metrics.startTimer('process_request');\n    \n    try {\n      // Check cache first (P50: 2ms)\n      const cached = await this.cache.get(req.key);\n      if (cached) {\n        this.metrics.increment('cache_hit');\n        return cached;\n      }\n\n      // Cache miss — hit the database (P50: 45ms)\n      this.metrics.increment('cache_miss');\n      const result = await this.db.query(req.query);\n      \n      // Populate cache for next time\n      await this.cache.set(req.key, result, { ttl: 300 });\n      \n      return result;\n    } catch (error) {\n      this.metrics.increment('request_error');\n      throw new ServiceError('Processing failed', { cause: error });\n    } finally {\n      timer.stop();\n    }\n  }\n}\n\`\`\`\n\nA few things worth noting:\n- We use **TTL-based cache invalidation** rather than event-driven. It's simpler and good enough for our read-heavy workload.\n- The **metrics client** wraps StatsD and gives us real-time visibility into cache hit rates and latency.\n- **Error boundaries** at every layer prevent unhandled rejections from crashing the process.`;

    const bodySection4 = `## Results\n\nAfter deploying this architecture:\n\n| Metric | Before | After | Change |\n|--------|--------|-------|--------|\n| P50 latency | ${randInt(80, 200)}ms | ${randInt(5, 25)}ms | -${randInt(70, 95)}% |\n| P99 latency | ${randInt(500, 2000)}ms | ${randInt(40, 150)}ms | -${randInt(80, 97)}% |\n| Error rate | ${randInt(2, 8)}% | ${(Math.random() * 0.5).toFixed(2)}% | -${randInt(90, 99)}% |\n| Infrastructure cost | $${randInt(5000, 15000)}/mo | $${randInt(1500, 4000)}/mo | -${randInt(40, 70)}% |\n\nThe most surprising improvement was in **tail latency** (P99). By adding the cache layer, we eliminated the slow database queries that were causing occasional timeouts.`;

    const conclusion = `## Key Takeaways\n\n1. **Start simple, measure, then optimize.** Don't add complexity until you have data showing you need it.\n2. **Observability is not optional.** If you can't measure it, you can't improve it.\n3. **Design for failure.** Every external call will eventually fail. Plan for it.\n4. **Cache strategically.** Not everything needs caching. Profile your hot paths.\n\n## Further Reading\n\n- ${link}\n- https://www.youtube.com/watch?v=${youtubeId}\n\nIf you found this useful, follow me for more deep dives into ${topic}. And as always, the best way to learn is to build. Ship something this week. 🚀`;

    return `${pick(introTemplates)}\n\n${bodySection1}\n\n${bodySection2}\n\n${bodySection3}\n\n${bodySection4}\n\n${conclusion}`;
}

function generateSummary(title: string): string {
    const summaries = [
        `A comprehensive look at production-ready patterns and practices for modern web applications.`,
        `Practical insights from running distributed systems at scale, with real benchmarks and code examples.`,
        `Deep technical breakdown with architecture diagrams, implementation details, and performance metrics.`,
        `Lessons learned from months of production experience, distilled into actionable engineering advice.`,
        `From fundamentals to advanced optimization — everything you need to build reliable, high-performance systems.`,
        `An honest, data-driven comparison with real-world benchmarks and migration considerations.`,
        `Battle-tested strategies for building systems that scale, with code you can use today.`,
        `A practical guide covering common pitfalls, best practices, and emerging trends in modern engineering.`,
    ];
    return pick(summaries);
}

// --- MAIN EXPORT ---
export async function generateBlogPosts(users: GeneratedUser[]): Promise<void> {
    console.log('\n📰 Generating blog posts...');

    const phaseACount = Math.floor(TOTAL_BLOG_POSTS * PHASE_A.ratio);
    const phaseBCount = TOTAL_BLOG_POSTS - phaseACount;

    const writerA = new SqlFileWriter(
        `${OUTPUT_DIRS.phaseA.blogPosts}/blog_posts_phase_a.sql`,
        'blog_posts',
        ['author_id', 'title', 'slug', 'summary', 'content', 'category', 'view_count', 'created_at', 'updated_at']
    );
    const writerB = new SqlFileWriter(
        `${OUTPUT_DIRS.phaseB.blogPosts}/blog_posts_phase_b.sql`,
        'blog_posts',
        ['author_id', 'title', 'slug', 'summary', 'content', 'category', 'view_count', 'created_at', 'updated_at']
    );

    // Blog authors: top 10% of users by reputation
    const blogAuthors = users
        .filter(u => u.reputation > 100)
        .sort((a, b) => b.reputation - a.reputation)
        .slice(0, Math.floor(users.length * 0.10));

    const usedSlugs = new Set<string>();

    for (let i = 0; i < TOTAL_BLOG_POSTS; i++) {
        const phase: 'A' | 'B' = i < phaseACount ? 'A' : 'B';
        const createdAt = phaseTimestamp(phase);
        const author = pick(blogAuthors.length > 0 ? blogAuthors : users);

        const tech = pick(SKILLS);
        const tech2 = pick(SKILLS.filter(s => s !== tech));
        const topic = pick(TOPICS);
        const project = pick(PROJECTS);
        const scenario = pick(SCENARIOS);

        const titleTemplate = pick(BLOG_TITLE_TEMPLATES);
        const title = titleTemplate
            .replace(/\{tech\}/g, tech)
            .replace(/\{tech2\}/g, tech2)
            .replace(/\{topic\}/g, topic)
            .replace(/\{project\}/g, project)
            .replace(/\{scenario\}/g, scenario)
            .replace(/\{number\}/g, randInt(5, 50).toString())
            .replace(/\{months\}/g, randInt(3, 18).toString())
            .replace(/\{year\}/g, '2026');

        let slug = uniqueSlug(title);
        while (usedSlugs.has(slug)) slug = uniqueSlug(title);
        usedSlugs.add(slug);

        const content = generateBlogContent(title);
        const summary = generateSummary(title);
        const category = pick(BLOG_CATEGORIES);
        const viewCount = randInt(50, 50000);
        const dateStr = formatMySQL(createdAt);

        const writer = phase === 'A' ? writerA : writerB;
        writer.addRow([
            author.id.toString(),
            sqlStr(title),
            sqlStr(slug),
            sqlStr(summary),
            sqlStr(content),
            sqlStr(category),
            viewCount.toString(),
            sqlStr(dateStr),
            sqlStr(dateStr),
        ]);

        logProgress('Blog Posts', i + 1, TOTAL_BLOG_POSTS);
    }

    await writerA.close();
    await writerB.close();
    console.log(`  ✅ Phase A: ${phaseACount} | Phase B: ${phaseBCount} blog posts`);
}
