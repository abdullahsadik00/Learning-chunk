# Job-Readiness Plan — Full-Stack (Logly-First)

**Goal:** Become a credible, hireable full-stack developer, with **Logly deployed and live** as
the centerpiece of the resume.

**Your constraints:** Logly first → Snippets second · 5+ hrs/day.

**Your honest starting point (2026-07):** ~70-80% of JS and ~50-60% of TS *understood* via
assessments and practice — but **no code written yet.** That's the single most important fact in
this plan. Assessments test *recognition*; they don't test *production*. So before anything else,
you convert knowledge into skill.

**The one principle that drives everything — LEARN BY SHIPPING (and STOP READING, START TYPING):**
> Never study a topic then look for somewhere to use it. Rebuild it **from a blank file**, then
> build the Logly feature that needs it. If you can't rebuild it without looking, you don't know
> it yet — that's the signal to practice, not to move on.

**⚠ Resume integrity note:** The resume describes Logly/Snippets as built. They aren't yet. **Do
not send the resume anywhere until Logly is actually deployed (Phase 3).** The plan gets you there.

**Daily split:** ~4 hrs Main Track (learn + build) + ~1 hr DSA Track (starts Week 2).
Take each `basics/assessments/day-XX.md` quiz and score **10+/15 before advancing** — but the real
bar now is: **can you write the code from scratch?**

---

## PHASE 0 · Weeks 1-3 — Reading → Writing (the bridge you're missing)

You have the knowledge. This phase turns it into the ability to produce code under a blank cursor.
**This is not optional and it is not a step backward — it's the step that makes every later phase real.**

- **Weeks 1-2 (JS + TS by hand):** follow `practice/phase-0/DAY-BY-DAY.md` and
  `practice/phase-0/EXERCISES.md`. Rebuild every JS polyfill from scratch, build 1-2 tiny apps from
  nothing, then re-do TypeScript *by coding it* and solve the `basics/typescript/challenges/` stubs.
- **Week 3 (close the TS gap + consolidate):** finish the 40-50% of TS you haven't internalized —
  by writing it, not reading — and redo anything from Weeks 1-2 you still needed to peek at.

**Exit bar for Phase 0 (be honest with yourself):** you can open a blank file and write `myReduce`,
`debounce`, a `MyPromise`, and a small generic typed store *without looking anything up*. When you
hit that, ping me — I'll review your code and confirm you're ready for Phase 1.

---

## MAIN TRACK — Phased Sequence

### Phase 1 · Weeks 4-5 — Finish React + build the Logly frontend shell
**Study:** `basics/react/` files `03 → 11` (hooks → context/reducer → internals → patterns →
state mgmt/Zustand → performance → testing intro → practice). Rebuild each from a blank file.
**Build in Logly:** dashboard shell + Design System primitives, the `ExplorationState` object +
URL codec, TanStack Query setup, Zustand for client state.
**Output:** React fluency + a clickable Logly frontend skeleton (mock data is fine here).

