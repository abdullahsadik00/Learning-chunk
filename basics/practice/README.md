# Practice Files

Reading gives you recognition. Writing from memory gives you recall. These files bridge the gap.

## Workflow (do this every time)

1. **Read one section** of the teaching file (`week-3/` or `week-4/`).
2. **Close it**. Open the matching practice file.
3. **Write your answers** — predictions as comments, implementations as code.
4. **Run the file** (`node <file>`) — see ✅ / ❌ and actual output.
5. **Go back only after** you've attempted everything.

## Files

| Practice file | Teaching file | Topic |
|---|---|---|
| `01-hoisting.practice.js` | `week-3/01-hoisting.js` | var / let / const hoisting, TDZ |
| `02-scope-chain.practice.js` | `week-3/02-scope-chain.js` | Scope, lexical scope, IIFE |
| `03-closures.practice.js` | `week-3/03-closures.js` | Closures, var-in-loop, factories |
| `04-this-keyword.practice.js` | `week-3/04-this-keyword.js` | `this`, call/apply/bind, arrows |
| `05-prototypes.practice.js` | `week-3/05-prototypes.js` | Prototype chain, inheritance |
| `06-event-loop.practice.js` | `week-3/06-event-loop.js` | Event loop ordering (hardest predict) |
| `07-promises-async-await.practice.js` | `week-3/07-promises-async-await.js` | Promises, async/await |
| `11-functional-programming.practice.js` | `week-3/11-functional-programming.js` | FP: map/filter/reduce, compose, curry |
| `week4-polyfills.practice.js` | `week-4/0*.js` | Implement polyfills from scratch |

## How to run

```bash
# from this folder
node 01-hoisting.practice.js
node 03-closures.practice.js
# etc.
```

## Exercise types

- **PREDICT** — write your expected output as a comment, then run. The goal is the mental trace, not the comment.
- **IMPLEMENT** — write the function from scratch. Assertions show ✅ / ❌.
- **DEBUG** — broken code, find and fix the bug.

## Scoring yourself

- All ✅ on first try → solid, move on.  
- Mix of ✅ / ❌ → re-read that section, try again tomorrow.  
- All ❌ → do the teaching file again before attempting.
