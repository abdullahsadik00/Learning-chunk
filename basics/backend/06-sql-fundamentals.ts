// ═══════════════════════════════════════════════════════════════
// BACKEND 06: SQL FUNDAMENTALS · JOINs · INDEXES · TRANSACTIONS  (Day 41)
// Run: npx ts-node 06-sql-fundamentals.ts
// ═══════════════════════════════════════════════════════════════
//
// SQL (Structured Query Language) is the universal language for
// relational databases: PostgreSQL, MySQL, SQLite, SQL Server.
//
// WHY RELATIONAL DATABASES?
//  • Data integrity enforced by the engine (constraints, FK checks)
//  • ACID transactions — partial writes are impossible
//  • JOINs express relationships without application-level loops
//  • Decades of query optimisation built into every engine
//  • Schema-on-write: shape of data is explicit and enforced

// ───────────────────────────────────────────────────────────────
// 1. RELATIONAL MODEL BASICS
// ───────────────────────────────────────────────────────────────

console.log("=== 1. Relational Model Basics ===");

/*
  TABLE — a 2D grid of data.
  ROW   — one record (entity).
  COLUMN — one attribute, with a fixed data type.

  ┌─────────────────────────────────────────────────────────────┐
  │  TABLE: users                                               │
  ├──────┬──────────┬───────────────────────┬───────────────────┤
  │  id  │  name    │  email                │  created_at       │
  ├──────┼──────────┼───────────────────────┼───────────────────┤
  │   1  │  Alice   │  alice@example.com    │  2024-01-10 09:00 │
  │   2  │  Bob     │  bob@example.com      │  2024-02-14 11:30 │
  │   3  │  Carol   │  carol@example.com    │  2024-03-01 08:15 │
  └──────┴──────────┴───────────────────────┴───────────────────┘

  PRIMARY KEY (PK) — uniquely identifies each row. Never null.
  FOREIGN KEY (FK) — references a PK in another table, enforcing
    referential integrity (you cannot orphan a row).

  ─── DDL: CREATE TABLE ──────────────────────────────────────────

  CREATE TABLE users (
    id          BIGSERIAL PRIMARY KEY,           -- auto-increment PK
    name        VARCHAR(100)  NOT NULL,           -- max 100 chars, required
    email       VARCHAR(255)  NOT NULL UNIQUE,    -- unique across all rows
    age         INTEGER       CHECK (age >= 0),   -- constraint: no negatives
    role        VARCHAR(20)   DEFAULT 'user',     -- default value
    created_at  TIMESTAMP     NOT NULL DEFAULT NOW()
  );

  CREATE TABLE orders (
    id          BIGSERIAL    PRIMARY KEY,
    user_id     BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total       DECIMAL(10,2) NOT NULL CHECK (total >= 0),
    status      VARCHAR(20)  NOT NULL DEFAULT 'pending',
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
  );

  ─── COMMON DATA TYPES ──────────────────────────────────────────

  INTEGER      — 4 bytes, -2B to +2B
  BIGINT       — 8 bytes, very large numbers (use for PKs on big tables)
  BIGSERIAL    — auto-incrementing BIGINT (PostgreSQL shorthand)
  VARCHAR(n)   — variable-length string up to n characters
  TEXT         — unlimited-length string (no performance penalty in PG)
  BOOLEAN      — true / false
  DECIMAL(p,s) — exact decimal: p total digits, s after decimal point
                 Use for money — floats have rounding errors!
  TIMESTAMP    — date + time (no timezone)
  TIMESTAMPTZ  — date + time WITH timezone (preferred in PostgreSQL)
  UUID         — 128-bit universally unique identifier
                 e.g. '550e8400-e29b-41d4-a716-446655440000'

  ─── CONSTRAINTS ────────────────────────────────────────────────

  NOT NULL    — column must always have a value
  UNIQUE      — no two rows may share the same value in this column
  CHECK(expr) — row is rejected if expr is false
  DEFAULT val — used when INSERT omits this column
  PRIMARY KEY — NOT NULL + UNIQUE; identifies the row
  FOREIGN KEY — value must exist in the referenced table
  ON DELETE CASCADE  — delete child rows when parent is deleted
  ON DELETE SET NULL — set FK to NULL when parent is deleted
  ON DELETE RESTRICT — (default) reject parent delete if children exist
*/

console.log("DDL concepts: tables, columns, PKs, FKs, constraints — see comments above");
console.log("Data types: INTEGER, BIGINT, VARCHAR, TEXT, BOOLEAN, DECIMAL, TIMESTAMP, UUID");

// ───────────────────────────────────────────────────────────────
// 2. CRUD QUERIES
// ───────────────────────────────────────────────────────────────

console.log("\n=== 2. CRUD Queries ===");

