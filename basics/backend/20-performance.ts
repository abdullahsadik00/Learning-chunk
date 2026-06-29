// ═══════════════════════════════════════════════════════════════
// BACKEND 20: PERFORMANCE OPTIMIZATION · N+1 DETECTION · CONNECTION POOLING · MEMORY LEAKS  (Day 55)
// Run: npx ts-node 20-performance.ts
// ═══════════════════════════════════════════════════════════════
//
// Performance is not about making code fast by default.
// It's about measuring to find the real bottleneck, then fixing it.
//
//  • "Premature optimization is the root of all evil" — Knuth
//  • Most apps spend 80% of time in 20% of code — find that 20% first
//  • Database is almost always the bottleneck, not the Node.js code
//  • CPU and memory problems are fundamentally different — diagnose first

// ───────────────────────────────────────────────────────────────
// 1. Measure Before Optimizing
// ───────────────────────────────────────────────────────────────

console.log("=== 1. Measure Before Optimizing ===");

/*
  PROFILING TOOLS FOR NODE.JS
  ────────────────────────────
  clinic.js (most practical for day-to-day)
    npm install -g clinic
    clinic doctor   -- node server.js    → detects event loop blocking, memory, I/O
    clinic flame    -- node server.js    → CPU flame graph (which function costs most)
    clinic bubbleprof -- node server.js  → async operation visualization
    https://clinicjs.org

  node --prof (built-in V8 profiler)
    node --prof server.js          → creates isolate-*.log
    node --prof-process isolate-*.log > processed.txt
    Opens in Chrome DevTools as flame chart

  0x (flamegraph generator, simpler than --prof)
    npm install -g 0x
    0x server.js                   → opens browser with interactive flamegraph

  Chrome DevTools for Node.js
    node --inspect server.js       → opens chrome://inspect
    CPU Profiler tab → record 30s → stop → see flamegraph
    Memory tab → take heap snapshot → compare snapshots over time

  process.hrtime.bigint() — nanosecond precision micro-benchmarking
    Built-in, no library needed. Use for tight loops and function-level timing.
*/

// Micro-benchmarking with process.hrtime.bigint()
function microBenchmark(label: string, fn: () => void, iterations = 10_000): void {
    const start = process.hrtime.bigint();
    for (let i = 0; i < iterations; i++) {
        fn();
    }
    const end = process.hrtime.bigint();
    const totalMs = Number(end - start) / 1_000_000;
    const perOpNs  = Number(end - start) / iterations;
    console.log(`  [${label}] ${totalMs.toFixed(2)}ms total | ${perOpNs.toFixed(0)}ns per op`);
}

// Compare two approaches before deciding which to optimize
microBenchmark("string concat with +", () => {
    let s = "";
    for (let i = 0; i < 100; i++) s += i;
});

microBenchmark("string concat with array join", () => {
    const parts: string[] = [];
    for (let i = 0; i < 100; i++) parts.push(String(i));
    parts.join("");
});

/*
  KEY LESSON: measure BOTH before assuming one is faster.
  In V8, string concatenation with + is often JIT-optimized to be comparable.
  Without measurement, you'd waste time on a micro-optimization that doesn't matter.

  PROFILING WORKFLOW
  ──────────────────
  1. Run the app under realistic load (use autocannon, wrk, or k6 for HTTP load)
     autocannon -c 100 -d 30 http://localhost:3000/api/users
  2. Collect a profile during the load test (clinic flame or --inspect)
  3. Find the top function in the flame chart
  4. Optimize only that function
  5. Re-measure: confirm the improvement
  6. Repeat
*/

// ───────────────────────────────────────────────────────────────
// 2. N+1 Detection and Fixing
// ───────────────────────────────────────────────────────────────

console.log("\n=== 2. N+1 Detection and Fixing ===");

/*
  WHAT IS THE N+1 PROBLEM?
  ────────────────────────
  You fetch N records, then for each record you fire another query.
  Result: 1 + N queries instead of 1 or 2.

  Example: fetch 100 orders, then for each order fetch the user.
  → 101 queries instead of 1 JOIN or 2 queries.

  HOW TO SPOT IT IN LOGS
  ──────────────────────
  You see a pattern like this in Prisma query logs or pg logs:
    SELECT * FROM "User" WHERE "id" = '1'   -- executed at 12:00:00.001
    SELECT * FROM "User" WHERE "id" = '2'   -- executed at 12:00:00.002
    SELECT * FROM "User" WHERE "id" = '3'   -- executed at 12:00:00.003
    ...100 times...

  All identical structure, fired in rapid succession. That's N+1.

  ENABLE PRISMA QUERY LOGGING
  ───────────────────────────
  const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });
  Every query prints to console with duration. N+1 is immediately visible.
*/

// PATTERN 1: THE PROBLEM — sequential await in a loop (N+1)
async function getUsersWithPostsBad_SIMULATED(): Promise<void> {
    // Simulated: imagine prisma.post.findMany() inside the loop
    const userIds = [1, 2, 3, 4, 5]; // fetched with 1 query

    const results: Array<{ userId: number; postCount: number }> = [];
    for (const userId of userIds) {
        // THIS IS THE N+1: one DB query PER user
        // const posts = await prisma.post.findMany({ where: { authorId: userId } });
        const posts = await simulateDbQuery(userId); // simulated
        results.push({ userId, postCount: posts.length });
    }
    console.log("  N+1 result (simulated):", results.length, "users processed with N+1 queries");
}

// PATTERN 2: FIX A — Prisma include (eager loading)
/*
  // Instead of:
  const users = await prisma.user.findMany();
  for (const user of users) {
    const posts = await prisma.post.findMany({ where: { authorId: user.id } });
  }

  // Do this — ONE query with a JOIN under the hood:
  const users = await prisma.user.findMany({
    include: {
      posts: true,           // eager load all posts
      // or with selection:
      posts: {
        select: { id: true, title: true },  // only what you need
        where: { published: true },          // filter at DB level
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
    },
  });
  // users[0].posts is now populated — no extra queries
*/

