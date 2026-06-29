// ═══════════════════════════════════════════════════════════════
// BACKEND 09: REDIS · CACHING · PUB/SUB · RATE LIMITING · DISTRIBUTED LOCKS  (Day 44)
// Run: npx ts-node 09-redis-caching.ts
// ═══════════════════════════════════════════════════════════════
//
// Redis = Remote Dictionary Server
//
//  • In-memory data store — reads are O(1), sub-millisecond latency
//  • Key-value at its core, but supports rich data structures
//  • Optional persistence (RDB snapshots, AOF log)
//  • Single-threaded command execution → no race conditions on individual ops
//  • Commonly used as: cache, session store, pub/sub broker, rate limiter,
//    distributed lock manager, job queue
//
// Where Redis fits in a backend:
//   Client → Express → Redis (cache hit?) → DB (cache miss) → Redis (fill) → Client

// ───────────────────────────────────────────────────────────────
// 1. Redis Fundamentals & Data Structures
// ───────────────────────────────────────────────────────────────

console.log("=== 1. Redis Fundamentals & Data Structures ===");

/*
  REDIS DATA STRUCTURES
  ─────────────────────
  String   — bytes. Stores text, JSON blobs, numbers, binary.
             SET user:123:name "Sadik"
             GET user:123:name  → "Sadik"
             INCR page:views    → atomic counter

  List     — ordered, duplicates allowed. Acts as queue or stack.
             LPUSH jobs:email "send-welcome"   (push left)
             BRPOP jobs:email 0                (blocking pop right — waits)

  Hash     — map of field→value. Like a JS object in Redis.
             HSET user:123 name "Sadik" age 30
             HGET user:123 name   → "Sadik"
             HGETALL user:123     → { name: "Sadik", age: "30" }

  Set      — unordered, unique members. Fast membership test.
             SADD page:visitors "ip:1.2.3.4"
             SCARD page:visitors  → count of unique visitors
             SISMEMBER page:visitors "ip:1.2.3.4" → 1 or 0

  Sorted Set — like Set but each member has a numeric score.
             ZADD leaderboard 9850 "alice"
             ZRANGE leaderboard 0 9 REV WITHSCORES  → top 10
             ZRANK leaderboard "alice"               → rank (0-based)

  Stream   — append-only log of entries. Used for event sourcing / message bus.
             XADD events * action "login" userId "123"
             XREAD COUNT 10 STREAMS events 0

  HyperLogLog — probabilistic unique-count with ~0.8% error, capped at 12 KB.
             PFADD hll:daily-users "user:42"
             PFCOUNT hll:daily-users  → approximate unique count
*/

// PACKAGE CHOICE: ioredis vs redis (npm)
/*
  ioredis  — community favourite for production. Cluster support built-in,
             Sentinel support, pipelining, Lua scripting, auto-reconnect,
             Promise-based API. Install: npm install ioredis
             import Redis from 'ioredis';

  redis    — official Node Redis client (v4+). Also Promise-based, supports
             Cluster and Sentinel. Slightly lighter. Install: npm install redis
             import { createClient } from 'redis';

  Both are production-ready. This file uses ioredis API conventions.
*/

// CONNECTION SETUP (ioredis)
/*
  import Redis from 'ioredis';

  const redis = new Redis({
    host: process.env.REDIS_HOST ?? '127.0.0.1',
    port: Number(process.env.REDIS_PORT ?? 6379),
    password: process.env.REDIS_PASSWORD,   // omit if no auth
    db: 0,                                   // database index 0–15
    maxRetriesPerRequest: 3,
    lazyConnect: false,                      // connect immediately
  });

  redis.on('error', (err) => console.error('Redis error:', err));
  redis.on('connect', () => console.log('Redis connected'));
*/

// CORE COMMANDS
/*
  await redis.set('foo', 'bar');           // SET foo bar
  await redis.get('foo');                  // → 'bar'
  await redis.del('foo');                  // DEL foo  → 1 (deleted count)
  await redis.exists('foo');               // → 0 or 1
  await redis.expire('foo', 60);           // expire in 60 seconds
  await redis.ttl('foo');                  // remaining TTL in seconds (-1 = no expiry, -2 = gone)
  await redis.set('foo', 'bar', 'EX', 30); // SET with expiry in one command (atomic)

  // Store an object — JSON roundtrip
  await redis.set('user:123:profile', JSON.stringify({ name: 'Sadik', role: 'admin' }));
  const raw = await redis.get('user:123:profile');
  const profile = raw ? JSON.parse(raw) : null;
*/

// KEY NAMING CONVENTIONS
/*
  Pattern: resource:id:field

  user:123:profile          — full profile JSON for user 123
  user:123:session          — session data for user 123
  product:456:details       — product details
  rate:ip:192.168.1.1       — rate limit counter for an IP
  lock:payment:order:789    — distributed lock for order 789
  cache:GET:/api/posts?page=1 — cached HTTP response

  Use colons as namespace separators (Redis convention).
  Avoid spaces and very long keys (keys are stored in memory too).
*/

