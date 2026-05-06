import { TOTAL_THREADS, PHASE_A, PHASE_B, CATEGORIES, OUTPUT_DIRS } from './config';
import {
    SqlFileWriter, randInt, pick, pickN, weightedPick,
    phaseTimestamp, formatMySQL, sqlStr, sqlBool, uniqueSlug,
    logProgress, getPhase
} from './helpers';
import { SKILLS, YOUTUBE_IDS, REAL_LINKS, UNSPLASH_AVATARS } from './data-pools';
import { GeneratedUser } from './gen-users';

// ═══════════════════════════════════════════════════════════
// THREAD GENERATOR — 24,000 diverse threads
// ═══════════════════════════════════════════════════════════

export interface GeneratedThread {
    id: number;
    categoryId: number;
    userId: number;
    title: string;
    slug: string;
    createdAt: Date;
    phase: 'A' | 'B';
    threadType: 'short' | 'medium' | 'deep' | 'drama';
}

// --- Thread Type Distribution ---
const THREAD_TYPE_WEIGHTS = {
    short: 0.30,
    medium: 0.40,
    deep: 0.20,
    drama: 0.10,
};

// --- Title templates by category & type ---
const QUESTION_TITLES = [
    'How to handle {topic} in production?',
    'Best approach for {topic} with {tech}?',
    'Why does {tech} behave differently when {scenario}?',
    '{tech} vs {tech2}: which one for {scenario}?',
    'Help needed: {topic} throwing unexpected errors',
    'Is {tech} still worth learning in 2026?',
    'What\'s the best way to implement {topic}?',
    'Struggling with {topic} — any advice?',
    'How do you test {topic} effectively?',
    'Can someone explain {topic} like I\'m five?',
    'What\'s the catch with {tech} for {scenario}?',
    '{tech} performance issues in {scenario}',
    'Newbie question about {topic}',
    'How to debug {topic} when {scenario}?',
    'Should I use {tech} or {tech2} for my project?',
    'Migrating from {tech} to {tech2} — lessons learned?',
    'What are common pitfalls with {topic}?',
    '{topic}: am I doing this wrong?',
    'How does {tech} handle {scenario} under the hood?',
    'Rate my approach to {topic}',
];

const TUTORIAL_TITLES = [
    'Complete guide to {topic} with {tech}',
    'Building a {project} from scratch with {tech}',
    'Step-by-step: {topic} the right way',
    'How I built {project} using {tech} and {tech2}',
    '{topic} masterclass: from zero to production',
    'Deep dive into {topic} with real examples',
    'The definitive guide to {topic} in {tech}',
    'Practical {topic}: building {project}',
    '{tech} tutorial: implementing {topic}',
    'Everything you need to know about {topic}',
    'Advanced {topic} patterns in {tech}',
    'Setting up {tech} for {scenario}: complete walkthrough',
    'From zero to hero: {topic} with {tech}',
    'Real-world {topic} with {tech} and {tech2}',
    '{topic} in 2026: modern approach with {tech}',
];

const DISCUSSION_TITLES = [
    'What do you think about {tech} in 2026?',
    'The state of {topic} — are we doing it right?',
    '{topic} is changing and here\'s why it matters',
    'My experience with {tech} after 2 years',
    'Hot take: {topic} is overengineered',
    'Why I switched from {tech} to {tech2}',
    'Unpopular opinion: {tech} is overrated',
    '{tech} just released v{version} — thoughts?',
    'The real cost of {topic} nobody talks about',
    'Why {topic} will dominate {year}',
    'Stop using {tech} for {scenario}',
    '{tech} needs to fix {topic} or it\'s dead',
    'Am I the only one who thinks {topic} is overhyped?',
    'Why every developer should understand {topic}',
    'The {topic} debate is getting ridiculous',
    '{tech} drama: what really happened',
    'I tried {tech} for 30 days — honest review',
    'Why {tech} lost the battle to {tech2}',
    'The rise and fall of {topic}',
    'We need to talk about {topic} toxicity in tech',
];

const SHOWCASE_TITLES = [
    'Built a {project} with {tech} — feedback welcome!',
    'Show Re-Code: {project} powered by {tech}',
    'Just launched {project} — 6 months of work',
    'My weekend project: {project} with {tech}',
    'Open source: {project} for {scenario}',
    'Here\'s my {project} — roast it!',
    'Shipped {project} in 48 hours with {tech}',
    'Side project showcase: {project}',
    'I made {project} and it got {number} stars on GitHub',
    'Check out {project}: built for developers who {scenario}',
];

