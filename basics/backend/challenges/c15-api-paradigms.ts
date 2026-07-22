// ═══════════════════════════════════════════════════════════
// CHALLENGE C15: API PARADIGMS · VERSIONING  (Day 50)
// Run: npm run challenge:15  |  Time target: 25–35 min
// ═══════════════════════════════════════════════════════════
// PROJECT: Implement the request-routing logic behind API strategy —
//          resolving the API version from a request, parsing OpenAPI
//          path params, and scoring REST vs GraphQL vs tRPC for a use
//          case.
//
// RULES:
//  • Delete each // TODO comment as you implement it.
//  • Do NOT rename any exported name — assertions depend on them.
//  • Run `npm run challenge:15` to check your work (all PASS = done).

// ── ASSERT HELPER (do not modify) ─────────────────────────
function assert(condition: boolean, message: string): void {
  if (!condition) { console.error(`  FAIL  ${message}`); process.exitCode = 1; }
  else            { console.log (`  PASS  ${message}`); }
}

// ══════════════════════════════════════════════════════════
// PART 1 — Version resolver
// ══════════════════════════════════════════════════════════
// Resolve the API version, in PRIORITY order:
//   1. a path prefix "/v{N}/..."           (highest priority)
//   2. an "Accept-Version" header value
//   3. otherwise the default version
// Return the numeric version.

export interface VersionReq {
  path: string;
  headers: Record<string, string>;
  defaultVersion: number;
}

export function resolveVersion(req: VersionReq): number {
  // TODO: check path for /v(\d+)/ first; else headers["Accept-Version"]
  //       (parse to number); else defaultVersion.
  void req;
  return 0; // placeholder — replace
}

// ══════════════════════════════════════════════════════════
// PART 2 — OpenAPI path param parser
// ══════════════════════════════════════════════════════════
// Match a concrete path against a template like "/users/{id}/posts/{postId}"
// and return the extracted params, or null if it doesn't match.

export function matchPath(template: string, path: string): Record<string, string> | null {
  // TODO: split both on "/"; if segment counts differ → null. For each
  //       template segment: if "{name}", capture; else it must equal the
  //       path segment or return null. Return the captured params.
  void template; void path;
  return null; // placeholder — replace
}

// ══════════════════════════════════════════════════════════
// PART 3 — Paradigm scorer
// ══════════════════════════════════════════════════════════
// Pick the best API paradigm for the requirements:
//   • needsFlexibleQueries true              → "graphql"
//   • else fullTypeSafety true & tsClient     → "trpc"
//   • else                                    → "rest"

export interface ApiNeeds { needsFlexibleQueries: boolean; fullTypeSafety: boolean; tsClient: boolean; }

export function pickParadigm(n: ApiNeeds): "rest" | "graphql" | "trpc" {
  // TODO: implement the decision above
  void n;
  return "rest"; // placeholder — replace
}

// ── ASSERTIONS (do not modify) ────────────────────────────
console.log("\n── C15 API paradigms · versioning assertions ──");

assert(resolveVersion({ path: "/v2/users", headers: { "Accept-Version": "3" }, defaultVersion: 1 }) === 2,
  "version: path prefix wins over header");
assert(resolveVersion({ path: "/users", headers: { "Accept-Version": "3" }, defaultVersion: 1 }) === 3,
  "version: header used when no path prefix");
assert(resolveVersion({ path: "/users", headers: {}, defaultVersion: 1 }) === 1,
  "version: falls back to default");

const params = matchPath("/users/{id}/posts/{postId}", "/users/42/posts/7");
assert(params !== null && params.id === "42" && params.postId === "7",
  "matchPath: extracts multiple params");
assert(matchPath("/users/{id}", "/users/42/extra") === null,
  "matchPath: mismatched segment count → null");
assert(matchPath("/health", "/status") === null,
  "matchPath: differing literal segment → null");

assert(pickParadigm({ needsFlexibleQueries: true, fullTypeSafety: true, tsClient: true }) === "graphql",
  "paradigm: flexible queries → graphql");
assert(pickParadigm({ needsFlexibleQueries: false, fullTypeSafety: true, tsClient: true }) === "trpc",
  "paradigm: type-safe TS-only → trpc");
assert(pickParadigm({ needsFlexibleQueries: false, fullTypeSafety: false, tsClient: false }) === "rest",
  "paradigm: default → rest");

export {};
