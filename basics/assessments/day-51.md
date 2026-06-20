# Day 51 Assessment — API Testing · Jest · Supertest · Test Isolation

**Theme:** You are the engineer responsible for testing culture at a B2B SaaS startup. The team has been shipping bugs to production because no API tests existed. You're implementing the testing strategy and mentoring the team on what to test, how to test it, and how to keep tests fast and isolated.

---

### Q1 — Why Test the HTTP Layer ⭐

**Scenario:** A colleague says "we already have unit tests for our service functions — why do we need supertest too?" You need to explain the gap and justify the testing investment.

**Task:** Explain what unit tests, integration tests, and API (supertest) tests each cover and what unit tests miss. Explain why supertest doesn't need a running server.

**Acceptance Criteria:**
- [ ] States what unit tests cover: individual functions in isolation, no HTTP layer
- [ ] Names at least two things unit tests miss: routing, middleware, validation, response shape, status codes
- [ ] Explains what integration/API tests cover: routing pipeline, middleware execution, response contracts
- [ ] Correctly explains why supertest doesn't need a live server: it calls `listen(0)` internally or binds an ephemeral port, letting you pass the `app` directly
- [ ] Gives a concrete example of a bug only an API test would catch (e.g., auth middleware misconfigured on a route)
- [ ] Mentions test pyramid concept or appropriate test distribution

---

### Q2 — Supertest Basics ⭐

**Scenario:** You're writing your first API test file. The endpoint is `GET /api/posts` (returns JSON array) and `POST /api/posts` (requires `Authorization` header and JSON body).

**Task:** Write supertest assertions for both endpoints, demonstrating status, content-type, body assertions, `.send()`, and `.set()`.

**Acceptance Criteria:**
- [ ] Correctly imports supertest: `const request = require('supertest')` or `import request from 'supertest'`
- [ ] Chains `.expect(200)` for status code assertion
- [ ] Chains `.expect('Content-Type', /json/)` for content-type assertion using a regex
- [ ] Uses `.send({ title: 'Post title' })` to send a JSON body on POST
- [ ] Uses `.set('Authorization', 'Bearer token')` to set a request header
- [ ] Explains that supertest handles port binding internally — no `app.listen()` needed in the test

---

### Q3 — Test Isolation ⭐

**Scenario:** Your CI pipeline fails randomly — sometimes test suite A passes, sometimes it doesn't. You traced the issue to test B creating a user record that test A reads and depends on.

**Task:** Explain the root cause (order-dependent tests), show how to fix it with `beforeEach`, explain the difference between `beforeEach` and `afterAll`, and describe the transaction rollback approach for DB-backed tests.

**Acceptance Criteria:**
- [ ] Names the problem: order-dependent or "leaky" tests — shared state between tests
- [ ] Shows `beforeEach(() => resetStore())` for in-memory store reset
- [ ] Explains `afterAll` purpose: teardown after entire suite (close DB connections, stop external servers)
- [ ] Explains transaction rollback strategy: `beginTransaction` in `beforeEach`, `rollback` in `afterEach`
- [ ] States why rollback is preferred over delete/truncate: faster, no FK constraint order issues
- [ ] Notes that each test must be able to run in isolation in any order

---

### Q4 — App Factory Pattern ⭐

**Scenario:** Every time you run tests, you get `EADDRINUSE: address already in use :::3001` errors and the test process hangs after tests complete.

**Task:** Explain why this happens, show the app factory pattern (exporting `app` without `listen()`), and explain what each test file should do instead.

**Acceptance Criteria:**
- [ ] Identifies root cause: `app.listen()` is called when the module is loaded, binding a port globally
- [ ] Shows the correct `app.js`: `module.exports = app` (or `export default app`) without calling `listen()`
- [ ] Shows a separate `server.js` or `index.js` that does `app.listen(3001)` for production startup
- [ ] Explains that each test file `require`s/`import`s the app and supertest handles port assignment
- [ ] Mentions the test process never exits because `listen()` keeps the event loop alive
- [ ] Notes that this pattern also allows running multiple test files in parallel without port conflicts

---

### Q5 — Testing Validation Errors ⭐⭐

**Scenario:** Your `POST /api/users` endpoint validates that `email` and `name` are required, and `age` must be a number. The team only wrote a test for the happy path (201 Created). You need to add error path tests.

