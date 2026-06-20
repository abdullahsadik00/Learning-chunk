# Logly — Senior Dev Guide

You're building a real product. Not a tutorial, not a toy. People pay $9–19/month for Plausible.io and Fathom. We're building the same thing — privacy-first analytics with a tiny tracking script, a real-time dashboard, and a reliable backend.

This guide will save you from the mistakes I've made. Read it before writing a single line of code.

---

## What We're Building

Logly is a privacy-first web analytics tool. A developer drops a 1kb `<script>` tag into their app. Logly then collects:

- Page views (automatically, including SPA navigation)
- Custom events (via `window.logly.track('Signup', { plan: 'pro' })`)
- Unique visitors (browser fingerprint — no cookies, GDPR-friendly)
- Bounce rate (single-page sessions / total sessions)
- Session duration

They see all of this in a real-time dashboard. That's the product.

---

## The Hard Part Nobody Tells You

The hardest problem in analytics is **not** the dashboard. The dashboard is just React + a few queries. The hard problem is the **collector endpoint**.

Here's the reality: a medium-sized SaaS might have 50,000 users. If each user visits 10 pages a day, you're handling 500,000 events per day — about 6 events per second on average. But traffic is not average. It spikes. A product hunt launch sends 1,000 events per second for 20 minutes.

### Why you can't write directly to PostgreSQL on every request

PostgreSQL has a connection limit. By default, it's 100 connections. Each Node.js server process holds a connection pool. Under load:

1. Every POST `/api/collect/:trackingId` does a DB write
2. Each write holds a connection for ~5ms
3. At 1,000 req/s, you need 5,000 simultaneous connections
4. PostgreSQL falls over. Every request starts timing out.
5. Your collector starts returning 500s. Events are lost.

Even with PgBouncer (a connection pooler), direct writes at this scale will cause write latency spikes that back-pressure your Node.js event loop. The collector endpoint becomes slow. The tracking script starts timing out. Users notice.

### Why you can't do synchronous processing on every request

The collector endpoint needs to respond in < 5ms. If it's doing:
- JWT validation (fine, fast)
- GeoIP lookup per event (not fine — disk I/O)
- User-agent parsing (not fine — CPU)
- Database write (not fine — network + I/O)

...then it's going to take 20–50ms per request. That's a 10–50x latency spike. At scale, your Node.js event loop queues up. The GC runs. Latency climbs to 200ms. The `navigator.sendBeacon()` calls in users' browsers start failing silently.

### The right architecture: Redis buffer + background worker

```
Browser
  └─► POST /api/collect/:trackingId  (< 2ms response)
           │
           ▼
       Redis LIST (LPUSH)
           │
           ▼ (every 5 seconds)
       Background Worker
           │
           ├─► Batch INSERT into events (PostgreSQL)
           ├─► UPDATE daily_stats (upsert)
           └─► GeoIP + UA enrichment (happens here, not in hot path)
```

**The collector endpoint does three things only:**
1. Validate the trackingId exists (cache this in Redis — a simple SET with the project_id value)
2. Sanitize/validate the payload (Zod, fast)
3. `LPUSH logly:events:{trackingId} <json>` — push to Redis list

That's it. Redis LPUSH is < 0.5ms. Your collector endpoint responds in 1–2ms total. It can handle tens of thousands of requests per second on a single process.

**The background worker runs every 5 seconds:**
```ts
// Pseudo-code for the worker loop
setInterval(async () => {
  // LRANGE + LTRIM is atomic-ish (use a Lua script for true atomicity)
  const raw = await redis.lrange('logly:events:queue', 0, 999);
  await redis.ltrim('logly:events:queue', 1000, -1);

  if (raw.length === 0) return;

  const events = raw.map(r => JSON.parse(r));
  // Enrich with GeoIP + UA parsing here
  // Batch insert into PostgreSQL
  await db.events.createMany({ data: events });
  // Upsert daily_stats
  await updateDailyStats(events);
}, 5000);
```

**Why Redis instead of an in-memory array in Node.js?**

Good question. In development, an in-memory array is fine and simpler. But in production:
- You'll run multiple Node.js processes (PM2 cluster, or multiple Fly.io instances)
- Each process has its own memory — there's no shared state
- If process A collects 500 events and crashes before flushing, those events are gone

