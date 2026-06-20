// ════════════════════════════════════════════════════════════════
// DAY 41 — SQL FUNDAMENTALS
// ════════════════════════════════════════════════════════════════
//
// SQL is NOT going anywhere. Even if you use an ORM every day,
// you MUST understand SQL to:
//   - Debug slow queries (EXPLAIN ANALYZE)
//   - Write complex queries ORMs can't handle
//   - Design schemas that perform well
//   - Do database migrations safely
//
// This file uses Prisma's $queryRaw to run real SQL.
// Everything here translates directly to PostgreSQL/MySQL.

import { PrismaClient, Prisma } from '@prisma/client';

// ── 1. SELECT BASICS ─────────────────────────────────────────────────────────
//
// WHY NOT SELECT *?
//   ❌ SELECT * FROM posts
//      - Transfers ALL columns even if you only need title
//      - Breaks if a column is renamed (your code silently gets undefined)
//      - Prevents covering index optimization (index can't satisfy SELECT *
//        unless the index contains every column)
//      - In ORM code: always specify the columns you need (Prisma's `select`)
//
//   ✅ SELECT id, title, published FROM posts WHERE published = 1 LIMIT 10
//      - Only transfers what you need
//      - Explicit about requirements
//      - Can be satisfied by a covering index
//
// ALIASES:
//   AS renames a column in the result set.
//   Useful for readability and for disambiguating JOIN results.

async function selectBasics(prisma: PrismaClient) {
  console.log('\n[SELECT BASICS]');

  // Basic select with WHERE, ORDER BY, LIMIT
  // SQLite uses integers for booleans: 1 = true, 0 = false
  // PostgreSQL/MySQL use TRUE/FALSE
  type PostRow = { id: number; title: string; view_count: number };
  const topPosts = await prisma.$queryRaw<PostRow[]>`
    SELECT
      id,
      title,
      view_count AS viewCount
    FROM posts
    WHERE published = 1
    ORDER BY view_count DESC
    LIMIT 5
  `;

  console.log('Top 5 published posts by view count:');
  topPosts.forEach((p, i) => {
    console.log(`  ${i + 1}. [${p.view_count} views] ${p.title}`);
  });
}

// ── 2. JOINS ─────────────────────────────────────────────────────────────────
//
// INNER JOIN: Returns only rows that have a match in BOTH tables.
//   If a post has no author (NULL author_id), it won't appear.
//   If an author has no posts, they won't appear.
//
// LEFT JOIN: Returns ALL rows from the left table, plus matching rows
//   from the right. If no match, right-side columns are NULL.
//   Use LEFT JOIN when "the right side might not exist".
//
// THE N+1 PROBLEM:
//   The opposite of JOINs. Instead of one query, you run N+1:
//
//   ❌ WRONG:
//     const posts = await db.query('SELECT * FROM posts');  // 1 query
//     for (const post of posts) {
//       const author = await db.query(                       // N queries!
//         'SELECT * FROM users WHERE id = ?', [post.author_id]
//       );
//     }
//     If you have 100 posts → 101 database round-trips.
//
//   ✅ CORRECT (one query with JOIN):
//     SELECT p.title, u.name FROM posts p
//     INNER JOIN users u ON u.id = p.author_id
//
//   In Prisma, N+1 is caused by forgetting to use `include`.
//   See day42-prisma/relations.ts for the Prisma-specific fix.

async function joinDemos(prisma: PrismaClient) {
  console.log('\n[JOINS]');

  type JoinRow = { title: string; author: string; comment_count: bigint };

  // INNER JOIN posts + users, LEFT JOIN comments (posts might have 0 comments)
  // GROUP BY + COUNT to get comment count per post
  // SQLite note: COUNT returns BigInt in Node.js — use Number() to convert
  const postsWithComments = await prisma.$queryRaw<JoinRow[]>`
    SELECT p.title, u.name AS author, COUNT(c.id) AS comment_count
    FROM posts p
    INNER JOIN users u ON u.id = p.author_id
    LEFT JOIN comments c ON c.post_id = p.id
    WHERE p.published = 1
    GROUP BY p.id, u.name
    ORDER BY comment_count DESC
    LIMIT 10
  `;

  console.log('Published posts with comment counts:');
  postsWithComments.forEach((row) => {
    console.log(`  "${row.title}" by ${row.author} — ${Number(row.comment_count)} comments`);
  });
}

// ── 3. AGGREGATIONS ──────────────────────────────────────────────────────────
//
// AGGREGATE FUNCTIONS: COUNT, SUM, AVG, MIN, MAX
//   They collapse multiple rows into a single value.
//
// GROUP BY: Split rows into groups before aggregating.
//   Every column in SELECT must either:
//     a) Be in GROUP BY
//     b) Be inside an aggregate function
//
// WHERE vs HAVING:
//   WHERE  → filters rows BEFORE grouping
//   HAVING → filters groups AFTER grouping
//
//   Example: "Users who have published more than 2 posts"
//   ❌ WHERE post_count > 2  (can't use in WHERE — post_count doesn't exist yet)
//   ✅ HAVING COUNT(p.id) > 2

