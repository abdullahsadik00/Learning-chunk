// ═══════════════════════════════════════════════════════════════
// BACKEND 03: REST API DESIGN · PAGINATION · STATUS CODES · RESPONSE CONTRACTS  (Day 38)
// Run: npx ts-node 03-rest-api-design.ts
// ═══════════════════════════════════════════════════════════════
//
// REST = REpresentational State Transfer
//
//  • Architectural style (not a protocol) defined by Roy Fielding in 2000
//  • Works over HTTP — leverages what HTTP already gives you
//  • The goal: a uniform, predictable, scalable interface for distributed systems
//
// WHY DOES REST DESIGN MATTER?
//  1. Consistent APIs are easier for frontend teams to integrate
//  2. Clear contracts reduce bugs across the client-server boundary
//  3. Following HTTP semantics lets infrastructure (caches, proxies, CDNs) work correctly
//  4. A well-designed API is self-documenting

// ───────────────────────────────────────────────────────────────
// 1. REST Principles
// ───────────────────────────────────────────────────────────────

console.log("=== 1. REST Principles ===");

/*
  THE SIX CONSTRAINTS OF REST
  ────────────────────────────

  1. CLIENT-SERVER
     Separation of concerns. The UI (client) and data storage (server) evolve
     independently. They communicate only via a well-defined interface.

  2. STATELESS
     Every request must contain ALL information the server needs to process it.
     The server stores NO session state between requests.
     ✅ Scales horizontally — any server can handle any request
     ✅ Simpler recovery — no session to restore after a crash
     ❌ Slightly larger requests (auth token must be sent every time)

     BAD  — server keeps a "current user" in memory between requests
     GOOD — each request carries `Authorization: Bearer <token>`

  3. CACHEABLE
     Responses must declare themselves cacheable or non-cacheable.
     Cache-Control, ETag, Last-Modified headers do this.
     Caching reduces load and latency dramatically.

  4. UNIFORM INTERFACE  (the core constraint)
     Four sub-constraints:
       a) Resource identification in requests: use URIs to identify resources
       b) Manipulation of resources through representations: GET returns JSON/XML;
          that representation is what the client works with
       c) Self-descriptive messages: each message carries enough info to describe
          how to process it (Content-Type, status code, etc.)
       d) HATEOAS (Hypermedia As The Engine Of Application State): responses
          include links to related actions — the client discovers what it can do
          next from the response itself (rarely implemented fully in practice)

  5. LAYERED SYSTEM
     Client cannot tell whether it is talking directly to the origin server or
     to a proxy, load balancer, or CDN layer. Each layer only sees the next.

  6. CODE ON DEMAND (optional)
     Servers can send executable code (JavaScript) to clients to extend their
     functionality. Web browsers do this natively.
*/

/*
  HTTP METHODS AS VERBS
  ──────────────────────
  REST uses HTTP methods to express WHAT to do; URLs express WHAT to act on.

  GET     — Retrieve a resource. Safe + Idempotent.
  POST    — Create a new resource / trigger an action. Neither safe nor idempotent.
  PUT     — Replace a resource entirely. Idempotent.
  PATCH   — Partial update (only the fields you send). Not guaranteed idempotent.
  DELETE  — Remove a resource. Idempotent.
  HEAD    — Same as GET but no body — used to check existence / headers.
  OPTIONS — Returns the allowed methods for a resource (CORS preflight uses this).

  IDEMPOTENT: calling it N times has the same effect as calling it once.
    GET    — Yes: reading does not change state
    PUT    — Yes: setting name="Alice" twice leaves name="Alice"
    DELETE — Yes: deleting an already-deleted resource still results in it being gone
    POST   — No:  creating a user twice creates two users

  SAFE: the method never modifies server state.
    GET, HEAD, OPTIONS — safe
    Everything else    — not safe
*/

// Demonstrating idempotency concept with plain TypeScript
const database: Record<string, { id: string; name: string }> = {
  "1": { id: "1", name: "Alice" },
};

function putUser(id: string, name: string) {
  database[id] = { id, name };
  return database[id];
}

// Calling PUT twice has the same end state:
putUser("1", "Bob");
putUser("1", "Bob");
console.log("After two identical PUT calls:", database["1"]); // { id: '1', name: 'Bob' }

function postUser(name: string) {
  const id = String(Date.now() + Math.random()); // new ID every time
  database[id] = { id, name };
  return database[id];
}

// Calling POST twice creates two separate resources:
postUser("Carol");
postUser("Carol");
const carolCount = Object.values(database).filter((u) => u.name === "Carol").length;
console.log("After two identical POST calls, Carol entries:", carolCount); // 2

/*
  HATEOAS (brief — rarely fully implemented but worth knowing)
  ────────────────────────────────────────────────────────────
  Responses include hyperlinks to related state transitions.
  A client starting from the API root can discover everything:

  GET /orders/42 →
  {
    "id": 42,
    "status": "pending",
    "_links": {
      "self":   { "href": "/orders/42" },
      "cancel": { "href": "/orders/42/cancel", "method": "POST" },
      "user":   { "href": "/users/7" }
    }
  }

  The client never hard-codes URLs — it follows links. This decouples
  client from server URL structure but adds implementation complexity.
  Most real-world REST APIs skip this and document URLs separately.
*/

// ───────────────────────────────────────────────────────────────
// 2. URL Design
// ───────────────────────────────────────────────────────────────

console.log("\n=== 2. URL Design ===");