// PATTERN 3: FIX B — Promise.all for independent parallel queries
async function getIndependentDataFast(): Promise<void> {
    // BAD: sequential (total time = a + b + c)
    // const users    = await prisma.user.count();
    // const products = await prisma.product.count();
    // const orders   = await prisma.order.count();

    // GOOD: parallel (total time = max(a, b, c))
    const [users, products, orders] = await Promise.all([
        simulateDbQuery(1), // prisma.user.count()
        simulateDbQuery(2), // prisma.product.count()
        simulateDbQuery(3), // prisma.order.count()
    ]);
    console.log("  Parallel queries done:", users.length, products.length, orders.length);
}

// PATTERN 4: FIX C — DataLoader (batch + deduplicate within a request)
/*
  DataLoader is the canonical solution when you CAN'T use include (e.g. GraphQL resolvers).
  npm install dataloader

  import DataLoader from 'dataloader';

  // Create ONE loader per request (not per server start)
  const userLoader = new DataLoader(async (userIds: readonly number[]) => {
    // One query for ALL requested IDs
    const users = await prisma.user.findMany({
      where: { id: { in: userIds as number[] } },
    });
    // Must return results in the SAME ORDER as the input IDs
    const userMap = new Map(users.map(u => [u.id, u]));
    return userIds.map(id => userMap.get(id) ?? null);
  });

  // Now anywhere in your resolvers:
  const user = await userLoader.load(post.authorId);
  // DataLoader batches all .load() calls in the same tick into ONE DB query
  // It also deduplicates: if two resolvers both load user #42, only one DB hit

  ATTACH TO REQUEST CONTEXT (e.g. Express):
  app.use((req, res, next) => {
    req.loaders = { user: createUserLoader() };
    next();
  });
*/

// Helper for simulation
function simulateDbQuery(id: number): Promise<{ id: number }[]> {
    return Promise.resolve([{ id }]);
}

// ───────────────────────────────────────────────────────────────
// 3. Database Performance
// ───────────────────────────────────────────────────────────────

console.log("\n=== 3. Database Performance ===");

/*
  SLOW QUERY LOG (PostgreSQL)
  ───────────────────────────
  In postgresql.conf:
    log_min_duration_statement = 100   # log queries slower than 100ms
    log_statement = 'none'             # don't log all statements
  Or per-session:
    SET log_min_duration_statement = 100;

  Check logs: sudo tail -f /var/log/postgresql/postgresql-*.log
  Managed DB (RDS, Supabase): use their slow query dashboard.

  EXPLAIN ANALYZE — reading the output
  ────────────────────────────────────
  EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'a@b.com';

  Example BAD output:
    Seq Scan on users  (cost=0.00..12500.00 rows=1 width=200)
                       (actual time=85.234..85.234 rows=1 loops=1)
      Filter: (email = 'a@b.com')
      Rows Removed by Filter: 499999

  "Seq Scan" = reading EVERY row, then filtering. On 500k rows = slow.
  "Rows Removed by Filter: 499999" = nearly the whole table scanned.

  Example GOOD output (after CREATE INDEX):
    Index Scan using users_email_idx on users
      (cost=0.42..8.44 rows=1 width=200)
      (actual time=0.045..0.045 rows=1 loops=1)
      Index Cond: (email = 'a@b.com')

  Now it jumps straight to the row. Microseconds instead of 85ms.

  INDEXING RULES
  ──────────────
  Create an index on columns used in WHERE, JOIN ON, ORDER BY.
    CREATE INDEX CONCURRENTLY users_email_idx ON users(email);
    -- CONCURRENTLY = doesn't lock the table (safe in production)

  Covering index — include columns used in SELECT too, so the DB
  never touches the main table (index-only scan):
    CREATE INDEX orders_user_status_idx ON orders(user_id, status)
      INCLUDE (total, created_at);
    -- A query: WHERE user_id = ? AND status = 'active'
    --           SELECT total, created_at
    -- can be answered entirely from the index

  AVOID SELECT *
  ──────────────
  SELECT * transfers all columns over the network and prevents covering indexes.
  Always name the columns you actually need.
  In Prisma: use select: { id: true, email: true } instead of include: true on large models.

  AVOID FUNCTIONS ON INDEXED COLUMNS
  ───────────────────────────────────
  BAD — the index on email is UNUSED because the function wraps the column:
    WHERE LOWER(email) = 'alice@example.com'

  PostgreSQL must compute LOWER(email) for every row → seq scan.

  FIX 1 — Functional index (index the expression itself):
    CREATE INDEX users_lower_email_idx ON users(LOWER(email));
    Now WHERE LOWER(email) = 'alice@example.com' uses the index.

  FIX 2 — Store data normalized (always store email in lowercase at insert).
    Then a plain index on email works fine.

  QUERY PLAN CACHING
  ──────────────────
  PostgreSQL caches prepared statement plans after 5 executions.
  This means the planner picks a plan once and reuses it — great for
  stable queries, but can bite you if data distribution changes drastically.
  DISCARD ALL or connection recycling clears the plan cache.
  Prisma's @db.Char vs @db.VarChar matters here — use parameterized queries
  always (Prisma does this automatically, raw SQL via $queryRaw does too).
*/

// Demonstrate timing a simulated "slow" vs "fast" query pattern
async function demonstrateQueryTiming(): Promise<void> {
    const start1 = process.hrtime.bigint();
    // Simulated seq scan (loop over all rows)
    const allRows = Array.from({ length: 500_000 }, (_, i) => ({ id: i, email: `user${i}@example.com` }));
    const found = allRows.find(r => r.email === "user499999@example.com");
    const end1 = process.hrtime.bigint();

    const start2 = process.hrtime.bigint();
    // Simulated index lookup (Map = O(1))
    const indexedRows = new Map(allRows.map(r => [r.email, r]));
    const foundFast = indexedRows.get("user499999@example.com");
    const end2 = process.hrtime.bigint();

    console.log(`  Seq scan sim:   ${Number(end1 - start1) / 1_000_000}ms → found: ${!!found}`);
    console.log(`  Index sim:      ${Number(end2 - start2) / 1_000_000}ms → found: ${!!foundFast}`);
    console.log("  (A real DB index is even faster — no JS overhead)");
}

