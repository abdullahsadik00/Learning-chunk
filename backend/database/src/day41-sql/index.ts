// ════════════════════════════════════════════════════════════════
// DAY 41 — SQL FUNDAMENTALS + INDEX ANALYSIS
// ════════════════════════════════════════════════════════════════
//
// What this day covers:
//   - Raw SQL via Prisma's $queryRaw and $executeRaw
//   - SELECT, WHERE, ORDER BY, LIMIT, JOINs
//   - Aggregations: COUNT, AVG, GROUP BY, HAVING
//   - ACID transactions
//   - Index types and EXPLAIN QUERY PLAN
//
// Pre-requisites:
//   npm run db:setup   (runs prisma migrate dev)
//   npm run db:seed    (populates the database)
//
// Run: npm run day41

import { PrismaClient } from '@prisma/client';
import { runSQLDemos } from './queries';
import { runIndexDemos } from './indexes';

const prisma = new PrismaClient();

async function main() {
  console.log('════════════════════════════════════════════════════════════════');
  console.log('DAY 41 — SQL FUNDAMENTALS');
  console.log('════════════════════════════════════════════════════════════════\n');

  console.log('▶ Section 1: SQL Queries');
  console.log('────────────────────────────────────────────────────────────────');
  await runSQLDemos(prisma);

  console.log('\n▶ Section 2: Index Analysis');
  console.log('────────────────────────────────────────────────────────────────');
  await runIndexDemos(prisma);

  console.log('\n════════════════════════════════════════════════════════════════');
  console.log('Day 41 complete!');
  console.log('════════════════════════════════════════════════════════════════');
}

main()
  .catch((err) => {
    console.error('Day 41 failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    // Always disconnect — Prisma keeps a connection pool open.
    // Without this, ts-node won't exit cleanly.
    await prisma.$disconnect();
  });
