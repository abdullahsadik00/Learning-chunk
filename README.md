# Learning Chunk: Zero → SDE-2

[![Stars](https://img.shields.io/github/stars/abdullahsadik00/Learning-chunk?style=social)](https://github.com/abdullahsadik00/Learning-chunk/stargazers)
[![Forks](https://img.shields.io/github/forks/abdullahsadik00/Learning-chunk?style=social)](https://github.com/abdullahsadik00/Learning-chunk/network/members)
[![Last Commit](https://img.shields.io/github/last-commit/abdullahsadik00/Learning-chunk)](https://github.com/abdullahsadik00/Learning-chunk/commits/main)
[![CI](https://github.com/abdullahsadik00/Learning-chunk/actions/workflows/lint.yml/badge.svg)](https://github.com/abdullahsadik00/Learning-chunk/actions/workflows/lint.yml)
[![Days](https://img.shields.io/badge/Curriculum-55_Days-blue)](./basics/assessments/README.md)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

A structured SDE learning path from **zero to SDE-2** covering the full stack — JS, TypeScript, React, Next.js, CSS, System Design, Testing, Backend (Node/Express/PostgreSQL/Redis), DSA, Git, and DevOps. Every concept has a runnable teaching file, live demos, practice challenges, and a self-assessment.

> **Fork this repo, follow the 55-day plan, and track your own journey to SDE-2.**
> Every day has a teaching file, a runnable demo, and a 15-question self-assessment.

**[⭐ Star it](https://github.com/abdullahsadik00/Learning-chunk)** if it's useful · **[Fork it](https://github.com/abdullahsadik00/Learning-chunk/fork)** to follow the same path yourself

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

## 55-Day Roadmap

> Follow phases in order — each builds on the last.
> Fork the repo and check off days as you go.

| Day(s) | Phase | Topic | Folder | Key Concepts |
|--------|-------|-------|--------|--------------|
| Pre | 0 | JS Refresher | `basics/js-refresher/` | var/let/const, async/await, ES modules |
| 1–5 | 1 | JS Core | `basics/week-3/` | Closures, `this`, prototypes, event loop |
| 6–7 | 1 | JS Polyfills | `basics/week-4/` | map/filter/reduce, Promise.all, debounce |
| 8–11 | 2 | TypeScript | `basics/typescript/` | Types, generics, decorators, OOP |
| 12–17 | 3 | React | `basics/react/` | Hooks, state mgmt, Zustand, TanStack Query |
| 18–21 | 4 | Next.js | `basics/nextjs/` | App Router, SSR, RSC, deployment |
| 22–25 | 5 | System Design | `basics/system-design/` | Frontend architecture, realtime patterns |
| 26–30 | 6 | CSS & Design | `basics/css-design/` | Flexbox, Grid, Tailwind, design tokens |
| 31–35 | 7 | Testing | `basics/testing/` | Vitest, Testing Library, MSW, Playwright |
| 36–40 | 8a | Backend Core | `basics/backend/` (01–05) | Express, auth, JWT, Zod, prod hardening |
| 41–45 | 8b | Databases | `basics/backend/` (06–10) | SQL, Prisma, Redis, caching |
| 46–50 | 8c | Real-time & Jobs | `basics/backend/` (11–15) | WebSockets, SSE, BullMQ, S3 |
| 51–55 | 8d | DevOps | `basics/backend/` (16–20) | Docker, GitHub Actions, Prometheus, perf |
| Anytime | 9 | DSA | `basics/dsa/` | Two pointers, DP, trees/graphs |
| Anytime | 10 | Git Workflow | `basics/git/` | Branching, rebasing, conventional commits |

**Capstone:** After Day 35, build the [Paytm clone](./paytm/) alongside backend days — full-stack Express + PostgreSQL + React.

---

## How to Use This Repo

### Following the curriculum yourself

1. **[Fork this repo](https://github.com/abdullahsadik00/Learning-chunk/fork)** — click Fork or use that link
2. Clone your fork locally
3. Work through each day's teaching file → run it → take the assessment in `basics/assessments/day-XX.md`
4. Score 10+/15 on the assessment before moving to the next day
5. Log your practice: `cp practice/_template.md practice/$(date +%Y-%m-%d).md`

### Suggesting improvements

See [CONTRIBUTING.md](./CONTRIBUTING.md). Most useful contributions: typo fixes, broken command corrections, additional practice problems.

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

## Learners Using This Curriculum

Following this in your own fork? Add yourself here via a PR — it signals to the next person that the path works.

| GitHub | Started | Notes |
|--------|---------|-------|
| [@abdullahsadik00](https://github.com/abdullahsadik00) | Jun 2025 | Original author |
| _your name here_ | | [open a PR →](https://github.com/abdullahsadik00/Learning-chunk/compare) |

---

> **GitHub topics on this repo:** `javascript` `typescript` `react` `nodejs` `learning-path` `sde` `interview-prep` `full-stack` `roadmap` `web-development`
> _(Add these in Settings → Topics on the repo page — this is how people discover repos via GitHub Explore)_

---

*Built by [Sadik Shaikh](https://github.com/abdullahsadik00)*
