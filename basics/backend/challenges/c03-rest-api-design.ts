// ═══════════════════════════════════════════════════════════
// CHALLENGE C03: REST API DESIGN  (Day 38)
// Run: npm run challenge:03  |  Time target: 20–30 min
// ═══════════════════════════════════════════════════════════
// PROJECT: Build the response layer of a REST API — pagination
//          metadata, correct HTTP status codes per outcome, and a
//          consistent success/error response envelope.
//
// RULES:
//  • Delete each // TODO comment as you implement it.
//  • Do NOT rename any exported name — assertions depend on them.
//  • Run `npm run challenge:03` to check your work (all PASS = done).

// ── ASSERT HELPER (do not modify) ─────────────────────────
function assert(condition: boolean, message: string): void {
  if (!condition) { console.error(`  FAIL  ${message}`); process.exitCode = 1; }
  else            { console.log (`  PASS  ${message}`); }
}

// ══════════════════════════════════════════════════════════
// PART 1 — Pagination metadata
// ══════════════════════════════════════════════════════════
// Given a total count and a 1-based page + pageSize, compute the
// metadata a client needs. `offset` is the number of rows to skip.

export interface PageMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  offset: number;
}

export function paginate(totalItems: number, page: number, pageSize: number): PageMeta {
  // TODO: totalPages = ceil(totalItems / pageSize) (at least 1 if there are items? use Math.ceil).
  //       offset = (page - 1) * pageSize
  //       hasNext = page < totalPages ; hasPrev = page > 1
  void totalItems; void page; void pageSize;
  return {
    page: 0, pageSize: 0, totalItems: 0, totalPages: 0,
    hasNext: false, hasPrev: false, offset: 0,
  }; // placeholder — replace
}

// ══════════════════════════════════════════════════════════
// PART 2 — Status code selector
// ══════════════════════════════════════════════════════════
// Map a CRUD outcome to its conventional HTTP status code.

export type Outcome =
  | "ok" | "created" | "noContent"
  | "badRequest" | "unauthorized" | "notFound" | "conflict";

export function statusFor(outcome: Outcome): number {
  // TODO: ok→200, created→201, noContent→204,
  //       badRequest→400, unauthorized→401, notFound→404, conflict→409
  void outcome;
  return 0; // placeholder — replace
}

// ══════════════════════════════════════════════════════════
// PART 3 — Response envelope
// ══════════════════════════════════════════════════════════
// A consistent shape so clients parse every response the same way.

export function ok<T>(data: T, meta?: PageMeta) {
  // TODO: return { success: true, data } and include `meta` ONLY when provided.
  void data; void meta;
  return { success: true as const, data } as { success: true; data: T; meta?: PageMeta };
}

export function fail(code: string, message: string) {
  // TODO: return { success: false, error: { code, message } }
  void code; void message;
  return { success: false as const, error: { code: "", message: "" } };
}

// ── ASSERTIONS (do not modify) ────────────────────────────
console.log("\n── C03 REST API design assertions ──");

const p = paginate(95, 3, 20);
assert(p.totalPages === 5,  "paginate: 95 items / 20 per page = 5 pages");
assert(p.offset === 40,     "paginate: page 3 offset is 40");
assert(p.hasNext === true,  "paginate: page 3 of 5 has next");
assert(p.hasPrev === true,  "paginate: page 3 of 5 has prev");
const last = paginate(95, 5, 20);
assert(last.hasNext === false, "paginate: last page has no next");
const first = paginate(95, 1, 20);
assert(first.hasPrev === false, "paginate: first page has no prev");

assert(statusFor("ok") === 200,          "statusFor: ok → 200");
assert(statusFor("created") === 201,     "statusFor: created → 201");
assert(statusFor("noContent") === 204,   "statusFor: noContent → 204");
assert(statusFor("badRequest") === 400,  "statusFor: badRequest → 400");
assert(statusFor("notFound") === 404,    "statusFor: notFound → 404");
assert(statusFor("conflict") === 409,    "statusFor: conflict → 409");

const env = ok({ id: 1 });
assert(env.success === true && env.data.id === 1, "ok: wraps data with success:true");
assert(!("meta" in env) || env.meta === undefined, "ok: omits meta when not provided");
const env2 = ok([1, 2], p);
assert(env2.meta?.totalPages === 5, "ok: includes meta when provided");
const err = fail("NOT_FOUND", "User missing");
assert(err.success === false && err.error.code === "NOT_FOUND" && err.error.message === "User missing",
  "fail: wraps code+message with success:false");

export {};
