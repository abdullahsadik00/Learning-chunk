// ═══════════════════════════════════════════════════════════════
// BACKEND 16: API TESTING · JEST · SUPERTEST · TEST ISOLATION  (Day 51)
// Run: npx ts-node 16-api-testing.ts
// ═══════════════════════════════════════════════════════════════
//
// WHAT THIS FILE COVERS:
//  Advanced API testing strategy and patterns — beyond Jest+Supertest basics.
//  Focus: test isolation, authentication flows, complex multi-step scenarios,
//  contract testing, snapshot testing, systematic error coverage, and load testing.
//
//  Prerequisite: basics/testing/06-backend-testing.ts covers Jest + Supertest setup.
//  This file assumes you know how to run a supertest request; it teaches you
//  how to design a test suite that actually catches regressions.
//
// THE API TESTING SPECTRUM:
//
//   Unit         Integration      Contract        E2E
//   ─────────    ────────────     ────────        ───────────
//   handler fn   full HTTP stack  cross-service   real browser
//   no I/O       real (test) DB   consumer-first  full system
//   very fast    fast (< 1 s)     medium setup    slow
//   many         moderate         few             very few
//
// ───────────────────────────────────────────────────────────────

// ───────────────────────────────────────────────────────────────
// 1. API TESTING STRATEGY
// ───────────────────────────────────────────────────────────────
/*
  FOUR LEVELS — what each catches, when to use it

  ① UNIT — route handler in isolation (no HTTP, no DB)
    ─────────────────────────────────────────────────
    Import the handler function directly and call it with mock req/res objects.
    Fast (< 1 ms). Good for pure business logic inside the handler.
    Does NOT catch: middleware bugs, route wiring, DB interaction, auth.

    Example — handler extracted from Express route:

      // handlers/transfer.ts
      export async function transferHandler(req: Request, res: Response) {
        const { to, amount } = req.body;
        if (amount <= 0) return res.status(400).json({ error: "amount must be positive" });
        // ... prisma call ...
      }

      // transfer.unit.test.ts
      it("rejects non-positive amount", async () => {
        const req = { body: { to: "user-2", amount: -50 } } as Request;
        const json = jest.fn();
        const status = jest.fn().mockReturnValue({ json });
        const res = { status } as unknown as Response;

        await transferHandler(req, res);

        expect(status).toHaveBeenCalledWith(400);
        expect(json).toHaveBeenCalledWith({ error: "amount must be positive" });
      });

  ② INTEGRATION — full HTTP stack with supertest + test database
    ─────────────────────────────────────────────────────────────
    Sends real HTTP requests to your Express app. Uses a separate test DB.
    Catches: route wiring, middleware ordering, DB reads/writes, auth, validation.
    This is your PRIMARY layer. Target: 70–80 % of test effort here.

  ③ CONTRACT — consumer-driven (Pact)
    ─────────────────────────────────
    Consumer defines expected request/response shape as a "pact".
    Provider runs a verifier against that pact in CI.
    Catches: breaking API changes between services when teams deploy independently.
    See Section 5 for detail.

  ④ E2E — full system through the browser (Playwright)
    ────────────────────────────────────────────────────
    Hits real infrastructure. Slow, flaky. Only cover critical happy paths.
    Target: < 10 % of tests. See basics/testing/05-e2e-testing.ts.

  THE CORE PRINCIPLE: "Test against the HTTP interface, not the implementation"
  ─────────────────────────────────────────────────────────────────────────────
  A well-designed integration test asserts:
    • HTTP status code
    • Response body shape
    • Observable side effects (DB state, emails queued)

  It does NOT assert:
    • Which Prisma method was called
    • Internal variable names
    • Which file the logic lives in

  This means you can freely refactor internals without rewriting tests.
  If you mock prisma.user.create inside an integration test, you've coupled
  your test to the implementation — the test breaks on refactor even when
  the API behaviour is unchanged.

  RECOMMENDED BALANCE for a typical REST API (monolith, single team):
    Unit tests         : ~20 %  (pure functions, validators, formatters)
    Integration tests  : ~75 %  (routes + test DB)
    Contract tests     : 0 %    (skip unless microservices, separate teams)
    E2E tests          : ~5 %   (smoke suite on critical flows)
*/

// ─── Demo: unit-testing a pure handler function ────────────────
function validateTransferInput(amount: number, balance: number): string | null {
  if (!Number.isFinite(amount)) return "amount must be a finite number";
  if (amount <= 0)       return "amount must be positive";
  if (amount > balance)  return "insufficient funds";
  return null; // valid
}

console.log("=== 1. API Testing Strategy ===");
console.log("validateTransferInput(100, 500):", validateTransferInput(100, 500));   // null — valid
console.log("validateTransferInput(-1, 500):", validateTransferInput(-1, 500));    // error
console.log("validateTransferInput(600, 500):", validateTransferInput(600, 500));  // error

// This pure function gets fast unit tests. The route that CALLS it
// gets integration tests that check the HTTP status code produced.


