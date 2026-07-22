// ═══════════════════════════════════════════════════════════
// CHALLENGE C03: SERVER ACTIONS & FORMS  (Day 20b)
// Run: npm run challenge:03  |  Time target: 25–35 min
// ═══════════════════════════════════════════════════════════
// PROJECT: Build the pure-logic KERNEL of a Next.js Server Action —
//          the part that runs on the server with no request object:
//          parse & validate FormData-like input (required / type /
//          coerce / min), model the returned action state, then wire
//          them together in a run-action pipeline. Self-checked.
//
// RULES:
//  • Delete each // TODO comment as you implement it.
//  • Do NOT rename any exported name — assertions depend on them.
//  • You MAY add private helper functions.
//  • Run `npm run challenge:03` to check your work (all PASS = done).

// ── ASSERT HELPER (do not modify) ─────────────────────────
function assert(condition: boolean, message: string): void {
  if (!condition) { console.error(`  FAIL  ${message}`); process.exitCode = 1; }
  else            { console.log (`  PASS  ${message}`); }
}

// ══════════════════════════════════════════════════════════
// PART 1 — FormData validator
// ══════════════════════════════════════════════════════════
// A Server Action receives FormData — here modelled as a plain
// Record of string | undefined (what formData.get() returns). Parse
// it against a schema: enforce required, coerce to the declared type,
// and check `min` (min LENGTH for strings, min VALUE for numbers).

export type FieldType = "string" | "number" | "boolean";

export interface FieldSpec {
  type: FieldType;
  required?: boolean;
  min?: number; // string → min length ; number → min value
}

export type Schema = Record<string, FieldSpec>;

export type ParseResult =
  | { success: true;  data: Record<string, string | number | boolean> }
  | { success: false; errors: Record<string, string[]> };

export function parseFormData(schema: Schema, raw: Record<string, string | undefined>): ParseResult {
  // TODO: for each field name in the schema:
  //  • Read raw[name]. If required and it is undefined or "" (after
  //    trim for strings) → push an error "<name> is required".
  //  • Coerce by type:
  //      string  → the trimmed string.
  //      number  → Number(value); if NaN → error "<name> must be a number".
  //      boolean → true when value is "true" | "on" | "1", else false.
  //  • Apply `min`:
  //      string  → error if trimmed length < min.
  //      number  → error if value < min.
  //  • If any errors were collected → { success:false, errors }.
  //    Otherwise → { success:true, data } with coerced values.
  void schema; void raw;
  return { success: false, errors: {} }; // placeholder — replace
}

// ══════════════════════════════════════════════════════════
// PART 2 — Action state (discriminated union)
// ══════════════════════════════════════════════════════════
// A Server Action returns one of a few shapes that the client form
// switches on. Build the constructors for each variant.

export type ActionState<T> =
  | { status: "success";  data: T }
  | { status: "error";    errors: Record<string, string[]> }
  | { status: "redirect"; to: string };

export function ok<T>(data: T): ActionState<T> {
  // TODO: return the success variant.
  void data;
  return { status: "error", errors: {} }; // placeholder — replace
}

export function fail<T>(errors: Record<string, string[]>): ActionState<T> {
  // TODO: return the error variant.
  void errors;
  return { status: "error", errors: {} };
}

export function redirectTo<T>(to: string): ActionState<T> {
  // TODO: return the redirect variant.
  void to;
  return { status: "error", errors: {} }; // placeholder — replace
}

// ══════════════════════════════════════════════════════════
// PART 3 — runAction pipeline
// ══════════════════════════════════════════════════════════
// Tie it together: validate the input; on failure return an error
// state; on success hand the typed data to `onValid` and return
// whatever action state it produces (e.g. redirectTo / ok).

export function runAction<T>(
  schema: Schema,
  raw: Record<string, string | undefined>,
  onValid: (data: Record<string, string | number | boolean>) => ActionState<T>,
): ActionState<T> {
  // TODO:
  //  • Call parseFormData(schema, raw).
  //  • If it failed → return fail(result.errors).
  //  • If it succeeded → return onValid(result.data).
  void schema; void raw; void onValid;
  return { status: "error", errors: {} }; // placeholder — replace
}

// ── ASSERTIONS (do not modify) ────────────────────────────
console.log("\n── C03 Server Actions assertions ──");

const schema: Schema = {
  title: { type: "string",  required: true, min: 3 },
  count: { type: "number" },
  agree: { type: "boolean" },
};

// PART 1 — parseFormData: valid
const good = parseFormData(schema, { title: "Hello", count: "5", agree: "on" });
assert(good.success === true, "parseFormData: valid input succeeds");
assert(good.success && good.data.title === "Hello", "parseFormData: keeps trimmed string");
assert(good.success && good.data.count === 5, "parseFormData: coerces '5' → number 5");
assert(good.success && typeof good.data.count === "number", "parseFormData: count is a number type");
assert(good.success && good.data.agree === true, "parseFormData: coerces 'on' → boolean true");

// PART 1 — parseFormData: invalid
const missing = parseFormData(schema, { count: "5" });
assert(missing.success === false, "parseFormData: missing required title fails");
assert(!missing.success && !!missing.errors.title, "parseFormData: reports the title error");

const badNum = parseFormData(schema, { title: "Hello", count: "abc" });
assert(!badNum.success && !!badNum.errors.count, "parseFormData: non-numeric count fails");

const short = parseFormData(schema, { title: "ab" });
assert(!short.success && !!short.errors.title, "parseFormData: title below min length fails");

const falsey = parseFormData(schema, { title: "Hello", agree: "false" });
assert(falsey.success && falsey.data.agree === false, "parseFormData: 'false' → boolean false");

// PART 2 — action state constructors
assert(ok({ id: 1 }).status === "success", "ok: builds success variant");
const okS = ok({ id: 7 });
assert(okS.status === "success" && okS.data.id === 7, "ok: carries the data payload");
assert(fail({ x: ["bad"] }).status === "error", "fail: builds error variant");
const rd = redirectTo("/posts");
assert(rd.status === "redirect" && rd.to === "/posts", "redirectTo: builds redirect variant with target");

// PART 3 — runAction
const invalidRun = runAction(schema, { count: "5" }, () => ok({ id: 1 }));
assert(invalidRun.status === "error", "runAction: invalid input short-circuits to error");
const validRun = runAction(schema, { title: "Hello", count: "1" }, () => redirectTo("/posts"));
assert(validRun.status === "redirect" && (validRun as { to: string }).to === "/posts",
  "runAction: valid input runs onValid (redirect)");

export {};
