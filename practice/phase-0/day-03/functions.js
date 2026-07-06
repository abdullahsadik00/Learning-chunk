function whoAmI(greeting) {
    return greeting + " " + this.name;
}
// myCall(whoAmI, { name: "Sam" }, "Hi") === "Hi Sam"

whoAmI.call({ name: "Sadik" }, "Salam")

function myCall(func, obj, ...args) {
    const key = Symbol("func");
    obj[key] = func;
    const res = obj[key](...args);
    delete obj[key];
    return res;
}

myCall(whoAmI, { name: "Sam" }, "Hi")
console.assert(myCall(whoAmI, { name: "Sam" }, "Hi") === "Hi Sam", "myCall failed");


function myApply(func, context, args) {
    if (context == null) {
        context = {}
    }
    else if (typeof context !== "object") {
        context = new String(context)
    }
    context.func = func;
    let res = context.func(...args);
    delete context.func
    return res
}

function max(...args) {
    
    return Math.max(...args);
}
let x1 = myApply(max, null, [1, 3, 5, 7, 9])
console.log(x1)
console.assert(myApply(max, null, [1, 3, 5, 7, 9]) === 9, "myApply failed");


function myBind(func, context, ...args) {
    return function (...args2) {
        return func.apply(context, [...args, ...args2])
    }
}

let boundFunction = myBind(whoAmI, { name: "Sam" });
boundFunction("Hi");

console.assert(boundFunction("Hi") === "Hi Sam", "myBind failed");

function makeCounter() {
    let count = 0;

    return function () {
        count++;
        return count;
    };
}

const c = makeCounter();

console.assert(c() === 1, "First call should return 1");
console.assert(c() === 2, "Second call should return 2");

const d = makeCounter();

console.assert(d() === 1, "Second counter should start at 1");
console.assert(c() === 3, "First counter should continue independently");
function greet() {
    console.log("called")
    return "hello"
}

function once(fn) {
    console.log("inside once")
    let isCalled = false
    let res
    return function () {
        if (!isCalled) {
            res = fn()
            isCalled = true
        }
        return res
    }
}

let on = once(greet)
console.log(on())
console.log(on())
console.log(on())
console.log(on())
console.log(on())
console.log(on())

// once spec: fn runs a single time; every call returns that first result
let runs = 0;
const onceCounter = once(() => { runs++; return runs; });
console.assert(onceCounter() === 1, "once should return the first result");
console.assert(onceCounter() === 1, "once should keep returning the first result");
console.assert(runs === 1, "once should call the wrapped fn exactly once");

function memoize(fun) {
    let cache = {}
    return function (...arg) {
        let key = JSON.stringify(arg)
        if (key in cache) {
            console.log("found in cache")
            return cache[key]
        } else {
            cache[key] = fun(...arg)
            console.log("did not found in cache")
            return cache[key]
        }
    }
}

function add(a, b) {

    return a + b;
}

let memoziedAdd = memoize(add)

console.log(memoziedAdd(1, 5))
console.log(memoziedAdd(1, 5))
console.log(memoziedAdd(1, 5))
console.assert(memoziedAdd(1, 5) === 6, "memoize failed");
function curry(fn) {
    return function curried(...args) {
        if (args.length >= fn.length) {
            return fn(...args);
        }

        return (...nextArgs) => curried(...args, ...nextArgs);
    };
}

function sum(a, b, c) {
    return a + b + c;
}

const curriedSum = curry(sum);

console.assert(curriedSum(1)(2)(3) === 6, "(1)(2)(3) failed");
console.assert(curriedSum(1, 2)(3) === 6, "(1,2)(3) failed");
console.assert(curriedSum(1)(2, 3) === 6, "(1)(2,3) failed");
console.assert(curriedSum(1, 2, 3) === 6, "(1,2,3) failed");

console.log(curriedSum(1)(2)(3));