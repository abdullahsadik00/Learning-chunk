// ═══════════════════════════════════════════════════════════════
// POLYFILLS 04: DEBOUNCE & THROTTLE
// Run: node 04-debounce-throttle.js
// ═══════════════════════════════════════════════════════════════
//
// Both solve the same problem: a function called too frequently
// (scroll, resize, keypress) causes performance issues.
//
// DEBOUNCE → "wait until they STOP doing it"
//   Resets timer on every call. Executes AFTER the last call.
//
//   Timeline: call─call─call─call──────────[Execute]
//                                  ↑
//                                  delay after LAST call
//
// THROTTLE → "do it at most once per X ms"
//   Executes immediately, then blocks for the interval.
//
//   Timeline: [Execute]─skip─skip─[Execute]─skip─skip─[Execute]
//             ├────── interval ────┤

// ───────────────────────────────────────────────────────────────
// 1. Debounce — basic
// ───────────────────────────────────────────────────────────────

console.log("=== 1. Debounce (basic) ===");

function debounce(fn, delay, immediate) {
    var timer = null;

    return function() {
        var context = this;
        var args = arguments;
        var callNow = immediate && !timer;

        clearTimeout(timer);

        timer = setTimeout(function() {
            timer = null;
            if (!immediate) {
                fn.apply(context, args);
            }
        }, delay);

        if (callNow) {
            fn.apply(context, args);
        }
    };
}

// Simulate rapid typing — only the LAST call should fire
var callLog = [];
var debouncedSearch = debounce(function(query) {
    callLog.push("search: " + query);
}, 50); // 50ms delay

debouncedSearch("R");
debouncedSearch("Ra");
debouncedSearch("Rah");
debouncedSearch("Rahu");
debouncedSearch("Rahul");

setTimeout(function() {
    console.log("debounce log:", callLog);
    // ["search: Rahul"] — only last call fires
}, 200);

// Immediate option: fire on LEADING edge, then ignore until silence
var immediateLog = [];
var debouncedImmediate = debounce(function(v) {
    immediateLog.push(v);
}, 50, true);

debouncedImmediate("first");  // fires immediately
debouncedImmediate("second"); // suppressed
debouncedImmediate("third");  // suppressed

setTimeout(function() {
    console.log("immediate log:", immediateLog); // ["first"]
    // After silence, next call would fire immediately again
    debouncedImmediate("after silence");
}, 200);

setTimeout(function() {
    console.log("after silence:", immediateLog); // ["first", "after silence"]
}, 400);

// ───────────────────────────────────────────────────────────────
// 2. Debounce — advanced with cancel() and flush()
// ───────────────────────────────────────────────────────────────

console.log("\n=== 2. Debounce (advanced) ===");

function advancedDebounce(fn, delay) {
    var timer = null;
    var lastArgs = null;
    var lastContext = null;

    function debounced() {
        lastArgs = arguments;
        lastContext = this;
        clearTimeout(timer);
        timer = setTimeout(function() {
            fn.apply(lastContext, lastArgs);
            timer = null;
            lastArgs = null;
            lastContext = null;
        }, delay);
    }

    // cancel() — discard pending call
    debounced.cancel = function() {
        clearTimeout(timer);
        timer = null;
        lastArgs = null;
        lastContext = null;
    };

    // flush() — execute pending call immediately
    debounced.flush = function() {
        if (timer) {
            clearTimeout(timer);
            fn.apply(lastContext, lastArgs);
            timer = null;
            lastArgs = null;
            lastContext = null;
        }
    };

    return debounced;
}

var advLog = [];
var adv = advancedDebounce(function(v) { advLog.push(v); }, 100);

adv("a");
adv("b");
adv.flush(); // execute "b" immediately instead of waiting

setTimeout(function() {
    adv("c");
    adv.cancel(); // discard "c"
}, 50);

setTimeout(function() {
    console.log("advanced log:", advLog); // ["b"] — "c" was cancelled
}, 300);

