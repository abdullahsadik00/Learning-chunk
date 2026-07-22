// ═══════════════════════════════════════════════════════════
// CHALLENGE C02: DATA FETCHING · STALE-WHILE-REVALIDATE  (Day 23)
// Run: npm run challenge:02  |  Time target: 35–45 min
// ═══════════════════════════════════════════════════════════
// PROJECT: Build the caching kernel behind a React Query / SWR data
//          layer — a deterministic query-key serializer, a
//          stale-while-revalidate cache (fresh vs stale by TTL, using an
//          injected clock), and an in-flight request deduplicator that
//          collapses concurrent calls for the same key into one fetch.
//
// RULES:
//  • Delete each // TODO comment as you implement it.
//  • Do NOT rename any exported name — assertions depend on them.
//  • Time is passed in (nowMs) — never call Date.now(). Stay deterministic.
//  • Run `npm run challenge:02` to check your work (all PASS = done).

// ── ASSERT HELPER (do not modify) ─────────────────────────
function assert(condition: boolean, message: string): void {
  if (!condition) { console.error(`  FAIL  ${message}`); process.exitCode = 1; }
  else            { console.log (`  PASS  ${message}`); }
}

// ══════════════════════════════════════════════════════════
// PART 1 — Query-key serializer
// ══════════════════════════════════════════════════════════
// serializeKey(parts): produce a STABLE string for a query key array.
// Objects must serialize with their keys sorted, so { a, b } and { b, a }
// yield the same string. Arrays keep order. Primitives stringify as-is.

export function serializeKey(parts: unknown[]): string {
  // TODO: JSON.stringify with a replacer that sorts object keys (recursively
  //       via a canonical form), so key order never changes the result.
  void parts;
  return ""; // placeholder — replace
}

// ══════════════════════════════════════════════════════════
// PART 2 — Stale-while-revalidate cache
// ══════════════════════════════════════════════════════════
// set(key, value, nowMs): store the value with its write time.
// get(key, nowMs): return { hit, value?, stale }. A present entry is
// `stale` when (nowMs - storedAt) > ttlMs; a missing entry is
// { hit:false, stale:false }.

export interface SWRResult<T> { hit: boolean; value?: T; stale: boolean }

export function createSWRCache<T>(ttlMs: number) {
  const store = new Map<string, { value: T; storedAt: number }>();
  return {
    set(key: string, value: T, nowMs: number): void {
      // TODO: record { value, storedAt: nowMs } under key.
      void key; void value; void nowMs; void store;
    },
    get(key: string, nowMs: number): SWRResult<T> {
      // TODO: miss → { hit:false, stale:false }; hit → include value and
      //       stale = (nowMs - storedAt) > ttlMs.
      void key; void nowMs;
      return { hit: false, stale: false }; // placeholder — replace
    },
  };
}

// ══════════════════════════════════════════════════════════
// PART 3 — In-flight request deduplication
// ══════════════════════════════════════════════════════════
// fetch(key, loader): if a promise for `key` is already in flight, return
// that SAME promise (loader NOT called again). Once it settles, drop it so
// a later call re-fetches fresh.

export function createDeduper() {
  const inFlight = new Map<string, Promise<unknown>>();
  return {
    fetch<T>(key: string, loader: () => Promise<T>): Promise<T> {
      // TODO: return the in-flight promise if present; else call loader(),
      //       store it, and clear it on settle (.finally). Return it.
      void key; void loader; void inFlight;
      return loader(); // placeholder — replace (calls loader every time — wrong)
    },
  };
}

// ── ASSERTIONS (do not modify) ────────────────────────────
async function main() {
  console.log("\n── C02 Data fetching · SWR assertions ──");

  const kA = serializeKey(["posts", { user: 1, page: 2 }]);
  const kB = serializeKey(["posts", { page: 2, user: 1 }]);
  assert(kA.length > 0 && kA === kB, "serializeKey: object key order does not change the key");
  assert(serializeKey(["posts", 1]) !== serializeKey(["posts", 2]), "serializeKey: different values → different keys");

  const cache = createSWRCache<number>(1000);
  assert(cache.get("x", 0).hit === false, "swr: missing key is not a hit");
  cache.set("x", 42, 0);
  const fresh = cache.get("x", 500);
  assert(fresh.hit === true && fresh.value === 42 && fresh.stale === false, "swr: within TTL → hit and fresh");
  assert(cache.get("x", 1500).stale === true, "swr: past TTL → hit but stale");

  let loads = 0;
  const dedupe = createDeduper();
  const slow = () => new Promise<number>((res) => { loads++; setTimeout(() => res(7), 5); });
  const [a, b] = await Promise.all([dedupe.fetch("k", slow), dedupe.fetch("k", slow)]);
  assert(a === 7 && b === 7, "dedupe: both concurrent callers resolve to the value");
  assert(loads === 1, "dedupe: concurrent calls share one in-flight request");
  const c = await dedupe.fetch("k", slow);
  assert(c === 7 && loads === 2, "dedupe: after settling, a later call re-fetches");

  console.log("");
}
main();

export {};
