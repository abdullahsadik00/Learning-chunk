// ════════════════════════════════════════════════════════════════
// DAY 50 — API DESIGN PATTERNS
// ════════════════════════════════════════════════════════════════
//
// REST vs GraphQL vs tRPC — the honest comparison:
//
// ─── REST ────────────────────────────────────────────────────────
//   Concept: resources map to URLs; HTTP methods express intent.
//     GET    /posts        → list posts
//     GET    /posts/42     → get post 42
//     POST   /posts        → create post
//     PATCH  /posts/42     → partial update
//     DELETE /posts/42     → delete
//
//   ✅ Universal — every language, every client, every CDN
//   ✅ Caching: GET responses cache naturally (CDN, browser, ETags)
//   ✅ Simple mental model — no new query language to learn
//   ✅ Excellent tooling (OpenAPI, Swagger, Postman, Insomnia)
//   ❌ Over-fetching: GET /users returns 30 fields even if you need 2
//   ❌ Under-fetching: user + their posts = 2 round-trips (N+1)
//   ❌ No type safety between server and client by default
//   WHEN TO USE: Public APIs, microservices, mobile apps, most backends
//
// ─── GraphQL ─────────────────────────────────────────────────────
//   Concept: single endpoint, client specifies exactly what it needs.
//     POST /graphql
//     { user(id: "42") { name email posts { title } } }
//   Returns EXACTLY those fields — no more, no less.
//
//   ✅ Client specifies shape — no over/under-fetching
//   ✅ Single endpoint, self-documenting schema (introspection)
//   ✅ Strongly typed — schema is the contract
//   ❌ Complex setup: schema SDL + resolvers + N+1 needs DataLoader
//   ❌ Harder to cache (all POST; field-level caching needs persisted queries)
//   ❌ Over-engineered for simple CRUD
//   ❌ Large learning curve for teams new to it
//   WHEN TO USE: Complex data graphs with many relationships; multiple
//   clients (web/mobile/3rd party) needing different shapes of the same data
//
// ─── tRPC ────────────────────────────────────────────────────────
//   Concept: write server functions, call them from the client as if
//   they were local functions. TypeScript infers types end-to-end.
//     // server
//     const appRouter = t.router({ getUser: t.procedure.query(({ input }) => db.users.find(input.id)) });
//     // client (fully typed, no codegen)
//     const user = await trpc.getUser.query({ id: '42' });
//
//   ✅ End-to-end type safety — rename a field, TypeScript errors everywhere
//   ✅ Zero codegen — client types come from server types directly
//   ✅ Familiar — just functions, no new query language
//   ❌ TypeScript ONLY — cannot call from Python, mobile, 3rd parties
//   ❌ Tightly couples frontend and backend (shared types mean shared repo or monorepo)
//   ❌ Not suitable for public APIs
//   WHEN TO USE: Full-stack TypeScript monorepos (Next.js, Remix + Express)
//
// ─── API VERSIONING STRATEGIES ───────────────────────────────────
//
//   URL versioning:     /api/v1/users, /api/v2/users
//     ✅ Explicit, immediately visible in logs and browser
//     ✅ Cacheable (CDN handles /v1/ and /v2/ independently)
//     ✅ Easy to document ("v2 added pagination")
//     ❌ "Dirty" URLs (some argue version isn't part of the resource)
//
//   Header versioning:  Accept: application/vnd.myapi.v2+json
//     ✅ Cleaner URLs
//     ❌ Invisible in browser; harder to test with curl
//     ❌ CDN caching requires Vary: Accept header
//
//   Query param:        /api/users?version=2
//     ❌ Least preferred — easy to forget, inconsistent
//
//   RECOMMENDATION: URL versioning.
//   It's explicit, cacheable, easy to document, works everywhere.
//   Major cloud APIs (Stripe, Twilio, GitHub) all use URL versioning.
//
// ─── RESPONSE ENVELOPE ───────────────────────────────────────────
//   Without envelope: routes return different shapes
//     GET /users → { users: [] }
//     GET /posts → []
//     GET /me    → { data: { user: {} } }
//   Client code becomes a mess of conditionals.
//
//   With envelope: EVERY response has the same top-level shape:
//     Success: { success: true,  data: T,    meta?: { page, total, ... } }
//     Error:   { success: false, error: { code: string, message: string } }
//   Client always checks response.success first. Predictable. Testable.
//
// ════════════════════════════════════════════════════════════════

