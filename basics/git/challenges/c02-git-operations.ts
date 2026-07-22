// ═══════════════════════════════════════════════════════════
// CHALLENGE C02: BRANCH OPERATIONS & RESCUE  (Git track)
// Run: npm run challenge:02  |  Time target: 30–40 min
// ═══════════════════════════════════════════════════════════
// PROJECT: Model the LOGIC of everyday branch operations as pure
//          functions — no real git repo required:
//            1. compute ahead/behind counts vs a remote
//            2. decide fast-forward / rebase / merge / up-to-date
//            3. replay an interactive-rebase plan over a commit list
//            4. decide whether a path is ignored by .gitignore patterns
//
// RULES:
//  • Delete each // TODO comment as you implement it.
//  • Do NOT rename any exported name — assertions depend on them.
//  • Everything is a pure function — no I/O, no git, no async.
//  • Run `npm run challenge:02` to check your work (all PASS = done).

// ── ASSERT HELPER (do not modify) ─────────────────────────
function assert(condition: boolean, message: string): void {
  if (!condition) { console.error(`  FAIL  ${message}`); process.exitCode = 1; }
  else            { console.log (`  PASS  ${message}`); }
}

// ══════════════════════════════════════════════════════════
// PART 1 — Ahead / behind counts
// ══════════════════════════════════════════════════════════
// `local` and `remote` are the commit ids reachable on each branch
// (they share a common merge base, so overlapping ids are the shared
// history). ahead  = commits on local not on remote (you must push).
//           behind = commits on remote not on local (you must pull).

export interface AheadBehind { ahead: number; behind: number; }

export function aheadBehind(local: string[], remote: string[]): AheadBehind {
  // TODO: ahead  = count of local ids not present in remote
  //       behind = count of remote ids not present in local
  void local; void remote;
  return { ahead: 0, behind: 0 }; // placeholder — replace
}

// ══════════════════════════════════════════════════════════
// PART 2 — Choose the integration strategy
// ══════════════════════════════════════════════════════════
// Decide how to integrate the remote into the local branch:
//   behind === 0                         → "up-to-date"
//   behind > 0 && ahead === 0            → "fast-forward"
//   behind > 0 && ahead > 0 && shared    → "merge"   (never rewrite shared history)
//   behind > 0 && ahead > 0 && !shared   → "rebase"  (private branch → linear history)

export type Strategy = "up-to-date" | "fast-forward" | "merge" | "rebase";

export function chooseIntegration(
  state: { ahead: number; behind: number; shared: boolean },
): Strategy {
  // TODO: apply the decision table above in order.
  void state;
  return "merge"; // placeholder — replace
}

// ══════════════════════════════════════════════════════════
// PART 3 — Replay an interactive-rebase plan
// ══════════════════════════════════════════════════════════
// Apply an `git rebase -i` plan to a linear list of commits (oldest
// first). Each step names one commit by id and an action:
//   pick   — keep the commit unchanged
//   reword — keep the commit, replace its message with step.message
//   drop   — remove the commit
//   squash — merge into the previous KEPT commit; combine messages as
//            `${prev.message}; ${cur.message}` (keep the previous id)
//   fixup  — merge into the previous KEPT commit; DISCARD this message
// Steps are processed in plan order (which is also the new commit order).
// Assume every step id exists exactly once and the first step is not a
// squash/fixup. Return the resulting commit list (oldest first).

export interface Commit { id: string; message: string; }
export type RebaseAction = "pick" | "reword" | "drop" | "squash" | "fixup";
export interface RebaseStep { action: RebaseAction; id: string; message?: string; }

export function applyRebasePlan(commits: Commit[], plan: RebaseStep[]): Commit[] {
  // TODO: walk the plan; look up each commit by id; build the result.
  //       pick/reword append a commit; drop skips; squash/fixup fold
  //       into the last appended commit.
  void commits; void plan;
  return []; // placeholder — replace
}

// ══════════════════════════════════════════════════════════
// PART 4 — .gitignore matching (simplified)
// ══════════════════════════════════════════════════════════
// Decide if a path is ignored. Support three pattern kinds:
//   "*.ext"   → matches any path whose basename ends with ".ext"
//   "dir/"    → matches any path inside that directory (a "dir/" segment)
//   "exact"   → matches when the full path equals the pattern
// A path is ignored if ANY pattern matches. Paths use "/" separators.

export function isIgnored(path: string, patterns: string[]): boolean {
  // TODO: classify each pattern by shape and test it against the path.
  void path; void patterns;
  return false; // placeholder — replace
}

// ── ASSERTIONS (do not modify) ────────────────────────────
console.log("\n── C02 branch operations & rescue assertions ──");

// Part 1 — ahead/behind
const ab = aheadBehind(["A", "B", "C", "D"], ["A", "B", "E"]);
assert(ab.ahead === 2, "aheadBehind: 2 local-only commits (C,D)");
assert(ab.behind === 1, "aheadBehind: 1 remote-only commit (E)");
const synced = aheadBehind(["A", "B"], ["A", "B"]);
assert(synced.ahead === 0 && synced.behind === 0, "aheadBehind: in sync → 0/0");

// Part 2 — strategy
assert(chooseIntegration({ ahead: 3, behind: 0, shared: false }) === "up-to-date",
  "strategy: nothing to pull → up-to-date");
assert(chooseIntegration({ ahead: 0, behind: 2, shared: false }) === "fast-forward",
  "strategy: only remote moved → fast-forward");
assert(chooseIntegration({ ahead: 2, behind: 2, shared: true }) === "merge",
  "strategy: diverged shared branch → merge");
assert(chooseIntegration({ ahead: 2, behind: 2, shared: false }) === "rebase",
  "strategy: diverged private branch → rebase");

// Part 3 — rebase plan
const history: Commit[] = [
  { id: "c1", message: "feat: login form" },
  { id: "c2", message: "fix typo" },
  { id: "c3", message: "WIP" },
  { id: "c4", message: "feat: validation" },
];
const result = applyRebasePlan(history, [
  { action: "pick",   id: "c1" },
  { action: "squash", id: "c2" },
  { action: "drop",   id: "c3" },
  { action: "reword", id: "c4", message: "feat: add input validation" },
]);
assert(result.length === 2, "rebase: 4 commits collapse to 2");
assert(result[0]?.message === "feat: login form; fix typo",
  "rebase: squash combines messages");
assert(result[0]?.id === "c1", "rebase: squash keeps the previous commit id");
assert(result[1]?.message === "feat: add input validation",
  "rebase: reword replaces the message");
assert(result.every((c) => c.id !== "c3"), "rebase: dropped commit is gone");

const fx = applyRebasePlan(history, [
  { action: "pick",  id: "c1" },
  { action: "fixup", id: "c2" },
]);
assert(fx.length === 1 && fx[0]?.message === "feat: login form",
  "rebase: fixup discards the folded message");

// Part 4 — gitignore
const patterns = ["*.log", "node_modules/", ".env"];
assert(isIgnored("logs/app.log", patterns) === true, "ignore: *.ext matches basename");
assert(isIgnored("node_modules/react/index.js", patterns) === true,
  "ignore: dir/ matches nested path");
assert(isIgnored(".env", patterns) === true, "ignore: exact match");
assert(isIgnored("src/index.ts", patterns) === false, "ignore: unmatched path kept");
assert(isIgnored("env.example", patterns) === false, "ignore: partial name not matched");

export {};
