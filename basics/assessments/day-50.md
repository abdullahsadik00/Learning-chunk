# Day 50 Assessment — REST vs GraphQL vs tRPC · API Versioning · OpenAPI · Response Design

**Theme:** You are a senior API engineer at a platform company. Your API is consumed by a mobile app, a React SPA, third-party partners, and an internal dashboard. Each has different needs. You need to design an API strategy that serves all of them without creating maintenance nightmares.

---

### Q1 — REST principles ⭐

**Scenario:** A third-party partner integrates with your API and complains that responses are inconsistent — some endpoints return `{ data: [] }`, others return a raw array, and one returns `{ items: [], total: 0 }`. They are also storing session state on your server. Your tech lead says neither pattern is "properly RESTful."

**Task:** List the 6 REST architectural constraints. Identify the 2 most commonly violated in practice and explain why.

**Acceptance Criteria:**
- [ ] Constraint 1 — Client-server: concerns are separated — client manages UI, server manages data; they evolve independently
- [ ] Constraint 2 — Stateless: each request contains all information needed to process it; the server stores no client session state between requests; authentication must be in every request (e.g., Bearer token), not in a server-side session
- [ ] Constraint 3 — Cacheable: responses must declare whether they are cacheable (`Cache-Control`, `ETag`); GET responses should be cacheable by default
- [ ] Constraint 4 — Layered system: client cannot tell if it is talking to the origin server or a proxy/CDN/load balancer; each layer only knows about its immediate neighbor
- [ ] Constraint 5 — Uniform interface: consistent resource identification (URLs), consistent manipulation (HTTP methods), self-descriptive messages (Content-Type), and HATEOAS; this constraint is what your partner is complaining about — inconsistent response shapes violate uniform interface
- [ ] Constraint 6 — Code on demand (optional): server can extend client functionality by sending executable code (JavaScript); rarely used in practice
- [ ] Most violated 1 — Stateless: many APIs use server-side sessions via cookies, storing session data in Redis or memory — violates statelessness; fix is JWTs or signed cookies where all state is in the token
- [ ] Most violated 2 — Uniform interface: inconsistent response shapes across endpoints as described in the scenario; fix is a response envelope standard applied to all endpoints

---

### Q2 — HTTP method semantics ⭐

**Scenario:** Code review reveals: `GET /api/users/delete?id=123`, `POST /api/users/update`, and `PUT /api/users/123/name` (updates only the name field). Each violates HTTP method semantics. You need to explain the correct usage to the team.

**Task:** State the correct HTTP method for: create, read, full replace, partial update, delete. Define idempotency and identify which methods are idempotent by definition.

**Acceptance Criteria:**
- [ ] Create → `POST /api/users`: not idempotent (two identical POSTs create two records); response: `201 Created` with `Location` header
- [ ] Read → `GET /api/users/123`: safe (no side effects) and idempotent; response: `200 OK`
- [ ] Full replace → `PUT /api/users/123`: replaces the entire resource with the request body; if the resource doesn't exist, creates it; idempotent (same PUT twice produces same result)
- [ ] Partial update → `PATCH /api/users/123`: sends only the fields to change; the server applies the diff; semantics are harder to define (what does PATCH on a list field mean — replace or append?); idempotent IF designed to be, but not required by spec
- [ ] Delete → `DELETE /api/users/123`: removes the resource; idempotent (deleting an already-deleted resource returns 404 or 204, not an error that changes state again)
- [ ] Idempotent definition: an operation is idempotent if making the same request N times produces the same server state as making it once; idempotent by definition: GET, PUT, DELETE, HEAD, OPTIONS; NOT idempotent by definition: POST, PATCH
- [ ] Why PATCH is underused: the semantics of partial update are ambiguous for complex resources — what does `PATCH /users/123 { "tags": ["admin"] }` mean? Replace tags, add admin, or remove others? RFC 6902 (JSON Patch) and RFC 7396 (JSON Merge Patch) attempt to standardize this but add complexity

---

### Q3 — Over-fetching and under-fetching ⭐

