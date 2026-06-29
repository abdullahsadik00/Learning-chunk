// ═══════════════════════════════════════════════════════════════════════════════
// BACKEND 08: ADVANCED QUERIES · CURSOR PAGINATION · AGGREGATIONS · FULL-TEXT SEARCH  (Day 43)
// Run: npx ts-node 08-advanced-queries.ts
// ═══════════════════════════════════════════════════════════════════════════════
//
// Real-world backends hit performance walls the moment traffic picks up.
// This file covers the query patterns that separate production-grade backends
// from tutorial projects:
//
//  1. N+1 Problem       — the silent query multiplier that kills performance
//  2. Cursor Pagination — stable paging over live, changing data
//  3. Aggregations      — COUNT, SUM, AVG, groupBy, raw SQL aggregates
//  4. Full-Text Search  — tsvector / tsquery / GIN indexes / trigrams
//  5. Window Functions  — ROW_NUMBER, RANK, LAG/LEAD, running totals
//  6. Locking           — optimistic (version column) vs pessimistic (FOR UPDATE)
//  7. Query Optimization— EXPLAIN ANALYZE, indexes, covering indexes
//  8. Prisma Middleware  — soft deletes, slow-query logging, output sanitization

// ───────────────────────────────────────────────────────────────────────────────
// 1. THE N+1 PROBLEM
// ───────────────────────────────────────────────────────────────────────────────

console.log("=== 1. N+1 Problem ===");

/*
  THE PROBLEM
  ───────────
  N+1 means you fire 1 query to get a list of N records, then fire N MORE
  queries — one for each record — to load a related piece of data.

  Example: show 100 blog posts with each author's name
    Query 1 → SELECT * FROM posts LIMIT 100          (returns 100 rows)
    Query 2 → SELECT * FROM users WHERE id = 1       (author of post 1)
    Query 3 → SELECT * FROM users WHERE id = 2       (author of post 2)
    ...
    Query 101 → SELECT * FROM users WHERE id = 100   (author of post 100)

  Result: 101 database round-trips instead of 1. At 5ms per round-trip that's
  500ms of wasted latency — and it grows linearly with your data set.

  DETECTING IT
  ────────────
  Enable query logging in Prisma:

    const prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
    });

  Or use slow query logs in PostgreSQL:
    SET log_min_duration_statement = 100;  -- log queries > 100ms

  Look for the same query running in a loop with different ID values.

  FIX 1: Prisma `include` (JOIN-based eager loading)
  ───────────────────────────────────────────────────
  Prisma translates `include` into a single JOIN query (or 2 queries for
  one-to-many) instead of N queries.

    const posts = await prisma.post.findMany({
      take: 100,
      include: {
        author: true,       // ← eager-load the author row
        comments: {
          take: 5,          // ← limit nested relation
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    // 1 query instead of 101

  FIX 2: DataLoader pattern (batch + cache within a request)
  ──────────────────────────────────────────────────────────
  DataLoader collects all the IDs requested in a single event-loop tick,
  then fires ONE batched query. Used heavily in GraphQL resolvers.

    import DataLoader from 'dataloader';

    const userLoader = new DataLoader(async (ids: readonly number[]) => {
      // Called ONCE with all collected IDs
      const users = await prisma.user.findMany({
        where: { id: { in: ids as number[] } },
      });
      // Must return results in the SAME ORDER as input ids
      const userMap = new Map(users.map(u => [u.id, u]));
      return ids.map(id => userMap.get(id) ?? null);
    });

    // In a resolver (called per-post):
    const author = await userLoader.load(post.authorId); // batched automatically

  FIX 3: Raw SQL with a JOIN (when you need fine-grained control)
  ───────────────────────────────────────────────────────────────
    const results = await prisma.$queryRaw<PostWithAuthor[]>`
      SELECT p.id, p.title, u.name AS author_name
      FROM posts p
      JOIN users u ON u.id = p.author_id
      ORDER BY p.created_at DESC
      LIMIT 100
    `;

  RULE OF THUMB
  ─────────────
  - Loading a single related record  → use include (JOIN)
  - GraphQL / per-item resolver      → use DataLoader
  - Complex join with many tables    → use $queryRaw
*/

// Simulated demonstration (no real DB needed):
type Post = { id: number; title: string; authorId: number };
type User = { id: number; name: string };

// Simulated N+1 (bad)
async function getPostsNPlusOne(posts: Post[], usersDb: Map<number, User>) {
  const results = [];
  for (const post of posts) {
    // Imagine each of these is a DB round-trip
    const author = usersDb.get(post.authorId);
    results.push({ ...post, authorName: author?.name });
  }
  return results;
}

// Simulated batch (good) — mirrors what DataLoader does internally
async function getPostsBatched(posts: Post[], usersDb: Map<number, User>) {
  const uniqueIds = [...new Set(posts.map(p => p.authorId))];
  // Single query: WHERE id IN (1, 2, 3, ...)
  const authors = new Map(uniqueIds.map(id => [id, usersDb.get(id)]));
  return posts.map(p => ({ ...p, authorName: authors.get(p.authorId)?.name }));
}

const mockUsers = new Map<number, User>([
  [1, { id: 1, name: "Alice" }],
  [2, { id: 2, name: "Bob" }],
]);
const mockPosts: Post[] = [
  { id: 101, title: "First Post", authorId: 1 },
  { id: 102, title: "Second Post", authorId: 2 },
  { id: 103, title: "Third Post", authorId: 1 },
];

// Both produce the same output — but batched uses 1 DB call instead of 3
getPostsBatched(mockPosts, mockUsers).then(results => {
  console.log("Batched result:", results.map(r => `${r.title} by ${r.authorName}`));
});

// ───────────────────────────────────────────────────────────────────────────────
// 2. CURSOR-BASED PAGINATION
// ───────────────────────────────────────────────────────────────────────────────