const PROJECTS = [
    'real-time chat app', 'task management platform', 'code editor', 'API gateway',
    'developer portfolio', 'blog engine', 'URL shortener', 'file sharing service',
    'deployment pipeline', 'monitoring dashboard', 'CLI tool', 'VS Code extension',
    'authentication service', 'rate limiter', 'caching layer', 'search engine',
    'notification system', 'payment integration', 'CMS', 'analytics dashboard',
    'image optimizer', 'markdown parser', 'test runner', 'package manager',
    'database migration tool', 'log aggregator', 'webhook relay', 'AI chatbot',
    'code review tool', 'documentation generator', 'email service', 'form builder',
    'GraphQL playground', 'REST client', 'WebSocket server', 'event bus',
    'container orchestrator', 'serverless framework', 'data pipeline', 'ETL tool',
];

const SCENARIOS = [
    'high traffic loads', 'microservices architecture', 'real-time data sync',
    'large-scale production', 'distributed systems', 'edge deployment',
    'mobile-first design', 'serverless environments', 'multi-tenant SaaS',
    'cross-platform apps', 'legacy system migration', 'enterprise environments',
    'startup MVPs', 'CI/CD pipelines', 'multi-region deployment',
    'data-intensive workloads', 'event-driven architecture', 'zero-downtime deploys',
    'offline-first applications', 'multi-language codebases',
];

const TOPICS = [
    'authentication', 'state management', 'caching strategies', 'error handling',
    'API design', 'database optimization', 'code splitting', 'server-side rendering',
    'CI/CD automation', 'container orchestration', 'type safety', 'testing strategies',
    'performance optimization', 'memory management', 'concurrency patterns',
    'dependency injection', 'event sourcing', 'CQRS', 'domain-driven design',
    'clean architecture', 'microservices communication', 'message queues',
    'real-time data streaming', 'search indexing', 'rate limiting',
    'input validation', 'file upload handling', 'WebSocket connections',
    'GraphQL schema design', 'REST API versioning', 'OAuth implementation',
    'JWT best practices', 'RBAC authorization', 'data migration',
    'monitoring and alerting', 'log management', 'security hardening',
    'accessibility', 'internationalization', 'responsive design',
    'progressive web apps', 'web workers', 'service workers',
];

// --- Content generators by type ---

function shortContent(): string {
    const templates = [
        `Hey everyone,\n\nQuick question — {question}\n\nI've been stuck on this for a while and Google hasn't been helpful. Any pointers would be appreciated.\n\nThanks!`,
        `Has anyone else run into this issue?\n\n\`\`\`\n{errorSnippet}\n\`\`\`\n\nHappens every time I try to {scenario}. Running {tech} on {os}.`,
        `Just curious — what's your go-to approach for {topic}?\n\nI've been using {tech} but wondering if there's something better out there.`,
        `TL;DR: {topic} is harder than it should be.\n\nAnyone have a clean solution? Mine feels hacky.`,
        `Found this interesting: {link}\n\nThoughts? I think it could change how we approach {topic}.`,
        `Quick tip for anyone struggling with {topic}:\n\n{tipContent}\n\nSaved me hours of debugging.`,
        `Am I the only one who finds {tech}'s docs confusing for {topic}?\n\nLike, I just want to {scenario}. Why is it this complicated?`,
        `Does anyone recommend a good resource for learning {topic}? Preferably something hands-on rather than theoretical.\n\nI learn best by building things.`,
    ];

    return pick(templates);
}

function mediumContent(): string {
    const templates = [
        `## The Problem\n\nI've been working on a project where I need to {scenario}, and I've hit a wall with {topic}.\n\n## What I've Tried\n\n1. Using {tech} — works but performance degrades at scale\n2. Switching to {tech2} — better perf but harder to maintain\n3. Custom solution — too complex for the team\n\n## Current Approach\n\n\`\`\`{lang}\n{codeBlock}\n\`\`\`\n\n## Questions\n\n- Is this the right pattern for {scenario}?\n- Should I be concerned about {topic} at this scale?\n- Any recommendations for monitoring {scenario}?\n\nWould love to hear from anyone who's dealt with similar challenges. Thanks!`,

        `I've been using {tech} for about {months} months now and wanted to share some observations.\n\n## The Good\n\n- **Developer experience** is fantastic. Setup takes minutes.\n- **{topic}** just works out of the box.\n- Community is active and helpful.\n\n## The Not-So-Good\n\n- Performance with {scenario} can be iffy\n- Documentation for {topic} is outdated\n- Some breaking changes between versions\n\n## My Setup\n\n\`\`\`{lang}\n{codeBlock}\n\`\`\`\n\nOverall I'd give it a **{rating}/10**. Solid for most use cases, but do your research if you're dealing with {scenario}.\n\nHere's a great talk that helped me understand it better: {youtubeEmbed}\n\nFull docs: {link}`,

        `## Context\n\nOur team recently migrated from {tech} to {tech2} for our {project}. Here's what we learned.\n\n## Why We Switched\n\nThe main driver was {topic}. With {tech}, we were constantly fighting against {scenario}. {tech2} offered a cleaner approach.\n\n## Migration Steps\n\n1. **Audit existing codebase** — Identified {number} components that needed changes\n2. **Set up parallel infrastructure** — Ran both systems side by side for 2 weeks\n3. **Gradual rollout** — Started with non-critical paths\n4. **Full cutover** — After {weeks} weeks of testing\n\n## Code Comparison\n\nBefore ({tech}):\n\`\`\`{lang}\n{codeBlock}\n\`\`\`\n\nAfter ({tech2}):\n\`\`\`{lang2}\n{codeBlock2}\n\`\`\`\n\n## Results\n\n- {metric1}% improvement in response time\n- {metric2}% reduction in bundle size\n- Developer satisfaction went up significantly\n\nWould I do it again? Absolutely. But plan for at least {weeks} weeks of migration work.\n\nRelated reading: {link}`,

        `Hey Re-Code community 👋\n\nI've put together a comparison of different {topic} approaches. Thought it might be useful for others making the same decision.\n\n| Feature | {tech} | {tech2} | {tech3} |\n|---------|--------|---------|----------|\n| Performance | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |\n| DX | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |\n| Ecosystem | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |\n| Learning Curve | Easy | Medium | Hard |\n\n## My Recommendation\n\nFor most projects, go with **{tech}**. It has the best ecosystem and community support.\n\nIf performance is critical, consider **{tech3}** — but be prepared for a steeper learning curve.\n\n{tech2} is great for {scenario}, but I wouldn't pick it for greenfield projects in 2026.\n\nCheck out this deep dive: {youtubeEmbed}\n\nDocs: {link}`,
    ];

    return pick(templates);
}

