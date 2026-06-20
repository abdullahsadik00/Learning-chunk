// ════════════════════════════════════════════════════════════════
// DAY 45 — DATABASE DESIGN PRINCIPLES
// ════════════════════════════════════════════════════════════════
//
// These aren't runnable demos — they're reference examples.
// Read the code and comments. They show you how to THINK about schema design.
//
// 1NF: No repeating groups. Each column stores one value.
//   ❌ tags: "javascript,react,typescript" (string with delimiter)
//   ✅ Create a separate tags table with post_id FK
//
// 2NF: No partial dependencies (applies to composite keys).
//   If PK is (order_id, product_id):
//   ❌ product_name column — depends only on product_id, not both
//   ✅ Move product_name to products table
//
// 3NF: No transitive dependencies.
//   ❌ orders table with customer_city — city depends on customer, not order
//   ✅ customer_city belongs in customers table
//
// WHEN TO DENORMALIZE:
//   - Read-heavy, write-light data
//   - Reporting tables (data warehouse)
//   - When JOINs become the bottleneck (measure first!)

import { PrismaClient } from '@prisma/client';

// ── 1. Normalization: BAD vs GOOD schema ──────────────────────────────────────
//
// BAD: Orders table stores customer data directly.
// UPDATE ANOMALY: if the customer moves, you update 1000 order rows.
// INCONSISTENCY: one order has "New York", another has "NY" — same customer.

interface BadOrdersTable {
  orderId: number;
  // Customer data repeated on every order row — update anomaly risk
  customerId: number;
  customerName: string;      // ❌ Repeated for every order
  customerEmail: string;     // ❌ Repeated for every order
  customerCity: string;      // ❌ Depends on customer, not on order (3NF violation)
  product: string;
  quantity: number;
  totalPrice: number;
}

// GOOD: Separate customers table. Orders only store the customer FK.
// UPDATE: customer moves → update 1 row in customers. Done.

interface GoodCustomersTable {
  id: number;
  name: string;
  email: string;
  city: string;
}

interface GoodOrdersTable {
  orderId: number;
  customerId: number;        // ✅ FK to customers table
  // No customer data here — it lives in customers table
  product: string;
  quantity: number;
  totalPrice: number;
}

function demonstrateNormalization() {
  console.log('\n[NORMALIZATION — BAD vs GOOD schema]');
  console.log('  BAD schema: customer data repeated on every order row');
  console.log('    → Update anomaly: customer moves → update 1000 order rows');
  console.log('    → Inconsistency: "New York" vs "NY" for same customer');
  console.log('  GOOD schema: customers table + FK in orders');
  console.log('    → Update: 1 row in customers. All orders automatically correct.');
  console.log('  See the TypeScript interfaces in this file for the schema.');
}

// ── 2. M:N Relationships ──────────────────────────────────────────────────────
//
// A post can have many tags. A tag can be on many posts.
// This is a many-to-many (M:N) relationship.
//
// You CANNOT model this with FKs on either table directly:
//   posts.tag_id would only support ONE tag per post
//   tags.post_id would only support ONE post per tag
//
// Solution: junction table (also called bridge table, join table, pivot table).
//   PostTag stores one row per (post, tag) combination.
//
// Prisma's @@id([postId, tagId]) creates a composite primary key.
// This prevents duplicate (post, tag) pairs automatically.

interface ManyToManyPost {
  id: number;
  title: string;
  // No tag_id here — that would limit to one tag
}

interface ManyToManyTag {
  id: number;
  name: string;  // 'javascript', 'react', 'typescript'
  // No post_id here — that would limit to one post
}

interface PostTag {
  // Composite PK: @@id([postId, tagId])
  // Prevents duplicate (post, tag) combinations
  postId: number;   // FK → posts.id
  tagId: number;    // FK → tags.id
}

function demonstrateManyToMany() {
  console.log('\n[M:N RELATIONSHIPS — junction table]');
  console.log('  Post "JS Closures" → tags: [javascript, closures, fundamentals]');
  console.log('  Tag "javascript"   → posts: [JS Closures, React Hooks, Async/Await]');
  console.log('  Junction table: posts_tags (postId, tagId) — composite PK');
  console.log('  @@id([postId, tagId]) prevents duplicate tag assignments');
}

// ── 3. Soft Delete pattern ────────────────────────────────────────────────────
//
// Hard delete: DELETE FROM users WHERE id = 1
//   Problem: you lose the record forever. Can't audit. Can't restore.
//   Can't understand historical data ("why did revenue drop that day?")
//
// Soft delete: UPDATE users SET deleted_at = NOW() WHERE id = 1
//   The record stays in the DB but is treated as deleted.
//   Benefits: audit trail, undo, historical queries.
//   Cost: all queries must add WHERE deleted_at IS NULL.
//
// Prisma middleware intercepts all Prisma Client calls.
// We intercept `delete` and convert it to `update`.
// We intercept `findMany` and inject `WHERE deleted_at IS NULL`.

