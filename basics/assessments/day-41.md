# Day 41 Assessment — SQL Fundamentals · JOINs · Indexes · Transactions

**Theme:** You are a backend engineer at an e-commerce company. The database is PostgreSQL with 10M orders, 500k users, 1M products. Slow queries are causing timeouts. You need to fix them.

---

### Q1 — SELECT * vs specific columns ⭐

**Scenario:** A dashboard query runs `SELECT * FROM orders` to display only `id`, `status`, and `created_at` on the UI. The orders table has 40 columns including a `notes TEXT` field that stores large strings.

**Task:** Explain why `SELECT *` is harmful in production and rewrite the query to select only the needed columns.

**Acceptance Criteria:**
- [ ] Identifies bandwidth waste: unused columns are transferred over the network
- [ ] Identifies index coverage: a covering index on `(status, created_at, id)` cannot be used if `SELECT *` forces a heap fetch
- [ ] Identifies schema coupling: adding/removing columns silently breaks application code that maps positionally
- [ ] Rewrites query as `SELECT id, status, created_at FROM orders`
- [ ] Mentions that `TEXT` / `JSONB` columns are especially costly to transfer unnecessarily
- [ ] States the rule: always name the columns you actually need

---

### Q2 — INNER JOIN vs LEFT JOIN ⭐

**Scenario:** You have a `users` table and an `orders` table. You need to list all users and show their most recent order date — including users who have never placed an order.

**Task:** Explain the difference between INNER JOIN and LEFT JOIN using a Venn diagram described in words. Write both queries and explain which one is correct for this scenario and why the other returns fewer rows.

**Acceptance Criteria:**
- [ ] Describes INNER JOIN as the intersection: only rows where the join condition matches on both sides
- [ ] Describes LEFT JOIN as: all rows from the left table, matched rows from the right, NULL for right-side columns when there is no match
- [ ] Writes a correct INNER JOIN query and states it excludes users with no orders
- [ ] Writes a correct LEFT JOIN query with `MAX(o.created_at)` and `GROUP BY u.id`
- [ ] Confirms NULL appears in the order date column for users with no orders
- [ ] Selects LEFT JOIN as the correct answer and justifies why

---

### Q3 — GROUP BY + HAVING ⭐

**Scenario:** You want to find all users who have placed more than 3 orders. A colleague writes `SELECT user_id FROM orders WHERE COUNT(*) > 3 GROUP BY user_id` and gets a syntax error.

**Task:** Explain why `WHERE COUNT(*) > 3` is invalid SQL. Write the correct query using HAVING. Explain the difference between WHERE and HAVING in execution order.

**Acceptance Criteria:**
- [ ] States that WHERE filters rows before grouping; aggregate functions are not yet computed at that stage
- [ ] States that HAVING filters groups after aggregation
- [ ] Writes the correct query: `SELECT user_id, COUNT(*) FROM orders GROUP BY user_id HAVING COUNT(*) > 3`
- [ ] Explains that WHERE operates on individual rows; HAVING operates on the result of GROUP BY
- [ ] Notes that a non-aggregated column in SELECT must appear in GROUP BY
- [ ] Bonus: notes you can alias the count and use it in ORDER BY but not in the same HAVING clause

---

### Q4 — Transactions and ACID ⭐

**Scenario:** You need to transfer $100 from account A to account B. The debit of A succeeds but the system crashes before the credit to B completes.

**Task:** Define each letter of ACID. Write the SQL transaction for the transfer. Explain what happens to account A's balance if the credit fails and the transaction is rolled back.

**Acceptance Criteria:**
- [ ] Defines Atomicity: all operations succeed or none do
- [ ] Defines Consistency: the database moves from one valid state to another (total money is conserved)
- [ ] Defines Isolation: concurrent transactions do not see each other's intermediate state
- [ ] Defines Durability: committed transactions survive crashes
- [ ] Writes a transaction with `BEGIN`, two `UPDATE` statements, and `COMMIT`
- [ ] States that on crash/rollback account A's balance is restored to its original value — no money is lost
- [ ] Includes a `ROLLBACK` or notes that PostgreSQL rolls back automatically on error

---

