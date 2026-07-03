# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

A structured SDE learning log tracking progress from JS fundamentals through TypeScript and React. Content is organized into three phases with daily teaching files, polyfill implementations, and end-of-day assessments.

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
npm run typecheck     # tsc --noEmit (type-check without compiling)
npm run all           # run all nine TS files in sequence
```
Individual files: `npm run <key>` where key matches the script name (e.g. `generics`, `guards`, `decorators`).

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

### backend/week-4/middlewares — Express middleware tests
```bash
cd backend/week-4/middlewares
npm test              # jest
```

### paytm/backend — Full-stack Express + MongoDB backend
```bash
cd paytm/backend
# Copy .env.example → .env and fill in MONGO_URI and JWT_SECRET
node index.js
```

---

## Architecture

### Phase 1 — JS Core (Days 1–7, `basics/week-3` and `basics/week-4`)
- `basics/week-3/`: teaching files for hoisting, scope, closures, `this`, prototypes, event loop, promises, ES6+, error handling, memory, FP
- `basics/week-4/`: polyfill implementations (array methods, `bind`/`call`/`apply`, Promise, debounce/throttle, deep clone, EventEmitter, LRU cache, curry, memoize)

### Phase 2 — TypeScript Mastery (Days 8–11, `basics/typescript/`)
Nine files numbered `01`–`09` run in order: fundamentals → type system → functions → generics → utility types → classes/OOP → decorators → type guards → practice.

### Phase 3 — React Deep Dive (Days 12–17, `basics/react/`)
Core curriculum is `.tsx` files `01`–`11` (Days 12–17). Files `12`–`15` extend into the Frontend System Design phase (Days 22–25: system design, React Query advanced, code-splitting, real-time). File `16-typescript-in-react.tsx` (Day 17d) is a bonus capstone re-applying every TypeScript topic from Phase 2 (TS files `01`–`08`) inside real React patterns. Dependencies: React 18, React Router 6, TanStack Query 5, Zustand 4, Immer, Vitest 2, Testing Library.

Challenges live in `basics/react/challenges/` as self-checking Vitest specs (shipped unsolved with type-valid TODO stubs) — the React analog of the ts-node `assert()` challenges under `basics/typescript/challenges/`. Run one with `npm run challenge:16`, or all with `npm run challenge`.

### Assessments (`basics/assessments/`)
One `.md` file per day (day-01 through day-17). Each has 15 questions with acceptance criteria. Scoring: 0–4 re-study, 5–9 progressing, 10–12 solid, 13–15 ready to advance.

### Paytm full-stack project (`paytm/`)
- `paytm/backend/`: Express + Mongoose + JWT + Zod validation. Routes: `/api/v1/user` (auth), `/api/v1/account` (balance/transfer). Requires `.env` with `MONGO_URI` and `JWT_SECRET`.
- `paytm/frontend/`: Vite + React SPA.

### Backend exercises (`backend/week-4/`)
Standalone Express servers demonstrating middleware patterns (rate limiter, auth, request logging). The `middlewares/` sub-folder has Jest tests via supertest.

### Frontend mini-projects (`frontend/`)
Independent Vite apps: `react-hooks/use-memo`, `react-hooks/use-callback`, `3-use-ref`, `tailwind-learning/expense-tracker`, `tailwind-learning/finta_landing_page`. Each has its own `package.json` — run `npm install && npm run dev` inside the project folder.

---

## ESLint setup

Root `.eslintrc.json` covers `.js` files repo-wide with `eslint:recommended` + relaxed rules (`no-unused-vars` warn, `semi` warn, `eqeqeq` warn). Individual sub-projects (React apps, TypeScript) have their own ESLint configs that take precedence.
