// ════════════════════════════════════════════════════════════════
// DAY 42 — PRISMA ORM
// ════════════════════════════════════════════════════════════════
//
// WHY PRISMA?
//   • Type-safe: TypeScript knows the shape of every query result
//   • Auto-completion: editor knows all your table columns
//   • Migrations: schema changes are tracked and reversible
//   • No SQL injection: Prisma parameterizes all queries automatically
//
// PRISMA CLIENT vs RAW SQL:
//   Use Prisma Client: 95% of your queries (CRUD, relations)
//   Use $queryRaw: complex aggregations, window functions, full-text search
//
// SCHEMA → TYPES:
//   Prisma reads your schema.prisma and generates TypeScript types.
//   import type { User, Post } from '@prisma/client';
//   These types are ALWAYS in sync with your DB schema.

import { PrismaClient } from '@prisma/client';

// ── 1. findUnique vs findFirst ────────────────────────────────────────────────
//
// findUnique:
//   - Requires a unique field (id, email, or a @@unique composite)
//   - Adds LIMIT 1 at the DB level (optimized)
//   - Returns: T | null
//   - TypeScript knows the result is one object or null
//
// findFirst:
//   - Accepts any `where` clause (including non-unique fields)
//   - Returns the first match (useful for "get any post with this tag")
//   - Also adds LIMIT 1, but without the uniqueness guarantee
//   - Use when you don't have a unique field to query by

async function findDemos(prisma: PrismaClient) {
  console.log('\n[findUnique vs findFirst]');

  // findUnique: must use a unique field
  const userByEmail = await prisma.user.findUnique({
    where: { email: 'alice@example.com' },
  });
  console.log(`findUnique (by email): ${userByEmail?.name ?? 'not found'}`);

  // findFirst: any where clause, no uniqueness required
  // Here we find the first post with more than 1000 views
  const popularPost = await prisma.post.findFirst({
    where: { viewCount: { gt: 1000 }, published: true },
    orderBy: { viewCount: 'desc' },
  });
  console.log(`findFirst (view_count > 1000): "${popularPost?.title ?? 'none'}"`);
}

// ── 2. findMany with filters ──────────────────────────────────────────────────
//
// Prisma's where clause maps to SQL WHERE with AND by default.
// Use `OR: []` for OR conditions, `NOT: {}` for negation.
//
// Pagination:
//   take: equivalent to LIMIT
//   skip: equivalent to OFFSET
//   (See day43 for cursor-based pagination, which is better for large datasets)

async function findManyDemos(prisma: PrismaClient) {
  console.log('\n[findMany — filters, sorting, pagination]');

  // Typical list query: published posts sorted by views, page 1
  const posts = await prisma.post.findMany({
    where: {
      published: true,
      viewCount: { gte: 500 },  // gte = greater than or equal (SQL: >=)
    },
    orderBy: { viewCount: 'desc' },
    take: 5,   // LIMIT 5
    skip: 0,   // OFFSET 0 (page 1)
    select: { id: true, title: true, viewCount: true },
  });

  console.log('Published posts with >= 500 views (top 5):');
  posts.forEach(p => console.log(`  [${p.viewCount}] ${p.title}`));
}

// ── 3. create vs createMany ───────────────────────────────────────────────────
//
// create:
//   - Inserts a single record
//   - Supports nested writes (create related records in same operation)
//   - Returns the created record (with generated id)
//   - Runs Prisma middleware (if you have pre/post hooks)
//
// createMany:
//   - Inserts multiple records in one SQL statement (batch INSERT)
//   - DOES NOT support nested writes
//   - SQLite: does not return created records (use findMany after)
//   - DOES NOT run middleware hooks
//   - Use for bulk inserts where you don't need hooks or nested relations

async function createDemos(prisma: PrismaClient) {
  console.log('\n[create vs createMany]');

  // create: single record, returns the created object
  const newUser = await prisma.user.create({
    data: {
      email: `test-${Date.now()}@example.com`,
      name: 'Test User',
      role: 'user',
    },
  });
  console.log(`create: Created user id=${newUser.id} (${newUser.email})`);

  // Cleanup: delete the test user
  await prisma.user.delete({ where: { id: newUser.id } });
  console.log(`  (cleaned up test user ${newUser.id})`);
}

// ── 4. update vs upsert ──────────────────────────────────────────────────────
//
// update:
//   - Fails if the record doesn't exist (throws PrismaClientKnownRequestError)
//   - Use when you KNOW the record exists (e.g., update a view count)
//   - Atomic increment: { viewCount: { increment: 1 } } → SQL: view_count = view_count + 1
//
// upsert:
//   - UPDATE if record exists, INSERT if it doesn't
//   - Idempotent: safe to call multiple times with same data
//   - Use for: setting user preferences, sync operations, external ID mapping
//   - SQL: INSERT ... ON CONFLICT DO UPDATE