/*
  ─── SELECT ─────────────────────────────────────────────────────

  -- All columns, all rows (avoid in production — use explicit columns)
  SELECT * FROM users;

  -- Specific columns
  SELECT id, name, email FROM users;

  -- WHERE — filter rows
  SELECT * FROM users WHERE role = 'admin';
  SELECT * FROM users WHERE age >= 18 AND status = 'active';
  SELECT * FROM orders WHERE total > 100 OR status = 'urgent';
  SELECT * FROM users WHERE name LIKE 'A%';   -- starts with A
  SELECT * FROM users WHERE id IN (1, 2, 5);
  SELECT * FROM users WHERE email IS NOT NULL;

  -- ORDER BY — sort results
  SELECT * FROM orders ORDER BY created_at DESC;   -- newest first
  SELECT * FROM users ORDER BY name ASC;           -- alphabetical

  -- LIMIT + OFFSET — pagination
  SELECT * FROM products ORDER BY id LIMIT 10 OFFSET 20;
  -- Page 3, 10 items per page: OFFSET = (page - 1) * page_size = 20

  ─── INSERT ─────────────────────────────────────────────────────

  -- Single row
  INSERT INTO users (name, email, role)
  VALUES ('Diana', 'diana@example.com', 'user');

  -- Multi-row (one round trip — much faster)
  INSERT INTO users (name, email, role) VALUES
    ('Eve',   'eve@example.com',   'user'),
    ('Frank', 'frank@example.com', 'admin'),
    ('Grace', 'grace@example.com', 'user');

  -- RETURNING clause (PostgreSQL) — get back the inserted row
  INSERT INTO users (name, email)
  VALUES ('Hank', 'hank@example.com')
  RETURNING id, created_at;
  -- Avoids a second SELECT to fetch the auto-generated id

  ─── UPDATE ─────────────────────────────────────────────────────

  -- Update specific rows (ALWAYS include WHERE!)
  UPDATE users SET role = 'admin' WHERE id = 3;

  -- Update multiple columns
  UPDATE orders
  SET status = 'shipped', updated_at = NOW()
  WHERE id = 42;

  -- ⚠️  DANGER: UPDATE without WHERE updates EVERY row
  UPDATE users SET role = 'admin';  -- ← THIS MAKES ALL USERS ADMINS

  -- RETURNING to confirm what changed
  UPDATE orders SET status = 'cancelled' WHERE id = 7
  RETURNING id, status, updated_at;

  ─── DELETE ─────────────────────────────────────────────────────

  -- Delete specific rows
  DELETE FROM orders WHERE status = 'cancelled' AND created_at < NOW() - INTERVAL '30 days';

  -- ⚠️  DANGER: DELETE without WHERE deletes EVERY row
  DELETE FROM users;   -- ← TABLE IS NOW EMPTY

  -- RETURNING on delete (useful for audit logs)
  DELETE FROM sessions WHERE expires_at < NOW()
  RETURNING user_id, created_at;
*/

console.log("CRUD: SELECT (WHERE, ORDER BY, LIMIT/OFFSET), INSERT (single/multi), UPDATE, DELETE");
console.log("RETURNING clause gives back modified rows — avoids a follow-up SELECT");

// ───────────────────────────────────────────────────────────────
// 3. JOINs
// ───────────────────────────────────────────────────────────────

console.log("\n=== 3. JOINs ===");

/*
  A JOIN combines rows from two or more tables based on a related column.
  Without JOINs you would need multiple queries and manual merging in code.

  Sample schema:
    users(id, name, email)
    orders(id, user_id FK→users.id, total, status)
    products(id, name, price)
    order_items(order_id FK→orders.id, product_id FK→products.id, qty)

  ─── INNER JOIN ─────────────────────────────────────────────────
  Returns rows that have a match in BOTH tables.
  Rows with no match are excluded.

  Venn diagram:  (users) ⋂ (orders)  — only the overlapping part

  SELECT u.name, o.id AS order_id, o.total
  FROM users u
  INNER JOIN orders o ON o.user_id = u.id;
  -- Only users who have at least one order appear.
  -- Users with no orders: absent. Orders with no user (orphans): absent.

  ─── LEFT JOIN (LEFT OUTER JOIN) ────────────────────────────────
  Returns ALL rows from the LEFT table, plus matching rows from the right.
  Non-matching right-side columns are NULL.

  Venn diagram:  ALL of (users), overlapping part of (orders)

  SELECT u.name, o.id AS order_id, o.total
  FROM users u
  LEFT JOIN orders o ON o.user_id = u.id;
  -- All users appear. Users with no orders get NULL for o.id and o.total.
  -- Use case: "show all users and their orders, if any"

  -- Find users with NO orders:
  SELECT u.name
  FROM users u
  LEFT JOIN orders o ON o.user_id = u.id
  WHERE o.id IS NULL;

  ─── RIGHT JOIN (RIGHT OUTER JOIN) ──────────────────────────────
  Returns ALL rows from the RIGHT table, matching rows from the left.
  (Mirror image of LEFT JOIN — just swap table order instead.)
  Rarely used in practice; LEFT JOIN is preferred by convention.

  ─── FULL OUTER JOIN ────────────────────────────────────────────
  Returns ALL rows from BOTH tables.
  NULLs on whichever side has no match.

  SELECT u.name, o.id
  FROM users u
  FULL OUTER JOIN orders o ON o.user_id = u.id;
  -- Use case: data reconciliation, finding orphans on either side

  ─── CROSS JOIN ─────────────────────────────────────────────────
  Cartesian product — every row in A paired with every row in B.
  Result rows = |A| × |B|. Use with extreme care on large tables.

  SELECT u.name, p.name AS product
  FROM users u
  CROSS JOIN products p;
  -- If 100 users and 50 products → 5000 rows.
  -- Use case: generating all combinations (e.g., scheduling, sizing grids)

  ─── SELF JOIN ──────────────────────────────────────────────────
  A table joined to itself via an alias. Useful for hierarchical data.

  CREATE TABLE employees (
    id         INTEGER PRIMARY KEY,
    name       VARCHAR(100),
    manager_id INTEGER REFERENCES employees(id)
  );

  SELECT e.name AS employee, m.name AS manager
  FROM employees e
  LEFT JOIN employees m ON e.manager_id = m.id;

  ─── MULTI-TABLE JOIN ───────────────────────────────────────────

  SELECT u.name, o.id AS order_id, p.name AS product, oi.qty
  FROM users u
  JOIN orders     o  ON o.user_id    = u.id
  JOIN order_items oi ON oi.order_id = o.id
  JOIN products   p  ON p.id         = oi.product_id
  WHERE u.id = 1;

  ─── N+1 PROBLEM PREVIEW ────────────────────────────────────────
  N+1 occurs when you fetch N parent rows and then run 1 query per row
  to get child data — instead of 1 JOIN that fetches everything.

  BAD (N+1 — N separate queries):
    SELECT * FROM users;              -- 1 query, returns 100 users
    SELECT * FROM orders WHERE user_id = 1;  -- query 2
    SELECT * FROM orders WHERE user_id = 2;  -- query 3
    ...
    SELECT * FROM orders WHERE user_id = 100; -- query 101

  GOOD (1 JOIN):
    SELECT u.*, o.*
    FROM users u
    LEFT JOIN orders o ON o.user_id = u.id;  -- 1 query total
*/

