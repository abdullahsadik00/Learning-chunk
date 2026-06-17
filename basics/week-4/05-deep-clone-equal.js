// ═══════════════════════════════════════════════════════════════
// POLYFILLS 05: DEEP CLONE & DEEP EQUAL
// Run: node 05-deep-clone-equal.js
// ═══════════════════════════════════════════════════════════════
//
// Shallow copy (= or spread): copies top-level properties.
//   Nested objects/arrays are STILL shared references.
//
// Deep clone: recursively copies every nested value.
//   No shared references between original and clone.
//
// Deep equal: recursively compares two values for structural equality.
//   Two objects with the same shape/values are equal even if
//   they are different references.

// ───────────────────────────────────────────────────────────────
// 1. deepClone — basic (no circular ref handling)
// ───────────────────────────────────────────────────────────────

console.log("=== 1. deepClone (basic) ===");

function deepClone(obj) {
    // Primitives and null: return as-is
    if (obj === null || typeof obj !== "object") { return obj; }

    // Date: create new Date with same timestamp
    if (obj instanceof Date) { return new Date(obj.getTime()); }

    // RegExp: create new RegExp with same pattern and flags
    if (obj instanceof RegExp) { return new RegExp(obj.source, obj.flags); }

    // Array: recursively clone each element
    if (Array.isArray(obj)) {
        var arrCopy = [];
        for (var i = 0; i < obj.length; i++) {
            arrCopy[i] = deepClone(obj[i]);
        }
        return arrCopy;
    }

    // Plain object: recursively clone each property
    var objCopy = {};
    var keys = Object.keys(obj);
    for (var j = 0; j < keys.length; j++) {
        objCopy[keys[j]] = deepClone(obj[keys[j]]);
    }
    return objCopy;
}

var original = {
    name: "Rahul",
    address: { city: "Mumbai", coords: [19.07, 72.87] },
    hobbies: ["reading", "coding"],
    born: new Date("1995-01-01"),
    pattern: /hello/gi,
};

var cloned = deepClone(original);

// Mutate the clone — original must stay unchanged
cloned.address.city = "Delhi";
cloned.hobbies.push("gaming");

console.log(original.address.city); // "Mumbai" — untouched
console.log(original.hobbies);      // ["reading", "coding"] — untouched
console.log(cloned.address.city);   // "Delhi"
console.log(cloned.hobbies);        // ["reading", "coding", "gaming"]

// Dates and RegExps are copied properly
console.log(cloned.born instanceof Date);    // true
console.log(cloned.born !== original.born);  // true — different objects
console.log(cloned.born.getTime() === original.born.getTime()); // true — same time

// ───────────────────────────────────────────────────────────────
// 2. deepCloneAdvanced — handles circular refs, Map, Set
// ───────────────────────────────────────────────────────────────

console.log("\n=== 2. deepCloneAdvanced (circular ref + Map/Set) ===");

function deepCloneAdvanced(obj, visited) {
    if (obj === null || typeof obj !== "object") { return obj; }
    if (!visited) { visited = new WeakMap(); }

    // Return the already-cloned version if we've seen this object
    if (visited.has(obj)) { return visited.get(obj); }

    var clone;

    if (obj instanceof Date) {
        clone = new Date(obj.getTime());
    } else if (obj instanceof RegExp) {
        clone = new RegExp(obj.source, obj.flags);
    } else if (obj instanceof Map) {
        clone = new Map();
        visited.set(obj, clone); // register BEFORE recursing (prevents loops)
        obj.forEach(function(value, key) {
            clone.set(deepCloneAdvanced(key, visited), deepCloneAdvanced(value, visited));
        });
        return clone;
    } else if (obj instanceof Set) {
        clone = new Set();
        visited.set(obj, clone);
        obj.forEach(function(value) {
            clone.add(deepCloneAdvanced(value, visited));
        });
        return clone;
    } else if (Array.isArray(obj)) {
        clone = [];
        visited.set(obj, clone);
        for (var i = 0; i < obj.length; i++) {
            clone[i] = deepCloneAdvanced(obj[i], visited);
        }
        return clone;
    } else {
        // Preserve the prototype chain
        clone = Object.create(Object.getPrototypeOf(obj));
        visited.set(obj, clone);
        var keys = Object.keys(obj);
        for (var j = 0; j < keys.length; j++) {
            clone[keys[j]] = deepCloneAdvanced(obj[keys[j]], visited);
        }
        return clone;
    }

    return clone;
}

// Circular reference
var circular = { name: "test" };
circular.self = circular; // points to itself

var clonedCircular = deepCloneAdvanced(circular);
console.log(clonedCircular !== circular);            // true — different object
console.log(clonedCircular.self === clonedCircular); // true — circular ref preserved in clone

