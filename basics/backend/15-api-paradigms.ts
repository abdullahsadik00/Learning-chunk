// ═══════════════════════════════════════════════════════════════
// BACKEND 15: REST vs GRAPHQL vs tRPC · API VERSIONING · OPENAPI · RESPONSE DESIGN  (Day 50)
// Run: npx ts-node 15-api-paradigms.ts
// ═══════════════════════════════════════════════════════════════
//
// Three dominant API paradigms:
//
//  REST    → resource-oriented, HTTP-native, stateless, widely understood
//  GraphQL → query language, client-driven data fetching, single endpoint
//  tRPC    → TypeScript-first RPC, zero codegen, end-to-end type safety
//
// Choosing the right paradigm is an architectural decision that affects
// developer experience, performance, caching, and team velocity.

// ───────────────────────────────────────────────────────────────
// 1. REST — Representational State Transfer
// ───────────────────────────────────────────────────────────────

console.log("=== 1. REST ===");

/*
  REST STRENGTHS
  ──────────────
  • Simple mental model: resources + HTTP verbs (GET/POST/PUT/PATCH/DELETE)
  • HTTP-native: leverages caching (ETags, Cache-Control), status codes, headers
  • Stateless: each request is self-contained, easy to scale horizontally
  • Excellent tooling: Postman, Insomnia, curl, browser DevTools
  • Universal: works with any client (JS, mobile, Python, bash)
  • CDN-cacheable: GET endpoints can be cached at edge

  REST WEAKNESSES
  ───────────────
  • Over-fetching: endpoint returns 20 fields, client needs 3
  • Under-fetching: need 3 resources → 3 round trips (N+1 at the API level)
  • Endpoint proliferation: as product grows, you accumulate dozens of routes
  • No formal schema by default (OpenAPI fills this gap)
  • Versioning complexity: /v1/ vs /v2/ across many endpoints

  BEST FOR
  ────────
  • Public APIs (third-party developers expect REST)
  • Simple CRUD services
  • Mobile apps where HTTP caching and CDN matter
  • Services consumed by non-TypeScript / non-JS clients
  • Microservices with clear resource boundaries
*/

// Simulated REST resource design (no live server — illustrative)
interface RESTUser {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  // ... 15 more fields the mobile client does NOT need
}

// Typical REST route layout
const REST_ROUTES = [
  "GET    /api/v1/users          → list users",
  "POST   /api/v1/users          → create user",
  "GET    /api/v1/users/:id      → get user",
  "PATCH  /api/v1/users/:id      → update user",
  "DELETE /api/v1/users/:id      → delete user",
  "GET    /api/v1/users/:id/posts → get user's posts (extra round trip avoided)",
] as const;

console.log("REST routes:");
REST_ROUTES.forEach(r => console.log(" ", r));

// REST response shape convention
function makeRESTResponse<T>(data: T, status = 200) {
  return { status, data };
}

const restUserResponse = makeRESTResponse<RESTUser>({
  id: "u_123",
  name: "Sadik",
  email: "sadik@example.com",
  role: "admin",
  createdAt: new Date().toISOString(),
});
console.log("REST GET /users/u_123:", JSON.stringify(restUserResponse, null, 2));

// ───────────────────────────────────────────────────────────────
// 2. GraphQL — Graph Query Language
// ───────────────────────────────────────────────────────────────

console.log("\n=== 2. GraphQL ===");

/*
  CORE CONCEPTS
  ─────────────
  Schema-first: define types in SDL (Schema Definition Language) before writing resolvers.
  Single endpoint: ALL requests go to POST /graphql.
  Client specifies exact fields: eliminates over-fetching AND under-fetching.
  Introspection: the schema itself is queryable — tools like GraphiQL use this.

  KEY BUILDING BLOCKS
  ───────────────────
  type Query      → read operations (like GET)
  type Mutation   → write operations (like POST/PATCH/DELETE)
  type Subscription → real-time (WebSocket / SSE)
  Resolvers       → functions that fulfil each field in the schema
  Fragments       → reusable field selections shared across queries
  Variables       → parameterise queries (safe, no string interpolation)
  DataLoader      → batch + cache resolver calls to kill N+1 queries

  APOLLO SERVER SETUP (illustrative — not runnable without the package)
  ──────────────────────────────────────────────────────────────────────

  import { ApolloServer } from '@apollo/server';
  import { startStandaloneServer } from '@apollo/server/standalone';

  const typeDefs = `#graphql
    type User {
      id: ID!
      name: String!
      email: String!
      posts: [Post!]!
    }

    type Post {
      id: ID!
      title: String!
      body: String!
      author: User!
    }

    type Query {
      user(id: ID!): User
      users: [User!]!
    }

    type Mutation {
      createUser(name: String!, email: String!): User!
      deleteUser(id: ID!): Boolean!
    }

    type Subscription {
      postAdded: Post!
    }
  `;

  const resolvers = {
    Query: {
      user: (_: unknown, { id }: { id: string }) => db.users.findById(id),
      users: () => db.users.findAll(),
    },
    Mutation: {
      createUser: (_: unknown, { name, email }: { name: string; email: string }) =>
        db.users.create({ name, email }),
    },
    User: {
      // Field resolver — called per User in the response
      posts: (parent: { id: string }) => db.posts.findByUserId(parent.id),
      // Without DataLoader, this fires one DB query per user → N+1 problem!
    },
  };

  const server = new ApolloServer({ typeDefs, resolvers });
  const { url } = await startStandaloneServer(server, { listen: { port: 4000 } });
  console.log(`GraphQL server at ${url}`);
*/

