# Day 37 Assessment — Express.js · Middleware · Routing · Error Handling

**Theme:** You are building the API server for a B2B SaaS product. The team uses Express and you need to design a middleware stack that is secure, observable, and maintainable.

**Scoring:** 0–4 re-study · 5–9 progressing · 10–12 solid · 13–15 ready to advance

---

### Q1 — Middleware Signature ⭐

**Scenario:** A new developer on the team wrote an error handler with 3 parameters `(req, res, next)` and wonders why Express never invokes it when errors occur.

**Task:** Explain the difference between a regular middleware signature `(req, res, next)` and an error-handling middleware signature `(err, req, res, next)`. How does Express distinguish between them?

**Acceptance Criteria:**
- [ ] Regular middleware: exactly 3 parameters `(req, res, next)` — Express calls these in order for every matching request
- [ ] Error-handling middleware: exactly 4 parameters `(err, req, res, next)` — Express only calls these when `next(error)` is invoked with a truthy argument
- [ ] Express uses `Function.length` (the number of declared parameters) to determine which type a middleware function is — a 3-parameter function is never treated as an error handler
- [ ] States that parameter names do not matter — only the count matters; `(a, b, c, d)` is an error handler
- [ ] The fix for the new developer: add `err` as the first parameter
- [ ] States that error-handling middleware should be registered last in the middleware stack, after all routes
- [ ] Demonstrates a minimal example of each signature

---

### Q2 — next() Behavior ⭐

**Scenario:** A middleware logs a request but then nothing happens — the route handler never fires. In another case, a route crashes silently. Both are caused by misunderstanding `next()`.

**Task:** Explain what happens in each of these three cases: calling `next()`, calling `next(error)`, and not calling `next()` at all (and not sending a response).

**Acceptance Criteria:**
- [ ] `next()` with no argument: passes control to the next matching middleware or route handler in the stack
- [ ] `next(error)` with a truthy argument: skips all regular middleware and routes, passes control directly to the first 4-parameter error handler
- [ ] Not calling `next()` and not calling `res.send()` / `res.json()` / `res.end()`: the request hangs indefinitely (client waits for a response that never comes)
- [ ] `next('route')` is a special case: skips remaining handlers in the current `router.route()` chain and moves to the next route — candidates should mention this or note it exists
- [ ] States that calling `next()` after `res.json()` has already been called will trigger "headers already sent" errors if any subsequent middleware also tries to respond
- [ ] Demonstrates the logging-middleware bug: missing `next()` call means the route handler is never reached

---

### Q3 — express.Router() ⭐

**Scenario:** All routes are defined directly on `app` in a single 800-line `server.js`. Adding auth to all `/admin` routes requires touching every route individually.

**Task:** Explain `express.Router()`: what it is, why routes should be split into separate Routers, and what `router.use()` does when scoped to a particular Router.

**Acceptance Criteria:**
- [ ] `express.Router()` creates a mini-application that can have its own middleware and routes, then is mounted on the main `app` with `app.use('/prefix', router)`
- [ ] Splitting routes into Routers enables scoped middleware: `router.use(authMiddleware)` applies only to routes defined on that router, not the whole app
- [ ] Demonstrates: `router.use(requireAdmin)` before route definitions protects all routes in `adminRouter` without touching `userRouter`
- [ ] Each Router is composable and testable in isolation
- [ ] `router.use()` inside a Router registers middleware that runs for all routes on that Router in the order it is declared
- [ ] Mounting with `app.use('/api/admin', adminRouter)` means the Router's routes are prefixed — a route defined as `/users` in the Router is reachable at `/api/admin/users`
- [ ] States that Router ordering matters: middleware registered with `router.use()` after a route definition does not run for that route

---

### Q4 — Built-in Middleware ⭐

**Scenario:** A new teammate asks why requests to `POST /users` have `req.body` as `undefined`, why form submissions don't parse, and how to serve the React build folder.

**Task:** Explain `express.json()`, `express.urlencoded({ extended: true })`, and `express.static(path)` — what each does and when to use each.

**Acceptance Criteria:**
- [ ] `express.json()`: parses requests with `Content-Type: application/json`, populates `req.body` with the parsed JavaScript object — use for REST API clients sending JSON
- [ ] `express.urlencoded({ extended: true })`: parses `application/x-www-form-urlencoded` bodies (HTML form submissions) — `extended: true` uses the `qs` library for nested objects
- [ ] `express.static('public')`: serves files from the given directory directly without route handlers — use for serving React build artifacts, images, CSS
- [ ] All three are middleware that must be registered with `app.use()` before the routes that depend on them
- [ ] States why `req.body` is `undefined` without `express.json()`: body parsing is not automatic in Express 4+; it was removed from the core to keep Express minimal
- [ ] Notes that `express.static` should be placed before API routes to avoid route conflicts on matching filenames

