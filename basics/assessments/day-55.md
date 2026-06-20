# Day 55 Assessment — Performance Optimization · N+1 Detection · Connection Pooling · Memory Leaks

**Theme:** You are the performance engineer at a startup where the API's p99 latency is 8 seconds and users are churning. You have 2 weeks and no budget for new infrastructure. Everything must come from code and configuration changes only.

---

### Q1 — Measure Before Optimizing ⭐

**Scenario:** The CTO says "just add more indexes and cache everything." You disagree — you've learned that guessing at bottlenecks wastes time and can even make things worse.

**Task:** Explain the "measure first" principle. Show three Node.js profiling tools with different precision levels. Reference Knuth's quote and explain the nuance.

**Acceptance Criteria:**
- [ ] States the principle: identify the actual bottleneck before writing any optimization code — most performance problems are in one or two hot paths, not everywhere
- [ ] Shows `console.time('queryName')` / `console.timeEnd('queryName')`: crude, zero setup, good for quick one-off measurements
- [ ] Shows `process.hrtime.bigint()`: nanosecond-precision timing — `const start = process.hrtime.bigint(); ... const ns = process.hrtime.bigint() - start`
- [ ] Mentions Node.js `--prof` flag: generates a V8 CPU profile; `node --prof app.js` + `node --prof-process isolate-*.log` produces a flame graph
- [ ] States Knuth's quote correctly: "Premature optimization is the root of all evil" — meaning: don't optimize before measuring
- [ ] States the nuance: "measure first" does not mean "never optimize" — it means "optimize the proven bottleneck, not the assumed one"
- [ ] Notes that the bottleneck is almost never where you think it is: usually DB query time, not application logic

---

### Q2 — N+1 Query ⭐

**Scenario:** Your `GET /posts` endpoint returns 100 posts with author names. It works fine in development with 5 posts. In production with 10,000 posts and 100 concurrent users, it grinds the server to a halt.

**Task:** Explain what an N+1 query is with the posts/authors example. Show the naive code that causes it. Show the fix. Explain how to detect it.

**Acceptance Criteria:**
- [ ] Defines N+1: 1 query to fetch N records, then N additional queries to fetch related data — total N+1 queries instead of 1 or 2
- [ ] Shows the naive code: `const posts = await db.query('SELECT * FROM posts LIMIT 100')` then `for (const post of posts) { post.author = await db.query('SELECT * FROM users WHERE id = $1', [post.authorId]) }`
- [ ] States the problem: 100 posts = 101 queries; 1000 posts = 1001 queries — scales linearly with data size
- [ ] Shows JOIN fix: `SELECT posts.*, users.name AS authorName FROM posts JOIN users ON users.id = posts.authorId LIMIT 100` — always 1 query
- [ ] Shows IN clause alternative: collect `authorIds`, then `SELECT * FROM users WHERE id IN (${authorIds})` — 2 queries regardless of N
- [ ] Explains detection: add query counter middleware (`let count = 0` per request, increment on each DB call, log count at response end); any single endpoint with count > 5 is suspicious
- [ ] Mentions Prisma's logging: `log: ['query']` in PrismaClient config prints every SQL query with execution time

---

### Q3 — Connection Pooling ⭐

**Scenario:** Your API creates a new database connection on every request. With 200 concurrent users, you have 200 simultaneous connections to PostgreSQL. Users start seeing `too many connections` errors and you're not even at scale yet.

**Task:** Explain what a connection pool is and why creating connections per-request is slow. State Prisma's default pool size formula. Explain the `pool_timeout` error.

**Acceptance Criteria:**
- [ ] Defines connection pool: a set of pre-established, reusable database connections maintained by the application — requests borrow a connection, use it, and return it
- [ ] Explains per-request connection cost: TCP 3-way handshake + PostgreSQL authentication + SSL negotiation = ~50–150ms overhead before the first query even executes
- [ ] States Prisma's default formula: `(num_cpus * 2) + 1` — on a 2-CPU server: `(2 * 2) + 1 = 5` connections
- [ ] Explains `pool_timeout` error: all connections in the pool are currently in use; a new request waited longer than the timeout (default: 10s in Prisma) for a connection to become available
- [ ] Explains what `pool_timeout` indicates: too many concurrent slow queries, pool size too small, or a connection leak (connections not being released)
- [ ] Shows how to configure pool size in Prisma: `datasource db { url = "postgresql://...?connection_limit=20&pool_timeout=30" }`
- [ ] Notes that PostgreSQL has a hard maximum connection limit (default: 100) — pool size across all app instances must stay below this