/*
  GOLDEN RULE: URLs are nouns (resources). HTTP methods are verbs.

  ❌ WRONG — verbs in the URL (RPC style, not REST)
     GET  /getUsers
     POST /createUser
     POST /deleteUser/123
     GET  /fetchUserOrders?userId=7

  ✅ RIGHT — nouns in the URL, method expresses the action
     GET    /users           → list users
     POST   /users           → create a user
     GET    /users/123       → get user 123
     PUT    /users/123       → replace user 123
     PATCH  /users/123       → partial update user 123
     DELETE /users/123       → delete user 123

  PLURAL NOUNS
  Use plural consistently: /users not /user, /orders not /order.
  This makes collection vs item routes predictable:
    /users        (collection)
    /users/123    (single item)

  NESTED RESOURCES
  Use nesting to express ownership or containment:
    GET  /users/123/orders          → all orders belonging to user 123
    GET  /users/123/orders/456      → order 456 of user 123
    POST /users/123/orders          → create an order for user 123

  Go at most 2 levels deep. Deeper than that becomes unmanageable:
  ❌ /users/123/orders/456/items/789/reviews/101  — too deep
  ✅ /order-items/789/reviews  — flatten by referencing the nested resource directly

  FILTERING VS SUB-RESOURCES
  Sub-resource (new URL): when the relationship is ownership/containment
    /users/123/orders          → orders OWNED by user 123

  Query params: when filtering a collection by criteria
    /orders?userId=123         → orders where userId=123
    /orders?status=shipped     → orders filtered by status
    /users?role=admin&active=true

  Rule of thumb:
    • Would this resource have its own ID and lifecycle? → sub-resource
    • Is it just a filter on an existing collection?     → query param

  VERSIONING
    /api/v1/users     ← URL versioning (most common, most explicit)
    The "v" prefix is conventional. Keep it simple: v1, v2, not v1.2.

  CASE
  Use kebab-case for multi-word segments: /order-items not /orderItems or /order_items
  Use camelCase for query param names: ?pageSize=10 not ?page_size=10 (common convention)

  ACTIONS THAT DON'T MAP NEATLY TO CRUD
  Some operations (like "cancel an order") don't cleanly fit GET/POST/PUT/DELETE.
  Options:
    POST /orders/456/cancel        → sub-resource action (most REST-idiomatic)
    PATCH /orders/456 { "status": "cancelled" }  → treat it as a state update
    POST /order-cancellations { "orderId": 456 } → model the action as a resource
*/

// TypeScript: typed route definitions showing the pattern
type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface RouteDefinition {
  method: HttpMethod;
  path: string;
  description: string;
}

const userRoutes: RouteDefinition[] = [
  { method: "GET",    path: "/api/v1/users",                     description: "List all users" },
  { method: "POST",   path: "/api/v1/users",                     description: "Create a user" },
  { method: "GET",    path: "/api/v1/users/:id",                 description: "Get user by ID" },
  { method: "PUT",    path: "/api/v1/users/:id",                 description: "Replace user" },
  { method: "PATCH",  path: "/api/v1/users/:id",                 description: "Partial update" },
  { method: "DELETE", path: "/api/v1/users/:id",                 description: "Delete user" },
  { method: "GET",    path: "/api/v1/users/:id/orders",          description: "User's orders" },
  { method: "POST",   path: "/api/v1/users/:id/orders",          description: "Create order for user" },
  { method: "GET",    path: "/api/v1/users/:id/orders/:orderId", description: "Specific order of user" },
];

console.log("REST Route Table:");
userRoutes.forEach(r => console.log(`  ${r.method.padEnd(7)} ${r.path.padEnd(40)} → ${r.description}`));

// ───────────────────────────────────────────────────────────────
// 3. HTTP Status Codes
// ───────────────────────────────────────────────────────────────

console.log("\n=== 3. HTTP Status Codes ===");

/*
  ────────────────────────────────────────────────────────────────
  2xx SUCCESS
  ────────────────────────────────────────────────────────────────

  200 OK
    The default success code. Use for GET, PATCH, PUT when returning
    the updated resource. Also for POST when the operation doesn't
    create a new persistent resource (e.g. login, search).

  201 Created
    Use after POST (or PUT) that creates a new resource.
    MUST include a Location header pointing to the new resource:
      Location: /api/v1/users/42
    Body should contain the newly created resource.

  202 Accepted
    The request was received but processing is not yet complete.
    Use for long-running async operations (queue the job, return 202
    with a status-check URL).

  204 No Content
    Success but no body. Common for:
      • DELETE (resource deleted, nothing to return)
      • PUT/PATCH when you choose not to return the updated resource
    Do NOT send a body with 204.

  ────────────────────────────────────────────────────────────────
  3xx REDIRECTION
  ────────────────────────────────────────────────────────────────

  301 Moved Permanently
    The resource has a new permanent URL. Clients and search engines
    should update their bookmarks. Browsers cache this indefinitely.
    Header: Location: <new-url>

  302 Found (Temporary Redirect)
    Redirect for now, but the original URL is still valid.
    Don't cache. Common for "login required" redirects.

  304 Not Modified
    Used with conditional requests (If-None-Match / If-Modified-Since).
    Tells the client its cached copy is still valid — don't re-download.
    No body. This is how HTTP caching saves bandwidth.

  ────────────────────────────────────────────────────────────────
  4xx CLIENT ERRORS
  ────────────────────────────────────────────────────────────────

  400 Bad Request
    The request is malformed or contains invalid data that the server
    cannot parse. Examples:
      • Invalid JSON body
      • Missing required field
      • Type mismatch (sending string where number expected)
    Return a body explaining WHAT is wrong.

  401 Unauthorized (misleading name — actually means "unauthenticated")
    The request lacks valid authentication credentials.
    The client needs to log in / provide a token.
    Response should include: WWW-Authenticate header.
    "I don't know who you are."

  403 Forbidden
    The client IS authenticated, but does not have permission to
    access this resource.
    "I know who you are. You're not allowed."

  404 Not Found
    The resource does not exist at this URL.
    Also used to hide existence of restricted resources (security through obscurity):
    return 404 instead of 403 to avoid confirming the resource exists.

  405 Method Not Allowed
    The URL exists but the HTTP method is not supported.
    E.g. sending DELETE to /users (collection deletion not supported).
    Include an Allow header listing valid methods.

  409 Conflict
    The request conflicts with the current state of the resource.
    Examples:
      • Creating a user with an email that already exists
      • Updating a record with a stale version (optimistic locking)
      • Trying to transition to an invalid state

  422 Unprocessable Entity
    The request is syntactically valid JSON, but the content fails
    business validation rules.
      • 400 → can't even parse it
      • 422 → parsed fine, but the data makes no business sense
    Examples: start date after end date, quantity must be positive, etc.
    Some teams use 400 for both — be consistent within your API.

  429 Too Many Requests
    The client has exceeded rate limits.
    Must include:
      Retry-After: 60          (seconds until they can try again)
      X-RateLimit-Limit: 100   (requests allowed per window)
      X-RateLimit-Remaining: 0 (requests remaining)
      X-RateLimit-Reset: 1700000000 (unix timestamp when window resets)

  ────────────────────────────────────────────────────────────────
  5xx SERVER ERRORS
  ────────────────────────────────────────────────────────────────

  500 Internal Server Error
    An unexpected condition the server couldn't handle.
    Should NEVER expose stack traces or internal details to clients
    (security risk). Log internally, return a generic message.

  502 Bad Gateway
    The server, acting as a gateway/proxy, received an invalid response
    from an upstream server. Common when microservices fail.

  503 Service Unavailable
    The server is temporarily unable to handle requests.
    Reasons: maintenance, overloaded, dependency down.
    Include: Retry-After header so clients know when to try again.

  504 Gateway Timeout
    The server, as a proxy, did not get a timely response from upstream.
    The upstream service is too slow or unresponsive.
*/

