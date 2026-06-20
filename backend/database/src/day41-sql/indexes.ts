// DAY 41 — INDEX ANALYSIS
//
// EXPLAIN ANALYZE (PostgreSQL syntax, shown here for learning):
//   EXPLAIN ANALYZE SELECT * FROM posts WHERE author_id = 1;
//   → Shows: Seq Scan vs Index Scan, actual rows, actual time
//
// SQLite equivalent: EXPLAIN QUERY PLAN
//
// HOW TO SPOT A SLOW QUERY:
//   1. Seq Scan on a large table → need an index
//   2. Nested Loop with large tables → need a better JOIN strategy
//   3. Hash Join → usually fast, but check memory usage
//
// READING EXPLAIN QUERY PLAN OUTPUT:
//   "SCAN TABLE posts"               → full table scan, no index used
//   "SEARCH TABLE posts USING INDEX" → index used, O(log N)
//   "SEARCH TABLE posts USING COVERING INDEX" → even better, never touches heap
//
// COMPOSITE INDEX LEFT-PREFIX RULE (critical!):
//   Our schema has: @@index([published, createdAt])
//   This index is ordered by published first, then created_at.
//
//   ✅ WHERE published = 1                    — left prefix, uses index
//   ✅ WHERE published = 1 AND created_at > X — full index, very fast
//   ❌ WHERE created_at > '2024-01-01'        — skips 'published', can't use index!
//      → Full table scan. To fix: add @@index([createdAt]) separately,
//        or restructure the query to include published.

import { PrismaClient } from '@prisma/client';

type ExplainRow = Record<string, unknown>;

async function analyzeQueries(prisma: PrismaClient) {
  console.log('\n[INDEX ANALYSIS — EXPLAIN QUERY PLAN]');

  // ── Query 1: No index on view_count → SCAN ────────────────────────────────
  // Our schema has NO index on view_count.
  // SQLite must scan every row to find posts with view_count > 100.
  // On 20 rows this is fine. On 10 million rows, this kills performance.
  console.log('\n1. Query on un-indexed column (view_count):');
  console.log('   SQL: SELECT * FROM posts WHERE view_count > 100');
  const noIndex = await prisma.$queryRawUnsafe<ExplainRow[]>(
    'EXPLAIN QUERY PLAN SELECT * FROM posts WHERE view_count > 100'
  );
  noIndex.forEach(row => console.log('   →', JSON.stringify(row)));
  console.log('   Expected: SCAN TABLE posts (no index → full scan)');

  // ── Query 2: Index on author_id → SEARCH ─────────────────────────────────
  // Our schema has: @@index([authorId]) which maps to an index on author_id.
  // SQLite can jump directly to posts by this author.
  console.log('\n2. Query on indexed column (author_id):');
  console.log('   SQL: SELECT * FROM posts WHERE author_id = 1');
  const withIndex = await prisma.$queryRawUnsafe<ExplainRow[]>(
    'EXPLAIN QUERY PLAN SELECT * FROM posts WHERE author_id = 1'
  );
  withIndex.forEach(row => console.log('   →', JSON.stringify(row)));
  console.log('   Expected: SEARCH TABLE posts USING INDEX (much faster)');

  // ── Query 3: Composite index (published, created_at) ─────────────────────
  // Our schema: @@index([published, createdAt])
  // This query uses the LEFT PREFIX (published) AND the second column.
  // SQLite narrows to published=1 rows, then filters by created_at.
  console.log('\n3. Composite index query (published + created_at):');
  console.log("   SQL: SELECT * FROM posts WHERE published = 1 AND created_at > '2024-01-01'");
  const composite = await prisma.$queryRawUnsafe<ExplainRow[]>(
    "EXPLAIN QUERY PLAN SELECT * FROM posts WHERE published = 1 AND created_at > '2024-01-01'"
  );
  composite.forEach(row => console.log('   →', JSON.stringify(row)));
  console.log('   Expected: SEARCH TABLE posts USING INDEX (composite index used)');

  // ── Query 4: Missing left prefix → falls back to SCAN ────────────────────
  // Querying created_at ALONE skips the left prefix (published).
  // The composite index (published, created_at) CANNOT be used.
  // Fix: add a separate @@index([createdAt]) if this query is common.
  console.log('\n4. Composite index — missing left prefix (created_at only):');
  console.log("   SQL: SELECT * FROM posts WHERE created_at > '2024-01-01'");
  const noLeftPrefix = await prisma.$queryRawUnsafe<ExplainRow[]>(
    "EXPLAIN QUERY PLAN SELECT * FROM posts WHERE created_at > '2024-01-01'"
  );
  noLeftPrefix.forEach(row => console.log('   →', JSON.stringify(row)));
  console.log('   Expected: SCAN TABLE posts (left prefix missing → full scan)');
  console.log('   Lesson: Always lead with the most selective, leftmost index column.');
}

export async function runIndexDemos(prisma: PrismaClient): Promise<void> {
  await analyzeQueries(prisma);
}