import express, { Request, Response, Router, NextFunction } from 'express';
import cors from 'cors';
import { z } from 'zod';

const app = express();
app.use(cors());
app.use(express.json());

// ─── Response envelope helpers ────────────────────────────────────
// These are the only two shapes your API ever returns.
// Import and use these everywhere instead of writing res.json({ ... }) ad-hoc.

interface PaginationMeta {
  page:       number;
  pageSize:   number;
  total:      number;
  totalPages: number;
}

interface SuccessResponse<T> {
  success: true;
  data:    T;
  meta?:   PaginationMeta;
}

interface ErrorResponse {
  success: false;
  error: {
    code:     string;
    message:  string;
    details?: unknown;
  };
}

function ok<T>(res: Response, data: T, meta?: PaginationMeta, status = 200): void {
  const body: SuccessResponse<T> = { success: true, data };
  if (meta !== undefined) body.meta = meta;
  res.status(status).json(body);
}

function fail(res: Response, code: string, message: string, status = 400, details?: unknown): void {
  const error: ErrorResponse['error'] = { code, message };
  if (details !== undefined) error.details = details;
  const body: ErrorResponse = { success: false, error };
  res.status(status).json(body);
}

// ─── Rate limit header middleware ─────────────────────────────────
// Shows the standard rate-limit headers — used by Stripe, GitHub, etc.
// In production: use a real rate-limiter like express-rate-limit + Redis.
// This middleware just injects the headers for teaching purposes.

const RATE_LIMIT = 100; // requests per window
const RATE_WINDOW_SECONDS = 60;

// Simplistic in-memory counter (per IP). Real apps use Redis.
const rateLimitCounters = new Map<string, { count: number; resetAt: number }>();

function rateLimitHeaders(req: Request, res: Response, next: NextFunction): void {
  const ip      = req.ip ?? 'unknown';
  const now     = Math.floor(Date.now() / 1000);
  const resetAt = Math.floor(now / RATE_WINDOW_SECONDS) * RATE_WINDOW_SECONDS + RATE_WINDOW_SECONDS;

  let entry = rateLimitCounters.get(ip);

  if (!entry || entry.resetAt <= now) {
    entry = { count: 0, resetAt };
    rateLimitCounters.set(ip, entry);
  }

  entry.count++;

  const remaining = Math.max(0, RATE_LIMIT - entry.count);

  // Standard rate-limit headers (IETF draft-ietf-httpapi-ratelimit-headers)
  res.setHeader('X-RateLimit-Limit',     RATE_LIMIT);
  res.setHeader('X-RateLimit-Remaining', remaining);
  res.setHeader('X-RateLimit-Reset',     resetAt);   // Unix timestamp when window resets

  if (entry.count > RATE_LIMIT) {
    res.setHeader('Retry-After', resetAt - now); // seconds until reset (only on 429)
    fail(res, 'RATE_LIMITED', 'Too many requests', 429, { retryAfterSeconds: resetAt - now });
    return;
  }

  next();
}

app.use('/api', rateLimitHeaders);

// ─── Fake data store ──────────────────────────────────────────────

interface Post {
  id:        number;
  title:     string;
  body:      string;
  authorId:  number;
  tags:      string[];
  createdAt: string;
}

const POSTS: Post[] = Array.from({ length: 25 }, (_, i) => ({
  id:        i + 1,
  title:     `Post ${i + 1}: ${['Deep dive into async', 'TypeScript tips', 'Node.js patterns', 'API design'][i % 4]}`,
  body:      `Body of post ${i + 1}. This is example content for learning purposes.`,
  authorId:  (i % 3) + 1,
  tags:      [['typescript', 'nodejs', 'api', 'websockets'][i % 4], 'tutorial'],
  createdAt: new Date(Date.now() - i * 86_400_000).toISOString(),
}));

// ─── API v1 ───────────────────────────────────────────────────────
// v1: simple list (no pagination), no summary field

const v1Router = Router();

