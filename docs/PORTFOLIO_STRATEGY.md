# SDE-2 Portfolio Strategy

**Target:** Fullstack SDE-2 | **Background:** 3 yrs NetSuite | **Repo:** abdullahsadik00/Learning-chunk

---

## How this repo reads today

The README opens with *"Fork this repo and follow the 55-day plan."* That single line repositions you as a student documenting a course — not an engineer demonstrating capability. A recruiter spending 90 seconds on your GitHub reads the title and the first paragraph. Both currently say "learner."

| Dimension | Current | Strength | What's missing |
|---|---|---|---|
| System design thinking | absent | 1/10 | No architecture docs, no trade-off writeups |
| Production-grade project | absent | 1/10 | Paytm clone is tutorial-level; no deployed app |
| API design | partial | 2/10 | Routes exist in Paytm but no versioning, no docs |
| Database design | partial | 2/10 | MongoDB schema in Paytm; no relational design shown |
| Caching / scalability | absent | 0/10 | No Redis, no queue, no throughput reasoning |
| Testing | partial | 2/10 | Jest in backend/middleware only; no integration tests |
| Frontend architecture | partial | 3/10 | React curriculum is good but no cohesive app using it |
| TypeScript discipline | present | 5/10 | Nine TS exercises exist; not used in a real project yet |
| CI / DevOps basics | partial | 2/10 | Lint CI exists; no test CI, no Docker, no deployment |

**What's salvageable:** The curriculum depth is real and shows discipline. The Logly project (`projects/logly/GUIDE.md`) already contains sophisticated architectural thinking about the event pipeline problem. Build Logly first — the hard design work is already done.

**The NetSuite angle:** 3 years of NetSuite is a stronger card than you think. NetSuite is a multi-tenant, workflow-heavy enterprise SaaS platform. You have real experience with data modeling at scale, workflow/approval patterns, multi-tenant isolation, API integration, and enterprise auth. Lead with that framing: *"I've been building on a SaaS platform that serves thousands of tenants. Now I want to build one."*

---

## What SDE-2 actually means

SDE-2 is not "knows more technologies." It is a specific set of judgment signals.

**Minimum technical bar:**
- Implements features end-to-end without hand-holding
- Writes code others can maintain
- Handles failure cases, not just the happy path
- Picks appropriate data structures
- Writes tests that actually catch regressions

**SDE-2 differentiator (what gets offers):**
- Reasons about trade-offs under constraints
- Considers operational concerns: what happens at 10× load?
- Owns a subsystem, not just a ticket
- Thinks about API contracts, not just implementation
- Can sketch a design, defend it, and revise it

---

## The three flagship projects

These three projects together demonstrate: real-time systems (WebSockets), event pipelines (Redis + queues), cache-first architecture, multi-tenancy, RBAC, PostgreSQL relational design, React frontends at different complexity levels, and API design with versioning.

---

### Project 1: Logly — Privacy-First Web Analytics

> `projects/logly/` — already spec'd in your repo

Plausible.io / Fathom equivalent. A multi-tenant SaaS analytics platform with a real-time event ingestion pipeline.

**Tags:** Event Pipeline · Redis Buffering · Multi-tenant SaaS · Time-series Queries · Real-time SSE · GDPR-friendly

**Why this wins interviews:** The hard problem in analytics is not the dashboard — it's the collector endpoint. Explaining why you can't write directly to PostgreSQL on every request (connection pool exhaustion at 1k req/s), and how Redis buffering solves it, is exactly the production-awareness that separates SDE-2 from SDE-1 candidates.

#### Architecture

```
1kb tracking script
  → POST /collect/:trackingId
  → Redis LIST buffer
  → BullMQ worker (batch of 500)
  → PostgreSQL
  ↕
Dashboard API → React dashboard
```

The collector is public, has no auth, and never waits for a DB write. It pushes to a Redis list and returns 200 in <5ms. BullMQ workers drain the list in batches.

#### API Design

```
# Public — no auth — must be blazing fast
POST  /api/v1/collect/:trackingId   # receive page view or custom event

# Authenticated — dashboard reads
GET   /api/v1/stats/pageviews       # ?siteId=&period=7d&tz=UTC
GET   /api/v1/stats/sources         # referrer breakdown
GET   /api/v1/stats/events          # custom event aggregates
GET   /api/v1/stats/realtime        # SSE stream, active visitors now

# Site management
POST  /api/v1/sites                 # register domain, get tracking ID
GET   /api/v1/sites/:id
GET   /api/v1/sites/:id/snippet     # returns the <script> tag to embed
```