console.log("INNER JOIN: matched rows only");
console.log("LEFT  JOIN: all left rows + matched right (NULLs where no match)");
console.log("RIGHT JOIN: all right rows + matched left");
console.log("FULL OUTER JOIN: all rows from both sides");
console.log("CROSS JOIN: cartesian product (A × B rows)");
console.log("Self-join: table joined to itself — useful for hierarchies");
console.log("N+1 preview: never fetch children with per-row queries — use a JOIN");

// ───────────────────────────────────────────────────────────────
// 4. AGGREGATIONS AND GROUPING
// ───────────────────────────────────────────────────────────────

console.log("\n=== 4. Aggregations and Grouping ===");

/*
  Aggregate functions collapse multiple rows into a single value.

  ─── AGGREGATE FUNCTIONS ────────────────────────────────────────

  SELECT COUNT(*)                FROM orders;               -- total row count
  SELECT COUNT(DISTINCT user_id) FROM orders;               -- unique buyers
  SELECT SUM(total)              FROM orders WHERE status = 'completed';
  SELECT AVG(total)              FROM orders;
  SELECT MIN(total), MAX(total)  FROM orders;

  ─── GROUP BY ───────────────────────────────────────────────────
  Splits rows into groups, then applies aggregate per group.
  Every non-aggregate column in SELECT must appear in GROUP BY.

  SELECT user_id, COUNT(*) AS order_count, SUM(total) AS revenue
  FROM orders
  GROUP BY user_id
  ORDER BY revenue DESC;

  ─── HAVING (vs WHERE) ──────────────────────────────────────────
  WHERE  — filters rows BEFORE grouping (operates on individual rows)
  HAVING — filters groups AFTER aggregation (operates on aggregate results)

  -- Users who placed more than 3 orders:
  SELECT user_id, COUNT(*) AS cnt
  FROM orders
  GROUP BY user_id
  HAVING COUNT(*) > 3;

  -- You CANNOT use WHERE COUNT(*) > 3  — WHERE runs before aggregation.

  -- Combined:
  SELECT user_id, COUNT(*) AS cnt
  FROM orders
  WHERE status = 'completed'   -- filter individual rows first
  GROUP BY user_id
  HAVING COUNT(*) > 3;         -- then filter groups

  ─── DISTINCT ───────────────────────────────────────────────────

  SELECT DISTINCT status FROM orders;          -- unique statuses
  SELECT DISTINCT ON (user_id) * FROM orders   -- first order per user
  ORDER BY user_id, created_at ASC;            -- (PostgreSQL-specific)

  ─── SUBQUERIES ─────────────────────────────────────────────────
  A query nested inside another query.

  -- Users who have placed at least one order (using subquery):
  SELECT * FROM users
  WHERE id IN (SELECT DISTINCT user_id FROM orders);

  -- Orders with total above average:
  SELECT * FROM orders
  WHERE total > (SELECT AVG(total) FROM orders);

  ─── CTEs (WITH clause) ─────────────────────────────────────────
  Common Table Expressions — named subqueries at the top.
  Cleaner and more readable than deeply nested subqueries.
  Can be referenced multiple times in the same query.

  -- High-value users (spent > $500 total):
  WITH user_spending AS (
    SELECT user_id, SUM(total) AS total_spent
    FROM orders
    WHERE status = 'completed'
    GROUP BY user_id
  )
  SELECT u.name, us.total_spent
  FROM users u
  JOIN user_spending us ON us.user_id = u.id
  WHERE us.total_spent > 500
  ORDER BY us.total_spent DESC;

  -- Multiple CTEs (comma-separated):
  WITH
  monthly_revenue AS (
    SELECT DATE_TRUNC('month', created_at) AS month, SUM(total) AS revenue
    FROM orders GROUP BY 1
  ),
  avg_monthly AS (
    SELECT AVG(revenue) AS avg FROM monthly_revenue
  )
  SELECT mr.month, mr.revenue,
         ROUND(mr.revenue / am.avg * 100, 1) AS pct_of_average
  FROM monthly_revenue mr, avg_monthly am
  ORDER BY mr.month;
*/

console.log("Aggregates: COUNT, SUM, AVG, MIN, MAX");
console.log("GROUP BY: splits rows into groups for aggregation");
console.log("HAVING: filters groups (post-aggregation); WHERE: filters rows (pre-aggregation)");
console.log("CTEs (WITH clause): named subqueries — cleaner than nesting, reusable in one query");

// ───────────────────────────────────────────────────────────────
// 5. INDEXES
// ───────────────────────────────────────────────────────────────

console.log("\n=== 5. Indexes ===");

