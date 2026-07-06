console.log("Hello before");
function debounce (fn,delay){
    let timer;
    return function(){
        clearTimeout(timer);
        
        timer = setTimeout(()=>fn(),delay)
    }
}

function sayHello() {
    console.log("Hello");
}
const debouncedHello = debounce(sayHello, 1000);
debouncedHello()
debouncedHello()
debouncedHello()

function throttle(fn, delay) {
    let lastExecutionTime = 0;

    return function () {
        let currentTime = Date.now();

        if (currentTime - lastExecutionTime >= delay) {
            fn();
            lastExecutionTime = currentTime;
        }
    };
}

class EventEmitter {
    constructor(){
        this.events = {}
    }
    on(eventName, callback){
        if(this.events[eventName]){
            this.events[eventName].push(callback)
        }else{
            this.events[eventName] = [callback]
        }
    }
    off(eventName, callback){
        if(this.events[eventName]){
            this.events[eventName] = this.events[eventName].filter(cb => cb !== callback)
        }
    }
    emit(eventName, ...args){
        if(this.events[eventName]){
            this.events[eventName].forEach(cb => cb(...args))
        }
    }
}

// EventEmitter spec
const emitter = new EventEmitter();
let calls = 0;
function listener(x) { calls += x; }

// on + emit → listener fires with the emitted args
emitter.on("tick", listener);
emitter.emit("tick", 1);
console.assert(calls === 1, "on/emit failed: listener did not fire");

// off with the SAME reference removes it
emitter.off("tick", listener);
emitter.emit("tick", 1);
console.assert(calls === 1, "off failed: listener still firing after removal");

// off-by-reference: an inline fn is a DIFFERENT object, so it removes nothing
emitter.on("tick", listener);
emitter.off("tick", (x) => { calls += x; });
emitter.emit("tick", 1);
console.assert(calls === 2, "off-by-reference: inline fn should NOT remove listener");