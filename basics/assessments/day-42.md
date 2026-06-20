# Day 42 Assessment — Prisma ORM · Schema Design · Relations · Migrations

**Theme:** You are migrating a legacy raw-SQL Express API to use Prisma. The team has SQL expertise but is new to ORMs. You need to teach them Prisma patterns and avoid the common ORM-vs-SQL traps.

---

### Q1 — Prisma schema basics ⭐

**Scenario:** A teammate writes a model with a field named `userName String` but wants the actual database column to be `user_name`. They are not sure what `@id`, `@default`, `@unique`, or `@@map` do.

**Task:** Explain the Prisma schema attributes: `@id`, `@default`, `@unique`, `@map`, and `@@map`. Write a `User` model that uses snake_case column names in the DB but camelCase TypeScript field names. Explain why this convention matters.

**Acceptance Criteria:**
- [ ] Defines `@id`: marks the primary key field
- [ ] Defines `@default(...)`: sets a default value (e.g., `@default(cuid())`, `@default(now())`)
- [ ] Defines `@unique`: adds a unique constraint to the column
- [ ] Defines `@map("column_name")`: maps a camelCase TypeScript field to a snake_case DB column
- [ ] Defines `@@map("table_name")`: maps the model name to a different DB table name
- [ ] Writes a model with `firstName String @map("first_name")` and `@@map("users")`
- [ ] Explains the convention: TypeScript/JavaScript uses camelCase by community standard; PostgreSQL prefers snake_case

---

### Q2 — findUnique vs findFirst ⭐

**Scenario:** You want to find a user by email. A colleague uses `findFirst` everywhere because "it works." Another uses `findUnique` on a non-unique field and gets a runtime error.

**Task:** Explain when `findUnique` vs `findFirst` should be used. State what each returns when no record is found. State what error `findUnique` throws if used on a non-unique field.

**Acceptance Criteria:**
- [ ] States `findUnique` can only query by `@id` or `@unique` fields; throws a compile-time/runtime error otherwise
- [ ] States `findFirst` can filter by any field combination; returns the first matching row
- [ ] Both return `null` (not an error) when no record is found
- [ ] States `findUniqueOrThrow` and `findFirstOrThrow` throw `PrismaClientKnownRequestError` (P2025) if not found
- [ ] Recommends `findUnique` when querying by a unique key (clearer intent, more predictable)
- [ ] Recommends `findFirst` when querying by non-unique criteria or applying complex filters

---

### Q3 — include vs select ⭐

**Scenario:** An API endpoint returns a list of posts. Each post needs only `id`, `title`, and the author's `name`. A colleague writes `include: { author: true }`, which returns the entire author object including `passwordHash`.

**Task:** Explain the difference between `include` and `select` in Prisma. Rewrite the query using `select` to return only the needed fields. Explain why `include` is a performance risk.

**Acceptance Criteria:**
- [ ] Explains `include`: fetches the entire related model (all columns); equivalent to `SELECT *` on the relation
- [ ] Explains `select`: specifies exactly which fields to return, including nested relation fields
- [ ] Writes a query with `select: { id: true, title: true, author: { select: { name: true } } }`
- [ ] States that `include` transfers unused data over the network and can expose sensitive fields
- [ ] Notes that `select` and `include` cannot be used at the same level simultaneously
- [ ] Recommends `select` by default; use `include` only when all fields of the relation are genuinely needed

---

### Q4 — Migrations workflow ⭐

**Scenario:** A developer runs `prisma migrate dev` on the production database and accidentally drops a column. The team wants to understand the correct workflow.

**Task:** Explain `prisma migrate dev` vs `prisma migrate deploy`. Explain why `migrate dev` must never run in production. Explain what `prisma generate` does and when to run it.

**Acceptance Criteria:**
- [ ] Explains `migrate dev`: creates a new migration file from schema diff, applies it, re-generates the Prisma Client — for local development only
- [ ] Explains `migrate deploy`: applies pending migration files without creating new ones — safe for production CI/CD pipelines
- [ ] States that `migrate dev` can reset the database (runs `migrate reset`) when there are drift issues, which destroys data
- [ ] Explains `prisma generate`: regenerates the Prisma Client TypeScript types from `schema.prisma` — must run after every schema change
- [ ] Notes that `generate` does not touch the database; it only updates the `node_modules/.prisma/client`
- [ ] Describes the correct production deploy flow: `prisma migrate deploy` → `prisma generate` (usually in a Dockerfile/CI step)

