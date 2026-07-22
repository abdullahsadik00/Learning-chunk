// ═══════════════════════════════════════════════════════════
// CHALLENGE C07: PRISMA ORM  (Day 42)
// Run: npm run challenge:07  |  Time target: 30–40 min
// ═══════════════════════════════════════════════════════════
// PROJECT: Build the two things an ORM does — a fluent query builder
//          that compiles a chain of calls into a normalized query
//          object, and an `include` resolver that stitches relations
//          onto parent rows from in-memory data.
//
// RULES:
//  • Delete each // TODO comment as you implement it.
//  • Do NOT rename any exported name — assertions depend on them.
//  • Run `npm run challenge:07` to check your work (all PASS = done).

// ── ASSERT HELPER (do not modify) ─────────────────────────
function assert(condition: boolean, message: string): void {
  if (!condition) { console.error(`  FAIL  ${message}`); process.exitCode = 1; }
  else            { console.log (`  PASS  ${message}`); }
}

type Row = Record<string, any>;

// ══════════════════════════════════════════════════════════
// PART 1 — Fluent query builder
// ══════════════════════════════════════════════════════════
// Chainable builder that accumulates state, then .build() returns a
// normalized query object. Unset clauses use these defaults:
//   where: {}   orderBy: null   take: null   skip: 0

export interface Query {
  table: string;
  where: Record<string, unknown>;
  orderBy: { field: string; dir: "asc" | "desc" } | null;
  take: number | null;
  skip: number;
}

export class QueryBuilder {
  private _where: Record<string, unknown> = {};
  private _orderBy: { field: string; dir: "asc" | "desc" } | null = null;
  private _take: number | null = null;
  private _skip = 0;

  constructor(private table: string) {}

  where(cond: Record<string, unknown>): this {
    // TODO: merge cond into this._where (later keys override), return this
    void cond;
    return this;
  }
  orderBy(field: string, dir: "asc" | "desc"): this {
    // TODO: set this._orderBy, return this
    void field; void dir;
    return this;
  }
  take(n: number): this {
    // TODO: set this._take, return this
    void n;
    return this;
  }
  skip(n: number): this {
    // TODO: set this._skip, return this
    void n;
    return this;
  }
  build(): Query {
    // TODO: return the normalized Query using current state
    return {
      table: this.table,
      where: {}, orderBy: null, take: null, skip: 0,
    }; // placeholder — replace
  }
}

// ══════════════════════════════════════════════════════════
// PART 2 — include resolver (relations)
// ══════════════════════════════════════════════════════════
// For each parent, attach an array of matching children under
// `asField`, matched on parent[parentKey] === child[childKey].

export function includeRelation(
  parents: Row[],
  children: Row[],
  opts: { parentKey: string; childKey: string; asField: string },
): Row[] {
  // TODO: return parents each with a new `asField` array of its children
  void parents; void children; void opts;
  return []; // placeholder — replace
}

// ── ASSERTIONS (do not modify) ────────────────────────────
console.log("\n── C07 Prisma ORM assertions ──");

const q = new QueryBuilder("user")
  .where({ active: true })
  .where({ role: "admin" })
  .orderBy("createdAt", "desc")
  .take(10)
  .skip(20)
  .build();

assert(q.table === "user", "builder: carries the table name");
assert(JSON.stringify(q.where) === JSON.stringify({ active: true, role: "admin" }),
  "builder: chained where() calls merge");
assert(q.orderBy?.field === "createdAt" && q.orderBy?.dir === "desc", "builder: orderBy captured");
assert(q.take === 10 && q.skip === 20, "builder: take & skip captured");

const empty = new QueryBuilder("post").build();
assert(JSON.stringify(empty.where) === "{}" && empty.orderBy === null && empty.take === null && empty.skip === 0,
  "builder: unset clauses use defaults");

const authors = [{ id: 1, name: "A" }, { id: 2, name: "B" }];
const posts = [
  { id: 10, authorId: 1, title: "x" },
  { id: 11, authorId: 1, title: "y" },
  { id: 12, authorId: 2, title: "z" },
];
const withPosts = includeRelation(authors, posts, { parentKey: "id", childKey: "authorId", asField: "posts" });
assert(withPosts[0]?.posts?.length === 2, "include: author 1 gets both posts");
assert(withPosts[1]?.posts?.length === 1, "include: author 2 gets one post");
assert(withPosts[0]?.name === "A", "include: original parent fields are preserved");

export {};