function deepContent(): string {
    const templates = [
        `# {title}\n\nThis is a comprehensive guide based on {months} months of production experience. I'll cover everything from basic setup to advanced optimization.\n\n## Table of Contents\n\n1. Introduction\n2. Architecture Overview\n3. Implementation\n4. Testing\n5. Performance Optimization\n6. Monitoring\n7. Common Pitfalls\n\n---\n\n## 1. Introduction\n\n{topic} has become increasingly critical in modern applications. Whether you're building a {project} or scaling an existing system, understanding {topic} deeply can save you weeks of debugging.\n\n## 2. Architecture Overview\n\n\`\`\`\n┌─────────────┐     ┌──────────────┐     ┌─────────────┐\n│   Client    │────▶│   API Layer  │────▶│  Database   │\n│  ({tech})   │     │  ({tech2})   │     │  ({tech3})  │\n└─────────────┘     └──────────────┘     └─────────────┘\n                           │\n                    ┌──────▼──────┐\n                    │   Cache     │\n                    │  (Redis)    │\n                    └─────────────┘\n\`\`\`\n\n## 3. Implementation\n\nLet's start with the core module:\n\n\`\`\`{lang}\n{codeBlock}\n\`\`\`\n\nKey things to note:\n- We use {pattern} to handle {scenario}\n- The {component} is responsible for {responsibility}\n- Error boundaries are set up at every layer\n\n## 4. Testing\n\n\`\`\`{lang}\n{testCode}\n\`\`\`\n\nI recommend testing at three levels:\n1. **Unit tests** for pure business logic\n2. **Integration tests** for API endpoints\n3. **E2E tests** for critical user journeys\n\n## 5. Performance Optimization\n\nAfter profiling, we found that {metric}% of latency came from {bottleneck}. Here's how we fixed it:\n\n\`\`\`{lang}\n{optimizedCode}\n\`\`\`\n\nResults:\n- P50 latency: {p50}ms → {p50New}ms\n- P99 latency: {p99}ms → {p99New}ms\n- Memory usage: {mem}MB → {memNew}MB\n\n## 6. Monitoring\n\nWe use {monitorTool} for observability. Here's our dashboard setup:\n- Request rate by endpoint\n- Error rate with alerting threshold at {errorThreshold}%\n- Latency percentiles (P50, P90, P99)\n\n## 7. Common Pitfalls\n\n⚠️ **Don't** skip connection pooling — it will bite you in production.\n⚠️ **Don't** ignore memory leaks in {scenario}.\n⚠️ **Do** implement circuit breakers for external service calls.\n⚠️ **Do** use structured logging from day one.\n\n---\n\n## Resources\n\n- Official docs: {link}\n- Great conference talk: {youtubeEmbed}\n- Related thread: check the {topic} category for more discussions\n\nHope this helps! Drop a comment if you have questions. I'll try to respond within 24 hours. 🚀`,

        `# Advanced {topic} Patterns\n\n> "The best code is no code at all. Every line you write is a liability." — Jeff Atwood\n\nAfter working on {scenario} at scale for the past year, I want to share some advanced patterns that our team developed. These aren't in any documentation — they're battle-tested approaches from real production systems.\n\n## Prerequisites\n\n- Solid understanding of {tech}\n- Basic knowledge of {tech2}\n- A running {tech3} instance\n\n## Pattern 1: {patternName}\n\nThe challenge: when you need to {scenario} without blocking the main thread.\n\n\`\`\`{lang}\n{codeBlock}\n\`\`\`\n\nWhy this works:\n1. We decouple the {component} from the {component2}\n2. Each {unit} processes independently\n3. Failures in one {unit} don't cascade\n\n## Pattern 2: Graceful Degradation\n\nWhen {tech} goes down (and it will), your system should degrade gracefully:\n\n\`\`\`{lang}\n{codeBlock2}\n\`\`\`\n\n## Pattern 3: Observability-First Design\n\nEvery function should answer three questions:\n- **What happened?** (structured logs)\n- **How long did it take?** (metrics)\n- **Where did it happen?** (traces)\n\n\`\`\`{lang}\n{codeBlock3}\n\`\`\`\n\n## Benchmarks\n\nWe ran these patterns through various load scenarios:\n\n| Scenario | Before | After | Improvement |\n|----------|--------|-------|-------------|\n| 100 RPS | {ms1}ms | {ms2}ms | {imp1}% |\n| 1K RPS | {ms3}ms | {ms4}ms | {imp2}% |\n| 10K RPS | {ms5}ms | {ms6}ms | {imp3}% |\n\n## Final Thoughts\n\nThese patterns aren't silver bullets. They work well for {scenario}, but you should always profile your specific workload before optimizing.\n\nRelated video: {youtubeEmbed}\n\nFeel free to fork our reference implementation: {link}\n\n---\n\n*If you found this helpful, consider sharing it with your team. And follow me for more deep dives into {topic}.*`,
    ];

    return pick(templates);
}

