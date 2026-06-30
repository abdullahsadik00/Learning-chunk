// ═══════════════════════════════════════════════════════════════
// BACKEND 04: AUTHENTICATION · JWT · SESSIONS · OAUTH · SECURITY  (Day 39)
// Run: npx ts-node 04-auth-jwt-oauth.ts
// ═══════════════════════════════════════════════════════════════
//
// Authentication answers: WHO are you?
// Authorization answers:  WHAT are you allowed to do?
//
// This file covers the full auth stack used in production Node.js apps:
//   1. Authentication vs Authorization + RBAC/ABAC
//   2. Password security — bcrypt, salting, cost factors
//   3. JWT — structure, signing, access + refresh token pattern
//   4. Session-based auth — express-session, stateful vs stateless
//   5. Refresh token rotation + family invalidation
//   6. OAuth 2.0 — flows, roles, "Login with Google"
//   7. Security headers — helmet, CORS, CSRF, SameSite
//   8. Common auth vulnerabilities — brute force, IDOR, alg:none

// ───────────────────────────────────────────────────────────────
// 1. Authentication vs Authorization
// ───────────────────────────────────────────────────────────────

console.log("=== 1. Authentication vs Authorization ===");

/*
  AUTHENTICATION (AuthN) — verifying identity
    "Are you really who you say you are?"
    Mechanisms: password check, OTP, biometrics, magic link, OAuth

  AUTHORIZATION (AuthZ) — verifying permissions
    "Are you allowed to do this thing?"
    Mechanisms: RBAC, ABAC, ACL, policy engines (OPA)

  ORDER MATTERS: always AuthN first, then AuthZ.
  A correctly identified user can still be unauthorized.

  ─────────────────────────────────────────────────────────────
  RBAC — Role-Based Access Control
    Users are assigned roles. Roles carry permissions.
    Simple, predictable, easy to audit.

    Roles in a typical SaaS: admin | moderator | user | guest

  ABAC — Attribute-Based Access Control
    Access decisions use attributes of the subject (user), object
    (resource), environment (time, location).
    Example: "Only managers in the finance department can view
    payroll records before 6 PM on weekdays."
    More expressive than RBAC but harder to reason about.
  ─────────────────────────────────────────────────────────────
*/

type Role = "admin" | "moderator" | "user" | "guest";

interface Permission {
  resource: string;
  actions: ("create" | "read" | "update" | "delete")[];
}

// Minimal RBAC permission map
const rolePermissions: Record<Role, Permission[]> = {
  admin: [
    { resource: "users",   actions: ["create", "read", "update", "delete"] },
    { resource: "posts",   actions: ["create", "read", "update", "delete"] },
    { resource: "reports", actions: ["create", "read", "update", "delete"] },
  ],
  moderator: [
    { resource: "posts",   actions: ["read", "update", "delete"] },
    { resource: "users",   actions: ["read"] },
  ],
  user: [
    { resource: "posts",   actions: ["create", "read", "update"] },
    { resource: "users",   actions: ["read"] },
  ],
  guest: [
    { resource: "posts",   actions: ["read"] },
  ],
};

type Action = "create" | "read" | "update" | "delete";

function canDo(role: Role, resource: string, action: Action): boolean {
  const perms = rolePermissions[role] ?? [];
  const match = perms.find(p => p.resource === resource);
  return match ? match.actions.includes(action) : false;
}

console.log("admin  delete users?",    canDo("admin",     "users", "delete")); // true
console.log("user   delete posts?",    canDo("user",      "posts", "delete")); // false
console.log("guest  read posts?",      canDo("guest",     "posts", "read"));   // true
console.log("moderator delete posts?", canDo("moderator", "posts", "delete")); // true

// Middleware pattern — inject into Express with req.user.role
function requireRole(role: Role) {
  return (reqRole: Role): boolean => {
    const hierarchy: Role[] = ["guest", "user", "moderator", "admin"];
    return hierarchy.indexOf(reqRole) >= hierarchy.indexOf(role);
  };
}

const requireAdmin = requireRole("admin");
console.log("Is user an admin?", requireAdmin("user"));  // false
console.log("Is admin an admin?", requireAdmin("admin")); // true

// ───────────────────────────────────────────────────────────────
// 2. Password Security
// ───────────────────────────────────────────────────────────────

console.log("\n=== 2. Password Security ===");