console.log("\n=== 2. Cursor-Based Pagination ===");

/*
  WHY OFFSET BREAKS ON LIVE DATA
  ───────────────────────────────
  Traditional offset pagination:
    SELECT * FROM posts ORDER BY created_at DESC LIMIT 20 OFFSET 40;

  Problem 1 — Skips: A new post is inserted while the user is reading page 1.
    Page 1: rows 1–20 (new post is now row 1)
    Page 2: OFFSET 20 → skips the old row 20 (now row 21)

  Problem 2 — Duplicates: A post is deleted between page fetches.
    Page 1: rows 1–20
    After deletion: row 20 → row 19
    Page 2: OFFSET 20 → row 19 appears again (already shown)

  Problem 3 — Performance: The database must scan and throw away OFFSET rows.
    OFFSET 10000 makes PostgreSQL touch 10,020 rows just to return 20.
    At millions of rows this is catastrophically slow.

  HOW CURSOR PAGINATION WORKS
  ────────────────────────────
  A cursor is a stable pointer to a specific row — usually the ID or a
  composite (createdAt + id). Instead of "give me rows 41–60", you say
  "give me 20 rows that come AFTER row with id = 1234".

  The row identified by the cursor can never move — it's a fixed anchor.
  Inserts and deletes before or after it don't affect what you see next.

  PRISMA IMPLEMENTATION
  ─────────────────────
  First page (no cursor):
    const firstPage = await prisma.post.findMany({
      take: 20,
      orderBy: { id: 'asc' },
    });
    const nextCursor = firstPage[firstPage.length - 1]?.id;

  Next page (with cursor):
    const nextPage = await prisma.post.findMany({
      take: 20,
      skip: 1,             // skip the cursor row itself
      cursor: { id: nextCursor },
      orderBy: { id: 'asc' },
    });

  API RESPONSE SHAPE
  ──────────────────
  Always return nextCursor so the client knows where to continue:

    interface PaginatedResponse<T> {
      data: T[];
      nextCursor: number | null;  // null = no more pages
      hasNextPage: boolean;
    }

  To detect hasNextPage, fetch take + 1 rows and pop the extra one:

    const posts = await prisma.post.findMany({
      take: pageSize + 1,    // fetch one extra
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { id: 'asc' },
    });
    const hasNextPage = posts.length > pageSize;
    if (hasNextPage) posts.pop();  // remove the extra row
    const nextCursor = hasNextPage ? posts[posts.length - 1].id : null;

  BI-DIRECTIONAL PAGINATION
  ──────────────────────────
  For "previous page", take a NEGATIVE value:
    // Go back 20 rows from cursor
    const prevPage = await prisma.post.findMany({
      take: -20,
      skip: 1,
      cursor: { id: currentFirstId },
      orderBy: { id: 'asc' },
    });

  KEYSET PAGINATION FOR MULTIPLE SORT FIELDS
  ───────────────────────────────────────────
  When sorting by (createdAt DESC, id DESC) — needed for stable ordering
  when createdAt values may not be unique — use raw SQL with a compound
  WHERE condition:

    SELECT * FROM posts
    WHERE (created_at, id) < ($1, $2)   -- tuple comparison
    ORDER BY created_at DESC, id DESC
    LIMIT 20;

  This is called a "keyset" because the cursor is the full sort-key tuple.
  It is the only correct approach for composite sort orders.
*/

// Simulated cursor pagination
interface PaginatedResult<T> {
  data: T[];
  nextCursor: number | null;
  hasNextPage: boolean;
}

function paginateInMemory(
  items: Post[],
  pageSize: number,
  cursor?: number
): PaginatedResult<Post> {
  let startIndex = 0;
  if (cursor !== undefined) {
    const idx = items.findIndex(item => item.id === cursor);
    startIndex = idx + 1; // one past the cursor
  }
  const slice = items.slice(startIndex, startIndex + pageSize + 1);
  const hasNextPage = slice.length > pageSize;
  if (hasNextPage) slice.pop();
  return {
    data: slice,
    nextCursor: hasNextPage ? slice[slice.length - 1].id : null,
    hasNextPage,
  };
}

const allPosts: Post[] = Array.from({ length: 7 }, (_, i) => ({
  id: i + 1,
  title: `Post ${i + 1}`,
  authorId: (i % 2) + 1,
}));

const page1 = paginateInMemory(allPosts, 3);
console.log("Page 1:", page1.data.map(p => p.id), "nextCursor:", page1.nextCursor);

const page2 = paginateInMemory(allPosts, 3, page1.nextCursor!);
console.log("Page 2:", page2.data.map(p => p.id), "nextCursor:", page2.nextCursor);

const page3 = paginateInMemory(allPosts, 3, page2.nextCursor!);
console.log("Page 3:", page3.data.map(p => p.id), "hasNextPage:", page3.hasNextPage);

// ───────────────────────────────────────────────────────────────────────────────
// 3. AGGREGATIONS WITH PRISMA
// ───────────────────────────────────────────────────────────────────────────────

console.log("\n=== 3. Aggregations ===");