// ───────────────────────────────────────────────────────────────
// 2. TEST ISOLATION PATTERNS
// ───────────────────────────────────────────────────────────────
/*
  The goal: every test starts from a known, clean state.
  Tests that share state are flaky — order-dependent and hard to debug.

  APPROACH A — Separate database per test file (too slow for most teams)
  ──────────────────────────────────────────────────────────────────────
  Spin up a fresh Postgres container per test file with testcontainers or
  docker-compose -f docker-compose.test.yml up -d.
  Pros: perfect isolation. Cons: 5–15 s startup per file → CI takes minutes.
  Worth it only when tests run in parallel across many machines (large teams).

  APPROACH B — Transaction rollback per test (fast, Prisma pattern)
  ─────────────────────────────────────────────────────────────────
  Wrap every test in a transaction; roll back after the test.
  The DB never sees the committed data, so the next test starts clean.

    // jest.setup.ts
    import { prisma } from "./src/db";

    let tx: Awaited<ReturnType<typeof prisma.$transaction>>;

    beforeEach(async () => {
      // Intercept all prisma calls and route them through an
      // uncommitted transaction. Requires Prisma's interactive transactions.
      await prisma.$executeRaw`BEGIN`;
    });

    afterEach(async () => {
      await prisma.$executeRaw`ROLLBACK`;
    });

  Pros: extremely fast (< 5 ms overhead), no cleanup code needed.
  Cons: does not work if the code under test opens its own transaction
        (nested transactions on SQLite, or advisory locks on Postgres).

  APPROACH C — beforeEach table truncation (simple, portable)
  ────────────────────────────────────────────────────────────
  Truncate relevant tables before each test and seed fresh data.
  Works with any DB driver. Slightly slower than rollback but very readable.

    beforeEach(async () => {
      // Order matters — FK constraints: child before parent
      await prisma.transaction.deleteMany();
      await prisma.account.deleteMany();
      await prisma.user.deleteMany();
    });

  This is the recommended default for most teams. Use rollback only when
  test suite is > 500 tests and CI time becomes a problem.

  TEST DATA FACTORIES — builder pattern
  ──────────────────────────────────────
  Never hard-code IDs or rely on sequential IDs in tests.
  Use factory functions that generate unique, self-describing test data.

    // factories/user.ts
    import { v4 as uuidv4 } from "uuid";
    import { prisma } from "../src/db";

    interface UserOverride {
      email?: string;
      role?: "USER" | "ADMIN";
      balance?: number;
    }

    export async function createTestUser(overrides: UserOverride = {}) {
      const id = uuidv4();
      return prisma.user.create({
        data: {
          id,
          email: overrides.email ?? `test-${id}@example.com`,
          passwordHash: "hashed-password",  // pre-hashed, skip bcrypt in tests
          role: overrides.role ?? "USER",
          account: {
            create: { balance: overrides.balance ?? 1000 }
          }
        },
        include: { account: true }
      });
    }

    // Usage in a test:
    it("transfers funds", async () => {
      const sender   = await createTestUser({ balance: 500 });
      const receiver = await createTestUser();  // default 1000 balance

      const res = await request(app)
        .post("/api/v1/account/transfer")
        .set("Authorization", `Bearer ${tokenFor(sender)}`)
        .send({ to: receiver.id, amount: 200 });

      expect(res.status).toBe(200);
    });

  KEY RULES for test data:
    • Seed only the minimum data the test needs — nothing more.
    • Use deterministic overrides for anything you assert on (amounts, emails).
    • Never hard-code IDs. Use uuidv4() or the factory's generated id.
    • Use a separate email domain (e.g. example.com) so test data is obvious.
*/

// ─── Demo: factory pattern in plain TypeScript (no DB) ────────────
interface TestUser {
  id: string;
  email: string;
  role: "USER" | "ADMIN";
  balance: number;
}

function buildTestUser(overrides: Partial<TestUser> = {}): TestUser {
  const id = `test-${Math.random().toString(36).slice(2, 9)}`;
  return {
    id,
    email: `${id}@example.com`,
    role: "USER",
    balance: 1000,
    ...overrides,
  };
}

console.log("\n=== 2. Test Isolation Patterns ===");
const adminUser  = buildTestUser({ role: "ADMIN", balance: 0 });
const regularUser = buildTestUser({ balance: 500 });
console.log("admin factory:", adminUser.role, adminUser.email);
console.log("regular factory:", regularUser.role, regularUser.balance);
console.log("IDs are unique:", adminUser.id !== regularUser.id);