/*
  ─── WHAT IS AN INDEX? ──────────────────────────────────────────
  An index is a separate data structure (usually a B-tree) that the
  database maintains alongside a table. It maps column values to the
  physical location of matching rows — like the index at the back of a book.

  Without index: full table scan — reads every row (O(n)).
  With    index: B-tree lookup — O(log n), then direct row fetch.

  Cost: indexes consume disk space and slow down INSERT/UPDATE/DELETE
  (the index must be kept in sync). Read gains vs. write overhead — always
  measure before adding indexes on write-heavy columns.

  ─── CREATE INDEX ───────────────────────────────────────────────

  -- Standard B-tree index (default)
  CREATE INDEX idx_orders_user_id ON orders(user_id);
  -- Now: SELECT * FROM orders WHERE user_id = 42  →  index scan, fast

  -- UNIQUE index (also enforces uniqueness constraint)
  CREATE UNIQUE INDEX idx_users_email ON users(email);

  -- Composite index (multi-column)
  CREATE INDEX idx_orders_user_status ON orders(user_id, status);
  -- Useful for: WHERE user_id = ? AND status = ?
  -- ALSO useful for: WHERE user_id = ?  (leftmost prefix rule)
  -- NOT useful for: WHERE status = ?    (second column alone — no benefit)

  ─── COLUMN ORDER IN COMPOSITE INDEXES ──────────────────────────
  The leftmost-prefix rule:
    Index on (A, B, C) helps queries that filter on:
      A            ✅
      A, B         ✅
      A, B, C      ✅
      B            ❌  (A is not in the filter)
      B, C         ❌
      C            ❌
  Rule of thumb: put the highest-cardinality (most selective) column
  first, or the column most frequently used in WHERE clauses first.

  -- Partial index (only indexes rows matching a condition)
  CREATE INDEX idx_active_users ON users(email) WHERE deleted_at IS NULL;
  -- Smaller, faster index; only covers the rows you actually query.

  ─── EXPLAIN ANALYZE ────────────────────────────────────────────
  Shows the query execution plan and actual timing. Run AFTER the query
  has been executed at least once (so statistics are fresh).

  EXPLAIN ANALYZE
  SELECT * FROM orders WHERE user_id = 42;

  -- Look for:
  --   Index Scan  →  index is being used ✅
  --   Seq Scan    →  full table scan (may need an index) ⚠️
  --   Bitmap Index Scan → index used, then bitmap for multi-row fetch

  ─── WHEN NOT TO INDEX ──────────────────────────────────────────
  1. Low-cardinality columns: boolean, status with 2–3 values.
     A "true/false" column has only 2 distinct values — the planner
     often does a Seq Scan anyway (faster to scan than use index
     when >5–10% of rows match).
  2. Write-heavy tables: every INSERT/UPDATE/DELETE updates all indexes.
     A table with 10 indexes pays 10× the write cost.
  3. Small tables (<1000 rows): Seq Scan is faster; planner ignores index.
  4. Rarely queried columns: index maintenance cost outweighs benefit.
*/

console.log("B-tree index: O(log n) lookup vs O(n) full scan");
console.log("Composite index: column order matters — leftmost prefix rule");
console.log("Partial index: indexes only rows matching a condition (e.g. WHERE deleted_at IS NULL)");
console.log("EXPLAIN ANALYZE: reveals Index Scan vs Seq Scan — diagnose slow queries");
console.log("Don't index: low-cardinality columns, small tables, write-heavy columns");

// ───────────────────────────────────────────────────────────────
// 6. TRANSACTIONS
// ───────────────────────────────────────────────────────────────

console.log("\n=== 6. Transactions ===");

