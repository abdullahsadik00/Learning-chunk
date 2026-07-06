export function sumTyped(array: number[]): number {
    let total = 0;
    for (const arr of array) {
        total += arr;
    }
    return total;
}

export const averageTyped = (array: number[]): number => {
    let sumOfArray = sumTyped(array);
    return sumOfArray / array.length;
}

export const reverseStringTyped = (string: string): string => {
    let reversedString = '';
    for (let i = string.length - 1; i >= 0; i--) {
        reversedString += string[i];
    }
    return reversedString;
}

export function countOccurrencesTyped(array: number[], value: number): number {
    let count = 0;
    for (const arr of array) {
        if (arr === value) {
            count++;
        }
    }
    return count;
}

export const isPalindromeTyped = (string: string): boolean => {
    let lowerCaseString = string.toLowerCase();
    const reversedString = reverseStringTyped(lowerCaseString);
    return reversedString === lowerCaseString;
}

export const fizzBuzzTyped = (n: number): (number | string)[] => {
    const result: (number | string)[] = [];
    for (let i = 1; i <= n; i++) {
        if (i % 3 === 0 && i % 5 === 0) {
            result.push('FizzBuzz');
        }
        else if (i % 3 === 0) {
            result.push('Fizz');
        }
        else if (i % 5 === 0) {
            result.push('Buzz');
        }
        else {
            result.push(i);
        }
    }
    return result;
}

export const rangeTyped = (n: number): number[] => {
    const result: number[] = [];
    for (let i: number = 0; i < n; i++) {
        result.push(i);
    }
    return result;
}

// --- User ---
export type User = { id: number; name: string; email?: string };

export const formatUser = (u: User): string => {
    return u.email
        ? `${u.name} (#${u.id}) <${u.email}>`
        : `${u.name} (#${u.id})`;
};

// --- Discriminated union ---
export type Shape =
    { kind: "circle"; r: number }
    | { kind: "square"; side: number };

export const area = (s: Shape): number => {
    switch (s.kind) {
        case "circle":
            return Math.PI * s.r ** 2;
        case "square":
            return s.side ** 2;
    }
};

// --- max: undefined-safe (replaces the old maxTyped that lied about its return type) ---
export const max = (nums: number[]): number | undefined => {
    if (nums.length === 0) return undefined;
    let maxValue = nums[0];
    for (const n of nums) {
        if (n > maxValue) {
            maxValue = n;
        }
    }
    return maxValue;
};

// --- self-checks (console.assert fires only on failure) ---
console.assert(sumTyped([1, 2, 3]) === 6, "sumTyped([1,2,3]) → 6");
console.assert(sumTyped([]) === 0, "sumTyped([]) → 0");

console.assert(max([]) === undefined, "max([]) → undefined");
console.assert(max([3, 9, 2]) === 9, "max([3,9,2]) → 9");
console.assert(max([-5, -1, -8]) === -1, "max(negatives) → -1");

console.assert(averageTyped([2, 4, 6]) === 4, "averageTyped([2,4,6]) → 4");

console.assert(reverseStringTyped("abc") === "cba", "reverseStringTyped('abc') → 'cba'");
console.assert(reverseStringTyped("") === "", "reverseStringTyped('') → ''");

console.assert(countOccurrencesTyped([1, 2, 2, 3, 2], 2) === 3, "countOccurrences(2) → 3");
console.assert(countOccurrencesTyped([1, 2, 3], 9) === 0, "countOccurrences(absent) → 0");

console.assert(isPalindromeTyped("Racecar") === true, "isPalindrome('Racecar') → true");
console.assert(isPalindromeTyped("hello") === false, "isPalindrome('hello') → false");

console.assert(
    JSON.stringify(fizzBuzzTyped(5)) === JSON.stringify([1, 2, "Fizz", 4, "Buzz"]),
    "fizzBuzz(5) → [1,2,Fizz,4,Buzz]"
);
console.assert(fizzBuzzTyped(15)[14] === "FizzBuzz", "fizzBuzz → 15th is FizzBuzz");

console.assert(
    JSON.stringify(rangeTyped(4)) === JSON.stringify([0, 1, 2, 3]),
    "range(4) → [0,1,2,3]"
);
console.assert(JSON.stringify(rangeTyped(0)) === JSON.stringify([]), "range(0) → []");

console.assert(area({ kind: "circle", r: 1 }) === Math.PI, "area circle r=1 → PI");
console.assert(area({ kind: "square", side: 3 }) === 9, "area square side=3 → 9");

console.assert(formatUser({ id: 1, name: "Sam" }) === "Sam (#1)", "formatUser no email");
console.assert(
    formatUser({ id: 2, name: "Sam", email: "s@x.io" }) === "Sam (#2) <s@x.io>",
    "formatUser with email"
);

console.log("All assertions passed ✅");