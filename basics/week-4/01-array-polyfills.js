// ═══════════════════════════════════════════════════════════════
// POLYFILLS 01: ARRAY METHODS
// Run: node 01-array-polyfills.js
// ═══════════════════════════════════════════════════════════════
//
// A POLYFILL recreates a built-in method from scratch to show
// exactly how it works under the hood.
//
// All array iterator polyfills share two key details:
//   1. "i in arr"  — skips empty slots in sparse arrays
//   2. callback.call(thisArg, el, i, arr)  — supports optional thisArg
//
// Callback signature:  callback(element, index, originalArray)

// ───────────────────────────────────────────────────────────────
// 1. Array.prototype.map  — transform every element
// ───────────────────────────────────────────────────────────────

console.log("=== 1. myMap ===");

// map: returns a NEW array of the same length.
// Original is NEVER modified.

Array.prototype.myMap = function(callback, thisArg) {
    if (typeof callback !== "function") {
        throw new TypeError(callback + " is not a function");
    }
    var result = [];
    var arr = this;
    for (var i = 0; i < arr.length; i++) {
        if (i in arr) {
            result[i] = callback.call(thisArg, arr[i], i, arr);
        }
    }
    return result;
};

var numbers = [1, 2, 3, 4, 5];
console.log(numbers.myMap(function(n) { return n * 2; }));   // [2, 4, 6, 8, 10]
console.log(numbers);                                          // [1, 2, 3, 4, 5] — unchanged

// thisArg: the object used as `this` inside the callback
var withContext = numbers.myMap(function(n, i) {
    return this.prefix + (n * i);
}, { prefix: "V:" });
console.log(withContext); // ["V:0", "V:2", "V:6", "V:12", "V:20"]

// Sparse array: "i in arr" skips the empty slot
var sparse = [1, , 3];  // eslint-disable-line no-sparse-arrays
var mappedSparse = sparse.myMap(function(x) { return x * 2; });
console.log(mappedSparse.length); // 3 — same length, slot 1 stays empty

// ───────────────────────────────────────────────────────────────
// 2. Array.prototype.filter  — keep elements that pass a test
// ───────────────────────────────────────────────────────────────

console.log("\n=== 2. myFilter ===");

// filter: returns a NEW array with only the passing elements (≤ original length)

Array.prototype.myFilter = function(callback, thisArg) {
    if (typeof callback !== "function") {
        throw new TypeError(callback + " is not a function");
    }
    var result = [];
    var arr = this;
    for (var i = 0; i < arr.length; i++) {
        if (i in arr) {
            if (callback.call(thisArg, arr[i], i, arr)) {
                result.push(arr[i]);
            }
        }
    }
    return result;
};

var nums = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
console.log(nums.myFilter(function(n) { return n % 2 === 0; })); // [2, 4, 6, 8, 10]
console.log(nums.myFilter(function(n) { return n > 7; }));       // [8, 9, 10]

var people = [
    { name: "Rahul", age: 25 },
    { name: "Priya", age: 16 },
    { name: "Amit",  age: 30 },
];
console.log(people.myFilter(function(p) { return p.age >= 18; }).map(function(p) { return p.name; }));
// ["Rahul", "Amit"]

// map vs filter:
//   map    → transforms → SAME length
//   filter → tests      → SUBSET length (≤ original)

// ───────────────────────────────────────────────────────────────
// 3. Array.prototype.reduce  — accumulate to one value
// ───────────────────────────────────────────────────────────────

console.log("\n=== 3. myReduce ===");

// reduce: folds the array into a single value using an accumulator.
// If no initialValue, the first element is the accumulator and
// iteration starts from index 1.