### Q5 — Index types and partial indexes ⭐⭐

**Scenario:** The `orders` table has a `deleted_at TIMESTAMPTZ` column. 99% of rows have `deleted_at IS NULL`. A query filters `WHERE deleted_at IS NULL AND status = 'pending'` but a full B-Tree index on `deleted_at` does not help much.

**Task:** Explain when B-Tree indexes help and when they do not (with the boolean/low-cardinality example). Then explain what a partial index is and write one for this scenario. Quantify why it is faster.

**Acceptance Criteria:**
- [ ] States B-Tree helps for: equality (`=`), range (`<`, `>`, `BETWEEN`), `ORDER BY`, `IS NULL` on high-cardinality columns
- [ ] States B-Tree does NOT help for low-cardinality columns (e.g. a boolean `is_active` — the index covers half the table, so a seq scan is cheaper)
- [ ] Defines a partial index as an index built only on rows satisfying a WHERE condition
- [ ] Writes: `CREATE INDEX idx_orders_pending ON orders(status) WHERE deleted_at IS NULL`
- [ ] Explains that the partial index contains only the ~1% of rows where `deleted_at IS NULL`, making it far smaller and faster to scan
- [ ] Notes that the query planner will use a partial index only when the query's WHERE clause matches the index predicate

---

### Q6 — Slow query diagnosis ⭐⭐

**Scenario:** This query takes 3 seconds: `SELECT * FROM orders WHERE status = 'pending' ORDER BY created_at DESC LIMIT 20`. There is no index on `status` or `created_at`. The table has 10M rows.

**Task:** Identify which index would fix this query. Write the `CREATE INDEX` statement. Define what a covering index is and explain whether your index qualifies.

**Acceptance Criteria:**
- [ ] Identifies that the query filters on `status` and sorts on `created_at` — a composite index covers both operations
- [ ] Writes: `CREATE INDEX idx_orders_status_created ON orders(status, created_at DESC)`
- [ ] Explains that with this index PostgreSQL can do an index scan on `status = 'pending'` already ordered by `created_at DESC`, avoiding a sort step
- [ ] Defines covering index: an index that contains all columns the query needs, eliminating the heap fetch
- [ ] Notes that `SELECT *` prevents a covering index; replacing with `SELECT id, status, created_at` would allow the index to cover the query fully
- [ ] Mentions `EXPLAIN ANALYZE` to verify the index is being used

---

### Q7 — N+1 in SQL ⭐⭐

**Scenario:** An API endpoint loads 100 users and then fetches each user's latest order in a loop, resulting in 101 queries.

**Task:** Show the N+1 as raw SQL query logs. Rewrite it as a single JOIN query that returns users with their latest order. Calculate the query count difference.

**Acceptance Criteria:**
- [ ] Shows the N+1 pattern: 1 query to fetch all users + 100 individual queries to fetch each user's latest order = 101 total queries
- [ ] Writes a single query using `LEFT JOIN LATERAL` or a subquery with `DISTINCT ON (user_id)` or a `ROW_NUMBER()` CTE to get the latest order per user
- [ ] States the reduction: from 101 queries to 1 query
- [ ] Notes that N+1 grows linearly — with 10,000 users it becomes 10,001 queries
- [ ] Mentions that ORMs (like Prisma with `include`) solve N+1 by generating a single `WHERE IN` query
- [ ] Confirms the JOIN approach returns the same result set

---

### Q8 — Subquery vs JOIN ⭐⭐

**Scenario:** A colleague writes a correlated subquery: `SELECT id, (SELECT COUNT(*) FROM orders WHERE orders.user_id = users.id) AS order_count FROM users`. It runs in 8 seconds on 500k users.

**Task:** Rewrite it as a JOIN with GROUP BY. Explain when a subquery is clearer than a JOIN and when it is slower.

**Acceptance Criteria:**
- [ ] Rewrites as: `SELECT u.id, COUNT(o.id) AS order_count FROM users u LEFT JOIN orders o ON o.user_id = u.id GROUP BY u.id`
- [ ] Explains why the correlated subquery is slow: it executes once per row in the outer query (500k executions)
- [ ] States that a JOIN with GROUP BY is evaluated in a single pass
- [ ] Identifies when a subquery is clearer: EXISTS checks, scalar lookups, IN lists with a small set
- [ ] Identifies when a subquery is slower: correlated subqueries on large tables, subqueries in SELECT clause evaluated per row
- [ ] Notes that `EXPLAIN ANALYZE` will show "SubPlan" for correlated subqueries