// GRAPHQL QUERY EXAMPLES (as strings — illustrative)
const gqlQueryBasic = `
  query GetUser($id: ID!) {
    user(id: $id) {
      name          # only request what you need — no over-fetching
      email
    }
  }
`;

const gqlQueryWithFragment = `
  fragment UserCard on User {
    id
    name
    email
  }

  query GetUsers {
    users {
      ...UserCard   # reuse the fragment
      posts {
        title
      }
    }
  }
`;

const gqlMutation = `
  mutation CreateUser($name: String!, $email: String!) {
    createUser(name: $name, email: $email) {
      id
      name
    }
  }
`;

console.log("GraphQL query (basic):", gqlQueryBasic.trim());
console.log("GraphQL fragment usage:", gqlQueryWithFragment.trim());
console.log("GraphQL mutation:", gqlMutation.trim());

/*
  DATALOADER — solving the N+1 problem
  ─────────────────────────────────────
  Without DataLoader: fetching 100 users → 100 separate posts queries.
  With DataLoader: batches all post lookups into ONE query per tick.

  import DataLoader from 'dataloader';

  const postLoader = new DataLoader(async (userIds: readonly string[]) => {
    const posts = await db.posts.findByUserIds([...userIds]);
    // Return posts grouped by userId in the same order as userIds
    return userIds.map(id => posts.filter(p => p.userId === id));
  });

  // In resolver:
  User: {
    posts: (parent) => postLoader.load(parent.id), // batched automatically
  }

  WHEN NOT TO USE GRAPHQL
  ────────────────────────
  • Simple CRUD with no diverse client field requirements
  • Tiny teams — schema maintenance overhead outweighs benefits
  • Public APIs where you don't control the clients (REST is more universal)
  • Heavy file upload flows (REST multipart is simpler)
  • Aggressive HTTP caching needs (POST /graphql bypasses CDN cache by default)
*/

// ───────────────────────────────────────────────────────────────
// 3. tRPC — TypeScript Remote Procedure Call
// ───────────────────────────────────────────────────────────────

console.log("\n=== 3. tRPC ===");

/*
  WHAT IS tRPC?
  ─────────────
  tRPC lets you call server functions from the client as if they were
  local functions — with FULL TypeScript type inference, no codegen,
  no schema files.

  Change a return type on the server → TypeScript error on the client.
  It is not a protocol (like REST or GraphQL) — it uses HTTP under the hood
  (GET for queries, POST for mutations) but the abstraction is RPC.

  KEY CONCEPTS
  ────────────
  Router     → groups procedures (like an Express Router groups routes)
  Procedure  → a single callable function: query | mutation | subscription
  Context    → request-scoped object (user, db) injected into all procedures
  Middleware → runs before procedure logic (auth checks, logging)
  Zod        → input validation; tRPC uses Zod schemas as the "contract"

  SETUP EXAMPLE (illustrative — requires @trpc/server, zod)
  ──────────────────────────────────────────────────────────

  import { initTRPC, TRPCError } from '@trpc/server';
  import { z } from 'zod';

  // 1. Define context type
  interface Context {
    user: { id: string; role: string } | null;
  }

  // 2. Initialise tRPC with the context
  const t = initTRPC.context<Context>().create();

  // 3. Middleware for authentication
  const isAuthed = t.middleware(({ ctx, next }) => {
    if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
    return next({ ctx: { user: ctx.user } }); // narrows ctx.user to non-null
  });

  const publicProcedure  = t.procedure;
  const privateProcedure = t.procedure.use(isAuthed);

  // 4. Build the router
  export const appRouter = t.router({
    // Query — GET under the hood
    getUser: publicProcedure
      .input(z.object({ id: z.string().uuid() }))
      .query(async ({ input, ctx }) => {
        const user = await db.users.findById(input.id);
        if (!user) throw new TRPCError({ code: 'NOT_FOUND' });
        return user;  // TypeScript infers the return type
      }),

    // Mutation — POST under the hood
    createUser: privateProcedure
      .input(z.object({
        name:  z.string().min(1).max(100),
        email: z.string().email(),
      }))
      .mutation(async ({ input, ctx }) => {
        return db.users.create({ ...input, createdBy: ctx.user.id });
      }),

    deleteUser: privateProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ input }) => {
        await db.users.delete(input.id);
        return { success: true };
      }),
  });

  export type AppRouter = typeof appRouter; // export for client

  // 5. On the CLIENT (Next.js / React example)
  import { createTRPCReact } from '@trpc/react-query';
  import type { AppRouter } from '../server/router';

  const trpc = createTRPCReact<AppRouter>();

  // Inside a component:
  const { data } = trpc.getUser.useQuery({ id: 'u_123' });
  // data is fully typed — hover it and see the exact return shape!

  // If the server changes the return type:
  // → TypeScript error here immediately, before any runtime failure.

  WHEN TO USE tRPC
  ────────────────
  • Full-stack TypeScript apps (Next.js, Remix, SvelteKit)
  • Internal APIs where server and client are in the same monorepo
  • Teams that want type safety without schema files or codegen
  • Rapid prototyping — zero ceremony, just write functions

  NOT RECOMMENDED WHEN
  ─────────────────────
  • Public APIs — non-TypeScript clients cannot use tRPC's type system
  • Mobile clients written in Swift / Kotlin
  • Teams with mixed language stacks
  • You need HTTP-level caching for GET endpoints (REST handles this better)
*/