Array.prototype.myReduce = function(callback, initialValue) {
    if (typeof callback !== "function") {
        throw new TypeError(callback + " is not a function");
    }
    var arr = this;
    var accumulator;
    var startIndex;

    if (arguments.length >= 2) {
        accumulator = initialValue;
        startIndex = 0;
    } else {
        if (arr.length === 0) {
            throw new TypeError("Reduce of empty array with no initial value");
        }
        var found = false;
        for (var j = 0; j < arr.length; j++) {
            if (j in arr) {
                accumulator = arr[j];
                startIndex = j + 1;
                found = true;
                break;
            }
        }
        if (!found) {
            throw new TypeError("Reduce of empty array with no initial value");
        }
    }

    for (var i = startIndex; i < arr.length; i++) {
        if (i in arr) {
            accumulator = callback(accumulator, arr[i], i, arr);
        }
    }
    return accumulator;
};

console.log([1, 2, 3, 4, 5].myReduce(function(acc, n) { return acc + n; }, 0));  // 15
console.log([2, 3, 4].myReduce(function(acc, n) { return acc * n; }));            // 24 (no initial value)

var nested = [[1, 2], [3, 4], [5, 6]];
var flat = nested.myReduce(function(acc, curr) { return acc.concat(curr); }, []);
console.log(flat); // [1, 2, 3, 4, 5, 6]

var fruits = ["apple", "banana", "apple", "orange", "banana", "apple"];
var counts = fruits.myReduce(function(acc, fruit) {
    acc[fruit] = (acc[fruit] || 0) + 1;
    return acc;
}, {});
console.log(counts); // { apple: 3, banana: 2, orange: 1 }

try {
    [].myReduce(function(a, b) { return a + b; });
} catch (e) {
    console.log(e.message); // "Reduce of empty array with no initial value"
}

// ───────────────────────────────────────────────────────────────
// 4. Array.prototype.forEach  — iterate, return nothing
// ───────────────────────────────────────────────────────────────

console.log("\n=== 4. myForEach ===");

// forEach: calls callback for every element. Always returns undefined.
// Key difference from map: does NOT build a new array.

Array.prototype.myForEach = function(callback, thisArg) {
    if (typeof callback !== "function") {
        throw new TypeError(callback + " is not a function");
    }
    var arr = this;
    for (var i = 0; i < arr.length; i++) {
        if (i in arr) {
            callback.call(thisArg, arr[i], i, arr);
        }
    }
    // implicitly returns undefined
};

var collected = [];
[1, 2, 3].myForEach(function(n) { collected.push(n * 2); });
console.log(collected); // [2, 4, 6]

var ret = [1, 2, 3].myForEach(function(n) { return n * 99; });
console.log(ret); // undefined — forEach always returns undefined

// ───────────────────────────────────────────────────────────────
// 5. Array.prototype.find  — first element that passes a test
// ───────────────────────────────────────────────────────────────

console.log("\n=== 5. myFind ===");

// find: returns the ELEMENT (not index) of the first match.
// Returns undefined if nothing matches.

Array.prototype.myFind = function(callback, thisArg) {
    if (typeof callback !== "function") {
        throw new TypeError(callback + " is not a function");
    }
    var arr = this;
    for (var i = 0; i < arr.length; i++) {
        if (i in arr) {
            if (callback.call(thisArg, arr[i], i, arr)) {
                return arr[i]; // return FIRST match
            }
        }
    }
    return undefined;
};

var users = [
    { id: 1, name: "Rahul" },
    { id: 2, name: "Priya" },
    { id: 3, name: "Amit"  },
];
console.log(users.myFind(function(u) { return u.id === 2; })); // { id: 2, name: "Priya" }
console.log(users.myFind(function(u) { return u.id === 99; })); // undefined

// ───────────────────────────────────────────────────────────────
// 6. Array.prototype.findIndex  — index of first match
// ───────────────────────────────────────────────────────────────

console.log("\n=== 6. myFindIndex ===");

// findIndex: same as find but returns the INDEX, not the element.
// Returns -1 if nothing matches.

Array.prototype.myFindIndex = function(callback, thisArg) {
    if (typeof callback !== "function") {
        throw new TypeError(callback + " is not a function");
    }
    var arr = this;
    for (var i = 0; i < arr.length; i++) {
        if (i in arr) {
            if (callback.call(thisArg, arr[i], i, arr)) {
                return i; // return INDEX of first match
            }
        }
    }
    return -1;
};

