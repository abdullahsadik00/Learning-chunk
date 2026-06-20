// ════════════════════════════════════════════════════════════════
// DAY 37 — EXPRESS FUNDAMENTALS
// ════════════════════════════════════════════════════════════════
//
// Run with: npm run day37
//
// EXPRESS MIDDLEWARE CHAIN:
// Every request flows through middleware functions in order.
// Each middleware signature: (req, res, next) => void
//   - Call next()       → pass to next middleware
//   - Call next(error)  → skip to the error handler
//   - Call res.json()   → end the chain, send response
//
// Request → [logger] → [cors] → [bodyParser] → [auth] → [route handler] → [error handler]
//                                                                                ↑
//                                              any next(err) jumps straight here
//
// MIDDLEWARE TYPES:
//   Application-level:  app.use(fn)                    — runs for all routes
//   Router-level:       router.use(fn)                 — runs for routes in this router
//   Error-handling:     app.use((err,req,res,next)=>{}) — 4 arguments, runs on next(err)
//   Built-in:           express.json(), express.static(), express.urlencoded()
//   Third-party:        cors, helmet, morgan, express-rate-limit

import express, { Request, Response, NextFunction, Router } from 'express';
import {
  requestLogger,
  requireHeader,
  sanitize,
  notFound,
  globalErrorHandler,
  asyncHandler,
  AppError,
} from './middleware';

const app = express();
const PORT = 3001;

// ─────────────────────────────────────────────────────────────────
// APPLICATION-LEVEL MIDDLEWARE
// Registered with app.use() — runs for every incoming request in order.
// ─────────────────────────────────────────────────────────────────

// 1. Parse JSON bodies — populates req.body for Content-Type: application/json
//    limit: '10kb' prevents large payload attacks (body > 10KB → 413 error)
app.use(express.json({ limit: '10kb' }));

// 2. Parse URL-encoded bodies — for HTML form submissions
//    extended: true  → uses qs library (supports nested objects: a[b]=1)
//    extended: false → uses Node's querystring (flat key=value only)
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// 3. Custom logging middleware (from middleware.ts)
//    Logs: METHOD /path STATUS — Xms
app.use(requestLogger({ level: 'info' }));

// 4. Sanitize all string values in request bodies
app.use(sanitize());

// ─────────────────────────────────────────────────────────────────
// BASIC ROUTES
// ─────────────────────────────────────────────────────────────────

// Health check — no auth, no middleware. Every API should have this.
// Used by load balancers and container orchestrators (k8s liveness probe).
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    memory: process.memoryUsage().heapUsed,
  });
});

// ─────────────────────────────────────────────────────────────────
// PATH PARAMETERS — req.params
// :id is a named capture group. Express parses it from the URL path.
// GET /users/42        → req.params.id = '42'   (always a string!)
// GET /users/abc       → req.params.id = 'abc'
// ─────────────────────────────────────────────────────────────────

// In-memory user store — replace with DB in production
const users: Record<number, { id: number; name: string; email: string }> = {
  1: { id: 1, name: 'Alice',   email: 'alice@example.com' },
  2: { id: 2, name: 'Bob',     email: 'bob@example.com'   },
  3: { id: 3, name: 'Charlie', email: 'charlie@example.com' },
};

app.get('/users/:id', (req: Request, res: Response, next: NextFunction) => {
  // req.params.id is ALWAYS a string — parse it
  const id = parseInt(req.params.id, 10);

  // Validate: NaN means the route was called with a non-numeric ID
  if (isNaN(id)) {
    // Create a typed error and delegate to the error handler
    const err: AppError = new Error('User ID must be a number');
    err.statusCode = 400;
    return next(err);
  }

  const user = users[id];
  if (!user) {
    const err: AppError = new Error(`User ${id} not found`);
    err.statusCode = 404;
    return next(err);
  }

  res.json({ data: user });
});

// ─────────────────────────────────────────────────────────────────
// QUERY PARAMETERS — req.query
// Everything after ? in the URL.
// GET /search?q=alice&limit=5&page=2
//   req.query.q     = 'alice'
//   req.query.limit = '5'     ← always a string!
//   req.query.page  = '2'
// Arrays:  /search?tag=js&tag=ts  → req.query.tag = ['js', 'ts']
// ─────────────────────────────────────────────────────────────────
app.get('/search', (req: Request, res: Response) => {
  // Always sanitise query params — they come from the URL, not JSON
  const q     = (req.query.q as string | undefined)?.toLowerCase() ?? '';
  const limit = Math.min(parseInt(req.query.limit as string, 10) || 10, 100);
  const page  = Math.max(parseInt(req.query.page as string, 10) || 1, 1);

  // Filter users by query
  const allUsers = Object.values(users);
  const filtered = q
    ? allUsers.filter(u => u.name.toLowerCase().includes(q) || u.email.includes(q))
    : allUsers;

  // Paginate
  const start = (page - 1) * limit;
  const items = filtered.slice(start, start + limit);

  res.json({
    data: items,
    pagination: {
      page,
      limit,
      total: filtered.length,
      pages: Math.ceil(filtered.length / limit),
    },
    query: q || undefined,
  });
});