// Simulated Redis interaction (no live server — illustrative logs)
function simulateRedisOps(): void {
  const store = new Map<string, { value: string; expiresAt?: number }>();

  function set(key: string, value: string, ttlSeconds?: number): "OK" {
    store.set(key, {
      value,
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined,
    });
    return "OK";
  }

  function get(key: string): string | null {
    const entry = store.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      store.delete(key);
      return null;
    }
    return entry.value;
  }

  function exists(key: string): 0 | 1 {
    return get(key) !== null ? 1 : 0;
  }

  function del(...keys: string[]): number {
    let count = 0;
    for (const k of keys) if (store.delete(k)) count++;
    return count;
  }

  set("user:42:name", "Sadik");
  set("session:abc", JSON.stringify({ userId: 42, role: "admin" }), 3600);

  console.log("GET user:42:name →", get("user:42:name"));
  console.log("EXISTS session:abc →", exists("session:abc"));
  console.log("EXISTS no:such:key →", exists("no:such:key"));

  const sessionRaw = get("session:abc");
  const session = sessionRaw ? JSON.parse(sessionRaw) : null;
  console.log("Parsed session →", session);

  del("user:42:name");
  console.log("After DEL, EXISTS user:42:name →", exists("user:42:name"));
}

simulateRedisOps();

// ───────────────────────────────────────────────────────────────
// 2. Caching Patterns
// ───────────────────────────────────────────────────────────────

console.log("\n=== 2. Caching Patterns ===");

/*
  ┌─────────────────────────────────────────────────────────────┐
  │  CACHE-ASIDE  (lazy loading) — most common pattern          │
  └─────────────────────────────────────────────────────────────┘
  Read path:
    1. Try to GET from Redis
    2. Cache HIT  → return immediately (fast path)
    3. Cache MISS → query DB, SET result in Redis with TTL, return
  Write path:
    - DEL (invalidate) or SET (update) the cache entry on mutation

  Pro:  Only caches data that's actually requested
  Con:  First request after a miss is slow (cache cold start)
        Stale data possible if DB updated outside the cache path
*/

async function cacheAside<T>(
  key: string,
  ttlSeconds: number,
  fetchFromDB: () => Promise<T>,
  redisGet: (k: string) => Promise<string | null>,
  redisSet: (k: string, v: string, ex: "EX", ttl: number) => Promise<unknown>
): Promise<T> {
  const cached = await redisGet(key);
  if (cached !== null) {
    console.log(`[Cache HIT]  key=${key}`);
    return JSON.parse(cached) as T;
  }

  console.log(`[Cache MISS] key=${key} — fetching from DB`);
  const data = await fetchFromDB();
  await redisSet(key, JSON.stringify(data), "EX", ttlSeconds);
  return data;
}

// Usage pattern (illustrative — no live Redis):
async function getUserProfile(userId: number): Promise<{ id: number; name: string }> {
  const mockRedis: Map<string, string> = new Map();
  const get = async (k: string) => mockRedis.get(k) ?? null;
  const set = async (k: string, v: string, _ex: "EX", _ttl: number) => { mockRedis.set(k, v); };

  const result = await cacheAside(
    `user:${userId}:profile`,
    300,
    async () => ({ id: userId, name: "Sadik" }), // simulated DB call
    get,
    set
  );
  console.log("Profile:", result);

  // Second call — hits cache
  await cacheAside(`user:${userId}:profile`, 300, async () => ({ id: -1, name: "WRONG" }), get, set);
  return result;
}

getUserProfile(42);

/*
  ┌─────────────────────────────────────────────────────────────┐
  │  WRITE-THROUGH                                              │
  └─────────────────────────────────────────────────────────────┘
  On every write:
    1. Write to DB
    2. Write to Redis (same transaction, or immediately after)

  Pro:  Cache always consistent with DB (no stale reads after writes)
  Con:  Every write is slower (two round trips)
        Caches data that may never be read again (wasted memory)

  async function updateUser(userId: number, data: object) {
    await db.update('users', { id: userId }, data);            // 1. DB write
    await redis.set(`user:${userId}:profile`, JSON.stringify(data), 'EX', 300); // 2. cache
  }
*/

/*
  ┌─────────────────────────────────────────────────────────────┐
  │  WRITE-BEHIND  (write-back)                                 │
  └─────────────────────────────────────────────────────────────┘
  On write:
    1. Write to Redis immediately (fast response to client)
    2. A background worker flushes dirty keys to DB asynchronously

  Pro:  Very fast writes — DB is not on the critical path
  Con:  Risk of data loss if Redis crashes before flush
        Harder to implement correctly (need dirty-key tracking)
        Generally only used when write latency is the bottleneck

  Pseudocode:
    await redis.set(`user:${userId}:profile`, JSON.stringify(data));
    await redis.sadd('dirty:users', String(userId)); // mark for flush

    // background worker every N seconds:
    const dirtyIds = await redis.smembers('dirty:users');
    for (const id of dirtyIds) {
      const data = await redis.get(`user:${id}:profile`);
      await db.update('users', { id }, JSON.parse(data));
      await redis.srem('dirty:users', id);
    }
*/

