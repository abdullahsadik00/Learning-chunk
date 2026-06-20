# Day 38 Assessment — REST API Design · Pagination · Status Codes · Response Contracts

**Theme:** You are the API lead for a fintech startup about to launch a public API. 50 external developers will integrate with it. Mistakes now will require versioning and migration costs later.

**Scoring:** 0–4 re-study · 5–9 progressing · 10–12 solid · 13–15 ready to advance

---

### Q1 — REST Resource Naming ⭐

**Scenario:** A code review surfaces these six URLs from different developers. The API consistency guide says "REST resources should be nouns, lowercase, plural, and actions should use HTTP verbs."

**Task:** Fix all six bad URLs and explain what is wrong with each:
`/getUsers` · `/api/user/delete/5` · `/api/createPost` · `/api/posts/5/getComments` · `/api/users?action=deactivate` · `/api/v1/user-list`

**Acceptance Criteria:**
- [ ] `/getUsers` → `GET /api/v1/users` — verbs don't belong in URLs; the HTTP method carries the action
- [ ] `/api/user/delete/5` → `DELETE /api/v1/users/5` — resource should be plural; delete is the HTTP method not a path segment
- [ ] `/api/createPost` → `POST /api/v1/posts` — "create" is the HTTP POST method; the resource name is the noun
- [ ] `/api/posts/5/getComments` → `GET /api/v1/posts/5/comments` — sub-resources use nested paths; no verbs
- [ ] `/api/users?action=deactivate` → `PATCH /api/v1/users/:id/status` (or `POST /api/v1/users/:id/deactivate` for actions that are hard to express as resource state) — query params are for filtering, not action dispatch
- [ ] `/api/v1/user-list` → `GET /api/v1/users` — resources are plural nouns without `-list` suffix
- [ ] States the general rule: URLs identify resources (nouns), HTTP methods identify actions (verbs)

---

### Q2 — HTTP Methods ⭐

**Scenario:** The API spec calls for `PUT /users/:id` for profile updates, but integration partners keep accidentally clearing fields they didn't intend to update.

**Task:** Map each CRUD operation to the correct HTTP method. Explain the difference between PUT and PATCH. Explain why PUT is rarely the right choice for partial updates in practice.

**Acceptance Criteria:**
- [ ] Create → `POST` (non-idempotent, creates a new resource, returns 201 with Location header)
- [ ] Read → `GET` (safe, idempotent, no request body)
- [ ] Full replace → `PUT` (idempotent, replaces the entire resource — omitted fields are set to null/default)
- [ ] Partial update → `PATCH` (idempotent, updates only the supplied fields — omitted fields are unchanged)
- [ ] Delete → `DELETE` (idempotent)
- [ ] Why PUT causes the partner bug: sending `{ name: 'Alice' }` via PUT replaces the whole user record — `email`, `phone`, and all other fields become null
- [ ] In practice, clients rarely have the full resource state, making PATCH the safe default for updates
- [ ] States that PUT is appropriate when the client constructs the entire resource (e.g., uploading a file to a known URL: `PUT /files/avatar.png`)

---

### Q3 — Status Codes ⭐

**Scenario:** API consumers are complaining that error codes are inconsistent — some validation errors return 500, some 200, and authentication errors return 404.

**Task:** Match each scenario to the correct HTTP status code and briefly justify the choice:
duplicate email registration · missing auth header · valid token but insufficient role · resource not found · JSON schema validation failure · unhandled server exception · resource created · resource deleted · async job accepted · permanent redirect

**Acceptance Criteria:**
- [ ] Duplicate email → `409 Conflict` (the request conflicts with existing state; the resource already exists)
- [ ] Missing auth header → `401 Unauthorized` (client must authenticate; semantically "unauthenticated")
- [ ] Valid token, wrong role → `403 Forbidden` (authenticated but not authorized; do not reveal the resource exists with 404)
- [ ] Resource not found → `404 Not Found`
- [ ] JSON validation failure → `422 Unprocessable Entity` (valid JSON, fails business/schema rules)
- [ ] Unhandled server exception → `500 Internal Server Error`
- [ ] Resource created → `201 Created` (+ `Location` header pointing to the new resource)
- [ ] Resource deleted → `204 No Content` (success with no response body)
- [ ] Async job accepted → `202 Accepted` (request received, processing deferred)
- [ ] Permanent redirect → `301 Moved Permanently` (+ `Location` header with new URL)

