// ════════════════════════════════════════════════════════════════
// DAY 51 — THE APP UNDER TEST: BLOG API
// ════════════════════════════════════════════════════════════════
//
// KEY DESIGN DECISION: Export the Express app WITHOUT calling app.listen().
//
// Why? Supertest starts its own ephemeral server internally.
// If you call app.listen() here, two things go wrong:
//   1. Port conflicts — the module starts listening on a port, then
//      supertest tries to do the same (or a different test run does).
//   2. The test process never exits — Node.js keeps the event loop alive
//      because there's still an open server handle.
//
// Pattern: always separate "create app" from "start server":
//   app.ts   → creates and exports the Express instance
//   index.ts → imports app, calls app.listen() (NOT tested)
//
// This is called the "app factory pattern" and is standard practice
// for testable Express/Fastify/Koa applications.

import express, { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

// ──────────────────────────────────────────────────────────────
// DATA MODEL
// ──────────────────────────────────────────────────────────────

export interface Post {
  id: number;
  title: string;
  content: string;
  published: boolean;
  createdAt: string; // ISO 8601 string — consistent across serialization
}

// ──────────────────────────────────────────────────────────────
// IN-MEMORY STORE
// ──────────────────────────────────────────────────────────────
//
// Using a closure (module-level variables) as our "database".
// This is fine for teaching purposes — real apps use Postgres/MongoDB.
//
// WHY export resetStore() and getStore()?
//   Tests need to:
//   - resetStore(): wipe state between tests (isolation)
//   - getStore():   assert on stored data directly (not just via HTTP)

let posts: Post[] = [];
let nextId = 1;

export function resetStore(): void {
  posts = [];
  nextId = 1;
}

export function getStore(): Post[] {
  // Return a shallow copy so callers can't mutate the internal array.
  // Defensive copying is good practice even in tests.
  return [...posts];
}

// ──────────────────────────────────────────────────────────────
// VALIDATION SCHEMAS
// ──────────────────────────────────────────────────────────────
//
// Zod schemas at the boundary (HTTP handler) — parse incoming JSON
// before it touches business logic. If parsing fails, Zod throws a
// ZodError with field-level details we can return as a 400 response.

const createPostSchema = z.object({
  title: z.string().min(1, 'title is required').max(200, 'title too long'),
  content: z.string().min(1, 'content is required'),
  // .optional().default(false) means: if the field is absent, use false
  // The inferred type becomes `boolean` (not `boolean | undefined`)
  published: z.boolean().optional().default(false),
});

// For PATCH we use .partial() — every field becomes optional.
// This way PATCH /posts/1 { title: "New title" } only updates the title.
const updatePostSchema = createPostSchema.partial();

// ──────────────────────────────────────────────────────────────
// EXPRESS APP
// ──────────────────────────────────────────────────────────────

export const app = express();
app.use(express.json()); // Parse application/json bodies

// ──────────────────────────────────────────────────────────────
// GET /api/posts
// ──────────────────────────────────────────────────────────────
//
// Supports optional ?published=true query parameter.
// Returns 200 with an array (possibly empty — never 404 for a list).
//
// WHY never 404 for an empty list?
//   404 means "this URL doesn't exist". An empty collection exists —
//   it just has no items. Return 200 + [] to distinguish "no items"
//   from "wrong URL".

app.get('/api/posts', (req: Request, res: Response) => {
  const { published } = req.query;

  if (published === 'true') {
    return res.json(posts.filter((p) => p.published));
  }
  if (published === 'false') {
    return res.json(posts.filter((p) => !p.published));
  }

  return res.json(posts);
});

// ──────────────────────────────────────────────────────────────
// GET /api/posts/:id
// ──────────────────────────────────────────────────────────────
//
// :id is a route parameter — Express parses it as a string.
// We convert to number with parseInt (or Number()). Always validate:
// GET /api/posts/abc → NaN → treat as 404 (no post has NaN as id).

app.get('/api/posts/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const post = posts.find((p) => p.id === id);

  if (!post) {
    // 404 Not Found — be explicit in the body too, for API consumers
    return res.status(404).json({ error: 'Post not found' });
  }

  return res.json(post);
});

// ──────────────────────────────────────────────────────────────
// POST /api/posts
// ──────────────────────────────────────────────────────────────
//
// Creates a new post. Returns 201 Created (not 200).
// WHY 201? RFC 7231: 201 means "a new resource was created as a result
// of this request". It's more precise than 200 and signals to clients
// (and caches) that something new exists.
//
// Location header: points to the newly created resource.
// Standard HTTP practice — clients can follow it to read what they created.

app.post('/api/posts', (req: Request, res: Response) => {
  const parsed = createPostSchema.safeParse(req.body);

  if (!parsed.success) {
    // safeParse never throws — it returns { success: false, error: ZodError }
    // ZodError.flatten() gives { fieldErrors: { title: ['...'], ... } }
    return res.status(400).json({
      error: 'Validation failed',
      details: parsed.error.flatten().fieldErrors,
    });
  }

  const post: Post = {
    id: nextId++,
    title: parsed.data.title,
    content: parsed.data.content,
    published: parsed.data.published,
    createdAt: new Date().toISOString(),
  };

  posts.push(post);

  return res
    .status(201)
    .setHeader('Location', `/api/posts/${post.id}`)
    .json(post);
});

// ──────────────────────────────────────────────────────────────
// PATCH /api/posts/:id
// ──────────────────────────────────────────────────────────────
//
// Partial update — only the fields present in the body are changed.
// PATCH (partial) vs PUT (full replacement):
//   PUT  /posts/1 { title, content, published } — replaces entire resource
//   PATCH /posts/1 { published: true }           — updates only `published`
// Use PATCH for partial updates. It's less error-prone for clients.

app.patch('/api/posts/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const postIndex = posts.findIndex((p) => p.id === id);

  if (postIndex === -1) {
    return res.status(404).json({ error: 'Post not found' });
  }

  const parsed = updatePostSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: 'Validation failed',
      details: parsed.error.flatten().fieldErrors,
    });
  }

  // Merge: spread existing post, then override with provided fields
  posts[postIndex] = { ...posts[postIndex], ...parsed.data };

  return res.json(posts[postIndex]);
});

// ──────────────────────────────────────────────────────────────
// DELETE /api/posts/:id
// ──────────────────────────────────────────────────────────────
//
// Returns 204 No Content on success.
// WHY 204? The resource no longer exists — there's nothing to return.
// RFC 7231: 204 = "server successfully fulfilled the request and there
// is no additional content to send in the response payload body."
//
// Return 404 if the post doesn't exist (can't delete what isn't there).

app.delete('/api/posts/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const postIndex = posts.findIndex((p) => p.id === id);

  if (postIndex === -1) {
    return res.status(404).json({ error: 'Post not found' });
  }

  posts.splice(postIndex, 1);

  // 204 No Content — no body sent
  return res.status(204).send();
});

// ──────────────────────────────────────────────────────────────
// GLOBAL ERROR HANDLER
// ──────────────────────────────────────────────────────────────
//
// Express identifies error-handling middleware by its 4-argument signature.
// Any unhandled error passed to next(err) lands here.
// This catches things like: JSON.parse failures from malformed request body,
// unexpected throws in route handlers, etc.
//
// IMPORTANT: never leak stack traces to clients in production.
// Log the full error server-side, return a sanitized message to clients.

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  console.error('[ERROR]', err.message, err.stack);
  res.status(500).json({ error: 'Internal server error' });
});
