// ═══════════════════════════════════════════════════════════════
// BACKEND 02: EXPRESS.JS · MIDDLEWARE · ROUTING · ERROR HANDLING  (Day 37)
// Run: npx ts-node 02-express-middleware.ts
// ═══════════════════════════════════════════════════════════════
//
// Express is the most widely-used Node.js web framework.
// It adds a thin, unopinionated layer over Node's raw http module:
//  • Routing — map HTTP method + path to a handler
//  • Middleware — composable functions that process every request
//  • Request / Response helpers — JSON, redirects, status codes
//  • Error handling — centralised, convention-based
//
// The mental model is a PIPELINE:
//   request → mw1 → mw2 → route handler → response
// Each step can read/mutate req & res, then call next() to pass
// control to the next function — or terminate the request itself.

// ───────────────────────────────────────────────────────────────
// 1. Express Fundamentals
// ───────────────────────────────────────────────────────────────

console.log("=== 1. Express Fundamentals ===");

/*
  THEORY
  ──────
  import express from "express";
  const app = express();          // creates an Express application
  app.listen(3000, () => {});     // starts an HTTP server on port 3000

  REQUEST LIFECYCLE
  ─────────────────
  1. Client sends HTTP request (GET /users/42)
  2. Node's http.Server receives it — Express wraps it into `req` and `res`
  3. The request travels through every matching middleware in registration order
  4. The matching route handler sends a response
  5. If no route matches, Express falls through to the default 404 handler

  req OBJECT — key properties
  ───────────────────────────
  req.params        URL route parameters       /users/:id → req.params.id
  req.query         Query-string key/values    /search?q=hi → req.query.q
  req.body          Parsed body (needs middleware like express.json())
  req.headers       Incoming HTTP headers      req.headers['authorization']
  req.method        HTTP verb                  "GET" | "POST" | "PUT" …
  req.path          Path component             "/users/42"
  req.ip            Caller IP
  req.cookies       Parsed cookies (needs cookie-parser middleware)

  res OBJECT — key methods
  ────────────────────────
  res.json(data)            send JSON (sets Content-Type automatically)
  res.status(code)          set HTTP status — chainable: res.status(201).json(…)
  res.send(body)            send string / Buffer / object
  res.redirect(url)         301/302 redirect (or res.redirect(301, url))
  res.set('Header', 'val')  set response header
  res.end()                 terminate without body
*/

// Simulating the structures without a running server:
interface MockReq {
    params:  Record<string, string>;
    query:   Record<string, string>;
    body:    unknown;
    headers: Record<string, string>;
    method:  string;
    path:    string;
}

interface MockRes {
    statusCode: number;
    body:       unknown;
    status(code: number): MockRes;   // chainable
    json(data: unknown): void;
    send(data: string): void;
    redirect(url: string): void;
}

function makeMockRes(): MockRes {
    const res: MockRes = {
        statusCode: 200,
        body: null,
        status(code: number) { this.statusCode = code; return this; },
        json(data: unknown)  { this.body = data; console.log(`  [res.json ${this.statusCode}]`, JSON.stringify(data)); },
        send(data: string)   { this.body = data; console.log(`  [res.send ${this.statusCode}]`, data); },
        redirect(url: string){ console.log(`  [res.redirect]`, url); },
    };
    return res;
}

// Demonstrate: res.status(404).json(...)
const demoRes = makeMockRes();
demoRes.status(404).json({ error: "User not found" });

// Demonstrate: req.params + req.query simulation
const mockReq: MockReq = {
    params:  { id: "42" },
    query:   { sort: "asc", limit: "10" },
    body:    { name: "Sadik", email: "sadik@example.com" },
    headers: { authorization: "Bearer eyJhbGc..." },
    method:  "GET",
    path:    "/api/v1/users/42",
};
console.log("  req.params.id  :", mockReq.params.id);
console.log("  req.query.sort :", mockReq.query.sort);
console.log("  req.headers.auth:", mockReq.headers.authorization.slice(0, 20) + "…");