---

### Q4 — Event Loop Lag ⭐

**Scenario:** Your API has a `POST /export` endpoint that synchronously formats a 50,000-row CSV. While that runs, ALL other API requests queue up and time out — even simple GETs take 10 seconds.

**Task:** Define event loop lag. Explain why it affects all users. Show how to measure it. Name the common causes.

**Acceptance Criteria:**
- [ ] Defines event loop lag: the time between when a callback is scheduled (e.g., `setImmediate`) and when it actually executes — should be near 0ms; high lag means the loop is blocked
- [ ] Explains why all users are affected: Node.js runs JavaScript on a single thread — if that thread is busy in a synchronous operation, no other I/O callbacks (incoming HTTP requests, DB responses) can be processed
- [ ] Shows measurement: `setInterval(() => { const t = Date.now(); setImmediate(() => { console.log('Event loop lag:', Date.now() - t, 'ms') }) }, 1000)`
- [ ] Lists common causes: large `JSON.parse()` on multi-MB payloads, `JSON.stringify()` on large objects, synchronous crypto (`crypto.createHash` in a loop), tight CPU loops, large array `.sort()`, synchronous file reads
- [ ] States the impact threshold: >100ms lag is noticeable; >1000ms means requests are timing out
- [ ] Notes the fix for CPU-intensive work: move to a Worker Thread (see Q12) or offload to a background job queue

---

### Q5 — Query Optimization Workflow ⭐⭐

**Scenario:** You've identified that your `GET /search` endpoint is slow. You don't yet know which query is the culprit or why it's slow.

**Task:** Describe the 5-step query optimization workflow. Explain what `EXPLAIN ANALYZE` shows. Explain what "Seq Scan" vs "Index Scan" means in the output.

**Acceptance Criteria:**
- [ ] Step 1: enable query logging — log all SQL queries with their execution time (Prisma: `log: ['query', 'info']`; pg: query event listener)
- [ ] Step 2: identify the slowest query — sort logged queries by duration; focus on the top offender
- [ ] Step 3: run `EXPLAIN ANALYZE <slow query>` in psql or your DB client — this executes the query and shows the execution plan with actual timing
- [ ] Step 4: read the plan — look for "Seq Scan" (bad) vs "Index Scan" (good); look for high row estimates vs actual rows (stats are stale — run `ANALYZE`)
- [ ] Step 5: fix and re-measure — add an index, rewrite the query, or add a covering index; run `EXPLAIN ANALYZE` again to confirm improvement
- [ ] Explains "Seq Scan": PostgreSQL reads every row in the table to find matches — O(n) — slow on large tables
- [ ] Explains "Index Scan": PostgreSQL uses the B-tree index to find matching rows — O(log n) — fast

---

### Q6 — Prisma N+1 Detection ⭐⭐

**Scenario:** Your Prisma-based API fetches a list of posts and their authors. After enabling query logging you see 51 queries for a page of 50 posts. This is the classic N+1.

**Task:** Show the Prisma code that causes the N+1. Show the fix with `include`. Explain internally how Prisma's `include` works (it's not always a JOIN).

**Acceptance Criteria:**
- [ ] Shows the N+1 code: `const posts = await prisma.post.findMany()` followed by `for (const p of posts) { const author = await prisma.user.findUnique({ where: { id: p.authorId } }) }`
- [ ] Shows the fix: `const posts = await prisma.post.findMany({ include: { author: true } })`
- [ ] Explains Prisma's `include` implementation: Prisma issues 2 queries — `SELECT * FROM posts` then `SELECT * FROM users WHERE id IN (1, 2, 3, ...)` — NOT a JOIN in most cases
- [ ] States why 2 queries vs N+1 is a massive improvement: 2 queries regardless of how many posts; N+1 scales with data size
- [ ] Notes that Prisma's `include` approach avoids the data duplication problem of JOINs on 1-to-many relations (a JOIN on posts+comments produces one row per comment, duplicating post data)
- [ ] Shows how to verify: enable `log: ['query']` and count the SQL statements in the output
- [ ] Mentions `select` inside `include` to limit fetched fields: `include: { author: { select: { name: true, id: true } } }`

---

### Q7 — Index Strategy ⭐⭐

**Scenario:** Your posts table has 5 million rows. `GET /posts?status=active` takes 4 seconds. `GET /posts?status=active&sort=created_at_desc` takes 6 seconds. You need to fix both.

**Task:** Explain when indexes help and when they don't. Show a composite index for status + created_at. Explain the trade-off of adding indexes.

