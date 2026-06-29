// ═══════════════════════════════════════════════════════════════
// TESTING 06: BACKEND TESTING  (Day 36)
// Run: npm test   (from backend/week-4/middlewares or paytm/backend)
// Type-check: npx tsc --noEmit
// ═══════════════════════════════════════════════════════════════
//
// WHAT THIS FILE COVERS:
//  Everything you need to test a Node.js / Express / Prisma backend.
//  Read it once, then apply the patterns to any backend project.
//  The examples reference the actual paytm/backend/ codebase —
//  routes at paytm/backend/routes/user.js and account.js,
//  middleware at paytm/backend/middleware.js,
//  and the existing Jest + supertest setup in backend/week-4/middlewares/.
//
// THE BACKEND TESTING PYRAMID:
//
//            /   E2E   \           ← few — full stack, real browser
//           /───────────\
//          / Contract    \         ← optional — microservice API contracts
//         /───────────────\
//        / Integration     \      ← moderate — routes + real (test) DB
//       /─────────────────────\
//      /   Unit Tests          \  ← many — pure functions, no I/O
//     /─────────────────────────\
//
//  For most backends (like paytm/backend/):
//   • Unit: test Zod schemas, JWT helpers, pure validators, formatters
//   • Integration: test routes end-to-end with supertest + test database
//   • E2E: run the full stack with a frontend (Playwright) — covered in 05
//
// ───────────────────────────────────────────────────────────────

// ───────────────────────────────────────────────────────────────
// 1. BACKEND TESTING LANDSCAPE
// ───────────────────────────────────────────────────────────────
//
// WHAT TO TEST:
//  ✅ Business logic — transfer validation, balance checks, auth rules
//  ✅ Zod schemas — valid/invalid shapes, edge cases
//  ✅ Route behaviour — status codes, response bodies, headers
//  ✅ Middleware — auth gates, rate limits, error handlers
//  ✅ Error paths — what happens when Prisma throws, token is expired, etc.
//
// WHAT NOT TO TEST:
//  ❌ Express framework internals — router, req/res objects
//  ❌ Prisma ORM mechanics — the library is already tested
//  ❌ Node.js built-ins — fs.readFile, crypto.randomBytes
//  ❌ Third-party libraries — jwt.sign behaves as documented
//
// JEST vs VITEST FOR NODE BACKENDS:
//
//  Jest is the default for most backend projects:
//   • No Vite dependency — lighter for pure Node.js
//   • Mature ecosystem — supertest, ts-jest, @types/jest
//   • Used in backend/week-4/middlewares/ already
//
//  Vitest works fine too (same API):
//   • Better if your monorepo already uses Vite for the frontend
//   • Faster on large suites with Vite's module graph
//   • For new projects either is fine — pick one and stick to it
//
//  This file uses Jest because that's what the paytm/backend ecosystem uses.
//  Every pattern is identical in Vitest — just replace jest.fn() with vi.fn().
//
// THE THREE LAYERS IN PRACTICE (paytm/backend/ example):
//
//  Layer 1 — Unit (no I/O):
//    - Zod schema: signupSchema.safeParse({ username: 'bad', ... })
//    - JWT helper: sign/verify round-trip
//    - Math: balance arithmetic, transfer amount checks
//
//  Layer 2 — Integration (supertest + test DB):
//    - POST /api/v1/user/signup creates a user + account row
//    - POST /api/v1/account/transfer decrements/increments balances atomically
//    - GET /api/v1/user/bulk requires a valid JWT
//
//  Layer 3 — E2E (Playwright, covered in 05-e2e-testing.ts):
//    - Full frontend + backend running; real browser clicks

// ───────────────────────────────────────────────────────────────
// 2. JEST SETUP FOR A TYPESCRIPT BACKEND
// ───────────────────────────────────────────────────────────────
//
// INSTALL:
//   npm install --save-dev jest ts-jest @types/jest supertest @types/supertest
//
// jest.config.ts — minimal TypeScript backend config:
//
//   import type { Config } from 'jest';
//
//   const config: Config = {
//     preset: 'ts-jest',                   // ts-jest transforms .ts files
//     testEnvironment: 'node',             // ← NOT jsdom — we have no DOM
//     clearMocks: true,                    // reset mock.calls between tests
//     collectCoverage: true,
//     coverageDirectory: 'coverage',
//     coverageProvider: 'v8',
//     coverageThreshold: {
//       global: { lines: 80, functions: 80, branches: 70 },
//     },
//     setupFilesAfterFramework: ['<rootDir>/tests/setup.ts'],
//     moduleNameMapper: {
//       '^@/(.*)$': '<rootDir>/src/$1',    // if you use path aliases
//     },
//   };
//
//   export default config;
//
// testEnvironment: 'node' — CRITICAL
//  The default in older Jest was jsdom (browser emulation).
//  A Node.js backend has no window/document — jsdom breaks process.env,
//  native modules (crypto, net), and Prisma's binary client.
//  Always set testEnvironment: 'node' for backend projects.
//
// globalSetup vs setupFilesAfterFramework:
//
//  globalSetup: '<rootDir>/tests/global-setup.ts'
//   • Runs ONCE before the entire test run, in a separate Node process
//   • No access to jest globals (describe, expect, jest.fn())
//   • Use for: starting a test DB server, running migrations, seeding
//   • Returns nothing — can write to process.env or a temp file
//
//  setupFilesAfterFramework: ['<rootDir>/tests/setup.ts']
//   • Runs in EACH test file's process, after Jest loads
//   • Has full access to jest globals
//   • Use for: global beforeAll/afterAll hooks, extending expect matchers,
//     connecting Prisma, setting process.env.NODE_ENV = 'test'
//
//  globalTeardown mirrors globalSetup — runs once at the very end.
//  Correct spelling: setupFilesAfterFramework (not setup*Files*After*Framework —
//  the Jest config key is actually `setupFilesAfterFramework` — but note:
//  the actual Jest key is `setupFilesAfterFramework`. Double-check the docs
//  if you see a typo warning in your IDE).
//
//  NOTE: The actual Jest config key is:
//    setupFilesAfterFramework  ← runs after test framework is installed
//    setupFiles               ← runs before test framework, no globals
//
// COVERAGE CONFIG EXAMPLE:
//
//   coverageThreshold: {
//     global: {
//       lines: 80,
//       functions: 80,
//       branches: 70,    // branches often lower — error paths need mocking
//     },
//     // Per-file thresholds (optional):
//     './src/routes/account.ts': { lines: 90 },
//   },
//
//   // Exclude generated/config files from coverage:
//   coveragePathIgnorePatterns: [
//     '/node_modules/',
//     '/prisma/',          // generated Prisma client
//     'jest.config.ts',
//     'src/index.ts',      // just calls app.listen() — not testable
//   ],
//
// EXISTING SETUP — backend/week-4/middlewares/jest.config.ts:
//
//   export default {
//     clearMocks: true,
//     collectCoverage: true,
//     coverageDirectory: 'coverage',
//     coverageProvider: 'v8',
//   };
//
//  That config uses Babel (@babel/plugin-transform-modules-commonjs)
//  to handle ES modules. For TypeScript, swap to ts-jest preset.

