# Logly — Interview Talking Points

Rehearse until each answer is a story you can tell in 60–90 seconds without notes.
The goal isn't to recite — it's to sound like someone who *made the decisions*.

---

## 0. The 20-second pitch (memorize this cold)

> "Logly is a privacy-first web analytics tool — like Plausible. A developer drops one script
> tag in, and gets a real-time dashboard. The interesting engineering is on the backend: the
> ingestion path has to survive traffic spikes without slowing the dashboards, and the whole
> thing is built so it's *physically incapable* of storing personal data — no cookies, no
> consent banner. I built the SDK, the collector, a background worker, the PostgreSQL data
> model, and the React dashboard."

Then stop. Let them pick what to drill into.

---

## 1. "Why not just write to PostgreSQL on every event?" (the core story)

**The problem:** Postgres defaults to ~100 connections; each write holds one for ~5ms. At a
traffic spike (say 1,000 events/sec during a Product Hunt launch) you'd need thousands of
simultaneous connections — Postgres falls over and starts dropping events. And the collector
must respond in < 5ms or the browser's `navigator.sendBeacon` calls fail silently.

**The solution — the write/read seam:** The collector does only three things: resolve the
tracking key (Redis cache), Zod-validate the payload, and `RPUSH` it onto a Redis list. That's
1–2ms. A separate **background worker** drains the list every 5s and does the expensive work
off the hot path — GeoIP, user-agent parsing, batch-inserting events, updating rollups.

**The one-liner:** *"Ingestion and analytics scale independently. A traffic spike can never slow
a dashboard, because they don't share a database reach-in."*

**Follow-up: "Why a Redis list and not a real queue?"**
> "For an MVP a list is enough and simpler. Its weakness is it's not a real message queue —
> if the worker crashes mid-flush after trimming, that batch is lost. For best-effort analytics
> that's acceptable. The migration path is Redis Streams with consumer groups, which gives
> durable, ordered, multi-worker consumption — I'd move to it before running more than one worker."

---

## 2. "How does the privacy model actually work?" (your differentiator)

**Visitor identity is a daily-salted hash, computed server-side in the worker:**
`visitor_hash = SHA256(daily_salt || ip || user_agent || project_id)`

- The `daily_salt` is random, lives **only in memory (Redis with a TTL to midnight UTC)**, and
  is **destroyed every 24h**. It's never written to disk.
- The raw IP is used only to compute the hash and resolve a 2-letter country, then **discarded** —
  never stored.
- Because the salt is gone tomorrow, yesterday's hash **cannot be reproduced or joined** to
  today's. Cross-day identity is impossible *by construction* — not by policy, by math.

**Why it matters:** GDPR/CCPA compliance falls out for free, with no cookie banner, because the
schema is *physically incapable* of storing a person.