---

### Q4 — Response Envelope ⭐

**Scenario:** The SDK team says they can't auto-generate a client because every endpoint has a slightly different response shape — some return the object directly, some wrap it in `{ data: ... }`, some use `{ result: ... }`.

**Task:** Design a consistent response envelope for: (1) a success response with a list, (2) a success response with a single object, (3) a validation error, (4) a server error. Explain why consistency enables SDK auto-generation.

**Acceptance Criteria:**
- [ ] Success list: `{ data: [...], meta: { total, page, pageSize } }` — `data` is always the primary payload key
- [ ] Success single: `{ data: { id, ...fields } }` — same `data` wrapper, single object instead of array
- [ ] Validation error: `{ error: { code: 'VALIDATION_ERROR', message: '...', fields: [{ field, message }] } }` — per-field errors in `fields` array
- [ ] Server error: `{ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } }` — no stack trace, no internal details
- [ ] The `data` key is present and `null` / empty on errors; the `error` key is present on errors and absent on success — clients can reliably check `if (response.error)` or `if (response.data)`
- [ ] SDK generators (OpenAPI, Zod, etc.) can produce typed clients because the shape is consistent across all endpoints
- [ ] States that mixing `result`, `payload`, `response`, `items` etc. makes codegen impossible without per-endpoint overrides

---

### Q5 — Cursor vs Offset Pagination ⭐⭐

**Scenario:** `GET /transactions?page=5000&pageSize=100` takes 8 seconds. The database has 1 million transaction records. The query uses `OFFSET 499900 LIMIT 100`.

**Task:** Explain why `OFFSET` on large tables causes full table scans. Implement cursor pagination: encode the cursor as `base64(lastId)`, decode it on the next request, and use `WHERE id > cursor LIMIT n`.

**Acceptance Criteria:**
- [ ] `OFFSET n` causes the database to scan and discard the first `n` rows before returning results — at OFFSET 500,000 on a 1M row table, the DB reads 500,000 rows to throw them away
- [ ] Cursor pagination avoids this: `WHERE id > :lastId ORDER BY id LIMIT n` uses the index directly and is O(1) relative to total record count
- [ ] Cursor encoding: `Buffer.from(String(lastId)).toString('base64')` — opaque to clients, prevents them from constructing arbitrary cursors
- [ ] Cursor decoding: `parseInt(Buffer.from(cursor, 'base64').toString('utf8'))` — validate the decoded value is a positive integer before using in query
- [ ] Response includes `{ data: [...], meta: { nextCursor: '<base64>' | null } }` — `null` when there are no more pages
- [ ] Client passes cursor as `GET /transactions?cursor=<base64>&pageSize=100`
- [ ] Trade-off noted: cursor pagination cannot jump to arbitrary pages — it is forward-only (suitable for feeds and transaction lists, not admin tables needing random access)

---

### Q6 — Idempotency ⭐⭐

**Scenario:** A payment partner reports that a network timeout caused them to retry a payment request, resulting in a double charge. Your `POST /payments` endpoint processed the same request twice.

**Task:** Define idempotency. List which HTTP methods are idempotent by RFC definition. Show how to make `POST /payments` idempotent using an `Idempotency-Key` header.

**Acceptance Criteria:**
- [ ] Idempotency: performing the same operation N times produces the same result as performing it once — no additional side effects on repeat calls
- [ ] Idempotent by RFC: GET, HEAD, PUT, DELETE, OPTIONS, TRACE — multiple identical requests have the same effect as one
- [ ] POST is not idempotent by definition — each call creates a new resource or triggers an action
- [ ] `Idempotency-Key` flow: client sends `Idempotency-Key: <uuid>` header; server checks Redis/DB for that key
- [ ] If key found and payment succeeded: return the original response with `200` (not `201`) and no new charge
- [ ] If key found and payment is in progress: return `409` to signal the client to wait
- [ ] If key not found: process payment, store `{ key, response, expiresAt }` in Redis, return `201`
- [ ] Key TTL: 24 hours is a common standard (long enough for retries, short enough to allow eventual cleanup)

---

### Q7 — API Error Messages ⭐⭐

**Scenario:** A partner developer emails: "Your API returns `{ error: 'Bad request' }` with no detail. I have no idea which field failed or why. I spent 3 hours debugging."

