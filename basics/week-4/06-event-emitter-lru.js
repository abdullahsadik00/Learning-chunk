// ═══════════════════════════════════════════════════════════════
// POLYFILLS 06: EVENTEMITTER & LRU CACHE
// Run: node 06-event-emitter-lru.js
// ═══════════════════════════════════════════════════════════════
//
// EventEmitter — publish/subscribe pattern
//   on(event, fn)    → register listener
//   off(event, fn)   → remove listener
//   emit(event, ...) → fire all listeners
//   once(event, fn)  → one-shot listener (auto-removes after first fire)
//
// LRU Cache — Least Recently Used eviction
//   get(key)         → O(1) — return value or -1
//   put(key, value)  → O(1) — insert; evict LRU if over capacity
//   Data: HashMap (O(1) lookup) + ordering (Map preserves insertion order)

// ───────────────────────────────────────────────────────────────
// 1. EventEmitter
// ───────────────────────────────────────────────────────────────

console.log("=== 1. EventEmitter ===");

function EventEmitter() {
    this.events = {};
}

// Register a listener. Returns `this` for chaining.
EventEmitter.prototype.on = function(event, listener) {
    if (!this.events[event]) { this.events[event] = []; }
    this.events[event].push(listener);
    return this;
};

// Remove a listener (also removes once() wrappers via ._original link).
EventEmitter.prototype.off = function(event, listener) {
    if (!this.events[event]) { return this; }
    this.events[event] = this.events[event].filter(function(fn) {
        return fn !== listener && fn._original !== listener;
    });
    return this;
};

// Fire all listeners for the event with the given args.
// Returns `this` for chaining (unlike Node's EventEmitter which returns boolean).
EventEmitter.prototype.emit = function(event) {
    if (this.events[event]) {
        var args = Array.prototype.slice.call(arguments, 1);
        // Snapshot the listeners list — a listener might call off() during emit
        var listeners = this.events[event].slice();
        listeners.forEach(function(listener) {
            listener.apply(null, args);
        });
    }
    return this;
};

// Register a listener that auto-removes after the first fire.
EventEmitter.prototype.once = function(event, listener) {
    var self = this;

    function wrapper() {
        listener.apply(null, arguments);
        self.off(event, wrapper);
    }

    wrapper._original = listener; // so off(event, originalFn) still works
    this.on(event, wrapper);
    return this;
};

EventEmitter.prototype.removeAllListeners = function(event) {
    if (event) {
        delete this.events[event];
    } else {
        this.events = {};
    }
    return this;
};

EventEmitter.prototype.listenerCount = function(event) {
    return this.events[event] ? this.events[event].length : 0;
};

// --- Tests ---
var emitter = new EventEmitter();

function onData(data) { console.log("  listener1:", data.id); }
function onData2(data) { console.log("  listener2:", data.id); }

// Multiple listeners for the same event
emitter.on("data", onData);
emitter.on("data", onData2);
emitter.emit("data", { id: 1 }); // listener1: 1, listener2: 1

// .once() — fires once, then auto-removes
emitter.once("connect", function() { console.log("  connected!"); });
emitter.emit("connect"); // "connected!"
emitter.emit("connect"); // nothing — listener already removed
console.log("connect count:", emitter.listenerCount("connect")); // 0

// .off() removes specific listener
emitter.off("data", onData);
emitter.emit("data", { id: 2 }); // only listener2: 2
console.log("data count after off:", emitter.listenerCount("data")); // 1

// Chaining
var chainEmitter = new EventEmitter();
chainEmitter
    .on("a", function() { console.log("  chain a"); })
    .on("b", function() { console.log("  chain b"); })
    .emit("a")
    .emit("b");

// ───────────────────────────────────────────────────────────────
// 2. LRU Cache — using Map (Map preserves insertion order)
// ───────────────────────────────────────────────────────────────

console.log("\n=== 2. LRUCache (Map-based) ===");

// Map maintains insertion order.
// The FIRST key in the Map is the LEAST recently used.
//
// On get:  delete + re-insert to move to the end (most recent)
// On put:  if full, delete the first key (oldest = LRU), then insert

function LRUCache(capacity) {
    this.capacity = capacity;
    this.cache = new Map();
}

LRUCache.prototype.get = function(key) {
    if (!this.cache.has(key)) { return -1; }
    var value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value); // move to end = most recently used
    return value;
};