---

### Q5 — asyncHandler ⭐⭐

**Scenario:** A route handler uses `await db.findUser(id)` but when the database throws, Express shows an unhandled promise rejection warning instead of returning a 500.

**Task:** Explain why Express 4 doesn't auto-catch async errors. Write the `asyncHandler` wrapper function. Briefly explain why Express 5 makes it unnecessary.

**Acceptance Criteria:**
- [ ] Express 4 route handlers are synchronous by design — the framework calls `handler(req, res, next)` but does not await its return value, so rejected promises go uncaught
- [ ] `asyncHandler` implementation: `const asyncHandler = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)`
- [ ] The wrapper ensures any rejection is caught and forwarded to Express's error handling via `next(error)`
- [ ] Usage: `router.get('/users/:id', asyncHandler(async (req, res) => { ... }))`
- [ ] Express 5 wraps route handlers automatically and forwards rejected promises to `next`, making `asyncHandler` unnecessary
- [ ] States that forgetting `asyncHandler` on even one async route is a common source of unhandled rejections that can crash the process (Node.js `--unhandled-rejections=throw`)
- [ ] Shows that synchronous throws inside async handlers are also caught by the wrapper (via `Promise.resolve` wrapping)

---

### Q6 — Middleware Order Bug ⭐⭐

**Scenario:** The senior engineer reviews this code and flags a critical bug without running it:
```js
app.use(errorHandler);
app.get('/users', getUsers);
app.get('/posts', getPosts);
```

**Task:** Explain why the `errorHandler` never runs. Show the corrected middleware order. Explain the general rule for middleware ordering.

**Acceptance Criteria:**
- [ ] Express processes middleware in registration order — `errorHandler` is registered first, so it runs before any routes are registered
- [ ] The error handler with 4 parameters is still a middleware; it matches every request as a regular handler (since no errors have been thrown yet), sends a response, and short-circuits the chain
- [ ] Even if it did not send a response, it would call `next()` and routes would run — but then errors thrown by routes would never reach the handler because it already ran
- [ ] Correct order: register routes first, then the catch-all 404 handler, then the error handler last
- [ ] General rule: middleware executes top-to-bottom; error handlers must come after all routes they are meant to catch errors from
- [ ] Demonstrates the fixed stack:
  1. Body parsers / auth middleware
  2. Route handlers
  3. 404 catch-all
  4. Error handler

---

### Q7 — Request Context ⭐⭐

**Scenario:** Log entries from different request handlers are impossible to correlate because no shared request ID ties them together. The team wants every log line for a single request to share a `requestId`.

**Task:** Show how to attach a `requestId` to `req` in middleware and read it in downstream handlers. Show the TypeScript interface extension needed so TypeScript doesn't complain about unknown properties on `req`.

**Acceptance Criteria:**
- [ ] Middleware generates a `requestId` (e.g., `crypto.randomUUID()` or reads `X-Request-ID` header), assigns it to `req.requestId`
- [ ] All subsequent middleware and route handlers in the same request cycle share the same `req` object, so `req.requestId` is available everywhere
- [ ] TypeScript fix: extend the `Request` interface via module augmentation:
  ```ts
  declare global {
    namespace Express {
      interface Request {
        requestId: string;
      }
    }
  }
  ```
- [ ] The augmentation is placed in a `.d.ts` file (e.g., `src/types/express.d.ts`) that is included in `tsconfig.json`
- [ ] Demonstrates reading `req.requestId` in a logger middleware that runs after the ID is assigned
- [ ] Notes the alternative: using `AsyncLocalStorage` to propagate context without threading it through `req` (not required but a bonus)

---

### Q8 — Response Sent Check ⭐⭐

**Scenario:** An intermittent production error reads: `Error [ERR_HTTP_HEADERS_SENT]: Cannot set headers after they are sent to the client`. The route handler calls `res.json()` in one code path and then falls through to another `res.json()` call.

**Task:** Explain what happens when `res.json()` is called twice on the same request. Show how to prevent it using `res.headersSent`. Show a safer pattern using early returns.

**Acceptance Criteria:**
- [ ] Calling `res.json()` a second time after headers are sent throws `ERR_HTTP_HEADERS_SENT` — the HTTP response is already finalized and cannot be modified
- [ ] `res.headersSent` is a boolean that is `true` after any response method (`send`, `json`, `end`, `redirect`) has been called
- [ ] Guard pattern: `if (res.headersSent) return;` at the top of any callback or async branch that might run after the response
- [ ] Safer pattern: use `return res.json(...)` (early return) so execution does not continue past the response call
- [ ] In Express middleware, calling `next()` after `res.json()` is also dangerous — any middleware that also responds will throw; add `return next(...)` or guard with `if (!res.headersSent)`
- [ ] Demonstrates the buggy code path and the fixed version side-by-side

