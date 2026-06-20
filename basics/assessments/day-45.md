# Day 45 Assessment — Database Design · Normalization · Schema Patterns · Performance Trade-offs

**Theme:** You are the data architect for a growing SaaS platform. Engineering is moving fast and cutting corners on schema design. You need to establish patterns before technical debt makes changes painful.

---

### Q1 — Normalization forms ⭐

**Scenario:** A legacy `orders` table stores: `order_id, customer_name, customer_email, product_ids (comma-separated), product_names (comma-separated), shipping_city, shipping_country, country_code`.

**Task:** Identify which normalization rule is violated by each issue in this table and give a concrete example of the violation. Describe 1NF, 2NF, and 3NF.

**Acceptance Criteria:**
- [ ] 1NF violation: `product_ids` is a comma-separated list — not atomic. Fix: each product-order gets its own row in an `order_items` table
- [ ] 2NF violation: assumes a composite key — `customer_name` depends only on `customer_id`, not on the full composite key `(order_id, product_id)`. Fix: move customer fields to a `customers` table
- [ ] 3NF violation: `country_code` is determined by `shipping_country` (transitive dependency through a non-key column). Fix: move `country_code` to a `countries` table keyed by country name or ISO code
- [ ] Defines 1NF: all column values are atomic (indivisible); no repeating groups; each row is unique
- [ ] Defines 2NF: in 1NF AND no partial dependency — every non-key column depends on the ENTIRE primary key (relevant when the key is composite)
- [ ] Defines 3NF: in 2NF AND no transitive dependency — non-key columns depend only on the primary key, not on other non-key columns

---

### Q2 — UUID vs auto-increment ⭐

**Scenario:** The team argues about primary keys. The API exposes resource IDs in URLs (e.g., `/orders/12345`). A security researcher reports they can enumerate all orders by incrementing the ID.

**Task:** Compare UUID and auto-increment integer primary keys. List the advantages of each. State which to use for public-facing IDs and which for internal-only tables.

**Acceptance Criteria:**
- [ ] Auto-increment advantages: sequential (cache-friendly B-Tree inserts), compact (4 or 8 bytes vs 16), human-readable, simple to understand
- [ ] Auto-increment disadvantages: enumerable (security risk in public APIs), cannot be generated client-side without a DB round-trip
- [ ] UUID advantages: globally unique (safe to generate client-side, can merge data from multiple sources), non-enumerable (no sequential guessing)
- [ ] UUID disadvantages: random UUIDs (v4) cause B-Tree fragmentation (random inserts scatter pages); larger index size; not human-readable
- [ ] Recommends UUID v7 or ULID for public-facing IDs: time-ordered (avoids fragmentation), non-enumerable, globally unique
- [ ] Recommends auto-increment for internal join tables and high-insert tables where fragmentation would be costly
- [ ] Notes that exposing internal integer IDs in public URLs is an OWASP security issue (IDOR — Insecure Direct Object Reference)

---

### Q3 — Soft delete pattern ⭐

**Scenario:** Users complain that when they delete a project, all associated invoices lose their project reference. The team hard-deletes rows. Referential integrity is violated.

**Task:** Explain the soft delete pattern using `deleted_at`. List two benefits over hard delete. List two downsides. Show the Prisma schema field and the query filter.

**Acceptance Criteria:**
- [ ] Defines soft delete: instead of `DELETE`, set `deleted_at = NOW()` on the row; the row remains in the database
- [ ] Benefit 1: referential integrity is preserved — related records still have a valid foreign key
- [ ] Benefit 2: audit trail and recovery — deleted records can be undeleted; you know who deleted what and when
- [ ] Downside 1: queries become more complex — every query must add `WHERE deleted_at IS NULL` to exclude soft-deleted rows
- [ ] Downside 2: indexes must be designed to filter deleted rows (partial indexes) or performance degrades as the table fills with "deleted" rows
- [ ] Shows Prisma schema: `deletedAt DateTime? @map("deleted_at")`
- [ ] Shows query filter: `prisma.project.findMany({ where: { deletedAt: null } })`

---

### Q4 — Audit log table ⭐

**Scenario:** A compliance requirement states that all changes to the `users` table must be logged with who made the change, when, and what the old and new values were.

