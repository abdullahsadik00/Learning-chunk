// Day 4 — async
// -----------------------------------------------------------------------------
// sleep(ms): resolve a promise after `ms` milliseconds.
// This is the building block — `await sleep(x)` pauses an async fn without
// blocking the thread (setTimeout schedules the resolve; the event loop keeps going).

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// Spec: awaiting sleep should pause execution ~the requested time, and code
// after the await runs only once the timer fires (ordering, not blocking).
async function demo() {
    console.log("start");
    const before = Date.now();

    await sleep(100);

    const elapsed = Date.now() - before;
    console.assert(elapsed >= 95, `sleep should pause ~100ms, waited ${elapsed}ms`);
    console.log(`resumed after ${elapsed}ms`);
}

// "resumed" logs AFTER the line below — proving sleep is non-blocking.
demo();
console.log("this runs before demo resumes (sleep is async, not blocking)");
