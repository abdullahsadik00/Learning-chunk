# Phase 0 — Revisit List

A running log of concepts/issues that came up during Phase 0. **We do NOT stop to fix these now** —
the goal is to keep momentum through Day 14. After Phase 0 ends, we review this list and address
only what's still shaky. Anything you've since internalized on your own gets crossed off.

**Legend:** `[ ]` open · `[x]` resolved during Phase 0 · **W** = workflow/habit · **C** = concept

---

## Workflow habits (the Phase 0 main event)

- [ ] **W — Run the file before committing.** Day 3 was committed with a `SyntaxError` (duplicate
  `let x`) — it never ran. A committed file that throws looks done in git but is broken.
- [ ] **W — A test encodes the SPEC, not your output.** Recurring since Day 1. Write `console.assert`
  against the examples in EXERCISES.md *before* trusting the code. Day 3 had zero asserts.
- [ ] **W — Re-read the spec before writing.** Day 3 `makeCounter` and `curry` were solved from a
  half-remembered pattern instead of what the exercise actually specified.
- [ ] **W — Apply fixes from the previous session before moving on.** Day 2 fixes (myFlat, myReduce)
  were left unapplied while Day 3 was started.
- [ ] **W — Missing `return` statements / accidental input mutation.** Came up Day 2 (myMap). Watch for it.

## Concepts to double-check after Phase 0

- [ ] **C — Arrow functions and `this` (lexical binding).** ⚠️ _hint-assisted on Day 3 — needs a cold rep._
  Day 3 `makeCounter`: arrow methods that `return this` don't point at the object — arrow `this` is
  lexical (module scope), not the caller. Know *when* to use a regular function vs an arrow because of `this`.
- [ ] **C — General currying (variadic).** ⚠️ _hint-assisted on Day 3 — needs a cold rep._
  A real `curry(fn)` collects args across calls and fires `fn` once `collected.length >= fn.length`.
  Not a fixed chain of single-arg functions.
- [ ] **C — `reduce` with no initial value.** The empty-array + no-init case must `throw TypeError`;
  first element seeds the accumulator otherwise. (Day 2 boss — throw still not implemented.)
- [ ] **C — Faithful polyfill signatures.** Native callbacks receive `(element, index, array)`;
  myForEach only passed the element. Small but it's what separates "works" from "correct".
- [ ] **C — `call`/`apply` via temp-property trick.** ⚠️ _hint-assisted on Day 3 (myCall) — needs a cold rep._
  `myCall` left `obj.func` attached; `myApply` cleaned it up. Be consistent — and know the real spec
  uses a `Symbol` key to avoid clobbering an existing property.

---

## Resolved during Phase 0
_(move items here with `[x]` and a one-line note when you nail them later)_