**Task:** Design an `audit_log` table schema. Explain why it must be INSERT-only. Compare PostgreSQL triggers vs application-level logging for populating it.

**Acceptance Criteria:**
- [ ] Table schema includes: `id`, `table_name`, `record_id`, `action` (INSERT/UPDATE/DELETE), `changed_by` (user ID), `changed_at` (timestamp), `old_value` (JSONB nullable), `new_value` (JSONB nullable)
- [ ] States INSERT-only: audit logs must never be updated or deleted — modifying an audit trail defeats its purpose (legal, compliance, tamper-evidence)
- [ ] Uses an append-only strategy: grant only INSERT permission to the application role; revoke UPDATE/DELETE on `audit_log`
- [ ] PostgreSQL trigger advantage: fires automatically on any data change, even from migrations or direct DB tools; cannot be bypassed by application code
- [ ] PostgreSQL trigger disadvantage: harder to test, version-control, and deploy; business logic in the DB layer
- [ ] Application-level advantage: easier to test, deploy, and include contextual data (e.g., which user made the API call)
- [ ] Application-level disadvantage: can be bypassed if someone modifies the DB directly; developer must remember to call the log function

---

### Q5 — M:N relationships ⭐⭐

**Scenario:** Posts have tags. You start with Prisma's implicit M:N but later realize you need to store `assignedAt` and `assignedBy` on each post-tag relationship.

**Task:** Show the Prisma schema for both implicit and explicit M:N. Explain the difference. State when explicit is required. Show how to query posts with their tags in each approach.

**Acceptance Criteria:**
- [ ] Implicit: `Post` has `tags Tag[]` and `Tag` has `posts Post[]` — Prisma manages a hidden `_PostToTag` join table
- [ ] Explicit: a `PostTag` model with `postId`, `tagId`, `assignedAt DateTime`, `assignedBy String`, and `@@id([postId, tagId])`
- [ ] Explicit requires explicit `@relation` on both `Post` and `Tag` pointing to `PostTag`
- [ ] States implicit is appropriate when no extra data is needed on the relationship
- [ ] States explicit is required when the join table needs additional fields (metadata about the relationship)
- [ ] Shows implicit query: `prisma.post.findMany({ include: { tags: true } })`
- [ ] Shows explicit query: `prisma.post.findMany({ include: { postTags: { include: { tag: true } } } })`

---

### Q6 — Polymorphic associations ⭐⭐

**Scenario:** A `comments` table must support comments on both `posts` and `videos`. The team argues about three approaches: nullable foreign keys, single-table inheritance, and separate tables.

**Task:** Describe all three approaches. List the trade-offs of each. Recommend which to use and in what scenario.