// ───────────────────────────────────────────────────────────────
// 3. UNIT TESTING PURE BACKEND FUNCTIONS
// ───────────────────────────────────────────────────────────────
//
// The best unit tests have zero I/O — no DB, no HTTP, no file system.
// Extract logic into pure functions and test those directly.
//
// TESTING ZOD SCHEMAS:
//  paytm/backend/routes/user.js exports signupSchema inline.
//  To make it testable, export it from a separate file:
//
//   // src/schemas/user.ts
//   import { z } from 'zod';
//   export const signupSchema = z.object({
//     username: z.string().email(),
//     password: z.string().min(8),
//     firstName: z.string().min(1),
//     lastName: z.string().min(1),
//   });
//
//   // tests/schemas/user.test.ts
//   import { signupSchema } from '../../src/schemas/user';
//
//   describe('signupSchema', () => {
//     it('accepts a valid signup payload', () => {
//       const result = signupSchema.safeParse({
//         username: 'alice@example.com',
//         password: 'secret123',
//         firstName: 'Alice',
//         lastName: 'Smith',
//       });
//       expect(result.success).toBe(true);
//     });
//
//     it('rejects an invalid email', () => {
//       const result = signupSchema.safeParse({
//         username: 'notanemail',
//         password: 'secret123',
//         firstName: 'Alice',
//         lastName: 'Smith',
//       });
//       expect(result.success).toBe(false);
//       // Zod error path is 'username'
//       expect(result.error?.issues[0].path).toEqual(['username']);
//     });
//
//     it('rejects a password shorter than 8 characters', () => {
//       const result = signupSchema.safeParse({
//         username: 'alice@example.com',
//         password: 'short',
//         firstName: 'Alice',
//         lastName: 'Smith',
//       });
//       expect(result.success).toBe(false);
//       expect(result.error?.issues[0].path).toEqual(['password']);
//     });
//
//     it('rejects an empty firstName', () => {
//       const result = signupSchema.safeParse({
//         username: 'alice@example.com',
//         password: 'secret123',
//         firstName: '',
//         lastName: 'Smith',
//       });
//       expect(result.success).toBe(false);
//     });
//   });
//
// TESTING JWT HELPERS:
//  Test the sign/verify round-trip without mocking. JWT is pure crypto.
//
//   // src/utils/jwt.ts
//   import jwt from 'jsonwebtoken';
//   const SECRET = process.env.JWT_SECRET || 'test-secret';
//
//   export function signToken(userId: string): string {
//     return jwt.sign({ userId }, SECRET, { expiresIn: '7d' });
//   }
//
//   export function verifyToken(token: string): { userId: string } {
//     return jwt.verify(token, SECRET) as { userId: string };
//   }
//
//   // tests/utils/jwt.test.ts
//   describe('JWT helpers', () => {
//     beforeAll(() => {
//       process.env.JWT_SECRET = 'test-secret-for-tests';
//     });
//
//     it('signs a token and verifies it back', () => {
//       const token = signToken('user-123');
//       const decoded = verifyToken(token);
//       expect(decoded.userId).toBe('user-123');
//     });
//
//     it('throws on a tampered token', () => {
//       const token = signToken('user-123');
//       const tampered = token.slice(0, -4) + 'xxxx';
//       expect(() => verifyToken(tampered)).toThrow();
//     });
//
//     it('throws on an expired token', () => {
//       const expired = jwt.sign(
//         { userId: 'user-123' },
//         'test-secret-for-tests',
//         { expiresIn: -1 }   // already expired
//       );
//       expect(() => verifyToken(expired)).toThrow(/expired/i);
//     });
//   });
//
// TESTING BCRYPT — MOCK IT IN UNIT TESTS:
//  bcrypt.hash with rounds=12 takes ~300ms. Multiplied across 50 tests,
//  your suite is 15 seconds slower for no reason.
//  In UNIT tests: mock bcrypt. In INTEGRATION tests: let it run (or lower rounds).
//
//   // tests/unit/auth.test.ts
//   import bcrypt from 'bcryptjs';
//
//   jest.mock('bcryptjs', () => ({
//     hash: jest.fn().mockResolvedValue('$hashed$'),
//     compare: jest.fn().mockResolvedValue(true),
//   }));
//
//   it('hashes the password before storing', async () => {
//     await createUser({ password: 'secret123', ...rest });
//     expect(bcrypt.hash).toHaveBeenCalledWith('secret123', expect.any(Number));
//   });
//
//  For integration tests (section 6), use BCRYPT_ROUNDS=1 in .env.test.
//  One round is cryptographically weak but finishes in ~1ms — fine for tests.
//
// jest.mock() FOR MODULE MOCKING:
//
//  jest.mock('./path/to/module')          — auto-mock: all exports become jest.fn()
//  jest.mock('./module', () => ({...}))   — factory: define the mock yourself
//  jest.spyOn(object, 'method')           — wrap an existing method on an object
//
//  HOISTING: jest.mock() calls are hoisted to the top of the file by Babel/ts-jest.
//  They run before any imports. That's why you can write:
//
//    import { doSomething } from './myModule'; // imported AFTER mock is set up
//    jest.mock('./myModule');                  // hoisted — runs FIRST
//
//  In Vitest the same hoisting applies to vi.mock().