/*
  BUILT-IN AGGREGATION FUNCTIONS
  ────────────────────────────────
  Prisma supports _count, _sum, _avg, _min, _max on numeric fields:

    const stats = await prisma.order.aggregate({
      _count: { id: true },          // COUNT(id)
      _sum:   { amount: true },      // SUM(amount)
      _avg:   { amount: true },      // AVG(amount)
      _min:   { amount: true },      // MIN(amount)
      _max:   { amount: true },      // MAX(amount)
      where:  { status: 'COMPLETED' },
    });

    console.log(`Total orders: ${stats._count.id}`);
    console.log(`Revenue: $${stats._sum.amount?.toFixed(2)}`);

  GROUP BY WITH HAVING
  ─────────────────────
  `groupBy` groups rows by a field and can filter groups with `having`:

    const salesByRegion = await prisma.order.groupBy({
      by: ['region'],
      _sum:   { amount: true },
      _count: { id: true },
      having: {
        amount: {
          _sum: { gt: 1000 },        // only regions with sum > $1000
        },
      },
      orderBy: { _sum: { amount: 'desc' } },
    });

  COUNT RELATED RECORDS
  ──────────────────────
  To count how many posts each user has:

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: { posts: true },   // adds _count.posts to each row
        },
      },
    });
    // users[0]._count.posts → number

  RAW SQL AGGREGATIONS
  ─────────────────────
  For anything Prisma can't express (percentile, median, FILTER clause):

    interface PercentileResult { p50: number; p95: number; p99: number }

    const latencyStats = await prisma.$queryRaw<PercentileResult[]>`
      SELECT
        PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY duration_ms) AS p50,
        PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms) AS p95,
        PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY duration_ms) AS p99
      FROM api_logs
      WHERE created_at > NOW() - INTERVAL '24 hours'
    `;

  DISTINCT COUNT
  ──────────────
  Prisma does not have a built-in DISTINCT aggregation — use raw SQL:

    const result = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(DISTINCT user_id) AS count FROM events
    `;
    const uniqueUsers = Number(result[0].count);
    // Note: $queryRaw returns bigint for COUNT — always convert with Number()
*/

// Simulated aggregation helpers (plain TS, no Prisma needed to run)
interface SalesRecord { region: string; amount: number; status: string }

function aggregate(records: SalesRecord[]) {
  const completed = records.filter(r => r.status === "COMPLETED");
  const amounts   = completed.map(r => r.amount);
  const sum       = amounts.reduce((a, b) => a + b, 0);
  return {
    _count: completed.length,
    _sum:   sum,
    _avg:   completed.length ? sum / completed.length : 0,
    _min:   Math.min(...amounts),
    _max:   Math.max(...amounts),
  };
}

function groupBy(records: SalesRecord[], field: keyof SalesRecord) {
  const groups = new Map<string, SalesRecord[]>();
  for (const r of records) {
    const key = String(r[field]);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(r);
  }
  return [...groups.entries()].map(([key, rows]) => ({
    [field]: key,
    _count: rows.length,
    _sum:   rows.reduce((a, r) => a + r.amount, 0),
  }));
}

const sales: SalesRecord[] = [
  { region: "APAC",  amount: 500,  status: "COMPLETED" },
  { region: "EMEA",  amount: 1200, status: "COMPLETED" },
  { region: "APAC",  amount: 800,  status: "COMPLETED" },
  { region: "EMEA",  amount: 200,  status: "PENDING"   },
];

console.log("Aggregate (COMPLETED only):", aggregate(sales));
console.log("GroupBy region:", groupBy(sales, "region"));

// ───────────────────────────────────────────────────────────────────────────────
// 4. FULL-TEXT SEARCH
// ───────────────────────────────────────────────────────────────────────────────

console.log("\n=== 4. Full-Text Search ===");

/*
  POSTGRESQL FULL-TEXT SEARCH OVERVIEW
  ──────────────────────────────────────
  PostgreSQL has a built-in FTS engine based on two types:

    tsvector  — preprocessed document: words are stemmed, stop-words removed
                Example: to_tsvector('english', 'The quick brown fox')
                       → 'brown':3 'fox':4 'quick':2

    tsquery   — search query with operators: & (AND), | (OR), ! (NOT), <-> (adjacent)
                Example: to_tsquery('english', 'quick & fox')
                       → 'quick' & 'fox'

  BASIC SEARCH QUERY
  ───────────────────
  Find posts where title or body matches "TypeScript generics":

    SELECT id, title, body
    FROM posts
    WHERE to_tsvector('english', title || ' ' || body)
      @@ to_tsquery('english', 'TypeScript & generics')
    ORDER BY ts_rank(
      to_tsvector('english', title || ' ' || body),
      to_tsquery('english', 'TypeScript & generics')
    ) DESC;

  With Prisma $queryRaw (template literal = safe from SQL injection):

    interface SearchResult { id: number; title: string; rank: number }

    const query = 'TypeScript & generics';

    const results = await prisma.$queryRaw<SearchResult[]>`
      SELECT id, title,
        ts_rank(
          to_tsvector('english', title || ' ' || body),
          to_tsquery('english', ${query})
        ) AS rank
      FROM posts
      WHERE to_tsvector('english', title || ' ' || body)
        @@ to_tsquery('english', ${query})
      ORDER BY rank DESC
      LIMIT 20
    `;

  GIN INDEX (required for performance)
  ──────────────────────────────────────
  Without an index every FTS query scans the whole table. A GIN (Generalized
  Inverted Index) pre-builds an inverted word → rows map for fast lookup.

  Store the tsvector in a generated column and index it:

    -- Add a tsvector generated column
    ALTER TABLE posts
    ADD COLUMN search_vector tsvector
    GENERATED ALWAYS AS (
      to_tsvector('english', coalesce(title,'') || ' ' || coalesce(body,''))
    ) STORED;

    -- Index it with GIN
    CREATE INDEX posts_search_gin ON posts USING GIN (search_vector);

  Now rewrite the query against the column (no runtime tsvector computation):

    SELECT id, title, ts_rank(search_vector, query) AS rank
    FROM posts, to_tsquery('english', 'TypeScript & generics') AS query
    WHERE search_vector @@ query
    ORDER BY rank DESC;

  ILIKE — SIMPLE SUBSTRING SEARCH (when FTS is overkill)
  ────────────────────────────────────────────────────────
  For small tables (< 100k rows) or simple "contains" search, ILIKE is easier:

    const results = await prisma.post.findMany({
      where: {
        OR: [
          { title: { contains: searchTerm, mode: 'insensitive' } },
          { body:  { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
    });

  Prisma translates mode: 'insensitive' to ILIKE internally.
  ILIKE does NOT use a standard B-tree index.

  TRIGRAM SIMILARITY (pg_trgm extension)
  ────────────────────────────────────────
  Trigrams are letter triplets. pg_trgm computes similarity based on shared
  trigrams — useful for fuzzy/typo-tolerant search ("TypeScrpt" ≈ "TypeScript").

    -- Enable extension
    CREATE EXTENSION IF NOT EXISTS pg_trgm;

    -- GIN index on trigrams
    CREATE INDEX posts_title_trgm ON posts USING GIN (title gin_trgm_ops);

    -- Fuzzy search with similarity threshold
    SELECT id, title, similarity(title, $1) AS sim
    FROM posts
    WHERE title % $1          -- % = similarity operator (default threshold 0.3)
    ORDER BY sim DESC
    LIMIT 10;

  Choose the right tool:
    - Simple substring search, small table → ILIKE (Prisma built-in)
    - Large table, typo-tolerant           → pg_trgm
    - Multi-word semantic search           → tsvector/tsquery + GIN
    - Advanced relevance tuning            → combine ts_rank + tsvector
*/