await demonstrateQueryTiming();

// ───────────────────────────────────────────────────────────────
// 4. Connection Pooling
// ───────────────────────────────────────────────────────────────

console.log("\n=== 4. Connection Pooling ===");

/*
  WHY CONNECTIONS ARE EXPENSIVE
  ──────────────────────────────
  A PostgreSQL connection = a process forked by the postmaster.
  Each connection uses ~5–10MB of RAM on the DB server.
  TCP handshake + authentication + SSL negotiation = ~50–200ms per new connection.
  PostgreSQL defaults to max_connections = 100. Once exhausted, new connections fail.

  Without pooling: each HTTP request opens a connection, uses it, closes it.
  With pooling: a set of connections are kept open and shared across requests.
  Result: 10ms connection checkout instead of 150ms new connection.

  pg POOL CONFIGURATION
  ──────────────────────
  import { Pool } from 'pg';

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,                    // maximum simultaneous connections (default: 10)
    idleTimeoutMillis: 30_000, // close idle connections after 30s
    connectionTimeoutMillis: 2_000, // fail if no connection available in 2s
    // (2s timeout prevents indefinite queueing — triggers 503 to client)
  });

  // Use:
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM users WHERE id = $1', [userId]);
    return result.rows[0];
  } finally {
    client.release(); // ALWAYS release — or the pool starves
  }

  // Or shorthand for single queries:
  const result = await pool.query('SELECT NOW()');

  PRISMA'S BUILT-IN POOL (Prisma Client)
  ───────────────────────────────────────
  Prisma uses its own connection pool via the query engine (Rust binary).
  Default pool size = (cpu_cores * 2) + 1

  Override in schema.prisma:
    datasource db {
      provider = "postgresql"
      url      = env("DATABASE_URL")
      // Append pool params to the URL:
    }

  Or via URL:
    DATABASE_URL="postgresql://user:pass@host/db?connection_limit=20&pool_timeout=10"
    connection_limit → max connections in pool
    pool_timeout     → seconds to wait for connection before error

  PGBOUNCER — EXTERNAL POOLER
  ────────────────────────────
  PgBouncer sits between your app and PostgreSQL.
  Benefit: your app can have 1000 connections to PgBouncer,
           while PgBouncer maintains only 20 real DB connections.

  Two modes:
  ┌─────────────────┬────────────────────────────────────────────┐
  │ Transaction mode │ Connection returned to pool after each     │
  │  (default/best) │ transaction. Works with Prisma. Best for   │
  │                 │ typical web APIs.                           │
  ├─────────────────┼────────────────────────────────────────────┤
  │ Session mode    │ Connection held for the entire client       │
  │                 │ session. Required for SET, LISTEN, cursors. │
  │                 │ Provides no real pooling benefit.           │
  └─────────────────┴────────────────────────────────────────────┘

  Run PgBouncer in Docker:
    docker run -e DATABASE_URL=... -p 5432:5432 edoburu/pgbouncer

  POOL EXHAUSTION SYMPTOMS
  ─────────────────────────
  • Requests queue up and eventually time out
  • Error: "connection timeout" or "too many connections"
  • DB CPU is low but app latency is high (waiting for connection, not DB work)
  • monitor: SELECT count(*) FROM pg_stat_activity; in the DB

  POOL SIZING FORMULA
  ────────────────────
  Rule of thumb (from PgBouncer docs and Percona research):
    pool_size = (number_of_cpu_cores × 2) + effective_spindle_count

  For a 4-core SSD server: (4 × 2) + 1 = 9 → round to 10
  For a 16-core SSD server: (16 × 2) + 1 = 33 → use 30–40

  Do NOT set it to 100+ by default. More connections = more lock contention
  and context switching overhead on the DB server. Benchmark to confirm.

  One process, multiple pools:
  Each microservice / Node.js process gets its own pool.
  If you have 4 PM2 workers each with pool max=10, total DB connections = 40.
  Account for ALL processes when sizing PostgreSQL max_connections.
*/

// Demonstrate pool checkout simulation
class SimplePool {
    private available: number;
    private waiting: Array<() => void> = [];

    constructor(private readonly max: number) {
        this.available = max;
    }

    async acquire(): Promise<() => void> {
        if (this.available > 0) {
            this.available--;
            return () => this.release();
        }
        // No connection available — queue the request
        return new Promise((resolve) => {
            this.waiting.push(() => {
                this.available--;
                resolve(() => this.release());
            });
        });
    }

    private release(): void {
        this.available++;
        const next = this.waiting.shift();
        if (next) next();
    }

    status(): string {
        return `available: ${this.available}/${this.max}, waiting: ${this.waiting.length}`;
    }
}

const pool = new SimplePool(3);
console.log("  Pool status (initial):", pool.status());

// Simulate 5 concurrent requests competing for 3 connections
const tasks = Array.from({ length: 5 }, async (_, i) => {
    const release = await pool.acquire();
    console.log(`  Task ${i + 1} acquired connection. Pool: ${pool.status()}`);
    await new Promise(r => setTimeout(r, 10)); // simulate query
    release();
    console.log(`  Task ${i + 1} released. Pool: ${pool.status()}`);
});

await Promise.all(tasks);

// ───────────────────────────────────────────────────────────────
// 5. Node.js Performance
// ───────────────────────────────────────────────────────────────

console.log("\n=== 5. Node.js Performance ===");

