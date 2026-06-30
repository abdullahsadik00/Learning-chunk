// ═══════════════════════════════════════════════════════════════
// BACKEND 10: DATABASE DESIGN · NORMALIZATION · SCHEMA PATTERNS · PERFORMANCE TRADE-OFFS  (Day 45)
// Run: npx ts-node 10-database-design.ts
// ═══════════════════════════════════════════════════════════════
//
// A well-designed schema is the foundation of every reliable backend.
// Get it wrong and no amount of clever application code fixes it.
//
// MENTAL MODEL:
//  • Normalize to eliminate data anomalies (update/delete/insert anomalies)
//  • Denormalize only after measuring — premature denormalization = premature optimization
//  • Choose keys for your access patterns and scale target
//  • Index what you query; don't index what you don't
//  • Migrations are a deployment artifact — treat them like production code

// ───────────────────────────────────────────────────────────────
// 1. NORMALIZATION
// ───────────────────────────────────────────────────────────────

console.log("=== 1. Normalization ===");

/*
  NORMALIZATION = decomposing tables to remove redundancy and anomalies.

  The three anomaly types you're eliminating:
    - Update anomaly:  a fact stored in N rows — update one, miss others → inconsistency
    - Insert anomaly:  can't record a fact without an unrelated fact existing first
    - Delete anomaly:  deleting one fact accidentally deletes another unrelated fact

  ─── 1NF (First Normal Form) ───────────────────────────────────
  Rules:
    1. Every cell holds one atomic value (no sets, no arrays, no comma lists)
    2. No repeating groups (no tag1/tag2/tag3 columns)
    3. Every row is uniquely identifiable (has a PK)

  VIOLATION:
    orders(order_id, customer_name, items)   ← items = "book,pen,ruler" (not atomic)
    orders(order_id, tag1, tag2, tag3)       ← repeating group

  FIX:
    orders(order_id, customer_id)
    order_items(order_id, item_id, qty)

  ─── 2NF (Second Normal Form) ──────────────────────────────────
  Requires 1NF PLUS:
    No partial dependency — every non-key column depends on the WHOLE composite PK,
    not just part of it.

  VIOLATION (composite PK = order_id + product_id):
    order_items(order_id, product_id, qty, product_name)
    product_name depends only on product_id, not the full PK → partial dependency

  FIX:
    order_items(order_id, product_id, qty)
    products(product_id, product_name, price)

  Note: 2NF only matters when you have a composite PK.
        Tables with a single-column PK are automatically in 2NF.

  ─── 3NF (Third Normal Form) ───────────────────────────────────
  Requires 2NF PLUS:
    No transitive dependency — non-key column must not depend on another non-key column.

  VIOLATION:
    employees(emp_id, dept_id, dept_name)
    dept_name depends on dept_id (a non-key), not directly on emp_id

  FIX:
    employees(emp_id, dept_id)
    departments(dept_id, dept_name)

  ─── BCNF (Boyce-Codd Normal Form) ─────────────────────────────
  A stricter version of 3NF. For every functional dependency X → Y,
  X must be a superkey. Handles edge cases with overlapping candidate keys.
  In practice: if you're in 3NF and have only one candidate key, you're in BCNF.

  ─── DENORMALIZATION — when it's intentional ────────────────────
  After normalization, sometimes you intentionally add redundancy for:
    • Read performance: a reporting table that pre-joins 6 tables
    • Reporting / analytics: star schema (fact table + dimension tables)
    • Caching derived values: storing a pre-calculated `order_total` column

  THE RULE: normalize first, denormalize when you measure a bottleneck.
  Never guess — use EXPLAIN ANALYZE, identify the slow query, then decide.
*/

// TypeScript representation of normalization stages:

// BEFORE: violates 1NF (tags in one column) and 2NF
interface OrderDenormalized {
  order_id: number;
  customer_name: string;  // should live in customers table
  product_id: number;
  product_name: string;   // partial dependency on product_id alone
  qty: number;
  tags: string;           // "urgent,fragile" — not atomic
}

// AFTER: normalized to 3NF
interface Customer {
  customer_id: number;
  name: string;
  email: string;
}

interface Product {
  product_id: number;
  name: string;
  price_cents: number;
}

interface Order {
  order_id: number;
  customer_id: number;    // FK → customers
  created_at: Date;
}

interface OrderItem {
  order_id: number;       // FK → orders  (composite PK: order_id + product_id)
  product_id: number;     // FK → products
  qty: number;
}

interface OrderTag {
  order_id: number;       // FK → orders
  tag: string;            // one row per tag — atomic, 1NF compliant
}

console.log("Normalized schema interfaces defined (Customer, Product, Order, OrderItem, OrderTag)");

// ───────────────────────────────────────────────────────────────
// 2. PRIMARY KEY CHOICES
// ───────────────────────────────────────────────────────────────

console.log("\n=== 2. Primary Key Choices ===");

