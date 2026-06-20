# Snippets — Senior Dev Build Guide

## What We're Building

Snippets is a code snippet manager for engineering teams. Save, organize, search, and collaboratively edit code snippets in real time. Think **GitHub Gists meets Notion code blocks, built for your team.**

Target users: small engineering teams (5–50 devs). The pain point: code lives in Slack DMs, scattered Gist URLs, and half-remembered Stack Overflow tabs. Snippets fixes that — one place, searchable, with access control.

Core features:
- Create and organize snippets into collections (like folders)
- Fine-grained access control: owner / editor / viewer per collection
- Full-text search across all snippets you have access to
- Real-time collaborative editing (CRDT-based, like Google Docs for code)
- Inline comment threads anchored to line ranges
- Version history — see every change, restore any snapshot

---

## Why This Matters for Your Portfolio

Most portfolio projects are CRUD apps: a to-do list with a database behind it. Snippets is not that. It involves problems that real products have:

**Real-time collaboration (CRDT-based concurrent editing)**
When two users edit the same snippet simultaneously, you need a conflict-resolution strategy. Operational Transform (OT) is what Google Docs used. CRDTs (Conflict-free Replicated Data Types) are what Figma uses. You'll implement a simplified CRDT over WebSocket. This is interview conversation material at any senior role.

**Access control at the data layer**
Not just "are you logged in?" — but "do you have editor access to *this specific collection*?" That means permission checks in every query, not just middleware. Junior devs almost always get this wrong on the first attempt.

**Full-text search (PostgreSQL tsvector)**
You'll learn that `LIKE '%keyword%'` doesn't scale, and why `tsvector` + `GIN` indexes are the right tool. PostgreSQL's built-in full-text search is production-grade and saves you the operational complexity of Elasticsearch for 99% of use cases.

**WebSocket infrastructure at scale**
One server handles WebSocket connections fine. Two servers break presence and pub/sub unless you use Redis. You'll wire this up with Redis pub/sub and understand exactly why it's necessary.

**Monorepo with shared types**
When your frontend and backend drift on what a `Snippet` looks like, you get runtime bugs that TypeScript can't catch. The shared types package eliminates that class of bug entirely.

---

## How Senior Devs Think About a New Project

Before writing any code, a senior dev does five things. Skip these and you'll spend twice as long untangling the mess later.

### 1. Start with the data model — everything flows from the schema

Your schema is a contract with yourself and your team. The shape of your data determines what queries are efficient, what's hard to change later, and what your API can realistically return.

Spend an hour on the schema before touching code. Ask: What are the real-world entities? What are the relationships? What are the access patterns (how will we query this)? What do we need to index?

A bad schema is the most expensive mistake in a project — migrations on a live database with millions of rows are painful.

### 2. Define the API contract before writing a line of code

Write out every endpoint: method, path, request shape, response shape, error cases. This is your spec. It lets you parallelize frontend and backend work. It forces you to think about the entire surface area of your product before getting lost in implementation details.

If you start coding before the API is defined, you'll discover mid-build that you need a field you forgot, and refactoring cascades through both sides.

### 3. Build the auth layer first — you can't develop features without it

Every other feature requires knowing who the current user is and what they're allowed to do. If you build snippets CRUD before auth, you'll need to go back and add auth checks to every route. Start with auth so everything else is built with it already in place.

### 4. Add real-time LAST — it's complexity you add after the core works

Real-time collaboration is a multiplier on complexity. WebSocket state + CRDT logic + Redis pub/sub on top of a half-built product is a nightmare. Get the basic product working first: auth, CRUD, search, permissions. Then layer in real-time. This also means if real-time has a bug, you have a working product underneath.

### 5. Write the unhappy paths — 80% of bugs are error states

"What happens when the user isn't authenticated?" "What happens when they request a snippet from a collection they can't see?" "What happens when the WebSocket disconnects mid-edit?" Most developers write the happy path and call it done. The unhappy paths are where the product actually lives.

---

## Database Schema Design

### Why store content as text (not JSON)?

Snippet content is a plain string. JSON would add parsing overhead and make text search harder. If you stored it as JSON you'd write `content->>'body'` in every query. `text` is simpler, faster, and exactly the right type for a string that doesn't have key-value structure.

### Why a separate Permission table instead of roles on User?

