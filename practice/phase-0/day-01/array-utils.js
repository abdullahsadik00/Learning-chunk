function sum(array) {
    let total = 0;
    for (const arr of array) {
        total += arr;
    }
    return total;
}

console.assert(sum([1, 2, 3]) === 6, 'sum([1, 2, 3]) should return 6');

function max(array) {
    let maxValue =  array[0];
    for (const arr of array) {
        if (arr > maxValue) {
            maxValue = arr;
        }
    }
    return maxValue;
}

console.assert(max([3,9,2]) === 9, 'max(3,9,2]) should return 9');

const average = (array) => {
    let sumOfArray = sum(array);
    return sumOfArray / array.length; 
}

console.assert(average([1, 2, 3]) === 2, 'average([1, 2, 3]) should return 2');

const reverseString = (string) => {
    let reversedString = '';
    for (let i = string.length - 1;i >= 0; i--) {
        reversedString += string[i];
    }
    return reversedString;
}

console.assert(reverseString('hello') === 'olleh', "reverseString('hello') should return 'olleh'");

function countOccurrences(array, value) {
    let count = 0;
    for(const arr of array) {
        if(arr === value) {
            count++;
        }
    }
    return count;
}

console.assert(countOccurrences([1, 2, 3, 1, 2, 1], 1) === 3, 'countOccurrences([1, 2, 3, 1, 2, 1], 1) should return 3');

const isPalindrome = (string) => {
    let lowerCaseString = string.toLowerCase();
    const reversedString = reverseString(lowerCaseString);
    console.log("reversedString :", reversedString);
    console.log("reversedString === lowerCaseString :", reversedString === lowerCaseString);
    return reversedString === lowerCaseString;
}

console.assert(isPalindrome('Racecar') === true, "isPalindrome('racecar') should return true");

const fizzBuzz = (n) => {
    const result = [];
    for (let i = 1; i <=n;i++){
        if(i %3 === 0 && i % 5 === 0) {
            result.push('FizzBuzz');
        }
        else if(i % 3 === 0) {
            result.push('Fizz');
        }
        else if(i % 5 === 0) {
            result.push('Buzz');
        }
        else {
            result.push(i);
        }
    }
    return result;
}

console.assert(JSON.stringify(fizzBuzz(16)) === JSON.stringify([ 'FizzBuzz', 1, 2, 'Fizz', 4, 'Buzz', 'Fizz', 7, 8, 'Fizz', 'Buzz', 11, 'Fizz', 13, 14, 'FizzBuzz' ]), "fizzBuzz(16) should return [ 'FizzBuzz', 1, 2, 'Fizz', 4, 'Buzz', 'Fizz', 7, 8, 'Fizz', 'Buzz', 11, 'Fizz', 13, 14, 'FizzBuzz' ]");

const range = (n) => {
    const result = [];
    for (let i = 0; i < n; i++) {
        result.push(i);
    }
    return result;
}

console.assert(JSON.stringify(range(5)) === JSON.stringify([0, 1, 2, 3, 4]), "range(5) should return [0, 1, 2, 3, 4]");