---

### Q5 — Relations: 1:1, 1:N, M:N ⭐⭐

**Scenario:** You need to model: one user has one profile, one user has many posts, and posts can have many tags (with the junction needing a `created_at` field).

**Task:** Implement 1:1 (User → Profile), 1:N (User → Posts), and M:N (Posts ↔ Tags). Show both implicit and explicit junction tables for M:N. Explain when an explicit junction is required.

**Acceptance Criteria:**
- [ ] Writes a 1:1 relation with `@relation` on both sides and `@unique` on the foreign key field
- [ ] Writes a 1:N relation with the foreign key on the "many" side (Post has `authorId`)
- [ ] Shows implicit M:N: two models each have the other in a list field with no junction model — Prisma manages the join table
- [ ] Shows explicit M:N: defines a `PostTag` model with `postId`, `tagId`, and `createdAt` fields
- [ ] Explains when explicit is required: when you need to store extra data on the relationship (e.g., `createdAt`, `assignedBy`, `order`)
- [ ] Correctly uses `@@id([postId, tagId])` as the composite primary key on the junction model

---

### Q6 — N+1 with Prisma ⭐⭐

**Scenario:** An endpoint fetches posts and for each post calls `prisma.user.findUnique({ where: { id: post.authorId } })` inside a loop. With 50 posts this fires 51 queries.

**Task:** Show the N+1 pattern in Prisma code. Fix it with `include`. Explain why Prisma's `include` does NOT generate a JOIN — describe what queries Prisma actually runs.

**Acceptance Criteria:**
- [ ] Shows the N+1 code: `findMany` for posts + `findUnique` for author inside a `.map()`
- [ ] Fixes it with `prisma.post.findMany({ include: { author: true } })`
- [ ] Correctly explains that Prisma does NOT use a SQL JOIN for `include` — it runs a second `SELECT WHERE id IN (...)` query
- [ ] States this is still a 2-query solution (not N+1), which is far better than N+1
- [ ] Notes that this means `include` does not benefit from a DB-level JOIN index the same way raw SQL would
- [ ] Mentions `prisma.$queryRaw` as an escape hatch when a true JOIN with custom logic is needed

---

### Q7 — Transactions in Prisma ⭐⭐

**Scenario:** You need to: (a) create an order and decrement stock in a single atomic operation, and (b) implement a multi-step checkout that reads the current balance before writing.

**Task:** Explain `prisma.$transaction([...])` (sequential) vs `prisma.$transaction(async (tx) => { ... })` (interactive). Write an example of each. State when to use each.

**Acceptance Criteria:**
- [ ] Explains sequential transaction: takes an array of Prisma operations; all run in one transaction; cannot read intermediate results
- [ ] Explains interactive transaction: takes a callback with a `tx` client; allows reading results between writes within the same transaction
- [ ] Writes a sequential example: `prisma.$transaction([prisma.order.create(...), prisma.stock.update(...)])`
- [ ] Writes an interactive example that reads a balance, checks it, then conditionally writes
- [ ] States sequential is preferred for simple independent operations (simpler, no long-held connections)
- [ ] States interactive is needed when you must read intermediate state to decide the next write

---

### Q8 — Upsert ⭐⭐

**Scenario:** Your app syncs users from an OAuth provider (Google). On login, if the user exists update their `lastLoginAt`; if not, create them. A colleague writes a `findUnique` + conditional `create`/`update` — this has a race condition.

**Task:** Explain what `prisma.user.upsert({ where, update, create })` does. Explain why it is atomic. Write the upsert for the OAuth sync use case.

