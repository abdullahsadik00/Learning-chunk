// ═══════════════════════════════════════════════════════════
// CHALLENGE C01: FLEXBOX LAYOUT MATH  (Day 26)
// Run: npm run challenge:01  |  Time target: 25–35 min
// ═══════════════════════════════════════════════════════════
// PROJECT: Build the pure-logic kernel a browser runs when it lays
//          out a flex row. No DOM — just the geometry:
//            1. main-axis distribution for every justify-content mode
//            2. the flex-grow free-space distributor
//          Get these right and you understand what the browser is
//          actually doing when boxes "space out".
//
// RULES:
//  • Delete each // TODO comment as you implement it.
//  • Do NOT rename any exported name — assertions depend on them.
//  • You MAY add private helper functions.
//  • Floating-point results are checked with a tolerance helper.
//  • Run `npm run challenge:01` to check your work (all PASS = done).

// ── ASSERT HELPERS (do not modify) ────────────────────────
function assert(condition: boolean, message: string): void {
  if (!condition) { console.error(`  FAIL  ${message}`); process.exitCode = 1; }
  else            { console.log (`  PASS  ${message}`); }
}
function approx(a: number | undefined, b: number, tol = 1e-6): boolean {
  return a !== undefined && Math.abs(a - b) < tol;
}
function approxArr(a: number[] | undefined, b: number[], tol = 1e-6): boolean {
  if (!a || a.length !== b.length) return false;
  return a.every((v, i) => Math.abs(v - b[i]) < tol);
}

// ══════════════════════════════════════════════════════════
// PART 1 — Main-axis distribution (justify-content)
// ══════════════════════════════════════════════════════════
// Given the container's main-axis size, the main-axis size of each
// item (in order), and a justify-content mode, return the START
// offset of each item along the main axis.
//
//   freeSpace = containerSize - sum(itemSizes)
//
//   flex-start   : items packed at 0, no gaps.
//   flex-end     : items packed together, pushed to the far end
//                  (first item starts at freeSpace).
//   center       : items packed together, centered (first item
//                  starts at freeSpace / 2).
//   space-between: first item at 0, last item flush to the end,
//                  equal gap = freeSpace / (n - 1) between items.
//                  (If n === 1, offset is [0].)
//   space-around : each item gets equal space on BOTH sides;
//                  gap between items = freeSpace / n, and the
//                  leading/trailing margin is half that.
//   space-evenly : equal gaps everywhere including the two ends;
//                  gap = freeSpace / (n + 1).
//
// Assume items never overflow (freeSpace >= 0).

export type JustifyContent =
  | "flex-start" | "flex-end" | "center"
  | "space-between" | "space-around" | "space-evenly";

export function distributeMainAxis(
  containerSize: number,
  itemSizes: number[],
  justify: JustifyContent,
): number[] {
  // TODO: compute freeSpace, then walk the items accumulating each
  //       item's start offset according to the justify mode above.
  //       Return one offset per item, in order.
  void containerSize; void itemSizes; void justify;
  return []; // placeholder — replace
}

// ══════════════════════════════════════════════════════════
// PART 2 — flex-grow free-space distributor
// ══════════════════════════════════════════════════════════
// Each item has a flex-basis (its starting main size) and a
// flex-grow factor. The leftover free space is shared out in
// proportion to the grow factors and ADDED to each basis.
//
//   freeSpace = containerSize - sum(basis)
//   totalGrow = sum(grow)
//   if totalGrow === 0 → nothing grows, final size = basis.
//   else each item's final size = basis + freeSpace * (grow / totalGrow)
//
// Return the final main-axis size of each item, in order.

export interface FlexItem {
  basis: number;
  grow: number;
}

export function flexGrow(containerSize: number, items: FlexItem[]): number[] {
  // TODO: sum the bases, compute freeSpace and totalGrow, then map
  //       each item to its final size. Handle totalGrow === 0.
  void containerSize; void items;
  return []; // placeholder — replace
}

// ── ASSERTIONS (do not modify) ────────────────────────────
console.log("\n── C01 flexbox layout math assertions ──");

// container 300, three 50px items → freeSpace 150
const items3 = [50, 50, 50];
assert(approxArr(distributeMainAxis(300, items3, "flex-start"), [0, 50, 100]),
  "flex-start: items packed at the start");
assert(approxArr(distributeMainAxis(300, items3, "flex-end"), [150, 200, 250]),
  "flex-end: items packed at the end");
assert(approxArr(distributeMainAxis(300, items3, "center"), [75, 125, 175]),
  "center: items centered (freeSpace/2 lead)");
assert(approxArr(distributeMainAxis(300, items3, "space-between"), [0, 125, 250]),
  "space-between: ends flush, gap = 75");
assert(approxArr(distributeMainAxis(300, items3, "space-around"), [25, 125, 225]),
  "space-around: half-gap ends (25), gap 50");
assert(approxArr(distributeMainAxis(300, items3, "space-evenly"), [37.5, 125, 212.5]),
  "space-evenly: equal 37.5 gaps everywhere");
assert(approxArr(distributeMainAxis(200, [50], "space-between"), [0]),
  "space-between: single item sits at 0");

// flex-grow: basis 100+100, container 400 → 200 free split 1:3
const grown = flexGrow(400, [{ basis: 100, grow: 1 }, { basis: 100, grow: 3 }]);
assert(approx(grown[0], 150), "flex-grow: item0 gets 1/4 of 200 free → 150");
assert(approx(grown[1], 250), "flex-grow: item1 gets 3/4 of 200 free → 250");
const noGrow = flexGrow(400, [{ basis: 100, grow: 0 }, { basis: 100, grow: 0 }]);
assert(approxArr(noGrow, [100, 100]), "flex-grow: totalGrow 0 keeps bases unchanged");
const filled = flexGrow(300, [{ basis: 0, grow: 1 }, { basis: 0, grow: 1 }, { basis: 0, grow: 1 }]);
assert(approxArr(filled, [100, 100, 100]), "flex-grow: equal grow from zero basis splits evenly");

export {};
