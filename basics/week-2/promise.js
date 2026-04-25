function logName(){
    console.log("Sadik")
}

setTimeout(logName,3000)
function setTimeoutPromisified(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  function callback() {
      console.log("2 seconds have passed");
  }
  
  setTimeoutPromisified(2000).then(callback)

  function first() {
    console.log("First");
  }
  function second() {
    first();
    console.log("Second");
  }
  second();
  