# Day 43 Assessment — Advanced Queries · Cursor Pagination · Aggregations · Full-Text Search

**Theme:** You are the engineer responsible for the "API Performance" OKR. The product has 5M rows in the main table and the team is hitting query timeouts. You have 2 weeks to cut p99 latency from 3s to 300ms.

---

### Q1 — Offset vs cursor pagination ⭐

**Scenario:** A mobile feed API uses `OFFSET 50000 LIMIT 20` to show page 2,501. Users report it gets slower as they scroll. The DBA shows the query doing a sequential scan of 50,020 rows before returning 20.

**Task:** Explain why OFFSET-based pagination degrades with large offsets. Define cursor pagination. Write an example cursor query. State the key trade-off.

**Acceptance Criteria:**
- [ ] Explains that `OFFSET N` forces PostgreSQL to scan and discard the first N rows — O(N) work that grows with every page
- [ ] Defines cursor pagination: uses a stable reference point (e.g., `WHERE id > :last_id`) so the query always starts at the right place — O(1) per page
- [ ] Writes: `SELECT * FROM posts WHERE id > :cursor ORDER BY id LIMIT 20`
- [ ] States the main trade-off: cursor pagination cannot jump to an arbitrary page number (e.g., "go to page 500")
- [ ] Notes that cursor pagination requires a consistent sort order with a unique, indexed column
- [ ] Confirms cursor pagination is the standard for infinite-scroll / feed-style UIs

---

### Q2 — Aggregate functions ⭐

**Scenario:** A reporting query uses `COUNT`, `SUM`, `AVG`, `MAX`, and `MIN` on a `revenue` column that contains some NULL rows.

**Task:** Explain the NULL behavior of each aggregate function. State what each returns when called on an empty set.

**Acceptance Criteria:**
- [ ] `COUNT(*)` counts all rows including NULLs; `COUNT(column)` counts only non-NULL values
- [ ] `SUM(column)` ignores NULL values; returns NULL on an empty set (not 0)
- [ ] `AVG(column)` ignores NULL values in both numerator and denominator; returns NULL on an empty set
- [ ] `MAX(column)` and `MIN(column)` ignore NULLs; return NULL on an empty set
- [ ] Notes that `COALESCE(SUM(column), 0)` is needed if you want 0 instead of NULL on empty sets
- [ ] Distinguishes `COUNT(*)` from `COUNT(column)` with a concrete example showing different results when NULLs are present

---

### Q3 — GROUP BY requirement ⭐

**Scenario:** A query fails with: `ERROR: column "users.name" must appear in the GROUP BY clause or be used in an aggregate function`. The SELECT has `user_id, name, COUNT(*)` but GROUP BY only has `user_id`.

**Task:** Explain the GROUP BY requirement rule. Explain when PostgreSQL allows a non-grouped column (functional dependency). Explain why violating this rule returns logically ambiguous results.

**Acceptance Criteria:**
- [ ] States the rule: every column in SELECT that is not inside an aggregate must appear in GROUP BY
- [ ] Explains why: within a group, multiple rows exist — a non-aggregated column could have different values, making the result ambiguous
- [ ] Explains functional dependency exception: if `name` is functionally determined by `user_id` (e.g., `user_id` is the primary key of the users table), PostgreSQL allows omitting `name` from GROUP BY
- [ ] Notes this exception is PostgreSQL-specific; MySQL/SQLite are more permissive but return arbitrary values
- [ ] Fixes the query: `GROUP BY user_id, name`
- [ ] Bonus: notes that `DISTINCT ON (user_id)` is an alternative when you want one representative row per group without aggregating

---

### Q4 — $queryRaw vs Prisma client ⭐

**Scenario:** A new engineer uses `$queryRaw` for everything because "it's more powerful." An experienced engineer uses Prisma client for everything because "it's type-safe." Both are partially right.

**Task:** List 3 scenarios that require raw SQL (`$queryRaw`). List 3 scenarios where the Prisma client is the correct tool. Explain the developer experience trade-off.

**Acceptance Criteria:**
- [ ] Raw SQL scenario 1: window functions (`ROW_NUMBER`, `RANK`, `LAG`) — not supported by Prisma client
- [ ] Raw SQL scenario 2: full-text search with `tsvector` / `ts_rank`
- [ ] Raw SQL scenario 3: `DATE_TRUNC`, `GENERATE_SERIES`, `PARTITION BY`, or other PostgreSQL-specific expressions
- [ ] Prisma client scenario 1: standard CRUD (create, read, update, delete)
- [ ] Prisma client scenario 2: simple filters, sorting, pagination with `where`, `orderBy`, `take`, `skip`
- [ ] Prisma client scenario 3: relation loading with `include`/`select`, `_count`, `upsert`
- [ ] Trade-off: Prisma client is type-safe and refactor-friendly; `$queryRaw` returns `unknown[]` and breaks silently if schema changes