/*
  ─── BIGSERIAL (auto-increment integer) ─────────────────────────
  SQL:  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY
        -- or the shorthand:
        id BIGSERIAL PRIMARY KEY

  Pros:
    + Simple, small (8 bytes), always ordered → sequential B-tree inserts
    + Human-readable, easy to debug
    + Slightly faster joins and index scans
  Cons:
    - Leaks information: competitor sees you went from order #1000 to #2000 in a week
    - Merge conflicts if you ever combine data from two databases
    - Predictable → enumeration attacks if exposed in URLs

  ─── UUID v4 (random) ───────────────────────────────────────────
  SQL:  id UUID DEFAULT gen_random_uuid() PRIMARY KEY

  Pros:
    + Globally unique — safe to generate on the client or in distributed systems
    + No information leakage
    + Can be generated before the INSERT (useful for optimistic UI)
  Cons:
    - 16 bytes (vs 8 for bigint)
    - Completely random → B-tree index fragmentation on large tables
      Every INSERT lands at a random leaf page → page splits → bloat → slower reads
    - Not human-readable

  ─── UUID v7 (time-ordered) ─────────────────────────────────────
  Format: first 48 bits = millisecond timestamp, remaining bits = random

  Pros:
    + Globally unique (distributed-safe)
    + Monotonically increasing within a millisecond → sequential B-tree inserts
    + Embeds creation timestamp → you can extract created_at from the ID itself
    + Best of both: ordering of BIGSERIAL + global uniqueness of UUID v4
  Cons:
    - 16 bytes
    - Not yet in all DB drivers natively (Postgres 17+ has pg_uuidv7 extension)

  ─── CUID2 ──────────────────────────────────────────────────────
  A collision-resistant, URL-safe, monotonically increasing ID (starts with a letter).
  Length ~24 chars. Generated in application code (Node.js library).

  Pros:
    + URL-safe (no hyphens, no special chars)
    + Collision-resistant even with parallel generation
    + Monotonic within a process
  Cons:
    - String, not UUID type → stored as TEXT or CHAR(24) → slightly larger
    - Not a SQL standard type

  ─── COMPOSITE PKs ──────────────────────────────────────────────
  Use in junction tables:
    PRIMARY KEY (user_id, role_id)
  Enforces uniqueness at the DB level.
  Still add individual indexes on each FK column for reverse lookups:
    CREATE INDEX ON user_roles(role_id);

  ─── IMPACT ON B-TREE INDEX PERFORMANCE ─────────────────────────
  PostgreSQL uses B-tree indexes by default.
  B-tree requires sequential inserts for optimal fill factor.
  Random UUID v4: each INSERT touches a random page → cache misses → write amplification
  At ~10M rows this becomes measurable; at ~100M rows it's a serious problem.
  UUID v7 and BIGSERIAL avoid this entirely.
*/

type PrimaryKeyType = "bigserial" | "uuid_v4" | "uuid_v7" | "cuid2";

interface PKTradeoff {
  type: PrimaryKeyType;
  sizeBytes: number;
  ordered: boolean;
  globallyUnique: boolean;
  leaksCount: boolean;
  urlSafe: boolean;
  recommendation: string;
}

const pkComparison: PKTradeoff[] = [
  {
    type: "bigserial",
    sizeBytes: 8,
    ordered: true,
    globallyUnique: false,
    leaksCount: true,
    urlSafe: true,
    recommendation: "Default for simple single-DB apps where count leakage is acceptable",
  },
  {
    type: "uuid_v4",
    sizeBytes: 16,
    ordered: false,
    globallyUnique: true,
    leaksCount: false,
    urlSafe: false,
    recommendation: "Avoid for high-write tables; causes B-tree fragmentation",
  },
  {
    type: "uuid_v7",
    sizeBytes: 16,
    ordered: true,
    globallyUnique: true,
    leaksCount: false,
    urlSafe: false,
    recommendation: "Best general choice for distributed systems — ordered + globally unique",
  },
  {
    type: "cuid2",
    sizeBytes: 24,
    ordered: true,
    globallyUnique: true,
    leaksCount: false,
    urlSafe: true,
    recommendation: "Good for APIs where IDs appear in URLs; requires app-layer generation",
  },
];

pkComparison.forEach(pk => {
  console.log(`${pk.type.padEnd(12)} | ${pk.sizeBytes}B | ordered:${pk.ordered} | global:${pk.globallyUnique}`);
});

// ───────────────────────────────────────────────────────────────
// 3. RELATIONSHIP PATTERNS
// ───────────────────────────────────────────────────────────────

console.log("\n=== 3. Relationship Patterns ===");

/*
  ─── ONE-TO-ONE ──────────────────────────────────────────────────
  Two options:

  A) Same table — use when the related data is:
     - Always present (not optional)
     - Queried together 99% of the time
     - Small (won't bloat the main table)
     Example: users(id, email, password_hash, display_name)

  B) Separate table — use when the related data is:
     - Optional or rarely populated
     - Large / not needed on every query (e.g. user profile with bio, avatar_url, etc.)
     - Has its own access pattern
     Example: users(id, email)   user_profiles(user_id PK/FK, bio, avatar_url, website)
     user_id is both PK and FK → enforces 1-to-1 at DB level

  ─── ONE-TO-MANY ─────────────────────────────────────────────────
  FK lives in the "many" table pointing to the "one" table.
  Never put the FK in the "one" table — that would require arrays.

  users(id)
  posts(id, user_id FK → users.id, title, body)

  One user → many posts.

  ─── MANY-TO-MANY ────────────────────────────────────────────────
  Always needs a junction (join/pivot) table.

  users(id, name)
  roles(id, name)
  user_roles(user_id FK, role_id FK, PRIMARY KEY(user_id, role_id))

  Implicit junction (Prisma handles it):
    Use when the relationship itself has no extra data.

  Explicit junction (you define the model):
    Use when the relationship has its own columns:
    user_roles(user_id, role_id, assigned_at, assigned_by FK → users.id)

  ─── POLYMORPHIC ASSOCIATIONS ────────────────────────────────────
  One table that can belong to multiple other tables.
  Example: comments that can be on posts OR on videos.

  Option A: entity_type + entity_id columns
    comments(id, entity_type TEXT, entity_id BIGINT, body)
    entity_type = 'post' | 'video'

    Tradeoffs:
    - CANNOT have a real FK constraint (entity_id could reference two different tables)
    - Application code must enforce referential integrity
    - Queries need WHERE entity_type = 'post' — can index (entity_type, entity_id)
    - Simple to implement, works well for 2-3 parent types

  Option B: separate join tables per type (recommended for strict integrity)
    post_comments(comment_id FK, post_id FK)
    video_comments(comment_id FK, video_id FK)
    comments(id, body, ...)  ← shared data

    Tradeoffs:
    + Full FK constraints
    + DB-level referential integrity
    - More tables, more complex queries

  ─── SELF-REFERENTIAL ────────────────────────────────────────────
  A table that references itself. Common for:
    - Category trees: categories(id, name, parent_id FK → categories.id)
    - Org chart:      employees(id, name, manager_id FK → employees.id)
    - Comment threads: comments(id, body, parent_comment_id FK → comments.id)

  Querying hierarchies in SQL:
    WITH RECURSIVE subtree AS (
      SELECT id, name, parent_id FROM categories WHERE id = $1
      UNION ALL
      SELECT c.id, c.name, c.parent_id
      FROM categories c
      JOIN subtree s ON c.parent_id = s.id
    )
    SELECT * FROM subtree;

  Postgres supports this natively. For deep trees (100+ levels),
  consider the ltree extension or adjacency list stored in application code.
*/

