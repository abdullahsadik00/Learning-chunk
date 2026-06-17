// ═══════════════════════════════════════════════════════════════
// MODULE 9: ERROR HANDLING
// Run: node 09-error-handling.js
// ═══════════════════════════════════════════════════════════════
//
// Error handling = deciding what to do when something goes wrong.
//
// Key tools:
//   try / catch / finally   → synchronous error handling
//   .catch() / try+await    → async error handling
//   Custom error classes    → meaningful error types
//   Global handlers         → last-resort safety nets

// ───────────────────────────────────────────────────────────────
// 1. BUILT-IN ERROR TYPES
// ───────────────────────────────────────────────────────────────

console.log("=== 1. Built-in Error Types ===");

// Each has a .name and .message property, plus a .stack string.

try { null.property; }                 catch (e) { console.log(e.name + ":", e.message); }
// TypeError: Cannot read properties of null

try { undeclaredVariable; }            catch (e) { console.log(e.name + ":", e.message); }
// ReferenceError: undeclaredVariable is not defined

try { new Array(-1); }                 catch (e) { console.log(e.name + ":", e.message); }
// RangeError: Invalid array length

try { eval("{"); }                     catch (e) { console.log(e.name + ":", e.message); }
// SyntaxError: Unexpected end of input

try { decodeURIComponent("%"); }       catch (e) { console.log(e.name + ":", e.message); }
// URIError: URI malformed

// ───────────────────────────────────────────────────────────────
// 2. TRY / CATCH / FINALLY
// ───────────────────────────────────────────────────────────────

console.log("\n=== 2. try / catch / finally ===");

// Basic:
try {
    console.log("try: running");
    throw new Error("something broke");
    // eslint-disable-next-line no-unreachable
    console.log("try: never reached");
} catch (err) {
    console.log("catch:", err.message);
} finally {
    console.log("finally: ALWAYS runs");
}
console.log("after block: execution continues");

// finally runs even when catch re-throws:
function withFinally() {
    try {
        throw new Error("inner");
    } catch (e) {
        console.log("caught, re-throwing");
        throw e; // re-throw
    } finally {
        console.log("finally still runs before re-throw propagates");
    }
}

try { withFinally(); } catch (e) { console.log("outer caught:", e.message); }

// finally return OVERRIDES try/catch return:
function finallyOverride() {
    try { return "from try"; }
    // eslint-disable-next-line no-unsafe-finally
    finally { return "from finally"; } // wins!
}
console.log("return override:", finallyOverride()); // "from finally"

// ───────────────────────────────────────────────────────────────
// 3. CUSTOM ERROR CLASSES
// ───────────────────────────────────────────────────────────────

console.log("\n=== 3. Custom Error Classes ===");

class AppError extends Error {
    constructor(message, code = 500) {
        super(message);
        this.name = "AppError";
        this.code = code;
    }
}

class ValidationError extends AppError {
    constructor(field, message) {
        super(message, 400);
        this.name = "ValidationError";
        this.field = field;
    }
}

class NotFoundError extends AppError {
    constructor(resource, id) {
        super(`${resource} with id ${id} not found`, 404);
        this.name = "NotFoundError";
        this.resource = resource;
    }
}

class AuthError extends AppError {
    constructor(msg = "Authentication required") {
        super(msg, 401);
        this.name = "AuthError";
    }
}

// Throwing and catching by type:
function validateUser(user) {
    if (!user.name)  throw new ValidationError("name", "Name is required");
    if (!user.email) throw new ValidationError("email", "Email is required");
    if (user.age < 0 || user.age > 150) throw new ValidationError("age", "Invalid age");
    return true;
}

function processRequest(user, isAuth) {
    if (!isAuth) throw new AuthError();
    validateUser(user);
    return "processed";
}

function handleError(err) {
    if (err instanceof ValidationError) {
        console.log(`  Validation error on '${err.field}': ${err.message} [${err.code}]`);
    } else if (err instanceof NotFoundError) {
        console.log(`  Not found: ${err.resource} [${err.code}]`);
    } else if (err instanceof AuthError) {
        console.log(`  Auth error: ${err.message} [${err.code}]`);
    } else {
        console.log(`  Unexpected error: ${err.message}`);
        throw err; // re-throw unknown errors
    }
}

try { processRequest({ name: "", email: "x@x.com", age: 25 }, true); }
catch (e) { handleError(e); }

try { processRequest({ name: "Sadik", email: "x@x.com", age: 25 }, false); }
catch (e) { handleError(e); }

try { throw new NotFoundError("User", 99); }
catch (e) { handleError(e); }

// ───────────────────────────────────────────────────────────────
// 4. ASYNC ERROR HANDLING
// ───────────────────────────────────────────────────────────────

console.log("\n=== 4. Async Error Handling ===");

