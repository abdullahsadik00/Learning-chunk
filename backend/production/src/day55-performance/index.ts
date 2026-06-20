// ════════════════════════════════════════════════════════════════
// DAY 55 — PERFORMANCE OPTIMIZATION
// ════════════════════════════════════════════════════════════════
//
// PERFORMANCE RULE #1: MEASURE BEFORE YOU OPTIMIZE
// ──────────────────────────────────────────────────
// Don't guess. Profiling consistently reveals that the bottleneck is
// NOT where you expected. Common wrong guesses:
//   "The JSON serialization must be slow" → it's actually an N+1 query
//   "My business logic is too complex"   → it's actually a missing DB index
//   "Node.js is single-threaded"         → it's actually a synchronous crypto call
//
// TOOLS FOR MEASURING:
//   process.hrtime.bigint()  — nanosecond precision wall clock
//   console.time/timeEnd     — simple, built-in, human-readable
//   clinic.js (npm i -g clinic) — production profiling: flame graphs, event loop delay
//     clinic doctor -- node server.js  → general health check + recommendations
//     clinic flame -- node server.js   → CPU flame graph (what functions are hot)
//     clinic bubbleprof -- node server.js → async operations breakdown
//   0x (npm i -g 0x) — interactive flame graph
//     0x server.js
//
// THE TOP 5 NODE.JS PERFORMANCE PROBLEMS:
// ──────────────────────────────────────────
//   1. N+1 queries           — most common, biggest impact
//   2. Missing DB indexes    — queries scan entire tables instead of using indexes
//   3. Blocking event loop   — sync code in request handlers (JSON.parse, crypto)
//   4. Memory leaks          — growing heap → GC pauses → latency spikes
//   5. Missing connection pool — opening/closing a DB connection per request
//
// WHAT THIS FILE DEMONSTRATES:
//   - N+1 query detection pattern
//   - Connection pool configuration reference
//   - Event loop lag detection
//   - Memory leak patterns and detection
//   - Response compression reference
//   - Caching strategy reference
//   - Simple benchmark: cached vs uncached response time

// ──────────────────────────────────────────────────────────────
// SECTION 1 — N+1 QUERY DETECTION
// ──────────────────────────────────────────────────────────────
//
// THE N+1 PROBLEM:
//   You have a list of 100 users. You want each user's profile picture.
//
//   Naive code:
//     const users = await db.user.findMany();            // 1 query
//     for (const user of users) {
//       user.avatar = await db.avatar.findById(user.id); // N queries (100 queries!)
//     }
//   Total: 101 queries for a single request. With 100 concurrent users: 10,100 queries/second.
//
//   Correct code:
//     const users = await db.user.findMany({             // 1 query
//       include: { avatar: true }                        // JOIN — no extra queries
//     });
//   Total: 1 query.
//
// WHERE IT HIDES:
//   - Loops with awaited DB calls
//   - ORM lazy loading (Sequelize's get accessors, TypeORM lazy relations)
//   - GraphQL resolvers without DataLoader
//
// HOW TO DETECT IN PRODUCTION:
//   Wrap your DB client to count queries per request context.
//   If a request fires > threshold queries, log a warning with the stack trace.

function createQueryTracker() {
  let queryCount = 0;
  const queryLog: string[] = [];
  const THRESHOLD = 5; // warn if a single "request" fires more than 5 queries

  return {
    recordQuery(sql: string): void {
      queryCount++;
      queryLog.push(sql);

      if (queryCount > THRESHOLD) {
        // In production, use your structured logger here
        console.warn(
          `[PERF] N+1 suspected: ${queryCount} queries for one operation. Last query: ${sql}`
        );
        // Log a stack trace to find WHERE the extra queries are coming from
        console.warn(new Error('N+1 stack trace').stack);
      }
    },

    reset(): void {
      queryCount = 0;
      queryLog.length = 0;
    },

    getCount(): number {
      return queryCount;
    },
  };
}

// Simulate the N+1 problem
function demonstrateN1Problem(): void {
  console.log('\n═══ SECTION 1: N+1 QUERY DETECTION ═══\n');

  const tracker = createQueryTracker();

  // Simulate: fetch 3 users, then fetch each user's posts separately
  const users = ['alice', 'bob', 'charlie'];

  // Query 1: get users
  tracker.recordQuery('SELECT * FROM users');

  // Queries 2,3,4: N+1 — one extra query per user
  for (const user of users) {
    tracker.recordQuery(`SELECT * FROM posts WHERE userId = '${user}'`);
  }

  console.log(`Total queries fired: ${tracker.getCount()}`);
  console.log('Fix: use db.user.findMany({ include: { posts: true } })');
  console.log('This uses a JOIN (or a single batched query) instead of N separate queries.\n');
}