/*
  ─── WHAT IS A TRANSACTION? ─────────────────────────────────────
  A transaction groups multiple SQL statements into one all-or-nothing unit.
  Either ALL statements succeed (COMMIT) or NONE take effect (ROLLBACK).

  ─── ACID PROPERTIES ────────────────────────────────────────────

  Atomicity    — All-or-nothing. A transaction either fully completes
                 or fully rolls back. There is no partial application.
                 Example: debit Alice AND credit Bob are one unit.

  Consistency  — A transaction brings the database from one valid state
                 to another. Constraints are never violated mid-transaction.

  Isolation    — Concurrent transactions do not see each other's
                 intermediate (uncommitted) state.

  Durability   — Once COMMIT returns, data is persisted to disk even
                 if the server crashes immediately after.

  ─── BEGIN / COMMIT / ROLLBACK ──────────────────────────────────

  BEGIN;
    UPDATE accounts SET balance = balance - 500 WHERE id = 1;  -- debit Alice
    UPDATE accounts SET balance = balance + 500 WHERE id = 2;  -- credit Bob
  COMMIT;
  -- Both updates are written together — atomically.

  -- If anything goes wrong, roll back:
  BEGIN;
    UPDATE accounts SET balance = balance - 500 WHERE id = 1;
    -- Suppose we discover Alice has insufficient funds:
  ROLLBACK;
  -- The debit never happened.

  ─── ISOLATION LEVELS ───────────────────────────────────────────
  Isolation levels trade consistency for concurrency.

  ┌──────────────────────┬─────────────┬─────────────────┬──────────────┐
  │  Isolation Level     │ Dirty Read  │ Non-Repeatable  │ Phantom Read │
  │                      │             │ Read            │              │
  ├──────────────────────┼─────────────┼─────────────────┼──────────────┤
  │ READ UNCOMMITTED     │ possible    │ possible        │ possible     │
  │ READ COMMITTED (def) │ prevented   │ possible        │ possible     │
  │ REPEATABLE READ      │ prevented   │ prevented       │ possible     │
  │ SERIALIZABLE         │ prevented   │ prevented       │ prevented    │
  └──────────────────────┴─────────────┴─────────────────┴──────────────┘

  Dirty Read:          You read uncommitted data from another transaction
                       that might later roll back.

  Non-Repeatable Read: You read a row, another transaction updates + commits
                       it, then you read it again — different value.

  Phantom Read:        You query a range, another transaction inserts/deletes
                       a row in that range + commits, you query again —
                       different set of rows.

  PostgreSQL default: READ COMMITTED (no dirty reads).
  Setting isolation level:
    BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;

  ─── PESSIMISTIC LOCKING (SELECT FOR UPDATE) ────────────────────
  Locks the selected rows for the duration of the transaction.
  Other transactions that try to SELECT FOR UPDATE on the same rows
  will block until the first transaction commits or rolls back.

  BEGIN;
    SELECT * FROM accounts WHERE id = 1 FOR UPDATE;  -- row is now locked
    -- No other transaction can modify this row until we commit/rollback
    UPDATE accounts SET balance = balance - 500 WHERE id = 1;
  COMMIT;

  Use case: preventing double-spend, ticket booking (prevent overselling).

  ─── OPTIMISTIC LOCKING (version column) ────────────────────────
  No database lock. Instead, a version column is incremented on each update.
  The UPDATE checks the version; if it changed, the update affects 0 rows
  → application detects the conflict and retries.

  ALTER TABLE accounts ADD COLUMN version INTEGER NOT NULL DEFAULT 1;

  -- Read phase (no lock):
  SELECT id, balance, version FROM accounts WHERE id = 1;
  -- → { id: 1, balance: 1000, version: 5 }

  -- Write phase (check version):
  UPDATE accounts
  SET balance = balance - 500, version = version + 1
  WHERE id = 1 AND version = 5;
  -- If another transaction already updated (version is now 6),
  -- this UPDATE matches 0 rows → application retries from read phase.

  Use case: lower contention than FOR UPDATE; suitable for infrequent conflicts.
*/

console.log("ACID: Atomicity, Consistency, Isolation, Durability");
console.log("BEGIN → statements → COMMIT (persist) or ROLLBACK (undo)");
console.log("Isolation levels (weakest→strongest): READ UNCOMMITTED → READ COMMITTED → REPEATABLE READ → SERIALIZABLE");
console.log("FOR UPDATE: pessimistic lock — blocks other writers until commit");
console.log("Version column: optimistic locking — detect conflict via 0 rows updated");

// ───────────────────────────────────────────────────────────────
// 7. PostgreSQL-SPECIFIC FEATURES
// ───────────────────────────────────────────────────────────────

console.log("\n=== 7. PostgreSQL-Specific Features ===");

/*
  ─── JSONB COLUMNS ──────────────────────────────────────────────
  PostgreSQL stores JSON in a binary format (JSONB) that supports
  indexing and efficient querying of nested fields.

  CREATE TABLE events (
    id         BIGSERIAL PRIMARY KEY,
    user_id    BIGINT NOT NULL,
    payload    JSONB  NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  INSERT INTO events (user_id, payload) VALUES
  (1, '{"action": "purchase", "amount": 49.99, "items": ["book", "pen"]}'),
  (2, '{"action": "login",    "ip": "192.168.1.1"}');

  -- Extract a field:
  SELECT payload->>'action' AS action FROM events;

  -- Filter on JSON field:
  SELECT * FROM events WHERE payload->>'action' = 'purchase';

  -- Nested:
  SELECT payload->'address'->>'city' FROM users_jsonb;

  -- Index a JSONB field:
  CREATE INDEX idx_events_action ON events((payload->>'action'));

  -- GIN index for @> (containment) queries:
  CREATE INDEX idx_events_gin ON events USING GIN(payload);
  SELECT * FROM events WHERE payload @> '{"action": "purchase"}';

  ─── ARRAY_AGG ──────────────────────────────────────────────────
  Aggregates values from multiple rows into a PostgreSQL array.

  SELECT user_id, ARRAY_AGG(status ORDER BY created_at) AS order_statuses
  FROM orders
  GROUP BY user_id;
  -- → { user_id: 1, order_statuses: ['pending', 'shipped', 'completed'] }

  ─── WINDOW FUNCTIONS ───────────────────────────────────────────
  Like GROUP BY aggregates but do NOT collapse rows — each row keeps
  its own values plus gets a computed value across a partition.

  Syntax: function() OVER (PARTITION BY col ORDER BY col)

  -- ROW_NUMBER: rank within partition
  SELECT
    user_id, id AS order_id, total,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at) AS order_num
  FROM orders;

  -- RANK: same value → same rank (gaps in sequence)
  SELECT
    user_id, total,
    RANK() OVER (ORDER BY total DESC) AS rank_by_spend
  FROM orders;

  -- LAG / LEAD: access the previous / next row's value
  SELECT
    created_at,
    total,
    LAG(total)  OVER (ORDER BY created_at) AS prev_order_total,
    LEAD(total) OVER (ORDER BY created_at) AS next_order_total
  FROM orders WHERE user_id = 1;

  -- Running total with SUM OVER:
  SELECT
    created_at, total,
    SUM(total) OVER (ORDER BY created_at) AS running_total
  FROM orders WHERE user_id = 1;

  ─── ON CONFLICT DO UPDATE (UPSERT) ─────────────────────────────
  Insert a row; if a unique constraint is violated, update instead.

  INSERT INTO user_settings (user_id, theme, notifications)
  VALUES (42, 'dark', true)
  ON CONFLICT (user_id) DO UPDATE
    SET theme         = EXCLUDED.theme,
        notifications = EXCLUDED.notifications,
        updated_at    = NOW();
  -- EXCLUDED refers to the row that was rejected by the conflict.

  ─── GENERATED COLUMNS ──────────────────────────────────────────
  Columns computed from other columns, stored automatically.

  CREATE TABLE products (
    id          BIGSERIAL PRIMARY KEY,
    price       DECIMAL(10,2),
    tax_rate    DECIMAL(5,4) DEFAULT 0.18,
    price_with_tax DECIMAL(10,2) GENERATED ALWAYS AS (price * (1 + tax_rate)) STORED
  );

  ─── PG_NOTIFY ──────────────────────────────────────────────────
  Real-time pub/sub built into PostgreSQL — notify listening clients
  when a row changes (e.g. via a trigger).

  -- In a trigger:
  PERFORM pg_notify('orders_channel', row_to_json(NEW)::text);

  -- Application listens via pg driver (e.g. node-postgres):
  client.query('LISTEN orders_channel');
  client.on('notification', (msg) => console.log(msg.payload));
*/