#### Database Schema (PostgreSQL)

```sql
users       (id, email, password_hash, created_at)

sites       (id, user_id, domain, tracking_id, created_at)
            -- UNIQUE INDEX on tracking_id (UUID)

events      (id, site_id, event_type, page, referrer,
             country, device_type, session_id, created_at)
            -- partial index: WHERE created_at > NOW() - INTERVAL '90d'
            -- partition by month if volume exceeds 10M rows

daily_stats (site_id, date, pageviews, unique_visitors,
             bounce_rate, avg_duration)
            -- materialized daily by cron; powers fast dashboard reads
```

#### System Design Trade-offs

**Direct PostgreSQL write vs Redis buffer**
Direct is simpler but breaks under traffic spikes. A product launch can send 1k events/sec. PG's 100-connection default means you'd need 5k concurrent connections to sustain that. Redis list + batch worker decouples ingestion throughput from DB write throughput entirely.

**Cookie tracking vs browser fingerprinting**
Cookies need consent banners (GDPR). Fingerprinting (user agent + IP hash + screen dims) is stateless, cookieless, and privacy-respecting — but less accurate (~3% collision rate). Fingerprinting enables "no cookie banner" as a product differentiator.

**Live query vs pre-aggregated daily_stats table**
Live queries over the events table are flexible but slow at 10M+ rows. A nightly aggregation job populates daily_stats. Dashboard queries hit the aggregated table for all historical data, live-query only for today. 100× faster dashboard loads.

#### Feature Breakdown

**MVP (build this first):**
- Tracking script + collector endpoint
- Site registration + tracking ID
- Pageview count + unique visitor count
- Top pages, top referrers dashboard
- JWT auth + user account
- Redis buffer + BullMQ worker

**Advanced (interview talking points):**
- Real-time active visitors via SSE
- Custom event tracking API
- Goal / conversion funnel
- CSV export of raw events
- Public dashboard share link
- Rate limiting by tracking ID

---

### Project 2: FlowBoard — Real-Time Collaborative Project Management

> `projects/flowboard/` — new project

Linear / Trello-lite. Multi-workspace Kanban with live updates, RBAC, and drag-and-drop ordering.

**Tags:** WebSockets · Optimistic UI · RBAC · Fractional Indexing · PostgreSQL Relational · Redis Pub/Sub

**Why this wins interviews:** Real-time collaborative apps appear in almost every senior fullstack system design interview. Being able to explain "how does drag-and-drop ordering work in the DB without rewriting every row's position?" (fractional indexing) demonstrates exactly the detail-oriented systems thinking hiring managers look for.

#### Architecture

```
React + Zustand (optimistic updates)
  → REST API (Express) + Socket.io
  ↕                    ↕
PostgreSQL          Redis pub/sub
                    (scales Socket.io across processes)
```

#### API Design

```
POST  /api/v1/auth/signup
POST  /api/v1/auth/login
POST  /api/v1/auth/refresh           # rotate JWT with refresh token

GET   /api/v1/workspaces
POST  /api/v1/workspaces
POST  /api/v1/workspaces/:id/members # invite by email, assign role

GET   /api/v1/boards/:id             # full board: columns + cards
POST  /api/v1/boards/:id/columns
POST  /api/v1/columns/:id/cards

PATCH /api/v1/cards/:id              # move column, update title, assign
DELETE /api/v1/cards/:id

# WebSocket events (Socket.io room: board:${boardId})
client→server: card:move, card:update, card:create
server→client: board:patch           # JSON patch delta, not full board
```

#### Database Schema (PostgreSQL)

```sql
users              (id, email, password_hash, name, avatar_url)

workspaces         (id, name, owner_id, slug, created_at)

workspace_members  (workspace_id, user_id,
                   role: owner|admin|member, joined_at)
                   -- PK is (workspace_id, user_id)

boards             (id, workspace_id, name, created_at)

columns            (id, board_id, title, position)
                   -- position is a FLOAT for fractional indexing
                   -- insert between 0.5 and 1.0 → use 0.75, no rewrite

cards              (id, column_id, title, description,
                   assignee_id, due_date, position, created_at)

activity_log       (id, board_id, user_id, action, metadata JSONB,
                   created_at)   -- audit trail, powers "Activity" tab
```

#### System Design Trade-offs

**Integer position vs fractional indexing for card ordering**
Integer positions require updating every sibling row on reorder (O(n) writes, lock contention). Floats allow inserting between two values with a single row update. Edge case: floats converge to the same value after ~50 reorders — regenerate the sequence periodically or use LSeq strings that never converge.