// ───────────────────────────────────────────────────────────────
// 3. TESTING AUTHENTICATION FLOWS
// ───────────────────────────────────────────────────────────────
/*
  AUTH TESTING CHECKLIST:
    ✅ Valid token → access granted
    ✅ No token → 401
    ✅ Malformed token → 401
    ✅ Expired token → 401
    ✅ Valid token but wrong role → 403
    ✅ Refresh token rotation works
    ✅ Refresh token cannot be reused after rotation

  HELPER: loginAs(role) → token
  ──────────────────────────────
  Create a helper that creates a user, calls the login endpoint, and
  returns the token. Use it in every test that needs auth.

    // helpers/auth.ts
    export async function loginAs(role: "USER" | "ADMIN" = "USER") {
      const user = await createTestUser({ role });
      const res  = await request(app)
        .post("/api/v1/user/signin")
        .send({ username: user.email, password: "plaintext-test-password" });

      if (res.status !== 200) {
        throw new Error(`loginAs failed: ${JSON.stringify(res.body)}`);
      }
      return { token: res.body.token as string, user };
    }

  Using the helper in tests:

    it("allows admin to delete a user", async () => {
      const { token }    = await loginAs("ADMIN");
      const { user: target } = await loginAs("USER");

      const res = await request(app)
        .delete(`/api/v1/users/${target.id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
    });

    it("rejects USER role from DELETE /users/:id", async () => {
      const { token }    = await loginAs("USER");
      const { user: target } = await loginAs("USER");

      const res = await request(app)
        .delete(`/api/v1/users/${target.id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/forbidden/i);
    });

  TESTING TOKEN EXPIRY — mock Date.now
  ─────────────────────────────────────
  Token expiry depends on the current time. Mock it to fast-forward.

    it("rejects an expired token", async () => {
      const realNow = Date.now;

      // Issue token "now"
      const { token } = await loginAs("USER");

      // Fast-forward time by 2 hours (past the 1h expiry)
      jest.spyOn(Date, "now").mockReturnValue(realNow() + 2 * 60 * 60 * 1000);

      const res = await request(app)
        .get("/api/v1/account/balance")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/expired/i);

      jest.restoreAllMocks();
    });

  TESTING REFRESH TOKEN ROTATION:

    it("rotates refresh token on use", async () => {
      const { body: loginBody } = await request(app)
        .post("/api/v1/user/signin")
        .send({ username: "user@example.com", password: "pass" });

      const oldRefresh = loginBody.refreshToken;

      const { body: refreshBody } = await request(app)
        .post("/api/v1/user/refresh")
        .send({ refreshToken: oldRefresh });

      expect(refreshBody.accessToken).toBeDefined();
      expect(refreshBody.refreshToken).not.toBe(oldRefresh); // rotated

      // Old token must now be rejected (rotation invalidates it)
      const reuse = await request(app)
        .post("/api/v1/user/refresh")
        .send({ refreshToken: oldRefresh });

      expect(reuse.status).toBe(401);
    });
*/

// ─── Demo: token expiry logic (no JWT library needed for demo) ───
function isTokenExpired(issuedAt: number, expiryMs: number, now: number): boolean {
  return now > issuedAt + expiryMs;
}

console.log("\n=== 3. Testing Authentication Flows ===");
const issuedAt   = Date.now();
const oneHour    = 60 * 60 * 1000;
const twoHoursLater = issuedAt + 2 * oneHour;

console.log("token valid now:", !isTokenExpired(issuedAt, oneHour, issuedAt + 100));
console.log("token expired after 2h:", isTokenExpired(issuedAt, oneHour, twoHoursLater));
// This is exactly what jwt.verify does internally — mock Date.now in tests to control it.


// ───────────────────────────────────────────────────────────────
// 4. TESTING COMPLEX REQUEST FLOWS
// ───────────────────────────────────────────────────────────────
/*
  MULTI-STEP FLOWS
  ─────────────────
  Some features require a sequence of HTTP calls before you can assert anything.
  Structure these as a single test (not split across multiple it() blocks),
  because the state flows from step to step.

  Pattern: signup → verify email → login → access protected resource

    it("full signup → verify → login flow", async () => {
      // Step 1: signup
      const signupRes = await request(app)
        .post("/api/v1/user/signup")
        .send({ email: "new@example.com", password: "Str0ng!" });

      expect(signupRes.status).toBe(201);
      const userId = signupRes.body.userId;

      // Step 2: verify email (in tests, read the token from DB directly)
      const dbUser = await prisma.user.findUnique({ where: { id: userId } });
      const verifyToken = dbUser!.emailVerifyToken;

      const verifyRes = await request(app)
        .post("/api/v1/user/verify-email")
        .send({ token: verifyToken });

      expect(verifyRes.status).toBe(200);

      // Step 3: login
      const loginRes = await request(app)
        .post("/api/v1/user/signin")
        .send({ email: "new@example.com", password: "Str0ng!" });

      expect(loginRes.status).toBe(200);
      const token = loginRes.body.token;

      // Step 4: access protected route
      const profileRes = await request(app)
        .get("/api/v1/user/me")
        .set("Authorization", `Bearer ${token}`);

      expect(profileRes.status).toBe(200);
      expect(profileRes.body.email).toBe("new@example.com");
    });

  ASSERTING DB STATE DIRECTLY AFTER HTTP CALL
  ─────────────────────────────────────────────
  The HTTP response tells you what the API claims happened.
  The DB tells you what actually happened.
  Assert both when the operation is critical and hard to reverse.

  When to assert DB state:
    • Money transfers  (response says 200, but did balance actually change?)
    • Hard deletes      (response says 204, is the row gone?)
    • Audit log writes  (a side-effect the response doesn't expose)
    • Idempotency       (second request: DB state unchanged, not doubled)

    it("deducts balance in DB after transfer", async () => {
      const { token, user: sender } = await loginAs("USER"); // balance: 1000

      await request(app)
        .post("/api/v1/account/transfer")
        .set("Authorization", `Bearer ${token}`)
        .send({ to: receiverId, amount: 300 })
        .expect(200);

      // Assert DB state — not just the response
      const account = await prisma.account.findUnique({
        where: { userId: sender.id }
      });
      expect(account!.balance).toBe(700); // 1000 - 300
    });

  TESTING IDEMPOTENCY
  ────────────────────
  An idempotent endpoint produces the same result when called multiple times.
  POST /api/v1/user/verify-email with the same token twice should not
  double-process or error the second time (return 200 or 409 consistently).

    it("verifying the same email token twice is safe", async () => {
      const token = await getVerifyToken(userId);

      const first  = await request(app).post("/verify-email").send({ token });
      const second = await request(app).post("/verify-email").send({ token });

      expect(first.status).toBe(200);
      // Second call: either idempotent 200 or explicit 409 (already verified)
      expect([200, 409]).toContain(second.status);

      // Either way, DB should only show one verification event
      const events = await prisma.auditLog.findMany({ where: { userId } });
      expect(events.filter(e => e.type === "EMAIL_VERIFIED")).toHaveLength(1);
    });
*/