// ───────────────────────────────────────────────────────────────
// 4. SUPERTEST — TESTING EXPRESS ROUTES
// ───────────────────────────────────────────────────────────────
//
// WHAT SUPERTEST DOES:
//  Supertest fires REAL HTTP requests against your Express app
//  in-process. No network, no port, no running server needed.
//  Under the hood it calls app.listen(0) (random port), makes
//  the request, and closes the server. Your middleware, router,
//  Zod validation, and response codes all run for real.
//
// THE GOLDEN RULE — NEVER call app.listen() in the file you export app from:
//
//   // ✅ paytm/backend/app.ts (testable)
//   import express from 'express';
//   import rootRouter from './routes';
//   export const app = express();
//   app.use(express.json());
//   app.use('/api/v1', rootRouter);
//   // NO app.listen() here
//
//   // paytm/backend/index.ts (entrypoint only)
//   import { app } from './app';
//   app.listen(process.env.PORT ?? 3000);
//
//  Why? If app.listen() is in app.ts, importing it in a test starts
//  a real server on port 3000, which conflicts with other test runs
//  and leaves a dangling process after tests finish.
//
//  The existing paytm/backend/index.js calls app.listen() directly.
//  Refactor: move the app setup into app.js, import + listen in index.js.
//  The existing backend/week-4/middlewares files export the app already:
//    module.exports = app;  ← correct
//
// BASIC SUPERTEST USAGE:
//
//   import request from 'supertest';
//   import { app } from '../../src/app';
//
//   describe('POST /api/v1/user/signup', () => {
//     it('creates a user and returns 201 with a token', async () => {
//       const res = await request(app)
//         .post('/api/v1/user/signup')
//         .send({
//           username: 'alice@example.com',
//           password: 'secret123',
//           firstName: 'Alice',
//           lastName: 'Smith',
//         });
//
//       expect(res.status).toBe(201);
//       expect(res.body.token).toBeDefined();
//       expect(res.body.user.username).toBe('alice@example.com');
//       expect(res.body.user.passwordHash).toBeUndefined(); // never leak hash
//     });
//
//     it('returns 400 for an invalid email', async () => {
//       const res = await request(app)
//         .post('/api/v1/user/signup')
//         .send({ username: 'notanemail', password: 'secret123',
//                 firstName: 'Alice', lastName: 'Smith' });
//
//       expect(res.status).toBe(400);
//       expect(res.body.message).toBe('Invalid inputs');
//     });
//
//     it('returns 409 when the email is already taken', async () => {
//       // First signup
//       await request(app).post('/api/v1/user/signup').send(validPayload);
//       // Second signup with same email
//       const res = await request(app).post('/api/v1/user/signup').send(validPayload);
//
//       expect(res.status).toBe(409);
//       expect(res.body.message).toBe('Email already taken');
//     });
//   });
//
// SETTING REQUEST HEADERS:
//
//   // Auth header for protected routes
//   const res = await request(app)
//     .get('/api/v1/account/balance')
//     .set('Authorization', `Bearer ${token}`);
//
//   // Custom header (like the middleware tests in backend/week-4/)
//   const res = await request(app)
//     .get('/')
//     .set('100xdevs-api-key', 'valid_key');
//
// FULL FLOW TEST — signup → signin → use protected route:
//
//   describe('full user flow', () => {
//     let authToken: string;
//
//     it('signs up a new user', async () => {
//       const res = await request(app)
//         .post('/api/v1/user/signup')
//         .send(validSignupPayload);
//       expect(res.status).toBe(201);
//       authToken = res.body.token;
//     });
//
//     it('signs in with the same credentials', async () => {
//       const res = await request(app)
//         .post('/api/v1/user/signin')
//         .send({ username: 'alice@example.com', password: 'secret123' });
//       expect(res.status).toBe(200);
//       expect(res.body.token).toBeDefined();
//     });
//
//     it('fetches balance with the token', async () => {
//       const res = await request(app)
//         .get('/api/v1/account/balance')
//         .set('Authorization', `Bearer ${authToken}`);
//       expect(res.status).toBe(200);
//       expect(res.body.balance).toBeDefined();
//       expect(Number(res.body.balance)).toBeGreaterThan(0);
//     });
//   });
//
// WHAT TO ASSERT:
//  • res.status      — HTTP status code (number)
//  • res.body        — parsed JSON response body (object)
//  • res.headers     — response headers
//  • res.text        — raw response text (for non-JSON)
//
//  Don't assert the entire response body with toEqual({...}) —
//  that couples your test to every field. Assert only what matters:
//    expect(res.body.message).toBe('Transfer successful') ✅
//    expect(res.body).toEqual({ message: '...', token: '...', ... }) ❌ fragile