/*
  NEVER store plaintext passwords. EVER.
  If your database is breached, plaintext = instant game over.

  ─────────────────────────────────────────────────────────────
  WHY NOT MD5 / SHA1 / SHA256 for passwords?
    These are fast cryptographic hash functions — that's the problem.
    Attackers can compute billions of SHA-256 hashes per second on
    a consumer GPU. A rainbow table or brute force attack succeeds
    quickly even against salted SHA-256.

    MD5:    ~50 billion hashes/sec on GPU
    SHA-256: ~10 billion hashes/sec on GPU
    bcrypt (cost=12): ~300 hashes/sec on GPU  ← attacker's nightmare

  ─────────────────────────────────────────────────────────────
  SALTING
    A salt is random bytes appended to the password before hashing.
    - Prevents rainbow table attacks (precomputed hash lookups)
    - Ensures two users with the same password get different hashes
    - bcrypt generates and stores the salt automatically inside
      the output hash string — you don't manage it separately.

  ─────────────────────────────────────────────────────────────
  BCRYPT — deliberately slow, intentionally adjustable
    Hash format: $2b$12$<22-char-salt><31-char-hash>
                  ↑  ↑
                  algorithm version
                     cost factor (rounds = 2^12 = 4096 iterations)

    Cost factor / work factor:
      - Each increment DOUBLES the time to hash
      - Cost 10 → ~100 ms   (fine for low traffic)
      - Cost 12 → ~300 ms   (OWASP recommended minimum 2024)
      - Cost 14 → ~1.2 s    (high security, higher CPU cost)

    Pick the highest cost your server can handle while keeping
    login latency under ~500 ms. Re-evaluate yearly as hardware
    gets faster.

  ─────────────────────────────────────────────────────────────
  OWASP PASSWORD RECOMMENDATIONS (2024)
    - Minimum 8 characters (prefer 12+)
    - Allow all printable ASCII + Unicode
    - Check against known-breached password lists (HaveIBeenPwned API)
    - No mandatory complexity rules (they cause "Password1!")
    - No periodic forced rotation (causes weak incremental changes)
    - Use bcrypt (cost≥12), scrypt, or Argon2id
  ─────────────────────────────────────────────────────────────
*/

// Simulated bcrypt — in real code: import bcrypt from "bcrypt"
// npm install bcrypt @types/bcrypt
const SIMULATED_BCRYPT_HASH = "$2b$12$saltsaltsaltsaltsalts.hashhashhashhashhashhash";

async function simulatedHashPassword(plaintext: string, costFactor = 12): Promise<string> {
  // Real code:
  //   const hash = await bcrypt.hash(plaintext, costFactor);
  //   return hash;
  console.log(`  [bcrypt] hashing "${plaintext}" with cost=${costFactor}`);
  // Simulate the slow work (bcrypt does 2^costFactor iterations):
  return `$2b$${costFactor}$<salt><hash of ${plaintext}>`;
}

async function simulatedVerifyPassword(plaintext: string, hash: string): Promise<boolean> {
  // Real code:
  //   return bcrypt.compare(plaintext, hash);
  // bcrypt.compare re-extracts the salt from hash, re-hashes plaintext,
  // and does a timing-safe comparison.
  console.log(`  [bcrypt] comparing plaintext to stored hash`);
  return hash.includes(plaintext); // SIMULATION ONLY — never do this
}

(async () => {
  const hash = await simulatedHashPassword("hunter2", 12);
  console.log("Stored hash:", hash);

  const match = await simulatedVerifyPassword("hunter2", hash);
  console.log("Password matches?", match); // true

  const wrong = await simulatedVerifyPassword("wrongpass", hash);
  console.log("Wrong password?", wrong);   // false
})();

// ───────────────────────────────────────────────────────────────
// 3. JWT — JSON Web Tokens
// ───────────────────────────────────────────────────────────────

console.log("\n=== 3. JWT — JSON Web Tokens ===");

/*
  JWT STRUCTURE
    A JWT is three Base64URL-encoded JSON objects joined by dots:

      header.payload.signature

    HEADER  — algorithm and token type
      { "alg": "HS256", "typ": "JWT" }

    PAYLOAD — claims (data about the user/session)
      {
        "iss": "https://auth.myapp.com",   // issuer
        "sub": "user_123",                  // subject (user id)
        "aud": "https://api.myapp.com",    // audience
        "exp": 1720000900,                 // expiry (unix timestamp)
        "iat": 1720000000,                 // issued at
        "jti": "uuid-v4",                  // JWT ID (for revocation)
        "role": "admin"                    // custom claim
      }

    SIGNATURE — HMAC-SHA256(base64(header) + "." + base64(payload), secret)
      Proves the token was issued by the server and not tampered with.

  ─────────────────────────────────────────────────────────────
  HS256 vs RS256
    HS256 (symmetric) — same secret signs AND verifies
      Use when only ONE service issues and verifies tokens.
      Secret must be shared — risky with many services.

    RS256 (asymmetric) — private key signs, public key verifies
      Any service can verify using the public key.
      Only the auth server holds the private key.
      Use for distributed systems, microservices, third-party clients.
      Public keys exposed via JWKS endpoint: /.well-known/jwks.json

  ─────────────────────────────────────────────────────────────
  ACCESS TOKEN vs REFRESH TOKEN PATTERN
    Access token  — short-lived (15 min), sent with every API request
    Refresh token — long-lived (7–30 days), stored securely, used ONLY
                    to get new access tokens from /auth/refresh

    Why two tokens?
      - Short access token window minimises damage if stolen
      - Refresh token stays off the network except when refreshing
      - Enables logout via refresh token revocation without a blacklist
        for access tokens (just let them expire in 15 min)

  ─────────────────────────────────────────────────────────────
  WHERE TO STORE TOKENS
    localStorage:
      + Simple to implement
      - Accessible to any JavaScript on the page (XSS risk)
      - If your site has one XSS vulnerability, tokens are stolen

    httpOnly cookie:
      + Inaccessible to JavaScript (no XSS token theft)
      + Browser sends automatically on same-origin requests
      - Vulnerable to CSRF — mitigate with SameSite=Strict/Lax
                              and CSRF tokens for state-changing ops
      + Preferred for most web apps

    Memory (React state, module variable):
      + Invisible to both XSS and CSRF
      - Lost on page refresh — requires silent refresh via httpOnly
        refresh token cookie
      + Ideal for high-security SPAs

  ─────────────────────────────────────────────────────────────
  TOKEN REVOCATION PROBLEM
    JWTs are stateless — the server does not track issued tokens.
    A valid JWT stays valid until expiry even after "logout".

    Solutions:
    1. Short expiry (15 min access tokens) — small theft window
    2. Token blacklist — store revoked JTIs in Redis; check on each
       request. Adds network hop but scales well.
    3. Refresh token rotation — rotate refresh on use; detect reuse
       (see section 5).
    4. Version counter — store token_version in DB; increment on
       logout; reject tokens with outdated version.
  ─────────────────────────────────────────────────────────────
*/