---

### Q9 — Composite index column order ⭐⭐

**Scenario:** There is a composite index on `(status, created_at)` on the orders table. Three queries are tested against it.

**Task:** For each query below, state whether the index is used and why. Then explain the left-prefix rule.

Queries:
- `WHERE status = 'active'`
- `WHERE created_at > '2026-01-01'`
- `WHERE status = 'active' AND created_at > '2026-01-01'`

**Acceptance Criteria:**
- [ ] Correctly identifies `WHERE status = 'active'` USES the index (matches the leftmost prefix)
- [ ] Correctly identifies `WHERE created_at > '2026-01-01'` does NOT use the index (skips the first column)
- [ ] Correctly identifies `WHERE status = 'active' AND created_at > '2026-01-01'` USES the index fully (both columns matched in order)
- [ ] Explains the left-prefix rule: PostgreSQL can use a composite index starting from the leftmost column; it cannot skip a column
- [ ] Notes that the column order should reflect the most selective or equality-filtered column first
- [ ] Mentions `EXPLAIN ANALYZE` confirms whether an Index Scan or Seq Scan is chosen

---

### Q10 — Window functions ⭐⭐

**Scenario:** You need to display a user's order history with a running total, their rank by total spend, and the time gap between consecutive orders.

**Task:** Explain `ROW_NUMBER()`, `RANK()`, and `LAG()`. Write a query that, for each user, returns their most recent order using `ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC)`.

**Acceptance Criteria:**
- [ ] Defines `ROW_NUMBER()`: assigns a unique sequential integer within each partition, no ties
- [ ] Defines `RANK()`: assigns the same rank to ties, then skips numbers (1, 1, 3)
- [ ] Defines `LAG(col, n)`: returns the value of `col` from `n` rows before the current row within the partition
- [ ] Writes the CTE/subquery with `ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) AS rn`
- [ ] Wraps it in an outer query with `WHERE rn = 1` to get only the most recent order per user
- [ ] States that window functions do not collapse rows (unlike GROUP BY), so all columns remain accessible

---

### Q11 — Isolation levels ⭐⭐

**Scenario:** Two transactions run concurrently. Transaction A reads a row, Transaction B modifies and commits it, then Transaction A reads the same row again and sees a different value.

**Task:** Name this anomaly. Define dirty read, non-repeatable read, and phantom read. List the four isolation levels and state which anomaly each prevents.

**Acceptance Criteria:**
- [ ] Names the anomaly in the scenario as a non-repeatable read
- [ ] Defines dirty read: reading uncommitted data from another transaction
- [ ] Defines non-repeatable read: same row read twice within a transaction returns different values because another transaction committed in between
- [ ] Defines phantom read: a query run twice returns different sets of rows because another transaction inserted/deleted rows in between
- [ ] Lists: Read Uncommitted → allows all three anomalies
- [ ] Lists: Read Committed (PostgreSQL default) → prevents dirty reads
- [ ] Lists: Repeatable Read → prevents dirty reads and non-repeatable reads
- [ ] Lists: Serializable → prevents all three anomalies

---

### Q12 — EXPLAIN ANALYZE ⭐⭐⭐

**Scenario:** You run `EXPLAIN ANALYZE SELECT * FROM orders WHERE user_id = 42` and see: `Seq Scan on orders (cost=0.00..450000.00 rows=1 width=200) (actual rows=5847 time=...)`.

**Task:** Identify what Seq Scan vs Index Scan means. Explain the discrepancy between `rows=1` and `actual rows=5847`. Explain what `cost=0.00..450000.00` means. State what you would do to fix the estimate discrepancy.