// ───────────────────────────────────────────────────────────────
// 5. MOCKING THE DATABASE (PRISMA)
// ───────────────────────────────────────────────────────────────
//
// WHY MOCK PRISMA IN UNIT TESTS:
//  • Speed — a real DB round-trip takes 5–50ms; a mock is synchronous
//  • Isolation — your test only fails if YOUR code is wrong, not Postgres
//  • Simplicity — no test DB setup, migrations, or cleanup needed
//  • Control — you can simulate rare DB errors on demand
//
// WHY NOT MOCK PRISMA IN INTEGRATION TESTS:
//  If you mock the DB, you're testing your code + your mock,
//  not your code + actual SQL. A typo in a Prisma query won't be caught.
//  Integration tests SHOULD hit a real (test) database. See section 6.
//
// OPTION A — Manual mock with jest.mock():
//
//   // paytm/backend/prisma/client.ts (the file your routes import)
//   import { PrismaClient } from '@prisma/client';
//   const prisma = new PrismaClient();
//   export default prisma;
//
//   // In your test file:
//   jest.mock('../../prisma/client', () => ({
//     __esModule: true,
//     default: {
//       user: {
//         findUnique: jest.fn(),
//         create: jest.fn(),
//         update: jest.fn(),
//         findMany: jest.fn(),
//       },
//       account: {
//         findUnique: jest.fn(),
//         update: jest.fn(),
//         create: jest.fn(),
//       },
//       transaction: {
//         create: jest.fn(),
//         findMany: jest.fn(),
//       },
//       $transaction: jest.fn(),   // ← important for transfer route
//     },
//   }));
//
//   import prisma from '../../prisma/client'; // now it's the mock
//
//   describe('GET /api/v1/account/balance', () => {
//     it('returns the balance for the authenticated user', async () => {
//       (prisma.account.findUnique as jest.Mock).mockResolvedValue({
//         userId: 'user-1',
//         balance: '4250.00',
//       });
//
//       const token = signToken('user-1');
//       const res = await request(app)
//         .get('/api/v1/account/balance')
//         .set('Authorization', `Bearer ${token}`);
//
//       expect(res.status).toBe(200);
//       expect(res.body.balance).toBe('4250.00');
//       expect(prisma.account.findUnique).toHaveBeenCalledWith({
//         where: { userId: 'user-1' },
//       });
//     });
//
//     it('returns 404 when account does not exist', async () => {
//       (prisma.account.findUnique as jest.Mock).mockResolvedValue(null);
//
//       const token = signToken('user-1');
//       const res = await request(app)
//         .get('/api/v1/account/balance')
//         .set('Authorization', `Bearer ${token}`);
//
//       expect(res.status).toBe(404);
//     });
//   });
//
// OPTION B — jest-mock-extended (recommended for TypeScript):
//
//   npm install --save-dev jest-mock-extended
//
//   // tests/__mocks__/prisma.ts
//   import { PrismaClient } from '@prisma/client';
//   import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
//
//   export const prismaMock = mockDeep<PrismaClient>();
//
//   jest.mock('../../prisma/client', () => ({
//     __esModule: true,
//     default: prismaMock,
//   }));
//
//   beforeEach(() => { mockReset(prismaMock); });
//
//   // In tests — fully typed:
//   prismaMock.user.findUnique.mockResolvedValue({
//     id: 'user-1',
//     username: 'alice@example.com',
//     passwordHash: '$2b$12$...',
//     firstName: 'Alice',
//     lastName: 'Smith',
//     createdAt: new Date(),
//   });
//
//  The deep mock gives you typed autocompletion for every Prisma method.
//
// MOCKING $transaction:
//  The transfer route uses prisma.$transaction(async (tx) => { ... })
//  The callback receives a transaction client (tx). Mock $transaction to
//  call the callback with the mock prisma object:
//
//   (prisma.$transaction as jest.Mock).mockImplementation(async (fn) => {
//     return fn(prisma); // pass the mock prisma as the tx argument
//   });
//
//  Now calls to tx.account.update inside the transaction hit your mocks.
//
// jest.spyOn FOR TARGETED SPYING:
//
//   // Don't mock the whole Prisma client — just spy on one method
//   const findSpy = jest.spyOn(prisma.user, 'findUnique');
//   findSpy.mockResolvedValueOnce(null); // returns null once, then real impl
//
//   // After test:
//   findSpy.mockRestore();