// ─── Demo: idempotency logic simulation ───────────────────────
const verifiedUsers = new Set<string>();

function verifyEmail(userId: string): { status: number; message: string } {
  if (verifiedUsers.has(userId)) {
    return { status: 409, message: "already verified" };
  }
  verifiedUsers.add(userId);
  return { status: 200, message: "verified" };
}

console.log("\n=== 4. Testing Complex Request Flows ===");
console.log("First verify:", verifyEmail("user-1"));    // 200
console.log("Second verify (same):", verifyEmail("user-1")); // 409 — idempotent
console.log("Different user:", verifyEmail("user-2")); // 200


// ───────────────────────────────────────────────────────────────
// 5. CONTRACT TESTING WITH PACT
// ───────────────────────────────────────────────────────────────
/*
  WHAT IS A CONSUMER-DRIVEN CONTRACT?
  ─────────────────────────────────────
  In a microservices architecture, Service A (consumer) calls Service B (provider).
  The consumer defines a "contract": the exact request/response shape it expects.
  The provider then runs a verification step to prove it honours that contract.

  This catches API-breaking changes before they reach production — even when the
  consumer and provider teams deploy independently on different schedules.

  HOW PACT WORKS:
    1. Consumer team writes Pact tests (using @pact-foundation/pact):

       const provider = new Pact({
         consumer: "payment-service",
         provider: "user-service",
       });

       describe("user-service contract", () => {
         before(() => provider.setup());
         after(() => provider.finalize());

         it("gets user by ID", async () => {
           await provider.addInteraction({
             state: "user 123 exists",
             uponReceiving: "GET /users/123",
             withRequest: { method: "GET", path: "/users/123" },
             willRespondWith: {
               status: 200,
               body: {
                 id: "123",
                 email: like("user@example.com"), // Pact matcher
                 role: like("USER"),
               },
             },
           });

           const result = await userServiceClient.getUser("123");
           expect(result.id).toBe("123");
           await provider.verify();
         });
       });

    2. Pact generates a JSON pact file and publishes it to a Pact Broker.

    3. Provider team adds a verification step in CI:

       const { Verifier } = require("@pact-foundation/pact");

       it("verifies consumer contracts", () => {
         return new Verifier({
           providerBaseUrl: "http://localhost:3000",
           pactBrokerUrl: process.env.PACT_BROKER_URL,
           provider: "user-service",
           publishVerificationResult: true,
         }).verifyProvider();
       });

    4. If the provider breaks the contract, CI fails — before the deploy.

  PACT MATCHERS (avoid brittle exact matches):
    like(value)          — "any value of this type"
    eachLike(item)       — "array of at least one item matching this"
    term({ generate, matcher }) — regex match
    integer(), decimal() — numeric type matchers

  WHEN IS PACT WORTH IT?
  ──────────────────────
  Worth the overhead:
    ✅ Multiple services with separate deployment pipelines
    ✅ Consumer and provider owned by different teams
    ✅ API breaking changes happen and cause outages
    ✅ You already have a Pact Broker or Pactflow available

  Overkill (skip it):
    ❌ Monolith — consumer and provider live in the same codebase
    ❌ Same team owns both sides — just coordinate and run shared tests
    ❌ API is internal-only and changes are coordinated synchronously
    ❌ Small team (< 5 engineers) — the Pact infrastructure cost exceeds benefit

  For a monolith or small team: use integration tests against a shared test DB.
  The value of Pact is proportional to the independence of the services.
*/

console.log("\n=== 5. Contract Testing with Pact ===");
console.log("Contract testing: use Pact when teams deploy independently.");
console.log("For monoliths or same-team microservices: integration tests are enough.");

// Simulating a consumer-side contract definition (no library):
interface UserContract {
  id: string;
  email: string;
  role: "USER" | "ADMIN";
}

function validateAgainstContract(response: unknown): response is UserContract {
  if (typeof response !== "object" || response === null) return false;
  const r = response as Record<string, unknown>;
  return (
    typeof r["id"] === "string" &&
    typeof r["email"] === "string" &&
    (r["role"] === "USER" || r["role"] === "ADMIN")
  );
}

const mockProviderResponse = { id: "abc-123", email: "user@example.com", role: "USER" };
console.log("Provider response satisfies contract:", validateAgainstContract(mockProviderResponse));
const brokenResponse = { id: "abc-123", email: "user@example.com" }; // missing role
console.log("Broken response satisfies contract:", validateAgainstContract(brokenResponse));