---

### Q5 — Cursor implementation ⭐⭐

**Scenario:** You are building a paginated `/posts` endpoint. The cursor must encode both `id` and `createdAt` to handle ties. It should be opaque to the client (base64 encoded).

**Task:** Implement cursor-based pagination end-to-end: encode the cursor, decode it, use it in a WHERE clause, return the next cursor. Handle the first page (no cursor) and last page (return null cursor).

**Acceptance Criteria:**
- [ ] Encodes cursor as `Buffer.from(JSON.stringify({ id, createdAt })).toString('base64')`
- [ ] Decodes cursor as `JSON.parse(Buffer.from(cursor, 'base64').toString('utf8'))`
- [ ] Uses the cursor in a WHERE clause: `WHERE (created_at, id) < (:cursorCreatedAt, :cursorId)` for descending order
- [ ] Returns `nextCursor` as the encoded cursor of the last item in the current page
- [ ] Returns `nextCursor: null` when fewer items than the `limit` are returned (indicates the last page)
- [ ] Handles the first page correctly: when no cursor is provided, omit the WHERE condition entirely
- [ ] Validates that the cursor column is indexed so the WHERE clause is fast

---

### Q6 — Date aggregation ⭐⭐

**Scenario:** A dashboard chart shows "events per day" for the last 30 days. Some days have zero events and the chart shows gaps instead of zero.

**Task:** Write a SQL query that groups events by day using `DATE_TRUNC`. Show how to fill gaps for days with zero events using `GENERATE_SERIES` and a `LEFT JOIN`. Explain why this matters for charts.

**Acceptance Criteria:**
- [ ] Uses `DATE_TRUNC('day', created_at)` to truncate timestamps to day precision
- [ ] Uses `GENERATE_SERIES(now() - interval '29 days', now(), interval '1 day')` to produce all 30 days
- [ ] LEFT JOINs the events aggregate onto the generated series so missing days appear as 0
- [ ] Uses `COALESCE(COUNT(e.id), 0)` to convert NULL counts to 0
- [ ] Explains the chart issue: if zero-event days are missing from the result set, the charting library connects adjacent points, creating incorrect visual slopes
- [ ] Orders by the generated date column to ensure chronological output

---

### Q7 — Materialized views ⭐⭐

**Scenario:** A reporting query that calculates monthly revenue by product category takes 45 seconds to run. The dashboard calls it on every page load. The data can be up to 1 hour stale.

**Task:** Define materialized views. Explain when to use them. Write the DDL to create one for this use case. Show the refresh command. State the key trade-off.

**Acceptance Criteria:**
- [ ] Defines materialized views: a named query whose results are pre-computed and stored on disk as a physical table
- [ ] States appropriate use cases: expensive aggregation queries, reports that can tolerate stale data, queries called frequently on slowly-changing data
- [ ] Writes `CREATE MATERIALIZED VIEW monthly_revenue AS SELECT ...` with the aggregation query
- [ ] Shows the refresh command: `REFRESH MATERIALIZED VIEW CONCURRENTLY monthly_revenue`
- [ ] Explains `CONCURRENTLY`: allows reads during refresh (requires a unique index on the view); without it the view is locked during refresh
- [ ] States the key trade-off: materialized views are fast to query but serve potentially stale data — schedule refreshes appropriately

---

### Q8 — Query optimization workflow ⭐⭐

**Scenario:** A query that lists "active users who logged in this week" takes 8 seconds. The team wants a repeatable process for fixing slow queries.

**Task:** Describe the 5-step query optimization workflow. Apply it to the example query: `SELECT * FROM users WHERE is_active = true AND last_login > NOW() - INTERVAL '7 days'`.

**Acceptance Criteria:**
- [ ] Step 1: run `EXPLAIN ANALYZE` on the query and capture the output
- [ ] Step 2: identify the bottleneck — look for `Seq Scan` on large tables, high `rows` estimates, expensive `Sort` or `Hash Join` nodes
- [ ] Step 3: hypothesize a fix — e.g., add a composite index on `(is_active, last_login)`
- [ ] Step 4: apply the fix and re-run `EXPLAIN ANALYZE` to verify the plan changed (Seq Scan → Index Scan)
- [ ] Step 5: measure improvement — compare actual query time before and after, test under production-like data volume
- [ ] For the example: identifies `is_active` as low-cardinality (avoid leading with it); better index is `(last_login) WHERE is_active = true` (partial index)
- [ ] Notes that EXPLAIN output without ANALYZE shows estimated costs only; ANALYZE shows actual execution times