// ──────────────────────────────────────────────────────────────
// SECTION 2 — CONNECTION POOL REFERENCE
// ──────────────────────────────────────────────────────────────
//
// WHY CONNECTION POOLS?
//   Opening a TCP connection + TLS handshake + Postgres auth = ~50-200ms.
//   If you open a new connection for every query, you're adding 50-200ms
//   to every request. With 1000 requests/second, this is catastrophic.
//
//   A connection pool keeps N connections open and ready.
//   When a query arrives: grab an idle connection, run the query, return it.
//   Connection overhead: ~0ms (connection already open).
//
// PRISMA CONNECTION POOL:
//   Prisma manages a connection pool automatically.
//   Default pool size formula: (num_physical_cpus * 2) + 1
//   2 CPUs → 5 connections, 4 CPUs → 9 connections.
//
//   Configure via connection string:
//   DATABASE_URL="postgresql://user:pass@host/db?connection_limit=10&pool_timeout=30"
//
//   connection_limit: max connections in the pool
//   pool_timeout:     seconds to wait for a free connection (throw if exceeded)
//
// "TOO MANY CONNECTIONS" ERROR:
//   PostgreSQL has a max_connections limit (default: 100).
//   If you have 20 app instances × 10 connections each = 200 connections → error.
//
//   Solutions:
//   1. Reduce connection_limit per instance
//   2. Use PgBouncer (connection pooler) between app and Postgres:
//      App → PgBouncer (multiplexes N connections) → Postgres (fewer connections)
//      With transaction-mode pooling: 200 app connections can share 10 DB connections.
//   3. Use Neon/Supabase Pooler (hosted PgBouncer)
//
// REDIS CONNECTION:
//   ioredis/node-redis also maintain connection pools.
//   Default: 1 connection (sufficient for most apps — Redis is very fast).
//   For high-throughput apps, increase maxRetriesPerRequest and connection pool size.

function printConnectionPoolReference(): void {
  console.log('═══ SECTION 2: CONNECTION POOL REFERENCE ═══\n');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  console.log('Prisma default pool: (cpus * 2) + 1 =', (require('os').cpus().length * 2 + 1));
  console.log('Tune via: DATABASE_URL="...?connection_limit=10&pool_timeout=30"');
  console.log('For high concurrency: use PgBouncer in front of Postgres\n');
}

// ──────────────────────────────────────────────────────────────
// SECTION 3 — EVENT LOOP LAG DETECTION
// ──────────────────────────────────────────────────────────────
//
// THE EVENT LOOP:
//   Node.js is single-threaded. The event loop processes one callback at a time.
//   If one callback takes 500ms (synchronous work), ALL other requests wait 500ms.
//   No parallelism. No preemption.
//
// SYMPTOMS OF A BLOCKED EVENT LOOP:
//   - All requests suddenly take much longer
//   - Health checks start failing (they queue behind the blocking code)
//   - Event loop lag > 10ms in monitoring tools
//
// COMMON CAUSES:
//   - JSON.parse / JSON.stringify on large objects (>1MB) — sync, blocks loop
//   - Synchronous crypto operations (crypto.pbkdf2Sync, bcrypt.compareSync)
//     → use the async versions: crypto.pbkdf2, bcrypt.compare
//   - fs.readFileSync inside a request handler
//   - Long-running loops (sorting 1M items, regex on large strings)
//   - Poorly written synchronous dependencies
//
// DETECTION PATTERN:
//   setImmediate() schedules a callback at the END of the current event loop tick.
//   Normally it runs in < 1ms.
//   If it runs in 50ms, something is blocking the loop for 50ms.
//   Measuring the gap between scheduling setImmediate and it running = event loop lag.

let isMonitoring = false;

function startEventLoopMonitoring(intervalMs = 1000, warnThresholdMs = 50): () => void {
  isMonitoring = true;
  console.log('═══ SECTION 3: EVENT LOOP LAG DETECTION ═══\n');
  console.log(`Monitoring event loop lag every ${intervalMs}ms...`);

  const handle = setInterval(() => {
    if (!isMonitoring) return;

    const start = Date.now();

    setImmediate(() => {
      const lag = Date.now() - start;

      if (lag > warnThresholdMs) {
        console.warn(`[PERF] Event loop lag: ${lag}ms — something is blocking the loop!`);
        console.warn('Common causes: JSON.parse on large data, sync crypto, fs.readFileSync');
      } else {
        console.log(`Event loop lag: ${lag}ms (healthy)`);
      }
    });
  }, intervalMs);

  // Return a cleanup function
  return () => {
    isMonitoring = false;
    clearInterval(handle);
  };
}

