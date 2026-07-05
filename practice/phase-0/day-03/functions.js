function whoAmI(greeting) {
    return greeting + " " + this.name;
}
// myCall(whoAmI, { name: "Sam" }, "Hi") === "Hi Sam"

whoAmI.call({ name: "Sadik" }, "Salam")

function myCall(func, obj, ...args) {
    obj.func = func;
    return obj.func(...args);
}

myCall(whoAmI, { name: "Sam" }, "Hi")


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
let x = myApply(max, null, [1, 3, 5, 7, 9])
console.log(x)


function myBind(func, context, ...args) {
    return function (...args2) {
        return func.apply(context, [...args, ...args2])
    }
}

let boundFunction = myBind(whoAmI, { name: "Sam" });
boundFunction("Hi");

const myCounter = () => {
    let count = 0;
    return {
        increment: () => {
            count++;
            return this;
        },
        decrement: () => {
            count--;
            return this;
        },
        getCount: () => {
            return count;
        }
    }
}

let counter = myCounter();
counter.increment().increment().decrement();
console.log(counter.getCount()); // Output: 1

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

function curry(a){
    return function (b){
        return function (c){
            return a + b + c
        }
    }
}

let x = curry(1)(4)(3);
console.log(x)
console.log(curry(1,3)(1))