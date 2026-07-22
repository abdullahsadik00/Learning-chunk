// ═══════════════════════════════════════════════════════════
// CHALLENGE C08: ADVANCED QUERIES  (Day 43)
// Run: npm run challenge:08  |  Time target: 30–40 min
// ═══════════════════════════════════════════════════════════
// PROJECT: Implement the query features REST clients actually need at
//          scale — cursor pagination, aggregations, and a naive
//          full-text ranking by term frequency.
//
// RULES:
//  • Delete each // TODO comment as you implement it.
//  • Do NOT rename any exported name — assertions depend on them.
//  • Run `npm run challenge:08` to check your work (all PASS = done).

// ── ASSERT HELPER (do not modify) ─────────────────────────
function assert(condition: boolean, message: string): void {
  if (!condition) { console.error(`  FAIL  ${message}`); process.exitCode = 1; }
  else            { console.log (`  PASS  ${message}`); }
}

// ══════════════════════════════════════════════════════════
// PART 1 — Cursor pagination
// ══════════════════════════════════════════════════════════
// A cursor encodes the id of the last row seen. Rows are sorted by
// ascending id. Return up to `limit` rows AFTER the cursor id, plus
// the nextCursor (id of the last returned row, or null if no more).

export interface Page<T> { items: T[]; nextCursor: string | null; }

export function encodeCursor(id: number): string {
  // TODO: base64url-encode the numeric id as a string
  void id;
  return ""; // placeholder — replace
}
export function decodeCursor(cursor: string): number {
  // TODO: reverse encodeCursor → number
  void cursor;
  return 0; // placeholder — replace
}

export function cursorPage(
  rows: Array<{ id: number }>,
  limit: number,
  cursor: string | null,
): Page<{ id: number }> {
  // TODO:
  //  • startAfter = cursor ? decodeCursor(cursor) : -Infinity
  //  • candidates = rows sorted by id asc, keeping id > startAfter
  //  • items = first `limit` candidates
  //  • nextCursor = encodeCursor(lastItem.id) if more candidates remain, else null
  void rows; void limit; void cursor;
  return { items: [], nextCursor: null }; // placeholder — replace
}

// ══════════════════════════════════════════════════════════
// PART 2 — Aggregations
// ══════════════════════════════════════════════════════════

export function aggregate(values: number[]): { count: number; sum: number; avg: number; min: number; max: number } {
  // TODO: compute all five. For an empty array return
  //       { count:0, sum:0, avg:0, min:0, max:0 }.
  void values;
  return { count: 0, sum: 0, avg: 0, min: 0, max: 0 }; // placeholder — replace
}

// ══════════════════════════════════════════════════════════
// PART 3 — Full-text ranking by term frequency
// ══════════════════════════════════════════════════════════
// Score each doc by how many times `term` appears (case-insensitive,
// whole-word). Return docs with score > 0, sorted by score desc,
// ties broken by original index (stable).

export interface Doc { id: number; text: string; }

export function search(docs: Doc[], term: string): Array<{ id: number; score: number }> {
  // TODO: lowercase + split each doc.text on whitespace; count matches of
  //       term.toLowerCase(); keep score>0; sort by score desc, stable on ties.
  void docs; void term;
  return []; // placeholder — replace
}

// ── ASSERTIONS (do not modify) ────────────────────────────
console.log("\n── C08 Advanced queries assertions ──");

assert(decodeCursor(encodeCursor(123)) === 123, "cursor: encode→decode round-trips");

const rows = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }];
const p1 = cursorPage(rows, 2, null);
assert(JSON.stringify(p1.items.map((r) => r.id)) === "[1,2]", "cursorPage: first page returns first 2 ids");
assert(p1.nextCursor !== null, "cursorPage: nextCursor present when more rows remain");
const p2 = cursorPage(rows, 2, p1.nextCursor);
assert(JSON.stringify(p2.items.map((r) => r.id)) === "[3,4]", "cursorPage: second page continues after cursor");
const p3 = cursorPage(rows, 2, p2.nextCursor);
assert(JSON.stringify(p3.items.map((r) => r.id)) === "[5]" && p3.nextCursor === null,
  "cursorPage: last page returns remainder and null cursor");

const agg = aggregate([10, 20, 30]);
assert(agg.count === 3 && agg.sum === 60 && agg.avg === 20 && agg.min === 10 && agg.max === 30,
  "aggregate: computes count/sum/avg/min/max");
assert(aggregate([]).count === 0, "aggregate: empty array is safe");

const docs: Doc[] = [
  { id: 1, text: "redis cache redis fast" },
  { id: 2, text: "postgres index scan" },
  { id: 3, text: "redis pub sub" },
];
const results = search(docs, "redis");
assert(results.length === 2, "search: only docs containing the term are returned");
assert(results[0]?.id === 1 && results[0]?.score === 2, "search: highest term-frequency ranks first");
assert(results[1]?.id === 3 && results[1]?.score === 1, "search: lower frequency ranks second");

export {};
