// DAY 42 — PRISMA RELATIONS
//
// THE N+1 PROBLEM:
//   const posts = await prisma.post.findMany();           // 1 query
//   for (const post of posts) {
//     const author = await prisma.user.findUnique(...)    // N queries!
//   }
//   Total: N+1 database round-trips
//
// THE FIX:
//   const posts = await prisma.post.findMany({
//     include: { author: true }                          // 1 query with JOIN
//   });
//
// include vs select:
//   include: adds relations to the result (merges with default columns)
//   select: specifies EXACTLY which columns to return (must include ID manually)

import { PrismaClient } from '@prisma/client';

// ── 1. N+1 example (deliberately bad) ────────────────────────────────────────
async function demonstrateN1Problem(prisma: PrismaClient) {
  console.log('\n[N+1 PROBLEM — 1 + N queries for 5 posts]');

  // Query 1: get 5 posts
  const posts = await prisma.post.findMany({
    where: { published: true },
    take: 5,
    select: { id: true, title: true, authorId: true },
  });

  // Queries 2-6: fetch the author for EACH post individually
  // This is the N+1 pattern. With 100 posts → 101 DB round-trips.
  const postsWithAuthors = [];
  for (const post of posts) {
    // Each iteration is a separate SQL SELECT
    const author = await prisma.user.findUnique({
      where: { id: post.authorId },
      select: { name: true },
    });
    postsWithAuthors.push({ ...post, authorName: author?.name });
  }

  console.log('This is N+1: 1 query for posts + N queries for authors:');
  postsWithAuthors.forEach(p =>
    console.log(`  "${p.title}" by ${p.authorName}`)
  );
  console.log('  → Enable Prisma query logging to see the 6 SQL statements fired');
}

// ── 2. Fix with include ───────────────────────────────────────────────────────
async function demonstrateIncludeFix(prisma: PrismaClient) {
  console.log('\n[INCLUDE FIX — 1 query total]');

  // One SQL query with JOIN — Prisma handles the join automatically
  const posts = await prisma.post.findMany({
    where: { published: true },
    take: 5,
    include: { author: true },  // LEFT JOIN users ON users.id = posts.author_id
  });

  console.log('This is 1 query total (include does the JOIN):');
  posts.forEach(p =>
    console.log(`  "${p.title}" by ${p.author.name}`)
  );
}

// ── 3. Nested include ────────────────────────────────────────────────────────
//
// You can nest includes as deep as you need.
// Each level adds a JOIN. Deep nesting can get expensive — profile your queries.
// posts → author, posts → comments → comment author

async function nestedInclude(prisma: PrismaClient) {
  console.log('\n[NESTED INCLUDE — posts with author AND comments]');

  const posts = await prisma.post.findMany({
    where: { published: true },
    take: 2,
    include: {
      author: {
        select: { name: true, email: true },
      },
      comments: {
        take: 2,  // limit comments per post
        include: {
          author: { select: { name: true } },  // comment author's name
        },
      },
    },
  });

  posts.forEach(post => {
    console.log(`\n  Post: "${post.title}" by ${post.author.name}`);
    if (post.comments.length > 0) {
      post.comments.forEach(c =>
        console.log(`    Comment by ${c.author.name}: "${c.content.slice(0, 50)}..."`)
      );
    } else {
      console.log('    (no comments)');
    }
  });
}

// ── 4. select within include ─────────────────────────────────────────────────
//
// Instead of including the full author object (all columns),
// use select INSIDE include to get only the fields you need.
// This reduces the data transferred from the DB.

async function selectWithinInclude(prisma: PrismaClient) {
  console.log('\n[SELECT within INCLUDE — only author name, not full object]');

  const posts = await prisma.post.findMany({
    where: { published: true },
    take: 3,
    include: {
      author: {
        select: { name: true },  // We only need the name, not email/role/createdAt
      },
    },
  });

  posts.forEach(p => {
    // p.author only has { name: string } — TypeScript knows this!
    // p.author.email would be a compile error
    console.log(`  "${p.title}" — ${p.author.name}`);
  });
}

// ── 5. Relation counts ───────────────────────────────────────────────────────
//
// _count: { select: { relation: true } } → adds a count field
// This runs a single query with COUNT(*) subquery.
// Much better than loading all relations just to count them.
//
// SQL equivalent:
//   SELECT u.*, (SELECT COUNT(*) FROM posts WHERE author_id = u.id) as post_count
//   FROM users u

async function relationCounts(prisma: PrismaClient) {
  console.log('\n[RELATION COUNTS — count posts without loading them]');

  const usersWithCounts = await prisma.user.findMany({
    select: {
      name: true,
      email: true,
      _count: {
        select: {
          posts: true,      // how many posts this user has
          comments: true,   // how many comments this user has
        },
      },
    },
  });

  console.log('Users with post and comment counts:');
  usersWithCounts.forEach(u => {
    console.log(`  ${u.name}: ${u._count.posts} posts, ${u._count.comments} comments`);
  });
}

export async function runRelationDemos(prisma: PrismaClient): Promise<void> {
  await demonstrateN1Problem(prisma);
  await demonstrateIncludeFix(prisma);
  await nestedInclude(prisma);
  await selectWithinInclude(prisma);
  await relationCounts(prisma);
}