/*
  THE EVENT LOOP AND BLOCKING
  ────────────────────────────
  Node.js has ONE thread for JavaScript. The event loop handles all I/O callbacks.
  If your JavaScript runs for a long time (CPU work), NOTHING ELSE can run.

  Example: a 5-second image resize blocks ALL incoming HTTP requests for 5 seconds.
  Even if 100 requests come in while it's running, they queue up.

  This is why Node.js is great for I/O-bound work (DB queries, HTTP calls)
  and needs special handling for CPU-bound work (image processing, crypto, compression).

  WORKER THREADS — CPU WORK IN PARALLEL
  ──────────────────────────────────────
  import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';

  // In the main thread:
  if (isMainThread) {
    function runInWorker(data: unknown): Promise<unknown> {
      return new Promise((resolve, reject) => {
        const worker = new Worker(__filename, { workerData: data });
        worker.on('message', resolve);
        worker.on('error', reject);
        worker.on('exit', (code) => {
          if (code !== 0) reject(new Error(`Worker exited with code ${code}`));
        });
      });
    }

    // Usage: offload CPU work to a worker thread
    const result = await runInWorker({ imagePath: '/uploads/photo.jpg' });
  } else {
    // Worker thread: do the CPU-intensive work
    const result = heavyImageProcessing(workerData.imagePath);
    parentPort?.postMessage(result);
  }

  WORKER THREAD POOL (better for production)
  ────────────────────────────────────────────
  Creating a new Worker per request is expensive.
  Use a pool: npm install piscina (Piscina = thread pool manager)

  import Piscina from 'piscina';
  const piscina = new Piscina({ filename: './worker.js', maxThreads: 4 });
  const result = await piscina.run({ imagePath });

  CHILD_PROCESS.FORK — ISOLATION
  ────────────────────────────────
  import { fork } from 'child_process';
  const child = fork('./heavy-task.js');
  child.send({ data: 'input' });
  child.on('message', (result) => { ... });
  // Separate process = separate memory, isolated crashes, separate V8 heap
  // Higher overhead than worker_threads (separate Node.js process)

  CLUSTER MODULE — MULTI-CORE HTTP
  ─────────────────────────────────
  import cluster from 'cluster';
  import os from 'os';

  if (cluster.isPrimary) {
    const numCPUs = os.cpus().length;
    for (let i = 0; i < numCPUs; i++) {
      cluster.fork(); // spawn one worker per CPU core
    }
    cluster.on('exit', (worker) => {
      cluster.fork(); // auto-restart crashed workers
    });
  } else {
    // Each worker runs the Express app independently
    app.listen(3000);
  }
  // OS kernel load-balances incoming connections across workers
  // 4 cores = 4 Node.js processes = 4x throughput for CPU-bound code

  PM2 CLUSTER MODE (easier than manual cluster)
  ───────────────────────────────────────────────
  pm2 start server.js --name api -i max   # -i max = one worker per CPU
  pm2 start server.js --name api -i 4     # exactly 4 workers
  pm2 reload api                          # zero-downtime reload

  HEAP LIMIT
  ──────────
  Node.js defaults to ~1.5GB heap on 64-bit systems.
  Increase for memory-hungry apps:
    node --max-old-space-size=4096 server.js   # 4GB heap limit
  Decrease for containers with limited RAM:
    node --max-old-space-size=512 server.js    # 512MB limit

  process.memoryUsage() — track heap in real time:
*/

function logMemoryUsage(label: string): void {
    const mem = process.memoryUsage();
    console.log(`  [${label}]`);
    console.log(`    heapUsed:  ${(mem.heapUsed  / 1024 / 1024).toFixed(2)} MB`);
    console.log(`    heapTotal: ${(mem.heapTotal / 1024 / 1024).toFixed(2)} MB`);
    console.log(`    rss:       ${(mem.rss       / 1024 / 1024).toFixed(2)} MB`);
    console.log(`    external:  ${(mem.external  / 1024 / 1024).toFixed(2)} MB`);
}

logMemoryUsage("before allocation");

// Allocate and immediately release (shows GC can collect)
{
    const tempData = Array.from({ length: 100_000 }, (_, i) => ({ id: i, value: Math.random() }));
    logMemoryUsage("during allocation");
    void tempData; // prevent optimizer from removing the allocation
}

// Note: GC hasn't run yet, so heapUsed may still show the allocated memory
logMemoryUsage("after block exit (pre-GC)");

// ───────────────────────────────────────────────────────────────
// 6. Memory Leaks in Node.js
// ───────────────────────────────────────────────────────────────

console.log("\n=== 6. Memory Leaks in Node.js ===");

/*
  WHAT IS A MEMORY LEAK?
  ──────────────────────
  Memory that your code no longer needs but the garbage collector cannot reclaim
  because a reference still exists. Node.js uses V8's mark-and-sweep GC.
  GC can only collect objects with NO reachable references from root objects
  (global, stack, closures). If you hold a reference anywhere, memory is never freed.

  SYMPTOM: heapUsed grows slowly over hours/days. Server eventually OOM-crashes.

  CAUSE 1: GLOBAL VARIABLES GROWING
  ────────────────────────────────────
  const cache: Map<string, object> = new Map();  // global — lives forever

  // Every request adds an entry, nothing removes old ones
  app.get('/user/:id', (req, res) => {
    cache.set(req.params.id, { data: largeObject });  // LEAK: cache never evicted
    res.json({ ok: true });
  });

  FIX: Use a bounded cache (LRU, TTL-based):
    import LRU from 'lru-cache';
    const cache = new LRU({ max: 1000, ttl: 1000 * 60 * 5 }); // 5 min TTL
*/

// Demonstrate the difference: unbounded vs bounded cache
class LeakyCache {
    private store = new Map<string, unknown>();

    set(key: string, value: unknown): void {
        this.store.set(key, value);  // grows forever
    }

    get size(): number { return this.store.size; }
}

class BoundedCache {
    private store = new Map<string, unknown>();

    constructor(private readonly maxSize: number) {}

    set(key: string, value: unknown): void {
        if (this.store.size >= this.maxSize) {
            // Evict oldest (first inserted in a Map)
            const firstKey = this.store.keys().next().value;
            if (firstKey !== undefined) this.store.delete(firstKey);
        }
        this.store.set(key, value);
    }

    get size(): number { return this.store.size; }
}