**Acceptance Criteria:**
- [ ] States when indexes help: high-cardinality columns (many unique values), columns used in `WHERE`, `ORDER BY`, `JOIN ON`, `GROUP BY`
- [ ] States when indexes don't help: low-cardinality boolean/enum columns with few distinct values (e.g., `is_deleted` with 99% false — Postgres may prefer seq scan), very small tables (index overhead exceeds benefit)
- [ ] Shows composite index: `CREATE INDEX idx_posts_status_created ON posts(status, created_at DESC)`
- [ ] Explains column order in composite index: most selective / most frequently filtered column first (`status`), then the ordering column (`created_at DESC`)
- [ ] Explains index maintenance cost: every `INSERT`, `UPDATE`, `DELETE` must also update all indexes on the table — many indexes slow down writes
- [ ] Explains covering index: include all SELECT columns in the index to avoid table heap access — `CREATE INDEX ON posts(status, created_at DESC) INCLUDE (title, authorId)`
- [ ] Notes that partial indexes can be even more efficient: `CREATE INDEX ON posts(created_at) WHERE status = 'active'` — only indexes active posts

---

### Q8 — Memory Leak Detection ⭐⭐

**Scenario:** Your Node.js process starts at 150 MB of heap memory. After running for 6 hours, it's at 1.8 GB and getting slow. After 8 hours it crashes with an out-of-memory error.

**Task:** Show how to detect a memory leak by monitoring heap growth. Describe the 3 most common Node.js memory leak patterns with examples.

**Acceptance Criteria:**
- [ ] Shows heap monitoring: `setInterval(() => { const { heapUsed, heapTotal } = process.memoryUsage(); logger.info({ heapUsed, heapTotal }, 'Memory usage') }, 30000)`
- [ ] Explains the leak pattern to look for: monotonically increasing `heapUsed` that never drops back down after GC — 1 MB+ growth per 5 minutes is a red flag
- [ ] Describes Leak 1 — unbounded cache: `const cache = new Map()` that accumulates entries but never evicts — fix with `lru-cache` or TTL-based eviction
- [ ] Describes Leak 2 — event listener accumulation: calling `emitter.on('event', handler)` inside a request handler without `emitter.off()` — each request adds a listener — fix with `emitter.once()` or explicit cleanup
- [ ] Describes Leak 3 — closure holding large reference: `const largeData = loadAllData(); setInterval(() => { use(largeData.slice(0, 1)) }, 1000)` — `largeData` is never GC'd because the closure references it
- [ ] Mentions `--expose-gc` + `global.gc()` for forcing GC in diagnostic scripts
- [ ] Mentions Chrome DevTools heap snapshots (connect via `--inspect`) as the definitive tool for finding what is accumulating

---

### Q9 — Response Caching ⭐⭐

**Scenario:** Your `GET /products` endpoint queries the database every time and is called 500 times per second. The product catalog changes only once per hour at most.

**Task:** Show the `Cache-Control` header for CDN and browser caching. Explain when to use vs avoid response caching. Explain the `ETag` mechanism for conditional requests.

**Acceptance Criteria:**
- [ ] Shows: `res.set('Cache-Control', 'public, max-age=3600')` — CDN and browser may cache for 1 hour
- [ ] Explains `public`: the response can be cached by CDN (shared cache), not just the user's browser
- [ ] Explains `max-age=3600`: cache is valid for 3600 seconds (1 hour) — no server request during this period
- [ ] States when to use: public data, infrequently changing (product catalogs, blog posts, static config), same content for all users
- [ ] States when NOT to use: user-specific responses (`Authorization` header present), frequently changing (inventory counts, live prices, notifications)
- [ ] Explains ETag: server generates a hash of the response content and sends `ETag: "abc123"` — client sends `If-None-Match: "abc123"` on subsequent request — server returns 304 Not Modified (no body) if unchanged
- [ ] Explains 304 benefit: saves bandwidth on large responses (e.g., 50 KB product list → 0 bytes on 304)

---

### Q10 — Database Query Result Caching ⭐⭐

**Scenario:** Even with HTTP caching, your authenticated endpoints (`GET /dashboard`) hit the database on every unique user session. The same expensive aggregation query runs thousands of times per hour with the same result.

**Task:** Show the Redis cache-aside pattern with TTL. Show cache invalidation on write. Explain when NOT to cache. Define cache hit ratio and what a good ratio looks like.