// ───────────────────────────────────────────────────────────────
// 6. INTEGRATION TESTS WITH A REAL TEST DATABASE
// ───────────────────────────────────────────────────────────────
//
// Integration tests hit a real Postgres instance with a separate test schema.
// They are slower (2–10s per test) but catch SQL bugs that mocks miss.
//
// SETUP — .env.test:
//
//   DATABASE_URL="postgresql://user:pass@localhost:5432/paytm_test"
//   JWT_SECRET="test-jwt-secret"
//   BCRYPT_ROUNDS=1       # fast bcrypt for tests
//   NODE_ENV=test
//
//  Load it with dotenv-cli: `dotenv -e .env.test -- jest`
//  Or add to package.json: `"test": "dotenv -e .env.test -- jest"`
//
// MIGRATION BEFORE TESTS — globalSetup:
//
//   // tests/global-setup.ts
//   import { execSync } from 'child_process';
//
//   export default async function globalSetup() {
//     // Push the Prisma schema to the test DB (creates tables, no migration files)
//     execSync('npx prisma db push --force-reset', {
//       env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
//     });
//     console.log('Test database migrated');
//   }
//
//   // jest.config.ts
//   globalSetup: '<rootDir>/tests/global-setup.ts',
//   globalTeardown: '<rootDir>/tests/global-teardown.ts',
//
// PRISMA CONNECTION — setupFilesAfterFramework:
//
//   // tests/setup.ts
//   import { PrismaClient } from '@prisma/client';
//   export const prisma = new PrismaClient();
//
//   beforeAll(async () => { await prisma.$connect(); });
//   afterAll(async () => { await prisma.$disconnect(); });
//
// TABLE ISOLATION — clear data between tests:
//
//   // tests/helpers/clearDb.ts
//   import { PrismaClient } from '@prisma/client';
//   const prisma = new PrismaClient();
//
//   export async function clearDb() {
//     // Delete in dependency order — transactions reference users/accounts
//     await prisma.transaction.deleteMany();
//     await prisma.account.deleteMany();
//     await prisma.user.deleteMany();
//   }
//
//   // In every integration test file:
//   beforeEach(async () => { await clearDb(); });
//
//  Alternative: wrap each test in a transaction and roll it back:
//
//   let tx: PrismaClient;
//
//   beforeEach(async () => {
//     // Start an uncommitted transaction
//     tx = ... // advanced: use prisma.$extends or a PG savepoint
//   });
//
//   afterEach(async () => {
//     await tx.$executeRaw`ROLLBACK`;
//   });
//
//  The rollback approach is faster but trickier with Prisma.
//  For most projects, beforeEach + deleteMany is simpler and fast enough.
//
// FULL INTEGRATION TEST — transfer route:
//
//   describe('POST /api/v1/account/transfer (integration)', () => {
//     let senderToken: string;
//     let senderUserId: string;
//     let receiverUserId: string;
//
//     beforeEach(async () => {
//       await clearDb();
//
//       // Create sender
//       const signupRes = await request(app)
//         .post('/api/v1/user/signup')
//         .send({ username: 'sender@test.com', password: 'password1',
//                 firstName: 'Sender', lastName: 'User' });
//       senderToken = signupRes.body.token;
//       senderUserId = signupRes.body.user.id;
//
//       // Create receiver
//       const receiverRes = await request(app)
//         .post('/api/v1/user/signup')
//         .send({ username: 'receiver@test.com', password: 'password1',
//                 firstName: 'Receiver', lastName: 'User' });
//       receiverUserId = receiverRes.body.user.id;
//     });
//
//     it('transfers funds and records a transaction row', async () => {
//       // Set sender balance to a known value
//       await prisma.account.update({
//         where: { userId: senderUserId },
//         data: { balance: 500 },
//       });
//
//       const res = await request(app)
//         .post('/api/v1/account/transfer')
//         .set('Authorization', `Bearer ${senderToken}`)
//         .send({ to: receiverUserId, amount: 100, note: 'rent' });
//
//       expect(res.status).toBe(200);
//       expect(res.body.message).toBe('Transfer successful');
//
//       // Verify balances in DB
//       const sender = await prisma.account.findUnique({ where: { userId: senderUserId } });
//       const receiver = await prisma.account.findUnique({ where: { userId: receiverUserId } });
//       expect(Number(sender!.balance)).toBe(400);   // 500 - 100
//       expect(Number(receiver!.balance)).toBeGreaterThan(100); // initial + 100
//
//       // Verify transaction row
//       const txn = await prisma.transaction.findFirst({
//         where: { senderId: senderUserId, receiverId: receiverUserId },
//       });
//       expect(txn).not.toBeNull();
//       expect(Number(txn!.amount)).toBe(100);
//       expect(txn!.note).toBe('rent');
//     });
//
//     it('returns 400 when balance is insufficient', async () => {
//       await prisma.account.update({
//         where: { userId: senderUserId },
//         data: { balance: 50 }, // only 50, trying to send 100
//       });
//
//       const res = await request(app)
//         .post('/api/v1/account/transfer')
//         .set('Authorization', `Bearer ${senderToken}`)
//         .send({ to: receiverUserId, amount: 100 });
//
//       expect(res.status).toBe(400);
//       expect(res.body.message).toBe('Insufficient balance');
//
//       // Confirm balances are UNCHANGED (transaction rolled back)
//       const sender = await prisma.account.findUnique({ where: { userId: senderUserId } });
//       expect(Number(sender!.balance)).toBe(50);
//     });
//   });

// ───────────────────────────────────────────────────────────────
// 7. TESTING MIDDLEWARE
// ───────────────────────────────────────────────────────────────
//
// The existing tests in backend/week-4/middlewares/tests/ already
// demonstrate the core pattern. Here's a deeper breakdown.
//
// AUTH MIDDLEWARE — paytm/backend/middleware.js:
//  Checks for 'Authorization: Bearer <token>' header.
//  On success: attaches req.userId and calls next().
//  On failure: returns 403 { message: "Invalid token" }.
//
//   // tests/middleware/auth.test.ts
//   import request from 'supertest';
//   import jwt from 'jsonwebtoken';
//   import { app } from '../../src/app';
//
//   describe('authMiddleware', () => {
//     const JWT_SECRET = process.env.JWT_SECRET!;
//
//     it('calls next() and sets req.userId for a valid token', async () => {
//       const token = jwt.sign({ userId: 'user-1' }, JWT_SECRET);
//       const res = await request(app)
//         .get('/api/v1/account/balance')
//         .set('Authorization', `Bearer ${token}`);
//       // 404 or 200 means the middleware passed — NOT 403
//       expect(res.status).not.toBe(403);
//     });
//
//     it('returns 403 when no Authorization header is sent', async () => {
//       const res = await request(app).get('/api/v1/account/balance');
//       expect(res.status).toBe(403);
//       expect(res.body.message).toBe('Invalid token');
//     });
//
//     it('returns 403 for an expired token', async () => {
//       const expired = jwt.sign({ userId: 'user-1' }, JWT_SECRET, { expiresIn: -1 });
//       const res = await request(app)
//         .get('/api/v1/account/balance')
//         .set('Authorization', `Bearer ${expired}`);
//       expect(res.status).toBe(403);
//     });
//
//     it('returns 403 for a malformed token (not a JWT)', async () => {
//       const res = await request(app)
//         .get('/api/v1/account/balance')
//         .set('Authorization', 'Bearer this.is.not.valid');
//       expect(res.status).toBe(403);
//     });
//
//     it('returns 403 for a token signed with the wrong secret', async () => {
//       const badToken = jwt.sign({ userId: 'user-1' }, 'wrong-secret');
//       const res = await request(app)
//         .get('/api/v1/account/balance')
//         .set('Authorization', `Bearer ${badToken}`);
//       expect(res.status).toBe(403);
//     });
//   });
//
// RATE LIMITER — backend/week-4/middlewares/tests/01-ratelimitter.spec.js:
//  The existing test already covers the three cases. Key insight:
//
//   it('5 or more requests return back a 404', function(done) {
//     for (let i = 0; i < 5; i++) {
//       request(app).get('/user').set('user-id', userId).then();
//     }
//     request(app).get('/user').set('user-id', userId).then((response) => {
//       expect(response.status).toBe(404);  // 6th request blocked
//       done();
//     });
//   });
//
//  Note: the rate limiter in that project uses 404 for "too many requests".
//  Production rate limiters use 429 (Too Many Requests per RFC 6585).
//  Test whatever status code your actual middleware uses.
//
// ERROR HANDLER MIDDLEWARE:
//  Express error handlers have the signature (err, req, res, next).
//  Test them by forcing a route to call next(err).
//
//   // src/middleware/errorHandler.ts
//   export function errorHandler(err, req, res, next) {
//     const status = err.status || 500;
//     res.status(status).json({ message: err.message || 'Internal server error' });
//   }
//
//   // In tests — create a minimal app with an error-throwing route:
//   const testApp = express();
//   testApp.get('/boom', (req, res, next) => {
//     const err = new Error('Something went wrong');
//     (err as any).status = 422;
//     next(err);
//   });
//   testApp.use(errorHandler);
//
//   it('converts thrown errors to JSON responses', async () => {
//     const res = await request(testApp).get('/boom');
//     expect(res.status).toBe(422);
//     expect(res.body.message).toBe('Something went wrong');
//   });
//
// REQUEST LOGGER — spy on console.log:
//
//   it('logs the method and path for every request', async () => {
//     const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
//     await request(app).get('/api/v1/user/bulk');
//     expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('GET'));
//     expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('/api/v1/user/bulk'));
//     logSpy.mockRestore();
//   });

