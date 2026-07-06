// Cold rep — myCall
// -----------------------------------------------------------------------------
// Write this from scratch WITHOUT looking at functions.js. The asserts below are
// the spec; when `node day-03/cold-reps.js` prints nothing, it's yours.
//
// Approach (the temp-property trick, in words — not code):
//   1. Put `func` on `context` under a key that can't collide (a Symbol).
//   2. Call it as a METHOD of context so `this` inside func === context.
//   3. Capture the return value, delete the temp key, return the value.

function whoAmI(greeting) {
    return greeting + " " + this.name;
}

function myCall(func, context, ...args) {
    // TODO: your implementation
}

// spec
console.assert(myCall(whoAmI, { name: "Sam" }, "Hi") === "Hi Sam", "myCall failed");

// spec: the temp key must not linger on the context object afterwards
const ctx = { name: "Sam" };
myCall(whoAmI, ctx, "Hi");
console.assert(
    Object.getOwnPropertySymbols(ctx).length === 0 && !("func" in ctx),
    "myCall should clean up its temp property"
);