/*
  CACHE INVALIDATION STRATEGIES
  ──────────────────────────────
  1. TTL-based   — set an expiry. Simple, always eventually consistent.
                   Risk: stale data served until TTL expires.

  2. Event-based — explicitly DEL / SET cache when the underlying data changes.
                   More precise, but every mutation must know which keys to bust.
                   POST /users/:id → DEL user:${id}:profile

  3. Cache busting — embed a version or hash in the key.
                   Key: user:123:profile:v7  (bump version on schema change)
                   Old key is simply abandoned and TTL-reaped.

  Rule of thumb: use TTL as a safety net, add explicit invalidation for mutations.
*/

/*
  CACHE STAMPEDE  (thundering herd problem)
  ─────────────────────────────────────────
  Scenario: A popular cached key expires. 1000 concurrent requests all get
  a cache MISS at the same millisecond. All 1000 go to the DB simultaneously.
  DB gets hammered. Potentially crashes.

  Solution 1 — Mutex lock (most common):
    Before fetching from DB, acquire a Redis lock on the key.
    Only one process fetches; others wait or return stale value.

    const lockKey = `lock:${cacheKey}`;
    const locked  = await redis.set(lockKey, '1', 'NX', 'EX', 5); // NX = only if not exists
    if (locked) {
      const data = await fetchFromDB();
      await redis.set(cacheKey, JSON.stringify(data), 'EX', ttl);
      await redis.del(lockKey);
    } else {
      await sleep(50);           // brief wait
      return getCached(cacheKey); // re-try (lock released by now)
    }

  Solution 2 — Probabilistic early expiry (PER):
    Re-compute the cache slightly BEFORE it actually expires,
    with probability that increases as TTL approaches 0.
    Only one process triggers the refresh — no thundering herd.
    Formula: if (current_time - ttl * β * ln(random())) > expiry → refresh

  Solution 3 — Background refresh:
    Never let the key actually expire. A background job refreshes it
    before TTL hits 0. The key always exists in cache.
*/

// ───────────────────────────────────────────────────────────────
// 3. Caching in Express
// ───────────────────────────────────────────────────────────────

console.log("\n=== 3. Caching in Express ===");

/*
  CACHE MIDDLEWARE PATTERN
  ─────────────────────────
  Sits in front of route handlers. If cache hit → respond immediately.
  If miss → let request through, intercept the response, cache it.

  import { Request, Response, NextFunction } from 'express';
  import Redis from 'ioredis';

  const redis = new Redis();

  function cacheMiddleware(ttlSeconds: number) {
    return async (req: Request, res: Response, next: NextFunction) => {
      // Cache key = method + full URL (includes query params)
      const key = `cache:${req.method}:${req.originalUrl}`;

      const cached = await redis.get(key);
      if (cached) {
        res.setHeader('X-Cache', 'HIT');
        return res.json(JSON.parse(cached));    // respond from cache
      }

      // Intercept res.json to capture the response body
      const originalJson = res.json.bind(res);
      res.json = (body: unknown) => {
        // Cache only successful responses
        if (res.statusCode < 400) {
          redis.set(key, JSON.stringify(body), 'EX', ttlSeconds).catch(console.error);
        }
        res.setHeader('X-Cache', 'MISS');
        return originalJson(body);
      };

      next();
    };
  }

  // Apply to a route:
  app.get('/api/products', cacheMiddleware(120), async (req, res) => {
    const products = await db.query('SELECT * FROM products');
    res.json(products); // automatically cached by the middleware
  });

  // Invalidate on mutation:
  app.post('/api/products', async (req, res) => {
    const product = await db.insert('products', req.body);

    // Bust all product list caches (pattern delete)
    const keys = await redis.keys('cache:GET:/api/products*');
    if (keys.length) await redis.del(...keys);

    res.status(201).json(product);
  });
*/

/*
  PER-USER vs SHARED CACHE
  ─────────────────────────
  Shared cache   — same data for all users.
    Key: cache:GET:/api/products?category=shoes
    Use for: public data, product listings, config

  Per-user cache — data scoped to a specific user.
    Key: cache:GET:/api/orders?userId=42&page=1
         or: user:42:orders:page:1
    Use for: user-specific data (orders, profile, preferences)

  Mix both: public data in shared cache, personalised data in user-scoped cache.

  IMPORTANT — never put user A's data in a shared cache keyed only by route.
  Always include userId in the key when the response contains personal data.
*/

// Cache key generator example
function buildCacheKey(method: string, path: string, query: Record<string, string>, userId?: number): string {
  const sortedQuery = Object.entries(query)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");
  const userPart = userId !== undefined ? `:uid:${userId}` : "";
  return `cache:${method}:${path}${sortedQuery ? "?" + sortedQuery : ""}${userPart}`;
}

console.log(buildCacheKey("GET", "/api/orders", { page: "2", limit: "10" }, 42));
// → cache:GET:/api/orders?limit=10&page=2:uid:42

console.log(buildCacheKey("GET", "/api/products", { category: "shoes" }));
// → cache:GET:/api/products?category=shoes

// ───────────────────────────────────────────────────────────────
// 4. Redis Pub/Sub
// ───────────────────────────────────────────────────────────────

console.log("\n=== 4. Redis Pub/Sub ===");

