// ═══════════════════════════════════════════════════════════
// CHALLENGE C08: TYPE GUARDS
// Run: npm run challenge:08  |  Time target: 25–35 min
// ═══════════════════════════════════════════════════════════
// PROJECT: Build an event stream processor that receives mixed-type
//          events from a message bus and routes each one safely.
//
// RULES:
//  • Delete each // TODO comment as you implement it.
//  • Do NOT rename any exported name — assertions depend on them.
//  • You MAY add helper functions.
//  • Run `npm run challenge:08` to check your work.

// ── ASSERT HELPER (do not modify) ─────────────────────────
function assert(condition: boolean, message: string): void {
  if (!condition) { console.error(`  FAIL  ${message}`); process.exitCode = 1; }
  else            { console.log (`  PASS  ${message}`); }
}

// ══════════════════════════════════════════════════════════
// PART 1 — Discriminated union event types (given, do not modify)
// ══════════════════════════════════════════════════════════

export interface ClickEvent   { type: "click";   x: number; y: number }
export interface KeyEvent     { type: "key";     key: string; ctrlKey: boolean }
export interface NetworkEvent { type: "network"; url: string; status: number }
export interface MetricEvent  { type: "metric";  name: string; value: number }
export interface SystemEvent  { type: "system";  level: "info" | "warn" | "error"; message: string }

export type BusEvent =
  | ClickEvent
  | KeyEvent
  | NetworkEvent
  | MetricEvent
  | SystemEvent;

// ══════════════════════════════════════════════════════════
// PART 2 — Discriminated union switch (exhaustive)
// ══════════════════════════════════════════════════════════

// processEvent handles every event type and returns a summary string.
// Required return values (must match exactly):
//   ClickEvent   → "click at (X,Y)"           e.g. "click at (10,20)"
//   KeyEvent     → "key: KEY [ctrl]" or "key: KEY"  (append " [ctrl]" only if ctrlKey is true)
//   NetworkEvent → "network: STATUS URL"       e.g. "network: 200 https://api.example.com"
//   MetricEvent  → "metric NAME=VALUE"         e.g. "metric cpu=0.85"
//   SystemEvent  → "system [LEVEL] MESSAGE"    e.g. "system [error] disk full"
//
// The default branch must perform an exhaustiveness check using `never`.
export function processEvent(event: BusEvent): string {
  switch (event.type) {
    // TODO: add a case for each event type
    default: {
      // TODO: const _exhaustive: never = event;
      //       throw new Error(`Unhandled event type: ${_exhaustive}`);
      return "";
    }
  }
}

// ══════════════════════════════════════════════════════════
// PART 3 — typeof guard
// ══════════════════════════════════════════════════════════

// routeToHandler routes a raw payload to the right handler based on its type.
// Return values:
//   string  → "text: VALUE"          e.g. "text: hello"
//   number  → "count: VALUE"         e.g. "count: 42"
//   Error   → "error: MESSAGE"       e.g. "error: not found"
//   Date    → "timestamp: ISO"       e.g. "timestamp: 2024-01-15T..."
//             (use .toISOString())
//   other   → "unknown payload"
//
// Use typeof for string/number, instanceof for Error/Date.
export function routeToHandler(payload: string | number | Error | Date | unknown): string {
  // TODO: implement using typeof and instanceof guards
  return "";
}

// ══════════════════════════════════════════════════════════
// PART 4 — User-defined type guard (is predicate)
// ══════════════════════════════════════════════════════════

export interface ValidPayload {
  id: string;
  data: unknown;
  timestamp: number;
}

// isMalformed returns true if the value is missing any of the three
// required fields: id (string), data (any value), timestamp (number).
// A missing or wrong-type field means malformed.
export function isMalformed(value: unknown): boolean {
  // TODO: implement
  // Hints:
  //   • Check typeof value === "object" && value !== null first
  //   • Then check the three fields using `in` operator + typeof
  return true; // placeholder
}