// Simulated search ranking (no DB needed)
interface Doc { id: number; title: string; body: string }

function simpleSearch(docs: Doc[], term: string): Array<Doc & { matchCount: number }> {
  const words = term.toLowerCase().split(/\s+/);
  return docs
    .map(doc => {
      const text = `${doc.title} ${doc.body}`.toLowerCase();
      const matchCount = words.filter(w => text.includes(w)).length;
      return { ...doc, matchCount };
    })
    .filter(d => d.matchCount > 0)
    .sort((a, b) => b.matchCount - a.matchCount);
}

const docs: Doc[] = [
  { id: 1, title: "TypeScript Generics Deep Dive",  body: "Learn generics and constraints" },
  { id: 2, title: "Intro to TypeScript",             body: "Basics of TypeScript types" },
  { id: 3, title: "React Hooks Guide",               body: "useState useEffect and custom hooks" },
];

const searchResults = simpleSearch(docs, "TypeScript generics");
console.log("Search 'TypeScript generics':", searchResults.map(r => `${r.title} (${r.matchCount} matches)`));

// ───────────────────────────────────────────────────────────────────────────────
// 5. WINDOW FUNCTIONS IN RAW SQL
// ───────────────────────────────────────────────────────────────────────────────

console.log("\n=== 5. Window Functions ===");

/*
  Window functions perform calculations across a set of rows related to the
  current row — like GROUP BY but without collapsing rows. They run AFTER
  WHERE, GROUP BY, and HAVING filters are applied.

  Syntax:
    function_name() OVER (
      PARTITION BY col    -- divide rows into groups (like GROUP BY)
      ORDER BY col        -- row order within each partition
      ROWS BETWEEN ...    -- optional window frame
    )

  ROW_NUMBER, RANK, DENSE_RANK
  ─────────────────────────────
    SELECT
      user_id,
      amount,
      ROW_NUMBER()  OVER (PARTITION BY region ORDER BY amount DESC) AS row_num,
      RANK()        OVER (PARTITION BY region ORDER BY amount DESC) AS rank,
      DENSE_RANK()  OVER (PARTITION BY region ORDER BY amount DESC) AS dense_rank
    FROM orders;

  Difference between RANK and DENSE_RANK when two rows tie at amount = 500:
    ROW_NUMBER:  1, 2, 3  (always unique, arbitrary tiebreak)
    RANK:        1, 1, 3  (tied rows get same rank, gap after tie)
    DENSE_RANK:  1, 1, 2  (tied rows get same rank, NO gap)

  "Top N per group" — classic window function use case:
  Show the top 3 orders per region:

    SELECT * FROM (
      SELECT *,
        ROW_NUMBER() OVER (PARTITION BY region ORDER BY amount DESC) AS rn
      FROM orders
    ) ranked
    WHERE rn <= 3;

  LAG AND LEAD
  ─────────────
  LAG(col, n)  → value from n rows BEFORE current row
  LEAD(col, n) → value from n rows AFTER current row

  Useful for comparing a row to the previous/next row without a self-join:

    SELECT
      user_id,
      login_at,
      LAG(login_at)  OVER (PARTITION BY user_id ORDER BY login_at) AS prev_login,
      LEAD(login_at) OVER (PARTITION BY user_id ORDER BY login_at) AS next_login
    FROM user_sessions;

  RUNNING TOTALS
  ───────────────
  SUM() OVER with an ordered frame gives a cumulative (running) total:

    SELECT
      order_date,
      amount,
      SUM(amount) OVER (ORDER BY order_date
                        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
                       ) AS running_total
    FROM orders;

  USING WITH PRISMA $queryRaw
  ────────────────────────────
  Prisma supports template literal syntax which is safe from SQL injection.
  User input is automatically parameterized — do NOT use string concatenation.

    // SAFE: template literal (parameterized)
    const region = req.query.region;   // untrusted user input
    const rows = await prisma.$queryRaw`
      SELECT *, RANK() OVER (ORDER BY amount DESC) AS rank
      FROM orders
      WHERE region = ${region}         -- ← parameterized automatically
    `;

    // UNSAFE: string concatenation (SQL injection risk!)
    const rows2 = await prisma.$queryRawUnsafe(
      `SELECT * FROM orders WHERE region = '${region}'`  // NEVER DO THIS
    );

  Prisma wraps template literals with Prisma.sql internally, building a
  prepared statement. Always prefer template literals over $queryRawUnsafe.
*/

// Simulated window function: running total
interface SaleRow { date: string; amount: number }

function runningTotal(rows: SaleRow[]): Array<SaleRow & { runningTotal: number }> {
  let total = 0;
  return rows.map(row => {
    total += row.amount;
    return { ...row, runningTotal: total };
  });
}