// npm install jsonwebtoken @types/jsonwebtoken
// import jwt from "jsonwebtoken";

interface JwtPayload {
  sub: string;
  role: Role;
  iss: string;
  aud: string;
  iat: number;
  exp: number;
  jti: string;
}

// Simulated JWT implementation (shows the concepts without the npm package)
function base64url(data: object): string {
  return Buffer.from(JSON.stringify(data)).toString("base64url");
}

function simulatedJwtSign(
  payload: Omit<JwtPayload, "iat" | "exp" | "jti">,
  secret: string,
  expiresInSeconds: number
): string {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "HS256", typ: "JWT" };
  const fullPayload: JwtPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
    jti: `jti-${Math.random().toString(36).slice(2)}`,
  };
  const unsigned = `${base64url(header)}.${base64url(fullPayload)}`;
  // Real code uses crypto.createHmac("sha256", secret).update(unsigned).digest("base64url")
  const fakeSignature = Buffer.from(`HMAC(${secret},${unsigned})`).toString("base64url");
  return `${unsigned}.${fakeSignature}`;
}

function simulatedJwtVerify(token: string, _secret: string): JwtPayload | null {
  try {
    const [, payloadB64] = token.split(".");
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString()) as JwtPayload;
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) { console.log("  Token expired"); return null; }
    // Real code also verifies the signature cryptographically
    return payload;
  } catch {
    return null;
  }
}

const JWT_SECRET = "super-secret-key-min-32-chars-long!!";

const accessToken = simulatedJwtSign(
  { sub: "user_123", role: "admin", iss: "https://auth.myapp.com", aud: "https://api.myapp.com" },
  JWT_SECRET,
  15 * 60  // 15 minutes
);

const refreshToken = simulatedJwtSign(
  { sub: "user_123", role: "admin", iss: "https://auth.myapp.com", aud: "https://auth.myapp.com" },
  JWT_SECRET + "_refresh", // different secret for refresh tokens
  7 * 24 * 60 * 60          // 7 days
);

console.log("Access token (first 60 chars):", accessToken.slice(0, 60) + "...");
const verified = simulatedJwtVerify(accessToken, JWT_SECRET);
console.log("Verified payload sub:", verified?.sub, "role:", verified?.role);
console.log("Refresh token expiry: 7 days");

// Real express middleware pattern:
/*
  import jwt from "jsonwebtoken";

  function authenticate(req: Request, res: Response, next: NextFunction) {
    // Token from httpOnly cookie (preferred) or Authorization header
    const token = req.cookies.accessToken
      ?? req.headers.authorization?.split(" ")[1];

    if (!token) return res.status(401).json({ error: "No token" });

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
      req.user = payload;
      next();
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        return res.status(401).json({ error: "Token expired" });
      }
      return res.status(401).json({ error: "Invalid token" });
    }
  }
*/

// ───────────────────────────────────────────────────────────────
// 4. Session-Based Auth
// ───────────────────────────────────────────────────────────────

console.log("\n=== 4. Session-Based Auth ===");

/*
  HOW IT WORKS
    1. User logs in with credentials
    2. Server creates a session object in a store (memory, Redis, DB)
    3. Server sends a Set-Cookie with the opaque session ID
    4. Browser sends that cookie on every subsequent request
    5. Server looks up session data by ID on each request

  SETUP (express-session):
    npm install express-session @types/express-session
    npm install connect-redis   (for Redis session store in prod)

  ─────────────────────────────────────────────────────────────
  SESSION vs JWT — comparison

  Aspect              | Session (stateful)        | JWT (stateless)
  ─────────────────── | ──────────────────────── | ────────────────────────
  Server memory       | Stores session per user   | No server state
  Revocation          | Delete session → instant  | Needs blacklist or wait
  Horizontal scaling  | Need shared store (Redis) | Any node can verify
  Payload size        | Cookie = tiny ID          | Token grows with claims
  DB hit per request  | Yes (session lookup)      | No (self-contained)
  Token theft impact  | Revoke session instantly  | Valid until expiry
  Simplicity          | Simpler mental model      | More moving parts

  WHEN TO PREFER SESSIONS
    - Traditional server-rendered apps (Next.js SSR, Express views)
    - When instant revocation is non-negotiable (banking, healthcare)
    - Monolithic apps where Redis is already in the stack
    - Admin panels where you want tight control

  WHEN TO PREFER JWT
    - Microservices / distributed systems
    - APIs consumed by mobile apps or third parties
    - Stateless serverless functions
  ─────────────────────────────────────────────────────────────
*/