// Map and Set
var withMap = { data: new Map([["a", 1], ["b", 2]]), tags: new Set(["x", "y"]) };
var clonedMap = deepCloneAdvanced(withMap);
clonedMap.data.set("c", 3);
clonedMap.tags.add("z");
console.log(withMap.data.size);  // 2 — original unchanged
console.log(clonedMap.data.size); // 3

// ───────────────────────────────────────────────────────────────
// 3. deepEqual — structural equality
// ───────────────────────────────────────────────────────────────

console.log("\n=== 3. deepEqual ===");

function deepEqual(a, b) {
    // Same reference or same primitive value
    if (a === b) { return true; }

    // Null/undefined checks
    if (a === null || b === null) { return false; }
    if (a === undefined || b === undefined) { return false; }

    // Different types
    if (typeof a !== typeof b) { return false; }

    // Primitives (that weren't === equal above: e.g. NaN !== NaN)
    if (typeof a !== "object") { return false; }

    // Date
    if (a instanceof Date && b instanceof Date) {
        return a.getTime() === b.getTime();
    }

    // RegExp
    if (a instanceof RegExp && b instanceof RegExp) {
        return a.source === b.source && a.flags === b.flags;
    }

    // Array vs non-array
    if (Array.isArray(a) !== Array.isArray(b)) { return false; }

    // Compare own keys
    var keysA = Object.keys(a);
    var keysB = Object.keys(b);

    if (keysA.length !== keysB.length) { return false; }

    for (var i = 0; i < keysA.length; i++) {
        var key = keysA[i];
        if (!Object.prototype.hasOwnProperty.call(b, key)) { return false; }
        if (!deepEqual(a[key], b[key])) { return false; }
    }

    return true;
}

// Primitives
console.log(deepEqual(1, 1));          // true
console.log(deepEqual("a", "a"));     // true
console.log(deepEqual(1, "1"));       // false — different types

// Arrays
console.log(deepEqual([1, 2, 3], [1, 2, 3]));    // true
console.log(deepEqual([1, 2, 3], [1, 2, 4]));    // false
console.log(deepEqual([1, 2], [1, 2, 3]));       // false — length differs

// Objects
console.log(deepEqual({ a: 1, b: { c: 2 } }, { a: 1, b: { c: 2 } })); // true
console.log(deepEqual({ a: 1, b: { c: 2 } }, { a: 1, b: { c: 3 } })); // false

// Dates
console.log(deepEqual(new Date("2024-01-01"), new Date("2024-01-01"))); // true
console.log(deepEqual(new Date("2024-01-01"), new Date("2024-01-02"))); // false

// Extra key
console.log(deepEqual({ a: 1 }, { a: 1, b: 2 })); // false

// Nested arrays in objects
console.log(deepEqual({ x: [1, 2] }, { x: [1, 2] })); // true
console.log(deepEqual({ x: [1, 2] }, { x: [1, 3] })); // false

// ───────────────────────────────────────────────────────────────
// 4. Shallow clone vs deep clone demo
// ───────────────────────────────────────────────────────────────

console.log("\n=== 4. Shallow vs Deep ===");

var obj = { a: 1, nested: { b: 2 } };

var shallowCopy = Object.assign({}, obj);
var deepCopy = deepClone(obj);

shallowCopy.nested.b = 99;
deepCopy.nested.b    = 777;

console.log("original.nested.b:", obj.nested.b); // 99 — shallow copy mutated original!
// deepCopy.nested.b = 777 didn't affect original since it was a deep clone

// ───────────────────────────────────────────────────────────────
// PRACTICE
// ───────────────────────────────────────────────────────────────

console.log("\n=== Practice ===");

// Q1: Does JSON.parse(JSON.stringify(obj)) deep clone correctly?
var tricky = { fn: function() {}, sym: Symbol(), undef: undefined, d: new Date() };
var jsonClone = JSON.parse(JSON.stringify(tricky));
console.log("Q1 fn:", jsonClone.fn);      // undefined — functions lost
console.log("Q1 d type:", typeof jsonClone.d); // "string" — Date becomes string
// Answer: JSON clone is lossy — loses functions, symbols, undefined, Dates become strings

// Q2: deepEqual with different key order?
console.log("Q2:", deepEqual({ a: 1, b: 2 }, { b: 2, a: 1 })); // true — key order doesn't matter

// Q3: null vs {} — are they deepEqual?
console.log("Q3:", deepEqual(null, {})); // false

// Q4: What's the bug with `const copy = obj; copy.x = 1`?
var source = { x: 0 };
var badCopy = source;
badCopy.x = 1;
console.log("Q4 source.x:", source.x); // 1 — same reference! No copy was made.
