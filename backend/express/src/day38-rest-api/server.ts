// ════════════════════════════════════════════════════════════════
// DAY 38 — REST API DESIGN
// ════════════════════════════════════════════════════════════════
//
// Run with: npm run day38
//
// REST RESOURCE NAMING:
//   ✅ GET    /api/posts           — list all posts
//   ✅ GET    /api/posts/:id       — get one post
//   ✅ POST   /api/posts           — create post (body has data)
//   ✅ PATCH  /api/posts/:id       — partial update (only fields sent)
//   ✅ PUT    /api/posts/:id       — full replacement (all fields required)
//   ✅ DELETE /api/posts/:id       — delete
//
//   ❌ GET  /api/getPosts          — verb in URL (not RESTful)
//   ❌ POST /api/posts/delete/:id  — wrong method for delete
//   ❌ GET  /api/posts/create      — GET should never mutate state
//
// NESTED RESOURCES:
//   /api/posts/:id/comments        — comments scoped to a post
//   This is clearer than /api/comments?postId= because:
//     - The parent (post) is validated in the URL itself
//     - The relationship is explicit in the path
//     - 404 on the parent naturally propagates
//
// STATUS CODES THAT MATTER:
//   200 OK                 — successful GET / PATCH
//   201 Created            — successful POST (include Location header)
//   204 No Content         — successful DELETE (no body)
//   400 Bad Request        — validation error (include field-level errors)
//   401 Unauthorized       — not authenticated (no valid token)
//   403 Forbidden          — authenticated but no permission
//   404 Not Found          — resource doesn't exist
//   409 Conflict           — duplicate (e.g. email already taken)
//   422 Unprocessable      — valid JSON but fails business rules
//   429 Too Many Requests  — rate limited
//   500 Internal Error     — unexpected error (never leak stack traces)

import express, { Request, Response, NextFunction } from 'express';

const app  = express();
const PORT = 3002;

app.use(express.json({ limit: '10kb' }));

// ─────────────────────────────────────────────────────────────────
// IN-MEMORY DATA STORE
// In production this would be a database. For teaching, plain objects
// are perfect — focus on HTTP semantics, not ORM setup.
// ─────────────────────────────────────────────────────────────────
interface Post {
  id:        string;
  title:     string;
  body:      string;
  author:    string;
  tags:      string[];
  createdAt: string;
  updatedAt: string;
}

interface Comment {
  id:        string;
  postId:    string;
  author:    string;
  body:      string;
  createdAt: string;
}

// Use a Map for O(1) lookup by ID — better than an object for dynamic keys
const posts    = new Map<string, Post>();
const comments = new Map<string, Comment[]>(); // postId → Comment[]

// Seed data
let nextPostId    = 4;
let nextCommentId = 10;

function makeId(counter: number): string {
  return String(counter);
}

const now = new Date().toISOString();
[
  { id: '1', title: 'Getting Started with Node.js', body: 'Node.js is a JavaScript runtime...', author: 'alice', tags: ['nodejs', 'javascript'], createdAt: now, updatedAt: now },
  { id: '2', title: 'TypeScript Deep Dive',          body: 'TypeScript adds static types...', author: 'bob',   tags: ['typescript'],          createdAt: now, updatedAt: now },
  { id: '3', title: 'REST API Best Practices',       body: 'Designing good REST APIs...', author: 'alice', tags: ['api', 'rest'],          createdAt: now, updatedAt: now },
].forEach(p => {
  posts.set(p.id, p);
  comments.set(p.id, []);
});

comments.get('1')!.push(
  { id: '1', postId: '1', author: 'carol', body: 'Great intro!',          createdAt: now },
  { id: '2', postId: '1', author: 'dave',  body: 'Helped me a lot.',       createdAt: now },
);

// ─────────────────────────────────────────────────────────────────
// HELPER: consistent API response shape
// ─────────────────────────────────────────────────────────────────
// All responses follow the same envelope: { data, meta?, error? }
// This makes client-side parsing predictable and testable.
function sendOk<T>(res: Response, data: T, meta?: Record<string, unknown>, status = 200): void {
  res.status(status).json({ data, ...(meta ? { meta } : {}) });
}

function sendError(res: Response, status: number, message: string, details?: unknown): void {
  res.status(status).json({
    error: { message, ...(details ? { details } : {}) },
  });
}