// TypeScript: status code reference as a typed map
interface StatusCodeInfo {
  code: number;
  name: string;
  category: "2xx" | "3xx" | "4xx" | "5xx";
  when: string;
}

const statusCodes: StatusCodeInfo[] = [
  { code: 200, name: "OK",                    category: "2xx", when: "Successful GET, PATCH, PUT" },
  { code: 201, name: "Created",               category: "2xx", when: "POST created a resource; include Location header" },
  { code: 202, name: "Accepted",              category: "2xx", when: "Async job queued; not yet processed" },
  { code: 204, name: "No Content",            category: "2xx", when: "DELETE, or update with no body to return" },
  { code: 301, name: "Moved Permanently",     category: "3xx", when: "Resource URL changed forever" },
  { code: 302, name: "Found",                 category: "3xx", when: "Temporary redirect" },
  { code: 304, name: "Not Modified",          category: "3xx", when: "Cached copy is still valid (ETags)" },
  { code: 400, name: "Bad Request",           category: "4xx", when: "Malformed request, invalid JSON, missing field" },
  { code: 401, name: "Unauthorized",          category: "4xx", when: "Not authenticated — who are you?" },
  { code: 403, name: "Forbidden",             category: "4xx", when: "Authenticated but not permitted" },
  { code: 404, name: "Not Found",             category: "4xx", when: "Resource does not exist" },
  { code: 409, name: "Conflict",              category: "4xx", when: "Email already taken, stale version conflict" },
  { code: 422, name: "Unprocessable Entity",  category: "4xx", when: "Valid JSON but fails business validation" },
  { code: 429, name: "Too Many Requests",     category: "4xx", when: "Rate limit exceeded; include Retry-After" },
  { code: 500, name: "Internal Server Error", category: "5xx", when: "Unexpected server failure; never expose details" },
  { code: 502, name: "Bad Gateway",           category: "5xx", when: "Upstream microservice returned invalid response" },
  { code: 503, name: "Service Unavailable",   category: "5xx", when: "Server overloaded or in maintenance" },
  { code: 504, name: "Gateway Timeout",       category: "5xx", when: "Upstream service too slow or unresponsive" },
];

console.log("Status code count by category:");
const categories = ["2xx", "3xx", "4xx", "5xx"] as const;
categories.forEach(cat => {
  const count = statusCodes.filter(s => s.category === cat).length;
  console.log(`  ${cat}: ${count} codes`);
});

// ───────────────────────────────────────────────────────────────
// 4. Response Envelope Pattern
// ───────────────────────────────────────────────────────────────

console.log("\n=== 4. Response Envelope Pattern ===");

/*
  WHY A CONSISTENT ENVELOPE?
  ──────────────────────────
  Without an envelope, responses look different everywhere:
    GET /users/1  → { "id": 1, "name": "Alice" }
    GET /users    → [{ "id": 1 }, { "id": 2 }]
    Error         → "User not found"   ← sometimes a string!
    Error         → { "msg": "error" } ← sometimes an object with different keys!

  Frontend teams write defensive code for every endpoint. Types become
  impossible. Error handling is a mess of if/else chains.

  WITH AN ENVELOPE: every response follows one of two shapes.

  SUCCESS SHAPE:
  {
    "success": true,
    "data": <the actual resource or array>,
    "meta": {              ← optional, for pagination, timing, etc.
      "total": 100,
      "page": 1,
      "limit": 20,
      "hasNextPage": true
    }
  }

  ERROR SHAPE:
  {
    "success": false,
    "error": {
      "code": "USER_NOT_FOUND",   ← machine-readable, for frontend switch statements
      "message": "No user with ID 999 exists",  ← human-readable
      "details": [               ← optional, for validation errors
        { "field": "email", "issue": "must be a valid email address" },
        { "field": "age",   "issue": "must be a positive integer" }
      ]
    }
  }

  BENEFITS:
  1. Frontend can always check `if (response.success)` — one pattern everywhere
  2. TypeScript types are clean and reusable
  3. Error codes let frontend show localised messages without parsing strings
  4. `meta` keeps pagination separate from the actual data
  5. New fields can be added to envelope without breaking data consumers
*/

// TypeScript: fully typed response envelope
interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Array<{ field: string; issue: string }>;
  };
}

type ApiResponse<T> = ApiSuccess<T> | ApiError;

// Factory helpers — use these in every route handler
function ok<T>(data: T, meta?: Record<string, unknown>): ApiSuccess<T> {
  return { success: true, data, ...(meta ? { meta } : {}) };
}

function fail(code: string, message: string, details?: Array<{ field: string; issue: string }>): ApiError {
  return { success: false, error: { code, message, ...(details ? { details } : {}) } };
}

// Example: a typed handler result
interface User {
  id: number;
  name: string;
  email: string;
}

function getUser(id: number): ApiResponse<User> {
  if (id === 999) {
    return fail("USER_NOT_FOUND", `No user with ID ${id} exists`);
  }
  return ok({ id, name: "Alice", email: "alice@example.com" });
}

function createUser(body: unknown): ApiResponse<User> {
  // Validation failure example
  if (typeof body !== "object" || body === null) {
    return fail("VALIDATION_ERROR", "Request body is invalid", [
      { field: "email", issue: "required" },
      { field: "name",  issue: "required" },
    ]);
  }
  return ok({ id: 42, name: "Bob", email: "bob@example.com" });
}