/*
  PUBLISH / SUBSCRIBE
  ────────────────────
  Redis as a message broker. Publishers send to a channel;
  all current subscribers receive the message in real time.
  Messages are NOT persisted — if a subscriber is offline it misses them.
  (Use Redis Streams if you need persistence / replay.)

  Key rule: A connection that issues SUBSCRIBE enters subscriber mode.
  In subscriber mode it can ONLY run: SUBSCRIBE, UNSUBSCRIBE,
  PSUBSCRIBE, PUNSUBSCRIBE, PING, RESET, QUIT.
  It CANNOT run GET, SET, etc.

  → You MUST use a SEPARATE Redis connection for pub/sub.
    Keep your regular read/write client (redisClient) and create a
    dedicated subscriber client (redisSub).

  // Publisher (regular connection):
  import Redis from 'ioredis';
  const pub = new Redis();
  await pub.publish('user:profile:updated', JSON.stringify({ userId: 42 }));

  // Subscriber (dedicated connection):
  const sub = new Redis();
  await sub.subscribe('user:profile:updated');
  sub.on('message', (channel, message) => {
    const payload = JSON.parse(message);
    console.log(`Channel: ${channel}`, payload);
    // e.g. invalidate local in-process cache for userId 42
  });
*/

/*
  USE CASES
  ──────────
  1. Cache invalidation broadcast
     Multiple server instances each hold an in-memory LRU cache.
     When user 42 updates their profile, instance A publishes to
     'cache:invalidate:user:42'. Instances B and C subscribe and
     delete their local cache entries. Cache stays consistent across
     all servers without polling.

  2. Real-time notifications
     User receives a new message → publish to 'notifications:userId:42'
     → subscriber pushes a WebSocket event to that user.

  3. Event fan-out
     Order placed → publish 'order:created' → multiple microservices
     (inventory, email, analytics) subscribe and react independently.
*/

/*
  PSUBSCRIBE — pattern matching
  ──────────────────────────────
  Subscribe to all channels matching a glob pattern:

  await sub.psubscribe('cache:invalidate:user:*');
  sub.on('pmessage', (pattern, channel, message) => {
    // pattern = 'cache:invalidate:user:*'
    // channel = 'cache:invalidate:user:42'
    const userId = channel.split(':').pop();
    localCache.delete(`user:${userId}:profile`);
  });

  Useful when you want to subscribe to a family of channels without
  knowing all channel names in advance.
*/

// ───────────────────────────────────────────────────────────────
// 5. Rate Limiting with Redis
// ───────────────────────────────────────────────────────────────

console.log("\n=== 5. Rate Limiting with Redis ===");

/*
  WHY REDIS FOR RATE LIMITING?
  ─────────────────────────────
  In-process counters break with multiple server instances.
  Redis is shared across all instances → consistent count.
  Atomic INCR ensures no race conditions even under high concurrency.
*/

/*
  FIXED WINDOW (simplest)
  ─────────────────────────
  Key: rate:ip:192.168.1.1:window:1719600   (unix minute)
  On each request:
    count = INCR rate:ip:${ip}:window:${Math.floor(Date.now()/60000)}
    if count === 1: EXPIRE key 60
    if count > limit: reject with 429

  Problem: burst at window boundary (100 at 0:59 + 100 at 1:00 = 200 in 2 seconds).
*/

/*
  SLIDING WINDOW (more accurate)
  ──────────────────────────────
  Use a Sorted Set. Score = timestamp.
  On each request:
    now = Date.now()
    windowStart = now - windowSizeMs

    // Remove entries older than window
    ZREMRANGEBYSCORE rate:ip:${ip} 0 ${windowStart}
    // Add current request
    ZADD rate:ip:${ip} ${now} ${now}:${randomId}
    // Count remaining
    count = ZCARD rate:ip:${ip}
    // Set expiry so key auto-cleans
    EXPIRE rate:ip:${ip} ${windowSizeSeconds}

    if count > limit: reject

  Accurate because it counts requests in the true last N seconds.
*/

// Simulated sliding window rate limiter
type SlidingWindowStore = Map<string, number[]>; // key → [timestamps]

function createSlidingWindowLimiter(windowMs: number, limit: number) {
  const store: SlidingWindowStore = new Map();

  return function isAllowed(identifier: string): { allowed: boolean; remaining: number; resetIn: number } {
    const now = Date.now();
    const windowStart = now - windowMs;

    const timestamps = (store.get(identifier) ?? []).filter(t => t > windowStart);
    timestamps.push(now);
    store.set(identifier, timestamps);

    const count = timestamps.length;
    const allowed = count <= limit;
    const remaining = Math.max(0, limit - count);
    const resetIn = timestamps.length > 0
      ? Math.ceil((timestamps[0] + windowMs - now) / 1000)
      : 0;

    return { allowed, remaining, resetIn };
  };
}

const limiter = createSlidingWindowLimiter(60_000, 5); // 5 req/min

for (let i = 1; i <= 7; i++) {
  const result = limiter("user:42");
  console.log(`Request ${i}: allowed=${result.allowed}, remaining=${result.remaining}`);
}

