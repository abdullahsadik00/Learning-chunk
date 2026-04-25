/******************************************************************
 * Phase 1: Synchronous code execution
 ******************************************************************/
// console.log("hello");
// for(let i=0;i<100;i++) {
//   console.log("inside for loop");
// }
// console.log("end");


/******************************************************************
 * Phase 2: process.nextTick
 ******************************************************************/

console.log("hello");

for (let i = 0; i < 3; i++) {
  console.log("inside for loop");
}

process.nextTick(() => {
  console.log("Inside the next tick is the highest priority and runs first");
});

console.log("end");

/*
LOGS AFTER "end":
Inside the next tick is the highest priority and runs first
*/


/******************************************************************
 * Phase 3: process.nextTick + setTimeout
 ******************************************************************/

console.log("hello");

for (let i = 0; i < 3; i++) {
  console.log("inside for loop");
}

process.nextTick(() => {
  console.log("Inside the next tick is the highest priority and runs first");
  const start = Date.now();
  while (Date.now() - start < 1000) {}
});

const timeoutScheduled = Date.now();
setTimeout(() => {
  console.log(
    `Inside setTimeout(0) – delayed by ${Date.now() - timeoutScheduled} ms`
  );
}, 0);

console.log("end");

/*
LOGS AFTER "end":
Inside the next tick is the highest priority and runs first
Inside setTimeout(0) – delayed by blocking
*/


/******************************************************************
 * Phase 4: Event loop delay demo
 ******************************************************************/

console.log("hello");

for (let i = 0; i < 3; i++) {
  console.log("inside for loop");
}

process.nextTick(() => {
  console.log("Inside the next tick is the highest priority and runs first");
  const start = Date.now();
  while (Date.now() - start < 500) {}
});

const timeoutScheduled1 = Date.now();
setTimeout(() => {
  console.log(
    `Inside setTimeout(0) – executed after ${Date.now() - timeoutScheduled1} ms`
  );
}, 0);

console.log("end");

/*
LOGS AFTER "end":
Inside the next tick is the highest priority and runs first
Inside setTimeout(0) – delayed by blocking
*/


/******************************************************************
 * Phase 5: nextTick + Promise + timers
 ******************************************************************/

console.log("hello");

for (let i = 0; i < 3; i++) {
  console.log("inside for loop");
}

process.nextTick(() => {
  console.log("Inside the next tick is the highest priority");
});

Promise.resolve().then(() => {
  console.log("Promise resolved");
});

setImmediate(() => {
  console.log("setImmediate executed");
});

setTimeout(() => {
  console.log("setTimeout(0) executed");
}, 0);

console.log("end");

/*
LOGS AFTER "end":
Inside the next tick is the highest priority
Promise resolved
(setImmediate and setTimeout order may vary at top-level)
setImmediate executed
setTimeout(0) executed
*/


/******************************************************************
 * Phase 6: API call (Promise based)
 ******************************************************************/

function fakeApiPromise() {
  return new Promise((resolve) =>
    setTimeout(() => resolve("API_DATA"), 100)
  );
}

console.log("hello");

process.nextTick(() => {
  console.log("Inside the next tick");
});

Promise.resolve().then(() => {
  console.log("Microtask promise resolved");
});

fakeApiPromise().then((data) => {
  console.log(`API promise resolved with ${data}`);
});

setImmediate(() => {
  console.log("setImmediate executed");
});

setTimeout(() => {
  console.log("setTimeout(0) executed");
}, 0);

console.log("end");

/*
LOGS AFTER "end":
Inside the next tick
Microtask promise resolved
(setImmediate and setTimeout may vary)
setImmediate executed
setTimeout(0) executed
API promise resolved with API_DATA
*/


/******************************************************************
 * Phase 7: File I/O + nextTick + timers
 ******************************************************************/

const fs = require("fs");

console.log("hello");

process.nextTick(() => {
  console.log("Inside the next tick");
});

fs.readFile(__filename, () => {
  console.log("File read callback");

  process.nextTick(() => {
    console.log("nextTick inside I/O callback");
  });

  setImmediate(() => {
    console.log("setImmediate inside I/O callback");
  });

  setTimeout(() => {
    console.log("setTimeout(0) inside I/O callback");
  }, 0);
});

setImmediate(() => {
  console.log("setImmediate outside");
});

setTimeout(() => {
  console.log("setTimeout(0) outside");
}, 0);

console.log("end");

/*
LOGS AFTER "end":
Inside the next tick
setImmediate outside
setTimeout(0) outside
File read callback
nextTick inside I/O callback
setImmediate inside I/O callback
setTimeout(0) inside I/O callback
*/


/******************************************************************
 * Phase 8: setImmediate vs setTimeout inside I/O
 ******************************************************************/

console.log("hello");

fs.readFile(__filename, () => {
  setTimeout(() => {
    console.log("setTimeout inside I/O");
  }, 0);

  setImmediate(() => {
    console.log("setImmediate inside I/O");
  });
});

setTimeout(() => {
  console.log("setTimeout outside");
}, 100);

console.log("end");

/*
LOGS AFTER "end":
setImmediate inside I/O
setTimeout inside I/O
setTimeout outside
*/


/******************************************************************
 * Phase 9: Complex example with Promises and timers
 ******************************************************************/

console.log('stack [1]');

setTimeout(() => console.log('macro [2]'), 0);
setTimeout(() => console.log('macro [3]'), 0);

const p = Promise.resolve();

for (let i = 0; i < 3; i++) {
  p.then(() => {

    setTimeout(() => {
      console.log('macro [4]');

      setTimeout(() => console.log('macro [5]'), 0);

      p.then(() => console.log('micro [6]'));
    }, 0);

    console.log('micro [7]');
  });
}

console.log('stack [8]');

/*
LOGS AFTER "stack [8]":

micro [7]
micro [7]
micro [7]
macro [2]
macro [3]
macro [4]
micro [6]
macro [4]
micro [6]
macro [4]
micro [6]
macro [5]
macro [5]
macro [5]
*/


/******************************************************************
 * Final Phase: Comprehensive example with all concepts
 ******************************************************************/

console.log('start');

process.nextTick(() => {
  console.log('First next tick callback executed');
});

Promise.resolve('resolved').then((result) => {
  console.log(`First promise was ${result}`);
});

fs.readFile("./input.txt", (error) => {

  setTimeout(() => {
    console.log('Timeout callback executed');
  });

  setImmediate(() => {
    console.log('Immediate callback executed');
  });

  if (!error) {
    console.log('File read!');
  }

  Promise.resolve('resolved').then((result) => {
    console.log(`Second promise was ${result}`);
  });

  process.nextTick(() => {
    console.log('Second next tick callback executed');
  });
});

Promise.resolve('resolved').then((result) => {
  console.log(`Third promise was ${result}`);
});

process.nextTick(() => {
  console.log('Third next tick callback executed');
});

setTimeout(() => {
  console.log('Timeout callback executed outside');
});

setImmediate(() => {
  console.log('Immediate callback executed outside');
});

console.log('end');

/*
LOGS AFTER "end":

First next tick callback executed
Third next tick callback executed

First promise was resolved
Third promise was resolved

Immediate callback executed outside
Timeout callback executed outside

(File read completes)
File read!
Second next tick callback executed
Second promise was resolved
Immediate callback executed
Timeout callback executed
*/