Redis is a shared, persistent buffer. All processes write to the same queue. If a process crashes, events survive in Redis until the worker flushes them. This is the right answer.

**One watch-out:** Redis is not a message queue. If you LPUSH to a list and your worker crashes mid-flush, the events you already did LRANGE on are gone (you already trimmed them). For Logly, losing a few events in a crash is acceptable — analytics is best-effort. If you needed guaranteed delivery, you'd use a proper queue (BullMQ, SQS). For now, Redis list is fine.

---

## The Non-Obvious Schema Design

### Why partitioned tables

At 1M events/day (a busy project), you accumulate:
- 30M events/month
- 360M events/year

A single `events` table with 360M rows is slow. A `SELECT` with `WHERE created_at > '2025-06-01'` will still do a full index scan on a 360M-row table if PostgreSQL's query planner makes bad choices. Vacuuming becomes slow. Index sizes grow huge.

PostgreSQL table partitioning solves this by making each month a physically separate table. When you query `WHERE created_at BETWEEN '2025-06-01' AND '2025-06-30'`, PostgreSQL knows to look only in the June partition — a table with 30M rows instead of 360M. Queries are 10x faster. Vacuuming is faster. You can drop old partitions (instead of slow DELETEs) to reclaim disk space.

**The Prisma limitation:** Prisma does not support declarative partitioned table creation. If you write a partitioned table in your `schema.prisma`, Prisma will ignore the `PARTITION BY` clause and create a regular table. You have to create partitioned tables via raw SQL migrations.

Here's how: in your Prisma migration SQL file, write the table creation manually instead of letting `prisma migrate` generate it.

### Full Schema

```sql
-- Users of Logly (the developers who buy the product)
CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  plan        TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- A project = one website being tracked
CREATE TABLE projects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  domain      TEXT NOT NULL,                  -- e.g. "myapp.com"
  tracking_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),  -- public, goes in the script tag
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Raw events — partitioned by month
-- NOTE: Prisma cannot generate this. Write it as raw SQL in the migration file.
CREATE TABLE events (
  id          UUID NOT NULL DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('pageview', 'custom')),
  page        TEXT NOT NULL,                  -- URL path, e.g. "/pricing"
  referrer    TEXT,                           -- where they came from
  country     TEXT,                           -- 2-letter ISO code from GeoIP
  device_type TEXT,                           -- 'desktop' | 'mobile' | 'tablet'
  event_name  TEXT,                           -- only for type='custom'
  event_props JSONB,                          -- arbitrary custom event data
  visitor_id  TEXT,                           -- browser fingerprint hash (no PII)
  session_id  TEXT,                           -- groups events into sessions
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
) PARTITION BY RANGE (created_at);

-- Create partitions for each month (you'll add more in a cron job)
CREATE TABLE events_2025_06 PARTITION OF events
  FOR VALUES FROM ('2025-06-01') TO ('2025-07-01');
CREATE TABLE events_2025_07 PARTITION OF events
  FOR VALUES FROM ('2025-07-01') TO ('2025-08-01');
-- Add primary key on the partitioned table (must include the partition key)
ALTER TABLE events ADD PRIMARY KEY (id, created_at);
-- Index on project_id + created_at — the most common query pattern
CREATE INDEX ON events (project_id, created_at DESC);

-- Pre-aggregated daily totals — queried by the dashboard for speed
-- Instead of counting rows every time, the worker keeps this updated
CREATE TABLE daily_stats (
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  date        DATE NOT NULL,
  views       INT NOT NULL DEFAULT 0,
  visitors    INT NOT NULL DEFAULT 0,  -- unique visitor_ids
  sessions    INT NOT NULL DEFAULT 0,
  PRIMARY KEY (project_id, date)
);

-- Alerts: notify when traffic spikes or drops unexpectedly
CREATE TABLE alerts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type            TEXT NOT NULL CHECK (type IN ('spike', 'drop')),
  threshold_pct   INT NOT NULL,         -- e.g. 200 = alert when 2x normal
  emails          TEXT[] NOT NULL,      -- who to notify
  last_triggered  TIMESTAMPTZ          -- prevents alert storms
);
```

