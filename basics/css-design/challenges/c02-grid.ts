// ═══════════════════════════════════════════════════════════
// CHALLENGE C02: CSS GRID TRACK SIZING  (Day 26 — grid)
// Run: npm run challenge:02  |  Time target: 25–35 min
// ═══════════════════════════════════════════════════════════
// PROJECT: Implement the grid track-sizing algorithm the browser
//          runs for `grid-template-columns`. Parse a template of
//          fixed px tracks and `fr` (fraction) tracks, subtract
//          the fixed sizes and the inter-track gaps, then hand the
//          remaining space out to the fr tracks by weight. Then
//          resolve row-major auto-placement of an item index.
//
// RULES:
//  • Delete each // TODO comment as you implement it.
//  • Do NOT rename any exported name — assertions depend on them.
//  • You MAY add private helper functions.
//  • Floating-point results are checked with a tolerance helper.
//  • Run `npm run challenge:02` to check your work (all PASS = done).

// ── ASSERT HELPERS (do not modify) ────────────────────────
function assert(condition: boolean, message: string): void {
  if (!condition) { console.error(`  FAIL  ${message}`); process.exitCode = 1; }
  else            { console.log (`  PASS  ${message}`); }
}
function approxArr(a: number[] | undefined, b: number[], tol = 1e-6): boolean {
  if (!a || a.length !== b.length) return false;
  return a.every((v, i) => Math.abs(v - b[i]) < tol);
}

// ══════════════════════════════════════════════════════════
// PART 1 — Parse a track template into tokens
// ══════════════════════════════════════════════════════════
// Split a `grid-template-columns` value into typed tokens. Support
// two forms only:
//   "200px"  → { kind: "px", value: 200 }
//   "1fr"    → { kind: "fr", value: 1 }   ("fr" alone means 1fr)
// Tokens are whitespace-separated. Ignore extra spaces.

export type Track =
  | { kind: "px"; value: number }
  | { kind: "fr"; value: number };

export function parseTemplate(template: string): Track[] {
  // TODO: trim, split on whitespace, and map each token:
  //       ends with "px" → px track; ends with "fr" → fr track
  //       (bare "fr" === "1fr"). Parse the leading number.
  void template;
  return []; // placeholder — replace
}

// ══════════════════════════════════════════════════════════
// PART 2 — Resolve tracks to pixel widths
// ══════════════════════════════════════════════════════════
// Given the parsed tracks, the container width, and the gap between
// adjacent tracks, return the resolved pixel width of each track.
//
//   totalGap  = gap * (trackCount - 1)   (0 when a single track)
//   fixed     = sum of px track values
//   freeSpace = containerWidth - fixed - totalGap
//   frUnit    = freeSpace / sum(fr values)   (0 if no fr tracks)
//   px track  → its own value
//   fr track  → value * frUnit
//
// Return widths in track order.

export function resolveTracks(
  template: string,
  containerWidth: number,
  gap: number,
): number[] {
  // TODO: parse the template, compute totalGap / fixed / freeSpace /
  //       frUnit, then map each track to its pixel width.
  void template; void containerWidth; void gap;
  return []; // placeholder — replace
}

// ══════════════════════════════════════════════════════════
// PART 3 — Auto-placement (row-major)
// ══════════════════════════════════════════════════════════
// With `grid-auto-flow: row` and a fixed column count, items fill
// left-to-right, top-to-bottom. Given a 0-based item index and the
// column count, return its 1-based { row, column } (CSS grid lines
// are 1-based).
//
//   row    = floor(index / columns) + 1
//   column = (index % columns) + 1

export interface GridCell {
  row: number;
  column: number;
}

export function placeItem(index: number, columns: number): GridCell {
  // TODO: compute row / column with the formulas above.
  void index; void columns;
  return { row: 0, column: 0 }; // placeholder — replace
}

// ── ASSERTIONS (do not modify) ────────────────────────────
console.log("\n── C02 grid track sizing assertions ──");

const parsed = parseTemplate("200px 1fr 2fr");
assert(parsed.length === 3, "parseTemplate: 3 tokens");
assert(parsed[0]?.kind === "px" && parsed[0]?.value === 200, "parseTemplate: 200px → px 200");
assert(parsed[1]?.kind === "fr" && parsed[1]?.value === 1, "parseTemplate: 1fr → fr 1");
assert(parsed[2]?.kind === "fr" && parsed[2]?.value === 2, "parseTemplate: 2fr → fr 2");
const bare = parseTemplate("fr");
assert(bare[0]?.kind === "fr" && bare[0]?.value === 1, "parseTemplate: bare 'fr' means 1fr");

// container 1000, gap 20, template "200px 1fr 2fr"
// totalGap = 40, fixed = 200, free = 760, frUnit = 760/3
assert(approxArr(resolveTracks("200px 1fr 2fr", 1000, 20),
  [200, 760 / 3, (760 / 3) * 2]),
  "resolveTracks: fixed reserved first, fr splits the rest");
// three equal fr, no gap, 900 wide → 300 each
assert(approxArr(resolveTracks("1fr 1fr 1fr", 900, 0), [300, 300, 300]),
  "resolveTracks: three equal fr → 300 each");
// all fixed, no fr
assert(approxArr(resolveTracks("100px 100px", 500, 50), [100, 100]),
  "resolveTracks: all-fixed tracks keep their px values");
// single fr track fills remaining after gap-less fixed
assert(approxArr(resolveTracks("100px 1fr", 400, 0), [100, 300]),
  "resolveTracks: single fr fills the remainder");

const c = placeItem(7, 3);
assert(c.row === 3 && c.column === 2, "placeItem: index 7 in 3 cols → row 3, col 2");
const first = placeItem(0, 4);
assert(first.row === 1 && first.column === 1, "placeItem: index 0 → row 1, col 1");
const edge = placeItem(3, 4);
assert(edge.row === 1 && edge.column === 4, "placeItem: index 3 in 4 cols → row 1, col 4");

export {};