// express-session configuration (would run in real Express app):
/*
  import session from "express-session";
  import RedisStore from "connect-redis";
  import { createClient } from "redis";

  const redisClient = createClient({ url: process.env.REDIS_URL });
  await redisClient.connect();

  app.use(session({
    store: new RedisStore({ client: redisClient }),
    secret: process.env.SESSION_SECRET!,  // signs the session ID cookie
    resave: false,             // don't save session if unmodified
    saveUninitialized: false,  // don't create session until data stored
    cookie: {
      httpOnly: true,          // no JS access
      secure: true,            // HTTPS only
      sameSite: "strict",      // CSRF protection
      maxAge: 1000 * 60 * 60 * 24 * 7,  // 7 days
    },
  }));

  // Login endpoint:
  app.post("/auth/login", async (req, res) => {
    const user = await User.findOne({ email: req.body.email });
    if (!user || !await bcrypt.compare(req.body.password, user.passwordHash)) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    req.session.userId = user.id;
    req.session.role   = user.role;
    res.json({ message: "Logged in" });
  });

  // Logout endpoint:
  app.post("/auth/logout", (req, res) => {
    req.session.destroy(err => {
      if (err) return res.status(500).json({ error: "Logout failed" });
      res.clearCookie("connect.sid");
      res.json({ message: "Logged out" });
    });
  });
*/

console.log("Session auth: cookie contains opaque ID; server does lookup in Redis/DB");
console.log("JWT auth:     cookie/header contains self-verifying signed token");

// ───────────────────────────────────────────────────────────────
// 5. Refresh Token Rotation
// ───────────────────────────────────────────────────────────────

console.log("\n=== 5. Refresh Token Rotation ===");

/*
  REFRESH TOKEN ROTATION FLOW
  ──────────────────────────────────────────────────────────────

  Login:
    POST /auth/login
    ← Set-Cookie: refreshToken=RT1 (httpOnly, secure, 7d)
    ← { accessToken: AT1 (15min, in body or memory) }

  Normal request cycle:
    → GET /api/data + Authorization: Bearer AT1
    ← 200 OK (access token valid)

  Access token expired:
    → POST /auth/refresh + Cookie: refreshToken=RT1
    ← { accessToken: AT2 (new 15min token) }
    ← Set-Cookie: refreshToken=RT2 (NEW refresh token, RT1 invalidated)

  Logout:
    → POST /auth/logout + Cookie: refreshToken=RT2
    Server deletes RT2 from DB
    ← Clear cookie

  ──────────────────────────────────────────────────────────────
  FAMILY INVALIDATION (detecting token reuse / theft)

  Refresh tokens are stored in DB with:
    - tokenHash (bcrypt hashed value)
    - familyId  (UUID shared by all rotated descendants)
    - used      (boolean — set to true after use)
    - userId

  Flow on POST /auth/refresh:
    1. Look up token by hash
    2. If token.used === true → REUSE DETECTED
       → Invalidate entire family (all tokens with same familyId)
       → Force user to re-login
       Rationale: if someone used an already-used token, either
       the attacker stole and replayed it, or a rotation race
       occurred. Safest response: revoke everything.
    3. If token.used === false:
       → Mark token.used = true
       → Issue new AT + new RT (same familyId)
       → Store new RT hash in DB
  ──────────────────────────────────────────────────────────────
*/

// Simulated in-memory token store (use Redis or DB in production)
interface RefreshTokenRecord {
  tokenHash: string;
  familyId: string;
  userId: string;
  used: boolean;
  expiresAt: number;
}

const refreshTokenStore = new Map<string, RefreshTokenRecord>();

function storeRefreshToken(token: string, userId: string, familyId: string): void {
  // In production: bcrypt.hash(token, 10) then store the hash
  const hash = `hash:${token}`;
  refreshTokenStore.set(hash, {
    tokenHash: hash,
    familyId,
    userId,
    used: false,
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
  });
}

function invalidateFamily(familyId: string): void {
  for (const [key, record] of refreshTokenStore.entries()) {
    if (record.familyId === familyId) {
      refreshTokenStore.delete(key);
    }
  }
  console.log(`  [Security] Entire token family ${familyId} invalidated — force re-login`);
}

function rotateRefreshToken(
  oldToken: string
): { newAccessToken: string; newRefreshToken: string } | null {
  const hash = `hash:${oldToken}`;
  const record = refreshTokenStore.get(hash);

  if (!record) {
    console.log("  [Error] Refresh token not found");
    return null;
  }

  if (record.used) {
    console.log("  [Security] Token reuse detected!");
    invalidateFamily(record.familyId);
    return null;
  }

  // Mark old token as used
  record.used = true;

  // Issue new tokens
  const newRefresh = `RT_${Math.random().toString(36).slice(2)}`;
  storeRefreshToken(newRefresh, record.userId, record.familyId);

  return {
    newAccessToken: `AT_new_for_${record.userId}`,
    newRefreshToken: newRefresh,
  };
}

const familyId = "family-uuid-123";
const initialRefresh = "RT_initial_abc";
storeRefreshToken(initialRefresh, "user_123", familyId);

const rotation1 = rotateRefreshToken(initialRefresh);
console.log("First rotation success:", rotation1 !== null); // true

