// ═══════════════════════════════════════════════════════════
// CHALLENGE C02: TYPE SYSTEM
// Run: npm run challenge:02  |  Time target: 25–35 min
// ═══════════════════════════════════════════════════════════
// PROJECT: Type the request/response shapes for a product
//          catalog API — categories, sorting, filtering, results.
//
// RULES:
//  • Delete each // TODO comment as you implement it.
//  • Do NOT rename any exported name — assertions depend on them.
//  • You MAY add helper types.
//  • Run `npm run challenge:02` to check your work.

// ── ASSERT HELPER (do not modify) ─────────────────────────
function assert(condition: boolean, message: string): void {
  if (!condition) { console.error(`  FAIL  ${message}`); process.exitCode = 1; }
  else            { console.log (`  PASS  ${message}`); }
}

// ══════════════════════════════════════════════════════════
// PART 1 — Base mixins (intersection types)
// ══════════════════════════════════════════════════════════

// These two interfaces are given — do not change them.
interface Identifiable { id: string }
interface Timestamped  { createdAt: Date; updatedAt: Date }

// TODO: Define `Entity` as the intersection of Identifiable & Timestamped.
//       Every database record in this app extends Entity.
export type Entity = unknown; // replace `unknown` with the intersection

// ══════════════════════════════════════════════════════════
// PART 2 — Union types and literal types
// ══════════════════════════════════════════════════════════

// TODO: Define Category as a union of string literals:
//       "electronics" | "clothing" | "books" | "home" | "sports"
export type Category = string; // replace with the union

// TODO: Define PriceRange as a union of literal number pairs.
//       Use a tuple: [min: number, max: number]
//       Then define PriceRange as the tuple type — not a union, just the pair.
export type PriceRange = unknown; // replace with [number, number]

// ══════════════════════════════════════════════════════════
// PART 3 — Interface for a Product (extends Entity)
// ══════════════════════════════════════════════════════════

// TODO: Define the Product interface. It must:
//  • extend Entity (so it gets id, createdAt, updatedAt)
//  • have: name (string), price (number), category (Category),
//          inStock (boolean), tags (string array), rating (number, optional)
export interface Product extends Entity {
  // TODO: add fields here
}

// ══════════════════════════════════════════════════════════
// PART 4 — Discriminated union for API responses
// ══════════════════════════════════════════════════════════

// TODO: Define ApiResponse<T> as a discriminated union:
//   Success branch: { status: "success"; data: T; total: number }
//   Error branch:   { status: "error";   message: string; code: number }
//
// Use `type`, not `interface` — this is a union, not a shape to extend.
export type ApiResponse<T> = unknown; // replace with the discriminated union

// ══════════════════════════════════════════════════════════
// PART 5 — Template literal type
// ══════════════════════════════════════════════════════════

// These two const arrays are given — do not change them.
const SORT_FIELDS  = ["name", "price", "rating", "createdAt"] as const;
const SORT_ORDERS  = ["asc", "desc"] as const;

type SortField = typeof SORT_FIELDS[number];
type SortOrder = typeof SORT_ORDERS[number];

// TODO: Define SortKey as a template literal type that combines
//       every SortField with every SortOrder, separated by "_".
//       Result: "name_asc" | "name_desc" | "price_asc" | "price_desc" | ...
export type SortKey = string; // replace with the template literal type

// ══════════════════════════════════════════════════════════
// PART 6 — Interface declaration merging
// ══════════════════════════════════════════════════════════

// First declaration — given, do not modify.
interface SearchFilters {
  category?: Category;
  priceRange?: PriceRange;
  inStock?: boolean;
  query?: string;
}

// TODO: Write a SECOND declaration of SearchFilters (same name, new block)
//       that adds: sortBy (SortKey, optional) and limit (number, optional).
//       TypeScript merges both declarations into one type automatically.
// interface SearchFilters { ... }

// ══════════════════════════════════════════════════════════
// PART 7 — Consuming the types
// ══════════════════════════════════════════════════════════

// Return a human-readable string describing the response:
//   Success: "Found <total> products"
//   Error:   "Error <code>: <message>"
export function handleProductResponse(res: ApiResponse<Product[]>): string {
  // TODO: implement — use the `status` discriminant to narrow the union
  return "";
}

// ── ASSERTIONS (do not modify) ────────────────────────────
console.log("\n── C02 Type System assertions ──");

// Entity intersection check
const _entityCheck: Entity = {
  id: "1",
  createdAt: new Date(),
  updatedAt: new Date(),
};
assert(typeof _entityCheck.id === "string",         "Entity: has id from Identifiable");
assert(_entityCheck.createdAt instanceof Date,      "Entity: has createdAt from Timestamped");

// Category is one of the known literals
const cat: Category = "electronics";
assert(cat === "electronics", "Category: literal value accepted");

// SortKey includes expected combinations
const sk1: SortKey = "price_desc";
const sk2: SortKey = "name_asc";
assert(sk1 === "price_desc", "SortKey: price_desc is valid");
assert(sk2 === "name_asc",   "SortKey: name_asc is valid");

// @ts-expect-error — "price_random" is not a valid SortKey
const _badKey: SortKey = "price_random";

// SearchFilters merging
const filters: SearchFilters = {
  category: "books",
  sortBy: "rating_desc",  // added by second declaration
  limit: 10,              // added by second declaration
};
assert(filters.category === "books",       "SearchFilters: category from first declaration");
assert(filters.sortBy   === "rating_desc", "SearchFilters: sortBy from merged declaration");
assert(filters.limit    === 10,            "SearchFilters: limit from merged declaration");

// handleProductResponse
const success: ApiResponse<Product[]> = {
  status: "success",
  data: [],
  total: 42,
};
const error: ApiResponse<Product[]> = {
  status: "error",
  message: "Not found",
  code: 404,
};
const successStr = handleProductResponse(success);
const errorStr   = handleProductResponse(error);
assert(successStr.includes("42"),        "handleProductResponse: success includes total");
assert(successStr.includes("Found"),     "handleProductResponse: success says Found");
assert(errorStr.includes("404"),         "handleProductResponse: error includes code");
assert(errorStr.includes("Not found"),   "handleProductResponse: error includes message");

export {};
