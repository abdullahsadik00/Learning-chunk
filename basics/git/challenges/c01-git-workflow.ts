// ═══════════════════════════════════════════════════════════
// CHALLENGE C01: COMMIT HYGIENE & VERSIONING  (Git track)
// Run: npm run challenge:01  |  Time target: 30–40 min
// ═══════════════════════════════════════════════════════════
// PROJECT: Model the LOGIC behind Conventional Commits and
//          semantic-release. Three pure functions, no real git repo:
//            1. parse a commit message into its structured parts
//            2. validate a message against the Conventional Commits spec
//            3. bump a semver version from a range of commit types
//
// RULES:
//  • Delete each // TODO comment as you implement it.
//  • Do NOT rename any exported name — assertions depend on them.
//  • Everything is a pure function — no I/O, no git, no async.
//  • Run `npm run challenge:01` to check your work (all PASS = done).

// ── ASSERT HELPER (do not modify) ─────────────────────────
function assert(condition: boolean, message: string): void {
  if (!condition) { console.error(`  FAIL  ${message}`); process.exitCode = 1; }
  else            { console.log (`  PASS  ${message}`); }
}

// The nine Conventional Commit types recognised by semantic-release.
export const KNOWN_TYPES = [
  "feat", "fix", "docs", "style", "refactor",
  "test", "chore", "perf", "ci", "revert",
] as const;

export interface ParsedCommit {
  type: string;
  scope?: string;
  subject: string;
  breaking: boolean;
}

// ══════════════════════════════════════════════════════════
// PART 1 — Parse a Conventional Commit header
// ══════════════════════════════════════════════════════════
// Header grammar:  <type>[(scope)][!]: <subject>
//   feat: add login                     → { type:"feat", subject:"add login", breaking:false }
//   fix(cart): stop double charge       → { ..., scope:"cart" }
//   feat(auth)!: drop session login     → { ..., breaking:true }
//   feat!: redesign API                 → breaking, no scope
// Parse ONLY the first line (header). Return null if the header does
// not match the grammar at all (no colon, empty subject, etc).

export function parseConventionalCommit(message: string): ParsedCommit | null {
  // TODO: take the first line, match /^(\w+)(\(([^)]+)\))?(!)?: (.+)$/
  //       and map the capture groups onto the ParsedCommit shape.
  //       Return null when the header does not match.
  void message;
  return null; // placeholder — replace
}

// ══════════════════════════════════════════════════════════
// PART 2 — Validate against the spec
// ══════════════════════════════════════════════════════════
// Return an array of human-readable error strings. Empty array = valid.
// Report (independently — collect ALL that apply):
//   • "invalid format"      → header does not parse at all
//   • "unknown type: <t>"   → type is not in KNOWN_TYPES
//   • "empty subject"       → subject is missing/blank after trimming
//   • "subject too long"    → subject longer than 72 characters
//   • "subject not lowercase" → subject's first letter is uppercase
// If the format is invalid, return just ["invalid format"] (the other
// checks cannot run without a parsed header).

export function validateConventionalCommit(message: string): string[] {
  // TODO: parse first; if null → ["invalid format"]. Otherwise push
  //       one error per failed rule and return the collected list.
  void message;
  return []; // placeholder — replace
}

// ══════════════════════════════════════════════════════════
// PART 3 — Bump a semver version from a commit range
// ══════════════════════════════════════════════════════════
// Given the current version ("MAJOR.MINOR.PATCH") and the commits that
// landed since the last release, compute the next version.
// Priority (highest wins):
//   breaking (any commit with breaking:true) → MAJOR bump  (x+1.0.0)
//   feat                                     → MINOR bump  (x.y+1.0)
//   fix                                      → PATCH bump  (x.y.z+1)
//   anything else only (docs/chore/…)        → NO bump (return current)
// A MAJOR bump zeroes minor & patch; a MINOR bump zeroes patch.

export function bumpVersion(
  current: string,
  commits: ReadonlyArray<{ type: string; breaking: boolean }>,
): string {
  // TODO: split current into [major, minor, patch] numbers, scan commits
  //       for the highest-priority change, and return the bumped string.
  void current; void commits;
  return "0.0.0"; // placeholder — replace
}

// ── ASSERTIONS (do not modify) ────────────────────────────
console.log("\n── C01 commit hygiene & versioning assertions ──");

// Part 1 — parsing
const p1 = parseConventionalCommit("feat: add login");
assert(p1?.type === "feat", "parse: type extracted");
assert(p1?.subject === "add login", "parse: subject extracted");
assert(p1?.breaking === false, "parse: not breaking by default");
assert(p1?.scope === undefined, "parse: no scope when absent");

const p2 = parseConventionalCommit("fix(cart): stop double charge");
assert(p2?.scope === "cart", "parse: scope extracted from parens");
assert(p2?.type === "fix", "parse: type with scope");

const p3 = parseConventionalCommit("feat(auth)!: drop session login");
assert(p3?.breaking === true, "parse: ! before colon marks breaking");
assert(p3?.scope === "auth", "parse: scope + breaking together");

const p4 = parseConventionalCommit("feat!: redesign API");
assert(p4?.breaking === true, "parse: breaking without scope");

assert(parseConventionalCommit("just some text") === null, "parse: no colon → null");
assert(parseConventionalCommit("feat: ") === null, "parse: empty subject → null");

// Part 2 — validation
assert(validateConventionalCommit("feat(auth): add oauth login").length === 0,
  "validate: well-formed message has no errors");
assert(validateConventionalCommit("random text").join() === "invalid format",
  "validate: unparseable → single 'invalid format'");
assert(validateConventionalCommit("wibble: do a thing").includes("unknown type: wibble"),
  "validate: unknown type reported");
assert(validateConventionalCommit("feat: Add login").includes("subject not lowercase"),
  "validate: uppercase subject reported");
const long = "feat: " + "x".repeat(80);
assert(validateConventionalCommit(long).includes("subject too long"),
  "validate: >72 char subject reported");

// Part 3 — version bump
assert(bumpVersion("1.4.2", [{ type: "fix", breaking: false }]) === "1.4.3",
  "bump: fix → patch");
assert(bumpVersion("1.4.2", [{ type: "feat", breaking: false }]) === "1.5.0",
  "bump: feat → minor, patch zeroed");
assert(bumpVersion("1.4.2", [{ type: "feat", breaking: true }]) === "2.0.0",
  "bump: breaking → major, minor+patch zeroed");
assert(
  bumpVersion("1.4.2", [
    { type: "fix", breaking: false },
    { type: "feat", breaking: false },
  ]) === "1.5.0",
  "bump: highest priority (feat) wins over fix",
);
assert(bumpVersion("1.4.2", [{ type: "docs", breaking: false }]) === "1.4.2",
  "bump: docs-only → no change");

export {};