**Task:** Write tests for missing required field (400), wrong type (400), and assert the error response shape. Explain why testing error cases matters.

**Acceptance Criteria:**
- [ ] Test for missing `email` field expects status 400
- [ ] Test for wrong type (e.g., `age: "not-a-number"`) expects status 400
- [ ] Asserts the response body shape: either field-level errors `{ errors: [{ field: 'email', message: '...' }] }` or global message
- [ ] Uses `.expect(res => { assert(res.body.errors[0].field === 'email') })` style or `.expect(400).then(res => ...)` 
- [ ] States why error tests matter: validation errors are the most common user-facing bugs; bugs in error handling can leak internal details
- [ ] Tests at least one boundary value (e.g., empty string `""` for required field)

---

### Q6 — Testing Status Codes ⭐⭐

**Scenario:** Your team has been using 200 for every response including creates and deletes. You're standardizing on correct HTTP semantics and need tests that enforce the contract.

**Task:** Write a test for each operation: create (201 + Location header), read (200), update (200), delete (204), not-found (404), conflict (409), unauthorized (401). Explain why 204 means no body.

**Acceptance Criteria:**
- [ ] POST create test asserts 201 status
- [ ] POST create test asserts `Location` header exists with the new resource URL
- [ ] GET read test asserts 200
- [ ] PUT/PATCH update test asserts 200
- [ ] DELETE test asserts 204
- [ ] DELETE test asserts `res.body` is empty object `{}` (no body on 204)
- [ ] GET non-existent resource test asserts 404
- [ ] Test for duplicate unique field asserts 409
- [ ] Test for missing/invalid token asserts 401

---

### Q7 — Testing Authentication Middleware ⭐⭐

**Scenario:** Your app has a `POST /auth/login` endpoint that returns a JWT. All `/api/*` routes require that JWT. You need to write a reusable test helper and test the auth middleware behavior.

**Task:** Create a `getAuthToken()` helper used in `beforeAll`. Write tests for: protected route without token (401), with valid token (200), and with an expired/invalid token (401). Explain why you should not mock the auth middleware in integration tests.

**Acceptance Criteria:**
- [ ] `getAuthToken()` calls `POST /auth/login` with test credentials and returns the token string
- [ ] `beforeAll(async () => { token = await getAuthToken() })` pattern shown
- [ ] Test without `Authorization` header expects 401
- [ ] Test with `Authorization: Bearer ${token}` expects 200
- [ ] Test with an invalid/expired token (e.g., `'Bearer invalid.token.here'`) expects 401
- [ ] Explains why NOT to mock auth middleware: mocks can hide integration bugs (e.g., middleware applied to wrong routes, config error)
- [ ] Notes that `beforeAll` is used (not `beforeEach`) since login is expensive

---

### Q8 — Test Coverage Interpretation ⭐⭐

**Scenario:** You ran `jest --coverage` and got: Statements 94%, Branches 71%, Functions 88%, Lines 93%. Your manager asks if the code is well-tested. How do you interpret these numbers?

**Task:** Explain what each coverage metric means. Explain what 100% branch coverage requires. Explain why 100% coverage does not mean no bugs. Explain what the uncovered lines report tells you.

**Acceptance Criteria:**
- [ ] Correctly defines Statements coverage: percentage of executable statements executed during tests
- [ ] Correctly defines Branch coverage: every if/else/ternary/switch path exercised
- [ ] Correctly defines Functions coverage: every function called at least once
- [ ] Correctly defines Lines coverage: percentage of source lines executed
- [ ] Explains what 100% branch coverage requires: a test for each conditional path (if true AND if false)
- [ ] States why 100% coverage doesn't guarantee no bugs: tests can assert wrong values, or assert nothing
- [ ] Explains the uncovered lines report: shows exact line numbers not hit — helps prioritize which tests to write next
- [ ] Notes 71% branch is the weakest metric and means ~29% of conditional logic is untested

---

### Q9 — Testing Pagination ⭐⭐

**Scenario:** Your `GET /posts` endpoint accepts `?page=1&limit=10` and returns `{ data: [...], meta: { total, page, limit, hasMore } }`. You need comprehensive tests for this pagination contract.

