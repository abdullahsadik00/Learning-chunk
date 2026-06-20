# Backend Curriculum — Days 36–55

A day-by-day reference for the backend phases. Each entry lists the key concepts covered,
what you build, and the assessment file to use for self-evaluation.

Prerequisite: Days 1–35 (JS Core → TypeScript → React → CSS → Testing).

---

## Phase 8 — Node.js & Express (Days 36–40)

Location: `backend/express/`
Run: `cd backend/express && npm install && npm run day36`

### Day 36 — Node.js Internals

**File:** `src/day36-internals/index.ts`

| Concept | What you learn |
|---------|----------------|
| Streams | Readable / Writable / Transform / Duplex. Pipe, backpressure, `pipeline()` error handling |
| Buffers | `Buffer.alloc` vs `allocUnsafe`, binary encoding (base64, hex), byte-level reads |
| EventEmitter | `emit / on / once / off`, the special `error` event, `setMaxListeners`, typed emitters |
| Child processes | `exec` vs `spawn` vs `fork`, when to use each, CPU-intensive work isolation |

**You build:** a Transform stream that reads a large text file line by line and counts words without loading it all into memory.

**Assessment:** [`basics/assessments/day-36.md`](../basics/assessments/day-36.md)

---

### Day 37 — Express.js Fundamentals

**File:** `src/day37-express/server.ts`

| Concept | What you learn |
|---------|----------------|
| Middleware chain | `(req, res, next)` vs `(err, req, res, next)`, execution order, short-circuiting |
| Router | `express.Router()`, scoped middleware, route-level vs app-level |
| Error handling | `asyncHandler` wrapper, why Express 4 doesn't catch async errors, global error handler |
| Request augmentation | Extending `Request` in TypeScript (`req.userId`, `req.log`) |

**You build:** a fully-structured Express app with auth middleware, route-level validation, and a 4-parameter error handler.

**Assessment:** [`basics/assessments/day-37.md`](../basics/assessments/day-37.md)

---

### Day 38 — REST API Design

**File:** `src/day38-rest/server.ts`

| Concept | What you learn |
|---------|----------------|
| Resource naming | Noun URLs, HTTP method semantics, no verbs in paths |
| Status codes | 201 + Location, 204 (no body), 400 vs 422, 409 conflict, 429 rate limit |
| Pagination | Offset vs cursor, why `OFFSET 50000` is slow, base64 cursor encoding |
| Response contracts | Consistent envelope: `{ success, data, meta }` / `{ success, error }` |

**You build:** a paginated posts API with cursor pagination, proper status codes, and a consistent response shape.

**Assessment:** [`basics/assessments/day-38.md`](../basics/assessments/day-38.md)

---

### Day 39 — Authentication & Security

**File:** `src/day39-auth/server.ts`

| Concept | What you learn |
|---------|----------------|
| JWT structure | Header.payload.signature, why it's not encryption, `jti` claim |
| Access + refresh tokens | 15min access token, 7-day refresh token, silent refresh flow |
| httpOnly cookies | Why localStorage is vulnerable to XSS, `SameSite: lax`, CSRF trade-offs |
| bcrypt | Cost factor 12 (2^12 iterations), why timing attacks require constant-time compare |
| Token revocation | Redis denylist on logout: `SET logout:{jti}` with TTL matching token expiry |

**You build:** a complete auth API — register, login, refresh, logout — with access + refresh token rotation.

**Assessment:** [`basics/assessments/day-39.md`](../basics/assessments/day-39.md)

---

### Day 40 — Production Hardening

**File:** `src/day40-hardening/server.ts`

| Concept | What you learn |
|---------|----------------|
| Helmet | 5 security headers it sets (X-Frame-Options, CSP, HSTS, X-Content-Type-Options, Referrer-Policy) |
| CORS | Why `origin: '*'` + `credentials: true` is rejected by browsers, correct production config |
| Zod validation | Why TypeScript casts (`as T`) give zero runtime protection, Zod at system boundaries |
| Rate limiting | Fixed vs sliding window, per-endpoint limits, Redis-backed distributed rate limits |
| File uploads | MIME type validation (not just extension), path traversal attacks, max size |

**You build:** a hardened Express server that passes OWASP checks — proper CORS, validated inputs, rate-limited auth endpoints, safe file upload.

