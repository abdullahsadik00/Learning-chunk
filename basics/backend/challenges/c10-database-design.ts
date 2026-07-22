// ═══════════════════════════════════════════════════════════
// CHALLENGE C10: DATABASE DESIGN  (Day 45)
// Run: npm run challenge:10  |  Time target: 25–35 min
// ═══════════════════════════════════════════════════════════
// PROJECT: Encode two database-design judgments as code — detecting a
//          multi-valued (repeating-group) column that violates 1NF,
//          and recommending which columns to index given a query's
//          filter/sort shape.
//
// RULES:
//  • Delete each // TODO comment as you implement it.
//  • Do NOT rename any exported name — assertions depend on them.
//  • Run `npm run challenge:10` to check your work (all PASS = done).

// ── ASSERT HELPER (do not modify) ─────────────────────────
function assert(condition: boolean, message: string): void {
  if (!condition) { console.error(`  FAIL  ${message}`); process.exitCode = 1; }
  else            { console.log (`  PASS  ${message}`); }
}

// ══════════════════════════════════════════════════════════
// PART 1 — 1NF violation detector
// ══════════════════════════════════════════════════════════
// A column violates first normal form if ANY row stores multiple
// values in it — modeled here as either an array, or a string that
// contains a comma (e.g. "a,b,c"). Return the offending column names,
// in column order, deduped.

export function findRepeatingGroups(rows: Array<Record<string, unknown>>): string[] {
  // TODO: for each column across all rows, flag it if any cell is an
  //       array OR a string containing ",". Return flagged columns once each.
  void rows;
  return []; // placeholder — replace
}

// ══════════════════════════════════════════════════════════
// PART 2 — Index recommender
// ══════════════════════════════════════════════════════════
// Given a query's equality filters and its sort column, recommend
// indexes:
//   • one single-column index per equality-filtered column
//   • if there is a sort column, a composite index of
//     [...equalityColumns, sortColumn]  (equality first, then sort)
// Return index specs as arrays of column names, most-selective-first
// ordering not required — just: singles first (in filter order),
// then the composite (if a sort column exists).

export interface QueryShape { equals: string[]; orderBy?: string; }

export function recommendIndexes(q: QueryShape): string[][] {
  // TODO: build the singles, then append the composite when orderBy is set.
  void q;
  return []; // placeholder — replace
}

// ── ASSERTIONS (do not modify) ────────────────────────────
console.log("\n── C10 Database design assertions ──");

const rows = [
  { id: 1, name: "Alice", tags: ["a", "b"], roles: "admin" },
  { id: 2, name: "Bob", tags: [], roles: "user,editor" },
];
const bad = findRepeatingGroups(rows);
assert(bad.includes("tags"),  "1NF: array column is flagged");
assert(bad.includes("roles"), "1NF: comma-string column is flagged");
assert(!bad.includes("name") && !bad.includes("id"), "1NF: scalar columns are not flagged");
assert(bad.length === new Set(bad).size, "1NF: results are deduped");

const idx1 = recommendIndexes({ equals: ["status"] });
assert(JSON.stringify(idx1) === JSON.stringify([["status"]]),
  "index: single equality filter → one single-column index");

const idx2 = recommendIndexes({ equals: ["status", "orgId"], orderBy: "createdAt" });
assert(JSON.stringify(idx2) === JSON.stringify([["status"], ["orgId"], ["status", "orgId", "createdAt"]]),
  "index: singles for each filter + a composite ending in the sort column");

const idx3 = recommendIndexes({ equals: [], orderBy: "createdAt" });
assert(JSON.stringify(idx3) === JSON.stringify([["createdAt"]]),
  "index: sort-only query → composite is just the sort column");

export {};
