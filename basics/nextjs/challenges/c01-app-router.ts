// ═══════════════════════════════════════════════════════════
// CHALLENGE C01: APP ROUTER — FILE-SYSTEM ROUTING  (Day 18)
// Run: npm run challenge:01  |  Time target: 25–35 min
// ═══════════════════════════════════════════════════════════
// PROJECT: Build the pure-logic KERNEL of Next.js's App Router —
//          the part that turns folders + a URL into a matched
//          route with params, and a nested-layout chain. No server,
//          no browser: just the routing algorithm, self-checked.
//
// RULES:
//  • Delete each // TODO comment as you implement it.
//  • Do NOT rename any exported name — assertions depend on them.
//  • You MAY add private helper functions.
//  • Run `npm run challenge:01` to check your work (all PASS = done).

// ── ASSERT HELPER (do not modify) ─────────────────────────
function assert(condition: boolean, message: string): void {
  if (!condition) { console.error(`  FAIL  ${message}`); process.exitCode = 1; }
  else            { console.log (`  PASS  ${message}`); }
}

// ══════════════════════════════════════════════════════════
// PART 1 — Route matching (static · [id] · [...slug])
// ══════════════════════════════════════════════════════════
// Match a concrete URL pathname against a route PATTERN drawn from
// the file system. Segments come in three flavours:
//   static      "blog"      — must equal the URL segment exactly
//   dynamic     "[slug]"    — captures exactly ONE segment
//   catch-all   "[...slug]" — captures the REST (one or more segments)
//
// Return the extracted params on a match, or null on a mismatch.
//   • dynamic  → params[name] is a string
//   • catch-all→ params[name] is a string[]

export interface RouteMatch {
  params: Record<string, string | string[]>;
}

export function matchRoute(pattern: string, pathname: string): RouteMatch | null {
  // TODO:
  //  1. Split both pattern and pathname on "/" and drop empty segments
  //     (so "/blog/[slug]" → ["blog", "[slug]"]).
  //  2. Walk the pattern segments in order:
  //       • "[...name]"  → consume ALL remaining URL segments into an
  //                        array; fail (return null) if none remain;
  //                        this must be the LAST pattern segment.
  //       • "[name]"     → consume ONE URL segment into params[name];
  //                        fail if there is no segment left.
  //       • static       → must deep-equal the URL segment, else null.
  //  3. After the loop, if URL segments remain unconsumed → null.
  //  4. Otherwise return { params }.
  void pattern; void pathname;
  return null; // placeholder — replace
}

// ══════════════════════════════════════════════════════════
// PART 2 — Nested layout chain
// ══════════════════════════════════════════════════════════
// In the App Router every folder segment may own a layout.tsx that
// wraps everything beneath it. For a given URL, produce the ordered
// list of segment paths from the ROOT layout down to the page's own
// segment — this is the order Next.js nests the layouts.
//
//   "/"                          → ["/"]
//   "/dashboard"                 → ["/", "/dashboard"]
//   "/dashboard/settings/profile"→ ["/", "/dashboard", "/dashboard/settings", "/dashboard/settings/profile"]

export function buildLayoutChain(pathname: string): string[] {
  // TODO:
  //  • Always start with the root "/".
  //  • For each URL segment, append the cumulative path so far.
  //  • Return the accumulated array (root first, page last).
  void pathname;
  return []; // placeholder — replace
}

// ══════════════════════════════════════════════════════════
// PART 3 — Route groups → URL path
// ══════════════════════════════════════════════════════════
// A folder wrapped in parentheses — "(marketing)" — is a ROUTE GROUP.
// It affects which layout applies but is STRIPPED from the URL.
// Given the raw folder segments, build the public URL path.
//
//   ["(marketing)", "pricing"]        → "/pricing"
//   ["dashboard", "(overview)", "x"]  → "/dashboard/x"
//   ["(a)", "(b)"]                    → "/"

export function toUrlPath(segments: string[]): string {
  // TODO:
  //  • Drop any segment that both starts with "(" and ends with ")".
  //  • Join the rest with "/" and prefix with "/".
  //  • If nothing remains, the path is just "/".
  void segments;
  return ""; // placeholder — replace
}

// ── ASSERTIONS (do not modify) ────────────────────────────
console.log("\n── C01 App Router assertions ──");

// matchRoute — static
assert(JSON.stringify(matchRoute("/about", "/about")?.params) === "{}",
  "matchRoute: static exact match → empty params");
assert(matchRoute("/about", "/contact") === null,
  "matchRoute: static mismatch → null");

// matchRoute — dynamic [id]
assert(matchRoute("/blog/[slug]", "/blog/hello")?.params.slug === "hello",
  "matchRoute: [slug] captures single segment");
assert(matchRoute("/blog/[slug]", "/blog") === null,
  "matchRoute: [slug] requires the segment to be present");
assert(matchRoute("/blog/[slug]", "/blog/a/b") === null,
  "matchRoute: [slug] does not swallow extra segments");
const two = matchRoute("/users/[id]/posts/[postId]", "/users/1/posts/9");
assert(two?.params.id === "1" && two?.params.postId === "9",
  "matchRoute: two dynamic segments captured independently");

// matchRoute — catch-all [...slug]
const ca = matchRoute("/docs/[...slug]", "/docs/a/b/c");
assert(JSON.stringify(ca?.params.slug) === JSON.stringify(["a", "b", "c"]),
  "matchRoute: [...slug] captures the rest as an array");
assert(matchRoute("/docs/[...slug]", "/docs") === null,
  "matchRoute: [...slug] requires at least one segment");

// buildLayoutChain
assert(JSON.stringify(buildLayoutChain("/")) === JSON.stringify(["/"]),
  "buildLayoutChain: root → ['/']");
assert(JSON.stringify(buildLayoutChain("/dashboard")) === JSON.stringify(["/", "/dashboard"]),
  "buildLayoutChain: one level nests root → segment");
assert(
  JSON.stringify(buildLayoutChain("/dashboard/settings/profile")) ===
  JSON.stringify(["/", "/dashboard", "/dashboard/settings", "/dashboard/settings/profile"]),
  "buildLayoutChain: deep nesting is cumulative, root first");

// toUrlPath
assert(toUrlPath(["(marketing)", "pricing"]) === "/pricing",
  "toUrlPath: strips a leading route group");
assert(toUrlPath(["dashboard", "(overview)", "x"]) === "/dashboard/x",
  "toUrlPath: strips a route group in the middle");
assert(toUrlPath(["(a)", "(b)"]) === "/",
  "toUrlPath: all-group path collapses to '/'");

export {};