function rankRows(rows: SaleRow[]): Array<SaleRow & { rank: number; denseRank: number }> {
  const sorted = [...rows].sort((a, b) => b.amount - a.amount);
  let rank = 1;
  let denseRank = 1;
  let prevAmount: number | null = null;
  let rankGap = 0;
  return sorted.map((row, i) => {
    if (prevAmount !== null && row.amount !== prevAmount) {
      rank = i + 1;
      denseRank++;
    }
    rankGap++;
    prevAmount = row.amount;
    return { ...row, rank, denseRank };
  });
}

const saleRows: SaleRow[] = [
  { date: "2024-01", amount: 500 },
  { date: "2024-02", amount: 300 },
  { date: "2024-03", amount: 800 },
  { date: "2024-04", amount: 300 }, // tie with 2024-02
];

console.log("Running totals:", runningTotal(saleRows));
console.log("Ranked (by amount desc):", rankRows(saleRows).map(r =>
  `${r.date}: amount=${r.amount} rank=${r.rank} denseRank=${r.denseRank}`
));

// ───────────────────────────────────────────────────────────────────────────────
// 6. OPTIMISTIC VS PESSIMISTIC LOCKING
// ───────────────────────────────────────────────────────────────────────────────

console.log("\n=== 6. Locking Strategies ===");

/*
  THE PROBLEM: LOST UPDATES
  ──────────────────────────
  Two users read account balance = $100 simultaneously.
  Both decide to deduct $50. Both update, setting balance = $50.
  Net effect: $50 lost. Correct balance should be $0.

  This is a "lost update" — a classic concurrency bug.

  ─────────────────────────────────────────────────────────────────
  OPTIMISTIC LOCKING — assume conflicts are RARE; detect after the fact
  ─────────────────────────────────────────────────────────────────

  Every row has a `version` integer (starts at 0). On every update:
    1. Read the row and note its version
    2. Compute the new state
    3. UPDATE ... WHERE id = ? AND version = ?   ← conditional on same version
       SET version = version + 1
    4. If 0 rows updated → conflict detected → retry or error

  Prisma example:

    // Step 1: read
    const account = await prisma.account.findUnique({ where: { id } });
    // account.version = 5, account.balance = 100

    // Step 2: attempt update (fails if version changed since we read)
    const updated = await prisma.account.updateMany({
      where: { id, version: account.version },  // ← the key condition
      data:  { balance: account.balance - 50, version: { increment: 1 } },
    });

    if (updated.count === 0) {
      throw new Error('Conflict: record was modified. Please retry.');
    }

  Best for: read-heavy workloads where conflicts are rare (social media likes,
  product catalog edits, non-financial updates).

  ─────────────────────────────────────────────────────────────────
  PESSIMISTIC LOCKING — assume conflicts are LIKELY; hold a DB lock
  ─────────────────────────────────────────────────────────────────

  Lock the row the moment you read it. Other transactions that try to read
  or write the same row block until the lock is released (at COMMIT/ROLLBACK).

  SQL: SELECT ... FOR UPDATE

    -- Transaction A acquires the lock
    BEGIN;
    SELECT * FROM accounts WHERE id = 1 FOR UPDATE;
    -- Transaction B's SELECT FOR UPDATE on id=1 will block here

    UPDATE accounts SET balance = balance - 50 WHERE id = 1;
    COMMIT;
    -- Transaction B's lock is now released and proceeds with fresh data

  With Prisma (requires $transaction + $queryRaw):

    await prisma.$transaction(async (tx) => {
      // Lock the row
      const [account] = await tx.$queryRaw<Account[]>`
        SELECT * FROM accounts WHERE id = ${id} FOR UPDATE
      `;
      if (account.balance < amount) throw new Error('Insufficient funds');

      await tx.account.update({
        where: { id },
        data:  { balance: account.balance - amount },
      });
    });

  FOR UPDATE SKIP LOCKED — job queue pattern:
  Grab one row from a job queue without blocking other workers:

    SELECT * FROM jobs
    WHERE status = 'PENDING'
    ORDER BY created_at
    LIMIT 1
    FOR UPDATE SKIP LOCKED;   -- skips rows locked by other workers

  WHEN TO USE WHICH
  ──────────────────
  Optimistic locking:
    + No blocking — readers and writers proceed in parallel
    + Higher throughput under low contention
    - Retry logic adds code complexity
    - Wasteful when conflicts are frequent (constant retries)
    Use for: product edits, config updates, anything not financial

  Pessimistic locking:
    + Guarantees no lost updates — simpler correctness reasoning
    + Right for high-contention, high-value operations
    - Blocking reduces throughput; risk of deadlock
    - Requires a DB transaction wrapper
    Use for: bank transfers, inventory decrement, seat reservation
*/

// Simulated optimistic locking
interface Account { id: number; balance: number; version: number }

function optimisticDeduct(account: Account, amount: number, db: Map<number, Account>): boolean {
  if (account.balance < amount) throw new Error("Insufficient funds");
  // Simulate "UPDATE WHERE version = ?" — returns false if version changed
  const current = db.get(account.id)!;
  if (current.version !== account.version) {
    console.log("  Conflict! Version changed — retry needed.");
    return false; // conflict
  }
  db.set(account.id, {
    ...current,
    balance: current.balance - amount,
    version: current.version + 1,
  });
  return true; // success
}

const accountsDb = new Map<number, Account>([
  [1, { id: 1, balance: 100, version: 0 }],
]);

const readSnapshot = { ...accountsDb.get(1)! }; // simulate read

// Simulate another writer updating between our read and write
accountsDb.set(1, { ...accountsDb.get(1)!, balance: 80, version: 1 });

const success = optimisticDeduct(readSnapshot, 50, accountsDb);
console.log("Optimistic deduct succeeded:", success); // false — conflict detected

