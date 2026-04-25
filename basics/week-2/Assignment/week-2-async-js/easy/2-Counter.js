// setInterval(() => {
//     counter++
//     console.log("counter",counter)
// }, 1000);
let count = 1
function counter() {
    count++
    console.log("Counter:", count)
    setTimeout(counter, 1000);
}

counter()