// TypeScript interfaces for relationship patterns:

// Self-referential
interface Category {
  id: number;
  name: string;
  parent_id: number | null;  // null = root category
}

// Polymorphic association
type CommentableType = "post" | "video" | "product";

interface Comment {
  id: number;
  entity_type: CommentableType;
  entity_id: number;
  body: string;
  created_at: Date;
}

// Explicit junction table
interface UserRole {
  user_id: number;
  role_id: number;
  assigned_at: Date;
  assigned_by: number;  // FK → users.id
}

console.log("Relationship interface examples: Category (self-ref), Comment (polymorphic), UserRole (explicit junction)");

// ───────────────────────────────────────────────────────────────
// 4. COMMON SCHEMA PATTERNS
// ───────────────────────────────────────────────────────────────

console.log("\n=== 4. Common Schema Patterns ===");

/*
  ─── SOFT DELETE ─────────────────────────────────────────────────
  Instead of DELETE, set deleted_at = NOW().
  Hard deletes are irreversible and lose audit history.

  Schema:
    ALTER TABLE posts ADD COLUMN deleted_at TIMESTAMP NULL;

  Querying (CRITICAL — you must filter everywhere):
    SELECT * FROM posts WHERE deleted_at IS NULL;  ← always add this

  Problems:
    1. Every query must include WHERE deleted_at IS NULL — easy to forget
    2. Unique constraints break: email must be unique, but soft-deleted users
       still occupy the unique slot.
       Fix: unique index on (email) WHERE deleted_at IS NULL
            CREATE UNIQUE INDEX ON users(email) WHERE deleted_at IS NULL;
    3. FK references to soft-deleted rows still work (the row exists)
       You must handle this in application logic

  Prisma tip:
    Use a global middleware to inject `where: { deleted_at: null }` automatically.
    Or use the @softdelete custom extension pattern.

  ─── AUDIT TRAIL ─────────────────────────────────────────────────
  Option A: columns on the main table
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    created_by INT FK → users.id
    updated_by INT FK → users.id

  Pros: simple, right there with the data
  Cons: only captures last-updated, not full history

  Option B: separate audit_log table (full history)
    audit_log(
      id          BIGSERIAL PK,
      table_name  TEXT,
      record_id   BIGINT,
      action      TEXT,         -- 'INSERT' | 'UPDATE' | 'DELETE'
      old_values  JSONB,
      new_values  JSONB,
      changed_by  INT FK → users.id,
      changed_at  TIMESTAMPTZ DEFAULT NOW()
    )

  Implemented via a DB trigger or application middleware.
  Pros: full row-level history, queryable
  Cons: grows fast, needs its own retention policy

  ─── MULTI-TENANCY ───────────────────────────────────────────────
  Three strategies:

  1. Separate databases per tenant
     Pros: full isolation, easy backup/restore per tenant, regulatory compliance
     Cons: N databases to manage, connection pooling complexity, schema migrations × N

  2. Separate schemas per tenant (Postgres schemas)
     One DB, one schema per tenant: tenant_a.users, tenant_b.users
     Pros: schema-level isolation, shared infrastructure
     Cons: migrations still × N schemas, harder to query across tenants

  3. Shared table with tenant_id column (most common for SaaS)
     users(id, tenant_id FK → tenants.id, name, email)
     Every table has tenant_id. Every query filters by it.

     Postgres Row-Level Security (RLS):
       ALTER TABLE users ENABLE ROW LEVEL SECURITY;
       CREATE POLICY tenant_isolation ON users
         USING (tenant_id = current_setting('app.current_tenant_id')::int);
     Now every query is automatically filtered — you can't forget the WHERE clause.

     Pros: single schema to migrate, easy cross-tenant analytics
     Cons: one noisy tenant can affect others, bigger tables

  ─── EVENT SOURCING (lite) ───────────────────────────────────────
  Instead of storing current state, store a sequence of events.
  Current state is derived by replaying events.

  events(
    id          BIGSERIAL PK,
    aggregate_id UUID,           -- e.g. order_id
    aggregate_type TEXT,         -- 'order' | 'account'
    event_type  TEXT,            -- 'OrderPlaced' | 'ItemAdded' | 'OrderCancelled'
    payload     JSONB,
    occurred_at TIMESTAMPTZ DEFAULT NOW(),
    version     INT              -- optimistic concurrency: events are ordered per aggregate
  )

  How it works:
    - Load all events WHERE aggregate_id = $1 ORDER BY version
    - Reduce (fold) them into current state in application code
    - Never UPDATE or DELETE events — they are immutable

  Benefits:
    - Complete audit history is free
    - Time-travel queries: what was the state at T?
    - Easy to add new read models (projections) without changing write side

  When to use:
    - Complex business rules with many state transitions
    - Auditability is a hard requirement
    - You need to replay history (billing reconciliation, compliance)

  When NOT to use:
    - Simple CRUD apps — massive over-engineering
    - Team unfamiliar with the pattern — high learning curve

  ─── OUTBOX PATTERN ──────────────────────────────────────────────
  Problem: you save data to the DB AND publish an event to Kafka/RabbitMQ.
  If the DB write succeeds but the publish fails → data inconsistency.
  If you publish first and then the DB write fails → ghost events.

  Solution: write the event to an outbox table IN THE SAME TRANSACTION as your business data.
  A separate worker polls the outbox and publishes to the message broker.

  outbox(
    id          BIGSERIAL PK,
    topic       TEXT,            -- 'order.placed'
    payload     JSONB,
    published   BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMPTZ DEFAULT NOW()
  )

  Transaction:
    BEGIN;
      INSERT INTO orders(...) VALUES (...);
      INSERT INTO outbox(topic, payload) VALUES ('order.placed', '{"order_id": 42}');
    COMMIT;

  Worker (runs every N seconds):
    SELECT * FROM outbox WHERE published = FALSE ORDER BY id LIMIT 100;
    -- for each row: publish to broker, then UPDATE outbox SET published = TRUE
    -- use SELECT FOR UPDATE SKIP LOCKED to avoid concurrent worker conflicts

  Guarantees at-least-once delivery. Make consumers idempotent.
*/