console.log([10, 20, 30, 40].myFindIndex(function(n) { return n > 25; })); // 2
console.log([10, 20, 30].myFindIndex(function(n) { return n > 99; }));     // -1

// ───────────────────────────────────────────────────────────────
// 7. Array.prototype.some & every
// ───────────────────────────────────────────────────────────────

console.log("\n=== 7. mySome / myEvery ===");

// some:  returns true if AT LEAST ONE element passes → short-circuits on first true
// every: returns true if ALL elements pass         → short-circuits on first false

Array.prototype.mySome = function(callback, thisArg) {
    if (typeof callback !== "function") {
        throw new TypeError(callback + " is not a function");
    }
    var arr = this;
    for (var i = 0; i < arr.length; i++) {
        if (i in arr) {
            if (callback.call(thisArg, arr[i], i, arr)) {
                return true; // at least one passed
            }
        }
    }
    return false;
};

Array.prototype.myEvery = function(callback, thisArg) {
    if (typeof callback !== "function") {
        throw new TypeError(callback + " is not a function");
    }
    var arr = this;
    for (var i = 0; i < arr.length; i++) {
        if (i in arr) {
            if (!callback.call(thisArg, arr[i], i, arr)) {
                return false; // at least one failed
            }
        }
    }
    return true;
};

console.log([1, 2, 3, 4].mySome(function(n) { return n > 3; }));   // true
console.log([1, 2, 3, 4].mySome(function(n) { return n > 10; }));  // false
console.log([2, 4, 6, 8].myEvery(function(n) { return n % 2 === 0; })); // true
console.log([2, 4, 5, 8].myEvery(function(n) { return n % 2 === 0; })); // false

// Edge cases:
console.log([].mySome(function() { return true; }));   // false — empty array
console.log([].myEvery(function() { return false; })); // true  — vacuous truth

// ───────────────────────────────────────────────────────────────
// 8. Array.prototype.flat  — flatten nested arrays
// ───────────────────────────────────────────────────────────────

console.log("\n=== 8. myFlat ===");

// flat(depth): flattens sub-arrays up to `depth` levels.
// Default depth = 1. Infinity = fully flatten.

Array.prototype.myFlat = function(depth) {
    if (depth === undefined) { depth = 1; }
    var result = [];
    var arr = this;

    function flatten(array, currentDepth) {
        for (var i = 0; i < array.length; i++) {
            if (i in array) {
                if (Array.isArray(array[i]) && currentDepth < depth) {
                    flatten(array[i], currentDepth + 1);
                } else {
                    result.push(array[i]);
                }
            }
        }
    }

    flatten(arr, 0);
    return result;
};

console.log([1, [2, 3], [4, [5, 6]]].myFlat());      // [1, 2, 3, 4, [5, 6]]  (depth 1)
console.log([1, [2, 3], [4, [5, 6]]].myFlat(2));     // [1, 2, 3, 4, 5, 6]    (depth 2)
console.log([1, [2, [3, [4, [5]]]]].myFlat(Infinity)); // [1, 2, 3, 4, 5]      (full)

// ───────────────────────────────────────────────────────────────
// PRACTICE
// ───────────────────────────────────────────────────────────────

console.log("\n=== Practice ===");

// Q1: What does myMap return for an empty array?
console.log("Q1:", [].myMap(function(x) { return x * 2; })); // []

// Q2: What does myReduce return without initialValue on [5]?
console.log("Q2:", [5].myReduce(function(acc, n) { return acc + n; })); // 5

// Q3: some vs every on []?
console.log("Q3 some:", [].mySome(function() { return true; }));   // false
console.log("Q3 every:", [].myEvery(function() { return false; })); // true

// Q4: Chain myFilter → myMap → myReduce
var total = [1, 2, 3, 4, 5, 6]
    .myFilter(function(n) { return n % 2 === 0; })    // [2, 4, 6]
    .myMap(function(n) { return n * n; })              // [4, 16, 36]
    .myReduce(function(acc, n) { return acc + n; }, 0); // 56
console.log("Q4:", total); // 56