// ───────────────────────────────────────────────────────────────
// 6. SNAPSHOT TESTING FOR API RESPONSES
// ───────────────────────────────────────────────────────────────
/*
  WHAT IS SNAPSHOT TESTING?
  ──────────────────────────
  expect(responseBody).toMatchSnapshot() stores the response body on first run.
  On subsequent runs, Jest diffs the current output against the stored snapshot.
  A mismatch fails the test.

  WHEN IT'S USEFUL:
    ✅ Catching accidental field removal ("balance" key disappeared from response)
    ✅ Catching accidental field rename ("userId" became "user_id")
    ✅ Catching shape regressions in complex nested objects
    ✅ Documenting the expected response format for reviewers

    it("GET /api/v1/user/me returns expected shape", async () => {
      const { token } = await loginAs("USER");
      const res = await request(app)
        .get("/api/v1/user/me")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      // Dynamic fields must be replaced before snapshotting
      const sanitized = {
        ...res.body,
        id:        expect.any(String),  // or strip it
        createdAt: expect.any(String),
      };
      expect(sanitized).toMatchSnapshot();
    });

  INLINE SNAPSHOTS — keep snapshot in the test file:

    expect(res.body).toMatchInlineSnapshot(`
      Object {
        "email": "test@example.com",
        "role": "USER",
      }
    `);

  Inline snapshots are more readable for small objects; file snapshots
  (__snapshots__/*.snap) are better for large nested responses.

  RISKS — snapshots can hide regressions if updated blindly:
    ⚠️ Developer runs --updateSnapshot to "fix" a failing test
        without reading what changed. Bug ships.
    ⚠️ Snapshot includes dynamic values (IDs, timestamps) → test always fails
        unless sanitized first.
    ⚠️ Over-snapshotting: everything matches a snapshot → nobody reads diffs.

  RULES FOR HEALTHY SNAPSHOTS:
    1. Strip / replace all dynamic fields (IDs, timestamps, tokens) before snapshotting.
    2. Only snapshot fields you actually care about — not the entire response object.
    3. Review every snapshot diff in PR review — never auto-approve snapshot updates.
    4. If you add a new field, update the snapshot intentionally:
         npx jest --updateSnapshot
       Then verify the diff in git shows exactly the new field and nothing else.
    5. Delete snapshots for removed tests — stale snapshots waste reviewer attention.

  ADDING A NEW FIELD — is it a regression?
  ──────────────────────────────────────────
  Q: Your snapshot test fails because you added "isVerified: true" to the response.
  A: NOT a regression in API behaviour (no field removed, no type changed).
     Run --updateSnapshot after intentional review. The diff in git proves it.
     A real regression would be: field removed, type changed, or value changed.
*/

console.log("\n=== 6. Snapshot Testing for API Responses ===");

// Simulate what toMatchSnapshot does internally (simplified):
type Snapshot = Record<string, unknown>;
const snapshotStore = new Map<string, Snapshot>();

function matchSnapshot(testName: string, value: Snapshot): "created" | "match" | "mismatch" {
  const stored = snapshotStore.get(testName);
  if (!stored) {
    snapshotStore.set(testName, value);
    return "created";
  }
  return JSON.stringify(stored) === JSON.stringify(value) ? "match" : "mismatch";
}

const responseBody = { email: "user@example.com", role: "USER", balance: 1000 };
console.log("First run (creates snapshot):", matchSnapshot("GET /me", responseBody));
console.log("Same response (passes):", matchSnapshot("GET /me", responseBody));
// Simulating adding a new field
const withNewField = { ...responseBody, isVerified: true };
console.log("New field added (fails → review + updateSnapshot):", matchSnapshot("GET /me", withNewField));


