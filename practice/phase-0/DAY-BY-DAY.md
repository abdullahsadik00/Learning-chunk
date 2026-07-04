# Phase 0 — First Two Weeks, Day by Day

**The whole point of these two weeks:** stop reading, start typing. Turn "I understand it" into
"I can write it from a blank file." Do the exercises in `EXERCISES.md` — this file is your schedule.

## The 5 rules (read once, then live by them)

1. **Blank file first.** Do NOT open the teaching file. Open an empty file and write from memory.
2. **Peek budget: 20 minutes.** Stuck for 20 min? Peek at the concept (not a full solution),
   close it, then rewrite from scratch with nothing open.
3. **Run everything.** Every file must actually execute (`node file.js` / `npx tsx file.ts`).
   Code that only "looks right" doesn't count.
4. **Self-check against the test cases** given in `EXERCISES.md`. If output ≠ expected, debug it
   yourself — that debugging *is* the skill.
5. **Log honestly.** In each day's folder, keep a `NOTES.md`: what you nailed cold, what needed a
   peek, what broke. This is what I'll analyze — honesty here is worth more than a clean score.

## Setup (once)

```bash
cd practice/phase-0
npm init -y
npm i -D tsx typescript          # tsx runs .ts files directly
# make a folder per day as you go: day-01, day-02, ...
```
Run JS: `node day-01/array-utils.js` · Run TS: `npx tsx day-08/typed-utils.ts`

---

## WEEK 1 — JavaScript from a blank file

| Day | Theme | You write (see EXERCISES.md) | Done when |
|-----|-------|------------------------------|-----------|
| **1** | Warm-up: loops & logic | `array-utils.js` — sum, max, average, reverse, countOccurrences, isPalindrome, fizzbuzz, range | All pass the given cases; blank-file terror gone |
| **2** | Array polyfills | `array-polyfills.js` — myForEach, myMap, myFilter, myReduce, myFind, mySome, myEvery, myFlat | Each matches the native method's behavior |
| **3** | Functions · `this` · closures | `functions.js` — myBind, myCall, myApply, makeCounter, once, memoize, curry | `this` binding + closures work without peeking |
| **4** | Async & Promises | `async.js` — sleep, promisify, retry, MyPromise (resolve/reject/then), myPromiseAll | MyPromise chains; myPromiseAll resolves in order |
| **5** | Real-world utilities | `utils.js` — debounce, throttle, deepClone, EventEmitter | debounce/throttle timing correct; deepClone handles nesting |
| **6** | Build from nothing #1 | `todo-cli/` — a Node CLI todo (add/list/done/delete + persist to JSON) | Runs end-to-end from the terminal |
| **7** | Consolidate | Redo (blank file) every polyfill you peeked at on days 2-5 | You can write all of them cold; update NOTES.md |

---

## WEEK 2 — TypeScript by coding

| Day | Theme | You write (see EXERCISES.md) | Done when |
|-----|-------|------------------------------|-----------|
| **8** | TS fundamentals | `typed-utils.ts` — type your Day 1-2 functions; interfaces, unions, narrowing | `npx tsc --noEmit` clean; no `any` |
| **9** | Generics | `generics.ts` — generic identity, generic myMap/myFilter/myReduce, constraints, keyof | Generic polyfills keep exact element types |
| **10** | Utility types + challenges | `utility-types.ts`; solve `basics/typescript/challenges/c01`, `c02` | Challenges' `assert()`s pass |
| **11** | Type guards · discriminated unions | `guards.ts` — a typed reducer w/ union actions; solve `c03`, `c04` | Exhaustiveness check compiles; challenges pass |
| **12** | Classes / OOP | `classes.ts` — generic `Stack<T>`, a typed EventEmitter; solve `c05`, `c06` | Typed, no `any`; challenges pass |
| **13** | Finish challenges | Solve `c07`, `c08`; `todo-store.ts` (typed todo state) | All 8 challenges green |
| **14** | Capstone mini | `data-store.ts` — a generic in-memory store: `createStore<T>` w/ add/get/update/remove/query | Fully generic + typed; then ping me for review |

---

## When you finish (or hit a wall)

Tell me **"Phase 0 done, review my code"** (or "review week 1"). I'll read every file in
`practice/phase-0/`, run what I can, and write an honest analysis into `.progress/journal.json`:
what's solid, what's shaky, whether your `this`/closures/async/generics are real or memorized, and
whether you're cleared for Phase 1. No grade inflation — the goal is truth, so you know exactly
where you stand.
