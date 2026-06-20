# Learning Chunk: SDE Mastery

[![Status](https://img.shields.io/badge/Status-In_Progress-orange)](https://github.com/abdullahsadik00/Learning-chunk)
[![Days](https://img.shields.io/badge/Curriculum-55_Days-blue)](./basics/assessments/README.md)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

A structured SDE learning log covering the full stack from JS fundamentals through production backend. Every concept has a runnable teaching file, live demos, and a self-assessment.

---

## Prerequisites

Before cloning, make sure you have:

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 20+ | https://nodejs.org |
| npm | 10+ | comes with Node |
| Git | any | https://git-scm.com |
| Docker | any | https://docker.com (only needed for Redis/Postgres days) |

---

## Getting started

```bash
git clone https://github.com/abdullahsadik00/Learning-chunk.git
cd Learning-chunk
npm install          # installs root ESLint only
```

Each sub-project has its own `package.json`. You run `npm install` inside the folder you are working in — not at the root.

---

## Learning flow

The curriculum is 55 days split into 11 phases. Follow them in order — each phase builds on the previous one.

```
Phase 1  → JS Core (Days 1–5)         basics/week-3, basics/week-4
Phase 2  → JS Internals (Days 6–7)    basics/week-4
Phase 3  → TypeScript (Days 8–11)     basics/typescript/
Phase 4  → React (Days 12–17)         basics/react/
Phase 5  → Next.js (Days 18–21)       basics/nextjs/
Phase 6  → System Design (Days 22–25) basics/system-design/
Phase 7  → CSS & Design (Days 26–30)  basics/css-design/
Phase 8  → Testing (Days 31–35)       basics/testing/
Phase 9  → Backend Express (Days 36–40)  backend/express/
Phase 10 → Backend Databases (Days 41–45) backend/database/
Phase 11 → Real-time & Jobs (Days 46–50) backend/realtime/
Phase 12 → Production (Days 51–55)    backend/production/
```

After completing Days 1–35 you can work on the two capstone projects alongside Days 36–55:

```
projects/snippets/   — collaborative code snippet manager (Next.js + Express + PostgreSQL)
projects/logly/      — analytics dashboard (React + Express + Redis + PostgreSQL)
```

---

## Phase-by-phase setup

### Phase 1 & 2 — JS Core + Internals (Days 1–7)

Teaching files live in `basics/week-3/` (Days 1–5) and `basics/week-4/` (Days 6–7).

```bash
# Days 1–5: just read the teaching files — no setup needed
# They are plain .js files you can open directly

# Days 6–7: polyfill implementations
cd basics/week-4
npm install

npm run arrays        # Array polyfills (map, filter, reduce, flat, …)
npm run promises      # Promise polyfills (all, allSettled, race, any)
npm run all           # Run all 7 polyfill files in sequence
```

Assessment: [`basics/assessments/day-01.md`](./basics/assessments/day-01.md) → [`day-07.md`](./basics/assessments/day-07.md)

---

### Phase 3 — TypeScript (Days 8–11)

```bash
cd basics/typescript
npm install

npm run fundamentals  # Day 8 — types, interfaces, type aliases
npm run generics      # Day 9 — generics, constraints, inference
npm run guards        # Day 10 — type guards, narrowing
npm run decorators    # Day 11 — decorators, OOP patterns
npm run all           # Run all 9 files in sequence
npm run typecheck     # tsc --noEmit to verify zero errors
```

Assessment: [`day-08.md`](./basics/assessments/day-08.md) → [`day-11.md`](./basics/assessments/day-11.md)

---

### Phase 4 — React (Days 12–17)

```bash
cd basics/react
npm install
npm run dev           # Vite dev server → http://localhost:5173

# Each .tsx file covers one day of content
# Open the browser — tabs at the top switch between days
npm run check         # TypeScript type-check (zero errors expected)
npm run lint          # ESLint
npm run test          # Vitest unit tests
```

Assessment: [`day-12.md`](./basics/assessments/day-12.md) → [`day-17.md`](./basics/assessments/day-17.md)

---

### Phase 5 — Next.js (Days 18–21)

```bash
cd basics/nextjs
npm install
npm run dev           # → http://localhost:3000
npm run build         # production build (verifies no type/lint errors)
```

Assessment: [`day-18.md`](./basics/assessments/day-18.md) → [`day-21.md`](./basics/assessments/day-21.md)

---

### Phase 6 — Frontend System Design (Days 22–25)

```bash
cd basics/system-design
npm install
npm run dev           # → http://localhost:5173
```

Assessment: [`day-22.md`](./basics/assessments/day-22.md) → [`day-25.md`](./basics/assessments/day-25.md)

---

### Phase 7 — CSS & Design (Days 26–30)

```bash
cd basics/css-design
npm install
npm run dev           # → http://localhost:5173
# Interactive Tailwind CSS demos — flexbox playground, dark mode, design system, etc.
```

Assessment: [`day-26.md`](./basics/assessments/day-26.md) → [`day-30.md`](./basics/assessments/day-30.md)

---

### Phase 8 — Testing (Days 31–35)

```bash
cd basics/testing
npm install
npm test              # Vitest — all tests should pass
npm run test:ui       # Visual Vitest UI in browser
npm run test:coverage # Coverage report
npm run dev           # Start app (needed for Playwright E2E)
npm run test:e2e      # Playwright E2E (requires dev server running)
```

Assessment: [`day-31.md`](./basics/assessments/day-31.md) → [`day-35.md`](./basics/assessments/day-35.md)

---

### Phase 9 — Backend: Node.js & Express (Days 36–40)

```bash
cd backend/express
npm install

npm run day36   # Node.js internals: streams, buffers, EventEmitter, child_process
npm run day37   # Express middleware, routing, error handling
npm run day38   # REST API design, pagination, status codes
npm run day39   # Authentication: JWT, refresh tokens, httpOnly cookies
npm run day40   # Production hardening: Helmet, Zod, CORS, rate limiting
```

Assessment: [`day-36.md`](./basics/assessments/day-36.md) → [`day-40.md`](./basics/assessments/day-40.md)

---

### Phase 10 — Backend: Databases (Days 41–45)

Uses **SQLite** — no external database needed.

```bash
cd backend/database
npm install
npx prisma generate       # generate the Prisma client
npx prisma migrate dev    # run migrations (creates learning.db)

npm run day41   # SQL: SELECT, JOIN, GROUP BY, HAVING, transactions, indexes
npm run day42   # Prisma ORM: schema, relations, migrations, soft delete
npm run day43   # Advanced queries: cursor pagination, aggregations, full-text search
npm run day44   # Redis patterns: cache, rate limit, pub/sub, distributed lock
npm run day45   # Database design: normalization, UUID vs int, money, multi-tenancy
```

> **Day 44 requires Redis.** Start it with:
> ```bash
> docker run -d -p 6379:6379 redis:7-alpine
> ```
> If Redis is unavailable, Day 44 exits gracefully with setup instructions.

Assessment: [`day-41.md`](./basics/assessments/day-41.md) → [`day-45.md`](./basics/assessments/day-45.md)

---

### Phase 11 — Backend: Real-time & Jobs (Days 46–50)

```bash
cd backend/realtime
npm install

npm run day46   # WebSockets: rooms, presence, heartbeat, auth challenge
npm run day47   # SSE: live prices, notifications, job progress streams
npm run day48   # BullMQ: email queue, retries, delayed jobs, cron, progress
npm run day49   # Email (Nodemailer + Ethereal) + file uploads (Multer)
npm run day50   # API patterns: versioning, OpenAPI, GraphQL comparison
```

> **Days 46 & 48 require Redis.**
> ```bash
> docker run -d -p 6379:6379 redis:7-alpine
> ```

For Day 46, run the test client in a second terminal:
```bash
# Terminal 1
cd backend/realtime && npm run day46

# Terminal 2
cd backend/realtime && npx ts-node src/day46-websockets/client.ts
```

Open `http://localhost:3001` to see the Day 47 SSE stock ticker demo in the browser.

Assessment: [`day-46.md`](./basics/assessments/day-46.md) → [`day-50.md`](./basics/assessments/day-50.md)

---

### Phase 12 — Backend: Production Readiness (Days 51–55)

```bash
cd backend/production
npm install

npm test        # Day 51: 16 Supertest API tests (no server needed)
npm run day54   # Day 54: Pino structured logging + health checks + graceful shutdown
npm run day55   # Day 55: N+1 detection, event loop lag, memory leak monitor, caching benchmark
```

Day 52 and 53 are file-based — read the source and run the commands below:
```bash
# Day 52 — Docker
docker compose -f backend/production/src/day52-docker/docker-compose.yml up
# Spins up: API + PostgreSQL + Redis

# Day 53 — CI/CD
# Read: backend/production/src/day53-cicd/github-actions.yml
# Copy to .github/workflows/ci.yml in any project to activate it
```

Assessment: [`day-51.md`](./basics/assessments/day-51.md) → [`day-55.md`](./basics/assessments/day-55.md)

---

## Capstone projects

Two real projects to build after completing the curriculum. Each has a full guide with PR-by-PR breakdown.

### Project 1 — Snippets (collaborative code manager)

**Stack:** Next.js 15 App Router · Express · PostgreSQL · Prisma · Redis · WebSockets

```bash
# Backend
cd projects/snippets/backend
cp .env.example .env          # fill in MONGO_URI and JWT_SECRET
npm install
npx prisma migrate dev
node dist/index.js             # or: npm run dev

# Frontend
cd projects/snippets/frontend
npm install
npm run dev                    # → http://localhost:3000
```

Guide: [`projects/snippets/GUIDE.md`](./projects/snippets/GUIDE.md) — 15-PR breakdown from setup to deploy.

---

### Project 2 — Logly (analytics dashboard)

**Stack:** React + Vite · Express · PostgreSQL · Prisma · Redis · BullMQ · SSE

```bash
# Start Redis and PostgreSQL first
docker run -d -p 6379:6379 redis:7-alpine
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres:16-alpine

# Backend
cd projects/logly/backend
cp .env.example .env          # fill in DATABASE_URL, REDIS_URL, JWT_SECRET
npm install
npx prisma migrate dev
npm run dev                    # → http://localhost:3001

# Frontend
cd projects/logly/frontend
npm install
npm run dev                    # → http://localhost:5173
```

Guide: [`projects/logly/GUIDE.md`](./projects/logly/GUIDE.md) — architecture decisions, data flow, PR breakdown.

---

## Self-assessment system

Every day has a matching file in `basics/assessments/`:

```bash
# How to use
# 1. Complete the teaching file for a day
# 2. Open basics/assessments/day-XX.md
# 3. Answer all 15 questions without looking anything up
# 4. Check against the Acceptance Criteria
# 5. Count your score
```

| Score | Meaning |
|-------|---------|
| 0–4 | Re-study the teaching file |
| 5–9 | Getting there — redo the examples |
| 10–12 | Solid — move on, revisit gaps later |
| 13–15 | Ready to advance |

Full assessment map: [`basics/assessments/README.md`](./basics/assessments/README.md)

---

## Repo structure

```
Learning-chunk/
├── basics/
│   ├── week-3/          # JS Core teaching files (Days 1–5)
│   ├── week-4/          # JS polyfill implementations (Days 6–7)
│   ├── typescript/      # TypeScript exercises (Days 8–11)
│   ├── react/           # React deep dive — Vite app (Days 12–17)
│   ├── nextjs/          # Next.js App Router (Days 18–21)
│   ├── system-design/   # Frontend system design (Days 22–25)
│   ├── css-design/      # Tailwind CSS + design systems (Days 26–30)
│   ├── testing/         # Vitest + Playwright (Days 31–35)
│   └── assessments/     # 55 assessment files (one per day)
│
├── backend/
│   ├── express/         # Node.js + Express (Days 36–40)
│   ├── database/        # SQL + Prisma + Redis (Days 41–45)
│   ├── realtime/        # WebSockets + SSE + BullMQ (Days 46–50)
│   ├── production/      # Supertest + Docker + CI/CD + Logging + Perf (Days 51–55)
│   └── CURRICULUM.md    # Day-by-day backend reference
│
├── projects/
│   ├── snippets/        # Capstone 1: collaborative code manager
│   └── logly/           # Capstone 2: analytics dashboard
│
├── frontend/            # Standalone mini-projects (expense tracker, landing page, etc.)
├── paytm/               # Full-stack Paytm clone (auth + transactions)
├── CLAUDE.md            # Instructions for AI assistant
└── package.json         # Root ESLint only
```

---

## Tech stack

| Layer | Technologies |
|-------|-------------|
| Language | JavaScript (ES2022), TypeScript 5 |
| Frontend | React 18, Next.js 15, Vite 5, Tailwind CSS 3, Zustand, TanStack Query |
| Backend | Node.js 20, Express 4, Prisma 5, Zod |
| Database | PostgreSQL 16, SQLite (learning), Redis 7 |
| Real-time | ws (WebSockets), SSE, BullMQ |
| Testing | Vitest, Testing Library, MSW, Playwright, Supertest |
| DevOps | Docker, docker-compose, GitHub Actions |
| Tooling | ESLint, ts-node, pino |

---

## Common issues

**`Cannot find module` errors**
Run `npm install` inside the specific sub-project folder, not the root.

**Port already in use**
Each sub-project uses port `5173` (Vite) or `3001` (Express). Run only one at a time, or change the port in `vite.config.ts` / server file.

**Redis connection refused (Day 44, 46, 48)**
Start Redis: `docker run -d -p 6379:6379 redis:7-alpine`
Verify: `docker ps` should show the container running.

**Prisma client not found**
Run `npx prisma generate` inside the project that uses Prisma (`backend/database/`, `projects/snippets/backend/`, `projects/logly/backend/`).

**TypeScript errors**
Run `npm run typecheck` or `tsc --noEmit` inside the folder. Do not run `tsc` at the root — each sub-project has its own `tsconfig.json`.

---

*Built by [Sadik Shaikh](https://github.com/abdullahsadik00)*
