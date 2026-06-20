// ════════════════════════════════════════════════════════════════
// DAY 39 — AUTHENTICATION WITH JWT
// ════════════════════════════════════════════════════════════════
//
// Run with: npm run day39
//
// SESSION vs JWT:
//   Sessions: server stores state, client sends session ID via cookie
//     ✅ Easy to revoke (delete session from store)
//     ✅ Small cookie (just an ID)
//     ❌ Server is stateful — doesn't scale horizontally without Redis
//
//   JWT: server issues signed token, client sends it back each request
//     ✅ Stateless — any server instance can verify the signature
//     ✅ Self-contained — payload carries user info (no DB lookup needed)
//     ❌ Hard to revoke before expiry (need a blocklist, which adds state back)
//     ❌ Token size — large payloads = large headers
//
// ACCESS + REFRESH TOKEN PATTERN:
//   Access token:  short-lived (15 min), sent in Authorization: Bearer header
//   Refresh token: long-lived (7 days), stored in httpOnly cookie
//
//   Flow:
//     1. Login → server issues both tokens
//     2. Client uses access token for requests
//     3. Access token expires → client silently calls POST /auth/refresh
//     4. Server verifies refresh token → issues new access token
//     5. Logout → server clears refresh cookie (client discards access token)
//
//   Why separate tokens?
//   - If the access token is stolen (via XSS), it expires in 15 min
//   - Refresh token is httpOnly cookie — unreadable by JavaScript
//   - Compromise window is minimised
//
// bcrypt COST FACTOR:
//   bcrypt.hash(password, 12) — 12 is the cost factor (2^12 = 4096 iterations)
//   Higher = slower = harder to brute-force
//   Lower  = faster = weaker
//   12 is the sweet spot in 2024: ~250ms on modern hardware
//   At 250ms per attempt, cracking 1M passwords takes 70 hours per core