**Acceptance Criteria:**
- [ ] Shows cache-aside read: `const cached = await redis.get(key); if (cached) return JSON.parse(cached); const data = await db.query(...); await redis.setex(key, 300, JSON.stringify(data)); return data`
- [ ] Explains TTL: `setex(key, 300, value)` — cache expires after 300 seconds even if not invalidated
- [ ] Shows cache invalidation on write: when data is updated, `await redis.del(key)` or `await redis.del(\`user:${userId}:dashboard\`)`
- [ ] Explains when NOT to cache: user-specific data with many variants generates too many cache keys (cache key explosion); very frequently changing data (stale cache causes user confusion)
- [ ] Defines cache hit ratio: `(cache hits) / (total requests)` × 100% — e.g., 90% means only 10% of requests reach the database
- [ ] States a good ratio: > 80% for read-heavy data; < 50% means the cache key is too specific or TTL is too short
- [ ] Notes cache stampede risk: if a popular key expires, many requests may hit the DB simultaneously — mitigation: probabilistic early expiration or locking

---

### Q11 — Compression Middleware ⭐⭐

**Scenario:** Your `GET /api/reports` endpoint returns a 200 KB JSON response. Users on slow connections wait 2 seconds just for the download. Your server has plenty of CPU headroom.

**Task:** Show how to add Express compression middleware. Explain the size reduction. State when to skip compression. Explain how to verify compression is active.

**Acceptance Criteria:**
- [ ] Shows: `const compression = require('compression'); app.use(compression())` (or `import compression from 'compression'` with types)
- [ ] States size reduction: gzip typically compresses JSON by 60–80% (200 KB → 40–80 KB); brotli achieves slightly better ratios
- [ ] Explains when to skip: data already compressed (JPEG/PNG images, MP4 video, ZIP files, gzipped responses from upstream) — compressing already-compressed data wastes CPU and may increase size slightly
- [ ] Explains CPU cost: negligible at moderate traffic (< 1000 req/s on a modern CPU); at very high throughput, offload to Nginx reverse proxy or CDN
- [ ] Shows verification: `curl -H 'Accept-Encoding: gzip' -I https://api.example.com/reports | grep -i content-encoding` — should return `Content-Encoding: gzip`
- [ ] Notes that the client must send `Accept-Encoding: gzip` — Express `compression` checks this and skips compression if absent
- [ ] Mentions `compression({ threshold: 1024 })` — only compress responses > 1 KB (avoids overhead for tiny responses)

---

### Q12 — Worker Threads for CPU Work ⭐⭐⭐

**Scenario:** Your API has a `POST /generate-report` endpoint that parses a 30 MB JSON file and generates a PDF. This blocks the event loop for 3–4 seconds, causing all other users to experience latency spikes.

**Task:** Explain when to use Worker Threads vs child_process.fork. Show the Worker Threads pattern: create worker, post data, receive result, terminate. Explain `SharedArrayBuffer` for zero-copy.

**Acceptance Criteria:**
- [ ] Explains when to use Worker Threads: CPU-intensive synchronous work that would block the event loop — image processing, PDF generation, large JSON parsing/transformation, cryptographic operations
- [ ] Explains why Worker Threads beat `child_process.fork` for this use case: Worker Threads share memory with the main thread (faster IPC), lower startup time, lower memory overhead than a full Node.js child process
- [ ] Shows worker creation: `const { Worker } = require('worker_threads'); const worker = new Worker('./report-worker.js', { workerData: { filePath } })`
- [ ] Shows receiving result: `worker.on('message', (result) => { resolve(result); worker.terminate() })`
- [ ] Shows error handling: `worker.on('error', reject); worker.on('exit', (code) => { if (code !== 0) reject(new Error(\`Worker exited with code ${code}\`)) })`
- [ ] Explains `SharedArrayBuffer`: allows the main thread and worker to read/write the same memory region — use with `Atomics` for synchronization — zero-copy for large data (no serialization overhead)
- [ ] Notes the pool pattern: creating a Worker per request is expensive — maintain a pool of pre-created Workers (e.g., `workerpool` library) for high-throughput scenarios

---

### Q13 — PgBouncer Connection Pooling ⭐⭐⭐

**Scenario:** You've scaled your API to 20 instances, each with a Prisma connection pool of 10. That's 200 connections. PostgreSQL's `max_connections` is 200 and you're hitting it. New deployments cause `too many connections` errors.

**Task:** Explain why application-level pooling isn't enough at scale. Explain what PgBouncer does. Compare transaction mode vs session mode and their trade-offs.