**Scenario:** Your mobile app's home screen shows only `username` and `avatarUrl` but `GET /api/users/me` returns 47 fields including `billingAddress`, `stripeCustomerId`, `lastLoginIp`, and `createdAt`. Elsewhere, the profile page needs user data, their 5 most recent posts, and the comment count — requiring 3 separate API calls.

**Task:** Define over-fetching and under-fetching with concrete examples. Explain how GraphQL solves both problems in a single query.

**Acceptance Criteria:**
- [ ] Over-fetching definition: the API returns more data than the client needs; the client discards most of the response; wastes bandwidth (especially critical on mobile) and server CPU for serializing unused fields
- [ ] Over-fetching example: `GET /api/users/me` returns 47 fields; mobile home screen uses 2 — `username` and `avatarUrl`; the other 45 fields travel over the network and are discarded in the client
- [ ] Under-fetching definition: a single API endpoint does not return enough data to render a UI; the client must make multiple sequential or parallel requests to assemble what it needs
- [ ] Under-fetching example: profile page needs user, their 5 recent posts, and comment counts — requires `GET /users/me` + `GET /users/me/posts?limit=5` + `GET /users/me/stats`; 3 round trips before the page can render
- [ ] GraphQL solution: the client specifies exactly which fields it needs in the query — `query { me { username avatarUrl recentPosts(limit: 5) { title commentCount } } }` — one request, returns exactly the specified fields, no more, no less
- [ ] GraphQL benefit: eliminates both problems simultaneously — the client controls the shape of the response; mobile clients and desktop clients can request different field sets from the same endpoint

---

### Q4 — API versioning strategies ⭐

**Scenario:** You need to release a breaking change to the Users API — renaming `fullName` to `displayName`. Third-party partners have production integrations and cannot update immediately. You need to support both versions simultaneously for at least 6 months.

**Task:** Compare 3 API versioning strategies: URL versioning, header versioning, and query param versioning. Explain why URL versioning is recommended for public APIs.

**Acceptance Criteria:**
- [ ] URL versioning: `/api/v1/users`, `/api/v2/users` — the version is part of the URL path; router middleware or separate controllers handle each version
- [ ] Header versioning: `Accept: application/vnd.myapi.v2+json` — the version is in the `Accept` header; the server inspects the header to determine which version to serve; or use a custom header `API-Version: 2`
- [ ] Query param versioning: `GET /api/users?version=2` — simple to implement, easy to test in browser, but pollutes the query string; easy to accidentally omit the param
- [ ] URL versioning recommended because: visible in the URL (easy to inspect in logs, browser history, curl commands); can be bookmarked and shared; each version is a distinct URL — CDN caches, reverse proxies, and load balancers route by URL natively without inspecting headers
- [ ] URL versioning easy to deprecate: `GET /api/v1/users` → returns `Deprecated: true` header + sunset date; eventually returns 410 Gone; the version removal is explicit and discoverable
- [ ] Header versioning downside: cannot easily test different versions in a browser; proxies may not route correctly; documentation and error messages become harder to link to specific versions
- [ ] All strategies require: maintaining the old version until the sunset date, communicating deprecation timelines to API consumers, and tracking usage of each version (to know when it is safe to remove)

---

### Q5 — GraphQL schema SDL ⭐⭐

**Scenario:** You are designing the GraphQL API for the contract management SaaS. Clients need to query users with their uploaded contracts. You need to write the schema and explain the N+1 problem before your team builds the resolvers.

**Task:** Write a GraphQL SDL schema for User and Post (as given). Explain the `!` non-null modifier. Explain the N+1 problem on the `posts.author` field and how DataLoader solves it.