**Acceptance Criteria:**
- [ ] Nullable FK approach: `comment_post_id INT NULL, comment_video_id INT NULL` — one FK per commentable type; a constraint ensures exactly one is set. Simple but adds a column per new type; can't enforce "exactly one non-null" easily in SQL.
- [ ] Single-table inheritance: `commentable_type VARCHAR` (e.g., 'Post', 'Video') + `commentable_id INT` — polymorphic without a FK constraint; no referential integrity (the DB can't enforce that `commentable_id` matches a real row in the right table)
- [ ] Separate tables: `post_comments` and `video_comments` each with their own FK — full referential integrity, clean schema, but no single "all comments" query without UNION
- [ ] Trade-off summary: nullable FKs are type-safe but don't scale to many types; polymorphic is flexible but sacrifices referential integrity; separate tables are cleanest but require schema changes for new types
- [ ] Recommends separate tables when comment types are few and stable; polymorphic when types are dynamic or very numerous (e.g., plugin system)
- [ ] Notes that PostgreSQL table inheritance (native) is another option rarely used in practice

---

### Q7 — Storing money ⭐⭐

**Scenario:** A financial feature stores prices as `FLOAT` in the database. A bug report shows that a $10.10 item is being charged as $10.099999999999999 to some customers.

**Task:** Explain why FLOAT is wrong for money storage. Show the JavaScript floating-point error that causes this. Describe two correct approaches: `DECIMAL(19,4)` and integer cents.

**Acceptance Criteria:**
- [ ] Explains that IEEE 754 floating-point cannot represent all decimal fractions exactly in binary — some values have infinite binary expansions
- [ ] Shows the JavaScript error: `0.1 + 0.2 === 0.30000000000000004` (not 0.3)
- [ ] Shows money-specific error: `1010 * 0.1` may not equal `101.0` exactly in floating-point arithmetic
- [ ] Correct approach 1: `DECIMAL(19,4)` (or `NUMERIC(19,4)`) — exact decimal arithmetic; PostgreSQL stores these without floating-point error
- [ ] Correct approach 2: store as integer cents — $10.10 is stored as `1010`; divide by 100 only in the display layer; all arithmetic is integer arithmetic (exact)
- [ ] States the rule: NEVER use FLOAT or DOUBLE for monetary values; use DECIMAL/NUMERIC or integer cents
- [ ] Notes that the `decimal.js` or `big.js` library is needed in JavaScript if performing money calculations in application code

---

### Q8 — Timestamps everywhere ⭐⭐

**Scenario:** A team stores `created_at` as a local timezone timestamp. Users in different timezones see wrong creation times. A developer accidentally overwrites `created_at` during an update.

**Task:** Explain the role of `created_at`, `updated_at`, and `deleted_at`. Explain why UTC/TIMESTAMPTZ is required. Show the Prisma schema for all three. Explain where timezone conversion should happen.

**Acceptance Criteria:**
- [ ] `created_at`: set once on INSERT, never changed — records when the row was first created
- [ ] `updated_at`: auto-updated on every UPDATE — records the last modification time
- [ ] `deleted_at`: null until soft-deleted — records when the row was logically removed
- [ ] Explains TIMESTAMPTZ: stores the timestamp with UTC offset; PostgreSQL normalizes to UTC internally; reads back in the session timezone. Plain TIMESTAMP has no timezone info — ambiguous across DST changes
- [ ] Prisma schema: `createdAt DateTime @default(now()) @map("created_at")`, `updatedAt DateTime @updatedAt @map("updated_at")`, `deletedAt DateTime? @map("deleted_at")`
- [ ] States that timezone conversion belongs in the application or frontend layer — always store and compare in UTC
- [ ] Notes Prisma `@updatedAt` automatically sets the field on every update without any application code

---

### Q9 — Enumerated types ⭐⭐

**Scenario:** The `posts` table has a `status` column. A developer uses a PostgreSQL enum type for `post_status`. Three months later, adding a new status value requires a table migration. Another team uses a plain string with no constraint — typos create phantom statuses.

**Task:** Compare DB enum, string with check constraint, and lookup table for representing the post status. Recommend which approach for: post status (small, changing), country code (large, stable), user role (small, code-driven).

**Acceptance Criteria:**
- [ ] DB enum: type-safe at DB level, enforced by PostgreSQL, but `ALTER TYPE ADD VALUE` cannot be run inside a transaction (requires careful migration)
- [ ] String with check constraint: `CHECK (status IN ('draft', 'published', 'archived'))` — flexible, readable, constraint can be updated in a migration. Risk: typos in application code pass the constraint only if they match exactly.
- [ ] Lookup table: a `post_statuses` table with a foreign key on `posts.status_id` — fully extensible, can store display names and metadata, requires a JOIN to read the label
- [ ] Post status → string with check constraint (small set, may add values, no JOIN needed)
- [ ] Country code → lookup table (large stable set, need ISO codes, names, calling codes)
- [ ] User role → DB enum or string with check constraint (small set, driven by code deploys, not data changes)
- [ ] Notes that Prisma has native enum support (`enum PostStatus { ... }`) which generates a PostgreSQL enum type

---

### Q10 — Optimistic vs pessimistic locking ⭐⭐

**Scenario:** Two users edit the same document concurrently. User A reads version 1, User B reads version 1. User A saves — it becomes version 2. User B saves version 1 changes — it silently overwrites User A's work (lost update).

**Task:** Define optimistic and pessimistic locking. Show how optimistic locking with a version column prevents lost updates. Show the SQL for pessimistic locking with `SELECT FOR UPDATE`. State when each is appropriate.

**Acceptance Criteria:**
- [ ] Optimistic locking: no lock is held during the read; on write, check that the version has not changed: `UPDATE documents SET content = $1, version = version + 1 WHERE id = $2 AND version = $expected_version`; if 0 rows updated, the update was rejected (conflict)
- [ ] Pessimistic locking: lock the row at read time with `SELECT ... FOR UPDATE`; other transactions block until the lock is released
- [ ] Shows optimistic locking SQL with version check and confirms the 0-rows-affected detection
- [ ] Shows pessimistic locking SQL: `BEGIN; SELECT * FROM documents WHERE id = 42 FOR UPDATE; UPDATE ...; COMMIT;`
- [ ] Optimistic is appropriate when contention is low: most reads don't conflict, locking would be wasteful, user-facing edit flows (retry is acceptable)
- [ ] Pessimistic is appropriate when contention is high or correctness is critical: financial transfers, inventory reservation (must not allow any race)
- [ ] Notes optimistic locking requires the application to handle the conflict (show "document was changed, please review") while pessimistic blocks the user

---

### Q11 — Denormalization decision ⭐⭐

**Scenario:** An orders dashboard shows the ordering user's name on every row. A teammate wants to store `user_name` directly on the orders table to avoid a JOIN. Another teammate worries about what happens when a user changes their display name.

**Task:** List three options for displaying user name on orders. For each, explain what happens when the user changes their name. Recommend an approach with justification.

**Acceptance Criteria:**
- [ ] Option 1 — JOIN every time: always fetch `users.name` via JOIN. When user changes name, all orders immediately show the new name. Downside: JOIN cost on every query.
- [ ] Option 2 — store `user_name` on orders (denormalize): fast reads, no JOIN. When user changes name, old orders still show the old name. This may be intentional (orders capture the name at time of purchase) or a bug.
- [ ] Option 3 — materialized view: pre-compute orders with user names, refresh periodically. When user changes name, the view is stale until next refresh.
- [ ] Recommends Option 1 (JOIN) for most cases: name changes are rare, JOIN on an indexed `user_id` is fast, data is always correct
- [ ] Recommends Option 2 only if the business explicitly requires "snapshot at time of order" semantics (e.g., legal documents, invoices)
- [ ] Notes that denormalization is not inherently wrong — it requires a deliberate decision about consistency semantics, not a shortcut

---

### Q12 — Event sourcing vs state storage ⭐⭐⭐

**Scenario:** The compliance team wants to know the exact state of every user account at any point in time. A traditional `users` table only shows the current state.

**Task:** Define traditional state storage and event sourcing. List two advantages and one disadvantage of each. State when event sourcing is worth the complexity.

**Acceptance Criteria:**
- [ ] Traditional state storage: stores only the current state; each UPDATE overwrites the previous value; history is lost unless manually logged
- [ ] Event sourcing: stores an immutable log of events (`email_changed`, `role_updated`); current state is reconstructed by replaying events
- [ ] State storage advantage 1: simple reads — `SELECT * FROM users WHERE id = 42` returns current state directly
- [ ] State storage advantage 2: simple writes — a single `UPDATE` changes state
- [ ] State storage disadvantage: no built-in history; point-in-time queries require a separate audit log
- [ ] Event sourcing advantage 1: complete audit trail — replay events to reconstruct state at any past point in time
- [ ] Event sourcing advantage 2: temporal queries are natural — "what was this user's email on Jan 1?" is a query over the event log
- [ ] Event sourcing disadvantage: reads are complex — must replay events (or maintain a projection/snapshot table for performance)
- [ ] States event sourcing is worth it for: financial systems, compliance-heavy domains, collaborative editing, systems where "undo" is required

---

### Q13 — Schema migration for zero downtime ⭐⭐⭐

**Scenario:** A `users` table has 50M rows. The team needs to add `preferences JSONB NOT NULL DEFAULT '{}'`. The DBA warns that `ALTER TABLE ADD COLUMN NOT NULL DEFAULT` locks the table for several minutes.

**Task:** Explain why this migration causes a long lock. Describe the four-step zero-downtime approach. Explain why each step is independently safe.

**Acceptance Criteria:**
- [ ] Explains the lock: PostgreSQL must rewrite every row on disk to include the new column with its default value — for 50M rows this takes minutes and holds an `ACCESS EXCLUSIVE` lock blocking all reads and writes
- [ ] Step 1: `ALTER TABLE users ADD COLUMN preferences JSONB` (nullable, no default) — instant metadata change, no row rewrite, no lock
- [ ] Step 2: backfill in batches: `UPDATE users SET preferences = '{}' WHERE id BETWEEN X AND Y` — updates small ranges to avoid long lock times and replication lag
- [ ] Step 3: `ALTER TABLE users ALTER COLUMN preferences SET NOT NULL` — fast in modern PostgreSQL (13+) because it verifies the column has no NULLs without rewriting rows; add only after backfill is 100% complete
- [ ] Step 4: `ALTER TABLE users ALTER COLUMN preferences SET DEFAULT '{}'` — optional, for future inserts without explicit value
- [ ] Notes that PostgreSQL 11+ supports `ADD COLUMN ... DEFAULT` without a full table rewrite for non-volatile defaults (e.g., static values) — but NULL-to-NOT NULL still requires the batch approach
- [ ] Each step is independently safe: no step removes data the currently-running application depends on

---

### Q14 — Multi-tenancy schema patterns ⭐⭐⭐

**Scenario:** A SaaS product needs to serve 10,000 tenants. The founding team chose a single shared database. Enterprise customers are now demanding data isolation. The team is evaluating three patterns.

**Task:** Compare row-level multi-tenancy, schema-level multi-tenancy, and database-level multi-tenancy across: isolation, cost, query complexity, and migration complexity. Recommend which for a typical B2B SaaS.

**Acceptance Criteria:**
- [ ] Row-level: `tenant_id` on every table + Row-Level Security (RLS) in PostgreSQL. Isolation: logical (misconfigured RLS leaks data). Cost: lowest (one DB for all tenants). Query complexity: must always filter by `tenant_id`. Migration: one migration changes all tenants simultaneously.
- [ ] Schema-level: separate PostgreSQL schema per tenant (e.g., `tenant_42.orders`). Isolation: stronger (different namespace, can grant schema-level permissions). Cost: moderate. Query complexity: set `search_path` per tenant. Migration: must run migration on each schema (tooling required).
- [ ] Database-level: separate PostgreSQL database (or cluster) per tenant. Isolation: strongest (full OS-level isolation). Cost: highest (each DB needs its own connection pool). Query complexity: each tenant is a separate connection. Migration: must coordinate across all databases.
- [ ] Recommends row-level for most B2B SaaS: lowest operational cost, single codebase, sufficient isolation when RLS is correctly configured
- [ ] Recommends schema-level for enterprise customers who require namespace isolation without the cost of dedicated infrastructure
- [ ] Recommends database-level only for highly regulated industries (healthcare, finance) or customers contractually requiring dedicated infrastructure

---

### Q15 — Data archival strategy ⭐⭐⭐

**Scenario:** An `events` table has 100M rows. 95% are over 1 year old and are queried less than once a week. The table is slowing down even indexed queries because the indexes are huge.

**Task:** Design a data archival strategy. Describe three options: partition + detach, cold storage (S3 + Athena), and a separate archive database. Choose one and describe the implementation pipeline with zero-downtime migration.

**Acceptance Criteria:**
- [ ] Option 1 — partition + detach: partition `events` by month; when a partition is old enough, `ALTER TABLE DETACH PARTITION events_2024_01`; the detached partition still exists but is no longer part of the main table; queries against `events` skip it
- [ ] Option 2 — cold storage: export old rows to S3 as Parquet, query with Athena (serverless SQL on S3); delete from PostgreSQL. Very cheap storage; high query latency; good for compliance archives rarely queried
- [ ] Option 3 — separate archive DB: export old rows to a separate read-only PostgreSQL instance; delete from the main DB; application routes old queries to archive DB. Strongest isolation but requires dual-DB query routing.
- [ ] Recommends partition + detach for this scenario: zero application code changes, data stays in PostgreSQL format, detached partitions can later be moved to tablespaces on cheaper storage
- [ ] Describes the migration pipeline: (1) add `created_at` range partitioning to `events` (online with `pg_partman` or manual), (2) backfill existing rows into partitions in batches, (3) switch new inserts to partitioned table, (4) detach partitions older than 1 year on a schedule
- [ ] Notes that detached partitions can be reattached if a query against old data is needed, providing recoverable archival
- [ ] States zero-downtime requires the backfill to run without locking: use batched updates during off-peak hours, not a single `INSERT ... SELECT`