const leaky   = new LeakyCache();
const bounded = new BoundedCache(5);

for (let i = 0; i < 20; i++) {
    leaky.set(`key-${i}`, { data: i });
    bounded.set(`key-${i}`, { data: i });
}

console.log(`  Leaky cache size:   ${leaky.size}   (grows unbounded)`);
console.log(`  Bounded cache size: ${bounded.size} (capped at 5)`);

/*
  CAUSE 2: EVENT LISTENERS NOT REMOVED
  ─────────────────────────────────────
  EventEmitter has a default limit of 10 listeners per event.
  Exceeding it prints a warning (MaxListenersExceededWarning).
  The real leak: listeners hold closures, which hold variables in scope.

  BAD pattern (inside a request handler or per-connection setup):
    socket.on('data', (chunk) => {
      const processedData = process(chunk); // closure holds 'processedData'
    });
    // If socket.off('data', ...) never called, listener accumulates per-reconnect

  FIX: always call .off() or .removeListener(), use .once() for one-time events,
       use AbortController for async cancellation:

  const controller = new AbortController();
  emitter.on('data', handler, { signal: controller.signal }); // Node 18+
  // Later:
  controller.abort(); // removes listener automatically

  CAUSE 3: CLOSURES HOLDING REFERENCES
  ─────────────────────────────────────
  function createProcessor(largeBuffer: Buffer) {
    // largeBuffer (e.g. 50MB) is captured in the closure
    return function process(id: number) {
      return largeBuffer[id % largeBuffer.length]; // holds 50MB alive!
    };
  }
  const processor = createProcessor(Buffer.alloc(50 * 1024 * 1024));
  // Even if largeBuffer is no longer needed after setup,
  // 'processor' keeps it alive as long as 'processor' is referenced.

  FIX: Extract only what you need from the large object in the closure:
  function createProcessor(largeBuffer: Buffer) {
    const length = largeBuffer.length;  // only capture a number, not the Buffer
    return function process(id: number) { return id % length; };
  }

  CAUSE 4: setInterval WITHOUT clearInterval
  ───────────────────────────────────────────
  BAD:
    function startMonitoring() {
      const heavyObject = loadMetrics(); // holds reference
      setInterval(() => {
        console.log(heavyObject.stats); // closure keeps heavyObject alive
      }, 1000); // interval never cleared = heavyObject lives forever
    }

  FIX:
    const interval = setInterval(callback, 1000);
    // When done:
    clearInterval(interval);
    // Or use AbortController (Node 22+): setInterval(fn, ms, { signal })

  DETECTING MEMORY LEAKS
  ───────────────────────
  Method 1 — Heap snapshot comparison in Chrome DevTools:
    1. node --inspect server.js
    2. Open chrome://inspect → DevTools → Memory tab
    3. Take snapshot at t=0
    4. Run load test for 5 minutes
    5. Take snapshot at t=5min
    6. Compare: look for objects that grew significantly
    7. Click an object → "Retainers" pane shows WHY it wasn't collected

  Method 2 — memwatch-next (npm package):
    import memwatch from 'memwatch-next';
    memwatch.on('leak', (info) => {
      console.error('Memory leak detected:', info);
      // info: { before, after, change, reason }
    });

  Method 3 — process.memoryUsage() on an interval:
    setInterval(() => {
      const { heapUsed } = process.memoryUsage();
      console.log(new Date().toISOString(), 'heapUsed:', heapUsed / 1024 / 1024, 'MB');
    }, 30_000);
  Log to a file and grep for steady growth = leak.
*/

// Demonstrate listener leak detection pattern
import { EventEmitter } from "events";

const emitter = new EventEmitter();
emitter.setMaxListeners(5); // lower for demo — default is 10

function addListenerSafely(event: string, handler: () => void): () => void {
    emitter.on(event, handler);
    // Return a cleanup function — always call it when done
    return () => emitter.off(event, handler);
}

const cleanup1 = addListenerSafely("data", () => {});
const cleanup2 = addListenerSafely("data", () => {});
console.log("  Listener count:", emitter.listenerCount("data")); // 2

cleanup1();
cleanup2();
console.log("  After cleanup:", emitter.listenerCount("data")); // 0

// ───────────────────────────────────────────────────────────────
// 7. Caching Strategy for Performance
// ───────────────────────────────────────────────────────────────

console.log("\n=== 7. Caching Strategy for Performance ===");

/*
  WHAT TO CACHE
  ──────────────
  ✓ Expensive DB queries whose results change rarely (product catalogue, config)
  ✓ External API responses (exchange rates, weather, social graph)
  ✓ CPU-intensive computed values (rendered markdown, resized thumbnails)
  ✓ Aggregations that require scanning many rows (dashboard totals)

  WHAT NOT TO CACHE
  ──────────────────
  ✗ User-specific sensitive data in a shared cache (bank balance, PII)
  ✗ Data that changes on every request (session tokens, real-time stock ticks)
  ✗ Results that MUST be consistent (financial transactions, inventory counts at checkout)

  CACHE INVALIDATION STRATEGIES
  ──────────────────────────────
  TTL (time-to-live) — simplest: cache expires automatically after N seconds.
    redis.setex('products', 300, JSON.stringify(products)); // 5 min TTL

  Write-through — update cache immediately when DB changes.
    await prisma.product.update({ where: { id }, data: payload });
    await redis.setex(`product:${id}`, 300, JSON.stringify(updated));

  Event-driven invalidation — invalidate on specific events.
    When product is updated → publish 'product.updated' event → subscriber deletes cache key.
    More complex but very precise.

  HTTP CACHING HEADERS
  ─────────────────────
  Cache-Control: public, max-age=3600
    → CDN and browser can cache this response for 1 hour

  Cache-Control: private, max-age=0, must-revalidate
    → only browser can cache, must revalidate before using

  Cache-Control: no-store
    → never cache (use for sensitive data: banking, user-specific)

  ETag (entity tag) — content hash for conditional requests:
    Server sends:   ETag: "abc123"
    Browser sends:  If-None-Match: "abc123"  (on next request)
    Server checks: if content unchanged → 304 Not Modified (empty body, fast)
                   if content changed  → 200 with new body + new ETag

  Last-Modified / If-Modified-Since — same concept but time-based.
    Less precise than ETag (same-second updates can be missed).

  Express implementation:
*/

