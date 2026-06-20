// DAY 43 — ADVANCED AGGREGATIONS
//
// WHEN TO USE $queryRaw:
//   Prisma's aggregate() handles COUNT, SUM, AVG, MIN, MAX.
//   But for GROUP BY with HAVING, window functions, full-text search,
//   partitioned tables — you need raw SQL.
//
// POSTGRESQL FULL-TEXT SEARCH (shown as reference, SQLite uses LIKE):
//   -- PostgreSQL:
//   SELECT *, ts_rank(search_vector, query) as rank
//   FROM posts, plainto_tsquery('english', $1) query
//   WHERE search_vector @@ query
//   ORDER BY rank DESC;
//
//   -- SQLite equivalent (simpler but less powerful):
//   SELECT * FROM posts WHERE content LIKE '%keyword%'

import { PrismaClient, Prisma } from '@prisma/client';

// ── 1. Prisma aggregate() ────────────────────────────────────────────────────
//
// aggregate() runs a single SQL SELECT with COUNT(*), AVG(), MAX(), MIN().
// Much cleaner than raw SQL for simple aggregations.

async function prismaAggregate(prisma: PrismaClient) {
  console.log('\n[PRISMA aggregate()]');

  const stats = await prisma.post.aggregate({
    _count: true,              // COUNT(*) — total posts
    _avg: { viewCount: true }, // AVG(view_count)
    _max: { viewCount: true }, // MAX(view_count)
    _min: { viewCount: true }, // MIN(view_count)
    where: { published: true },
  });

  console.log('Published post statistics (single SQL query):');
  console.log(`  Count:    ${stats._count}`);
  console.log(`  Avg views: ${stats._avg.viewCount?.toFixed(1) ?? 'N/A'}`);
  console.log(`  Max views: ${stats._max.viewCount ?? 'N/A'}`);
  console.log(`  Min views: ${stats._min.viewCount ?? 'N/A'}`);
}

// ── 2. groupBy with HAVING ────────────────────────────────────────────────────
//
// groupBy returns one row per unique value of the grouped field.
// having filters out groups that don't meet the condition.
//
// SQL equivalent:
//   SELECT author_id, COUNT(id), AVG(view_count)
//   FROM posts
//   GROUP BY author_id
//   HAVING AVG(view_count) > 50

async function groupByDemo(prisma: PrismaClient) {
  console.log('\n[groupBy with HAVING]');

  const authorStats = await prisma.post.groupBy({
    by: ['authorId'],
    _count: { id: true },
    _avg: { viewCount: true },
    having: {
      // HAVING AVG(view_count) > 50
      // Only return authors whose posts average more than 50 views
      viewCount: { _avg: { gt: 50 } },
    },
    orderBy: { _avg: { viewCount: 'desc' } },
  });

  console.log('Authors with avg views > 50 per post:');
  for (const stat of authorStats) {
    // Look up the author name (groupBy doesn't support include)
    const author = await prisma.user.findUnique({
      where: { id: stat.authorId },
      select: { name: true },
    });
    console.log(
      `  ${author?.name}: ${stat._count.id} posts, ${stat._avg.viewCount?.toFixed(0)} avg views`
    );
  }
}

// ── 3. Raw SQL aggregation (posts per day) ────────────────────────────────────
//
// SQLite's strftime() formats dates. PostgreSQL uses date_trunc() or to_char().
// For reporting queries like "posts per day", raw SQL is often clearer.

async function rawAggregation(prisma: PrismaClient) {
  console.log('\n[RAW SQL — posts published per day]');

  type DayRow = { day: string; post_count: bigint };

  // SQLite: strftime('%Y-%m-%d', created_at) extracts the date part
  // PostgreSQL: DATE(created_at) or date_trunc('day', created_at)
  const postsPerDay = await prisma.$queryRaw<DayRow[]>`
    SELECT
      strftime('%Y-%m-%d', created_at) AS day,
      COUNT(*) AS post_count
    FROM posts
    WHERE published = 1
    GROUP BY day
    ORDER BY day DESC
    LIMIT 10
  `;

  if (postsPerDay.length === 0) {
    console.log('  (all posts created today — seed generates timestamps at runtime)');
    console.log('  In production with real date spread, this shows a time series.');
  } else {
    postsPerDay.forEach(row =>
      console.log(`  ${row.day}: ${Number(row.post_count)} posts`)
    );
  }
}

// ── 4. LIKE-based search ──────────────────────────────────────────────────────
//
// For SQLite: LIKE '%keyword%' scans the entire content column.
// This is slow on large tables — no index can help with leading wildcard.
//
// For PostgreSQL (production): Use full-text search
//   - Add a tsvector column: ALTER TABLE posts ADD COLUMN search_vector tsvector;
//   - Update it: UPDATE posts SET search_vector = to_tsvector('english', title || ' ' || content);
//   - Create GIN index: CREATE INDEX idx_search ON posts USING GIN(search_vector);
//   - Query: WHERE search_vector @@ plainto_tsquery('english', $1)
//
// Prisma supports this via: where: { content: { search: 'keyword' } }
// (requires previewFeatures = ["fullTextSearch"] in schema.prisma)

async function searchDemo(prisma: PrismaClient) {
  console.log('\n[LIKE SEARCH — SQLite (use full-text search in PostgreSQL)]');

  const keyword = 'TypeScript';

  // OR condition: search title OR content
  const results = await prisma.post.findMany({
    where: {
      OR: [
        { title: { contains: keyword } },    // LIKE '%TypeScript%'
        { content: { contains: keyword } },  // LIKE '%TypeScript%'
      ],
      published: true,
    },
    select: { id: true, title: true },
    orderBy: { viewCount: 'desc' },
  });

  console.log(`Posts matching "${keyword}" (LIKE search):`);
  if (results.length === 0) {
    console.log('  (no results)');
  } else {
    results.forEach(p => console.log(`  [${p.id}] ${p.title}`));
  }
  console.log('  Note: In PostgreSQL, use mode: "insensitive" for case-insensitive search.');
  console.log('  Note: For production search, use PostgreSQL full-text or Elasticsearch.');
}

export async function runAggregationDemos(prisma: PrismaClient): Promise<void> {
  await prismaAggregate(prisma);
  await groupByDemo(prisma);
  await rawAggregation(prisma);
  await searchDemo(prisma);
}