// Simulate attacker replaying old token:
const reuse = rotateRefreshToken(initialRefresh);
console.log("Replayed old token result:", reuse); // null — family invalidated

// ───────────────────────────────────────────────────────────────
// 6. OAuth 2.0
// ───────────────────────────────────────────────────────────────

console.log("\n=== 6. OAuth 2.0 ===");

/*
  OAuth 2.0 is an AUTHORIZATION framework — it lets users grant
  third-party apps limited access to their data without sharing
  passwords. OpenID Connect (OIDC) adds an identity layer on top
  for authentication.

  ─────────────────────────────────────────────────────────────
  ROLES
    Resource Owner  — the user who owns the data
    Client          — your app requesting access
    Authorization Server (AS) — issues tokens (Google, Auth0, etc.)
    Resource Server — API holding the data (Google People API, etc.)

  ─────────────────────────────────────────────────────────────
  FLOWS (grant types)

  1. AUTHORIZATION CODE (web apps with a backend)
     Most secure. Code is exchanged server-side — tokens never
     touch the browser.

     Browser → GET /authorize?response_type=code&client_id=...
               &redirect_uri=...&scope=openid email&state=random
     AS      → user logs in, consents
     AS      → redirect to redirect_uri?code=AUTH_CODE&state=random
     Server  → POST /token { code, client_id, client_secret, redirect_uri }
     AS      → { access_token, refresh_token, id_token }
     Server  → calls Resource Server with access_token

  2. AUTHORIZATION CODE + PKCE (SPAs and mobile apps)
     No client_secret (can't be kept secret in browser/mobile).
     PKCE = Proof Key for Code Exchange.

     Client generates:
       code_verifier  = random string (43–128 chars)
       code_challenge = base64url(SHA-256(code_verifier))

     Sends code_challenge in /authorize request.
     Sends code_verifier in /token exchange.
     AS verifies: SHA-256(code_verifier) === code_challenge
     → Even if code is intercepted, attacker can't exchange it
       without the code_verifier (never sent in the first request).

  3. CLIENT CREDENTIALS (machine-to-machine, no user)
     Service A calls Service B using its own credentials.
     No user involved. Common for backend microservices.
     POST /token { grant_type=client_credentials, client_id, client_secret }

  4. RESOURCE OWNER PASSWORD CREDENTIALS (AVOID)
     User gives username/password directly to the client app.
     Client exchanges them for tokens.
     Only acceptable for first-party apps migrating from legacy auth.
     Deprecated in OAuth 2.1.

  ─────────────────────────────────────────────────────────────
  "LOGIN WITH GOOGLE" — Authorization Code + PKCE flow
  ─────────────────────────────────────────────────────────────
*/

import crypto from "crypto";

// Step 1: Generate PKCE pair
function generatePkce(): { verifier: string; challenge: string } {
  const verifier = crypto.randomBytes(32).toString("base64url");
  const challenge = crypto.createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}

// Step 2: Build the Google authorization URL
function buildGoogleAuthUrl(
  clientId: string,
  redirectUri: string,
  codeChallenge: string,
  state: string
): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id:     clientId,
    redirect_uri:  redirectUri,
    scope:         "openid email profile",
    state,
    code_challenge:        codeChallenge,
    code_challenge_method: "S256",
    access_type: "offline",  // request refresh_token
    prompt: "consent",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

// Step 3: Exchange auth code for tokens (server-side)
async function exchangeCodeForTokens(
  code: string,
  codeVerifier: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
): Promise<{ access_token: string; id_token: string; refresh_token?: string }> {
  // In real code this is a fetch/axios POST to Google's token endpoint
  console.log(`  [OAuth] Exchanging code ${code.slice(0, 8)}... for tokens`);
  console.log(`  [OAuth] Verifier proves we initiated the flow (PKCE check)`);
  // Simulated response:
  return {
    access_token:  "ya29.google-access-token",
    id_token:      "eyJ...google-id-token",
    refresh_token: "1//google-refresh-token",
  };
}

// Step 4: Get user profile from id_token or userinfo endpoint
function parseGoogleIdToken(idToken: string): { sub: string; email: string; name: string } {
  // Real code: jwt.decode(idToken) — verify signature against Google's JWKS
  // https://www.googleapis.com/oauth2/v3/certs
  console.log(`  [OAuth] Decoding id_token to get user identity`);
  return { sub: "google-uid-12345", email: "user@gmail.com", name: "Test User" };
}

const { verifier, challenge } = generatePkce();
const state = crypto.randomBytes(16).toString("hex");
const authUrl = buildGoogleAuthUrl("my-client-id", "https://myapp.com/callback", challenge, state);

console.log("PKCE verifier (keep secret):", verifier.slice(0, 20) + "...");
console.log("PKCE challenge (sent to AS):", challenge.slice(0, 20) + "...");
console.log("Auth URL:", authUrl.slice(0, 80) + "...");

(async () => {
  const tokens = await exchangeCodeForTokens(
    "auth-code-from-google", verifier, "my-client-id", "my-secret",
    "https://myapp.com/callback"
  );
  const profile = parseGoogleIdToken(tokens.id_token);
  console.log("Google user:", profile.email, "sub:", profile.sub);
  // Now upsert user in your DB using profile.sub as the stable identifier
})();