Because permissions are per-collection, not per-user. A user can be an editor on one collection and a viewer on another. If you stored the role on the User row, you'd only support one role globally. The Permission table lets you express the full many-to-many relationship with a role on the join.

### Why store snippet history as snapshots not diffs?

Diffs (storing only what changed) save storage but make reconstruction expensive. To show version N, you'd apply N diffs from the initial snapshot. Snapshots (storing the full content each time) use more storage but restore instantly. For code snippets — typically a few KB — the storage cost is negligible. We cap history at 50 versions to bound the storage per snippet.

---

### Schema

```sql
-- Users table
CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT UNIQUE NOT NULL,
  name        TEXT NOT NULL,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Collections — the top-level organizational unit
-- owner_id: the user who created it, always has owner-level access
-- is_public: allows unauthenticated read access (for sharing)
CREATE TABLE collections (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  is_public   BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Index for the most common query: "give me all collections this user owns or has access to"
CREATE INDEX idx_collections_owner ON collections(owner_id);

-- Snippets — the core entity
-- content stored as text for simplicity and full-text search compatibility
-- language is stored as a text enum — validated at the app layer
CREATE TABLE snippets (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  content       TEXT NOT NULL DEFAULT '',
  language      TEXT NOT NULL DEFAULT 'plain',
  description   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  search_vector TSVECTOR GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(content, '')), 'C')
  ) STORED
);
-- GIN index on the tsvector column makes full-text search fast
CREATE INDEX idx_snippets_search ON snippets USING GIN(search_vector);
CREATE INDEX idx_snippets_collection ON snippets(collection_id);

-- Snippet versions — full content snapshots, capped at 50 per snippet
-- created_by: who made the change (for the history UI)
-- No update ever happens here — only inserts
CREATE TABLE snippet_versions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snippet_id  UUID NOT NULL REFERENCES snippets(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  created_by  UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_versions_snippet ON snippet_versions(snippet_id, created_at DESC);

-- Permissions — many-to-many: users <-> collections with a role
-- A user can only have one role per collection (UNIQUE constraint)
-- owner_id on collections is denormalized — the owner always has 'owner' role here too
CREATE TABLE permissions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  role          TEXT NOT NULL CHECK (role IN ('owner', 'editor', 'viewer')),
  granted_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, collection_id)
);
CREATE INDEX idx_permissions_user ON permissions(user_id);
CREATE INDEX idx_permissions_collection ON permissions(collection_id);

-- Comments — anchored to a line range within a snippet
-- line_start/line_end are nullable: a comment without a line range is a general comment
-- resolved: closed/dismissed (soft delete, so history is preserved)
CREATE TABLE comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snippet_id  UUID NOT NULL REFERENCES snippets(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  line_start  INTEGER,
  line_end    INTEGER,
  resolved    BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_comments_snippet ON comments(snippet_id);
```

---

## API Design

Define all routes before writing code. This is your spec.

```
Auth:
  POST   /api/auth/register          body: { email, password, name }
  POST   /api/auth/login             body: { email, password }
  POST   /api/auth/refresh           (uses httpOnly refresh token cookie)
  DELETE /api/auth/logout
  GET    /api/auth/me                returns current user from session

Collections:
  GET    /api/collections            returns collections user owns or has any role on
  POST   /api/collections            body: { name, description, isPublic }
  GET    /api/collections/:id        with snippet list (no content, just metadata)
  PATCH  /api/collections/:id        body: partial collection fields
  DELETE /api/collections/:id        only owner
  POST   /api/collections/:id/members    body: { userId, role } — upserts permission
  DELETE /api/collections/:id/members/:userId

Snippets:
  GET    /api/snippets/:id           with latest content + comments
  POST   /api/snippets               body: { collectionId, title, content, language, description }
  PATCH  /api/snippets/:id           body: partial snippet; saves a version snapshot
  DELETE /api/snippets/:id
  GET    /api/snippets/:id/history   returns version list (id, createdBy, createdAt) — no content in list
  GET    /api/snippets/:id/history/:versionId  returns full content of a specific version
  POST   /api/snippets/:id/comments  body: { content, lineStart?, lineEnd? }
  PATCH  /api/snippets/:id/comments/:commentId   body: { resolved }

Search:
  GET    /api/search?q=&lang=&collection=    full-text search, respects permissions

WebSocket:
  WS /ws
    - Authenticate: first message after connect must be { type: 'auth', token: '...' }
    - Join room:  { type: 'join', snippetId: '...' }
    - Leave room: { type: 'leave', snippetId: '...' }
    - CRDT op:    { type: 'crdt_op', snippetId: '...', op: CRDTOp }
    - Cursor:     { type: 'cursor', snippetId: '...', line: N, column: N }
    Server → Client:
    - { type: 'presence', users: [{ userId, name }] }
    - { type: 'crdt_op', snippetId, op }
    - { type: 'cursor', userId, line, column }
```

