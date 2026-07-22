// ═══════════════════════════════════════════════════════════
// CHALLENGE C03: RESPONSIVE SIZING MATH  (Day 27)
// Run: npm run challenge:03  |  Time target: 25–35 min
// ═══════════════════════════════════════════════════════════
// PROJECT: Implement the math behind a responsive layer:
//            1. breakpoint resolver (which named breakpoint is active
//               at a given viewport width — mobile-first / min-width)
//            2. clamp(min, preferred, max) evaluator
//            3. fluid-type calculator (linear interpolation between a
//               min and max size across a viewport range — the maths
//               a `clamp(min, Xvw, max)` fluid font-size compiles to)
//
// RULES:
//  • Delete each // TODO comment as you implement it.
//  • Do NOT rename any exported name — assertions depend on them.
//  • You MAY add private helper functions.
//  • Floating-point results are checked with a tolerance helper.
//  • Run `npm run challenge:03` to check your work (all PASS = done).

// ── ASSERT HELPERS (do not modify) ────────────────────────
function assert(condition: boolean, message: string): void {
  if (!condition) { console.error(`  FAIL  ${message}`); process.exitCode = 1; }
  else            { console.log (`  PASS  ${message}`); }
}
function approx(a: number | undefined, b: number, tol = 1e-6): boolean {
  return a !== undefined && Math.abs(a - b) < tol;
}

// ══════════════════════════════════════════════════════════
// PART 1 — Breakpoint resolver (mobile-first / min-width)
// ══════════════════════════════════════════════════════════
// A breakpoint map is { name: minWidthPx }. Mobile-first means a
// breakpoint is "active" once the viewport is at least its minWidth.
// Return the name of the LARGEST minWidth that is <= viewport.
// If the viewport is below every breakpoint, return "base".
//
//   e.g. { sm:640, md:768, lg:1024, xl:1280 }
//        viewport 800 → "md"   (768 <= 800 < 1024)
//        viewport 500 → "base" (below sm)

export function resolveBreakpoint(
  viewport: number,
  breakpoints: Record<string, number>,
): string {
  // TODO: consider only breakpoints whose minWidth <= viewport,
  //       and return the name with the greatest such minWidth.
  //       If none qualify, return "base".
  void viewport; void breakpoints;
  return ""; // placeholder — replace
}

// ══════════════════════════════════════════════════════════
// PART 2 — clamp() evaluator
// ══════════════════════════════════════════════════════════
// CSS clamp(min, preferred, max) returns the preferred value bounded
// to the [min, max] range. Equivalent to max(min, min(preferred, max)).
// Assume min <= max.

export function evalClamp(min: number, preferred: number, max: number): number {
  // TODO: clamp `preferred` into [min, max].
  void min; void preferred; void max;
  return 0; // placeholder — replace
}

// ══════════════════════════════════════════════════════════
// PART 3 — Fluid-type calculator
// ══════════════════════════════════════════════════════════
// A fluid size grows LINEARLY from minSize (at minVw) to maxSize
// (at maxVw), and is clamped flat outside that viewport range.
//
//   slope = (maxSize - minSize) / (maxVw - minVw)
//   raw   = minSize + slope * (viewport - minVw)
//   result = clamp raw into [minSize, maxSize]
//
// (This is exactly what a well-formed fluid `clamp()` font-size does.)

export function fluidType(
  minSize: number,
  maxSize: number,
  minVw: number,
  maxVw: number,
  viewport: number,
): number {
  // TODO: compute the slope, the raw interpolated value, then clamp
  //       it into [minSize, maxSize]. You MAY reuse evalClamp.
  void minSize; void maxSize; void minVw; void maxVw; void viewport;
  return 0; // placeholder — replace
}

// ── ASSERTIONS (do not modify) ────────────────────────────
console.log("\n── C03 responsive sizing math assertions ──");

const bp = { sm: 640, md: 768, lg: 1024, xl: 1280 };
assert(resolveBreakpoint(800, bp) === "md",   "resolveBreakpoint: 800 → md");
assert(resolveBreakpoint(640, bp) === "sm",   "resolveBreakpoint: exactly 640 → sm");
assert(resolveBreakpoint(500, bp) === "base", "resolveBreakpoint: below sm → base");
assert(resolveBreakpoint(2000, bp) === "xl",  "resolveBreakpoint: above all → xl");

assert(approx(evalClamp(16, 20, 32), 20), "evalClamp: preferred inside range passes through");
assert(approx(evalClamp(16, 10, 32), 16), "evalClamp: below min clamps to min");
assert(approx(evalClamp(16, 99, 32), 32), "evalClamp: above max clamps to max");

// fluid: 16px @320vw → 24px @1280vw. slope = 8/960.
// at 800vw: 16 + (8/960)*(800-320) = 16 + (8/960)*480 = 16 + 4 = 20
assert(approx(fluidType(16, 24, 320, 1280, 800), 20), "fluidType: midpoint interpolates to 20");
assert(approx(fluidType(16, 24, 320, 1280, 320), 16), "fluidType: at minVw → minSize");
assert(approx(fluidType(16, 24, 320, 1280, 1280), 24), "fluidType: at maxVw → maxSize");
assert(approx(fluidType(16, 24, 320, 1280, 100), 16), "fluidType: below range clamps to minSize");
assert(approx(fluidType(16, 24, 320, 1280, 5000), 24), "fluidType: above range clamps to maxSize");

export {};