**Acceptance Criteria:**
- [ ] Seq Scan: reads every row in the table sequentially; no index used
- [ ] Index Scan: uses a B-Tree index to jump directly to matching rows
- [ ] Explains that `rows=1` is the planner's estimate (based on table statistics) and `actual rows=5847` is what really ran — a large discrepancy means stale statistics
- [ ] States the fix: run `ANALYZE orders` (or `VACUUM ANALYZE orders`) to refresh pg_statistic
- [ ] Explains `cost=X..Y`: X is startup cost (cost before first row), Y is total cost in arbitrary planner units
- [ ] Notes that a bad estimate can cause the planner to choose a Seq Scan when an Index Scan would be faster

---

### Q13 — Deadlock ⭐⭐⭐

**Scenario:** Transaction 1 locks row A then tries to lock row B. Transaction 2 locks row B then tries to lock row A. Both are waiting for each other.

**Task:** Define deadlock. Write the exact SQL sequence for this scenario with two transactions. Explain how PostgreSQL detects and resolves it. Give two strategies to prevent deadlocks in application code.

**Acceptance Criteria:**
- [ ] Defines deadlock: two or more transactions each holding a lock and waiting for a lock held by the other, creating a cycle with no possibility of progress
- [ ] Writes the two-transaction SQL sequence showing the interleaved lock order
- [ ] States PostgreSQL runs a deadlock detector periodically (~1s) and kills the transaction with the smallest cost, returning error code `40P01`
- [ ] Prevention strategy 1: always acquire locks in a consistent global order (e.g., always lock lower `id` first)
- [ ] Prevention strategy 2: keep transactions short and acquire all locks at the start (e.g., `SELECT FOR UPDATE` all needed rows in one query)
- [ ] Notes that the killed transaction must be retried by the application

---

### Q14 — Table partitioning ⭐⭐⭐

**Scenario:** The `events` table has 50M rows. Queries almost always filter by `created_at` within the last 30 days. Without partitioning, even indexed queries scan too many index pages.

**Task:** Define table partitioning. Explain when it is appropriate. Write the DDL to partition `events` by `RANGE (created_at)` with monthly partitions. Explain partition pruning.

**Acceptance Criteria:**
- [ ] Defines partitioning: splitting a large table into smaller physical child tables, each storing a subset of rows, while appearing as a single table to queries
- [ ] States appropriate use cases: time-series data, tables over 10M rows, data with clear range boundaries, archival (detach old partitions)
- [ ] Writes `CREATE TABLE events (...) PARTITION BY RANGE (created_at)` with at least two child partition examples using `FOR VALUES FROM ... TO ...`
- [ ] Defines partition pruning: the query planner examines the WHERE clause and skips partitions whose range cannot contain matching rows
- [ ] Notes that partition pruning works automatically when the filter column matches the partition key
- [ ] Mentions that old partitions can be detached and archived without deleting data

---

### Q15 — Full-text search ⭐⭐⭐

**Scenario:** A product search uses `WHERE name LIKE '%bluetooth speaker%'`. It is slow even with an index because `LIKE '%...'` cannot use a B-Tree index. The product table has 1M rows.

**Task:** Explain PostgreSQL's full-text search using `tsvector` and `tsquery`. Compare `plainto_tsquery` vs `phraseto_tsquery`. Explain `ts_rank` for relevance sorting. Describe how to index the tsvector column with GIN. Quantify the performance difference vs LIKE.

**Acceptance Criteria:**
- [ ] Explains `tsvector`: a preprocessed document representation (tokenized, stemmed, stop words removed)
- [ ] Explains `tsquery`: a search query with operators (`&`, `|`, `!`, `<->`) matched against a tsvector
- [ ] Writes: `SELECT * FROM products WHERE to_tsvector('english', name) @@ plainto_tsquery('english', 'bluetooth speaker')`
- [ ] Distinguishes `plainto_tsquery`: treats input as AND of words; `phraseto_tsquery`: requires words in that exact order (proximity)
- [ ] Explains `ts_rank(tsvector, tsquery)` returns a float relevance score; used in `ORDER BY ts_rank(...) DESC`
- [ ] Writes: `CREATE INDEX idx_products_fts ON products USING GIN(to_tsvector('english', name))`
- [ ] States that `LIKE '%keyword%'` is always a Seq Scan; GIN full-text index reduces this to an index scan with sub-millisecond lookup on 1M rows
