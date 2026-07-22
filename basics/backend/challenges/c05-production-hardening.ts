// ═══════════════════════════════════════════════════════════
// CHALLENGE C05: PRODUCTION HARDENING  (Day 40)
// Run: npm run challenge:05  |  Time target: 25–35 min
// ═══════════════════════════════════════════════════════════
// PROJECT: Build the guards that stand between the internet and your
//          handlers — a Zod-style schema validator, a security-header
//          set, and a file-upload gatekeeper.
//
// RULES:
//  • Delete each // TODO comment as you implement it.
//  • Do NOT rename any exported name — assertions depend on them.
//  • Run `npm run challenge:05` to check your work (all PASS = done).

// ── ASSERT HELPER (do not modify) ─────────────────────────
function assert(condition: boolean, message: string): void {
  if (!condition) { console.error(`  FAIL  ${message}`); process.exitCode = 1; }
  else            { console.log (`  PASS  ${message}`); }
}

// ══════════════════════════════════════════════════════════
// PART 1 — A tiny schema validator
// ══════════════════════════════════════════════════════════
// A schema maps field name → rule. Validate an input object against it.
//   required   — field must be present (not undefined)
//   type       — typeof must match "string" | "number" | "boolean"
//   min        — for strings: length; for numbers: value

export interface FieldRule {
  type: "string" | "number" | "boolean";
  required?: boolean;
  min?: number;
}
export type Schema = Record<string, FieldRule>;
export type ValidationResult =
  | { ok: true; value: Record<string, unknown> }
  | { ok: false; errors: string[] };

export function validate(schema: Schema, input: Record<string, unknown>): ValidationResult {
  // TODO: collect errors in order of the schema's keys.
  //   • missing & required          → `${key} is required`
  //   • present & wrong typeof       → `${key} must be a ${rule.type}`
  //   • min set & string too short   → `${key} must be at least ${min} characters`
  //   • min set & number too small   → `${key} must be >= ${min}`
  //   (skip type/min checks for a field that is absent and not required)
  // Return { ok:true, value: input } if no errors, else { ok:false, errors }.
  void schema; void input;
  return { ok: false, errors: ["not implemented"] }; // placeholder — replace
}

// ══════════════════════════════════════════════════════════
// PART 2 — Security headers
// ══════════════════════════════════════════════════════════
// Return the baseline hardening headers every response should carry.

export function securityHeaders(): Record<string, string> {
  // TODO: return exactly these four headers:
  //   "X-Content-Type-Options": "nosniff"
  //   "X-Frame-Options": "DENY"
  //   "Strict-Transport-Security": "max-age=31536000; includeSubDomains"
  //   "Referrer-Policy": "no-referrer"
  return {}; // placeholder — replace
}

// ══════════════════════════════════════════════════════════
// PART 3 — Upload gatekeeper
// ══════════════════════════════════════════════════════════

export interface UploadFile { sizeBytes: number; mime: string; }
export interface UploadRules { maxBytes: number; allowed: string[]; }
export type UploadCheck = { ok: true } | { ok: false; reason: "too_large" | "bad_type" };

export function checkUpload(file: UploadFile, rules: UploadRules): UploadCheck {
  // TODO: reject with "too_large" if sizeBytes > maxBytes,
  //       else "bad_type" if mime not in allowed, else { ok: true }.
  void file; void rules;
  return { ok: false, reason: "bad_type" }; // placeholder — replace
}

// ── ASSERTIONS (do not modify) ────────────────────────────
console.log("\n── C05 Production hardening assertions ──");

const schema: Schema = {
  name: { type: "string", required: true, min: 2 },
  age: { type: "number", min: 0 },
  admin: { type: "boolean" },
};

const good = validate(schema, { name: "Sadik", age: 30, admin: true });
assert(good.ok === true, "validate: valid input passes");

const missing = validate(schema, { age: 30 });
assert(missing.ok === false && missing.errors.includes("name is required"),
  "validate: missing required field is reported");

const wrongType = validate(schema, { name: 42 });
assert(wrongType.ok === false && wrongType.errors.includes("name must be a string"),
  "validate: wrong type is reported");

const tooShort = validate(schema, { name: "x" });
assert(tooShort.ok === false && tooShort.errors.includes("name must be at least 2 characters"),
  "validate: string shorter than min is reported");

const negative = validate(schema, { name: "ok", age: -5 });
assert(negative.ok === false && negative.errors.includes("age must be >= 0"),
  "validate: number below min is reported");

const optionalAbsent = validate(schema, { name: "ok" });
assert(optionalAbsent.ok === true, "validate: absent optional fields are fine");

const h = securityHeaders();
assert(h["X-Content-Type-Options"] === "nosniff", "headers: X-Content-Type-Options is nosniff");
assert(h["X-Frame-Options"] === "DENY",           "headers: X-Frame-Options is DENY");
assert(h["Strict-Transport-Security"] === "max-age=31536000; includeSubDomains",
  "headers: HSTS is set for one year with subdomains");
assert(h["Referrer-Policy"] === "no-referrer",    "headers: Referrer-Policy is no-referrer");

const rules: UploadRules = { maxBytes: 1_000_000, allowed: ["image/png", "image/jpeg"] };
assert(checkUpload({ sizeBytes: 500_000, mime: "image/png" }, rules).ok === true,
  "upload: valid file passes");
const big = checkUpload({ sizeBytes: 2_000_000, mime: "image/png" }, rules);
assert(big.ok === false && big.reason === "too_large", "upload: oversized file → too_large");
const bad = checkUpload({ sizeBytes: 10, mime: "application/x-msdownload" }, rules);
assert(bad.ok === false && bad.reason === "bad_type", "upload: disallowed mime → bad_type");

export {};