LRUCache.prototype.put = function(key, value) {
    if (this.cache.has(key)) {
        this.cache.delete(key); // remove old entry to re-insert at end
    } else if (this.cache.size >= this.capacity) {
        var firstKey = this.cache.keys().next().value; // first = LRU
        this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
};

// --- Tests ---
var cache = new LRUCache(3);

cache.put("a", 1);
cache.put("b", 2);
cache.put("c", 3);

console.log(cache.get("a")); // 1 — "a" is now most recently used

cache.put("d", 4); // cache full! LRU is "b" (a was accessed, b wasn't) → evict "b"
console.log(cache.get("b")); // -1 — evicted
console.log(cache.get("c")); // 3
console.log(cache.get("d")); // 4

// Access pattern:
//   put a,b,c → [a, b, c] (a=oldest)
//   get a     → [b, c, a] (a moved to most-recent end)
//   put d     → evict b (oldest), [c, a, d]

// ───────────────────────────────────────────────────────────────
// 3. LRU Cache — doubly linked list (explicit O(1) without Map trick)
// ───────────────────────────────────────────────────────────────

console.log("\n=== 3. LRUCache (Doubly Linked List) ===");

// head ↔ [most recent] ↔ ... ↔ [least recent] ↔ tail
// head.next = most recently used
// tail.prev = least recently used (to evict)

function LRUNode(key, value) {
    this.key = key;
    this.value = value;
    this.prev = null;
    this.next = null;
}

function LRUCacheLL(capacity) {
    this.capacity = capacity;
    this.map = Object.create(null); // key → node
    this.size = 0;
    // Sentinel nodes — never evicted, simplify edge-case handling
    this.head = new LRUNode(null, null); // most-recent side
    this.tail = new LRUNode(null, null); // least-recent side
    this.head.next = this.tail;
    this.tail.prev = this.head;
}

LRUCacheLL.prototype._addToFront = function(node) {
    node.next = this.head.next;
    node.prev = this.head;
    this.head.next.prev = node;
    this.head.next = node;
};

LRUCacheLL.prototype._removeNode = function(node) {
    node.prev.next = node.next;
    node.next.prev = node.prev;
};

LRUCacheLL.prototype._moveToFront = function(node) {
    this._removeNode(node);
    this._addToFront(node);
};

LRUCacheLL.prototype.get = function(key) {
    if (!(key in this.map)) { return -1; }
    var node = this.map[key];
    this._moveToFront(node); // mark as recently used
    return node.value;
};

LRUCacheLL.prototype.put = function(key, value) {
    if (key in this.map) {
        var node = this.map[key];
        node.value = value;
        this._moveToFront(node);
    } else {
        if (this.size >= this.capacity) {
            // tail.prev is the LRU node
            var lru = this.tail.prev;
            this._removeNode(lru);
            delete this.map[lru.key];
            this.size--;
        }
        var newNode = new LRUNode(key, value);
        this._addToFront(newNode);
        this.map[key] = newNode;
        this.size++;
    }
};

// --- Tests ---
var llCache = new LRUCacheLL(3);

llCache.put(1, "one");
llCache.put(2, "two");
llCache.put(3, "three");
console.log(llCache.get(1));  // "one"
llCache.put(4, "four"); // evicts key 2 (LRU)
console.log(llCache.get(2));  // -1 — evicted
console.log(llCache.get(3));  // "three"
console.log(llCache.get(4));  // "four"

// ───────────────────────────────────────────────────────────────
// PRACTICE
// ───────────────────────────────────────────────────────────────

console.log("\n=== Practice ===");

// Q1: What happens to a once() listener if off() is called before it fires?
var testEmitter = new EventEmitter();
function onceFn() { console.log("Q1: fired"); }
testEmitter.once("test", onceFn);
testEmitter.off("test", onceFn); // remove before it fires
testEmitter.emit("test");
// Nothing — off() removed it before it could fire

// Q2: LRU capacity 2 — what's evicted?
var q2Cache = new LRUCache(2);
q2Cache.put("x", 1);
q2Cache.put("y", 2);
q2Cache.get("x");  // access x → y becomes LRU
q2Cache.put("z", 3); // evicts y (LRU)
console.log("Q2 y:", q2Cache.get("y")); // -1 (evicted)
console.log("Q2 x:", q2Cache.get("x")); // 1 (still there)
console.log("Q2 z:", q2Cache.get("z")); // 3 (just added)

// Q3: How does emit handle a listener that removes itself?
var selfRemoveEmitter = new EventEmitter();
var selfFn;
selfFn = function() {
    console.log("Q3: fired once");
    selfRemoveEmitter.off("tick", selfFn);
};
selfRemoveEmitter.on("tick", selfFn);
selfRemoveEmitter.emit("tick"); // "Q3: fired once"
selfRemoveEmitter.emit("tick"); // nothing — removed itself