async function aggregationDemos(prisma: PrismaClient) {
  console.log('\n[AGGREGATIONS]');

  type AggRow = { name: string; post_count: bigint; avg_views: number | null };

  // For each user: count their posts, average view count
  // HAVING COUNT(p.id) > 0 filters out users with no posts
  // (In this dataset all users have posts, but HAVING demonstrates the syntax)
  const userStats = await prisma.$queryRaw<AggRow[]>`
    SELECT u.name, COUNT(p.id) AS post_count, AVG(p.view_count) AS avg_views
    FROM users u
    LEFT JOIN posts p ON p.author_id = u.id
    GROUP BY u.id
    HAVING COUNT(p.id) > 0
    ORDER BY post_count DESC
  `;

  console.log('User post statistics (HAVING filters groups with 0 posts):');
  userStats.forEach((row) => {
    const avg = row.avg_views ? Math.round(row.avg_views) : 0;
    console.log(`  ${row.name}: ${Number(row.post_count)} posts, ${avg} avg views`);
  });
}

// ── 4. INDEXES (conceptual overview) ─────────────────────────────────────────
//
// B-TREE INDEX ANATOMY:
//   A B-Tree is a balanced tree where each node holds a range of keys.
//   Lookups are O(log N) instead of O(N) for a full table scan.
//   The leaf nodes hold pointers to the actual row data (heap).
//
// HIGH vs LOW CARDINALITY:
//   Cardinality = number of distinct values
//   ✅ HIGH cardinality → good index candidate
//      email: millions of distinct values → index is very selective
//      user_id in posts: many distinct values
//   ❌ LOW cardinality → poor index candidate
//      published (boolean): only 2 values → index isn't selective
//      When 50% of rows match, DB might prefer a full scan anyway
//
// COVERING INDEX:
//   An index that contains ALL columns needed by a query.
//   The DB can answer the query from the index alone, never touching the table.
//   Example: INDEX(author_id, title) covers:
//     SELECT title FROM posts WHERE author_id = 1
//   The DB reads the index, finds author_id=1, returns title — never reads posts table.
//
// COMPOSITE INDEX LEFT-PREFIX RULE:
//   INDEX ON (published, created_at)
//   ✅ WHERE published = 1                       — uses index (left prefix)
//   ✅ WHERE published = 1 AND created_at > X    — uses full index
//   ❌ WHERE created_at > X                      — can NOT use this index!
//      (Must start from the leftmost column)

// ── 5. TRANSACTIONS ──────────────────────────────────────────────────────────
//
// ACID:
//   Atomicity   — All-or-nothing. Either ALL statements succeed or NONE do.
//   Consistency — DB goes from one valid state to another. Constraints hold.
//   Isolation   — Concurrent transactions don't see each other's uncommitted data.
//   Durability  — Once committed, data survives crashes (written to disk).
//
// WHY NOT AUTOCOMMIT FOR MULTI-STEP OPERATIONS?
//   If you run two UPDATEs without a transaction:
//     UPDATE accounts SET balance = balance - 100 WHERE id = 1;  ← succeeds
//     UPDATE accounts SET balance = balance + 100 WHERE id = 2;  ← FAILS (server crash?)
//   The first update committed. The second didn't. Money disappeared.
//
//   With a transaction: if step 2 fails, step 1 is rolled back. Money is safe.
//
// PRISMA TRANSACTIONS:
//   prisma.$transaction([...operations]) — batches operations atomically
//   prisma.$transaction(async (tx) => { ... }) — interactive transaction

async function transactionDemo(prisma: PrismaClient) {
  console.log('\n[TRANSACTIONS — ACID demo]');

  // Simulate a view count transfer: move 10 views from post 1 to post 2
  // (contrived example, but illustrates atomic multi-step update)
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Both statements run in the same transaction.
      // If the second fails, the first is rolled back.
      await tx.$executeRaw`
        UPDATE posts SET view_count = view_count - 10 WHERE id = 1
      `;
      await tx.$executeRaw`
        UPDATE posts SET view_count = view_count + 10 WHERE id = 2
      `;

      // Return updated values so we can confirm the swap
      const posts = await tx.$queryRaw<{ id: number; view_count: number }[]>`
        SELECT id, view_count FROM posts WHERE id IN (1, 2)
      `;
      return posts;
    });

    console.log('Transaction succeeded. Updated view counts:');
    result.forEach(p => console.log(`  Post ${p.id}: ${p.view_count} views`));
  } catch (err) {
    // If an error occurs inside $transaction, Prisma automatically rolls back
    console.error('Transaction failed (rolled back):', err);
  }
}

export async function runSQLDemos(prisma: PrismaClient): Promise<void> {
  await selectBasics(prisma);
  await joinDemos(prisma);
  await aggregationDemos(prisma);
  await transactionDemo(prisma);
}
