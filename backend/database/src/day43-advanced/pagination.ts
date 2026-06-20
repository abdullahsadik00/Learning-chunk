// ════════════════════════════════════════════════════════════════
// DAY 43 — CURSOR-BASED PAGINATION
// ════════════════════════════════════════════════════════════════
//
// OFFSET PAGINATION (broken):
//   SELECT * FROM posts ORDER BY created_at DESC LIMIT 10 OFFSET 20
//   Problem: if post #15 is deleted between page 1 and page 2,
//   you skip post #21. If a new post is added, you duplicate post #20.
//   Also: OFFSET 1000000 → DB scans 1M rows to skip them. SLOW.
//
// CURSOR PAGINATION (correct):
//   SELECT * FROM posts WHERE created_at < $cursor ORDER BY created_at DESC LIMIT 10
//   The cursor is the last item's created_at (or ID).
//   Consistent: insertions/deletions between pages don't affect results.
//   Fast: uses an index scan, no full table scan.
//
// WHEN TO USE OFFSET:
//   Page numbers in a UI ("Page 5 of 12") — cursor can't do page numbers.
//   Small datasets where performance doesn't matter.

import { PrismaClient } from '@prisma/client';

// ── Offset Pagination ────────────────────────────────────────────────────────
//
// Returns: { items, total, pageCount, currentPage }
// Requires a separate COUNT(*) query to get the total.
// This is fine for small datasets but becomes expensive at scale.

async function offsetPaginate(prisma: PrismaClient, page: number, pageSize: number) {
  const skip = (page - 1) * pageSize;

  // Run both queries in parallel for efficiency
  const [items, total] = await Promise.all([
    prisma.post.findMany({
      where: { published: true },
      orderBy: { createdAt: 'desc' },
      take: pageSize,
      skip,               // OFFSET — skips this many rows before returning
      select: { id: true, title: true, viewCount: true },
    }),
    prisma.post.count({   // Separate COUNT(*) query — needed for "page X of Y"
      where: { published: true },
    }),
  ]);

  return {
    items,
    total,
    pageCount: Math.ceil(total / pageSize),
    currentPage: page,
  };
}

// ── Cursor Pagination ────────────────────────────────────────────────────────
//
// cursor: the `id` of the last item from the previous page.
//         null on the first page.
//
// skip: 1 — skip the cursor item itself (we already showed it last page).
//
// nextCursor: the `id` of the last item in the current page.
//             Send this to the client; they include it in their next request.
//             null if there are no more items.
//
// WHY FASTER AT SCALE:
//   OFFSET 100000 → DB reads and discards 100k rows before returning results.
//   Cursor WHERE id > 100000 → DB starts reading from id=100001 via the index.
//   The index lets it jump directly to the right place.

async function cursorPaginate(
  prisma: PrismaClient,
  cursor: number | null,
  pageSize: number
) {
  const items = await prisma.post.findMany({
    where: { published: true },
    orderBy: { id: 'asc' },
    take: pageSize,
    // Only add cursor + skip if we're past the first page
    ...(cursor != null ? {
      cursor: { id: cursor },  // Start from this item (inclusive)
      skip: 1,                 // But skip the cursor item itself
    } : {}),
    select: { id: true, title: true, viewCount: true },
  });

  // The next cursor is the id of the last item we returned.
  // If we got fewer items than pageSize, we've reached the end.
  const nextCursor = items.length === pageSize
    ? items[items.length - 1].id
    : null;

  return { items, nextCursor };
}

export async function runPaginationDemos(prisma: PrismaClient): Promise<void> {
  console.log('\n[OFFSET PAGINATION]');
  const page1Start = Date.now();
  const page1 = await offsetPaginate(prisma, 1, 5);
  const page1Time = Date.now() - page1Start;
  console.log(`Page 1 of ${page1.pageCount} (${page1.total} total published posts), fetched in ${page1Time}ms:`);
  page1.items.forEach(p => console.log(`  [${p.id}] ${p.title}`));

  const page2Start = Date.now();
  const page2 = await offsetPaginate(prisma, 2, 5);
  const page2Time = Date.now() - page2Start;
  console.log(`\nPage 2 of ${page2.pageCount}, fetched in ${page2Time}ms:`);
  page2.items.forEach(p => console.log(`  [${p.id}] ${p.title}`));
  console.log('  Problem: if a post is inserted/deleted, you see skips or duplicates.');
  console.log('  Also: OFFSET N scans N rows to skip them. Slow at large N.');

  console.log('\n[CURSOR PAGINATION]');

  // First page: no cursor
  const cursorPage1Start = Date.now();
  const cursorPage1 = await cursorPaginate(prisma, null, 5);
  const cursorPage1Time = Date.now() - cursorPage1Start;
  console.log(`Cursor page 1, fetched in ${cursorPage1Time}ms:`);
  cursorPage1.items.forEach(p => console.log(`  [${p.id}] ${p.title}`));
  console.log(`  Next cursor: ${cursorPage1.nextCursor}`);

  // Second page: use the cursor from page 1
  if (cursorPage1.nextCursor) {
    const cursorPage2Start = Date.now();
    const cursorPage2 = await cursorPaginate(prisma, cursorPage1.nextCursor, 5);
    const cursorPage2Time = Date.now() - cursorPage2Start;
    console.log(`\nCursor page 2 (cursor=${cursorPage1.nextCursor}), fetched in ${cursorPage2Time}ms:`);
    cursorPage2.items.forEach(p => console.log(`  [${p.id}] ${p.title}`));
    console.log(`  Next cursor: ${cursorPage2.nextCursor ?? 'null (last page)'}`);
    console.log('  Fast at any offset — uses index scan, no skipping.');
  }
}
