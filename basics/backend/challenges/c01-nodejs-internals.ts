// ═══════════════════════════════════════════════════════════
// CHALLENGE C01: NODE.JS INTERNALS  (Day 36)
// Run: npm run challenge:01  |  Time target: 25–35 min
// ═══════════════════════════════════════════════════════════
// PROJECT: Rebuild the two primitives every Node backend leans on —
//          an EventEmitter and a stream-style transform pipeline —
//          from scratch, with no `events`/`stream` imports.
//
// RULES:
//  • Delete each // TODO comment as you implement it.
//  • Do NOT rename any exported name — assertions depend on them.
//  • You MAY add private helper functions.
//  • Run `npm run challenge:01` to check your work (all PASS = done).

// ── ASSERT HELPER (do not modify) ─────────────────────────
function assert(condition: boolean, message: string): void {
  if (!condition) { console.error(`  FAIL  ${message}`); process.exitCode = 1; }
  else            { console.log (`  PASS  ${message}`); }
}

type Listener = (...args: any[]) => void;

// ══════════════════════════════════════════════════════════
// PART 1 — A minimal EventEmitter
// ══════════════════════════════════════════════════════════
// Implement on / once / off / emit. Listeners for the same event
// fire in registration order. `emit` returns true if at least one
// listener ran, false otherwise. `once` auto-removes after firing.

export class MiniEmitter {
  private listeners: Map<string, Listener[]> = new Map();

  on(event: string, fn: Listener): this {
    // TODO: append fn to the listener array for `event`
    void event; void fn;
    return this;
  }

  off(event: string, fn: Listener): this {
    // TODO: remove fn (by reference) from the listener array for `event`
    void event; void fn;
    return this;
  }

  once(event: string, fn: Listener): this {
    // TODO: register a wrapper that calls fn, then removes itself.
    //       Hint: define `const wrap = (...a) => { this.off(event, wrap); fn(...a); }`
    void event; void fn;
    return this;
  }

  emit(event: string, ...args: any[]): boolean {
    // TODO: call each listener for `event` in order with `args`.
    //       Return true if there was ≥1 listener, else false.
    //       Iterate over a COPY of the array so `once` removals mid-emit are safe.
    void event; void args;
    return false; // placeholder — replace
  }
}

// ══════════════════════════════════════════════════════════
// PART 2 — A stream-style transform pipeline
// ══════════════════════════════════════════════════════════
// Push every element of `chunks` through each stage in order
// (Readable → Transform → Transform → … → array). Pure & synchronous.

export function transformPipeline(
  chunks: number[],
  ...stages: Array<(n: number) => number>
): number[] {
  // TODO: for each chunk, apply every stage left-to-right; collect results.
  void chunks; void stages;
  return []; // placeholder — replace
}

// ── ASSERTIONS (do not modify) ────────────────────────────
console.log("\n── C01 Node.js internals assertions ──");

const em = new MiniEmitter();
const order: number[] = [];
const h = (n: number) => order.push(n);
em.on("data", h);
em.emit("data", 1);
em.emit("data", 2);
assert(JSON.stringify(order) === "[1,2]", "on/emit: listeners fire in order with args");

em.off("data", h);
em.emit("data", 3);
assert(JSON.stringify(order) === "[1,2]", "off: removed listener no longer fires");

const onceLog: string[] = [];
em.once("ready", () => onceLog.push("x"));
em.emit("ready");
em.emit("ready");
assert(onceLog.length === 1, "once: fires exactly one time");

const em2 = new MiniEmitter();
em2.on("e", () => {});
assert(em2.emit("e") === true,     "emit: returns true when a listener exists");
assert(em2.emit("none") === false, "emit: returns false when no listener exists");

assert(JSON.stringify(transformPipeline([1, 2, 3], (x) => x * 2)) === "[2,4,6]",
  "pipeline: single stage doubles each chunk");
assert(JSON.stringify(transformPipeline([1, 2, 3], (x) => x + 1, (x) => x * 10)) === "[20,30,40]",
  "pipeline: stages apply left-to-right");
assert(JSON.stringify(transformPipeline([5])) === "[5]",
  "pipeline: no stages passes chunks through unchanged");

export {};