**Acceptance Criteria:**
- [ ] Explains upsert: atomically performs an INSERT with ON CONFLICT UPDATE — no separate read-then-write round trip
- [ ] States it is atomic: no race condition between checking existence and writing
- [ ] Writes `upsert({ where: { email }, update: { lastLoginAt: new Date() }, create: { email, name, lastLoginAt: new Date() } })`
- [ ] Explains the `where` clause must reference a `@unique` or `@id` field for the conflict detection to work
- [ ] Notes the difference from manual findUnique + create: the manual approach can fail with a unique constraint violation under concurrent requests
- [ ] Mentions real-world use: syncing from external providers, idempotent API handlers

---

### Q9 — $queryRaw safety ⭐⭐

**Scenario:** A developer writes: `prisma.$queryRawUnsafe('SELECT * FROM users WHERE id = ' + userId)` and another writes `prisma.$queryRaw\`SELECT * FROM users WHERE id = ${userId}\``.

**Task:** Explain why the tagged template literal form is safe and the string concatenation form is a SQL injection risk. Show an example attack payload. Explain when `$queryRaw` is appropriate.

**Acceptance Criteria:**
- [ ] Explains that the tagged template form automatically parameterizes interpolated values — they become `$1`, `$2` placeholders in the prepared statement
- [ ] Explains that `$queryRawUnsafe` takes a raw string — any interpolation is concatenated directly into the SQL string
- [ ] Provides an attack payload: `userId = "1 OR 1=1"` or `"1; DROP TABLE users; --"`
- [ ] States that parameterized queries prevent injection because the value is always treated as data, never as SQL syntax
- [ ] Lists appropriate uses for `$queryRaw`: window functions, `PARTITION BY`, `GENERATE_SERIES`, full-text search, CTEs not supported by Prisma client
- [ ] Notes that `$queryRaw` returns `unknown[]` — always validate/type-assert the result

---

### Q10 — Soft delete middleware ⭐⭐

**Scenario:** The business requires that no record is ever hard-deleted from the database. Deletes must set `deleted_at` to the current timestamp. All queries must automatically exclude soft-deleted rows.

**Task:** Implement a Prisma middleware that: (1) intercepts all `delete` operations and converts them to `update({ deleted_at: new Date() })`, and (2) intercepts all `findMany` operations to inject `WHERE deleted_at IS NULL`.

**Acceptance Criteria:**
- [ ] Uses `prisma.$use(async (params, next) => { ... })` to register the middleware
- [ ] Intercepts `params.action === 'delete'` and rewrites to `params.action = 'update'` with `data: { deletedAt: new Date() }`
- [ ] Intercepts `params.action === 'findMany'` and injects `where: { deletedAt: null }` (merged with existing where)
- [ ] Handles the case where `params.args.where` is undefined before merging
- [ ] Notes the middleware applies to ALL models — a production implementation might scope it to specific models
- [ ] Mentions that Prisma middleware is deprecated in favor of Prisma Client Extensions (but middleware is still valid for older versions)

---

### Q11 — Schema migration strategy ⭐⭐

**Scenario:** You need to rename a column from `user_name` to `display_name` on a `users` table with 1M rows in production. A direct `ALTER TABLE RENAME COLUMN` would work but requires coordinated application deployment.

**Task:** Explain why renaming directly is risky in a zero-downtime deployment. Describe the four-step safe migration sequence. Explain why each step is safe to deploy independently.

**Acceptance Criteria:**
- [ ] States the risk: if you rename the column and deploy the app code simultaneously, there is a window where old instances use the old name and new instances use the new name — one set will error
- [ ] Step 1: add `display_name` as a new nullable column alongside `user_name`
- [ ] Step 2: backfill `display_name` from `user_name` in batches (avoid locking the table)
- [ ] Step 3: deploy application code that reads/writes `display_name` (both columns still exist)
- [ ] Step 4: drop `user_name` column after all instances are on the new code
- [ ] Explains each step is independently safe: no step removes data that the currently-running application depends on
- [ ] Bonus: mentions making `display_name` NOT NULL only after backfill is complete

---

### Q12 — Prisma Client Extension ⭐⭐⭐

**Scenario:** Multiple models need soft-delete functionality. Repeating the `update({ deletedAt: new Date() })` call everywhere violates DRY. The team wants a `.softDelete()` method directly on the model client.

**Task:** Implement a Prisma Client Extension that adds `.softDelete(id)` and `.restore(id)` methods to the `User` model using `client.$extends()`.