/*
  EXPRESS MIDDLEWARE WITH RATE LIMIT HEADERS
  ───────────────────────────────────────────
  async function rateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
    const key = `rate:ip:${req.ip}`;
    const windowSeconds = 60;
    const limit = 100;
    const now = Date.now();

    const pipe = redis.pipeline();
    pipe.zremrangebyscore(key, 0, now - windowSeconds * 1000);
    pipe.zadd(key, now, `${now}:${Math.random()}`);
    pipe.zcard(key);
    pipe.expire(key, windowSeconds);
    const results = await pipe.exec();

    const count = results[2][1] as number;
    const remaining = Math.max(0, limit - count);

    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', Math.floor(Date.now() / 1000) + windowSeconds);

    if (count > limit) {
      return res.status(429).json({ error: 'Too Many Requests' });
    }
    next();
  }
*/

// ───────────────────────────────────────────────────────────────
// 6. Distributed Locks
// ───────────────────────────────────────────────────────────────

console.log("\n=== 6. Distributed Locks ===");

/*
  THE PROBLEM
  ────────────
  Two server instances (A and B) both receive a "process payment" request
  for order #789 at the same time. Without a lock, both execute the charge.
  User gets billed twice. Classic race condition, unsolvable with in-process locks.

  SOLUTION: Use Redis as a shared lock manager.

  ACQUIRING THE LOCK
  ───────────────────
  SET lock:payment:order:789 <unique-token> NX EX 30

    NX  → only SET if key does Not eXist (atomic check-and-set)
    EX 30 → auto-expire after 30 seconds (prevents deadlock if holder crashes)
    <unique-token> → a UUID that identifies the holder (prevents accidental release)

  If SET returns "OK"  → lock acquired. Proceed.
  If SET returns null  → lock held by another process. Retry or reject.

  RELEASING THE LOCK (must be atomic!)
  ──────────────────────────────────────
  WRONG:
    const val = await redis.get(lockKey);
    if (val === myToken) await redis.del(lockKey);  // NOT atomic — race here!

  RIGHT: Use a Lua script (Redis executes Lua atomically):
    const releaseLua = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;
    await redis.eval(releaseLua, 1, lockKey, myToken);

  The Lua script ensures the get + del happen atomically — no other command
  can run between them. If the token has changed (lock expired & taken by B),
  process A does NOT delete B's lock.
*/

// Simulated distributed lock
class DistributedLock {
  private store = new Map<string, string>();

  async acquire(key: string, token: string, ttlMs: number): Promise<boolean> {
    if (this.store.has(key)) return false; // NX semantics
    this.store.set(key, token);
    setTimeout(() => this.store.delete(key), ttlMs); // EX semantics
    return true;
  }

  async release(key: string, token: string): Promise<boolean> {
    // Lua script semantics: only delete if token matches
    if (this.store.get(key) === token) {
      this.store.delete(key);
      return true;
    }
    return false;
  }
}

async function demonstrateDistributedLock(): Promise<void> {
  const lock = new DistributedLock();
  const lockKey = "lock:payment:order:789";
  const tokenA = "uuid-server-A-" + Math.random().toString(36).slice(2);
  const tokenB = "uuid-server-B-" + Math.random().toString(36).slice(2);

  const acquiredA = await lock.acquire(lockKey, tokenA, 5000);
  console.log("Server A acquired lock:", acquiredA); // true

  const acquiredB = await lock.acquire(lockKey, tokenB, 5000);
  console.log("Server B acquired lock:", acquiredB); // false — A holds it

  // Only A can release (token must match)
  const releasedByB = await lock.release(lockKey, tokenB);
  console.log("Server B tried to release A's lock:", releasedByB); // false

  const releasedByA = await lock.release(lockKey, tokenA);
  console.log("Server A released lock:", releasedByA); // true

  const acquiredB2 = await lock.acquire(lockKey, tokenB, 5000);
  console.log("Server B acquired after A released:", acquiredB2); // true
  await lock.release(lockKey, tokenB);
}

demonstrateDistributedLock();

/*
  REDLOCK ALGORITHM
  ──────────────────
  Single Redis node: if that node crashes, lock is lost (false release risk).
  Redlock: acquire lock on N independent Redis nodes (N ≥ 5, typically).
  Lock is valid only if acquired on majority (⌊N/2⌋ + 1) nodes within
  a validity window. On release, delete from all nodes.

  Library: npm install redlock (implements Redlock for ioredis / node-redis)

  import Redlock from 'redlock';
  const redlock = new Redlock([redis1, redis2, redis3]);
  const lock = await redlock.acquire(['lock:resource'], 5000);
  try {
    // critical section
  } finally {
    await lock.release();
  }

  USE CASES FOR DISTRIBUTED LOCKS
  ─────────────────────────────────
  - Payment processing (prevent double charge)
  - Cron job deduplication (only one server runs the scheduled job)
  - Inventory reservation (prevent overselling)
  - User actions that should run once (email confirmation link)
*/

// ───────────────────────────────────────────────────────────────
// 7. Redis Data Structures for Common Problems
// ───────────────────────────────────────────────────────────────

console.log("\n=== 7. Redis Data Structures for Common Problems ===");