// ───────────────────────────────────────────────────────────────
// 2. Middleware
// ───────────────────────────────────────────────────────────────

console.log("\n=== 2. Middleware ===");

/*
  THEORY
  ──────
  A middleware is any function with the signature:
    (req, res, next) => void

  EXPRESS MIDDLEWARE CATEGORIES
  ─────────────────────────────
  1. Built-in
       express.json()          — parse application/json bodies into req.body
       express.urlencoded()    — parse HTML-form (URL-encoded) bodies
       express.static()        — serve a folder of static files

  2. Application-level  — app.use(fn)  runs for every request
  3. Router-level       — router.use(fn)  scoped to a router's sub-path
  4. Error-handling     — (err, req, res, next)  — EXACTLY 4 parameters
  5. Third-party        — cors(), helmet(), morgan(), express-rate-limit …

  ORDER MATTERS
  ─────────────
  Middleware executes in the order it is registered.
  Register express.json() BEFORE any route that reads req.body.
  Register the error handler LAST, after all routes.

  next() BEHAVIOUR
  ────────────────
  next()       — pass control to the NEXT matching middleware / route
  next(err)    — skip to the nearest error-handling middleware (4-param)
  (not called) — the request hangs; the client never gets a response
*/

type NextFn = (err?: unknown) => void;

// --- Application-level middleware example ---
function requestLogger(req: MockReq, _res: MockRes, next: NextFn): void {
    const start = Date.now();
    console.log(`  --> ${req.method} ${req.path}`);
    // In a real server you'd hook res.on('finish') to log duration:
    // res.on('finish', () => console.log(`<-- ${res.statusCode} (${Date.now()-start}ms)`));
    next(); // MUST call next() or request hangs
    console.log(`  <-- completed in ${Date.now() - start}ms`);
}

// --- Built-in middleware (conceptual) ---
/*
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
*/

// --- Third-party: cors + helmet (conceptual) ---
/*
  import cors    from "cors";
  import helmet  from "helmet";
  app.use(helmet());   // sets security headers (X-Frame-Options, CSP, etc.)
  app.use(cors({ origin: "https://myapp.com" }));  // CORS headers
*/

// Simulate the middleware pipeline manually:
function runPipeline(
    req: MockReq,
    res: MockRes,
    middlewares: Array<(req: MockReq, res: MockRes, next: NextFn) => void>
): void {
    let index = 0;
    const next: NextFn = (err?: unknown) => {
        if (err) { console.log("  [ERROR passed to next]", err); return; }
        const mw = middlewares[index++];
        if (mw) mw(req, res, next);
    };
    next();
}

const mockReq2: MockReq = { ...mockReq, method: "POST", path: "/api/v1/users" };
runPipeline(mockReq2, makeMockRes(), [requestLogger]);

// ───────────────────────────────────────────────────────────────
// 3. Routing
// ───────────────────────────────────────────────────────────────

console.log("\n=== 3. Routing ===");

/*
  THEORY
  ──────
  express.Router() creates a mini-app that can have its own middleware
  and routes, then gets mounted onto the main app at a prefix.

  ROUTE PARAMETERS
  ────────────────
  app.get("/users/:id", handler)           req.params.id
  app.get("/posts/:postId/comments/:id")   multiple params
  app.get("/files/:path(*)")               wildcard
  app.get("/image/:ext?")                  optional param (ends with ?)

  QUERY STRINGS
  ─────────────
  /search?q=express&page=2
  req.query.q    → "express"
  req.query.page → "2"   (always strings; coerce with Number(req.query.page))

  ROUTE CHAINING
  ──────────────
  router.route("/items")
    .get(getAllItems)        // GET  /items
    .post(createItem);      // POST /items

  router.route("/items/:id")
    .get(getItem)           // GET    /items/:id
    .put(updateItem)        // PUT    /items/:id
    .delete(deleteItem);    // DELETE /items/:id

  MOUNTING
  ────────
  import userRouter from "./routes/users";
  app.use("/api/v1/users", userRouter);
  // All routes inside userRouter are now prefixed with /api/v1/users
*/

