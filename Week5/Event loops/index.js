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
const timeoutScheduled1 = Date.now();
setTimeout(function() {
  const delay = Date.now() - timeoutScheduled1;
  console.log(`Inside the set timeout function with 0 ms delay, and i was executed in ${delay}`);
}, 0);

console.log("end");

// Final Phase: Combining process.nextTick, Promises, and setTimeout
// two microtasks and one macrotask
console.log("hello");
for(let i=0;i<100;i++) {
  console.log("inside for loop");
}
//process.nextTick will have the highest priority
process.nextTick(function() {
  console.log("Inside the next tick is the highest prioirty and would be executed first");
});
//promises have the second highest priority
Promise.resolve().then(() => {
  console.log("Promise is being resolved, lets see where it comes");
})
//this is a macrotask
setImmediate(() => {
  console.log('immediate');
});
//this is a macrotask too
const timeoutScheduled2 = Date.now();
setTimeout(function() {
  const delay = Date.now() - timeoutScheduled2;
  console.log(`Inside the set timeout function with 0 ms delay, and i was executed in ${delay}`);
}, 0);

console.log("end");

// Final Phase with an API call: Combining process.nextTick, Promises, and setTimeout

const {airQualityCallback, airQualityPromise} = require('./airQualityHelper.js');
let url = 'https://air-quality-by-api-ninjas.p.rapidapi.com/v1/airquality?city=Ohia';
// console.log("hello");
for(let i=0;i<100;i++) {
  console.log("inside for loop");
}
process.nextTick(function() {
  console.log("Inside the next tick is the highest prioirty and would be executed first");
  let nows = Date.now();
  while(Date.now() - nows < 10) {
  }
});
Promise.resolve().then(() => {
  console.log("Promise is being resolved, lets see where it comes");
});
airQualityPromise(url).then((data) => {
  console.log(`Promise is being resolved, and data is ${data}`);
}).catch(err => {
  console.log(err);
});
for(let i=0;i<1000;i++) {
Promise.resolve().then((data) => {
  console.log("Promise is being resolved, lets see where it comes");
}).catch(err => {
  console.log(err);
});
}
setImmediate(() => {
  console.log('immediate');
});
const timeoutScheduled = Date.now();
setTimeout(function() {
  const delay = Date.now() - timeoutScheduled;
  console.log(`Inside the set timeout function with 0 ms delay, and i was executed in ${delay}`);
}, 4000);
console.log("end");

// Final Phase with an API call and file read: Combining process.nextTick, Promises, setTimeout, and I/O callbacks

let fs = require('fs');

console.log("hello");

for(let i=0;i<100;i++) {
  console.log("inside for loop");
}

process.nextTick(function() {
  console.log("Inside the next tick is the highest prioirty and would be executed first");
  let nows = Date.now();
  while(Date.now() - nows < 10) {
  }
});

fs.readFile('./input.txt', function(data) {
  for(let i = 0; i<10; i++) {
    process.nextTick(function() {
      console.log("Next tick inside the reading the input file callback");
    });
    console.log(`Data is being read ${data}`);
    setTimeout(function() {
      console.log("Set timeout inside the reading the input file callback");
    }, 10);
  }
});


airQualityCallback(url, (err, data) => {
  console.log(`callback is being called and data is ${data}`);
});

async function getData() {
  let data = await airQualityPromise(url);
  console.log(`Ha we are getting the data via async await ${data}`);
}

Promise.resolve().then(() => {
  console.log("Promise is being resolved, lets see where it comes");
});

airQualityPromise(url).then((data) => {
  console.log(`Promise is being resolved, and data is ${data}`);
}).catch(err => {
  console.log(err);
});


for(let i=0;i<1000;i++) {
  Promise.resolve().then((data) => {
    console.log("Promise is being resolved, lets see where it comes");
  }).catch(err => {
    console.log(err);
  });
}

setImmediate(() => {
  console.log('immediate');
});

const timeoutScheduled3 = Date.now();
setTimeout(function() {
  const delay = Date.now() - timeoutScheduled3;
  console.log(`Inside the set timeout function with 0 ms delay, and i was executed in ${delay}`);
}, 0);

getData();
console.log("end");

// Phase 9: Demonstrating order of execution with file read, setTimeout, and setImmediate
const fs = require('fs');

console.log("hello");

fs.readFile('./input.txt', function () {
  setTimeout(() => {
    console.log("Inside the set timeout function");
  }, 0);

  setImmediate(() => {
    console.log("Inside the set immediate function");
  });
});

setTimeout(function() {
  console.log('set timeout outside')
},100);


console.log("end");