**Acceptance Criteria:**
- [ ] Schema: `type User { id: ID!, name: String!, email: String!, posts: [Post!] }`
- [ ] Schema: `type Post { id: ID!, title: String!, author: User! }`
- [ ] Schema: `type Query { user(id: ID!): User, posts(authorId: ID): [Post!]! }`
- [ ] `!` meaning: the field is non-null — GraphQL will never return `null` for this field; a resolver must return a value or throw an error; `[Post!]!` means a non-null list of non-null posts (no null items in the array, and the array itself is never null)
- [ ] N+1 problem: a query for 10 posts triggers 1 SQL query for posts + 10 SQL queries for `author` (one per post) = 11 queries; as the list grows to 100 posts, it becomes 101 queries — O(N) queries for a single GraphQL request
- [ ] DataLoader solution: a batching utility that collects all `authorId` values requested within the same event loop tick, then fires a single `SELECT * FROM users WHERE id IN (id1, id2, ..., id10)` query; the result is distributed back to the individual resolvers
- [ ] DataLoader is created per-request (not globally shared) to avoid cross-request data leakage: `new DataLoader(async (ids) => { const users = await db.users.findByIds(ids); return ids.map(id => users.find(u => u.id === id)); })`

---

### Q6 — tRPC type safety ⭐⭐

**Scenario:** Your internal dashboard team is tired of maintaining hand-written TypeScript types for API responses. Every time the backend changes a response shape, the frontend breaks at runtime (not compile time). A colleague suggests tRPC.

**Task:** Explain how tRPC achieves end-to-end type safety without code generation. Define `inferAsyncReturnType`. State when tRPC is NOT appropriate.

**Acceptance Criteria:**
- [ ] tRPC mechanism: the server defines procedures (queries and mutations) with Zod input schemas; TypeScript infers the input and output types from the schema and the resolver return type; the client imports the router's TypeScript type (not the runtime code) — no HTTP requests are imported, just the type
- [ ] Client usage: `const { data } = trpc.users.getById.useQuery({ id: '123' })` — `data` is fully typed as the router procedure's return type; if the server changes the return type, TypeScript errors appear in the client at compile time
- [ ] No codegen: unlike OpenAPI → TypeScript generation (which requires a separate codegen step), tRPC types are inferred live from the source code — always in sync; no out-of-date generated files
- [ ] `inferAsyncReturnType`: a utility type — `type UserOutput = inferAsyncReturnType<typeof getUserHandler>` — extracts the TypeScript return type of an async resolver function; used to type the output of complex procedures without manually writing output schemas
- [ ] When tRPC is NOT appropriate: non-TypeScript clients (mobile apps in Swift/Kotlin, third-party partners using Python/Go) — they cannot import TypeScript types; public APIs that need stable contracts (REST + OpenAPI is better); when the frontend and backend teams operate independently with different release cycles (tRPC tight-couples them)
- [ ] tRPC is ideal for: TypeScript monorepos where frontend and backend are built together (Next.js full-stack, t3 stack), internal tools where all consumers are TypeScript, teams that want to eliminate the API contract maintenance overhead

---

### Q7 — Response envelope design ⭐⭐

**Scenario:** Your API returns raw objects on success (`{ id: 1, name: "Alice" }`), strings on some errors (`"Not found"`), and objects on others (`{ error: "Unauthorized" }`). A partner trying to write an SDK says the inconsistency makes it impossible to write generic error handling.

**Task:** Design a consistent response envelope for success and error responses. Explain why consistency matters for SDKs, client error handling, and logging.

**Acceptance Criteria:**
- [ ] Success envelope: `{ success: true, data: T, meta?: { page: number, total: number, nextCursor: string | null } }` — `data` contains the resource; `meta` is optional and only present for paginated responses
- [ ] Error envelope: `{ success: false, error: { code: string, message: string, details?: object } }` — `code` is a machine-readable string (e.g., `'USER_NOT_FOUND'`), `message` is human-readable, `details` provides field-level validation errors when relevant
- [ ] SDK generation benefit: code generators (OpenAPI → SDK) produce clean client code when response shapes are uniform; a `handleResponse<T>(res)` utility that checks `res.success` works for every endpoint without special-casing
- [ ] Client error handling: `if (!res.success) { showError(res.error.message); logError(res.error.code); }` — generic error handling works everywhere; with inconsistent shapes, every response requires a different parsing strategy
- [ ] Logging normalization: structured logs can extract `error.code` from every error response uniformly — enables dashboards like "top error codes this week" without per-endpoint log parsing
- [ ] `success` boolean is explicit: avoids ambiguity with HTTP status codes — a `200` response can still have `success: false` (e.g., partial batch success); the `success` field is the canonical success indicator for application-level logic