// Now retry with fresh read
const freshRead = { ...accountsDb.get(1)! };
const retrySuccess = optimisticDeduct(freshRead, 50, accountsDb);
console.log("Retry succeeded:", retrySuccess, "New balance:", accountsDb.get(1)!.balance);

// ───────────────────────────────────────────────────────────────────────────────
// 7. QUERY OPTIMIZATION
// ───────────────────────────────────────────────────────────────────────────────

console.log("\n=== 7. Query Optimization ===");

/*
  EXPLAIN ANALYZE — READ THIS FIRST
  ──────────────────────────────────
  Prepend EXPLAIN ANALYZE to any query to see the execution plan:

    EXPLAIN ANALYZE
    SELECT * FROM posts WHERE user_id = 42 ORDER BY created_at DESC;

  Key fields to look at:
    Seq Scan        — reading every row in the table (bad on large tables)
    Index Scan      — using a B-tree index to find rows (good)
    Bitmap Scan     — using an index but reading heap pages in batches (okay)
    actual time     — real time taken (left = first row, right = all rows)
    rows            — estimated vs actual (large mismatch = stale statistics)
    cost            — planner's internal estimate (higher = slower)
    Buffers: hit    — reads from cache (good), read = disk I/O (bad)

  WHEN INDEXES AREN'T USED
  ─────────────────────────
  Mistake 1 — Function wrapping the indexed column:
    -- WRONG: the index on email is bypassed
    WHERE LOWER(email) = 'alice@example.com'

    -- FIX 1: functional index
    CREATE INDEX users_lower_email ON users (LOWER(email));

    -- FIX 2: store data normalized (always lowercase on insert)

  Mistake 2 — Wrong column order in composite index:
    -- Index: (region, created_at)
    WHERE created_at > '2024-01-01'          -- region not in WHERE → index unused
    WHERE region = 'APAC' AND created_at > '2024-01-01' -- ✅ uses index

    Rule: put equality columns first, range columns last in composite indexes.

  Mistake 3 — Low selectivity column:
    CREATE INDEX ON orders (status);  -- status has only 3 values
    -- PostgreSQL may choose a seq scan if > ~10% of rows match

  PARTIAL INDEX — index only a subset of rows
  ─────────────────────────────────────────────
  If you often query only PENDING jobs, don't index all statuses — index only
  the ones you care about:

    CREATE INDEX jobs_pending ON jobs (created_at)
    WHERE status = 'PENDING';

  This index is smaller, faster to build, and fits in cache more easily.
  The WHERE status = 'PENDING' in your query must match the index predicate.

  COVERING INDEX — satisfy the query from the index alone (no heap access)
  ─────────────────────────────────────────────────────────────────────────
  A standard index stores only the indexed columns. To return other columns
  the database must follow a pointer to the heap page (a "heap fetch").
  A covering index includes extra columns so the query never needs the heap:

    CREATE INDEX orders_cover ON orders (user_id)
    INCLUDE (amount, status, created_at);

    -- This query is now satisfied purely by the index:
    SELECT amount, status, created_at FROM orders WHERE user_id = 42;

  CONNECTION POOLING AND QUERY PERFORMANCE
  ─────────────────────────────────────────
  Opening a new PostgreSQL connection takes ~25ms and a few MB of memory.
  Under traffic, opening a new connection per request exhausts both.

  Solution: PgBouncer (external) or Prisma Accelerate pools connections.

    // Without pooling: 200 concurrent requests = 200 DB connections
    // With pooling:    200 concurrent requests → pool of 20 DB connections,
    //                  queue managed by PgBouncer

  Prisma Accelerate (cloud) configuration:

    const prisma = new PrismaClient({
      datasources: { db: { url: process.env.ACCELERATE_URL } },
    });

  PgBouncer pool_mode:
    session     — one DB connection per client session (default, least optimal)
    transaction — one DB connection per transaction (most common for APIs)
    statement   — one DB connection per statement (not usable with transactions)
*/

// No runtime code needed here — concept-heavy section
console.log("Optimization checklist:");
const optimizationChecklist = [
  "EXPLAIN ANALYZE before every schema/query change",
  "Index equality columns first, range columns last",
  "Avoid function calls on indexed columns in WHERE",
  "Use partial indexes for low-cardinality filtered queries",
  "Use INCLUDE columns to create covering indexes",
  "Enable connection pooling (PgBouncer or Prisma Accelerate)",
  "Run ANALYZE after bulk inserts to update planner statistics",
];
optimizationChecklist.forEach((tip, i) => console.log(`  ${i + 1}. ${tip}`));

// ───────────────────────────────────────────────────────────────────────────────
// 8. PRISMA MIDDLEWARE AND QUERY EVENTS
// ───────────────────────────────────────────────────────────────────────────────

console.log("\n=== 8. Prisma Middleware ===");