v1Router.get('/posts', (_req: Request, res: Response) => {
  // v1: returns all posts, no pagination
  ok(res, POSTS);
});

v1Router.get('/posts/:id', (req: Request, res: Response) => {
  const id   = parseInt(req.params['id'] ?? '', 10);
  const post = POSTS.find(p => p.id === id);

  if (!post) {
    fail(res, 'NOT_FOUND', `Post ${id} not found`, 404);
    return;
  }

  ok(res, post);
});

v1Router.post('/posts', (req: Request, res: Response) => {
  const schema = z.object({
    title:    z.string().min(1).max(200),
    body:     z.string().min(1),
    authorId: z.number().int().positive(),
    tags:     z.array(z.string()).optional().default([]),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    fail(res, 'VALIDATION_ERROR', 'Invalid request body', 422, parsed.error.issues);
    return;
  }

  const newPost: Post = {
    id:        POSTS.length + 1,
    ...parsed.data,
    createdAt: new Date().toISOString(),
  };

  POSTS.push(newPost);
  ok(res, newPost, undefined, 201);
});

// ─── API v2 ───────────────────────────────────────────────────────
// v2 changes:
//   1. List endpoint adds pagination (page + pageSize query params)
//   2. Each post includes a `summary` field (first 100 chars of body)
//   3. List supports filtering by tag (?tag=typescript)
//
// Both v1 and v2 run simultaneously — existing v1 clients are unaffected.

interface PostV2 extends Post {
  summary: string;
}

function toV2(post: Post): PostV2 {
  return { ...post, summary: post.body.slice(0, 100) + (post.body.length > 100 ? '...' : '') };
}

const v2Router = Router();

v2Router.get('/posts', (req: Request, res: Response) => {
  const pageSchema = z.object({
    page:     z.coerce.number().int().min(1).optional().default(1),
    pageSize: z.coerce.number().int().min(1).max(100).optional().default(10),
    tag:      z.string().optional(),
    authorId: z.coerce.number().int().positive().optional(),
  });

  const parsed = pageSchema.safeParse(req.query);
  if (!parsed.success) {
    fail(res, 'VALIDATION_ERROR', 'Invalid query parameters', 400, parsed.error.issues);
    return;
  }

  const { page, pageSize, tag, authorId } = parsed.data;

  // Filter
  let filtered = POSTS.filter(p => {
    if (tag      && !p.tags.includes(tag))    return false;
    if (authorId && p.authorId !== authorId)  return false;
    return true;
  });

  // Paginate
  const total      = filtered.length;
  const totalPages = Math.ceil(total / pageSize);
  const start      = (page - 1) * pageSize;
  const items      = filtered.slice(start, start + pageSize).map(toV2);

  ok(res, items, { page, pageSize, total, totalPages });
});

v2Router.get('/posts/:id', (req: Request, res: Response) => {
  const id   = parseInt(req.params['id'] ?? '', 10);
  const post = POSTS.find(p => p.id === id);

  if (!post) {
    fail(res, 'NOT_FOUND', `Post ${id} not found`, 404);
    return;
  }

  ok(res, toV2(post));
});

// Same schema as v1 — backwards compatible create
v2Router.post('/posts', (req: Request, res: Response) => {
  const schema = z.object({
    title:    z.string().min(1).max(200),
    body:     z.string().min(1),
    authorId: z.number().int().positive(),
    tags:     z.array(z.string()).optional().default([]),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    fail(res, 'VALIDATION_ERROR', 'Invalid request body', 422, parsed.error.issues);
    return;
  }

  const newPost: Post = {
    id:        POSTS.length + 1,
    ...parsed.data,
    createdAt: new Date().toISOString(),
  };

  POSTS.push(newPost);
  ok(res, toV2(newPost), undefined, 201);
});

// Mount routers — both versions live simultaneously
app.use('/api/v1', v1Router);
app.use('/api/v2', v2Router);

// ─── OpenAPI spec ─────────────────────────────────────────────────
// Manually authored OpenAPI 3.0 spec as a JS object.
// In production: use libraries like zod-to-openapi or tsoa to generate this
// automatically from your route definitions + Zod schemas.

const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title:       'Day 50 — Posts API',
    version:     '2.0.0',
    description: 'Demo API showing REST versioning, envelopes, and rate limiting',
    contact:     { name: 'API Support', email: 'api@example.com' },
  },
  servers: [
    { url: 'http://localhost:3001', description: 'Local development' },
  ],
  paths: {
    '/api/v2/posts': {
      get: {
        summary:     'List posts (paginated)',
        operationId: 'v2ListPosts',
        tags:        ['Posts v2'],
        parameters: [
          { name: 'page',     in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'pageSize', in: 'query', schema: { type: 'integer', default: 10, maximum: 100 } },
          { name: 'tag',      in: 'query', schema: { type: 'string' } },
          { name: 'authorId', in: 'query', schema: { type: 'integer' } },
        ],
        responses: {
          '200': {
            description: 'Paginated list of posts',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data:    { type: 'array', items: { $ref: '#/components/schemas/PostV2' } },
                    meta:    { $ref: '#/components/schemas/PaginationMeta' },
                  },
                },
              },
            },
          },
          '429': { description: 'Rate limit exceeded' },
        },
      },
      post: {
        summary:     'Create a post',
        operationId: 'v2CreatePost',
        tags:        ['Posts v2'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'body', 'authorId'],
                properties: {
                  title:    { type: 'string', maxLength: 200 },
                  body:     { type: 'string' },
                  authorId: { type: 'integer' },
                  tags:     { type: 'array', items: { type: 'string' } },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Post created' },
          '422': { description: 'Validation error' },
        },
      },
    },
    '/api/v2/posts/{id}': {
      get: {
        summary:     'Get a post by ID',
        operationId: 'v2GetPost',
        tags:        ['Posts v2'],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
        ],
        responses: {
          '200': { description: 'Post found' },
          '404': { description: 'Post not found' },
        },
      },
    },
  },
  components: {
    schemas: {
      PostV2: {
        type: 'object',
        properties: {
          id:        { type: 'integer' },
          title:     { type: 'string' },
          body:      { type: 'string' },
          summary:   { type: 'string', description: 'First 100 chars of body (v2 only)' },
          authorId:  { type: 'integer' },
          tags:      { type: 'array', items: { type: 'string' } },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      PaginationMeta: {
        type: 'object',
        properties: {
          page:       { type: 'integer' },
          pageSize:   { type: 'integer' },
          total:      { type: 'integer' },
          totalPages: { type: 'integer' },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code:    { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    // In production: add securitySchemes (Bearer JWT, API key, OAuth2)
    securitySchemes: {
      BearerAuth: {
        type:         'http',
        scheme:       'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
};

// Serve the raw spec as JSON
app.get('/api-docs/openapi.json', (_req: Request, res: Response) => {
  res.json(openApiSpec);
});

// Serve Swagger UI — fully self-contained, no CDN
// Swagger UI is loaded from a CDN in most tutorials. Here we explain why
// and how to self-host it (embed the minified JS inline or serve from node_modules).
// For this demo we embed a minimal spec-viewer using plain HTML + fetch.
app.get('/api-docs', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>API Docs — Day 50</title>
  <style>
    body { font-family: monospace; background: #0f0f0f; color: #e2e8f0; padding: 2rem; max-width: 960px; margin: 0 auto; }
    h1   { color: #7c3aed; }
    h2   { color: #a78bfa; margin-top: 2rem; border-bottom: 1px solid #2d2d3d; padding-bottom: 0.5rem; }
    h3   { color: #c4b5fd; }
    .method { display: inline-block; padding: 3px 10px; border-radius: 4px; font-size: 0.85rem; font-weight: bold; margin-right: 8px; }
    .GET    { background: #1e3a5f; color: #60a5fa; }
    .POST   { background: #1a3320; color: #4ade80; }
    .route  { background: #1e1e2e; border-radius: 6px; padding: 1rem 1.25rem; margin: 0.75rem 0; }
    .url    { color: #e2e8f0; font-size: 1rem; }
    .desc   { color: #94a3b8; font-size: 0.85rem; margin-top: 0.5rem; }
    pre     { background: #1e1e2e; padding: 1rem; border-radius: 6px; overflow-x: auto; font-size: 0.82rem; color: #a5f3fc; }
    a       { color: #7c3aed; }
    .badge  { background: #312e81; color: #a5b4fc; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; margin-left: 8px; }
  </style>
</head>
<body>
  <h1>Day 50 — Posts API Docs</h1>
  <p>
    Raw OpenAPI spec: <a href="/api-docs/openapi.json">/api-docs/openapi.json</a>
    <span class="badge">OpenAPI 3.0</span>
  </p>
  <p style="color:#64748b;font-size:0.85rem;">
    In production, serve Swagger UI from <code>npm i swagger-ui-dist</code> and
    point it at <code>/api-docs/openapi.json</code>. Or use Redoc for a cleaner look.
  </p>

  <h2>v1 Endpoints</h2>
  <div class="route"><span class="method GET">GET</span><span class="url">/api/v1/posts</span>
    <div class="desc">Returns all posts. No pagination.</div></div>
  <div class="route"><span class="method GET">GET</span><span class="url">/api/v1/posts/:id</span>
    <div class="desc">Returns a single post by ID.</div></div>
  <div class="route"><span class="method POST">POST</span><span class="url">/api/v1/posts</span>
    <div class="desc">Create a post. Body: { title, body, authorId, tags? }</div></div>

  <h2>v2 Endpoints <span class="badge">adds pagination + summary</span></h2>
  <div class="route"><span class="method GET">GET</span><span class="url">/api/v2/posts?page=1&pageSize=10&tag=typescript</span>
    <div class="desc">Paginated list. Adds <code>summary</code> field and <code>meta</code> envelope.</div></div>
  <div class="route"><span class="method GET">GET</span><span class="url">/api/v2/posts/:id</span>
    <div class="desc">Get post (includes summary).</div></div>
  <div class="route"><span class="method POST">POST</span><span class="url">/api/v2/posts</span>
    <div class="desc">Create a post (same schema as v1).</div></div>

  <h2>Response Envelope</h2>
  <pre>// Every response is one of these two shapes:

// Success
{ "success": true, "data": ..., "meta": { "page": 1, "total": 25, ... } }

// Error
{ "success": false, "error": { "code": "NOT_FOUND", "message": "Post 99 not found" } }</pre>

  <h2>Rate Limit Headers</h2>
  <pre>X-RateLimit-Limit:     100        // max requests per window
X-RateLimit-Remaining: 87         // requests left in current window
X-RateLimit-Reset:     1719432000 // Unix timestamp when window resets
Retry-After:           43         // seconds until reset (only on 429)</pre>

  <h2>Live Data (fetched from API)</h2>
  <div id="live" style="color:#64748b;">Loading...</div>

  <script>
    fetch('/api/v2/posts?page=1&pageSize=3')
      .then(r => r.json())
      .then(({ success, data, meta }) => {
        const el = document.getElementById('live');
        el.innerHTML = '<pre>' + JSON.stringify({ success, meta, samplePost: data[0] }, null, 2) + '</pre>';
      })
      .catch(err => {
        document.getElementById('live').textContent = 'Error: ' + err.message;
      });
  </script>
</body>
</html>`);
});

// ─── GraphQL mini-demo (commented — no library needed to understand the concept)
// ─────────────────────────────────────────────────────────────────────────────
//
// The equivalent GraphQL setup for this Posts API would look like:
//
// SCHEMA (SDL — Schema Definition Language):
// ──────────────────────────────────────────
//   type Post {
//     id:        Int!
//     title:     String!
//     body:      String!
//     summary:   String!       # derived field
//     authorId:  Int!
//     tags:      [String!]!
//     createdAt: String!
//     author:    User          # relationship — resolved by a separate resolver
//   }
//
//   type User {
//     id:    Int!
//     name:  String!
//     posts: [Post!]!          # reverse relationship
//   }
//
//   type Query {
//     posts(page: Int, pageSize: Int, tag: String): PostConnection!
//     post(id: Int!): Post
//   }
//
//   type Mutation {
//     createPost(input: CreatePostInput!): Post!
//   }
//
//   type PostConnection {
//     items:      [Post!]!
//     total:      Int!
//     totalPages: Int!
//   }
//
//   input CreatePostInput {
//     title:    String!
//     body:     String!
//     authorId: Int!
//     tags:     [String!]
//   }
//
// RESOLVERS (how each field is fetched):
// ──────────────────────────────────────
//   const resolvers = {
//     Query: {
//       posts: (_, { page = 1, pageSize = 10, tag }) => {
//         const filtered = tag ? POSTS.filter(p => p.tags.includes(tag)) : POSTS;
//         const items = filtered.slice((page-1)*pageSize, page*pageSize);
//         return { items, total: filtered.length, totalPages: Math.ceil(filtered.length/pageSize) };
//       },
//       post: (_, { id }) => POSTS.find(p => p.id === id),
//     },
//
//     Post: {
//       summary: (post) => post.body.slice(0, 100),
//       // N+1 PROBLEM: if query asks for author, this runs once per post!
//       // FIX: use DataLoader to batch { authorId: 1, 2, 3 } → one DB query
//       author: (post) => USERS.find(u => u.id === post.authorId),
//     },
//
//     Mutation: {
//       createPost: (_, { input }) => {
//         const post = { id: POSTS.length + 1, ...input, createdAt: new Date().toISOString() };
//         POSTS.push(post);
//         return post;
//       },
//     },
//   };
//
// CLIENT QUERY (client specifies EXACTLY what it needs):
// ──────────────────────────────────────────────────────
//   // Only want id, title, summary — nothing else
//   query { posts(page: 1, tag: "typescript") { items { id title summary } total } }
//
//   // Want post AND its author in one request (no under-fetching)
//   query { post(id: 42) { title body author { name } } }
//
// To add GraphQL to this Express app:
//   npm install graphql @apollo/server @as-integrations/express4
//   then mount: app.use('/graphql', expressMiddleware(server));
// ─────────────────────────────────────────────────────────────────────────────

// ─── Root ─────────────────────────────────────────────────────────

app.get('/', (_req: Request, res: Response) => {
  ok(res, {
    name:        'Day 50 — API Design Patterns',
    version:     '2.0.0',
    docs:        'http://localhost:3001/api-docs',
    openApiSpec: 'http://localhost:3001/api-docs/openapi.json',
    endpoints: {
      v1: ['GET /api/v1/posts', 'GET /api/v1/posts/:id', 'POST /api/v1/posts'],
      v2: ['GET /api/v2/posts', 'GET /api/v2/posts/:id', 'POST /api/v2/posts'],
    },
  });
});

// ─── 404 handler ─────────────────────────────────────────────────
app.use((req: Request, res: Response) => {
  fail(res, 'NOT_FOUND', `Route ${req.method} ${req.path} not found`, 404);
});

// ─── Global error handler ─────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction): void => {
  console.error('[server] Unhandled error:', err);
  fail(res, 'INTERNAL_ERROR', 'An unexpected error occurred', 500);
});

// ─── Start ────────────────────────────────────────────────────────

const PORT = 3001;

app.listen(PORT, () => {
  console.log(`\n[server] Day 50 — API Design Patterns`);
  console.log(`[server] Listening on http://localhost:${PORT}`);
  console.log('');
  console.log('[endpoints]');
  console.log(`  GET  http://localhost:${PORT}/api-docs              → Swagger-style docs`);
  console.log(`  GET  http://localhost:${PORT}/api-docs/openapi.json → raw OpenAPI 3.0 spec`);
  console.log(`  GET  http://localhost:${PORT}/api/v1/posts          → v1 list (no pagination)`);
  console.log(`  GET  http://localhost:${PORT}/api/v2/posts          → v2 list (paginated)`);
  console.log(`  GET  http://localhost:${PORT}/api/v2/posts?page=2&pageSize=5&tag=nodejs`);
  console.log('');
  console.log('Try it:');
  console.log(`  curl http://localhost:${PORT}/api/v2/posts?page=1`);
  console.log(`  curl http://localhost:${PORT}/api/v2/posts/99       # → 404 envelope`);
  console.log(`  curl -X POST http://localhost:${PORT}/api/v2/posts \\`);
  console.log(`       -H 'Content-Type: application/json' \\`);
  console.log(`       -d '{"title":"New post","body":"Content here","authorId":1}'`);
});
