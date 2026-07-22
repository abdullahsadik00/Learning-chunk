// ═══════════════════════════════════════════════════════════
// CHALLENGE C16: API TESTING  (Day 51)
// Run: npm run challenge:16  |  Time target: 25–35 min
// ═══════════════════════════════════════════════════════════
// PROJECT: Build the test doubles you need to unit-test an Express
//          handler with no server — a mock response, a mock request,
//          and a resettable fixture factory. Then use them to test a
//          handler both ways.
//
// RULES:
//  • Delete each // TODO comment as you implement it.
//  • Do NOT rename any exported name — assertions depend on them.
//  • Run `npm run challenge:16` to check your work (all PASS = done).

// ── ASSERT HELPER (do not modify) ─────────────────────────
function assert(condition: boolean, message: string): void {
  if (!condition) { console.error(`  FAIL  ${message}`); process.exitCode = 1; }
  else            { console.log (`  PASS  ${message}`); }
}

// ══════════════════════════════════════════════════════════
// PART 1 — Mock response
// ══════════════════════════════════════════════════════════
// status(code) records the code and is CHAINABLE (returns this).
// json(body) records the body. Both captured for assertions.

export interface MockRes {
  statusCode: number;
  body: unknown;
  status(code: number): MockRes;
  json(body: unknown): MockRes;
}

export function createMockRes(): MockRes {
  // TODO: return an object that captures statusCode & body.
  //       Default statusCode to 200 before any status() call.
  return {
    statusCode: 0, body: undefined,
    status() { return this; },
    json() { return this; },
  }; // placeholder — replace
}

// ══════════════════════════════════════════════════════════
// PART 2 — Mock request
// ══════════════════════════════════════════════════════════
// Merge overrides onto defaults so tests only specify what matters.

export interface MockReq {
  method: string;
  path: string;
  headers: Record<string, string>;
  params: Record<string, string>;
  body: Record<string, unknown>;
}

export function createMockReq(overrides: Partial<MockReq> = {}): MockReq {
  // TODO: defaults = { method:"GET", path:"/", headers:{}, params:{}, body:{} }
  //       merged with overrides (overrides win).
  void overrides;
  return { method: "", path: "", headers: {}, params: {}, body: {} }; // placeholder — replace
}

// ══════════════════════════════════════════════════════════
// PART 3 — Resettable fixture factory
// ══════════════════════════════════════════════════════════
// build() calls builder(seq) with an incrementing seq starting at 1,
// merges any overrides on top, and returns the object. reset() sets
// the sequence back so the next build() is seq=1 again.

export interface Factory<T> {
  build(overrides?: Partial<T>): T;
  reset(): void;
}

export function createFactory<T extends object>(builder: (seq: number) => T): Factory<T> {
  // TODO: keep a private seq counter; build → {...builder(++seq), ...overrides}
  void builder;
  return { build() { return {} as T; }, reset() {} }; // placeholder — replace
}

// ── ASSERTIONS (do not modify) ────────────────────────────
console.log("\n── C16 API testing assertions ──");

// Handler under test — do not change.
function createUserHandler(req: MockReq, res: MockRes): void {
  if (!req.body.name) { res.status(400).json({ error: "name required" }); return; }
  res.status(201).json({ id: 1, name: req.body.name });
}

const res1 = createMockRes();
createUserHandler(createMockReq({ body: {} }), res1);
assert(res1.statusCode === 400, "mockRes: 400 captured on validation failure");
assert((res1.body as any)?.error === "name required", "mockRes: error body captured");

const res2 = createMockRes();
createUserHandler(createMockReq({ body: { name: "Sadik" } }), res2);
assert(res2.statusCode === 201, "mockRes: 201 captured on success");
assert((res2.body as any)?.name === "Sadik", "mockRes: success body captured");

const req = createMockReq({ method: "POST" });
assert(req.method === "POST" && req.path === "/" && Object.keys(req.body).length === 0,
  "mockReq: overrides applied over defaults");

const users = createFactory((seq) => ({ id: seq, name: `user${seq}` }));
const u1 = users.build();
const u2 = users.build({ name: "custom" });
assert(u1.id === 1 && u1.name === "user1", "factory: first build uses seq 1");
assert(u2.id === 2 && u2.name === "custom", "factory: seq increments and overrides win");
users.reset();
const u3 = users.build();
assert(u3.id === 1, "factory: reset restarts the sequence");

export {};
