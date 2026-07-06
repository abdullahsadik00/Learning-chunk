# Phase 0 — Revisit List

A running log of concepts/issues that came up during Phase 0. **We do NOT stop to fix these now** —
the goal is to keep momentum through Day 14. After Phase 0 ends, we review this list and address
only what's still shaky. Anything you've since internalized on your own gets crossed off.

**Legend:** `[ ]` open · `[x]` resolved during Phase 0 · **W** = workflow/habit · **C** = concept

---

## Workflow habits (the Phase 0 main event)

- [x] **W — Run the file before committing.** _(2026-07-06)_ Consistently running every file before
  reporting now — 5 consolidation reps all run-verified before ping. Watch it holds under time pressure.
- [x] **W — A test encodes the SPEC, not your output.** _(2026-07-06)_ Landed hard: 15 spec asserts in
  day-03, throw-test in day-02, off-by-reference negative test in day-05 — all written against the spec,
  not the output. This was the recurring-since-Day-1 issue; now demonstrably internalized.
- [x] **W — Re-read the spec before writing.** _(2026-07-06)_ Day 3 `makeCounter` and `curry` both
  rebuilt to the ACTUAL spec this pass, with spec asserts. Watch it doesn't regress on new material.
- [x] **W — Apply fixes from the previous session before moving on.** _(2026-07-06)_ Day 2 `myFlat`
  paren fixed AND `myReduce` empty+no-init throw + test now done. Full backlog cleared.
- [ ] **W — Missing `return` statements / accidental input mutation.** Came up Day 2 (myMap). Watch for it.

## Concepts to double-check after Phase 0

- [ ] **C — Arrow functions and `this` (lexical binding).** ⚠️ _hint-assisted on Day 3 — needs a cold rep._
  Day 3 `makeCounter`: arrow methods that `return this` don't point at the object — arrow `this` is
  lexical (module scope), not the caller. Know *when* to use a regular function vs an arrow because of `this`.
- [x] **C — General currying (variadic).** _(2026-07-06, cold rep earned.)_ Rebuilt as a real
  `curry(fn)` with a self-recursing `curried(...args)` collector firing on `args.length >= fn.length`;
  all four forms `(1)(2)(3)/(1,2)(3)/(1)(2,3)/(1,2,3)` assert to 6. Was hint-assisted before — now his.
- [x] **C — `reduce` with no initial value.** _(2026-07-06)_ Day 2 `myReduce` now throws `TypeError`
  on empty-array + no-init, seeds from `arr[0]` otherwise, with a try/catch assert proving the throw.
- [ ] **C — Faithful polyfill signatures.** Native callbacks receive `(element, index, array)`.
  myMap/myFilter/myFind/mySome/myEvery now pass all three; `myForEach` STILL passes only the element.
  Small but it's what separates "works" from "correct" — last one to fix.
- [ ] **C — `call`/`apply` via temp-property trick.** _(myCall Symbol version done; was hint-assisted —
  wants one cold rep to confirm it's his, not memorized.)_ `myCall`/`myApply` now both clean with
  Symbol/temp-prop cleanup and spec asserts.

---

## Resolved during Phase 0
_(move items here with `[x]` and a one-line note when you nail them later)_

- [x] **C — `deepClone` recursion (2026-07-06).** Rewritten cold in `day-05/index.js` after seeing the
  full solution — re-earned as a real rep. Array.isArray called correctly this time; added a
  `hasOwnProperty` guard the reference version lacked (unprompted → genuine understanding). Spec
  assert written and passing. deepClone is his.
- [x] **W — Spec-encoding assert (deepClone, 2026-07-06).** First fully self-written spec assert of
  the consolidation pass: mutated the clone, asserted the original held. Habit landing.