console.log("JSONB: store + index JSON in PostgreSQL; use ->> for text extraction, @> for containment");
console.log("array_agg: collect values into an array per group");
console.log("Window functions: ROW_NUMBER, RANK, LAG, LEAD — compute over a partition without collapsing rows");
console.log("ON CONFLICT DO UPDATE: atomic upsert");
console.log("GENERATED columns: computed + stored automatically");
console.log("pg_notify: built-in pub/sub for real-time change events");

// ───────────────────────────────────────────────────────────────
// 8. COMMON SCHEMA PATTERNS
// ───────────────────────────────────────────────────────────────

console.log("\n=== 8. Common Schema Patterns ===");

/*
  ─── SOFT DELETE ────────────────────────────────────────────────
  Instead of hard DELETE, set a timestamp to mark the row as deleted.
  Data is retained for auditing; hard delete can happen later.

  ALTER TABLE users ADD COLUMN deleted_at TIMESTAMPTZ;

  -- Soft delete:
  UPDATE users SET deleted_at = NOW() WHERE id = 42;

  -- All active users:
  SELECT * FROM users WHERE deleted_at IS NULL;

  -- All deleted users:
  SELECT * FROM users WHERE deleted_at IS NOT NULL;

  Pattern: add a partial index to keep queries fast:
  CREATE INDEX idx_users_active ON users(id) WHERE deleted_at IS NULL;

  ─── AUDIT COLUMNS ──────────────────────────────────────────────
  Add to every table as a baseline:

  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()

  Auto-update updated_at via a trigger:

  CREATE OR REPLACE FUNCTION set_updated_at()
  RETURNS TRIGGER AS $$
  BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
  $$ LANGUAGE plpgsql;

  CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

  ─── UUID vs BIGSERIAL as PRIMARY KEY ───────────────────────────

  BIGSERIAL (auto-increment integer):
    ✅ Compact (8 bytes), slightly faster for B-tree inserts (sequential)
    ✅ Human-readable in URLs (e.g. /users/42)
    ❌ Leaks row count / insert rate (competitors can infer scale)
    ❌ Hard to merge data from multiple databases / services

  UUID:
    ✅ Globally unique — safe to generate in the application layer
    ✅ No coordination required across microservices or databases
    ✅ IDs are opaque — does not leak business data
    ❌ 16 bytes (vs 8) — larger indexes, more I/O
    ❌ Random UUIDs cause B-tree fragmentation → use UUID v7 (time-ordered)

  Rule: use BIGSERIAL for most tables; use UUID when merging data across
  multiple databases, for externally-exposed IDs, or in microservices.

  ─── JUNCTION TABLE (Many-to-Many) ──────────────────────────────
  M:N relationships require a third "junction" or "join" table.

  Example: students can enroll in many courses; courses have many students.

  CREATE TABLE students (id BIGSERIAL PRIMARY KEY, name TEXT NOT NULL);
  CREATE TABLE courses  (id BIGSERIAL PRIMARY KEY, name TEXT NOT NULL);

  CREATE TABLE enrollments (
    student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    course_id  BIGINT NOT NULL REFERENCES courses(id)  ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (student_id, course_id)   -- composite PK prevents duplicates
  );

  -- All courses for a student:
  SELECT c.name FROM courses c
  JOIN enrollments e ON e.course_id = c.id
  WHERE e.student_id = 7;

  ─── POLYMORPHIC ASSOCIATIONS ────────────────────────────────────
  One table references multiple other tables.
  Useful for generic models (e.g. comments on users, posts, or products).

  CREATE TABLE comments (
    id              BIGSERIAL PRIMARY KEY,
    body            TEXT NOT NULL,
    commentable_type VARCHAR(50) NOT NULL,  -- 'User', 'Post', 'Product'
    commentable_id  BIGINT      NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW()
  );

  -- Cannot use a foreign key here (would reference different tables).
  -- Create a composite index for fast lookups:
  CREATE INDEX idx_comments_poly ON comments(commentable_type, commentable_id);

  -- All comments on Post 5:
  SELECT * FROM comments
  WHERE commentable_type = 'Post' AND commentable_id = 5;

  Trade-off: loses FK referential integrity — application must enforce
  consistency. Many teams prefer separate tables (post_comments, user_comments)
  to keep FK constraints intact.
*/

