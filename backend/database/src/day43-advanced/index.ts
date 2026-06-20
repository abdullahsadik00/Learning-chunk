// ════════════════════════════════════════════════════════════════
// DAY 43 — ADVANCED QUERIES: PAGINATION + AGGREGATIONS
// ════════════════════════════════════════════════════════════════
//
// What this day covers:
//   - Offset pagination (simple but broken at scale)
//   - Cursor-based pagination (correct and fast)
//   - Prisma aggregate() for COUNT, AVG, MIN, MAX
//   - groupBy with HAVING
//   - Raw SQL aggregations (GROUP BY + date functions)
//   - Full-text search patterns
//
// Run: npm run day43

import { PrismaClient } from '@prisma/client';
import { runPaginationDemos } from './pagination';
import { runAggregationDemos } from './aggregations';

const prisma = new PrismaClient();

async function main() {
  console.log('════════════════════════════════════════════════════════════════');
  console.log('DAY 43 — ADVANCED QUERIES');
  console.log('════════════════════════════════════════════════════════════════\n');

  console.log('▶ Section 1: Pagination');
  console.log('────────────────────────────────────────────────────────────────');
  await runPaginationDemos(prisma);

  console.log('\n▶ Section 2: Aggregations');
  console.log('────────────────────────────────────────────────────────────────');
  await runAggregationDemos(prisma);

  console.log('\n════════════════════════════════════════════════════════════════');
  console.log('Day 43 complete!');
  console.log('════════════════════════════════════════════════════════════════');
}

main()
  .catch((err) => {
    console.error('Day 43 failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
