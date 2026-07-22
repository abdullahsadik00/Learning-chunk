// ═══════════════════════════════════════════════════════════
// CHALLENGE C02: EXPRESS MIDDLEWARE  (Day 37)
// Run: npm run challenge:02  |  Time target: 25–35 min
// ═══════════════════════════════════════════════════════════
// PROJECT: Build the middleware engine that sits under Express —
//          a composable chain with `next()`, short-circuiting, and
//          a dedicated error-handling path — using plain functions.
//
// RULES:
//  • Delete each // TODO comment as you implement it.
//  • Do NOT rename any exported name — assertions depend on them.
//  • You MAY add private helper functions.
//  • Run `npm run challenge:02` to check your work (all PASS = done).

// ── ASSERT HELPER (do not modify) ─────────────────────────
function assert(condition: boolean, message: string): void {
  if (!condition) { console.error(`  FAIL  ${message}`); process.exitCode = 1; }
  else            { console.log (`  PASS  ${message}`); }
}

export interface Ctx {
  path: string;
  log: string[];
}
export type Middleware = (ctx: Ctx, next: () => void) => void;
export type ErrorHandler = (err: Error, ctx: Ctx) => void;

// ══════════════════════════════════════════════════════════
// PART 1 — compose(middlewares)
// ══════════════════════════════════════════════════════════
// Return a runner that executes each middleware in order. A
// middleware advances the chain by calling next(). If a middleware
// does NOT call next(), the chain STOPS (short-circuit) — later
// middlewares must not run.

export function compose(middlewares: Middleware[]): (ctx: Ctx) => void {
  return (ctx: Ctx) => {
    // TODO: walk an index down the array. Define dispatch(i):
    //   if i >= length, stop. Otherwise call middlewares[i](ctx, () => dispatch(i+1)).
    void middlewares; void ctx;
  };
}

// ══════════════════════════════════════════════════════════
// PART 2 — runWithErrorHandler
// ══════════════════════════════════════════════════════════
// Run the chain, but if any middleware THROWS, skip the remaining
// middlewares and invoke onError(err, ctx) exactly once.

export function runWithErrorHandler(
  ctx: Ctx,
  middlewares: Middleware[],
  onError: ErrorHandler,
): void {
  // TODO: same dispatch idea as compose, but wrap each middleware call
  //       in try/catch. On catch, call onError(err, ctx) and stop.
  void ctx; void middlewares; void onError;
}

// ── ASSERTIONS (do not modify) ────────────────────────────
console.log("\n── C02 Express middleware assertions ──");

const ctx: Ctx = { path: "/", log: [] };
compose([
  (c, next) => { c.log.push("a"); next(); },
  (c, next) => { c.log.push("b"); next(); },
  (c, _next) => { c.log.push("c"); /* no next → stop */ },
  (c, next) => { c.log.push("d"); next(); },
])(ctx);
assert(ctx.log.join("") === "abc", "compose: runs in order and short-circuits when next() is skipped");

const ctx2: Ctx = { path: "/x", log: [] };
runWithErrorHandler(
  ctx2,
  [
    (c, next) => { c.log.push("1"); next(); },
    (_c, _next) => { throw new Error("boom"); },
    (c, next) => { c.log.push("3"); next(); },
  ],
  (err, c) => { c.log.push("err:" + err.message); },
);
assert(ctx2.log.join("|") === "1|err:boom", "error path: throw skips rest and runs the handler once");

const ctx3: Ctx = { path: "/ok", log: [] };
runWithErrorHandler(
  ctx3,
  [(c, next) => { c.log.push("only"); next(); }],
  () => { ctx3.log.push("SHOULD-NOT-RUN"); },
);
assert(ctx3.log.join("") === "only", "error path: handler is not called when nothing throws");

export {};