// Simulate tRPC's end-to-end type flow with plain TypeScript
type UserRecord = { id: string; name: string; email: string; role: "admin" | "user" };

// Server-side procedure return type
function getUserProcedure(input: { id: string }): UserRecord {
  // In real tRPC this is async and hits a DB
  return { id: input.id, name: "Sadik", email: "sadik@example.com", role: "admin" };
}

// Client-side: the return type is inferred — no codegen
const user = getUserProcedure({ id: "u_123" });
// user.role is "admin" | "user" — TypeScript knows this!
console.log("tRPC-style procedure result:", user);
console.log("Type-safe role access:", user.role.toUpperCase());

// ───────────────────────────────────────────────────────────────
// 4. Comparison Table
// ───────────────────────────────────────────────────────────────

console.log("\n=== 4. REST vs GraphQL vs tRPC Comparison ===");

/*
  DIMENSION           REST                   GRAPHQL                tRPC
  ──────────────────────────────────────────────────────────────────────────────
  Type safety         None by default         Schema types (SDL)     Full TS inference
  Learning curve      Low                     Medium-High            Low (if you know TS)
  HTTP caching        Excellent (GET/CDN)     Poor (POST /graphql)   Moderate (GET queries)
  Client flexibility  Any client/language     Any client/language    TypeScript only
  Over/under-fetching Both problems exist     Solved by design       Solved by design
  Code generation     Optional (openapi-gen)  Required (codegen.ts)  None needed
  Schema/contract     Optional (OpenAPI)      Required (SDL)         TypeScript types
  Real-time           Polling / SSE           Subscriptions (WS)     Subscriptions (WS)
  N+1 problem         Handle in service       DataLoader pattern     Handle in procedure
  Tooling ecosystem   Mature, universal        Mature (Apollo etc.)  Growing, TS-focused
  Best use case       Public APIs, CRUD        Diverse clients,       Full-stack TS,
                                               complex data graphs    internal APIs
  NOT recommended     Complex data graphs     Public/multi-lang API  Public/non-TS clients
  ──────────────────────────────────────────────────────────────────────────────
*/

type Paradigm = "REST" | "GraphQL" | "tRPC";
type Dimension =
  | "Type safety"
  | "HTTP caching"
  | "Client flexibility"
  | "Learning curve"
  | "Best for";

const comparisonTable: Record<Dimension, Record<Paradigm, string>> = {
  "Type safety":        { REST: "None (add OpenAPI)", GraphQL: "SDL schema",       tRPC: "Full TS inference" },
  "HTTP caching":       { REST: "Excellent",          GraphQL: "Poor (POST only)", tRPC: "Moderate"          },
  "Client flexibility": { REST: "Any language",       GraphQL: "Any language",     tRPC: "TypeScript only"   },
  "Learning curve":     { REST: "Low",                GraphQL: "Medium-High",      tRPC: "Low (know TS)"     },
  "Best for":           { REST: "Public / CRUD APIs", GraphQL: "Diverse clients",  tRPC: "TS monorepos"      },
};

Object.entries(comparisonTable).forEach(([dim, vals]) => {
  console.log(`  ${dim.padEnd(20)} REST: ${vals.REST.padEnd(22)} GQL: ${vals.GraphQL.padEnd(24)} tRPC: ${vals.tRPC}`);
});

// ───────────────────────────────────────────────────────────────
// 5. API Versioning Strategies
// ───────────────────────────────────────────────────────────────

console.log("\n=== 5. API Versioning Strategies ===");