console.log("Soft delete: deleted_at TIMESTAMP — retain data, filter with WHERE deleted_at IS NULL");
console.log("Audit columns: created_at, updated_at — auto-set via trigger");
console.log("UUID vs BIGSERIAL: UUID for globally unique / multi-service; BIGSERIAL for most tables");
console.log("Junction table: models M:N with composite PK — prevents duplicate associations");
console.log("Polymorphic: one table references multiple parents — loses FK safety");

// ───────────────────────────────────────────────────────────────
// PRACTICE
// ───────────────────────────────────────────────────────────────

console.log("\n=== Practice Q&A ===");

/*
  Q1: What's the difference between WHERE and HAVING?

  A: WHERE filters individual rows BEFORE any grouping or aggregation occurs.
     It operates on raw column values and cannot reference aggregate functions.

     HAVING filters groups AFTER the GROUP BY and aggregation step.
     It operates on aggregate results (COUNT, SUM, etc.).

     Execution order:
       FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT

     Example:
       -- WHERE: filter orders with total > 100 first, then group
       SELECT user_id, COUNT(*) FROM orders
       WHERE total > 100
       GROUP BY user_id;

       -- HAVING: group all orders, then keep groups with count > 3
       SELECT user_id, COUNT(*) AS cnt FROM orders
       GROUP BY user_id
       HAVING COUNT(*) > 3;

       -- You CANNOT write: WHERE COUNT(*) > 3  → syntax error

  ─────────────────────────────────────────────────────────────────

  Q2: You have a `users` table and an `orders` table.
      Write a query to get users who have placed more than 3 orders.

  A:
     -- Option 1: GROUP BY + HAVING (most readable)
     SELECT u.id, u.name, COUNT(o.id) AS order_count
     FROM users u
     JOIN orders o ON o.user_id = u.id
     GROUP BY u.id, u.name
     HAVING COUNT(o.id) > 3
     ORDER BY order_count DESC;

     -- Option 2: Subquery
     SELECT * FROM users
     WHERE id IN (
       SELECT user_id FROM orders
       GROUP BY user_id
       HAVING COUNT(*) > 3
     );

     -- Option 3: CTE (most maintainable for complex queries)
     WITH heavy_buyers AS (
       SELECT user_id, COUNT(*) AS cnt
       FROM orders
       GROUP BY user_id
       HAVING COUNT(*) > 3
     )
     SELECT u.name, hb.cnt AS order_count
     FROM users u
     JOIN heavy_buyers hb ON hb.user_id = u.id;

  ─────────────────────────────────────────────────────────────────

  Q3: Why does column order in a composite index matter?

  A: Because the database uses the leftmost prefix of the index.

     An index on (user_id, status) is stored sorted first by user_id,
     then by status within each user_id group.

     Queries that benefit:
       WHERE user_id = 1                     ✅ uses the index
       WHERE user_id = 1 AND status = 'paid' ✅ uses the index (both columns)

     Queries that do NOT benefit:
       WHERE status = 'paid'                 ❌ cannot skip to the second column
                                                because rows are not sorted by
                                                status globally — must do Seq Scan

     Rule: put the column you filter on most frequently (or with highest
     selectivity) first. If you often filter on status alone, create a
     separate index on (status) in addition to (user_id, status).

  ─────────────────────────────────────────────────────────────────

  Q4: Explain what happens if a transaction fails halfway through
      a money transfer.

  A: The transaction ensures atomicity — the database engine:

     1. Begins the transaction:
          BEGIN;
            UPDATE accounts SET balance = balance - 500 WHERE id = 1; -- debit Alice
            -- Crash / error / constraint violation here
            UPDATE accounts SET balance = balance + 500 WHERE id = 2; -- credit Bob (never runs)
          COMMIT;

     2. If the process crashes, the network drops, the app throws an error,
        or any statement fails (e.g. balance goes below a CHECK constraint),
        PostgreSQL automatically rolls back all changes in the transaction.

     3. Result: Alice's account is NOT debited. Bob's account is NOT credited.
        The database remains in the state it was before BEGIN.

     4. The write-ahead log (WAL) ensures durability — if COMMIT succeeded
        and the server then crashes, the transaction is replayed from WAL
        on restart. Committed data is never lost.

  ─────────────────────────────────────────────────────────────────

  Q5: What's the N+1 problem? Give a SQL example.

  A: The N+1 problem occurs when you execute 1 query to fetch a list of
     N parent records, and then N additional queries — one per parent —
     to fetch related child records. Total: N+1 queries instead of 1.

     BAD (N+1 — happens often with ORMs in "lazy loading" mode):
       -- Query 1: fetch 100 users
       SELECT * FROM users LIMIT 100;

       -- Then in application code, for each user:
       for each user in users:
         SELECT * FROM orders WHERE user_id = user.id;
       -- → 100 more queries = 101 total round-trips to the database

       -- With 100ms latency per query: 101 × 100ms = ~10 seconds!

     GOOD (single JOIN):
       SELECT u.id, u.name, o.id AS order_id, o.total, o.status
       FROM users u
       LEFT JOIN orders o ON o.user_id = u.id
       LIMIT 100;
       -- → 1 query, 1 round-trip, all data returned together

     Detection: if you see the same query repeated N times in DB logs
     with only the WHERE value changing, you have N+1.
     Fix: use a JOIN, eager loading, or batch-load child IDs with IN (...).
*/

console.log("Q1: WHERE filters rows before grouping; HAVING filters groups after aggregation");
console.log("Q2: GROUP BY user_id HAVING COUNT(*) > 3  (or subquery / CTE variant)");
console.log("Q3: Leftmost prefix rule — index on (A,B) helps WHERE A=? but not WHERE B=?");
console.log("Q4: Failed transaction auto-rolls back — neither debit nor credit is applied");
console.log("Q5: N+1 = 1 query for N parents + N queries for children; fix with a single JOIN");

