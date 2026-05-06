import { TOTAL_RECODE_SCRIPTS, PHASE_A, OUTPUT_DIRS } from './config';
import {
    SqlFileWriter, randInt, pick, pickN,
    phaseTimestamp, formatMySQL, sqlStr, logProgress
} from './helpers';
import { SCRIPT_TAGS } from './data-pools';
import { GeneratedUser } from './gen-users';

// ═══════════════════════════════════════════════════════════
// RECODE SCRIPTS GENERATOR — 6,000 quality code scripts
// Real, diverse, creative, working code snippets
// ═══════════════════════════════════════════════════════════

interface ScriptTemplate {
    title: string;
    description: string;
    code: string;
    tags: string[];
}

const SCRIPT_TEMPLATES: ScriptTemplate[] = [
    // --- Security ---
    {
        title: 'XSS Input Sanitizer',
        description: 'Strips dangerous HTML/JS from user input while preserving safe formatting. Production-ready with configurable allowlists.',
        code: `const ALLOWED_TAGS = new Set(['b', 'i', 'em', 'strong', 'code', 'pre', 'a', 'p', 'br', 'ul', 'ol', 'li']);\n\nfunction sanitize(html: string): string {\n  return html\n    .replace(/<script[\\s\\S]*?<\\/script>/gi, '')\n    .replace(/on\\w+="[^"]*"/gi, '')\n    .replace(/on\\w+='[^']*'/gi, '')\n    .replace(/javascript:/gi, '')\n    .replace(/<\\/?([a-z][a-z0-9]*)\\b[^>]*>/gi, (match, tag) => {\n      return ALLOWED_TAGS.has(tag.toLowerCase()) ? match : '';\n    });\n}`,
        tags: ['Security', 'Filtering', 'Validation'],
    },
    {
        title: 'CSRF Token Generator',
        description: 'Cryptographically secure CSRF token generation and validation using Web Crypto API.',
        code: `import crypto from 'crypto';\n\nconst TOKEN_LENGTH = 32;\nconst TOKEN_EXPIRY_MS = 3600_000; // 1 hour\n\ninterface CSRFToken {\n  token: string;\n  expiresAt: number;\n}\n\nconst tokenStore = new Map<string, CSRFToken>();\n\nfunction generateToken(sessionId: string): string {\n  const token = crypto.randomBytes(TOKEN_LENGTH).toString('hex');\n  tokenStore.set(sessionId, {\n    token,\n    expiresAt: Date.now() + TOKEN_EXPIRY_MS,\n  });\n  return token;\n}\n\nfunction validateToken(sessionId: string, token: string): boolean {\n  const stored = tokenStore.get(sessionId);\n  if (!stored) return false;\n  if (Date.now() > stored.expiresAt) {\n    tokenStore.delete(sessionId);\n    return false;\n  }\n  return crypto.timingSafeEqual(\n    Buffer.from(stored.token),\n    Buffer.from(token)\n  );\n}`,
        tags: ['Security', 'Auth', 'Middleware'],
    },
    {
        title: 'JWT Middleware with Refresh Token Rotation',
        description: 'Express middleware for JWT auth with automatic refresh token rotation and family tracking.',
        code: `import jwt from 'jsonwebtoken';\nimport crypto from 'crypto';\n\nconst ACCESS_TTL = '15m';\nconst REFRESH_TTL = '7d';\n\ninterface TokenPayload {\n  userId: number;\n  role: string;\n  family: string;\n}\n\nfunction generateTokenPair(userId: number, role: string) {\n  const family = crypto.randomUUID();\n  const accessToken = jwt.sign(\n    { userId, role, family },\n    process.env.JWT_SECRET!,\n    { expiresIn: ACCESS_TTL }\n  );\n  const refreshToken = jwt.sign(\n    { userId, role, family, type: 'refresh' },\n    process.env.JWT_REFRESH_SECRET!,\n    { expiresIn: REFRESH_TTL }\n  );\n  return { accessToken, refreshToken, family };\n}\n\nconst authMiddleware = async (req, res, next) => {\n  const token = req.headers.authorization?.split(' ')[1];\n  if (!token) return res.status(401).json({ message: 'No token provided' });\n  try {\n    req.user = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;\n    next();\n  } catch {\n    return res.status(401).json({ message: 'Invalid or expired token' });\n  }\n};`,
        tags: ['Auth', 'JWT', 'Middleware', 'Security'],
    },
    // --- Rate Limiting ---
    {
        title: 'Sliding Window Rate Limiter',
        description: 'Redis-based sliding window rate limiter with per-key configuration. Handles burst traffic gracefully.',
        code: `class SlidingWindowLimiter {\n  constructor(\n    private redis: Redis,\n    private windowMs: number = 60_000,\n    private maxRequests: number = 100\n  ) {}\n\n  async isAllowed(key: string): Promise<{ allowed: boolean; remaining: number; resetMs: number }> {\n    const now = Date.now();\n    const windowStart = now - this.windowMs;\n    const redisKey = \`ratelimit:\${key}\`;\n\n    const pipeline = this.redis.pipeline();\n    pipeline.zremrangebyscore(redisKey, 0, windowStart);\n    pipeline.zadd(redisKey, now, \`\${now}-\${Math.random()}\`);\n    pipeline.zcard(redisKey);\n    pipeline.pexpire(redisKey, this.windowMs);\n\n    const results = await pipeline.exec();\n    const count = results?.[2]?.[1] as number ?? 0;\n\n    return {\n      allowed: count <= this.maxRequests,\n      remaining: Math.max(0, this.maxRequests - count),\n      resetMs: this.windowMs,\n    };\n  }\n}`,
        tags: ['Rate Limiting', 'Security', 'Middleware', 'Cache'],
    },
    // --- Utility ---
    {
        title: 'Deep Object Diff',
        description: 'Computes a detailed diff between two objects, showing added, removed, and changed paths.',
        code: `type DiffEntry = {\n  path: string;\n  type: 'added' | 'removed' | 'changed';\n  oldValue?: unknown;\n  newValue?: unknown;\n};\n\nfunction deepDiff(objA: Record<string, any>, objB: Record<string, any>, prefix = ''): DiffEntry[] {\n  const diffs: DiffEntry[] = [];\n  const allKeys = new Set([...Object.keys(objA), ...Object.keys(objB)]);\n\n  for (const key of allKeys) {\n    const path = prefix ? \`\${prefix}.\${key}\` : key;\n    const valA = objA[key];\n    const valB = objB[key];\n\n    if (!(key in objA)) {\n      diffs.push({ path, type: 'added', newValue: valB });\n    } else if (!(key in objB)) {\n      diffs.push({ path, type: 'removed', oldValue: valA });\n    } else if (typeof valA === 'object' && typeof valB === 'object' && valA !== null && valB !== null) {\n      diffs.push(...deepDiff(valA, valB, path));\n    } else if (valA !== valB) {\n      diffs.push({ path, type: 'changed', oldValue: valA, newValue: valB });\n    }\n  }\n  return diffs;\n}`,
        tags: ['Utility', 'Data Transform'],
    },
    {
        title: 'Retry with Exponential Backoff',
        description: 'Generic async retry function with exponential backoff, jitter, and configurable error filtering.',
        code: `interface RetryOptions {\n  maxRetries: number;\n  baseDelayMs: number;\n  maxDelayMs: number;\n  jitter: boolean;\n  retryOn?: (error: Error) => boolean;\n}\n\nasync function retryAsync<T>(\n  fn: () => Promise<T>,\n  opts: Partial<RetryOptions> = {}\n): Promise<T> {\n  const config: RetryOptions = {\n    maxRetries: 3,\n    baseDelayMs: 1000,\n    maxDelayMs: 30_000,\n    jitter: true,\n    ...opts,\n  };\n\n  let lastError: Error;\n  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {\n    try {\n      return await fn();\n    } catch (err) {\n      lastError = err as Error;\n      if (attempt === config.maxRetries) break;\n      if (config.retryOn && !config.retryOn(lastError)) break;\n\n      let delay = Math.min(\n        config.baseDelayMs * Math.pow(2, attempt),\n        config.maxDelayMs\n      );\n      if (config.jitter) delay *= 0.5 + Math.random();\n\n      await new Promise(r => setTimeout(r, delay));\n    }\n  }\n  throw lastError!;\n}`,
        tags: ['Retry Logic', 'Error Handling', 'Utility'],
    },
    // --- Data Transform ---
    {
        title: 'CSV to JSON Stream Parser',
        description: 'Memory-efficient streaming CSV parser that handles quoted fields, newlines in values, and custom delimiters.',
        code: `function* parseCSV(input: string, delimiter = ','): Generator<Record<string, string>> {\n  const lines = input.split('\\n');\n  if (lines.length === 0) return;\n\n  const headers = parseLine(lines[0], delimiter);\n\n  for (let i = 1; i < lines.length; i++) {\n    const line = lines[i].trim();\n    if (!line) continue;\n    const values = parseLine(line, delimiter);\n    const record: Record<string, string> = {};\n    headers.forEach((h, idx) => { record[h] = values[idx] ?? ''; });\n    yield record;\n  }\n}\n\nfunction parseLine(line: string, delimiter: string): string[] {\n  const fields: string[] = [];\n  let current = '';\n  let inQuotes = false;\n\n  for (let i = 0; i < line.length; i++) {\n    const char = line[i];\n    if (char === '\"') {\n      if (inQuotes && line[i + 1] === '\"') {\n        current += '\"';\n        i++;\n      } else {\n        inQuotes = !inQuotes;\n      }\n    } else if (char === delimiter && !inQuotes) {\n      fields.push(current.trim());\n      current = '';\n    } else {\n      current += char;\n    }\n  }\n  fields.push(current.trim());\n  return fields;\n}`,
        tags: ['Data Transform', 'Parsing', 'Utility'],
    },
    {
        title: 'Event Bus with Typed Events',
        description: 'Type-safe event bus with wildcard support, once listeners, and automatic cleanup.',
        code: `type EventMap = Record<string, unknown[]>;\n\nclass TypedEventBus<T extends EventMap> {\n  private listeners = new Map<keyof T, Set<Function>>();\n\n  on<K extends keyof T>(event: K, handler: (...args: T[K]) => void): () => void {\n    if (!this.listeners.has(event)) this.listeners.set(event, new Set());\n    this.listeners.get(event)!.add(handler);\n    return () => this.listeners.get(event)?.delete(handler);\n  }\n\n  once<K extends keyof T>(event: K, handler: (...args: T[K]) => void): void {\n    const off = this.on(event, ((...args: T[K]) => {\n      off();\n      handler(...args);\n    }) as any);\n  }\n\n  emit<K extends keyof T>(event: K, ...args: T[K]): void {\n    this.listeners.get(event)?.forEach(fn => fn(...args));\n  }\n\n  clear(): void {\n    this.listeners.clear();\n  }\n}\n\n// Usage:\ntype AppEvents = {\n  'user:login': [userId: number, timestamp: Date];\n  'post:created': [postId: number, authorId: number];\n  'error': [error: Error, context: string];\n};\n\nconst bus = new TypedEventBus<AppEvents>();\nbus.on('user:login', (userId, ts) => console.log(userId, ts));`,
        tags: ['Event Emitter', 'Utility', 'Pub/Sub'],
    },
    // --- API Helpers ---
    {
        title: 'API Response Builder',
        description: 'Standardized API response format with pagination, error handling, and metadata support.',
        code: `interface ApiResponse<T> {\n  success: boolean;\n  data?: T;\n  message?: string;\n  errors?: Record<string, string[]>;\n  meta?: {\n    page?: number;\n    perPage?: number;\n    total?: number;\n    totalPages?: number;\n  };\n}\n\nclass ResponseBuilder {\n  static success<T>(data: T, message?: string): ApiResponse<T> {\n    return { success: true, data, message };\n  }\n\n  static paginated<T>(data: T[], page: number, perPage: number, total: number): ApiResponse<T[]> {\n    return {\n      success: true,\n      data,\n      meta: { page, perPage, total, totalPages: Math.ceil(total / perPage) },\n    };\n  }\n\n  static error(message: string, errors?: Record<string, string[]>): ApiResponse<never> {\n    return { success: false, message, errors };\n  }\n\n  static notFound(resource: string): ApiResponse<never> {\n    return { success: false, message: \`\${resource} not found\` };\n  }\n}\n\nexport default ResponseBuilder;`,
        tags: ['API Helper', 'Utility'],
    },
    {
        title: 'Zod Schema Validator Middleware',
        description: 'Express middleware that validates request body, params, and query using Zod schemas.',
        code: `import { z, ZodSchema } from 'zod';\nimport { Request, Response, NextFunction } from 'express';\n\ninterface ValidationSchemas {\n  body?: ZodSchema;\n  params?: ZodSchema;\n  query?: ZodSchema;\n}\n\nfunction validate(schemas: ValidationSchemas) {\n  return (req: Request, res: Response, next: NextFunction) => {\n    const errors: Record<string, string[]> = {};\n\n    if (schemas.body) {\n      const result = schemas.body.safeParse(req.body);\n      if (!result.success) {\n        errors.body = result.error.errors.map(e => \`\${e.path.join('.')}: \${e.message}\`);\n      }\n    }\n\n    if (schemas.params) {\n      const result = schemas.params.safeParse(req.params);\n      if (!result.success) {\n        errors.params = result.error.errors.map(e => \`\${e.path.join('.')}: \${e.message}\`);\n      }\n    }\n\n    if (schemas.query) {\n      const result = schemas.query.safeParse(req.query);\n      if (!result.success) {\n        errors.query = result.error.errors.map(e => \`\${e.path.join('.')}: \${e.message}\`);\n      }\n    }\n\n    if (Object.keys(errors).length > 0) {\n      return res.status(400).json({ success: false, message: 'Validation failed', errors });\n    }\n    next();\n  };\n}`,
        tags: ['Validation', 'Middleware', 'API Helper'],
    },
    // --- Database ---
    {
        title: 'Query Builder with CTE Support',
        description: 'Lightweight SQL query builder that supports CTEs, joins, subqueries, and parameterized queries.',
        code: `class QueryBuilder {\n  private parts = {\n    ctes: [] as string[],\n    select: '*',\n    from: '',\n    joins: [] as string[],\n    where: [] as string[],\n    orderBy: '',\n    limit: 0,\n    offset: 0,\n    params: [] as unknown[],\n  };\n\n  with(name: string, query: string): this {\n    this.parts.ctes.push(\`\${name} AS (\${query})\`);\n    return this;\n  }\n\n  select(columns: string): this { this.parts.select = columns; return this; }\n  from(table: string): this { this.parts.from = table; return this; }\n  join(clause: string): this { this.parts.joins.push(clause); return this; }\n  where(condition: string, ...params: unknown[]): this {\n    this.parts.where.push(condition);\n    this.parts.params.push(...params);\n    return this;\n  }\n  orderBy(clause: string): this { this.parts.orderBy = clause; return this; }\n  paginate(page: number, perPage: number): this {\n    this.parts.limit = perPage;\n    this.parts.offset = (page - 1) * perPage;\n    return this;\n  }\n\n  build(): { sql: string; params: unknown[] } {\n    let sql = '';\n    if (this.parts.ctes.length) sql += \`WITH \${this.parts.ctes.join(', ')} \`;\n    sql += \`SELECT \${this.parts.select} FROM \${this.parts.from}\`;\n    if (this.parts.joins.length) sql += ' ' + this.parts.joins.join(' ');\n    if (this.parts.where.length) sql += \` WHERE \${this.parts.where.join(' AND ')}\`;\n    if (this.parts.orderBy) sql += \` ORDER BY \${this.parts.orderBy}\`;\n    if (this.parts.limit) sql += \` LIMIT \${this.parts.limit} OFFSET \${this.parts.offset}\`;\n    return { sql, params: this.parts.params };\n  }\n}`,
        tags: ['Database', 'Utility', 'API Helper'],
    },
    // --- Monitoring ---
    {
        title: 'Health Check Endpoint Builder',
        description: 'Configurable health check system that monitors database, Redis, and external service dependencies.',
        code: `interface HealthCheck {\n  name: string;\n  check: () => Promise<{ healthy: boolean; latencyMs: number; details?: string }>;\n}\n\nclass HealthMonitor {\n  private checks: HealthCheck[] = [];\n\n  register(check: HealthCheck): void {\n    this.checks.push(check);\n  }\n\n  async runAll(): Promise<{\n    status: 'healthy' | 'degraded' | 'unhealthy';\n    checks: Record<string, { healthy: boolean; latencyMs: number; details?: string }>;\n    timestamp: string;\n  }> {\n    const results = await Promise.allSettled(\n      this.checks.map(async (c) => {\n        const start = performance.now();\n        try {\n          const result = await c.check();\n          return { name: c.name, ...result };\n        } catch (err) {\n          return { name: c.name, healthy: false, latencyMs: performance.now() - start, details: String(err) };\n        }\n      })\n    );\n\n    const checksMap: Record<string, any> = {};\n    let unhealthyCount = 0;\n    for (const r of results) {\n      const val = r.status === 'fulfilled' ? r.value : { name: 'unknown', healthy: false, latencyMs: 0 };\n      checksMap[val.name] = { healthy: val.healthy, latencyMs: val.latencyMs, details: val.details };\n      if (!val.healthy) unhealthyCount++;\n    }\n\n    return {\n      status: unhealthyCount === 0 ? 'healthy' : unhealthyCount < this.checks.length ? 'degraded' : 'unhealthy',\n      checks: checksMap,\n      timestamp: new Date().toISOString(),\n    };\n  }\n}`,
        tags: ['Monitoring', 'Utility', 'API Helper'],
    },
    // --- CLI ---
    {
        title: 'Interactive CLI Spinner',
        description: 'Colorful terminal spinner with status updates, success/fail states, and timer.',
        code: `const FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];\n\nclass Spinner {\n  private frameIdx = 0;\n  private interval: NodeJS.Timeout | null = null;\n  private startTime = 0;\n\n  start(message: string): void {\n    this.startTime = Date.now();\n    this.interval = setInterval(() => {\n      const frame = FRAMES[this.frameIdx % FRAMES.length];\n      const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);\n      process.stdout.write(\`\\r\\x1b[36m\${frame}\\x1b[0m \${message} \\x1b[90m(\${elapsed}s)\\x1b[0m\`);\n      this.frameIdx++;\n    }, 80);\n  }\n\n  succeed(message: string): void {\n    this.stop();\n    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);\n    console.log(\`\\r\\x1b[32m✔\\x1b[0m \${message} \\x1b[90m(\${elapsed}s)\\x1b[0m\`);\n  }\n\n  fail(message: string): void {\n    this.stop();\n    console.log(\`\\r\\x1b[31m✖\\x1b[0m \${message}\`);\n  }\n\n  private stop(): void {\n    if (this.interval) clearInterval(this.interval);\n  }\n}`,
        tags: ['CLI Tool', 'Utility'],
    },
    // --- Cache ---
    {
        title: 'Stale-While-Revalidate Cache',
        description: 'Cache pattern that serves stale data while fetching fresh data in the background. Zero-latency cache misses.',
        code: `interface CacheEntry<T> {\n  data: T;\n  fetchedAt: number;\n  staleAt: number;\n  expireAt: number;\n}\n\nclass SWRCache<T> {\n  private store = new Map<string, CacheEntry<T>>();\n  private fetching = new Set<string>();\n\n  constructor(\n    private fetcher: (key: string) => Promise<T>,\n    private staleTTL: number = 60_000,\n    private expireTTL: number = 300_000\n  ) {}\n\n  async get(key: string): Promise<T> {\n    const entry = this.store.get(key);\n    const now = Date.now();\n\n    if (entry) {\n      if (now < entry.staleAt) return entry.data; // Fresh\n      if (now < entry.expireAt) {\n        this.revalidate(key); // Background refresh\n        return entry.data; // Serve stale\n      }\n    }\n\n    // No cache or expired — blocking fetch\n    return this.fetchAndStore(key);\n  }\n\n  private async revalidate(key: string): Promise<void> {\n    if (this.fetching.has(key)) return;\n    this.fetching.add(key);\n    try {\n      await this.fetchAndStore(key);\n    } finally {\n      this.fetching.delete(key);\n    }\n  }\n\n  private async fetchAndStore(key: string): Promise<T> {\n    const data = await this.fetcher(key);\n    const now = Date.now();\n    this.store.set(key, {\n      data,\n      fetchedAt: now,\n      staleAt: now + this.staleTTL,\n      expireAt: now + this.expireTTL,\n    });\n    return data;\n  }\n}`,
        tags: ['Cache', 'Performance', 'Utility'],
    },
    // --- Testing ---
    {
        title: 'API Test Helper with Auth',
        description: 'Supertest wrapper with automatic auth token management, request logging, and assertion helpers.',
        code: `import request from 'supertest';\n\nclass ApiTestClient {\n  private token: string | null = null;\n\n  constructor(private app: Express.Application) {}\n\n  async login(email: string, password: string): Promise<void> {\n    const res = await request(this.app)\n      .post('/api/auth/login')\n      .send({ email, password });\n    this.token = res.body.data?.accessToken;\n  }\n\n  private authHeaders() {\n    return this.token ? { Authorization: \`Bearer \${this.token}\` } : {};\n  }\n\n  async get(path: string) {\n    return request(this.app).get(path).set(this.authHeaders());\n  }\n\n  async post(path: string, body: object) {\n    return request(this.app).post(path).set(this.authHeaders()).send(body);\n  }\n\n  async put(path: string, body: object) {\n    return request(this.app).put(path).set(this.authHeaders()).send(body);\n  }\n\n  async delete(path: string) {\n    return request(this.app).delete(path).set(this.authHeaders());\n  }\n\n  async expectSuccess(res: request.Response) {\n    expect(res.body.success).toBe(true);\n    return res;\n  }\n\n  async expectError(res: request.Response, status: number) {\n    expect(res.status).toBe(status);\n    expect(res.body.success).toBe(false);\n    return res;\n  }\n}`,
        tags: ['Testing', 'API Helper', 'Utility'],
    },
    // --- WebSocket ---
    {
        title: 'WebSocket Room Manager',
        description: 'Real-time room management with join/leave, broadcasting, and presence tracking.',
        code: `interface Client {\n  id: string;\n  ws: WebSocket;\n  rooms: Set<string>;\n  metadata: Record<string, unknown>;\n}\n\nclass RoomManager {\n  private rooms = new Map<string, Set<string>>();\n  private clients = new Map<string, Client>();\n\n  addClient(id: string, ws: WebSocket, meta: Record<string, unknown> = {}): void {\n    this.clients.set(id, { id, ws, rooms: new Set(), metadata: meta });\n  }\n\n  removeClient(id: string): void {\n    const client = this.clients.get(id);\n    if (!client) return;\n    for (const room of client.rooms) this.leave(id, room);\n    this.clients.delete(id);\n  }\n\n  join(clientId: string, room: string): void {\n    if (!this.rooms.has(room)) this.rooms.set(room, new Set());\n    this.rooms.get(room)!.add(clientId);\n    this.clients.get(clientId)?.rooms.add(room);\n  }\n\n  leave(clientId: string, room: string): void {\n    this.rooms.get(room)?.delete(clientId);\n    this.clients.get(clientId)?.rooms.delete(room);\n    if (this.rooms.get(room)?.size === 0) this.rooms.delete(room);\n  }\n\n  broadcast(room: string, data: unknown, excludeId?: string): void {\n    const members = this.rooms.get(room);\n    if (!members) return;\n    const payload = JSON.stringify(data);\n    for (const id of members) {\n      if (id === excludeId) continue;\n      const client = this.clients.get(id);\n      if (client?.ws.readyState === WebSocket.OPEN) {\n        client.ws.send(payload);\n      }\n    }\n  }\n\n  getPresence(room: string): Array<{ id: string; metadata: Record<string, unknown> }> {\n    const members = this.rooms.get(room);\n    if (!members) return [];\n    return [...members].map(id => {\n      const c = this.clients.get(id)!;\n      return { id: c.id, metadata: c.metadata };\n    });\n  }\n}`,
        tags: ['WebSocket', 'Utility', 'Pub/Sub'],
    },
    // --- Performance ---
    {
        title: 'Request Deduplicator',
        description: 'Prevents duplicate concurrent requests to the same resource. Perfect for avoiding thundering herd.',
        code: `class RequestDeduplicator<T> {\n  private inflight = new Map<string, Promise<T>>();\n\n  async dedupe(key: string, fn: () => Promise<T>): Promise<T> {\n    const existing = this.inflight.get(key);\n    if (existing) return existing;\n\n    const promise = fn().finally(() => this.inflight.delete(key));\n    this.inflight.set(key, promise);\n    return promise;\n  }\n}\n\n// Usage:\nconst dedup = new RequestDeduplicator<User>();\n\n// Even if called 100 times concurrently, only 1 DB query executes\nconst user = await dedup.dedupe(\n  \`user:\${userId}\`,\n  () => db.query('SELECT * FROM users WHERE id = ?', [userId])\n);`,
        tags: ['Performance', 'Cache', 'Utility'],
    },
    {
        title: 'Graceful Shutdown Handler',
        description: 'Handles SIGTERM/SIGINT gracefully — drains connections, closes DB pools, flushes logs.',
        code: `type ShutdownHandler = () => Promise<void>;\n\nclass GracefulShutdown {\n  private handlers: Array<{ name: string; handler: ShutdownHandler }> = [];\n  private shutdownTimeout: number;\n  private isShuttingDown = false;\n\n  constructor(timeoutMs = 30_000) {\n    this.shutdownTimeout = timeoutMs;\n    process.on('SIGTERM', () => this.shutdown('SIGTERM'));\n    process.on('SIGINT', () => this.shutdown('SIGINT'));\n  }\n\n  register(name: string, handler: ShutdownHandler): void {\n    this.handlers.push({ name, handler });\n  }\n\n  private async shutdown(signal: string): Promise<void> {\n    if (this.isShuttingDown) return;\n    this.isShuttingDown = true;\n    console.log(\`\\n[\${signal}] Graceful shutdown initiated...\`);\n\n    const timer = setTimeout(() => {\n      console.error('Shutdown timeout exceeded, forcing exit');\n      process.exit(1);\n    }, this.shutdownTimeout);\n\n    for (const { name, handler } of this.handlers.reverse()) {\n      try {\n        console.log(\`  Closing \${name}...\`);\n        await handler();\n        console.log(\`  ✔ \${name} closed\`);\n      } catch (err) {\n        console.error(\`  ✖ \${name} failed:\`, err);\n      }\n    }\n\n    clearTimeout(timer);\n    console.log('Shutdown complete.');\n    process.exit(0);\n  }\n}`,
        tags: ['Utility', 'Monitoring', 'Error Handling'],
    },
    {
        title: 'Environment Config Loader',
        description: 'Type-safe environment variable loader with validation, defaults, and grouped configuration.',
        code: `import { z } from 'zod';\n\nconst envSchema = z.object({\n  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),\n  PORT: z.coerce.number().default(3000),\n  DATABASE_URL: z.string().url(),\n  REDIS_URL: z.string().url().optional(),\n  JWT_SECRET: z.string().min(32),\n  CORS_ORIGIN: z.string().default('*'),\n  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),\n  RATE_LIMIT_MAX: z.coerce.number().default(100),\n  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60_000),\n});\n\ntype EnvConfig = z.infer<typeof envSchema>;\n\nfunction loadConfig(): EnvConfig {\n  const result = envSchema.safeParse(process.env);\n  if (!result.success) {\n    console.error('❌ Invalid environment variables:');\n    for (const issue of result.error.issues) {\n      console.error(\`  \${issue.path.join('.')}: \${issue.message}\`);\n    }\n    process.exit(1);\n  }\n  return result.data;\n}\n\nexport const config = loadConfig();`,
        tags: ['Config Loader', 'Env Parser', 'Validation', 'Utility'],
    },
];

