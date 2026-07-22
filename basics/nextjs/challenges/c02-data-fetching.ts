// ═══════════════════════════════════════════════════════════
// CHALLENGE C02: DATA FETCHING & RSC CACHING  (Day 20a)
// Run: npm run challenge:02  |  Time target: 25–35 min
// ═══════════════════════════════════════════════════════════
// PROJECT: Build the pure-logic KERNEL of Next.js server-side
//          caching — the three mechanisms that make RSC data
//          fetching fast: request memoization (React `cache()`),
//          a stable dedup key, and a tag-based revalidation store.
//          No network: the algorithms self-check with counters.
//
// RULES:
//  • Delete each // TODO comment as you implement it.
//  • Do NOT rename any exported name — assertions depend on them.
//  • You MAY add private helper functions.
//  • Run `npm run challenge:02` to check your work (all PASS = done).

// ── ASSERT HELPER (do not modify) ─────────────────────────
function assert(condition: boolean, message: string): void {
  if (!condition) { console.error(`  FAIL  ${message}`); process.exitCode = 1; }
  else            { console.log (`  PASS  ${message}`); }
}

// ══════════════════════════════════════════════════════════
// PART 1 — Request memoization  (like React's cache())
// ══════════════════════════════════════════════════════════
// Wrap a function so that repeated calls with the SAME arguments
// return the FIRST result without re-invoking the underlying fn —
// exactly how React.cache() dedupes work within one render pass.

export function cache<A extends unknown[], R>(fn: (...args: A) => R): (...args: A) => R {
  // TODO:
  //  • Keep a Map keyed by JSON.stringify(args).
  //  • On call: if the key is present, return the stored value.
  //    Otherwise call fn(...args), store the result, and return it.
  //  • fn must run at most once per distinct argument set.
  // Hint: return (...args: A): R => { ... }
  void fn;
  return (..._args: A): R => undefined as unknown as R; // placeholder — replace
}

// ══════════════════════════════════════════════════════════
// PART 2 — Stable request key  (fetch dedup identity)
// ══════════════════════════════════════════════════════════
// Next.js dedupes fetch() by URL + options. Build a canonical string
// key that is IDENTICAL for equivalent requests regardless of header
// ORDER, and DIFFERENT when the method differs.

export interface RequestOptions {
  method?: string;
  headers?: Record<string, string>;
}

export function requestKey(url: string, options: RequestOptions = {}): string {
  // TODO:
  //  • method defaults to "GET" (uppercased).
  //  • headers: sort the entries by key so order doesn't matter,
  //    then serialise them deterministically.
  //  • Combine method + url + serialised headers into one string.
  void url; void options;
  return ""; // placeholder — replace
}

// ══════════════════════════════════════════════════════════
// PART 3 — Tag-based revalidation store  (unstable_cache + tags)
// ══════════════════════════════════════════════════════════
// Persist cached values tagged with one or more labels. Reading a
// live key returns its value; invalidating a tag drops EVERY entry
// carrying that tag (this is what revalidateTag() does).

export interface TagStore {
  set(key: string, value: unknown, tags: string[]): void;
  get(key: string): unknown;          // undefined if missing or invalidated
  invalidateTag(tag: string): number; // number of entries removed
}

export function createTagStore(): TagStore {
  // TODO:
  //  • Keep an internal Map<string, { value: unknown; tags: string[] }>.
  //  • set   → store value + tags under key.
  //  • get   → return the stored value, or undefined if absent.
  //  • invalidateTag → delete every entry whose tags include `tag`,
  //                    returning how many were removed.
  return {
    set(_key: string, _value: unknown, _tags: string[]): void { /* TODO */ },
    get(_key: string): unknown { return undefined; },     // placeholder
    invalidateTag(_tag: string): number { return 0; },    // placeholder
  };
}

// ── ASSERTIONS (do not modify) ────────────────────────────
console.log("\n── C02 Data fetching assertions ──");

// PART 1 — cache()
let calls = 0;
const getUser = cache((id: number) => { calls++; return { id, name: `u${id}` }; });
const a1 = getUser(1);
const a2 = getUser(1);
const b1 = getUser(2);
assert(a1?.id === 1 && b1?.id === 2, "cache: returns correct values per args");
assert(a1 === a2, "cache: same args return the identical memoized result");
assert(calls === 2, "cache: fn runs once per distinct arg (2 calls for ids 1,1,2)");

// PART 2 — requestKey
assert(requestKey("/api/a") === requestKey("/api/a"),
  "requestKey: same url+defaults → identical key");
assert(
  requestKey("/api/a", { headers: { x: "1", y: "2" } }) ===
  requestKey("/api/a", { headers: { y: "2", x: "1" } }),
  "requestKey: header order does not change the key");
assert(
  requestKey("/api/a", { method: "POST" }) !== requestKey("/api/a", { method: "GET" }),
  "requestKey: different method → different key");
assert(requestKey("/api/a") !== requestKey("/api/b"),
  "requestKey: different url → different key");

// PART 3 — createTagStore
const store = createTagStore();
store.set("posts:1", { id: 1 }, ["posts"]);
store.set("posts:2", { id: 2 }, ["posts", "featured"]);
store.set("user:1", { id: 1 }, ["users"]);
assert((store.get("posts:1") as { id: number } | undefined)?.id === 1,
  "tagStore: get returns a live value");
assert(store.get("missing") === undefined, "tagStore: unknown key → undefined");
const removed = store.invalidateTag("posts");
assert(removed === 2, "tagStore: invalidateTag('posts') removes both tagged entries");
assert(store.get("posts:1") === undefined && store.get("posts:2") === undefined,
  "tagStore: invalidated entries are gone");
assert((store.get("user:1") as { id: number } | undefined)?.id === 1,
  "tagStore: untouched tags survive invalidation");

export {};