// ───────────────────────────────────────────────────────────────
// 7. Security Headers
// ───────────────────────────────────────────────────────────────

console.log("\n=== 7. Security Headers ===");

/*
  HELMET.JS — sets secure HTTP headers with one line
    npm install helmet
    app.use(helmet());  // applies sensible defaults

  What helmet sets by default:
    Content-Security-Policy     — restricts where resources can load from
    X-Frame-Options: SAMEORIGIN — prevents clickjacking
    X-Content-Type-Options: nosniff — prevents MIME sniffing
    Strict-Transport-Security   — forces HTTPS (HSTS)
    Referrer-Policy: no-referrer-when-downgrade
    X-XSS-Protection: 0        — disabled (CSP is better)

  ─────────────────────────────────────────────────────────────
  CONTENT-SECURITY-POLICY (CSP)
    Tells browsers which sources are allowed for scripts, styles,
    images, fonts, etc. Mitigates XSS — even if attacker injects
    <script>, browser blocks it if not from approved source.

    Example:
      Content-Security-Policy:
        default-src 'self';
        script-src 'self' https://cdn.example.com;
        style-src  'self' 'unsafe-inline';
        img-src    'self' data: https:;
        connect-src 'self' https://api.example.com;
        frame-ancestors 'none';

  ─────────────────────────────────────────────────────────────
  CORS — Cross-Origin Resource Sharing
    npm install cors @types/cors

    WRONG (too open):
      app.use(cors());  // allows ALL origins — dangerous for APIs with cookies

    CORRECT:
      app.use(cors({
        origin: ["https://myapp.com", "https://admin.myapp.com"],
        methods: ["GET", "POST", "PUT", "DELETE"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true,   // allow cookies/auth headers cross-origin
        maxAge: 86400,        // cache preflight for 24 hours
      }));

    credentials: true REQUIRES a specific origin (not "*").
    Never use origin: "*" with credentials: true — browsers reject it.

  ─────────────────────────────────────────────────────────────
  CSRF — Cross-Site Request Forgery
    Only affects cookie-based auth (browsers auto-send cookies).
    JWTs in Authorization header are NOT vulnerable to CSRF.

    Attack: malicious site tricks browser into making authenticated
    request to your API (browser auto-attaches the session cookie).

    Mitigations:
    1. SameSite=Strict cookie attribute
       Browsers won't send cookie on cross-origin requests at all.
       May break some OAuth redirect flows — use SameSite=Lax instead
       (allows top-level GET navigation but blocks cross-origin POSTs).

    2. CSRF tokens (double-submit cookie / synchronizer token)
       Server generates per-session CSRF token, client must echo it
       in a header. Attacker can't read it from another origin.
       npm install csurf (or implement manually with iron-session)

    3. Custom request header check
       Require a custom header like X-Requested-With: XMLHttpRequest.
       Simple CSRF forms can't set custom headers.

  ─────────────────────────────────────────────────────────────
  SAMESITE COOKIE ATTRIBUTE
    SameSite=Strict  — cookie never sent on cross-site requests
    SameSite=Lax     — sent on top-level navigations (links), not
                       on cross-site fetches/POSTs (default in modern browsers)
    SameSite=None    — sent on all cross-site requests
                       REQUIRES Secure attribute (HTTPS only)
  ─────────────────────────────────────────────────────────────
*/

// Simulating the security header values
const securityHeaders = {
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
  "Content-Security-Policy": "default-src 'self'; script-src 'self'; frame-ancestors 'none'",
  "X-Frame-Options": "SAMEORIGIN",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
};

console.log("Recommended security headers:");
for (const [header, value] of Object.entries(securityHeaders)) {
  console.log(`  ${header}: ${value.slice(0, 60)}${value.length > 60 ? "..." : ""}`);
}

// ───────────────────────────────────────────────────────────────
// 8. Common Auth Vulnerabilities
// ───────────────────────────────────────────────────────────────

console.log("\n=== 8. Common Auth Vulnerabilities ===");