/*
  LEADERBOARD — Sorted Set
  ──────────────────────────
  ZADD leaderboard:weekly 9850 "alice"
  ZADD leaderboard:weekly 7200 "bob"
  ZADD leaderboard:weekly 9850 "carol"  // same score as alice

  ZRANGE leaderboard:weekly 0 9 REV WITHSCORES  → top 10 with scores
  ZRANK leaderboard:weekly "bob"                 → rank (0-based, ascending)
  ZREVRANK leaderboard:weekly "bob"              → rank (0-based, descending = position in top 10)
  ZINCRBY leaderboard:weekly 150 "bob"           → bob's new score = 7350

  Sorted sets are O(log N) for add, remove, range queries.
  Perfect for leaderboards, priority queues, time-series data.
*/

/*
  JOB QUEUE — List
  ──────────────────
  Producer:
    LPUSH jobs:email '{"to":"sadik@example.com","subject":"Welcome"}'

  Consumer (blocking — waits for a job):
    BRPOP jobs:email 0    → blocks until a job is available

  BRPOP is atomic and blocks efficiently (no polling loop).
  Multiple workers can BRPOP from the same list — Redis distributes jobs.
  Use a "processing" list for reliability: LMOVE jobs:email jobs:processing RIGHT LEFT
*/

/*
  UNIQUE VISITORS — Set
  ──────────────────────
  SADD visitors:2024-01-15 "user:42" "user:99"
  SADD visitors:2024-01-15 "user:42"   // duplicate — ignored

  SCARD visitors:2024-01-15  → 2 (exact unique count)
  SISMEMBER visitors:2024-01-15 "user:42" → 1 (is member?)

  Set union for total unique across days:
  SUNIONSTORE visitors:week:3 visitors:2024-01-15 visitors:2024-01-16 ...
*/

/*
  USER SESSION — Hash
  ────────────────────
  HSET session:abc userId 42 role admin lastSeen 1719600000 cartItems 3
  HGET session:abc role         → "admin"
  HGETALL session:abc           → { userId: "42", role: "admin", ... }
  HINCRBY session:abc cartItems 1  → atomic increment of one field

  Hashes use much less memory than storing the entire JSON string as a String
  when you have many fields and only need to update one at a time.
*/

/*
  APPROXIMATE UNIQUE COUNTS — HyperLogLog
  ────────────────────────────────────────
  Use when exact counts don't matter and memory does.
  HyperLogLog uses at most 12 KB regardless of cardinality.

  PFADD hll:page:views:home "user:1" "user:2" "user:3"
  PFCOUNT hll:page:views:home  → approximate unique count (~0.8% error)

  Cannot enumerate members (unlike Set). Only useful for counts.
  Great for: monthly active users, unique search queries, feature usage metrics.
*/

// In-memory demonstrations of data structure patterns
function demonstrateDataStructures(): void {
  // Sorted Set (leaderboard simulation)
  const leaderboard: Map<string, number> = new Map();
  const zadd = (k: string, score: number) => leaderboard.set(k, score);
  const zrange = (limit: number): [string, number][] =>
    [...leaderboard.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit);

  zadd("alice", 9850); zadd("bob", 7200); zadd("carol", 9100); zadd("dave", 8400);
  console.log("Top 3 leaderboard:", zrange(3));

  // Set (unique visitors)
  const visitors = new Set<string>();
  visitors.add("user:1"); visitors.add("user:2"); visitors.add("user:1"); // dupe
  console.log("Unique visitors:", visitors.size); // 2

  // List as queue
  const queue: string[] = [];
  queue.unshift("job:a"); queue.unshift("job:b"); // LPUSH
  console.log("Dequeued:", queue.pop()); // RPOP → "job:a"
  console.log("Dequeued:", queue.pop()); // RPOP → "job:b"
}

demonstrateDataStructures();

// ───────────────────────────────────────────────────────────────
// 8. Redis Persistence & Production
// ───────────────────────────────────────────────────────────────

console.log("\n=== 8. Redis Persistence & Production ===");

/*
  PERSISTENCE MODES
  ──────────────────
  RDB (Redis DataBase) — point-in-time snapshots
    Redis forks a child process and writes the full dataset to disk periodically.
    Config: save 900 1    (save if ≥1 key changed in 900 seconds)
            save 300 10   (save if ≥10 keys changed in 300 seconds)
            save 60 10000 (save if ≥10000 keys changed in 60 seconds)

    Pro:  Compact file, fast restarts, minimal performance impact
    Con:  Potential data loss (up to the last snapshot interval)
    Use:  Acceptable when some data loss is tolerable (caches, sessions)

  AOF (Append-Only File) — log every write command
    Redis appends every write operation to a log file.
    Config: appendonly yes
            appendfsync everysec  (flush to disk every second — good balance)
            appendfsync always    (flush on every write — safest, slowest)
            appendfsync no        (OS decides — fastest, least safe)

    Pro:  Much lower risk of data loss (at most 1 second)
    Con:  Larger file, slower restart (replaying all commands)
    Use:  When data must survive a crash (financial records, user data)

  Both at once (recommended for production):
    Use RDB for backups + AOF for crash recovery.
    On restart, AOF takes precedence (more complete).

  No persistence:
    Pure cache use case. Fastest. All data lost on restart.
    Fine when Redis is only a cache backed by a real DB.
*/