/*
  WHY VERSION?
  ────────────
  APIs evolve. Clients (mobile apps, third-party integrators) cannot update
  instantly. Versioning lets you break backwards compatibility safely.

  STRATEGY 1: URL PATH VERSIONING
  ────────────────────────────────
  GET /api/v1/users
  GET /api/v2/users    ← breaking change: new response shape

  Pros:
  • Immediately visible in URLs, logs, documentation
  • Easy to route at the load balancer / API gateway
  • Simple to test (just change the URL)
  Cons:
  • Duplicate routes proliferate (30 endpoints × 3 versions = 90 routes)
  • Not RESTfully pure — URI should identify a resource, not a version
  • Cache keys differ between versions even for same resource

  STRATEGY 2: HEADER VERSIONING
  ──────────────────────────────
  GET /api/users
  API-Version: 2

  Pros:
  • Clean URLs — resource identity is stable
  • Easier to maintain a single route with version-dispatch
  Cons:
  • Invisible in browser address bar and most logs
  • Harder to test manually (must set custom header)
  • CDN caching requires Vary: API-Version header

  STRATEGY 3: CONTENT NEGOTIATION
  ─────────────────────────────────
  GET /api/users
  Accept: application/vnd.myapi.v2+json

  Pros:
  • Follows HTTP semantics formally
  • Server can return different representations for the same resource
  Cons:
  • Very verbose, unusual for most teams
  • Poor client tooling support (most HTTP clients don't handle it well)
  • Difficult to document clearly

  STRATEGY 4: QUERY PARAMETER
  ────────────────────────────
  GET /api/users?v=2

  Pros:
  • Easy to test in browser
  • No special headers needed
  Cons:
  • Cache keys include the query string — can cause issues
  • Pollutes query params (conflicts with real filters)
  • Generally considered poor form for versioning

  INDUSTRY RECOMMENDATION
  ────────────────────────
  URL path versioning (/v1/, /v2/) dominates because it is unambiguous,
  easy to document, and easy to route — despite its theoretical impurity.
  Header versioning is the runner-up for internal APIs.

  DEPRECATION LIFECYCLE
  ──────────────────────
  1. Announce deprecation in changelog and documentation
  2. Add Deprecation header to all v1 responses:
       Deprecation: true
       Sunset: Sat, 01 Jan 2026 00:00:00 GMT
  3. Add X-Deprecation-Notice header:
       X-Deprecation-Notice: v1 sunsets 2026-01-01. Migrate to /v2/.
  4. Monitor traffic: wait until v1 usage drops to near zero
  5. Sunset: return 410 Gone (not 404) when the version is removed

  WHEN NOT TO VERSION
  ────────────────────
  • Additive changes: new optional fields in the response are non-breaking
  • Additive endpoints: new routes don't break existing clients
  • Non-breaking field renames can be handled with aliases
  → Only version when you REMOVE or CHANGE existing fields/behaviours
*/

// Simulate version routing middleware
type ApiVersion = "v1" | "v2";

interface VersionedRequest {
  path: string;
  headers: Record<string, string>;
  query: Record<string, string>;
}

function detectVersion(req: VersionedRequest): ApiVersion {
  // Strategy 1: URL
  if (req.path.startsWith("/api/v2/")) return "v2";
  if (req.path.startsWith("/api/v1/")) return "v1";
  // Strategy 2: Header
  if (req.headers["api-version"] === "2") return "v2";
  // Strategy 4: Query param
  if (req.query["v"] === "2") return "v2";
  // Default
  return "v1";
}

const reqV1: VersionedRequest = { path: "/api/v1/users", headers: {}, query: {} };
const reqV2Header: VersionedRequest = { path: "/api/users", headers: { "api-version": "2" }, query: {} };
const reqV2Query: VersionedRequest  = { path: "/api/users", headers: {}, query: { v: "2" } };

console.log("URL versioning →", detectVersion(reqV1));
console.log("Header versioning →", detectVersion(reqV2Header));
console.log("Query param versioning →", detectVersion(reqV2Query));

// Sunset header example
function addDeprecationHeaders(version: ApiVersion): Record<string, string> {
  if (version === "v1") {
    return {
      "Deprecation": "true",
      "Sunset": "Sat, 01 Jan 2026 00:00:00 GMT",
      "X-Deprecation-Notice": "v1 sunsets 2026-01-01. Migrate to /api/v2/.",
      "Link": '</api/v2/users>; rel="successor-version"',
    };
  }
  return {};
}
console.log("Deprecation headers for v1:", addDeprecationHeaders("v1"));

// ───────────────────────────────────────────────────────────────
// 6. OpenAPI / Swagger
// ───────────────────────────────────────────────────────────────

console.log("\n=== 6. OpenAPI / Swagger ===");