### Phase 2 · Weeks 6-8 — Backend core + Logly ingestion pipeline
**Study (core):** `basics/backend/` `01 → 05` (Node internals, Express, REST, auth/JWT, hardening)
→ build Logly auth, projects/teams API, and the **collector endpoint**.
**Study (data):** `basics/backend/` `06 → 10` (SQL, Prisma, Redis, advanced queries, DB design)
→ build the partitioned `events` schema, Redis buffer, **background worker**, the **daily-salted
visitor_hash** privacy model, and `daily_stats` rollups.
**Output:** working end-to-end ingestion — script → collector → Redis → worker → Postgres → dashboard.
*(This is the hardest, most impressive phase and the bulk of your TALKING-POINTS.md. Don't rush it.)*

### Phase 3 · Weeks 9-10 — Real-time, finish MVP, **DEPLOY**
**Study:** `basics/backend/` `11 → 13` (WebSockets, SSE, job queues/BullMQ); skim
`basics/system-design/` `22 → 25` as validation.
**Build in Logly:** SSE realtime (Redis pub/sub), alerts worker.
**DEPLOY LOGLY** → Fly.io (backend) · Vercel (frontend) · Neon (Postgres) · Upstash (Redis).
**Output (the milestone that de-risks the whole resume):** **Logly is live.** Replace the
placeholder demo URL in the resume with the real one. *Now* the resume can go out.

### Phase 4 · Week 11 — Testing
**Study:** `basics/testing/` `31 → 35` (Vitest, Testing Library, MSW, Playwright).
**Build in Logly:** test suite — the decision engine (pure → trivial to test), API routes, the
rollup reconciliation check, a Playwright happy-path E2E.
**Output:** you can honestly say "tested" and defend testing questions.

### Phase 5 · Weeks 12-14 — Snippets (Next.js) + **START APPLYING**
**Study:** `basics/nextjs/` `18 → 21` (App Router, SSR, RSC, deployment).
**Build & deploy Snippets** (Next.js 15 + the stack you now know from Logly).
**⚑ Start applying at the START of Week 12** — 1 deployed project + backend depth + testing + DSA
fundamentals is already a strong application. Snippets lands as project #2 while you interview.

---

## DSA TRACK — Bare Minimum (parallel, ~1 hr/day, starts Week 2, ~5-6 weeks)

**Goal: never freeze on a fundamentals question. NOT competitive-programming mastery.**
Target: **~40-50 easy + ~10 medium total.** Not 500. Files in `basics/dsa/`.

| When | Topic | Practice | Repo file |
|------|-------|----------|-----------|
| Wk 2 | **Big-O** + arrays/strings: two pointers, sliding window, frequency map, prefix sum | ~10 easy | `01-arrays-strings.ts` |
| Wk 3 | **Hash maps/sets:** two-sum, anagrams, dedupe, group-by-key | ~10 easy | `01` |
| Wk 4 | **Stacks/queues** + strings: valid parentheses, basic monotonic stack | ~8 easy | `01` |
| Wk 5 | **Recursion + trees only:** DFS/BFS, depth, invert, level-order | ~8 easy + 3 med | `02-trees-graphs.ts` (trees) |
| Wk 6 | **Light grid BFS/DFS** + review | ~5 mixed | `02` |

**Explicitly SKIP:** dynamic programming (`03-dynamic-programming.ts`), advanced graphs
(Dijkstra/union-find/topo-sort), backtracking, greedy proofs. Revisit only if targeting FAANG.
**DSA bar:** solve a random easy array/string/hash-map problem in **< 15 min** and explain its Big-O.

---

## Defer or Do Lightly (don't rabbit-hole)

- **DevOps `basics/backend/16-20`:** light pass on Docker (`17`) + GitHub Actions (`18`) — needed
  to deploy. **Defer** observability (`19`) + perf (`20`).
- **CSS `basics/css-design/26-30`:** you already do CSS professionally — skim Tailwind + tokens.
- **API paradigms/email/storage (`14-15`), Paytm capstone:** optional; Logly + Snippets prove the stack.

---

## Milestones at a Glance

| By end of… | You have |
|------------|----------|
| **Week 3** | **You can write JS + TS from a blank file** (the real unlock) ⭐ |
| Week 5 | React solid + Logly frontend skeleton |
| Week 8 | Logly ingestion pipeline working locally (the senior-signal work) |
| **Week 10** | **Logly DEPLOYED — real demo URL, resume goes out** ⭐ |
| Week 11 | Logly tested |
| Week 12 | **Start applying** |
| Week 14 | Snippets deployed as project #2 |

**Bottom line:** ~14 weeks (≈3.5 months) at 5 hrs/day, *honestly* accounting for the fact that you
start by learning to write code — not pretending you already can. Rehearse
`projects/logly/TALKING-POINTS.md` before interviews. One deployed, defensible project + real
breadth + basic DSA is what gets the offer.
