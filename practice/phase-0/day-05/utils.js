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

function deepClone(obj) {
    if(typeof obj != "object" || obj == null ){
        return obj
    }
    let resultObj = Array.isArray ? [] : {}
    for(let key in obj ){
        resultObj[key]=deepClone(obj[key])
    }
    return resultObj
}