# Learning Roadmap & Honest Skill Assessment

_Prepared 2026-07-13. Grounded in your `Learning-chunk` repo (JOB-READINESS-PLAN.md, .progress/journal.json, practice/phase-0, basics/, backend/) and the Logly + Snippets projects._

---

## 1. Honest Level Snapshot

The single most important fact, taken straight from your own `JOB-READINESS-PLAN.md`:

> "~70–80% of JS and ~50–60% of TS understood via assessments and practice — but no code written yet... Assessments test recognition; they don't test production."

You have **read the whole SDE-2 map. You have not yet built most of it.** That's not a criticism — it's the exact gap this roadmap closes. Recruiters and interviewers test what you can *build and explain under pressure*, so the plan is: convert recognition → production.

### Genuine strengths (proven by your own hand-written code)
- **Core JS fundamentals** — clean, idiomatic. Day-1 review: "7/8 correct, closures/composition instincts already present."
- **Polyfills from scratch, cold** — `map/filter/reduce/flat`, `call/apply/bind`, `once/memoize/curry`, `debounce/throttle`, `deepClone`, `EventEmitter`, LRU. This is real depth most juniors fake.
- **TypeScript fundamentals** — Day 8 closed clean: `tsc --noEmit` passing, zero `any`, discriminated unions + narrowing understood.
- **`this` / bind mechanics, async primitives** (`promisify`, `retry`, a hand-rolled `MyPromise`).
- **2+ years real enterprise experience** (NetSuite/SuiteScript, multi-tenant SaaS) — a genuine differentiator for backend/SaaS roles that you currently under-use.

### Started but shallow (recognition, not production)
- TypeScript **generics, utility types, guards, generic classes** — curriculum + challenge stubs exist, not yet attempted (practice stops at Day 8 of a 14-day Phase 0).
- **React / Next.js / frontend system design / CSS / testing** — rich teaching material, no owner-written practice yet.
- **Backend (Node/Express/Prisma/Redis/DevOps)** — broad curriculum on paper (Days 36–55), but not yet built by hand beyond older tutorial-level Express middleware.

### Real gaps for SDE-1 / SDE-2
- **DSA beyond arrays/strings** — this is the honest weak spot (matches your self-assessment). Hash maps, recursion, trees, stacks/queues, binary search: essentially unpracticed. No problem log.
- **No deployed project.** Logly and Snippets are strong *architectural scaffolds*, not shipped apps. Your own note: "The resume describes Logly/Snippets as built. They aren't yet. Do not send the resume anywhere until Logly is actually deployed."
- **Engineering discipline** — your journal documents a real turnaround (confirmed 2026-07-06): from committing code that didn't run / deleting failing tests, to running everything and keeping assertions. Keep that habit; it's what separates junior from mid.

### One-line level read
| Track | Today | With ~10–14 focused weeks |
|---|---|---|
| DSA | Fresher (arrays/strings only) | SDE-1 "never freeze on fundamentals" bar |
| Backend | Strong-fundamentals junior, not yet built | Junior→mid, once Logly ships |
| Full-Stack | Strong JS/TS base, no shipped app | Solid junior with 2 real projects |

---

## 2. Structured Roadmap

This aligns with your existing 14-week `JOB-READINESS-PLAN.md` (ship-first, ~5 hrs/day) but re-sequences it around the job switch. Two tracks run **in parallel**: build/ship (mornings) and DSA + interview prep (evenings).

### Guiding principles (yours, kept)
- **Learn by shipping. Stop reading, start typing.** If you can't rebuild it without looking, you don't know it yet.
- **Resume integrity:** don't claim "deployed/production" until it's true. (Your two resumes are already written to the truthful line — keep them there.)

### Phase A — Foundations you can't skip (Weeks 1–3, parallel)
- **Build track:** finish Phase 0 (Days 9–14) — TS generics/utility types/guards + the `MyPromise` capstone. Then start React by rebuilding, not reading.
- **DSA track:** Arrays → Strings → Hash Maps → Recursion (this engagement, Task 3). Target: solve a random easy array/string/hashmap problem in <15 min and explain its Big-O.
- **Milestone:** 20–25 easy problems logged; Phase 0 closed.

### Phase B — Ship Logly (Weeks 4–9)
- Build Logly **for real** end-to-end: frontend (React 18) → backend ingestion (Redis buffer + worker) → dashboards (rollups) → SSE real-time.
- Add the missing production harness: committed Prisma migrations, a few tests, Dockerfile, CI (GitHub Actions), then **deploy** (Fly.io/Railway + Vercel + Neon/Upstash).
- **DSA track:** light trees (DFS/BFS/level-order), stacks/queues, binary search application. Add ~15 more easy + ~10 medium.
- **Milestone:** Logly live at a public URL. Now the resume line "personal project" becomes "deployed personal project" — and you update the wording.

### Phase C — Machine coding + second project (Weeks 10–12)
- Machine-coding reps (Task 4/5): frontend components + backend API design under time.
- Build/ship Snippets (or a scoped version) as the second portfolio piece.
- **DSA track:** consolidate; spaced repetition of everything so far.

### Phase D — Apply (Week 12+)
- Start applying (LinkedIn like Altaf, referrals, product companies in Pune).
- Interview loop prep: JS/TS theory, React practical, backend/system design (Logly's ADRs are your ammunition), the light-DSA round.

### DSA scope (deliberately bounded — this is correct)
- **In:** arrays, strings, hash maps/sets, two pointers, sliding window, prefix sum, recursion, basic trees (DFS/BFS), stacks/queues, binary search. ~40–50 easy + ~10 medium total.
- **Out (for now):** dynamic programming, advanced graphs (Dijkstra/union-find/topo-sort), backtracking, greedy, heaps. Add these only if targeting FAANG-tier SDE-2.
- **Goal:** never freeze on a fundamentals question — NOT competitive-programming mastery.

---

## 3. Interview-Readiness Checklists

### Backend track
- [ ] Explain REST design, status codes, idempotency (you have real material: Logly's 204 collector, idempotent rollups)
- [ ] PostgreSQL: indexing, transactions, N+1, when to denormalize, full-text search
- [ ] Redis: cache-aside, rate limiting, pub/sub, distributed locks (all in Logly/Snippets)
- [ ] Auth: JWT access + refresh, bcrypt, httpOnly cookies vs bearer trade-offs
- [ ] Async: queues (BullMQ), background workers, retries, SSE vs WebSockets
- [ ] System design (junior): design a URL shortener / rate limiter / analytics ingestion — **Logly already answers the last one**
- [ ] DSA: arrays/strings/hashmap/recursion in <20 min, explain Big-O
- [ ] Node internals: event loop, streams (light)

### Full-stack track
- [ ] Everything above at lighter backend depth, plus:
- [ ] React: hooks, re-renders, useMemo/useCallback, keys, lifting state, custom hooks
- [ ] State management: server state (TanStack Query) vs client state (Zustand) — you have the exact argument from Logly
- [ ] Machine coding: build a component live (todo, star rating, infinite scroll, autocomplete)
- [ ] JS theory: closures, `this`, event loop, promises, debounce/throttle (your polyfills = instant credibility)
- [ ] One end-to-end deployed app you can demo and walk through

---

## 4. What to do this week
1. Both resumes are written (`resume-backend`, `resume-fullstack`) — review them, fix any personal detail, but **don't send until Logly is deployed.**
2. Start DSA Arrays (we begin now, Task 3).
3. In parallel, resume Phase 0 Day 9 (TS generics) on the build track.