// TypeScript types for the patterns:

interface SoftDeletable {
  deleted_at: Date | null;
}

interface Auditable {
  created_at: Date;
  updated_at: Date;
  created_by: number;
  updated_by: number;
}

type EventType = "OrderPlaced" | "ItemAdded" | "OrderCancelled" | "PaymentReceived";

interface DomainEvent {
  id: number;
  aggregate_id: string;       // UUID of the order/account/etc.
  aggregate_type: string;
  event_type: EventType;
  payload: Record<string, unknown>;
  occurred_at: Date;
  version: number;
}

interface OutboxEntry {
  id: number;
  topic: string;
  payload: Record<string, unknown>;
  published: boolean;
  created_at: Date;
}

// Simulate applying events to derive state
interface OrderState {
  order_id: string;
  status: "pending" | "active" | "cancelled";
  items: Array<{ product_id: number; qty: number }>;
}

function replayEvents(events: DomainEvent[]): OrderState | null {
  if (events.length === 0) return null;

  return events.reduce<OrderState>((state, event) => {
    switch (event.event_type) {
      case "OrderPlaced":
        return { ...state, status: "active" };
      case "ItemAdded": {
        const item = event.payload as { product_id: number; qty: number };
        return { ...state, items: [...state.items, item] };
      }
      case "OrderCancelled":
        return { ...state, status: "cancelled" };
      default:
        return state;
    }
  }, { order_id: events[0].aggregate_id, status: "pending", items: [] });
}

const mockEvents: DomainEvent[] = [
  { id: 1, aggregate_id: "abc-123", aggregate_type: "order", event_type: "OrderPlaced", payload: {}, occurred_at: new Date(), version: 1 },
  { id: 2, aggregate_id: "abc-123", aggregate_type: "order", event_type: "ItemAdded", payload: { product_id: 5, qty: 2 }, occurred_at: new Date(), version: 2 },
];
const derivedState = replayEvents(mockEvents);
console.log("Event-sourced state:", JSON.stringify(derivedState));

// ───────────────────────────────────────────────────────────────
// 5. INDEXING STRATEGY
// ───────────────────────────────────────────────────────────────

console.log("\n=== 5. Indexing Strategy ===");

/*
  An index trades write speed + storage for read speed.
  Every index you add slows down INSERT/UPDATE/DELETE on that table.

  ─── WHAT TO ALWAYS INDEX ────────────────────────────────────────
  1. Foreign key columns (Postgres does NOT auto-index FKs):
       CREATE INDEX ON order_items(order_id);
       CREATE INDEX ON order_items(product_id);

  2. Columns used in WHERE clauses of frequent queries
  3. Columns used in ORDER BY (avoid sort step in query plan)
  4. Columns used in JOIN conditions

  ─── PARTIAL INDEX ───────────────────────────────────────────────
  Index only a subset of rows. Smaller index → faster scans.

    CREATE INDEX ON posts(created_at)
    WHERE deleted_at IS NULL;
    -- Only indexes active posts. Much smaller than indexing all posts.

    CREATE INDEX ON orders(user_id)
    WHERE status = 'pending';
    -- Only pending orders; if <5% of orders are pending this is much faster.

  ─── EXPRESSION INDEX ────────────────────────────────────────────
  Index the result of an expression, not a raw column value.

    CREATE INDEX ON users(lower(email));
    -- Supports: WHERE lower(email) = 'user@example.com'
    -- Without this, Postgres can't use the email index for case-insensitive lookups.

  ─── COMPOSITE INDEX — COLUMN ORDER MATTERS ──────────────────────
  Rule: equality conditions first, then range conditions.

  Query: WHERE tenant_id = 5 AND created_at > '2024-01-01'
  Good:  CREATE INDEX ON events(tenant_id, created_at)   ← equality column first
  Bad:   CREATE INDEX ON events(created_at, tenant_id)   ← range column first — poor selectivity

  Postgres uses the index only until it hits a range condition.
  After the range column, remaining columns in the index are ignored for filtering.

  ─── COVERING INDEX ──────────────────────────────────────────────
  Include all columns the query needs so Postgres never has to visit the main table.
  Called an "index-only scan" in EXPLAIN output.

    CREATE INDEX ON orders(user_id) INCLUDE (status, total_cents);
    -- Query: SELECT status, total_cents FROM orders WHERE user_id = $1
    -- Postgres reads everything from the index; no table heap access needed.

  ─── TOO MANY INDEXES ────────────────────────────────────────────
  Each index on a table:
    - Adds ~8-16 bytes per row of storage
    - Slows every INSERT (all indexes must be updated)
    - Slows every UPDATE on an indexed column
    - Slows VACUUM (more work per row)

  Audit unused indexes:
    SELECT indexname, idx_scan FROM pg_stat_user_indexes
    WHERE idx_scan = 0 AND schemaname = 'public';
    -- Any index with 0 scans since last stats reset is a candidate for removal.
*/

// TypeScript to document index decisions (useful for migration comments):
interface IndexDefinition {
  name: string;
  table: string;
  columns: string[];
  partial?: string;     // WHERE clause
  include?: string[];   // INCLUDE columns (covering index)
  expression?: string;  // for expression indexes
  reason: string;
}

const schemaIndexes: IndexDefinition[] = [
  {
    name: "idx_posts_user_id",
    table: "posts",
    columns: ["user_id"],
    reason: "FK — always index FK columns for reverse lookups",
  },
  {
    name: "idx_posts_active_created",
    table: "posts",
    columns: ["created_at"],
    partial: "deleted_at IS NULL",
    reason: "Partial index — exclude soft-deleted rows, smaller index",
  },
  {
    name: "idx_users_email_lower",
    table: "users",
    columns: [],
    expression: "lower(email)",
    reason: "Expression index for case-insensitive email lookups",
  },
  {
    name: "idx_events_tenant_created",
    table: "events",
    columns: ["tenant_id", "created_at"],
    reason: "Composite: equality (tenant_id) first, range (created_at) second",
  },
  {
    name: "idx_orders_user_covering",
    table: "orders",
    columns: ["user_id"],
    include: ["status", "total_cents"],
    reason: "Covering index — avoids table heap access for user order list query",
  },
];