---

### Q9 — Denormalization for read performance ⭐⭐

**Scenario:** Every post page shows a comment count. Computing `COUNT(*)` from the comments table on every page load is expensive. The team considers storing `comment_count` directly on the posts table.

**Task:** Explain denormalization as a performance pattern. List three approaches to keep `comment_count` consistent. State the consistency trade-off for each.

**Acceptance Criteria:**
- [ ] Defines denormalization: storing computed or redundant data to avoid expensive JOINs/aggregations at read time
- [ ] Approach 1 — database trigger: a trigger on `INSERT`/`DELETE` in comments auto-increments `comment_count` on posts. Consistent but adds write latency; triggers are hard to debug.
- [ ] Approach 2 — application-level update: the application increments `comment_count` in the same transaction as the comment insert. Consistent if the transaction succeeds; can drift if a bug skips the update.
- [ ] Approach 3 — eventual consistency / background job: a cron job recalculates counts periodically. Simple but count is stale between runs.
- [ ] States the general trade-off: denormalization speeds reads at the cost of write complexity and potential inconsistency
- [ ] Notes that for high-read, low-write scenarios (public post pages) denormalization is often worth it

---

### Q10 — Prisma groupBy limitations ⭐⭐

**Scenario:** You need to group events by day (using `DATE_TRUNC`) and filter groups with count > 100. A teammate tries `prisma.event.groupBy({ by: ['createdAt'] })` and gets incorrect results because Prisma groups by the exact timestamp, not the truncated day.

**Task:** Explain what Prisma `groupBy` can and cannot do. State two specific limitations. Show when to drop to `$queryRaw`.

**Acceptance Criteria:**
- [ ] States what `groupBy` can do: aggregate by one or more model fields, use `_count`, `_sum`, `_avg`, `_min`, `_max`
- [ ] Limitation 1: `groupBy` cannot GROUP BY a SQL expression like `DATE_TRUNC('day', created_at)` — only raw field names
- [ ] Limitation 2: `groupBy` `having` clause does not support raw SQL expressions; it only supports Prisma aggregate comparisons
- [ ] Shows the `$queryRaw` equivalent: `SELECT DATE_TRUNC('day', created_at) AS day, COUNT(*) FROM events GROUP BY day HAVING COUNT(*) > 100`
- [ ] Notes that `$queryRaw` returns `unknown[]` — the caller must cast the result type manually
- [ ] Recommends: use Prisma `groupBy` for simple field-level aggregations; drop to raw SQL when expressions or complex HAVING are needed

---

### Q11 — Full-text search ranking ⭐⭐

**Scenario:** A product search must rank results by relevance. A match in the product title should score higher than a match in the description. The current implementation uses `ts_rank` on a single `tsvector` of the entire document.

**Task:** Explain `ts_rank` vs `ts_rank_cd`. Show how to use `setweight` to boost title matches over body matches. Write the full query with ranking.

**Acceptance Criteria:**
- [ ] Explains `ts_rank`: scores by term frequency and position, returns a float
- [ ] Explains `ts_rank_cd`: "cover density" variant — considers proximity of query terms to each other; better for phrase-like queries
- [ ] Shows `setweight(to_tsvector('english', title), 'A')` assigns weight A (highest) to title tokens
- [ ] Shows `setweight(to_tsvector('english', description), 'B')` assigns weight B to description tokens
- [ ] Concatenates with `||` to produce a weighted tsvector
- [ ] Writes a complete query: `SELECT *, ts_rank(weighted_tsvector, query) AS rank FROM products WHERE weighted_tsvector @@ query ORDER BY rank DESC`
- [ ] Notes the weights A/B/C/D correspond to float multipliers configurable in `ts_rank`

---

### Q12 — Connection-level caching ⭐⭐⭐

**Scenario:** A high-throughput API runs the same parameterized query thousands of times per second. Each call to `pg.query('SELECT ... WHERE id = $1', [id])` re-parses and plans the query even though it is identical.

**Task:** Explain how PostgreSQL prepared statements work. Explain how `PREPARE` / `EXECUTE` avoid re-parsing. Explain how Prisma uses prepared statements automatically. Explain the performance impact.