**Follow-up: "What do you lose with this model?"** (know the trade-off — it's the honest tell)
> "Returning-visitor metrics across days. A 'session' can't span midnight. That's a deliberate
> trade: I give up cross-day identity to get airtight privacy. The dashboard says so out loud —
> 'sessions are anonymous and reset daily.'"

**Follow-up: "Isn't a fingerprint hash still identifying?"**
> "Within a single day, yes — that's how I count unique visitors. Across days, no, because the
> salt rotates. And I never store the inputs (IP, UA), only the hash. Two identical browsers
> can collide, which I accept — it's the cost of not using cookies."

---

## 3. "Walk me through the data model." (event-first + rollups)

- **Raw events are an append-only, immutable log**, partitioned by month in PostgreSQL.
  Corrections are new events, never updates.
- **Everything the dashboard reads is a rollup** — pre-aggregated daily/hourly stats the worker
  maintains. Dashboards *never* scan raw events; that's how I hit a < 400ms query budget.
- **Rollups are rebuildable.** Since events are immutable, any rollup is a pure function of the
  log. If a rollup drifts, I recompute it — I never lose data.

**The sharp detail that impresses:** *"I put a reconciliation check in CI — it recomputes a
day's rollup from raw events and asserts it matches the incrementally-maintained one. Rollup drift
is the #1 correctness risk in this kind of system, so I test for it on every build."*

**Follow-up: "Why partition by month?"**
> "A single events table hits hundreds of millions of rows fast. Partitioning means a query for
> last week only touches the current partition, vacuum is faster, and I can drop old partitions
> instead of slow DELETEs to honor retention."

**Follow-up: "Why idempotent upserts?"**
> "If the worker crashes and reprocesses a batch, a naive insert double-counts. The daily_stats
> upsert is `ON CONFLICT ... DO UPDATE SET views = views + EXCLUDED.views`, so replaying a batch
> is safe."

---

## 4. "Tell me about the frontend architecture." (ExplorationState)

**The idea:** *"Analytics is a function of state, not a set of pages."* Every chart, filter,
table, and shareable link is a **projection of one object — `ExplorationState` — and that state
lives in the URL.**

- The URL is the single source of truth. Reload, share, bookmark → the exact same answer, no
  "save" button. A Zod codec parses/serializes it; garbage params degrade to defaults, never crash.
- **The serialized state hash is the cache key** — the same question is a cache hit, not a re-query.
- State mutations are **pure and named** (`merge`, `toggle`, `reset`, `undo`) — no clock, no
  network — which is why "last 7 days" is stored as a *relative token*, not resolved dates. Undo/redo
  is free.
- **State discipline:** TanStack Query owns all *server* state; Zustand holds *client* state only.
  Feature-first folders with lint-enforced import direction (`app → features → components → lib`;
  features never import features).

**The one-liner:** *"Because the whole view is a URL-encoded, validated state object, sharing an
answer is just sharing a link, and caching is trivial — I key it off the state hash."*

---

## 5. "How does real-time work?"

- `GET /.../realtime` is a **Server-Sent Events** stream. The worker bumps a Redis counter and
  publishes diffs via Redis pub/sub; the API fans them to connected clients.
- Live count = distinct `visitor_hash` in the last 5 min (Redis sorted set, `ZRANGEBYSCORE`).
- Production concerns I handled: **delta-only payloads**, ~2s cadence with trailing debounce,
  15–25s heartbeat, exponential-backoff reconnect that re-baselines with a fresh snapshot, and
  cleaning up the socket on `req.on('close')` to avoid leaks.

**Follow-up: "Why SSE and not WebSockets?"**
> "The data flow is one-directional — server to client. SSE is simpler, auto-reconnects via
> `EventSource`, and rides normal HTTP. I'd only reach for WebSockets if I needed genuinely
> bidirectional communication."

**The subtle point:** *"Realtime is the same projection as the historical view, just fed by a
diff stream — it converges to the rollup at each bucket close. It's a preview, never a separate
code path."*

---

## 6. "What's the SDK do?"

< 2KB, `async`, fails silently (whole thing wrapped in try/catch — it runs on customers'
production sites, so an uncaught throw would break *their* page).

- **SPA-aware:** monkey-patches `history.pushState`/`replaceState` + listens for `popstate`, so
  client-side navigations get tracked (a naive script only records the first page load).
- **Reliable:** buffers events, flushes on unload with `navigator.sendBeacon` (fetch/XHR get
  cancelled on page close; beacon doesn't).
- **No identity in the browser** — sends no cookie, no fingerprint. Identity is derived
  server-side (the daily-salted hash). Keeps the privacy story airtight and the script small.

---

## 7. The honesty section — say this *before* they catch it

If parts are still spec/in-progress, own it. This *builds* credibility:

> "The architecture and data model are fully designed and I've built it up to [X]. A few of the
> v1 surfaces — [name them, e.g. multi-grain rollups, exports] — are designed but not yet
> implemented; I sequenced them as later PRs. I deliberately built the MVP on Postgres + a Redis
> list rather than the ClickHouse + Redis Streams end-state, because you shouldn't pay for scale
> before you have the traffic that needs it — but I kept the seams clean so the migration is a
> swap, not a rewrite."

That last sentence — *"build toward the target, don't pay for it early"* — is a senior-engineer
mindset. It lands.

---

## 8. Questions to have crisp numbers for (fill these in from real runs)

- Collector p95 latency under load: **____ ms**
- Events/sec one collector process handles: **____**
- Rollup query p95: **____ ms**
- SDK gzipped size: **____ KB**

Even rough local-load-test numbers turn "I designed for scale" into "I measured it."

---

## 9. The three sentences that make you sound senior

1. *"A traffic spike must never slow a dashboard — that's why ingestion and reads never share a database reach-in."*
2. *"The schema is physically incapable of storing a person; compliance is structural, not policy."*
3. *"Rollups are pure functions of an immutable log, so drift is a recompute, never a loss — and I assert that in CI."*
