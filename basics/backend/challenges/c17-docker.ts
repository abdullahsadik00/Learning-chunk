// ═══════════════════════════════════════════════════════════
// CHALLENGE C17: DOCKER  (Day 52)
// Run: npm run challenge:17  |  Time target: 25–35 min
// ═══════════════════════════════════════════════════════════
// PROJECT: Model the two things that make Docker builds fast & small —
//          layer cache invalidation (which layers rebuild when files
//          change) and a .dockerignore matcher.
//
// RULES:
//  • Delete each // TODO comment as you implement it.
//  • Do NOT rename any exported name — assertions depend on them.
//  • Run `npm run challenge:17` to check your work (all PASS = done).

// ── ASSERT HELPER (do not modify) ─────────────────────────
function assert(condition: boolean, message: string): void {
  if (!condition) { console.error(`  FAIL  ${message}`); process.exitCode = 1; }
  else            { console.log (`  PASS  ${message}`); }
}

// ══════════════════════════════════════════════════════════
// PART 1 — Layer cache invalidation
// ══════════════════════════════════════════════════════════
// Layers build top-to-bottom. A layer's cache is busted if any file it
// depends on changed. Crucially, once a layer rebuilds, EVERY layer
// below it must rebuild too (the cache chain is broken). Return the
// names of the rebuilt layers, in order.

export interface Layer { name: string; files: string[]; }

export function invalidatedLayers(layers: Layer[], changed: string[]): string[] {
  // TODO: walk layers in order; once you hit a layer whose files
  //       intersect `changed`, that layer AND all following ones rebuild.
  void layers; void changed;
  return []; // placeholder — replace
}

// ══════════════════════════════════════════════════════════
// PART 2 — .dockerignore matcher
// ══════════════════════════════════════════════════════════
// A path is ignored if it matches ANY pattern:
//   • "*.ext"  → path ends with ".ext"
//   • "dir/"   → path equals "dir" OR starts with "dir/"
//   • anything else → exact match

export function isIgnored(path: string, patterns: string[]): boolean {
  // TODO: implement the three pattern kinds above
  void path; void patterns;
  return false; // placeholder — replace
}

// ── ASSERTIONS (do not modify) ────────────────────────────
console.log("\n── C17 Docker assertions ──");

const layers: Layer[] = [
  { name: "deps", files: ["package.json", "package-lock.json"] },
  { name: "build", files: ["src/index.ts"] },
  { name: "runtime", files: ["Dockerfile"] },
];

assert(JSON.stringify(invalidatedLayers(layers, ["src/index.ts"])) === JSON.stringify(["build", "runtime"]),
  "layers: a changed middle layer rebuilds itself and all below");
assert(JSON.stringify(invalidatedLayers(layers, ["package-lock.json"])) === JSON.stringify(["deps", "build", "runtime"]),
  "layers: earliest changed layer cascades to everything");
assert(JSON.stringify(invalidatedLayers(layers, ["README.md"])) === "[]",
  "layers: a file no layer depends on rebuilds nothing");

const patterns = ["node_modules/", "*.log", ".env"];
assert(isIgnored("node_modules/react/index.js", patterns) === true, "ignore: dir/ prefix match");
assert(isIgnored("node_modules", patterns) === true, "ignore: dir/ matches the bare dir");
assert(isIgnored("app.log", patterns) === true, "ignore: *.ext suffix match");
assert(isIgnored(".env", patterns) === true, "ignore: exact match");
assert(isIgnored("src/index.ts", patterns) === false, "ignore: unmatched path kept");

export {};