// ───────────────────────────────────────────────────────────────
// 8. TESTING ASYNC CONTROLLERS — ERROR PATHS
// ───────────────────────────────────────────────────────────────
//
// The signup route in paytm/backend/routes/user.js has these failure modes:
//  400 — Zod validation fails (bad email, short password, missing fields)
//  409 — email already taken (prisma.user.findUnique returns a user)
//  500 — Prisma throws unexpectedly (DB down, unique constraint race)
//
// HOW EXPRESS ERROR HANDLING WORKS:
//  If an async route throws and does NOT call next(err), Express leaves
//  the request hanging forever in Express 4. That's a bug in the route.
//  The paytm routes use try/catch + res.status(500) explicitly — correct.
//
//  To catch async throws automatically, wrap routes:
//    router.post('/signup', asyncHandler(async (req, res) => { ... }));
//  where asyncHandler forwards thrown errors to next(err).
//
// TESTING THE 500 PATH — MOCK PRISMA TO THROW:
//
//   jest.mock('../../prisma/client', () => ({
//     __esModule: true,
//     default: { user: { findUnique: jest.fn(), create: jest.fn() },
//                account: { create: jest.fn() },
//                $transaction: jest.fn() },
//   }));
//   import prisma from '../../prisma/client';
//
//   it('returns 500 when Prisma throws during signup', async () => {
//     (prisma.user.findUnique as jest.Mock).mockResolvedValue(null); // not existing
//     (prisma.$transaction as jest.Mock).mockRejectedValue(
//       new Error('DB connection lost')
//     );
//
//     const res = await request(app)
//       .post('/api/v1/user/signup')
//       .send(validSignupPayload);
//
//     // The route's catch block should return 500
//     expect(res.status).toBe(500);
//   });
//
// TESTING THE TRANSFER ROLLBACK SCENARIO:
//  The transfer route uses prisma.$transaction. If the second account.update
//  fails (e.g. receiver account doesn't exist), Prisma rolls back.
//  To test this, mock $transaction to throw after the first update.
//
//   (prisma.$transaction as jest.Mock).mockImplementation(async (fn) => {
//     const mockTx = {
//       account: {
//         findUnique: jest.fn().mockResolvedValue({ balance: 500 }),
//         update: jest.fn()
//           .mockResolvedValueOnce({})          // first call (sender debit) — OK
//           .mockRejectedValueOnce(             // second call (receiver credit) — FAILS
//             new Error('P2025: Record not found')
//           ),
//       },
//       transaction: { create: jest.fn() },
//     };
//     return fn(mockTx);  // run the route's callback with the mock tx
//   });
//
//   it('returns 500 when the credit step of a transfer fails', async () => {
//     const res = await request(app)
//       .post('/api/v1/account/transfer')
//       .set('Authorization', `Bearer ${senderToken}`)
//       .send({ to: receiverUserId, amount: 100 });
//
//     expect(res.status).toBe(500);
//     expect(res.body.message).toBe('Transfer failed');
//   });
//
// COMMON ERROR CODE CHEATSHEET:
//
//  400 Bad Request      — validation error, invalid input, business rule violation
//  401 Unauthorized     — no credentials, or credentials required but missing
//  403 Forbidden        — authenticated but not allowed (wrong role, expired token)
//  404 Not Found        — resource doesn't exist
//  409 Conflict         — duplicate resource (email already taken)
//  422 Unprocessable    — syntactically valid but semantically wrong
//  429 Too Many Requests — rate limit exceeded
//  500 Internal Server  — unexpected error (DB down, unhandled throw)
//
//  Note: paytm/backend/middleware.js uses 403 for auth failures.
//  Some APIs use 401. Pick one and be consistent.

// ───────────────────────────────────────────────────────────────
// 9. CONTRACT TESTING (BRIEF)
// ───────────────────────────────────────────────────────────────
//
// WHAT IT IS:
//  Contract testing verifies that two services (consumer + provider)
//  agree on the shape of their API. The consumer records what it
//  expects (a "contract"), and the provider verifies it can satisfy that.
//  Neither service needs to be running at the same time.
//
// WHY IT EXISTS:
//  In microservices, Service A calls Service B. Integration tests require
//  B to be running. Contract tests let A test its expectations without B,
//  and let B verify it satisfies all consumers independently.
//
// PACT.JS — the standard tool:
//
//   // Consumer side (frontend or calling service):
//   const pact = new Pact({ consumer: 'WebApp', provider: 'PaytmAPI' });
//
//   await pact.addInteraction({
//     state: 'user alice exists',
//     uponReceiving: 'a request for alice\'s balance',
//     withRequest: { method: 'GET', path: '/api/v1/account/balance',
//                    headers: { Authorization: 'Bearer token' } },
//     willRespondWith: { status: 200, body: { balance: like('1000.00') } },
//   });
//
//   // Provider side verifies the contract file matches the real API
//
// WHEN TO USE IT:
//  ✅ Multiple frontend apps consuming one backend
//  ✅ Microservices where teams deploy independently
//  ✅ Public APIs where you can't control clients
//
//  For most apps — a monolith or a single frontend + single backend —
//  thorough integration tests give you the same confidence with less setup.
//  Pact.js adds tooling overhead. Skip it until you have multiple
//  independent consumers.

