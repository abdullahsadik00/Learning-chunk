// ═══════════════════════════════════════════════════════════
// CHALLENGE C18: CI/CD PIPELINES  (Day 53)
// Run: npm run challenge:18  |  Time target: 30–40 min
// ═══════════════════════════════════════════════════════════
// PROJECT: Build the scheduler behind a CI pipeline — group jobs into
//          the stages that can run in parallel based on their `needs`
//          dependencies, and detect dependency cycles.
//
// RULES:
//  • Delete each // TODO comment as you implement it.
//  • Do NOT rename any exported name — assertions depend on them.
//  • Run `npm run challenge:18` to check your work (all PASS = done).

// ── ASSERT HELPER (do not modify) ─────────────────────────
function assert(condition: boolean, message: string): void {
  if (!condition) { console.error(`  FAIL  ${message}`); process.exitCode = 1; }
  else            { console.log (`  PASS  ${message}`); }
}

export interface Job { name: string; needs: string[]; }

// ══════════════════════════════════════════════════════════
// PART 1 — Cycle detection
// ══════════════════════════════════════════════════════════
// Return true if the job graph contains a dependency cycle.

export function hasCycle(jobs: Job[]): boolean {
  // TODO: DFS with a "visiting" set (gray/black colors), OR reuse
  //       parallelStages below and report a cycle when not all jobs
  //       can be placed into stages.
  void jobs;
  return false; // placeholder — replace
}

// ══════════════════════════════════════════════════════════
// PART 2 — Parallel stage grouping
// ══════════════════════════════════════════════════════════
// Stage 0 = jobs with no needs. Stage k = jobs whose needs are ALL
// satisfied by earlier stages. Sort names alphabetically WITHIN each
// stage for a deterministic result. Return null if there is a cycle
// (i.e. some jobs can never be placed).

export function parallelStages(jobs: Job[]): string[][] | null {
  // TODO: repeatedly collect jobs whose needs ⊆ already-placed names.
  //       If a round places nothing but jobs remain → cycle → null.
  void jobs;
  return null; // placeholder — replace
}

// ── ASSERTIONS (do not modify) ────────────────────────────
console.log("\n── C18 CI/CD pipelines assertions ──");

const jobs: Job[] = [
  { name: "lint", needs: [] },
  { name: "test", needs: ["lint"] },
  { name: "build", needs: ["lint"] },
  { name: "deploy", needs: ["test", "build"] },
];

assert(hasCycle(jobs) === false, "cycle: acyclic graph reports no cycle");

const stages = parallelStages(jobs);
assert(stages !== null, "stages: acyclic graph produces stages");
assert(JSON.stringify(stages) === JSON.stringify([["lint"], ["build", "test"], ["deploy"]]),
  "stages: correct grouping, alphabetical within each stage");

const cyclic: Job[] = [
  { name: "a", needs: ["b"] },
  { name: "b", needs: ["a"] },
];
assert(hasCycle(cyclic) === true, "cycle: mutual dependency is detected");
assert(parallelStages(cyclic) === null, "stages: cyclic graph returns null");

export {};