// ─────────────────────────────────────────────────────────────────
// POSTS CRUD
// ─────────────────────────────────────────────────────────────────

// GET /api/posts?search=&author=&limit=10&cursor=
// ─────────────────────────────────────────────────────────────────
// CURSOR-BASED PAGINATION vs OFFSET PAGINATION:
//
// Offset: SELECT * FROM posts LIMIT 10 OFFSET 50
//   Simple to implement. But:
//   Problem: if a post is inserted while the user is paginating, items shift.
//   Page 2 may repeat item 10 from page 1, or skip item 11 entirely.
//   Also slow on large tables — DB must scan and discard 50 rows.
//
// Cursor: SELECT * FROM posts WHERE id > :cursor ORDER BY id LIMIT 10
//   The "cursor" is the ID (or timestamp) of the last item seen.
//   New inserts don't affect what comes next — the cursor is stable.
//   Faster: index seek directly to the cursor position.
//   Trade-off: can't jump to page 5 — must walk from page 1.
//   Best for: infinite scroll, feeds, event streams, large datasets.
app.get('/api/posts', (req: Request, res: Response) => {
  const search = (req.query.search as string | undefined)?.toLowerCase();
  const author = req.query.author as string | undefined;
  const limit  = Math.min(parseInt(req.query.limit as string, 10) || 10, 100);
  const cursor = req.query.cursor as string | undefined; // last seen post ID

  let allPosts = Array.from(posts.values());

  // Filter
  if (search) {
    allPosts = allPosts.filter(p =>
      p.title.toLowerCase().includes(search) ||
      p.body.toLowerCase().includes(search)
    );
  }
  if (author) {
    allPosts = allPosts.filter(p => p.author === author);
  }

  // Sort by createdAt descending (newest first)
  allPosts.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  // Apply cursor: skip everything up to and including the cursor ID
  let startIndex = 0;
  if (cursor) {
    const cursorIndex = allPosts.findIndex(p => p.id === cursor);
    if (cursorIndex !== -1) startIndex = cursorIndex + 1;
  }

  const page        = allPosts.slice(startIndex, startIndex + limit);
  const nextCursor  = page.length === limit ? page[page.length - 1].id : null;
  const hasMore     = nextCursor !== null;

  sendOk(res, page, {
    cursor:     nextCursor,
    hasMore,
    count:      page.length,
    total:      allPosts.length,
  });
});

// GET /api/posts/:id
app.get('/api/posts/:id', (req: Request, res: Response) => {
  const post = posts.get(req.params.id);
  if (!post) return sendError(res, 404, `Post '${req.params.id}' not found`);
  sendOk(res, post);
});

// POST /api/posts
app.post('/api/posts', (req: Request, res: Response) => {
  const { title, body, author, tags } = req.body as Partial<Post>;

  // Field-level validation errors — clients need to know WHICH field failed
  // to show inline form errors. "Invalid input" is useless to a UI.
  const errors: Record<string, string> = {};
  if (!title?.trim())  errors.title  = 'Title is required';
  if (!body?.trim())   errors.body   = 'Body is required';
  if (!author?.trim()) errors.author = 'Author is required';

  if (Object.keys(errors).length > 0) {
    return sendError(res, 400, 'Validation failed', errors);
  }

  const id       = makeId(nextPostId++);
  const ts       = new Date().toISOString();
  const newPost: Post = {
    id,
    title:     title!.trim(),
    body:      body!.trim(),
    author:    author!.trim(),
    tags:      Array.isArray(tags) ? tags : [],
    createdAt: ts,
    updatedAt: ts,
  };

  posts.set(id, newPost);
  comments.set(id, []); // initialise empty comments list

  // 201 Created + Location header (RFC 7231 requirement for POST)
  res.status(201)
     .header('Location', `/api/posts/${id}`)
     .json({ data: newPost });
});