// ───────────────────────────────────────────────────────────────
// 10. CI FOR BACKEND TESTS
// ───────────────────────────────────────────────────────────────
//
// GitHub Actions — spin up Postgres alongside your tests:
//
//   # .github/workflows/backend.yml
//   name: Backend Tests
//   on: [push, pull_request]
//
//   jobs:
//     test:
//       runs-on: ubuntu-latest
//
//       services:
//         postgres:
//           image: postgres:15
//           env:
//             POSTGRES_USER: test
//             POSTGRES_PASSWORD: test
//             POSTGRES_DB: paytm_test
//           ports:
//             - 5432:5432
//           options: >-
//             --health-cmd pg_isready
//             --health-interval 10s
//             --health-timeout 5s
//             --health-retries 5
//
//       steps:
//         - uses: actions/checkout@v4
//         - uses: actions/setup-node@v4
//           with: { node-version: 20, cache: npm }
//
//         - run: npm ci
//
//         - name: Run Prisma migrations
//           run: npx prisma db push
//           env:
//             DATABASE_URL: postgresql://test:test@localhost:5432/paytm_test
//
//         - name: Run tests
//           run: npm test
//           env:
//             DATABASE_URL: postgresql://test:test@localhost:5432/paytm_test
//             JWT_SECRET: ci-test-secret
//             BCRYPT_ROUNDS: 1
//             NODE_ENV: test
//
// KEY POINTS:
//  • services.postgres runs the container; health-check ensures it's ready
//    before your test step starts
//  • Run `prisma db push` (not `migrate deploy`) for a test DB —
//    push applies the schema directly without migration history
//  • Always pass DATABASE_URL, JWT_SECRET, and BCRYPT_ROUNDS as env vars
//  • Set BCRYPT_ROUNDS=1 so bcrypt.hash takes 1ms, not 300ms
//  • Never commit real secrets — use GitHub Actions secrets:
//      DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
//
// LOCAL PRE-PUSH HOOK (already wired in this repo via package.json):
//  The root npm run lint runs before every push.
//  Add test runs to the hook:
//
//   // package.json
//   "scripts": {
//     "pre-push": "npm run lint && cd paytm/backend && npm test"
//   }
//   // .git/hooks/pre-push (or use husky)

// ───────────────────────────────────────────────────────────────
// PRACTICE — QUESTIONS AND ANSWERS
// ───────────────────────────────────────────────────────────────
//
// Q1: Why should app.listen() NOT be called in the same file
//     you export `app` from?
//
// A: When your test file imports the app, Node.js executes the file.
//    If app.listen() is in that file, it opens a real TCP server on
//    whatever port you configured. In CI, this conflicts with other
//    test runs on the same machine. In local dev, each test worker
//    opens another port. Worse — the server is never closed, so Jest
//    warns "Jest did not exit one second after the test run completed"
//    and your process hangs.
//
//    Supertest handles the listen/close cycle for you — it only needs
//    the `app` object. Keep app setup in app.js and the listen() call
//    in a separate index.js (entrypoint only). See paytm/backend/index.js
//    which already does this correctly.
//
// Q2: You are testing a route that calls prisma.user.findUnique.
//     In a UNIT test, would you mock Prisma or use a real DB?
//
// A: Mock it. Unit tests must be fast and isolated — they should
//    pass without a running database. Mock prisma.user.findUnique to
//    return a known user object or null, then assert that your route
//    produces the correct HTTP response for each case.
//
//    Use a real DB in INTEGRATION tests — that's where you verify the
//    actual SQL query is correct, the schema matches, and transactions
//    roll back as expected. Rule of thumb:
//      mock DB → unit test of route logic
//      real DB → integration test of route + DB contract
//
// Q3: How do you test that a protected route returns 403 when no
//     token is sent?
//
// A: Make a supertest request to the protected route without setting
//    the Authorization header:
//
//      const res = await request(app).get('/api/v1/account/balance');
//      expect(res.status).toBe(403);
//      expect(res.body.message).toBe('Invalid token');
//
//    The authMiddleware in paytm/backend/middleware.js checks for the
//    Authorization header and returns 403 if it's missing or invalid.
//    No mocking needed — the real middleware runs in the test.
//
// Q4: What is the difference between globalSetup and
//     setupFilesAfterFramework in Jest?
//
// A: globalSetup runs ONCE before the entire test suite, in a separate
//    Node.js process that has no access to Jest globals (describe, jest.fn(),
//    expect). Use it for expensive one-time operations: starting a DB server,
//    running Prisma migrations, seeding reference data.
//
//    setupFilesAfterFramework runs inside EACH test file's process, after
//    Jest is loaded (so you have full access to jest globals). Use it for:
//    - Connecting Prisma (prisma.$connect())
//    - Extending expect with custom matchers
//    - Setting process.env.NODE_ENV = 'test'
//    - Global beforeAll/afterAll hooks for DB teardown
//
//    If you put migration logic in setupFilesAfterFramework, it runs once
//    per test FILE — wasteful and slow. Put it in globalSetup instead.
//
// Q5: Your transfer route uses prisma.$transaction. How do you test
//     the rollback case where the second operation fails?
//
// A: Mock $transaction to simulate a partial failure. The key is to make
//    the mock call your route's transaction callback but have the second
//    DB operation inside it throw. Here is the pattern:
//
//      (prisma.$transaction as jest.Mock).mockImplementation(async (fn) => {
//        const mockTx = {
//          account: {
//            findUnique: jest.fn().mockResolvedValue({ balance: 500 }),
//            update: jest.fn()
//              .mockResolvedValueOnce({})          // sender debit — OK
//              .mockRejectedValueOnce(             // receiver credit — FAILS
//                new Error('DB error on credit')
//              ),
//          },
//          transaction: { create: jest.fn() },
//        };
//        return fn(mockTx);
//      });
//
//      const res = await request(app)
//        .post('/api/v1/account/transfer')
//        .set('Authorization', `Bearer ${senderToken}`)
//        .send({ to: receiverUserId, amount: 100 });
//
//      expect(res.status).toBe(500);
//
//    In a real integration test (section 6), Prisma's $transaction rolls back
//    automatically when an error is thrown inside the callback. You verify
//    rollback by reading the sender's balance from the DB after the failed
//    transfer and confirming it is unchanged.