// Demonstrate a blocked event loop
function demonstrateBlockedEventLoop(): void {
  console.log('\nSimulating a blocked event loop (deliberate blocking work)...');

  // This blocks the event loop for ~100ms — nothing else can run during this time
  const start = Date.now();
  // CPU-intensive synchronous work (simulating a long sort or JSON.parse)
  let sum = 0;
  for (let i = 0; i < 100_000_000; i++) {
    sum += i;
  }
  const elapsed = Date.now() - start;
  console.log(`Blocking work took ${elapsed}ms. Sum: ${sum}`);
  console.log('During this time, ALL other requests were queued.\n');
}

// ──────────────────────────────────────────────────────────────
// SECTION 4 — MEMORY LEAK PATTERNS AND DETECTION
// ──────────────────────────────────────────────────────────────
//
// A memory leak = objects that are no longer needed but can't be garbage collected
// because something still holds a reference to them.
//
// COMMON LEAK PATTERNS:
// ─────────────────────
// 1. GLOBAL CACHE WITH NO EVICTION:
//    const cache = new Map(); // grows forever — never cleared
//    cache.set(userId, bigUserObject); // 10MB per user, 1000 users = 10GB
//    Fix: use an LRU cache (evicts least-recently-used when full)
//         or set a TTL and clear expired entries
//
// 2. EVENT LISTENERS NOT REMOVED:
//    emitter.on('data', bigHandler); // every time this code runs, adds another listener
//    // If run in a loop (middleware for each request), you add 1000s of listeners
//    Fix: emitter.once() for one-time listeners
//         emitter.removeListener() or emitter.off() when done
//
// 3. CLOSURES CAPTURING LARGE OBJECTS:
//    function makeHandler(bigData: Buffer) {
//      return function() { // bigData is captured in the closure
//        return bigData.length; // even though we only need .length
//      };
//    }
//    Fix: extract only what you need: const len = bigData.length; return () => len;
//
// 4. TIMERS NOT CLEARED:
//    setInterval(() => doWork(ref), 1000); // ref is kept alive by the interval
//    Fix: clearInterval(handle) when you no longer need the interval
//
// DETECTION:
// ──────────
//   process.memoryUsage() returns:
//     heapUsed:  currently used heap memory (your objects)
//     heapTotal: heap memory allocated by V8 (>= heapUsed)
//     rss:       total resident set size (heap + stack + code)
//     external:  memory used by C++ objects bound to JavaScript
//
//   If heapUsed grows steadily over hours without leveling off → likely a leak.
//   (Some growth is normal — V8 delays GC for performance.)
//
//   Advanced: use --inspect flag + Chrome DevTools → heap snapshots.
//   Take a snapshot, do 1000 requests, take another snapshot.
//   Compare: objects that grew show the leak source.

function demonstrateMemoryLeak(): void {
  console.log('═══ SECTION 4: MEMORY LEAK DETECTION ═══\n');

  // Show current memory usage
  const mem = process.memoryUsage();
  console.log('Current memory usage:');
  console.log(`  heapUsed:  ${Math.round(mem.heapUsed / 1024 / 1024)}MB`);
  console.log(`  heapTotal: ${Math.round(mem.heapTotal / 1024 / 1024)}MB`);
  console.log(`  rss:       ${Math.round(mem.rss / 1024 / 1024)}MB`);

  // Demonstrate a leak pattern (and immediately fix it)
  const leakyCache = new Map<string, number[]>();
  for (let i = 0; i < 1000; i++) {
    leakyCache.set(`key-${i}`, new Array(1000).fill(i)); // ~4MB of data
  }
  const afterLeak = process.memoryUsage();
  console.log(`\nAfter allocating 1000 cache entries:`);
  console.log(`  heapUsed:  ${Math.round(afterLeak.heapUsed / 1024 / 1024)}MB`);

  // Fix: clear the cache
  leakyCache.clear();
  // Force GC (only available with --expose-gc flag — not for production use)
  // In production, V8 will GC on its own schedule.
  console.log('\nCache cleared. V8 will GC the memory on its next collection cycle.');
  console.log(
    'Use LRU cache (npm: lru-cache) for bounded caches that evict old entries automatically.\n'
  );
}