/*
  ─────────────────────────────────────────────────────────────
  1. BRUTE FORCE ATTACKS
     Attacker tries millions of passwords against a login endpoint.

     Defences:
     - Rate limiting on /auth/login (e.g. 5 attempts per 15 min per IP)
       npm install express-rate-limit
       const loginLimiter = rateLimit({ windowMs: 15*60*1000, max: 5 });
       app.post("/auth/login", loginLimiter, loginHandler);
     - Account lockout after N failures (with unlock via email)
     - CAPTCHA after 3 failures
     - Constant-time comparison (bcrypt.compare is already timing-safe)
     - Alert on unusual login velocity

  ─────────────────────────────────────────────────────────────
  2. CREDENTIAL STUFFING
     Attacker uses lists of leaked username/password pairs from
     other breached services. Users reuse passwords.

     Defences:
     - Check passwords against HaveIBeenPwned API at registration
     - Anomaly detection: login from new country/device → MFA step-up
     - MFA (TOTP, WebAuthn) eliminates credential stuffing entirely
     - Monitor login success rate — stuffing causes spike in failures

  ─────────────────────────────────────────────────────────────
  3. JWT ALGORITHM CONFUSION (alg: none)
     JWT header contains the algorithm. A vulnerable library that
     trusts the header value can be tricked:

     Attacker takes a valid token, changes alg to "none", removes
     the signature, modifies the payload (e.g. role: "admin").
     Library sees alg=none → skips signature verification → accepts it.

     Fix:
       jwt.verify(token, secret, { algorithms: ["HS256"] });
       // Explicitly whitelist allowed algorithms — never trust the header

  ─────────────────────────────────────────────────────────────
  4. MASS ASSIGNMENT
     API accepts JSON body and spreads it directly onto a DB model.

     // VULNERABLE:
     app.put("/users/:id", async (req, res) => {
       await User.findByIdAndUpdate(req.params.id, req.body);  // ← attacker sends { role: "admin" }
     });

     Fix: whitelist allowed fields explicitly
     const { name, email, bio } = req.body;  // only these fields
     await User.findByIdAndUpdate(id, { name, email, bio });

  ─────────────────────────────────────────────────────────────
  5. IDOR — Insecure Direct Object Reference
     A user can access or modify another user's data by manipulating
     an ID in the request.

     Example:
       GET /api/orders/1234    ← your order, fine
       GET /api/orders/1235    ← change ID → see someone else's order

     VULNERABLE code:
       app.get("/api/orders/:id", authenticate, async (req, res) => {
         const order = await Order.findById(req.params.id);
         res.json(order);  // ← no ownership check!
       });

     Fixed code:
       app.get("/api/orders/:id", authenticate, async (req, res) => {
         const order = await Order.findOne({
           _id: req.params.id,
           userId: req.user.sub,  // ← ownership enforced
         });
         if (!order) return res.status(404).json({ error: "Not found" });
         res.json(order);
       });

     Always authorize the subject, not just authenticate the request.
  ─────────────────────────────────────────────────────────────
*/

// Demonstrate IDOR vulnerability pattern vs fix
interface Order {
  id: string;
  userId: string;
  total: number;
  items: string[];
}

const orders: Order[] = [
  { id: "order_1", userId: "user_123", total: 49.99,  items: ["book"] },
  { id: "order_2", userId: "user_456", total: 129.99, items: ["keyboard"] },
];

function getOrderVulnerable(orderId: string): Order | undefined {
  return orders.find(o => o.id === orderId); // no ownership check — IDOR!
}

function getOrderSecure(orderId: string, requestingUserId: string): Order | null {
  const order = orders.find(o => o.id === orderId && o.userId === requestingUserId);
  return order ?? null;
}

console.log("\nIDOR demo:");
console.log("Vulnerable — user_123 gets order_2:",
  getOrderVulnerable("order_2")?.userId); // "user_456" — data leak!
console.log("Secure     — user_123 gets order_2:",
  getOrderSecure("order_2", "user_123")); // null — properly blocked
console.log("Secure     — user_123 gets order_1:",
  getOrderSecure("order_1", "user_123")?.total); // 49.99 — own order OK

// JWT alg:none demonstration
function simulatedVulnerableJwtVerify(token: string): object | null {
  const [, payloadB64] = token.split(".");
  const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString()) as { alg?: string };
  // BUG: trusting the header's alg claim without enforcing HS256
  // In a real vulnerable library, alg=none would skip signature check
  console.log("  [Vulnerable] Accepted token without verifying algorithm whitelist");
  return payload;
}

function simulatedSecureJwtVerify(token: string, allowedAlgorithms: string[]): object | null {
  const [headerB64, payloadB64] = token.split(".");
  const header = JSON.parse(Buffer.from(headerB64, "base64url").toString()) as { alg: string };
  if (!allowedAlgorithms.includes(header.alg)) {
    console.log(`  [Secure] Rejected token with alg=${header.alg} — not in whitelist`);
    return null;
  }
  const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString());
  return payload;
}

const tampered = `${base64url({ alg: "none", typ: "JWT" })}.${base64url({ sub: "attacker", role: "admin" })}.`;
console.log("\nJWT alg:none attack:");
simulatedVulnerableJwtVerify(tampered);    // accepts it (bug)
simulatedSecureJwtVerify(tampered, ["HS256", "RS256"]); // rejects it (correct)

// ───────────────────────────────────────────────────────────────
// PRACTICE
// ───────────────────────────────────────────────────────────────

console.log("\n=== Practice ===");

// Q1: Why is bcrypt preferred over SHA-256 for password hashing?
// SHA-256 is a fast hash function — an attacker can compute ~10 billion
// SHA-256 hashes per second on a consumer GPU, making brute force and
// dictionary attacks trivial. bcrypt is intentionally slow via its cost
// factor (2^cost iterations), reducing attacker throughput to ~300 hashes/sec
// at cost=12. bcrypt also auto-generates and embeds a unique salt, preventing
// rainbow table attacks and ensuring identical passwords produce different hashes.

// Q2: Security risk of storing JWTs in localStorage vs httpOnly cookies?
// localStorage is accessible via JavaScript. Any XSS vulnerability — even a
// third-party script, a browser extension gap, or a dependency supply-chain
// attack — can read and exfiltrate all tokens. httpOnly cookies are invisible
// to JavaScript; even successful XSS cannot read them. The tradeoff: cookies
// are vulnerable to CSRF (browser auto-attaches them), which is mitigated with
// SameSite=Strict/Lax and CSRF tokens. For most web apps, httpOnly cookies
// are the safer choice.

