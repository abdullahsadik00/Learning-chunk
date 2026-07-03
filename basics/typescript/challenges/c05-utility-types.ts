// ═══════════════════════════════════════════════════════════
// CHALLENGE C05: UTILITY TYPES
// Run: npm run challenge:05  |  Time target: 25–35 min
// ═══════════════════════════════════════════════════════════
// PROJECT: Define all the DTO variants a Blog CMS needs —
//          create, update, list, publish — using only utility types.
//          Never duplicate a field: always derive from BlogPost.
//
// RULES:
//  • Delete each // TODO comment as you implement it.
//  • Do NOT rename any exported name — assertions depend on them.
//  • You MAY NOT add fields manually — derive everything from BlogPost.
//  • Run `npm run challenge:05` to check your work.

// ── ASSERT HELPER (do not modify) ─────────────────────────
function assert(condition: boolean, message: string): void {
  if (!condition) { console.error(`  FAIL  ${message}`); process.exitCode = 1; }
  else            { console.log (`  PASS  ${message}`); }
}

// ══════════════════════════════════════════════════════════
// SOURCE OF TRUTH — do not modify BlogPost
// ══════════════════════════════════════════════════════════

export interface BlogPost {
  id: string;
  title: string;
  content: string;
  slug: string;
  authorId: string;
  tags: string[];
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

// ══════════════════════════════════════════════════════════
// PART 1 — Create / Update DTOs
// ══════════════════════════════════════════════════════════

// CreatePostDTO: everything a client sends when creating a post.
// The server assigns id, createdAt, updatedAt — client must NOT send them.
// TODO: derive from BlogPost using Omit
export type CreatePostDTO = BlogPost; // replace with Omit<...>

// UpdatePostDTO: patch request — all fields optional except the ones
// the server controls (id, createdAt, updatedAt are omitted entirely).
// Hint: combine Omit and Partial.
// TODO: derive from BlogPost
export type UpdatePostDTO = BlogPost; // replace with Partial<Omit<...>>

// ══════════════════════════════════════════════════════════
// PART 2 — Read DTOs
// ══════════════════════════════════════════════════════════

// PostListItem: lean representation for list views.
// Only: id, title, slug, published, createdAt
// TODO: derive using Pick
export type PostListItem = BlogPost; // replace with Pick<...>

// PublishedPost: a post that is guaranteed to be published.
// Same shape as BlogPost but published is narrowed to the literal true.
// Hint: Omit the published field, then re-add it as `published: true`.
// TODO: derive
export type PublishedPost = BlogPost; // replace

// FrozenPost: a fetched post that must not be mutated (all fields readonly).
// TODO: derive using Readonly
export type FrozenPost = BlogPost; // replace with Readonly<...>

// ══════════════════════════════════════════════════════════
// PART 3 — Record type for access control
// ══════════════════════════════════════════════════════════

type Role = "admin" | "editor" | "viewer";
type Permission = "read" | "write" | "delete" | "publish";

// RoleMatrix maps every Role to an array of Permissions.
// TODO: define using Record<Role, Permission[]>
export type RoleMatrix = unknown; // replace

// TODO: fill in the actual role matrix object.
//   admin  → all four permissions
//   editor → read, write, publish
//   viewer → read only
export const ROLE_MATRIX: RoleMatrix = {} as RoleMatrix; // replace with real object

// ══════════════════════════════════════════════════════════
// PART 4 — ReturnType and Parameters
// ══════════════════════════════════════════════════════════

// This factory function is given — do not change it.
function createDraftPost(title: string, authorId: string): CreatePostDTO {
  return {
    title,
    content: "",
    slug: title.toLowerCase().replace(/\s+/g, "-"),
    authorId,
    tags: [],
    published: false,
  } as CreatePostDTO;
}

// TODO: Use ReturnType<> to declare DraftPost without duplicating the type.
export type DraftPost = BlogPost; // replace with ReturnType<typeof createDraftPost>

// TODO: Use Parameters<> to declare CreateArgs — the parameter tuple of createDraftPost.
//       It should be [string, string].
export type CreateArgs = unknown[]; // replace with Parameters<typeof createDraftPost>

// ══════════════════════════════════════════════════════════
// PART 5 — Exclude and Extract on event unions
// ══════════════════════════════════════════════════════════

type CmsEvent =
  | "post.created"
  | "post.updated"
  | "post.deleted"
  | "post.published"
  | "comment.created"
  | "comment.deleted"
  | "user.registered";

// TODO: PostEvent — Extract only the events that start with "post."
//       Hint: Extract<CmsEvent, `post.${string}`>
export type PostEvent = CmsEvent; // replace

// TODO: NonDestructiveEvent — Exclude all events ending in ".deleted"
//       Hint: Exclude<CmsEvent, `${string}.deleted`>
export type NonDestructiveEvent = CmsEvent; // replace

// ── ASSERTIONS (do not modify) ────────────────────────────
console.log("\n── C05 Utility Types assertions ──");

// CreatePostDTO must NOT have id, createdAt, updatedAt
const createDto: CreatePostDTO = {
  title: "Hello",
  content: "World",
  slug: "hello",
  authorId: "u1",
  tags: [],
  published: false,
};
// @ts-expect-error — id is omitted from CreatePostDTO
const _badCreate: CreatePostDTO = { ...createDto, id: "x" };

assert(createDto.title === "Hello", "CreatePostDTO: has title");
assert(!("id" in createDto),        "CreatePostDTO: no id field at runtime");

// UpdatePostDTO — all fields optional
const updateDto: UpdatePostDTO = { title: "New title" };
assert(updateDto.title === "New title", "UpdatePostDTO: can set only title");

// PostListItem — only five fields
const listItem: PostListItem = {
  id: "1",
  title: "Post",
  slug: "post",
  published: true,
  createdAt: "2024-01-01",
};
// @ts-expect-error — content is not in PostListItem
const _badList: PostListItem = { ...listItem, content: "x" };
assert(listItem.title === "Post", "PostListItem: has title");

// FrozenPost — all fields exist but is Readonly (runtime check is just structural)
const frozen: FrozenPost = {
  id: "1", title: "t", content: "c", slug: "s",
  authorId: "a", tags: [], published: false,
  createdAt: "x", updatedAt: "x",
};
assert(frozen.id === "1", "FrozenPost: can read id");

// RoleMatrix
assert(Array.isArray(ROLE_MATRIX.admin),                              "RoleMatrix: admin has permissions array");
assert(Array.isArray(ROLE_MATRIX.admin) && ROLE_MATRIX.admin.includes("delete"),   "RoleMatrix: admin has delete");
assert(Array.isArray(ROLE_MATRIX.editor) && ROLE_MATRIX.editor.includes("write"),  "RoleMatrix: editor has write");
assert(Array.isArray(ROLE_MATRIX.viewer) && !ROLE_MATRIX.viewer.includes("write"), "RoleMatrix: viewer cannot write");
assert(Array.isArray(ROLE_MATRIX.viewer) && ROLE_MATRIX.viewer.includes("read"),   "RoleMatrix: viewer can read");

// PostEvent and NonDestructiveEvent
const pe: PostEvent = "post.created";
assert(pe === "post.created", "PostEvent: post.created is valid");
// @ts-expect-error — comment.created is not a PostEvent
const _badPost: PostEvent = "comment.created";

const nde: NonDestructiveEvent = "post.created";
assert(nde === "post.created", "NonDestructiveEvent: post.created is valid");
// @ts-expect-error — post.deleted is excluded from NonDestructiveEvent
const _badNde: NonDestructiveEvent = "post.deleted";

export {};