// Conceptual router structure that you'd write in routes/users.ts:
/*
  import { Router } from "express";
  const router = Router();

  // Route-level middleware — only for this router
  router.use(authMiddleware);

  router.route("/")
    .get(listUsers)
    .post(createUser);

  router.route("/:id")
    .get(getUser)
    .put(updateUser)
    .delete(deleteUser);

  export default router;
*/

// Demonstrate param extraction logic:
function extractParams(pattern: string, path: string): Record<string, string> | null {
    const patternParts = pattern.split("/");
    const pathParts    = path.split("/");
    if (patternParts.length !== pathParts.length) return null;
    const params: Record<string, string> = {};
    for (let i = 0; i < patternParts.length; i++) {
        if (patternParts[i].startsWith(":")) {
            params[patternParts[i].slice(1)] = pathParts[i];
        } else if (patternParts[i] !== pathParts[i]) {
            return null;
        }
    }
    return params;
}

console.log("  params from /users/:id/posts/:postId →",
    extractParams("/users/:id/posts/:postId", "/users/42/posts/99"));

// ───────────────────────────────────────────────────────────────
// 4. Error Handling
// ───────────────────────────────────────────────────────────────

console.log("\n=== 4. Error Handling ===");

/*
  THEORY
  ──────
  Express error-handling middleware MUST have exactly 4 parameters:
    (err, req, res, next) => void
  If you write only 3, Express treats it as a regular middleware and
  it will never receive errors — a very common gotcha.

  Register the error handler as the LAST app.use() call, after all routes.

  FLOW
  ────
  Route throws → asyncHandler catches → next(err) →
  → Express skips all normal middleware →
  → Calls the nearest 4-param error handler
*/

// --- Custom error class ---
class AppError extends Error {
    public readonly statusCode: number;
    public readonly isOperational: boolean;

    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode    = statusCode;
        this.isOperational = true;           // vs programming errors
        // V8-only: Error.captureStackTrace(this, this.constructor)
        // Produces cleaner stack traces in Node.js; omitted here to keep
        // this file free of @types/node as a dev dependency.
    }
}

// --- asyncHandler wrapper ---
// Wraps an async route handler so any rejected promise is forwarded
// to next(err) automatically.  Without this you'd need try/catch in every route.
type AsyncHandler = (
    req: MockReq,
    res: MockRes,
    next: NextFn
) => Promise<void>;

function asyncHandler(fn: AsyncHandler) {
    return (req: MockReq, res: MockRes, next: NextFn): void => {
        fn(req, res, next).catch(next);   // next(err) on rejection
    };
}

// --- Centralised error handler (the 4-param middleware) ---
function globalErrorHandler(
    err: unknown,
    _req: MockReq,
    res: MockRes,
    _next: NextFn
): void {
    if (err instanceof AppError) {
        // Operational error — expected, safe to expose message
        res.status(err.statusCode).json({
            status: err.statusCode < 500 ? "fail" : "error",
            message: err.message,
        });
    } else {
        // Programming error — don't expose internals
        console.error("UNEXPECTED ERROR:", err);
        res.status(500).json({
            status: "error",
            message: "Something went wrong",
        });
    }
}

// Demo: AppError usage
const notFound = new AppError("User not found", 404);
console.log(`  AppError statusCode=${notFound.statusCode} message="${notFound.message}"`);

// Demo: asyncHandler catches async errors
const simulatedRoute = asyncHandler(async (_req, _res, _next) => {
    throw new AppError("Resource unavailable", 503);
});

// In real Express this next would be the framework's next.
// Here we show that next() is called with the error:
simulatedRoute(
    mockReq,
    makeMockRes(),
    (err) => {
        if (err instanceof AppError) {
            console.log(`  asyncHandler forwarded AppError(${err.statusCode}): ${err.message}`);
        }
    }
);