/*
  WHAT IS OPENAPI?
  ─────────────────
  OpenAPI (formerly Swagger) is a machine-readable specification for REST APIs.
  The spec is a YAML or JSON document that describes:
    • Every endpoint (path + HTTP method)
    • Request parameters (path, query, header, cookie)
    • Request body schemas
    • Response schemas and status codes
    • Authentication schemes (apiKey, OAuth2, Bearer)
    • Reusable components (schemas, responses, parameters)

  WHY IT MATTERS
  ──────────────
  • Auto-generate interactive docs (Swagger UI, Redoc)
  • Generate client SDKs (openapi-generator for JS, Python, Java, Go, ...)
  • Generate server stubs and mock servers
  • Validate requests / responses automatically
  • Contract testing between teams (frontend agrees on spec before backend ships)

  OPENAPI 3.1 DOCUMENT STRUCTURE (YAML)
  ──────────────────────────────────────

  openapi: 3.1.0
  info:
    title: User API
    version: "2.0"
    description: Manages users and their posts.

  servers:
    - url: https://api.example.com/v2

  components:
    schemas:
      User:
        type: object
        required: [id, name, email]
        properties:
          id:    { type: string, format: uuid }
          name:  { type: string, minLength: 1, maxLength: 100 }
          email: { type: string, format: email }
          role:  { type: string, enum: [admin, user] }

      Problem:           # RFC 7807 error schema (see Section 7)
        type: object
        properties:
          type:   { type: string, format: uri }
          title:  { type: string }
          status: { type: integer }
          detail: { type: string }

    securitySchemes:
      bearerAuth:
        type: http
        scheme: bearer
        bearerFormat: JWT

  security:
    - bearerAuth: []    # apply globally; override per-endpoint if needed

  paths:
    /users/{id}:
      get:
        summary: Get a user by ID
        parameters:
          - name: id
            in: path
            required: true
            schema: { type: string, format: uuid }
        responses:
          "200":
            description: User found
            content:
              application/json:
                schema: { $ref: '#/components/schemas/User' }
          "404":
            description: User not found
            content:
              application/json:
                schema: { $ref: '#/components/schemas/Problem' }

  CODE-FIRST vs SPEC-FIRST
  ─────────────────────────
  Spec-first (design-first):
    Write the YAML spec before any code.
    Pro: forces API design thinking; frontend can mock before backend ships.
    Con: maintaining spec + code in sync is manual work.

  Code-first:
    Annotate your Express/Fastify/NestJS handlers; a library generates the spec.
    Libraries:
      • tsoa          → decorators on classes → generates OpenAPI + routes
      • zod-openapi   → derive OpenAPI schema directly from Zod schemas
      • swagger-jsdoc → JSDoc comments → OpenAPI

  SERVING SWAGGER UI (code-first with swagger-ui-express):

  import swaggerUi from 'swagger-ui-express';
  import swaggerJsdoc from 'swagger-jsdoc';

  const spec = swaggerJsdoc({
    definition: { openapi: '3.1.0', info: { title: 'My API', version: '1.0' } },
    apis: ['./routes/*.ts'],  // files with JSDoc @openapi comments
  });

  app.use('/docs', swaggerUi.serve, swaggerUi.setup(spec));
  // Visit http://localhost:3000/docs for interactive docs

  GENERATING CLIENT SDKs FROM SPEC
  ─────────────────────────────────
  # Generate a TypeScript/Axios client from your spec:
  npx openapi-generator-cli generate \
    -i openapi.yaml \
    -g typescript-axios \
    -o ./generated/client

  # Or use openapi-typescript for type-only generation:
  npx openapi-typescript openapi.yaml -o ./types/api.d.ts
*/

// TypeScript representation of a minimal OpenAPI 3.1 document
interface OpenAPIInfo {
  title: string;
  version: string;
  description?: string;
}

interface OpenAPIServer {
  url: string;
  description?: string;
}

interface OpenAPIDocument {
  openapi: "3.1.0";
  info: OpenAPIInfo;
  servers: OpenAPIServer[];
  paths: Record<string, unknown>;
}

const exampleSpec: OpenAPIDocument = {
  openapi: "3.1.0",
  info: {
    title: "User API",
    version: "2.0",
    description: "Manages users and their posts.",
  },
  servers: [
    { url: "https://api.example.com/v2", description: "Production" },
    { url: "http://localhost:3000/v2",   description: "Local dev" },
  ],
  paths: {
    "/users/{id}": {
      get: {
        summary: "Get a user by ID",
        parameters: [{ name: "id", in: "path", required: true }],
        responses: { "200": { description: "User found" }, "404": { description: "Not found" } },
      },
    },
  },
};

console.log("OpenAPI spec (truncated):", JSON.stringify(exampleSpec.info, null, 2));

// ───────────────────────────────────────────────────────────────
// 7. Response Design Patterns
// ───────────────────────────────────────────────────────────────

console.log("\n=== 7. Response Design Patterns ===");