// ───────────────────────────────────────────────────────────────
// 7. TESTING ERROR PATHS SYSTEMATICALLY
// ───────────────────────────────────────────────────────────────
/*
  EVERY 4xx AND 5xx YOUR API CAN RETURN
  ───────────────────────────────────────
  Map out all error states before writing tests. Then write at least one
  test per status code, verifying: status, error code, error message shape.

  Standard error response shape (enforce this consistently):
    { error: { code: string, message: string, details?: unknown } }

  TABLE-DRIVEN TESTS WITH test.each
  ──────────────────────────────────
  When many inputs produce the same error path, use test.each
  to avoid copy-paste:

    describe("POST /api/v1/account/transfer — validation errors", () => {
      test.each([
        // [description,           body,                               expectedStatus, expectedCode]
        ["missing amount",         { to: "user-2" },                   400, "MISSING_FIELD"],
        ["negative amount",        { to: "user-2", amount: -1 },       400, "INVALID_AMOUNT"],
        ["zero amount",            { to: "user-2", amount: 0 },        400, "INVALID_AMOUNT"],
        ["non-numeric amount",     { to: "user-2", amount: "abc" },    400, "INVALID_AMOUNT"],
        ["missing recipient",      { amount: 100 },                    400, "MISSING_FIELD"],
        ["recipient not found",    { to: "ghost-id", amount: 100 },    404, "USER_NOT_FOUND"],
        ["transfer to self",       { to: SENDER_ID, amount: 100 },     400, "SELF_TRANSFER"],
        ["insufficient funds",     { to: "user-2", amount: 999999 },   400, "INSUFFICIENT_FUNDS"],
      ])(
        "%s",
        async (_desc, body, expectedStatus, expectedCode) => {
          const { token } = await loginAs("USER");
          const res = await request(app)
            .post("/api/v1/account/transfer")
            .set("Authorization", `Bearer ${token}`)
            .send(body);

          expect(res.status).toBe(expectedStatus);
          expect(res.body.error.code).toBe(expectedCode);
          expect(typeof res.body.error.message).toBe("string"); // always a string
        }
      );
    });

  TESTING DB FAILURE — mock Prisma to throw
  ────────────────────────────────────────────
  Your handler must survive a DB connection error and return 500 (not crash).

    it("returns 500 when DB is unavailable", async () => {
      jest.spyOn(prisma.account, "findUnique").mockRejectedValueOnce(
        new Error("Connection refused")
      );

      const { token } = await loginAs("USER");
      const res = await request(app)
        .get("/api/v1/account/balance")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(500);
      expect(res.body.error.code).toBe("INTERNAL_ERROR");
      // Must NOT leak the raw DB error message to the client:
      expect(res.body.error.message).not.toMatch(/connection refused/i);
    });

  TESTING TIMEOUT HANDLING
  ─────────────────────────
  If your handler calls an external service with a timeout, test the timeout path:

    it("returns 503 when upstream times out", async () => {
      jest.spyOn(paymentGateway, "charge").mockImplementationOnce(
        () => new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Gateway timeout")), 0)
        )
      );

      const res = await request(app)
        .post("/api/v1/payment/charge")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ amount: 100 });

      expect(res.status).toBe(503);
      expect(res.body.error.code).toBe("UPSTREAM_TIMEOUT");
    });

  COMPLETE ERROR MAP — what to test for a typical REST resource:
    ┌─────────────────────────────────────────────────────────┐
    │ POST /resource                                          │
    │   400 MISSING_FIELD       — required field absent       │
    │   400 INVALID_FORMAT      — wrong type/pattern          │
    │   401 UNAUTHENTICATED     — no token                    │
    │   403 FORBIDDEN           — wrong role                  │
    │   409 CONFLICT            — duplicate (email exists)    │
    │   422 UNPROCESSABLE       — valid shape, invalid logic  │
    │   500 INTERNAL_ERROR      — DB/upstream failure         │
    ├─────────────────────────────────────────────────────────┤
    │ GET /resource/:id                                       │
    │   400 INVALID_ID_FORMAT   — not a valid UUID            │
    │   401, 403 (same as above)                              │
    │   404 NOT_FOUND           — row doesn't exist           │
    │   500 INTERNAL_ERROR                                    │
    └─────────────────────────────────────────────────────────┘
*/

console.log("\n=== 7. Testing Error Paths Systematically ===");

// Simulate test.each pattern in plain TypeScript:
interface TransferCase {
  desc: string;
  amount: number;
  balance: number;
  expectedError: string | null;
}

const transferCases: TransferCase[] = [
  { desc: "valid transfer",       amount: 100, balance: 500, expectedError: null },
  { desc: "negative amount",      amount: -1,  balance: 500, expectedError: "amount must be positive" },
  { desc: "insufficient funds",   amount: 600, balance: 500, expectedError: "insufficient funds" },
  { desc: "infinite amount",      amount: Infinity, balance: 500, expectedError: "amount must be a finite number" },
];

transferCases.forEach(({ desc, amount, balance, expectedError }) => {
  const result = validateTransferInput(amount, balance);
  const pass = result === expectedError;
  console.log(`  [${pass ? "PASS" : "FAIL"}] ${desc}: ${result ?? "valid"}`);
});


// ───────────────────────────────────────────────────────────────
// 8. PERFORMANCE AND LOAD TESTING
// ───────────────────────────────────────────────────────────────
/*
  LOAD TESTING IS NOT FUNCTIONAL TESTING
  ────────────────────────────────────────
  Jest/Supertest tests correctness of one request at a time.
  Load tests reveal how your API behaves under concurrent traffic.
  Run them separately — not in your unit/integration test suite.

  K6 — RECOMMENDED TOOL (https://k6.io)
  ───────────────────────────────────────
  k6 scripts are written in JavaScript/TypeScript. VUs = Virtual Users.

    // load-test/transfer.js
    import http from "k6/http";
    import { check, sleep } from "k6";

    export const options = {
      stages: [
        { duration: "30s", target: 50  },  // ramp up to 50 VUs
        { duration: "60s", target: 50  },  // hold at 50 VUs
        { duration: "10s", target: 0   },  // ramp down
      ],
      thresholds: {
        "http_req_duration": ["p95<500"],  // 95th percentile < 500 ms
        "http_req_failed":   ["rate<0.01"], // < 1% error rate
      },
    };

    export default function () {
      const payload = JSON.stringify({ to: "user-2", amount: 1 });
      const params  = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${__ENV.TEST_TOKEN}`,
        },
      };

      const res = http.post("http://localhost:3000/api/v1/account/transfer", payload, params);

      check(res, {
        "status is 200": (r) => r.status === 200,
        "response time OK": (r) => r.timings.duration < 500,
      });

      sleep(1); // think time between requests
    }

  Run: k6 run --env TEST_TOKEN=... load-test/transfer.js

  METRICS TO WATCH:
    p50 (median)  — typical experience
    p95           — worst 1-in-20 request — threshold target
    p99           — worst 1-in-100 — alerts boundary
    error_rate    — should be < 1 % under normal load
    throughput    — requests/second at various VU levels

  IDENTIFYING BOTTLENECKS FROM RESULTS:
    • p99 high but p50 fine → outliers: slow queries, GC pauses, lock contention
    • Error rate spikes at N VUs → connection pool exhausted (increase pool or scale)
    • Throughput plateaus before reaching target VUs → CPU bound (scale horizontally)
    • Memory grows over time → memory leak (profile with clinic.js or --inspect)
    • p95 fine at 50 VUs but bad at 100 VUs → N+1 query problem amplified under load

  ARTILLERY — simpler YAML-based alternative
  ────────────────────────────────────────────
    # artillery.yml
    config:
      target: "http://localhost:3000"
      phases:
        - duration: 60
          arrivalRate: 20    # 20 new users/sec
    scenarios:
      - flow:
          - post:
              url: "/api/v1/user/signin"
              json: { email: "user@example.com", password: "pass" }

  Run: npx artillery run artillery.yml

  Artillery is lower config; k6 is more powerful for threshold-based CI gates.
  Use k6 when you want CI to fail if p95 > 500 ms.
  Use Artillery for quick sanity checks or when your team prefers YAML.

  WHEN TO RUN LOAD TESTS:
    • Before launching a new endpoint in production
    • After adding a feature that changes DB query patterns
    • When on-call alerts show latency increases
    • In a dedicated "perf" CI pipeline (not on every PR — too slow)
*/

