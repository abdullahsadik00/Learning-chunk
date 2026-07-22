// ═══════════════════════════════════════════════════════════
// CHALLENGE C04: AUTH · JWT  (Day 39)
// Run: npm run challenge:04  |  Time target: 30–40 min
// ═══════════════════════════════════════════════════════════
// PROJECT: Build a mini JWT — base64url encode a header+payload,
//          sign it with an HMAC, then verify signatures, detect
//          tampering, and enforce expiry. (Uses Node's built-in
//          `crypto`; no external deps.)
//
// RULES:
//  • Delete each // TODO comment as you implement it.
//  • Do NOT rename any exported name — assertions depend on them.
//  • Do NOT modify the `hmac` helper — it is given.
//  • Run `npm run challenge:04` to check your work (all PASS = done).

import { createHmac } from "crypto";

// ── ASSERT HELPER (do not modify) ─────────────────────────
function assert(condition: boolean, message: string): void {
  if (!condition) { console.error(`  FAIL  ${message}`); process.exitCode = 1; }
  else            { console.log (`  PASS  ${message}`); }
}

// ── GIVEN: HMAC signer (do not modify) ────────────────────
function hmac(data: string, secret: string): string {
  return createHmac("sha256", secret).update(data).digest("base64url");
}

export interface JwtPayload {
  sub: string;
  role: string;
  exp: number; // expiry as UNIX epoch SECONDS
}

// ══════════════════════════════════════════════════════════
// PART 1 — base64url of a JSON value
// ══════════════════════════════════════════════════════════

export function b64urlEncode(obj: unknown): string {
  // TODO: JSON.stringify, then Buffer.from(...).toString("base64url")
  void obj;
  return ""; // placeholder — replace
}

export function b64urlDecode<T>(token: string): T {
  // TODO: Buffer.from(token, "base64url").toString("utf8"), then JSON.parse
  void token;
  return null as unknown as T; // placeholder — replace
}

// ══════════════════════════════════════════════════════════
// PART 2 — constant-time string compare
// ══════════════════════════════════════════════════════════
// Returns true only if a === b, WITHOUT early-exit on first
// mismatch (so timing does not leak how many chars matched).

export function constantTimeEqual(a: string, b: string): boolean {
  // TODO: if lengths differ return false; else XOR-accumulate char codes
  //       across the whole string and return whether the accumulator is 0.
  void a; void b;
  return false; // placeholder — replace
}

// ══════════════════════════════════════════════════════════
// PART 3 — sign & verify
// ══════════════════════════════════════════════════════════
// Token format:  `${encHeader}.${encPayload}.${signature}`
//   encHeader  = b64urlEncode({ alg: "HS256", typ: "JWT" })
//   signature  = hmac(`${encHeader}.${encPayload}`, secret)

export function sign(payload: JwtPayload, secret: string): string {
  // TODO: build the three parts and join with "."
  void payload; void secret;
  return ""; // placeholder — replace
}

// Return the payload if the signature is valid AND not expired,
// otherwise return null. `nowSec` is the current time in seconds.
export function verify(token: string, secret: string, nowSec: number): JwtPayload | null {
  // TODO:
  //  1. Split into [h, p, sig]; if not exactly 3 parts → null
  //  2. Recompute expected = hmac(`${h}.${p}`, secret)
  //  3. constantTimeEqual(sig, expected) — if false → null (tampered / wrong secret)
  //  4. Decode payload; if payload.exp <= nowSec → null (expired)
  //  5. Otherwise return the payload
  void token; void secret; void nowSec;
  return null; // placeholder — replace
}

// ── ASSERTIONS (do not modify) ────────────────────────────
console.log("\n── C04 Auth · JWT assertions ──");

const round = b64urlDecode<{ a: number }>(b64urlEncode({ a: 42 }));
assert(round?.a === 42, "b64url: encode→decode round-trips an object");

assert(constantTimeEqual("abc", "abc") === true,  "constantTimeEqual: equal strings → true");
assert(constantTimeEqual("abc", "abd") === false, "constantTimeEqual: differing strings → false");
assert(constantTimeEqual("abc", "ab") === false,  "constantTimeEqual: different lengths → false");

const SECRET = "s3cr3t";
const payload: JwtPayload = { sub: "user-1", role: "admin", exp: 2_000 };
const token = sign(payload, SECRET);
assert(token.split(".").length === 3, "sign: produces a three-part token");

const good = verify(token, SECRET, 1_000);
assert(good !== null && good.sub === "user-1" && good.role === "admin",
  "verify: valid token before expiry returns the payload");

assert(verify(token, SECRET, 2_001) === null, "verify: expired token (exp <= now) → null");
assert(verify(token, "wrong-secret", 1_000) === null, "verify: wrong secret → null");

const tampered = token.slice(0, -1) + (token.endsWith("A") ? "B" : "A");
assert(verify(tampered, SECRET, 1_000) === null, "verify: tampered signature → null");
assert(verify("only.two", SECRET, 1_000) === null, "verify: malformed token → null");

export {};