---

## Architecture Decisions

### 1. Monorepo (`/frontend` + `/backend` + `/packages/types`)

Why: Shared TypeScript types between frontend and backend prevent drift. When you change the `Snippet` interface in one place, both sides update. Without this, you'll have subtle mismatches (backend returns `created_at`, frontend expects `createdAt`) that TypeScript catches only at runtime.

Structure:
```
snippets/
  frontend/     — Next.js 15 app
  backend/      — Express API
  packages/
    types/      — shared TypeScript interfaces
```

### 2. Next.js 15 with App Router for frontend

Why: Server components reduce client-side bundle size by default. Public snippets can be rendered on the server for fast initial load and good SEO. ISR (Incremental Static Regeneration) means public snippet pages are cached at the CDN and don't hit your database on every request.

### 3. Express + Prisma for backend

Why: Prisma gives you type-safe database queries without writing raw SQL for every operation. But unlike magic ORMs, Prisma makes it easy to drop into raw SQL when you need to — which you will, for full-text search and complex permission queries. Express is explicit and debuggable. When a query is slow, `prisma.$queryRaw` lets you profile and optimize without rewriting the ORM layer.

### 4. PostgreSQL for storage

Why: Full-text search is built in via `tsvector` and GIN indexes — no separate search service needed. ACID transactions mean permission changes and snippet writes are atomic. PostgreSQL's row-level security is an option if you want to enforce permissions at the database layer too.

### 5. Redis for real-time

Why: When you run one backend instance, a single in-memory pub/sub works. But one WebSocket server can handle ~10K concurrent connections before CPU becomes a bottleneck. When you add a second backend instance, users connected to instance A can't receive messages from users on instance B — unless both instances subscribe to the same Redis channel. Redis pub/sub is the standard solution.

### 6. `ws` (not socket.io) for WebSockets

Why: Socket.io is a great abstraction, but it adds ~90KB to your client bundle and hides what's actually happening on the wire. Using `ws` directly means you understand exactly what messages are being sent. When something breaks, you can inspect it in the browser's Network tab without decoding socket.io's framing format. Fewer abstractions = easier debugging.

---

## BUILD ORDER — The PR List

Work through these in order. Each PR is a standalone, mergeable unit of work. Don't start PR 5 until PR 4 is merged.

---

### PR 1: Project setup (monorepo, shared types package, CI)

**What it does:** Initializes the repo structure. Sets up the `/packages/types` shared package with a `package.json` and the TypeScript interfaces both sides will import. Sets up ESLint + Prettier with shared config. Creates a GitHub Actions CI workflow that runs `tsc --noEmit` and lint on every PR.

**Before merging:** `npm run check` passes on both frontend and backend. CI runs green on a test PR.

**Watch out:** Don't skip the shared types package even though it seems like overhead on day one. The moment you have two separate type definitions for `Snippet`, they will drift. Set it up now and import from `@snippets/types` everywhere.

---

### PR 2: Database schema + Prisma migrations

**What it does:** Creates `backend/prisma/schema.prisma` with all models. Runs `prisma migrate dev` to generate the initial migration SQL. Seeds the database with a test user and sample data.

**Before merging:** `prisma migrate deploy` works from a clean database. `prisma studio` shows all tables with correct schema. The seed script runs without error.

**Watch out:** Don't add `@default(uuid())` without also enabling the `pgcrypto` extension (`CREATE EXTENSION IF NOT EXISTS pgcrypto;`) or using `gen_random_uuid()`. In Postgres 14+ `gen_random_uuid()` is built in. In earlier versions you need the extension.

---

### PR 3: Auth API (register, login, refresh tokens)

**What it does:** `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/refresh`, `DELETE /api/auth/logout`, `GET /api/auth/me`. Access tokens are short-lived JWTs (15 min). Refresh tokens are long-lived (7 days), stored in an httpOnly cookie. Passwords hashed with bcrypt (12 rounds).