**Task:** Design detailed error responses for: wrong field type, field too long, invalid email format, foreign key reference that doesn't exist. Show the structure for per-field errors vs global errors.

**Acceptance Criteria:**
- [ ] Per-field error structure: `{ error: { code: 'VALIDATION_ERROR', message: 'Request validation failed', fields: [{ field: 'email', code: 'INVALID_FORMAT', message: 'Must be a valid email address' }] } }`
- [ ] Wrong type: `{ field: 'amount', code: 'INVALID_TYPE', message: 'Expected number, received string', received: 'abc' }`
- [ ] Field too long: `{ field: 'name', code: 'TOO_LONG', message: 'Must be 100 characters or fewer', maxLength: 100, received: 143 }`
- [ ] Invalid email: `{ field: 'email', code: 'INVALID_FORMAT', message: 'Must be a valid email address' }`
- [ ] Foreign key doesn't exist: global error (not per-field since it involves DB state): `{ error: { code: 'REFERENCE_NOT_FOUND', message: "Category with id '99' does not exist" } }`
- [ ] Multiple field errors returned in a single response (not fail-fast one error at a time) — validate all fields before responding
- [ ] States that `code` (machine-readable string) plus `message` (human-readable) lets SDKs handle errors programmatically while developers can debug without consulting docs

---

### Q8 — Filtering and Sorting ⭐⭐

**Scenario:** Integration partners ask for a single flexible `GET /transactions` endpoint that can filter by status, date range, sort by multiple fields, and return only requested fields — without you building a custom endpoint for each combination.

**Task:** Design the query parameter schema for all four capabilities. Show the full example URL and explain the conventions used.

**Acceptance Criteria:**
- [ ] Filter by status: `?status=active` or multi-value `?status=active&status=pending` (or `?status=active,pending`)
- [ ] Date range filter: `?createdAfter=2026-01-01&createdBefore=2026-06-30` — ISO 8601 dates, exclusive/inclusive boundary documented in spec
- [ ] Multi-field sort: `?sort=-createdAt,name` — prefix `-` means descending, no prefix means ascending, comma-separated fields
- [ ] Sparse fieldsets: `?fields=id,name,email` — only return the requested top-level fields, reducing payload size
- [ ] Full example URL: `GET /api/v1/transactions?status=completed&createdAfter=2026-01-01&sort=-createdAt,amount&fields=id,amount,status,createdAt`
- [ ] States validation rules: unknown filter fields return `400`; unknown sort fields return `400`; unknown field names in `fields` param are ignored (not an error, for forward compatibility)
- [ ] Notes security consideration: sorting/filtering on unindexed columns must be blocked or the query planner will do a full table scan

---

### Q9 — HATEOAS Links ⭐⭐

**Scenario:** A teammate proposes adding `_links` to every API response (HATEOAS). Another teammate says "we're a CRUD API, not a web browser — this is overengineering."

**Task:** Explain what HATEOAS is. Give two scenarios where it adds value. Give two scenarios where it adds noise. Recommend whether to adopt it for a simple fintech CRUD API.

**Acceptance Criteria:**
- [ ] HATEOAS (Hypermedia As The Engine Of Application State): each response includes links describing what actions the client can take next — the API is self-describing and navigable without out-of-band documentation
- [ ] Value scenario 1: workflow-driven APIs (e.g., a payment API that returns `{ _links: { capture: '/payments/123/capture', refund: '/payments/123/refund' } }`) — the client doesn't need to hardcode state machine transitions
- [ ] Value scenario 2: API discovery — a root `GET /api` response returns links to all collections, enabling clients to navigate the API without reading docs
- [ ] Noise scenario 1: simple CRUD where every resource always has the same actions — adding `_links: { self, update, delete }` to every response adds bytes with no new information
- [ ] Noise scenario 2: mobile apps and SDKs that hardcode endpoint paths anyway — HATEOAS links are ignored in practice
- [ ] Recommendation: skip HATEOAS for a simple fintech CRUD API; invest in good OpenAPI documentation instead; consider it for complex workflow APIs

---

### Q10 — 422 vs 400 ⭐⭐

**Scenario:** A partner's integration sends a perfectly valid JSON body `{ "startDate": "2026-06-01", "endDate": "2026-01-01" }` to create a report. The API returns `400 Bad Request`. The partner argues the request is well-formed.