/*
  ENVELOPE vs NO ENVELOPE
  ────────────────────────
  Envelope wraps the actual data in a container object:

    // Envelope:
    { "data": { "id": "u_1", "name": "Sadik" }, "meta": { ... } }

    // No envelope:
    { "id": "u_1", "name": "Sadik" }

  Envelope pros: consistent place for metadata (pagination, warnings, deprecations)
  No-envelope pros: leaner payload, JSON:API / REST semantics are cleaner
  Rule: if you need meta, use an envelope. Otherwise keep it flat.

  JSON:API SPEC (briefly)
  ───────────────────────
  A formal spec (jsonapi.org) for structuring REST responses:
  { "data": { "type": "users", "id": "1", "attributes": { ... }, "relationships": { ... } } }
  Rarely adopted in full — most teams cherry-pick ideas from it.

  RFC 7807 — PROBLEM DETAILS FOR HTTP APIs
  ─────────────────────────────────────────
  Standard error format. Content-Type: application/problem+json

  {
    "type":     "https://example.com/errors/user-not-found",  ← URI identifying error type
    "title":    "User Not Found",                             ← human-readable summary
    "status":   404,                                          ← HTTP status
    "detail":   "No user found with id u_999",               ← specific to this occurrence
    "instance": "/users/u_999"                                ← URI of the failing request
  }

  Why RFC 7807?
  • Machine-readable error types (clients can branch on `type`)
  • Consistent across all endpoints
  • Supported by many frameworks natively (Spring, FastAPI, ASP.NET)

  PAGINATION METADATA
  ────────────────────
  Cursor-based (preferred for large datasets):
  {
    "data": [...],
    "pagination": {
      "cursor":  "eyJpZCI6MTAwfQ==",
      "hasMore": true,
      "limit":   20
    }
  }

  Offset-based (simpler, but inconsistent under insertions):
  {
    "data": [...],
    "pagination": { "page": 2, "perPage": 20, "total": 350, "totalPages": 18 }
  }

  FIELD PRESENCE: null vs OMIT
  ─────────────────────────────
  • Include the field as null → client knows the field exists but is unset
  • Omit the field → field may not apply to this resource type
  Consistency matters: pick one convention and apply it everywhere.

  NAMING CONVENTIONS
  ───────────────────
  • camelCase keys in JSON (JavaScript convention)
  • snake_case is also common (Python/database convention)
  • Pick one, document it in your OpenAPI spec, never mix

  DATES
  ──────
  Always ISO 8601 with timezone: "2024-06-15T14:30:00Z"
  Never Unix timestamps in a primary response (add as optional for perf-critical clients)
  Never locale-specific formats ("15/06/2024" or "Jun 15, 2024")

  HATEOAS (Hypermedia as the Engine of Application State)
  ────────────────────────────────────────────────────────
  Include links in the response so clients discover available actions:
  {
    "id": "u_1",
    "name": "Sadik",
    "_links": {
      "self":   { "href": "/users/u_1" },
      "posts":  { "href": "/users/u_1/posts" },
      "delete": { "href": "/users/u_1", "method": "DELETE" }
    }
  }
  Rarely implemented fully in practice — the overhead is high and most
  clients hardcode URLs anyway. Worth knowing the concept.
*/

// RFC 7807 Problem object in TypeScript
interface ProblemDetails {
  type: string;       // URI identifying the error class
  title: string;      // Human-readable, stable (same for all occurrences of this error type)
  status: number;     // HTTP status code
  detail?: string;    // Specific to this request occurrence
  instance?: string;  // URI of the request that caused the error
  [key: string]: unknown; // Extensible — add domain-specific fields
}

function createProblem(
  type: string,
  title: string,
  status: number,
  detail?: string,
  instance?: string,
): ProblemDetails {
  const problem: ProblemDetails = { type, title, status };
  if (detail)   problem.detail   = detail;
  if (instance) problem.instance = instance;
  return problem;
}

const notFoundError = createProblem(
  "https://example.com/errors/user-not-found",
  "User Not Found",
  404,
  "No user found with id u_999",
  "/users/u_999",
);
console.log("RFC 7807 error:", JSON.stringify(notFoundError, null, 2));

// Pagination envelope
interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    cursor: string | null;
    hasMore: boolean;
    limit: number;
  };
}

function paginatedResponse<T>(
  data: T[],
  cursor: string | null,
  hasMore: boolean,
  limit: number,
): PaginatedResponse<T> {
  return { data, pagination: { cursor, hasMore, limit } };
}

const pagedUsers = paginatedResponse(
  [{ id: "u_1", name: "Sadik" }, { id: "u_2", name: "Rahul" }],
  "eyJpZCI6Mn0=",
  true,
  20,
);
console.log("Paginated response:", JSON.stringify(pagedUsers, null, 2));

// ───────────────────────────────────────────────────────────────
// 8. API Gateway Pattern
// ───────────────────────────────────────────────────────────────

console.log("\n=== 8. API Gateway Pattern ===");

/*
  WHAT IS AN API GATEWAY?
  ────────────────────────
  A single entry point that sits in front of all your backend services.
  Clients call ONE host; the gateway routes requests to the correct service.

  Client → API Gateway → User Service
                       → Order Service
                       → Payment Service
                       → Notification Service

  WHAT THE GATEWAY HANDLES
  ─────────────────────────
  • Routing: /api/users/** → User Service; /api/orders/** → Order Service
  • Authentication: validate JWT/API key once at the edge (not per service)
  • Rate limiting: 100 req/min per IP, 1000 req/min per API key
  • SSL termination: HTTPS at the gateway; HTTP inside the cluster
  • Request/response transformation: add headers, strip internal fields
  • Load balancing: distribute traffic across service replicas
  • Circuit breaking: stop forwarding to a failing service
  • Observability: centralised logging, metrics, distributed tracing

  AUTH: GATEWAY vs PER-SERVICE
  ─────────────────────────────
  Gateway-level auth:
    Pro: validate once, propagate identity header (X-User-Id) downstream
    Con: services trust the header blindly — internal misuse is possible
    Good for: trusted internal network (Kubernetes cluster)

  Per-service auth:
    Pro: defence in depth — even internal traffic is verified
    Con: every service re-validates the token (latency + key distribution)
    Good for: zero-trust networks, regulated industries

  Common pattern: gateway validates JWT signature, forwards decoded claims
  as X-User-Id + X-User-Role headers, services trust headers from the gateway.

  POPULAR GATEWAYS
  ─────────────────
  Kong            → open-source, Lua plugins, DB-backed config
  AWS API Gateway → serverless-friendly, deep AWS integration
  nginx           → fast, config-file-driven, widely understood
  Traefik         → Kubernetes-native, automatic service discovery
  Envoy           → high-performance proxy, used by Istio service mesh

  BFF — BACKEND FOR FRONTEND PATTERN
  ────────────────────────────────────
  A variant where each frontend (web, iOS, Android) gets its OWN gateway
  tailored to its data needs.

  Web Client   → BFF-Web   → aggregates multiple services → returns web-optimised shape
  iOS Client   → BFF-iOS   → aggregates multiple services → returns mobile-optimised shape
  Android      → BFF-Android

  Benefits:
  • Each BFF returns exactly what its client needs (eliminates over-fetching)
  • Frontend teams own their BFF — no waiting for backend API changes
  • Different auth strategies per client if needed

  Cost:
  • Maintenance overhead: N frontends = N BFFs
  • Code duplication if BFFs share significant logic
*/