// ───────────────────────────────────────────────────────────────
// 5. Request Validation with Zod
// ───────────────────────────────────────────────────────────────

console.log("\n=== 5. Request Validation ===");

/*
  THEORY
  ──────
  Zod is the de-facto TypeScript-first validation library.
  It lets you declare a schema and parse/validate data at runtime,
  producing both TypeScript types and runtime guarantees from one source.

  VALIDATION TARGETS
  ──────────────────
  req.body    — POST/PUT payload
  req.params  — URL parameters (always strings, coerce if needed)
  req.query   — query-string values (also always strings)

  PATTERN: validation middleware factory
  ──────────────────────────────────────
  Pass the schema in; the returned middleware does the validation;
  on success it replaces the field with the parsed (coerced) value
  and calls next(); on failure it calls next(validationError).

  import { z, ZodSchema } from "zod";

  function validate<T>(schema: ZodSchema<T>, target: "body" | "params" | "query") {
      return (req: Request, res: Response, next: NextFunction) => {
          const result = schema.safeParse(req[target]);
          if (!result.success) {
              const errors = result.error.errors.map(e => ({
                  field:   e.path.join("."),
                  message: e.message,
              }));
              return res.status(400).json({ status: "fail", errors });
          }
          req[target] = result.data;   // replace with parsed & coerced data
          next();
      };
  }

  USAGE IN A ROUTE
  ────────────────
  const createUserSchema = z.object({
      name:  z.string().min(2).max(50),
      email: z.string().email(),
      age:   z.coerce.number().int().min(0).max(120),
  });

  router.post(
      "/users",
      validate(createUserSchema, "body"),
      createUserHandler
  );

  STRUCTURED ERROR RESPONSE (400)
  ────────────────────────────────
  {
    "status": "fail",
    "errors": [
      { "field": "email",  "message": "Invalid email" },
      { "field": "age",    "message": "Expected number, received string" }
    ]
  }
*/

// Simulate the parse+error-format step without importing Zod at runtime:
interface ZodIssue { path: string[]; message: string; }
interface ParseResult<T> {
    success: boolean;
    data?:   T;
    error?:  { errors: ZodIssue[] };
}

function simulateSafeParse<T>(
    data: unknown,
    rules: Array<{ path: string[]; check: (v: unknown) => boolean; message: string }>
): ParseResult<T> {
    const issues: ZodIssue[] = rules
        .filter(r => !r.check((data as Record<string, unknown>)?.[r.path[0]]))
        .map(r => ({ path: r.path, message: r.message }));
    return issues.length === 0
        ? { success: true,  data: data as T }
        : { success: false, error: { errors: issues } };
}

const badBody = { name: "S", email: "not-an-email" };
const result  = simulateSafeParse(badBody, [
    { path: ["name"],  check: v => typeof v === "string" && (v as string).length >= 2, message: "Too short (min 2)" },
    { path: ["email"], check: v => typeof v === "string" && (v as string).includes("@"), message: "Invalid email" },
]);

if (!result.success && result.error) {
    const errors = result.error.errors.map(e => ({ field: e.path.join("."), message: e.message }));
    console.log("  Validation errors:", JSON.stringify(errors));
}

// ───────────────────────────────────────────────────────────────
// 6. Common Middleware Patterns
// ───────────────────────────────────────────────────────────────

console.log("\n=== 6. Common Middleware Patterns ===");

