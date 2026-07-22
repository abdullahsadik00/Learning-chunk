// ═══════════════════════════════════════════════════════════
// CHALLENGE C01: FRONTEND ARCHITECTURE · NORMALIZED STATE  (Day 22)
// Run: npm run challenge:01  |  Time target: 35–45 min
// ═══════════════════════════════════════════════════════════
// PROJECT: Build the pure-logic kernel of a client-side normalized
//          entity store — the state layer behind a TwitterFeed/ECommerce
//          app. Normalize a nested API payload into {entities, ids},
//          denormalize it back, and apply an optimistic update that can
//          be rolled back. No React, no store library — just the data.
//
// RULES:
//  • Delete each // TODO comment as you implement it.
//  • Do NOT rename any exported name — assertions depend on them.
//  • Keep state immutable: never mutate the input; return new objects.
//  • Run `npm run challenge:01` to check your work (all PASS = done).

// ── ASSERT HELPER (do not modify) ─────────────────────────
function assert(condition: boolean, message: string): void {
  if (!condition) { console.error(`  FAIL  ${message}`); process.exitCode = 1; }
  else            { console.log (`  PASS  ${message}`); }
}

// ══════════════════════════════════════════════════════════
// PART 1 — Generic normalize / denormalize
// ══════════════════════════════════════════════════════════
// normalize(items): turn a flat list of entities (each with a string id)
// into { entities: { [id]: entity }, ids: [id...] }. `ids` MUST preserve
// the input order. denormalize(state): rebuild the array in `ids` order.

export interface EntityState<T> {
  entities: Record<string, T>;
  ids: string[];
}

export function normalize<T extends { id: string }>(items: T[]): EntityState<T> {
  // TODO: fold items into { entities, ids }, preserving order; last write
  //       wins if an id repeats (do not duplicate it in `ids`).
  void items;
  return { entities: {}, ids: [] }; // placeholder — replace
}

export function denormalize<T extends { id: string }>(state: EntityState<T>): T[] {
  // TODO: map state.ids through state.entities to rebuild the ordered list.
  void state;
  return []; // placeholder — replace
}

// ══════════════════════════════════════════════════════════
// PART 2 — Nested payload normalizer (feed → posts + users)
// ══════════════════════════════════════════════════════════
// A feed endpoint returns posts with a nested `author` object. Split it
// into two normalized tables: `posts` (author flattened to authorId) and
// `users` (deduped by id). This is the classic relational-normalization
// step behind a Redux/Zustand entity cache.

export interface RawPost {
  id: string;
  text: string;
  author: { id: string; name: string };
}
export interface Post { id: string; text: string; authorId: string }
export interface User { id: string; name: string }

export interface NormalizedFeed {
  posts: EntityState<Post>;
  users: EntityState<User>;
}

export function normalizeFeed(raw: RawPost[]): NormalizedFeed {
  // TODO: build the flattened Post list (authorId replaces author) and the
  //       deduped User list, then normalize() each into an EntityState.
  void raw;
  return { posts: { entities: {}, ids: [] }, users: { entities: {}, ids: [] } };
}

// ══════════════════════════════════════════════════════════
// PART 3 — Optimistic update + rollback
// ══════════════════════════════════════════════════════════
// optimisticUpdate(state, id, patch): return { next, rollback } where
// `next` is a NEW EntityState with the entity at `id` shallow-merged with
// `patch`, and `rollback()` returns the ORIGINAL state unchanged. If the
// id is missing, `next` equals the input state (still return a rollback).

export interface OptimisticResult<T> {
  next: EntityState<T>;
  rollback: () => EntityState<T>;
}

export function optimisticUpdate<T extends { id: string }>(
  state: EntityState<T>,
  id: string,
  patch: Partial<T>,
): OptimisticResult<T> {
  // TODO: if id exists, produce a new state with entities[id] = {...old, ...patch}
  //       (new entities object, same ids). Capture the original for rollback.
  void state; void id; void patch;
  return { next: state, rollback: () => state }; // placeholder — replace
}

// ── ASSERTIONS (do not modify) ────────────────────────────
console.log("\n── C01 Architecture · normalized state assertions ──");

const users: User[] = [{ id: "u1", name: "Ada" }, { id: "u2", name: "Alan" }];
const ns = normalize(users);
assert(JSON.stringify(ns?.ids) === JSON.stringify(["u1", "u2"]), "normalize: ids preserve input order");
assert(ns?.entities?.["u2"]?.name === "Alan", "normalize: entities keyed by id");
assert(JSON.stringify(denormalize(ns)) === JSON.stringify(users), "denormalize: round-trips back to the ordered list");

const dupNs = normalize([{ id: "u1", name: "Ada" }, { id: "u1", name: "Ada2" }]);
assert(dupNs?.ids?.length === 1 && dupNs?.entities?.["u1"]?.name === "Ada2", "normalize: repeated id appears once, last write wins");

const feed = normalizeFeed([
  { id: "p1", text: "hi", author: { id: "u1", name: "Ada" } },
  { id: "p2", text: "yo", author: { id: "u1", name: "Ada" } },
  { id: "p3", text: "hey", author: { id: "u2", name: "Alan" } },
]);
assert(feed?.posts?.ids?.length === 3, "normalizeFeed: all posts kept");
assert(feed?.posts?.entities?.["p1"]?.authorId === "u1", "normalizeFeed: nested author flattened to authorId");
assert((feed?.posts?.entities?.["p1"] as unknown as RawPost)?.author === undefined, "normalizeFeed: nested author object removed from post");
assert(feed?.users?.ids?.length === 2, "normalizeFeed: users deduped by id");
assert(feed?.users?.entities?.["u2"]?.name === "Alan", "normalizeFeed: user table populated");

const base = normalize<User>([{ id: "u1", name: "Ada" }]);
const { next, rollback } = optimisticUpdate(base, "u1", { name: "Ada Lovelace" });
assert(next?.entities?.["u1"]?.name === "Ada Lovelace", "optimistic: patch applied in next state");
assert(base.entities?.["u1"]?.name === "Ada", "optimistic: original state not mutated");
assert(next !== base && next?.entities !== base.entities, "optimistic: next is a new object graph");
assert(rollback()?.entities?.["u1"]?.name === "Ada", "optimistic: rollback restores the original");

console.log("");
export {};