---

### Q8 — OpenAPI specification ⭐⭐

**Scenario:** Your third-party partner integration team spends 2 weeks every quarter manually updating their TypeScript types from your API docs, which are often outdated. They ask if you can provide a machine-readable API spec.

**Task:** Describe what OpenAPI 3.0 is and where to expose it. Explain what Swagger UI provides. Write the OpenAPI spec for `GET /api/posts` with pagination params and response schema. Explain why spec-first design catches breaking changes early.

**Acceptance Criteria:**
- [ ] OpenAPI 3.0: a standard YAML/JSON format for describing REST APIs — endpoints, parameters, request bodies, response schemas, authentication, and examples; language-agnostic and machine-readable; formerly known as Swagger specification
- [ ] Expose at: `GET /api-docs/openapi.json` (JSON) or `/api-docs/openapi.yaml`; auto-generate using `swagger-jsdoc` (annotations in code) or `zod-to-openapi` (derives from Zod schemas); keeps spec in sync with code
- [ ] Swagger UI: an interactive HTML page served at `/api-docs` that renders the OpenAPI spec as browsable documentation with a "Try it out" feature — engineers and partners can test endpoints directly in the browser without writing code
- [ ] `GET /api/posts` spec skeleton: `paths: /api/posts: get: parameters: [{ name: page, in: query, schema: { type: integer, default: 1 } }, { name: limit, in: query, schema: { type: integer, default: 20, maximum: 100 } }] responses: 200: content: application/json: schema: $ref: '#/components/schemas/PostListResponse'`
- [ ] Spec-first benefit: write the OpenAPI spec before writing the implementation; use tools like `openapi-backend` to validate incoming requests against the spec — the spec is the contract; breaking changes (renaming a field, removing a param) are caught before deployment because the spec diff is reviewed in PRs
- [ ] Consumer benefit: partners generate typed SDKs directly from the spec using `openapi-generator-cli` — automatic SDK updates when the spec changes; no manual type maintenance

---

### Q9 — Deprecation strategy ⭐⭐

**Scenario:** You need to remove the `GET /api/v1/users/:id/profile` endpoint in favour of `GET /api/v2/users/:id`. Your largest partner has 47 production integrations with the v1 endpoint. You must give them adequate warning and track who is still using it.

**Task:** Describe how to signal deprecation via response headers, OpenAPI spec, and the `Sunset` header. State a minimum support window. Explain how to track usage of deprecated endpoints.

**Acceptance Criteria:**
- [ ] `Deprecated: true` response header: add to every response from the deprecated endpoint — HTTP standard header (RFC 8594) that API clients and monitoring tools can detect automatically
- [ ] OpenAPI spec deprecation: `deprecated: true` field on the operation — `get: deprecated: true` — Swagger UI displays a strikethrough on deprecated operations; code generators add deprecation annotations to generated client code
- [ ] `Sunset` header: `Sunset: Sat, 31 Dec 2026 23:59:59 GMT` — RFC 8594 standard; tells the client exactly when the endpoint will be removed; allows automated tooling to alert integration owners before the deadline
- [ ] Link header companion: `Link: <https://docs.example.com/migration/v1-to-v2>; rel="successor-version"` — points to the migration guide; clients that follow HTTP standards can auto-discover the upgrade path
- [ ] Minimum support window: 6 months for public APIs with external partners; 3 months for internal APIs where you control all consumers; 12+ months for widely-adopted endpoints with many integrations
- [ ] Usage tracking: add a metric/log for every request to the deprecated endpoint: `metrics.increment('deprecated_endpoint_calls', { endpoint: '/api/v1/users/:id/profile', consumer: req.headers['x-api-key'] })`; build a dashboard showing calls per consumer per week; reach out directly to consumers still using it as the sunset date approaches

---

### Q10 — Rate limiting headers ⭐⭐