/*
  THEORY — PATTERN CATALOGUE
  ──────────────────────────

  A) REQUEST ID
  ─────────────
  Attach a unique ID to every request so logs from the same request
  can be correlated across services.

    import { randomUUID } from "crypto";
    app.use((req, res, next) => {
        req.id = (req.headers["x-request-id"] as string) ?? randomUUID();
        res.set("X-Request-Id", req.id);
        next();
    });

  B) REQUEST LOGGER  (replaces morgan for custom needs)
  ──────────────────
    app.use((req, res, next) => {
        const start = Date.now();
        res.on("finish", () => {
            console.log(
                `${req.method} ${req.path} ${res.statusCode} ${Date.now()-start}ms`
            );
        });
        next();
    });

  C) AUTH MIDDLEWARE  (JWT verification)
  ──────────────────
    import jwt from "jsonwebtoken";
    function requireAuth(req, res, next) {
        const header = req.headers.authorization ?? "";
        const token  = header.startsWith("Bearer ") ? header.slice(7) : null;
        if (!token) return next(new AppError("No token", 401));
        try {
            const payload = jwt.verify(token, process.env.JWT_SECRET!);
            req.user = payload;   // attach to req for downstream handlers
            next();
        } catch {
            next(new AppError("Invalid or expired token", 401));
        }
    }

  D) RATE LIMITING  (express-rate-limit)
  ─────────────────
    import rateLimit from "express-rate-limit";
    const limiter = rateLimit({
        windowMs: 15 * 60 * 1000,  // 15 minutes
        max:      100,              // requests per window per IP
        message:  { status: "fail", message: "Too many requests" },
    });
    app.use("/api/", limiter);

  E) RESPONSE TIME HEADER
  ───────────────────────
    app.use((req, res, next) => {
        const start = process.hrtime.bigint();
        res.on("finish", () => {
            const ms = Number(process.hrtime.bigint() - start) / 1_000_000;
            res.set("X-Response-Time", `${ms.toFixed(2)}ms`);
        });
        next();
    });
*/

// Simulate request-ID middleware:
function requestIdMiddleware(req: MockReq & { id?: string }, _res: MockRes, next: NextFn): void {
    const existingId = req.headers["x-request-id"];
    req.id = existingId ?? `req-${Math.random().toString(36).slice(2, 10)}`;
    console.log("  Assigned request ID:", req.id);
    next();
}

const reqWithId = { ...mockReq, headers: { ...mockReq.headers } } as MockReq & { id?: string };
requestIdMiddleware(reqWithId, makeMockRes(), () => {});

// Simulate auth middleware (token parsing step only):
function parseAuthHeader(header: string | undefined): string | null {
    if (!header?.startsWith("Bearer ")) return null;
    return header.slice(7);
}

const token = parseAuthHeader(mockReq.headers["authorization"]);
console.log("  Parsed token (first 10 chars):", token ? token.slice(0, 10) + "…" : "none");

// ───────────────────────────────────────────────────────────────
// 7. App Structure
// ───────────────────────────────────────────────────────────────

console.log("\n=== 7. App Structure ===");

