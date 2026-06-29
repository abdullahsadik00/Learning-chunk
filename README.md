# Learning Chunk: Zero → SDE-2

[![Status](https://img.shields.io/badge/Status-In_Progress-orange)](https://github.com/abdullahsadik00/Learning-chunk)
[![Days](https://img.shields.io/badge/Curriculum-55_Days-blue)](./basics/assessments/README.md)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

A structured SDE learning path from **zero to SDE-2** covering the full stack — JS, TypeScript, React, Next.js, CSS, System Design, Testing, Backend (Node/Express/PostgreSQL/Redis), DSA, Git, and DevOps. Every concept has a runnable teaching file, live demos, practice challenges, and a self-assessment.

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

The curriculum is 55 days split into phases. Follow them in order — each phase builds on the previous one.

```
Phase 0  → JS Refresher (before Day 1)   basics/js-refresher/
Phase 1  → JS Core (Days 1–5)            basics/week-3/, basics/week-4/
Phase 2  → TypeScript (Days 8–11)        basics/typescript/
Phase 3  → React (Days 12–17)            basics/react/ (files 01–11)
Phase 4  → Next.js (Days 18–21)          basics/nextjs/
Phase 5  → System Design (Days 22–25)    basics/react/ (files 12–15) + basics/system-design/
Phase 6  → CSS & Design (Days 26–30)     basics/css-design/
Phase 7  → Testing (Days 31–36)          basics/testing/
Phase 8  → Backend (Days 36–55)          basics/backend/ (files 01–20)
Phase 9  → DSA                           basics/dsa/
Phase 10 → Git & Workflow                basics/git/
```

**After completing Days 1–35** you can work on capstone projects alongside backend days:

```
paytm/   — full-stack Paytm clone (Express + PostgreSQL/Prisma + React)
```

---

## Daily practice log

Track your progress every day. I'll analyze the logs and tell you what to revisit.

```bash
# 1. Copy the template
cp practice/_template.md practice/$(date +%Y-%m-%d).md

# 2. Fill it in after studying (5–10 min)
# 3. Commit it
git add practice/ && git commit -m "practice: day X log"

# 4. Ask for analysis anytime
# Say: "analyze my practice logs"
```

See [`practice/README.md`](./practice/README.md) for details.

---

## Phase-by-phase setup

### Phase 0 — JS Refresher (do this first if you're new to JS or returning after a gap)

```bash
# No setup needed — plain Node.js
node basics/js-refresher/00-modern-javascript.js

# Covers: var/let/const, types, functions, destructuring, arrays,
# classes, async/await, modules, error handling, modern syntax
# Ends with a 15-question self-assessment
```

---

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

### Phase 5 — System Design + Advanced React (Days 22–25)

Teaching files: `basics/react/12-system-design-frontend.tsx` → `15-realtime-frontend.tsx`

```bash
# Read the teaching files first (theory + code)
cd basics/react && npm run dev   # see patterns running

# Interactive system design demos
cd basics/system-design
npm install
npm run dev           # → http://localhost:5173
# Demos: AnalyticsDashboard, ChatApp, ECommerce, TwitterFeed
```

Assessment: [`day-22.md`](./basics/assessments/day-22.md) → [`day-25.md`](./basics/assessments/day-25.md)

---

### Phase 6 — CSS & Design (Days 26–30)

Teaching files first, then run the Vite demos:

```bash
# Teaching files (theory + practice challenges + assessment)
npx ts-node basics/css-design/01-layout.ts        # Day 26: Box model, Flexbox, Grid
npx ts-node basics/css-design/02-responsive.ts    # Day 27: CSS variables, dark mode
npx ts-node basics/css-design/03-architecture.ts  # Day 28: BEM, CSS Modules, Tailwind
npx ts-node basics/css-design/04-tailwind.ts      # Day 29: Tailwind deep dive, cva
npx ts-node basics/css-design/05-design-systems.ts # Day 30: Design tokens, a11y, WCAG

# Live interactive demos
cd basics/css-design && npm install && npm run dev  # → http://localhost:5173
```

Assessment: [`day-26.md`](./basics/assessments/day-26.md) → [`day-30.md`](./basics/assessments/day-30.md)

---

### Phase 7 — Testing (Days 31–36)

```bash
cd basics/testing
npm install
npm test              # Vitest — all tests should pass
npm run test:ui       # Visual Vitest UI in browser
npm run test:coverage # Coverage report
npm run dev           # Start app (needed for Playwright E2E)
npm run test:e2e      # Playwright E2E (requires dev server running)
```

Assessment: [`day-31.md`](./basics/assessments/day-31.md) → [`day-36.md`](./basics/assessments/day-36.md)

---

### Phase 8 — Backend (Days 36–55)

Teaching files in `basics/backend/` — run each with `npx ts-node`:

```bash
cd basics/backend

# Phase 8a — Node.js + Express (Days 36–40)
npx ts-node 01-nodejs-internals.ts   # streams, buffers, EventEmitter, child_process
npx ts-node 02-express-middleware.ts # routing, validation, error handling
npx ts-node 03-rest-api-design.ts    # status codes, pagination, versioning
npx ts-node 04-auth-jwt-oauth.ts     # JWT, bcrypt, OAuth, refresh tokens
npx ts-node 05-production-hardening.ts # Zod, env config, graceful shutdown

# Phase 8b — Databases (Days 41–45)
npx ts-node 06-sql-fundamentals.ts   # JOINs, indexes, transactions, ACID
npx ts-node 07-prisma-orm.ts         # schema, relations, migrations, $transaction
npx ts-node 08-advanced-queries.ts   # N+1, cursor pagination, full-text search
npx ts-node 09-redis-caching.ts      # cache patterns, pub/sub, distributed locks
npx ts-node 10-database-design.ts    # normalization, schema patterns, migrations

# Phase 8c — Real-time + Jobs (Days 46–50)
npx ts-node 11-websockets.ts         # Socket.io, rooms, presence, scaling
npx ts-node 12-sse-realtime.ts       # SSE, long polling, protocol selection
npx ts-node 13-job-queues.ts         # BullMQ, retries, scheduling
npx ts-node 14-email-storage.ts      # Nodemailer, Multer, S3, presigned URLs
npx ts-node 15-api-paradigms.ts      # REST vs GraphQL vs tRPC, OpenAPI

# Phase 8d — DevOps + Observability (Days 51–55)
npx ts-node 16-api-testing.ts        # supertest, contract testing, load testing
npx ts-node 17-docker.ts             # multi-stage builds, docker-compose
npx ts-node 18-cicd.ts               # GitHub Actions, deployment strategies
npx ts-node 19-observability.ts      # Pino, Prometheus, tracing, Sentry
npx ts-node 20-performance.ts        # N+1 fixes, connection pooling, memory leaks
```

Assessment: [`day-36.md`](./basics/assessments/day-36.md) → [`day-55.md`](./basics/assessments/day-55.md)

---

### Phase 9 — DSA (interview prep, no specific day)

```bash
cd basics/dsa
npx ts-node 01-arrays-strings.ts     # Two pointers, sliding window, prefix sums, binary search
npx ts-node 02-trees-graphs.ts       # DFS, BFS, BST, Trie, Union-Find
npx ts-node 03-dynamic-programming.ts # 1D/2D DP, knapsack, LCS, LIS
```

Each file: pattern templates + 3 solved problems per pattern + complexity table + 15 self-assessment questions.

---

### Phase 10 — Git workflow (do this early, revisit often)

```bash
npx ts-node basics/git/01-git-workflow.ts
# Covers: branching strategies, conventional commits, rebase vs merge,
# PR best practices, rescue operations, hooks with husky
```

---

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
│   ├── js-refresher/    # Modern JS fast reference (start here if new to JS)
│   │   └── 00-modern-javascript.js
│   ├── week-3/          # JS Core teaching files (Days 1–5)
│   ├── week-4/          # JS polyfill implementations (Days 6–7)
│   ├── typescript/      # TypeScript mastery (Days 8–11)
│   │   └── 00-setup-and-tooling.ts  ← start here
│   ├── react/           # React deep dive — Vite app (Days 12–25)
│   │   └── 00-setup-and-tooling.tsx ← start here
│   ├── nextjs/          # Next.js App Router (Days 18–21)
│   ├── system-design/   # Frontend system design demos (Days 22–25)
│   ├── css-design/      # CSS + Tailwind + design systems (Days 26–30)
│   │   └── 01-layout.ts, 02-responsive.ts, 03-architecture.ts ...
│   ├── testing/         # Vitest + Playwright (Days 31–36)
│   │   └── 01-unit.ts ... 06-backend-testing.ts
│   ├── backend/         # Node.js → Production (Days 36–55)
│   │   └── 01-nodejs-internals.ts ... 20-performance.ts
│   ├── dsa/             # Data structures & algorithms (interview prep)
│   │   └── 01-arrays-strings.ts, 02-trees-graphs.ts, 03-dynamic-programming.ts
│   ├── git/             # Professional git workflow
│   │   └── 01-git-workflow.ts
│   └── assessments/     # 55 assessment files (one per day)
│
├── practice/            # Daily practice logs (fill in every day)
│   ├── README.md
│   └── _template.md     ← copy this each day
│
├── frontend/            # Standalone mini-projects
├── paytm/               # Full-stack Paytm clone (auth + wallet + transfers)
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