**Scenario:** A partner's SDK was coded without any rate limit awareness. It sends 1,000 requests in a burst, receives hundreds of 429 responses, and then retries immediately — making the situation worse. Your API exposes no information about rate limits in the response.

**Task:** List the standard rate limiting response headers and their semantics. Explain why exposing them is user-friendly. Describe the `Retry-After` header.

**Acceptance Criteria:**
- [ ] `X-RateLimit-Limit: 1000` — the total number of requests allowed in the current window (e.g., 1,000 requests per hour)
- [ ] `X-RateLimit-Remaining: 237` — the number of requests remaining in the current window; decrements with each request; clients can self-throttle when this approaches 0
- [ ] `X-RateLimit-Reset: 1750000000` — Unix timestamp (seconds) when the rate limit window resets; client can calculate exact wait time: `resetAt - Date.now() / 1000`
- [ ] `Retry-After: 60` — sent only on `429 Too Many Requests` responses; tells the client to wait 60 seconds before retrying; can be a number (seconds) or an HTTP date string; the canonical signal for "back off now"
- [ ] User-friendliness: clients that read these headers can self-throttle proactively (slow down before hitting 0) rather than reactively (retry after 429); reduces wasted requests, reduces 429 rate, and reduces noise in your logs
- [ ] `RateLimit-Policy` header (IETF draft): `RateLimit-Policy: 1000;w=3600` — describes the rate limit policy in a structured format; not yet widely adopted but provides machine-readable policy discovery without requiring documentation
- [ ] Include headers on all responses: not just 429s — clients need `X-RateLimit-Remaining` on success responses to know their budget; receiving it only on error is too late for graceful throttling

---

### Q11 — API authentication options ⭐⭐

**Scenario:** Your platform serves three types of callers: third-party partners making server-to-server calls, end users via a React SPA, and a data pipeline (machine-to-machine, no user involved). Each needs a different authentication mechanism.

**Task:** Compare API key (in header), Bearer JWT, and OAuth2 client credentials. For each: stateful or stateless, how to revoke, and which caller type it is appropriate for.

**Acceptance Criteria:**
- [ ] API key (`X-API-Key: abc123`): stateful — the server must look up the key in a database on every request to check validity; revoke by deleting the key from the database (instant revocation); appropriate for third-party partners (stable, long-lived keys issued per integration, easy to rotate)
- [ ] Bearer JWT: stateless — the server validates the JWT signature using the secret/public key without a database lookup; the token contains all claims (`userId`, `roles`, `exp`); revoke by: waiting for expiry (short-lived, e.g., 15 minutes) + refresh token rotation; or add token ID to a Redis blocklist (adds a database lookup, partially loses statelessness); appropriate for end users via SPA (short-lived access tokens, refresh on expiry)
- [ ] OAuth2 client credentials: machine-to-machine flow — client sends `client_id` + `client_secret` to `/oauth/token` → receives a short-lived access token (Bearer JWT); stateless for request validation, stateful for token issuance; revoke by blocking the `client_id` at the token issuer or letting tokens expire; appropriate for the data pipeline (automated service, no user context, standard OAuth2 flow)
- [ ] Key rotation: API keys can be rotated by issuing a new key and giving a grace period to update the integration; JWTs rotate automatically via refresh tokens; client credentials rotate by issuing new `client_secret`
- [ ] Security comparison: API keys are long-lived and must be stored securely by the partner; JWTs expire quickly, limiting breach impact; client credentials use industry-standard OAuth2 with short-lived tokens — best security posture for machine-to-machine

---

### Q12 — GraphQL N+1 with DataLoader ⭐⭐⭐

**Scenario:** After launching your GraphQL API, you notice database CPU spikes to 95% whenever the dashboard loads a feed of 50 posts with author details. Query profiling shows 51 sequential SELECT statements for a single GraphQL request.

**Task:** Show the N+1 problem concretely (1 query + N author queries). Implement a DataLoader to batch the author queries into one. Explain the "batch window" concept.