function dramaContent(): string {
    const templates = [
        `# Unpopular Opinion: {tech} Is Not the Answer\n\nI know I'm going to get flamed for this, but hear me out.\n\nEvery other day there's a post here recommending {tech} for {scenario}. And honestly? I think it's doing more harm than good.\n\n## The Hype Problem\n\n{tech} blew up because of:\n1. Great marketing\n2. A few viral Twitter threads\n3. YouTubers who never deployed it to production\n\nBut when you actually use it for {scenario}, you quickly discover:\n- {problem1}\n- {problem2}\n- The ecosystem is still immature\n\n## What I Use Instead\n\n{tech2}. Yeah, it's not sexy. It doesn't have a cool website. But it **works**.\n\n\`\`\`{lang}\n{codeBlock}\n\`\`\`\n\nSimple. Boring. Reliable. Everything {tech} promises but doesn't deliver.\n\n## Before You Comment\n\nYes, I've used {tech} in production. For {months} months. At {scale} scale. I'm not talking out of thin air.\n\nChange my mind. 👇`,

        `# We Need to Talk About the {topic} Toxicity\n\nI've been on this forum for a while, and I love the community. But there's a growing trend that concerns me.\n\nEvery time someone mentions {tech}, the comments section turns into a warzone. Can we not?\n\n## The Problem\n\n- New developers ask genuine questions → get mocked for not using {tech2}\n- People share projects → get criticized for tech stack choices\n- Any criticism of {tech} → instant downvotes\n\n## A Better Approach\n\nInstead of "lol why aren't you using {tech}", try:\n- "Here's how {tech2} could help with that specific problem"\n- "Interesting approach! Have you considered {alternative}?"\n- Or just... don't comment if you don't have anything constructive\n\n## My Experience\n\nI've shipped production apps with {tech}, {tech2}, and {tech3}. They all have trade-offs. None of them are universally "best."\n\nThe best tool is the one that:\n1. Your team knows\n2. Fits your constraints\n3. Gets the job done\n\nLet's be better. 🙏`,

        `# Hot Take: {tech} Just Released v{version} and It's a Mess\n\nSo {tech} v{version} just dropped and... where do I even start?\n\n## Breaking Changes Nobody Asked For\n\n1. **{change1}** — Why? Who wanted this?\n2. **{change2}** — This breaks literally every project that uses {feature}\n3. **{change3}** — The migration guide is 47 pages long. FORTY SEVEN.\n\n## The Migration Hell\n\n\`\`\`{lang}\n// Before (worked perfectly fine)\n{codeBlock}\n\n// After (why?)\n{codeBlock2}\n\`\`\`\n\nI get that software evolves. But this level of churn is unsustainable.\n\n## What the Maintainers Say\n\n"It's for the better long-term architecture."\n\nSure. That's what they said about the v{prevVersion} migration too. And v{prevPrevVersion} before that.\n\n## My Plan\n\nI'm pinning to v{stableVersion} and waiting {months} months before even considering upgrading. Life's too short for migration weekends.\n\nAnyone else feeling this? Or am I just getting old? 😅`,
    ];

    return pick(templates);
}