// PATCH /api/posts/:id — partial update
// PATCH vs PUT:
//   PUT   — client sends the full resource. Server replaces it entirely.
//   PATCH — client sends only the fields to change. Server merges.
//   In practice: PATCH is almost always what you want.
//   PUT is useful for idempotent operations like: "set config to exactly this".
app.patch('/api/posts/:id', (req: Request, res: Response) => {
  const post = posts.get(req.params.id);
  if (!post) return sendError(res, 404, `Post '${req.params.id}' not found`);

  const { title, body, tags } = req.body as Partial<Post>;

  // Only update fields that were actually sent
  // Merge: keep existing values for fields not in the request body
  const updated: Post = {
    ...post,
    ...(title !== undefined ? { title: title.trim() }              : {}),
    ...(body  !== undefined ? { body:  body.trim()  }              : {}),
    ...(tags  !== undefined ? { tags: Array.isArray(tags) ? tags : [] } : {}),
    updatedAt: new Date().toISOString(),
  };

  // Validate fields that were provided
  if (updated.title === '') return sendError(res, 400, 'Title cannot be empty');
  if (updated.body  === '') return sendError(res, 400, 'Body cannot be empty');

  posts.set(post.id, updated);
  sendOk(res, updated);
});

// DELETE /api/posts/:id
app.delete('/api/posts/:id', (req: Request, res: Response) => {
  const post = posts.get(req.params.id);
  if (!post) return sendError(res, 404, `Post '${req.params.id}' not found`);

  posts.delete(req.params.id);
  comments.delete(req.params.id); // cascade delete comments

  // 204 No Content — success with no body (correct for DELETE)
  // Do NOT return 200 with a body for DELETE — it's redundant.
  res.status(204).send();
});

// ─────────────────────────────────────────────────────────────────
// NESTED RESOURCES: Comments belong to Posts
// /api/posts/:id/comments
// ─────────────────────────────────────────────────────────────────
//
// The post ID in the URL serves double duty:
//   1. Scopes the comment list to a specific post
//   2. Validates the post exists (you can't comment on a ghost post)

// GET /api/posts/:id/comments
app.get('/api/posts/:id/comments', (req: Request, res: Response) => {
  if (!posts.has(req.params.id)) {
    return sendError(res, 404, `Post '${req.params.id}' not found`);
  }
  const postComments = comments.get(req.params.id) ?? [];
  sendOk(res, postComments, { count: postComments.length });
});

// POST /api/posts/:id/comments
app.post('/api/posts/:id/comments', (req: Request, res: Response) => {
  if (!posts.has(req.params.id)) {
    return sendError(res, 404, `Post '${req.params.id}' not found`);
  }

  const { author, body } = req.body as Partial<Comment>;
  const errors: Record<string, string> = {};
  if (!author?.trim()) errors.author = 'Author is required';
  if (!body?.trim())   errors.body   = 'Body is required';

  if (Object.keys(errors).length > 0) {
    return sendError(res, 400, 'Validation failed', errors);
  }

  const id      = makeId(nextCommentId++);
  const comment: Comment = {
    id,
    postId:    req.params.id,
    author:    author!.trim(),
    body:      body!.trim(),
    createdAt: new Date().toISOString(),
  };

  comments.get(req.params.id)!.push(comment);

  res.status(201)
     .header('Location', `/api/posts/${req.params.id}/comments/${id}`)
     .json({ data: comment });
});

// ─────────────────────────────────────────────────────────────────
// ERROR HANDLER
// ─────────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Unhandled Error]', err.message);
  sendError(res, 500, 'Internal server error');
});

// 404 fallback
app.use((req: Request, res: Response) => {
  sendError(res, 404, `Cannot ${req.method} ${req.path}`);
});

// ─────────────────────────────────────────────────────────────────
// START
// ─────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║         DAY 38 — REST API DESIGN                        ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(`\nServer at http://localhost:${PORT}`);
  console.log('\nRoutes:');
  console.log('  GET    /api/posts                         list (search, author, cursor)');
  console.log('  POST   /api/posts                         create post');
  console.log('  GET    /api/posts/:id                     get post');
  console.log('  PATCH  /api/posts/:id                     partial update');
  console.log('  DELETE /api/posts/:id                     delete post');
  console.log('  GET    /api/posts/:id/comments            list comments');
  console.log('  POST   /api/posts/:id/comments            add comment');
  console.log('\nTry:');
  console.log('  curl http://localhost:3002/api/posts');
  console.log('  curl http://localhost:3002/api/posts?search=node');
  console.log('  curl http://localhost:3002/api/posts/1/comments');
  console.log('  curl http://localhost:3002/api/posts -X POST \\');
  console.log('       -H "Content-Type: application/json" \\');
  console.log('       -d \'{"title":"New Post","body":"Content here","author":"eve"}\'');
});

export default app;