// ══════════════════════════════════════════════════════════
// PART 5 — Assertion function
// ══════════════════════════════════════════════════════════

// assertValidPayload narrows `payload` to ValidPayload or throws.
// After calling this, TypeScript knows payload is ValidPayload.
export function assertValidPayload(payload: unknown): asserts payload is ValidPayload {
  if (isMalformed(payload)) {
    throw new Error("Invalid payload");
  }
  // TODO: if not malformed, the function just returns (no throw)
  //       The `asserts` return type does the narrowing automatically.
}

// ══════════════════════════════════════════════════════════
// PART 6 — `in` operator guard
// ══════════════════════════════════════════════════════════

interface Cat { meow(): string }
interface Dog { bark(): string }
type Animal = Cat | Dog;

// isCat returns true if the animal has a `meow` method.
export function isCat(animal: Animal): animal is Cat {
  // TODO: use the `in` operator
  return false;
}

// makeSound calls the right method based on what kind of animal it is.
export function makeSound(animal: Animal): string {
  // TODO: use isCat to narrow, then call meow() or bark()
  return "";
}

// ── ASSERTIONS (do not modify) ────────────────────────────
console.log("\n── C08 Type Guards assertions ──");

// processEvent
assert(processEvent({ type: "click",   x: 10,  y: 20 })                          === "click at (10,20)",          "processEvent: click");
assert(processEvent({ type: "key",     key: "Enter", ctrlKey: false })            === "key: Enter",                "processEvent: key no ctrl");
assert(processEvent({ type: "key",     key: "s",     ctrlKey: true })             === "key: s [ctrl]",             "processEvent: key with ctrl");
assert(processEvent({ type: "network", url: "https://api.example.com", status: 200 }) === "network: 200 https://api.example.com", "processEvent: network");
assert(processEvent({ type: "metric",  name: "cpu",  value: 0.85 })              === "metric cpu=0.85",            "processEvent: metric");
assert(processEvent({ type: "system",  level: "error", message: "disk full" })   === "system [error] disk full",   "processEvent: system");

// routeToHandler
assert(routeToHandler("hello")          === "text: hello",             "routeToHandler: string");
assert(routeToHandler(42)               === "count: 42",               "routeToHandler: number");
assert(routeToHandler(new Error("oops")) === "error: oops",            "routeToHandler: Error");
assert(routeToHandler("unknown" as any) === "text: unknown",           "routeToHandler: string fallback");

const d = new Date("2024-01-15T00:00:00.000Z");
const dtResult = routeToHandler(d);
assert(dtResult.startsWith("timestamp:"),                              "routeToHandler: Date starts with timestamp:");

// isMalformed
assert(isMalformed(null)                              === true,  "isMalformed: null is malformed");
assert(isMalformed(undefined)                         === true,  "isMalformed: undefined is malformed");
assert(isMalformed({ id: "x", timestamp: 123 })       === true,  "isMalformed: missing data field");
assert(isMalformed({ id: 123, data: {}, timestamp: 1 }) === true, "isMalformed: id not a string");
assert(isMalformed({ id: "x", data: {}, timestamp: "bad" }) === true, "isMalformed: timestamp not a number");
assert(isMalformed({ id: "x", data: {}, timestamp: 123 })   === false, "isMalformed: valid payload returns false");

// assertValidPayload
let threw = false;
try { assertValidPayload(null); } catch { threw = true; }
assert(threw, "assertValidPayload: throws on null");

threw = false;
try { assertValidPayload({ id: "x", data: {}, timestamp: 1 }); } catch { threw = true; }
assert(!threw, "assertValidPayload: does not throw on valid payload");

// isCat / makeSound
const cat: Animal = { meow: () => "meow!" };
const dog: Animal = { bark: () => "woof!" };
assert(isCat(cat)         === true,   "isCat: true for cat");
assert(isCat(dog)         === false,  "isCat: false for dog");
assert(makeSound(cat)     === "meow!","makeSound: cat says meow");
assert(makeSound(dog)     === "woof!","makeSound: dog says woof");

export {};
