// ═══════════════════════════════════════════════════════════
// CHALLENGE C14: EMAIL · FILE STORAGE  (Day 49)
// Run: npm run challenge:14  |  Time target: 25–35 min
// ═══════════════════════════════════════════════════════════
// PROJECT: Implement the glue around transactional email and object
//          storage — a {{mustache}} template renderer, an S3 object-key
//          builder, and content-type inference from a filename.
//
// RULES:
//  • Delete each // TODO comment as you implement it.
//  • Do NOT rename any exported name — assertions depend on them.
//  • Run `npm run challenge:14` to check your work (all PASS = done).

// ── ASSERT HELPER (do not modify) ─────────────────────────
function assert(condition: boolean, message: string): void {
  if (!condition) { console.error(`  FAIL  ${message}`); process.exitCode = 1; }
  else            { console.log (`  PASS  ${message}`); }
}

// ══════════════════════════════════════════════════════════
// PART 1 — Template renderer
// ══════════════════════════════════════════════════════════
// Replace every {{key}} with String(vars[key]). Whitespace inside the
// braces is allowed: {{ name }} === {{name}}. A key with no matching
// var becomes the empty string.

export function renderTemplate(tpl: string, vars: Record<string, unknown>): string {
  // TODO: replace /\{\{\s*(\w+)\s*\}\}/g with the var value or "".
  void tpl; void vars;
  return ""; // placeholder — replace
}

// ══════════════════════════════════════════════════════════
// PART 2 — S3 key builder
// ══════════════════════════════════════════════════════════
// Build an object key: `${prefix}/${userId}/${filename}` with NO
// double slashes even if prefix has a leading/trailing slash.
//   buildS3Key("/avatars/", 42, "pic.png") → "avatars/42/pic.png"

export function buildS3Key(prefix: string, userId: number, filename: string): string {
  // TODO: strip leading/trailing slashes from prefix, then join with "/".
  void prefix; void userId; void filename;
  return ""; // placeholder — replace
}

// ══════════════════════════════════════════════════════════
// PART 3 — Content-type inference
// ══════════════════════════════════════════════════════════
// Infer the MIME type from a filename's extension (case-insensitive):
//   png→image/png  jpg/jpeg→image/jpeg  pdf→application/pdf
//   json→application/json  else→application/octet-stream

export function contentTypeFor(filename: string): string {
  // TODO: read the extension after the last ".", lowercase it, map it.
  void filename;
  return "application/octet-stream"; // placeholder — replace
}

// ── ASSERTIONS (do not modify) ────────────────────────────
console.log("\n── C14 Email · file storage assertions ──");

assert(renderTemplate("Hi {{name}}!", { name: "Sadik" }) === "Hi Sadik!",
  "template: replaces a simple placeholder");
assert(renderTemplate("{{ a }}-{{b}}", { a: 1, b: 2 }) === "1-2",
  "template: tolerates whitespace and stringifies values");
assert(renderTemplate("Hi {{missing}}.", {}) === "Hi .",
  "template: unknown key becomes empty string");

assert(buildS3Key("/avatars/", 42, "pic.png") === "avatars/42/pic.png",
  "s3 key: strips slashes and joins cleanly");
assert(buildS3Key("uploads", 7, "doc.pdf") === "uploads/7/doc.pdf",
  "s3 key: plain prefix works too");

assert(contentTypeFor("photo.PNG") === "image/png",     "content-type: png (case-insensitive)");
assert(contentTypeFor("a.jpeg") === "image/jpeg",       "content-type: jpeg");
assert(contentTypeFor("report.pdf") === "application/pdf", "content-type: pdf");
assert(contentTypeFor("data.json") === "application/json", "content-type: json");
assert(contentTypeFor("archive.zip") === "application/octet-stream", "content-type: unknown → octet-stream");

export {};