// --- Code snippet generators ---
const CODE_SNIPPETS: Record<string, string[]> = {
    javascript: [
        `const fetchWithRetry = async (url, retries = 3) => {\n  for (let i = 0; i < retries; i++) {\n    try {\n      const res = await fetch(url);\n      if (!res.ok) throw new Error(\`HTTP \${res.status}\`);\n      return await res.json();\n    } catch (err) {\n      if (i === retries - 1) throw err;\n      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));\n    }\n  }\n};`,
        `const debounce = (fn, ms) => {\n  let timer;\n  return (...args) => {\n    clearTimeout(timer);\n    timer = setTimeout(() => fn(...args), ms);\n  };\n};`,
        `const groupBy = (arr, key) =>\n  arr.reduce((acc, item) => {\n    (acc[item[key]] ??= []).push(item);\n    return acc;\n  }, {});`,
        `const pipe = (...fns) => (x) =>\n  fns.reduce((acc, fn) => fn(acc), x);`,
        `class EventEmitter {\n  #listeners = new Map();\n  on(event, fn) {\n    if (!this.#listeners.has(event)) this.#listeners.set(event, new Set());\n    this.#listeners.get(event).add(fn);\n    return () => this.#listeners.get(event).delete(fn);\n  }\n  emit(event, ...args) {\n    this.#listeners.get(event)?.forEach(fn => fn(...args));\n  }\n}`,
    ],
    typescript: [
        `type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };\n\nconst tryCatch = async <T>(fn: () => Promise<T>): Promise<Result<T>> => {\n  try {\n    return { ok: true, value: await fn() };\n  } catch (error) {\n    return { ok: false, error: error as Error };\n  }\n};`,
        `const createRateLimiter = (maxRequests: number, windowMs: number) => {\n  const requests = new Map<string, number[]>();\n  return (key: string): boolean => {\n    const now = Date.now();\n    const timestamps = requests.get(key)?.filter(t => now - t < windowMs) ?? [];\n    if (timestamps.length >= maxRequests) return false;\n    timestamps.push(now);\n    requests.set(key, timestamps);\n    return true;\n  };\n};`,
        `interface CacheOptions {\n  ttl: number;\n  maxSize: number;\n}\n\nclass LRUCache<K, V> {\n  private cache = new Map<K, { value: V; expiry: number }>();\n  constructor(private opts: CacheOptions) {}\n  get(key: K): V | undefined {\n    const entry = this.cache.get(key);\n    if (!entry || Date.now() > entry.expiry) {\n      this.cache.delete(key);\n      return undefined;\n    }\n    this.cache.delete(key);\n    this.cache.set(key, entry);\n    return entry.value;\n  }\n  set(key: K, value: V): void {\n    if (this.cache.size >= this.opts.maxSize) {\n      const oldest = this.cache.keys().next().value!;\n      this.cache.delete(oldest);\n    }\n    this.cache.set(key, { value, expiry: Date.now() + this.opts.ttl });\n  }\n}`,
    ],
    python: [
        `from functools import wraps\nimport time\n\ndef retry(max_retries=3, backoff=2):\n    def decorator(func):\n        @wraps(func)\n        def wrapper(*args, **kwargs):\n            for attempt in range(max_retries):\n                try:\n                    return func(*args, **kwargs)\n                except Exception as e:\n                    if attempt == max_retries - 1:\n                        raise\n                    time.sleep(backoff ** attempt)\n        return wrapper\n    return decorator`,
        `from dataclasses import dataclass\nfrom typing import TypeVar, Generic\n\nT = TypeVar("T")\n\n@dataclass\nclass Result(Generic[T]):\n    value: T | None = None\n    error: str | None = None\n    \n    @property\n    def ok(self) -> bool:\n        return self.error is None\n    \n    @classmethod\n    def success(cls, value: T) -> "Result[T]":\n        return cls(value=value)\n    \n    @classmethod \n    def failure(cls, error: str) -> "Result[T]":\n        return cls(error=error)`,
    ],
    go: [
        `func retryWithBackoff(fn func() error, maxRetries int) error {\n\tfor i := 0; i < maxRetries; i++ {\n\t\tif err := fn(); err == nil {\n\t\t\treturn nil\n\t\t} else if i == maxRetries-1 {\n\t\t\treturn err\n\t\t}\n\t\ttime.Sleep(time.Duration(math.Pow(2, float64(i))) * time.Second)\n\t}\n\treturn nil\n}`,
        `type Pool[T any] struct {\n\tch   chan T\n\tnewF func() T\n}\n\nfunc NewPool[T any](size int, factory func() T) *Pool[T] {\n\tp := &Pool[T]{ch: make(chan T, size), newF: factory}\n\tfor i := 0; i < size; i++ {\n\t\tp.ch <- factory()\n\t}\n\treturn p\n}\n\nfunc (p *Pool[T]) Get() T {\n\tselect {\n\tcase item := <-p.ch:\n\t\treturn item\n\tdefault:\n\t\treturn p.newF()\n\t}\n}\n\nfunc (p *Pool[T]) Put(item T) {\n\tselect {\n\tcase p.ch <- item:\n\tdefault:\n\t}\n}`,
    ],
    rust: [
        `use std::collections::HashMap;\nuse std::time::{Duration, Instant};\n\nstruct RateLimiter {\n    limits: HashMap<String, Vec<Instant>>,\n    max_requests: usize,\n    window: Duration,\n}\n\nimpl RateLimiter {\n    fn new(max_requests: usize, window_secs: u64) -> Self {\n        Self {\n            limits: HashMap::new(),\n            max_requests,\n            window: Duration::from_secs(window_secs),\n        }\n    }\n\n    fn allow(&mut self, key: &str) -> bool {\n        let now = Instant::now();\n        let timestamps = self.limits.entry(key.to_string()).or_default();\n        timestamps.retain(|t| now.duration_since(*t) < self.window);\n        if timestamps.len() < self.max_requests {\n            timestamps.push(now);\n            true\n        } else {\n            false\n        }\n    }\n}`,
    ],
    sql: [
        `-- Find top contributors by reputation gain in last 30 days\nWITH recent_activity AS (\n  SELECT \n    u.id,\n    u.username,\n    COUNT(DISTINCT t.id) AS threads_created,\n    COUNT(DISTINCT p.id) AS replies_made,\n    COUNT(DISTINCT r.id) AS reactions_received\n  FROM users u\n  LEFT JOIN threads t ON t.user_id = u.id AND t.created_at > NOW() - INTERVAL 30 DAY\n  LEFT JOIN posts p ON p.user_id = u.id AND p.created_at > NOW() - INTERVAL 30 DAY\n  LEFT JOIN reactions r ON r.target_id = t.id AND r.target_type = 'thread'\n  GROUP BY u.id, u.username\n)\nSELECT *,\n  (threads_created * 10 + replies_made * 3 + reactions_received * 1) AS score\nFROM recent_activity\nORDER BY score DESC\nLIMIT 50;`,
    ],
};

