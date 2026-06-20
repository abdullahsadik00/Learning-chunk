// ════════════════════════════════════════════════════════════════
// DAY 44 — REDIS
// ════════════════════════════════════════════════════════════════
//
// REDIS IS NOT A DATABASE (mainly):
//   Primary use cases in web apps:
//   1. Caching — store DB results temporarily (faster reads)
//   2. Session storage — store user sessions (horizontally scalable)
//   3. Rate limiting — INCR + EXPIRE for sliding window counters
//   4. Pub/Sub — broadcast events to multiple subscribers
//   5. Job queues — list as queue (LPUSH + BRPOP)
//
// DATA STRUCTURES:
//   String:      GET/SET — simplest, most common
//   Hash:        HGET/HSET — object-like, field-level access
//   List:        LPUSH/RPOP — queue, recent items
//   Set:         SADD/SMEMBERS — unique items, tags
//   Sorted Set:  ZADD/ZRANGE — leaderboards, time-sorted data
//   Expire:      EXPIRE/TTL — automatic deletion after N seconds
//
// NOTE: Redis must be running for this file to work.
// Start with: docker run -d -p 6379:6379 redis:7-alpine
// Skip gracefully if Redis is unavailable.

import Redis from 'ioredis';

// ── Cache-aside pattern ───────────────────────────────────────────────────────
//
// 1. Check Redis for cached result
// 2. If cache HIT: return cached data (no DB query needed)
// 3. If cache MISS: call the slow function, store result in Redis, return it
//
// TTL (Time To Live): cached data expires automatically after `ttl` seconds.
// This prevents stale data from living forever.
//
// Cache invalidation (the hard part):
//   When data changes, you must either:
//   a) Delete the cache key immediately (cache invalidation)
//   b) Let it expire naturally (acceptable for non-critical data)

async function withCache<T>(
  redis: Redis,
  key: string,
  ttl: number,
  fn: () => Promise<T>
): Promise<T> {
  // Try to get from cache first
  const cached = await redis.get(key);

  if (cached !== null) {
    console.log(`  CACHE HIT: ${key}`);
    return JSON.parse(cached) as T;
  }

  console.log(`  CACHE MISS: ${key} — calling source function...`);

  // Cache miss: call the actual function (simulates a DB query)
  const result = await fn();

  // Store in Redis with TTL
  // JSON.stringify because Redis stores strings
  await redis.setex(key, ttl, JSON.stringify(result));

  return result;
}

async function demoCaching(redis: Redis) {
  console.log('\n[CACHING — cache-aside pattern]');

  // Simulate a slow database query (100ms)
  const slowDbQuery = async (): Promise<{ posts: number; users: number }> => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return { posts: 20, users: 5 };
  };

  // First call: cache miss, runs slowDbQuery
  const start1 = Date.now();
  const result1 = await withCache(redis, 'stats:dashboard', 60, slowDbQuery);
  console.log(`  First call: ${Date.now() - start1}ms → ${JSON.stringify(result1)}`);

  // Second call: cache hit, returns immediately
  const start2 = Date.now();
  const result2 = await withCache(redis, 'stats:dashboard', 60, slowDbQuery);
  console.log(`  Second call: ${Date.now() - start2}ms → ${JSON.stringify(result2)}`);
  console.log('  Note: second call is ~100ms faster — data came from Redis, not DB');
}

// ── Rate limiting ─────────────────────────────────────────────────────────────
//
// Pattern: INCR + EXPIRE
//   1. INCR key     → atomically increment the counter (creates if not exists)
//   2. If count = 1 → first request in this window, set EXPIRE
//   3. If count > limit → reject the request
//
// Why INCR is atomic:
//   Redis is single-threaded. INCR is a single atomic operation.
//   No race condition: two concurrent requests can't both see count=0
//   and both get through. One gets 1, one gets 2.

async function checkRateLimit(
  redis: Redis,
  identifier: string,
  limit: number,
  windowSeconds: number
): Promise<{ allowed: boolean; count: number; remaining: number }> {
  const key = `ratelimit:${identifier}`;

  // INCR atomically increments and creates the key if it doesn't exist
  const count = await redis.incr(key);

  if (count === 1) {
    // First request in this window — set expiry
    await redis.expire(key, windowSeconds);
  }

  return {
    allowed: count <= limit,
    count,
    remaining: Math.max(0, limit - count),
  };
}

async function demoRateLimit(redis: Redis) {
  console.log('\n[RATE LIMITING — INCR + EXPIRE pattern]');

  // Simulate 7 requests from user "alice", limit is 5 per minute
  for (let i = 1; i <= 7; i++) {
    const result = await checkRateLimit(redis, 'user:alice', 5, 60);
    const status = result.allowed ? '✓ ALLOWED' : '✗ BLOCKED';
    console.log(
      `  Request ${i}: ${status} (count=${result.count}, remaining=${result.remaining})`
    );
  }

  // Cleanup
  await redis.del('ratelimit:user:alice');
}

// ── Pub/Sub ───────────────────────────────────────────────────────────────────
//
// Pub/Sub lets you broadcast messages to multiple subscribers.
// Publisher and subscriber are separate connections — you can't
// use the same Redis client for both (subscriber enters a special mode).
//
// Use cases:
//   - Real-time notifications: "user X liked your post"
//   - Cache invalidation across multiple servers
//   - Live dashboard updates
//   - Chat messages