---

### Q9 — Route Parameter Validation Middleware ⭐⭐

**Scenario:** The `/api/users/:id` endpoint crashes with a database error when `id` is not a valid UUID (e.g., `GET /api/users/../../etc/passwd`). The crash leaks the raw DB error to the client.

**Task:** Write a middleware function `validateUuidParam(paramName: string)` that validates the named route parameter is a valid UUID v4 and returns a 400 JSON error before the handler runs.

**Acceptance Criteria:**
- [ ] Extracts the param with `req.params[paramName]`
- [ ] Validates with a UUID v4 regex: `/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i`
- [ ] Returns `res.status(400).json({ error: 'Invalid UUID', param: paramName })` if validation fails — does NOT call `next()`
- [ ] Calls `next()` if valid — allowing the route handler to proceed
- [ ] Is used as: `router.get('/users/:id', validateUuidParam('id'), getUserHandler)`
- [ ] Is a factory function so it can be reused for any param: `validateUuidParam('orgId')`, `validateUuidParam('postId')`
- [ ] Does not swallow errors from the validation logic itself (wraps in try/catch and calls `next(err)` on unexpected errors)

---

### Q10 — Conditional Middleware ⭐⭐

**Scenario:** The `requireAuth` middleware should apply to all routes under `/api/protected` but not to public routes under `/api/public`. The team debates two approaches.

**Task:** Show both approaches: (1) `app.use('/api/protected', requireAuth, protectedRouter)` and (2) `protectedRouter.use(requireAuth)` inside the router file. Explain the difference in behavior and which is more maintainable.

**Acceptance Criteria:**
- [ ] Approach 1: `app.use('/api/protected', requireAuth, protectedRouter)` — `requireAuth` runs for all requests matching `/api/protected/*` before the router handles them
- [ ] Approach 2: inside `protectedRouter.js`, `router.use(requireAuth)` before all route definitions — same effect but auth logic is co-located with the protected routes
- [ ] Approach 2 is more maintainable: the protected router is self-contained and cannot accidentally be mounted without auth
- [ ] Approach 1 risk: if someone mounts `protectedRouter` elsewhere in the app without the `requireAuth` argument, the routes are exposed
- [ ] States that both approaches are correct and the difference is coupling vs. encapsulation
- [ ] Demonstrates that `requireAuth` must be declared before the route definitions in Approach 2 (order still matters inside the router)
- [ ] Notes that `router.use()` without a path prefix applies to all routes on that router

---

### Q11 — 404 Handling ⭐⭐

**Scenario:** The 404 handler was placed at the top of the file "so it catches everything." All API requests now return 404 regardless of the route.

**Task:** Explain why the catch-all 404 middleware must be the last middleware registered. What happens if it is first? Show the correct placement.

**Acceptance Criteria:**
- [ ] A catch-all `app.use((req, res) => ...)` with no path argument matches every incoming request
- [ ] If placed first, it intercepts all requests before any route handlers are reached — every request returns 404
- [ ] Correct placement: register all routes, then the 404 handler, then the error handler (in that order)
- [ ] The 404 handler is reached only if no earlier route called `res.send()` or `next(error)`
- [ ] Shows the correct stack order as comments:
  ```
  // 1. body parsers
  // 2. routes
  // 3. 404 catch-all  ← here
  // 4. error handler  ← last
  ```
- [ ] Notes that a catch-all route like `app.get('*', ...)` has the same issue — it must come after specific routes
- [ ] States that the 404 handler should NOT call `next()` unless intentionally passing to the error handler

---

### Q12 — Middleware Factory Pattern ⭐⭐⭐

**Scenario:** The API has read-heavy `GET /products` and `GET /categories` endpoints that change infrequently. The team wants to cache responses in memory for a configurable TTL without duplicating logic.

**Task:** Implement a `cache(ttl: number)` middleware factory. It should check an in-memory `Map` for a cached response keyed by URL, return it if fresh (within TTL milliseconds), otherwise call `next()`, intercept the response, and cache it.