// Simulate gateway routing logic
interface GatewayRoute {
  prefix: string;
  upstream: string;
  rateLimit: number; // requests per minute
  requiresAuth: boolean;
}

const gatewayRoutes: GatewayRoute[] = [
  { prefix: "/api/users",        upstream: "http://user-service:3001",    rateLimit: 1000, requiresAuth: true  },
  { prefix: "/api/orders",       upstream: "http://order-service:3002",   rateLimit: 500,  requiresAuth: true  },
  { prefix: "/api/payments",     upstream: "http://payment-service:3003", rateLimit: 200,  requiresAuth: true  },
  { prefix: "/api/public/docs",  upstream: "http://docs-service:3004",    rateLimit: 100,  requiresAuth: false },
];

function routeRequest(path: string): GatewayRoute | null {
  return gatewayRoutes.find(r => path.startsWith(r.prefix)) ?? null;
}

console.log("Gateway routing:");
["/api/users/u_1", "/api/payments/checkout", "/api/unknown"].forEach(path => {
  const route = routeRequest(path);
  if (route) {
    console.log(`  ${path} → ${route.upstream} (auth: ${route.requiresAuth}, rateLimit: ${route.rateLimit}/min)`);
  } else {
    console.log(`  ${path} → 404 No matching upstream`);
  }
});

// ───────────────────────────────────────────────────────────────
// PRACTICE
// ───────────────────────────────────────────────────────────────

console.log("\n=== Practice Q&A ===");

/*
  Q1: A mobile client fetches a user profile but only needs `name` and `avatar`.
      With REST it gets 20 fields. What problem is this and what solves it?

  A: This is OVER-FETCHING — the server sends more data than the client needs.
     Solutions:
     • GraphQL: client specifies exact fields in the query; server returns only those.
     • REST sparse fieldsets: ?fields=name,avatar (uncommon, not standard)
     • BFF: a mobile-specific backend aggregates and trims the response
     GraphQL is the canonical solution for diverse clients with different field needs.

  ──────────────────────────────────────────────────────────────────────────────

  Q2: Why is tRPC not suitable for a public API consumed by non-TypeScript clients?

  A: tRPC's entire value proposition is TypeScript end-to-end type inference.
     The client library (@trpc/client) is TypeScript-only and imports the server's
     router type directly. A Python, Swift, or Go client cannot import TypeScript types,
     cannot use the tRPC client library, and gets no type safety benefits.
     For public APIs, REST (with an OpenAPI spec) or GraphQL are the right choices
     because they are language-agnostic — any HTTP client can call a REST endpoint,
     and any language has GraphQL client libraries.

  ──────────────────────────────────────────────────────────────────────────────

  Q3: What's the risk of versioning by URL (/v1/, /v2/) when you have 30 endpoints?

  A: Route explosion / maintenance burden.
     With 30 endpoints × 3 versions = 90 route handlers to maintain.
     Identical logic gets duplicated across versions for endpoints that didn't change.
     Testing surface grows proportionally.
     Mitigation strategies:
     • Only version endpoints that actually change (not all 30)
     • Share underlying service logic; the versioned route is just a thin adapter
     • Aggressively sunset old versions to shrink the matrix
     • Consider header versioning for internal APIs to avoid URL duplication

  ──────────────────────────────────────────────────────────────────────────────

  Q4: What does the RFC 7807 problem+json format look like?

  A: Content-Type: application/problem+json
     {
       "type":     "https://api.example.com/errors/insufficient-funds",
       "title":    "Insufficient Funds",
       "status":   422,
       "detail":   "Account balance is $10.00; transfer requires $250.00.",
       "instance": "/accounts/acc_42/transfer"
     }
     Fields:
       type     → URI uniquely identifying the error class (not an instance)
       title    → stable human-readable summary (same for all occurrences)
       status   → mirrors the HTTP status code
       detail   → specific to this occurrence (may expose request-specific data)
       instance → URI of the specific failing request (optional)
     Extensible: add domain fields (e.g., "balance", "required") alongside standard fields.

  ──────────────────────────────────────────────────────────────────────────────

  Q5: When would you choose GraphQL over tRPC for an internal API?

  A: Choose GraphQL over tRPC for an internal API when:
     • The team is polyglot (some services in Python/Go, not just TypeScript)
     • You have multiple internal clients with significantly different data needs
       (web dashboard, data pipeline, admin tool) and want them to self-serve
     • The data model is a genuine graph (entities with complex relationships)
       and client-driven traversal of that graph is a core requirement
     • You need subscriptions for real-time features with an established
       GraphQL infrastructure (Apollo Studio, schema registry)
     • You are already on GraphQL elsewhere and want a consistent pattern
     tRPC wins when EVERY consumer is TypeScript and all in the same monorepo.
     GraphQL wins when the client diversity or language diversity exceeds tRPC's reach.
*/