// Q3: A user logs out. How do you invalidate their JWT?
// JWTs are stateless — the server cannot invalidate them directly. Options:
//   a) Short access token expiry (15 min) — token becomes useless quickly.
//      Pair with refresh token stored in DB; delete the refresh token on logout.
//   b) Token blacklist — store the JTI (JWT ID claim) in Redis with TTL equal
//      to the token's remaining lifetime. Check the blacklist on each request.
//   c) Version counter — store a token_version in the user's DB record. JWT
//      carries the version. Increment on logout; tokens with old versions rejected.
//   d) Refresh token rotation — on logout, delete the refresh token from DB.
//      User can't get new access tokens; access token expires naturally in 15 min.

// Q4: What is PKCE and why is it needed for SPAs?
// PKCE = Proof Key for Code Exchange. In the Authorization Code flow, the client
// app exchanges a short-lived authorization code for tokens. For traditional web
// apps this exchange uses a client_secret held server-side. SPAs run entirely in
// the browser — there is no safe place to store a client_secret (it's visible to
// the user and any JavaScript). PKCE replaces the secret with a cryptographic
// challenge: the client generates a random code_verifier, sends only its SHA-256
// hash (code_challenge) in the /authorize request, and proves ownership at /token
// by sending the original verifier. Even if the auth code is intercepted in the
// redirect, it's useless without the verifier that only the legitimate client has.

// Q5: What is IDOR? Give an example from a typical REST API.
// IDOR = Insecure Direct Object Reference. Occurs when an API exposes internal
// object identifiers (DB primary keys, file paths, account numbers) and trusts
// the caller's input without checking whether they're authorised to access that
// specific resource.
// Example: GET /api/invoices/5841 returns invoice 5841. If the server only checks
// that the user is authenticated (has a valid token) but not that invoice 5841
// belongs to the authenticated user, any logged-in user can increment the ID and
// read every invoice in the system. Fix: always scope queries with the authenticated
// user's ID: Invoice.findOne({ _id: req.params.id, ownerId: req.user.sub }).

// ───────────────────────────────────────────────────────────────
// DEMO / REFERENCE CARD
// ───────────────────────────────────────────────────────────────

export default function runDemo(): void {
  console.log("\n" + "═".repeat(65));
  console.log("BACKEND 04 — AUTH REFERENCE CARD");
  console.log("═".repeat(65));

  console.log(`
  AUTHENTICATION vs AUTHORIZATION
  ─────────────────────────────────────────────────────────────
  AuthN  Who are you?          → password, OTP, OAuth, biometrics
  AuthZ  What can you do?      → RBAC, ABAC, policy engines

  RBAC hierarchy: guest < user < moderator < admin

  PASSWORD SECURITY
  ─────────────────────────────────────────────────────────────
  Use:     bcrypt (cost ≥ 12), Argon2id, scrypt
  Avoid:   MD5, SHA-1, SHA-256 (too fast), plaintext
  bcrypt auto-salts; never manage salt manually
  cost=12 → ~300 hashes/sec on GPU (attacker) vs 0.3s for your server

  JWT
  ─────────────────────────────────────────────────────────────
  Structure:  header.payload.signature  (Base64URL encoded)
  Claims:     iss, sub, aud, exp, iat, jti
  Access:     15 min,  in memory or httpOnly cookie
  Refresh:    7 days,  httpOnly cookie only, stored hash in DB
  Algorithm:  whitelist HS256/RS256 — never trust alg header
  Storage:    httpOnly cookie > memory > localStorage (XSS risk)

  REFRESH TOKEN ROTATION
  ─────────────────────────────────────────────────────────────
  On /auth/refresh:
    Old token → mark used → issue new AT + new RT (same familyId)
    If old token already used → invalidate entire family → re-login

  SESSION vs JWT
  ─────────────────────────────────────────────────────────────
  Sessions: stateful, instant revocation, needs Redis, best for SSR
  JWT:      stateless, scales easily, short-lived access tokens

  OAUTH 2.0 FLOWS
  ─────────────────────────────────────────────────────────────
  Authorization Code           → web apps with backend
  Authorization Code + PKCE    → SPAs and mobile apps
  Client Credentials           → M2M (no user)
  Resource Owner Password      → avoid (deprecated in OAuth 2.1)

  PKCE:  verifier (secret) → SHA-256 → challenge (sent to AS)
         Exchange code by proving you know verifier → no client_secret needed

  SECURITY HEADERS (helmet.js defaults)
  ─────────────────────────────────────────────────────────────
  Content-Security-Policy      → XSS mitigation
  X-Frame-Options: SAMEORIGIN  → clickjacking protection
  HSTS                         → force HTTPS
  X-Content-Type-Options: nosniff

  CORS: specify exact origins; credentials:true requires non-wildcard origin
  CSRF: SameSite=Strict/Lax cookie + CSRF token for state-changing ops

  TOP VULNERABILITIES
  ─────────────────────────────────────────────────────────────
  Brute force       → rate limit login (5 req/15 min), lockout, CAPTCHA
  Credential stuff  → HIBP check, MFA, anomaly detection
  JWT alg:none      → whitelist algorithms: ["HS256"]
  Mass assignment   → whitelist allowed fields, never spread req.body
  IDOR              → always scope DB queries with req.user.sub
`);

  console.log("═".repeat(65));
}

runDemo();
