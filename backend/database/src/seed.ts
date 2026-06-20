// ════════════════════════════════════════════════════════════════
// SEED SCRIPT — Populate the database with realistic data
// ════════════════════════════════════════════════════════════════
//
// Run with: npm run db:seed
// Or reset everything: npm run db:reset
//
// WHY DELETE IN THIS ORDER?
//   Foreign key constraints prevent deleting parent records when child
//   records reference them. If we try to delete users first, SQLite
//   will throw "FOREIGN KEY constraint failed" because posts reference
//   users via author_id.
//
//   Correct deletion order (children before parents):
//     1. comments (references posts AND users)
//     2. posts    (references users)
//     3. users    (no FK dependencies)

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...\n');

  // ── Step 1: Clear existing data ──────────────────────────────
  // Must delete in FK dependency order. Prisma wraps each deleteMany
  // in a transaction automatically, but we do them sequentially to
  // respect constraints.
  console.log('Clearing existing data...');
  await prisma.$transaction([
    prisma.comment.deleteMany(),  // Must go first — references posts + users
    prisma.post.deleteMany(),     // Must go second — references users
    prisma.user.deleteMany(),     // Last — no FK references
  ]);
  console.log('  ✓ Database cleared\n');

  // ── Step 2: Create Users ──────────────────────────────────────
  // We create 5 realistic users. One admin, four regular users.
  // Using createMany() here because we don't need middleware hooks
  // and we're not using nested writes.
  console.log('Creating users...');
  await prisma.user.createMany({
    data: [
      { email: 'alice@example.com', name: 'Alice Chen', role: 'admin' },
      { email: 'bob@example.com', name: 'Bob Martinez', role: 'user' },
      { email: 'carol@example.com', name: 'Carol Johnson', role: 'user' },
      { email: 'david@example.com', name: 'David Kim', role: 'user' },
      { email: 'eve@example.com', name: 'Eve Patel', role: 'user' },
    ],
  });

  // Fetch users to get their auto-generated IDs
  const users = await prisma.user.findMany({ orderBy: { id: 'asc' } });
  console.log(`  ✓ Created ${users.length} users\n`);

  // ── Step 3: Create Posts ──────────────────────────────────────
  // 20 posts with varied states:
  //   - published vs draft
  //   - varied view counts (simulates popular vs new posts)
  //   - tags stored as JSON strings (SQLite doesn't have arrays)
  //
  // NOTE: Tags are stored as JSON strings because SQLite has no
  // native array type. In PostgreSQL you'd use TEXT[] or JSONB[].
  // In production code, JSON.parse(post.tags) to get the array back.
  console.log('Creating posts...');

  const postData = [
    {
      authorId: users[0].id,
      title: 'Understanding JavaScript Closures',
      content: 'Closures are one of the most powerful features in JavaScript. A closure gives you access to an outer function scope from an inner function, even after the outer function has returned.',
      published: true,
      viewCount: 1523,
      tags: JSON.stringify(['javascript', 'fundamentals', 'closures']),
    },
    {
      authorId: users[0].id,
      title: 'TypeScript Generics Deep Dive',
      content: 'Generics allow you to write reusable, type-safe code. Instead of writing the same function for different types, you write it once with a type parameter.',
      published: true,
      viewCount: 892,
      tags: JSON.stringify(['typescript', 'generics', 'advanced']),
    },
    {
      authorId: users[1].id,
      title: 'React Hooks: useEffect Explained',
      content: 'useEffect runs after every render by default. Understanding the dependency array is crucial for avoiding infinite loops and stale closures.',
      published: true,
      viewCount: 2341,
      tags: JSON.stringify(['react', 'hooks', 'useEffect']),
    },
    {
      authorId: users[1].id,
      title: 'Building a REST API with Express',
      content: 'Express is minimal and flexible. This guide covers routing, middleware, error handling, and connecting to a database.',
      published: true,
      viewCount: 674,
      tags: JSON.stringify(['nodejs', 'express', 'rest-api']),
    },
    {
      authorId: users[2].id,
      title: 'SQL Joins Visualized',
      content: 'INNER JOIN returns only matching rows. LEFT JOIN returns all left rows plus matching right rows. Understanding the difference prevents data loss in your queries.',
      published: true,
      viewCount: 1102,
      tags: JSON.stringify(['sql', 'database', 'joins']),
    },
    {
      authorId: users[2].id,
      title: 'CSS Grid vs Flexbox: When to Use Which',
      content: 'Flexbox is one-dimensional (row OR column). Grid is two-dimensional (row AND column). Use Flexbox for components, Grid for page layouts.',
      published: true,
      viewCount: 789,
      tags: JSON.stringify(['css', 'grid', 'flexbox', 'frontend']),
    },
    {
      authorId: users[3].id,
      title: 'Async/Await vs Promises',
      content: 'Async/await is syntactic sugar over Promises. Under the hood, async functions return Promises. The benefit is cleaner, more readable code for sequential async operations.',
      published: true,
      viewCount: 445,
      tags: JSON.stringify(['javascript', 'async', 'promises']),
    },
    {
      authorId: users[3].id,
      title: 'Docker for Node.js Developers',
      content: 'Docker containers package your app with its dependencies. Your app runs the same way in development, staging, and production. No more "works on my machine".',
      published: true,
      viewCount: 1876,
      tags: JSON.stringify(['docker', 'devops', 'nodejs']),
    },
    {
      authorId: users[4].id,
      title: 'Redis Caching Strategies',
      content: 'Cache-aside (lazy loading): app checks cache first, fetches from DB on miss, then populates cache. Write-through: app writes to cache and DB simultaneously.',
      published: true,
      viewCount: 334,
      tags: JSON.stringify(['redis', 'caching', 'performance']),
    },
    {
      authorId: users[4].id,
      title: 'Database Indexing Explained',
      content: 'An index is a separate data structure (usually B-Tree) that lets the database find rows without scanning the entire table. The trade-off: faster reads, slower writes.',
      published: true,
      viewCount: 2678,
      tags: JSON.stringify(['database', 'performance', 'indexing']),
    },
    {
      authorId: users[0].id,
      title: 'Draft: WebSockets vs Server-Sent Events',
      content: 'WebSockets: bidirectional, full-duplex. Good for chat, multiplayer games. Server-Sent Events: server-to-client only. Good for live feeds, notifications. SSE is simpler to implement.',
      published: false,
      viewCount: 0,
      tags: JSON.stringify(['websockets', 'sse', 'real-time']),
    },
    {
      authorId: users[1].id,
      title: 'Draft: Microservices vs Monolith',
      content: 'Start with a monolith. Extract services when you have clear boundaries, team scaling issues, or independent deployment needs. Microservices add operational complexity.',
      published: false,
      viewCount: 12,
      tags: JSON.stringify(['architecture', 'microservices', 'monolith']),
    },
    {
      authorId: users[2].id,
      title: 'JWT Authentication Best Practices',
      content: 'Store JWTs in httpOnly cookies, not localStorage. Set short expiry (15 minutes) with refresh tokens. Validate the signature on every request. Never store sensitive data in the payload.',
      published: true,
      viewCount: 3421,
      tags: JSON.stringify(['security', 'jwt', 'authentication']),
    },
    {
      authorId: users[3].id,
      title: 'Node.js Event Loop Internals',
      content: 'The event loop processes phases in order: timers (setTimeout/setInterval), pending callbacks, idle/prepare, poll (I/O), check (setImmediate), close callbacks. Understanding this prevents subtle bugs.',
      published: true,
      viewCount: 987,
      tags: JSON.stringify(['nodejs', 'event-loop', 'performance']),
    },
    {
      authorId: users[4].id,
      title: 'PostgreSQL vs MySQL in 2024',
      content: 'PostgreSQL: better standards compliance, advanced features (JSONB, arrays, window functions, full-text search). MySQL: faster for simple queries, more hosting options. Use PostgreSQL for new projects.',
      published: true,
      viewCount: 1234,
      tags: JSON.stringify(['database', 'postgresql', 'mysql']),
    },
    {
      authorId: users[0].id,
      title: 'Prisma ORM vs TypeORM vs Drizzle',
      content: 'Prisma: best DX, auto-generated types, migration UI. TypeORM: legacy projects, decorator-based. Drizzle: lightweight, SQL-like syntax, near-zero overhead. Prisma for new TypeScript projects.',
      published: true,
      viewCount: 567,
      tags: JSON.stringify(['orm', 'prisma', 'typescript', 'database']),
    },
    {
      authorId: users[1].id,
      title: 'Rate Limiting Strategies',
      content: 'Fixed window: count resets every minute. Sliding window: count based on rolling time window. Token bucket: burst-friendly. Leaky bucket: smooth output. Use Redis INCR for distributed rate limiting.',
      published: true,
      viewCount: 289,
      tags: JSON.stringify(['api', 'rate-limiting', 'redis']),
    },
    {
      authorId: users[2].id,
      title: 'Draft: GraphQL vs REST',
      content: 'GraphQL: one endpoint, client specifies shape of response, no over/under-fetching. REST: multiple endpoints, fixed response shapes, HTTP caching works naturally. Choose based on client diversity.',
      published: false,
      viewCount: 0,
      tags: JSON.stringify(['graphql', 'rest', 'api-design']),
    },
    {
      authorId: users[3].id,
      title: 'Zustand vs Redux for State Management',
      content: 'Redux: verbose but explicit, great DevTools, time-travel debugging. Zustand: minimal API, no boilerplate, works great for medium complexity. Use Zustand for new React apps.',
      published: true,
      viewCount: 743,
      tags: JSON.stringify(['react', 'state-management', 'zustand', 'redux']),
    },
    {
      authorId: users[4].id,
      title: 'Monorepo with Turborepo',
      content: 'Turborepo orchestrates builds across packages, caches outputs, and runs tasks in parallel. Perfect for shared component libraries, shared TypeScript configs, and coordinated deployments.',
      published: true,
      viewCount: 412,
      tags: JSON.stringify(['monorepo', 'turborepo', 'devops']),
    },
  ];

  await prisma.post.createMany({ data: postData });
  const posts = await prisma.post.findMany({ orderBy: { id: 'asc' } });
  console.log(`  ✓ Created ${posts.length} posts\n`);

  // ── Step 4: Create Comments ───────────────────────────────────
  // 50 comments distributed across posts with realistic content.
  // We distribute more comments on popular published posts.
  console.log('Creating comments...');

  const commentContents = [
    'Great explanation! This cleared up a lot of confusion for me.',
    'I wish I had read this before building my last project.',
    'Could you expand on the performance implications here?',
    'This is exactly what I was looking for. Thank you!',
    'I disagree with point 3. In my experience, the trade-offs are different.',
    'Bookmarked. This is the best explanation I\'ve found on this topic.',
    'How does this work with SSR / Next.js?',
    'The diagram really helps visualize the concept.',
    'I made the mistake described here last week. Cost me 2 days.',
    'Any recommended resources for diving deeper?',
    'Clean and concise. More posts like this please.',
    'What about the edge case where the user is offline?',
    'We use this pattern at work and it scales well.',
    'Minor typo in paragraph 3, but great content overall.',
    'This should be in every junior dev\'s reading list.',
    'I tried the code and it works perfectly on Node 20.',
    'How does this compare to the approach used in framework X?',
    'The N+1 section saved my production app last month.',
    'Excellent write-up. The examples are practical and clear.',
    'Finally someone explains this without hand-waving!',
  ];

  // Build 50 comments: more on popular posts, at least 1 on each published post
  const commentData: Array<{ postId: number; authorId: number; content: string }> = [];

  const publishedPosts = posts.filter(p => p.published);

  // Each published post gets at least 2 comments
  for (const post of publishedPosts) {
    const commentCount = Math.min(Math.ceil(post.viewCount / 400) + 1, 6);
    for (let i = 0; i < commentCount && commentData.length < 50; i++) {
      commentData.push({
        postId: post.id,
        // Rotate through users, ensuring the author isn't always commenting on their own posts
        authorId: users[(users.findIndex(u => u.id === post.authorId) + i + 1) % users.length].id,
        content: commentContents[(commentData.length) % commentContents.length],
      });
    }
  }

  // Fill up to 50 comments on the most-viewed posts
  while (commentData.length < 50) {
    const post = publishedPosts[commentData.length % publishedPosts.length];
    commentData.push({
      postId: post.id,
      authorId: users[commentData.length % users.length].id,
      content: commentContents[commentData.length % commentContents.length],
    });
  }

  await prisma.comment.createMany({ data: commentData });
  console.log(`  ✓ Created ${commentData.length} comments\n`);

  console.log('✅ Seed complete!');
  console.log(`   Users:    ${users.length}`);
  console.log(`   Posts:    ${posts.length} (${publishedPosts.length} published, ${posts.length - publishedPosts.length} draft)`);
  console.log(`   Comments: ${commentData.length}`);
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
