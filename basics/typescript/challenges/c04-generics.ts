// ═══════════════════════════════════════════════════════════
// CHALLENGE C04: GENERICS
// Run: npm run challenge:04  |  Time target: 30–40 min
// ═══════════════════════════════════════════════════════════
// PROJECT: Build a type-safe in-memory LRU cache with a generic
//          interface, conditional types, infer, and mapped types.
//
// RULES:
//  • Delete each // TODO comment as you implement it.
//  • Do NOT rename any exported name — assertions depend on them.
//  • You MAY add private helper methods.
//  • Run `npm run challenge:04` to check your work.

// ── ASSERT HELPER (do not modify) ─────────────────────────
function assert(condition: boolean, message: string): void {
  if (!condition) { console.error(`  FAIL  ${message}`); process.exitCode = 1; }
  else            { console.log (`  PASS  ${message}`); }
}

// ══════════════════════════════════════════════════════════
// PART 1 — Generic interface
// ══════════════════════════════════════════════════════════

// CacheEntry wraps a stored value with metadata.
// Given — do not modify.
export interface CacheEntry<V> {
  value: V;
  expiresAt: number | null; // null = never expires
  hits: number;
}

// TODO: Define the Cache<K, V> interface with these methods:
//   set(key: K, value: V, ttlMs?: number): void
//     — store the value; if ttlMs provided, it expires after that many ms
//   get(key: K): V | undefined
//     — return the value if present and not expired, else undefined
//   has(key: K): boolean
//     — true if key exists and is not expired
//   delete(key: K): boolean
//     — remove a key; return true if it existed
//   clear(): void
//     — remove all entries
//   get size(): number
//     — number of non-expired entries (getter, not a method)
export interface Cache<K, V> {
  // TODO: add method signatures
}

// ══════════════════════════════════════════════════════════
// PART 2 — Generic class implementing generic interface
// ══════════════════════════════════════════════════════════

// LRUCache<K, V> implements Cache<K, V>.
// Capacity: when full, evict the least-recently-used entry on set().
// An "access" (get or set) counts as a use — update the usage order.
export class LRUCache<K, V> implements Cache<K, V> {
  private items = new Map<K, CacheEntry<V>>();
  private order: K[] = []; // front = least recently used

  constructor(private readonly capacity: number) {}

  // TODO: implement set(key, value, ttlMs?)
  set(_key: K, _value: V, _ttlMs?: number): void {
    // Hint: if at capacity, remove this.order[0] (LRU).
    //       Move key to end of order array on every set.
  }

  // TODO: implement get(key)
  get(_key: K): V | undefined {
    // Hint: check expiry (Date.now() > expiresAt), remove if expired.
    //       On cache hit, move key to end of order array and increment hits.
    return undefined;
  }

  // TODO: implement has(key)
  has(_key: K): boolean {
    return false;
  }

  // TODO: implement delete(key)
  delete(_key: K): boolean {
    return false;
  }

  // TODO: implement clear()
  clear(): void {}

  // TODO: implement get size() — count only non-expired entries
  get size(): number {
    return 0;
  }
}

// ══════════════════════════════════════════════════════════
// PART 3 — Conditional type with `infer`
// ══════════════════════════════════════════════════════════

// UnwrapCache<T> extracts the value type V from a Cache<K, V>.
// If T is a Cache<any, V>, resolve to V. Otherwise resolve to never.
//
// Example:
//   UnwrapCache<Cache<string, number>>  →  number
//   UnwrapCache<string>                 →  never
//
// TODO: implement using `infer`
export type UnwrapCache<T> = T extends Cache<any, infer V> ? V : never; // this one is done — study it!

// Compile-time checks (these must not produce type errors):
type _CheckNumber = UnwrapCache<Cache<string, number>>;
const _n: _CheckNumber = 42; // must be number
type _CheckNever  = UnwrapCache<string>;
// const _bad: _CheckNever = "anything"; // would error — never is uninhabited

// ══════════════════════════════════════════════════════════
// PART 4 — Mapped type
// ══════════════════════════════════════════════════════════

// CacheStats<K> takes a union of string keys and creates an object
// where every key is renamed to `${key}Hits` with a number value.
//
// Example:
//   CacheStats<"user" | "post">
//   → { userHits: number; postHits: number }
//
// TODO: implement using a mapped type over K
export type CacheStats<K extends string> = {
  // TODO: [key in K] → rename to `${key}Hits`: number
  [key in K]: number; // replace this line with the template literal rename
};

// Compile-time check:
const _stats: CacheStats<"user" | "post"> = {
  // @ts-expect-error — "user" is not a valid key, should be "userHits"
  user: 5,
};

// ══════════════════════════════════════════════════════════
// PART 5 — Generic function with constraint
// ══════════════════════════════════════════════════════════

// warmUp pre-populates a cache from an array of [key, value] pairs.
// K and V must match the cache's type parameters.
export function warmUp<K, V>(cache: Cache<K, V>, entries: [K, V][]): void {
  // TODO: implement — just call cache.set for each entry
}

// ── ASSERTIONS (do not modify) ────────────────────────────
console.log("\n── C04 Generics assertions ──");

const cache = new LRUCache<string, number>(3);

// Basic set/get
cache.set("a", 1);
cache.set("b", 2);
cache.set("c", 3);
assert(cache.get("a") === 1,  "get: returns stored value");
assert(cache.get("b") === 2,  "get: returns stored value b");
assert(cache.size    === 3,  "size: 3 entries");

// has / delete
assert(cache.has("a")    === true,  "has: true for existing key");
assert(cache.has("z")    === false, "has: false for missing key");
assert(cache.delete("b") === true,  "delete: returns true for existing key");
assert(cache.has("b")    === false, "has: false after delete");
assert(cache.size        === 2,     "size: 2 after delete");

// LRU eviction — fill up to capacity (3), then add a 4th
const lru = new LRUCache<string, number>(3);
lru.set("x", 10);
lru.set("y", 20);
lru.set("z", 30);
lru.get("x"); // x is now most recently used — y is LRU
lru.set("w", 40); // should evict y (LRU)
assert(lru.has("x") === true,  "LRU: most recently accessed key survives eviction");
assert(lru.has("y") === false, "LRU: least recently used key is evicted");
assert(lru.has("z") === true,  "LRU: z was not evicted");
assert(lru.has("w") === true,  "LRU: newly added key exists");
assert(lru.size     === 3,     "LRU: size stays at capacity after eviction");

// clear
cache.clear();
assert(cache.size === 0, "clear: size is 0 after clear");

// warmUp
const wCache = new LRUCache<string, string>(10);
warmUp(wCache, [["hello", "world"], ["foo", "bar"]]);
assert(wCache.get("hello") === "world", "warmUp: pre-populated key hello");
assert(wCache.get("foo")   === "bar",   "warmUp: pre-populated key foo");

export {};