// In-process memoization — request-level cache (no Redis needed for per-request deduplication)
function createRequestCache<K, V>() {
    const cache = new Map<K, Promise<V>>();

    return {
        getOrFetch(key: K, fetcher: () => Promise<V>): Promise<V> {
            if (cache.has(key)) {
                return cache.get(key)!; // deduplicate concurrent fetches for same key
            }
            const promise = fetcher();
            cache.set(key, promise);
            promise.catch(() => cache.delete(key)); // don't cache errors
            return promise;
        },
        clear(): void {
            cache.clear();
        },
        size(): number {
            return cache.size;
        },
    };
}

// Usage: attach to req object, clear after response
const reqCache = createRequestCache<string, { id: number; name: string }>();

// Multiple places in the same request asking for the same user
const user1Promise = reqCache.getOrFetch("user:42", async () => {
    await new Promise(r => setTimeout(r, 1)); // simulate DB
    return { id: 42, name: "Alice" };
});
const user2Promise = reqCache.getOrFetch("user:42", async () => {
    // This fetcher is NEVER CALLED — returns the same promise as above
    return { id: 0, name: "should not appear" };
});

const [u1, u2] = await Promise.all([user1Promise, user2Promise]);
console.log("  Same promise returned:", u1 === u2); // true — one DB query
console.log("  Request cache size:", reqCache.size()); // 1

/*
  REDIS CACHING (recap from Day 44)
  ──────────────────────────────────
  import { createClient } from 'redis';
  const redis = createClient({ url: process.env.REDIS_URL });
  await redis.connect();

  async function getCachedUsers(): Promise<User[]> {
    const cached = await redis.get('all-users');
    if (cached) return JSON.parse(cached);

    const users = await prisma.user.findMany();
    await redis.setex('all-users', 300, JSON.stringify(users)); // cache 5 min
    return users;
  }

  Cache-aside is the most common pattern: check cache → on miss, fetch from DB + populate cache.
*/

// ───────────────────────────────────────────────────────────────
// 8. HTTP and API Performance
// ───────────────────────────────────────────────────────────────

console.log("\n=== 8. HTTP and API Performance ===");

/*
  COMPRESSION (gzip / brotli)
  ────────────────────────────
  For text responses (JSON, HTML, CSS, JS), compression typically reduces
  response size by 60–80%. Huge win for API responses with many records.

  npm install compression @types/compression

  import compression from 'compression';
  app.use(compression({
    level: 6,     // 1 (fast) to 9 (best compression). 6 is the sweet spot.
    threshold: 1024, // only compress responses > 1KB (small responses not worth it)
    filter: (req, res) => {
      // Don't compress already-compressed formats
      if (req.headers['x-no-compression']) return false;
      return compression.filter(req, res);
    },
  }));

  Client must send: Accept-Encoding: gzip, deflate, br
  Server responds with: Content-Encoding: gzip  (and the compressed body)

  Brotli (br) is 20-26% smaller than gzip but slower to compress.
  Use brotli for static assets (pre-compressed at build time).
  Use gzip for dynamic responses (real-time compression).

  KEEP-ALIVE CONNECTIONS
  ───────────────────────
  Without Keep-Alive: TCP handshake per request (slow for many small requests).
  With Keep-Alive: TCP connection is reused for multiple requests (default in HTTP/1.1).

  Express enables Keep-Alive automatically. Ensure your load balancer / reverse
  proxy (nginx) also enables it. Set a reasonable keepAliveTimeout:

  const server = app.listen(3000);
  server.keepAliveTimeout = 65_000;    // slightly longer than nginx's 60s default
  server.headersTimeout   = 66_000;    // must be > keepAliveTimeout

  HTTP/2 MULTIPLEXING
  ────────────────────
  HTTP/1.1: one request at a time per TCP connection (browsers open 6 connections to work around this).
  HTTP/2: many requests over one TCP connection simultaneously (multiplexed streams).
  No head-of-line blocking per request. Server push. Header compression (HPACK).

  Enable in Express with http2 or via nginx as an HTTP/2 terminator in front of Node.

  PAGINATION — NEVER RETURN UNBOUNDED LISTS
  ──────────────────────────────────────────
  BAD:
    GET /api/products  → returns all 500,000 products

  GOOD (cursor-based pagination — better for large datasets):
    GET /api/products?limit=20&cursor=eyJpZCI6MTAwfQ==
    Response: { data: [...20 items], nextCursor: "eyJpZCI6MTIwfQ==" }

  GOOD (offset pagination — simpler but slower on large pages):
    GET /api/products?page=3&pageSize=20
    Prisma: prisma.product.findMany({ skip: 40, take: 20 })

  SPARSE FIELDSETS — ONLY SEND WHAT THE CLIENT NEEDS
  ────────────────────────────────────────────────────
  GET /api/users?fields=id,name,email
  Server: select only those columns from DB, return only those fields in JSON.
  Reduces both DB and network work.

  In Prisma: select: { id: true, name: true, email: true }

  STREAMING LARGE RESPONSES
  ──────────────────────────
  BAD — buffer entire result in memory before sending:
    const rows = await prisma.event.findMany();          // 1M rows in memory
    res.json(rows);                                       // then send

  GOOD — stream rows as they arrive from the DB:
    import { pipeline } from 'stream/promises';
    const stream = await prisma.event.findManyRaw();     // streaming cursor
    res.setHeader('Content-Type', 'application/json');

    // Or use a Transform stream to convert rows to JSON lines:
    res.write('[');
    let first = true;
    for await (const row of prisma.event.findManyRaw({ batchSize: 1000 })) {
      if (!first) res.write(',');
      res.write(JSON.stringify(row));
      first = false;
    }
    res.end(']');
    // Memory used = 1 batch (1000 rows), not all 1M rows
*/