// --- Title variation to avoid duplicates ---
const TITLE_PREFIXES = ['', 'Advanced ', 'Simple ', 'Minimal ', 'Production-Ready ', 'Lightweight ', 'High-Performance ', 'Zero-Dependency ', 'Modern ', 'Elegant '];
const TITLE_SUFFIXES = ['', ' v2', ' (TypeScript)', ' (ES2024)', ' — Clean Edition', ' Pro', ' Lite', ' — Refactored', ' Ultimate', ' — Battle-Tested'];

// --- MAIN EXPORT ---
export async function generateRecodeScripts(users: GeneratedUser[]): Promise<void> {
    console.log('\n💻 Generating recode scripts...');

    const phaseACount = Math.floor(TOTAL_RECODE_SCRIPTS * PHASE_A.ratio);

    const writerA = new SqlFileWriter(
        `${OUTPUT_DIRS.phaseA.recodeScripts}/recode_scripts_phase_a.sql`,
        'recode_scripts',
        ['user_id', 'title', 'description', 'code_content', 'tags', 'stars', 'download_count', 'version', 'created_at']
    );
    const writerB = new SqlFileWriter(
        `${OUTPUT_DIRS.phaseB.recodeScripts}/recode_scripts_phase_b.sql`,
        'recode_scripts',
        ['user_id', 'title', 'description', 'code_content', 'tags', 'stars', 'download_count', 'version', 'created_at']
    );

    const usedTitles = new Set<string>();

    for (let i = 0; i < TOTAL_RECODE_SCRIPTS; i++) {
        const phase: 'A' | 'B' = i < phaseACount ? 'A' : 'B';
        const createdAt = phaseTimestamp(phase);
        const user = pick(users);

        // Pick a template and create a unique variation
        const template = SCRIPT_TEMPLATES[i % SCRIPT_TEMPLATES.length];
        let title = `${pick(TITLE_PREFIXES)}${template.title}${pick(TITLE_SUFFIXES)}`.trim();

        // Ensure unique
        let attempts = 0;
        while (usedTitles.has(title)) {
            title = `${pick(TITLE_PREFIXES)}${template.title}${pick(TITLE_SUFFIXES)} #${randInt(2, 999)}`.trim();
            attempts++;
            if (attempts > 20) {
                title = `${template.title} - Variation ${i}`;
                break;
            }
        }
        usedTitles.add(title);

        const tags = pickN(template.tags.concat(pickN(SCRIPT_TAGS, 2)), randInt(2, 5)).join(',');
        const stars = randInt(0, 500);
        const downloadCount = stars * randInt(2, 10) + randInt(0, 100);
        const major = randInt(1, 3);
        const minor = randInt(0, 9);
        const patch = randInt(0, 15);
        const version = `${major}.${minor}.${patch}`;

        const writer = phase === 'A' ? writerA : writerB;
        writer.addRow([
            user.id.toString(),
            sqlStr(title),
            sqlStr(template.description),
            sqlStr(template.code),
            sqlStr(tags),
            stars.toString(),
            downloadCount.toString(),
            sqlStr(version),
            sqlStr(formatMySQL(createdAt)),
        ]);

        logProgress('Recode Scripts', i + 1, TOTAL_RECODE_SCRIPTS);
    }

    await writerA.close();
    await writerB.close();
    console.log(`  ✅ ${TOTAL_RECODE_SCRIPTS.toLocaleString()} recode scripts generated`);
}