/*
  THEORY — WHY SEPARATE app.ts FROM server.ts
  ─────────────────────────────────────────────
  app.ts    — creates & configures the Express application (no listen call)
  server.ts — imports app, calls app.listen(), handles process signals

  BENEFITS
  ────────
  1. TESTABILITY — import app in tests without binding a port.
     Supertest wraps app directly: request(app).get("/health").expect(200)
  2. CLEAN SHUTDOWN — server.ts owns the http.Server reference, so it can
     gracefully close connections on SIGTERM without app knowing.
  3. SEPARATION OF CONCERNS — app knows routes/middleware; server knows networking.

  RECOMMENDED FOLDER LAYOUT
  ──────────────────────────
  src/
  ├── app.ts                    ← express() config, middleware, route mounting
  ├── server.ts                 ← app.listen(), graceful shutdown
  ├── routes/
  │   ├── index.ts              ← mount all routers here
  │   ├── users.ts              ← express.Router() for /users
  │   └── auth.ts               ← express.Router() for /auth
  ├── middleware/
  │   ├── auth.ts               ← requireAuth, optionalAuth
  │   ├── validate.ts           ← validate() factory
  │   ├── requestId.ts
  │   └── errorHandler.ts       ← globalErrorHandler (4-param)
  ├── controllers/
  │   ├── users.ts              ← handler functions (thin: delegate to services)
  │   └── auth.ts
  ├── services/
  │   └── users.ts              ← business logic, DB calls
  └── errors/
      └── AppError.ts           ← custom error class

  app.ts SKELETON
  ────────────────
    import express from "express";
    import helmet  from "helmet";
    import cors    from "cors";
    import { requestId }     from "./middleware/requestId";
    import { requestLogger } from "./middleware/requestLogger";
    import router            from "./routes";
    import { globalErrorHandler } from "./middleware/errorHandler";

    const app = express();

    // 1. Security headers
    app.use(helmet());
    app.use(cors({ origin: process.env.ALLOWED_ORIGIN }));

    // 2. Body parsing
    app.use(express.json({ limit: "10kb" }));
    app.use(express.urlencoded({ extended: true }));

    // 3. Per-request metadata
    app.use(requestId);
    app.use(requestLogger);

    // 4. Routes
    app.use("/api/v1", router);

    // 5. 404 catch-all (AFTER routes, BEFORE error handler)
    app.use((_req, res) => res.status(404).json({ message: "Route not found" }));

    // 6. Centralised error handler — MUST be last
    app.use(globalErrorHandler);

    export default app;

  server.ts SKELETON
  ───────────────────
    import app from "./app";

    const PORT = Number(process.env.PORT) || 3000;
    const server = app.listen(PORT, () =>
        console.log(`Server running on port ${PORT}`)
    );

    process.on("SIGTERM", () => {
        server.close(() => process.exit(0));
    });
*/

console.log("  app.ts  — configures middleware + routes, no listen()");
console.log("  server.ts — calls app.listen(), owns http.Server ref");
console.log("  Tests import app directly — no port binding needed");

// ───────────────────────────────────────────────────────────────
// PRACTICE
// ───────────────────────────────────────────────────────────────

console.log("\n=== Practice ===");

// Q: What happens if you forget to call next() in a middleware?
// The request HANGS — no response is sent, and the client waits until
// it times out (typically 30s in browsers).  Express does not automatically
// advance to the next middleware or route.  This is one of the most common
// bugs in Express apps.  Always call next(), res.json(), or res.send()
// — one of the three must terminate every middleware's control flow.
console.log("Q1: Forgetting next() → request hangs, client times out.");

// Q: Why must error-handling middleware have exactly 4 parameters?
// Express detects whether a function is an error handler by inspecting
// its .length property (the declared parameter count).  If the function
// has only 3 parameters, Express treats it as a normal middleware and
// will NEVER route errors to it.  TypeScript and linters will not catch
// this; it's purely a runtime convention.  Always declare (err, req, res, next)
// even if you don't use next.
console.log("Q2: Express checks fn.length — 3 params = normal mw, 4 params = error handler.");

// Q: You want all /api/v1/user routes to require auth, but /api/v1/user/login
//    should be public.  How do you structure this?
// Mount a public sub-router BEFORE the auth middleware, then apply
// authMiddleware to the protected router:
//
//   const userRouter = Router();
//   // Public route first — no auth needed
//   userRouter.post("/login",    loginHandler);
//   userRouter.post("/register", registerHandler);
//
//   // Auth guard applied to everything that follows
//   userRouter.use(requireAuth);
//   userRouter.get("/profile",         getProfile);
//   userRouter.put("/change-password", changePassword);
//
//   app.use("/api/v1/user", userRouter);
//
// Because Express executes middleware top-to-bottom, /login and /register
// are matched before requireAuth runs.
console.log("Q3: Place public routes above router.use(requireAuth); order = protection.");