**Why each decision was made:**

- `tracking_id` is a UUID (not the project's `id`) because `tracking_id` is public — it goes in the script tag, visible to anyone who views source. The project's `id` is internal and should never be exposed.
- `visitor_id` is a hash of browser fingerprint signals (screen size, user agent, timezone, language). No IP address stored — that's PII in GDPR jurisdictions.
- `session_id` is a UUID generated fresh when the user first visits, stored in `sessionStorage` (cleared on tab close). This gives us session-based bounce rate without cookies.
- `event_props JSONB` — JSONB (binary JSON) is indexed differently than JSON. You can create GIN indexes on JSONB columns for fast filtering on arbitrary keys. JSON is stored as plain text — slower to query.
- `daily_stats` exists because `SELECT COUNT(*) FROM events WHERE project_id = $1 AND created_at::date = $2` on 30M rows is slow even with indexes. The worker upserts into `daily_stats` on every flush. The dashboard reads from `daily_stats` for today's numbers — instant.
- `alerts.last_triggered` prevents you from sending 50 emails in 50 seconds when a traffic spike triggers the check loop repeatedly.

---

## The SDK

The tracking script runs in users' browsers. It needs to be:
- **Tiny**: < 2kb minified + gzipped
- **Non-blocking**: loaded with `async` attribute, never blocks page render
- **Reliable**: uses `navigator.sendBeacon` so events aren't lost when the tab closes
- **SPA-aware**: patches `history.pushState` and `history.replaceState` to track navigation in React/Vue/Svelte apps

### How SPA tracking works

In a React app, clicking a `<Link>` does `history.pushState(...)` — it changes the URL without a real page navigation. The browser fires no `load` event. A naive analytics script would record only one page view (the initial load) and miss every subsequent navigation.

The fix: monkey-patch `history.pushState`:

```ts
const originalPushState = history.pushState.bind(history);
history.pushState = (...args) => {
  originalPushState(...args);
  trackPageView(); // our function
};

window.addEventListener('popstate', trackPageView); // handles back/forward
```

This catches all SPA navigations.

### Batching strategy

Sending one HTTP request per event is wasteful. Instead:
- Buffer events in memory
- Flush when buffer reaches 10 events OR 5 seconds have passed (whichever comes first)
- On page unload, flush immediately with `navigator.sendBeacon`

`navigator.sendBeacon` is key: it's a fire-and-forget API that queues the request even as the page is unloading. Fetch and XHR get cancelled on page close. Beacon doesn't.

### Fingerprinting (no cookies)

```ts
async function getVisitorId(): Promise<string> {
  const signals = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.hardwareConcurrency,
  ].join('|');

  // Use SubtleCrypto for a deterministic hash — no external library needed
  const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(signals));
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 16); // 16 hex chars = 64 bits of entropy, plenty for fingerprinting
}
```

This gives the same visitor ID across sessions without storing anything. It changes when the user switches browsers or devices — which is correct behavior.

---

## API Design

```
Auth:
  POST /api/auth/register       { email, password } → { user, token }
  POST /api/auth/login          { email, password } → { user, token }
  GET  /api/auth/me             → { user }

Projects:
  GET    /api/projects          → Project[]
  POST   /api/projects          { name, domain } → Project
  GET    /api/projects/:id      → Project
  DELETE /api/projects/:id      → 204

Collect (high-throughput — minimal middleware, open CORS):
  POST /api/collect/:trackingId { type, page, referrer, eventName, eventProps }

Metrics:
  GET /api/projects/:id/metrics/today
      → { views, visitors, sessions, bounceRate, viewsDelta, visitorsDelta }

  GET /api/projects/:id/metrics/trend?days=7|30
      → TrendPoint[]  (date, views, visitors per day)

  GET /api/projects/:id/metrics/pages
      → PageStat[]  (page, views, visitors, bounceRate)

  GET /api/projects/:id/metrics/events
      → EventStat[]  (name, count, uniqueUsers)

  GET /api/projects/:id/metrics/realtime  (SSE)
      → stream of { count: number } every 5 seconds

Events:
  GET /api/projects/:id/events?page=1&type=pageview&from=2025-06-01&to=2025-06-30
      → { events: EventRow[], total: number, page: number }

Alerts:
  POST   /api/projects/:id/alerts         { type, thresholdPct, emails } → Alert
  DELETE /api/projects/:id/alerts/:alertId → 204
```

**The collector endpoint has its own Express router** with zero auth middleware. It needs to respond fast. Don't put your JWT middleware in front of it.

**CORS on the collector:** Wide open. Anyone can POST to it. That's intentional — the script runs on third-party sites. Rate-limit by `trackingId` (Redis, sliding window) to prevent abuse.

**SSE for realtime:** Server-Sent Events is simpler than WebSockets for one-directional streaming. The server pushes `{ count: X }` every 5 seconds. The client reconnects automatically (built into `EventSource`). For "live visitor count," query Redis for unique `visitor_id`s seen in the last 5 minutes.

---

## BUILD ORDER: PR by PR

Work in this exact order. Each PR is small and mergeable on its own. Don't skip ahead.

---

### PR 1: Project setup + shared types

**What it does:** Mono-repo scaffold. Backend is Express + TypeScript. Frontend is Vite + React. Shared `packages/types` with interfaces used by both. ESLint + Prettier configured. Husky pre-commit hook runs lint + typecheck.

**Test before merge:** `npm run typecheck` passes in both backend and frontend. ESLint passes. Dev server starts.

**Watch out:** Don't create a complex monorepo (Turborepo, Nx) yet. Use simple `npm workspaces` or just separate `package.json` files. You can add Turborepo in PR 15 if you need caching. Premature optimization here wastes days.

---

### PR 2: DB schema + partitioned events table migration

**What it does:** Prisma schema with `users`, `projects`, `daily_stats`, `alerts`. Raw SQL migration for the partitioned `events` table (because Prisma can't do it). Seed script creates a test user and project. Docker Compose file starts PostgreSQL + Redis locally.

**Test before merge:** Run `prisma migrate deploy`. Check the events table is actually partitioned: `SELECT * FROM pg_partitioned_table;` should return a row. Insert a row and confirm it goes into the right month's partition: `SELECT tableoid::regclass FROM events LIMIT 1;`

**Watch out:** The partition bounds are exclusive on the right: `FOR VALUES FROM ('2025-06-01') TO ('2025-07-01')`. An event at exactly `2025-07-01 00:00:00` goes into the July partition, not June. That's correct — just know this when you write the partition-creation cron job.

---

### PR 3: Auth API + UI (register, login)

**What it does:** `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`. JWT stored in httpOnly cookie (not localStorage — XSS-safe). Zod validation on inputs. bcrypt for password hashing (cost factor 12). Frontend: LoginPage + RegisterPage. JWT decoded to Zustand store on app load.

**Test before merge:** Register a user. Log in. Call `/api/auth/me` with the cookie — should return the user. Log in with wrong password — should get 401, not 500. SQL injection attempt in email field — Prisma parameterizes it, but confirm.

**Watch out:** Don't store the JWT in localStorage. I know it's simpler. Do it anyway with httpOnly cookies — otherwise any XSS vulnerability (from a third-party library, not even your code) can steal the token. The cookie approach requires `credentials: 'include'` on all fetch calls and proper CORS `allowCredentials: true` + explicit origin.

---

### PR 4: Projects CRUD API + basic UI

**What it does:** Full CRUD for projects. Frontend shows project list as cards. "New Project" opens a modal with name + domain fields. After creation, navigates to the dashboard (empty state for now). Delete project from settings page (PR 16 territory, but add the API now).

**Test before merge:** Create two projects under the same user. Confirm you cannot access another user's project (try hitting `/api/projects/:otherId` — should get 403, not the project). Delete a project — confirm its events cascade-delete.

**Watch out:** The `trackingId` must be returned in the API response — the user needs it for their script tag. Don't confuse `id` (internal) with `trackingId` (public). Log them both in the response so it's obvious.

---

### PR 5: Collector endpoint + Redis buffer (in-memory first)

**What it does:** `POST /api/collect/:trackingId`. Validates the trackingId (lookup in Redis cache, falls back to DB). Validates the payload with Zod. Pushes to Redis list. For now, also includes a simple in-memory flush every 5s (just to prove data gets to the DB — the proper worker comes in PR 7).

**Test before merge:** Send 100 events via curl. Check they appear in the `events` table after 5s. Send an event with an invalid `trackingId` — should 404. Send a malformed payload — should 400. Check the response time is < 10ms under normal load.

**Watch out:** The collector must NOT require auth. Don't put `requireAuth` middleware on the `/api/collect` router. The script tag is public. Anyone can call this endpoint with a valid `trackingId`. Rate-limit it: 1000 events per `trackingId` per minute using a Redis sliding window counter. Anything above that gets 429 and dropped (better than crashing).

---

### PR 6: Dashboard page (static/mock data)

**What it does:** The full dashboard layout with hardcoded data. MetricCards showing fake numbers. TrendChart with fake data points. Top Pages table. Top Events table. RealtimeCount showing a static "5 visitors right now." This is a UI-only PR — no real API calls yet.

**Test before merge:** The dashboard renders without errors at all viewport sizes. Dark theme looks correct. MetricCards show the right delta colors (green for positive, red for negative). Chart renders and is responsive.

**Watch out:** Get the layout right now. It's much harder to change the dashboard structure after the data is wired up. Spend time here on spacing, typography, and dark mode. The dashboard is what users see every day — it needs to feel good.

---

### PR 7: Background worker: Redis → PostgreSQL flush + daily_stats

**What it does:** A proper background worker (runs as a separate Node.js process, or a `setInterval` in the backend process). Every 5s: drains the Redis queue, enriches events with GeoIP (use `geoip-lite` — it's an npm package with the MaxMind database bundled) and UA parsing (`ua-parser-js`), batch-inserts into `events`, upserts `daily_stats`.

**Test before merge:** Emit 1000 events. Confirm they all land in `events`. Check `daily_stats` is updated correctly. Kill the worker mid-flush and restart — events should be safe in Redis (you haven't trimmed them yet... actually you have — see the watch out).

**Watch out:** The Redis LRANGE + LTRIM pattern is not atomic. Between your LRANGE (read) and LTRIM (delete), another worker instance could LRANGE the same events. In a single-worker setup this is fine. If you ever run multiple workers, use a Lua script or GETDEL pattern to pop atomically. For now, just run one worker and document this limitation.

---

### PR 8: Trend charts (7d/30d)

**What it does:** Wire up `GET /api/projects/:id/metrics/trend?days=7` to the frontend. The backend queries `daily_stats` for the last N days. The frontend renders the `TrendChart` with real data. Add the date range selector (Today / 7d / 30d) to the dashboard header.

**Test before merge:** Generate events across several days (use a script). Check the chart shows the right shape. Switch between 7d and 30d — should update without a full page reload. Test with a project that has no events — chart should show zeros, not crash.

**Watch out:** `daily_stats` only has rows for days with activity. If the user hasn't had any events on Tuesday, there's no row for Tuesday. Your API needs to fill in zeros for missing days before returning the trend data. Don't let the frontend do this — it complicates the chart rendering.

---

### PR 9: Real-time live count via SSE

**What it does:** `GET /api/projects/:id/metrics/realtime` returns an SSE stream. Every 5 seconds, the server queries Redis for unique `visitor_id`s seen in the last 5 minutes (use a Redis Sorted Set with timestamps as scores — ZRANGEBYSCORE to count recent ones). Sends `data: {"count":5}\n\n` to the client. Frontend `RealtimeCount` component connects to this stream.

**Test before merge:** Open the dashboard. Emit some events via curl. The count should update within 5s. Close the browser tab — the SSE connection should clean up server-side (listen for `req.on('close', ...)`). Open two browser tabs — two SSE connections should both work.

**Watch out:** SSE connections are long-lived HTTP connections. They hold a Node.js socket open. With 10,000 concurrent dashboard users, you'd have 10,000 open connections. This is fine for Node.js (it's event-loop based, not thread-based) but you need to set `res.setHeader('Connection', 'keep-alive')` and handle the client disconnect properly to avoid memory leaks.

---

### PR 10: Top pages + top events breakdown

**What it does:** `GET /api/projects/:id/metrics/pages` — aggregate by `page` from the `events` table for the current date range. `GET /api/projects/:id/metrics/events` — aggregate by `event_name`. Wire these to the frontend tables.

**Test before merge:** A project with 10 different pages should show them sorted by view count descending. A project with no custom events should show an empty state in the events table, not an error. Test with a large number of rows (500 distinct pages) — confirm it returns only the top 50.

**Watch out:** These queries hit the raw `events` table, not `daily_stats`. For "today" this is fine — the partition is small. For longer date ranges (30d), these queries will be slow if your `events` table is large. Add the index on `(project_id, created_at DESC)` now (you might have already from PR 2) and consider caching the results in Redis for 60 seconds.

---

### PR 11: SDK v1 (page view tracking)

**What it does:** The `sdk/src/index.ts` TypeScript source. Compiles to `sdk/dist/logly.min.js` with esbuild (< 2kb). Auto-tracks page views including SPA navigation via `history.pushState` patch. Batches events. Uses `navigator.sendBeacon` on unload. No cookie usage — visitor ID via SubtleCrypto fingerprint, session ID via sessionStorage.

**Test before merge:** Drop the script in a test HTML page. Navigate between pages. Check that events appear in the `events` table. Reload the page — same `visitor_id` should be sent. Open an incognito window — different `visitor_id`. Close the tab mid-session — check the last event was captured via beacon.

**Watch out:** The SDK runs in users' production sites. Any uncaught exception in your SDK breaks their site. Wrap everything in a try/catch. If the SDK fails, it should fail silently (log to console in dev, nothing in prod). Never let your analytics code break the host page.

---

### PR 12: Custom events + SDK v2

**What it does:** `window.logly.track(eventName, props)` API. Props are arbitrary key-value pairs stored in `event_props` (JSONB). SDK v2 is backward-compatible with v1 (same script tag, just new capability). Frontend dashboard wires up the Top Events table to real data.

**Test before merge:** Call `window.logly.track('Signup', { plan: 'pro', trial: true })`. Check the `events` table — `type` should be `custom`, `event_name` should be `Signup`, `event_props` should be `{"plan":"pro","trial":true}`. Try passing non-serializable props (functions, circular objects) — should be stripped without throwing.

**Watch out:** Don't let users send unbounded `event_props`. A user could accidentally pass a huge object (e.g., the entire Redux store). Add a size check: if the serialized props are > 1kb, log a warning and drop the excess. This protects your DB and your Redis queue.

---

### PR 13: Event explorer table (paginated, filtered)

**What it does:** `/projects/:id/events` route. A filterable, paginated table of raw events. Filters: type (pageview/custom), date range (from/to). 50 rows per page. API returns `{ events, total, page }`. Frontend has previous/next navigation and active filter badges.

**Test before merge:** A project with 500 events: paginating through all pages should sum to 500. Filter by type=custom — only custom events appear. Filter by a date range — only events in that range appear. Combine filters — both apply simultaneously.

**Watch out:** Pagination with OFFSET gets slow on large tables (OFFSET 10000 means PostgreSQL reads and discards 10,000 rows). For Logly's event explorer, OFFSET is fine for the MVP — users rarely go beyond page 5. If you need to optimize later, switch to cursor-based pagination (keyset: `WHERE id < $lastId ORDER BY id DESC`).

---

### PR 14: Email alerts with BullMQ

**What it does:** A BullMQ job queue (backed by Redis). Every hour, a job runs for each project with an active alert. It compares the last hour's traffic to the average of the same hour yesterday/last week. If it's X% higher or lower than the threshold, it sends an email (use Resend — the simplest transactional email API). Updates `alerts.last_triggered` to prevent re-alerting within 1 hour.

**Test before merge:** Create an alert with threshold 10% and send enough events to trigger it. Check that an email arrives. Send events again within the hour — the second alert should NOT fire (last_triggered check). Remove the alert — confirm no more emails.

**Watch out:** BullMQ jobs can fail. Implement `onFailed` handlers that log the error and retry up to 3 times with exponential backoff. A broken email config shouldn't cause unhandled rejections that crash your worker process.

---

### PR 15: Deploy — Fly.io (backend) + Vercel (frontend)

**What it does:** Backend deployed to Fly.io with a `fly.toml`. Frontend deployed to Vercel. Managed PostgreSQL on Fly.io (or Neon — cheaper for small projects). Redis via Upstash (free tier is fine for < 10k commands/day). Environment variables wired up. Health check endpoint `GET /health` returns 200.

**Test before merge:** Full end-to-end: drop the script tag in a test page hosted on Netlify. Events should appear in the production dashboard. The collector should respond in < 50ms from any continent (Fly.io has global anycast). Check the Fly.io metrics dashboard for memory usage — the worker should use < 100MB steady-state.

**Watch out:** Set `NODE_ENV=production` on Fly.io. Without it, many libraries enable dev-only logging and checks that slow things down. Also set `DATABASE_URL` to use a connection pooler (PgBouncer) in front of PostgreSQL — Fly Postgres comes with PgBouncer built in. Without it, you'll hit connection limits under load.

---

## The Non-Obvious Things That Will Bite You

**1. CORS on the collector vs. the API**

The collector (`/api/collect`) needs permissive CORS — any origin can send events. Your API endpoints (`/api/projects`, `/api/auth`) should only accept requests from your frontend domain. Set up two different CORS configurations. Don't accidentally make your API wide-open.

**2. The `trackingId` is public, the project `id` is not**

Every API endpoint under `/api/projects/:id` should verify that the `id` belongs to the authenticated user. This seems obvious but it's easy to forget in one endpoint. A user who knows another user's project UUID should get 403, not the data.

**3. Time zones in analytics are a trap**

"Today's views" means different things in UTC, New York, and Tokyo. Decide on UTC and document it. Display dates in the user's local timezone on the frontend using `Intl.DateTimeFormat`. Store everything in UTC in the database. Never mix the two.

**4. The daily_stats upsert must be idempotent**

If the worker crashes and restarts, it will re-process some events. The `daily_stats` upsert must handle this correctly:

```sql
INSERT INTO daily_stats (project_id, date, views, visitors, sessions)
VALUES ($1, $2, $3, $4, $5)
ON CONFLICT (project_id, date)
DO UPDATE SET
  views    = daily_stats.views    + EXCLUDED.views,
  visitors = daily_stats.visitors + EXCLUDED.visitors,
  sessions = daily_stats.sessions + EXCLUDED.sessions;
```

If you process the same batch twice, you'll double-count. This is why idempotency keys or event deduplication matter in production. For the MVP, accept that occasional worker crashes may cause slight over-counting — log it and revisit.

**5. Fingerprint collisions are real but rare**

Two users with the same browser, OS, timezone, language, and screen resolution will get the same `visitor_id`. This is fine — it's a known tradeoff of fingerprint-based tracking. The alternative (cookies) requires cookie consent banners in the EU. Log the fingerprint signals you're using so you can tune them later.

---

## The Code Quality Rules I Actually Enforce

- Every API route that touches the DB must have error handling. A Prisma error without a try/catch becomes a 500 with a stack trace in the response — information disclosure.
- No `any` in TypeScript. Use `unknown` and narrow it. If you're typing an external API response, write the interface.
- All dates in the database are `TIMESTAMPTZ`, never `TIMESTAMP`. The difference: `TIMESTAMPTZ` stores UTC and converts on read; `TIMESTAMP` stores exactly what you give it with no timezone awareness. You will get burned by `TIMESTAMP` at daylight saving boundaries.
- Every background job has a timeout. A hung GeoIP lookup should not block the entire flush cycle. Wrap external calls with `Promise.race([doTheThing(), timeout(2000)])`.
- The collector endpoint must never log raw event payloads in production. Event data can contain sensitive user information. Log only `trackingId` and `type`.

---

## You're Building a Real Product

When you finish this, you'll have:
- A real SaaS architecture that handles serious traffic
- Experience with the patterns that power most analytics tools (buffer → worker → aggregate)
- A frontend that you could demo to a real customer today
- Deep PostgreSQL knowledge (partitioning, JSONB, window functions)
- A working SDK that runs in someone's production browser

Don't rush. Each PR is a complete unit of work. Understand each decision before moving to the next one. The goal isn't to finish fast — it's to finish knowing exactly why every line of code exists.