/*
  MEMORY MANAGEMENT
  ──────────────────
  maxmemory 2gb                 — cap Redis memory usage

  Eviction policies (what to remove when maxmemory is reached):
    noeviction        — reject new writes. Safe but causes errors.
    allkeys-lru       — evict least recently used key from ALL keys. Good for caches.
    volatile-lru      — evict LRU key from only keys WITH an expiry. Good for mixed workloads.
    allkeys-lfu       — evict least frequently used (Redis 4.0+). Better for skewed access.
    volatile-ttl      — evict the key with the shortest TTL. Good if you set TTLs intentionally.
    allkeys-random    — random eviction. Rarely the right choice.

  Recommendation for a pure cache: allkeys-lru
  Recommendation for mixed (cache + persistent data): volatile-lru
*/

/*
  HIGH AVAILABILITY
  ──────────────────
  Redis Sentinel — monitors a primary + replicas. Performs automatic failover
  (promotes a replica to primary) if primary goes down.
    • Quorum of sentinels must agree before promoting (prevents split-brain)
    • Client must be Sentinel-aware (asks Sentinel for current primary address)
    • Good for: persistence + HA, smaller deployments

  Redis Cluster — automatic sharding across multiple nodes.
    • Data is split across 16,384 hash slots
    • Each primary owns a subset of slots; each primary has replicas
    • Client hashes key → finds responsible node → connects directly
    • Good for: horizontal scaling beyond a single node's memory
    • Limitation: multi-key operations require all keys to map to same slot
      (use hash tags: {user:42}:profile, {user:42}:orders → same slot)

  Managed options: Redis Cloud, AWS ElastiCache, Azure Cache for Redis,
  Google Memorystore. These handle replication, failover, and patching.
*/

/*
  WHEN NOT TO CACHE
  ──────────────────
  1. Financial balances that must always reflect the latest DB value.
     A stale cached balance could cause incorrect overdraft decisions.
     Always read the authoritative DB for anything with real-money consequences.

  2. Data that changes on nearly every request.
     Cache hit ratio will be near zero; you're just adding latency.

  3. Small datasets that fit comfortably in DB memory / indexes.
     A DB query returning in 1 ms does not need a cache layer.

  4. During development / debugging.
     Cache can mask DB bugs. Disable or use very short TTLs while debugging.

  Golden rule: cache aggressively for reads, cache conservatively for writes,
  never cache data where staleness has financial or security consequences.
*/

// ───────────────────────────────────────────────────────────────
// PRACTICE
// ───────────────────────────────────────────────────────────────

console.log("\n=== Practice Q&A ===");

/*
  Q: What's the difference between cache-aside and write-through caching?

  A: Cache-aside is lazy — data is only loaded into the cache when first requested.
     On a cache miss, the application fetches from the DB and populates the cache.
     The cache does not participate in writes; the application must explicitly
     invalidate or update the cache when data changes.

     Write-through is eager — every write goes to both the DB and the cache
     simultaneously. The cache is always consistent immediately after a write.
     Reads are always cache hits for recently written data.

     Trade-off: cache-aside saves cache space (only warm data is cached) but risks
     stale reads. Write-through ensures freshness but wastes cache space on data
     that may never be read again, and every write is slower (two round trips).
*/

/*
  Q: You have 3 servers. A user updates their profile. How do you invalidate
     the cache on all servers?

  A: Two common approaches:

     1. Event-based via Redis Pub/Sub:
        When server A handles the update, it publishes to a Redis channel:
          pub.publish('cache:invalidate:user:42', JSON.stringify({ userId: 42 }))
        All three servers subscribe to 'cache:invalidate:user:*'.
        Each subscriber deletes 'user:42:profile' from its local cache.

     2. Skip local in-process caches entirely:
        Store all cache in Redis (a shared external cache).
        All three servers read/write the same Redis key.
        A DEL on 'user:42:profile' in Redis is immediately visible to all.
        Simpler, but every cache read is a Redis network hop.

     Option 2 is simpler and usually preferred unless you need sub-millisecond
     local cache hits. Option 1 is used when you layer a local LRU cache in
     front of Redis for extreme read performance.
*/

/*
  Q: What's a cache stampede and how do you prevent it?

  A: A cache stampede (thundering herd) happens when a popular cache key expires
     and many concurrent requests all get a cache MISS at the same moment.
     They all hit the DB simultaneously, potentially crashing it.

     Prevention strategies:
     1. Mutex lock — use SET key 1 NX EX 5 before hitting the DB. Only one
        request acquires the lock and refreshes the cache; others wait briefly
        then re-read from the now-warm cache.

     2. Probabilistic early expiry — re-compute the cache shortly BEFORE it
        expires, with a probability that grows as TTL approaches zero. One
        request triggers refresh while others still get hits from the old value.

     3. Background refresh — use a background job to refresh the cache before
        TTL hits zero. The key never actually expires in production traffic.
*/

/*
  Q: Why does SUBSCRIBE need a separate Redis connection from your regular GET/SET client?

  A: When a Redis connection issues SUBSCRIBE, it enters a special subscriber mode.
     In this mode, Redis only processes subscription-related commands
     (SUBSCRIBE, UNSUBSCRIBE, PSUBSCRIBE, PUNSUBSCRIBE, PING, QUIT).
     Any other command (GET, SET, HGET, etc.) will return an error.

     So if you subscribe on your main client, all your regular cache reads and
     writes break immediately. The standard pattern is:
       const redis = new Redis();    // for GET, SET, DEL, etc.
       const sub   = new Redis();    // dedicated subscriber connection
       await sub.subscribe('my-channel');

     The subscriber connection is dedicated to listening and cannot be
     reused for anything else. ioredis and node-redis both document this requirement.
*/