// ───────────────────────────────────────────────────────────────
// DEMO — reference card
// ───────────────────────────────────────────────────────────────

function runDemo(): void {
    console.log("\n" + "═".repeat(65));
    console.log("  SQL FUNDAMENTALS — REFERENCE CARD");
    console.log("═".repeat(65));

    console.log("\n── JOIN TYPES ──────────────────────────────────────────────");
    const joinTypes: Array<{ join: string; returns: string; use_when: string }> = [
        {
            join: "INNER JOIN",
            returns: "Matched rows only",
            use_when: "You only want rows with data on both sides",
        },
        {
            join: "LEFT JOIN",
            returns: "All left rows + matched right (NULLs if no match)",
            use_when: "Show all left-side rows regardless of right-side match",
        },
        {
            join: "RIGHT JOIN",
            returns: "All right rows + matched left (NULLs if no match)",
            use_when: "Rarely — just swap table order and use LEFT JOIN",
        },
        {
            join: "FULL OUTER JOIN",
            returns: "All rows from both sides",
            use_when: "Data reconciliation; find orphans on either side",
        },
        {
            join: "CROSS JOIN",
            returns: "Every row × every row (cartesian product)",
            use_when: "Generate all combinations (size grid, scheduling)",
        },
        {
            join: "Self JOIN",
            returns: "Table joined to itself via alias",
            use_when: "Hierarchical data (employees ↔ managers)",
        },
    ];
    joinTypes.forEach((j) => {
        console.log(`  ${j.join.padEnd(18)} → ${j.returns}`);
        console.log(`  ${"".padEnd(18)}   Use: ${j.use_when}`);
    });

    console.log("\n── ISOLATION LEVELS ────────────────────────────────────────");
    console.log("  Level                  Dirty  Non-Rep  Phantom  Notes");
    console.log("  ─────────────────────  ─────  ───────  ───────  ─────────────────────");
    const isolationLevels: Array<[string, string, string, string, string]> = [
        ["READ UNCOMMITTED",  "yes",  "yes",  "yes",  "Lowest protection; rarely used"],
        ["READ COMMITTED",    "no",   "yes",  "yes",  "PG default; safe for most apps"],
        ["REPEATABLE READ",   "no",   "no",   "yes",  "PG prevents phantoms too (MVCC)"],
        ["SERIALIZABLE",      "no",   "no",   "no",   "Highest; may cause more retries"],
    ];
    isolationLevels.forEach(([level, dirty, nonRep, phantom, notes]) => {
        console.log(
            `  ${level.padEnd(22)} ${dirty.padEnd(6)} ${nonRep.padEnd(8)} ${phantom.padEnd(8)} ${notes}`
        );
    });

    console.log("\n── INDEX GUIDELINES ────────────────────────────────────────");
    const indexGuidelines: Array<{ rule: string; detail: string }> = [
        {
            rule: "DO index",
            detail: "FK columns (user_id, order_id), high-cardinality filter columns",
        },
        {
            rule: "DO index",
            detail: "Columns in ORDER BY on large result sets",
        },
        {
            rule: "DO index",
            detail: "Composite: most selective column first",
        },
        {
            rule: "PARTIAL index",
            detail: "WHERE deleted_at IS NULL — small, focused, fast",
        },
        {
            rule: "AVOID index",
            detail: "Boolean / low-cardinality columns (status with 2–3 values)",
        },
        {
            rule: "AVOID index",
            detail: "Write-heavy tables — index maintenance slows INSERT/UPDATE/DELETE",
        },
        {
            rule: "AVOID index",
            detail: "Small tables (<1000 rows) — Seq Scan is faster",
        },
        {
            rule: "DIAGNOSE",
            detail: "EXPLAIN ANALYZE — look for Seq Scan on large tables",
        },
    ];
    indexGuidelines.forEach((g) => {
        console.log(`  [${g.rule.padEnd(14)}]  ${g.detail}`);
    });

    console.log("\n── QUERY EXECUTION ORDER ───────────────────────────────────");
    const order = ["FROM", "JOIN", "WHERE", "GROUP BY", "HAVING", "SELECT", "DISTINCT", "ORDER BY", "LIMIT / OFFSET"];
    order.forEach((step, i) => {
        console.log(`  ${String(i + 1).padStart(2)}. ${step}`);
    });

    console.log("\n── ACID CHEATSHEET ─────────────────────────────────────────");
    console.log("  Atomicity    — All statements commit or none do (no partial writes)");
    console.log("  Consistency  — DB constraints are never violated mid-transaction");
    console.log("  Isolation    — Concurrent transactions don't see each other's work-in-progress");
    console.log("  Durability   — Committed data survives crashes (WAL / write-ahead log)");

    console.log("\n── COMMON SCHEMA PATTERNS ──────────────────────────────────");
    console.log("  Soft delete:       deleted_at TIMESTAMPTZ — filter with WHERE deleted_at IS NULL");
    console.log("  Audit columns:     created_at, updated_at — auto-set via DEFAULT / trigger");
    console.log("  UUID vs BIGSERIAL: UUID for cross-service / opaque IDs; BIGSERIAL for most");
    console.log("  M:N junction:      composite PK (a_id, b_id) prevents duplicates");
    console.log("  Polymorphic:       (commentable_type, commentable_id) — loses FK safety");

    console.log("\n" + "═".repeat(65));
    console.log("  Next: 07-query-optimization-and-orm.ts  (Day 42)");
    console.log("═".repeat(65));
}

export default runDemo;
runDemo();