**Acceptance Criteria:**
- [ ] N+1 without DataLoader: `posts` query fires `SELECT * FROM posts LIMIT 50` (1 query); for each post, the `author` resolver fires `SELECT * FROM users WHERE id = $postAuthorId` (50 queries) = 51 total queries per GraphQL request
- [ ] Root cause: each resolver is called independently; they have no way to coordinate — each `author` resolver sees only the current post's `authorId` and fires its own query
- [ ] DataLoader implementation: `const userLoader = new DataLoader(async (authorIds: string[]) => { const users = await db.query('SELECT * FROM users WHERE id = ANY($1)', [authorIds]); return authorIds.map(id => users.find(u => u.id === id) ?? null); })`
- [ ] Author resolver with DataLoader: instead of `return db.users.findById(post.authorId)`, use `return context.userLoader.load(post.authorId)` — returns a Promise
- [ ] Batch window: DataLoader collects all `.load(id)` calls made within the same event loop tick (microtask queue drain); once all resolvers in the current tick have called `.load()`, DataLoader calls the batch function once with all collected IDs — `[id1, id2, ..., id50]` — resulting in 1 query instead of 50
- [ ] Result: 1 posts query + 1 batched users query = 2 total queries instead of 51; CPU usage drops proportionally
- [ ] DataLoader caches within the request: if two posts have the same `authorId`, DataLoader returns the cached result for the second call — no duplicate queries

---

### Q13 — Breaking vs non-breaking API changes ⭐⭐⭐

**Scenario:** Your API team is doing a quarterly cleanup. They have a list of 10 proposed changes. Before shipping, each change must be classified as breaking (requires API version bump and migration plan) or non-breaking (can be deployed immediately).

**Task:** Classify all 10 changes and derive the general pattern.

**Acceptance Criteria:**
- [ ] Add optional response field (e.g., add `avatarUrl` to user response) → non-breaking: existing clients ignore unknown fields; they only use fields they know about
- [ ] Remove response field (e.g., remove `legacyId` from response) → breaking: existing clients that read `legacyId` will receive `undefined`; their code may crash or produce incorrect behavior
- [ ] Add required request field → breaking: existing clients don't send the new required field; requests fail validation (`400 Bad Request`)
- [ ] Add optional request field (with a default value if omitted) → non-breaking: existing clients don't send it; the server uses the default; no existing request fails
- [ ] Rename field (e.g., `fullName` → `displayName`) → breaking: equivalent to removing `fullName` and adding `displayName`; clients reading `fullName` get `undefined`
- [ ] Change field type (e.g., `id` from `number` to `string`) → breaking: a client expecting `typeof id === 'number'` will break; causes silent bugs (e.g., `id === 123` never matches `"123"`)
- [ ] Add new endpoint → non-breaking: existing clients are unaware of the new endpoint and unaffected
- [ ] Change HTTP status code (e.g., `200 → 201` on create) → breaking: clients checking `if (res.status === 200)` will miss the success case; clients using status codes for error handling will misroute the response
- [ ] Add new enum value (e.g., add `'cancelled'` to order status enum) → potentially breaking: clients with exhaustive switch/case that error on unknown values will throw; clients that handle unknown values gracefully are unaffected — treat as breaking for external APIs
- [ ] Change auth scheme (e.g., from API key to OAuth2) → breaking: all existing integrations need to obtain OAuth2 tokens; no gradual migration possible unless both schemes are supported simultaneously
- [ ] General pattern: **adding is safe, removing/renaming/retyping is breaking**; when in doubt, add a new field alongside the old one (keep both), give consumers time to migrate, then remove the old one

---

### Q14 — API gateway pattern ⭐⭐⭐

**Scenario:** Your platform has grown to 8 microservices. Every service implements its own rate limiting, auth middleware, and request logging — differently. A new service was deployed without auth middleware and was hit by a scraper for 3 hours before anyone noticed.

**Task:** Describe what an API gateway does. Explain why it is better than implementing cross-cutting concerns in every service. Name 3 common options. Explain when NOT to use one.