**Assessment:** [`basics/assessments/day-40.md`](../basics/assessments/day-40.md)

---

## Phase 9 — Databases (Days 41–45)

Location: `backend/database/`
Run: `cd backend/database && npm install && npm run day41`

Uses **SQLite** (zero setup). Notes throughout mark where PostgreSQL differs.

### Day 41 — SQL Fundamentals

**File:** `src/day41-sql/index.ts`

| Concept | What you learn |
|---------|----------------|
| SELECT, JOIN | INNER vs LEFT JOIN, when NULLs appear, `GROUP BY` + `HAVING` vs `WHERE` |
| Transactions | ACID, `BEGIN / COMMIT / ROLLBACK`, what happens if the credit fails mid-transfer |
| Indexes | B-Tree index (when it helps, when it doesn't), partial index, covering index |
| EXPLAIN ANALYZE | Reading Seq Scan vs Index Scan, "rows=X" vs "actual rows=Y" (stale stats) |

**You build:** a query suite demonstrating N+1 (then fixed), window functions (`ROW_NUMBER OVER PARTITION BY`), and a composite index benchmark.

**Assessment:** [`basics/assessments/day-41.md`](../basics/assessments/day-41.md)

---

### Day 42 — Prisma ORM

**File:** `src/day42-prisma/index.ts`

| Concept | What you learn |
|---------|----------------|
| Schema | `@id @default @unique @updatedAt @@map`, migration lifecycle (`dev` vs `deploy`) |
| Relations | 1:1, 1:N, M:N (implicit vs explicit junction table), `include` vs `select` |
| Transactions | Sequential `prisma.$transaction([...])` vs interactive `prisma.$transaction(async tx => ...)` |
| Raw queries | `$queryRaw` tagged template (safe) vs `$queryRawUnsafe` (SQL injection risk) |
| Soft delete | Middleware that converts `delete` → `update({ deleted_at })`, filters all `findMany` |

**You build:** a blog system with users, posts, comments — relations, upsert, soft delete middleware, and a migration strategy for renaming a column without downtime.

**Assessment:** [`basics/assessments/day-42.md`](../basics/assessments/day-42.md)

---

### Day 43 — Advanced Queries & Pagination

**File:** `src/day43-advanced/index.ts`

| Concept | What you learn |
|---------|----------------|
| Cursor pagination | Why `OFFSET 500000` scans 500k rows, `WHERE id > cursor LIMIT n`, base64 encoding |
| Aggregations | `COUNT(*) vs COUNT(col)` (NULL handling), `DATE_TRUNC`, gap-filling with `generate_series` |
| Materialized views | Pre-computed query results on disk, `REFRESH MATERIALIZED VIEW CONCURRENTLY` |
| Full-text search | PostgreSQL `tsvector`, `ts_rank`, `setweight` to boost title vs body, GIN index |

**You build:** a search API with cursor pagination, relevance-ranked full-text search, and a dashboard query that fills zero-count days in a date range.

**Assessment:** [`basics/assessments/day-43.md`](../basics/assessments/day-43.md)

---

### Day 44 — Redis

**File:** `src/day44-redis/index.ts`

| Concept | What you learn |
|---------|----------------|
| Data structures | String, Hash, List, Set, Sorted Set — one primary use case each |
| Cache-aside | Miss → query DB → cache with TTL → return. When to invalidate vs let expire |
| Rate limiting | `INCR + EXPIRE` pattern, why INCR is atomic, sliding window vs fixed window |
| Pub/Sub | Why you need a separate connection for subscribe mode, broadcast to multiple servers |
| Distributed lock | `SET key value EX 30 NX` — NX for atomic check-and-set, EX to prevent deadlock on crash |

**You build:** all 5 patterns running sequentially — caching with hit/miss timing, rate limiter demo with blocked requests, pub/sub broadcast, sorted set leaderboard, distributed lock for a cron job.

**Assessment:** [`basics/assessments/day-44.md`](../basics/assessments/day-44.md)

---

### Day 45 — Database Design

**File:** `src/day45-design/index.ts`

| Concept | What you learn |
|---------|----------------|
| Normalization | 1NF (atomic values), 2NF (no partial dependency), 3NF (no transitive dependency) |
| UUID vs auto-increment | Globally unique vs sequential, B-tree fragmentation, guessability |
| Storing money | Why `FLOAT` is wrong (0.1 + 0.2 ≠ 0.3), `DECIMAL(19,4)` or integer cents |
| Multi-tenancy | Row-level (`tenant_id` + RLS), schema-level, database-level — trade-offs |
| Zero-downtime migration | Add nullable → backfill in batches → add NOT NULL → remove default |

**You build:** a schema audit tool that checks a Prisma schema for: missing `@@index`, FLOAT money columns, no `created_at`/`updated_at`, and nullable foreign keys.

**Assessment:** [`basics/assessments/day-45.md`](../basics/assessments/day-45.md)

---

## Phase 10 — Real-time & Advanced Patterns (Days 46–50)

Location: `backend/realtime/`
Run: `cd backend/realtime && npm install && npm run day46`

Redis must be running for Days 46, 48: `docker run -d -p 6379:6379 redis:7-alpine`

### Day 46 — WebSockets

**File:** `src/day46-websockets/server.ts` + `client.ts`

| Concept | What you learn |
|---------|----------------|
| ws library | `wss.on('connection')`, 4 socket events (message, close, error, ping/pong), broadcast |
| Rooms | `Map<roomId, Set<WebSocket>>` — join / leave / broadcast with exclude |
| Presence | Broadcast join/leave events to room members, stale connection detection (heartbeat) |
| WS authentication | Why query-string tokens appear in server logs — timed challenge pattern instead |
| Horizontal scaling | Why round-robin LB breaks WS state — Redis pub/sub bridge across instances |

**You build:** a chat server with rooms, presence, heartbeat, auth challenge, and a Redis pub/sub bridge. Companion client simulates 3 users chatting.

**Assessment:** [`basics/assessments/day-46.md`](../basics/assessments/day-46.md)

---

### Day 47 — Server-Sent Events (SSE)

**File:** `src/day47-sse/server.ts`

| Concept | What you learn |
|---------|----------------|
| SSE protocol | `Content-Type: text/event-stream`, `data: {json}\n\n`, named events, `id:` for reconnect |
| EventSource API | `new EventSource`, automatic reconnect, `Last-Event-ID` header on reconnect |
| SSE vs WebSocket | Directionality, firewall friendliness, HTTP/1.1 connection limit, reconnect behavior |
| Cleanup | `req.on('close')` to clear intervals and remove from subscriber map — memory leak prevention |

**You build:** 3 SSE endpoints — live stock prices (named events every 1s), notification broadcast (POST to push to all subscribers), job progress stream (finite 10-step stream).

**Assessment:** [`basics/assessments/day-47.md`](../basics/assessments/day-47.md)

---

### Day 48 — Background Jobs with BullMQ

**File:** `src/day48-bullmq/index.ts`

| Concept | What you learn |
|---------|----------------|
| Queue / Worker / Job | Producer adds jobs, separate Worker process consumes them |
| Retry + backoff | `attempts: 3, backoff: { type: 'exponential', delay: 1000 }` — why exponential |
| Delayed jobs | `{ delay: 86400000 }` — runs 24h from now, backed by Redis ZSET |
| Cron jobs | `{ repeat: { pattern: '0 9 * * 1-5' } }` — survives restarts, runs in one worker only |
| Job progress | `job.updateProgress(50)` → `queueEvents.on('progress', ...)` |

**You build:** a job system with 5 queue types — email (with backoff), flaky-job (demonstrates retries), delayed reminder, recurring report, and a progress-tracked PDF generation simulation.

**Assessment:** [`basics/assessments/day-48.md`](../basics/assessments/day-48.md)

---

### Day 49 — Email & File Storage

**File:** `src/day49-email-storage/index.ts`

| Concept | What you learn |
|---------|----------------|
| Nodemailer | SMTP transport, Ethereal test accounts (catches without sending), `html` + `text` fields |
| Email templates | Template literals for simple emails, when to use mjml/react-email |
| Multer | `DiskStorage` vs `MemoryStorage`, file size limit, MIME type validation |
| S3 presigned URLs | 4-step flow: presign request → client uploads directly to S3 → notify API → store metadata |
| Path traversal | `../../etc/passwd` as filename — how to sanitize with `path.basename()` |

**You build:** an upload server with image-only endpoint (disk, 5MB max), any-file endpoint (memory, 10MB), presigned URL simulation, and Nodemailer test sending to Ethereal.

**Assessment:** [`basics/assessments/day-49.md`](../basics/assessments/day-49.md)

---

### Day 50 — API Design Patterns

**File:** `src/day50-api-patterns/server.ts`

| Concept | What you learn |
|---------|----------------|
| REST vs GraphQL vs tRPC | Over/under-fetching, type safety trade-offs, when each is appropriate |
| API versioning | URL (`/v1/`), header, query param — URL versioning recommended for public APIs |
| Response envelope | `{ success, data, meta }` / `{ success, error }` — consistent shape for SDK generation |
| OpenAPI | Serve spec at `/api-docs/openapi.json`, Swagger UI for interactive docs |
| Rate limit headers | `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, `Retry-After` |

**You build:** v1 and v2 of the same API live simultaneously, self-served Swagger UI, GraphQL schema SDL as a reference comment, and rate-limit headers on all responses.

**Assessment:** [`basics/assessments/day-50.md`](../basics/assessments/day-50.md)

---

## Phase 11 — Production Readiness (Days 51–55)

Location: `backend/production/`
Run: `cd backend/production && npm install && npm run day54`
Tests: `npm test` (runs Day 51 supertest suite — 16 tests)

### Day 51 — API Testing with Supertest

**Files:** `src/day51-testing/app.ts` + `posts.test.ts`

| Concept | What you learn |
|---------|----------------|
| Supertest | `request(app).get('/api/posts')` — no running server, no port conflict |
| App factory pattern | Export Express app WITHOUT `listen()` — each test suite imports fresh instance |
| Test isolation | `beforeEach(() => resetStore())` for in-memory; transaction rollback for DB-backed |
| What to test | Happy path, validation errors, 404, status codes, response shape, side effects |
| Status code assertions | 201 + Location header, 204 with empty body, 400 field errors, 404 not found |

**You build:** 16 passing tests covering all 5 CRUD routes — create, read list, read single, update, delete — with validation errors and not-found cases.

**Assessment:** [`basics/assessments/day-51.md`](../basics/assessments/day-51.md)

---

### Day 52 — Docker

**Files:** `src/day52-docker/Dockerfile`, `docker-compose.yml`, `.dockerignore`

| Concept | What you learn |
|---------|----------------|
| Multi-stage build | Stage 1 (builder): compile TS. Stage 2 (production): copy `dist/` + prod deps only. 500MB → 180MB |
| Layer caching | `COPY package*.json` BEFORE `COPY . .` — npm install cache survives code changes |
| Non-root user | `USER node` — if compromised, attacker runs as `node`, not root |
| docker-compose | api + postgres (healthcheck) + redis. `depends_on: condition: service_healthy` |
| Volume types | Bind mount (hot reload in dev) vs named volume (persistent data, survives restart) |

**You study:** The Dockerfile, compose file, and `.dockerignore` are teaching files — read the inline comments, then run `docker compose up` to see it working.

**Assessment:** [`basics/assessments/day-52.md`](../basics/assessments/day-52.md)

---

### Day 53 — CI/CD with GitHub Actions

**File:** `src/day53-cicd/github-actions.yml`

| Concept | What you learn |
|---------|----------------|
| Workflow anatomy | Event → Job → Step. `needs:` for sequencing, parallel by default |
| Matrix builds | `node: [20, 22]` runs 2 parallel jobs — catches version-specific bugs |
| Service containers | Postgres + Redis as services in the test job, accessible on `localhost` |
| Cache | `actions/cache` with `hashFiles('package-lock.json')` — npm ci in 5s not 60s |
| Deploy pipeline | lint-and-typecheck → test → build (push to GHCR with SHA tag) → deploy (main only) |

**You study:** The workflow YAML is a teaching file — read it, understand each job, then copy it to `.github/workflows/ci.yml` in a real project.

**Assessment:** [`basics/assessments/day-53.md`](../basics/assessments/day-53.md)

---

### Day 54 — Logging & Health Checks

**File:** `src/day54-logging/server.ts`

| Concept | What you learn |
|---------|----------------|
| Pino setup | `level`, `pino-pretty` in dev, raw JSON in production, why speed matters |
| Child logger | `logger.child({ requestId })` — every log in a request carries the same ID |
| Request logging | Log on start (catches hung requests), log on finish (captures duration + status) |
| Health checks | `GET /health` (liveness), `GET /health/ready` (checks DB + Redis — returns 503 if down) |
| Graceful shutdown | SIGTERM → stop accepting → drain in-flight → close DB pool → exit 0 |

**You build:** a fully observable Express server — structured logs with request IDs, two health endpoints, and a graceful SIGTERM handler with 10s force-exit backstop.

**Assessment:** [`basics/assessments/day-54.md`](../basics/assessments/day-54.md)

---

### Day 55 — Performance Optimization

**File:** `src/day55-performance/index.ts`

| Concept | What you learn |
|---------|----------------|
| N+1 detection | Query counter middleware — warns if a single request fires > 5 DB queries |
| Event loop lag | `setImmediate` lag monitor — > 100ms means a blocking operation is running |
| Memory leaks | `process.memoryUsage()` monitoring, 4 common patterns (unbounded Map, leaked listeners) |
| Connection pooling | Prisma pool size formula, `connection_limit` in DATABASE_URL, when PgBouncer is needed |
| Caching layers | In-memory Map with TTL, Redis cache-aside, HTTP `Cache-Control` — when to use each |

**You build:** a runnable benchmark that demonstrates cache hit/miss timing difference, event loop lag detection, and a memory monitor that logs heap usage every 5 seconds.

**Assessment:** [`basics/assessments/day-55.md`](../basics/assessments/day-55.md)

---

## Quick-start commands

```bash
# Phase 8 — Express
cd backend/express && npm install
npm run day36  # Node.js internals (streams, buffers, EventEmitter)
npm run day37  # Express middleware + routing
npm run day38  # REST API design + pagination
npm run day39  # Auth: JWT + refresh tokens + httpOnly cookies
npm run day40  # Production hardening: Helmet, Zod, rate limiting

# Phase 9 — Database (SQLite, zero setup)
cd backend/database && npm install
npm run day41  # SQL fundamentals + indexes
npm run day42  # Prisma ORM + migrations
npm run day43  # Advanced queries + cursor pagination
npm run day44  # Redis (requires: docker run -d -p 6379:6379 redis:7-alpine)
npm run day45  # Database design + normalization

# Phase 10 — Real-time (Redis required for day46 + day48)
cd backend/realtime && npm install
npm run day46  # WebSocket chat server (run client.ts in a second terminal)
npm run day47  # SSE: stock prices, notifications, job progress
npm run day48  # BullMQ job queues (Redis required)
npm run day49  # Email (Nodemailer + Ethereal) + file uploads (Multer)
npm run day50  # API patterns: versioning + OpenAPI docs

# Phase 11 — Production
cd backend/production && npm install
npm test       # Day 51: 16 supertest API tests
npm run day54  # Pino logging + health checks + graceful shutdown
npm run day55  # Performance: N+1 detection, event loop lag, memory monitor
# Day 52: study src/day52-docker/ and run: docker compose up
# Day 53: study src/day53-cicd/github-actions.yml
```

---

## Progression map

```
Day 36  Node.js internals ──────────────────────────────────────── Phase 8
Day 37  Express middleware
Day 38  REST API design
Day 39  Authentication (JWT + sessions)
Day 40  Security hardening ──────────────────────────────────── Assessment: Backend Node.js & Express ✓

Day 41  SQL fundamentals ───────────────────────────────────────── Phase 9
Day 42  Prisma ORM
Day 43  Advanced queries + pagination
Day 44  Redis (cache, pub/sub, locks)
Day 45  Database design ─────────────────────────────────────── Assessment: Backend Databases ✓

Day 46  WebSockets ─────────────────────────────────────────────── Phase 10
Day 47  Server-Sent Events
Day 48  BullMQ background jobs
Day 49  Email + file storage
Day 50  API patterns ────────────────────────────────────────── Assessment: Real-time & Jobs ✓

Day 51  API testing (Supertest) ──────────────────────────────── Phase 11
Day 52  Docker + docker-compose
Day 53  CI/CD (GitHub Actions)
Day 54  Logging + health checks
Day 55  Performance optimization ───────────────────────────── Assessment: Backend Production ✓

                                              🏆 Full-Stack JS Engineer (Days 1–55)
```