// WRONG — try/catch CANNOT catch errors thrown inside setTimeout:
try {
    setTimeout(() => { /* throw new Error("can't catch this"); */ }, 0);
} catch (e) {
    console.log("this catch is NEVER reached for async errors");
}

// CORRECT — handle errors INSIDE the async callback:
setTimeout(() => {
    try {
        throw new Error("caught inside callback");
    } catch (e) {
        console.log("async callback caught:", e.message);
    }
}, 5);

// With Promises — .catch() handles rejections:
function fakeApiFail() {
    return new Promise((_, reject) =>
        setTimeout(() => reject(new NotFoundError("User", 42)), 10)
    );
}

fakeApiFail()
    .then(data => console.log("data:", data))
    .catch(err => handleError(err));

// With async/await — use try/catch:
async function fetchData() {
    try {
        await fakeApiFail();
    } catch (err) {
        console.log("  async/await caught:", err.name);
        return null;
    }
}
fetchData();

// ───────────────────────────────────────────────────────────────
// 5. PROMISE CHAIN error flow
// ───────────────────────────────────────────────────────────────

console.log("\n=== 5. Promise error flow ===");

Promise.resolve()
    .then(() => { throw new Error("step 2 failed"); })
    .then(() => console.log("step 3 — skipped"))
    .catch(e => {
        console.log("caught:", e.message);
        return "recovered";          // return value resumes chain
    })
    .then(v => console.log("after recovery:", v));

// Unhandled rejection (Node prints a warning):
// Promise.reject(new Error("unhandled")); // ← don't do this

// ───────────────────────────────────────────────────────────────
// 6. GLOBAL ERROR HANDLERS (Node.js)
// ───────────────────────────────────────────────────────────────

console.log("\n=== 6. Global Handlers ===");

// Safety net — catches errors that slipped through all try/catches.
// These are last-resort; don't rely on them for normal error flow.

process.on("uncaughtException", (err) => {
    console.log("GLOBAL: uncaughtException:", err.message);
    // In production: log, alert, then gracefully shut down
    // process.exit(1);
});

process.on("unhandledRejection", (reason) => {
    console.log("GLOBAL: unhandledRejection:", reason?.message || reason);
});

// Trigger unhandledRejection (no .catch on this chain):
// Promise.reject(new Error("no handler"));

// ───────────────────────────────────────────────────────────────
// 7. BEST PRACTICES
// ───────────────────────────────────────────────────────────────

console.log("\n=== 7. Best Practices ===");

// ✅ Be specific — catch only what you can handle:
function specificCatch() {
    try {
        validateUser({ name: "", email: "" });
    } catch (e) {
        if (e instanceof ValidationError) {
            console.log("handled validation:", e.field);
        } else {
            throw e; // re-throw anything you can't handle
        }
    }
}
specificCatch();

// ✅ Don't swallow errors silently:
function neverSwallow() {
    try {
        throw new Error("real problem");
    } catch (e) {
        console.log("logging error:", e.message); // at minimum, log it
        // ❌ catch (e) {}  — never do this
    }
}
neverSwallow();

// ✅ Add context when re-throwing:
function addContext(userId) {
    try {
        validateUser({ name: "" });
    } catch (e) {
        const contextual = new AppError(
            `Failed processing user ${userId}: ${e.message}`,
            e.code
        );
        contextual.cause = e; // ES2022: chain the original error
        throw contextual;
    }
}
try { addContext(42); } catch (e) { console.log("with context:", e.message); }

// ───────────────────────────────────────────────────────────────
// PRACTICE
// ───────────────────────────────────────────────────────────────

console.log("\n=== Practice ===");

// Q1: What prints?
try {
    console.log("Q1 A");
    throw new Error("oops");
    // eslint-disable-next-line no-unreachable
    console.log("Q1 B");
} catch (e) {
    console.log("Q1 C");
} finally {
    console.log("Q1 D");
}
console.log("Q1 E");
// Answer: Q1 A, Q1 C, Q1 D, Q1 E

// Q2: What does this return?
function q2() {
    // eslint-disable-next-line no-unreachable
    try   { throw new Error(); return 1; }
    catch { return 2; }
    // eslint-disable-next-line no-unsafe-finally
    finally { return 3; }
}
console.log("Q2:", q2()); // 3 — finally overrides

// Q3: Async error — what prints?
async function q3() {
    try {
        await Promise.reject("Error 1");
    } catch (e) {
        console.log("Q3 caught:", e);
        await Promise.reject("Error 2"); // NOT caught by inner try
    } finally {
        console.log("Q3 finally");
    }
}
q3().catch(e => console.log("Q3 outer catch:", e));
// Answer: "Q3 caught: Error 1", "Q3 finally", "Q3 outer catch: Error 2"