// ───────────────────────────────────────────────────────────────
// DEMO — run with: npx ts-node basics/testing/06-backend-testing.ts
// ───────────────────────────────────────────────────────────────

function runDemo(): void {
  console.log('\n' + '═'.repeat(65));
  console.log('  TESTING 06: BACKEND TESTING — REFERENCE CARD');
  console.log('═'.repeat(65) + '\n');

  // ── Testing pyramid ──────────────────────────────────────────
  console.log('BACKEND TESTING PYRAMID');
  console.log('');
  console.log('         /   E2E   \\           few, full stack');
  console.log('        /───────────\\');
  console.log('       / Integration \\          routes + real DB');
  console.log('      /───────────────\\');
  console.log('     /   Unit Tests    \\        pure functions, fast');
  console.log('    /───────────────────\\');
  console.log('');

  // ── Supertest cheat sheet ─────────────────────────────────────
  console.log('SUPERTEST CHEAT SHEET');
  console.log('');
  const supertestExamples = [
    ['GET, no auth',       "request(app).get('/path')"],
    ['POST + JSON body',   "request(app).post('/path').send({ key: 'val' })"],
    ['Auth header',        ".set('Authorization', `Bearer ${token}`)"],
    ['Custom header',      ".set('x-my-header', 'value')"],
    ['Assert status',      ".expect(200)  OR  expect(res.status).toBe(200)"],
    ['Assert body field',  "expect(res.body.token).toBeDefined()"],
    ['Assert shape',       "expect(res.body).toMatchObject({ message: 'ok' })"],
  ];
  supertestExamples.forEach(([label, code]) => {
    console.log(`  ${label.padEnd(22)} ${code}`);
  });
  console.log('');

  // ── Prisma mock pattern ───────────────────────────────────────
  console.log('PRISMA MOCK PATTERN (jest.mock)');
  console.log('');
  const prismaPatterns = [
    'jest.mock(\'../prisma/client\', () => ({',
    '  __esModule: true,',
    '  default: {',
    '    user:        { findUnique: jest.fn(), create: jest.fn(), ... },',
    '    account:     { findUnique: jest.fn(), update: jest.fn(), ... },',
    '    transaction: { create: jest.fn(), findMany: jest.fn() },',
    '    $transaction: jest.fn(),',
    '  },',
    '}));',
    '',
    '// Control return value per test:',
    '(prisma.user.findUnique as jest.Mock).mockResolvedValue(user);',
    '(prisma.user.findUnique as jest.Mock).mockResolvedValue(null);',
    '(prisma.$transaction as jest.Mock).mockImplementation(fn => fn(prisma));',
  ];
  prismaPatterns.forEach(line => console.log('  ' + line));
  console.log('');

  // ── HTTP status codes ─────────────────────────────────────────
  console.log('HTTP STATUS CODES (backend testing)');
  console.log('');
  const codes: Array<[number, string, string]> = [
    [200, 'OK',                    'standard success'],
    [201, 'Created',               'POST that creates a resource'],
    [400, 'Bad Request',           'Zod validation fail, business rule'],
    [401, 'Unauthorized',          'no/bad credentials'],
    [403, 'Forbidden',             'token invalid/expired (paytm uses 403)'],
    [404, 'Not Found',             'resource does not exist'],
    [409, 'Conflict',              'duplicate (email already taken)'],
    [429, 'Too Many Requests',     'rate limit exceeded'],
    [500, 'Internal Server Error', 'unhandled Prisma throw, DB down'],
  ];
  codes.forEach(([code, name, note]) => {
    console.log(`  ${String(code).padEnd(5)} ${name.padEnd(26)} ← ${note}`);
  });
  console.log('');

  // ── Jest config keys ──────────────────────────────────────────
  console.log('JEST CONFIG KEYS FOR BACKEND');
  console.log('');
  const configKeys = [
    ['testEnvironment',           "'node'  ← NOT jsdom"],
    ['preset',                    "'ts-jest'  (for TypeScript)"],
    ['globalSetup',               'migrations, DB start — runs once'],
    ['setupFilesAfterFramework',  'prisma connect, env vars — per file'],
    ['clearMocks',                'true  — reset mock.calls between tests'],
    ['coverageProvider',          "'v8'"],
  ];
  configKeys.forEach(([key, val]) => {
    console.log(`  ${key.padEnd(30)} ${val}`);
  });
  console.log('');

  // ── Files to know ─────────────────────────────────────────────
  console.log('KEY FILES IN THIS REPO');
  console.log('');
  const files = [
    'paytm/backend/routes/user.js       signup / signin / update / bulk',
    'paytm/backend/routes/account.js    balance / transfer ($transaction) / transactions',
    'paytm/backend/middleware.js        JWT auth — Bearer token, returns 403',
    'paytm/backend/index.js             app.listen() — do NOT import in tests',
    'backend/week-4/middlewares/        Jest + supertest already working',
    '  tests/02-authmiddleware.spec.js  valid / invalid / missing API key',
    '  tests/01-ratelimitter.spec.js    rate limit 404 after 5 requests',
  ];
  files.forEach(f => console.log('  ' + f));
  console.log('');

  console.log('═'.repeat(65));
  console.log('  Real tests live in: backend/week-4/middlewares/tests/');
  console.log('  Add integration tests in: paytm/backend/tests/ (create it)');
  console.log('═'.repeat(65) + '\n');
}

export default runDemo;

export {
  runDemo,
};