/*
  Q: How does `SET key value NX EX 30` implement a distributed lock?

  A: NX (Not eXists) means the SET only succeeds if the key does not already exist.
     EX 30 means the key auto-expires after 30 seconds.
     Both conditions are applied atomically in a single Redis command.

     If the key doesn't exist:   SET succeeds → lock acquired
     If the key already exists:  SET returns null → lock held by another process

     The auto-expiry (EX 30) is critical: if the lock holder crashes or hangs,
     the lock automatically releases after 30 seconds, preventing deadlock.

     The value should be a unique token (UUID) so the holder can verify
     ownership before releasing. Release is done with a Lua script that
     atomically checks the token and deletes only if it matches —
     preventing a process from accidentally releasing another process's lock
     if its own lock expired and was re-acquired by someone else.
*/

// ───────────────────────────────────────────────────────────────
// runDemo — Reference Card
// ───────────────────────────────────────────────────────────────

function runDemo(): void {
  console.log(`
╔══════════════════════════════════════════════════════════════════╗
║          BACKEND 09 — REDIS REFERENCE CARD                      ║
╠══════════════════════════════════════════════════════════════════╣
║  PACKAGES                                                        ║
║  npm install ioredis                # community favourite        ║
║  npm install redis                  # official client (v4+)      ║
║  npm install redlock                # distributed lock           ║
╠══════════════════════════════════════════════════════════════════╣
║  CORE COMMANDS                                                   ║
║  SET key value EX 60               # set with 60s TTL           ║
║  GET key                           # retrieve value             ║
║  DEL key1 key2                     # delete keys                ║
║  EXISTS key                        # 1 if exists, 0 if not      ║
║  TTL key                           # remaining seconds          ║
║  INCR key                          # atomic increment           ║
╠══════════════════════════════════════════════════════════════════╣
║  DATA STRUCTURES                                                 ║
║  String    → simple values, JSON, counters                      ║
║  List      → queue (LPUSH + BRPOP), stack                       ║
║  Hash      → object fields (HSET / HGETALL)                     ║
║  Set       → unique members (SADD / SCARD / SISMEMBER)          ║
║  Sorted Set→ leaderboards (ZADD / ZRANGE / ZRANK)               ║
║  HyperLogLog→ approx unique counts (PFADD / PFCOUNT)            ║
╠══════════════════════════════════════════════════════════════════╣
║  CACHING PATTERNS                                                ║
║  Cache-aside  → lazy load; miss → DB → cache                    ║
║  Write-through→ write to DB + cache simultaneously              ║
║  Write-behind → write to cache; async flush to DB               ║
║  Stampede fix → mutex lock or probabilistic early expiry        ║
╠══════════════════════════════════════════════════════════════════╣
║  PUB/SUB                                                         ║
║  pub.publish(channel, message)     # send                       ║
║  sub.subscribe(channel)            # receive — dedicated conn   ║
║  sub.psubscribe('cache:*')         # glob pattern subscribe     ║
╠══════════════════════════════════════════════════════════════════╣
║  RATE LIMITING                                                   ║
║  INCR + EXPIRE                     # fixed window               ║
║  ZADD + ZREMRANGEBYSCORE + ZCARD   # sliding window             ║
║  Reply with X-RateLimit-* headers                               ║
╠══════════════════════════════════════════════════════════════════╣
║  DISTRIBUTED LOCK                                                ║
║  SET lock:key token NX EX 30       # acquire (atomic)           ║
║  Lua: if get==token then del end   # release (atomic)           ║
║  Redlock: acquire on N nodes, need majority                     ║
╠══════════════════════════════════════════════════════════════════╣
║  PERSISTENCE                                                     ║
║  RDB  → snapshots, fast restart, some data loss ok              ║
║  AOF  → append-only log, near-zero data loss, slower restart    ║
║  Both → recommended for production                              ║
╠══════════════════════════════════════════════════════════════════╣
║  EVICTION (when maxmemory is full)                               ║
║  allkeys-lru   → best for pure cache                            ║
║  volatile-lru  → best for mixed cache + persistent data         ║
║  noeviction    → safe but writes error when full                ║
╠══════════════════════════════════════════════════════════════════╣
║  HA OPTIONS                                                      ║
║  Sentinel → auto-failover, primary/replica topology             ║
║  Cluster  → sharding, horizontal scale, 16384 hash slots        ║
╠══════════════════════════════════════════════════════════════════╣
║  KEY CONVENTIONS                                                 ║
║  resource:id:field                                               ║
║  user:123:profile   rate:ip:1.2.3.4   lock:payment:order:789    ║
╠══════════════════════════════════════════════════════════════════╣
║  DO NOT CACHE                                                    ║
║  Financial balances · Security tokens · Near-100% write data    ║
╚══════════════════════════════════════════════════════════════════╝
`);
}

runDemo();

export default runDemo;