console.log("\n=== 8. Performance and Load Testing ===");

// Simulate reading k6-style p95 result and checking threshold:
interface LoadTestResult {
  p50: number;
  p95: number;
  p99: number;
  errorRate: number;
  throughput: number;
}

function evaluateLoadTest(result: LoadTestResult): string[] {
  const failures: string[] = [];
  if (result.p95 > 500)       failures.push(`p95 ${result.p95}ms exceeds 500ms threshold`);
  if (result.errorRate > 0.01) failures.push(`error rate ${(result.errorRate * 100).toFixed(1)}% exceeds 1%`);
  return failures;
}

const goodResult: LoadTestResult  = { p50: 45,  p95: 210,  p99: 480,  errorRate: 0.002, throughput: 850 };
const badResult:  LoadTestResult  = { p50: 80,  p95: 780,  p99: 1400, errorRate: 0.03,  throughput: 300 };

console.log("Good load test failures:", evaluateLoadTest(goodResult));   // []
console.log("Bad load test failures:", evaluateLoadTest(badResult));    // 2 failures


// ───────────────────────────────────────────────────────────────
// PRACTICE
// ───────────────────────────────────────────────────────────────

console.log("\n=== Practice ===");

/*
  Q: What's the difference between beforeEach table truncation vs transaction
     rollback for test isolation?

  A: Both reset DB state between tests.

     Transaction rollback:
       - Wraps the test code in a DB transaction that is never committed.
       - After the test, ROLLBACK removes all changes instantly.
       - Fastest — zero I/O, just a transaction abort.
       - Limitation: fails if the code under test itself opens a transaction
         (nested transaction semantics differ per DB) or uses advisory locks.
         Also fails with SQLite in WAL mode.

     beforeEach table truncation (deleteMany / TRUNCATE):
       - Issues real DELETE or TRUNCATE statements before each test.
       - Slightly slower (real I/O) but works with any DB driver.
       - Must truncate in the right order (child tables before parent tables)
         to avoid FK constraint violations.
       - Simpler to set up — no transaction interception required.

     Default recommendation: use truncation. Switch to rollback only if your
     test suite exceeds 500 tests and CI time is a bottleneck.
*/

/*
  Q: You want to test that only admin users can access DELETE /users/:id.
     Write the test structure.

  A:
    describe("DELETE /users/:id — access control", () => {
      let adminToken: string;
      let userToken: string;
      let targetId: string;

      beforeEach(async () => {
        ({ token: adminToken } = await loginAs("ADMIN"));
        ({ token: userToken  } = await loginAs("USER"));
        const { user: target } = await loginAs("USER");
        targetId = target.id;
      });

      it("allows ADMIN to delete a user", async () => {
        const res = await request(app)
          .delete(`/api/v1/users/${targetId}`)
          .set("Authorization", `Bearer ${adminToken}`);
        expect(res.status).toBe(200);

        // Assert DB state — row should be gone
        const gone = await prisma.user.findUnique({ where: { id: targetId } });
        expect(gone).toBeNull();
      });

      it("rejects USER role with 403", async () => {
        const res = await request(app)
          .delete(`/api/v1/users/${targetId}`)
          .set("Authorization", `Bearer ${userToken}`);
        expect(res.status).toBe(403);
        expect(res.body.error.code).toBe("FORBIDDEN");
      });

      it("rejects unauthenticated request with 401", async () => {
        const res = await request(app)
          .delete(`/api/v1/users/${targetId}`);
        expect(res.status).toBe(401);
      });
    });
*/

/*
  Q: When should you assert the DB state directly (via Prisma) after an HTTP
     call, rather than just checking the response?

  A: Assert DB state when:
     1. The operation is not safely reversible (money transfer, hard delete).
        The response can say 200 but the DB write could have silently failed.
     2. The side effect is not exposed in the response (audit log, email queue).
     3. You're testing idempotency — confirm the operation ran exactly once,
        not that the row count doubled.
     4. You want to catch a "lie" — a handler that returns 200 without writing.

     Checking only the response is fine for:
       - Read operations (GET) where the response IS the DB state.
       - Non-critical writes where a re-read would be redundant.
       - Tests that already assert the DB state through a subsequent GET call.
*/