**Before merging:** Register creates a user. Login returns an access token. Using an expired access token with a valid refresh cookie returns a new access token. Logout clears the cookie. All routes return correct HTTP status codes (201, 400, 401, etc.).

**Watch out:** Store access tokens in memory (JavaScript variable), not localStorage. LocalStorage is readable by any XSS payload. The refresh token in an httpOnly cookie is not readable by JavaScript at all — only sent automatically by the browser. This is the standard pattern.

---

### PR 4: Auth UI (login, register pages, auth store)

**What it does:** Login page, register page, Zustand auth store, a `useAuth` hook, a protected route wrapper. On login, stores the access token in memory (Zustand store) and the user object. Silent refresh: before each API call, if the access token is expired, call `/api/auth/refresh` to get a new one using the cookie.

**Before merging:** Logging in navigates to `/snippets`. Refreshing the page while logged in (cookie still valid) keeps you logged in — the layout calls `/api/auth/me` on mount to rehydrate. Logging out clears state and redirects to `/`.

**Watch out:** Don't persist the access token to localStorage or sessionStorage. Persist only the user object (not the token) so the UI can show the user's name/avatar after a page refresh, then silently re-auth via the cookie to get a fresh token.

---

### PR 5: Collections CRUD API

**What it does:** All `/api/collections` endpoints. Middleware that extracts `userId` from the JWT and attaches it to `req.user`. A `requireRole` middleware that checks the Permission table before allowing mutations. Owner-only actions (delete, invite members) enforced in middleware.

