const { performance } = require('perf_hooks');

function calculateTime(n) {
  let sum = 0;

  const startTime = performance.now();

  for (let i = 1; i <= n; i++) {
    sum += i;
  }

  const endTime = performance.now();

  return endTime - startTime; // Still in milliseconds, but more precise
}
console.log("Time for 1 to 100:", calculateTime(100), "ms");
console.log("Time for 1 to 100000:", calculateTime(100000), "ms");
// Be careful with the line below — it’s heavy:
console.log("Time for 1 to 1000000000:", calculateTime(1000000000), "ms");