// ──────────────────────────────────────────────────────────────
// SECTION 5 — RESPONSE COMPRESSION REFERENCE
// ──────────────────────────────────────────────────────────────
//
// HTTP responses can be compressed with gzip or Brotli before sending.
// The client (browser, API consumer) decompresses transparently.
//
// TYPICAL SAVINGS:
//   JSON API response (5KB) → compressed to ~1.5KB (70% smaller)
//   HTML page (50KB)         → compressed to ~15KB (70% smaller)
//
// CPU cost: negligible for JSON (<1ms per response) — worth it almost always.
//
// HOW TO ENABLE:
//   npm install compression @types/compression
//   import compression from 'compression';
//   app.use(compression());  // gzip by default
//
// Brotli (better compression, slower): use shrink-ray-current or configure manually.
//
// WHEN NOT TO COMPRESS:
//   - Images (JPEG/PNG/WebP are already compressed — re-compressing wastes CPU)
//   - Video, audio, zip files (same reason)
//   - Very small responses (<1KB) — compression overhead may exceed savings
//
// The 'compression' middleware skips these automatically based on Content-Type.
//
// HTTP CACHING (complementary to compression):
//   Cache-Control: public, max-age=3600  → CDN + browser caches for 1 hour
//   ETag: "abc123"                       → hash of the response body
//   If-None-Match: "abc123"              → client sends its cached hash
//   Server returns: 304 Not Modified     → client uses its cache (no body = fast!)
//
// This is "free" performance — no additional infrastructure needed.

function printCompressionReference(): void {
  console.log('═══ SECTION 5: RESPONSE COMPRESSION ═══\n');
  console.log('Enable with: app.use(require("compression")())');
  console.log('Typical savings: 60-80% for JSON/HTML responses');
  console.log('Skip for: images, video, already-compressed formats\n');
  console.log('HTTP Cache headers:');
  console.log('  Cache-Control: public, max-age=3600  (cache for 1 hour)');
  console.log('  ETag: hash(responseBody)             (conditional GET support)\n');
}

// ──────────────────────────────────────────────────────────────
// SECTION 6 — CACHING STRATEGIES REFERENCE
// ──────────────────────────────────────────────────────────────
//
// Caching is trading storage for speed: pay once to compute, serve many times.
// Every cache involves a trade-off: freshness vs speed.
//
// CACHE LEVELS (fastest to slowest):
// ────────────────────────────────────
//
// 1. IN-MEMORY CACHE (fastest: < 1ms):
//    const cache = new Map<string, { data: T; expiresAt: number }>();
//    Works for: single-instance apps, ephemeral data
//    Drawbacks: lost on restart, not shared between multiple instances
//    Use for: computationally expensive operations, per-process rate limiting
//
// 2. REDIS CACHE (fast: ~1-2ms):
//    await redis.set(key, JSON.stringify(data), 'EX', 60); // TTL = 60 seconds
//    await redis.get(key); // returns null if expired or missing
//    Works for: multi-instance apps, shared cache, session storage
//    Use for: database query results, rendered page fragments, rate limiting
//
// 3. HTTP CACHE (free: 0ms if hit):
//    res.setHeader('Cache-Control', 'public, max-age=3600');
//    Browser and CDN (Cloudflare, Fastly) cache the response.
//    When the TTL expires, the client makes a conditional request (If-None-Match).
//    If unchanged: 304 Not Modified (no body) — minimal bandwidth.
//    Use for: public API responses, static assets, shared data
//
// WHICH STRATEGY TO USE:
// ──────────────────────
//   User-specific data      → Redis (can invalidate per user: del user:${id}:*)
//   Public/shared data      → HTTP cache (CDN serves it) + Redis fallback
//   Fast-changing data      → short TTL (30s) or no cache
//   Slow-changing data      → long TTL (hours/days) + invalidate on write
//   Computed results        → in-memory for single instance, Redis for multiple
//
// CACHE INVALIDATION (the hard part):
//   "There are only two hard things in CS: cache invalidation and naming things." — Knuth
//
//   Strategies:
//   TTL (time-to-live):     cache expires after N seconds — simple, stale data possible
//   Write-through:          on write, update both DB and cache simultaneously
//   Write-behind:           on write, update cache immediately, async write to DB
//   Cache-aside:            check cache first, miss → load from DB, write to cache
//   Event-driven:           on DB write event, delete/update relevant cache keys