const ERROR_SNIPPETS = [
    'TypeError: Cannot read properties of undefined (reading \'map\')',
    'Error: ECONNREFUSED 127.0.0.1:5432',
    'ReferenceError: process is not defined',
    'SyntaxError: Unexpected token \'<\', "<!DOCTYPE "... is not valid JSON',
    'Error: CORS policy blocked request from localhost:3000',
    'MongoServerError: E11000 duplicate key error collection',
    'Error: listen EADDRINUSE: address already in use :::3000',
    'TypeError: fetch failed (cause: ConnectTimeoutError)',
    'Error: JWT malformed',
    'Error [ERR_HTTP_HEADERS_SENT]: Cannot set headers after they are sent',
];

const TIP_CONTENTS = [
    'Use `console.table()` instead of `console.log()` for arrays/objects. Way more readable.',
    'Add `"noUncheckedIndexedAccess": true` to your tsconfig. Catches SO many bugs.',
    'Use `npx tsc --noEmit` in your pre-commit hook. Catches type errors before they hit CI.',
    'Set `"strict": true` in tsconfig from day one. Retrofitting strict mode is painful.',
    'Use `Promise.allSettled()` instead of `Promise.all()` when some promises can fail.',
    'The `structuredClone()` API is faster than `JSON.parse(JSON.stringify())` for deep cloning.',
    'Use `AbortController` to cancel fetch requests. No more memory leaks from unmounted components.',
    'Run `npm audit --omit=dev` to skip dev dependency false positives.',
    'Use `crypto.randomUUID()` instead of uuid library. It\'s built into Node.js 19+.',
    'Set `connection_limit` in your ORM config. Default unlimited connections will crash your DB.',
];