**Acceptance Criteria:**
- [ ] API gateway responsibilities: single entry point for all external traffic; routing (forward `/api/users` to the users service, `/api/contracts` to the contracts service); authentication and authorization (validate JWT before requests reach any service); rate limiting (enforced at the gateway for all services); SSL termination (handles TLS, services communicate over plain HTTP internally); request/response logging (one place to log all traffic); response caching (cache GET responses at the gateway)
- [ ] Why better than per-service: cross-cutting concerns are implemented once and cannot be accidentally omitted; a new service behind the gateway inherits auth, rate limiting, and logging automatically — the scraper scenario is prevented because the gateway rejects unauthenticated requests before they reach the unprotected service
- [ ] Option 1 — Kong: open-source, Nginx-based, plugin ecosystem (rate limiting, JWT auth, transformations), Kubernetes-native via Kong Ingress Controller
- [ ] Option 2 — AWS API Gateway: managed service, tight AWS integration (Lambda, IAM auth, Cognito), pay-per-request pricing, built-in throttling and logging to CloudWatch
- [ ] Option 3 — Nginx as gateway: simple upstream routing, free, highly configurable via `nginx.conf`; auth/rate limiting require additional modules or Lua scripting (OpenResty); good for teams already using Nginx
- [ ] When NOT to use: small team with a single service (adds infrastructure complexity with no benefit); early-stage startup where iteration speed > infrastructure maturity; local development (gateway adds a network hop and config overhead to local dev loops)

---

### Q15 — REST HATEOAS ⭐⭐⭐

**Scenario:** You are reading a REST specification proposal that includes links in every response. Your team is debating whether to implement "Level 3 REST" (HATEOAS). A junior developer asks what HATEOAS is and whether to implement it.

**Task:** Define HATEOAS. Show what a HATEOAS-compliant response looks like for a contract resource. Explain when it adds value vs when it is over-engineering. Explain why Level 3 REST is rarely implemented.

**Acceptance Criteria:**
- [ ] HATEOAS definition: Hypermedia As The Engine Of Application State — REST Level 3; responses include hyperlinks to all available actions and related resources; the client does not need to construct URLs — it follows links from the API's responses, similar to how a browser follows HTML links
- [ ] HATEOAS response example: `{ "id": "c-123", "title": "Service Agreement", "status": "pending", "links": { "self": "/api/contracts/c-123", "sign": "/api/contracts/c-123/sign", "download": "/api/contracts/c-123/download", "author": "/api/users/u-456", "comments": "/api/contracts/c-123/comments" } }`
- [ ] Dynamic links: the links included depend on the resource state — a `signed` contract includes `"download"` but not `"sign"`; the client never needs to know which actions are valid for which states — it discovers them from the response
- [ ] When HATEOAS adds value: API exploration tools (clients that discover the API by following links — like a browser); workflow guidance (multi-step processes where the server controls valid next actions); public APIs consumed by generic clients that cannot be updated when the API changes
- [ ] When it is over-engineering: internal APIs where the client team knows the API contract and maintains it with the server team; APIs consumed by SPAs (the frontend team knows exactly which endpoints exist); adds significant payload overhead and server-side complexity for generating contextual links
- [ ] Why rarely implemented: the promises of HATEOAS (clients that work without knowing URLs, seamless API evolution) require clients to be fully generic hypertext navigators — in practice, every client is purpose-built and knows exactly which links it needs; the implementation cost (generating correct contextual links, client consumption logic) outweighs the benefit for the vast majority of APIs; REST Level 2 (correct HTTP methods + status codes) is the practical target for almost all production APIs

---

## Scoring Rubric

| Score | Interpretation |
|-------|----------------|
| 0–4   | Re-study — revisit REST principles, HTTP method semantics, and GraphQL vs REST trade-offs before proceeding |
| 5–9   | Progressing — core API design concepts understood; design a complete API from scratch with versioning, consistent envelopes, and OpenAPI spec |
| 10–12 | Solid — ready to lead API design discussions; review breaking vs non-breaking changes and HATEOAS for the theoretical depth |
| 13–15 | Ready to advance — strong grasp of API architecture across REST, GraphQL, and tRPC; ready for senior backend design responsibilities |