// ───────────────────────────────────────────────────────────────
// runDemo — comparison table + reference card
// ───────────────────────────────────────────────────────────────

function runDemo(): void {
  console.log("\n" + "═".repeat(72));
  console.log("BACKEND 15 — API PARADIGMS REFERENCE CARD");
  console.log("═".repeat(72));

  console.log("\n▸ PARADIGM COMPARISON");
  console.log("─".repeat(72));

  const rows: [string, string, string, string][] = [
    ["Dimension",            "REST",                   "GraphQL",             "tRPC"],
    ["─".repeat(18),        "─".repeat(22),           "─".repeat(22),        "─".repeat(20)],
    ["Type safety",          "None (add OpenAPI)",     "SDL schema",          "Full TS inference"],
    ["HTTP caching",         "Excellent",              "Poor",                "Moderate"],
    ["Client flexibility",   "Any language",           "Any language",        "TypeScript only"],
    ["Over-fetching",        "Problem",                "Solved",              "Solved"],
    ["Under-fetching",       "Problem",                "Solved",              "Solved"],
    ["Learning curve",       "Low",                    "Medium-High",         "Low (need TS)"],
    ["Code generation",      "Optional",               "Required",            "None needed"],
    ["Real-time",            "Polling / SSE",          "Subscriptions (WS)",  "Subscriptions (WS)"],
    ["Best for",             "Public / CRUD APIs",     "Diverse clients",     "TS monorepos"],
    ["Avoid when",           "Complex data graphs",    "Public/non-TS API",   "Non-TS clients"],
  ];

  rows.forEach(([d, r, g, t]) => {
    console.log(
      `  ${d.padEnd(18)}  ${r.padEnd(22)}  ${g.padEnd(22)}  ${t}`,
    );
  });

  console.log("\n▸ API VERSIONING STRATEGIES");
  console.log("─".repeat(72));
  const strategies: [string, string, string][] = [
    ["Strategy",              "Example",                          "Best for"],
    ["─".repeat(16),         "─".repeat(34),                    "─".repeat(18)],
    ["URL path",              "GET /api/v2/users",                "Public APIs (default)"],
    ["Header",                "API-Version: 2",                   "Internal APIs"],
    ["Content negotiation",   "Accept: application/vnd.api.v2",   "Formally correct"],
    ["Query param",           "GET /api/users?v=2",               "Quick prototypes"],
  ];
  strategies.forEach(([s, e, b]) => {
    console.log(`  ${s.padEnd(16)}  ${e.padEnd(34)}  ${b}`);
  });

  console.log("\n▸ RESPONSE DESIGN QUICK RULES");
  console.log("─".repeat(72));
  const rules = [
    "Errors      → RFC 7807 problem+json (Content-Type: application/problem+json)",
    "Pagination  → cursor-based preferred for large/live data; offset for simple cases",
    "Dates       → ISO 8601 with timezone: 2024-06-15T14:30:00Z",
    "Naming      → camelCase keys; pick one convention and never mix",
    "Null fields → include as null if field exists but is unset; omit if field doesn't apply",
    "Envelope    → use when you need metadata (pagination, warnings); skip for leaf resources",
  ];
  rules.forEach(r => console.log(`  • ${r}`));

  console.log("\n▸ OPENAPI TOOLCHAIN");
  console.log("─".repeat(72));
  const tools = [
    "swagger-ui-express  → serve interactive docs from an Express app",
    "zod-openapi         → derive OpenAPI schema from Zod schemas (code-first)",
    "tsoa                → decorators on classes → routes + OpenAPI spec",
    "openapi-typescript  → generate TypeScript types from an OpenAPI spec",
    "openapi-generator   → generate full client SDKs in 40+ languages",
  ];
  tools.forEach(t => console.log(`  • ${t}`));

  console.log("\n▸ API GATEWAY RESPONSIBILITIES");
  console.log("─".repeat(72));
  const gw = [
    "Routing         → map URL prefixes to upstream services",
    "Auth            → validate JWT once; forward identity headers",
    "Rate limiting   → protect services from abuse at the edge",
    "SSL termination → HTTPS at gateway; plain HTTP inside cluster",
    "Observability   → centralised logs, metrics, distributed tracing",
    "Circuit breaking→ stop forwarding to failing services automatically",
    "BFF variant     → separate gateway per frontend (web / iOS / Android)",
  ];
  gw.forEach(g => console.log(`  • ${g}`));

  console.log("\n" + "═".repeat(72));
}

export default runDemo;

runDemo();