function demonstrateCachingStrategies(): void {
  console.log('═══ SECTION 6: CACHING STRATEGIES ═══\n');

  // Simple in-memory cache implementation with TTL
  function createTTLCache<T>(defaultTtlMs: number) {
    const store = new Map<string, { value: T; expiresAt: number }>();

    return {
      get(key: string): T | null {
        const entry = store.get(key);
        if (!entry) return null;
        if (Date.now() > entry.expiresAt) {
          store.delete(key); // lazy expiration
          return null;
        }
        return entry.value;
      },

      set(key: string, value: T, ttlMs = defaultTtlMs): void {
        store.set(key, { value, expiresAt: Date.now() + ttlMs });
      },

      delete(key: string): void {
        store.delete(key);
      },

      size(): number {
        return store.size;
      },
    };
  }

  const cache = createTTLCache<string>(5000); // 5 second TTL

  cache.set('user:1', 'Alice');
  console.log('Cache set user:1 = Alice');
  console.log('Cache get user:1:', cache.get('user:1'));
  console.log('Cache get user:2 (miss):', cache.get('user:2'));
  console.log('Cache size:', cache.size());
  console.log('\nFor production: use lru-cache npm package for LRU eviction policy');
  console.log('For distributed: use ioredis or node-redis\n');
}

// ──────────────────────────────────────────────────────────────
// SECTION 7 — BENCHMARK: CACHED VS UNCACHED
// ──────────────────────────────────────────────────────────────
//
// Demonstrates the real performance difference between:
//   - Computing a result every time (uncached)
//   - Caching the result in memory (cached)
//
// This is a microbenchmark — real-world gains depend on the operation.
// DB queries (I/O-bound): 10-100x faster with cache
// CPU computation (CPU-bound): depends on how expensive the operation is

async function benchmarkCachedVsUncached(): Promise<void> {
  console.log('═══ SECTION 7: BENCHMARK — CACHED VS UNCACHED ═══\n');

  // Simulate an "expensive" operation: fetching user data with a 10ms delay
  async function expensiveDatabaseQuery(userId: number): Promise<{ id: number; name: string; score: number }> {
    await new Promise((resolve) => setTimeout(resolve, 10)); // simulate DB latency
    return { id: userId, name: `User ${userId}`, score: Math.random() * 100 };
  }

  const cache = new Map<number, { id: number; name: string; score: number }>();
  const ITERATIONS = 20;
  const USER_ID = 42;

  // UNCACHED: call the database every time
  const uncachedStart = process.hrtime.bigint();
  for (let i = 0; i < ITERATIONS; i++) {
    await expensiveDatabaseQuery(USER_ID);
  }
  const uncachedDuration = Number(process.hrtime.bigint() - uncachedStart) / 1_000_000;

  // CACHED: call the database once, serve from cache
  const cachedStart = process.hrtime.bigint();
  for (let i = 0; i < ITERATIONS; i++) {
    if (!cache.has(USER_ID)) {
      const data = await expensiveDatabaseQuery(USER_ID);
      cache.set(USER_ID, data);
    }
    cache.get(USER_ID); // serve from cache
  }
  const cachedDuration = Number(process.hrtime.bigint() - cachedStart) / 1_000_000;

  console.log(`${ITERATIONS} requests, simulating 10ms DB latency:`);
  console.log(`  Uncached: ${Math.round(uncachedDuration)}ms total`);
  console.log(`  Cached:   ${Math.round(cachedDuration)}ms total`);
  console.log(`  Speedup:  ${(uncachedDuration / cachedDuration).toFixed(1)}x faster`);
  console.log(
    `\nCache hit rate: ${ITERATIONS - 1}/${ITERATIONS} = ${(((ITERATIONS - 1) / ITERATIONS) * 100).toFixed(0)}% (only 1 DB query for ${ITERATIONS} requests)`
  );
}

// ──────────────────────────────────────────────────────────────
// MAIN — RUN ALL SECTIONS
// ──────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║   DAY 55 — PERFORMANCE OPTIMIZATION DEMONSTRATIONS   ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');

  // Section 1: N+1 detection
  demonstrateN1Problem();

  // Section 2: Connection pool reference
  printConnectionPoolReference();

  // Section 3: Event loop monitoring (run briefly then stop)
  const stopMonitoring = startEventLoopMonitoring(500, 50);
  await new Promise((resolve) => setTimeout(resolve, 600)); // let it measure once
  stopMonitoring();
  demonstrateBlockedEventLoop();

  // Section 4: Memory leak detection
  demonstrateMemoryLeak();

  // Section 5: Compression reference
  printCompressionReference();

  // Section 6: Caching strategies
  demonstrateCachingStrategies();

  // Section 7: Benchmark
  await benchmarkCachedVsUncached();

  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║                All demonstrations complete            ║');
  console.log('╚══════════════════════════════════════════════════════╝');
}

// Run if called directly
void main();