schemaIndexes.forEach(idx => console.log(`  [${idx.table}] ${idx.name} — ${idx.reason}`));

// ───────────────────────────────────────────────────────────────
// 6. SCHEMA EVOLUTION
// ───────────────────────────────────────────────────────────────

console.log("\n=== 6. Schema Evolution ===");

/*
  The hardest part of database work: changing a live schema without downtime.
  Key rule: every migration must be safe with BOTH old and new code running simultaneously
  (because you deploy app and DB migrations at different times).

  ─── SAFE OPERATIONS (can run instantly on any table size) ────────
    + ADD COLUMN with a DEFAULT or NULL
    + CREATE INDEX CONCURRENTLY  (doesn't lock the table)
    + DROP COLUMN (logically — add to ignore list first)
    + ADD CONSTRAINT with NOT VALID, then VALIDATE CONSTRAINT

  ─── RISKY OPERATIONS (lock the table, may time out) ─────────────
    - ADD COLUMN NOT NULL (without a default) — rewrites entire table in Postgres < 11
      Postgres 11+: safe for constants; still risky for non-trivial defaults
    - ADD CONSTRAINT CHECK VALIDATE — acquires full lock while scanning rows
    - DROP CONSTRAINT UNIQUE — locks
    - ALTER COLUMN TYPE — full table rewrite

  ─── ADDING A NULLABLE COLUMN (safe, any Postgres version) ────────
  Step 1 — migration:
    ALTER TABLE users ADD COLUMN phone TEXT NULL;
  Step 2 — deploy new code that writes phone when available.
  Step 3 — (optional later) backfill existing rows if needed.
  No downtime. Takes milliseconds in PG (just a catalog change).

  ─── ADDING A NOT NULL COLUMN ─────────────────────────────────────
  WRONG (will lock and rewrite table):
    ALTER TABLE users ADD COLUMN is_verified BOOLEAN NOT NULL;  -- ❌

  RIGHT (zero-downtime):
  Step 1 — add nullable:
    ALTER TABLE users ADD COLUMN is_verified BOOLEAN NULL;
  Step 2 — backfill in batches (avoid one huge UPDATE):
    UPDATE users SET is_verified = FALSE
    WHERE id BETWEEN $start AND $end AND is_verified IS NULL;
  Step 3 — once all rows backfilled, add NOT NULL + default:
    ALTER TABLE users ALTER COLUMN is_verified SET DEFAULT FALSE;
    ALTER TABLE users ALTER COLUMN is_verified SET NOT NULL;
  Postgres 11+ can do Step 1+3 atomically if DEFAULT is a constant
  and no triggers exist — but batching is still safer in production.

  ─── RENAMING A COLUMN (expand-contract pattern) ──────────────────
  Never rename directly with old code still running — it will break immediately.

  Phase 1 — EXPAND: add the new column, dual-write (write to both old and new):
    ALTER TABLE users ADD COLUMN full_name TEXT NULL;
    -- App code: write to both `name` AND `full_name`

  Phase 2 — MIGRATE reads: update application code to read from `full_name`
    -- After deploying, all reads go to full_name

  Phase 3 — BACKFILL: copy data from old column to new for old rows:
    UPDATE users SET full_name = name WHERE full_name IS NULL;

  Phase 4 — CONTRACT: stop writing to old column, then drop it:
    ALTER TABLE users DROP COLUMN name;

  This takes 4 deploys but is completely zero-downtime at each step.

  ─── PRISMA MIGRATION WORKFLOW ────────────────────────────────────
  Prisma auto-generates SQL migrations from schema.prisma diffs.

  Safe workflow:
    npx prisma migrate dev --name add_phone_to_users
    -- Generates: migrations/20240115_add_phone_to_users/migration.sql
    -- Applies to dev DB
    -- NEVER edit the migration file after applying

  Production:
    npx prisma migrate deploy
    -- Applies pending migrations in order
    -- Idempotent: skips already-applied migrations

  For risky operations, override the generated SQL:
    -- In migration.sql, replace:
    ALTER TABLE "users" ADD COLUMN "is_verified" BOOLEAN NOT NULL;
    -- With the safe 3-step approach above.

  Prisma doesn't know about production data size — always review generated SQL.
*/

// Document migration safety levels:
type MigrationSafety = "safe" | "requires-backfill" | "risky-table-lock";

interface MigrationOperation {
  operation: string;
  safety: MigrationSafety;
  note: string;
}

const migrationGuide: MigrationOperation[] = [
  { operation: "ADD COLUMN NULL", safety: "safe", note: "Instant catalog change" },
  { operation: "ADD COLUMN NOT NULL DEFAULT const", safety: "safe", note: "Postgres 11+ safe for constant defaults" },
  { operation: "ADD COLUMN NOT NULL no default", safety: "risky-table-lock", note: "Use expand-contract: add nullable → backfill → add constraint" },
  { operation: "CREATE INDEX CONCURRENTLY", safety: "safe", note: "Non-blocking; takes longer but no table lock" },
  { operation: "ALTER COLUMN TYPE", safety: "risky-table-lock", note: "Full table rewrite; use expand-contract instead" },
  { operation: "RENAME COLUMN", safety: "risky-table-lock", note: "Use expand-contract: add new → dual-write → backfill → drop old" },
  { operation: "DROP COLUMN", safety: "safe", note: "Mark as ignored in app first; drop after all nodes deployed" },
];

migrationGuide.forEach(m => {
  const indicator = m.safety === "safe" ? "SAFE" : m.safety === "requires-backfill" ? "BACKFILL" : "RISKY";
  console.log(`  [${indicator.padEnd(8)}] ${m.operation.padEnd(40)} — ${m.note}`);
});

// ───────────────────────────────────────────────────────────────
// 7. PERFORMANCE TRADE-OFFS
// ───────────────────────────────────────────────────────────────

console.log("\n=== 7. Performance Trade-offs ===");

