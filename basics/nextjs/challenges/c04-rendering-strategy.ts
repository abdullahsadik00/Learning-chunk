// ═══════════════════════════════════════════════════════════
// CHALLENGE C04: RENDERING STRATEGY  (Day 21)
// Run: npm run challenge:04  |  Time target: 25–35 min
// ═══════════════════════════════════════════════════════════
// PROJECT: Build the pure-logic KERNEL of Next.js's rendering
//          decision — pick SSG / ISR / SSR / CSR from a page's
//          constraints, then derive the matching Cache-Control
//          header and route-segment config. No framework: the
//          decision table self-checks.
//
// RULES:
//  • Delete each // TODO comment as you implement it.
//  • Do NOT rename any exported name — assertions depend on them.
//  • You MAY add private helper functions.
//  • Run `npm run challenge:04` to check your work (all PASS = done).

// ── ASSERT HELPER (do not modify) ─────────────────────────
function assert(condition: boolean, message: string): void {
  if (!condition) { console.error(`  FAIL  ${message}`); process.exitCode = 1; }
  else            { console.log (`  PASS  ${message}`); }
}

// ══════════════════════════════════════════════════════════
// PART 1 — Strategy chooser
// ══════════════════════════════════════════════════════════
// Choose ONE rendering strategy from the page's constraints.

export type Strategy = "SSG" | "ISR" | "SSR" | "CSR";

export interface RenderConstraints {
  clientOnly: boolean;              // needs browser APIs / behind-auth interactivity, no SEO
  needsRequestData: boolean;       // reads cookies / headers / searchParams per request
  personalized: boolean;           // content differs per user
  revalidateSeconds: number | null;// null = never revalidate
}

export function chooseStrategy(c: RenderConstraints): Strategy {
  // TODO: apply the decision order (first match wins):
  //  1. clientOnly                         → "CSR"
  //  2. needsRequestData OR personalized   → "SSR"
  //  3. revalidateSeconds is a number > 0  → "ISR"
  //  4. otherwise                          → "SSG"
  void c;
  return "SSG"; // placeholder — replace
}

// ══════════════════════════════════════════════════════════
// PART 2 — Cache-Control header builder
// ══════════════════════════════════════════════════════════
// Each strategy maps to a conventional Cache-Control policy.

export function cacheControlFor(strategy: Strategy, revalidateSeconds = 60): string {
  // TODO: return the header string per strategy:
  //  SSG → "public, max-age=31536000, immutable"
  //  ISR → `public, s-maxage=${revalidateSeconds}, stale-while-revalidate`
  //  SSR → "private, no-cache, no-store, must-revalidate"
  //  CSR → "public, max-age=0, must-revalidate"
  void strategy; void revalidateSeconds;
  return ""; // placeholder — replace
}

// ══════════════════════════════════════════════════════════
// PART 3 — Route segment config
// ══════════════════════════════════════════════════════════
// Next.js controls rendering via exported route-segment constants.
// Build the config object each strategy would export.

export interface SegmentConfig {
  dynamic?: "force-static" | "force-dynamic" | "auto";
  revalidate?: number | false;
}

export function segmentConfig(strategy: Strategy, revalidateSeconds = 60): SegmentConfig {
  // TODO: return the segment config per strategy:
  //  SSG → { dynamic: "force-static", revalidate: false }
  //  ISR → { revalidate: revalidateSeconds }
  //  SSR → { dynamic: "force-dynamic" }
  //  CSR → { dynamic: "force-static" }   (static shell, hydrated on the client)
  void strategy; void revalidateSeconds;
  return {}; // placeholder — replace
}

// ── ASSERTIONS (do not modify) ────────────────────────────
console.log("\n── C04 Rendering strategy assertions ──");

const base: RenderConstraints = {
  clientOnly: false, needsRequestData: false, personalized: false, revalidateSeconds: null,
};

// PART 1 — chooseStrategy
assert(chooseStrategy({ ...base }) === "SSG",
  "chooseStrategy: no constraints → SSG");
assert(chooseStrategy({ ...base, revalidateSeconds: 60 }) === "ISR",
  "chooseStrategy: revalidate window → ISR");
assert(chooseStrategy({ ...base, needsRequestData: true }) === "SSR",
  "chooseStrategy: reads request data → SSR");
assert(chooseStrategy({ ...base, personalized: true }) === "SSR",
  "chooseStrategy: personalized → SSR");
assert(chooseStrategy({ ...base, clientOnly: true }) === "CSR",
  "chooseStrategy: client-only → CSR");
assert(chooseStrategy({ ...base, clientOnly: true, personalized: true }) === "CSR",
  "chooseStrategy: clientOnly wins over personalized");
assert(chooseStrategy({ ...base, personalized: true, revalidateSeconds: 60 }) === "SSR",
  "chooseStrategy: SSR wins over ISR when personalized");
assert(chooseStrategy({ ...base, revalidateSeconds: 0 }) === "SSG",
  "chooseStrategy: revalidate 0 is not ISR → SSG");

// PART 2 — cacheControlFor
assert(cacheControlFor("SSG").includes("immutable"),
  "cacheControlFor: SSG is immutable");
assert(cacheControlFor("ISR", 120).includes("s-maxage=120") &&
       cacheControlFor("ISR", 120).includes("stale-while-revalidate"),
  "cacheControlFor: ISR uses s-maxage + stale-while-revalidate");
assert(cacheControlFor("SSR").includes("no-store"),
  "cacheControlFor: SSR is no-store");
assert(cacheControlFor("CSR").includes("max-age=0"),
  "cacheControlFor: CSR is max-age=0");

// PART 3 — segmentConfig
assert(segmentConfig("SSG").dynamic === "force-static" && segmentConfig("SSG").revalidate === false,
  "segmentConfig: SSG forces static, no revalidate");
assert(segmentConfig("ISR", 300).revalidate === 300,
  "segmentConfig: ISR carries the revalidate window");
assert(segmentConfig("SSR").dynamic === "force-dynamic",
  "segmentConfig: SSR forces dynamic");
assert(segmentConfig("CSR").dynamic === "force-static",
  "segmentConfig: CSR ships a static shell");

export {};
