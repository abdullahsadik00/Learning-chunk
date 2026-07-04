const myMap = (arr, callback) => {
    const resultArr = []
    for (let i = 0; i < arr.length; i++) {
        resultArr[i] = callback(arr[i], i, arr)
    }
    return resultArr
}

console.assert(JSON.stringify(myMap([1,2,3],(num) => num * 2)) === JSON.stringify([2,4,6]), 'myMap failed')
console.log(myMap([1,2,3],(num) => num * 2))

const myForEach = (arr,cb) =>{
 for(const a of arr){
    cb(a)
 }   
}
console.assert(JSON.stringify(myForEach([1,2,3],(num) => num * 2)) === JSON.stringify(undefined), 'myForEach failed')

const myFilter = (arr, cb) => {
    const resultArr = [];
    for (let i = 0; i < arr.length; i++) {
        if(cb(arr[i],i,arr)){
            resultArr.push(arr[i])
        }
    }
    return resultArr;
}

const myFind = (arr, cb) => {
    for (let i = 0; i < arr.length; i++) {
        if(cb(arr[i],i,arr)){
            return arr[i]
        }
    }
    return undefined;
}

console.assert(JSON.stringify(myFind([1,2,3],(num) => num > 2)) === JSON.stringify(3), 'myFind failed')

const mySome = (arr, cb) => {
    for (let i = 0; i < arr.length; i++) {
        if(cb(arr[i],i,arr)){
            return true
        }
    }
    return false;
}

console.assert(JSON.stringify(mySome([1,2,3],(num) => num > 2)) === JSON.stringify(true), 'mySome failed')

const myEvery = (arr, cb) => {
    for (let i = 0; i < arr.length; i++) {
        if(!cb(arr[i],i,arr)){
            return false
        }
    }
    return true;
}

console.assert(JSON.stringify(myEvery([1,2,3],(num) => num > 0)) === JSON.stringify(true), 'myEvery failed')

const myFlat = (arr, depth = 1) => {
    const resultArr = [];
    for(let i = 0; i<arr.length; i++){
        if(Array.isArray(arr[i] && depth > 0)){
            resultArr.push(...myFlat(arr[i],depth - 1))
        }
        else{
            resultArr.push(arr[i])
        }
    }
    return resultArr;
}

console.assert(JSON.stringify(myFlat([1,2,[3,4,[5,6]]], 2)) === JSON.stringify([1,2,3,4,5,6]), 'myFlat failed')

const myReduce = (arr, cb, initialValue) => {
    let accumulator = initialValue === undefined ? arr[0] : initialValue;
    let startIndex = initialValue === undefined ? 1 : 0;
    for (let i = startIndex; i < arr.length; i++) {
        accumulator = cb(accumulator, arr[i], i, arr);
    }
    return accumulator;
}

console.assert(JSON.stringify(myReduce([1,2,3],(acc,num) => acc + num, 0)) === JSON.stringify(6), 'myReduce failed')