const found    = getUser(1);
const notFound = getUser(999);
const created  = createUser(null);

console.log("GET /users/1:  ", found.success ? "success" : `error: ${notFound.success === false ? notFound.error.code : ""}`);
console.log("GET /users/999:", notFound.success ? "success" : `error: ${notFound.success === false ? notFound.error.code : ""}`);
console.log("POST /users (invalid body):", created.success ? "success" : `error: ${created.success === false ? created.error.code : ""}`);

// ───────────────────────────────────────────────────────────────
// 5. Pagination
// ───────────────────────────────────────────────────────────────

console.log("\n=== 5. Pagination ===");

/*
  WHY PAGINATE?
  Returning all records at once kills performance. 1 million users in one
  response = OOM errors, timeouts, unusable UIs.

  ────────────────────────────────────────────────────────────────
  STRATEGY 1: OFFSET / LIMIT  (simple, but has problems at scale)
  ────────────────────────────────────────────────────────────────

  Client sends:  GET /users?page=3&limit=20
  Server does:   SELECT * FROM users LIMIT 20 OFFSET 40

  Pros:
    • Simple to implement and understand
    • User can jump to any page directly
    • Easy to show "Page 3 of 47"

  Cons:
    • OFFSET is slow on large tables: DB must scan and discard rows 0-39
      before returning rows 40-59. At OFFSET 1000000 it's catastrophic.
    • Duplicate / missing rows if data changes between page requests:
        User inserts a new row → everyone on page 1 shifts → page 2
        now returns one row that page 1 already showed.
    • COUNT(*) for total pages is also expensive on large tables.

  When to use: small datasets (<100k rows), admin dashboards, anything
  where jumping to a specific page matters.

  ────────────────────────────────────────────────────────────────
  STRATEGY 2: CURSOR-BASED PAGINATION (scalable, no duplicates)
  ────────────────────────────────────────────────────────────────

  Instead of a page number, the server returns an opaque cursor pointing
  to the last item returned. The client passes it back for the next page.

  Client: GET /users?limit=20
  Server returns:
    data: [user1, user2, ..., user20]
    meta: { hasNextPage: true, nextCursor: "eyJpZCI6MjB9" }

  Client: GET /users?limit=20&cursor=eyJpZCI6MjB9
  Server decodes cursor → knows to fetch users WHERE id > 20

  Pros:
    • O(1) performance — DB query uses an indexed WHERE clause, not OFFSET
    • No duplicate/skipped rows when data changes between requests
    • Scales to billions of rows

  Cons:
    • No jumping to page 47 — must walk sequentially
    • Cursor is opaque — UI can't easily show "page X of Y"
    • More complex to implement

  Cursor encoding: typically base64-encode a JSON object:
    { id: 20 }  →  base64  →  "eyJpZCI6MjB9"
  This hides implementation details from clients and lets you change
  the cursor structure without breaking the API contract.

  ────────────────────────────────────────────────────────────────
  STRATEGY 3: KEYSET PAGINATION (variant of cursor-based)
  ────────────────────────────────────────────────────────────────

  Similar to cursor but exposes the key value directly in the URL:
    GET /users?after_id=20&limit=20
  Server: SELECT * FROM users WHERE id > 20 ORDER BY id LIMIT 20

  Simpler to implement than opaque cursors.
  Works best when sorting by the primary key.
  Harder to use with complex sort orders (e.g. sort by name + tiebreak on id).

  ────────────────────────────────────────────────────────────────
  RESPONSE META — what to include
  ────────────────────────────────────────────────────────────────

  For offset pagination:
  {
    "total": 1543,       ← total items (expensive COUNT but needed for UI)
    "page": 3,
    "limit": 20,
    "totalPages": 78,
    "hasNextPage": true,
    "hasPrevPage": true
  }

  For cursor pagination:
  {
    "limit": 20,
    "hasNextPage": true,
    "nextCursor": "eyJpZCI6MjB9"   ← null when no more pages
  }

  DECISION GUIDE:
    Need to jump to arbitrary pages? → Offset
    Dataset > 100k rows?             → Cursor
    Real-time feed (new items constantly added)? → Cursor
    Simple admin list?               → Offset
*/

// TypeScript: pagination types and a cursor implementation

interface OffsetPaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface CursorPaginationMeta {
  limit: number;
  hasNextPage: boolean;
  nextCursor: string | null;
}

