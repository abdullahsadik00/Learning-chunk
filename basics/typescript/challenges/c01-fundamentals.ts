// ═══════════════════════════════════════════════════════════
// CHALLENGE C01: FUNDAMENTALS
// Run: npm run challenge:01  |  Time target: 20–30 min
// ═══════════════════════════════════════════════════════════
// PROJECT: Build a typed environment config loader that reads
//          settings for dev / staging / production environments.
//
// RULES:
//  • Delete each // TODO comment as you implement it.
//  • Do NOT rename any exported name — assertions depend on them.
//  • You MAY add private helper functions.
//  • Run `npm run challenge:01` to check your work.

// ── ASSERT HELPER (do not modify) ─────────────────────────
function assert(condition: boolean, message: string): void {
  if (!condition) { console.error(`  FAIL  ${message}`); process.exitCode = 1; }
  else            { console.log (`  PASS  ${message}`); }
}

// ══════════════════════════════════════════════════════════
// PART 1 — Literal union from a const array
// ══════════════════════════════════════════════════════════

// TODO: Annotate ENVIRONMENTS with `as const` so it produces
//       a readonly tuple of string literals, not string[].
const ENVIRONMENTS = ["development", "staging", "production"];

// TODO: Derive Environment from ENVIRONMENTS so it equals
//       "development" | "staging" | "production".
//       Hint: typeof ENVIRONMENTS[number]
type Environment = string; // replace this

// ══════════════════════════════════════════════════════════
// PART 2 — Typed interface with optional fields
// ══════════════════════════════════════════════════════════

// TODO: Fill in the types for each field.
//   host       — string
//   port       — number
//   env        — Environment (use the type you derived above)
//   debug      — boolean
//   apiKey     — string or undefined (optional field)
//   maxRetries — number, defaults to 3 if not provided (optional field)
interface AppConfig {
  host: string;         // already done — keep it
  port: number;         // already done — keep it
  // TODO: add env, debug, apiKey?, maxRetries?
}

// ══════════════════════════════════════════════════════════
// PART 3 — Narrowing `unknown`
// ══════════════════════════════════════════════════════════

// parsePort receives raw input from process.env — it could be
// anything. Narrow it safely and return a number.
//
// Rules:
//   • If raw is already a number, return it directly.
//   • If raw is a string, parse it with parseInt and return the number.
//   • Otherwise throw new Error("Invalid port").
export function parsePort(raw: unknown): number {
  // TODO: implement
  // Hint: typeof raw === "number" | "string" — narrow it, then parse/return
  void raw;
  return 0; // placeholder — replace with real implementation
}

// ══════════════════════════════════════════════════════════
// PART 4 — Working with the interface
// ══════════════════════════════════════════════════════════

// Return a one-line summary string in this exact format:
//   "[env] host:port (debug: true/false)"
// Example: "[production] api.example.com:443 (debug: false)"
export function getConfigSummary(config: AppConfig): string {
  // TODO: implement
  return "";
}

// ══════════════════════════════════════════════════════════
// PART 5 — Exhaustive switch with `never`
// ══════════════════════════════════════════════════════════

// Return the default request timeout (ms) for each environment:
//   development → 10000
//   staging     → 5000
//   production  → 3000
//
// The default branch must use a never-check so TypeScript
// will error if a new environment is added but not handled here.
export function getDefaultTimeout(env: Environment): number {
  // TODO: implement with a switch statement
  // Hint for the default branch:
  //   const _exhaustive: never = env;
  //   throw new Error(`Unhandled environment: ${_exhaustive}`);
  return -1;
}

// ══════════════════════════════════════════════════════════
// PART 6 — Putting it together
// ══════════════════════════════════════════════════════════

// Build a config object that satisfies AppConfig, then call
// getConfigSummary and getDefaultTimeout with it.
// No TODO here — just make sure the types all check out.
const myConfig: AppConfig = {
  host: "localhost",
  port: 3000,
  // TODO: add the remaining required fields
} as AppConfig; // remove the cast once you've added all fields

// ── ASSERTIONS (do not modify) ────────────────────────────
console.log("\n── C01 Fundamentals assertions ──");

// parsePort
assert(parsePort(8080) === 8080,           "parsePort: number input returns same number");
assert(parsePort("3000") === 3000,         "parsePort: string '3000' returns 3000");
assert(parsePort("443") === 443,           "parsePort: string '443' returns 443");

let threw = false;
try { parsePort(null); } catch { threw = true; }
assert(threw, "parsePort: null throws an error");

threw = false;
try { parsePort(undefined); } catch { threw = true; }
assert(threw, "parsePort: undefined throws an error");

// getConfigSummary
const cfg: AppConfig = {
  host: "api.example.com",
  port: 443,
  env: "production",
  debug: false,
} as AppConfig;
const summary = getConfigSummary(cfg);
assert(summary.includes("api.example.com"),  "getConfigSummary: contains host");
assert(summary.includes("443"),              "getConfigSummary: contains port");
assert(summary.includes("production"),       "getConfigSummary: contains env");
assert(summary.includes("false"),            "getConfigSummary: contains debug flag");

// getDefaultTimeout
assert(getDefaultTimeout("development") === 10000, "getDefaultTimeout: development is 10000");
assert(getDefaultTimeout("staging")     === 5000,  "getDefaultTimeout: staging is 5000");
assert(getDefaultTimeout("production")  === 3000,  "getDefaultTimeout: production is 3000");
assert(getDefaultTimeout("development") > getDefaultTimeout("production"),
  "getDefaultTimeout: dev timeout > prod timeout");

export {};