// ───────────────────────────────────────────────────────────────
// 3. Throttle — leading + trailing edge
// ───────────────────────────────────────────────────────────────

console.log("\n=== 3. Throttle ===");

function throttle(fn, interval) {
    var lastTime = 0;
    var timer = null;

    return function() {
        var context = this;
        var args = arguments;
        var now = Date.now();
        var remaining = interval - (now - lastTime);

        if (remaining <= 0) {
            // Enough time passed → fire immediately (leading edge)
            if (timer) {
                clearTimeout(timer);
                timer = null;
            }
            lastTime = now;
            fn.apply(context, args);
        } else if (!timer) {
            // Schedule trailing call for the remaining time
            timer = setTimeout(function() {
                lastTime = Date.now();
                timer = null;
                fn.apply(context, args);
            }, remaining);
        }
    };
}

// Simulate scroll events firing every 20ms for 200ms
var throttleLog = [];
var throttledScroll = throttle(function(pos) {
    throttleLog.push(pos);
}, 100); // at most once every 100ms

var scrollPos = 0;
var scrollInterval = setInterval(function() {
    scrollPos += 10;
    throttledScroll(scrollPos);
}, 20);

setTimeout(function() {
    clearInterval(scrollInterval);
    console.log("throttle fires:", throttleLog.length, "times out of 10 scroll events");
    // ~2-3 times instead of 10
    console.log("positions:", throttleLog);
}, 230);

// ───────────────────────────────────────────────────────────────
// 4. Throttle — simple (leading edge only)
// ───────────────────────────────────────────────────────────────

console.log("\n=== 4. Simple Throttle ===");

function simpleThrottle(fn, interval) {
    var lastTime = 0;

    return function() {
        var now = Date.now();
        if (now - lastTime >= interval) {
            lastTime = now;
            fn.apply(this, arguments);
        }
        // calls that come too soon are silently dropped
    };
}

var simpleLog = [];
var simpleT = simpleThrottle(function(v) { simpleLog.push(v); }, 80);

var calls = [0, 30, 60, 90, 120, 150, 200]; // milliseconds of each call
calls.forEach(function(ms) {
    setTimeout(function() { simpleT(ms); }, ms);
});

setTimeout(function() {
    console.log("simpleThrottle fires at:", simpleLog);
    // Fires at 0, 90, 200 (first call each interval)
}, 350);

// ───────────────────────────────────────────────────────────────
// COMPARISON
// ───────────────────────────────────────────────────────────────

setTimeout(function() {
    console.log("\n=== Debounce vs Throttle ===");
    console.log([
        "Debounce — use when:  search input, window resize (final value), auto-save",
        "Throttle — use when:  scroll events, mouse move, API rate limiting, button spam",
        "",
        "debounce fires ONCE after quiet period",
        "throttle fires at REGULAR INTERVALS during activity",
    ].join("\n"));
}, 500);

// ───────────────────────────────────────────────────────────────
// PRACTICE
// ───────────────────────────────────────────────────────────────

setTimeout(function() {
    console.log("\n=== Practice ===");

    // Q1: How many times does debounce(fn, 200) fire if called 5 times within 100ms?
    console.log("Q1: Once — only the last call fires after the quiet period.");

    // Q2: How many times does throttle(fn, 100) fire in 500ms of continuous calls?
    console.log("Q2: ~5 times — approximately once every 100ms.");

    // Q3: Which one would you use for a live character counter?
    // Answer: DEBOUNCE — you want to update after the user stops typing,
    //         not on every keystroke.
    console.log("Q3: Debounce — wait until user stops typing, then count.");

    // Q4: Which one protects a 'Submit Order' button from double-click?
    // Answer: THROTTLE (or debounce with immediate=true) — fire once immediately,
    //         block re-fires for the interval.
    console.log("Q4: Throttle (or debounce immediate) — fire once, block extras.");
}, 700);