// Cursor encoding/decoding helpers
function encodeCursor(payload: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function decodeCursor(cursor: string): Record<string, unknown> {
  return JSON.parse(Buffer.from(cursor, "base64url").toString("utf8"));
}

// Simulated in-memory dataset
const allUsers = Array.from({ length: 50 }, (_, i) => ({
  id: i + 1,
  name: `User${i + 1}`,
  createdAt: new Date(2024, 0, i + 1).toISOString(),
}));

function paginateOffset(page: number, limit: number) {
  const offset = (page - 1) * limit;
  const data = allUsers.slice(offset, offset + limit);
  const total = allUsers.length;
  const totalPages = Math.ceil(total / limit);
  const meta: OffsetPaginationMeta = {
    total, page, limit, totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
  return ok(data, meta as unknown as Record<string, unknown>);
}

function paginateCursor(cursor: string | null, limit: number) {
  let startId = 0;
  if (cursor) {
    const decoded = decodeCursor(cursor);
    startId = decoded["id"] as number;
  }
  const data = allUsers.filter(u => u.id > startId).slice(0, limit);
  const hasNextPage = allUsers.some(u => u.id > (data.at(-1)?.id ?? 0));
  const nextCursor = hasNextPage && data.length > 0
    ? encodeCursor({ id: data.at(-1)!.id })
    : null;
  const meta: CursorPaginationMeta = { limit, hasNextPage, nextCursor };
  return ok(data, meta as unknown as Record<string, unknown>);
}

const page1 = paginateOffset(1, 10);
const page2 = paginateOffset(2, 10);
console.log("Offset page 1 — items returned:", (page1.data as unknown[]).length, "| meta:", page1.meta);
console.log("Offset page 2 — items returned:", (page2.data as unknown[]).length);

const cursorPage1 = paginateCursor(null, 10);
const cursorMeta1 = cursorPage1.meta as unknown as CursorPaginationMeta;
console.log("Cursor page 1 — items:", (cursorPage1.data as unknown[]).length, "| hasNextPage:", cursorMeta1.hasNextPage);

const cursorPage2 = paginateCursor(cursorMeta1.nextCursor, 10);
const cursorMeta2 = cursorPage2.meta as unknown as CursorPaginationMeta;
console.log("Cursor page 2 — first id:", (cursorPage2.data as Array<{ id: number }>)[0].id, "| nextCursor:", cursorMeta2.nextCursor?.slice(0, 10) + "...");

// ───────────────────────────────────────────────────────────────
// 6. Filtering, Sorting, Searching
// ───────────────────────────────────────────────────────────────

console.log("\n=== 6. Filtering, Sorting, Searching ===");

/*
  FILTERING
  ─────────
  Use query params to filter a collection:
    GET /users?role=admin&active=true
    GET /orders?status=shipped&createdAfter=2024-01-01

  Parse and validate each param server-side. Never interpolate directly
  into SQL — use parameterised queries or an ORM.

  Prisma example:
    const users = await prisma.user.findMany({
      where: {
        role: req.query.role as string,       // "admin"
        active: req.query.active === "true",  // boolean coercion
      }
    });

  SORTING
  ───────
  Convention: ?sort=<field>:<direction>
    GET /users?sort=createdAt:desc
    GET /users?sort=name:asc
    GET /users?sort=createdAt:desc,name:asc   ← multi-field sort

  Parse:
    const [field, dir = "asc"] = (req.query.sort as string).split(":");
    const orderBy = { [field]: dir };  // { createdAt: "desc" }

  Only allow known fields to prevent SQL injection or Prisma errors:
    const SORTABLE_FIELDS = ["name", "createdAt", "email"] as const;
    if (!SORTABLE_FIELDS.includes(field)) throw new Error("Invalid sort field");

  SPARSE FIELDSETS (field projection)
  ─────────────────────────────────────
  Allow clients to request only the fields they need:
    GET /users?fields=id,name,email
    → returns { id, name, email } — omits avatar, passwordHash, etc.

  Benefits: smaller payload, better performance, hides sensitive fields.
  Prisma example:
    const select = parseFields(req.query.fields as string);
    // { id: true, name: true, email: true }
    const users = await prisma.user.findMany({ select });

  FULL-TEXT SEARCH
  ────────────────
  Use ?search= for free-text search across one or more fields:
    GET /users?search=john

  Options:
    • Simple: WHERE name ILIKE '%john%'  (slow on large tables without GIN index)
    • PostgreSQL: full-text search with tsvector + GIN index (fast)
    • Dedicated search engine: Elasticsearch / Typesense / Meilisearch (best for complex search)

  COMBINING EVERYTHING
  ─────────────────────
  GET /users?role=admin&sort=createdAt:desc&search=alice&page=2&limit=20&fields=id,name,email

  Parse order: validate → filter → search → sort → paginate → project fields
*/

// TypeScript: typed query param parsing utilities

type SortDirection = "asc" | "desc";

interface ParsedSort {
  field: string;
  direction: SortDirection;
}

function parseSortParam(sortParam: string | undefined, allowedFields: readonly string[]): ParsedSort {
  const DEFAULT: ParsedSort = { field: "id", direction: "asc" };
  if (!sortParam) return DEFAULT;

  const [field, rawDir = "asc"] = sortParam.split(":");
  const direction: SortDirection = rawDir === "desc" ? "desc" : "asc";

  if (!allowedFields.includes(field)) {
    console.warn(`  [parseSort] Invalid sort field "${field}", falling back to default`);
    return DEFAULT;
  }

  return { field, direction };
}

function parseFieldsParam(fieldsParam: string | undefined, allowedFields: readonly string[]): Record<string, true> | undefined {
  if (!fieldsParam) return undefined;
  const requested = fieldsParam.split(",").filter(f => allowedFields.includes(f));
  if (requested.length === 0) return undefined;
  return Object.fromEntries(requested.map(f => [f, true])) as Record<string, true>;
}

const ALLOWED_SORT_FIELDS = ["id", "name", "createdAt", "email"] as const;
const ALLOWED_SELECT_FIELDS = ["id", "name", "email", "createdAt"] as const;

const sort1 = parseSortParam("createdAt:desc", ALLOWED_SORT_FIELDS);
const sort2 = parseSortParam("hacked:asc", ALLOWED_SORT_FIELDS);  // invalid — falls back
const select = parseFieldsParam("id,name,email", ALLOWED_SELECT_FIELDS);

console.log("Parsed sort:", sort1);
console.log("Invalid sort (fallback):", sort2);
console.log("Sparse fieldset select:", select);

// Simulate applying these to a dataset (no DB available, so we do it in-memory)
type UserRecord = typeof allUsers[number];

function applySort(users: UserRecord[], sort: ParsedSort): UserRecord[] {
  return [...users].sort((a, b) => {
    const aVal = a[sort.field as keyof UserRecord] as string | number;
    const bVal = b[sort.field as keyof UserRecord] as string | number;
    const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    return sort.direction === "desc" ? -cmp : cmp;
  });
}

function applySearch(users: UserRecord[], query: string): UserRecord[] {
  const q = query.toLowerCase();
  return users.filter(u => u.name.toLowerCase().includes(q));
}

const searchResults = applySearch(allUsers, "User4");
const sorted = applySort(searchResults, { field: "id", direction: "desc" });
console.log("Search 'User4' results (sorted desc):", sorted.map(u => u.name));

// ───────────────────────────────────────────────────────────────
// 7. API Versioning Strategies
// ───────────────────────────────────────────────────────────────

console.log("\n=== 7. API Versioning Strategies ===");

/*
  WHY VERSION?
  When you make a breaking change to your API, existing clients break.
  Versioning lets old and new clients coexist while you migrate.

  ────────────────────────────────────────────────────────────────
  STRATEGY 1: URL VERSIONING  ← most common, most explicit
  ────────────────────────────────────────────────────────────────
  GET /api/v1/users
  GET /api/v2/users

  Pros:
    • Visible in URLs, logs, browser history — easy to spot which version
    • Easy to route at the infrastructure level (NGINX, API Gateway)
    • Can run v1 and v2 simultaneously on different services
    • Simple for clients to migrate: just change the URL prefix

  Cons:
    • URLs are supposed to identify resources, not versions of the API
    • Duplicates routes — need to maintain v1 AND v2 handlers

  ────────────────────────────────────────────────────────────────
  STRATEGY 2: HEADER VERSIONING
  ────────────────────────────────────────────────────────────────
  GET /api/users
  Accept-Version: 2
  — or —
  Accept: application/vnd.myapi.v2+json

  Pros:
    • URLs stay clean — the resource location doesn't change
    • More "RESTful" in the academic sense
    • Can version individual fields, not just entire routes

  Cons:
    • Invisible in browser address bar and most logs
    • Harder to test directly in a browser
    • Custom headers may be stripped by proxies or API gateways
    • Clients must set headers explicitly — easy to forget

  ────────────────────────────────────────────────────────────────
  STRATEGY 3: QUERY PARAM VERSIONING
  ────────────────────────────────────────────────────────────────
  GET /api/users?version=2

  Pros:
    • Visible in URL
    • Easy to test in a browser

  Cons:
    • Query params are supposed to be for filtering, not routing
    • Breaks caching (caches may treat ?version=1 and ?version=2 identically)
    • Messy alongside real filter params

  ────────────────────────────────────────────────────────────────
  COMPARISON TABLE
  ────────────────────────────────────────────────────────────────

  Strategy        │ Visibility │ Caching │ REST-purity │ Ease of use
  ────────────────┼────────────┼─────────┼─────────────┼────────────
  URL versioning  │ High       │ Works   │ Low         │ Easy
  Header          │ Low        │ Works   │ High        │ Medium
  Query param     │ Medium     │ Risky   │ Low         │ Easy
  ────────────────┴────────────┴─────────┴─────────────┴────────────
  Recommendation: URL versioning for public APIs.
                  Header versioning for internal microservices.

  DEPRECATION NOTICES
  ───────────────────
  When v1 is deprecated but still alive:
  1. Add a Deprecation header to all v1 responses:
       Deprecation: true
       Sunset: Sat, 31 Dec 2025 23:59:59 GMT   ← when it shuts down
       Link: </api/v2/users>; rel="successor-version"
  2. Email API key holders 3–6 months before shutdown
  3. Return a warning in the response envelope:
       "meta": { "deprecationWarning": "v1 retires 2025-12-31. Migrate to /api/v2" }
  4. Log v1 usage so you know who hasn't migrated yet
*/

// TypeScript: Express-style versioning middleware simulation

function makeVersionedHandler(version: 1 | 2) {
  return function handleGetUsers(query: Record<string, string>) {
    const headers: Record<string, string> = {};

    if (version === 1) {
      headers["Deprecation"] = "true";
      headers["Sunset"] = "Sat, 31 Dec 2025 23:59:59 GMT";
      headers["Link"] = '</api/v2/users>; rel="successor-version"';
    }

    const data = version === 1
      ? allUsers.slice(0, 3).map(u => ({ id: u.id, name: u.name })) // v1: fewer fields
      : allUsers.slice(0, 3).map(u => ({ ...u, version: 2 }));      // v2: full object

    return { headers, body: ok(data, version === 1 ? { deprecationWarning: "Migrate to /api/v2" } : undefined) };
  };
}

const v1Handler = makeVersionedHandler(1);
const v2Handler = makeVersionedHandler(2);

const v1Response = v1Handler({});
const v2Response = v2Handler({});

console.log("v1 Deprecation header:", v1Response.headers["Deprecation"]);
console.log("v1 Sunset header:", v1Response.headers["Sunset"]);
console.log("v1 meta:", v1Response.body.meta);
console.log("v2 has deprecation header:", "Deprecation" in v2Response.headers);

// ───────────────────────────────────────────────────────────────
// 8. Rate Limiting and Throttling
// ───────────────────────────────────────────────────────────────

console.log("\n=== 8. Rate Limiting and Throttling ===");

/*
  WHY RATE LIMIT?
  ────────────────
  1. Protect the server from abuse (scraping, credential stuffing, DDoS)
  2. Ensure fair usage — one client cannot starve others
  3. Monetise API tiers (free: 100 req/min, pro: 1000 req/min)
  4. Prevent runaway clients from accidentally hammering the API

  RATE LIMIT vs THROTTLE
  ────────────────────────
  Rate limiting: hard cap — once exceeded, requests are REJECTED (429)
  Throttling:    soft cap — requests are SLOWED DOWN (queued/delayed), not rejected

  ALGORITHMS
  ──────────
  Fixed Window:   count requests in a time bucket (e.g. 100 per minute).
                  Simple, but "thundering herd" at window boundaries.

  Sliding Window: count requests in a rolling window. Smoother.
                  More memory-intensive.

  Token Bucket:   each client has a "bucket" of N tokens. Each request
                  costs 1 token. Tokens refill at a fixed rate.
                  Allows bursts up to bucket size.

  Leaky Bucket:   requests enter a queue (the bucket) and are processed at
                  a fixed rate. Excess overflows. Smooths bursty traffic.

  HEADERS TO RETURN (standard, clients rely on these)
  ────────────────────────────────────────────────────
  X-RateLimit-Limit: 100         ← max requests per window
  X-RateLimit-Remaining: 47      ← requests left in this window
  X-RateLimit-Reset: 1700000060  ← unix timestamp when window resets
  Retry-After: 60                ← seconds to wait (on 429 response)

  PER-USER vs PER-IP
  ──────────────────
  Per-IP:   No auth needed, easy to implement. Problem: shared IPs (offices,
            NAT, proxies) get all their users sharing one limit.
  Per-user: Uses the authenticated user ID. Fairer but requires auth.
  Best:     Both. Unauthenticated requests: per-IP. Authenticated: per-user.

  COMMON LIMITS (rough industry norms)
  ─────────────────────────────────────
  Public API, free tier:   60–100 req/min
  Public API, paid tier:   1000+ req/min
  Internal microservices:  Usually much higher or unlimited
  Login endpoints:         5–10 attempts/min (then lockout)
  Expensive endpoints:     Lower limits (e.g. AI inference: 10 req/min)

  IMPLEMENTATION IN EXPRESS (conceptual)
  ───────────────────────────────────────
  Use redis-backed sliding window or the `express-rate-limit` package:

  import rateLimit from "express-rate-limit";

  const limiter = rateLimit({
    windowMs: 60 * 1000,    // 1 minute window
    max: 100,               // 100 requests per window
    standardHeaders: true,  // sends X-RateLimit-* headers
    legacyHeaders: false,
    keyGenerator: (req) => req.user?.id ?? req.ip,  // per-user then per-IP
    handler: (req, res) => {
      res.status(429).json(fail(
        "RATE_LIMIT_EXCEEDED",
        "Too many requests, please try again later."
      ));
    }
  });

  app.use("/api/", limiter);         // global limit
  app.use("/api/v1/login", stricterLimiter);  // tighter limit on auth
*/

// TypeScript: in-memory rate limiter (fixed window)
interface RateLimitState {
  count: number;
  windowStart: number;
}

class FixedWindowRateLimiter {
  private readonly windowMs: number;
  private readonly max: number;
  private store = new Map<string, RateLimitState>();

  constructor(windowMs: number, max: number) {
    this.windowMs = windowMs;
    this.max = max;
  }

  check(key: string): { allowed: boolean; remaining: number; resetAt: number } {
    const now = Date.now();
    const state = this.store.get(key);

    // Start new window if no state or window expired
    if (!state || now - state.windowStart >= this.windowMs) {
      const newState: RateLimitState = { count: 1, windowStart: now };
      this.store.set(key, newState);
      return { allowed: true, remaining: this.max - 1, resetAt: now + this.windowMs };
    }

    // Within existing window
    if (state.count >= this.max) {
      return { allowed: false, remaining: 0, resetAt: state.windowStart + this.windowMs };
    }

    state.count++;
    return {
      allowed: true,
      remaining: this.max - state.count,
      resetAt: state.windowStart + this.windowMs,
    };
  }

  getHeaders(key: string): Record<string, string> {
    const result = this.check(key);
    return {
      "X-RateLimit-Limit":     String(this.max),
      "X-RateLimit-Remaining": String(result.remaining),
      "X-RateLimit-Reset":     String(Math.floor(result.resetAt / 1000)),
      ...(result.allowed ? {} : { "Retry-After": String(Math.ceil((result.resetAt - Date.now()) / 1000)) }),
    };
  }
}

const limiter = new FixedWindowRateLimiter(60_000, 5); // 5 requests per minute (demo)

for (let i = 1; i <= 7; i++) {
  const result = limiter.check("user:42");
  console.log(`Request ${i}: allowed=${result.allowed}, remaining=${result.remaining}`);
}

// ───────────────────────────────────────────────────────────────
// PRACTICE Q&A
// ───────────────────────────────────────────────────────────────

console.log("\n=== Practice Q&A ===");

/*
  Q1: Should DELETE /users/123 return 200 or 204? What's the difference?
  ────────────────────────────────────────────────────────────────────────
  A: Both are acceptable — the choice depends on what you want to return.

  204 No Content: The most semantically correct choice. The resource is
  deleted, there is nothing useful to return. No body is sent. This is
  the REST purist's preference.

  200 OK: Use this if you want to return something in the body — for
  example, the deleted resource itself (so the client can undo), an audit
  log entry, or a confirmation message. Body must be present.

  202 Accepted: If deletion is async (queued for background processing),
  return 202 with a status-check URL.

  Common practice: 204 for simple deletes. 200 if you return a body.
  Never return 200 with an empty body — that's what 204 is for.

  ────────────────────────────────────────────────────────────────────────
  Q2: What's wrong with GET /getUsers and POST /createUser?
  ────────────────────────────────────────────────────────────────────────
  A: Multiple problems:

  1. VERBS IN THE URL. REST uses HTTP methods as verbs. The URL should
     name the resource (noun), not the action. "get" and "create" are
     already expressed by GET and POST.

  2. NOT RESOURCE-ORIENTED. /getUsers and /createUser describe operations,
     not resources. This is RPC style (like SOAP or JSON-RPC), not REST.

  3. UNPREDICTABLE. A new developer cannot guess whether you wrote
     /getUser or /fetchUser or /retrieveUser. With REST, it's always
     GET /users — no guessing.

  4. CACHING BREAKS. HTTP caches and CDNs key on the URL. GET /users
     is cacheable. GET /getUsers looks like a custom verb to proxies
     that don't understand your naming convention.

  Fix: GET /users, POST /users. The method tells you what to do;
  the URL tells you what to do it to.

  ────────────────────────────────────────────────────────────────────────
  Q3: Cursor vs offset pagination — when does offset pagination break?
  ────────────────────────────────────────────────────────────────────────
  A: Offset pagination breaks in two ways:

  1. PERFORMANCE: SELECT * FROM users OFFSET 1000000 LIMIT 20 forces the
     database to scan and discard 1,000,000 rows before returning 20.
     Even with indexes, this is O(N) in the offset value. On a 10M row
     table, page 500,000 is unusably slow.

  2. DATA CONSISTENCY: If a new row is inserted between page 1 and page 2
     requests, every existing row shifts position. The item that was row
     21 is now row 22. Page 2 will show the old row 20 again (duplicate)
     or skip the new row 1 (miss). On high-write tables this is constant.

  Cursor pagination solves both:
  Performance: WHERE id > 1000020 LIMIT 20 uses an index seek — O(log N).
  Consistency: The cursor points to a specific row, not a position.
               New rows inserted before it don't affect results after it.

  ────────────────────────────────────────────────────────────────────────
  Q4: A client sends invalid JSON in the body. What status code do you return?
  ────────────────────────────────────────────────────────────────────────
  A: 400 Bad Request.

  Invalid JSON means the server cannot parse the request body at all.
  The request is malformed at the syntactic level — before any business
  logic can be applied.

  Include a clear error body:
  {
    "success": false,
    "error": {
      "code": "INVALID_JSON",
      "message": "Request body contains invalid JSON. Check for trailing commas, unquoted keys, or mismatched brackets."
    }
  }

  NOT 422: 422 Unprocessable Entity is for a syntactically valid body that
  fails semantic/business validation (e.g. valid JSON, but start_date is
  after end_date). If you can't even parse the JSON, it's 400.

  ────────────────────────────────────────────────────────────────────────
  Q5: What's the difference between 401 and 403?
  ────────────────────────────────────────────────────────────────────────
  A:
  401 Unauthorized = NOT AUTHENTICATED
    "I don't know who you are. Provide valid credentials."
    The client should authenticate (log in, provide a token) and retry.
    Response should include: WWW-Authenticate: Bearer realm="api"
    Example: accessing a protected endpoint without a token.

  403 Forbidden = NOT AUTHORISED
    "I know who you are. You don't have permission for this."
    Authenticating again won't help — the user lacks the required role/permission.
    Example: a regular user trying to access /admin/users.

  Memory aid:
    401 → "You haven't introduced yourself yet."
    403 → "I know you, but you're not on the guest list."

  Edge case: sometimes servers return 404 instead of 403 to hide the
  existence of a resource from unauthorised users (security through obscurity).
  This is a valid security pattern: don't confirm that a resource exists
  to someone who shouldn't know about it.
*/

console.log("Q1: DELETE → 204 (no body) or 200 (with body). 204 is the default.");
console.log("Q2: /getUsers is RPC-style. REST uses GET /users — method IS the verb.");
console.log("Q3: Offset breaks at scale (O(N) scan) and with concurrent writes (duplicates/gaps).");
console.log("Q4: 400 Bad Request — cannot parse the body at all.");
console.log("Q5: 401=not authenticated (who are you?), 403=not authorised (you can't do this).");

// ───────────────────────────────────────────────────────────────
// runDemo — Reference Card
// ───────────────────────────────────────────────────────────────

function runDemo(): void {
  console.log("\n");
  console.log("╔══════════════════════════════════════════════════════════════════════════╗");
  console.log("║              REST API DESIGN — QUICK REFERENCE CARD                     ║");
  console.log("╚══════════════════════════════════════════════════════════════════════════╝");

  console.log("\n── HTTP STATUS CODES ─────────────────────────────────────────────────────");
  console.log("  Code │ Name                    │ When");
  console.log("  ─────┼─────────────────────────┼─────────────────────────────────────────");
  statusCodes.forEach(s => {
    console.log(`  ${String(s.code).padEnd(5)}│ ${s.name.padEnd(24)}│ ${s.when}`);
  });

  console.log("\n── REST URL PATTERNS ─────────────────────────────────────────────────────");
  const urlPatterns = [
    { method: "GET",    url: "/api/v1/users",                     desc: "List users (with filter/sort/page)" },
    { method: "POST",   url: "/api/v1/users",                     desc: "Create user → 201 + Location header" },
    { method: "GET",    url: "/api/v1/users/:id",                 desc: "Get one user → 200 or 404" },
    { method: "PUT",    url: "/api/v1/users/:id",                 desc: "Replace user → 200 (idempotent)" },
    { method: "PATCH",  url: "/api/v1/users/:id",                 desc: "Partial update → 200" },
    { method: "DELETE", url: "/api/v1/users/:id",                 desc: "Delete → 204 No Content" },
    { method: "GET",    url: "/api/v1/users/:id/orders",          desc: "Nested resource (ownership)" },
    { method: "POST",   url: "/api/v1/orders/:id/cancel",         desc: "Action as sub-resource" },
    { method: "GET",    url: "/api/v1/users?role=admin&page=2",   desc: "Filter + offset pagination" },
    { method: "GET",    url: "/api/v1/users?sort=createdAt:desc", desc: "Sorting" },
    { method: "GET",    url: "/api/v1/users?fields=id,name",      desc: "Sparse fieldsets" },
    { method: "GET",    url: "/api/v1/users?cursor=eyJ...&limit=20", desc: "Cursor pagination" },
  ];
  urlPatterns.forEach(p => {
    console.log(`  ${p.method.padEnd(7)} ${p.url.padEnd(40)} → ${p.desc}`);
  });

  console.log("\n── RESPONSE ENVELOPE ─────────────────────────────────────────────────────");
  console.log("  SUCCESS: { success: true,  data: T,       meta?: { total, page, ... } }");
  console.log("  ERROR:   { success: false, error: { code: string, message: string, details?: [] } }");

  console.log("\n── PAGINATION GUIDE ──────────────────────────────────────────────────────");
  console.log("  Offset  │ Simple, jumpable pages │ Breaks at scale (OFFSET N is O(N))");
  console.log("  Cursor  │ Scalable, no dupes     │ Cannot jump to arbitrary page");
  console.log("  Keyset  │ Simpler cursor variant │ Best when sorting by PK");

  console.log("\n── VERSIONING GUIDE ──────────────────────────────────────────────────────");
  console.log("  URL    (/api/v1/)  │ Visible, easy, most common  │ Use for public APIs");
  console.log("  Header             │ Clean URLs, REST-pure        │ Use for internal services");
  console.log("  Query (?version=1) │ Easy testing                │ Avoid (breaks caching)");

  console.log("\n── RATE LIMITING HEADERS ─────────────────────────────────────────────────");
  console.log("  X-RateLimit-Limit:     <max requests per window>");
  console.log("  X-RateLimit-Remaining: <requests left in this window>");
  console.log("  X-RateLimit-Reset:     <unix timestamp of window reset>");
  console.log("  Retry-After:           <seconds to wait> (on 429 response only)");

  console.log("\n── IDEMPOTENCY CHEAT SHEET ───────────────────────────────────────────────");
  console.log("  GET    — Safe    + Idempotent");
  console.log("  HEAD   — Safe    + Idempotent");
  console.log("  OPTIONS— Safe    + Idempotent");
  console.log("  PUT    — Unsafe  + Idempotent");
  console.log("  DELETE — Unsafe  + Idempotent");
  console.log("  POST   — Unsafe  + NOT Idempotent");
  console.log("  PATCH  — Unsafe  + NOT guaranteed idempotent");

  console.log("\n── 401 vs 403 ────────────────────────────────────────────────────────────");
  console.log("  401 Unauthorized → Who are you? Authenticate first.");
  console.log("  403 Forbidden    → I know you. You don't have access.");
  console.log("  404 Not Found    → Used instead of 403 to hide resource existence.");

  console.log("\n═══════════════════════════════════════════════════════════════════════════");
}

export default runDemo;

runDemo();
