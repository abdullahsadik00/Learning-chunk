// ════════════════════════════════════════════════════════════════
// DAY 42 — PRISMA ORM: CRUD + RELATIONS
// ════════════════════════════════════════════════════════════════
//
// What this day covers:
//   - Prisma CRUD: findUnique, findMany, create, update, upsert, delete
//   - Nested writes (create related records in one operation)
//   - Select vs Include (controlling what data you get back)
//   - The N+1 problem and how Prisma's include solves it
//   - Relation counts
//
// Run: npm run day42

import { PrismaClient } from '@prisma/client';
import { runCRUDDemos } from './crud';
import { runRelationDemos } from './relations';

const prisma = new PrismaClient();

async function main() {
  console.log('════════════════════════════════════════════════════════════════');
  console.log('DAY 42 — PRISMA ORM');
  console.log('════════════════════════════════════════════════════════════════\n');

  console.log('▶ Section 1: CRUD Operations');
  console.log('────────────────────────────────────────────────────────────────');
  await runCRUDDemos(prisma);

  console.log('\n▶ Section 2: Relations & N+1');
  console.log('────────────────────────────────────────────────────────────────');
  await runRelationDemos(prisma);

  console.log('\n════════════════════════════════════════════════════════════════');
  console.log('Day 42 complete!');
  console.log('════════════════════════════════════════════════════════════════');
}

main()
  .catch((err) => {
    console.error('Day 42 failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