**Task:** Explain the semantic difference between `400 Bad Request` and `422 Unprocessable Entity`. Justify which is correct for this scenario and three others.

**Acceptance Criteria:**
- [ ] `400 Bad Request`: the server cannot parse or understand the request — malformed JSON, missing Content-Type header, invalid URL syntax
- [ ] `422 Unprocessable Entity`: the request is syntactically valid (server can parse it) but fails semantic/business validation — correct JSON, but the values violate business rules
- [ ] The start-after-end scenario: JSON is valid and parses successfully, but the business rule "startDate must be before endDate" fails → `422 Unprocessable Entity`
- [ ] Additional 422 examples: amount below zero, email already taken (arguably 409), foreign key reference not found
- [ ] Additional 400 examples: `{ startDate: <binary data> }` (cannot parse), request body is truncated/not valid JSON, Content-Length header doesn't match body size
- [ ] States that using 400 for all validation errors is technically wrong per RFC 7231 but widely practiced — teams should document their convention in API specs
- [ ] Notes that 422 was originally from WebDAV (RFC 4918) but is now widely adopted in REST APIs via RFC 9110

---

### Q11 — Location Header ⭐⭐

**Scenario:** A client calls `POST /api/v1/payments` and receives `201 Created` with a body `{ "id": "pay_abc123" }`. The client has to concatenate strings to build the URL for the next `GET` call. The team debates whether this matters.

**Task:** Explain when to return a `Location` header, what value it should contain, and why it matters for client reliability and API usability.

**Acceptance Criteria:**
- [ ] `Location` header should be returned on `201 Created` responses — it contains the absolute or relative URL of the newly created resource
- [ ] Value: `Location: /api/v1/payments/pay_abc123` (relative) or `https://api.example.com/api/v1/payments/pay_abc123` (absolute)
- [ ] Why it matters: clients can immediately follow up with `GET <Location>` without string concatenation — no risk of building the wrong URL if the URL structure changes
- [ ] Enables caching: HTTP clients and CDNs can use the `Location` to pre-warm the cache for the new resource
- [ ] Express implementation: `res.location('/api/v1/payments/' + payment.id).status(201).json({ data: payment })`
- [ ] `Location` is also returned on `301/302` redirects — indicates the new URL for the resource
- [ ] States that omitting `Location` on `201` is a common API design oversight that forces clients to parse the body and construct URLs, creating tight coupling to the URL structure

---

### Q12 — Bulk Operations ⭐⭐⭐

**Scenario:** An enterprise customer needs to onboard 500 employees in a single API call. The current API only supports creating one user at a time (50 round trips per second × 500 = 10+ seconds just in network time).

**Task:** Design `POST /api/v1/users/bulk` for creating up to 500 users. Compare all-or-nothing (single transaction) vs best-effort (partial success) semantics. Show the response format for partial success.