/*
  ─── VERTICAL vs HORIZONTAL SCALING ──────────────────────────────
  Vertical (scale-up): bigger server, more RAM/CPU/disk
    + Simple — no application changes
    - Expensive, hard limit (you can't buy an infinite server)
    - Single point of failure

  Horizontal (scale-out): more servers
    + Theoretically unlimited
    - Complex: need to distribute load, handle consistency
    - Sharding adds application complexity

  For most web apps: vertical scaling + read replicas gets you very far.
  Sharding is rarely needed before 100M+ rows or 10k+ writes/sec.

  ─── READ REPLICAS ────────────────────────────────────────────────
  One primary handles all writes. One or more replicas handle reads.
  Postgres streaming replication provides near-real-time replicas (< 100ms lag typical).

  Application routing:
    - All INSERT/UPDATE/DELETE → primary
    - SELECT for reports/analytics/dashboards → replica
    - SELECT in same transaction as a write → primary (read-your-writes consistency)

  Prisma example:
    const prisma = new PrismaClient({
      datasources: { db: { url: process.env.DATABASE_URL } },
    })
    // For reads: prisma.$extends({ ... replica routing ... })

  ─── SHARDING STRATEGIES ──────────────────────────────────────────
  Splitting data across multiple database servers.

  1. By user/tenant ID (most common):
     users 1–1M → shard 0, users 1M–2M → shard 1, etc.
     Pro: queries for one user always go to one shard
     Con: "hot" users (celebrities) overload one shard → rebalancing needed

  2. By hash: shard = hash(user_id) % N
     Pro: even distribution
     Con: rebalancing when N changes requires migrating ~half the data

  3. By geography:
     EU users → EU database (GDPR), US users → US database
     Pro: data residency compliance, low latency
     Con: cross-region queries are slow or impossible

  Cross-shard queries (joins across shards) are very expensive — avoid them.
  Design queries so they can be answered from a single shard.

  ─── CONNECTION POOLING (PgBouncer) ───────────────────────────────
  Postgres can handle ~100-200 concurrent connections before CPU overhead hurts.
  Node.js apps spawn many short-lived connections → connection churn.

  PgBouncer sits between the app and Postgres:
    App → PgBouncer (1000 connections OK) → Postgres (20-50 actual connections)

  Modes:
    - Session pooling: one Postgres connection per client session (least efficient)
    - Transaction pooling: connection assigned per transaction (recommended for stateless apps)
    - Statement pooling: connection assigned per statement (breaks multi-statement transactions)

  Prisma connection pool: Prisma has a built-in pool (DATA_PROXY / Accelerate for serverless).
  For serverless (Lambda/Vercel), use PgBouncer or Prisma Accelerate — serverless spawns
  a new connection on every invocation, which overwhelms Postgres.

  ─── OLTP vs OLAP ─────────────────────────────────────────────────
  OLTP (Online Transaction Processing):
    - Many small, fast reads/writes (individual orders, user lookups)
    - Normalized schema (3NF) — minimal redundancy
    - Row-oriented storage (Postgres default)
    - Optimized for: INSERT/UPDATE/SELECT on small row sets

  OLAP (Online Analytical Processing):
    - Few large, slow analytical queries (monthly revenue, cohort analysis)
    - Denormalized star schema (fact table + dimension tables)
    - Columnar storage (Redshift, BigQuery, ClickHouse, DuckDB)
    - Optimized for: full table scans, aggregations, GROUP BY

  Star schema:
    fact_sales(sale_id, date_id, customer_id, product_id, amount_cents)
    dim_date(date_id, year, month, day, quarter, is_weekend)
    dim_customer(customer_id, name, country, segment)
    dim_product(product_id, name, category, brand)

  For most startups: run analytics queries on a read replica (Postgres can handle moderate analytics).
  When that hurts write performance: replicate to a dedicated analytics DB (BigQuery, ClickHouse).
*/

interface ScalingStrategy {
  name: string;
  complexity: "low" | "medium" | "high";
  whenToUse: string;
}

const scalingStrategies: ScalingStrategy[] = [
  { name: "Vertical scaling", complexity: "low", whenToUse: "First line of defense; fastest ROI" },
  { name: "Query optimization + indexes", complexity: "low", whenToUse: "Before any hardware spend" },
  { name: "Read replicas", complexity: "medium", whenToUse: "Read-heavy workload, > 1k reads/sec" },
  { name: "Connection pooling (PgBouncer)", complexity: "medium", whenToUse: "High concurrency, serverless functions" },
  { name: "Caching layer (Redis)", complexity: "medium", whenToUse: "Repeated identical reads, hot data sets" },
  { name: "Sharding", complexity: "high", whenToUse: "Write throughput exceeds single primary capacity" },
  { name: "Separate OLAP DB", complexity: "high", whenToUse: "Analytics queries hurting OLTP performance" },
];

console.log("Scaling strategies (try in order):");
scalingStrategies.forEach((s, i) => {
  console.log(`  ${i + 1}. [${s.complexity.toUpperCase().padEnd(6)}] ${s.name} — ${s.whenToUse}`);
});

// ───────────────────────────────────────────────────────────────
// 8. ANTI-PATTERNS TO AVOID
// ───────────────────────────────────────────────────────────────

console.log("\n=== 8. Anti-patterns ===");

