# Day 39 Assessment — Authentication · JWT · Sessions · OAuth · Security

**Theme:** You are the security-conscious backend engineer responsible for the auth system at a healthcare startup. Auth bugs here have compliance and legal implications.

**Scoring:** 0–4 re-study · 5–9 progressing · 10–12 solid · 13–15 ready to advance

---

### Q1 — JWT Structure ⭐

**Scenario:** A developer on the team suggests "we don't need HTTPS — the JWT is encrypted." Another suggests "just decode the JWT client-side to get the user's role instead of calling the API."

**Task:** Explain the three parts of a JWT (header, payload, signature). Explain why the signature can't be forged without the secret. Clarify why JWT is NOT encryption, and whether reading the payload client-side is safe.

**Acceptance Criteria:**
- [ ] Header: base64url-encoded JSON specifying the algorithm (`{ "alg": "HS256", "typ": "JWT" }`)
- [ ] Payload: base64url-encoded JSON containing claims (`{ "sub": "user_123", "role": "admin", "exp": 1750000000 }`)
- [ ] Signature: `HMAC-SHA256(base64url(header) + '.' + base64url(payload), secret)` — computed with a secret only the server knows
- [ ] Forgery prevention: changing any bit in header or payload produces a different signature — the server rejects tokens where the computed signature doesn't match
- [ ] JWT is NOT encryption: the header and payload are only base64url-encoded, not encrypted — anyone who has the token can read the payload by decoding it (no secret required to read)
- [ ] Reading payload client-side is safe for display purposes (e.g., showing the user's name), but the client must NEVER make security decisions based on decoded payload values alone — the server must always verify the signature before trusting claims
- [ ] Never put sensitive data (SSN, passwords, PHI) in a JWT payload unless the token is encrypted (JWE)

---

### Q2 — bcrypt Cost Factor ⭐

**Scenario:** The original developer set `bcrypt.hash(password, 10)`. A security review recommends raising it to `12` or `14`. The developer pushes back: "bcrypt is already slow, why make it slower?"

**Task:** Explain what the cost factor number means (the 2^n formula). Explain why higher is more secure. State the appropriate cost factor range for 2026 hardware. Show the effect on hash duration.

**Acceptance Criteria:**
- [ ] Cost factor `n` means bcrypt performs `2^n` iterations internally — cost factor `10` = 1,024 iterations; `12` = 4,096; `14` = 16,384
- [ ] Higher cost makes brute-force attacks slower in direct proportion — if an attacker can try 10M hashes/second at cost `10`, they can only try ~2.5M/second at cost `12`
- [ ] On modern hardware (2026), cost factor `12` takes ~100–250ms per hash; cost factor `14` takes ~400ms–1s — both are acceptable for a login endpoint (humans don't notice sub-second delays)
- [ ] Recommended range for 2026: `12–14` for interactive login; `10` was appropriate circa 2012
- [ ] Rehash strategy for existing users: on successful login (when you have the plaintext), check if the stored hash uses the old cost factor with `bcrypt.getRounds(hash)`, and if so, rehash and update
- [ ] States that the slowness is the point: bcrypt must be slow for attackers even when fast hardware is used — a login that takes 200ms is fine UX; an attacker trying billions of passwords is 200ms × billions = years

---

### Q3 — httpOnly Cookie vs localStorage ⭐

**Scenario:** The frontend team stores the access token in `localStorage` for convenience. A security review flags it as an XSS risk. The team asks why `localStorage` is different from an `httpOnly` cookie.

**Task:** Define XSS. Explain why `localStorage` is vulnerable to XSS. Explain why `httpOnly` cookies are not readable by JavaScript. List two XSS attack scenarios that steal localStorage tokens.

**Acceptance Criteria:**
- [ ] XSS (Cross-Site Scripting): an attacker injects malicious JavaScript into a page that executes in the victim's browser context
- [ ] `localStorage` is accessible via `window.localStorage` and `document.cookie` (for non-httpOnly cookies) — any injected script can call `localStorage.getItem('token')` and exfiltrate it
- [ ] `httpOnly` cookie: the browser sends it with every request but it is NOT accessible via `document.cookie` in JavaScript — `httpOnly` is enforced by the browser, not the JavaScript runtime
- [ ] XSS scenario 1: a stored XSS payload in a user comment executes when another user views the page — the script sends the victim's `localStorage` token to an attacker's server
- [ ] XSS scenario 2: a third-party CDN script is compromised — the malicious update executes on your page and exfiltrates all `localStorage` values
- [ ] `httpOnly` + `Secure` + `SameSite=Lax` is the most secure cookie configuration for auth tokens in 2026
- [ ] States that `httpOnly` cookies still require CSRF protection (covered in Q6) — they are not a complete security solution alone

---

### Q4 — Access + Refresh Token Pattern ⭐

**Scenario:** A junior developer asks: "If JWT is stateless, why do we need two tokens? Can't we just make the access token expire in 7 days?"

**Task:** Explain the purpose of each token. Explain why the access token should be short-lived (15 minutes). Describe how silent refresh works without the user re-logging in.

**Acceptance Criteria:**
- [ ] Access token: short-lived (15 minutes), sent with every API request in the `Authorization: Bearer` header — used to authenticate individual requests
- [ ] Refresh token: long-lived (7–30 days), stored in an `httpOnly` cookie, sent only to the `/auth/refresh` endpoint — used solely to obtain a new access token
- [ ] Why short-lived access token: if the token is stolen (e.g., via XSS), the attacker's window is limited to 15 minutes before it expires; revoking a JWT requires a denylist (stateful), so minimizing lifetime minimizes exposure
- [ ] 7-day access token risk: a stolen token gives 7 days of full API access — unacceptable for a healthcare app
- [ ] Silent refresh flow: the client-side code checks if the access token expires in < 1 minute; if so, it automatically calls `POST /auth/refresh` (with the httpOnly cookie); the server issues a new access token and returns it; the user never sees a login screen
- [ ] If the refresh token is expired or revoked: the server returns `401` and the client redirects to the login page
- [ ] States that the refresh token endpoint must be strictly rate-limited and monitored for unusual activity

---

### Q5 — Session vs JWT ⭐⭐

**Scenario:** The architecture team is deciding whether to use server-side sessions (Redis-backed) or stateless JWTs for the healthcare API. Arguments are made on both sides.

**Task:** Compare stateful sessions vs stateless JWT on: how revocation works, scalability, storage, and use-case fit. Recommend one for: (a) a banking app, (b) a CDN-delivered public API, (c) a real-time chat app.

**Acceptance Criteria:**
- [ ] Sessions (stateful): session ID stored in a cookie; server stores session data in Redis; every request requires a Redis lookup; revocation is instant — delete the session from Redis
- [ ] JWT (stateless): entire state in the token; server validates signature only; no DB lookup per request; revocation requires a denylist (re-introduces statefulness) or waiting for expiry
- [ ] Scalability: JWT wins for horizontal scaling — any server instance can validate a token with just the secret; sessions require all instances to share the same Redis store
- [ ] Banking app recommendation: sessions — instant revocation is critical (compromised account must be locked immediately); 15-minute JWT expiry is too long for a high-risk scenario
- [ ] CDN-delivered public API recommendation: JWT — stateless validation at edge nodes without a central session store; no Redis latency
- [ ] Real-time chat app recommendation: sessions — the WebSocket connection is long-lived and stateful anyway; sessions pair naturally; instant revocation if a user is banned
- [ ] States that "stateless JWT" is a partial myth in any system requiring revocation — a Redis denylist is effectively a session store for the revoked token set

---

### Q6 — CSRF Attack ⭐⭐

**Scenario:** The security team demonstrates a CSRF attack in staging: a malicious site at `evil.com` makes a `POST /api/transfer` request to your API and the browser automatically sends the auth cookie, transferring funds from the victim's account.

**Task:** Explain what CSRF is and why it works with cookie auth. Describe three mitigations: `SameSite=Lax` cookie flag, CSRF token, and checking the `Origin` header.

**Acceptance Criteria:**
- [ ] CSRF (Cross-Site Request Forgery): an attacker tricks the victim's browser into making authenticated requests to your API — the browser automatically includes cookies, so the request appears legitimate to the server
- [ ] It works with cookies because browsers attach cookies to all requests matching the domain, regardless of which site initiated the request — `evil.com` can trigger a POST to `yourapi.com` and the victim's cookies go along
- [ ] Mitigation 1 — `SameSite=Lax`: tells the browser to only send the cookie on same-site requests and top-level navigation GETs — cross-site POSTs from `evil.com` will not include the cookie
- [ ] Mitigation 2 — CSRF token: server issues a random `csrf_token` that is NOT in a cookie (e.g., in the HTML page or a response header); every state-changing request must include it; attacker cannot read it due to Same-Origin Policy
- [ ] Mitigation 3 — `Origin` header check: the browser sends the `Origin` header on cross-origin requests; the server rejects requests where `Origin` doesn't match the allowed list
- [ ] `SameSite=Strict` prevents all cross-site cookie sending (including navigating links) — too restrictive for most apps; `Lax` is the practical default
- [ ] CSRF is NOT a risk for bearer token (Authorization header) auth because the browser doesn't automatically send arbitrary headers — CSRF only affects cookie-based auth

---

### Q7 — Token Storage Security Audit ⭐⭐

**Scenario:** A React SPA stores the access token in JavaScript memory (a React state variable, not localStorage) and the refresh token in an `httpOnly` cookie. The security team asks you to rate this setup and identify remaining risks.

**Task:** Rate this token storage setup. Identify at least 4 remaining security risks or edge cases. Suggest mitigations for each.

**Acceptance Criteria:**
- [ ] Rating: Good — this is the recommended pattern in 2026; access token in memory is not accessible to injected scripts; refresh token in httpOnly cookie is not accessible to JavaScript
- [ ] Risk 1: access token lost on page refresh — the SPA must silently re-fetch an access token via the refresh endpoint on startup; if this round-trip fails (e.g., refresh token expired), the user must log in again
- [ ] Risk 2: refresh token can be used from any browser tab — if a malicious extension has iframe access, it could call `/auth/refresh`; mitigate with `SameSite=Strict` on the refresh cookie
- [ ] Risk 3: the httpOnly cookie is still sent to every subdomain path unless `Path=/auth/refresh` is set; scoping the cookie to the refresh endpoint reduces exposure
- [ ] Risk 4: XSS can still call API endpoints using the in-memory access token (the attacker's script runs in the same JS context as the token variable); Content Security Policy (CSP) reduces the XSS surface
- [ ] Risk 5: CSRF still applies to the refresh endpoint since it uses a cookie — add `SameSite=Lax` or a CSRF token for the refresh call
- [ ] States that no token storage strategy is immune to XSS — preventing XSS (CSP, input sanitization) is the root defense; token storage is defense-in-depth

---

### Q8 — Password Reset Flow ⭐⭐

**Scenario:** The current password reset sends the user's actual password in the reset email. A security consultant calls this "a critical vulnerability" and asks you to redesign the entire flow.

**Task:** Design a secure password reset flow from start to finish. Address: token generation, single-use enforcement, expiry, and user enumeration prevention.

**Acceptance Criteria:**
- [ ] Token generation: `crypto.randomBytes(32).toString('hex')` — 256 bits of entropy; never use sequential IDs or timestamps as reset tokens
- [ ] Store a hashed version of the token in the DB (`sha256(token)`), not the plaintext — if the DB is breached, tokens can't be used
- [ ] Token expiry: 15–60 minutes — store `expiresAt = Date.now() + 60 * 60 * 1000` alongside the hashed token
- [ ] Single-use: delete (or mark as used) the token immediately when it is validated and the password is reset — replay attacks are impossible
- [ ] User enumeration prevention: `POST /auth/forgot-password` always returns `{ message: "If that email exists, a reset link was sent" }` regardless of whether the email is registered — attackers cannot probe which emails are in the system
- [ ] The reset link in the email: `https://app.example.com/reset-password?token=<plaintext-token>` — the plaintext token is sent to the user (and only the user); the DB stores the hash
- [ ] Password reset should invalidate all existing sessions and refresh tokens for that user — an attacker who initiated a reset should not benefit from stolen active sessions

---

### Q9 — JWT Revocation with Redis ⭐⭐

**Scenario:** A user reports their account was compromised. The security team wants to immediately invalidate all their active JWTs. The current 15-minute access token means the attacker has up to 15 minutes of continued access.

**Task:** Implement a Redis-based JWT denylist. Use the token's `jti` (JWT ID) claim. On logout or revocation, add to the denylist. Check the denylist on every authenticated request.

**Acceptance Criteria:**
- [ ] Include a unique `jti` (JWT ID) claim in every token: `{ sub: userId, jti: crypto.randomUUID(), exp: ... }`
- [ ] On logout: `await redis.set('denylist:' + jti, '1', 'EX', secondsUntilExpiry)` — TTL matches the token's remaining lifetime so the key auto-deletes after the token would have expired anyway
- [ ] On each authenticated request: after verifying the JWT signature, check `await redis.exists('denylist:' + jti)` — if `1`, return `401`
- [ ] For compromising a user account (revoke ALL tokens): store `'revoke_all:' + userId` with `value = revokedAt` timestamp; in the JWT include `iat` (issued-at); reject any token where `iat < revokedAt`
- [ ] Redis latency: a single `EXISTS` call is ~0.1ms — acceptable overhead for every authenticated request
- [ ] States the trade-off: this re-introduces statefulness; at scale you may need Redis cluster or a different architecture
- [ ] The denylist key TTL must exactly match (or be slightly longer than) the JWT expiry to avoid orphaned keys accumulating in Redis

---

### Q10 — Timing Attack on Login ⭐⭐

**Scenario:** A security researcher submits a report: "Your login endpoint leaks whether an email exists in the system via response timing. Accounts with registered emails take 200ms; unregistered emails take 5ms."

**Task:** Explain what a timing attack is. Show why `if (password === storedHash)` is insecure. Explain why `bcrypt.compare` is resistant. Show how to prevent timing leaks on the email-lookup step.

**Acceptance Criteria:**
- [ ] Timing attack: an attacker measures response time to infer server-side behavior — a fast 5ms response on email lookup means "email not found"; a slow 200ms response means "email found, bcrypt running"
- [ ] `password === storedHash` is insecure for two reasons: (1) it compares in variable time (short-circuit on first differing character, leaking how many characters match); (2) it compares the plaintext to the hash, which never matches anyway
- [ ] `bcrypt.compare(plaintext, hash)` uses constant-time comparison internally — it takes the same time regardless of how many characters match, preventing character-by-character timing leaks
- [ ] Email lookup timing fix: if the email is not found, still run `bcrypt.compare(providedPassword, dummyHash)` to consume the same ~200ms — the response time is always ~200ms regardless of whether the email exists
- [ ] Store a `dummyHash` constant: `const DUMMY_HASH = await bcrypt.hash('dummy', 12)` at server startup; use it in the not-found branch
- [ ] Return the same error message for both "email not found" and "wrong password": `{ error: 'Invalid email or password' }` — prevents user enumeration via error messages
- [ ] States that even with constant-time comparison, network jitter may leak some timing info; rate limiting is the practical defense against large-scale timing attacks

---

### Q11 — OAuth 2.0 Flow ⭐⭐

**Scenario:** The product team wants "Sign in with Google." A developer starts implementing OAuth and asks: "Why do we need to exchange a code for a token? Why can't Google just redirect with the token directly?"

**Task:** Explain the Authorization Code flow step by step. Explain why the code is used instead of the token directly in the redirect URL. State why the authorization code must be single-use.

**Acceptance Criteria:**
- [ ] Step 1: user clicks "Sign in with Google" → client redirects to `accounts.google.com/o/oauth2/auth?client_id=...&redirect_uri=...&scope=email&state=<csrf_token>`
- [ ] Step 2: user authenticates with Google and approves scope
- [ ] Step 3: Google redirects to `redirect_uri?code=<authorization_code>&state=<csrf_token>` — the code is a short-lived one-time use credential
- [ ] Step 4: your server (backend) calls Google's token endpoint: `POST /token` with `code`, `client_id`, `client_secret`, `redirect_uri` — receives access token and refresh token
- [ ] Why code instead of token in redirect: the redirect URL appears in browser history, server logs, and `Referer` headers — a token in the URL would be exposed; the code is useless without the `client_secret` which only the backend holds
- [ ] Why code is single-use: if an attacker intercepts the redirect URL, they cannot use the code again after your server has already exchanged it — Google rejects replays
- [ ] `state` parameter is a CSRF token — your server verifies the `state` in the redirect matches what it generated in Step 1, preventing attackers from initiating flows on behalf of users

---

### Q12 — Multi-Tenant Auth ⭐⭐⭐

**Scenario:** The healthcare app allows users to belong to multiple hospitals (organizations). A user authenticated for Hospital A must not be able to access Hospital B's patient data, even if they have a valid JWT.

**Task:** Design a multi-tenant auth system where JWTs encode `{ userId, orgId, role }`. Handle: switching organizations, cross-org access prevention, and a user that belongs to 3 orgs.

**Acceptance Criteria:**
- [ ] JWT payload: `{ sub: userId, orgId: 'org_hospital_A', role: 'doctor', exp: ... }` — the active organization context is in the token
- [ ] The token is org-scoped: API endpoints that operate on org resources always check `req.user.orgId === resource.orgId` — a Hospital A token cannot access Hospital B records even if valid
- [ ] Org switch flow: client calls `POST /auth/token/switch` with `{ orgId: 'org_hospital_B' }` — server verifies the user is a member of Hospital B (DB check), issues a new access token with `orgId: 'org_hospital_B'`
- [ ] The old token remains valid until expiry — include `orgId` in the denylist key if immediate revocation is needed: `denylist:${jti}:${orgId}`
- [ ] User with 3 orgs: the login response returns a list of orgs the user belongs to; the client shows an org-picker; user selects one; server issues an org-scoped token
- [ ] Cross-org access attempt example: a middleware function `requireSameOrg(resourceOrgId)` that returns `403 Forbidden` if `req.user.orgId !== resourceOrgId`
- [ ] Audit log: every access to PHI (Protected Health Information) must be logged with `{ userId, orgId, resourceType, resourceId, action, timestamp }` — required for HIPAA compliance

---

### Q13 — Refresh Token Rotation ⭐⭐⭐

**Scenario:** A security audit reveals that refresh tokens never expire (they were mistakenly set to non-expiring). If a refresh token is stolen, the attacker has indefinite access. The team wants to implement rotation with theft detection.

**Task:** Implement refresh token rotation: each use of a refresh token issues a new one and invalidates the old. Implement theft detection: if an already-used refresh token is presented, invalidate ALL tokens for that user.

**Acceptance Criteria:**
- [ ] Each refresh token is stored in the DB: `{ id, userId, tokenHash, parentId, usedAt, expiresAt }`
- [ ] On valid refresh: mark current token as `usedAt = now`, issue a new token with `parentId = currentToken.id`, store the new token, return both new access and refresh tokens
- [ ] Client replaces its stored refresh token with the new one on each use
- [ ] Theft detection: if a token with `usedAt != null` is presented again (replay), an attacker is using a rotated-out token — this means either the legitimate client or the attacker is operating with a stolen token
- [ ] On detecting replay: immediately revoke all refresh tokens for that user (set `usedAt = now` on all rows, or delete them); invalidate all active access tokens via the denylist
- [ ] Notify the user: send an email/push notification — "Suspicious activity detected, you've been logged out of all devices"
- [ ] The `parentId` chain allows forensic analysis: you can trace which device originally had the token and when it was compromised

---

### Q14 — Rate Limiting Auth Endpoints ⭐⭐⭐

**Scenario:** A brute-force scan attempts passwords against `POST /auth/login` at 1,000 requests/second. The general API rate limiter allows 100 requests per 15 minutes per IP — which doesn't help because the attacker uses 10,000 different IPs.

**Task:** Explain why auth endpoints need special protection beyond IP-based rate limiting. Implement email-based lockout: 5 failed attempts → 15-minute lockout for that email address using Redis INCR and EXPIRE.

**Acceptance Criteria:**
- [ ] IP-based rate limiting is ineffective against distributed attacks (10,000 IPs = 10,000 × 100 attempts = 1,000,000 attempts per 15 minutes)
- [ ] Email-based lockout targets the attack surface: each target account can only receive 5 attempts per 15 minutes regardless of how many IPs are used
- [ ] Redis implementation:
  - On failed login: `INCR attempts:login:{email}` → if count is `1`, also call `EXPIRE attempts:login:{email} 900` (15 minutes in seconds)
  - Before checking password: `GET attempts:login:{email}` → if `>= 5`, return `429 Too Many Requests` with `Retry-After: <seconds until key expires>`
- [ ] On successful login: `DEL attempts:login:{email}` — reset the counter
- [ ] The `EXPIRE` is set only on the first failure (count === 1) — prevents attackers from resetting the window by spacing requests apart
- [ ] Combine with: progressive delays (1s, 2s, 4s per attempt), CAPTCHA after 3 failures, and IP-based limits as a second layer
- [ ] States the honeypot consideration: do not reveal via response time or error message whether the email exists — use the same dummy-hash bcrypt call (Q10) even when locked out

---

### Q15 — OAuth Security with PKCE ⭐⭐⭐

**Scenario:** The mobile app team is implementing OAuth. They ask: "Can we use the same OAuth flow as the backend?" The answer is no — mobile apps are "public clients" and face a specific attack called authorization code interception.

**Task:** Explain the authorization code interception attack. Explain how PKCE (Proof Key for Code Exchange) prevents it. Show the `code_verifier` → `code_challenge` derivation. State when PKCE is required.

**Acceptance Criteria:**
- [ ] Authorization code interception: on mobile, other apps can register the same `redirect_uri` scheme (e.g., `myapp://callback`); a malicious app intercepts the redirect and receives the authorization code
- [ ] Without PKCE, the malicious app can exchange the stolen code for tokens using the public `client_id` (there's no `client_secret` on mobile — it would be extractable from the app binary)
- [ ] PKCE flow: before redirecting to the OAuth provider, the client generates a `code_verifier`: `crypto.randomBytes(32).toString('base64url')` — high-entropy random string
- [ ] `code_challenge = base64url(sha256(code_verifier))` — a one-way hash of the verifier; sent in the authorization request
- [ ] When exchanging the code for tokens, the client sends the plaintext `code_verifier`; the server re-hashes it and compares to the stored `code_challenge` — the malicious app cannot forge this because it never had the `code_verifier`
- [ ] PKCE is required for: SPAs (public clients, no client_secret), mobile apps (native iOS/Android, React Native), desktop apps — any client where a `client_secret` cannot be kept secret
- [ ] PKCE is recommended but optional for confidential clients (server-side web apps with a `client_secret`) — RFC 9700 (OAuth 2.1) requires PKCE for all clients