**Task:** Write tests for: first page with more data (hasMore: true), last page (hasMore: false), empty result, and invalid page parameter. Explain what boundary values to always test.

**Acceptance Criteria:**
- [ ] Seeds enough records (e.g., 15) to test pagination behavior
- [ ] `?page=1&limit=10` test asserts `meta.hasMore === true` and `data.length === 10`
- [ ] `?page=2&limit=10` test asserts `meta.hasMore === false` and `data.length === 5`
- [ ] Test for empty collection asserts `data` is empty array and `meta.total === 0`
- [ ] Test for invalid `page=0` or `page=-1` asserts either 400 or defaults to page 1
- [ ] Asserts `meta.total` equals the actual total record count
- [ ] Lists key boundary values: 0 items, exactly 1 page of items, exactly N items (page boundary), large page number beyond data

---

### Q10 — Database Test Isolation with Transactions ⭐⭐

**Scenario:** Your test suite runs against a real PostgreSQL database. Currently `beforeEach` truncates all tables, which takes 3 seconds per test. With 80 tests you're spending 4 minutes just on cleanup.

**Task:** Show the transaction rollback approach: `beginTransaction` in `beforeEach`, `rollback` in `afterEach`. Explain why rollback is faster than truncate. Show the Prisma alternative using `prisma.$transaction`.

**Acceptance Criteria:**
- [ ] Shows `beforeEach(async () => { tx = await db.beginTransaction() })` pattern
- [ ] Shows test using the transaction connection (not default pool)
- [ ] Shows `afterEach(async () => { await tx.rollback() })` pattern
- [ ] Explains why rollback is faster: no actual writes committed to disk, FK checks skipped, single operation vs truncating multiple tables
- [ ] Shows Prisma pattern: wrap test in `prisma.$transaction(async (tx) => { ... throw new Error('rollback') })`
- [ ] Notes that connection used in test must be the same transactional connection, not a new pool connection
- [ ] Mentions this approach requires the DB to support transactions (not eventual consistency stores)

---

### Q11 — Testing Side Effects ⭐⭐

**Scenario:** Your `POST /users` endpoint sends a welcome email via SendGrid AND creates a Stripe customer. Your team doesn't want to hit real APIs during tests — that costs money and makes tests slow and flaky.

**Task:** Describe and compare three approaches to preventing side effects in tests: `jest.mock()`, dependency injection, and environment-based disabling. Give trade-offs for each.

**Acceptance Criteria:**
- [ ] `jest.mock('./services/email')` approach shown: replaces the module with a mock, can assert it was called with correct args
- [ ] Dependency injection approach explained: app factory accepts `{ emailService, stripeService }` — tests pass in no-op implementations
- [ ] Environment-based approach explained: `if (process.env.NODE_ENV === 'test') { skip side effects }` — simplest but couples business logic to test env
- [ ] Trade-off for `jest.mock()`: easy to set up, but mock can drift from real implementation
- [ ] Trade-off for DI: cleanest architecture, enables swapping implementations, but requires refactoring app code
- [ ] Trade-off for env-based: risky (could accidentally disable side effects in production), hard to assert the side effect was intended
- [ ] States preferred approach for integration tests: DI or jest.mock, NOT env-based

---

### Q12 — Supertest with File Upload ⭐⭐⭐

**Scenario:** Your `POST /upload` endpoint accepts a PDF file via multipart/form-data, stores it, and returns the stored file path. You need to write an automated test for this without using real files on disk.

**Task:** Show the supertest `.attach()` syntax using an in-memory `Buffer`. Assert the response status and stored file path. Show cleanup in `afterEach`. Explain what `@types/supertest` provides for TypeScript.

**Acceptance Criteria:**
- [ ] Uses `.attach('file', Buffer.from('pdf content'), 'test.pdf')` syntax correctly
- [ ] Does NOT use `.set('Content-Type', 'multipart/form-data')` manually — explains supertest sets it automatically with boundary
- [ ] Asserts response status 200 (or 201)
- [ ] Asserts response body contains a `path` or `url` field pointing to the stored file
- [ ] Shows `afterEach` cleanup: deletes the uploaded test file from storage
- [ ] Explains `@types/supertest` provides TypeScript typings: `Response` type with `.body`, `.status`, `.headers` typed correctly
- [ ] Notes that Buffer-based uploads avoid creating real temp files, keeping tests hermetic