**Optimistic updates vs server-confirmed updates**
Optimistic (update local state immediately, confirm later) gives instant UX but two users moving the same card simultaneously causes conflicts. MVP: last-write-wins via server timestamp. Advanced: operational transformation. Choose based on the product's conflict tolerance.

**Single Socket.io server vs Redis pub/sub adapter**
Single server is fine for MVP. At 2+ Node processes, you need the Redis adapter so a message sent by one process broadcasts to clients connected to all others. Build with the adapter from day one — it costs almost nothing and removes a scaling cliff.

#### Feature Breakdown

**MVP:**
- Auth (JWT + refresh tokens)
- Workspace + board + column + card CRUD
- Drag-and-drop card reordering
- Live updates via Socket.io
- RBAC: owner / admin / member
- Card assign + due date

**Advanced:**
- Activity log feed per board
- Card labels + filtering
- Board search
- Email invitation to workspace
- Card comments with mentions
- Keyboard shortcuts

---

### Project 3: LinkLens — URL Shortener with Click Analytics

> `projects/linklens/` — new project

Bitly equivalent. Cache-first redirect architecture with per-link analytics, rate limiting, and custom slugs.

**Tags:** Cache-First Design · Redis Hash · Write-Behind Cache · Rate Limiting · Background Jobs · API Key Auth

**Why this wins interviews:** URL shortener is the most common system design warm-up in SDE-2 interviews. Having *built* it — and explaining the exact Redis data structure you used, why you chose write-behind caching, and how you handle cache invalidation on link deletion — turns a textbook answer into a live demo.

#### Architecture

```
GET /r/:code
  → Redis HGET (~1ms)     → 301/302 redirect
  → cache miss
  → PostgreSQL            → populate Redis → redirect
                          → async: click event → geo/UA enrichment → PostgreSQL clicks
```

#### API Design

```
# Public redirect — must be <10ms p99
GET   /r/:code                        # redirect; logs click async

# Authenticated (API key in header: X-API-Key)
POST  /api/v1/links                   # { url, customSlug?, expiresAt? }
GET   /api/v1/links                   # paginated list
GET   /api/v1/links/:id/stats         # clicks by day, country, device
DELETE /api/v1/links/:id              # invalidates Redis key immediately

# Rate limiting:
# 100 redirects/min per IP (Redis sliding window)
# 1000 link creates/day per API key (Redis counter + TTL)
```

#### Database Schema + Redis Keys

```sql
-- PostgreSQL
users  (id, email, password_hash, api_key)

links  (id, user_id, original_url, short_code,
        custom_alias, expires_at, created_at)
        -- UNIQUE INDEX on short_code

clicks (id, link_id, ip_hash, country, device_type,
        browser, referrer, clicked_at)
        -- no raw IP stored — privacy by design

-- Redis key design
link:{code}         → HASH  { url, userId, expiresAt }
rl:ip:{ip}          → ZSET  sorted set for sliding window rate limit
api:quota:{userId}  → STRING (INCR + EXPIRE for daily quota)
```

#### System Design Trade-offs

**301 (permanent) vs 302 (temporary) redirect**
301 is cached by the browser indefinitely — after the first visit the browser never calls your server again. Great for throughput, terrible for analytics (you lose click data after cache warms). Use 302 for trackable links, 301 only for "permanent" alias use cases.

**Write-behind cache vs write-through cache**
Write-through (write to DB before returning) adds 10–20ms to every POST /links response. Write-behind (write to Redis immediately, async sync to DB) is faster but risks data loss if the worker crashes before flushing. For link creation, write-through is fine. For click counts, write-behind is correct.

**Short code generation: random vs counter-based**
Counter-based (base-62 encode an auto-increment ID) is predictable and collision-free. Random (nanoid, 6 chars) is unpredictable but has a small birthday-problem collision chance at 10M+ links (~1%). Counter leaks volume info. Use random — it demonstrates you thought about the trade-off.

#### Feature Breakdown

**MVP:**
- Create short link, redirect, analytics
- Redis-first redirect (<10ms p99)
- Custom slug support
- Link expiry (TTL)
- API key auth
- Rate limiting per IP + per user

**Advanced:**
- Click map by country (choropleth)
- QR code generation per link
- Link groups / campaigns
- Password-protected links
- Webhook on click (notify a URL)
- UTM parameter auto-append

---

## Ideal repo structure