/*
  $use() — query middleware (runs before/after every Prisma operation)
  ─────────────────────────────────────────────────────────────────────
  Middleware receives the operation params, can modify them, call next(),
  and then modify or inspect the result. Think of it as Express middleware
  but for database calls.

  PATTERN 1: Soft Deletes
  ─────────────────────────
  Instead of DELETE, set a deletedAt timestamp. Middleware transparently
  filters out soft-deleted rows in all queries.

    prisma.$use(async (params, next) => {
      const softDeleteModels = ['Post', 'Comment'];

      if (softDeleteModels.includes(params.model ?? '')) {
        // Intercept delete → convert to update
        if (params.action === 'delete') {
          params.action = 'update';
          params.args.data = { deletedAt: new Date() };
        }
        if (params.action === 'deleteMany') {
          params.action = 'updateMany';
          params.args.data = { deletedAt: new Date() };
        }

        // Filter out soft-deleted rows from all find queries
        const readActions = ['findUnique','findFirst','findMany','findRaw','count'];
        if (readActions.includes(params.action)) {
          params.args = params.args ?? {};
          params.args.where = {
            ...params.args.where,
            deletedAt: null,
          };
        }
      }

      return next(params);
    });

  PATTERN 2: Slow Query Logging
  ──────────────────────────────
  Log any query that takes more than a threshold (e.g., 200ms):

    prisma.$use(async (params, next) => {
      const before = Date.now();
      const result = await next(params);
      const duration = Date.now() - before;

      if (duration > 200) {
        console.warn(`[SLOW QUERY] ${params.model}.${params.action} took ${duration}ms`);
        // Send to monitoring: Datadog, Sentry, etc.
      }

      return result;
    });

  PATTERN 3: Stripping Sensitive Fields from Output
  ───────────────────────────────────────────────────
  Never return password hashes to callers — strip them at the middleware layer:

    prisma.$use(async (params, next) => {
      const result = await next(params);

      if (params.model === 'User') {
        if (Array.isArray(result)) {
          result.forEach((user: any) => { delete user.passwordHash; });
        } else if (result && typeof result === 'object') {
          delete (result as any).passwordHash;
        }
      }

      return result;
    });

  PATTERN 4: Auto-setting Timestamps
  ────────────────────────────────────
  If Prisma schema doesn't handle @updatedAt automatically for some reason,
  or you want to stamp a custom field:

    prisma.$use(async (params, next) => {
      if (['create','update','upsert'].includes(params.action)) {
        params.args.data = {
          ...params.args.data,
          updatedAt: new Date(),
        };
      }
      return next(params);
    });

  QUERY EVENTS VS MIDDLEWARE
  ───────────────────────────
  Prisma also emits events you can listen to (read-only, cannot modify query):

    const prisma = new PrismaClient({ log: ['query'] });
    prisma.$on('query', (e) => {
      console.log(`Query: ${e.query}`);
      console.log(`Params: ${e.params}`);
      console.log(`Duration: ${e.duration}ms`);
    });

  Use events for logging/monitoring. Use middleware when you need to
  intercept and MODIFY the query or result.
*/

// Simulated Prisma middleware pipeline
type PrismaParams = { model: string; action: string; args: Record<string, unknown> };
type NextFn = (params: PrismaParams) => Promise<unknown>;
type Middleware = (params: PrismaParams, next: NextFn) => Promise<unknown>;

function buildMiddlewarePipeline(middlewares: Middleware[]) {
  return function runPipeline(params: PrismaParams): Promise<unknown> {
    let index = 0;
    const next: NextFn = async (p) => {
      if (index < middlewares.length) {
        const mw = middlewares[index++];
        return mw(p, next);
      }
      // Base: simulate the actual DB call
      return { id: 1, name: "Alice", passwordHash: "secret-hash" };
    };
    return next(params);
  };
}

const slowQueryMiddleware: Middleware = async (params, next) => {
  const start = Date.now();
  const result = await next(params);
  const ms = Date.now() - start;
  if (ms > 0) console.log(`  [middleware] ${params.model}.${params.action} → ${ms}ms`);
  return result;
};

const stripPasswordMiddleware: Middleware = async (params, next) => {
  const result = await next(params);
  if (params.model === "User" && result && typeof result === "object") {
    const clean = { ...(result as Record<string, unknown>) };
    delete clean.passwordHash;
    return clean;
  }
  return result;
};

const pipeline = buildMiddlewarePipeline([slowQueryMiddleware, stripPasswordMiddleware]);

pipeline({ model: "User", action: "findUnique", args: { where: { id: 1 } } }).then(result => {
  console.log("Result after middleware:", result); // passwordHash removed
});

// ───────────────────────────────────────────────────────────────────────────────
// PRACTICE Q&A
// ───────────────────────────────────────────────────────────────────────────────

console.log("\n=== Practice Q&A ===");

/*
  Q: You load 100 blog posts and for each post you load its author separately.
     What problem is this and how do you fix it?

  A: This is the N+1 problem. You are firing 1 query to get the posts and
     then N=100 additional queries — one per post — to load each author.
     Fix options:
       1. Use Prisma's `include: { author: true }` — generates a single JOIN.
       2. Use DataLoader to batch all authorId lookups into one
          `WHERE id IN (...)` query. DataLoader is best in GraphQL resolvers
          where you cannot easily add `include` at the call site.
       3. Write raw SQL with a JOIN via `prisma.$queryRaw`.


  Q: Why does `OFFSET 10000` get slower as the offset increases?
     What's the alternative?

  A: PostgreSQL must read and discard OFFSET rows before returning results.
     At OFFSET 10000 with LIMIT 20, the database touches 10,020 rows to
     return 20 — every extra page multiplies wasted work. This is O(N) in
     offset size and cannot be fixed with an index alone.
     Alternative: cursor-based (keyset) pagination. Instead of skipping rows,
     use a WHERE clause: WHERE id > $lastSeenId ORDER BY id LIMIT 20.
     The WHERE + ORDER BY combination uses an index, making each page O(log N)
     regardless of how deep into the dataset you are.


  Q: How do you safely pass user input to `prisma.$queryRaw`?

  A: Use template literal syntax (backtick string). Prisma automatically
     parameterizes every interpolated value ${value}, building a prepared
     statement. Never use string concatenation or $queryRawUnsafe with
     untrusted input.
       SAFE:   prisma.$queryRaw`SELECT * FROM posts WHERE user_id = ${userId}`
       UNSAFE: prisma.$queryRawUnsafe(`SELECT * FROM posts WHERE user_id = ${userId}`)
     The backtick form passes userId as a bound parameter ($1), making SQL
     injection structurally impossible.


  Q: When would you use `FOR UPDATE` instead of optimistic locking?

  A: Use FOR UPDATE (pessimistic locking) when:
     - Conflicts are frequent and retrying is expensive (bank transfers,
       inventory decrement, seat/ticket reservation).
     - The business rule absolutely cannot tolerate a lost update (financial
       transactions where correctness > throughput).
     - You are coordinating distributed workers on a shared queue
       (FOR UPDATE SKIP LOCKED pattern).
     Use optimistic locking (version column) when conflicts are rare and
     retrying is cheap — e.g., editing a blog post, updating profile info.
     Optimistic locking has higher throughput because readers never block.


  Q: What does a GIN index help with and why is it needed for full-text search?

  A: A GIN (Generalized Inverted Index) builds an inverted index: for every
     lexeme (stemmed word), it stores the list of rows containing that word.
     This is exactly the structure needed for full-text search — looking up
     which documents contain "generics" is a single index lookup rather than
     a sequential scan of every row.
     Without a GIN index, to_tsvector must be computed on every row at query
     time and every row must be checked — O(N) per query. With a GIN index on
     a stored tsvector column, each search is O(log N + result set size).
     GIN is also used for JSONB containment queries and array operators in
     PostgreSQL for the same reason: it pre-indexes every element/key.
*/