---

### Q13 — Testing Concurrent Requests ⭐⭐⭐

**Scenario:** Your `POST /reservations` endpoint books the last available seat at a venue. Two users click "Book" simultaneously. Without proper locking, both requests might succeed — creating an overbooking bug.

**Task:** Write a test that fires two simultaneous requests using `Promise.all`. Assert exactly one 200 and one 409. Explain what this test proves and what its limitations are.

**Acceptance Criteria:**
- [ ] Uses `await Promise.all([request(app).post('/reservations')..., request(app).post('/reservations')...])` to fire concurrently
- [ ] Seeds exactly 1 available seat before the test
- [ ] Destructures results and asserts one response has status 200 and the other has status 409
- [ ] Does not hardcode which index is 200 — uses sort or find since order is non-deterministic
- [ ] States what this proves: the endpoint handles the race condition correctly when two requests arrive concurrently within a single Node.js process
- [ ] States the limitation: JS single-threaded event loop may serialize the handlers — doesn't guarantee true simultaneous DB calls; real multi-instance race conditions require load testing tools
- [ ] Mentions that the real fix (DB-level lock or atomic update) must be verified via DB query counting, not just response codes

---

### Q14 — Contract Testing ⭐⭐⭐

**Scenario:** Your company has a React frontend, a Node.js API, and two microservices. The frontend team keeps breaking because the backend changes API response shapes without coordinating. You've heard about Pact contract testing.

**Task:** Explain what Pact is, how consumer-driven contracts work, and why it is better than mocking APIs in consumer tests. Describe when to use it.

**Acceptance Criteria:**
- [ ] Explains consumer-driven contracts: consumer (frontend/service) defines what fields/shape it needs → generates a `.pact` file
- [ ] Explains provider verification: API team runs `pact:verify` → Pact replays the consumer's expectations against the real provider
- [ ] Explains why it's better than mocking: mocks in consumer tests can drift from actual provider behavior; Pact forces the provider to verify real compatibility
- [ ] States when to use: microservices with separate deployments, frontend/backend in separate repos, when API changes frequently break consumers
- [ ] States when NOT to use: monolith where consumer and provider deploy together (E2E tests are sufficient)
- [ ] Mentions the Pact Broker as the artifact store where pact files are published and shared
- [ ] Notes that Pact catches breaking changes before deployment, not after

---

### Q15 — Test Performance ⭐⭐⭐

**Scenario:** Your 200-test API suite takes 30 seconds to run. The team skips running tests locally because it's "too slow." CI blocks PRs for 30 minutes when tests queue up.

**Task:** Identify 5 causes of slow test suites and their fixes. Provide a target time and explain how to get there.

**Acceptance Criteria:**
- [ ] Identifies slow DB setup: fix with in-memory stores or transaction rollback instead of truncate/seed per test
- [ ] Identifies `--runInBand` flag (sequential execution): fix by removing it to allow Jest's default parallel workers
- [ ] Identifies `sleep`/`setTimeout` in tests: fix with explicit `waitFor` assertions (polling) or event-based waiting
- [ ] Identifies too many integration tests doing real DB work: fix by moving slow tests to a separate `jest.config.integration.js` run only on CI, not on every save
- [ ] Identifies slow global `beforeAll` (e.g., DB migration run once globally): fix by moving to CI setup step outside Jest, or using a pre-built test DB image
- [ ] States a realistic target: 200 API tests should run in under 10 seconds with parallelism + transaction isolation
- [ ] Mentions `jest --testPathPattern` for running only the failing test file during development

---

## Scoring Rubric

Count the number of acceptance criteria checkboxes you fully satisfied across all 15 questions.

| Score | Level | What it means |
|-------|-------|---------------|
| 0–4   | 🔴 Re-study | Go back to the Day 51 teaching file. You need to build the mental model before writing tests. |
| 5–9   | 🟡 Progressing | You understand the basics but supertest patterns and isolation strategies aren't solid yet. Re-do the examples. |
| 10–12 | 🟢 Solid | You can set up a working API test suite. Move on — revisit contract testing and performance gaps later. |
| 13–15 | 🚀 Ready to advance | Strong command of API testing. You can lead testing culture at a team level. |