// Demonstrate response size reduction (simulated compression ratio)
function simulateCompression(data: object): void {
    const json = JSON.stringify(data);
    const originalBytes = Buffer.byteLength(json, "utf8");
    // Gzip achieves ~70% reduction for typical JSON
    const compressedEstimate = Math.round(originalBytes * 0.3);
    console.log(`  Original:    ${originalBytes.toLocaleString()} bytes`);
    console.log(`  Compressed:  ~${compressedEstimate.toLocaleString()} bytes (est. 70% reduction)`);
    console.log(`  Saved:       ~${(originalBytes - compressedEstimate).toLocaleString()} bytes per response`);
}

const sampleApiResponse = {
    users: Array.from({ length: 50 }, (_, i) => ({
        id: i,
        name: `User ${i}`,
        email: `user${i}@example.com`,
        role: i % 3 === 0 ? "admin" : "member",
        createdAt: new Date().toISOString(),
        address: { street: `${i} Main St`, city: "Springfield", country: "US" },
    })),
};

console.log("  Compression simulation for 50-user API response:");
simulateCompression(sampleApiResponse);

// ───────────────────────────────────────────────────────────────
// PRACTICE
// ───────────────────────────────────────────────────────────────

console.log("\n=== Practice ===");

// Q: You have a loop with `await prisma.user.findUnique()` called 50 times.
//    What's wrong and how do you fix it?
//
// A: This is the N+1 problem. You're firing 50 sequential DB queries,
//    one per iteration of the loop, giving total latency of 50 × query_time.
//    Two fixes depending on the use case:
//
//    FIX 1 (if all IDs are known upfront — most common):
//      const users = await prisma.user.findMany({
//        where: { id: { in: userIds } }  // ONE query, returns all 50
//      });
//
//    FIX 2 (if queries are independent and the caller doesn't control batching):
//      const users = await Promise.all(
//        userIds.map(id => prisma.user.findUnique({ where: { id } }))
//      );
//      // Fires all 50 in parallel — total time = max(query times), not sum.
//      // Still 50 DB round-trips but no sequential blocking.
//
//    FIX 3 (for GraphQL or recursive resolver patterns):
//      Use DataLoader to batch + deduplicate across resolver calls.

// Q: Your database has 10M rows and a query takes 8 seconds.
//    `EXPLAIN ANALYZE` shows `Seq Scan`. What do you do?
//
// A: A Seq Scan on a 10M-row table means the DB is reading every row.
//    Step 1: Look at the WHERE clause in your query — which column is it filtering on?
//    Step 2: Create an index on that column:
//      CREATE INDEX CONCURRENTLY orders_user_id_idx ON orders(user_id);
//    Step 3: Re-run EXPLAIN ANALYZE — should now show Index Scan.
//    Step 4: If the query also SELECTs a few specific columns, add a covering index:
//      CREATE INDEX CONCURRENTLY orders_covering_idx ON orders(user_id, status)
//        INCLUDE (total, created_at);
//    Step 5: Avoid functions on the indexed column (LOWER(), DATE(), etc.).
//      If needed, create a functional index instead.
//    After indexing, an 8-second query commonly drops to under 10ms.

// Q: Your Node.js server's memory grows from 200MB to 2GB over 24 hours.
//    What's the likely cause and how do you diagnose it?
//
// A: Symptoms point to a memory leak — objects are not being garbage collected.
//    Likely causes (in rough order of frequency):
//      1. Unbounded in-memory cache (Map/object growing without eviction)
//      2. Event listeners accumulating (not calling .off() or .removeListener())
//      3. Closures holding references to large objects
//      4. setInterval callbacks holding large objects in scope without clearInterval
//
//    Diagnosis steps:
//      1. Add process.memoryUsage() logging every 30s — confirm steady growth pattern.
//      2. Take heap snapshots in Chrome DevTools (node --inspect):
//           a. Snapshot at t=0
//           b. Snapshot at t=30min
//           c. Compare in DevTools — sort by "Delta" to see what grew
//      3. Look at the Retainers panel to see WHY the object is held in memory.
//      4. If it's a Map or Array, trace back who holds the reference to the collection.
//      5. Fix: add eviction (LRU, TTL), call .off() on listeners, clear intervals.

// Q: What's the difference between Prisma's built-in connection pool and PgBouncer?
//
// A: Prisma's built-in pool:
//      - Managed by the Prisma query engine (Rust process)
//      - Lives inside your Node.js application process
//      - Default size: (cpu_cores × 2) + 1
//      - Each Node.js worker process has its own pool
//      - Ideal for a single Node.js server or a few PM2 workers
//
//    PgBouncer:
//      - An external process sitting between your app and PostgreSQL
//      - Multiplexes many application connections onto few DB connections
//      - Useful when: many Node.js workers, many microservices, or serverless
//        functions where each invocation creates a new pool
//      - Transaction mode: connection returned to pool after each transaction —
//        best for typical web APIs (Prisma-compatible)
//      - Session mode: connection held for the client session — provides
//        no real multiplexing benefit, only useful for SET commands or LISTEN
//      - Use PgBouncer when you have hundreds of app instances and
//        PostgreSQL max_connections would be exhausted