/*
  ─── EAV (Entity-Attribute-Value) ────────────────────────────────
  A table with three columns: entity_id, attribute_name, attribute_value.
  Used to store arbitrary key-value pairs without schema changes.

  entity_attributes(entity_id, attr_name TEXT, attr_value TEXT)
  Rows: (1, 'color', 'red'), (1, 'size', 'large'), (1, 'weight', '2.5')

  Why it's terrible:
    - Can't use SQL types: everything is TEXT, no integers/dates/booleans
    - Can't enforce NOT NULL per attribute
    - No FK constraints on values
    - Queries require self-joins or pivots to read multiple attributes: ugly, slow
    - No way to list all valid attribute names at the DB level

  Alternatives:
    - Proper columns if attributes are known (they almost always are)
    - JSONB column for truly dynamic, unstructured data
    - Polymorphism via table inheritance

  ─── COMMA-SEPARATED VALUES IN A COLUMN ──────────────────────────
  tags VARCHAR(255) = "javascript,react,node"

  Problems:
    - Violates 1NF (not atomic)
    - Can't query: WHERE tags CONTAINS 'react' requires LIKE '%react%' → full table scan
    - Can't enforce FK: what if a tag doesn't exist?
    - Sorting, counting, joining — all terrible

  Fix: separate tags table + junction table (as shown in Section 1).

  ─── JSON EVERYWHERE ─────────────────────────────────────────────
  Using JSONB for data that has a predictable, stable schema.

  Bad: user(id, data JSONB)   -- stores name, email, role, etc. all in JSON
  Good: user(id, name TEXT, email TEXT, role TEXT)

  JSONB IS appropriate for:
    - Truly dynamic/sparse attributes that vary per row
    - Metadata that you don't need to query on
    - Capturing external API responses verbatim
    - Schema-less configuration data

  JSONB IS NOT appropriate for:
    - Replacing proper columns for known fields (can't index efficiently)
    - Data you need to JOIN on
    - Data with FK relationships

  ─── NOT USING TRANSACTIONS ──────────────────────────────────────
  If you do two writes that must be atomic, wrap them in a transaction.

  Bad:
    await db.update('accounts', { balance: newBalance }, where: { id: fromId })
    // crash here → money disappeared
    await db.update('accounts', { balance: newBalance }, where: { id: toId })

  Good:
    await db.transaction(async (trx) => {
      await trx.update('accounts', { balance: senderBalance }, where: { id: fromId })
      await trx.update('accounts', { balance: receiverBalance }, where: { id: toId })
    })

  ─── MISSING INDEXES ON FK COLUMNS ───────────────────────────────
  Postgres does NOT automatically create indexes for FK constraints.
  Every ON DELETE CASCADE or ON DELETE RESTRICT requires a sequential scan
  of the child table unless you add an index.

  Always run after adding FKs:
    CREATE INDEX ON order_items(order_id);
    CREATE INDEX ON order_items(product_id);

  Find missing FK indexes:
    SELECT c.conrelid::regclass AS table, a.attname AS column
    FROM pg_constraint c
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
    WHERE c.contype = 'f'
    AND NOT EXISTS (
      SELECT 1 FROM pg_index i
      WHERE i.indrelid = c.conrelid AND a.attnum = ANY(i.indkey)
    );

  ─── SELECT * IN APPLICATION CODE ────────────────────────────────
  SELECT * fetches all columns even if you only need 2.
  Problems:
    - Wastes network bandwidth and memory
    - Breaks covering index scans (Postgres has to hit the heap)
    - Schema changes add new columns that silently appear in your objects
    - Prevents the query planner from using the most efficient plan

  Always select only the columns you need:
    SELECT id, email, created_at FROM users WHERE id = $1;
*/

const antiPatterns: Array<{ name: string; shortFix: string }> = [
  { name: "EAV table", shortFix: "Use proper typed columns or JSONB for truly dynamic data" },
  { name: "Comma-separated values", shortFix: "Normalize into a separate table with one value per row" },
  { name: "JSON for structured data", shortFix: "Use typed columns; reserve JSONB for truly dynamic attributes" },
  { name: "No transactions for multi-write", shortFix: "Wrap related writes in BEGIN/COMMIT or ORM transaction helper" },
  { name: "Unindexed FK columns", shortFix: "CREATE INDEX ON child_table(fk_column) after every FK" },
  { name: "SELECT * in application code", shortFix: "Always name specific columns in SELECT" },
  { name: "Random UUID v4 PK on large table", shortFix: "Use UUID v7 or BIGSERIAL for sequential B-tree inserts" },
];

antiPatterns.forEach((ap, i) => {
  console.log(`  ${i + 1}. AVOID: ${ap.name}\n     FIX:   ${ap.shortFix}`);
});

// ───────────────────────────────────────────────────────────────
// PRACTICE
// ───────────────────────────────────────────────────────────────

console.log("\n=== Practice Q&A ===");

const practiceQA: Array<{ q: string; a: string }> = [
  {
    q: "Your `products` table has `tag1, tag2, tag3` columns. What normal form does this violate and how do you fix it?",
    a: `Violates 1NF (repeating groups — tag1/tag2/tag3 are the same concept repeated as separate columns).
       Fix: create a product_tags(product_id FK, tag TEXT) table.
       One row per tag. Querying: SELECT * FROM product_tags WHERE tag = 'electronics'.
       This also lets you query, count, and FK-validate tags properly.`,
  },
  {
    q: "Why do random UUID primary keys hurt performance on large tables?",
    a: `Postgres B-tree indexes store data in sorted order. Random UUID v4 values have no ordering.
       Each INSERT lands at a random position in the B-tree, causing:
         - Page splits (the page must be reorganized to make room)
         - Cache misses (random pages constantly evicted from buffer cache)
         - Write amplification (much more I/O per row than sequential inserts)
       At ~10M rows this becomes measurable; at ~100M rows it's a serious bottleneck.
       Fix: use UUID v7 (time-ordered UUID) or BIGSERIAL for sequential inserts.`,
  },
  {
    q: "You need to add a NOT NULL column to a 100M-row table in production with zero downtime. What's the process?",
    a: `Step 1 — Add as nullable (instant metadata-only change):
         ALTER TABLE orders ADD COLUMN is_priority BOOLEAN NULL;
       Step 2 — Backfill in batches (avoids a single massive UPDATE lock):
         UPDATE orders SET is_priority = FALSE
         WHERE id BETWEEN $start AND $end AND is_priority IS NULL;
         -- Run in small batches (e.g. 10k rows) with a short sleep between batches
       Step 3 — Once all rows have a value, add the NOT NULL constraint:
         ALTER TABLE orders ALTER COLUMN is_priority SET DEFAULT FALSE;
         ALTER TABLE orders ALTER COLUMN is_priority SET NOT NULL;
       Postgres 11+ can do this atomically for constant defaults without a table rewrite,
       but batching the backfill is still safer under production load.`,
  },
  {
    q: "When would you intentionally denormalize?",
    a: `Only after you measure a bottleneck. Common legitimate cases:
         1. Reporting tables: pre-joining 6 tables for a dashboard query that runs every page load
         2. Analytics / star schema: fact + dimension tables for aggregation-heavy OLAP queries
         3. Caching derived values: storing order_total to avoid summing order_items on every read
         4. Search indexes: flattening nested data into an Elasticsearch document
       The rule: normalize first, denormalize when EXPLAIN ANALYZE shows the join cost is a bottleneck,
       not because you think it might be slow.`,
  },
  {
    q: "What's the outbox pattern and what problem does it solve?",
    a: `Problem: you want to save data to the DB AND publish an event to a message broker (Kafka, RabbitMQ).
       If you do them in sequence, a failure between them causes inconsistency:
         - DB saved, publish failed → consumers miss the event
         - Publish succeeded, DB write failed → ghost events with no corresponding data

       Solution — outbox pattern:
         1. In a SINGLE DATABASE TRANSACTION: write business data + write event to an outbox table
         2. A separate worker polls the outbox table and publishes events to the broker
         3. On publish success, mark the outbox row as published (or delete it)

       Guarantees: atomicity between DB write and event emission (via the transaction).
       Delivery: at-least-once (worker may retry if broker publish fails → make consumers idempotent).
       Postgres: use SELECT FOR UPDATE SKIP LOCKED in the worker to safely support multiple worker instances.`,
  },
];

