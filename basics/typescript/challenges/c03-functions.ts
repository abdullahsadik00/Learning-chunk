// ═══════════════════════════════════════════════════════════
// CHALLENGE C03: FUNCTIONS
// Run: npm run challenge:03  |  Time target: 25–35 min
// ═══════════════════════════════════════════════════════════
// PROJECT: Build a CSV report generator with typed formatters,
//          overloaded format functions, and generic sort.
//
// RULES:
//  • Delete each // TODO comment as you implement it.
//  • Do NOT rename any exported name — assertions depend on them.
//  • You MAY add helper functions.
//  • Run `npm run challenge:03` to check your work.

// ── ASSERT HELPER (do not modify) ─────────────────────────
function assert(condition: boolean, message: string): void {
  if (!condition) { console.error(`  FAIL  ${message}`); process.exitCode = 1; }
  else            { console.log (`  PASS  ${message}`); }
}

// ══════════════════════════════════════════════════════════
// PART 1 — Function overloads
// ══════════════════════════════════════════════════════════

// `format` converts a value to a display string for a CSV cell.
// It behaves differently based on the input type:
//   • number → format as currency "$XX.XX" (e.g. 99.5 → "$99.50")
//   • Date   → format as ISO date string "YYYY-MM-DD" (e.g. "2024-01-15")
//   • string → trim and lowercase (e.g. "  HELLO  " → "hello")
//
// Write the THREE overload signatures, then the single implementation.
// The implementation signature should use a union type — it is NOT callable directly.

// TODO: write overload signature for number
// TODO: write overload signature for Date
// TODO: write overload signature for string
export function format(value: number | Date | string): string {
  // TODO: implement all three branches
  return "";
}

// ══════════════════════════════════════════════════════════
// PART 2 — Rest parameters
// ══════════════════════════════════════════════════════════

// buildRow joins any number of cell strings with a comma separator.
// Example: buildRow("Alice", "30", "Engineer") → "Alice,30,Engineer"
export function buildRow(...cells: string[]): string {
  // TODO: implement
  return "";
}

// ══════════════════════════════════════════════════════════
// PART 3 — Function type alias
// ══════════════════════════════════════════════════════════

// TODO: Define RowTransformer as a function type that:
//   • takes a row: string[] parameter
//   • returns string
export type RowTransformer = unknown; // replace with function type

// ══════════════════════════════════════════════════════════
// PART 4 — Higher-order function
// ══════════════════════════════════════════════════════════

// createFormatter takes a RowTransformer and returns a new function
// that applies the transformer to a row and appends a newline "\n".
//
// Example:
//   const csvRow = createFormatter(cells => cells.join(","));
//   csvRow(["a", "b"]) // → "a,b\n"
export function createFormatter(transform: RowTransformer): (row: string[]) => string {
  // TODO: implement
  return (_row) => "";
}

// ══════════════════════════════════════════════════════════
// PART 5 — Generic constraint: keyof
// ══════════════════════════════════════════════════════════

// sortBy sorts an array of objects by the value at a given key.
// The key K must actually exist on T — enforce this with a constraint.
//
// Example:
//   sortBy([{name:"Bob"},{name:"Alice"}], "name")
//   → [{name:"Alice"},{name:"Bob"}]
export function sortBy<T, K extends keyof T>(rows: T[], key: K): T[] {
  // TODO: implement (return a new sorted array, don't mutate)
  return [];
}

// ══════════════════════════════════════════════════════════
// PART 6 — Optional parameter with default behaviour
// ══════════════════════════════════════════════════════════

// buildHeader creates a header row string from column names.
//   • separator defaults to "," if not provided
//   • Each name is uppercased
// Example: buildHeader(["name","age"]) → "NAME,AGE"
// Example: buildHeader(["name","age"], "|") → "NAME|AGE"
export function buildHeader(columns: string[], separator?: string): string {
  // TODO: implement
  return "";
}

// ── ASSERTIONS (do not modify) ────────────────────────────
console.log("\n── C03 Functions assertions ──");

// format overloads
assert(format(99.5)  === "$99.50",     "format: number → currency string");
assert(format(0)     === "$0.00",      "format: zero → $0.00");
assert(format(new Date("2024-01-15")) === "2024-01-15", "format: Date → ISO date string");
assert(format("  HELLO  ") === "hello", "format: string → trimmed lowercase");
assert(format("  TypeScript  ") === "typescript", "format: mixed case string");

// buildRow
assert(buildRow("Alice", "30", "Engineer") === "Alice,30,Engineer", "buildRow: three cells");
assert(buildRow("x") === "x",                                        "buildRow: single cell");
assert(buildRow() === "",                                             "buildRow: no cells → empty string");

// createFormatter
const csvFormatter = createFormatter((cells) => cells.join(","));
assert(csvFormatter(["a", "b", "c"]) === "a,b,c\n", "createFormatter: joins and appends newline");

const pipeFormatter = createFormatter((cells) => cells.join("|"));
assert(pipeFormatter(["x", "y"]) === "x|y\n", "createFormatter: pipe separator");

// sortBy
const people = [{ name: "Charlie" }, { name: "Alice" }, { name: "Bob" }];
const sorted = sortBy(people, "name");
assert(sorted.length === 3 && sorted[0].name === "Alice",   "sortBy: first element after sort");
assert(sorted.length === 3 && sorted[2].name === "Charlie", "sortBy: last element after sort");
assert(people[0].name === "Charlie", "sortBy: original array not mutated");

const nums = [{ val: 30 }, { val: 10 }, { val: 20 }];
const sortedNums = sortBy(nums, "val");
assert(sortedNums.length === 3 && sortedNums[0].val === 10, "sortBy: numeric sort");

// buildHeader
assert(buildHeader(["name", "age", "role"]) === "NAME,AGE,ROLE", "buildHeader: default separator");
assert(buildHeader(["name", "age"], "|")    === "NAME|AGE",      "buildHeader: custom separator");
assert(buildHeader(["x"])                   === "X",             "buildHeader: single column");

export {};