```
Learning-chunk/
│
├── README.md                ← rewrite completely (see below)
│
├── projects/
│   ├── logly/
│   │   ├── README.md        ← architecture overview + live demo link
│   │   ├── backend/         ← Node/Express/TypeScript
│   │   ├── frontend/        ← React/TypeScript
│   │   ├── worker/          ← BullMQ event processor
│   │   ├── docs/
│   │   │   ├── architecture.md   ← diagram + trade-off rationale
│   │   │   └── api.md            ← full API reference
│   │   └── docker-compose.yml    ← spin up postgres + redis instantly
│   ├── flowboard/           ← same structure
│   └── linklens/            ← same structure
│
├── system-design/           ← public thinking — high interview value
│   ├── rate-limiter.md      ← token bucket vs sliding window
│   ├── notification-system.md
│   ├── url-shortener.md     ← reference your LinkLens build
│   └── realtime-collab.md   ← reference your FlowBoard build
│
├── basics/                  ← keep, reframe in README as "foundations"
│   ├── typescript/
│   ├── react/
│   └── assessments/
│
└── .github/
    └── workflows/
        ├── ci.yml            ← lint + test on every PR
        └── deploy-logly.yml  ← deploy to Railway on merge to main
```

**Non-negotiable:** Each project needs a `docker-compose.yml` that starts PostgreSQL and Redis with one command. If a recruiter can't run your project locally in under 2 minutes, they won't. And each project needs a live deployment URL in its README.

---

## README rewrite

**Current opening (what a recruiter reads now):**
> "A structured SDE learning path from zero to SDE-2... Fork this repo, follow the 55-day plan, and track your own journey to SDE-2."

**Rewritten opening:**
> Fullstack engineering portfolio. Three production-grade projects: a web analytics SaaS (event pipeline + Redis buffering), a real-time collaborative kanban (WebSockets + RBAC), and a URL shortener (cache-first, Redis-backed). Each includes architecture docs, API design, DB schema, and a live deployment.

**README structure after the rewrite:**

1. **Projects table** — name, one-line description, tech stack, live demo link, architecture doc link. Above the fold. Everything else is below.
2. **System design** — 2–3 sentence hook linking to your `system-design/` folder.
3. **Background** — "3 years building on a multi-tenant enterprise SaaS platform (NetSuite). This repo documents my transition to fullstack engineering." One paragraph. Professional, not apologetic.
4. **Foundations** — Brief mention of the curriculum: "TypeScript, React, Node, PostgreSQL, Redis." Not "55-day plan."

**Remove the word "learning" from the top 3 visible lines of your README.** Every instance of it signals "work in progress" to a recruiter. Replace with the names of what you built.

---

## Interview impact map

| Interview question | Reference project | Specific talking point |
|---|---|---|
| "Design a system that handles high write throughput" | Logly | Collector → Redis list → batch worker. Decouples ingestion from persistence. |
| "How would you build a real-time feature?" | FlowBoard | Socket.io rooms, optimistic UI, Redis adapter for horizontal scaling. |
| "Design a URL shortener" (classic warm-up) | LinkLens | Cache-first redirect, Redis hash key design, 301 vs 302 trade-off. |
| "How do you implement rate limiting?" | LinkLens | Redis sliding window with sorted sets. Token bucket vs sliding window trade-off. |
| "How would you implement RBAC?" | FlowBoard | workspace_members junction table with role enum. Middleware checks role before route handler. |
| "How do you handle multi-tenancy?" | Logly | Every query scoped by site_id (which is user-scoped). No cross-tenant bleed by construction. |
| "How do you approach caching?" | Logly + LinkLens | Two different strategies: pre-aggregated table (Logly) vs cache-first reads (LinkLens). |
| "Tell me about a database design decision" | FlowBoard | Float position column for fractional indexing. The integer-position problem and the trade-off. |
| "How do you design APIs?" | All three | REST with /api/v1/ versioning, consistent error envelope, separate auth and data routes. |

---

## Build order and timeline

| Week | Build | Outcome |
|---|---|---|
| 1–2 | Logly MVP | Tracking script → Redis buffer → worker → PostgreSQL → React dashboard. Deploy to Railway. |
| 3 | Logly advanced | SSE real-time feed + architecture.md (trade-offs, diagrams). This doc is as important as the code. |
| 4–5 | LinkLens | Redis key design + rate limiter. Write the url-shortener.md system design doc referencing it. |
| 6–8 | FlowBoard | WebSockets add real complexity. Budget extra time. Start REST-only, add Socket.io after core CRUD works. |
| 9 | Polish | Rewrite root README. Add docker-compose.yml to each project. Write 2 system-design docs. Update LinkedIn. |