**Acceptance Criteria:**
- [ ] States the math problem: N app instances × M pool size = N×M connections to Postgres — grows linearly with scale
- [ ] Explains PgBouncer as a connection proxy: all application instances connect to PgBouncer (cheap TCP connections); PgBouncer maintains a small pool of actual Postgres connections (e.g., 50)
- [ ] States the result: 20 instances × 10 = 200 app connections to PgBouncer; PgBouncer → Postgres uses only 50 real connections
- [ ] Explains transaction mode: a Postgres connection is assigned for the duration of a single transaction only — released immediately after COMMIT/ROLLBACK — highest connection reuse
- [ ] Explains session mode: a Postgres connection is held for the entire client session — equivalent to no multiplexing; simpler but not efficient
- [ ] States transaction mode trade-offs: breaks prepared statements (they are session-scoped in Postgres), breaks `SET` commands, breaks advisory locks — Prisma works with PgBouncer in transaction mode using `pgbouncer=true` in the URL
- [ ] Mentions the alternative: Prisma Accelerate or RDS Proxy (managed connection pooling solutions)

---

### Q14 — Load Testing ⭐⭐⭐

**Scenario:** You've made several optimizations. Before going to production, you need to prove they work under realistic load and find the system's actual breaking point.

**Task:** Name two load testing tools. Describe a k6 test: ramp up, hold, ramp down. Explain what to measure. Explain how to find the bottleneck during a load test.

**Acceptance Criteria:**
- [ ] Names at least 2 tools: `k6`, `artillery`, `wrk`, `autocannon`, `Apache JMeter`
- [ ] Describes k6 test shape: ramp up to 100 virtual users over 1 minute, hold for 5 minutes, ramp down over 1 minute
- [ ] Shows k6 `stages` config or equivalent `artillery` phases
- [ ] States what to measure: throughput (requests/second), p50 latency (median), p95 latency, p99 latency, error rate (% of 5xx responses)
- [ ] Interprets p99 = 8s: 1 in every 100 users waits 8 seconds — even if p50 is 200ms, this affects user experience significantly
- [ ] Explains how to find bottleneck during test: watch system metrics simultaneously — whichever resource maxes out first (DB connections, CPU, memory, disk I/O) is the current bottleneck
- [ ] Notes iterative approach: fix the identified bottleneck, run load test again — repeat until target throughput/latency is achieved or a new bottleneck appears at acceptable levels

---

### Q15 — Horizontal vs Vertical Scaling ⭐⭐⭐

**Scenario:** Your startup is growing. The API handles 500 req/s and is struggling. The CTO asks: "should we upgrade to a larger server (vertical) or add more servers (horizontal)?"

**Task:** Define vertical and horizontal scaling. Explain what "stateless" requires for horizontal scaling. Reference the 12-factor app principle. State when each approach is appropriate.

**Acceptance Criteria:**
- [ ] Defines vertical scaling: upgrade the existing server to a bigger instance (more CPU cores, more RAM) — no code changes required; expensive; has a physical ceiling
- [ ] Defines horizontal scaling: add more instances of the same server behind a load balancer — requires stateless application design
- [ ] Explains statelessness requirement: if the app stores session state in memory (e.g., `req.session` in-memory store), request 2 from the same user might hit a different instance — session is lost
- [ ] States the fix for stateless horizontal scaling: store all state in external backing services — Redis for sessions and caches, PostgreSQL for persistent data, S3 for files
- [ ] States the 12-factor app principle: "Processes — execute as one or more stateless processes; store state in backing services" (Factor VI)
- [ ] States when to use vertical: quick fix for immediate overload, simplest option for small teams, when the app is stateful and refactoring is too costly
- [ ] States when to use horizontal: cost-effective at scale (many smaller instances vs one huge one), high availability (if one instance fails, others continue), geographic distribution
- [ ] Mentions that horizontal scaling also requires the load balancer to support session affinity or the app must be truly stateless

---

## Scoring Rubric

Count the number of acceptance criteria checkboxes you fully satisfied across all 15 questions.

| Score | Level | What it means |
|-------|-------|---------------|
| 0–4   | 🔴 Re-study | Go back to the Day 55 teaching file. Performance optimization requires both measurement instincts and pattern recognition. |
| 5–9   | 🟡 Progressing | You can fix obvious N+1 problems and add caching, but profiling, memory leaks, and scaling architecture need more work. |
| 10–12 | 🟢 Solid | You can diagnose and fix most production performance issues. Move on — revisit Worker Threads and PgBouncer later. |
| 13–15 | 🚀 Ready to advance | Strong performance engineering mindset. You can take an underperforming API from 8s p99 to sub-200ms through systematic optimization. |