import express, { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt    from 'jsonwebtoken';

const app  = express();
const PORT = 3003;

app.use(express.json({ limit: '10kb' }));

// ─────────────────────────────────────────────────────────────────
// SECRETS — in production these come from environment variables, never source code
// Use a secrets manager (AWS Secrets Manager, Vault, Doppler) in production
// ─────────────────────────────────────────────────────────────────
const ACCESS_TOKEN_SECRET  = process.env.ACCESS_TOKEN_SECRET  ?? 'dev-access-secret-change-in-prod';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET ?? 'dev-refresh-secret-change-in-prod';

// Secret sanity check for production
if (process.env.NODE_ENV === 'production') {
  if (!process.env.ACCESS_TOKEN_SECRET || !process.env.REFRESH_TOKEN_SECRET) {
    console.error('FATAL: JWT secrets must be set in production');
    process.exit(1);
  }
}

// ─────────────────────────────────────────────────────────────────
// IN-MEMORY USER STORE
// Replace with your DB (PostgreSQL, MongoDB, etc.) in production
// ─────────────────────────────────────────────────────────────────
interface StoredUser {
  id:           string;
  email:        string;
  passwordHash: string;
  name:         string;
  role:         'user' | 'admin';
  createdAt:    string;
}

const userStore = new Map<string, StoredUser>(); // email → user
const userById  = new Map<string, StoredUser>(); // id → user

// Blocklist for refresh tokens (revoked on logout)
// In production: store in Redis with TTL = token expiry
const revokedTokens = new Set<string>();

// ─────────────────────────────────────────────────────────────────
// JWT HELPERS
// ─────────────────────────────────────────────────────────────────
interface AccessTokenPayload {
  sub:   string;          // subject = user ID (JWT standard claim)
  email: string;
  role:  'user' | 'admin';
  type:  'access';
}

interface RefreshTokenPayload {
  sub:  string;
  type: 'refresh';
  jti:  string;           // JWT ID — unique per token, used for revocation
}

function signAccessToken(user: StoredUser): string {
  const payload: AccessTokenPayload = {
    sub:   user.id,
    email: user.email,
    role:  user.role,
    type:  'access',
  };
  // expiresIn: short window minimises damage if the token is stolen
  return jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
}

function signRefreshToken(user: StoredUser): string {
  // jti (JWT ID) is a unique identifier for this specific token
  // We store it in the blocklist on logout so the token can be revoked
  const jti = `${user.id}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const payload: RefreshTokenPayload = { sub: user.id, type: 'refresh', jti };
  return jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
}

function verifyAccessToken(token: string): AccessTokenPayload {
  // jwt.verify throws JsonWebTokenError on invalid tokens and
  // TokenExpiredError on expired ones — always catch both
  return jwt.verify(token, ACCESS_TOKEN_SECRET) as AccessTokenPayload;
}

function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, REFRESH_TOKEN_SECRET) as RefreshTokenPayload;
}

// ─────────────────────────────────────────────────────────────────
// AUTH MIDDLEWARE
// ─────────────────────────────────────────────────────────────────
//
// Why check Authorization header first, then cookie fallback?
//   - API clients (mobile apps, curl, other services) use the header
//     They can't set cookies (or don't want to)
//   - Browser clients use httpOnly cookies (XSS-safe)
//   - Supporting both lets the same server handle both client types
//
// Never accept tokens in query strings: /api/data?token=xxx
//   Reason: query strings appear in server logs, browser history,
//   Referer headers, and analytics tools — they leak tokens everywhere.

interface AuthenticatedRequest extends Request {
  user?: StoredUser;
}

function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  let token: string | undefined;

  // 1. Try Authorization: Bearer <token> header (API clients)
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.slice(7); // remove "Bearer " prefix
  }

  // 2. Fallback to cookie (browser clients)
  // Note: cookie parsing requires the 'cookie-parser' middleware in production
  // We skip that dependency here — focusing on the auth logic
  if (!token && req.headers.cookie) {
    const match = req.headers.cookie.match(/accessToken=([^;]+)/);
    if (match) token = match[1];
  }

  if (!token) {
    res.status(401).json({ error: 'Authentication required', hint: 'Provide Authorization: Bearer <token>' });
    return;
  }

  try {
    const payload = verifyAccessToken(token);

    if (payload.type !== 'access') {
      res.status(401).json({ error: 'Invalid token type — use an access token' });
      return;
    }

    // Attach the full user record to the request for downstream handlers
    const user = userById.get(payload.sub);
    if (!user) {
      res.status(401).json({ error: 'User no longer exists' });
      return;
    }
    req.user = user;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED', hint: 'Call POST /auth/refresh' });
      return;
    }
    res.status(401).json({ error: 'Invalid token' });
  }
}

function requireRole(role: 'admin' | 'user') {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    if (req.user.role !== role && req.user.role !== 'admin') {
      res.status(403).json({ error: 'Insufficient permissions', required: role });
      return;
    }
    next();
  };
}

// ─────────────────────────────────────────────────────────────────
// COOKIE HELPER
// ─────────────────────────────────────────────────────────────────
function setRefreshCookie(res: Response, token: string): void {
  res.cookie('refreshToken', token, {
    httpOnly: true,    // NOT accessible via document.cookie — blocks XSS
    secure:   process.env.NODE_ENV === 'production', // HTTPS only in prod
    sameSite: 'lax',   // sent on top-level navigations, not cross-site AJAX
                       // 'strict' would break OAuth redirects
                       // 'none' allows cross-site but requires secure:true
    maxAge:   7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    path:     '/auth', // cookie only sent to /auth/* routes — reduce exposure
  });
}

// ─────────────────────────────────────────────────────────────────
// INPUT VALIDATION HELPERS
// ─────────────────────────────────────────────────────────────────
function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 8)  return { valid: false, message: 'Password must be at least 8 characters' };
  if (password.length > 72) return { valid: false, message: 'Password must be at most 72 characters' };
  // bcrypt truncates at 72 bytes — longer passwords don't add security
  return { valid: true };
}

// ─────────────────────────────────────────────────────────────────
// ROUTES
// ─────────────────────────────────────────────────────────────────

// POST /auth/register
app.post('/auth/register', async (req: Request, res: Response) => {
  const { email, password, name } = req.body as {
    email?: string;
    password?: string;
    name?: string;
  };

  // Collect all validation errors upfront — better UX than failing on first error
  const errors: Record<string, string> = {};
  if (!email?.trim())          errors.email    = 'Email is required';
  else if (!validateEmail(email)) errors.email = 'Invalid email address';
  if (!name?.trim())           errors.name     = 'Name is required';
  if (!password)               errors.password = 'Password is required';
  else {
    const pwCheck = validatePassword(password);
    if (!pwCheck.valid) errors.password = pwCheck.message!;
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ error: 'Validation failed', errors });
  }

  const normalizedEmail = email!.toLowerCase().trim();

  // Check for duplicate email — 409 Conflict
  if (userStore.has(normalizedEmail)) {
    // Note: in some security contexts you wouldn't reveal whether
    // an email exists (to prevent user enumeration). Here we reveal
    // it for better UX — decide based on your threat model.
    return res.status(409).json({ error: 'Email already registered' });
  }

  // Hash the password — NEVER store plaintext passwords
  // Cost factor 12: ~250ms. This is intentionally slow (brute-force protection).
  const passwordHash = await bcrypt.hash(password!, 12);

  const id = String(Date.now()); // use UUID in production
  const user: StoredUser = {
    id,
    email:     normalizedEmail,
    passwordHash,
    name:      name!.trim(),
    role:      'user',
    createdAt: new Date().toISOString(),
  };

  userStore.set(normalizedEmail, user);
  userById.set(id, user);

  // Return user WITHOUT the password hash — ever.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash: _hash, ...safeUser } = user;
  res.status(201).json({ data: { user: safeUser } });
});

// POST /auth/login
app.post('/auth/login', async (req: Request, res: Response) => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = userStore.get(email.toLowerCase().trim());

  // SECURITY: use a consistent error message whether the user exists or not.
  // "User not found" vs "Wrong password" leaks whether the email is registered.
  // Also: always call bcrypt.compare even if user is not found (timing attack prevention).
  const DUMMY_HASH = '$2a$12$dummy.hash.to.prevent.timing.attacks.from.short.circuit';
  const hashToCompare = user ? user.passwordHash : DUMMY_HASH;

  const passwordMatch = await bcrypt.compare(password, hashToCompare);

  if (!user || !passwordMatch) {
    // 401 for wrong credentials (not 400 — the request was valid, the creds weren't)
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const accessToken  = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  // Set refresh token as httpOnly cookie
  setRefreshCookie(res, refreshToken);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash: _hash, ...safeUser } = user;

  res.json({
    data: {
      user:        safeUser,
      accessToken,
      // Don't include refreshToken in the body — it's in the cookie
      // Including it in the body would expose it to JavaScript (XSS risk)
      expiresIn: 15 * 60, // 900 seconds — client uses this to schedule refresh
    },
  });
});

// POST /auth/refresh — issue a new access token using the refresh token
app.post('/auth/refresh', (req: Request, res: Response) => {
  // Read the refresh token from the httpOnly cookie
  const cookie = req.headers.cookie ?? '';
  const match  = cookie.match(/refreshToken=([^;]+)/);
  const token  = match?.[1];

  if (!token) {
    return res.status(401).json({ error: 'No refresh token', hint: 'Log in again' });
  }

  try {
    const payload = verifyRefreshToken(token);

    // Check if this specific token has been revoked (e.g. via logout)
    if (revokedTokens.has(payload.jti)) {
      return res.status(401).json({ error: 'Refresh token has been revoked', hint: 'Log in again' });
    }

    if (payload.type !== 'refresh') {
      return res.status(401).json({ error: 'Invalid token type' });
    }

    const user = userById.get(payload.sub);
    if (!user) {
      return res.status(401).json({ error: 'User no longer exists' });
    }

    // Issue a fresh access token (and optionally rotate the refresh token)
    const newAccessToken = signAccessToken(user);

    // REFRESH TOKEN ROTATION (security best practice):
    // Issue a new refresh token and revoke the old one on every refresh.
    // This way, a stolen refresh token can only be used once.
    // Trade-off: more complexity, and the user gets logged out if they
    // have multiple tabs open (both try to refresh simultaneously).
    // For this teaching file, we keep the same refresh token (simpler).

    res.json({
      data: {
        accessToken: newAccessToken,
        expiresIn:   15 * 60,
      },
    });
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: 'Refresh token expired', hint: 'Log in again' });
    }
    return res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// DELETE /auth/logout
app.delete('/auth/logout', (req: Request, res: Response) => {
  // Revoke the refresh token so it can't be used after logout
  const cookie = req.headers.cookie ?? '';
  const match  = cookie.match(/refreshToken=([^;]+)/);
  const token  = match?.[1];

  if (token) {
    try {
      const payload = verifyRefreshToken(token);
      revokedTokens.add(payload.jti);
      // In production: store jti in Redis with TTL = token.exp - now
      // This prevents the Set from growing unboundedly
    } catch {
      // Token is already invalid — that's fine, we're logging out anyway
    }
  }

  // Clear the refresh cookie by setting it to expire immediately
  res.clearCookie('refreshToken', { path: '/auth' });
  res.status(204).send();
});

// GET /auth/me — protected: return the current user
app.get('/auth/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash: _hash, ...safeUser } = req.user;
  res.json({ data: { user: safeUser } });
});

// GET /auth/admin-only — protected + role check
app.get('/auth/admin-only', requireAuth, requireRole('admin'), (req: AuthenticatedRequest, res: Response) => {
  res.json({
    data: {
      message:  'You have admin access',
      calledBy: req.user?.email,
    },
  });
});

// ─────────────────────────────────────────────────────────────────
// ERROR HANDLER
// ─────────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Auth Error]', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// ─────────────────────────────────────────────────────────────────
// START
// ─────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║         DAY 39 — AUTHENTICATION WITH JWT                ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(`\nServer at http://localhost:${PORT}`);
  console.log('\nRoutes:');
  console.log('  POST   /auth/register    — create account');
  console.log('  POST   /auth/login       — get access + refresh tokens');
  console.log('  POST   /auth/refresh     — exchange refresh token for new access token');
  console.log('  DELETE /auth/logout      — revoke refresh token + clear cookie');
  console.log('  GET    /auth/me          — get current user (requires Bearer token)');
  console.log('  GET    /auth/admin-only  — admin role required');
  console.log('\nQuick test:');
  console.log('  # Register');
  console.log('  curl -s -X POST http://localhost:3003/auth/register \\');
  console.log('    -H "Content-Type: application/json" \\');
  console.log('    -d \'{"email":"test@example.com","password":"secret123","name":"Test"}\' | jq');
  console.log('\n  # Login (save the accessToken)');
  console.log('  TOKEN=$(curl -s -X POST http://localhost:3003/auth/login \\');
  console.log('    -H "Content-Type: application/json" \\');
  console.log('    -d \'{"email":"test@example.com","password":"secret123"}\' | jq -r \'.data.accessToken\')');
  console.log('\n  # Use the token');
  console.log('  curl -s http://localhost:3003/auth/me -H "Authorization: Bearer $TOKEN" | jq');
});

export default app;
