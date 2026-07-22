// ═══════════════════════════════════════════════════════════
// CHALLENGE C06: SQL FUNDAMENTALS  (Day 41)
// Run: npm run challenge:06  |  Time target: 30–40 min
// ═══════════════════════════════════════════════════════════
// PROJECT: Implement the relational operators a SQL engine runs —
//          WHERE, INNER JOIN, LEFT JOIN, and GROUP BY + aggregate —
//          over plain in-memory row arrays. No database needed.
//
// RULES:
//  • Delete each // TODO comment as you implement it.
//  • Do NOT rename any exported name — assertions depend on them.
//  • Run `npm run challenge:06` to check your work (all PASS = done).

// ── ASSERT HELPER (do not modify) ─────────────────────────
function assert(condition: boolean, message: string): void {
  if (!condition) { console.error(`  FAIL  ${message}`); process.exitCode = 1; }
  else            { console.log (`  PASS  ${message}`); }
}

type Row = Record<string, any>;

// ── GIVEN: sample tables ──────────────────────────────────
const users: Row[] = [
  { id: 1, name: "Alice", city: "NYC" },
  { id: 2, name: "Bob", city: "LA" },
  { id: 3, name: "Carol", city: "NYC" },
];
const orders: Row[] = [
  { id: 10, userId: 1, total: 50 },
  { id: 11, userId: 1, total: 30 },
  { id: 12, userId: 2, total: 20 },
];

// ══════════════════════════════════════════════════════════
// PART 1 — WHERE
// ══════════════════════════════════════════════════════════

export function where(rows: Row[], predicate: (row: Row) => boolean): Row[] {
  // TODO: return only the rows for which predicate is true
  void rows; void predicate;
  return []; // placeholder — replace
}

// ══════════════════════════════════════════════════════════
// PART 2 — INNER JOIN
// ══════════════════════════════════════════════════════════
// Combine left & right rows where left[leftKey] === right[rightKey].
// Merge each pair with { ...left, ...right }. Unmatched rows drop.

export function innerJoin(left: Row[], right: Row[], leftKey: string, rightKey: string): Row[] {
  // TODO: nested loop; push { ...l, ...r } when keys match
  void left; void right; void leftKey; void rightKey;
  return []; // placeholder — replace
}

// ══════════════════════════════════════════════════════════
// PART 3 — LEFT JOIN
// ══════════════════════════════════════════════════════════
// Like innerJoin, but a left row with NO match still appears once,
// merged with nulls for every right column key.

export function leftJoin(left: Row[], right: Row[], leftKey: string, rightKey: string): Row[] {
  // TODO: for each left row, find matches. If ≥1, emit merged rows.
  //       If none, emit { ...l } with each key of a right sample row set to null.
  //       Hint: derive right column names from right[0] (assume non-empty right).
  void left; void right; void leftKey; void rightKey;
  return []; // placeholder — replace
}

// ══════════════════════════════════════════════════════════
// PART 4 — GROUP BY + aggregate
// ══════════════════════════════════════════════════════════
// Group rows by the value of `key`, then reduce each group's rows
// with `agg`. Return one row per group: { [key]: value, ...agg }.

export function groupBy(
  rows: Row[],
  key: string,
  agg: (group: Row[]) => Row,
): Row[] {
  // TODO: build a Map from key-value → rows[], then map each entry to
  //       { [key]: keyValue, ...agg(group) }. Preserve first-seen order.
  void rows; void key; void agg;
  return []; // placeholder — replace
}

// ── ASSERTIONS (do not modify) ────────────────────────────
console.log("\n── C06 SQL fundamentals assertions ──");

const nyc = where(users, (u) => u.city === "NYC");
assert(nyc.length === 2 && nyc.every((u) => u.city === "NYC"), "where: filters rows by predicate");

const joined = innerJoin(users, orders, "id", "userId");
assert(joined.length === 3, "innerJoin: 3 matching user/order pairs");
assert(joined.every((r) => r.name && r.total !== undefined), "innerJoin: merges columns from both sides");
assert(!joined.some((r) => r.name === "Carol"), "innerJoin: unmatched user (Carol) is dropped");

const left = leftJoin(users, orders, "id", "userId");
assert(left.length === 4, "leftJoin: 3 matches + Carol with nulls = 4 rows");
const carol = left.find((r) => r.name === "Carol");
assert(carol !== undefined && carol.total === null, "leftJoin: unmatched left row keeps nulls for right columns");

const totals = groupBy(orders, "userId", (g) => ({
  count: g.length,
  sum: g.reduce((s, r) => s + r.total, 0),
}));
assert(totals.length === 2, "groupBy: two distinct userIds");
const u1 = totals.find((r) => r.userId === 1);
assert(u1 !== undefined && u1.count === 2 && u1.sum === 80, "groupBy: user 1 has 2 orders summing to 80");

export {};