**Acceptance Criteria:**
- [ ] Request body: `{ users: [{ name, email, role }, ...] }` — array of user objects, max 500 items validated at middleware level
- [ ] All-or-nothing: entire request runs in a single DB transaction — if any record fails, the whole batch is rolled back; returns `422` with errors if any fail
- [ ] Best-effort: each record is processed independently — some may succeed, others fail; returns `207 Multi-Status`
- [ ] `207 Multi-Status` response body: `{ results: [{ index: 0, status: 201, data: { id, ... } }, { index: 1, status: 422, error: { ... } }] }`
- [ ] Clients must check each item in `results` — a `207` does not mean all succeeded
- [ ] Recommendation: all-or-nothing is simpler for clients to handle (either it worked or it didn't); best-effort is better for large batches where a few bad records shouldn't block 495 good ones — document the chosen semantic clearly
- [ ] Rate limit bulk endpoints separately: `POST /users/bulk` with a limit of 10 calls/minute vs `POST /users` at 100 calls/minute

---

### Q13 — Long-Running Operations ⭐⭐⭐

**Scenario:** `POST /reports/generate` takes 45 seconds to run. Clients are timing out at 30 seconds, causing them to retry and submit duplicate jobs.

**Task:** Design an async API: `POST /reports` returns immediately, clients poll for status. Show the response shapes for submission, pending, and complete states. Include `Retry-After` guidance.

**Acceptance Criteria:**
- [ ] `POST /reports` → `202 Accepted` with body `{ data: { jobId: 'job_xyz', status: 'pending', statusUrl: '/api/v1/reports/jobs/job_xyz' } }`
- [ ] `GET /api/v1/reports/jobs/:jobId` → while processing: `{ data: { jobId, status: 'pending', progress?: 42 } }` with header `Retry-After: 5` (seconds)
- [ ] `GET /api/v1/reports/jobs/:jobId` → on completion: `{ data: { jobId, status: 'complete', result: { downloadUrl: '...' }, completedAt: '...' } }`
- [ ] `GET /api/v1/reports/jobs/:jobId` → on failure: `{ data: { jobId, status: 'failed', error: { message: '...' } } }`
- [ ] `Retry-After` header tells clients how long to wait before polling again — prevents clients from hammering the status endpoint
- [ ] `statusUrl` in the initial response allows clients to navigate to the status endpoint without constructing the URL (HATEOAS lite)
- [ ] Notes that the `jobId` should be a UUID or similarly opaque identifier to prevent clients from guessing other users' job IDs (add auth check on GET)

---

### Q14 — Breaking vs Non-Breaking Changes ⭐⭐⭐

**Scenario:** The API team is debating which planned changes require a new major version (breaking) vs which can ship in the current version (non-breaking). Getting this wrong will break 50 integration partners.

**Task:** Classify each of these 10 changes as breaking or non-breaking and explain why:
adding an optional response field · removing a response field · renaming a field · changing a field from string to number · adding a required request field · adding a new endpoint · changing a 200 to 201 · adding an optional query parameter · changing from API key auth to OAuth · reordering items in a response array

**Acceptance Criteria:**
- [ ] Adding optional response field → non-breaking (clients that don't know about it ignore it; robust clients use tolerant reader pattern)
- [ ] Removing a response field → breaking (clients that read the field break with undefined/null errors)
- [ ] Renaming a field → breaking (equivalent to remove old + add new; clients reading the old name break)
- [ ] Changing field type string → number → breaking (clients expecting a string fail JSON schema validation or crash on type operations)
- [ ] Adding required request field → breaking (existing clients not sending the new field receive 422 errors)
- [ ] Adding a new endpoint → non-breaking (existing endpoints unchanged)
- [ ] Changing status code 200 → 201 → potentially breaking (clients checking `if (status === 200)` break; clients checking `if (status >= 200 && status < 300)` do not)
- [ ] Adding optional query parameter → non-breaking (existing clients don't send it; behavior unchanged)
- [ ] Changing auth scheme (API key → OAuth) → breaking (all clients must update their auth logic)
- [ ] Reordering array items → breaking (clients that rely on positional access `arr[0]` break; clients that search by `id` do not)

---

### Q15 — API Versioning Strategy ⭐⭐⭐

**Scenario:** V2 of the payments API introduces breaking changes. 50 enterprise integrators are on V1 and cannot migrate instantly. You need a versioning strategy that supports both versions simultaneously with a clear deprecation policy.

**Task:** Compare URL versioning (`/v1/`, `/v2/`), header versioning (`API-Version: 2`), and query param versioning (`?version=2`). Recommend the best approach for a public fintech API and define a deprecation timeline policy.

**Acceptance Criteria:**
- [ ] URL versioning (`/api/v1/users`): version is explicit in every request, easy to route at the load balancer, easy to test in a browser, cacheable — recommended for public APIs
- [ ] Header versioning (`API-Version: 2`): cleaner URLs but version is invisible to casual inspection; harder to test in browser; requires clients to set a custom header; can conflict with caching (`Vary: API-Version` required)
- [ ] Query param versioning (`?version=2`): simple but clutters query params used for filtering/pagination; version can be accidentally omitted; widely considered an anti-pattern
- [ ] Recommendation: URL versioning for a public fintech API — explicit, obvious to integrators, easy to route, compatible with API gateways and load balancers
- [ ] Deprecation timeline policy: minimum 12 months notice before retiring a major version (fintech integrators have slow release cycles); announce deprecation via `Sunset` and `Deprecation` response headers on V1 endpoints
- [ ] `Sunset` header (RFC 8594): `Sunset: Sat, 01 Jan 2028 00:00:00 GMT` — tells clients when the endpoint will stop working
- [ ] Migration guide, changelog, and direct email to all registered API consumers must accompany any deprecation announcement
