// ═══════════════════════════════════════════════════════════
// CHALLENGE C05: DESIGN TOKENS & ACCESSIBILITY MATH  (Day 30)
// Run: npm run challenge:05  |  Time target: 30–40 min
// ═══════════════════════════════════════════════════════════
// PROJECT: Implement the computable core of a design system:
//            1. design-token resolver — follow "{alias.path}"
//               references to their concrete value (with cycle guard)
//            2. WCAG contrast-ratio calculator + AA/AAA pass check
//            3. modular type-scale generator (ratio^step)
//
// RULES:
//  • Delete each // TODO comment as you implement it.
//  • Do NOT rename any exported name — assertions depend on them.
//  • You MAY add private helper functions.
//  • Floating-point results are checked with a tolerance helper.
//  • Run `npm run challenge:05` to check your work (all PASS = done).

// ── ASSERT HELPERS (do not modify) ────────────────────────
function assert(condition: boolean, message: string): void {
  if (!condition) { console.error(`  FAIL  ${message}`); process.exitCode = 1; }
  else            { console.log (`  PASS  ${message}`); }
}
function approx(a: number | undefined, b: number, tol = 1e-6): boolean {
  return a !== undefined && Math.abs(a - b) < tol;
}

// ══════════════════════════════════════════════════════════
// PART 1 — Design-token alias resolver
// ══════════════════════════════════════════════════════════
// Tokens are a flat map of dot-path → value. A value that is exactly
// "{some.other.path}" is an ALIAS pointing at another token. Resolve
// a key to its final concrete (non-alias) value by following the
// chain. If a path is missing, return undefined. If a reference cycle
// is detected, return undefined (do not loop forever).
//
//   {
//     "color.brand.500": "#3b82f6",
//     "color.primary":   "{color.brand.500}",
//     "button.bg":       "{color.primary}",
//   }
//   resolveToken(tokens, "button.bg") → "#3b82f6"

export type TokenMap = Record<string, string>;

export function resolveToken(tokens: TokenMap, key: string): string | undefined {
  // TODO: look up `key`. While the value matches the alias form
  //       "{path}", jump to that path. Track visited keys to break
  //       cycles. Return undefined for missing keys or cycles.
  void tokens; void key;
  return undefined; // placeholder — replace
}

// ══════════════════════════════════════════════════════════
// PART 2 — WCAG contrast ratio + level
// ══════════════════════════════════════════════════════════
// contrastRatio(hexA, hexB) implements WCAG 2.1 relative luminance:
//   1. parse "#rrggbb" → r,g,b in 0..255, then normalise to 0..1
//   2. linearise each channel c:
//        c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
//   3. L = 0.2126*R + 0.7152*G + 0.0722*B
//   4. ratio = (Llighter + 0.05) / (Ldarker + 0.05)
// Result is in [1, 21]. Order of arguments must not matter.

export function contrastRatio(hexA: string, hexB: string): number {
  // TODO: parse both colours, compute relative luminance for each,
  //       then the (lighter+0.05)/(darker+0.05) ratio.
  void hexA; void hexB;
  return 0; // placeholder — replace
}

// wcagLevel: given a contrast ratio and whether the text is "large"
// (>= 18pt / 14pt bold), return the highest level it satisfies.
//   Normal text: AA >= 4.5, AAA >= 7
//   Large text:  AA >= 3,   AAA >= 4.5
// Return "AAA", "AA", or "fail".

export type WcagLevel = "AAA" | "AA" | "fail";

export function wcagLevel(ratio: number, largeText = false): WcagLevel {
  // TODO: pick the thresholds by text size, then classify the ratio.
  void ratio; void largeText;
  return "fail"; // placeholder — replace
}

// ══════════════════════════════════════════════════════════
// PART 3 — Modular type scale
// ══════════════════════════════════════════════════════════
// A modular scale multiplies a base size by a ratio raised to the
// step. step 0 → base; positive steps go up, negative go down.
//   typeScale(16, 1.25, step) = 16 * 1.25 ** step
// Return the size (px) for the given step.

export function typeScale(base: number, ratio: number, step: number): number {
  // TODO: return base * ratio ** step.
  void base; void ratio; void step;
  return 0; // placeholder — replace
}

// ── ASSERTIONS (do not modify) ────────────────────────────
console.log("\n── C05 design tokens & accessibility assertions ──");

const tokens: TokenMap = {
  "color.brand.500": "#3b82f6",
  "color.primary": "{color.brand.500}",
  "button.bg": "{color.primary}",
  "cycle.a": "{cycle.b}",
  "cycle.b": "{cycle.a}",
};
assert(resolveToken(tokens, "color.brand.500") === "#3b82f6", "resolveToken: concrete value returns itself");
assert(resolveToken(tokens, "color.primary") === "#3b82f6", "resolveToken: one hop alias resolves");
assert(resolveToken(tokens, "button.bg") === "#3b82f6", "resolveToken: multi-hop alias chain resolves");
assert(resolveToken(tokens, "missing.key") === undefined, "resolveToken: missing key → undefined");
assert(resolveToken(tokens, "cycle.a") === undefined, "resolveToken: cyclic reference → undefined (no hang)");

assert(approx(contrastRatio("#000000", "#ffffff"), 21), "contrastRatio: black vs white = 21:1");
assert(approx(contrastRatio("#ffffff", "#000000"), 21), "contrastRatio: argument order does not matter");
assert(approx(contrastRatio("#ffffff", "#ffffff"), 1), "contrastRatio: identical colours = 1:1");

assert(wcagLevel(7.5) === "AAA", "wcagLevel: 7.5 normal → AAA");
assert(wcagLevel(4.5) === "AA", "wcagLevel: exactly 4.5 normal → AA");
assert(wcagLevel(3.9) === "fail", "wcagLevel: 3.9 normal → fail");
assert(wcagLevel(3.0, true) === "AA", "wcagLevel: 3.0 large text → AA");
assert(wcagLevel(4.5, true) === "AAA", "wcagLevel: 4.5 large text → AAA");

assert(approx(typeScale(16, 1.25, 0), 16), "typeScale: step 0 → base");
assert(approx(typeScale(16, 1.25, 1), 20), "typeScale: step 1 at 1.25 → 20");
assert(approx(typeScale(16, 1.25, 2), 25), "typeScale: step 2 at 1.25 → 25");
assert(approx(typeScale(16, 1.25, -1), 12.8), "typeScale: step -1 → 12.8");

export {};