async function updateDemos(prisma: PrismaClient) {
  console.log('\n[update vs upsert]');

  // Atomic increment: safe under concurrent requests
  // SQL: UPDATE posts SET view_count = view_count + 1 WHERE id = 1
  const updated = await prisma.post.update({
    where: { id: 1 },
    data: { viewCount: { increment: 1 } },
    select: { id: true, viewCount: true, title: true },
  });
  console.log(`update (increment viewCount): Post ${updated.id} now has ${updated.viewCount} views`);

  // upsert: create a user if not exists, update if exists
  // Useful for OAuth logins: "create or update user from GitHub profile"
  const upserted = await prisma.user.upsert({
    where: { email: 'upsert-demo@example.com' },
    create: { email: 'upsert-demo@example.com', name: 'Upsert Demo User' },
    update: { name: 'Upsert Demo User (updated)' },
    select: { id: true, email: true, name: true },
  });
  console.log(`upsert: User "${upserted.name}" (id=${upserted.id})`);

  // Cleanup
  await prisma.user.delete({ where: { id: upserted.id } });
}

// ── 5. delete vs deleteMany ──────────────────────────────────────────────────
//
// delete:
//   - Deletes a single record by unique identifier
//   - Fails if record doesn't exist
//
// deleteMany:
//   - Deletes ALL records matching the where clause
//   - Returns { count: number } — how many rows were deleted
//   - ALWAYS use a `where` clause unless you intentionally want to delete everything
//   - No where clause = DELETE FROM table (drops ALL rows, no confirmation!)

async function deleteDemos(prisma: PrismaClient) {
  console.log('\n[delete vs deleteMany]');

  // Create some temp records to delete
  await prisma.user.createMany({
    data: [
      { email: 'del1@example.com', name: 'Del User 1' },
      { email: 'del2@example.com', name: 'Del User 2' },
    ],
  });

  // deleteMany with where: deletes matching records, returns count
  const result = await prisma.user.deleteMany({
    where: {
      email: { in: ['del1@example.com', 'del2@example.com'] },
    },
  });
  console.log(`deleteMany: Deleted ${result.count} test users`);
  console.log('  Note: deleteMany without `where` deletes ALL rows!');
}

// ── 6. Nested writes ─────────────────────────────────────────────────────────
//
// Prisma can create a parent and its children in a single database transaction.
// This is called a "nested write". It's atomic: if the post creation fails,
// the user creation (from the same operation) is rolled back too.
//
// SQL equivalent:
//   BEGIN;
//   INSERT INTO users (name, email) VALUES (...) RETURNING id;
//   INSERT INTO posts (author_id, title, ...) VALUES ($user_id, ...);
//   COMMIT;

async function nestedWriteDemo(prisma: PrismaClient) {
  console.log('\n[Nested writes — create user WITH post in one transaction]');

  const userWithPost = await prisma.user.create({
    data: {
      email: `nested-${Date.now()}@example.com`,
      name: 'Nested Write Demo',
      posts: {
        // This creates a post and links it to the new user automatically
        create: [
          {
            title: 'My First Nested Post',
            content: 'Created in the same transaction as the user.',
            published: true,
          },
        ],
      },
    },
    // include returns the created user WITH their posts
    include: { posts: true },
  });

  console.log(`Created user "${userWithPost.name}" with ${userWithPost.posts.length} post(s)`);
  console.log(`  Post: "${userWithPost.posts[0].title}"`);

  // Cleanup: deleting user cascades to posts (onDelete: Cascade in schema)
  await prisma.user.delete({ where: { id: userWithPost.id } });
  console.log('  (cleaned up nested write demo)');
}

// ── 7. select vs include ──────────────────────────────────────────────────────
//
// select: Return ONLY the specified fields. Must explicitly list everything.
//         Can be nested to select fields from relations.
//         ✅ Use when you want minimal data transfer.
//
// include: Add relations to the default result (which includes all scalar fields).
//          Easier to use, but transfers all scalar columns.
//          ✅ Use when you want the full record PLUS relations.

async function selectVsInclude(prisma: PrismaClient) {
  console.log('\n[select — return only specific fields]');

  // select: only get id and title (minimal payload)
  const postTitles = await prisma.post.findMany({
    where: { published: true },
    select: { id: true, title: true },  // TypeScript return type: { id: number; title: string }[]
    take: 3,
  });

  console.log('Posts with select (id + title only):');
  postTitles.forEach(p => console.log(`  [${p.id}] ${p.title}`));
  // Note: p.viewCount would be a TypeScript error here — it wasn't selected!

  console.log('\n[include — eager load relations]');

  // include: get posts WITH their full author object
  const postsWithAuthor = await prisma.post.findMany({
    where: { published: true },
    include: { author: true },
    take: 3,
  });

  console.log('Posts with include (full author object):');
  postsWithAuthor.forEach(p =>
    console.log(`  "${p.title}" by ${p.author.name} (${p.author.email})`)
  );
}

export async function runCRUDDemos(prisma: PrismaClient): Promise<void> {
  await findDemos(prisma);
  await findManyDemos(prisma);
  await createDemos(prisma);
  await updateDemos(prisma);
  await deleteDemos(prisma);
  await nestedWriteDemo(prisma);
  await selectVsInclude(prisma);
}