**Acceptance Criteria:**
- [ ] Uses `prisma.$extends({ model: { user: { ... } } })` to define the extension
- [ ] Implements `softDelete(id)` that calls `this.update({ where: { id }, data: { deletedAt: new Date() } })`
- [ ] Implements `restore(id)` that calls `this.update({ where: { id }, data: { deletedAt: null } })`
- [ ] Exports the extended client and imports it in place of the raw `prisma` instance
- [ ] Notes that extensions are type-safe: the new methods appear in TypeScript autocomplete
- [ ] Notes the difference from middleware: extensions are model-scoped, composable, and the recommended modern approach

---

### Q13 — Relation count vs include ⭐⭐⭐

**Scenario:** A posts list page shows each post's comment count. A colleague writes `include: { comments: true }` and then uses `.comments.length` in the template. The page loads slowly and crashes on posts with thousands of comments.

**Task:** Explain why using `include` to count is wrong. Write the correct query using `_count`. Calculate the data transfer difference for a post with 5,000 comments.

**Acceptance Criteria:**
- [ ] Explains the bug: `include: { comments: true }` loads all comment rows (all fields) into memory just to count them
- [ ] Writes the correct query: `prisma.post.findMany({ select: { id: true, title: true, _count: { select: { comments: true } } } })`
- [ ] Confirms `_count` translates to `SELECT COUNT(*) ... GROUP BY post_id` — no comment rows are transferred
- [ ] Quantifies the difference: 5,000 comments × average row size (e.g., 500 bytes) = 2.5 MB transferred unnecessarily per post
- [ ] Notes that `_count` is a Prisma abstraction over SQL aggregation and is always more efficient for counting relations
- [ ] Bonus: mentions `_count` can also filter with a `where` clause inside the `select`

---

### Q14 — Connection pool exhaustion ⭐⭐⭐

**Scenario:** Under load, all API requests hang for 30 seconds and then fail with "Can't reach database server." The PostgreSQL server is healthy. The Prisma connection pool has the default limit.

**Task:** Describe the symptoms and root cause of connection pool exhaustion. Give three fixes. Explain how to diagnose the current connection count.

**Acceptance Criteria:**
- [ ] Describes symptoms: requests queue up waiting for a free connection; response times spike; eventually timeout errors appear
- [ ] Root cause: slow queries hold connections for longer, reducing pool availability; spikes in traffic exhaust the pool
- [ ] Fix 1: optimize the slow queries so connections are released faster
- [ ] Fix 2: set `connection_limit` in the `DATABASE_URL` (e.g., `?connection_limit=10`) appropriate for your instance count
- [ ] Fix 3: add PgBouncer as a connection pooler in transaction mode — multiplexes many app connections onto fewer DB connections
- [ ] Diagnostic query: `SELECT count(*), state FROM pg_stat_activity GROUP BY state` to see active vs idle connections
- [ ] Notes that each server instance has its own pool — with 10 instances × 10 connections = 100 DB connections total

---

### Q15 — Multi-schema Prisma ⭐⭐⭐

**Scenario:** Your PostgreSQL database has two schemas: `public` for the application and `analytics` for reporting tables. Prisma by default only manages the `public` schema. The analytics team needs Prisma models for their tables too.

**Task:** Explain what PostgreSQL schemas are. Explain the `@@schema` attribute. Describe the `multiSchema` preview feature. State when teams use multiple schemas for isolation.

**Acceptance Criteria:**
- [ ] Defines PostgreSQL schemas: namespaces within a database that contain tables, views, and other objects — not to be confused with Prisma data models
- [ ] States that `multiSchema` is a preview feature enabled in the `generator client` block with `previewFeatures = ["multiSchema"]`
- [ ] Shows `@@schema("analytics")` on a model to assign it to a non-default PostgreSQL schema
- [ ] Shows the `datasource` block must list all schemas: `schemas = ["public", "analytics"]`
- [ ] Explains isolation use cases: separating tenant data, separating sensitive PII tables, separating reporting from OLTP tables
- [ ] Notes that cross-schema JOINs are possible in PostgreSQL but Prisma may require raw SQL for them