**Acceptance Criteria:**
- [ ] Explains that SQL parsing and planning (query planning) is CPU-intensive and repeated for every identical query without caching
- [ ] Explains `PREPARE stmt AS SELECT ... WHERE id = $1`: parses and plans the query once, stores the plan under a name
- [ ] Explains `EXECUTE stmt(42)`: skips parsing/planning, runs the cached plan with new parameters
- [ ] States that prepared statements are connection-scoped: each connection maintains its own prepared statement cache
- [ ] Explains that Prisma automatically uses prepared statements for all queries via the underlying `pg` driver
- [ ] States the performance gain: eliminates parse/plan overhead (often 0.1–1ms per query) — significant at high throughput

---

### Q13 — Leaderboard with rank gaps ⭐⭐⭐

**Scenario:** A game leaderboard needs to show player ranks. Two players tied at the top should both show rank 1. The question is whether rank 3 should be skipped or not.

**Task:** Explain `RANK()` vs `DENSE_RANK()` with a concrete example. Write a SQL query for each. State when each is appropriate.

**Acceptance Criteria:**
- [ ] Explains `RANK()`: tied rows get the same rank; the next rank skips numbers equal to the tie count (1, 1, 3, 4)
- [ ] Explains `DENSE_RANK()`: tied rows get the same rank; no numbers are skipped (1, 1, 2, 3)
- [ ] Writes `RANK() OVER (ORDER BY score DESC)` and shows example output with a tie
- [ ] Writes `DENSE_RANK() OVER (ORDER BY score DESC)` and shows example output with the same tie
- [ ] States `RANK()` is appropriate when the gap communicates meaning (e.g., "you beat 1 person to reach rank 3")
- [ ] States `DENSE_RANK()` is appropriate when continuous numbering matters (e.g., "top 10 unique rank positions")
- [ ] Notes neither `RANK` nor `DENSE_RANK` collapses rows — use with a CTE + `WHERE rn = 1` pattern to filter to the top rank only

---

### Q14 — Streaming large result sets ⭐⭐⭐

**Scenario:** A data export job runs `SELECT * FROM events` on 1M rows. The Node.js process runs out of memory and crashes at 500k rows.

**Task:** Explain why fetching all rows at once causes OOM. Describe PostgreSQL server-side cursors for streaming. Show the `DECLARE` / `FETCH` / `CLOSE` pattern. Show the equivalent Prisma approach.

**Acceptance Criteria:**
- [ ] Explains OOM cause: all 1M rows are buffered in Node.js heap simultaneously before any are processed
- [ ] Explains server-side cursors: the result set stays on the PostgreSQL server; the client fetches small batches
- [ ] Shows: `BEGIN; DECLARE export_cursor CURSOR FOR SELECT * FROM events; FETCH 1000 FROM export_cursor; ... CLOSE export_cursor; COMMIT;`
- [ ] States that the cursor must be within a transaction
- [ ] Shows Prisma equivalent: `findMany` in a loop with `take: 1000` and `skip` or cursor-based pagination
- [ ] Notes Prisma does not expose server-side cursors directly — the loop approach is the recommended pattern
- [ ] Mentions `node-postgres` (`pg`) streams as an alternative for raw streaming in Node.js

---

### Q15 — Query plan caching issue ⭐⭐⭐

**Scenario:** A query `SELECT * FROM orders WHERE status = 'active'` runs in 10ms using an index. The same query with `status = 'archived'` runs in 8 seconds. The only difference is the parameter value.

**Task:** Explain why the same query plan performs differently for different parameter values (data skew). Explain the generic plan vs custom plan trade-off in PostgreSQL. Give three fixes.

**Acceptance Criteria:**
- [ ] Explains data skew: 99% of orders are `archived`, 1% are `active`. The index is efficient for `active` (small result set) but a seq scan is faster for `archived` (most of the table)
- [ ] Explains that PostgreSQL caches a generic query plan after 5 executions — this plan may be optimal for the common case but wrong for edge cases
- [ ] Explains that `EXPLAIN (ANALYZE, GENERIC_PLAN)` reveals the cached generic plan vs the actual execution plan
- [ ] Fix 1: run `ANALYZE orders` to update the statistics so the planner has accurate row estimates
- [ ] Fix 2: create partial indexes: `CREATE INDEX idx_active ON orders(id) WHERE status = 'active'` — the planner will use it only for `active` queries
- [ ] Fix 3: use `pg_hint_plan` extension to force a specific plan for a known problematic query
- [ ] Notes that `SET plan_cache_mode = 'force_custom_plan'` forces re-planning on every execution (trades CPU for plan quality)