/*
  Q: What's a consumer-driven contract test and when is it worth setting up Pact?

  A: A consumer-driven contract test is a test where the API consumer
     (the service making requests) defines the expected request/response shape
     as a "pact file". The API provider then runs a verifier against that file
     to prove it honours the consumer's expectations.

     It is worth setting up Pact when:
       - Services are deployed independently on different schedules.
       - Consumer and provider are owned by different teams.
       - Breaking API changes between services have caused production incidents.
       - You have microservices that cannot share a test environment easily.

     It is overkill when:
       - Consumer and provider live in the same codebase (monolith).
       - Same team owns both sides — coordinate directly + integration tests.
       - Team is small (< 5 engineers) — overhead exceeds benefit.

     For a monolith or same-team setup: integration tests against a shared
     test DB provide equivalent safety at a fraction of the setup cost.
*/

/*
  Q: Your API snapshot test fails after you added a new field to the response.
     Is this a real regression?

  A: No — adding a new field is a backwards-compatible change, not a regression.
     Existing consumers who don't read the new field are unaffected.

     What to do:
       1. Review the failing snapshot diff in your PR. Confirm only the new
          field appears in the diff — nothing was removed or renamed.
       2. Run: npx jest --updateSnapshot
       3. Commit the updated snapshot file so the diff is visible in git history.

     A REAL regression in a snapshot test looks like:
       - A field that was present is now missing (e.g. "balance" removed).
       - A field was renamed (e.g. "userId" → "user_id").
       - A field's type changed (e.g. number → string for "id").
       - An array field changed to a single object.

     Rule: never auto-approve snapshot updates without reading the diff.
*/


// ───────────────────────────────────────────────────────────────
// REFERENCE CARD (printed by runDemo)
// ───────────────────────────────────────────────────────────────

function runDemo(): void {
  console.log(`
╔══════════════════════════════════════════════════════════════════╗
║  BACKEND 16: API TESTING REFERENCE CARD                         ║
╠══════════════════════════════════════════════════════════════════╣
║  TESTING LAYERS                                                  ║
║    Unit         handler fn, no I/O, mocked req/res, very fast   ║
║    Integration  supertest + test DB, full HTTP stack, primary   ║
║    Contract     Pact — only for cross-team microservices         ║
║    E2E          Playwright — real browser, critical paths only  ║
║  Target ratio:  ~20% unit  |  ~75% integration  |  ~5% E2E      ║
╠══════════════════════════════════════════════════════════════════╣
║  TEST ISOLATION                                                  ║
║    beforeEach truncation  deleteMany in FK order, portable      ║
║    Transaction rollback   BEGIN + ROLLBACK, fastest, caveat:    ║
║                           fails if handler opens own tx         ║
║    Test factories         buildTestUser(overrides) → unique     ║
║                           IDs, minimal seed data only           ║
╠══════════════════════════════════════════════════════════════════╣
║  AUTH TESTING                                                    ║
║    loginAs(role) helper   → token for every test that needs auth║
║    Mock Date.now          to test token expiry fast-forward     ║
║    Always test:           no token → 401                        ║
║                           wrong role → 403                      ║
║                           refresh rotation → old token rejected ║
╠══════════════════════════════════════════════════════════════════╣
║  COMPLEX FLOWS                                                   ║
║    Multi-step in ONE it() — state flows between steps           ║
║    Assert DB directly     for money, deletes, audit logs        ║
║    Idempotency test        second call = same result, not double ║
╠══════════════════════════════════════════════════════════════════╣
║  CONTRACT TESTING                                                ║
║    Pact: consumer defines pact, provider verifies in CI         ║
║    Use when: independent deploy pipelines, separate teams       ║
║    Skip when: monolith, same team, small codebase               ║
╠══════════════════════════════════════════════════════════════════╣
║  SNAPSHOT TESTING                                                ║
║    toMatchSnapshot()      auto-created on first run             ║
║    toMatchInlineSnapshot   snapshot in test file, more readable ║
║    Strip dynamic fields   IDs, timestamps before snapshotting  ║
║    --updateSnapshot       after intentional change, review diff ║
║    New field added        NOT a regression — update snapshot     ║
║    Field removed/renamed  REAL regression — fix the code        ║
╠══════════════════════════════════════════════════════════════════╣
║  ERROR PATH COVERAGE                                             ║
║    test.each              table-driven — one row per error case ║
║    Mock Prisma to throw   test 500 without killing DB           ║
║    Error shape contract   { error: { code, message } } always  ║
║    Never leak raw DB err  mask "Connection refused" → 500       ║
╠══════════════════════════════════════════════════════════════════╣
║  LOAD TESTING (k6)                                               ║
║    VUs + duration stages  ramp up, hold, ramp down              ║
║    Thresholds             p95<500ms, error_rate<0.01            ║
║    p50 high               typical slowness (query/CPU)          ║
║    p99 high, p50 fine     outliers: lock, GC, slow query        ║
║    Error spike at N VUs   pool exhaustion → increase pool size  ║
║    Throughput plateau     CPU bound → scale horizontally        ║
║    Run separately         not in Jest suite; dedicated CI step  ║
╚══════════════════════════════════════════════════════════════════╝
`);
}

runDemo();

export default runDemo;