// --- Replacer function ---
function fillTemplate(
    template: string,
    _threadType: string
): string {
    const tech = pick(SKILLS);
    const tech2 = pick(SKILLS.filter(s => s !== tech));
    const tech3 = pick(SKILLS.filter(s => s !== tech && s !== tech2));
    const topic = pick(TOPICS);
    const project = pick(PROJECTS);
    const scenario = pick(SCENARIOS);
    const lang = pick(['javascript', 'typescript', 'python', 'go', 'rust']);
    const lang2 = pick(['javascript', 'typescript', 'python', 'go']);
    const codeSnippets = CODE_SNIPPETS[lang] || CODE_SNIPPETS.javascript;
    const codeSnippets2 = CODE_SNIPPETS[lang2] || CODE_SNIPPETS.typescript;

    return template
        .replace(/\{tech\}/g, tech)
        .replace(/\{tech2\}/g, tech2)
        .replace(/\{tech3\}/g, tech3)
        .replace(/\{topic\}/g, topic)
        .replace(/\{project\}/g, project)
        .replace(/\{scenario\}/g, scenario)
        .replace(/\{lang\}/g, lang)
        .replace(/\{lang2\}/g, lang2)
        .replace(/\{codeBlock\}/g, pick(codeSnippets))
        .replace(/\{codeBlock2\}/g, pick(codeSnippets2))
        .replace(/\{codeBlock3\}/g, pick(CODE_SNIPPETS.typescript))
        .replace(/\{testCode\}/g, pick(CODE_SNIPPETS.javascript))
        .replace(/\{optimizedCode\}/g, pick(codeSnippets))
        .replace(/\{errorSnippet\}/g, pick(ERROR_SNIPPETS))
        .replace(/\{tipContent\}/g, pick(TIP_CONTENTS))
        .replace(/\{link\}/g, pick(REAL_LINKS))
        .replace(/\{youtubeEmbed\}/g, `\nhttps://www.youtube.com/watch?v=${pick(YOUTUBE_IDS)}\n`)
        .replace(/\{question\}/g, `how do you properly handle ${topic} with ${tech}?`)
        .replace(/\{os\}/g, pick(['Ubuntu 22.04', 'macOS Sonoma', 'Windows 11', 'Debian 12']))
        .replace(/\{number\}/g, randInt(50, 5000).toString())
        .replace(/\{months\}/g, randInt(3, 24).toString())
        .replace(/\{weeks\}/g, randInt(2, 8).toString())
        .replace(/\{rating\}/g, randInt(6, 9).toString())
        .replace(/\{version\}/g, `${randInt(2, 5)}.0`)
        .replace(/\{prevVersion\}/g, `${randInt(1, 3)}.0`)
        .replace(/\{prevPrevVersion\}/g, '1.0')
        .replace(/\{stableVersion\}/g, `${randInt(2, 4)}.${randInt(1, 9)}.${randInt(0, 15)}`)
        .replace(/\{year\}/g, '2026')
        .replace(/\{scale\}/g, pick(['startup', 'mid-size', 'enterprise', 'hypergrowth']))
        .replace(/\{metric1\}/g, randInt(20, 60).toString())
        .replace(/\{metric2\}/g, randInt(15, 45).toString())
        .replace(/\{metric\}/g, randInt(40, 80).toString())
        .replace(/\{bottleneck\}/g, pick(['N+1 queries', 'unindexed lookups', 'synchronous I/O', 'memory allocation', 'serialization overhead']))
        .replace(/\{p50\}/g, randInt(80, 300).toString())
        .replace(/\{p50New\}/g, randInt(10, 50).toString())
        .replace(/\{p99\}/g, randInt(500, 2000).toString())
        .replace(/\{p99New\}/g, randInt(50, 200).toString())
        .replace(/\{mem\}/g, randInt(200, 800).toString())
        .replace(/\{memNew\}/g, randInt(50, 150).toString())
        .replace(/\{monitorTool\}/g, pick(['Datadog', 'Grafana', 'New Relic', 'Prometheus']))
        .replace(/\{errorThreshold\}/g, randInt(1, 5).toString())
        .replace(/\{title\}/g, `${topic} — A Production Guide`)
        .replace(/\{patternName\}/g, pick(['Worker Pool', 'Circuit Breaker', 'Saga', 'Outbox', 'CQRS']))
        .replace(/\{component\}/g, pick(['handler', 'middleware', 'service', 'repository', 'controller']))
        .replace(/\{component2\}/g, pick(['event bus', 'message queue', 'cache layer', 'database', 'API gateway']))
        .replace(/\{unit\}/g, pick(['worker', 'consumer', 'processor', 'handler']))
        .replace(/\{responsibility\}/g, pick(['data validation', 'state management', 'error recovery', 'auth checks']))
        .replace(/\{pattern\}/g, pick(['Repository', 'Strategy', 'Observer', 'Factory', 'Singleton']))
        .replace(/\{ms1\}/g, randInt(50, 150).toString())
        .replace(/\{ms2\}/g, randInt(10, 40).toString())
        .replace(/\{ms3\}/g, randInt(150, 400).toString())
        .replace(/\{ms4\}/g, randInt(30, 80).toString())
        .replace(/\{ms5\}/g, randInt(400, 2000).toString())
        .replace(/\{ms6\}/g, randInt(60, 200).toString())
        .replace(/\{imp1\}/g, randInt(30, 70).toString())
        .replace(/\{imp2\}/g, randInt(40, 80).toString())
        .replace(/\{imp3\}/g, randInt(50, 90).toString())
        .replace(/\{problem1\}/g, `The ${topic} abstraction leaks at scale`)
        .replace(/\{problem2\}/g, `Error messages are cryptic and hard to debug`)
        .replace(/\{change1\}/g, `Completely rewrote the ${pick(['router', 'state manager', 'build system', 'plugin API'])}`)
        .replace(/\{change2\}/g, `Dropped support for ${pick(['CommonJS', 'Node 18', 'legacy browsers', 'the old config format'])}`)
        .replace(/\{change3\}/g, `New ${pick(['file-based conventions', 'decorator syntax', 'configuration API', 'module system'])}`)
        .replace(/\{feature\}/g, pick(['custom plugins', 'middleware chains', 'event hooks', 'dynamic imports']))
        .replace(/\{alternative\}/g, `${tech2} or even plain ${pick(['Node.js', 'vanilla JS', 'shell scripts'])}`)
        ;
}

