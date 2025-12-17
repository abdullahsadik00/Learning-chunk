// Phase 1: Synchronous code execution
// console.log("hello");

// for(let i=0;i<100;i++) {
//   console.log("inside for loop");
// }

// console.log("end");
// Phase 2: Using process.nextTick to prioritize a callback
console.log("hello");

for(let i=0;i<100;i++) {
  console.log("inside for loop");
}

process.nextTick(function() {
  console.log("Inside the next tick is the highest prioirty and would be executed first");
});

console.log("end");

// Phase 3: Combining process.nextTick and setTimeout

console.log("hello");

for(let i=0;i<100;i++) {
  console.log("inside for loop");
}

// microtask queue - highest priority
process.nextTick(function() {
  console.log("Inside the next tick is the highest prioirty and would be executed first");
  let current = Date.now();
  while(Date.now() - current < 10000000) {

  }
});

// macrotask queue
// const timeoutScheduled = Date.now();
setTimeout(function() {
  const delay = Date.now() - timeoutScheduled;
  console.log(`Inside the set timeout function with 0 ms delay, and i was executed in ${delay}`);
}, 0);

console.log("end");

// Phase 4: Demonstrating event loop delays
console.log("hello");

for(let i=0;i<100;i++) {
  console.log("inside for loop");
}

// microtask queue - highest priority
process.nextTick(function() {
  console.log("Inside the next tick is the highest prioirty and would be executed first");
  let nows = Date.now();
  while(Date.now() - nows < 1000) {

  }
});

//macrotask queue - timer
const timeoutScheduled = Date.now();
setTimeout(function() {
  const delay = Date.now() - timeoutScheduled;
  console.log(`Inside the set timeout function with 0 ms delay, and i was executed in ${delay}`);
}, 0);

console.log("end");