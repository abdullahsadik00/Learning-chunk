/*
  Implement a function `countVowels` that takes a string as an argument and returns the number of vowels in the string.
  Note: Consider both uppercase and lowercase vowels ('a', 'e', 'i', 'o', 'u').

  Once you've implemented the logic, test your code by running
*/

function countVowels(str) {
    // Your code here
    let vowels = ['a', 'e', 'i', 'o', 'u']
    let strArray = str.toLowerCase().split('')
    let count = 0
    for(let i = 0; i < strArray.length; i++){
      
      if (vowels.includes(strArray[i])){
        // that vowel needs to be added +1
        count++
      }
    }
    return count
}

module.exports = countVowels;