interface SoftDeletableUser {
  id: number;
  email: string;
  name: string;
  deletedAt: Date | null;  // null = active, Date = deleted
}

function demonstrateSoftDelete() {
  console.log('\n[SOFT DELETE — Prisma middleware pattern]');
  console.log('  Without middleware: prisma.user.delete() → DELETE FROM users');
  console.log('  With middleware:    prisma.user.delete() → UPDATE users SET deleted_at = NOW()');
  console.log('  findMany automatically adds WHERE deleted_at IS NULL');
  console.log('');
  console.log('  Middleware code (add to your Prisma setup):');
  console.log('  ─────────────────────────────────────────────');
  console.log(`
  // In your Prisma client setup:
  prisma.$use(async (params, next) => {
    // Intercept delete → convert to soft delete
    if (params.action === 'delete') {
      params.action = 'update';
      params.args['data'] = { deletedAt: new Date() };
    }
    // Intercept findMany → add deleted_at filter
    if (params.action === 'findMany') {
      params.args.where = {
        ...params.args.where,
        deletedAt: null,  // WHERE deleted_at IS NULL
      };
    }
    return next(params);
  });
  `);
}

// ── 4. Audit Log pattern ──────────────────────────────────────────────────────
//
// Record every change to important entities.
// Use cases: compliance, debugging, undo history, fraud detection.
//
// Instead of overwriting data, APPEND a new row to the audit log.
// Never delete audit logs (defeats the purpose).

interface AuditLog {
  id: number;
  entityType: string;    // 'user', 'post', 'comment'
  entityId: number;      // id of the changed record
  action: string;        // 'create', 'update', 'delete'
  oldValues: string;     // JSON.stringify(before)
  newValues: string;     // JSON.stringify(after)
  userId: number;        // who made the change
  createdAt: Date;
}

function demonstrateAuditLog() {
  console.log('\n[AUDIT LOG — record every change]');
  console.log('  Schema: audit_logs (id, entityType, entityId, action, oldValues, newValues, userId, createdAt)');
  console.log('');
  console.log('  Example audit log entry for a user role change:');
  const exampleLog: AuditLog = {
    id: 1,
    entityType: 'user',
    entityId: 42,
    action: 'update',
    oldValues: JSON.stringify({ role: 'user' }),
    newValues: JSON.stringify({ role: 'admin' }),
    userId: 1,          // admin who made the change
    createdAt: new Date(),
  };
  console.log(' ', JSON.stringify(exampleLog, null, 2).split('\n').join('\n  '));
}

// ── 5. N+1 Detector (live) ───────────────────────────────────────────────────
//
// Enable Prisma query logging to SEE the N+1 problem in real time.
// You'll see multiple SELECT statements in the console.
// Each one is a separate database round-trip.
//
// Fix: use `include` to tell Prisma to JOIN instead.

async function demonstrateN1Detector() {
  console.log('\n[N+1 DETECTOR — Prisma query logging]');
  console.log('  Creating Prisma client with query logging enabled...');
  console.log('  Watch the queries printed below — count them!\n');

  // Enable query logging
  const loggingPrisma = new PrismaClient({
    log: [
      { emit: 'event', level: 'query' },
    ],
  });

  let queryCount = 0;

  // @ts-ignore — $on is available but typing may require specific version
  loggingPrisma.$on('query', (e: { query: string; duration: number }) => {
    queryCount++;
    console.log(`  [Query ${queryCount}] ${e.query.slice(0, 80)}...`);
  });

  try {
    // N+1: 1 query for posts + 1 query per post for its author
    const posts = await loggingPrisma.post.findMany({
      where: { published: true },
      take: 3,
      select: { id: true, title: true, authorId: true },
    });

    for (const post of posts) {
      await loggingPrisma.user.findUnique({
        where: { id: post.authorId },
        select: { name: true },
      });
    }

    console.log(`\n  Total queries: ${queryCount} (1 for posts + ${posts.length} for authors = N+1!)`);
    console.log('  FIX: use include: { author: true } → 1 query total\n');

    // Reset counter
    queryCount = 0;
    console.log('  Now the same data WITH include (1 query):');

    await loggingPrisma.post.findMany({
      where: { published: true },
      take: 3,
      include: { author: { select: { name: true } } },
    });

    console.log(`\n  Total queries with include: ${queryCount} query`);
    console.log('  This is the difference between N+1 and JOIN.');

  } finally {
    await loggingPrisma.$disconnect();
  }
}

async function main() {
  console.log('════════════════════════════════════════════════════════════════');
  console.log('DAY 45 — DATABASE DESIGN PRINCIPLES');
  console.log('════════════════════════════════════════════════════════════════\n');

  demonstrateNormalization();
  demonstrateManyToMany();
  demonstrateSoftDelete();
  demonstrateAuditLog();

  console.log('\n[LIVE DEMO — N+1 Detector]');
  await demonstrateN1Detector();

  console.log('\n════════════════════════════════════════════════════════════════');
  console.log('Day 45 complete!');
  console.log('════════════════════════════════════════════════════════════════');
}

main().catch(console.error);