// Q: A CPU-intensive image processing function takes 5 seconds and blocks
//    all other requests. How do you fix this in Node.js?
//
// A: Move the CPU-intensive work off the main event loop thread.
//    Best approaches:
//
//    Option 1 — Worker Threads (lightest weight, same process):
//      import { Worker } from 'worker_threads';
//      function processImageInWorker(imagePath: string): Promise<Buffer> {
//        return new Promise((resolve, reject) => {
//          const worker = new Worker('./image-worker.js', { workerData: { imagePath } });
//          worker.on('message', resolve);
//          worker.on('error', reject);
//        });
//      }
//      // image-worker.js runs in a separate V8 thread — main thread stays responsive
//
//    Option 2 — Piscina (worker thread pool, for sustained load):
//      import Piscina from 'piscina';
//      const pool = new Piscina({ filename: './image-worker.js', maxThreads: os.cpus().length });
//      const result = await pool.run({ imagePath }); // queued to next free thread
//
//    Option 3 — child_process.fork (full process isolation, good for untrusted code):
//      const child = fork('./image-processor.js');
//      child.send({ imagePath });
//      // Separate process crashes don't take down the main server
//
//    Option 4 (architectural) — Offload to a queue:
//      Push the job to a Bull/BullMQ queue, return jobId immediately (202 Accepted).
//      A separate worker process (or container) consumes the queue.
//      Client polls GET /jobs/:id or subscribes via WebSocket for completion.
//      Best for very long tasks (video encoding, PDF generation).

export default function runDemo(): void {
    console.log("\n" + "═".repeat(70));
    console.log("PERFORMANCE OPTIMIZATION — REFERENCE CARD");
    console.log("═".repeat(70));

    console.log(`
PERFORMANCE CHECKLIST (run before shipping)
────────────────────────────────────────────
  DB LAYER
  [ ] Enable Prisma query logging in development — spot N+1 immediately
  [ ] Run EXPLAIN ANALYZE on all queries touching large tables
  [ ] Add indexes on columns in WHERE / JOIN ON / ORDER BY
  [ ] Replace SELECT * with specific column lists
  [ ] Use pagination — never return unbounded lists
  [ ] Use include (eager load) instead of per-row queries
  [ ] Use Promise.all for independent parallel queries

  NODE.JS PROCESS
  [ ] gzip compression middleware enabled
  [ ] Keep-Alive and headersTimeout configured
  [ ] No CPU-intensive work on the main thread (use worker_threads)
  [ ] cluster or PM2 cluster mode for multi-core utilization
  [ ] heap limit set for containerized deployments (--max-old-space-size)

  CACHING
  [ ] Frequently-read, rarely-changing data cached in Redis with TTL
  [ ] HTTP Cache-Control headers set correctly on public endpoints
  [ ] ETag / 304 Not Modified for conditional requests
  [ ] No user-specific sensitive data in shared cache

  MONITORING
  [ ] process.memoryUsage() logged — alert if heapUsed grows continuously
  [ ] Slow query log enabled on PostgreSQL (log_min_duration_statement = 100)
  [ ] Response time P95 tracked (not just average)
`);

    console.log(`
N+1 FIX PATTERNS
─────────────────
  Problem:  for (const user of users) { await prisma.post.findMany(...) }
            → N queries, sequential

  Fix A:    prisma.user.findMany({ include: { posts: true } })
            → 1–2 queries with JOIN (use for Prisma relations)

  Fix B:    await Promise.all(users.map(u => fetchPosts(u.id)))
            → N queries but PARALLEL (use when include is unavailable)

  Fix C:    DataLoader batch function
            → batches all loads in same tick into 1 query (use for GraphQL)

  Fix D:    prisma.post.findMany({ where: { authorId: { in: userIds } } })
            → 1 query, fetch all at once, group in JS
`);

    console.log(`
MEMORY LEAK PATTERNS AND FIXES
────────────────────────────────
  PATTERN                        FIX
  ────────────────────────────── ─────────────────────────────────────────
  Unbounded Map / object cache   LRU cache with max size + TTL eviction
  Event listeners not removed    Always call .off(); use .once(); AbortController
  Closures holding large objects Extract only primitives needed; don't capture entire obj
  setInterval without clear      Store the ID; call clearInterval in cleanup
  Streams not destroyed          Use pipeline() which handles cleanup on error

  DIAGNOSIS WORKFLOW
  1. Watch: setInterval(() => console.log(process.memoryUsage().heapUsed), 30000)
  2. Load test for 10 minutes
  3. If heapUsed grows linearly → memory leak confirmed
  4. Take heap snapshots at t=0 and t=10min in Chrome DevTools (node --inspect)
  5. Compare snapshots → sort by Delta → find the growing object type
  6. Check Retainers pane → trace the reference chain → find the holder
  7. Fix the holder (eviction, cleanup, scope reduction)
`);

    console.log(`
CONNECTION POOL SIZING FORMULA
────────────────────────────────
  pool_size = (cpu_cores × 2) + effective_spindle_count

  SSD (1 spindle):   4 cores  → (4×2) + 1  =  9  → use 10
  SSD (1 spindle):   8 cores  → (8×2) + 1  = 17  → use 15–20
  SSD (1 spindle):  16 cores  → (16×2) + 1 = 33  → use 30–40

  WARNING: if you run 4 PM2 workers each with pool max=10, total = 40 connections.
           Make sure PostgreSQL max_connections > (num_workers × pool_max).
           Add headroom for: migrations, psql sessions, monitoring tools.

  PgBouncer transaction mode is recommended whenever:
    - You have many Node.js workers or microservices
    - You use serverless functions (new pool per invocation)
    - PostgreSQL connections exceed ~50 (overhead increases significantly)
`);

    console.log(`
QUICK LOOKUP: WHICH TOOL FOR WHICH PROBLEM
───────────────────────────────────────────
  Problem                           Tool / Solution
  ──────────────────────────────── ──────────────────────────────────────
  Which function uses the most CPU  clinic flame / 0x / node --prof
  Event loop blocking detection     clinic doctor
  Async bottleneck visualization    clinic bubbleprof
  Memory leak heap analysis         Chrome DevTools heap snapshots (--inspect)
  Slow DB queries                   PostgreSQL slow query log + EXPLAIN ANALYZE
  N+1 queries                       Prisma query logging + DataLoader / include
  Too many DB connections           PgBouncer (transaction mode)
  CPU-intensive task blocking reqs  worker_threads / Piscina / child_process
  Large JSON responses slow         compression middleware (gzip)
  Repeated identical DB fetches     Redis cache with TTL / request-level Map cache
  Unbounded memory in cache         LRU cache (lru-cache package, max + ttl options)
`);
}

runDemo();