// --- Generate title ---
function generateTitle(threadType: string, categoryId: number): string {
    let templates: string[];

    if (categoryId === 10) {
        // Showcase category
        templates = SHOWCASE_TITLES;
    } else if (threadType === 'drama') {
        templates = DISCUSSION_TITLES;
    } else if (threadType === 'deep') {
        templates = [...TUTORIAL_TITLES, ...DISCUSSION_TITLES.slice(0, 5)];
    } else if (threadType === 'short') {
        templates = [...QUESTION_TITLES, ...DISCUSSION_TITLES.slice(10)];
    } else {
        templates = [...QUESTION_TITLES, ...TUTORIAL_TITLES, ...DISCUSSION_TITLES];
    }

    const template = pick(templates);
    return fillTemplate(template, threadType);
}

// --- MAIN EXPORT ---
export async function generateThreads(users: GeneratedUser[]): Promise<GeneratedThread[]> {
    console.log('\n📝 Generating threads...');
    const threads: GeneratedThread[] = [];
    const usedSlugs = new Set<string>();

    const phaseACount = Math.floor(TOTAL_THREADS * PHASE_A.ratio);
    const phaseBCount = TOTAL_THREADS - phaseACount;

    const writerA = new SqlFileWriter(
        `${OUTPUT_DIRS.phaseA.threads}/threads_phase_a.sql`,
        'threads',
        ['category_id', 'user_id', 'title', 'slug', 'content', 'is_sticky', 'is_locked', 'view_count', 'created_at', 'updated_at']
    );
    const writerB = new SqlFileWriter(
        `${OUTPUT_DIRS.phaseB.threads}/threads_phase_b.sql`,
        'threads',
        ['category_id', 'user_id', 'title', 'slug', 'content', 'is_sticky', 'is_locked', 'view_count', 'created_at', 'updated_at']
    );

    // Active users (higher reputation more likely to create threads)
    const activeUserPool = users
        .filter(u => u.reputation > 10)
        .sort(() => Math.random() - 0.5);

    for (let i = 0; i < TOTAL_THREADS; i++) {
        const phase: 'A' | 'B' = i < phaseACount ? 'A' : 'B';
        const createdAt = phaseTimestamp(phase);

        // Pick user (weighted: higher rep → more threads)
        const user = pick(activeUserPool.length > 0 ? activeUserPool : users);

        const categoryId = pick(CATEGORIES).id;
        const threadType = weightedPick(THREAD_TYPE_WEIGHTS);

        const title = generateTitle(threadType, categoryId);

        // Generate unique slug
        let slug = uniqueSlug(title);
        while (usedSlugs.has(slug)) {
            slug = uniqueSlug(title);
        }
        usedSlugs.add(slug);

        // Generate content based on type
        let contentTemplate: string;
        switch (threadType) {
            case 'short': contentTemplate = shortContent(); break;
            case 'medium': contentTemplate = mediumContent(); break;
            case 'deep': contentTemplate = deepContent(); break;
            case 'drama': contentTemplate = dramaContent(); break;
            default: contentTemplate = mediumContent();
        }
        const content = fillTemplate(contentTemplate, threadType);

        const isSticky = Math.random() < 0.005; // 0.5% sticky
        const isLocked = Math.random() < 0.02;  // 2% locked
        const viewCount = threadType === 'deep'
            ? randInt(500, 50000)
            : threadType === 'drama'
                ? randInt(1000, 100000)
                : randInt(10, 5000);

        const dateStr = formatMySQL(createdAt);

        const writer = phase === 'A' ? writerA : writerB;
        writer.addRow([
            categoryId.toString(),
            user.id.toString(),
            sqlStr(title),
            sqlStr(slug),
            sqlStr(content),
            sqlBool(isSticky),
            sqlBool(isLocked),
            viewCount.toString(),
            sqlStr(dateStr),
            sqlStr(dateStr),
        ]);

        threads.push({
            id: i + 1,
            categoryId,
            userId: user.id,
            title,
            slug,
            createdAt,
            phase,
            threadType,
        });

        logProgress('Threads', i + 1, TOTAL_THREADS);
    }

    await writerA.close();
    await writerB.close();
    console.log(`  ✅ Phase A: ${phaseACount.toLocaleString()} | Phase B: ${phaseBCount.toLocaleString()} threads`);
    return threads;
}