async function demoPubSub(redis: Redis) {
  console.log('\n[PUB/SUB — broadcast messages]');

  // Create a separate subscriber connection
  // (can't use the main connection — subscribe mode blocks other commands)
  const subscriber = new Redis({ host: 'localhost', port: 6379, lazyConnect: true });
  await subscriber.connect();

  const messages: string[] = [];

  // Subscribe to the 'news' channel
  await subscriber.subscribe('news');
  subscriber.on('message', (channel, message) => {
    console.log(`  [SUBSCRIBER] Received on "${channel}": ${message}`);
    messages.push(message);
  });

  // Publish 3 messages
  console.log('  Publishing 3 messages to "news" channel...');
  await redis.publish('news', 'Breaking: Redis is fast');
  await redis.publish('news', 'Update: Cursor pagination rocks');
  await redis.publish('news', 'Feature: Real-time dashboard live');

  // Wait for messages to be received
  await new Promise(resolve => setTimeout(resolve, 200));

  console.log(`  Received ${messages.length} messages`);
  await subscriber.quit();
}

// ── Sorted set leaderboard ───────────────────────────────────────────────────
//
// Sorted sets: each member has a score. Automatically sorted by score.
// O(log N) for add/update, O(log N + M) for range queries.
//
// Use cases: leaderboards, time-series (score = timestamp), priority queues.

async function demoLeaderboard(redis: Redis) {
  console.log('\n[SORTED SET — leaderboard]');

  const key = 'leaderboard:posts';
  await redis.del(key);  // Clean start

  // ZADD: add members with scores
  await redis.zadd(key,
    1523, 'Understanding JavaScript Closures',
    2341, 'React Hooks: useEffect Explained',
    3421, 'JWT Authentication Best Practices',
    2678, 'Database Indexing Explained',
    1876, 'Docker for Node.js Developers',
  );

  // ZREVRANGE: get top N in descending order, with scores
  const topPosts = await redis.zrevrange(key, 0, 2, 'WITHSCORES');

  console.log('Top 3 posts by view count:');
  for (let i = 0; i < topPosts.length; i += 2) {
    const rank = i / 2 + 1;
    console.log(`  ${rank}. [${topPosts[i + 1]} views] ${topPosts[i]}`);
  }

  await redis.del(key);
}

// ── Distributed lock ─────────────────────────────────────────────────────────
//
// Problem: multiple server instances might try to process the same job.
// Solution: SET key value NX EX seconds
//   NX: only set if key does NOT exist (atomic check-and-set)
//   EX: expire automatically (prevents deadlock if process crashes)
//
// Use cases: cron jobs that should only run once, payment processing,
// inventory deductions, sending emails once.
//
// Note: For production distributed locks, use Redlock algorithm.

async function demoDistributedLock(redis: Redis) {
  console.log('\n[DISTRIBUTED LOCK — SET NX EX]');

  const lockKey = 'lock:send-weekly-digest';
  const lockValue = `worker-${process.pid}`;

  // Try to acquire the lock (atomic — no race condition)
  // set with NX returns "OK" if set, null if key already exists
  const acquired = await redis.set(lockKey, lockValue, 'EX', 30, 'NX');

  if (acquired === 'OK') {
    console.log('  Lock ACQUIRED — this worker will process the job');
    console.log('  (lock expires in 30s — prevents deadlock if process crashes)');

    // Simulate doing work
    await new Promise(resolve => setTimeout(resolve, 50));

    // Release the lock when done
    await redis.del(lockKey);
    console.log('  Lock RELEASED');
  } else {
    console.log('  Lock NOT acquired — another worker is already processing');
    const ttl = await redis.ttl(lockKey);
    console.log(`  Lock expires in ${ttl}s`);
  }
}

async function main() {
  // Try to connect to Redis. If it's not running, exit gracefully.
  const redis = new Redis({
    host: 'localhost',
    port: 6379,
    lazyConnect: true,
    // Fail fast — don't retry for 30 seconds if Redis is down
    maxRetriesPerRequest: 1,
    retryStrategy: () => null,  // Don't retry
  });

  try {
    await redis.connect();
    await redis.ping();
    console.log('════════════════════════════════════════════════════════════════');
    console.log('DAY 44 — REDIS');
    console.log('════════════════════════════════════════════════════════════════\n');
    console.log('Connected to Redis!\n');

    await demoCaching(redis);
    await demoRateLimit(redis);
    await demoPubSub(redis);
    await demoLeaderboard(redis);
    await demoDistributedLock(redis);

    console.log('\n════════════════════════════════════════════════════════════════');
    console.log('Day 44 complete!');
    console.log('════════════════════════════════════════════════════════════════');
  } catch (err) {
    console.log('════════════════════════════════════════════════════════════════');
    console.log('DAY 44 — REDIS (SKIPPED — Redis not available)');
    console.log('════════════════════════════════════════════════════════════════');
    console.log('');
    console.log('Redis not available — start with:');
    console.log('  docker run -d -p 6379:6379 redis:7-alpine');
    console.log('');
    console.log('Then re-run: npm run day44');
    console.log('');
    console.log('Study the code in src/day44-redis/index.ts while Redis is offline.');
  } finally {
    redis.disconnect();
  }
}

main().catch(console.error);