practiceQA.forEach((item, i) => {
  console.log(`\nQ${i + 1}: ${item.q}`);
  console.log(`A: ${item.a}`);
});

// ───────────────────────────────────────────────────────────────
// DEMO / REFERENCE CARD
// ───────────────────────────────────────────────────────────────

function runDemo(): void {
  console.log("\n");
  console.log("╔══════════════════════════════════════════════════════════════════╗");
  console.log("║           BACKEND 10: DATABASE DESIGN — REFERENCE CARD          ║");
  console.log("╠══════════════════════════════════════════════════════════════════╣");
  console.log("║  NORMALIZATION                                                   ║");
  console.log("║  1NF: atomic values, no repeating groups                        ║");
  console.log("║  2NF: no partial deps on composite PK   (1NF +)                 ║");
  console.log("║  3NF: no transitive deps thru non-key   (2NF +)                 ║");
  console.log("║  Rule: normalize first, denormalize only when measured           ║");
  console.log("╠══════════════════════════════════════════════════════════════════╣");
  console.log("║  PRIMARY KEYS                                                    ║");
  console.log("║  BIGSERIAL   8B  ordered  single-DB  leaks count                ║");
  console.log("║  UUID v4    16B  random   global     B-tree fragmentation risk  ║");
  console.log("║  UUID v7    16B  ordered  global     best for large tables      ║");
  console.log("║  CUID2      24B  ordered  global     URL-safe, app-generated    ║");
  console.log("╠══════════════════════════════════════════════════════════════════╣");
  console.log("║  RELATIONSHIP PATTERNS                                           ║");
  console.log("║  1:1   same table (always present) | separate table (optional)  ║");
  console.log("║  1:N   FK in the many table                                     ║");
  console.log("║  M:N   junction table; explicit when relation has own columns    ║");
  console.log("║  Poly  entity_type + entity_id | separate join tables (strict)  ║");
  console.log("║  Self  parent_id FK → same table; use WITH RECURSIVE to query   ║");
  console.log("╠══════════════════════════════════════════════════════════════════╣");
  console.log("║  SCHEMA PATTERNS                                                 ║");
  console.log("║  Soft delete   deleted_at TIMESTAMP NULL + partial unique index  ║");
  console.log("║  Audit trail   audit_log table (full history) or created_by cols ║");
  console.log("║  Multi-tenant  tenant_id col + Postgres RLS (most common SaaS)  ║");
  console.log("║  Event source  append-only events, replay to derive state        ║");
  console.log("║  Outbox        write event to DB in same txn; worker publishes   ║");
  console.log("╠══════════════════════════════════════════════════════════════════╣");
  console.log("║  INDEXING                                                        ║");
  console.log("║  Always index FK columns (Postgres does NOT do this auto)       ║");
  console.log("║  Composite: equality columns first, range columns last           ║");
  console.log("║  Partial:   WHERE deleted_at IS NULL  (smaller, faster)         ║");
  console.log("║  Expression: lower(email)  for case-insensitive queries          ║");
  console.log("║  Covering:  INCLUDE(col) for index-only scans                   ║");
  console.log("║  Audit:     idx_scan = 0 in pg_stat_user_indexes = unused        ║");
  console.log("╠══════════════════════════════════════════════════════════════════╣");
  console.log("║  SCHEMA EVOLUTION (zero-downtime)                                ║");
  console.log("║  Add nullable col  → safe, instant                              ║");
  console.log("║  Add NOT NULL col  → add nullable → backfill → add constraint   ║");
  console.log("║  Rename col        → expand-contract: add new, dual-write,      ║");
  console.log("║                       migrate reads, backfill, drop old          ║");
  console.log("║  Create index      → CREATE INDEX CONCURRENTLY (no lock)        ║");
  console.log("╠══════════════════════════════════════════════════════════════════╣");
  console.log("║  SCALING ORDER (try cheapest first)                              ║");
  console.log("║  1. Query optimization + indexes                                 ║");
  console.log("║  2. Vertical scaling (bigger server)                             ║");
  console.log("║  3. Read replicas (reads → replica, writes → primary)           ║");
  console.log("║  4. Connection pooling (PgBouncer) for high concurrency          ║");
  console.log("║  5. Redis caching for hot repeated reads                         ║");
  console.log("║  6. Sharding (only after everything else exhausted)              ║");
  console.log("╠══════════════════════════════════════════════════════════════════╣");
  console.log("║  ANTI-PATTERNS                                                   ║");
  console.log("║  EAV tables        → typed columns or JSONB                     ║");
  console.log("║  Comma-sep values  → normalize into rows                        ║");
  console.log("║  JSON for known cols → use proper typed columns                 ║");
  console.log("║  No transactions   → wrap related writes in a transaction        ║");
  console.log("║  Missing FK indexes → CREATE INDEX ON child(fk_col)             ║");
  console.log("║  SELECT *          → name specific columns                      ║");
  console.log("╚══════════════════════════════════════════════════════════════════╝");
}

export default runDemo;
runDemo();