console.log("Q&A printed in source — see comments above for full answers.");

// ───────────────────────────────────────────────────────────────────────────────
// DEMO — Reference Card
// ───────────────────────────────────────────────────────────────────────────────

export default function runDemo(): void {
  console.log("\n" + "═".repeat(72));
  console.log("BACKEND 08 — ADVANCED QUERIES REFERENCE CARD");
  console.log("═".repeat(72));

  const card: Record<string, string[]> = {
    "N+1 Problem": [
      "Symptom: same query repeating N times with different IDs",
      "Fix A: prisma.findMany({ include: { relation: true } })",
      "Fix B: DataLoader — batch + cache per request tick",
      "Fix C: $queryRaw with an explicit JOIN",
      "Detect: enable log: ['query'] in PrismaClient",
    ],
    "Cursor Pagination": [
      "cursor = last seen record's ID (or sort-key tuple)",
      "findMany({ take, skip: 1, cursor: { id: lastId } })",
      "Fetch take+1 rows to detect hasNextPage",
      "Return nextCursor: null to signal end of results",
      "Keyset pagination for composite sort: (createdAt, id) < ($1, $2)",
    ],
    "Aggregations": [
      "prisma.model.aggregate({ _count, _sum, _avg, _min, _max })",
      "prisma.model.groupBy({ by, having, orderBy })",
      "_count: { select: { relation: true } } for related counts",
      "$queryRaw for PERCENTILE, FILTER, DISTINCT COUNT",
      "COUNT returns BigInt — wrap with Number(result[0].count)",
    ],
    "Full-Text Search": [
      "to_tsvector('english', col) → preprocessed lexeme document",
      "to_tsquery('english', query) → parsed search query",
      "@@ operator: WHERE tsvector_col @@ tsquery",
      "ts_rank(tsvector, tsquery) → relevance score (0..1)",
      "GIN index: CREATE INDEX ON posts USING GIN (search_vector)",
      "Fuzzy: pg_trgm extension + title % $1 similarity operator",
    ],
    "Window Functions": [
      "ROW_NUMBER() — unique sequential number (no ties)",
      "RANK()       — tied rows share rank; gap after tie",
      "DENSE_RANK() — tied rows share rank; no gap",
      "LAG(col, n) / LEAD(col, n) — previous/next row value",
      "SUM() OVER (ORDER BY date ROWS UNBOUNDED PRECEDING) — running total",
      "$queryRaw template literals are safe for user input",
    ],
    "Locking": [
      "Optimistic: version column, UPDATE WHERE version = $v",
      "Conflict if 0 rows updated → retry in app code",
      "Pessimistic: SELECT ... FOR UPDATE inside $transaction",
      "FOR UPDATE SKIP LOCKED → non-blocking job queue worker",
      "High contention / financial → pessimistic",
      "Low contention / edits      → optimistic",
    ],
    "Query Optimization": [
      "EXPLAIN ANALYZE: look for Seq Scan on large tables",
      "Composite index: equality columns first, range columns last",
      "Avoid functions on indexed columns in WHERE clause",
      "Partial index: WHERE status = 'PENDING' (smaller, faster)",
      "Covering index: INCLUDE (col1, col2) to avoid heap fetch",
      "Connection pooling: PgBouncer (transaction mode) or Prisma Accelerate",
    ],
    "Prisma Middleware": [
      "prisma.$use(async (params, next) => { ... })",
      "Soft delete: intercept 'delete' → convert to 'update' with deletedAt",
      "Slow queries: measure Date.now() delta around next(params)",
      "Strip fields: delete result.passwordHash before returning",
      "Events: prisma.$on('query', e => log(e.query, e.duration))",
    ],
  };

  for (const [topic, points] of Object.entries(card)) {
    console.log(`\n  ${topic.toUpperCase()}`);
    points.forEach(p => console.log(`    • ${p}`));
  }

  console.log("\n" + "═".repeat(72));
  console.log("Quick decision guide:");
  console.log("  Loading relations?          → include (JOIN) or DataLoader");
  console.log("  Paging live data?           → cursor pagination");
  console.log("  Aggregate report?           → groupBy / aggregate / $queryRaw");
  console.log("  Text search small table?    → ILIKE / contains");
  console.log("  Text search large table?    → tsvector + GIN index");
  console.log("  Fuzzy / typo-tolerant?      → pg_trgm");
  console.log("  Per-row ranking/comparison? → window functions");
  console.log("  Financial update?           → FOR UPDATE (pessimistic)");
  console.log("  Profile/content update?     → version column (optimistic)");
  console.log("  Slow queries?               → EXPLAIN ANALYZE + cover index");
  console.log("═".repeat(72) + "\n");
}

runDemo();