**Acceptance Criteria:**
- [ ] Factory function signature: `function cache(ttl: number): RequestHandler`
- [ ] Uses a `Map<string, { body: unknown; timestamp: number }>` as the cache store (declared outside the factory so it persists across requests)
- [ ] Cache key: `req.method + ':' + req.url` or just `req.url` for GET-only caching
- [ ] On cache hit: checks `Date.now() - entry.timestamp < ttl`, if fresh, calls `res.json(entry.body)` and returns without calling `next()`
- [ ] On cache miss: wraps `res.json` to intercept the response, stores `{ body, timestamp: Date.now() }` in the map, then sends the response normally
- [ ] Usage: `router.get('/products', cache(60_000), getProductsHandler)`
- [ ] Notes a production caveat: this cache is per-process (does not work in a multi-instance cluster) — Redis would be the production solution

---

### Q13 — Express Performance ⭐⭐⭐

**Scenario:** A security audit flags: `app.use(express.json({ limit: '50mb' }))`. The auditor notes this could be weaponized in a DoS attack. The developer says "we need large payloads for file metadata."

**Task:** Explain why a global 50 MB JSON limit is a DoS vector. Show the correct approach: a small global default with a larger limit only on routes that need it. Include Content-Type validation.

**Acceptance Criteria:**
- [ ] With a 50 MB limit, any unauthenticated client can send a 50 MB POST body — Node.js must buffer it all in memory before JSON.parse runs, exhausting RAM under concurrent requests
- [ ] Attack: send thousands of 50 MB requests with `Content-Type: application/json` — the server allocates memory for each before any auth or rate limiting kicks in
- [ ] Correct approach: `app.use(express.json({ limit: '10kb' }))` as a safe global default
- [ ] Override for specific routes: `router.post('/metadata', express.json({ limit: '5mb' }), metadataHandler)`
- [ ] Check Content-Type before parsing: `express.json()` already does this — only parses requests with `Content-Type: application/json`; explicitly reject others if needed
- [ ] Auth middleware should run before large-body middleware where possible — reject unauthenticated requests before buffering their body
- [ ] States the general principle: apply the most restrictive limit globally, override only where necessary and only after authentication

---

### Q14 — Error Classification ⭐⭐⭐

**Scenario:** The error handler is a 60-line if/else chain mapping error types to HTTP status codes. Every new error type requires editing the handler.

**Task:** Design an `AppError` base class and subclasses `ValidationError`, `NotFoundError`, `UnauthorizedError`, and `ConflictError`. Show an error handler that uses polymorphism (not if/else) to map each to the correct HTTP status.

**Acceptance Criteria:**
- [ ] `AppError` extends `Error` with `statusCode: number` and `isOperational: boolean` properties
- [ ] Each subclass sets its own `statusCode` in the constructor: `ValidationError → 422`, `NotFoundError → 404`, `UnauthorizedError → 401`, `ConflictError → 409`
- [ ] `isOperational: true` marks known, expected errors (safe to send details to the client); `isOperational: false` marks unexpected crashes (send generic 500)
- [ ] Error handler: `if (err instanceof AppError) res.status(err.statusCode).json({ error: err.message })` — no if/else chain needed
- [ ] For non-`AppError` errors: `res.status(500).json({ error: 'Internal server error' })` (never leak raw error details)
- [ ] Usage: `throw new NotFoundError('User not found')` in a route handler — gets caught, returns 404
- [ ] The pattern scales: adding a new error type only requires creating a new subclass, not touching the error handler

---

### Q15 — Graceful Shutdown ⭐⭐⭐

**Scenario:** During a rolling deployment, the load balancer sends `SIGTERM` to the old instance. Some in-flight requests are terminated mid-response, causing client errors. The database connection pool is also not being released cleanly.

**Task:** Implement a `SIGTERM` handler that: stops accepting new connections, waits for in-flight requests to complete, closes the database pool, then exits. Explain why the order of each step matters.

**Acceptance Criteria:**
- [ ] Listens for `process.on('SIGTERM', ...)` (and optionally `SIGINT` for local Ctrl+C)
- [ ] Step 1: `server.close(callback)` — stops the HTTP server from accepting new connections; existing connections are left open until their requests finish
- [ ] Step 2: inside the `server.close()` callback (which fires when all connections are drained), close the database pool: `await db.pool.end()` or equivalent
- [ ] Step 3: `process.exit(0)` after cleanup is complete
- [ ] Order matters: closing the DB pool before in-flight requests finish would cause those requests to fail with DB errors; accepting new requests after shutdown starts would make graceful shutdown impossible
- [ ] Sets a hard timeout (e.g., 30 seconds) with `setTimeout(() => process.exit(1), 30_000)` in case requests hang and drain never completes
- [ ] Notes that Kubernetes sends `SIGTERM` then waits `terminationGracePeriodSeconds` (default 30s) before sending `SIGKILL` — the shutdown must complete within that window
