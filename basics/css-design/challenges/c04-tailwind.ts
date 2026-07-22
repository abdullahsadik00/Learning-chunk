// ═══════════════════════════════════════════════════════════
// CHALLENGE C04: UTILITY-CLASS ENGINE  (Day 29 — Tailwind)
// Run: npm run challenge:04  |  Time target: 25–35 min
// ═══════════════════════════════════════════════════════════
// PROJECT: Implement the logic kernels behind a utility-first CSS
//          framework (Tailwind-style):
//            1. spacing-scale generator (4px base grid → rem)
//            2. class-name merge/dedupe where LATER conflicting
//               utilities win (a mini `tailwind-merge`)
//            3. variant-prefix parser ("hover:md:px-4")
//
// RULES:
//  • Delete each // TODO comment as you implement it.
//  • Do NOT rename any exported name — assertions depend on them.
//  • You MAY add private helper functions.
//  • Floating-point results are checked with a tolerance helper.
//  • Run `npm run challenge:04` to check your work (all PASS = done).

// ── ASSERT HELPERS (do not modify) ────────────────────────
function assert(condition: boolean, message: string): void {
  if (!condition) { console.error(`  FAIL  ${message}`); process.exitCode = 1; }
  else            { console.log (`  PASS  ${message}`); }
}
function approx(a: number | undefined, b: number, tol = 1e-9): boolean {
  return a !== undefined && Math.abs(a - b) < tol;
}

// ══════════════════════════════════════════════════════════
// PART 1 — Spacing-scale generator
// ══════════════════════════════════════════════════════════
// Tailwind's spacing scale: one step = 4px, expressed in rem where
// 1rem = 16px. So step `n` → n * 4 / 16 rem = n * 0.25 rem.
// Return the rem value (a number) for a given step.
//   step 0 → 0, step 1 → 0.25, step 4 → 1, step 8 → 2
// Fractional steps are allowed (e.g. 0.5 → 0.125).

export function spacingRem(step: number): number {
  // TODO: convert a 4px-based step to rem (÷16).
  void step;
  return 0; // placeholder — replace
}

// ══════════════════════════════════════════════════════════
// PART 2 — Class merge / dedupe (later wins)
// ══════════════════════════════════════════════════════════
// Given a list of class strings (each may contain multiple
// space-separated classes), produce a single space-joined string
// where conflicting utilities collapse to the LAST one, preserving
// the position of each surviving class.
//
// Two classes CONFLICT when they share the same "group key", defined
// as the substring BEFORE the last hyphen (or the whole class if it
// has no hyphen). Examples:
//   "px-2" / "px-4"        → key "px"        (conflict → px-4 wins)
//   "bg-red-500"/"bg-red-700" → key "bg-red" (conflict → 700 wins)
//   "px-4" / "py-2"        → keys "px","py"  (no conflict, both kept)
//
// Ordering rule (matches tailwind-merge): each surviving class stays
// at the position of its LAST occurrence.
//   merge("px-2 py-1", "px-4")  → "py-1 px-4"
//
// Empty / whitespace-only inputs contribute nothing.

export function mergeClasses(...classLists: string[]): string {
  // TODO: flatten into individual tokens (split on whitespace, drop
  //       empties), compute each token's group key, keep only the
  //       LAST token per key, and join survivors in their original
  //       order with single spaces.
  void classLists;
  return ""; // placeholder — replace
}

// ══════════════════════════════════════════════════════════
// PART 3 — Variant-prefix parser
// ══════════════════════════════════════════════════════════
// A prefixed utility is "variant:variant:...:utility". Split on ":".
// The final segment is the base utility; everything before it is the
// ordered list of variants.
//   "hover:md:px-4" → { variants: ["hover","md"], utility: "px-4" }
//   "px-4"          → { variants: [], utility: "px-4" }

export interface ParsedUtility {
  variants: string[];
  utility: string;
}

export function parseVariant(className: string): ParsedUtility {
  // TODO: split on ":"; last part is the utility, the rest are
  //       variants in order.
  void className;
  return { variants: [], utility: "" }; // placeholder — replace
}

// ── ASSERTIONS (do not modify) ────────────────────────────
console.log("\n── C04 utility-class engine assertions ──");

assert(approx(spacingRem(0), 0),    "spacingRem: 0 → 0rem");
assert(approx(spacingRem(1), 0.25), "spacingRem: 1 → 0.25rem (4px)");
assert(approx(spacingRem(4), 1),    "spacingRem: 4 → 1rem (16px)");
assert(approx(spacingRem(8), 2),    "spacingRem: 8 → 2rem (32px)");
assert(approx(spacingRem(0.5), 0.125), "spacingRem: 0.5 → 0.125rem (2px)");

assert(mergeClasses("px-2", "px-4") === "px-4",
  "mergeClasses: later px wins");
assert(mergeClasses("px-2 py-1", "px-4") === "py-1 px-4",
  "mergeClasses: survivor keeps last position");
assert(mergeClasses("bg-red-500", "bg-red-700") === "bg-red-700",
  "mergeClasses: same color family, later shade wins");
assert(mergeClasses("px-4", "py-2") === "px-4 py-2",
  "mergeClasses: non-conflicting classes both kept");
assert(mergeClasses("  flex   px-2 ", "px-6") === "flex px-6",
  "mergeClasses: whitespace collapsed, conflict resolved");
assert(mergeClasses("bg-red-500", "text-lg") === "bg-red-500 text-lg",
  "mergeClasses: different groups untouched");

const p = parseVariant("hover:md:px-4");
assert(p.utility === "px-4", "parseVariant: utility is the last segment");
assert(p.variants.length === 2 && p.variants[0] === "hover" && p.variants[1] === "md",
  "parseVariant: variants in order [hover, md]");
const plain = parseVariant("px-4");
assert(plain.variants.length === 0 && plain.utility === "px-4",
  "parseVariant: no prefix → empty variants");

export {};