// ─────────────────────────────────────────────────────────────────
// EXPRESS ROUTER — organise related routes into a mini-app
// ─────────────────────────────────────────────────────────────────
//
// Router benefits:
//   1. Encapsulation — middleware on the router only runs for its routes
//   2. Organisation — one file per resource (userRouter, postRouter, etc.)
//   3. Testability — you can test the router in isolation
//
// Think of Router as a mini express app — it has its own middleware stack
// and route handlers, mounted under a prefix with app.use().

const userRouter = Router();

// Router-level middleware — only runs for requests to this router
// This is how you protect a whole group of routes with one middleware
userRouter.use(requireHeader('X-API-Key', {
  errorMessage: 'API key required to access user management endpoints',
}));

// Within the router, paths are relative to the mount point.
// If mounted at /api/users:
//   GET /api/users       → router.get('/')
//   POST /api/users      → router.post('/')
//   GET /api/users/:id   → router.get('/:id')

userRouter.get('/', (_req: Request, res: Response) => {
  res.json({ data: Object.values(users) });
});

userRouter.post('/', asyncHandler(async (req: Request, res: Response) => {
  // asyncHandler wraps this so any thrown error calls next(err)
  const { name, email } = req.body as { name?: string; email?: string };

  if (!name || !email) {
    const err: AppError = new Error('name and email are required');
    err.statusCode = 400;
    throw err; // asyncHandler catches this and calls next(err)
  }

  // Simulate async DB insert
  await new Promise(r => setTimeout(r, 10));

  const id   = Math.max(...Object.keys(users).map(Number)) + 1;
  const user = { id, name, email };
  users[id]  = user;

  // 201 Created + Location header pointing to the new resource
  // The Location header is part of the HTTP spec for POST responses
  res.status(201)
     .header('Location', `/api/users/${id}`)
     .json({ data: user });
}));

userRouter.get('/:id', (req: Request, res: Response, next: NextFunction) => {
  const id   = parseInt(req.params.id, 10);
  const user = users[id];

  if (!user) {
    const err: AppError = new Error(`User ${id} not found`);
    err.statusCode = 404;
    return next(err);
  }

  res.json({ data: user });
});

userRouter.delete('/:id', (req: Request, res: Response, next: NextFunction) => {
  const id = parseInt(req.params.id, 10);

  if (!users[id]) {
    const err: AppError = new Error(`User ${id} not found`);
    err.statusCode = 404;
    return next(err);
  }

  delete users[id];
  res.status(204).send(); // 204 No Content — no body on delete
});

// Mount the router at /api/users
// Now: GET /api/users/1 maps to userRouter.get('/:id')
app.use('/api/users', userRouter);

// ─────────────────────────────────────────────────────────────────
// 404 CATCH-ALL — must be after all routes
// ─────────────────────────────────────────────────────────────────
// If no route matched, this fires. Must come after all route definitions.
app.use(notFound);

// ─────────────────────────────────────────────────────────────────
// ERROR HANDLER — must be the very last middleware (4 args)
// ─────────────────────────────────────────────────────────────────
// Any call to next(err) anywhere in the chain ends up here.
// The 4-argument signature (err, req, res, next) is how Express identifies
// error-handling middleware. All 4 must be declared even if next is unused.
app.use(globalErrorHandler);

// ─────────────────────────────────────────────────────────────────
// START SERVER
// ─────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║         DAY 37 — EXPRESS FUNDAMENTALS                   ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(`\nServer running at http://localhost:${PORT}`);
  console.log('\nAvailable routes:');
  console.log('  GET  /health                     — health check');
  console.log('  GET  /users/:id                  — get user by ID (no auth)');
  console.log('  GET  /search?q=&limit=&page=     — search users');
  console.log('  GET  /api/users                  — list users (needs X-API-Key header)');
  console.log('  POST /api/users                  — create user (needs X-API-Key header)');
  console.log('  GET  /api/users/:id              — get user (needs X-API-Key header)');
  console.log('  DELETE /api/users/:id            — delete user (needs X-API-Key header)');
  console.log('\nTry:');
  console.log('  curl http://localhost:3001/health');
  console.log('  curl http://localhost:3001/users/1');
  console.log('  curl http://localhost:3001/search?q=alice');
  console.log('  curl http://localhost:3001/api/users -H "X-API-Key: any-value"');
  console.log('  curl http://localhost:3001/api/users -H "X-API-Key: key" \\');
  console.log('       -X POST -H "Content-Type: application/json" \\');
  console.log('       -d \'{"name":"Dave","email":"dave@example.com"}\'');
});

export default app;