// Q: What's the difference between app.use() and app.get()?
// app.use(path?, fn)  — matches ANY HTTP method; path is a prefix match.
//   app.use("/api", fn) matches /api, /api/users, /api/users/42 …
// app.get(path, fn)   — matches ONLY GET requests; path is an exact match
//   (wildcards and params still work but it's method-specific).
// Use app.use() for middleware (auth, logging, body parsing);
// use app.get/post/put/delete for route handlers.
console.log("Q4: app.use = any method + prefix match; app.get = GET only + exact path.");

// Q: How does asyncHandler prevent you from writing try/catch in every route?
// WITHOUT asyncHandler:
//   router.get("/:id", async (req, res, next) => {
//       try {
//           const user = await UserService.findById(req.params.id);
//           res.json(user);
//       } catch (err) { next(err); }   // ← repeated in EVERY route
//   });
//
// WITH asyncHandler:
//   router.get("/:id", asyncHandler(async (req, res) => {
//       const user = await UserService.findById(req.params.id);   // throws → caught
//       res.json(user);                                            // ← no try/catch
//   }));
//
// asyncHandler wraps the async function in a .catch(next), so any rejected
// promise is automatically forwarded to the global error handler.
// express-async-errors is a drop-in package that monkey-patches Express to
// achieve the same effect globally without any wrapper function.
console.log("Q5: asyncHandler wraps .catch(next) — one central catch instead of N try/catch blocks.");

// ───────────────────────────────────────────────────────────────
// runDemo — Reference Card
// ───────────────────────────────────────────────────────────────

export default function runDemo(): void {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║         EXPRESS MIDDLEWARE REFERENCE CARD                    ║
╠══════════════════════════════════════════════════════════════╣
║  QUICK FACTS                                                 ║
║  ─────────────────────────────────────────────────────────  ║
║  Middleware signature   (req, res, next) => void             ║
║  Error handler          (err, req, res, next) => void        ║
║  next()     → pass to next middleware                        ║
║  next(err)  → skip to error handler                          ║
║  (nothing)  → request hangs (always a bug)                   ║
╠══════════════════════════════════════════════════════════════╣
║  REGISTRATION ORDER (in app.ts)                              ║
║  ─────────────────────────────────────────────────────────  ║
║  1. helmet() + cors()          security headers              ║
║  2. express.json()             body parsing                  ║
║  3. requestId + logger         observability                 ║
║  4. app.use('/api/v1', router) routes                        ║
║  5. 404 catch-all              after all routes              ║
║  6. globalErrorHandler         LAST — 4 params               ║
╠══════════════════════════════════════════════════════════════╣
║  ROUTING CHEAT SHEET                                         ║
║  ─────────────────────────────────────────────────────────  ║
║  router.route('/items')                                      ║
║    .get(listItems).post(createItem)                          ║
║  router.route('/items/:id')                                  ║
║    .get(getItem).put(updateItem).delete(deleteItem)          ║
║  app.use('/api/v1', router)   mount with prefix              ║
╠══════════════════════════════════════════════════════════════╣
║  ERROR HANDLING PATTERN                                      ║
║  ─────────────────────────────────────────────────────────  ║
║  throw new AppError("msg", 404)  operational error           ║
║  asyncHandler(async fn)          auto-catches rejected prms  ║
║  globalErrorHandler(4 params)    single response point       ║
╠══════════════════════════════════════════════════════════════╣
║  VALIDATION WITH ZOD                                         ║
║  ─────────────────────────────────────────────────────────  ║
║  validate(schema, "body")   middleware factory               ║
║  schema.safeParse(req.body) → { success, data, error }       ║
║  400 + { errors: [{field, message}] } on failure             ║
╠══════════════════════════════════════════════════════════════╣
║  STRUCTURE                                                   ║
║  ─────────────────────────────────────────────────────────  ║
║  app.ts     config only (no listen) — importable by tests    ║
║  server.ts  app.listen() + graceful shutdown                 ║
║  routes/    one Router per resource                          ║
║  middleware/ auth, validate, requestId, errorHandler         ║
╚══════════════════════════════════════════════════════════════╝
`);
}

runDemo();
