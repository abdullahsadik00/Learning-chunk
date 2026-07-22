# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

A structured SDE learning log tracking a 55-day path from JS fundamentals through TypeScript, React, Next.js, frontend system design, CSS, testing, and backend (Node/Express/Prisma/Redis/DevOps), with DSA and Git tracks alongside. Content is organized as daily teaching files, polyfill implementations, self-checking challenges, and end-of-day assessments.

The `## Architecture` section below documents the phases most commonly worked in (JS core, TypeScript, React, Paytm). The remaining curriculum tracks live under `basics/` (`nextjs/`, `system-design/`, `css-design/`, `testing/`, `backend/`, `dsa/`, `git/`) — see the root `README.md` roadmap table for the full day-by-day map.

---

## Commands

### Root (ESLint only)
```bash
npm run lint          # lint all .js files in the repo
```
The pre-push hook runs `npm run lint` automatically before every push.

### basics/week-4 — JS polyfills (Node.js)
```bash
cd basics/week-4
npm run arrays        # run 01-array-polyfills.js
npm run promises      # run 03-promise-polyfills.js
npm run all           # run all seven polyfill files in sequence
```

### basics/typescript — TypeScript exercises
```bash
cd basics/typescript
npm run fundamentals  # npx ts-node 01-fundamentals.ts
npm run typecheck     # tsc --noEmit (teaching files only; challenges/ are excluded)
npm run all           # run all nine TS files in sequence
npm run challenge:01  # ts-node --transpile-only challenges/c01-fundamentals.ts
npm run challenge:all # run all eight challenge files in sequence
```
Individual files: `npm run <key>` where key matches the script name (e.g. `generics`, `guards`, `decorators`).
Challenges (`challenges/c01`–`c08`) ship unsolved with type-valid TODO stubs and self-check via runtime `assert()`; they run with `--transpile-only` (no type-check) and are excluded from `npm run typecheck`.

### basics/react — React curriculum (Vite + Vitest)
```bash
cd basics/react
npm run dev           # Vite dev server at localhost:5173
npm run check         # tsc --noEmit
npm run lint          # eslint on .ts/.tsx
npm test              # vitest run — all specs (incl. challenges)
npm run challenge:16  # run the TypeScript-in-React challenge (Vitest)
npm run challenge     # run all challenges under challenges/
```
`.tsx` files cannot run with `ts-node` — they require the Vite bundler.

### basics/backend — Backend curriculum (Node/Express/DB/DevOps)
```bash
cd basics/backend
npm run typecheck     # tsc --noEmit (teaching files 01–20; challenges/ are excluded)
npm run challenge:01  # ts-node --transpile-only challenges/c01-nodejs-internals.ts
npm run challenge:all # run all twenty challenge files in sequence
```
Teaching files `01`–`20` use top-level `await`, so the track's `tsconfig.json` is `module: ES2022`.
Challenges run as CommonJS via their own `challenges/tsconfig.json` (`--project`), because ts-node
executes them in a CJS context. Challenges (`challenges/c01`–`c20`) ship unsolved with type-valid
TODO stubs and self-check via runtime `assert()` (PASS/FAIL, non-zero exit on failure); they are the
pure-logic kernel of each infra-heavy day, so they need no Redis/Postgres/Docker to run.

### backend/week-4/middlewares — Express middleware tests
```bash
cd backend/week-4/middlewares
npm test              # jest
```

### paytm/backend — Full-stack Express + PostgreSQL (Prisma) backend
```bash
cd paytm/backend
# Copy .env.example → .env and fill in DATABASE_URL and JWT_SECRET
npx prisma migrate dev   # apply schema to the PostgreSQL database
node index.js
```

---

## Architecture

### Phase 1 — JS Core (Days 1–7, `basics/week-3` and `basics/week-4`)
- `basics/week-3/`: teaching files for hoisting, scope, closures, `this`, prototypes, event loop, promises, ES6+, error handling, memory, FP
- `basics/week-4/`: polyfill implementations (array methods, `bind`/`call`/`apply`, Promise, debounce/throttle, deep clone, EventEmitter, LRU cache, curry, memoize)

### Phase 2 — TypeScript Mastery (Days 8–11, `basics/typescript/`)
Nine files numbered `01`–`09` run in order: fundamentals → type system → functions → generics → utility types → classes/OOP → decorators → type guards → practice. The `challenges/` sub-folder holds eight matching self-checking exercises (`c01`–`c08`) run via `npm run challenge:0N`.

### Phase 3 — React Deep Dive (Days 12–17, `basics/react/`)
Core curriculum is `.tsx` files `01`–`11` (Days 12–17). Files `12`–`15` extend into the Frontend System Design phase (Days 22–25: system design, React Query advanced, code-splitting, real-time). File `16-typescript-in-react.tsx` (Day 17d) is a bonus capstone re-applying every TypeScript topic from Phase 2 (TS files `01`–`08`) inside real React patterns. Dependencies: React 18, React Router 6, TanStack Query 5, Zustand 4, Immer, Vitest 2, Testing Library.

Challenges live in `basics/react/challenges/` as self-checking Vitest specs (shipped unsolved with type-valid TODO stubs) — the React analog of the ts-node `assert()` challenges under `basics/typescript/challenges/`. Run one with `npm run challenge:16`, or all with `npm run challenge`.

### Assessments (`basics/assessments/`)
One `.md` file per day (day-01 through day-55, spanning JS → TypeScript → React → Next.js → System Design → CSS → Testing → Backend), plus the bonus `day-17d-typescript-in-react.md` capstone. Each has 15 questions with acceptance criteria. Scoring: 0–4 re-study, 5–9 progressing, 10–12 solid, 13–15 ready to advance. See `basics/assessments/README.md` for the full day-by-day map and certification milestones.

### Paytm full-stack project (`paytm/`)
- `paytm/backend/`: Express + Prisma (PostgreSQL) + JWT + Zod validation. Routes: `/api/v1/user` (auth), `/api/v1/account` (balance/transfer). Requires `.env` with `DATABASE_URL` and `JWT_SECRET`; run `npx prisma migrate dev` before first start.
- `paytm/frontend/`: Vite + React SPA.

### Backend exercises (`backend/week-4/`)
Standalone Express servers demonstrating middleware patterns (rate limiter, auth, request logging). The `middlewares/` sub-folder has Jest tests via supertest.

### Frontend mini-projects (`frontend/`)
Independent Vite apps: `react-hooks/use-memo`, `react-hooks/use-callback`, `3-use-ref`, `tailwind-learning/expense-tracker`, `tailwind-learning/finta_landing_page`. Each has its own `package.json` — run `npm install && npm run dev` inside the project folder.

---

## ESLint setup

Root `.eslintrc.json` covers `.js` files repo-wide with `eslint:recommended` + relaxed rules (`no-unused-vars` warn, `semi` warn, `eqeqeq` warn). Individual sub-projects (React apps, TypeScript) have their own ESLint configs that take precedence.