**Before merging:** A user can create a collection and automatically has owner role. A viewer can read but cannot patch or delete. A user with no permission gets 403 (not 404 — don't reveal that the collection exists). Collection list returns only collections the user has access to.

**Watch out:** The "not 404" rule matters. If a user requests `/api/collections/abc123` and they don't have access, return 403, not 404. Returning 404 tells an attacker "that ID exists but you can't see it." Returning 403 consistently is actually the correct behavior, and most libraries do it wrong by returning 404 to "not leak IDs." In practice: if the user is authenticated, tell them 403. If they're not authenticated, 401. Don't try to be clever about hiding IDs.

---

### PR 6: Collections UI (sidebar tree, collection page)

**What it does:** The `/snippets` layout with sidebar. `CollectionTree` component showing user's collections with snippet counts. Collection detail page at `/snippets` (scoped by selected collection). Uses TanStack Query for data fetching and cache invalidation.

**Before merging:** Creating a collection via API and refreshing shows it in the sidebar. Clicking a collection shows its snippets. Query cache invalidation: after creating a snippet, the collection snippet count updates without a full page reload.

**Watch out:** Don't call `queryClient.invalidateQueries` with the key as a string — use the key factory functions from `queryKeys.ts`. If the key in the invalidation call doesn't exactly match the key used in `useQuery`, the cache won't invalidate and the UI will show stale data. This is the most common TanStack Query bug.

---

### PR 7: Snippets CRUD API

**What it does:** All `/api/snippets` endpoints. On every PATCH, automatically inserts a row into `snippet_versions` with the previous content. Enforces a 50-version cap per snippet (delete oldest when inserting if count would exceed 50). Comment endpoints. Full access control: viewers can read, editors can write, only owners can delete.

**Before merging:** Creating a snippet adds it to the collection. Updating content creates a version row. Fetching `/api/snippets/:id` returns snippet with comments array. Fetching `/api/snippets/:id/history` returns version list. Comment creation works. A viewer cannot PATCH a snippet (403).

**Watch out:** The version cap logic. When inserting a new version, don't just `WHERE` to count — do it in a transaction: insert the version, then if count > 50, delete the oldest. If you do them as two separate non-transactional queries, a race condition can leave you at 51 versions temporarily.

---

### PR 8: Snippet viewer/editor UI (Monaco editor integration)

**What it does:** Snippet detail page at `/snippets/[id]`. Monaco editor in read-only mode by default. Edit button (for users with editor permission) that toggles to edit mode. Save writes to the API and invalidates the query cache. Language badge. Metadata display. Loading and error states.

**Before merging:** Viewing a snippet shows syntax-highlighted content. Clicking Edit enables the Monaco editor. Saving updates the snippet and shows the new content. An error from the API shows a toast or inline error message — not just a console.log.

**Watch out:** Monaco editor is heavy (~3MB). It should be loaded with `next/dynamic` and `ssr: false`. Loading Monaco on the server will crash Next.js because Monaco references `window`. The `@monaco-editor/react` package handles this for you, but you still need to ensure it's in a `'use client'` component that isn't server-rendered.

---

### PR 9: Permission system (invite members, role enforcement)

**What it does:** `POST /api/collections/:id/members` to invite a user (by email lookup). `DELETE /api/collections/:id/members/:userId`. UI: a "Members" panel on the collection page showing current members with their roles. Owner can change roles or remove members.

**Before merging:** Inviting a user by email who doesn't exist returns a descriptive error (not a 500). Inviting someone who's already a member updates their role (upsert). A non-owner cannot access the members management UI (button hidden, API returns 403). Removing the last owner is rejected.

**Watch out:** Don't allow removing the last owner of a collection. If the only owner removes themselves, the collection becomes orphaned — no one can manage it. Add a database-level check or application-level check before deletion: count owners, reject if removing would leave zero.

---

### PR 10: Full-text search API + UI

**What it does:** `GET /api/search?q=&lang=&collection=`. Uses PostgreSQL `tsvector` search with `ts_rank` for relevance ordering. Results filtered to snippets in collections the user has access to (JOIN with permissions). UI: search input in the header, results page with snippet cards showing matched lines.

**Before merging:** Searching for a term returns relevant snippets. Results respect permissions — searching as User A doesn't surface snippets from collections User A can't access. `lang=typescript` filters to TypeScript snippets. Empty query returns an empty array (not an error).

**Watch out:** The permission filter in the search query is critical. A naive `SELECT * FROM snippets WHERE search_vector @@ ...` returns all matching snippets regardless of access. You must JOIN with `permissions` (or check `collections.is_public`) in the same query. Test this explicitly: create a private snippet as User A, search for it as User B — it must not appear.

---

### PR 11: Comment threads API + UI

**What it does:** Comment creation (already built in PR 7, this PR is the UI). Comment thread component below the editor. Line-anchored comments highlight the relevant line range in Monaco. Mark as resolved. Comment count badge on the snippet header.

**Before merging:** Adding a comment appears immediately (optimistic update). Resolving a comment marks it visually. Switching between snippets shows the correct comments for each. Line-anchored comments highlight the correct range in Monaco.

**Watch out:** Optimistic updates need rollback on failure. When you optimistically add a comment to the query cache and the API call fails, you must revert the cache to its previous state. TanStack Query's `onMutate` / `onError` / `onSettled` pattern handles this. Don't skip the `onError` handler.

---

### PR 12: WebSocket server (presence, room management)

**What it does:** `ws` WebSocket server alongside the Express app. Authentication via first-message handshake (not query string). Room management: a "room" is a snippet ID, users join/leave rooms. Presence: when users join/leave a room, broadcast the current user list to all room members. Redis pub/sub so presence works across multiple server instances.

**Before merging:** Opening the same snippet in two browser tabs shows both users in the presence indicator. Closing one tab removes the user from presence within 5 seconds. The auth handshake rejects connections with invalid tokens. Redis pub/sub test: if you were to run two server instances (simulate with two ports), a join event on one should broadcast to subscribers on the other.

**Watch out:** Handle disconnects explicitly. WebSocket `close` event fires when a client disconnects (browser tab closed, network drop). If you don't remove the user from the room on `close`, presence will show ghost users forever. Also handle the `error` event on each socket — an unhandled error event in Node.js will crash the process.

---

### PR 13: Real-time snippet editing (CRDT ops over WebSocket)

**What it does:** Integrate CRDT operations into the Monaco editor. On each change, generate a CRDT op (insert or delete with a Lamport clock ID) and send it over WebSocket to other users in the room. On receiving an op, apply it to the local editor content. Debounce sending ops: don't send on every single keystroke, batch at 50ms intervals.

**Before merging:** Two users editing the same snippet simultaneously converge to the same content without data loss. Fast typing doesn't flood the server (ops are batched). Reconnecting after a WebSocket drop fetches the latest content from the REST API and resumes correctly.

**Watch out:** Full CRDT correctness is hard. For this implementation, use a simplified approach: send the full content on each debounced save, not granular character-level ops. The `CRDTOp` types are defined for future improvement. Real CRDT (last-write-wins, position-invariant) is a computer science problem — the simplified version is a fine portfolio demo. If you try to implement a production CRDT from scratch, you'll spend 3 weeks on it.

---

### PR 14: Version history API + UI

**What it does:** Version history panel. List of versions (author, timestamp). Click to preview a version's content in a read-only Monaco editor alongside the current content (side-by-side diff view). Restore button: sets the snippet content to the selected version (which itself creates a new version).

**Before merging:** Editing a snippet multiple times creates multiple version entries. Clicking a version shows its content. Restoring a version updates the live snippet. The restored content appears in the main editor without a page reload.

**Watch out:** Monaco's diff editor is a separate component from the regular editor. `@monaco-editor/react` exports `DiffEditor` for this. The API is `<DiffEditor original={oldContent} modified={currentContent} />`. Don't try to build a diff UI yourself — Monaco's diff editor is excellent and free.

---

### PR 15: Deployment (Docker + Railway + Vercel)

**What it does:** `Dockerfile` for the Express backend. `docker-compose.yml` for local development (Postgres + Redis + backend). Railway config for backend deployment. Vercel config for Next.js frontend. Environment variable documentation. GitHub Actions deployment workflow.

**Before merging:** `docker-compose up` starts a working local environment from scratch. Deploying to Railway works from the `main` branch. Vercel preview deploys work on every PR. `NEXT_PUBLIC_API_URL` is set correctly for each environment.

**Watch out:** Don't hardcode `localhost` anywhere in production code. Use environment variables for all service URLs. `NEXT_PUBLIC_` prefix is required for env vars used in Next.js client components. Env vars without that prefix are server-only. If you use `process.env.API_URL` in a client component, it will be undefined in production.

---

## Common Mistakes to Avoid

### 1. Storing JWTs in localStorage (XSS risk)

localStorage is accessible to any JavaScript on the page. If your app has an XSS vulnerability (an unsanitized user input rendered as HTML, a compromised npm package), an attacker can run `localStorage.getItem('token')` and steal the JWT.

**Do this instead:** Store access tokens in memory (Zustand store variable). Store refresh tokens in `httpOnly` cookies — these are invisible to JavaScript, only sent by the browser automatically. The token never touches JavaScript where it can be stolen.

### 2. Not implementing silent token refresh

Access tokens expire (15 minutes in this project). If you don't refresh them automatically, users get logged out mid-session and have no idea why.

**Do this instead:** In your `api.ts` client, on every 401 response, automatically call `/api/auth/refresh`, get a new access token, and retry the original request once. If the refresh fails (refresh token also expired), redirect to login. The user never notices token expiration in normal usage.

### 3. WebSocket auth via query string in production

`wss://api.example.com/ws?token=eyJhbGc...` — the token is visible in server logs, nginx access logs, and anywhere the URL is logged. That's your authentication credential in plaintext in your logs.

**Do this instead:** Connect without the token, then send a first message: `{ type: 'auth', token: '...' }`. The server checks the token, confirms the connection is authenticated, then allows subsequent messages. Never put credentials in URLs.

### 4. Not debouncing CRDT operations

If you send a WebSocket message on every keydown event, a fast typist generates ~10 messages per second. With 10 concurrent editors on one snippet, that's 100 messages/second routed through Redis pub/sub and broadcast to all clients. The server will be fine, but it's wasteful and makes the network tab look alarming.

**Do this instead:** Buffer ops locally for 50ms, then send a batch. For this simplified implementation (sending full content), debounce the save trigger: start a 300ms timer on each keypress, cancel it if another keypress arrives, fire when 300ms of silence passes.

### 5. N+1 queries when loading collections with snippets

A naive implementation:
```ts
const collections = await prisma.collection.findMany(); // 1 query
for (const c of collections) {
  c.snippets = await prisma.snippet.findMany({ where: { collectionId: c.id } }); // N queries
}
```
With 20 collections, that's 21 database round trips. For 100 collections: 101 queries. This degrades linearly.

**Do this instead:** Use Prisma's `include`:
```ts
const collections = await prisma.collection.findMany({
  include: { snippets: { select: { id: true, title: true, language: true } } }
});
```
This generates a single JOIN query. Always check your Prisma queries with `prisma.$on('query', ...)` logging enabled during development — it shows you exactly what SQL is being run.
